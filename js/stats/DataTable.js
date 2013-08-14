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

        opts: {
            limit: 1000
        },

        // _skipNodeCache forces dojo to call _stringRepl, thus using mustache
        _skipNodeCache: true,
        render: function() {
            var self = this;
            if (this.domNode) {
                // node = domConstruct.place(this._stringRepl(this.templateString), this.domNode, 'before');
                // this.destroyDescendants();
                // domConstruct.destroy(this.domNode);
                
                node = self.domNode.cloneNode(false);
                node.innerHTML = self._stringRepl(this.templateString);
                self.domNode.parentNode.replaceChild(node, self.domNode);
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
            var self = this,
                start = 0,
                end = Math.min(self.opts.limit, ASK.statsTab.st.length);
            
            self.triples = [];

            // DEBUG: Duplicate data to make it renderable over and over.. 
            // is there a better way?
            for (var i=start; i<end; i++)
                self.triples[i] = ASK.statsTab.st[i];
            self.filters = ASK.statsTab.filters;
            self.activeTriplesNum = ASK.statsTab.activeTriplesNum;
            self.render();
        }
        
    });

});