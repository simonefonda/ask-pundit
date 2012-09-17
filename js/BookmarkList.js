define(["dojo/_base/declare", 
        "dojo/request", 
        "dojo/dom-construct",
        "dojo/on", 
        "dojo/router",
        "dojo/json",
        "dojo/text!ask/tmpl/BookmarkListTemplate.html", 
        "ask/CollectionItem",
        "bootstrap/Button",
        "dijit/layout/TabContainer", 
        "dijit/layout/ContentPane", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, request, domConstruct, on, router, json,
                bookmarkTabTemplate, CollectionItem, BButton,
                TabContainer, ContentPane, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.BookmarkList", [_WidgetBase, _TemplatedMixin], {
        socketHelper: 'x',
        newNotebookTimer: '',
        notebookTimerLength: 400,
        collections: {},
        localStoreKey: 'ask-pundit-joined-collections',
        templateString: bookmarkTabTemplate,

        postMixInProperties: function() {
            var self = this;
            self.inherited(arguments);
            
            var s = self.socketHelper.socket;
            s.on('res bookmarks', function(data) {
                self.displayBookmarks(data);
            });

        },

        startup: function() {
            var self = this;
            
            self.loadBookmarkCollections();
            
            on(dojo.byId('bookmarksRefresh'), 'click', function(e) {
                self.loadBookmarkCollections();
            });

            on(dojo.byId('bookmarksNewName'), 'keyup', function(e) {
                dojo.query('#bookmarksNewNameLabel')
                    .addClass('label-info')
                    .removeClass('label-important label-success');
                    
                clearTimeout(self.newNotebookTimer);
                self.newNotebookTimer = setTimeout(function() {
                    var name = dojo.query('#bookmarksNewName')[0].value;
                    self.socketHelper.socket.emit('collection exist', name);
                }, self.notebookTimerLength);
            });

            // "collection exist" responses, if it does not, allow the
            // user to use it!
            s.on('res collection exist ko', function(data) {
                var n = dojo.query('#bookmarksNewNameLabel');
                n.addClass('label-success').removeClass('label-important label-info');
                n[0].innerHTML = "This name is available!"
                dojo.query('#bookmarksNewName')[0].setCustomValidity('');
                
            });
            s.on('res collection exist ok', function(data) {
                var n = dojo.query('#bookmarksNewNameLabel');
                n.addClass('label-important').removeClass('label-success label-info');
                n[0].innerHTML = "This name is taken! Please choose a new one";
                dojo.query('#bookmarksNewName')[0].setCustomValidity("Told ya!! "+n[0].innerHTML);
            });
            

            // Create a new collection
            on(dojo.byId('bookmarksCreateForm'), 'submit', function(e) {
                dojo.query('#bookmarksCreateNew').button('loading');

                self.socketHelper.socket.emit('new collection', {
                    name: dojo.query('#bookmarksNewName')[0].value,
                    description: dojo.query('#bookmarksNewDescription')[0].value,
                    password: dojo.query('#bookmarksNewPassword')[0].value,
                    createAt: (new Date()).toString()
                });
                return false;
            });
            
            // "new collection ok" response, reset the form
            s.on('res new collection ok', function(data) {
                self.loadBookmarkCollections();
                dojo.query('#bookmarksCreateNew')
                    .button('complete')
                    .addClass('btn-success');
                setTimeout(function() {
                    dojo.query('#bookmarksCreateNew').button('reset').removeClass('btn-success');
                    dojo.query('#bookmarksNewNameLabel')[0].innerHTML = "Check";
                    dojo.query('#bookmarksNewName')[0].value = '';
                    dojo.query('#bookmarksNewDescription')[0].value = '';
                    dojo.query('#bookmarksNewPassword')[0].value = '';
                }, 3000);
            });
               
            // Response from join collection modal      
            on(dojo.byId('joinCollectionForm'), 'submit', function(e) {

                self.joinCollection(
                    dojo.query('#joinCollectionHiddenName')[0].value,
                    dojo.query('#joinCollectionPassword')[0].value);
                
                return false;
            });

            // Responses from the join collection commands
            s.on('res join collection ko', function(data) {
                dojo.query('#joinCollectionForm .modal-footer span.label')
                    .removeClass('label-info')
                    .addClass('label-important')
                    .innerHTML('The password was wrong, try again!');
                dojo.query('#joinCollectionPassword')[0].value = '';
            });
            
            s.on('res join collection ok', function(data) {
                dojo.query('#joinCollectionModal').modal('hide');
                self.addJoinedCollection(data.doc.name);
            });
            
            // If there's no info in the local storage, initialize it
            if (typeof(localStorage[self.localStoreKey]) === "undefined") {
                localStorage[self.localStoreKey] = json.stringify({"colls": []});
            }
            
        }, // startup
        
        joinCollection: function(name, password) {
            this.socketHelper.socket.emit('join collection', {name: name, password: password});
        },
        
        loadBookmarkCollections: function() {
            this.socketHelper.socket.emit('get bookmark collections');
        },

        addJoinedCollection: function(name) {
            var self = this,
                colls = json.parse(localStorage[self.localStoreKey]).colls;
            
            if (dojo.indexOf(colls, name) === -1) {
                colls.push(name);
                localStorage[self.localStoreKey] = json.stringify({"colls": colls});
            }
            
            self.loadBookmarkCollections();
        },

        removeJoinedCollection: function(name) {
            var self = this,
                colls = json.parse(localStorage[self.localStoreKey]).colls,
                index = dojo.indexOf(colls, name);
            
            if (index === -1) 
                return;
                
            colls.splice(index, 1);
            
            localStorage[self.localStoreKey] = json.stringify({"colls": colls});
            
            self.loadBookmarkCollections();
        }, // removeJoinedCollection()

        
        displayJoinedCollections: function() {
            var self = this,
                colls = json.parse(localStorage[self.localStoreKey]).colls;
            
            dojo.query('#joinedContent').empty();
            
            for (var i in colls) {
                var name = colls[i],
                    c = self.collections[name];

                var x = new CollectionItem({
                    listReference: self,
                    joined: true,
                    name: c.name,
                    base64: BASE64.encode(c.name),
                    description: c.description
                }).placeAt(dojo.query('#joinedContent')[0]);
                x.startup();
            }
        }, // displayJoinedCollections()
        

        displayBookmarks: function(data) {
            var self = this,
                colls = json.parse(localStorage[self.localStoreKey]).colls;
            
            dojo.query('#bookmarksContainer .bookmarks').empty();
            for (var name in data) {
                
                self.collections[name] = data[name];
                
                if (dojo.indexOf(colls, name) === -1) {
                    var x = new CollectionItem({
                        listReference: self,
                        joined: false,
                        name: name,
                        base64: BASE64.encode(name),
                        description: data[name].description
                    }).placeAt(dojo.query('#bookmarksContainer .bookmarks')[0]);
                    x.startup();
                }
            }
            // When we loaded the collections, we can display the joined
            // TODO: move that code inside here?
            self.displayJoinedCollections();
            
        } // displayBookmarks()

	});

});