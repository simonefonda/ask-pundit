define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/AnnotationItemTextFragmentTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, AnnotationItemTextFragmentTemplate, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.AnnotationItemTextFragment", [_WidgetBase, _TemplatedMixin], {
        uri: '',
        data: '',
        label: '',
        xpointer: '',
        description: '',
        partOf: '',
        pageContext: '',
        show: {},
        templateString: AnnotationItemTextFragmentTemplate,
        postMixInProperties: function() {
            this.inherited(arguments);

            var fields = { 
                label: "http://www.w3.org/2000/01/rdf-schema#label",
                partOf: "http://purl.org/dc/terms/isPartOf",
                pageContext: "http://purl.org/pundit/ont/ao#hasPageContext",
                description: "http://purl.org/dc/elements/1.1/description"
            };
            
            var d = this.data[this.uri];
            for (var name in fields) {
                
                this.show[name] = "hidden";
                
                if (fields[name] in d) {
                    this.show[name] = "shown";
                    this[name] = d[fields[name]][0].value;
                } 
            }

        } // postMixInProperties()
        
	});
});