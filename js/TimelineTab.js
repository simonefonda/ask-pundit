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
        "ask/TimelineTag",
        
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, request, domConstruct, domClass, domStyle, on, router, dojoDate, dateStamp, dateLocale,
        
                timelineTabTemplate, TimelineGraph, TimelineAnnotation, TimelineQuotedPerson, TimelineTag,
                
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
        tagsObjects: {},

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
            self.startDate = dojoDate.add(self.endDate, 'day', -29);
            
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
            
            on(dojo.query('#timeline-tab-'+self.notebookId+' a.ti-reset-button')[0], 'click', function() {
                if (!self.areAllAnnActive()) {

                    self.activateAllAnn();
                    self.updateResetButton();
                }
                return false;
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
            self.showPersons();
            self.showTags();
            dojo.query('.ti-invisible').removeClass('ti-invisible');
            
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
            self.addPerson(quotedPerson);
            
            return self.usedColorsHash[quotedPerson];
        },
        
        addPerson: function(person) {
            var self = this;
            
            self.persons.push(new TimelineQuotedPerson({
                notebookId: self.notebookId,
                parentTimeline: self,
                perUri: person
            }));
        },
        
        addTag: function(tag) {
            var self = this;
            
            if (tag in self.tagsObjects)
                self.tagsObjects[tag].n++;
            else
                self.tagsObjects[tag] = {n: 1}
            
            console.log('--- timeline tags, added ', tag, self.tagsObjects);
        },
        
        showTags: function() {
            var self = this,
                foo;

            for (var t in self.tagsObjects) {
                foo = new TimelineTag({
                    notebookId: self.notebookId,
                    uri: t,
                    parentTimeline: self
                });
                foo.placeAt(dojo.query('#timeline-tab-'+self.notebookId+' .ti-tags')[0]);
                
                on(dojo.query('#timeline-tab-'+self.notebookId+' .ti-tags .ti-tag[data-tag-uri="'+t+'"]')[0], 'click', (function(uri) {
                    return function(e) { self.toggleTag(uri); }
                })(t));
            }
        },

        toggleTag: function(tag) {
            var self = this;
            
            // If they are all active, deactivate all but the clicked
            // with tag buttons

            if (self.areAllTagsActive()) {
                dojo.query('.ti-tags .ti-tag').removeClass('active');
                self.deactivateAllAnn();
            }
            
            self.activateAnnByTag(tag);
            dojo.query('.ti-tags .ti-tag[data-tag-uri="'+tag+'"]').addClass('active');
        },
        
        togglePerson: function(person) {
            var self = this,
                p = dojo.query('#timeline-tab-'+self.notebookId+' .ti-people-item[data-quotation-from="'+person+'"]');

            console.log('tot ', person);
            
            if (self.areAllPersonsActive()) {
                dojo.query('#timeline-tab-'+self.notebookId+' .ti-people-item').removeClass('active');
                self.deactivateAllAnn();
                self.activateAnnByPerson(person);
                p.addClass('active');
            } else if (!domClass.contains(p[0], 'active')) {
                self.activateAnnByPerson(person);
                p.addClass('active');
            } else if (self.getActivePersons() === 1) {
                console.log('just me!', person);
                self.activateAnnByPerson(person);
            } else {
                self.deactivateAnnByPerson(person);
                p.removeClass('active');
                return;
            }
                
            
        },
        areAllPersonsActive: function() {
            return this.getActivePersons()
                === dojo.query('#timeline-tab-'+this.notebookId+' .ti-people-item').length;
        },
        getActivePersons: function() {
            return dojo.query('#timeline-tab-'+this.notebookId+' .ti-people-item.active').length
        },
        activateAnnByPerson: function(person) {
            dojo.query('#timeline-tab-'+this.notebookId+' .ti-ann-item[data-quotation-from="'+person+'"]')
                .addClass('active')
                .removeClass('deactive');
            this.updateResetButton();
        },
        deactivateAnnByPerson: function(person) {
            dojo.query('#timeline-tab-'+this.notebookId+' .ti-ann-item[data-quotation-from="'+person+'"]')
                .addClass('deactive')
                .removeClass('active');
            this.updateResetButton();
        },
        activateAllPersons: function() {
            dojo.query('#timeline-tab-'+this.notebookId+' .ti-people-item')
                .addClass('active')
                .removeClass('deactive');
        },
        
        areAllTagsActive: function() {
            var self = this;
            return dojo.query('#timeline-tab-'+self.notebookId+' .ti-tags .ti-tag.active').length 
                === dojo.query('#timeline-tab-'+self.notebookId+' .ti-tags .ti-tag').length;
        },
        activateAnnByTag: function(tag) {
            var self = this;
            
            dojo.query('.ti-ann-item .ti-tag[data-tag-uri="'+tag+'"]')
                .parents('.ti-ann-item')
                .addClass('active')
                .removeClass('deactive');
    
            self.updateResetButton();
        },
        activateAllTags: function() {
            dojo.query('.ti-tags .ti-tag')
                .addClass('active')
                .removeClass('deactive');
        },
        areAllAnnActive: function() {
            return dojo.query('.ti-ann-item.active').length === dojo.query('.ti-ann-item').length;
        },
        activateAllAnn: function() {
            var self = this;
            dojo.query('.ti-ann-item')
                .removeClass('deactive')
                .addClass('active');
            self.activateAllTags();
            self.activateAllPersons();
            self.updateResetButton();
        },
        deactivateAllAnn: function() {
            var self = this;
            dojo.query('.ti-ann-item')
                .addClass('collapsed deactive')
                .removeClass('active');
            self.updateResetButton();
        },
        
        updateResetButton: function() {
            var self = this,
                b = dojo.query('#timeline-tab-'+self.notebookId+' a.ti-reset-button');
            if (!self.areAllAnnActive()) b.addClass('active');
            else b.removeClass('active');
        },
        
        // Append persons to the people box
        showPersons: function() {
            var self = this;
            for (var p in self.persons) {
                var uri = self.persons[p].params.perUri;
                self.persons[p].placeAt(dojo.query('#timeline-tab-'+self.notebookId+' .ti-people ul')[0]);
                
                on(dojo.query('#timeline-tab-'+self.notebookId+' .ti-people-item[data-quotation-from="'+uri+'"]')[0], 'click', (function(pers) {
                    return function(e) { self.togglePerson(pers); }
                })(uri)); 
               
            }
        },
        
        showAnnotations: function() {
            var self = this;
                        
            for (var sub in self.notebookRawData.triples) {
                var candidate = self.notebookRawData.triples[sub],
                    date, person,
                    _date = "http://purl.org/dc/elements/1.1/date",
                    _quotationFrom = "http://purl.org/spar/cito/cites",
                    _quotationFrom2 = "http://purl.org/spar/cito/includesQuotationFrom";

                if (typeof(candidate[_date]) === 'undefined') {
                    console.log('No date, discarding ', candidate);
                    continue;
                }
                                
                date = dateStamp.fromISOString(candidate[_date][0].value);
                if (date.toDateString() === "Invalid Date") {
                    console.log('Invalid date, discarding ', candidate, date, candidate[_date][0].value);
                    continue;
                }
                
                if (_quotationFrom in candidate)
                    person = candidate[_quotationFrom];
                else if (_quotationFrom2 in candidate)
                    person = candidate[_quotationFrom2];
                
                if (!person) {
                    console.log('No quotationfrom, discarding ', candidate, person);
                    continue;
                }
                
                // TODO: more consinstency checks:
                // - quoted object is a person ? 

                var foo_ = new TimelineAnnotation({
                    notebookId: self.notebookId,
                    subject: sub,
                    annotation: candidate,
                    parentTimeline: self
                });
                self.annotations.push(foo_);
                
                
            } // for sub in notebookRawData
            
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