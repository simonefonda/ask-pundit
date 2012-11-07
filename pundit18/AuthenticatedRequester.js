/**
 * @class pundit.authenticatedRequester
 * @extends pundit.baseComponent
 * @description Provides facilities to interact with the pundit server, through
 * authenticated API Calls. The authentication is granted by an OpenID workflow,
 * initialized here and carried on by the server. When logged in, this component
 * notifies the user and executes any previously blocked request, which needed
 * authentication to work.
 */
define([
        "dojo/on",
        "dojo/_base/declare",
        "dojo/parser",
        "pundit/BaseComponent",
        "bootstrap/Modal",
        "dojo/text!pundit/tmpl/PunditLoginModalTemplate.html",
        "dijit/_WidgetBase", 
        "dijit/_TemplatedMixin"
    ], 
        
    function(
        on,
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
    
    // TODO: can be removed from here and just taken from the first auth request or
    // is logged in
    redirectURL: "http://metasound.dibet.univpm.it/annotationserver/login.jsp",
    
    _loggedIn: false,
    _logginInAs: {},
    
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
        self._initLoginDialog();
        self.log('Startup done');
    },

    /**
    * @method xGet
    * @description Performs an HTTP get through an authenticated Ajax call.
    * @param options {object} the same object one would pass to a 
    * normal dojo xhrGet().
    */
    xGet: function(callParams) {
        return dojo.xhrGet(this._setWrappingCallParams(callParams));	
    },
	
    /**
    * @method xPost
    * @description Performs an HTTP post through an authenticated Ajax call.
    * @param options {object} the same object one would pass to a 
    * normal dojo xhrPost().
    */
    xPost: function(callParams) {
        dojo.xhrPost(this._setWrappingCallParams(callParams));
    },
	
    /**
    * @method xPut
    * @description Performs an HTTP put through an authenticated Ajax call.
    * @param options {object} the same object one would pass to a 
    * normal dojo xhrPut().
    */
    xPut: function(callParams) {
        dojo.xhrPut(this._setWrappingCallParams(callParams));
    },
	
    /**
    * @method xDelete
    * @description Performs an HTTP delete through an authenticated Ajax call.
    * @param options {object} the same object one would pass to a 
    * normal dojo xhrDelete().
    */
    xDelete: function(callParams) {
        dojo.xhrDelete(this._setWrappingCallParams(callParams));
    },

    _initLoginDialog: function() {
        var self = this;

        self._setLoginState('off');

        on(dojo.byId('pundit-login-open-button'), 'click', function() {
            self.log('Opening the login dialog');
            self._openLoginPopUp();
        });

        on(dojo.byId('pundit-login-open-button-again'), 'click', function() {
            self.log('Opening the login dialog');
            self._openLoginPopUp();
        });
        
        on(dojo.byId('pundit-login-close-button'), 'click', function() { 
            self.log('Closing the login dialog');
            self.hideLogin();
            clearTimeout(self.loginTimer);
        });

        // Clear the _checklogin timeout if the modal gets closed
        on(dojo.byId('pundit-login-modal'), 'hidden', function() {
            clearTimeout(self.loginTimer);
        });
	    
    },

    _openLoginPopUp: function() {
        var self = this;

        window.open(self.redirectURL, 'loginpopup', 'left=260,top=120,width=480,height=360');

        self._setLoginState('waiting');
            
        clearTimeout(self.loginTimer);
        self._checkLogin();
    },
    
    _setLoginState: function(s) {
        dojo.query('#pundit-login-modal')
            .removeClass('pundit-login-state-off pundit-login-state-waiting pundit-login-state-logged')
            .addClass('pundit-login-state-'+s);
    },
    
    _checkLogin: function() {
        var self = this;

        clearTimeout(self.loginTimer);
        self.loginTimer = setTimeout(function() {
            self.log('Not logged in.');
            self.isLoggedIn(function(b) {
                if (!b) self._checkLogin();
            });
        }, self.opts.loginTimerMS);
        
    },

    /**
      * @method isLoggedIn
      * @description Checks with the server if an user is logged in. Will call
      * the given callback passing true or false
      * @param f {function} Callback to be called when the check is done
      */
    isLoggedIn: function(f) {
        var self = this;
        
        var args = {
            url: "http://metasound.dibet.univpm.it/annotationserver/api/users/current",
            handleAs: "json",
            headers: {
                "Accept":"application/json"
            },
            load: function(data) {
                
                // If the json is not what we expect, normalize it a bit
                if (typeof(data) === 'undefined' || typeof(data.loginStatus) === 'undefined') { 
                    data = { loginStatus: 0 };
                    
                // If we see a .loginServer field: save it as redirectURL
                } else if (typeof(data.loginServer) !== "undefined")
                    self.redirectURL = data.loginServer;

                // First time we see we're logged: fire the onLogin(), modify 
                // the modal content etc. Same for logout.
                if (data.loginStatus === 1) {
                    if (self._loggedIn === false) self._afterLogin(data);
                    if (typeof(f) === 'function') f(true, data);
                } else {
                    if (self._loggedIn === true) self._afterLogout();
                    if (typeof(f) === 'function') f(false);
                }
                return false;
                
            },
            error: function(error) {}
        }

        self.xGet(args);
    }, // isLoggedIn()

    /**
      * @method login
      * @description If the user is logged, does nothing. If not, starts the
      * login procedures, opening the modal login dialog first
      */
     login: function() {
        var self = this;
        
        // If we're logged in already, do nothing
        self.isLoggedIn(function(b) {
            if (b) return;
            self.log('Login() opening the login window')
            self._setLoginState('off');
            self.showLogin();
        })
        
    },
    
    /**
      * @method logout
      * @description Logs out any logged in user by calling the relative
      * server API
      */
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

                    if (typeof(f) === 'function') f(data);
                    if (self._loggedIn === true) self._afterLogout(data);
                }
            },
            error: function(error) {}
        }

        self.xGet(args);
    },

    /**
      * @method showLogin
      * @description Shows the login modal dialog
      */
    showLogin: function() {
        dojo.query('#pundit-login-modal').modal('show');
    },
    
    hideLogin: function() {
        if (dojo.hasClass('pundit-login-modal', 'in'))
            dojo.query('#pundit-login-modal').modal('hide');
    },

    // Automatically called when the login happens
    _afterLogin: function(data) {
        var self = this;

        self.log("Logged in as: " + data.fullName+" ("+data.email+")");
        
        self._loggedIn = true;
        self._loggedInAs = data;
        
        // Modify the modal: we are logged in
        self._setLoginState('logged');
        dojo.query('#pundit-login-modal .modal-body span.username')
            .html(data.fullName+" ("+data.email+")");
            
        // exectue any pending blocked requests
        for (var i = self.blockedRequests.length; i--;) 
            self.xGet(self.blockedRequests[i]);
      
        // Hide the modal, if open
        setTimeout(function() { 
            self.hideLogin();
        }, self.opts.loginAutomaticHideMS);

        self.fireOnLogin(data);
        
    },
    
    // Automatically called when the logout happens
    _afterLogout: function(data) {
        var self = this;

        self._loggedIn = false;
        self._loggedInAs = {};

        dojo.query('#pundit-login-modal .modal-body span.username')
            .html("");
            
        self._setLoginState('off');
        self.fireOnLogout(data);
        
    },

    _setWrappingCallParams : function(originalCallParams) {
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
                        self.redirectURL = r.redirectTo;
                        self.showLogin();
                    } else 
                        originalCallParams.load(r);
                }

        return wrappedParams;
    }

    });
});