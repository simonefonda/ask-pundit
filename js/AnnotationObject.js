define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/AnnotationObjectTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, annotationObjectTemplate, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.AnnotationObject", [_WidgetBase, _TemplatedMixin], {
        annotationId: '',
        uri: '',
        templateString: annotationObjectTemplate,
        startup: function() { }
	});

});