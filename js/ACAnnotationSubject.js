define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/nbTab/ACAnnotationSubject.html", 
        "bootstrap/Tooltip",
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, ACAnnotationSubjectTemplate, BTooltip, _WidgetBase, _TemplatedMixin) {

    return declare("ask.ACAnnotationSubject", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        annotationId: '',
        createdBy: '',
        createdAt: '',
        pageContext: '',
        pageContext_short: '',
        pageContext_short_length: 20,

        uri: '',
        subject_enc: '',
        
        templateString: ACAnnotationSubjectTemplate,
        postMixInProperties: function() {
            var self = this;
            self.inherited(arguments);
            self.subject_enc = BASE64.encode(self.uri);
            
            // Page context: show the first part of the URL
            var start = 0;
            if (self.pageContext.match(/^http:\/\/www\./))
                start = 11; 
            else if (self.pageContext.match(/^http:\/\//))
                start = 7;
            self.pageContext_short = self.pageContext.substr(start, start + self.pageContext_short_length) + " ..";
            
            var u = this.uri,
                c,
                nbid = 'nb-'+self.notebookId,
                anrd = 'ite-rdf-'+self.annotationId;
            
            if ((nbid in ASK._cache) && (anrd in ASK._cache[nbid]))
                c = ASK._cache[nbid][anrd];
            else {
                // console.log('Subject ouch?');
                return;
            }

            // console.log(c, 'cool', self.notebookId, self.annotationId);
        
            self.label = c[u][ASK.ns.items.label][0].value,
            label_short = this.label.length > 50 ? this.label.substr(0, self.titleChars)+' ..' : this.label,
            self.depic = (ASK.ns.items.image in c[u]) ? c[u][ASK.ns.items.image][0].value : 'http://placehold.it/62x80/ffcc00';
            if (self.depic === "http://api.freebase.com/api/trans/image_thumb/guid/")
                self.depic = 'http://placehold.it/320x400/cc00cc';
        
            if (typeof(c[u][ASK.ns.items.description]) !== "undefined")
                self.desc = c[u][ASK.ns.items.description][0].value;

        },
        startup: function() {
        }
    });
});