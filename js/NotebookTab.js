define(["dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/request", 
        "dojo/dom-construct",
        "dojo/dom-attr",
        "dojo/on", 
        "dojo/router", 

        "dojo/text!ask/tmpl/NotebookTabTemplate.html", 
        "bootstrap/Collapse",
        "bootstrap/Dropdown",

        "ask/NotebookItemMetadata",
        "ask/NotebookItemAnnotation",
        "ask/NotebookItemAnnotationContent",
        "ask/AnnotationPredicate",
        "ask/AnnotationObject",
        
        "dijit/layout/TabContainer", 
        "dijit/layout/ContentPane", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, lang, request, domConstruct, domAttr, on, router, 
        
                notebookTabTemplate, BCollapse, BDropdown,
                
                NotebookItemMetadata, NotebookItemAnnotation, NotebookItemAnnotationContent,
                AnnotationPredicate, AnnotationObject,
                
                TabContainer, ContentPane, _WidgetBase, _TemplatedMixin) {

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
                        
                    // TODO: sanitize data[i][][].[].... if it exists ..
                    for (var nb_ann in data) {

                        var annotationId = data[nb_ann]['http://purl.org/pundit/ont/ao#id'][0].value;

                        // Annotation item
                        new NotebookItemAnnotation({
                            annotationId: annotationId
                        }).placeAt(placeAt);

                        // Given the annotation ID, get the content
                        self.loadAnnotationContent({
                            annotationId: annotationId,
                            createdBy: data[nb_ann]['http://purl.org/dc/elements/1.1/creator'][0].value,
                            createdAt: data[nb_ann]['http://purl.org/dc/terms/created'][0].value,
                            pageContext: data[nb_ann]['http://purl.org/pundit/ont/ao#hasPageContext'][0].value
                        });

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
            
        }, // loadNotebookAnnotations()

        // Will build the main annotation content:
        // grouped by annotation id, grouped by subject, grouped by predicate
        loadAnnotationContent: function(annotationMeta) {
            var self = this,
                def, url,
                annotationId = annotationMeta.annotationId;
                
            // Use authenticated API if we're owning the notebook
            if (self.isOwner) {
                def = ASK.requester;
                url = lang.replace(ASK.ns.asAnnGraph, { id: annotationId });
            } else {
                def = request;
                url = lang.replace(ASK.ns.asOpenAnnGraph, { id: annotationId });
            }

            self.itemsURIs[annotationId] = [];
            
            def.get(url, {
                handleAs: "json",
                headers: { "Accept": "application/json" }
            }).then(
                function(data){

                    for (var subject in data) {
                                                
                        var ann = new NotebookItemAnnotationContent({
                            createdBy: annotationMeta.createdBy,
                            createdAt: annotationMeta.createdAt,
                            pageContext: annotationMeta.pageContext,
                            subject: subject,
                            annotationId: annotationId
                        }).placeAt(dojo.query('.askNotebookItemAnnotation.annotation-'+annotationId+' .askNotebookItemAnnotationContent')[0]);
                        
                        if (dojo.indexOf(self.itemsURIs[annotationId], subject) === -1) 
                            self.itemsURIs[annotationId].push(subject);
                        
                        for (var predicate in data[subject]) {
                            
                            var pre = new AnnotationPredicate({
                                annotationId: annotationId,
                                subject_enc: BASE64.encode(subject),
                                uri: predicate,
                                objects_num: data[subject][predicate].length
                            }).placeAt(dojo.query('.annotation-'+annotationId+' [about="insert-predicate-'+annotationId+'-'+BASE64.encode(subject)+'"]')[0]);

                            if (dojo.indexOf(self.itemsURIs[annotationId], predicate) === -1)
                                self.itemsURIs[annotationId].push(predicate);

                            for (var object in data[subject][predicate]) {

                                var object_value = data[subject][predicate][object].value;
                                
                                var pre = new AnnotationObject({
                                    annotationId: annotationId,
                                    object_uri: object,
                                    object_value: object_value,
                                    object_uri_enc: BASE64.encode(object_value)
                                }).placeAt(dojo.query('.annotation-'+annotationId+' [about="insert-object-'+annotationId+'-'+BASE64.encode(subject)+'-'+BASE64.encode(predicate)+'"]')[0]);
                                
                                if (dojo.indexOf(self.itemsURIs[annotationId], object_value) === -1)
                                    if (data[subject][predicate][object].type === "uri")
                                        self.itemsURIs[annotationId].push(object_value);

                            } // for object in data[subject][predicate]
                        } // for predicate in data[subject]
                    } // for subject and data
                    
                    // Once we have the triples, get the item descriptions
                    self.loadAnnotationItems(annotationId);
                    
                }, 
                function(error) {
                    console.log('error :|');
                }
            ); // then
            
        }, // loadAnnotationContent()

        // As we get informations for the items, we will build their
        // widget guessing their type, replacing the placeholders
        loadAnnotationItems: function(annotationId) {
            var self = this,
                def, url;
                
            // Use authenticated API if we're owning the notebook
            if (self.isOwner) {
                def = ASK.requester;
                url = lang.replace(ASK.ns.asAnnItems, { id: annotationId });
            } else {
                def = request;
                url = lang.replace(ASK.ns.asOpenAnnItems, { id: annotationId });
            }
            
            def.get(url, {
                handleAs: "json",
                headers: { "Accept": "application/json" }
            }).then(
                function(data){
                                        
                    // TODO: use a namespace helper or something smarter!
                    var _type = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                        _tf = "http://purl.org/pundit/ont/ao#text-fragment",
                        _prop = "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property",
                        _lab = "http://www.w3.org/2000/01/rdf-schema#label",
                        _desc = "http://purl.org/dc/elements/1.1/description",
                        _depic = "http://xmlns.com/foaf/0.1/depiction";
                    
                    // Look for items starting from itemsURIs
                    for (var current in self.itemsURIs[annotationId]) {
                        
                        var uri = self.itemsURIs[annotationId][current];
                        
                        if (uri in data) {
                            
                            if (_type in data[uri]) {
                                
                                var uri_enc = BASE64.encode(uri),
                                    label = data[uri][_lab][0].value,
                                    label_short = label.length > 50 ? label.substr(0, self.titleChars)+' ..' : label,
                                    desc = "",
                                    depic = (_depic in data[uri]) ? data[uri][_depic][0].value : '';
                                    
                                if (typeof(data[uri][_desc]) !== "undefined")
                                    desc = data[uri][_desc][0].value;

                                // First step: put the titles
                                dojo.query('.annotation-'+annotationId+' [data-replace-me-as-title="'+uri_enc+'"]')
                                    .forEach(function(__e) {
                                        dojo.query(__e).empty().innerHTML(label_short);
                                    });

                                dojo.query('.annotation-'+annotationId+' [data-replace-me-as-subject="'+uri_enc+'"]')
                                    .forEach(function(__e) {
                                        dojo.query(__e).empty().innerHTML(desc);
                                    });

                                dojo.query('.annotation-'+annotationId+' [data-replace-me-as-predicate="'+uri_enc+'"]')
                                    .forEach(function(__e) {
                                        var num = domAttr.get(__e, 'data-objects-num'),
                                            content = num > 1 ? label + ' ('+num+')' : label;
                                        dojo.query(__e).empty().innerHTML(content);
                                    });

                                // TODO : create a new template and use it to render an item with a bit more
                                // details .. 
                                dojo.query('.annotation-'+annotationId+' [data-replace-me-as-object="'+uri_enc+'"]')
                                    .forEach(function(__e) {
                                        var content = "<h3>" + label + "</h3>";
                                        content += depic !== '' ? "<img src='"+depic+"'>" : '';
                                        content += desc !== "" ? desc : "";
                                        content += "<br/><a href='"+uri+"'>More info<i class='icon-share'></i></a>";
                                        dojo.query(__e).empty().innerHTML(content);
                                    });
                                
                            } else {
                                console.log('ERROR? No type: this should NOT happen.');
                            }
                            
                        } else { // if uri in data 
                            console.log('ERROR? Uri not in data __'+ uri +'__', data, typeof(data[uri]), typeof(uri));
                        }
                       
                    } // for i in self.itemsURIs
                    
                }, 
                function(error) {
                    console.log('error :|');
                }
            );
            
        } // loadAnnotationItems()
        
	});

});