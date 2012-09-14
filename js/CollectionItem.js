define(["dojo/_base/declare", 
        "dojo/on", 
        "dojo/text!ask/tmpl/CollectionItemTemplate.html", 
        "bootstrap/Button",
        "bootstrap/Modal",
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, on, collectionItemTemplate, BButton, BModal, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.CollectionItem", [_WidgetBase, _TemplatedMixin], {
        name: '',
        description: '',
        templateString: collectionItemTemplate,
        postMixInProperties: function() {
            this.inherited(arguments);
        },
        startup: function() {
            var self = this;
            this.inherited(arguments);
            
            on(dojo.query('button.subscribeCollection[data-collection-name="'+self.name+'"]')[0], 'click', function(e) {
                dojo.query('#subscribeCollectionHiddenName')[0].value = self.name;
                dojo.query('#subscribeCollectionModal .modal-body span.text-info').innerHTML(self.name);
                dojo.query('#subscribeCollectionPassword')[0].value = '';
                dojo.query('#subscribeCollectionForm .modal-footer span.label')
                    .removeClass('label-important')
                    .addClass('label-info')
                    .innerHTML("let's see..");
                    
                dojo.query('#subscribeCollectionModal').modal('show');
            });
                        
        }
	});

});