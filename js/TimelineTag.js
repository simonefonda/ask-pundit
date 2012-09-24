define(["dojo/_base/declare", 
        "dojo/on", 
        "dojo/text!ask/tmpl/TimelineTagTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, on, timelineTagTemplate, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.TimelineTag", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        label: '',
        uri: '',
        parentTimeline: '',
        num: '',
        templateString: timelineTagTemplate,
        postMixInProperties: function() {
            var self = this,
                items = self.parentTimeline.notebookRawData.items,
                _label = "http://www.w3.org/2000/01/rdf-schema#label",
                foo;
            
            self.inherited(arguments);
            
            if (self.uri in items)
                self.label = items[self.uri][_label][0].value;
                
            console.log('tag post', self.label);
            
        }
	});

});