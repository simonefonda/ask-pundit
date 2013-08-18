define(["dojo/_base/declare", 
        "dojo/on", 
        "dojo/query",
        "dojo/dom-style",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-attr",
        
        "dojo/text!ask/tmpl/stats/StatsTab.html",
        "lib/mustache",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
    ],
    function(
        declare, on, query, domStyle, domClass, domConstruct, domAttr,
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
            
            // Keeping this into an array for rendering
            self.availableFacets = [
                {key: 'authorURI', label: 'Author URI', active: false },
                {key: 'authorLabel', label: 'Author', active: true },
                {key: 'nbId', label: 'Notebook', active: false },
                {key: 'annId', label: 'Annotation', active: false },
                {key: 'subURI', label: 'Subject URI', active: false },
                {key: 'subLabel', label: 'Subject', active: true },
                {key: 'subType', label: 'Subject type', active: false },
                {key: 'predURI', label: 'Predicate URI', active: false },
                {key: 'predLabel', label: 'Predicate', active: true },
                {key: 'objURI', label: 'Object URI', active: false },
                {key: 'objLabel', label: 'Object', active: true },
                {key: 'objType', label: 'Object type', active: true },
                {key: 'pageContext', label: 'Annotated Page', active: false }
            ];
            
            self._updateFacetList();
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
            query('.stats-available-facets span', self.domNode).on('dragstart', function(e) {
                self.draggedFacet = this;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', this.innerHTML);
                domClass.add(this, 'drag-dragged');
            });
            
            // Enter > Over > Drop over the containers
            var cont = query('.stats-available-facets span, .stats-active-facets, .stats-inactive-facets', self.domNode);
            // Enter > Over > Drop over another node
            cont.on('dragenter', function(e) { domClass.add(this, 'drag-enter'); });
            cont.on('dragleave', function(e) { domClass.remove(this, 'drag-enter'); });
            cont.on('dragover', function(e) {
                if (e.preventDefault) e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                return false;
            });
            cont.on('dragend', function(e) {
                cont.removeClass('drag-enter');
                query('.stats-available-facets span').removeClass('drag-enter drag-dragged');
            });
            
            // Drop on the active container
            query('.stats-active-facets, .stats-active-facets', self.domNode).on('drop', function(e) {
                var key = domAttr.get(self.draggedFacet, 'data-key');
                if (!self.isFacetActive(key)) 
                    self.toggleFacet(key)
                domConstruct.place(self.draggedFacet, this, 'last');
            });

            // Drop on the inactive container
            query('.stats-available-facets .stats-inactive-facets', self.domNode).on('drop', function(e) {
                var key = domAttr.get(self.draggedFacet, 'data-key');
                if (self.isFacetActive(key)) 
                    self.toggleFacet(key)
                domConstruct.place(self.draggedFacet, this, 'last');
            });

            // Drop on another node
            query('.stats-available-facets span', self.domNode).on('drop', function(e) {
                var key = domAttr.get(self.draggedFacet, 'data-key'),
                    targetKey = domAttr.get(this, 'data-key');

                domConstruct.place(self.draggedFacet, this, 'before');
                if (self.isFacetActive(key) !== self.isFacetActive(targetKey))
                    self.toggleFacet(key);

                e.preventDefault();
                e.stopPropagation();
                return false;
            });

        },
        
        _updateFacetList: function() {
            var self = this;
            self.facetList = [];
            for (var i in self.availableFacets) {
                var f = self.availableFacets[i];
                if (f.active)
                    self.facetList.push(f.key);
            }
        },

        isFacetActive: function(key) {
            var self = this;
            for (var i=self.availableFacets.length; i--;)
                if (self.availableFacets[i].key === key) 
                    return self.availableFacets[i].active;
        },
        
        toggleFacet: function(key) {
            var self = this;
            
            if (self.isFacetActive(key)) {
                console.log('Deactivating facet '+key)
                self.facets[key].destroy();
                delete self.facets[key];
            } else {
                console.log('Activating facet '+key)
                self.addFacet(key);
            }

            // TODO: remove all filters
            
            for (var i=self.availableFacets.length; i--;)
                if (self.availableFacets[i].key === key) {
                    self.availableFacets[i].active = !self.availableFacets[i].active;
                    break;
                }
            
            query("[data-key='"+key+"']", self.domNode).toggleClass('btn-info');
            
            self._updateFacetList();
            self.autoUpdate();
        },

        initFacets: function() {
            var self = this,
                l = self.facetList.length;
                
            for (var i=0; i<l; i++) {
                var f = self.facetList[i]; 
                self.addFacet(f);
            }
            self.filters = [];
        },
        
        addFacet: function(key) {
            var self = this,
                opts = {};

            for (var l=self.availableFacets.length; l--;)
                if (self.availableFacets[l].key === key)
                    opts = self.availableFacets[l];
            
            require(["ask/stats/Facet"], function(Facet) {
                self.facets[key] = new Facet({ key: key, label: opts.label });
                self.facets[key]
                    .placeAt(query('.stats-facets-container', self.domNode)[0])
                    .startup();
            });
        },
        
        setLayout: function(ly) {
            var self = this;
            
            domClass.remove(self.domNode, 'stats-lay-'+self.opts.layout);
            query('.stats-controls a').removeClass('btn-info');

            self.opts.layout = ly;
            query('.stats-controls a.'+ly, self.domNode).addClass('btn-info');
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
                            subURI: subject,
                            subLabel: self.searchFor(ca['subs-'+annId], function(it) {
                                return it.uri === subject;
                            }).label,
                            subType: self.searchFor(ca['subs-'+annId], function(it) {
                                return it.uri === subject;
                            }).rdfTypes,

                            predURI: predicate,
                            predLabel: self.searchFor(ca['preds-'+annId], function(it) {
                                return it.uri === predicate;
                            }).label,

                            objURI: annCon[subject][predicate][object].value,
                            objLabel: self.searchFor(ca['objs-'+annId], function(it) {
                                return it.uri === annCon[subject][predicate][object].value;
                            }).label,
                            objType: self.searchFor(ca['objs-'+annId], function(it) {
                                return it.uri === annCon[subject][predicate][object].value;
                            }).notableType,
                            
                            authorURI: self.get(ca['ann-met-'+annId], 'http://purl.org/dc/elements/1.1/creator') || 'uknown author',
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