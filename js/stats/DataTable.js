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
            limit: 100
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
            var self = this;
            
            self.start = 0,
            self.end = Math.min(self.opts.limit, ASK.statsTab.st.length);
            
            self.triples = [];

            // DEBUG: Duplicate data to make it renderable over and over.. 
            // is there a better way?
            var i, j;
            i = j = self.start;
            while (i<self.end && ASK.statsTab.st[j]) {
                if (ASK.statsTab.st[j].active) 
                    self.triples[i++] = ASK.statsTab.st[j];
                j++;
            }
            
            // For the render()
            self.end = i;
            self.start = self.start+1;
        
            var foo = ASK.statsTab.filters,
                hash = {};
            for (var f=foo.length; f--;) {
                if (foo[f].key in hash) {
                    hash[foo[f].key].push({value: foo[f].value});
                } else {
                    hash[foo[f].key] = [{value: foo[f].value}];
                }
            }
            
            self.filters = [];
            for (var k in hash) {
                self.filters.push({key: k, values: hash[k] });
            }
            
            self.activeTriplesNum = ASK.statsTab.activeTriplesNum;
            self.renderDataTable();
        },
        renderDataTable: function() {
            this.render();
        }
        
    });

});