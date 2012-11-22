define(["dojo/_base/declare", 
        "dojo/_base/lang",
        "dojo/on", 
        "dojo/dom-construct",
        "dojo/json",
        "dojo/text!ask/tmpl/MyAskTemplate.html", 
        "ask/NotebookItem",
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, lang, on, domConstruct, JSON, myAskTemplate, NotebookItem, _WidgetBase, _TemplatedMixin) {

    return declare("ask.MyAsk", [_WidgetBase, _TemplatedMixin], {
        templateString: myAskTemplate,
        postMixInProperties: function() {
            this.inherited(arguments);
        },
        startup: function() {
            var self = this;
            this.inherited(arguments);
            
            self._isLoggedIn = false;
            self._userData = {};
            self._myNotebooks = [];
            
            self._initBehaviors();
        },
        
        _initBehaviors: function() {
            var self = this,
                placeAt = dojo.byId('my-ask-messages');
            
            ASK.requester.onLogin(function(d) {
                self._afterLogin(d);
            });
            ASK.requester.onLogout(function(d) {
                self._afterLogout(d);
            });

            // Are we logged in already? Just check at startup
            // If not in logged in state already, go for it
            ASK.requester.isLoggedIn(function(b, data) {
                if (!self._isLoggedIn && b === true) {
                    self._afterLogin(data);
                } else {
                    // Deal with common errors
                    // TODO: more errors? Forbidden? Moved? Other??!
                    if (("response" in data) && ("status" in data.response)) {
                        if (data.response.status === ASK.requester.HTTP_CONNECTION_ERROR) 
                            ASK.placeErrorAt("CONNECTION ERROR", "Could not connect to the login server, check your internet connection.", placeAt);
                    }
                    
                }
                
            });

            on(dojo.query('.ask-login')[0], 'click', function() {
                ASK.requester.login();
                return false;
            });

            on(dojo.query('.ask-logout')[0], 'click', function() {
                ASK.requester.logout();
                return false;
            });
            
            // Import from textarea
            on(dojo.query('#my-ask-import-button')[0], 'click', function() {
                console.log('Importing ');
                self._importFromTextArea();
                return false;
            });
            

        },
        
        _importFromTextArea: function() {
            var self = this;

            var id = "4d68f81d",
                jsonData = dojo.query('#my-ask-import textarea')[0].value,
                objectData = JSON.parse(jsonData),
                context, url;
                
            // If it's not an array, make it an array!
            if (typeof(objectData.length) === 'undefined') {
                objectData = [objectData];
            }
            
            for (var n = objectData.length; n--;) {
                context = encodeURIComponent(dojo.toJson(self._extractContext(objectData[n]))),
                url = lang.replace(ASK.ns.asCreateAnnotation, { id: id, context: context });
                        
                console.log('Posting new annotation', context);
                
                var post = {
                    url: url,
                    postData: dojo.toJson(objectData[n]),
                    headers: {"Content-Type":"application/json;charset=UTF-8;"},
                    handleAs: "json",
                    load: function(data) {
                        console.log("Here's your response: ", data);
                        dojo.query('#my-ask-messages')
                            .append('<p><span class="label label-success">Done</span> Created annotation '+data.AnnotationID+'!</p>');
                    }, 
                    error: function(e) {
                        console.log('We had an error posting the annotation', e);
                        dojo.query('#my-ask-messages').append('<p><span class="label label-important">ERROR</span>There was an error creating the annotation .... :(</p>');
                    }
                };
                ASK.requester.xPost(post);
            }            
        },
        
        _extractContext: function(ob) {
            var self = this,
                ret = {
                    targets: [],
                    pageContext: ''
                };
            
            console.log('Trying to extract from ', ob);
            
            for (var i in ob.items)
                if (ASK.ns.rdf_type in ob.items[i]) {
                    var types = ob.items[i][ASK.ns.rdf_type];
                    
                    for (var j = types.length; j--;) {
                        if (types[j].value === ASK.ns.fragments.image) {
                            ret.targets.push(ob.items[i]["http://purl.org/pundit/ont/ao#parentItemXP"][0].value);
                            ret.targets.push(ob.items[i]["http://purl.org/dc/terms/isPartOf"][0].value);
                            ret.pageContext = ob.items[i]["http://purl.org/pundit/ont/ao#hasPageContext"][0].value;
                        }
                    }
                }
            
            return ret;
        },

        _afterLogin: function(d) {
            var self = this;

            self.getOwnedNotebooks(function(data) {
                self.showOwnedNotebooks(data);
            });

            self._isLoggedIn = true;
            self._userData = d;
            
            dojo.query('.my-ask')
                .removeClass('login-state-off')
                .addClass('login-state-logged');
                
            dojo.query('.my-ask .login-logged blockquote p')
                .html('Logged in as '+d.fullName);
            dojo.query('.my-ask .login-logged blockquote small')
                .html(d.email);

        },
        
        _afterLogout: function(d) {
            var self = this;
            
            domConstruct.empty('my-ask-notebooks');
            
            self._isLoggedIn = false;
            self._userData = {};
            self._myNotebooks = [];
            
            dojo.query('.my-ask')
                .removeClass('login-state-logged')
                .addClass('login-state-off');
        },

        // TODO: switch pundit.AnnotationReader / Writer ? (Annotation ?? AnnotationServer ?)
        getOwnedNotebooks: function(cb){
            var self = this,
            args = {
                // TODO: create ASK.ns
                url: ASK.ns.asOwnedNotebooks,
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
            deferred = ASK.requester._oldGet(args);
        },
        
        showOwnedNotebooks: function(ids) {

            domConstruct.empty('my-ask-notebooks');

            if (Object.prototype.toString.call(ids) !== '[object Array]') {
                // TODO: not an array? errors
                return;
            }
            
            var self = this;
            for (var j = ids.length; j--;) {

                self._myNotebooks.push(ids[j]);
                dojo.query('#my-ask-import-select').append('<option value="'+ids[j]+'">'+ids[j]+'</option>');

                var foo = new NotebookItem({
                        notebookId: ids[j],
                        isOwner: true,
                        canEdit: true
                    })
                    .placeAt(dojo.byId('my-ask-notebooks'));

                // self.loadNotebooksMeta(data.NotebookIDs[i]);
                
                // TODO : refactor Ask.loadNotebooksMeta into a READER, maybe from Pundit ? 
            }
            
        }


	});

});