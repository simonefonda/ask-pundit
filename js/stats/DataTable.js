define(["dojo/_base/declare", 
        "dojo/on", 
        "dojo/query",
        "dojo/dom-construct",
        
        "dojo/text!ask/tmpl/stats/DataTable.html",
        "lib/mustache",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
    ],
    function(
        declare, on, query, domConstruct,
        template, mustache, 
        _WidgetBase, _TemplatedMixin) {

    return declare("ask.DataTable", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        templateString: template,
        state: 'loading',
        filters: [],

        // _skipNodeCache forces dojo to call _stringRepl, thus using mustache
        _skipNodeCache: true,
        render: function() {
            var node;
            if (this.domNode) {
                node = domConstruct.place(this._stringRepl(this.templateString), this.domNode, 'before');
                this.destroyDescendants();
                domConstruct.destroy(this.domNode);
            } else {
                node = dojo._toDom(this.templateString);
            }
            this.domNode = node; 
        },
        _stringRepl: function(tmpl) {
            return mustache.render(tmpl, this);
        },
        postMixInProperties: function() {
            var self = this;
            
            self.inherited(arguments);
        },
        startup: function() {
            var self = this;
        }, // startup()

        autoUpdate: function() {
            var self = this;

            // DEBUG: Duplicate data to make it renderable over and over.. 
            // is there a better way?
            self.triples = ASK.statsTab.st;
            self.filters = ASK.statsTab.filters;
            self.activeTriplesNum = ASK.statsTab.activeTriplesNum;
            self.render();
        }

        
    });

});