define(["dojo/_base/declare", 
        "dojo/request", 
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/on", 
        "dojo/router", 

        "dojo/text!ask/tmpl/TimelineTabTemplate.html", 
        
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, request, domConstruct, domClass, domStyle, on, router, 
        
                timelineTabTemplate, 
                
                _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.TimelineTab", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        name: '',
        notebookRawData: {
            items: {},
            triples: {}
        },
        progressTotal: 0,
        progressCounter: 0,
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

            self.loadNotebookAnnotations();
            
            on(dojo.query('#tab-time-'+self.notebookId), 'show', function(e) {
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
        
        loadNotebookAnnotations: function() {
            var self = this;
            
            request.get("http://metasound.dibet.univpm.it:8080/annotationserver/api/open/notebooks/"+ self.notebookId, {
                handleAs: "json"
            }).then(
                function(data){
                        
                    // Given the annotation ID of each annotation, get the content
                    for (var nb_ann in data) {
                        self.progressTotal++; 
                        self.loadAnnotationContent(data[nb_ann]['http://purl.org/pundit/ont/ao#id'][0].value);
                    } // for

                    // We are gonna make two calls for each annotation
                    self.progressTotal *= 2;

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

            request.get("http://metasound.dibet.univpm.it:8080/annotationserver/api/open/annotations/"+ annotationId +"/content", {
                handleAs: "json"
            }).then(
                function(data){

                    for (var subject in data) {
                        
                        // Save content for later visualization of this notebook
                        if (typeof(self.notebookRawData.triples[subject]) === 'undefined') 
                            self.notebookRawData.triples[subject] = {};
                        
                        for (var predicate in data[subject]) {

                            // Save content for later visualization of this notebook
                            if (typeof(self.notebookRawData.triples[subject][predicate]) === 'undefined') 
                                self.notebookRawData.triples[subject][predicate] = [];
                                                            
                            for (var object in data[subject][predicate]) 
                                self.notebookRawData.triples[subject][predicate].push(data[subject][predicate][object]);
                                
                        } // for predicate in data[subject]
                    } // for subject and data
                    
                    // Once we have the triples, get the item descriptions
                    self.loadAnnotationItems(annotationId);

                    self.progressCounter++;
                    self.updateProgress();
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
                    for (var j in data) 
                        if (typeof(self.notebookRawData.items[j]) === "undefined")
                            self.notebookRawData.items[j] = data[j];

                    self.progressCounter++;
                    self.updateProgress();
                    
                },
                function(error) {
                    console.log('error :|');
                }
            );
            
        }, // loadAnnotationItems()
        
        updateProgress: function() {
            var self = this,
                prog = dojo.query('progress')[0],
                perc = parseInt(self.progressCounter*100/self.progressTotal, 10);

            domStyle.set(dojo.query('#timeline-tab-'+self.notebookId+' div.progress div.bar')[0], 'width', perc+"%");
            dojo.query('#timeline-tab-'+self.notebookId+' .progress-percentage').innerHTML(perc+'%');

            if (self.progressCounter === self.progressTotal)
                self.onLoadingDone();

        }, // updateProgress()
        
        onLoadingDone: function() {
            var self = this;
            
            console.log('Loading ended: ', self.notebookRawData);

            dojo.query('#timeline-tab-'+self.notebookId+' .progress-percentage').innerHTML('Done!');
            dojo.query('#timeline-tab-'+self.notebookId+' div.progress')
                .removeClass('active progress-warning')
                .addClass('progress-success');
        }
        
	});

});