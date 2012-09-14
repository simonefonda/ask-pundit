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
                
        },

        openNotebooks: function() {

            request.get("http://metasound.dibet.univpm.it:8080/annotationserver/api/open/notebooks/public/", {
                handleAs: "json"
            }).then(
                function(data) {
                    dojo.query('#notebooksContainer').empty();
                    for (var i in data.NotebookIDs) 
                        new NotebookItem({notebookId: data.NotebookIDs[i]})
                            .placeAt(dojo.byId('notebooksContainer'));
                }, 
                function(error) {
                    console.log('error :|');
                }
            );
            
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