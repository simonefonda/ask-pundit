define([
    "dojo/_base/declare", 
    "dojo/text!ask/tmpl/ErrorMessageTemplate.html",
    "lib/mustache",
    "dijit/_WidgetBase", 
    "dijit/_TemplatedMixin"
], 
function(
    declare, errorMessageTemplate, mustache,
    _WidgetBase, _TemplatedMixin
) {

    return declare("ask.ErrorMessage", [_WidgetBase, _TemplatedMixin], {
        title: '',
        text: '',
        templateString: errorMessageTemplate,
        // _skipNodeCache forces dojo to call _stringRepl, thus using mustache
        _skipNodeCache: true,
        _stringRepl: function(tmpl) {
            return mustache.render(tmpl, this);
        }
    });
});