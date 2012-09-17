define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/AnnotationPredicateTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, annotationPredicateTemplate, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.AnnotationPredicate", [_WidgetBase, _TemplatedMixin], {
        annotationId: '',
        uri: '',
        templateString: annotationPredicateTemplate,
        startup: function() { }
	});

});
