define(["dojo/_base/declare", 
        "dojo/text!ask/tmpl/nbTab/ACObject.html", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, annotationObjectTemplate, _WidgetBase, _TemplatedMixin) {
    
    return declare("ask.AnnotationObject", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        annotationId: '',
        label: '',
        desc: '',
        depic: '',
        uri: '',
        uri_enc: '',
        value: '',
        templateString: annotationObjectTemplate,
        titleChars: 50,
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
        }
    });

});