define(["dojo/_base/declare", 
        "dojo/router", 
        "dojo/on", 
        "dojo/request",
        "dojo/_base/config", 
        "dojo/text!ask/tmpl/IndexTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin",
        "ask/NotebookItem",
        "ask/NotebookTab",
        "ask/BookmarkList",
        "ask/IOHelper",
        "bootstrap/Tab",
        "dijit/layout/TabContainer", 
        "dijit/layout/ContentPane"], 
    function(declare, router, on, request, config,
        indexTemplate, _WidgetBase, _TemplatedMixin, 
        NotebookItem, NotebookTab, BookmarkList, IOHelper, BTab, TabContainer, 
        ContentPane) {
	
	return declare("ask.Index", [_WidgetBase, _TemplatedMixin], {
        name: '',
        bio: '',
        templateString: indexTemplate,
        socketHelper: '',
        liveSearchTimer: '',
        liveSearchTimerLength: 500,
        postMixInProperties: function() {
            this.inherited(arguments);
        },
        constructor: function() {
            this.inherited(arguments);
            this.socketHelper = new IOHelper({
                serverAddress: config.ask.nodeServerAddress,
                serverPort: config.ask.nodeServerPort
            });
        },
        
        startup: function() {
            this.inherited(arguments);
            this.setupRouter();
            this.openNotebooks();
            this.openBookmarks();
            this.setupHandlers();
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
                } else 
                    router.go('/notebooks/'+ id.substr(-8, 8));
            });
            
            on(dojo.byId('tabNotebooksSearchInput'), 'keyup', function(e) {
                // dojo.query('#bookmarksNewNameLabel')
                //    .addClass('label-info')
                //    .removeClass('label-important label-success');
                    
                clearTimeout(self.liveSearchTimer);
                self.liveSearchTimer = setTimeout(function() {
                    var s = dojo.query('#tabNotebooksSearchInput')[0].value;
          
                    dojo.query('div.nb-item').style('display', 'none');

                    dojo.query('div.nb-item:contains("'+s+'")').style('display', 'block');
                    console.log(dojo.query('div.nb-item:contains("'+s+'")'), 'div.nb-item:contains("'+s+'")');
                }, self.liveSearchTimerLength);
            });
            
            on(dojo.byId('tabNotebooksSearchButton'), 'click', function() {
                dojo.query('div.nb-item').style('display', 'block');
                return false;
            });
            
            
        },
        
        setupRouter: function() {
            var self = this;
            
            router.register('/notebooks/', function(evt) {
                dojo.query("[href='#tab-notebooks']").tab('show');
            });

            router.register('/bookmarks/', function(evt) {
                dojo.query("[href='#tab-bookmarks']").tab('show');
            });

            router.register('/notebooks/:id', function(evt) {
                self.openNotebook(evt.params.id);
            });
    
            router.startup();
            
            // Coming in with an empty hash, redirect to /notebooks/
            if (document.location.hash === '')
                router.go("/notebooks/");
                
        },

        // TODO: move this to an object handling himself?
        openNotebooks: function() {
            var self = this;

            request.get("http://metasound.dibet.univpm.it:8080/annotationserver/api/open/notebooks/public/", {
                handleAs: "json"
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
            
            request.get("http://metasound.dibet.univpm.it:8080/annotationserver/api/open/notebooks/"+ id +"/metadata", {
                handleAs: "json"
            }).then(
                function(data){
                    for (var i in data) {
                        
                        self.name = data[i]['http://www.w3.org/2000/01/rdf-schema#label'][0].value;
                        dojo.query('#nb-item-'+id+' p').innerHTML(self.name);
                        dojo.query('#nb-item-'+id+' div').innerHTML(self.name.toLowerCase());
                        dojo.query('#nb-item-'+id+' small').innerHTML((data[i]['http://purl.org/pundit/ont/ao#includes'].length || "0") + " annotations");
                    }

                }, 
                function(error) {
                    console.log('error :|');
                }
            ); // then
            
        },

        openBookmarks: function(force) {
            var self = this;
            
            dojo.query('#bookmarksContainer').empty();
            var bmTab = new BookmarkList({
                socketHelper: self.socketHelper
            }).placeAt(dojo.byId('bookmarksContainer'));
            
        },
        
        openNotebook: function(id) {
            var self = this;
            
            // if the tab doesnt exist, create it
            if (dojo.query("#notebook-tab-"+ id).length === 0)
                var nbTab = new NotebookTab({
                    notebookId: id,
                    id: 'notebook-tab-'+ id
                }).placeAt(dojo.byId('ask-tab-content'));
            
            dojo.query("#tab-"+id).tab('show');
        },
                
	});

});