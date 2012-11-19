define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/NotebookItemTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, notebookItemTemplate, _WidgetBase, _TemplatedMixin) {

    return declare("ask.NotebookItem", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        templateString: notebookItemTemplate,
        isOwner: false,
        canEdit: false,
        
        postMixInProperties: function() {
            var self = this;
            
            self.inherited(arguments);

            // Render a different link if we own the notebook
            if (self.isOwner) {
                self.href = "#/myNotebooks/" + self.notebookId;
            } else {
                self.href = "#/notebooks/" + self.notebookId;
            }
            
        },
        startup: function() {
            this.inherited(arguments);
        }
	});

});