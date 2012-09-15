define(["dojo/_base/declare", 
        "dojo/request", 
        "dojo/dom-construct",
        "dojo/on", 
        "dojo/router", 
        "dojo/text!ask/tmpl/BookmarkCollectionTabTemplate.html", 
        "dijit/layout/TabContainer", 
        "dijit/layout/ContentPane", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, request, domConstruct, on, router,
                bookmarkCollectionTabTemplate, 
                TabContainer, ContentPane, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.NotebookTab", [_WidgetBase, _TemplatedMixin], {
        name: '',
        base64: '',
        description: '',
        templateString: bookmarkCollectionTabTemplate,
        constructor: function() {
            this.inherited(arguments);
        },
        startup: function() {
            var self = this;
            self.inherited(arguments);

            // place the tab button
            var b = "<li><a data-target-collection='"+this.base64+"' " +
                    "href='#/bookmarks/"+this.base64+"'" +
                    "' data-toggle='tab' id='tab-"+this.base64+
                    "'>B: "+this.name+"</a></li>";

            dojo.place(b, "ask-pills");
 
            on(dojo.query('[data-target-collection="'+ self.base64 +'"]'), 'show', function(e) {
                dojo.query('#ask-tab-content .tab-pane').removeClass('active');
                dojo.query('[data-tab-pane-base64="'+ self.base64 +'"]').addClass('active');
            });
 
 
            // Close tab button: removes pill + tab content, unregistering
            // the dojo's widgets
            on(dojo.query('button[data-collection-target="'+ self.name +'"]'), 'click', function(e) {

                router.go('/bookmarks/');

                /*
                var node = dojo.query('#notebook-tab-'+self.notebookId)[0];

                dijit.registry.forEach(function(w){ 
                    if (w.id === 'notebook-tab-'+self.notebookId) 
                        w.destroyRecursive();
                });

                dojo.destroy(dojo.query('#tab-'+self.notebookId)[0].parentNode);
                dojo.destroy(node);
                */
                
            });
     
        }, // startup
        
     
        
	});

});