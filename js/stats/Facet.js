define(["dojo/_base/declare", 
        "dojo/on", 
        "dojo/query",
        "dojo/dom-construct",
        "dojo/dom-attr",
        "dojo/dom-class",
        
        "dojo/text!ask/tmpl/stats/Facet.html",
        "lib/mustache",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
    ],
    function(
        declare, on, query, domConstruct, domAttr, domClass,
        template, mustache, 
        _WidgetBase, _TemplatedMixin) {

    return declare("ask.Facet", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        templateString: template,
        state: 'loading',
        key: '',
        sortBy: 'total', // either 'value' 'count' or 'total'
        sortDir: 'desc',

        // _skipNodeCache forces dojo to call _stringRepl, thus using mustache
        _skipNodeCache: true,
        render: function() {
            var self = this,
                node;
            if (self.domNode) {
                // node = domConstruct.place(this._stringRepl(this.templateString), this.domNode, 'before');
                // this.destroyDescendants();
                // domConstruct.destroy(this.domNode);
                
                node = self.domNode.cloneNode(false);
                node.innerHTML = self._stringRepl(this.templateString);
                self.domNode.parentNode.replaceChild(node, self.domNode);
            } else {
                node = dojo._toDom(this.templateString);
            }
            self.domNode = node; 
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
            self.initBehaviors();
        }, // startup()
        
        initBehaviors: function() {
            var self = this,
                parent = query(self.domNode).parent()[0];
            
            query(parent).on('.stats-facet.'+self.key+' .facet-filter:click', function(e) {
                var v = domAttr.get(this, 'data-value');
                ASK.statsTab.toggleFilter(self.key, v);
                query(this).parent().toggleClass('active');
            });
        },
        
        update: function() {
            var self = this,
                totals = ASK.statsTab.facetsTotals[self.key],
                nums = ASK.statsTab.facetsNums[self.key]; 
            
            self.values = [];
            for (var val in totals) {
                self.values.push({
                    active: (val in nums) ? 'active' : '',
                    value: val,
                    count: nums[val] || 0,
                    total: totals[val]
                });
            }
            if (self.values.length > 0) {
                if (self.values.length > 4)
                    self.loadMore = true;
                self.sortValues();
                self.render();
            }
        },
        sortValues: function() {
            var self = this,
                asc = self.sortDir === 'asc';
            
            self.values.sort(function(a, b){
                var v1 = a[self.sortBy], v2 = b[self.sortBy];
                if (v1 == v2) return 0;
                if (v1 > v2) return (asc ? 1 : -1);
                if (v1 < v2) return (asc ? -1 : 1);
            });
        }
                
    });

});