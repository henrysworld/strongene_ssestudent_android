/**
 * Created by xjxxjxwork1017 on 2016/1/2.
 */

app.controller('fileTransferController', function ($rootScope, $log, $timeout, $scope) {
    var self = this;

    $scope.$on('$destroy', function () {
        // So some clean-up...
        console.log("# Destroy fileTransferController");
        self.end();
    });

    self.stateString = "current state";
    self.fileList = [ {
        name: "fake file",
        time: "today",
        size: 22,
        data: "1234858",
        isFile: false
    }];
    self.start = function() {
        syncSdkFileTransfer.getState( function success( data ) {
            // * Device is disconnected
            if ( syncSdkFileTransfer.STATE_DISCONNECTED == data ) {
                // * Initial connection
                syncSdkFileTransfer.subscribe( onDestroy, onFtpDeviceStateChange,
                    onConnectComplete, onDisconnectComplete,
                    onFolderListingComplete, onChangeFolderComplete,
                    onDeleteComplete, onGetFileComplete,
                    onServiceConnected, onServiceDisconnected );

                syncSdkFileTransfer.start( function success() {
                    console.log("##Success start SDK!!!");
                }, function failed( error ) {
                    console.log("##Failed start SDK!!!");
                });
            }
            else console.log("Error: [start] trying to connect to device in a wrong timing");
        });
    };

    self.end = function () {
        syncSdkFileTransfer.getState( function success( data ) {
            // * Device is connected
            if ( syncSdkStreaming.STATE_DISCONNECTED != data ) {
                // * Disconnect device
                syncSdkFileTransfer.end( function success() {
                    console.log("##Success end SDK!!!");
                }, function failed( error ) {
                    console.log("##Failed end SDK!!!");
                });
            }
            else console.log("Error: [start] trying to disconnect with device in a wrong timing");
        });
    };

    self.getDirectoryUri = function () {
        // * request current URI from sdk
        syncSdkFileTransfer.getDirectoryUri( function success( data ) {
            $timeout( function() {
                self.message = "URI: " + data;
            }, 0 );
        });
    };

    self.getState = function () {
        // * request current state from sdk
        syncSdkFileTransfer.getState( function success( data ) {
            $timeout( function() {
                self.message = "State: " + data;
            }, 0 );
        });
    };

    self.getFile = function ( $index ) {
        syncSdkFileTransfer.getFile( $index );
    };

    self.deleteFile = function ( $index ) {
        syncSdkFileTransfer.deleteFile( self.fileList[$index].name );
    };

    self.changeFolder = function ( $index ) {
        syncSdkFileTransfer.changeFolder( self.fileList[$index].name );
    };

    function onDestroy() {
        console.log("###onDestroy");
    }

    function onFtpDeviceStateChange( curState, prevState ) {
        $timeout( function() {
            self.stateString = prevState + "->" + curState;
        }, 0 );
    }

    function onConnectComplete( isSuccess ) {
        console.log("###onConnectComplete: " + isSuccess );
    }

    function onDisconnectComplete() {
        console.log("###onDisconnectComplete");
    }

    function onFolderListingComplete( itemList ) {
        console.log("###onFolderListingComplete");
        $log.info( itemList );
        $timeout( function() {
            self.fileList = itemList;
        }, 0 );
    }

    function onChangeFolderComplete( uri ) {
        console.log("###onChangeFolderComplete: " + uri );
    }

    function onDeleteComplete() {
        console.log("###onDeleteComplete");
    }

    function onGetFileComplete( item ) {
        var data = window.btoa( item.data );
        $log.info( data );
        console.log("###onGetFileComplete: " + item);
    }

    function onServiceConnected( isSuccess ) {
        console.log("###onServiceConnected: " + isSuccess );
    }

    function onServiceDisconnected() {
        console.log("###onServiceDisconnected");
    }
});