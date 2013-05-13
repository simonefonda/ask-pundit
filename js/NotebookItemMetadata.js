define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/NotebookItemMetadataTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, notebookItemMetadataTemplate, _WidgetBase, _TemplatedMixin) {

    return declare("ask.NotebookItemMetadata", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        templateString: notebookItemMetadataTemplate
    });

});
