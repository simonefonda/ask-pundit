define(["dojo/_base/declare", 
        "dojo/on", 
        "dojo/query",
        
        "dojo/text!ask/tmpl/stats/StatsTab.html",
        "lib/mustache",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
    ],
    function(
        declare, on, query,
        template, mustache, 
        _WidgetBase, _TemplatedMixin) {

    return declare("ask.StatsTab", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        templateString: template,
        state: 'loading',
        store: {},
        opts: {
            autoUpdateTimerLength: 500
        },
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
            
            // TODO: render facets elsewhere, not here, so we can render it over
            // and over
            self.availableFacets = [
                {key: 'nbId', label: 'Notebook ID', state: ''},
                {key: 'annId', label: 'Annotation ID', state: 'success'},
                {key: 'sub', label: 'Subject', state: ''},
                {key: 'pred', label: 'Predicate', state: ''},
                {key: 'object', label: 'Object', state: ''},
                {key: 'subLabel', label: 'Subject label', state: ''},
                {key: 'predLabel', label: 'Predicate label', state: 'success'},
                {key: 'objLabel', label: 'Object label', state: 'success'},
                {key: 'author', label: 'Author ID', state: 'success'},
                {key: 'authorLabel', label: 'Author label', state: 'success'},
                {key: 'pageContext', label: 'Annotated Page', state: 'success'}
            ];
            self.facetList = ['annId', 'predLabel', 'authorLabel', 'pageContext'];
            self.facets = {};

        },
        startup: function() {
            var self = this;
            
            require(["ask/stats/DataTable"], function(DataTable) {
                self.dataTable = new DataTable().placeAt(query('.stats-dataTable-container', self.domNode)[0]);
                self.dataTable.startup();
            });
            
            self.st = [];
            self.initFacets();
            
            // self.st = FIXTURES;
            // self.autoUpdate();

        }, // startup()

        initFacets: function() {
            var self = this;
            
            require(["ask/stats/Facet"], function(Facet) {
                for (var l=self.facetList.length; l--;) {
                    var f = self.facetList[l]; 
                    self.facets[f] = new Facet({
                        key: f
                    }).placeAt(query('.stats-facets-container', self.domNode)[0]);
                    self.facets[f].startup();
                }
            });
            
            self.filters = [];
            
        },
        
        add: function(nbId, annId) {
            var self = this,
                ca = ASK._cache['nb-'+nbId],
                annCon = ca['ann-con-'+annId];
                
            console.log('Adding ', annId);

            for (var subject in annCon)
                for (var predicate in annCon[subject])
                    for (var object in annCon[subject][predicate]) {
                        self.st.push({
                            active: true,
                            
                            nbId: nbId,
                            annId: annId,
                            sub: subject,

                            pred: predicate,
                            predLabel: self.searchFor(ca['preds-'+annId], function(it) {
                                return it.uri === predicate;
                            }).label,

                            obj: annCon[subject][predicate][object].value,
                            
                            authorLabel: ca['ACAnn-'+annId].createdBy,
                            author: self.get(ca['ann-met-'+annId], 'http://purl.org/dc/elements/1.1/creator') || 'uknown author',

                            pageContextShort: ca['ACAnn-'+annId].pageContext_short,
                            pageContext: ca['ACAnn-'+annId].pageContext
                            
                            // TODO: add more stuff
                        });
                    }
                    
            self.autoUpdate();
        },
        
        toggleFilter: function(key, value) {
            var self = this,
                ob = {key: key, value: value},
                idx = self.existFilter(key, value);
            
            if (idx === -1) {
                self.filters.push(ob);
                console.log('Filter added', self.filters, ob);
            } else {
                self.filters.splice(idx, 1);
            }
            self.autoUpdate();
        },

        // Returns -1 if there's no filter, its index if it exist
        existFilter: function(key, value) {
            var self = this;
            
            for (var i in self.filters) {
                var f = self.filters[i];
                if (f.key === key && f.value === value)
                    return i;
            }
            
            return -1;
        },
        
        removeFilter: function(key, value) {
            var self = this;
            
        },
        
        searchFor: function(ar, fun) {
            for (var l=ar.length; l--;) 
                if (fun(ar[l])) return ar[l];
            return {};
        },
        
        get: function(ar, uri) {
            if (typeof(ar) === 'undefined') {
                return '';
            }
            if (uri in ar)
                if (ar[uri].length && typeof(ar[uri][0]) === 'object' && 'value' in ar[uri][0])
                    return ar[uri][0].value;
            return '';
        },
        
        autoUpdate: function() {
            var self = this;
            
            clearTimeout(self.autoUpdateTimer);
            self.autoUpdateTimer = setTimeout(function() {
                self._update();
            }, self.opts.autoUpdateTimerLength);
        },
        
        // Foreach item, if there's a filter that matches it, deactivate it
        _filter: function() {
            var self = this;
            
            // TODO: optimize this
            for (var j in self.st) {
                var item = self.st[j];
                item.active = true;

                for (var f in self.filters) {
                    var key = self.filters[f].key,
                        val = self.filters[f].value;
                
                    // When an item is deactivated, we can safely skip all other 
                    // filters for this item
                    if (item.active && item[key] === val) {
                        item.active = false;
                        break;
                    }
                    
                }
            }
            
        },
        
        _count: function() {
            var self = this;
            
            self.facetsNums = {};
            self.facetsTotals = {};
            self.activeTriplesNum = 0;
            
            for (var i in self.facetList) {
                var key = self.facetList[i];
                self.facetsNums[key] = {};
                self.facetsTotals[key] = {};
            }
            
            for (var j in self.st) {
                var item = self.st[j];
                
                if (item.active)
                    self.activeTriplesNum++;
                
                for (var i in self.facetList) {
                    var key = self.facetList[i],
                        val = item[key];

                    self._addCountTotal(key, val);

                    if (item.active) {
                        self._addCount(key, val);
                    }
                }
            }
        },

        _addCountTotal: function(key, val) {
            var self = this;
            if (val in self.facetsTotals[key]) {
                self.facetsTotals[key][val]++;
            } else {
                self.facetsTotals[key][val] = 1;
            }
        },
        
        _addCount: function(key, val) {
            var self = this;
            if (val in self.facetsNums[key]) {
                self.facetsNums[key][val]++;
            } else {
                self.facetsNums[key][val] = 1;
            }
        },
        
        _update: function() {
            var self = this;
            console.log('Update.. now!');

            self._filter();
            self._count();
            
            for (var f=self.facetList.length; f--;) {
                var key = self.facetList[f];
                self.facets[key].update();
            }
            
            self.dataTable.autoUpdate();
        }        
    });

});