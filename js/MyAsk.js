define(["dojo/_base/declare", 
        "dojo/on", 
        "dojo/text!ask/tmpl/MyAskTemplate.html", 
        "ask/NotebookItem",
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, on, myAskTemplate, NotebookItem, _WidgetBase, _TemplatedMixin) {

    return declare("ask.MyAsk", [_WidgetBase, _TemplatedMixin], {
        templateString: myAskTemplate,
        postMixInProperties: function() {
            this.inherited(arguments);
        },
        startup: function() {
            var self = this;
            this.inherited(arguments);
                 
            self.getOwnedNotebooks(function(data) {
                self.showOwnedNotebooks(data)
            });
        },
        
        // TODO: switch pundit.AnnotationReader / Writer ? (Annotation ?? AnnotationServer ?)
        getOwnedNotebooks: function(cb){
            var self = this,
            args = {
                // TODO: create ASK.ns
                url: "http://metasound.dibet.univpm.it/annotationserver/api/notebooks/owned",
                handleAs: "json",
                headers : {"Accept": "application/json"},
                load: function(r) {
                    if (typeof(cb) === 'function')
                        cb(r.NotebookIDs);
                },
                error: function(error) {
                    self.log("ERROR: while getting current notebook ID");
                    self.fireOnError("DOH");
                }
            },
            deferred = ASK.requester.xGet(args);
        },
        
        showOwnedNotebooks: function(ids) {

            if (Object.prototype.toString.call(ids) !== '[object Array]') {
                // not an array? errors
                return;
            }
            
            var self = this;
                            
            for (var j = ids.length; j--;) {

                var foo = new NotebookItem({notebookId: ids[j]}).placeAt(dojo.byId('myAskContainer'));

                // self.loadNotebooksMeta(data.NotebookIDs[i]);
                
                // TODO : refactor Ask.loadNotebooksMeta into a READER, maybe from Pundit ? 
            }
            
        }


	});

});