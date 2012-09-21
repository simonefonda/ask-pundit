define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/NotebookItemAnnotationContentTemplate.html", 
        "bootstrap/Tooltip",
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, notebookItemAnnotationContentTemplate, BTooltip, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.NotebookItemAnnotationContent", [_WidgetBase, _TemplatedMixin], {
        annotationId: '',
        createdBy: '',
        createdAt: '',
        pageContext: '',
        pageContext_short: '',
        pageContext_short_length: 20,
        subject: '',
        subject_enc: '',
        
        templateString: notebookItemAnnotationContentTemplate,
        postMixInProperties: function() {
            this.inherited(arguments);
            this.subject_enc = BASE64.encode(this.subject);
            
            // Page context: show the first part of the URL
            if (this.pageContext.match(/^http:\/\/www\./))
                this.pageContext_short = this.pageContext.substr(11, 11 + this.pageContext_short_length) + " ..";
            else if (this.pageContext.match(/^http:\/\//))
                this.pageContext_short = this.pageContext.substr(7, 7 + this.pageContext_short_length) + " ..";
            else
                this.pageContext_short = this.pageContext.substr(0, + this.pageContext_short_length) + " ..";
            
        },
        startup: function() {
            dojo.query('[rel="tooltip"]').tooltip();
        }
	});
});