define(["dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/request", 
        "dojo/query",
        "dojo/dom-construct",
        "dojo/dom-attr",
        "dojo/dom-style",
        "dojo/on", 
        "dojo/router", 
        "bootstrap/Collapse",
        "bootstrap/Dropdown",
        "dojo/text!ask/tmpl/NotebookTabTemplate.html", 
        "ask/NotebookItemMetadata",
        "ask/ac/ACAnnotation",
        "dijit/layout/TabContainer", 
        "dijit/layout/ContentPane", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(
        declare, lang, request, query, domConstruct, domAttr, domStyle, on, router, 
        BCollapse, BDropdown,
        notebookTabTemplate, NotebookItemMetadata, ACAnnotation,
        TabContainer, ContentPane, _WidgetBase, _TemplatedMixin
    ) {

    return declare("ask.NotebookTab", [_WidgetBase, _TemplatedMixin], {
        parentTabContainer: '',
        notebookId: '',
        itemsURIs: [],
        renderedItemsURIs: [],
        label: '',
        isOwner: false,
        canEdit: false,
        templateString: notebookTabTemplate,
        // number of chars to display in the title of the annotation
        titleChars: 50,
        
        opts: {
            minRequests: 45,
            maxRequests: 50,
            startingDelay: 25,
            delayInc: 200
        },
        constructor: function() {
            this.inherited(arguments);
        },
        startup: function() {
            var self = this;
            self.inherited(arguments);

            // place the tab button
            var own = self.isOwner,
                b = "<li>"+
                    "<span class='close' id='nb-tab-close-"+self.notebookId+"'><i class='icon-remove'></i></span>"+
                    "<a data-target='notebook-tab-"+self.notebookId+"' href='#/"+ (own ? "myN" : "n") +"otebooks/"+self.notebookId+
                    "' data-toggle='tab' id='tab-"+self.notebookId+"'>"+
                    "<div class='progress progress-striped active'><div class='bar' style='width: 1%;'></div></div>"+
                    "</li>";
            domConstruct.place(b, "ask-pills");

            on(dojo.query('#tab-'+self.notebookId), 'show', function(e) {
                dojo.query('#ask-tab-content .tab-pane').removeClass('active');
                dojo.query('#notebook-tab-'+self.notebookId).addClass('active');
            });

            ASK._cache.notebooks.push(self.notebookId);

            self.progressCounter = 0;
            self.progressTotal = -1;
            self.progressLoading = 0;

            self.loadNotebookMetadata();
            self.loadNotebookAnnotations();

            // Close tab button: removes pill + tab content, unregistering
            // the dojo's widgets
            on(dojo.query('#nb-tab-close-'+ self.notebookId)[0], 'click', function(e) {
                router.go('/notebooks/');

                var node = dojo.query('#notebook-tab-'+self.notebookId)[0];

                // DEBUG: is this thing right?
                dijit.registry.remove('notebook-tab-'+self.notebookId);

                domConstruct.destroy(dojo.query('#tab-'+self.notebookId)[0].parentNode);
                domConstruct.destroy(node);
            });
            
        }, // startup
        
        loadNotebookMetadata: function() {
            var self = this,
                def, url,
                placeAt = dojo.query('#notebook-tab-'+self.notebookId+' .ask-notebook-item-metadata')[0];

            // Use authenticated API if we're owning the notebook
            if (self.isOwner) {
                def = ASK.requester;
                url = lang.replace(ASK.ns.asNotebooksMeta, { id: self.notebookId });
            } else {
                def = request;
                url = lang.replace(ASK.ns.asOpenNotebooksMeta, { id: self.notebookId });
            }
            
            // TODO: loading meta, loading annotations
            self.updateProgress('Downloading notebook metadata..');
            
            def.get(url, {
                url: url,
                handleAs: "json",
                headers: { "Accept": "application/json" },
            }).then(
                function(data){
                                        
                    for (var ann in data) {
                        
                        var cache = ASK._cache['nb-'+self.notebookId];
                        cache.meta = data[ann];
                        
                        var createdBy, createdAt, label, includes = data[ann]['http://purl.org/pundit/ont/ao#includes'] || 0;
                        
                        if (ASK.ns.notebooks.creatorName in data[ann])
                            createdBy = data[ann][ASK.ns.notebooks.creatorName][0].value;
                        else
                            createdBy = "Unknown author";

                        if (ASK.ns.notebooks.created in data[ann])
                            createdAt = data[ann][ASK.ns.notebooks.created][0].value;
                        else
                            createdAt = "Unknown date";

                        if (ASK.ns.rdfs_label in data[ann])
                            label = data[ann][ASK.ns.rdfs_label][0].value;
                        else
                            label = "Unknown title";
                            
                        self.progressTotal = includes.length;
                            
                        cache['NBItemMeta'] = new NotebookItemMetadata({
                            visibility: data[ann]['http://open.vocab.org/terms/visibility'][0].value,
                            createdBy: createdBy,
                            createdAt: createdAt,
                            label: label,
                            includes: includes
                        }).placeAt(placeAt);

                        self.label = label;
                        dojo.query('#nb-header-'+self.notebookId).innerHTML(self.label);
                    }

                },
                function(error) {
                    
                    // Deal with common errors
                    // TODO: refactor this in a support method same for all ? 
                    if (("response" in error) && ("status" in error.response)) {
                        if (error.response.status === ASK.requester.HTTP_ERROR_FORBIDDEN) 
                            ASK.placeErrorAt("FORBIDDEN", "You don't have the permission to read this notebook's metadata", placeAt);

                        if (error.response.status === ASK.requester.HTTP_CONNECTION_ERROR) 
                            ASK.placeErrorAt("CONNECTION ERROR", "Something is wrong, check your internet connection.", placeAt);
                    }

                    console.log('Some error annotation meta :|', error);
                }
            ); // then
            
        },
        
        loadNotebookAnnotations: function() {
            var self = this,
                def, url,
                placeAt = dojo.query('#notebook-tab-'+self.notebookId+' .ask-notebook-item-annotations')[0];

            // Use authenticated API if we're owning the notebook
            if (self.isOwner) {
                def = ASK.requester;
                url = lang.replace(ASK.ns.asNbAnnList, { id: self.notebookId });
            } else {
                def = request;
                url = lang.replace(ASK.ns.asOpenNbAnnList, { id: self.notebookId });
            }
            
            def.get(url, {
                handleAs: "json",
                headers: { "Accept": "application/json" }
            }).then(
                function(data, a, b){

                    var cache = ASK._cache['nb-'+self.notebookId];
                    cache.annotations = [];
                    cache.annToLoad = [];
                        
                    // Empty notebook
                    if (typeof(data) === "string" && data === "") {
                        console.log('?? EMPTY Notebook ??!!1!');
                        self.progressTotal = 0;
                        self.updateProgress();
                    }
                    
                    for (var nb_ann in data) {
                        
                        // TODO: cycle over this (possibly) HUGE response with a worker
                        var annotationId = data[nb_ann]['http://purl.org/pundit/ont/ao#id'][0].value;
                        
                        cache.annotations.push(nb_ann);
                        cache.annToLoad.push(annotationId);
                        
                        cache['ann-met-'+annotationId] = data[nb_ann];
                        self.currentDelay = self.opts.startingDelay;
                    
                    } // for
                    
                    self.progressTotal = cache.annToLoad.length;
                    domStyle.set(query('#notebook-tab-'+self.notebookId+' .ask-notebook-item-annotations')[0], 'display', 'none');
                    self.loadNext();
                }, 
                function(error) {
                    if (("response" in error) && ("status" in error.response)) {
                        if (error.response.status === ASK.requester.HTTP_ERROR_FORBIDDEN) 
                            ASK.placeErrorAt("FORBIDDEN", "You don't have the permission to read this notebook's annotations", placeAt);

                        if (error.response.status === ASK.requester.HTTP_CONNECTION_ERROR) 
                            ASK.placeErrorAt("CONNECTION ERROR", "Something is wrong, check your internet connection.", placeAt);
                    }
                    
                    console.log('Some error annotation list :|', error);
                }
            ); // then
            
        }, // loadNotebookAnnotations()
                
        loadNext: function() {
            var self = this,
                toLoad = ASK._cache['nb-'+self.notebookId].annToLoad;
            
            if (toLoad.length === 0) {
                // console.log('All of them started, yay');
                return;
            }
            
            var id = toLoad.pop(),
                data = ASK._cache['nb-'+self.notebookId]['ann-met-'+id],
                current = self.progressLoading - self.progressCounter;
            
            if (current > self.opts.maxRequests) {
                self.currentDelay += self.opts.delayInc;
                console.log('SLOWED DOWN ', id, self.currentDelay, current, toLoad.length+ " left");
            } else if (current < self.opts.minRequests && self.currentDelay >= self.opts.startingDelay + self.opts.delayInc) {
                self.currentDelay = Math.max(self.opts.startingDelay, self.currentDelay - 2*self.opts.delayInc);
                console.log('SPEEDED UP ', id, self.currentDelay, current, toLoad.length+ " left");
            } else {
                console.log('Loading next at current pace', id, self.currentDelay, current, toLoad.length+ " left");
            }
            
            setTimeout(function() {
                self.loadAnnotation(data);
                self.loadNext();
            }, self.currentDelay);

        },
        
        updateProgress: function(m) {
            var self = this,
                perc = parseInt(self.progressCounter*100/self.progressTotal, 10) || 0,
                tabBar = query('#tab-'+self.notebookId+' .progress .bar')[0];

            domStyle.set(query('.progress-'+self.notebookId+' .progress .bar')[0], 'width', perc+"%");
            if (tabBar)
                domStyle.set(tabBar, 'width', perc+"%");
            query('.progress-'+self.notebookId+' .progress-percentage').innerHTML(perc+'% '+m);

            if ((self.progressTotal > 0 && self.progressCounter === self.progressTotal) || (self.progressTotal === 0 && self.progressCounter === 0)) {
                
                console.log('Update progress is done!', self.progressTotal, self.progressCounter);
                
                domStyle.set(query('.progress-'+self.notebookId)[0], 'display', 'none');
                domStyle.set(query('#notebook-tab-'+self.notebookId+' .ask-notebook-item-annotations')[0], 'display', 'block');
                domStyle.set(query('.ask-notebook-more-buttons', self.domNode)[0], 'display', 'block');

                setTimeout(function() {
                    dojo.query('#tab-'+self.notebookId).innerHTML("<i class='icon-book'></i> " + self.label);
                }, 2000);
            }

        }, // updateProgress()
        
        
        loadAnnotation: function(data) {
            var self = this,
                annotationId = data['http://purl.org/pundit/ont/ao#id'][0].value,
                createdAt = data['http://purl.org/dc/terms/created'][0].value,
                pageContext,
                createdBy = data['http://purl.org/dc/elements/1.1/creator'][0].value,
                cache = ASK._cache['nb-'+self.notebookId],
                placeAt = dojo.query('#notebook-tab-'+self.notebookId+' .ask-notebook-item-annotations')[0];

            if ('http://purl.org/pundit/ont/ao#hasPageContext' in data)
                pageContext = data['http://purl.org/pundit/ont/ao#hasPageContext'][0].value;
            else
                pageContext = "http://No.PageContext.error";

            self.progressLoading++;
            
            // Annotation item
            cache['ACAnn-'+annotationId] = new ACAnnotation({
                notebookId: self.notebookId,
                annotationId: annotationId,
                createdBy: createdBy,
                createdAt: createdAt,
                pageContext: pageContext,
                isOwner: self.isOwner
            }).placeAt(placeAt);
            
        }
        
    });

});