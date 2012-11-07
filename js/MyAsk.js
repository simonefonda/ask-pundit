define(["dojo/_base/declare", 
        "dojo/on", 
        "dojo/dom-construct",
        "dojo/text!ask/tmpl/MyAskTemplate.html", 
        "ask/NotebookItem",
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, on, domConstruct, myAskTemplate, NotebookItem, _WidgetBase, _TemplatedMixin) {

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
            
            self._initBehaviors();
        },
        
        _initBehaviors: function() {
            var self = this;
            
            ASK.requester.onLogin(function(d) {
                self._afterLogin(d);
            });
            ASK.requester.onLogout(function(d) {
                self._afterLogout(d);
            });

            // Are we logged in already? Just check.
            // If not in logged in state already, go for it
            ASK.requester.isLoggedIn(function(b, d) {
                if (!self._isLoggedIn)
                    self._afterLogin(d);
            });

            on(dojo.query('.ask-login')[0], 'click', function() {
                ASK.requester.login();
                return false;
            });

            on(dojo.query('.ask-logout')[0], 'click', function() {
                ASK.requester.logout();
                return false;
            });

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
            dojo.query('.my-ask')
                .removeClass('login-state-logged')
                .addClass('login-state-off');
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

            domConstruct.empty('my-ask-notebooks');

            if (Object.prototype.toString.call(ids) !== '[object Array]') {
                // TODO: not an array? errors
                return;
            }
            
            var self = this;

            for (var j = ids.length; j--;) {

                var foo = new NotebookItem({notebookId: ids[j]})
                    .placeAt(dojo.byId('my-ask-notebooks'));

                // self.loadNotebooksMeta(data.NotebookIDs[i]);
                
                // TODO : refactor Ask.loadNotebooksMeta into a READER, maybe from Pundit ? 
            }
            
        }


	});

});