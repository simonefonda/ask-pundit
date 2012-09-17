define(["dojo/_base/declare", 
        "dojo/json",
        "dojo/text!ask/tmpl/AnnotationPredicateTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, json, annotationPredicateTemplate, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.AnnotationPredicate", [_WidgetBase, _TemplatedMixin], {
        annotationId: '',
        uri: '',
        uri_enc: '',
        subject_enc: '',
        templateString: annotationPredicateTemplate,
        postMixInProperties: function() {
            this.inherited(arguments);
            this.uri_enc = BASE64.encode(this.uri);
        }
	});

});
