define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/CollectionItemTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, collectionItemTemplate, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.CollectionItem", [_WidgetBase, _TemplatedMixin], {
        name: '',
        description: '',
        templateString: collectionItemTemplate,
        postMixInProperties: function() {
            this.inherited(arguments);
        },
        startup: function() {
            this.inherited(arguments);
            
        }
	});

});