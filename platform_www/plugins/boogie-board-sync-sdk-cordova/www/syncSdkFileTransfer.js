cordova.define("boogie-board-sync-sdk-cordova.syncSdkFileTransfer", function(require, exports, module) {
/*global cordova*/
module.exports = {
    STATE_CONNECTED: "STATE_CONNECTED",
    STATE_CONNECTING: "STATE_CONNECTING",
    STATE_DISCONNECTED: "STATE_DISCONNECTED",
    // list bound devices
    start: function (success, failure) {
        console.log("$$$ starting... ");
        cordova.exec(success, failure, "SyncSdkFileTransfer", "start", []);
    },
    end: function (success, failure) {
        console.log("$$$ ending... ");
        cordova.exec(success, failure, "SyncSdkFileTransfer", "end", []);
    },
    getFile: function ( index ) {
        console.log("$$$ getFile... ");
        cordova.exec(success, failure, "SyncSdkFileTransfer", "getFile", [index]);
        function success() {}
        function failure() { console.log( "getFile Failed" )}
    },
    deleteFile: function (  name ) {
        console.log("$$$ deleteFile... ");
        cordova.exec(success, failure, "SyncSdkFileTransfer", "deleteFile", [name]);
        function success() {}
        function failure() { console.log( "deleteFile Failed" )}
    },
    changeFolder: function ( name ) {
        console.log("$$$ changeFolder...: " + name );
        cordova.exec(success, failure, "SyncSdkFileTransfer", "changeFolder", [name]);
        function success() {}
        function failure() { console.log( "changeFolder Failed" )}
    },
    getDirectoryUri: function ( success ) {
        console.log("$$$ getDirectoryUri... ");
        cordova.exec(success, failure, "SyncSdkFileTransfer", "getDirectoryUri", []);
        function failure() { console.log( "getDirectoryUri Failed" )}
    },
    getState: function ( success ) {
        console.log("$$$ getState... ");
        var stateStringList = [ "STATE_CONNECTED", "STATE_CONNECTING", "STATE_DISCONNECTED"];
        cordova.exec(_success, failure, "SyncSdkFileTransfer", "getState", []);
        function failure() { console.log( "getState Failed" )}
        function _success( i ) { success( stateStringList[i] ); }
    },
    subscribe: function ( onDestroy, onFtpDeviceStateChange,
                          onConnectComplete, onDisconnectComplete,
                          onFolderListingComplete, onChangeFolderComplete,
                          onDeleteComplete, onGetFileComplete,
                          onServiceConnected, onServiceDisconnected ) {
        function successWrapper( json ) {
            var stateStringList = [ "STATE_CONNECTED", "STATE_CONNECTING", "STATE_DISCONNECTED"];

            console.log( "$$$ " + JSON.stringify( json ) );
            switch( json.type ) {
                case "subscribeTest":
                    console.log("$$$ test data: " + json.data );
                    break;
                case "onDestroy":
                    onDestroy();
                    break;
                case "onFtpDeviceStateChange":
                    /*
                     json.put( "type", "onFtpDeviceStateChange" );
                     json.put( "stateIdPrev", oldState );
                     json.put( "stateIdNew", newState );
                     */
                    onFtpDeviceStateChange( stateStringList[ json.stateIdNew ], stateStringList[ json.stateIdPrev ] );
                    break;
                case "onConnectComplete":
                    /*
                     json.put( "isSuccess", result == SyncFtpService.RESULT_OK );
                     */
                    onConnectComplete( json.isSuccess );
                    break;
                case "onDisconnectComplete":
                    onDisconnectComplete();
                    break;
                case "onFolderListingComplete":
                    /*
                     json.put( "isSuccess", result == SyncFtpService.RESULT_OK );
                     json.put( "data", jsonData );
                     */
                    if ( json.isSuccess ) {
                        console.log("$$$ btoa: " + json.data );
                        onFolderListingComplete( json.data );
                    }
                    else
                        alert("SyncSdkFileTransfer.js: onFolderListingComplete Failed");
                    break;
                case "onChangeFolderComplete":
                    /*
                     json.put( "type", "onChangeFolderComplete" );
                     json.put( "uri", uri );
                     */
                    onChangeFolderComplete( json.uri );
                    break;
                case "onDeleteComplete":
                    onDeleteComplete();
                    break;
                case "onGetFileComplete":
                    /*
                     json.put( "type", "onGetFileComplete" );
                     json.put( "item", itemData );
                     */
                    onGetFileComplete( json.item );
                    break;
                case "onServiceConnected":
                    /*
                     json.put( "isSuccess", mFtpService.getState() == SyncStreamingService.STATE_CONNECTED );
                     */
                    onServiceConnected( json.isSuccess );
                    break;
                case "onServiceDisconnected":
                    onServiceDisconnected();
                    break;
            }

        }
        function failure() {}
        console.log("### subscribe... ");
        cordova.exec(successWrapper, failure, "SyncSdkFileTransfer", "subscribe", []);
    },

    unsubscribe: function (success, failure) {
        console.log("### unsubscribe... ");
        cordova.exec(success, failure, "SyncSdkFileTransfer", "unsubscribe", []);
    }

};
});
