define(["dojo/_base/declare", 
        "dojo/request", 
        "dojo/dom-construct",
        "dojo/on", 
        "dojo/router", 
        "dojo/text!ask/tmpl/NotebookTabTemplate.html", 
        "ask/NotebookItemMetadata",
        "ask/NotebookItemAnnotation",
        "ask/NotebookItemAnnotationContent",
        "ask/NotebookItemAnnotationTarget",

        "ask/AnnotationPredicate",
        "ask/AnnotationObject",
        "ask/AnnotationItemTextFragment",
        "ask/AnnotationItemGeneric",
        "ask/AnnotationItemPredicate",
        
        "dijit/layout/TabContainer", 
        "dijit/layout/ContentPane", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, request, domConstruct, on, router,
                notebookTabTemplate, NotebookItemMetadata, NotebookItemAnnotation, 
                NotebookItemAnnotationContent, NotebookItemAnnotationTarget, 
                AnnotationPredicate, AnnotationObject, nnotationItemTextFragment, AnnotationItemGeneric, AnnotationItemPredicate,
                TabContainer, ContentPane, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.NotebookTab", [_WidgetBase, _TemplatedMixin], {
        parentTabContainer: '',
        notebookId: '',
        itemsURIs: [],
        renderedItemsURIs: [],
        label: '',
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
            var b = "<li><a href='#notebook-tab-"+this.notebookId+
                    "' data-toggle='tab' id='tab-"+this.notebookId+
                    "'>N: "+this.notebookId+"</a></li>";
            dojo.place(b, "ask-pills");

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
            var self = this;

            request.get("http://metasound.dibet.univpm.it:8080/annotationserver/api/open/notebooks/"+ self.notebookId +"/metadata", {
                handleAs: "json"
            }).then(
                function(data){
                    for (var ann in data) {
                        var foo = new NotebookItemMetadata({
                            visibility: data[ann]['http://open.vocab.org/terms/visibility'][0].value,
                            createdBy: data[ann]['http://purl.org/dc/terms/creator'][0].value,
                            createdAt: data[ann]['http://purl.org/dc/terms/created'][0].value,
                            label: data[ann]['http://www.w3.org/2000/01/rdf-schema#label'][0].value,
                            includes: data[ann]['http://purl.org/pundit/ont/ao#includes'] || 0
                        });
                        foo.placeAt(dojo.query('#notebook-tab-'+self.notebookId+' .ask-notebook-item-metadata')[0]);

                        self.label = data[ann]['http://www.w3.org/2000/01/rdf-schema#label'][0].value;
                        dojo.query('#nb-header-'+self.notebookId).innerHTML(self.label);
                        dojo.query('#tab-'+self.notebookId).innerHTML("N: "+ self.label);
                    }

                }, 
                function(error) {
                    console.log('error :|');
                }
            ); // then
        },
        
        loadNotebookAnnotations: function() {
            var self = this;
            
            request.get("http://metasound.dibet.univpm.it:8080/annotationserver/api/open/notebooks/"+ self.notebookId, {
                handleAs: "json"
            }).then(
                function(data){
                        
                    // TODO: sanitize data[i][][].[].... if it exists ..
                    for (var nb_ann in data) {

                        var body = data[nb_ann]['http://www.openannotation.org/ns/hasBody'][0].value,
                            targets = data[nb_ann]['http://www.openannotation.org/ns/hasTarget'],
                            annotationId = data[nb_ann]['http://purl.org/pundit/ont/ao#id'][0].value, 
                            meta, tar;

                        // Annotation item
                        meta = new NotebookItemAnnotation({
                            annotationId: annotationId,
                            createdBy: data[nb_ann]['http://purl.org/dc/terms/creator'][0].value,
                            createdAt: data[nb_ann]['http://purl.org/dc/terms/created'][0].value,
                            pageContext: data[nb_ann]['http://purl.org/pundit/ont/ao#hasPageContext'][0].value,
                            body: body
                        }).placeAt(dojo.query('#notebook-tab-'+self.notebookId+' .ask-notebook-item-annotations')[0]);

                        // Given the annotation ID, get the content
                        self.loadAnnotationContent(annotationId);
                        
                        // Lay down the targets of this annotation
                        // TODO: put this somewhere else in the future?
                        /*
                        for (var t in targets) {
                            tar = new NotebookItemAnnotationTarget({
                                uri: targets[t].value
                            }).placeAt(dojo.query('.askNotebookItemAnnotation.annotation-'+annotationId+' .askNotebookItemAnnotationTarget')[0]);
                        }
                        */
                        
                    } // for

                }, 
                function(error) {
                    console.log('error :|');
                }
            ); // then
            
        }, // loadNotebookAnnotations()

        // Will build the main annotation content:
        // grouped by annotation id, grouped by subject, grouped by predicate
        loadAnnotationContent: function(annotationId) {
            var self = this;

            // if (annotationId !== "85354f2b") return;

            self.itemsURIs[annotationId] = [];
            
            request.get("http://metasound.dibet.univpm.it:8080/annotationserver/api/open/annotations/"+ annotationId +"/content", {
                handleAs: "json"
            }).then(
                function(data){

                    console.log('@@@@@@@ ', annotationId);
                    
                    for (var subject in data) {
                        
                        console.log('sub ', subject);
                        
                        var ann = new NotebookItemAnnotationContent({
                            subject: subject,
                            annotationId: annotationId
                        }).placeAt(dojo.query('.askNotebookItemAnnotation.annotation-'+annotationId+' .askNotebookItemAnnotationContent')[0]);
                        
                        if (dojo.indexOf(self.itemsURIs[annotationId], subject) === -1) 
                            self.itemsURIs[annotationId].push(subject);
                        
                        for (var predicate in data[subject]) {
                            
                            console.log('pred: ', predicate);
                            
                            var pre = new AnnotationPredicate({
                                annotationId: annotationId,
                                subject_enc: BASE64.encode(subject),
                                uri: predicate
                            }).placeAt(dojo.query('.annotation-'+annotationId+' [about="insert-predicate-'+annotationId+'-'+BASE64.encode(subject)+'"]')[0]);

                            if (dojo.indexOf(self.itemsURIs[annotationId], predicate) === -1) 
                                self.itemsURIs[annotationId].push(predicate);
                                                            
                            for (var object in data[subject][predicate]) {

                                var object_value = data[subject][predicate][object].value;
                                
                                var pre = new AnnotationObject({
                                    annotationId: annotationId,
                                    object_uri: object,
                                    object_value: object_value
                                }).placeAt(dojo.query('.annotation-'+annotationId+' [about="insert-object-'+annotationId+'-'+BASE64.encode(subject)+'-'+BASE64.encode(predicate)+'"]')[0]);
                                
                                if (dojo.indexOf(self.itemsURIs[annotationId], object_value) === -1)
                                    if (data[subject][predicate][object].type === "uri")
                                        self.itemsURIs[annotationId].push(object_value);
                            }
                        }
                    }
                    
                    console.log('@@@@@@@ ///////////////////////', annotationId);

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
            var self = this;
            
            console.log('IIIIIIIIIIIIIIIII ', annotationId);
            
            request.get("http://metasound.dibet.univpm.it:8080/annotationserver/api/open/annotations/"+ annotationId +"/items", {
                handleAs: "json"
            }).then(
                function(data){
                    
                    console.log('RRRRRRRRRRRRRRRRRRRRRRRRRRR ', annotationId);
                    
                    // TODO: use a namespace helper or something smarter!
                    var _type = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                        _tf = "http://purl.org/pundit/ont/ao#text-fragment",
                        _prop = "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property",
                        _lab = "http://www.w3.org/2000/01/rdf-schema#label",
                        _desc = "http://purl.org/dc/elements/1.1/description";
                    
                        if (annotationId === "dbd8b735")
                            console.log("òòòòòòòòòòòòòòòòòòòòòòòò ", data, self.itemsURIs[annotationId], self.itemsURIs[annotationId].length);
                    
                    // Look for items starting from itemsURIs
                    for (var current in self.itemsURIs[annotationId]) {
                        
                        var uri = self.itemsURIs[annotationId][current];

                        // This function will get called n times, but as soon as we render an
                        // item we can forget about it and avoid rendering it twice or more
                        //if (dojo.indexOf(self.renderedItemsURIs, annotationId+"-"+uri) !== -1) {
                        //    console.log('ALREADY SEEN SEEN ', uri);
                        //    continue;
                        //}
                        
                        if (uri in data) {

                            console.log('FOUND ITEMz: ', uri);
                            
                            if (_type in data[uri]) {
                                
                                var uri_enc = BASE64.encode(uri),
                                    label = data[uri][_lab][0].value,
                                    label_short = label.length > 50 ? label.substr(0, self.titleChars)+' ..' : label,
                                    desc = "";
                                    
                                if (typeof(data[uri][_desc]) !== "undefined")
                                    desc = data[uri][_desc][0].value;

                                // First step: put the titles
                                dojo.query('.annotation-'+annotationId+' [data-replace-me-title="'+uri_enc+'"]')
                                    .forEach(function(__e) {
                                        console.log('Rimpiazzo short ', label_short);
                                        dojo.query(__e).empty().innerHTML(label_short);
                                    });

                                dojo.query('.annotation-'+annotationId+' [data-replace-me="'+uri_enc+'"]')
                                    .forEach(function(__e) {
                                        console.log('Rimpiazzo LONG', desc);
                                        dojo.query(__e).empty().innerHTML(desc);
                                    });
                                
                            } else {
                                alert('omagad no type');
                            }
                            
                            
                        } else { // if uri in data 
                            console.log('uri not in data __'+ uri +'__', data, typeof(data[uri]), typeof(uri));
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