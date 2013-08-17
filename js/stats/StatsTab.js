define(["dojo/_base/declare", 
        "dojo/on", 
        "dojo/query",
        "dojo/dom-style",
        "dojo/dom-class",
        "dojo/dom-construct",
        
        "dojo/text!ask/tmpl/stats/StatsTab.html",
        "lib/mustache",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
    ],
    function(
        declare, on, query, domStyle, domClass, domConstruct,
        template, mustache, 
        _WidgetBase, _TemplatedMixin) {


    function download(data, name) {
        var uri = 'data:text/json;charset=utf-8,' + JSON.stringify(data);
        var l = document.createElement("a");
        l.href = uri;
        l.download = name;
        document.body.appendChild(l);
        l.click();
        document.body.removeChild(l);
    };


    return declare("ask.StatsTab", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        templateString: template,
        state: 'loading',
        store: {},
        opts: {
            autoUpdateTimerLength: 500,
            layout: 'line' // one of 'line', 'side'
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
            
            self.availableFacets = [
                {key: 'nbId', label: 'Notebook ID', state: ''},
                {key: 'annId', label: 'Annotation ID', state: 'info'},
                {key: 'sub', label: 'Subject', state: ''},
                {key: 'subLabel', label: 'Subject label', state: ''},
                {key: 'subType', label: 'Subject type', state: ''},
                {key: 'pred', label: 'Predicate', state: ''},
                {key: 'predLabel', label: 'Predicate label', state: 'info'},
                {key: 'obj', label: 'Object', state: ''},
                {key: 'objLabel', label: 'Object label', state: 'info'},
                {key: 'objType', label: 'Object type', state: ''},
                {key: 'author', label: 'Author ID', state: ''},
                {key: 'authorLabel', label: 'Author label', state: ''},
                {key: 'pageContext', label: 'Annotated Page', state: ''}
            ];
            self.facetList = [
                'annId', 'predLabel', 
                'authorLabel', 'pageContext', 
                'subLabel', 'objLabel', 
                'sub', 'objType', 'subType', 'obj'
            ];
            // self.facetList = ['predLabel', 'authorLabel', 'pageContext'];
            // self.facetList = ['annId'];
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

            if (typeof(Worker) !== 'undefined') {
                self.worker = new Worker('js/stats/stats-worker.js');

                self.worker.addEventListener('message', function(e) {
                    var d = e.data;
                    switch (d.cmd) {
                        case 'update':
                            self.st = d.st;
                            self.facetsTotals = d.facetsTotals;
                            self.facetsNums = d.facetsNums;
                            self.activeTriplesNum = d.activeTriplesNum;
                            self._updateFacets();
                            break;
                    }
                }, false);
            }

            if (typeof(FIXTURES) !== 'undefined') {
                self.st = FIXTURES;
                self.autoUpdate();
            }
            self.initBehaviors();

        }, // startup()

        initBehaviors: function() {
            var self = this;

            query(self.domNode).on('.stats-exports a.all:click', function(e) {
                console.log('Exporting all data new stylaszz');
                download(self.st, 'export-all-'+self.st.length+'.json');
            });

            query(self.domNode).on('.stats-controls a.line:click', function(e) {
                self.setLayout('line');
            });
            query(self.domNode).on('.stats-controls a.side:click', function(e) {
                self.setLayout('side');
            });
            

            // Drag n drop
            query('.stats-available-facets a', self.domNode).on('drop', function(e) {
                domConstruct.place(self.draggedFacet, this, 'before');
            });

            query('.stats-available-facets a', self.domNode).on('dragstart', function(e) {
                self.draggedFacet = this;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', this.innerHTML);
                domClass.add(this, 'drag-dragged');
            });

            query('.stats-available-facets a', self.domNode).on('dragover', function(e) {
                if (e.preventDefault) {
                    e.preventDefault(); 
                }
                e.dataTransfer.dropEffect = 'move'; 
                return false;
            });
            
            query('.stats-available-facets a', self.domNode).on('dragenter', function(e) {
                domClass.add(this, 'drag-enter');
            });
            query('.stats-available-facets a', self.domNode).on('dragleave', function(e) {
                domClass.remove(this, 'drag-enter');
            });
            query('.stats-available-facets a', self.domNode).on('dragend', function(e) {
                query('.stats-available-facets a').removeClass('drag-enter drag-dragged');
            });

        },

        initFacets: function() {
            var self = this;
            
            require(["ask/stats/Facet"], function(Facet) {
                for (var l=self.facetList.length; l--;) {
                    var f = self.facetList[l]; 
                    self.facets[f] = new Facet({
                        key: f
                    }); 
                    self.facets[f].placeAt(query('.stats-facets-container', self.domNode)[0]).startup();
                }
            });
            
            self.filters = [];
            
        },
        
        setLayout: function(ly) {
            var self = this;
            
            domClass.remove(self.domNode, 'stats-lay-'+self.opts.layout);
            query('.stats-controls a').removeClass('btn-warning');

            self.opts.layout = ly;
            query('.stats-controls a.'+ly, self.domNode).addClass('btn-warning');
            domClass.add(self.domNode, 'stats-lay-'+self.opts.layout);
            self.positionFacets();
        },
        
        add: function(nbId, annId) {
            var self = this,
                ca = ASK._cache['nb-'+nbId],
                annCon = ca['ann-con-'+annId];
                
            for (var subject in annCon)
                for (var predicate in annCon[subject])
                    for (var object in annCon[subject][predicate]) {
                        self.st.push({
                            active: true,
                            
                            nbId: nbId,
                            annId: annId,
                            sub: subject,
                            subLabel: self.searchFor(ca['subs-'+annId], function(it) {
                                return it.uri === subject;
                            }).label,
                            subType: self.searchFor(ca['subs-'+annId], function(it) {
                                return it.uri === subject;
                            }).rdfTypes,

                            pred: predicate,
                            predLabel: self.searchFor(ca['preds-'+annId], function(it) {
                                return it.uri === predicate;
                            }).label,

                            obj: annCon[subject][predicate][object].value,
                            objLabel: self.searchFor(ca['objs-'+annId], function(it) {
                                return it.uri === annCon[subject][predicate][object].value;
                            }).label,
                            objType: self.searchFor(ca['objs-'+annId], function(it) {
                                return it.uri === annCon[subject][predicate][object].value;
                            }).notableType,
                            
                            author: self.get(ca['ann-met-'+annId], 'http://purl.org/dc/elements/1.1/creator') || 'uknown author',
                            authorLabel: ca['ACAnn-'+annId].createdBy,

                            pageContext: ca['ACAnn-'+annId].pageContext
                            
                            // TODO: add more stuff
                        });
                    }
                    
            self.autoUpdate(2000);
        },
        
        toggleFilter: function(key, value) {
            var self = this,
                ob = {key: key, value: value},
                idx = self.existFilter(key, value);
            
            if (idx === -1) {
                self.filters.push(ob);
            } else {
                self.filters.splice(idx, 1);
            }
            self.autoUpdate(10);
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
                
        searchFor: function(ar, fun) {
            for (var l=ar.length; l--;)
                if (fun(ar[l])) { return ar[l]; }
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
        
        autoUpdate: function(timerLength) {
            var self = this;
            
            timerLength = timerLength || self.opts.autoUpdateTimerLength;
            
            clearTimeout(self.autoUpdateTimer);
            self.autoUpdateTimer = setTimeout(function() {
                self._update();
            }, timerLength);
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
            self._count();
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
        
        _updateFacets: function() {
            var self = this;
                        
            for (var f=self.facetList.length; f--;) {
                var key = self.facetList[f];
                self.facets[key].update();
            }

            self.positionFacets();
            self.dataTable.autoUpdate();
        },
        
        positionFacets: function() {
            var self = this, 
                w = 0,
                padding = 4,
                margin = 10;
            
            for (var f=self.facetList.length; f--;) {
                var key = self.facetList[f];
                w += domStyle.get(self.facets[key].domNode, 'width') + 2*padding+2*margin;
            }

            domStyle.set(query('.stats-facets-container', self.domNode)[0], 'width', '');
            if (self.opts.layout === "line") {
                w += 4*margin;
                domStyle.set(query('.stats-facets-container', self.domNode)[0], 'width', w+'px');
            }
        },
        
        _update: function() {
            var self = this;
            console.log('Update.. now!');

            if (self.worker) {
                self.worker.postMessage({
                    cmd: 'update', 
                    st: self.st,
                    facetList: self.facetList,
                    filters: self.filters
                });
                return;
            }
            
            console.log('Updating using the browser... ');
            self._filter();
            self._count();
            self._updateFacets();
        }        
    });

});