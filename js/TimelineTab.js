define(["dojo/_base/declare", 
        "dojo/request", 
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/on", 
        "dojo/router", 
        "dojo/date",
        "dojo/date/stamp",
        "dojo/date/locale",

        "dojo/text!ask/tmpl/TimelineTabTemplate.html", 

        "ask/TimelineGraph",
        "ask/TimelineAnnotation",
        "ask/TimelineQuotedPerson",
        
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, request, domConstruct, domClass, domStyle, on, router, dojoDate, dateStamp, dateLocale,
        
                timelineTabTemplate, TimelineGraph, TimelineAnnotation, TimelineQuotedPerson,
                
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
        annotations: [],
        persons: [],
        usedColors: 0,
        usedColorsHash: {},
        startDate: '',
        endDate: '',
        startDateString: '',
        endDateString: '',
        templateString: timelineTabTemplate,
        constructor: function() {
            this.inherited(arguments);
        },
        postMixInProperties: function() {
            var self = this;
            
            self.inherited(arguments);
            self.name = this.notebookId;
            
            self.endDate = new Date();
            self.startDate = dojoDate.add(self.endDate, 'day', -30);
            
            // TODO : date format ? 
            self.endDateString = self.endDate.toDateString();
            self.startDateString = self.startDate.toDateString();
            
        },
        startup: function() {
            var self = this;
            self.inherited(arguments);

            // place the tab button
            var b = "<li><a href='#/timeline/"+this.notebookId+"'" +
                    "' data-toggle='tab' id='tab-time-"+self.notebookId+
                    "'>T: "+this.name+"</a></li>";

            dojo.place(b, "ask-pills");
            
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

            self.showGraph();
            self.loadNotebookAnnotations();
     
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
                
            self.showAnnotations();
            
        }, // onLoadingDone()
        
        showGraph: function() {
            var self = this,
                foo = new Date(self.startDate.getFullYear(), self.startDate.getMonth()+1, 1),
                diff = dojoDate.difference(self.startDate, foo) +1,
                span = dojoDate.difference(self.startDate, self.endDate),
                firstPerc = parseInt(100*diff/span, 10),
                td1 = dojo.query('.ti-annotations .slots-header td')[0],
                td2 = dojo.query('.ti-annotations .slots-header td')[1];
                
            // TODO : this works for just 1+1 months and 30 days as timespan
            domStyle.set(td1, {width: firstPerc +'%'});
            domStyle.set(td2, {width: (100-firstPerc) +'%'});
            
            var mNames = dateLocale.getNames("months", "wide");
            dojo.query(td1).innerHTML(mNames[self.startDate.getMonth()] + ' ' + self.startDate.getFullYear());
            dojo.query(td2).innerHTML(mNames[self.endDate.getMonth()] + ' ' + self.endDate.getFullYear());
            
            new TimelineGraph({
                notebookId: self.notebookId,
                startDate: self.startDate,
                endDate: self.endDate
            }).placeAt(dojo.query('.raphael-graph-container-'+self.notebookId)[0]);

        }, // showGraph()
        
        // Gives out colors to the quoted persons, creating them as 
        // well. They will be appended when all annotations are loaded
        getColor: function(quotedPerson) {
            var self = this;
            
            if (quotedPerson in self.usedColorsHash)
                return self.usedColorsHash[quotedPerson];
            
            self.usedColorsHash[quotedPerson] = self.usedColors++;
            
            self.persons.push(new TimelineQuotedPerson({
                notebookId: self.notebookId,
                parentTimeline: self,
                perUri: quotedPerson
            }));
            
            return self.usedColorsHash[quotedPerson];
            
        },
        
        showAnnotations: function() {
            var self = this;
                        
            for (var sub in self.notebookRawData.triples) {
                var candidate = self.notebookRawData.triples[sub],
                    date, 
                    _date = "http://purl.org/dc/elements/1.1/date";

                if (typeof(candidate[_date]) === 'undefined') {
                    console.log('No date, discarding ', candidate);
                    continue;
                }
                                
                date = dateStamp.fromISOString(candidate[_date][0].value);
                if (date.toDateString() === "Invalid Date") {
                    console.log('Invalid date, discarding ', candidate, date, candidate[_date][0].value);
                    continue;
                }
                
                // TODO: more consinstency checks:
                // - quoted object is a person ? 

                self.annotations.push(new TimelineAnnotation({
                    notebookId: self.notebookId,
                    subject: sub,
                    annotation: candidate,
                    parentTimeline: self
                }));
                
            } // for sub in notebookRawData
            
            // Append persons to the people box
            for (var p in self.persons) 
                self.persons[p].placeAt(dojo.query('#timeline-tab-'+self.notebookId+' .ti-people ul')[0]);
            
            // Append annotation in the right slot
            for (var a in self.annotations) {
                var ann = self.annotations[a],
                    slot;
                
                // TODO : avoid appending annotations out of range
                
                // DEBUG: why it's not a date? :|
                slot = dojoDate.difference(self.startDate, dateStamp.fromISOString(ann.annDate)) + 1;
                
                // If an annotation day is before startDate, dont append it 
                // TODO: same when it's beyond endDate
                if (slot < 0) {
                    console.log('Out of range: '+slot+' Annotation date: ', self.startDate+" - "+ann.annDate);
                } else {
                    ann.placeAt(dojo.query('#timeline-tab-'+self.notebookId+' .ti-annotations .slot-'+slot)[0]);
                }

            }
        }, // showAnnotations()
        
	});

});