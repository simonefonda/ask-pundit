define(["dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/request", 
        "dojo/dom-construct",
        "dojo/dom-attr",
        "dojo/on", 
        "dojo/router", 
        "bootstrap/Collapse",
        "bootstrap/Dropdown",
        "dojo/text!ask/tmpl/NotebookTabTemplate.html", 
        "ask/NotebookItemMetadata",
        "ask/ACAnnotation",
        "dijit/layout/TabContainer", 
        "dijit/layout/ContentPane", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(
        declare, lang, request, domConstruct, domAttr, on, router, 
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
        constructor: function() {
            this.inherited(arguments);
        },
        startup: function() {
            var self = this;
            self.inherited(arguments);

            // place the tab button
            var own = self.isOwner,
                b = "<li><a href='#/"+ (self.isOwner ? "myN" : "n") +"otebooks/"+this.notebookId+
                    "' data-toggle='tab' id='tab-"+this.notebookId+
                    "'>"+ (self.isOwner ? "My N" : "N") +": "+this.notebookId+"</a></li>";
            dojo.place(b, "ask-pills");

            on(dojo.query('#tab-'+self.notebookId), 'show', function(e) {
                dojo.query('#ask-tab-content .tab-pane').removeClass('active');
                dojo.query('#notebook-tab-'+self.notebookId).addClass('active');
            });

            if (self.canEdit) {
                console.log('OMG CAN EDIT OMG OMG OMG');
                
                // TODO: check with the auth api if GET /notebooks/owned answers
                // that we own this notebook id, then start getting the info
                // with the new authenticated API
            }

            ASK._cache['nb-'+self.notebookId] = {};
            self.loadNotebookMetadata();
            self.loadNotebookAnnotations();
     
            // Close tab button: removes pill + tab content, unregistering
            // the dojo's widgets
            on(dojo.byId('nb-tab-close-'+ self.notebookId), 'click', function(e) {
                router.go('/notebooks/');

                var node = dojo.query('#notebook-tab-'+self.notebookId)[0];

                dijit.registry.forEach(function(w){ 
                    if (w.id === 'notebook-tab-'+self.notebookId) 
                        w.destroyRecursive();
                });

                dojo.destroy(dojo.query('#tab-'+self.notebookId)[0].parentNode);
                dojo.destroy(node);
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
            
            def.get(url, {
                url: url,
                handleAs: "json",
                headers: { "Accept": "application/json" },
            }).then(
                function(data){
                    for (var ann in data) {
                        var foo = new NotebookItemMetadata({
                            visibility: data[ann]['http://open.vocab.org/terms/visibility'][0].value,
                            createdBy: data[ann]['http://purl.org/dc/elements/1.1/creator'][0].value,
                            createdAt: data[ann]['http://purl.org/dc/terms/created'][0].value,
                            label: data[ann]['http://www.w3.org/2000/01/rdf-schema#label'][0].value,
                            includes: data[ann]['http://purl.org/pundit/ont/ao#includes'] || 0
                        });
                        foo.placeAt(placeAt);

                        self.label = data[ann]['http://www.w3.org/2000/01/rdf-schema#label'][0].value;
                        dojo.query('#nb-header-'+self.notebookId).innerHTML(self.label);
                        dojo.query('#tab-'+self.notebookId).innerHTML((self.isOwner ? "My N" : "N") +": "+ self.label);
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
                function(data){
                        
                    for (var nb_ann in data) {

                        var annotationId = data[nb_ann]['http://purl.org/pundit/ont/ao#id'][0].value;

                        ASK._cache['nb-'+self.notebookId]['ann-rdf-'+annotationId] = data[nb_ann];
                        
                        // Annotation item
                        ASK._cache['nb-'+self.notebookId]['ann-'+annotationId] = new ACAnnotation({
                            notebookId: self.notebookId,
                            annotationId: annotationId,
                            createdBy: data[nb_ann]['http://purl.org/dc/elements/1.1/creator'][0].value,
                            createdAt: data[nb_ann]['http://purl.org/dc/terms/created'][0].value,
                            pageContext: data[nb_ann]['http://purl.org/pundit/ont/ao#hasPageContext'][0].value,
                            isOwner: self.isOwner
                        }).placeAt(placeAt);
                    } // for
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
            
        } // loadNotebookAnnotations()

	});

});