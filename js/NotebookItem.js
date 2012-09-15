define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/NotebookItemTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, notebookItemTemplate, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.NotebookItem", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        name: '',
        annotationNum: '',
        templateString: notebookItemTemplate,
        postMixInProperties: function() {
            this.inherited(arguments);
        },
        startup: function() {
            this.inherited(arguments);
        }
	});

});