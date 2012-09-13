define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/NotebookItemAnnotationContentTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, notebookItemAnnotationContentTemplate, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.NotebookItemAnnotationContent", [_WidgetBase, _TemplatedMixin], {
        subject: '',
        predicate: '',
        object: '',
        templateString: notebookItemAnnotationContentTemplate
	});
});