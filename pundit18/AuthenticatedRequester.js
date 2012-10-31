/**
 * @class pundit.authenticatedRequests
 * @extends pundit.baseComponent
 * @description Provides facilities to interact with the pundit server, through
 * authenticated API Calls. The authentication is granted by an OpenID workflow,
 * initialized here and carried on by the server. When logged in, this component
 * notifies the user and executes any previously blocked request, which needed
 * authentication to work.
 */
define([
        "dojo/_base/declare",
        "dojo/parser",
        "pundit/BaseComponent",

        "bootstrap/Modal",

        "dojo/text!pundit/tmpl/PunditLoginModalTemplate.html",

        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"
    ], 
        
    function(
        declare, 
        parser,
        BaseComponent,

        BModal,

        LoginModalTemplate,

        _WidgetBase,
        _TemplatedMixin
    ) {

    return declare("pundit.AuthenticatedRequester", [BaseComponent, _WidgetBase, _TemplatedMixin], {

    templateString: LoginModalTemplate,
    redirectURL: "http://metasound.dibet.univpm.it/annotationserver/login.jsp",
    
    opts: {
        loginTimerMS: 500,
        loginAutomaticHideMS: 2000
    },

    blockedRequests: [],

    /**
    * @constructor
    * @description Initializes the component
    * @param options {object}
    * @param options.debug {boolean} wether or not to activate debug mode for this component
    * @param options.loginTimerMS {number, milliseconds} Polling interval to check if the user
    * completed the login workflow in the external OpenID window
    * @param options.loginAutomaticHideMS {number, milliseconds} Time to wait before automatically
    * hide the login panel, when login has been completed.
    */
    constructor: function(options) {
        var self = this;
        
        self.inherited(arguments);
        	    
	    /**
        * @event onLogin
        * @param f(data) {function} function to be called.<br>
        * data is the json object coming from the server on succesfull login. 
        * @description Called when the user succesfully completes the OpenID 
        * authentication workflow.
        */

	    /**
        * @event onLogout
        * @param f(data) {function} function to be called.<br>
        * data is the json object coming from the server on succesfull logout. 
        * @description Called when the user succesfully logs out.
        */
        self.createCallback(['login', 'logout']);
        
        self.log('Authenticated requests component up and running!');
        
    },
    startup: function() {
        var self = this;
        self.initLoginDialog();
        
        self.log('Startup done');
    },

    initLoginDialog: function() {
        var self = this;
        
        dojo.connect(dojo.byId('pundit-login-open-button'), 'onclick', function() {
            self.log('Opening the login dialog');
            self.openLoginPopUp();
        });
        
        dojo.connect(dojo.byId('pundit-login-close-button'), 'onclick', function() { 
            self.log('Closing the login dialog');
            self.hideLogin();
            clearTimeout(self.loginTimer);
        });
	    
    },
    
    showLogin: function() {
        dojo.query('#pundit-login-modal').modal('show');
    },
    
    hideLogin: function() {
        dojo.query('#pundit-login-modal').modal('hide');
    },
	
    /**
    * @method xGet
    * @description Performs an HTTP get through an authenticated Ajax call.
    * @param options {object} the same object one would pass to a 
    * normal dojo xhrGet().
    */
    xGet: function(callParams) {
        return dojo.xhrGet(this.setWrappingCallParams(callParams));	
    },
	
    /**
    * @method xPost
    * @description Performs an HTTP post through an authenticated Ajax call.
    * @param options {object} the same object one would pass to a 
    * normal dojo xhrPost().
    */
    xPost: function(callParams) {
        dojo.xhrPost(this.setWrappingCallParams(callParams));
    },
	
    /**
    * @method xPut
    * @description Performs an HTTP put through an authenticated Ajax call.
    * @param options {object} the same object one would pass to a 
    * normal dojo xhrPut().
    */
    xPut: function(callParams) {
        dojo.xhrPut(this.setWrappingCallParams(callParams));
    },
	
    /**
    * @method xDelete
    * @description Performs an HTTP delete through an authenticated Ajax call.
    * @param options {object} the same object one would pass to a 
    * normal dojo xhrDelete().
    */
    xDelete: function(callParams) {
        dojo.xhrDelete(this.setWrappingCallParams(callParams));
    },
	
    showLoginForm: function(redirectURL) {
        var self = this;
        
        self.redirectURL = redirectURL;
        // this.dialog.attr("title", 'You are not logged in!');
        dojo.query('#pundit-login-popup-content').removeClass('logged').removeClass('waiting');
        // this.dialog.show();
        self.showLogin();
    },
	
    openLoginPopUp : function() {
        var self = this;

        window.open(self.redirectURL, 'loginpopup', 'left=260,top=120,width=480,height=360');

        dojo.query('#pundit-login-modal .modal-body')
            .removeClass('pundit-login-state-off')
            .addClass('pundit-login-state-waiting');

        self.loginTimer = setTimeout(function() {
            self.checkLogin();
        }, self.opts.loginTimerMS);

    },

    checkLogin: function(f) {
        var self = this;
        
        var args = {
            url: "http://metasound.dibet.univpm.it/annotationserver/api/users/current",
            handleAs: "json",
            headers: {
                "Accept":"application/json"
            },
            load: function(data) {
                if (typeof(data) === 'undefined' || typeof(data.loginStatus) === 'undefined') { 
                    data = {
                        loginStatus: 0
                    };
                }
                
                if (typeof(f) === 'function') {
                    f(data);
                    return;
                } else if (data.loginStatus == 0) {
                    self.log('Not logged in.. yet...');
                    self.loginTimer = setTimeout(function() {
                        self.checkLogin();
                    }, self.opts.loginTimerMS);
                    return;
                }
                self.login(data);
            },
            error: function(error) {}
        }

        self.xGet(args);
    }, // checkLogin()
    
    login: function(data) {
        var self = this;
        
        dojo.query('#pundit-login-modal-title')
            .html("You are now logged in!");

        dojo.query('#pundit-login-modal .modal-body span.username')
            .html(data.fullName+" ("+data.email+")");
            
        dojo.query('#pundit-login-modal .modal-body')
            .removeClass('pundit-login-state-waiting')
            .addClass('pundit-login-state-logged');
        
        for (var i = self.blockedRequests.length; i--;) 
            self.xGet(self.blockedRequests[i]);
      
        self.fireOnLogin(data);
        
        self.log(data.fullName+" ("+data.email+")");
        
        setTimeout(function() { 
            self.hideLogin();
        }, self.opts.loginAutomaticHideMS);
        
    },
    
    logout: function(f) {
        var self = this;
        
        clearTimeout(self.loginTimer);
        
        var args = {
            url: "http://metasound.dibet.univpm.it/annotationserver/api/users/logout",
            handleAs: "json",
            headers: {
                "Accept":"application/json"
            },
            load: function(data) {
                var msg;
                if (typeof(data) !== 'undefined' && typeof(data.logout) !== 'undefined') {
                    data.msg = (data.logout == 1) ? 'Logged out succesfully' : 'You werent logged in.. and you still arent.';

                    if (typeof(f) === 'function')
                        f(data);

                    self.fireOnLogout(data);
                }
            },
            error: function(error) {}
        }

        self.xGet(args);
    },

    setWrappingCallParams : function(originalCallParams) {
        var self = this,
            wrappedParams = {
                'withCredentials': true
            },
            key;

        for (key in originalCallParams) 
            if (key !== "load") 
                wrappedParams[key] = originalCallParams[key];
            else 
                wrappedParams[key] = function(r) {
                    if (r && typeof(r.redirectTo) !== "undefined") {
                        self.blockedRequests.push(wrappedParams);
                        self.showLoginForm(r.redirectTo);
                    } else 
                        originalCallParams.load(r);
                }

        return wrappedParams;
    }

    });
});