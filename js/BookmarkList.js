define(["dojo/_base/declare", 
        "dojo/request", 
        "dojo/dom-construct",
        "dojo/on", 
        "dojo/router", 
        "dojo/text!ask/tmpl/BookmarkListTemplate.html", 
        "dijit/layout/TabContainer", 
        "dijit/layout/ContentPane", 
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"], 
    function(declare, request, domConstruct, on, router,
                bookmarkTabTemplate,
                TabContainer, ContentPane, _WidgetBase, _TemplatedMixin) {
	
	return declare("ask.BookmarkList", [_WidgetBase, _TemplatedMixin], {
        socketHelper: 'x',
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
            
        }, // startup
        
        loadBookmarks: function() {
            this.socketHelper.socket.emit('get bookmarks');

        },
        displayBookmarks: function(data) {
            var self = this;
            dojo.place('<p>List list list</p>', dojo.query('#bookmarksContainer .bookmarks')[0]);
        }

        
	});

});