define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/ac/ACSubject.html", 
        "bootstrap/Tooltip",
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, ACSubjectTemplate, BTooltip, _WidgetBase, _TemplatedMixin) {

    return declare("ask.ACAnnotationSubject", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        annotationId: '',
        createdBy: '',
        createdAt: '',
        pageContext: '',
        pageContext_short: '',
        partOf: '',
        partOf_short: '',

        uri: '',
        subject_enc: '',
        type: 'default',
        label: "Uknown",
        depic: '',
        desc: 'Unknown', 
        rdfTypes: '',
        templateString: ACSubjectTemplate,
        postMixInProperties: function() {
            var self = this;
            self.inherited(arguments);
            self.subject_enc = BASE64.encode(self.uri);

            var u = this.uri,
                c,
                nbid = 'nb-'+self.notebookId,
                anrd = 'ann-ite-'+self.annotationId;
            
            if ((nbid in ASK._cache) && (anrd in ASK._cache[nbid]))
                c = ASK._cache[nbid][anrd];
            else {
                console.log('Subject ouch?');
                return;
            }
            
            if (typeof(c) !== 'object' || !(u in c)) {
                console.log('Very bad response is bad, empty items or what? BROKEN ANNOTATION?!', u, anrd, nbid);
                return;
            }
            
            if (ASK.ns.items.type in c[u])
                if (self._inTypesArray(c[u][ASK.ns.items.type], ASK.ns.fragments.text) !== -1) {
                    self.type = 'textfragment';
                } else if (self._inTypesArray(c[u][ASK.ns.items.type], ASK.ns.fragments.image) !== -1) {
                    self.type = 'imagefragment';
                } else if (self._inTypesArray(c[u][ASK.ns.items.type], ASK.ns.image) !== -1) {
                    self.type = 'image';
                }
            
            self.rdfTypes = '';
            var fooTypesArray = [];
            for (var ty in c[u][ASK.ns.items.type]) {
                var footype = c[u][ASK.ns.items.type][ty].value;
                if ((footype in c) && ASK.ns.items.label in c[footype])
                    fooTypesArray.push(c[footype][ASK.ns.items.label][0].value);
                else
                    fooTypesArray.push(footype);
            }
            self.rdfTypes = fooTypesArray.join(', ');

        
            self.label = c[u][ASK.ns.items.label][0].value,
            // label_short = this.label.length > 50 ? this.label.substr(0, self.titleChars)+' ..' : this.label,
            self.depic = (ASK.ns.items.image in c[u]) ? c[u][ASK.ns.items.image][0].value : 'http://placehold.it/62x80/ffcc00';
            if (self.depic === "http://api.freebase.com/api/trans/image_thumb/guid/")
                self.depic = 'http://placehold.it/320x400/cc00cc';

            // Page context and Part of: show the first part of the URL
            self.pageContext = (ASK.ns.items.pageContext in c[u]) ? c[u][ASK.ns.items.pageContext][0].value : '#';
            self.pageContext_short = ASK.shortenURL(self.pageContext);
            
            self.partOf = (ASK.ns.items.isPartOf in c[u]) ? c[u][ASK.ns.items.isPartOf][0].value : '#';
            self.partOf_short = ASK.shortenURL(self.partOf);
            
            if (typeof(c[u][ASK.ns.items.description]) !== "undefined")
                self.desc = c[u][ASK.ns.items.description][0].value;
        },
        _inTypesArray: function(a, t) {
            for (var l=a.length; l--;)
                if (a[l].type === "uri" && a[l].value === t)
                    return l;
            return -1;
        },
        startup: function() {
        }
    });
});