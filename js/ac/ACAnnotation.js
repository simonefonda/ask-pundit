define([
        "dojo/_base/declare", 
        "dojo/_base/lang",
        "dojo/request", 
        "dojo/on",
        "dojo/dom-class",
        "dojo/text!ask/tmpl/ac/ACAnnotation.html", 
        "ask/ac/ACSubject",
        "ask/ac/ACPredicate",
        "ask/ac/ACObject",
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"
    ], function(
        declare, lang, request, on, domClass, ACAnnotationTemplate, 
        ACAnnotationSubject, ACAnnotationPredicate, ACAnnotationObject,
        _WidgetBase, _TemplatedMixin
    ) {

    return declare("ask.ACAnnotation", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        annotationId: '',
        createdBy: '',
        createdAt: '',
        pageContext: '',
        isOwner: false,
        body: '',
        pageContext_short_length: 30,
        pageContext_short: '',
        summary: '',
        templateString: ACAnnotationTemplate,
        postMixInProperties: function() {
            var self = this;
            
            // Page context: show the first part of the URL
            var start = 0;
            if (self.pageContext.match(/^http:\/\/www\./))
                start = 11; 
            else if (self.pageContext.match(/^http:\/\//))
                start = 7;
            self.pageContext_short = self.pageContext.substr(start, start + self.pageContext_short_length) + " ..";
            
            var foo = new Date(self.createdAt);
            self.createdAt = foo.toDateString();
            
        },
        startup: function() {
            var self = this;
            
            // collapse / expand
            on(dojo.query('[data-ACAnn="'+self.annotationId+'"] .controls .collapse-ann')[0], 'click',function(){
                domClass.toggle(dojo.query('[data-ACAnn="'+self.annotationId+'"]')[0], 'collapsed');
            });
            self.loadAnnotationItems(self.annotationId);
        },

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
                    
                    ASK._cache['nb-'+self.notebookId]['ann-ite-'+annotationId] = data;
                    self.loadAnnotationContent({
                        annotationId: self.annotationId,
                        createdBy: self.createdBy,
                        createdAt: self.createdAt,
                        pageContext: self.pageContext
                    });
                    
                }, 
                function(error) {
                    console.log('error :|');
                }
            );
            
        }, // loadAnnotationItems()
        
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
        
            
            def.get(url, {
                handleAs: "json",
                headers: { "Accept": "application/json" }
            }).then(
                function(data){
                    
                    ASK._cache['nb-'+self.notebookId]['ann-con-'+annotationId] = data;
                    var _su = ASK._cache['nb-'+self.notebookId]['subs-'+annotationId] = [],
                        _pr = ASK._cache['nb-'+self.notebookId]['preds-'+annotationId] = [],
                        _ob = ASK._cache['nb-'+self.notebookId]['objs-'+annotationId] = [];

                    for (var subject in data) {
                                            
                        var sub = new ACAnnotationSubject({
                            createdBy: annotationMeta.createdBy,
                            createdAt: annotationMeta.createdAt,
                            pageContext: annotationMeta.pageContext,
                            uri: subject,
                            annotationId: annotationId,
                            notebookId: self.notebookId
                        }).placeAt(dojo.query('.askACAnn .annotation-'+annotationId)[0]);
                        _su.push(sub);
                                        
                        for (var predicate in data[subject]) {
                        
                            var pre = new ACAnnotationPredicate({
                                notebookId: self.notebookId,
                                annotationId: annotationId,
                                subject_enc: BASE64.encode(subject),
                                uri: predicate,
                                objects_num: data[subject][predicate].length
                            }).placeAt(dojo.query('.askACAnn .annotation-'+annotationId+' [data-askreplace="predicates-'+annotationId+'-'+BASE64.encode(subject)+'"]')[0]);
                            pre.startup();
                            _pr.push(pre);

                            for (var object in data[subject][predicate]) {

                                var object_value = data[subject][predicate][object].value,
                                    sel = '.askACAnn .annotation-'+annotationId+
                                        ' [data-askreplace="objects-'+annotationId+'-'+BASE64.encode(subject)+
                                        '-'+BASE64.encode(predicate)+'"]';

                                var obj = new ACAnnotationObject({
                                    notebookId: self.notebookId,
                                    annotationId: annotationId,
                                    uri: object_value,
                                    uri_enc: BASE64.encode(object_value),
                                    original: data[subject][predicate][object]
                                }).placeAt(dojo.query(sel)[0]);
                                _ob.push(obj);
                            
                            } // for object in data[subject][predicate]
                        } // for predicate in data[subject]
                    } // for subject and data   
                    
                    ASK.statsTab.add(self.notebookId, annotationId);
                    
                    // TODO: shall we write there's n statements somewhere?
                    // if (self.subs.length === 1) 
                    //    self.summary = "Expand to see the details of this statement.";
                    // else 
                    //    self.summary = "Expand to see the details of "+self.subs.length+" statements.";
                    
                    // dojo.query('[data-acann="'+annotationId+'"] .summary').html('...');
                    dojo.query('[data-acann="'+annotationId+'"]').removeClass('loading');
                }, 
                function(error) {
                    console.log('error :|');
                }
            ); // then
            
        }, // loadAnnotationContent()

	});
});