define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/NotebookItemAnnotationTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, notebookItemAnnotationTemplate, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.NotebookItemAnnotation", [_WidgetBase, _TemplatedMixin], {
        annotationId: '',
        createdBy: '',
        createdAt: '',
        pageContext: '',
        body: '',
        templateString: notebookItemAnnotationTemplate
	});
});