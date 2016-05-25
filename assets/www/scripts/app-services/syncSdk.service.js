
(function() {

    angular
        .module('SyncSdk', [])
        .service('syncSdk', SyncSdk);

    SyncSdk.$inject = ['$timeout'];
    function SyncSdk( $timeout ) {

        var startSave = false;
        var isRunningNotificationCheck = false;

        var AUTO_RESTART_TIME_STOP = 0;
        var AUTO_RESTART_TIME_RESTART = 1000;

        var callbackOnSave = null;
        var callbackOnErase = null;
        var callbackOnGetFileComplete = null;
        var callbackOnFtpStateChanged = null;
        var callbackOnStreamingStateChanged = null;
        var callbackOnFailed = null;
        var callbackOnCaptureReport = null;

        var FAILED_ON_START_STREAMING = "FAILED_ON_START_STREAMING";
        var FAILED_ON_END_STREAMING = "FAILED_ON_END_STREAMING";
        var FAILED_ON_START_FTP = "FAILED_ON_START_FTP";
        var FAILED_ON_END_FTP = "FAILED_ON_END_FTP";
        var FAILED_ON_STREAMING_DISCONNECTED = "FAILED_ON_STREAMING_DISCONNECTED";
        var FAILED_ON_FTP_DISCONNECTED = "FAILED_ON_FTP_DISCONNECTED";

        var STREAMING_NULL = "STREAMING_NULL";
        var FTP_NULL = "FTP_NULL";

        var streamingState = STREAMING_NULL;
        var fileTransferState = FTP_NULL;

        var isStartOnce = false;

        var ERROR_CANT_FIND_PAIRED_DEVICE = "ERROR_CANT_FIND_PAIRED_DEVICE";
        var ERROR_CANT_FIND_PAIRED_DEVICE_REBOOT = "ERROR_CANT_FIND_PAIRED_DEVICE_REBOOT";

        return {
            initial: initial,
            setEmptyCallback: setEmptyCallback,
            startOnce: startOnce,
            getStreamingState: getStreamingState,
            getFileTransferState: getFileTransferState,
            setSyncMode: setSyncMode,

            FAILED_ON_START_STREAMING: FAILED_ON_START_STREAMING,
            FAILED_ON_END_STREAMING: FAILED_ON_END_STREAMING,
            FAILED_ON_START_FTP: FAILED_ON_START_FTP,
            FAILED_ON_END_FTP: FAILED_ON_END_FTP,
            FAILED_ON_STREAMING_DISCONNECTED: FAILED_ON_STREAMING_DISCONNECTED,
            FAILED_ON_FTP_DISCONNECTED: FAILED_ON_FTP_DISCONNECTED,
            STREAMING_STATE_CONNECTED: syncSdkStreaming.STATE_CONNECTED,
            STREAMING_STATE_CONNECTING: syncSdkStreaming.STATE_CONNECTING,
            STREAMING_STATE_DISCONNECTED: syncSdkStreaming.STATE_DISCONNECTED,
            STREAMING_STATE_LISTENING: syncSdkStreaming.STATE_LISTENING,
            FTP_STATE_CONNECTED: syncSdkFileTransfer.STATE_CONNECTED,
            FTP_STATE_CONNECTING: syncSdkFileTransfer.STATE_CONNECTING,
            FTP_STATE_DISCONNECTED: syncSdkFileTransfer.STATE_DISCONNECTED,
            STREAMING_NULL: STREAMING_NULL,
            FTP_NULL: FTP_NULL
        };

        function startOnce() {
            if ( isStartOnce == false ) {
                isStartOnce = true;
                start();
            }
        }

        function initial( _callbackOnSave,
                          _callbackOnErase,
                          _callbackOnGetFileComplete,
                          _callbackOnFtpStateChanged,
                          _callbackOnStreamingStateChanged,
                          _callbackOnFailed,
                          _callbackOnCaptureReport ) {
            callbackOnSave = _callbackOnSave;
            callbackOnErase = _callbackOnErase;
            callbackOnGetFileComplete = _callbackOnGetFileComplete;
            callbackOnFtpStateChanged = _callbackOnFtpStateChanged;
            callbackOnStreamingStateChanged = _callbackOnStreamingStateChanged;
            callbackOnFailed = _callbackOnFailed;
            callbackOnCaptureReport = _callbackOnCaptureReport;
        }

        function setEmptyCallback()
        {
            function empty() {}
            callbackOnSave = empty;
            callbackOnErase = empty;
            callbackOnGetFileComplete = empty;
            callbackOnFtpStateChanged = empty;
            callbackOnStreamingStateChanged = empty;
            callbackOnFailed = empty;
            callbackOnCaptureReport = empty;
        }

        function stop() {
            // * Close the connection after page destroyed
            endStreaming();
            endFileTransfer();
            isRunningNotificationCheck = false;
        }

        function setSyncMode( id ) { syncSdkStreaming.setSyncMode( id ); }

        function getStreamingState() {
            return streamingState;
        }

        function getFileTransferState() {
            return fileTransferState;
        }

        function start() {
            isRunningNotificationCheck = true;
            startStreaming();
        }

        function end() {
            isRunningNotificationCheck = false;
            endStreaming();
        }

        // * ====================================== streaming ================================

        function onError( error, message ) {
            if ( error == ERROR_CANT_FIND_PAIRED_DEVICE )
                alert( "找不到配对了的蓝牙设备" ); // \n\n请按下面次序操作：\n1.关闭手写板\n2.先按下save按钮并保持按下状态, 然后开启手写板\n4.看到蓝灯亮起松开save按钮" );
            else if ( error == ERROR_CANT_FIND_PAIRED_DEVICE_REBOOT )
                alert( "错误：蓝牙设备意外丢失" ); // \n\n请按下面次序操作：\n1.重新启动本程序\n2.按照重启后显示的提示操作" );
            else
                alert( message );
        }

        function startStreaming() {
            // * Initial connection

            syncSdkStreaming.subscribe( onStreamingStateChange, onErase, onSave,
                onCaptureReport, onServiceConnected, onServiceDisconnected, onDestroyStreaming, onError );

            syncSdkStreaming.start( function success() {
                console.log("##Success start SDK!!!");
            }, function failed( error ) {
                console.log("##Failed start SDK!!!");
                callbackOnFailed( FAILED_ON_START_STREAMING, error );
            });
        }

        function endStreaming() {
            // * Disconnect device
            syncSdkStreaming.end( function success() {
                console.log("##Success end SDK!!!");
            }, function failed( error ) {
                console.log("##Failed end SDK!!!");
                callbackOnFailed( FAILED_ON_END_STREAMING, error );
            });
        }

        function onStreamingStateChange( curState, prevState ) {
            if ( isRunningNotificationCheck && curState == syncSdkStreaming.STATE_LISTENING ) {

                callbackOnFailed( FAILED_ON_STREAMING_DISCONNECTED, {} );

                console.log( "onStreamingStateChange - restart" );
                $timeout( function() {
                    syncSdkStreaming.restart();
                }, AUTO_RESTART_TIME_RESTART );
            }
            console.log( "StreamingStatechanged: " + prevState + "->" + curState );
            callbackOnStreamingStateChanged( curState, prevState );
            streamingState = curState;
        }

        function onSave() {
            console.log( "onSave" );
            if ( startSave == false )
            {
                startSave = true;
                callbackOnSave();
                startFileTransfer();
                $timeout( function () { startSave = false; }, 10000 ); // Prevent freeze by unwanted crash
            }
        }

        function onErase() {
            console.log( "onErase" );
            callbackOnErase();
        }

        function onCaptureReport( json ) {
            callbackOnCaptureReport( json );
        }
        function onServiceConnected( ) { }
        function onServiceDisconnected() { }
        function onDestroyStreaming() {
            onStreamingStateChange( STREAMING_NULL, streamingState );
        }

        // * ====================================== file transfer ================================

        function startFileTransfer() {
            syncSdkFileTransfer.getState( function success( data ) {
                // * Device is disconnected
                if ( syncSdkFileTransfer.STATE_DISCONNECTED == data ) {
                    // * Initial connection
                    syncSdkFileTransfer.subscribe( onDestroyFtp, onFtpDeviceStateChange,
                        onConnectComplete, onDisconnectComplete,
                        onFolderListingComplete, onChangeFolderComplete,
                        onDeleteComplete, onGetFileComplete,
                        onServiceConnected, onServiceDisconnected );

                    syncSdkFileTransfer.start( function success() {
                        console.log("##Success start SDK!!!");
                    }, function failed( error ) {
                        callbackOnFailed( FAILED_ON_START_FTP, error );
                        console.log("##Failed start SDK!!!");
                    });
                }
                else console.log("Warning: [start] trying to connect to device in a wrong timing");
            });
        }

        function endFileTransfer() {
            syncSdkFileTransfer.getState( function success( data ) {
                // * Device is connected
                if ( syncSdkFileTransfer.STATE_DISCONNECTED != data ) {
                    // * Disconnect device
                    syncSdkFileTransfer.end( function success() {
                        console.log("##Success end SDK!!!");
                    }, function failed( error ) {
                        callbackOnFailed( FAILED_ON_END_FTP, error );
                        console.log("##Failed end SDK!!!");
                    });
                    onFtpDeviceStateChange( FTP_NULL, fileTransferState );
                }
                else console.log("Warning: [start] trying to disconnect with device in a wrong timing");
            });
        }

        function onFtpDeviceStateChange( curState, prevState ) {
            if ( startSave && curState == syncSdkFileTransfer.STATE_DISCONNECTED )
            {
                callbackOnFailed( FAILED_ON_FTP_DISCONNECTED, {} );
                startSave = false;
            }

            console.log( "FtpStatechanged: " + prevState + "->" + curState );
            callbackOnFtpStateChanged( curState, prevState );
            fileTransferState = curState;
        }

        function onFolderListingComplete( itemList ) {
            // * Step 1: get root file list
            console.log("###onFolderListingComplete");
            console.log("Step 1 ===============");
            console.log( "File list:" );
            console.log( itemList );
            syncSdkFileTransfer.getDirectoryUri( function success( data ) {
                // * Step 2: get SAVED folder file list
                console.log("Step 1.5 ===============");
                console.log( "Current Uri:" );
                console.log( data );
                if ( data == "/" ) {
                    console.log("Step 2 ===============");
                    syncSdkFileTransfer.changeFolder( "SAVED" );
                }
                // * Step 3: get the newest(first) file from the list
                else if ( data == "/SAVED") {
                    console.log("Step 3 ===============");
                    syncSdkFileTransfer.getFile( 0 );
                }
            });
        }

        function onGetFileComplete( item ) {
            // * Step 4: get the newest(first) file from the list
            console.log("Step 4 ===============");
            item.data = item.data.replace(/\s/g, '');               // haven't whether it's useful.
            var data = ThirdParty.decodeBase64( item.data );        // decode the data into a string
            data = ThirdParty.byteCharactersToBiteArrays( data );   // convert string into a byte array

            console.log("###onGetFileComplete: " + data);
            // * Draw canvas with data
            callbackOnGetFileComplete( data );
            // * Stop file transfer connection
            endFileTransfer();
            startSave = false; // End save
        }

        function onChangeFolderComplete( uri ) { }
        function onDeleteComplete() { }
        function onConnectComplete( isSuccess ) { }
        function onDisconnectComplete() { }
        function onDestroyFtp() {
        }
    }

})();