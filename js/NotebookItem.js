define(["dojo/_base/declare", 
        "dojo/request",
        "dojo/_base/lang",
        "dojo/on", 
        "dojo/mouse",
        "dojo/dom-construct",
        "dojo/query",
        
        "bootstrap/Collapse",
        "bootstrap/Dropdown",

        "dojo/text!ask/tmpl/NotebookItemTemplate.html",
        "lib/mustache",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
    ],
    function(
        declare, request, lang, on, mouse, domConstruct, query,
        BCollapse, BDropdown,
        template, mustache, 
        _WidgetBase, _TemplatedMixin) {

    return declare("ask.NotebookItem", [_WidgetBase, _TemplatedMixin], {
        notebookId: '',
        templateString: template,
        isOwner: false,
        canEdit: false,
        annotationNum: 0,
        createdBy: 'unknown',
        createdAt: '',
        state: 'loading',
        // _skipNodeCache forces dojo to call _stringRepl, thus using mustache
        _skipNodeCache: true,
        render: function() {
            var node;
            if (this.domNode) {
                node = domConstruct.place(this._stringRepl(this.templateString), this.domNode, 'before');
                this.destroyDescendants();
                domConstruct.destroy(this.domNode);
            } else {
                node = dojo._toDom(this.templateString);
            }
            this.domNode = node; 
        },
        _stringRepl: function(tmpl) {
            return mustache.render(tmpl, this);
        },
        postMixInProperties: function() {
            var self = this;
            
            self.inherited(arguments);

            // Render a different link if we own the notebook
            if (self.isOwner) {
                self.href = "#/myNotebooks/" + self.notebookId;
            } else {
                self.href = "#/notebooks/" + self.notebookId;
            }
            
            self.loadMeta();
        },
        startup: function() {
            var self = this,
                sel = '[data-nb-item="'+self.notebookId+'"]',
                q;
                                        
            if (self.canEdit) {
                q = query('#tab-myAsk');
                                
                q.on(sel+' .delete-notebook:click', function() {
                    if (!confirm("Deleting this notebook will delete all its annotation.\nAre you sure?")) return;
                    ASK.myAsk._deleteNotebook(self.notebookId);
                });
                q.on(sel+' .rename-notebook:click', function() {
                    var name;
                    if (name = prompt('New name?'))
                        ASK.myAsk._renameNotebook(self.notebookId, name);
                });
                q.on(sel+' .set-private:click', function() {
                    ASK.myAsk._setNotebookVisibility(self.notebookId, 'private');
                });
                q.on(sel+' .set-public:click', function() {
                    ASK.myAsk._setNotebookVisibility(self.notebookId, 'public');
                });
                q.on(sel+' .content:click', function() {
                    if (self.state === 'loaded') ASK.routeTo(self.href);
                });
                
            } else {
                q = query('#tab-notebooks');
                q.on(sel+' .content:click', function() {
                    if (self.state === 'loaded') ASK.routeTo(self.href);
                });
            }
        }, // startup()

        loadMeta: function(id) {
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

                        if (ASK.ns.notebooks.created in data[i])  {
                            self.createdAt = new Date(data[i][ASK.ns.notebooks.created][0].value);
                        } else {
                            console.log('Senza created ??! ', data[i]);
                        }
                        
                        if (ASK.ns.notebooks.includes in data[i]) 
                            self.annotationNum = data[i][ASK.ns.notebooks.includes].length;

                        if (!self.isOwner) {
                            ASK.nbStats.anns += self.annotationNum;
                            if (self.createdBy in ASK.nbStats.authors) {
                                ASK.nbStats.authors[self.createdBy].nbks++;
                                ASK.nbStats.authors[self.createdBy].anns += self.annotationNum;
                            } else {
                                ASK.nbStats.authors[self.createdBy] = {nbks: 1, anns: self.annotationNum};
                                ASK.nbStats.auth++;
                            }
                        }
                    }
                    
                    ASK.nbProgressCounter++;
                    ASK.updateNBProgress();
                    self.state = 'loaded';
                    
                    self.title_l = self.title.toLowerCase();
                    if (self.createdAt) {
                        self.createdAt_l = self.createdAt.toDateString().toLowerCase();
                        self.createdAt_ux = self.createdAt.getTime();
                    } else 
                        self.createdAt_l = 'Uknown date';
                        
                    self.createdBy_l = self.createdBy.toLowerCase();
                    
                    self.render();
                }, 
                function(error) {
                    console.log('error :|');
                }
            ); // then
            
        },
        
    });

});