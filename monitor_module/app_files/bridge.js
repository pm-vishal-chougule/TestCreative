(function () {

    if (window.monitorBridge) {
        return;
    }

    var hostNotify = function (hash) { // eslint-disable-line
        // To be added by individual SDK variant
        // iOS -->

        try {
             if (getSystemOS() === 'iOS') {
                 webkit.messageHandlers.native.postMessage(hash);
             } else if (getSystemOS() === 'Android') {
                 nativeBridge.nativeCall(JSON.stringify(hash));
             } else {
                 console.log("Host OS is different than Android and iOS, skipping call: " + JSON.stringify(hash));
             }
            nativeBridge.nativeCall(JSON.stringify(hash));
        } catch (error) {
            console.log(error.message);
            console.log("Failed while trying method : " + JSON.stringify(hash));
        }
    };

    var getSystemOS = function () {
        var userAgent = navigator.userAgent || navigator.vendor || window.opera;

        // Windows Phone must come first because its UA also contains "Android"
        if (/windows phone/i.test(userAgent)) {
            return "Windows Phone";
        }

        if (/android/i.test(userAgent)) {
            return "Android";
        }
        // iOS detection from: http://stackoverflow.com/a/9039885/177710
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            return "iOS";
        }
        return "unknown";
    };

    var hostLog = function (log) { // eslint-disable-line
        // To be added by individual SDK variant
        // iOS -->
        var call = {
            name: 'log',
            params: { msg: log }
        };
        hostNotify(call);
    };

    var attachPrefix = function (obj, fnName, prefixFn) {
        var fn = obj[fnName];

        return function () {
            var args = Array.prototype.slice.call(arguments);
            prefixFn(fnName, args);
            return fn.apply(obj, args);
        };
    };

    /**************************************************************************
     * Logger methods
     *************************************************************************/
    var logger = {

        debug: false,

        delegateConsoleLog: function () {
            console = {};

            console.log = function (log) { hostLog(log); };

            console.debug = console.log;
            console.info = console.log;
            console.warn = console.log;
            console.error = console.log;
        },


        attachLogToMethods: function (obj, label) {
            for (var field in obj) {
                if (obj.hasOwnProperty(field) && typeof obj[field] === 'function') {
                    obj[field] = attachPrefix(obj, field, function (name, args) {
                        logger.log(label + ' -> ' + name + '()', args);
                    });
                }
            }
        },

        log: function (text, args) {
            var log;
            if (this.debug) {
                log = text + (args ? ' | ' + JSON.stringify(args) : '');
                console.log(log);
            }
        }
    };

    /**************************************************************************
     * MRAID Config
     *************************************************************************/

    var STATES = {
        LOADING: 'loading',
        DEFAULT: 'default',
        EXPANDED: 'expanded',
        RESIZED: 'resized',
        HIDDEN: 'hidden'
    };

    var config = {

        state: STATES.DEFAULT
    }


    /**************************************************************************
     * MRAID Service for SDK
     * Service layer to handle the communication between SDK and mraid
     * @type {Object}
     *************************************************************************/
    var monitorBridge = function () { };

    monitorBridge.debug = function (val) {
        logger.debug = val !== false;
    };

    monitorBridge.nativeCallQueue = [];
    monitorBridge.nativeCallInFlight = false;

    monitorBridge.share = function (options) {
        monitorBridge.nativeInvoke("share", options);
    }

    monitorBridge.finishLoading = function (options) {
        monitorBridge.nativeInvoke("finishLoading", options);
    }

    monitorBridge.nativeInvoke = function (method, params) {
        /**
         * Section 4.2.1 from MRAID 3.0 spec
         */
        if (config.state === STATES.LOADING) {
            console.log('rejecting ' + method + ' because mraid is not ready');
            monitorBridge.handleMethodError('MRAID is not ready', method);
            return;
        }

        // var call = 'mraid://' + method + (params ? queryString(params) : ');
        var call = {
            name: method,
            params: params
        };
        this.nativeCallInFlight = false;
        if (this.nativeCallInFlight) {
            this.nativeCallQueue.push(call);
        } else {
            this.nativeCallInFlight = true;
            hostNotify(call);
        }
    };

    monitorBridge.nativeCallComplete = function () {
        if (this.nativeCallQueue.length === 0) {
            this.nativeCallInFlight = false;
        } else {
            hostNotify(this.nativeCallQueue.pop());
        }
    };


    monitorBridge.handleMethodError = function (message, action) {
        // Its not mentioned in specification to handle errors with events
        // So this can be changed in future if required
        // monitorBridge.fireErrorEvent(message, action);
        logger.log(message + action);
    };


    /**
     * Set multiple configuration properties at once
     * @param {obj} conf
     */
    monitorBridge.setConfig = function (conf) {
    }


    /**************************************************************************
     * Operations to global objects
     *************************************************************************/

    // If apple device then delegate the console log
    /*if ((/iphone|ipad|ipod/i).test(window.navigator.userAgent.toLowerCase())) {
        logger.delegateConsoleLog();
    }*/

    /**
     * Attach Logger
     */
    logger.attachLogToMethods(monitorBridge, 'MRAID Service');

    /**
     * Expose methods on window
     */
    window.addEventListener('error', function (e) {
        logger.log('Global Exception', e.error);
    });

    window.monitorBridge = monitorBridge;

})();
