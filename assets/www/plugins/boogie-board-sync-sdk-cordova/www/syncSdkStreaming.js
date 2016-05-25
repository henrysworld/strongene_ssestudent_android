cordova.define("boogie-board-sync-sdk-cordova.syncSdkStreaming", function(require, exports, module) {
/*global cordova*/
module.exports = {
    MODE_NONE:1,
    MODE_CAPTURE:4,
    MODE_FILE:5,

    STATE_CONNECTED: "STATE_CONNECTED",
    STATE_CONNECTING: "STATE_CONNECTING",
    STATE_DISCONNECTED: "STATE_DISCONNECTED",
    STATE_LISTENING: "STATE_LISTENING",

    ERROR_CANT_FIND_PAIRED_DEVICE: 1,

    // list bound devices
    start: function (success, failure) {
        console.log("$$$ starting... ");
        cordova.exec(success, failure, "SyncSdkStreaming", "start", []);
    },
    end: function (success, failure) {
        console.log("$$$ ending... ");
        cordova.exec(success, failure, "SyncSdkStreaming", "end", []);
    },
    restart: function (success, failure) {
        console.log("$$$ ending... ");
        cordova.exec(success, failure, "SyncSdkStreaming", "restart", []);
    },
    getState: function ( success ) {
        console.log("$$$ getState... ");
        var stateStringList = [ "STATE_CONNECTED", "STATE_CONNECTING", "STATE_DISCONNECTED", "UNDEFINED", "STATE_LISTENING"];
        cordova.exec(_success, failure, "SyncSdkStreaming", "getState", []);
        function failure() { console.log( "getState Failed" )}
        function _success( i ) { success( stateStringList[i] ); }
    },
    eraseSync: function ( ) {
        console.log("$$$ eraseSync... ");
        cordova.exec(success, failure, "SyncSdkStreaming", "eraseSync", []);
        function success() {}
        function failure() { console.log( "eraseSync Failed" )}
    },
    setSyncMode: function ( id ) {
        /*
         public static final int MODE_NONE = 1;     // silent
         public static final int MODE_CAPTURE = 4;  // all
         public static final int MODE_FILE = 5;     // file only
         */
        console.log("$$$ setSyncMode... ");
        cordova.exec(success, failure, "SyncSdkStreaming", "setSyncMode", [id]);
        function success() {}
        function failure() { console.log( "setSyncMode Failed" )}
    },
    subscribe: function (onStreamingStateChange, onErase, onSave,
                         onCaptureReport, onServiceConnected,
                         onServiceDisconnected, onDestroy, onError ) {
        function successWrapper( json ) {
            switch( json.type ) {
                case "subscribeTest":
                    console.log("$$$ test data: " + json.data );
                    break;
                case "onStreamingStateChange":
                    /*
                     json.put( "stateIdPrev", prevState );
                     json.put( "stateIdNew", newState );
                     */
                    var stateStringList = [ "STATE_CONNECTED", "STATE_CONNECTING", "STATE_DISCONNECTED", "UNDEFINED", "STATE_LISTENING"];
                    console.log( "onStreamingStateChange: " + stateStringList[ json.stateIdPrev ] + "->" + stateStringList[ json.stateIdNew ]);
                    onStreamingStateChange( stateStringList[ json.stateIdNew ], stateStringList[ json.stateIdPrev ] );
                    break;
                case "onErase":
                    console.log( "$$$ " + JSON.stringify( json ) );
                    onErase();
                    break;
                case "onSave":
                    console.log( "$$$ " + JSON.stringify( json ) );
                    onSave();
                    break;
                case "onError":
                    var errorList = ["", "ERROR_CANT_FIND_PAIRED_DEVICE", "ERROR_CANT_FIND_PAIRED_DEVICE_REBOOT" ];
                    onError( errorList[ json.error ], json.message );
                    break;
                case "onCaptureReport":
                    /*
                     json.put( "getX", captureReport.getX() );
                     json.put( "getY", captureReport.getY() );
                     json.put( "getPressure", captureReport.getPressure() );
                     json.put( "hasTipSwitchFlag", captureReport.hasTipSwitchFlag() );
                     */
                    onCaptureReport( json );
                    break;
                case "onServiceConnected":
                    /*
                     json.put( "isSuccess", mStreamingService.getState() == SyncStreamingService.STATE_CONNECTED );
                     */
                    console.log( "$$$ " + JSON.stringify( json ) );
                    onServiceConnected( json.isSuccess );
                    break;
                case "onServiceDisconnected":
                    console.log( "$$$ " + JSON.stringify( json ) );
                    onServiceDisconnected();
                    break;
                case "onDestroy":
                    console.log( "$$$ " + JSON.stringify( json ) );
                    onDestroy();
                    break;
            }

        }
        function failure() {}
        console.log("### subscribe... ");
        cordova.exec(successWrapper, failure, "SyncSdkStreaming", "subscribe", []);
    },

    unsubscribe: function (success, failure) {
        console.log("### unsubscribe... ");
        cordova.exec(success, failure, "SyncSdkStreaming", "unsubscribe", []);
    }

};
});
