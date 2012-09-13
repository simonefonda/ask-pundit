define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/AnnotationItemPredicateTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, AnnotationItemPredicateTemplate, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.AnnotationItemPredicate", [_WidgetBase, _TemplatedMixin], {
        uri: '',
        data: '',
        label: '',
        description: '',
        types: '',
        templateString: AnnotationItemPredicateTemplate,
        postMixInProperties: function() {
            this.inherited(arguments);
            
            // TODO: use a namespace helper or something 
            var _label = "http://www.w3.org/2000/01/rdf-schema#label",
                _type = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                _tf = "http://purl.org/pundit/ont/ao#text-fragment",
                _prop = "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property",
                _desc = "http://purl.org/dc/elements/1.1/description",
                _depic = "http://xmlns.com/foaf/0.1/depiction";

            // TODO: deal with multiple values ?
            // TODO: refactor using a map
            if (_label in this.data[this.uri])
                this.label = this.data[this.uri][_label][0].value;

            if (_desc in this.data[this.uri])
                this.description = this.data[this.uri][_desc][0].value;
            
            if (_depic in this.data[this.uri])
                this.depiction = this.data[this.uri][_depic][0].value;
            
            if (_type in this.data[this.uri]) {

                var types = this.data[this.uri][_type];
                for (var i in types) {
                    // If there's a label in this.data, use it
                    var t = types[i].value;
                    if (t in this.data)
                        this.types += this.data[t][_label][0].value + ", ";
                    else
                        this.types +=  t + ", ";
                }
                if (this.types.length > 0)
                    this.types = this.types.substr(0, this.types.length-2);
            }
                
        }
        
	});
});