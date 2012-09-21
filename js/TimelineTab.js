define(["dojo/_base/declare", 
        "dojo/request", 
        "dojo/dom-construct",
        "dojo/dom-attr",
        "dojo/on", 
        "dojo/router", 

        "dojo/text!ask/tmpl/TimelineTabTemplate.html", 
        
        "dijit/layout/TabContainer", 
        "dijit/layout/ContentPane", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, request, domConstruct, domAttr, on, router, 
        
                timelineTabTemplate, 
                
                TabContainer, ContentPane, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.TimelineTab", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        name: '',
        notebookRawData: {
            items: {},
            triples: {}
        },
        templateString: timelineTabTemplate,
        constructor: function() {
            this.inherited(arguments);
        },
        postMixInProperties: function() {
            this.inherited(arguments);
            this.name = this.notebookId;
        },
        startup: function() {
            var self = this;
            self.inherited(arguments);

            // place the tab button
            var b = "<li><a href='#/timeline/"+this.notebookId+"'" +
                    "' data-toggle='tab' id='tab-time-"+self.notebookId+
                    "'>T: "+this.name+"</a></li>";

            dojo.place(b, "ask-pills");

            // self.loadNotebookMetadata();
            self.loadNotebookAnnotations();
            
            on(dojo.query('#tab-time-'+self.notebookId), 'show', function(e) {
                console.log('Timeline on show', self.notebookId);
                dojo.query('#ask-tab-content .tab-pane').removeClass('active');
                dojo.query('#timeline-tab-'+self.notebookId).addClass('active');
            });
            
     
            // Close tab button: removes pill + tab content, unregistering
            // the dojo's widgets
            on(dojo.byId('time-tab-close-'+ self.notebookId), 'click', function(e) {

                router.go('/notebooks/');

                var node = dojo.query('#timeline-tab-'+self.notebookId)[0];

                dijit.registry.forEach(function(w) { 
                    if (w.id === 'timeline-tab-'+self.notebookId) 
                        w.destroyRecursive();
                });

                dojo.destroy(dojo.query('#tab-time-'+self.notebookId)[0].parentNode);
                dojo.destroy(node);
                
            });
     
        }, // startup
        
        /*
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
        */
        
        loadNotebookAnnotations: function() {
            var self = this;
            
            request.get("http://metasound.dibet.univpm.it:8080/annotationserver/api/open/notebooks/"+ self.notebookId, {
                handleAs: "json"
            }).then(
                function(data){
                        
                    // TODO: sanitize data[i][][].[].... if it exists ..
                    for (var nb_ann in data) {

                        var annotationId = data[nb_ann]['http://purl.org/pundit/ont/ao#id'][0].value;
                        
                        /*
                        // Annotation item
                        new NotebookItemAnnotation({
                            annotationId: annotationId
                        }).placeAt(dojo.query('#notebook-tab-'+self.notebookId+' .ask-notebook-item-annotations')[0]);
                        */

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
                    console.log('error :|');
                }
            ); // then
            
        }, // loadNotebookAnnotations()

        // Will build the main annotation content:
        // grouped by annotation id, grouped by subject, grouped by predicate
        loadAnnotationContent: function(annotationMeta) {
            var self = this,
                annotationId = annotationMeta.annotationId;

            self.itemsURIs[annotationId] = [];
            
            request.get("http://metasound.dibet.univpm.it:8080/annotationserver/api/open/annotations/"+ annotationId +"/content", {
                handleAs: "json"
            }).then(
                function(data){

                    for (var subject in data) {
                        
                        // Save content for later visualization of this notebook
                        if (typeof(self.notebookRawData.triples[subject]) === 'undefined') 
                            self.notebookRawData.triples[subject] = {};

                        /*
                        var ann = new NotebookItemAnnotationContent({
                            createdBy: annotationMeta.createdBy,
                            createdAt: annotationMeta.createdAt,
                            pageContext: annotationMeta.pageContext,
                            subject: subject,
                            annotationId: annotationId
                        }).placeAt(dojo.query('.askNotebookItemAnnotation.annotation-'+annotationId+' .askNotebookItemAnnotationContent')[0]);
                        
                        if (dojo.indexOf(self.itemsURIs[annotationId], subject) === -1) 
                            self.itemsURIs[annotationId].push(subject);
                        */
                        
                        for (var predicate in data[subject]) {

                            // Save content for later visualization of this notebook
                            if (typeof(self.notebookRawData.triples[subject][predicate]) === 'undefined') 
                                self.notebookRawData.triples[subject][predicate] = [];
                            
                            /*
                            var pre = new AnnotationPredicate({
                                annotationId: annotationId,
                                subject_enc: BASE64.encode(subject),
                                uri: predicate,
                                objects_num: data[subject][predicate].length
                            }).placeAt(dojo.query('.annotation-'+annotationId+' [about="insert-predicate-'+annotationId+'-'+BASE64.encode(subject)+'"]')[0]);

                            if (dojo.indexOf(self.itemsURIs[annotationId], predicate) === -1) 
                                self.itemsURIs[annotationId].push(predicate);
                            */
                                                            
                            for (var object in data[subject][predicate]) {

                                self.notebookRawData.triples[subject][predicate].push(data[subject][predicate][object]);
                                
                                /*
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
                                */
                                
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
            var self = this;
            
            request.get("http://metasound.dibet.univpm.it:8080/annotationserver/api/open/annotations/"+ annotationId +"/items", {
                handleAs: "json"
            }).then(
                function(data){
                                        
                    // Saving items for later visualizations
                    for (var j in data) {
                        if (typeof(self.notebookRawData.items[j]) === "undefined")
                            self.notebookRawData.items[j] = data[j];
                    }
                    
                    /*
                    // TODO: use a namespace helper or something smarter!
                    var _type = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                        _tf = "http://purl.org/pundit/ont/ao#text-fragment",
                        _prop = "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property",
                        _lab = "http://www.w3.org/2000/01/rdf-schema#label",
                        _desc = "http://purl.org/dc/elements/1.1/description";
                    
                    // Look for items starting from itemsURIs
                    for (var current in self.itemsURIs[annotationId]) {
                        
                        var uri = self.itemsURIs[annotationId][current];
                        
                        if (uri in data) {
                            
                            if (_type in data[uri]) {
                                
                                var uri_enc = BASE64.encode(uri),
                                    label = data[uri][_lab][0].value,
                                    label_short = label.length > 50 ? label.substr(0, self.titleChars)+' ..' : label,
                                    desc = "";
                                    
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
                                        var content = label + (desc !== "" ? "<br/><br/>"+desc : "");
                                        content += "<br/><a href='"+uri+"'>More info ..</a>";
                                        dojo.query(__e).empty().innerHTML(content);
                                    });
                                
                            } else {
                                console.log('ERROR? No type: this should NOT happen.');
                            }
                            
                            
                        } else { // if uri in data 
                            console.log('ERROR? Uri not in data __'+ uri +'__', data, typeof(data[uri]), typeof(uri));
                        }
                       
                    } // for i in self.itemsURIs
                    */
                    console.log('final items ', self.notebookRawData.items);
                    
                }, 
                function(error) {
                    console.log('error :|');
                }
            );
            
        } // loadAnnotationItems()
        
	});

});