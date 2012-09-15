define(["dojo/_base/declare", 
        "dojo/request", 
        "dojo/dom-construct",
        "dojo/on", 
        "dojo/router", 
        "dojo/text!ask/tmpl/BookmarkListTemplate.html", 
        "ask/CollectionItem",
        "bootstrap/Button",
        "dijit/layout/TabContainer", 
        "dijit/layout/ContentPane", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, request, domConstruct, on, router,
                bookmarkTabTemplate, CollectionItem, BButton,
                TabContainer, ContentPane, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.BookmarkList", [_WidgetBase, _TemplatedMixin], {
        socketHelper: 'x',
        newNotebookTimer: '',
        notebookTimerLength: 400,
        templateString: bookmarkTabTemplate,

        postMixInProperties: function() {
            var self = this;
            self.inherited(arguments);
            
            var s = self.socketHelper.socket;
            s.on('res bookmarks', function(data) {
                self.displayBookmarks(data);
            });

        },

        constructor: function() {

        },

        startup: function() {
            var self = this;
            
            self.loadBookmarks();
            
            on(dojo.byId('bookmarksRefresh'), 'click', function(e) {
                self.loadBookmarks();
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
                self.loadBookmarks();
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
               
            // Response from subscribe collection modal      
            on(dojo.byId('subscribeCollectionForm'), 'submit', function(e) {

                self.subscribeCollection(
                    dojo.query('#subscribeCollectionHiddenName')[0].value,
                    dojo.query('#subscribeCollectionPassword')[0].value);

                    console.log('Subsss ', dojo.query('#subscribeCollectionHiddenName')[0].value, dojo.query('#subscribeCollectionPassword')[0].value);
                    
                return false;
            });
            
            s.on('res subscribe collection ko', function(data) {
                dojo.query('#subscribeCollectionForm .modal-footer span.label')
                    .removeClass('label-info')
                    .addClass('label-important')
                    .innerHTML('The password was wrong, try again!');
                dojo.query('#subscribeCollectionPassword')[0].value = '';
                console.log('wrong pass');
            });
            s.on('res subscribe collection ok', function(data) {
                console.log('pass was right, good boy', data);
                dojo.query('#subscribeCollectionModal').modal('hide');
                
            });
            
            
            
                        
        }, // startup

        
        subscribeCollection: function(name, password) {
            console.log('sticazzi? ', arguments);
            this.socketHelper.socket.emit('subscribe collection', {name: name, password: password});
        },
        loadBookmarks: function() {
            this.socketHelper.socket.emit('get bookmarks');
        },

        displayBookmarks: function(data) {
            var self = this;
            
            dojo.place('<p>List list list</p>', dojo.query('#bookmarksContainer .bookmarks')[0]);
            
            dojo.query('#bookmarksContainer .bookmarks').empty();
            for (var name in data) {
                var x = new CollectionItem({
                    name: name,
                    base64: BASE64.encode(name),
                    description: data[name].description
                }).placeAt(dojo.query('#bookmarksContainer .bookmarks')[0]);
                x.startup();
            }
        }

        
	});

});