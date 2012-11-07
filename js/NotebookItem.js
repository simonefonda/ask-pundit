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
            
            if (self.isOwner) {
                console.log('Notebook item owner, oooh my' + self.notebookId);
                self.href = "#/myNotebooks/" + self.notebookId;
            } else {
                self.href = "#/notebooks/" + self.notebookId;
                console.log('NOTNOT Notebook item owner' + self.notebookId);
            }
            
        },
        startup: function() {
            this.inherited(arguments);
        }
	});

});