define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/nbTab/ACObject.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, annotationObjectTemplate, _WidgetBase, _TemplatedMixin) {
    
    return declare("ask.AnnotationObject", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        annotationId: '',
        label: '',
        label_short: '',
        desc: '',
        depic: '',
        uri: '',
        uri_short: '',
        uri_enc: '',
        value: '',
        type: 'default',
        original: {},
        templateString: annotationObjectTemplate,
        titleChars: 50,
        uriChars: 15,
        pageContext: '',
        pageContext_short: '',
        postMixInProperties: function() {
            this.inherited(arguments);
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

            if (!(u in c)) {
                c[u] = {};
                if (self.original.type === "literal") {
                    self.type = "literal";
                    console.log('Am i a literal?!', u.substr(0,30), self.annotationId, self.original);
                    self.desc = ASK.linkify(u);
                    self.label = u;
                } else {
                    console.log('Is this a triple object?', self.original);
                }
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
            
            
            self.label = (ASK.ns.items.label in c[u]) ? c[u][ASK.ns.items.label][0].value : self.label || 'no label :(',
            self.label_short = self.label.length > self.titlecChars ? self.label.substr(0, self.titleChars)+' ..' : self.label,
            self.uri_short = self.uri.length > self.uriChars ? self.uri.substr(7, self.uriChars+7)+' ..' : self.uri,
            self.depic = (ASK.ns.items.image in c[u]) ? c[u][ASK.ns.items.image][0].value : 'http://placehold.it/120x100/ffcc00';
            if (self.depic === "http://api.freebase.com/api/trans/image_thumb/guid/")
                self.depic = 'http://placehold.it/120x100/cc00cc';
            
            if (typeof(c[u][ASK.ns.items.description]) !== "undefined")
                self.desc = c[u][ASK.ns.items.description][0].value;
        },
        startup: function() {
        }
    });

});