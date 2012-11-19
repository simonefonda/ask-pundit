define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/ErrorMessageTemplate.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, errorMessageTemplate, _WidgetBase, _TemplatedMixin) {

    return declare("ask.ErrorMessage", [_WidgetBase, _TemplatedMixin], {
        title: 'def',
        text: 'def2',
        templateString: errorMessageTemplate
    });

});