define(["dojo/_base/declare", 
        "dojo/on", 
        "dojo/query",
        "dojo/dom-construct",
        "dojo/dom-attr",
        "dojo/dom-class",
        "bootstrap/Dropdown",
        
        "dojo/text!ask/tmpl/stats/Facet.html",
        "lib/mustache",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
    ],
    function(
        declare, on, query, domConstruct, domAttr, domClass, BDropDown,
        template, mustache, 
        _WidgetBase, _TemplatedMixin) {

    var defaults = {
        sortBy: 'count', // either 'value' 'count' or 'total'
        sortDir: 'desc',
        limit: 10,
        perPage: 10,
        restoreScrollTopSelector: '.stats-values-container ul',
    };

    return declare("ask.Facet", [_WidgetBase, _TemplatedMixin], {
        templateString: template,
        key: '',
        label: '',

        // _skipNodeCache forces dojo to call _stringRepl, thus using mustache
        _skipNodeCache: true,
        render: function() {
            var self = this,
                scrollTop,
                node;
                
            if (self.opts.restoreScrollTopSelector) {
                scrollTop = query(self.opts.restoreScrollTopSelector, self.domNode)[0].scrollTop
            }
            if (self.domNode) {
                node = domConstruct.toDom(self._stringRepl(self.templateString));
                self.domNode.parentNode.replaceChild(node, self.domNode);
                delete self.domNode;
            } else {
                // node = dojo._toDom(self.templateString);
                node = domConstruct.toDom(self._stringRepl(self.templateString));
            }

            self.domNode = node;
            if (self.opts.restoreScrollTopSelector) {
                query(self.opts.restoreScrollTopSelector, self.domNode)[0].scrollTop = scrollTop;
            }
        },
        _stringRepl: function(tmpl) {
            return mustache.render(tmpl, this);
        },
        postMixInProperties: function() {
            var self = this;
            self.inherited(arguments);
            self.opts = {};
            for (var key in defaults) {
                self.opts[key] = defaults[key]
            }
        },
        startup: function() {
            var self = this;
            self.initBehaviors();
        }, // startup()
        
        destroy: function() {
            var self = this;
            for (var l=self._behaviorList.length; l--;)
                self._behaviorList[l].remove();
                
            self.inherited(arguments);
        },
        
        initBehaviors: function() {
            var self = this,
                parent = query(self.domNode).parent()[0],
                i=0;

            self._behaviorList = [];
            
            // Toggle a filter by clicking on the value
            self._behaviorList[i++] = query(parent).on('.stats-facet.'+self.key+' .facet-filter:click', function(e) {
                var v = domAttr.get(this, 'data-value');
                query(this).parent().toggleClass('active');
                ASK.statsTab.toggleFilter(self.key, v);
            });

            // Load more / all values
            self._behaviorList[i++] = query(parent).on('.stats-facet.'+self.key+' .facet-load-more:click', function(e) {
                self.opts.limit += self.opts.perPage;
                self.update();
                ASK.statsTab.positionFacets();
            });

            self._behaviorList[i++] = query(parent).on('.stats-facet.'+self.key+' .facet-load-all:click', function(e) {
                self.opts.limit = self.total;
                self.update();
                ASK.statsTab.positionFacets();
            });

            // Sort 
            self._behaviorList[i++] = query(parent).on('.stats-facet.'+self.key+' .facet-controls .sort:click', function(e) {
                self.opts.sortBy = domAttr.get(this, 'data-sortBy');
                self.opts.sortDir = domAttr.get(this, 'data-sortDir');
                self.update();
            });

            self._behaviorList[i++] = query(parent).on('.stats-facet.'+self.key+' .facet-controls .sort:click', function(e) {
                self.opts.sortBy = domAttr.get(this, 'data-sortBy');
                self.opts.sortDir = domAttr.get(this, 'data-sortDir');
                self.update();
            });

            // Selection
            self._behaviorList[i++] = query(parent).on('.stats-facet.'+self.key+' .facet-controls .select-reverse:click', function(e) {
                var all = ASK.statsTab.facetsTotals[self.key];
                for (var val in all) 
                    ASK.statsTab.toggleFilter(self.key, val)
                self.update();
            });

            self._behaviorList[i++] = query(parent).on('.stats-facet.'+self.key+' .facet-controls .select-all:click', function(e) {
                for (var i=self.filteredValues.length; i--;)
                    ASK.statsTab.toggleFilter(self.key, self.filteredValues[i])
                self.update();
            });
            
        },
        
        update: function() {
            var self = this,
                totals = ASK.statsTab.facetsTotals[self.key],
                nums = ASK.statsTab.facetsNums[self.key],
                allFilters = ASK.statsTab.filters,
                i = 0;
                
            self.filteredValues = [];
            for (var f in allFilters) {
                if (allFilters[f].key === self.key)
                    self.filteredValues.push(allFilters[f].value);
            }
            
            computed = [];
            self.activeNum = 0;
            self.filtersNum = 0;
            self.activeValues = [];
            for (var val in totals) {

                var filtered = '', 
                    active = '';
                
                if (self.filteredValues.indexOf(val) !== -1) {
                    filtered = "filtered";
                    self.filtersNum++;
                }
                 
                if (val in nums) {
                    active = "active";
                    self.activeNum++;
                    self.activeValues.push(val);
                }
                    
                computed.push({
                    active: active,
                    filtered: filtered,
                    value: val,
                    count: nums[val] || 0,
                    total: totals[val]
                });
            }

            self.total = computed.length;
            if (self.total > 0) {
                self.loadMore = false;
                if (self.total > self.opts.limit)
                    self.loadMore = true;
                computed = self.sortValues(computed);
                
                var start = 0,
                    end = Math.min(self.opts.limit, self.total);

                self.values = [];
                for (var i=0; i<end; i++)
                    self.values[i] = computed[i];
                self.render();
            }
        },
        sortValues: function(values) {
            var self = this,
                asc = self.opts.sortDir === 'asc';
            
            values.sort(function(a, b){
                var v1 = a[self.opts.sortBy], v2 = b[self.opts.sortBy];
                if (v1 == v2) return 0;
                if (v1 > v2) return (asc ? 1 : -1);
                if (v1 < v2) return (asc ? -1 : 1);
            });
            return values;
        }
                
    });

});