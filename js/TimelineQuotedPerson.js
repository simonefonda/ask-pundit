define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/TimelineQuotedPersonTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, timelineQuotedPersonTemplate, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.TimelineQuotedPerson", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        parentTimeline: '',
        
        perUri: '',
        colorClass: '',
        colorClassPrefix: 'color-',
        perQuotationFrom: '',
        perDepiction: '',
        
        templateString: timelineQuotedPersonTemplate,
        postMixInProperties: function() {
            var self = this,
                items = self.parentTimeline.notebookRawData.items,
                _quotationFrom = "http://purl.org/spar/cito/cites",
                _label = "http://www.w3.org/2000/01/rdf-schema#label",
                _depic = "http://xmlns.com/foaf/0.1/depiction",
                foo;
            
            self.inherited(arguments);
            
            // TODO: validate all of these items for missing [0].value

            self.perDepiction = items[self.perUri][_depic][0].value;
            self.colorClass = self.colorClassPrefix + self.parentTimeline.getColor(self.perUri);
            self.perQuotationFrom = items[self.perUri][_label][0].value;

        },
        startup: function() {
            this.inherited(arguments);
        }
	});

});