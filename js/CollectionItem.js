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
        base64: '',
        description: '',
        templateString: collectionItemTemplate,
        joined: false,
        showJoinLeave: {join: '', leave: ''},
        postMixInProperties: function() {
            this.inherited(arguments);

            // Overwrite, cause dojo is taking this object from other instances
            // .. but ... why???!?!!???!?!?!???
            this.showJoinLeave = {join: '', leave: ''};
                
            // Use a class to hide/show the correct join/leave button
            if (this.joined) 
                this.showJoinLeave['join'] = 'very-hidden';
            else
                this.showJoinLeave['leave'] = 'very-hidden';

        },
        startup: function() {
            var self = this;
            this.inherited(arguments);
            
            // click on join collection button
            on(dojo.query('button.joinCollection[data-collection-name="'+self.name+'"]')[0], 'click', function(e) {
                dojo.query('#joinCollectionHiddenName')[0].value = self.name;
                dojo.query('#joinCollectionModal .modal-body span.text-info').innerHTML(self.name);
                dojo.query('#joinCollectionPassword')[0].value = '';
                dojo.query('#joinCollectionForm .modal-footer span.label')
                    .removeClass('label-important')
                    .addClass('label-info')
                    .innerHTML("let's see..");
                    
                dojo.query('#joinCollectionModal').modal('show');
            });
            
            // click on leave collection button
            on(dojo.query('button.leaveCollection[data-collection-name="'+self.name+'"]')[0], 'click', function(e){
                console.log('Leave collection!');
                self.listReference.removeJoinedCollection(self.name);
            });
                        
        }
	});

});