define(["dojo/_base/declare", 
        "dojo/json",
        "dojo/text!ask/tmpl/nbTab/ACPredicate.html",
        "bootstrap/Popover",
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, json, annotationPredicateTemplate, Popover, _WidgetBase, _TemplatedMixin) {

    return declare("ask.AnnotationPredicate", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        annotationId: '',
        uri: '',
        label: '',
        desc: '',
        depic: '',
        uri_enc: '',
        subject_enc: '',
        templateString: annotationPredicateTemplate,
        postMixInProperties: function() {
            this.inherited(arguments);
            this.uri_enc = BASE64.encode(this.uri);

            var self = this,
                u = this.uri,
                c,
                nbid = 'nb-'+self.notebookId,
                anrd = 'ite-rdf-'+self.annotationId;
                
            if ((nbid in ASK._cache) && (anrd in ASK._cache[nbid]))
                c = ASK._cache[nbid][anrd];
            else {
                console.log('ouch?');
                return;
            }

            // console.log(c, 'cool', self.notebookId, self.annotationId);
            
            self.label = c[u][ASK.ns.items.label][0].value,
            label_short = this.label.length > 50 ? this.label.substr(0, self.titleChars)+' ..' : this.label,
            self.depic = (ASK.ns.items.image in c[u]) ? c[u][ASK.ns.items.image][0].value : 'http://placehold.it/120x100/ffcc00';
            if (self.depic === "http://api.freebase.com/api/trans/image_thumb/guid/")
                self.depic = 'http://placehold.it/120x100/cc00cc';
            
            if (typeof(c[u][ASK.ns.items.description]) !== "undefined")
                self.desc = c[u][ASK.ns.items.description][0].value;
            
        },
        startup: function() {
            dojo.query('[data-toggle="popover"]').popover();
        }
    });

});
