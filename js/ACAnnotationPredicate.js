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
        label: 'Uknkown',
        desc: 'Uknkown',
        depic: '',
        uri_enc: '',
        subject_enc: '',
        type: 'default',
        templateString: annotationPredicateTemplate,
        postMixInProperties: function() {
            this.inherited(arguments);
            this.uri_enc = BASE64.encode(this.uri);

            var self = this,
                u = self.uri,
                c = {},
                nbid = 'nb-'+self.notebookId,
                anrd = 'ite-rdf-'+self.annotationId;
                
            if ((nbid in ASK._cache) && (anrd in ASK._cache[nbid]))
                c = ASK._cache[nbid][anrd];
            else {
                console.log('ouch?');
                return;
            }

            if (typeof(c) !== 'object') {
                console.log('Very bad response is bad, empty items or what? BROKEN ANNOTATION?!', u, anrd, nbid);
                return;
            }
            
            // DEBUG: why some items are missing the hastag and hascomment 
            // triples??!
            if (!(u in c)) 
                c[u] = {};
            
            if (u === ASK.ns.pundit_hasTag) {
                self.label = "Tags";
                self.desc = "Some kind of resource has been tagged with a semantic entity";
                self.type = "tags";
            } else if (u === ASK.ns.pundit_hasComment) {
                self.label = "Comment";
                self.desc = "Some kind of resource has been commented";
                self.type = "comment";
            }

            self.label = (ASK.ns.items.label in c[u]) ? c[u][ASK.ns.items.label][0].value : self.label || 'no label :(',
            label_short = self.label.length > 50 ? this.label.substr(0, self.titleChars)+' ..' : self.label,
            self.depic = (ASK.ns.items.image in c[u]) ? c[u][ASK.ns.items.image][0].value : 'http://placehold.it/120x100/ffcc00';
            if (self.depic === "http://api.freebase.com/api/trans/image_thumb/guid/")
                self.depic = 'http://placehold.it/120x100/cc00cc';
            
            if (ASK.ns.items.description in c[u])
                self.desc = c[u][ASK.ns.items.description][0].value;
            
        },
        startup: function() {
            dojo.query('[data-toggle="popover"]').popover();
        }
    });

});
