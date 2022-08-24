$.urlParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)')
        .exec(window.location.search);
    return (results !== null) ? results[1] || 0 : false;
}
console.log($.urlParam('plugins'));
window.ifa = '';
window.bundleId = '';
window.sessionId = '';
var ifa = $.urlParam('ifa');
var bundleId = $.urlParam('bundleId');
var sessionId = $.urlParam('sessionId');

if(sessionId){
    window.sessionId = sessionId;
}

if(ifa){
    window.ifa = ifa;
}

if(bundleId){
    window.bundleId = bundleId;
}

var availablePlugins = [];

(function () {
    if (window.pmMonitor) { return; }
    class EventObserver {
        constructor() {
            this.observers = [];
        }

        subscribe(fn) {
            this.observers.push(fn);
        }

        unsubscribe(fn) {
            this.observers = this.observers.filter((subscriber) => subscriber !== fn);
        }

        broadcast(data) {
            this.observers.forEach((subscriber) => subscriber(data));
        }
    }
    window.pmMonitor = new EventObserver();
})();

function broadcast(msg) {
    if (pmMonitor) {
        pmMonitor.broadcast(msg);
    }
}

$(function () {
    for (var index = 0; index < availablePlugins.length; ++index) {
        var obj = availablePlugins[index];
        if (obj != undefined) {

            var pluginsFlag = parseInt($.urlParam('plugins'));
            if (pluginsFlag & (index+1)) {
                console.log("Loading plugin "+obj.name);

                var tagText = '<div id="' + obj.name + '">';

                $("body").append(tagText);
                var tag = '#' + obj.name;
                $(tag).load(obj.plugin);
            }else{
                console.log("Skipping plugin load "+obj.name);
            }

        }
    }
});

function addPlugin(name, plugin, bitIndex) {
    console.log('Adding plugin ' + name);
    availablePlugins[bitIndex] = { name: name, plugin: plugin };
} 

$( document ).ready(function() {
    monitorBridge.finishLoading({});
})