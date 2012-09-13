define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/NotebookItemAnnotationTargetTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, notebookItemAnnotationTargetTemplate, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.NotebookItemAnnotationTarget", [_WidgetBase, _TemplatedMixin], {
        uri: '',
        templateString: notebookItemAnnotationTargetTemplate
	});
});