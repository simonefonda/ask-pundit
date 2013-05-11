define(["dojo/_base/declare", 
        "dojo/_base/lang",
        "dojo/router", 
        "dojo/on", 
        "dojo/request",
        "dojo/_base/config", 
        "dojox/encoding/easy64",
        "dojo/text!ask/tmpl/IndexTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin",
        "ask/NotebookItem",
        "ask/NotebookTab",
        "ask/TimelineTab",
        "ask/BookmarkCollectionTab",
        "ask/BookmarkList",
        "ask/IOHelper",

        "ask/MyAsk",
        "pundit/AuthenticatedRequester",
        "pundit/Namespace",
        
        "bootstrap/Tab",
        "dijit/layout/TabContainer", 
        "dijit/layout/ContentPane"], 
    function(declare, lang, router, on, request, config, encode,
        indexTemplate, _WidgetBase, _TemplatedMixin, 
        NotebookItem, NotebookTab, TimelineTab, BookmarkCollectionTab, BookmarkList, IOHelper, 
        MyAsk, PAuthenticatedRequester, PNamespace,
        BTab, 
        TabContainer, ContentPane) {

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
        _cache: {},
        postMixInProperties: function() {
            this.inherited(arguments);
        },
        constructor: function() {
            var self = this;
            self.inherited(arguments);
            
            /* DEBUG: removed unused socketIO bookmarking thingie
            
            self.socketHelper = new IOHelper({
                serverAddress: config.ask.nodeServerAddress,
                serverPort: config.ask.nodeServerPort
            }); 
            */

            self.requester = new PAuthenticatedRequester({
                debug: false
            }).placeAt(dojo.byId('ask_container'));
            
            self.ns = new PNamespace();
        },
        
        startup: function() {
            var self = this;
            
            self.inherited(arguments);
            self.setupHandlers();

            self.setupRouter();
            
            self.requester.startup();

        },

        setupHandlers: function() {
            var self = this;
            
            // Clicking tabs will update the route.. it calls tab(show) twice?
            on(dojo.query('#ask-pills')[0], on.selector('a[data-toggle="tab"]', 'click'), function (e) {

                var id = dojo.attr(e.target, 'href');
                
                if (id === "#tab-bookmarks") {
                    router.go('/bookmarks/')
                } else if (id === "#tab-notebooks") {
                    router.go('/notebooks/');
                } else if (id === "#tab-myAsk") {
                    router.go('/myAsk/');
                } else if (id.match(/\/bookmarks\//) !== null) {
                    router.go(id);
                } else if (id.match(/\/timeline\//) !== null) {
                    router.go(id);
                } else if (id.match(/\/myNotebooks\//) !== null) {
                    console.log('si ma id? ', id);
                    router.go(id);
                } else 
                    router.go('/notebooks/'+ id.substr(-8, 8));
            });
            
            // Handle search input 
            on(dojo.byId('tabNotebooksSearchInput'), 'keyup', function(e) {

                if (e.keyCode === 13) {
                    self.filterNotebooks()
                } else {
                    clearTimeout(self.liveSearchTimer);
                    self.liveSearchTimer = setTimeout(function() {
                        self.filterNotebooks();
                    }, self.liveSearchTimerLength);
                }
                return false;
            });
            
            // Reset search
            on(dojo.byId('tabNotebooksSearchButton'), 'click', function() {
                dojo.query('div.nb-item').style('display', 'block');
                return false;
            });
            
        },
        
        filterNotebooks: function() {
            var s = dojo.query('#tabNotebooksSearchInput')[0].value.toLowerCase();
            dojo.query('div.nb-item').style('display', 'none');
            dojo.query('div.nb-item:contains("'+s+'")').style('display', 'block');
        },
        
        setupRouter: function() {
            var self = this;
            
            router.register('/notebooks/', function(evt) {
                if (!self.notebookLoaded) {
                    self.loadNotebookList();
                    self.notebookLoaded = true;
                }
                dojo.query("[href='#tab-notebooks']").tab('show');
            });

            router.register('/bookmarks/', function(evt) {
                if (!self.bookmarkLoaded) {
                    self.bookmarkLoaded = true;
                    self.loadBookmarkList();
                }
                dojo.query("[href='#tab-bookmarks']").tab('show');
            });

            router.register('/myAsk/', function(evt) {
                if (!self.myAskLoaded) {
                    self.myAskLoaded = true;
                    self.loadMyAsk();
                }
                dojo.query("[href='#tab-myAsk']").tab('show');
            });

            router.register('/bookmarks/:base64', function(evt) {
                self.openBookmark(BASE64.decode(evt.params.base64), evt.params.base64);
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

        loadMyAsk: function() {
            var self = this;
            self.myAsk = new MyAsk().placeAt(dojo.byId('myAskContainer'));
        },
        

        // TODO: move this to an object handling himself?
        loadNotebookList: function() {
            var self = this;

            request.get(ASK.ns.asPublicNotebooks, {
                handleAs: "json",
                headers: { "Accept": "application/json" }
            }).then(
                function(data) {
                    dojo.query('#notebooksContainer').empty();
                    for (var i in data.NotebookIDs) {
                        new NotebookItem({notebookId: data.NotebookIDs[i]})
                            .placeAt(dojo.byId('notebooksContainer'));
                            
                        self.loadNotebooksMeta(data.NotebookIDs[i]);
                    }
                }, 
                function(error) {
                    console.log('error :|');
                }
            );
            
        },
        
        // TODO: to show notebook's meta.. this is duplicating a call:
        // same as notebook item metadata ...
        loadNotebooksMeta: function(id) {
            var self = this;
            
            request.get(lang.replace(ASK.ns.asOpenNotebooksMeta, { id: id }), {
                handleAs: "json",
                headers: { "Accept": "application/json" }
            }).then(
                function(data){
                    
                    for (var i in data) {
                        
                        var name = data[i]['http://www.w3.org/2000/01/rdf-schema#label'][0].value,
                            annotationNum = 0,
                            createdAt = data[i]['http://purl.org/dc/terms/created'][0].value,
                            createdBy = data[i]['http://purl.org/dc/terms/creator'][0].value;
                        
                        if (typeof(data[i]['http://purl.org/pundit/ont/ao#includes']) !== "undefined") {
                            annotationNum = data[i]['http://purl.org/pundit/ont/ao#includes'].length;
                            dojo.query('#tab-notebooks #nb-item-'+id+' small.annotationNum').innerHTML(annotationNum + " annotations");
                        }
                            
                        dojo.query('#tab-notebooks #nb-item-'+id+' p').innerHTML(name);
                        dojo.query('#tab-notebooks #nb-item-'+id+' div.hidden').innerHTML(name.toLowerCase());
                        dojo.query('#tab-notebooks #nb-item-'+id+' small.id-createdAt-createdBy').innerHTML(createdAt);
                        
                    }

                }, 
                function(error) {
                    console.log('error :|');
                }
            ); // then
            
        },

        loadBookmarkList: function() {
            var self = this;
            
            dojo.query('#bookmarksContainer').empty();
            var bmTab = new BookmarkList({
                socketHelper: self.socketHelper
            }).placeAt(dojo.byId('bookmarksContainer'));
            
        },
        
        openBookmark: function(name, base64) {
            
            if (dojo.query('[data-tab-pane-base64="'+base64+'"]').length === 0) {
                var bmTab = new BookmarkCollectionTab({
                    name: name,
                    base64: base64
                }).placeAt(dojo.byId('ask-tab-content'));
            }
            dojo.query('[data-target-collection="'+base64+'"]').tab('show');
        },
        
        openNotebook: function(id, mine) {
            var self = this,
                mine = mine || false;
            
            // if the tab doesnt exist, create it
            if (dojo.query("#notebook-tab-"+ id).length === 0)
                var nbTab = new NotebookTab({
                    notebookId: id,
                    id: 'notebook-tab-'+ id,
                    isOwner: mine,
                    canEdit: mine
                }).placeAt(dojo.byId('ask-tab-content'));
            
            dojo.query("#tab-"+id).tab('show');
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
            if (dojo.query("#timeline-tab-"+ id).length === 0) {
                console.log('NEW NEW timeline ', id);
                var nbTab = new TimelineTab({
                    notebookId: id,
                    id: 'timeline-tab-'+ id,
                    endDate: endDate
                }).placeAt(dojo.byId('ask-tab-content'));
            }
            
            dojo.query("#tab-time-"+id).tab('show');
            
        },
        
        // TODO: move this somewhere
        // based on http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
        // replaces urls with links in freetexts
        linkify: function(text) {
                // patterns for: "http://", "www." and emails
                var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;\[\]]*[a-z0-9-+&@#\/%\[\]=~_|]/gim,
                    pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim,
                    emailAddressPattern = /(([a-zA-Z0-9_\-\.]+)@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6}))+/gim;
                return url
                    .replace(urlPattern, '<a target="_blank" href="$&">$&</a>')
                    .replace(pseudoUrlPattern, '$1<a target="_blank" href="http://$2">$2</a>')
                    .replace(emailAddressPattern, '<a target="_blank" href="mailto:$1">$1</a>');
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