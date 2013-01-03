/**
    Provides common facilities used by other pundit
    components, such as callback creation, initialization, logging, etc.
    
    Every component extending this class will be able to use these methods,
    and the options passed to the constructor.
    
    If the component has an .opts field, it will be used as defaults for the
    component, overwritable when calling new
    @class pundit.baseComponent
    @module pundit
    @constructor
    @example
        var x = new pundit.BaseComponent({
                debug: true,
                libName: 'myComponent'
            });
    @param options {object} See object properties
**/
define([
        "dojo/_base/declare"
    ], 
        
    function(
        declare
    ) {

    return declare("pundit.BaseComponent", [], {

    defaultOpts: {
        /**
            Enables debug messages for the component
            @property debug
            @type Boolean
            @default false
        **/
        debug: false,

        /**
            Name of the component, shown in debug messages
            @property libName
            @type String
            @default this.declaredClass
        **/
        libName: ''
    },

    /**
    * Initializes the component
    * @method constructor
    * @param options {object}
    * @param options.debug {boolean} wether or not to activate debug mode for the component
    * @param options.libName {string} component name visualized in debug messages. If not 
    * assigned explicitly dojo's 'declaredClass' field will be used.
    */
    constructor: function(options) {
        var self = this, 
            i;

        // If the class extending us doesnt have an .opts field, create it
        if (typeof(self.opts) === 'undefined')
            self.opts = {};

        // Copy in the baseComponent defaults, if the given .opts doesnt have it
        for (i in self.defaultOpts) 
            if (typeof(self.opts[i]) === 'undefined')
                self.opts[i] = self.defaultOpts[i];

        // If _PUNDIT, _PUNDIT.config and _PUNDIT.config.modules.THISMODULENAME are
        // defined, get that configuration and initialize the component
        if (typeof(_PUNDIT) !== 'undefined' && typeof(_PUNDIT.config) !== 'undefined'
                && typeof(_PUNDIT.config.modules[self.declaredClass]) !== 'undefined') {
            var configOpts = _PUNDIT.config.modules[self.declaredClass];
            for (i in configOpts) 
                self.opts[i] = configOpts[i];
        }

        // Finally overwrite any given field coming from options parameter
        for (i in options) 
            self.opts[i] = options[i];
        
        self.log('BaseConstructor built opts for '+self.declaredClass);

    }, // constructor

    /**
    * @method createCallback
    * @description Creates one or more callbacks for the component. For each 'name' passed
    * as parameter two methods will be created:<br>
    * onName(f) (first letter is automatically capitalized): used by other components to
    * subscribe a function to be called when the event hits. Optional parameters. <br>
    * fireOnName(data) (first letter is automatically capitalized): fires the event 
    * calling all of the subscribed callbacks passing data as parameter. This 
    * function must be called by the component when needed.
    * @param names {string or array of strings} Names of the callbacks to be created.
    */
    createCallback: function(name) {
        var self = this;

        // If it's not an array already, create one
        if (typeof(name) === 'string')
            name = [name];

        for (var n = name.length; n--;) {

            var current_name = name[n].substr(0,1).toUpperCase() + name[n].substr(1),
                callbacksArrayName = 'on' + current_name + 'Callbacks',
                callbacksName = 'on' + current_name,
                callbacksFireName = 'fireOn' + current_name;

            if (typeof(self[callbacksArrayName]) === 'undefined')
                self[callbacksArrayName] = [];

            // The onNAME method adds the passed in function among
            // the callbacks for that NAME
            self[callbacksName] = (function(cb_name) {
                return function(f) {
                    if (typeof(f) === 'function')
                        self[cb_name].push(f);
                }
            })(callbacksArrayName);

            // the fireOnNAME function will take the arguments
            // passed in, and call each of the registered callbacks
            // with those same parameters
            self[callbacksFireName] = (function(cb_name) {
                return function() {
                    //for (var i in self[cb_name]) 
                    for (var i = self[cb_name].length; i--;) 
                        self[cb_name][i].apply(self, arguments);
                }
            })(callbacksArrayName);

        } // for n in name
    }, // createCallback

    /**
    * @method log
    * @description Logs a debug message in the browser console or (if not
    * present) in a debug div appended to the document.
    * @param options {string} message to be logged.
    * @return boolean true if something has been logged, false otherwise
    */
    log: function(w) {
        var foo = this.opts.debug;
        
        // If there's an user supplied object and it says not to log, dont log.
        if (typeof(punditConfig) !== 'undefined' && punditConfig.debugAllModules === true)
            foo = true;

        if (foo === false) return false;
        
        var lib_name = (this.opts.libName !== "") ? this.opts.libName : this.declaredClass;
        if (typeof console === "undefined") {
            if (!dojo.query('#debug_foo'))
                $("body").append("<div id='debug_foo' style=' border: 3px solid yellow; font-size: 0.9em;'></div>");
            dojo.query("#debug_foo").append("<div>#"+lib_name+"# "+w+"</div>");
            return true;
        } else {
            console.log('#'+lib_name+'# '+w);
            return true;
        }
    } // log()

    });
});