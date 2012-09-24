define(["dojo/_base/declare", 
        "dojo/on", 
        "dojo/text!ask/tmpl/TimelineAnnotationTagTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, on, timelineAnnotationTagTemplate, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.TimelineAnnotationTag", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        label: '',
        uri: '',
        parentTimeline: '',
        templateString: timelineAnnotationTagTemplate,
        postMixInProperties: function() {
            var self = this,
                items = self.parentTimeline.notebookRawData.items,
                _label = "http://www.w3.org/2000/01/rdf-schema#label",
                foo;

            console.log('ANN tag post 1', self.label);
            
            // self.inherited(arguments);
            
            if (self.uri in items)
                self.label = items[self.uri][_label][0].value;
                
            console.log('ANN tag post', self.label);
            
        },
        /*
        startup: function() {
            //var self = this;
            //self.inherited(arguments);
        }
        */
	});

});