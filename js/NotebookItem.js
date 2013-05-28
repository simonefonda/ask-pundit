define(["dojo/_base/declare", 
        "dojo/request",
        "dojo/_base/lang",
        "dojo/on", 
        "dojo/mouse",
        "dojo/text!ask/tmpl/NotebookItemTemplate.html",
        "dojox/dtl/_DomTemplated",
        "dijit/_WidgetBase"],
    function(declare, request, lang, on, mouse, notebookItemTemplate, _DTLDOMTemplated, _WidgetBase) {

    return declare("ask.NotebookItem", [_WidgetBase, _DTLDOMTemplated], {
        notebookId: '',
        templateString: notebookItemTemplate,
        isOwner: false,
        canEdit: false,
        annotationNum: 0,
        createdBy: 'unknown',
        createdAt: '',
        state: 'loading',
        postMixInProperties: function() {
            var self = this;
            
            self.inherited(arguments);

            // Render a different link if we own the notebook
            if (self.isOwner) {
                self.href = "#/myNotebooks/" + self.notebookId;
            } else {
                self.href = "#/notebooks/" + self.notebookId;
            }
            
            self.loadNotebooksMeta();
        },
        startup: function() {
            var self = this,
                sel = '[data-nb-item="'+self.notebookId+'"]';
                                        
            if (self.canEdit) {
                on(dojo.query(sel+' .delete-notebook')[0], 'click', function() {
                    if (!confirm("Deleting this notebook will delete all its annotation.\nAre you sure?")) return;
                    ASK.myAsk._deleteNotebook(self.notebookId);
                });

                on(dojo.query(sel+' .rename-notebook')[0], 'click', function() {
                    var name;
                    if (name = prompt('New name?'))
                        ASK.myAsk._renameNotebook(self.notebookId, name);
                });

                on(dojo.query(sel+' .set-private')[0], 'click', function() {
                    ASK.myAsk._setNotebookVisibility(self.notebookId, 'private');
                });
                on(dojo.query(sel+' .set-public')[0], 'click', function() {
                    ASK.myAsk._setNotebookVisibility(self.notebookId, 'public');
                });
                
                on(dojo.query('#tab-myAsk '+sel+' .content')[0], 'click', function() {
                    if (self.state === 'loaded') ASK.routeTo(self.href);
                });
                
            } else {
                on(dojo.query('#tab-notebooks '+sel+' .content')[0], 'click', function() {
                    if (self.state === 'loaded') ASK.routeTo(self.href);
                });
            }
        }, // startup()

        // TODO: to show notebook's meta.. this is duplicating a call:
        // same as notebook item metadata ...
        loadNotebooksMeta: function(id) {
            var self = this,
                id = self.notebookId,
                url, requester;
                
            if (self.isOwner) {
                url = lang.replace(ASK.ns.asNotebooksMeta, {id: id});
                requester = ASK.requester;
            } else {
                url = lang.replace(ASK.ns.asOpenNotebooksMeta, { id: id });
                requester = request;
            }
            
            requester.get(url, {
                handleAs: "json",
                headers: { "Accept": "application/json" }
            }).then(
                function(data) {
                    for (var i in data) {
                        
                        self.title = "Uknown title";
                        if (ASK.ns.rdfs_label in data[i]) 
                            self.title = data[i][ASK.ns.rdfs_label][0].value;
                        self.annotationNum = 0;
                        self.createdBy = 'unknown';
                            
                        if (ASK.ns.notebooks.creatorName in data[i]) 
                            self.createdBy = data[i][ASK.ns.notebooks.creatorName][0].value || 'unknown';

                        if (ASK.ns.notebooks.visibility in data[i]) {
                            self.isPublic = data[i][ASK.ns.notebooks.visibility][0].value === "public";
                            self.isPrivate = !self.isPublic;
                        }

                        if (ASK.ns.notebooks.created in data[i]) 
                            self.createdAt = (new Date(data[i][ASK.ns.notebooks.created][0].value)).toDateString();
                        
                        if (ASK.ns.notebooks.includes in data[i]) 
                            self.annotationNum = data[i][ASK.ns.notebooks.includes].length;

                        if (!self.isOwner) {
                            ASK.stats.anns += self.annotationNum;
                            if (self.createdBy in ASK.stats.authors) {
                                ASK.stats.authors[self.createdBy].nbks++;
                                ASK.stats.authors[self.createdBy].anns += self.annotationNum;
                            } else {
                                ASK.stats.authors[self.createdBy] = {nbks: 1, anns: self.annotationNum};
                                ASK.stats.auth++;
                            }
                        }
                    }
                    if (!self.isOwner) 
                        ASK.updateStats();
                    self.state = 'loaded';
                    self.render();
                }, 
                function(error) {
                    console.log('error :|');
                }
            ); // then
            
        },
        
    });

});