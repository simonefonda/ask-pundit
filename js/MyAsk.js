define(["dojo/_base/declare", 
        "dojo/_base/lang",
        "dojo/_base/event",
        "dojo/on", 
        "dojo/dom-construct",
        "dojo/dom-attr",
        "dojo/json",
        "dojo/text!ask/tmpl/MyAskTemplate.html", 
        "ask/NotebookItem",
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, lang, dojoEvent, on, domConstruct, domAttr, JSON, myAskTemplate, NotebookItem, _WidgetBase, _TemplatedMixin) {

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
            
            // Create new notebook
            on(dojo.query('#myAskCreateNotebookButton')[0], 'click', function(e) {
                self._createNotebook();
                dojoEvent.stop(e);
                return false;
            });

            // Delete notebook
            // on(dojo.byId('tab-myAsk'), on.selector('.delete-notebook', 'click'), function(e) {
            //    var nbId = domAttr.get(e.target, 'data-target-nb');
            //    self._deleteNotebook(nbId);
            //    return false;
            // });
            

        },

        _setNotebookVisibility: function(id, vis) {
            var self = this;
                url = lang.replace(ASK.ns.asNBSetVisibility, {id: id, visibility: vis});
            console.log('setting '+id+' to '+vis+' : '+url);
            var args = {
                url: url,
                handleAs: "text",
                load: function(data) {
                    console.log("Nb set visibility response: ", data);
                    dojo.query('#my-ask-messages')
                        .append('<p><span class="label label-success">Done</span> Notebook '+id+' is now '+vis+'</p>');
                
                    self.getOwnedNotebooks(function(data) {
                        self.showOwnedNotebooks(data);
                    });
                },
                error: function(error) {
                    console.log('TODO: ERROR setting notebook visibility: '+ id +' to '+ vis);
                    dojo.query('#my-ask-messages').append('<p><span class="label label-important">ERROR</span>There was an error setting notebook properties.</p>');
                }
            };
            ASK.requester.xPut(args);
            
        },

        _renameNotebook: function(id, name) {
            var self = this,
                url = lang.replace(ASK.ns.asNotebookId, {id: id});

                console.log('Renaming notebook '+ id +' to '+ name);
            
                var args = {
                    url: url,
                    headers: {"Content-Type":"application/json;charset=UTF-8;"},
                    putData: JSON.stringify({NotebookName: name}),
                    load: function(data) {
                        console.log("Nb rename response: ", data);
                        dojo.query('#my-ask-messages')
                            .append('<p><span class="label label-success">Done</span> Renamed notebook '+id+' to '+name+'</p>');
                    
                        self.getOwnedNotebooks(function(data) {
                            self.showOwnedNotebooks(data);
                        });

                    }, 
                    error: function(e) {
                        console.log('We had an error renaming the notebook', e);
                        dojo.query('#my-ask-messages').append('<p><span class="label label-important">ERROR</span>There was an error renaming the notebook .... :(</p>');
                    }
                };
                ASK.requester.xPut(args);
        },
        
        _deleteNotebook: function(id) {
            var self = this,
                url = lang.replace(ASK.ns.asNotebookId, {id: id});

            console.log('Deleting notebook '+ id);
            
            var args = {
                url: url,
                headers: {"Content-Type":"application/json;charset=UTF-8;"},
                handleAs: "json",
                load: function(data) {
                    console.log("Nb delete response: ", data);
                    dojo.query('#my-ask-messages')
                        .append('<p><span class="label label-success">Done</span> Deleted notebook '+id+'!</p>');
                    
                    self.getOwnedNotebooks(function(data) {
                        self.showOwnedNotebooks(data);
                    });

                }, 
                error: function(e) {
                    console.log('We had an error deleting the notebook', e);
                    dojo.query('#my-ask-messages').append('<p><span class="label label-important">ERROR</span>There was an error deleting the notebook .... :(</p>');
                }
            };
            ASK.requester.xDelete(args);
            
        }, // _deleteNotebook()
        
        _createNotebook: function() {
            var self = this,
                name = dojo.query('#myAskCreateNotebook input')[0].value;
            
            if (name === '') {
                console.log('Error creating a notebook: empty notebook name.');
                return false;
            }
            
            console.log('Creating notebook '+name);
            
            var post = {
                url: ASK.ns.asNotebooks,
                postData: dojo.toJson({NotebookName: name}),
                headers: {"Content-Type":"application/json;charset=UTF-8;"},
                handleAs: "json",
                load: function(data) {
                    console.log("Nb create response: ", data);
                    dojo.query('#my-ask-messages')
                        .append('<p><span class="label label-success">Done</span> Created notebook '+data.NotebookID+'!</p>');
                    
                    dojo.query('#myAskCreateNotebook input').val('');
                        
                    self.getOwnedNotebooks(function(data) {
                        self.showOwnedNotebooks(data);
                    });
                        
                }, 
                error: function(e) {
                    console.log('We had an error creating the notebook ', e);
                    dojo.query('#my-ask-messages').append('<p><span class="label label-important">ERROR</span>There was an error creating the notebook .... :(</p>');
                }
            };
            ASK.requester.xPost(post);
            
        }, // _createNotebook()
        
        _importFromTextArea: function() {
            var self = this;

            var id = dojo.query('#my-ask-import-select').val(),
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
                            .append('<p><span class="label label-success">Done</span> Created annotation '+data.AnnotationID+' on notebook '+id+'!</p>');
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
                    }).placeAt(dojo.byId('my-ask-notebooks'));

                // self.loadNotebooksMeta(ids[j]);
            }
            
        },
        
        /*
        // TODO: to show notebook's meta.. this is duplicating a call:
        // same as notebook item metadata ... AND in Ask.js ..... 
        loadNotebooksMeta: function(id) {
            var self = this;
        
            ASK.requester.get(lang.replace(ASK.ns.asNotebooksMeta, { id: id }), {
                handleAs: "json",
                headers: { "Accept": "application/json" }
            }).then(
                function(data){
                    
                    for (var i in data) {
                        
                        var name = data[i]['http://www.w3.org/2000/01/rdf-schema#label'][0].value,
                            annotationNum = 0,
                            createdAt = data[i]['http://purl.org/dc/terms/created'][0].value,
                            createdBy = data[i]['http://purl.org/dc/terms/creator'][0].value,
                            visibility = data[i]['http://open.vocab.org/terms/visibility'][0].value,
                            visibLabel = (visibility === "public") ? "success" : "important";
                        
                        if (typeof(data[i]['http://purl.org/pundit/ont/ao#includes']) !== "undefined") {
                            annotationNum = data[i]['http://purl.org/pundit/ont/ao#includes'].length;
                            dojo.query('#tab-myAsk #nb-item-'+id+' small.annotationNum')
                                .innerHTML(annotationNum + " annotations");
                        }
                        
                        dojo.query('#tab-myAsk #nb-item-'+id+' p').innerHTML('<span class="label label-'+visibLabel+'">'+visibility+'</span> ' +name);
                        dojo.query('#tab-myAsk #nb-item-'+id+' div.hidden').innerHTML(name.toLowerCase());
                        dojo.query('#tab-myAsk #nb-item-'+id+' small.id-createdAt-createdBy')
                            .innerHTML(createdAt);
                            
                        dojo.query('#my-ask-import-select option[value='+id+']').innerHTML(name);
                        
                        dojo.query('#tab-myAsk #nb-item-'+id+' .buttons-container').append('<button class="delete-notebook btn btn-mini btn-danger" data-target-nb="'+id+'">Delete</button>');
                        
                    }

                }, 
                function(error) {
                    console.log('error :|');
                }
            ); // then
            
        },
        */
        


    });

});