define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/NotebookItemAnnotationContentTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, notebookItemAnnotationContentTemplate, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.NotebookItemAnnotationContent", [_WidgetBase, _TemplatedMixin], {
        annotationId: '',
        createdBy: '',
        createdAt: '',
        pageContext: '',
        subject: '',
        subject_enc: '',
        templateString: notebookItemAnnotationContentTemplate,
        postMixInProperties: function() {
            this.inherited(arguments);
            this.subject_enc = BASE64.encode(this.subject);
        }
	});
});