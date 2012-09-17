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
        label: '',
        templateString: notebookTabTemplate,
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
                    for (var i in data) {
                        var foo = new NotebookItemMetadata({
                            visibility: data[i]['http://open.vocab.org/terms/visibility'][0].value,
                            createdBy: data[i]['http://purl.org/dc/terms/creator'][0].value,
                            createdAt: data[i]['http://purl.org/dc/terms/created'][0].value,
                            label: data[i]['http://www.w3.org/2000/01/rdf-schema#label'][0].value,
                            includes: data[i]['http://purl.org/pundit/ont/ao#includes'] || 0
                        });
                        foo.placeAt(dojo.query('#notebook-tab-'+self.notebookId+' .ask-notebook-item-metadata')[0]);

                        self.label = data[i]['http://www.w3.org/2000/01/rdf-schema#label'][0].value;
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
                    for (var i in data) {

                        var body = data[i]['http://www.openannotation.org/ns/hasBody'][0].value,
                            targets = data[i]['http://www.openannotation.org/ns/hasTarget'],
                            annotationId = data[i]['http://purl.org/pundit/ont/ao#id'][0].value, 
                            meta, tar;

                        // Annotatio item
                        meta = new NotebookItemAnnotation({
                            annotationId: annotationId,
                            createdBy: data[i]['http://purl.org/dc/terms/creator'][0].value,
                            createdAt: data[i]['http://purl.org/dc/terms/created'][0].value,
                            pageContext: data[i]['http://purl.org/pundit/ont/ao#hasPageContext'][0].value,
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

        // Will build the main annotation content 
        loadAnnotationContent: function(annotationId) {
            var self = this;
            
            request.get("http://metasound.dibet.univpm.it:8080/annotationserver/api/open/annotations/"+ annotationId +"/content", {
                handleAs: "json"
            }).then(
                function(data){
                    
                    for (var subject in data) {
                        
                        var ann = new NotebookItemAnnotationContent({
                            subject: subject,
                            annotationId: annotationId
                        }).placeAt(dojo.query('.askNotebookItemAnnotation.annotation-'+annotationId+' .askNotebookItemAnnotationContent')[0]);
                        
                        if (dojo.indexOf(self.itemsURIs, subject) === -1)
                            self.itemsURIs.push(subject);
                        
                        
                        for (var predicate in data[subject]) {
                            
                            var pre = new AnnotationPredicate({
                                annotationId: annotationId,
                                uri: predicate
                            }).placeAt(dojo.query('.annotation-'+annotationId+' [about="insert-predicate-'+annotationId+'-'+BASE64.encode(subject)+'"]')[0]);

                            if (dojo.indexOf(self.itemsURIs, predicate) === -1)
                                self.itemsURIs.push(predicate);
                                                            
                            for (var object in data[subject][predicate]) {

                                var object_value = data[subject][predicate][object].value;
                                
                                var pre = new AnnotationObject({
                                    annotationId: annotationId,
                                    object_uri: object,
                                    object_value: object_value
                                }).placeAt(dojo.query('.annotation-'+annotationId+' [about="insert-object-'+annotationId+'-'+BASE64.encode(predicate)+'"]')[0]);
                                
                                if (dojo.indexOf(self.itemsURIs, object_value) === -1)
                                    if (data[subject][predicate][object].type === "uri")
                                        self.itemsURIs.push(object_value);
                            }
                        }
                    }

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

            request.get("http://metasound.dibet.univpm.it:8080/annotationserver/api/open/annotations/"+ annotationId +"/items", {
                handleAs: "json"
            }).then(
                function(data){
                    
                    // TODO: use a namespace helper or something smarter!
                    var _type = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                        _tf = "http://purl.org/pundit/ont/ao#text-fragment",
                        _prop = "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property";

                    
                    // Look for items starting from itemsURIs
                    for (var i in self.itemsURIs) {
                        var uri = self.itemsURIs[i];
                        
                        if (uri in data) {
                            if (_type in data[uri]) {
                                
                                // Look for each container about this URI, empty it,
                                // create a proper item widget and put it in the emptied space
                                dojo.query('.askNotebookItemAnnotation.annotation-'+annotationId+' [about="'+uri+'"]')
                                .empty().forEach(function(__e) {
                                    if (data[uri][_type][0].value === _tf)
                                        new AnnotationItemTextFragment({uri: uri, data: data}).placeAt(__e);
                                    else if (data[uri][_type][0].value === _prop) 
                                        new AnnotationItemPredicate({uri: uri, data: data}).placeAt(__e);
                                    else
                                        new AnnotationItemGeneric({uri: uri, data: data}).placeAt(__e);
                                });
                                
                            } else {                        
                        
                                console.log('Found NO RDF TYPE '+ uri);
                                
                            }
                        }
                    }
                    
                }, 
                function(error) {
                    console.log('error :|');
                }
            );
            
        } // loadAnnotationItems()
        
        
	});

});