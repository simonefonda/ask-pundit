define([
    "dojo/_base/declare", 
    "dojo/_base/lang",
    "dojo/router",
    "dojo/on",
    "dojo/request",
    "dojo/_base/config",
    "dojo/query",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/dom-style",

    "dojo/text!ask/tmpl/IndexTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",

    "pundit/Namespace",

    "lib/mustache",
    "bootstrap/Tab",
    "bootstrap/Typeahead"
],
    function(
        declare, lang, router, on, request, config, query, domAttr, domClass, domStyle,
        indexTemplate, _WidgetBase, _TemplatedMixin,
        PNamespace, mustache, BTab, BTypeahead
    ) {

    return declare("ask.Ask", [_WidgetBase, _TemplatedMixin], {
        
        name: '',
        bio: '',
        templateString: indexTemplate,
        socketHelper: '',
        liveSearchTimer: '',
        liveSearchTimerLength: 500,
        notebookLoaded: false,
        bookmarkLoaded: false,
        myAskLoaded: false,
        statsTabLoaded: false,
        _cache: {
            notebooks: [],
            authors: [],
            pageContexts: []
        },
        shortURLLength: 20,
        opts: {
            sortBy: 'data-nb-author', 
            sortDir: 'asc'
        },
        
        // _skipNodeCache forces dojo to call _stringRepl, thus using mustache
        _skipNodeCache: true,
        _stringRepl: function(tmpl) {
            return mustache.render(tmpl, this);
        },
        postMixInProperties: function() {},
        constructor: function() {
            var self = this;
            self.inherited(arguments);
            self.ns = new PNamespace();
            
            self.nbStats = {
                nbks: 0,
                auth: 0,
                anns: 0,
                authors: {},
                authorList: []
            };
            
        },
        
        startup: function() {
            var self = this;
            
            require(["pundit/AuthenticatedRequester"], function(PAuthenticatedRequester) {
                self.requester = new PAuthenticatedRequester({
                    debug: false
                }).placeAt(query('#ask_container')[0]);
                self.requester.startup();
                self.setupHandlers();
                self.setupRouter();
            });
            self.loadStatsTab();
        },

        setupHandlers: function() {
            var self = this;
            
            // Clicking tabs will update the route.. 
            query('#ask-pills').on('a[data-toggle="tab"]:click', function (e) {
                var id,
                    target = e.target;
                    
                if (e.target.nodeName === "DIV")
                    target = query(e.target).parents('a[data-toggle="tab"]')[0];
                
                id = domAttr.get(target, 'href');
                
                if (id === "#tab-notebooks") {
                    router.go('/notebooks/');
                } else if (id === "#tab-myAsk") {
                    router.go('/myAsk/');
                } else if (id === "#tab-stats") {
                    router.go('/stats/');
                } else if (id.match(/\/timeline\//) !== null) {
                    router.go(id);
                } else if (id.match(/\/myNotebooks\//) !== null) {
                    router.go(id);
                } else 
                    router.go('/notebooks/'+ id.substr(-8, 8));
                    
                return false;
            });
            
            // Handle search input 
            on(query('#tabNotebooksSearchInput')[0], 'keyup,change', function(e) {

                if (e.keyCode === 13) {
                    self.filterNotebooks()
                    e.preventDefault();
                    e.stopPropagation();
                } else {
                    clearTimeout(self.liveSearchTimer);
                    self.liveSearchTimer = setTimeout(function() {
                        self.filterNotebooks();
                    }, self.liveSearchTimerLength);
                }
                return false;
            });
            
            query('#tabNotebooksSearchInput').typeahead({
                source: function() { return self.getAuthors(); },
                highlighter: function(a) {
                    var foo = '<div class="typeahead">'+a+'';
                    foo += '<span style="margin-left:10px" class="badge pull-right badge-info">'+self.nbStats.authors[a].nbks+' nb</span>';
                    foo += '</div>'
                    return foo;
                    
                    var html = '';
                    html = '<div class="typeahead">';
                    html += '<a class="pull-left" href="#">'+a+'</a>'
                    html += '<span class="badge badge-success">'+self.nbStats.authors[a].nbks+' nb</span>';
                    html += '<span class="badge badge-info">'+self.nbStats.authors[a].anns+' ann</span>';
                    html += '</div>';
                    return html;
                }
            });
            
            // Reset search
            on(query('#tabNotebooksResetButton')[0], 'click', function() {
                query('#tabNotebooksSearchInput').val('');
                query('div.nb-item').style('display', 'block');
                return false;
            });
            
            query('.notebooks-sort-author', self.domNode).on('click', function() {
                self.opts.sortBy = 'author';
                self.opts.sortDir = 'asc';
                self.sortNotebooks();
            });
            query('.notebooks-sort-date', self.domNode).on('click', function() {
                self.opts.sortBy = 'date';
                self.opts.sortDir = 'asc';
                self.sortNotebooks();
            });
            query('.notebooks-sort-title', self.domNode).on('click', function() {
                self.opts.sortBy = 'title';
                self.opts.sortDir = 'asc';
                self.sortNotebooks();
            });
            
        },
        
        sortNotebooks: function() {
            var self = this;

            query('#notebooksContainer .nb-item').sort(function(a, b){
                var v1 = domAttr.get(a, 'data-nb-'+ self.opts.sortBy), 
                    v2 = domAttr.get(b, 'data-nb-'+ self.opts.sortBy),
                    asc = self.opts.sortDir;
                if (v1 == v2) return 0;
                if (v1 > v2) return (asc ? 1 : -1);
                if (v1 < v2) return (asc ? -1 : 1);
            }).forEach(function(e, i) {
                e.parentNode.appendChild(e);
            });

            query('.notebooks-sort button').removeClass('btn-warning');
            query('.notebooks-sort button.notebooks-sort-'+self.opts.sortBy).addClass('btn-warning');
            
        },
        
        filterNotebooks: function() {
            var s = query('#tabNotebooksSearchInput')[0].value.toLowerCase();
            query('div.nb-item').style('display', 'none');
            query('div.nb-item:contains("'+s+'")').style('display', 'block');
        },
        
        setupRouter: function() {
            var self = this;
            
            router.register('/notebooks/', function(evt) {
                if (!self.notebookLoaded) {
                    self.loadNotebookList();
                }
                query("[href='#tab-notebooks']").tab('show');
            });

            router.register('/myAsk/', function(evt) {
                if (!self.myAskLoaded) 
                    self.loadMyAsk();
                query("[href='#tab-myAsk']").tab('show');
            });

            router.register('/stats/', function(evt) {
                if (!self.statsTabLoaded) 
                    self.loadStatsTab();
                query('.superHiddenTab').removeClass('superHiddenTab');
                query("[href='#tab-stats']").tab('show');
                if (self.statsTabLoaded)
                    self.statsTab.positionFacets(); 
            });

            router.register('/notebooks/:id', function(evt) {
                self.openNotebook(evt.params.id);
            });

            router.register('/myNotebooks/:id', function(evt) {
                self.openNotebook(evt.params.id, true);
            });

            router.register('/timeline/:id/:endDate', function(evt) {
                self.openTimeline(evt.params.id, evt.params.endDate);
            });

            router.register('/timeline/:id', function(evt) {
                self.openTimeline(evt.params.id);
            });
    
            router.startup();
            
            // Coming in with an empty hash, redirect to /notebooks/
            if (document.location.hash === '')
                router.go("/notebooks/");
                
        },
        
        routeTo: function(v) {
            router.go(v);
        },

        loadMyAsk: function() {
            var self = this;
            require(["ask/MyAsk"], function(MyAsk) {
                self.myAsk = new MyAsk().placeAt(query('#myAskContainer')[0]);
                self.myAsk.startup();
                self.myAskLoaded = true;
            });
        },

        loadStatsTab: function() {
            var self = this;
            require(["ask/stats/StatsTab"], function(StatsTab) {
                if (!self.statsTabLoaded) {
                    self.statsTab = new StatsTab().placeAt(query('#statsTabContainer')[0]);
                    self.statsTab.startup();
                    self.statsTabLoaded = true;
                }
            });
        },

        // TODO: move this to an object handling himself?
        loadNotebookList: function() {
            var self = this,
                placeAt = query('#notebooksContainer')[0];

            request.get(ASK.ns.asPublicNotebooks, {
                handleAs: "json",
                headers: { "Accept": "application/json" }
            }).then(
                function(data) {
                    query('#notebooksContainer').empty();
                    self.notebookLoaded = true;
                    
                    require(["ask/NotebookItem"], function(NotebookItem) {
                        var delay = 0;
                        
                        self.nbProgressCounter = 0;
                        self.nbProgressLoading = 0;
                        self.nbProgressTotal = data.NotebookIDs.length || 0;
                        
                        query('#pill-notebooks').innerHTML("<div class='progress progress-striped active'><div class='bar' style='width: 1%;'> Notebooks </div></div>");
                        
                        for (var i in data.NotebookIDs) {
                            // TODO: make this configurable?
                            // TODO: make this smarter? Like send out a batch of requests,
                            // wait for them, send out another batch??? Not one by one .. :P
                            delay += 30;
                            var id = data.NotebookIDs[i];
                            
                            setTimeout(function(_id) {
                                return function() {
                                    var nb = new NotebookItem({notebookId: _id});
                                    nb.placeAt(placeAt);
                                    nb.startup();
                                    self.nbStats.nbks++;
                                }
                            }(id), delay);
                        }
                        
                        // self.updateNBProgress();
                    });
                }, 
                function(error) {
                    self.placeErrorAt("Cant download the notebook list", "Could not connect to the server, try again later please!", placeAt);
                }
            );
            
        },
        
        updateNBProgress: function() {
            var self = this,
                perc = parseInt(self.nbProgressCounter*100/self.nbProgressTotal, 10) || 0;
            
            query('#tab-notebooks .ask-stats .nbks em').innerHTML(self.nbStats.nbks);
            query('#tab-notebooks .ask-stats .auth em').innerHTML(self.nbStats.auth);
            query('#tab-notebooks .ask-stats .anns em').innerHTML(self.nbStats.anns);
            
            query('#tab-notebooks .author-list ul').empty();
            self.nbStats.authorList = [];
            for (var a in self.nbStats.authors) {
                var curr = self.nbStats.authors[a], 
                    cont = '';
                self.nbStats.authorList.push(a);
            }
            
            domStyle.set(query('.progress .bar', 'pill-notebooks')[0], 'width', perc+"%");

            if (self.nbProgressTotal > 0 && self.nbProgressCounter === self.nbProgressTotal) {
                setTimeout(function() {
                    dojo.query('#pill-notebooks').innerHTML("<i class='icon-th'></i> Notebooks");
                }, 1000);
            }
            
        },

        getAuthors: function() {
            return this.nbStats.authorList;
        },
                
        openNotebook: function(id, mine) {
            var self = this,
                mine = mine || false;
            
            // if the tab doesnt exist, create it
            if (query("#notebook-tab-"+ id).length === 0) {
                ASK._cache['nb-'+id] = {};

                require(["ask/NotebookTab"], function(NotebookTab) {
                    var nbTab = new NotebookTab({
                        notebookId: id,
                        id: 'notebook-tab-'+ id,
                        isOwner: mine,
                        canEdit: mine
                    });
                    ASK._cache['nb-'+id]['NBTab'] = nbTab;
                    nbTab.placeAt(query('#ask-tab-content')[0]);
                    nbTab.startup();
                    query("#tab-"+id).tab('show');
                });
            } else {
                query("#tab-"+id).tab('show');
            }
            
        },
        
        openTimeline: function(id, endDate) {
            var self = this;
            
            if (typeof(endDate) === "undefined") {
                console.log('No end date: using today');
                endDate = new Date();
            } else {
                console.log('Having an end date: parsing and using it', endDate);
                var y = parseInt(endDate.substr(0, 4), 10),
                    m = parseInt(endDate.substr(4, 2), 10),
                    d = parseInt(endDate.substr(6, 2), 10);
                    
                endDate = new Date(y, m-1, d);
                console.log('Parsed end date: ', endDate, y, m, d);
            }
            
            console.log('Opening timeline ', id);
            
            // if the tab doesnt exist, create it
            if (query("#timeline-tab-"+ id).length === 0) {

                require(["ask/TimelineTab"], function(TimelineTab) {
                    var nbTab = new TimelineTab({
                        notebookId: id,
                        id: 'timeline-tab-'+ id,
                        endDate: endDate
                    });
                    nbTab.placeAt(query('ask-tab-content')[0]);
                    nbTab.startup();
                    query("#tab-time-"+id).tab('show');
                });

            } else {
                query("#tab-time-"+id).tab('show');
            }
            
        },
        
        // TODO: move this somewhere
        // based on http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
        // replaces urls with links in freetexts
        linkify: function(text) {
                // patterns for: "http://", "www." and emails
                var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;\[\]]*[a-z0-9-+&@#\/%\[\]=~_|]/gim,
                    pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim,
                    emailAddressPattern = /(([a-zA-Z0-9_\-\.]+)@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6}))+/gim;
                return text
                    .replace(urlPattern, '<a target="_blank" href=$&>$&</a>')
                    .replace(pseudoUrlPattern, '$1<a target="_blank" href="http://$2">$2</a>')
                    .replace(emailAddressPattern, '<a target="_blank" href="mailto:$1">$1</a>');
        },
        
        shortenURL: function(url) {
            var self = this,
                start = 0;
                
            if (url.match(/^http:\/\/www\./))
                start = 11; 
            else if (url.match(/^http:\/\//))
                start = 7;
            return url.substr(start, start + self.shortURLLength) + " ..";
        },
        
        placeErrorAt: function(title, text, placeAt) {
            var self = this;
            require(["ask/ErrorMessage"], function() {
                var e = new ask.ErrorMessage({
                    title: title, 
                    text: text
                }).placeAt(placeAt);
            });
        }
                
	});

});