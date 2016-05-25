/**
 * Created by xjxxjxwork1017 on 2016/1/2.
 */

app.controller('streamingController', function ($interval, $timeout, $rootScope, $log, $scope) {

    var self = this;
    self.manager = {};
    self.debugCount = 0;

    $scope.$on('$destroy', function () {
        // So some clean-up...
        console.log("# Destroy streamingController");
        self.end();
    });

    self.start = function() {
        syncSdkStreaming.getState( function success( data ) {
            // * Device is disconnected
            if ( syncSdkStreaming.STATE_DISCONNECTED == data ) {
                // * Initial connection

                syncSdkStreaming.subscribe( onStreamingStateChange, onErase, onSave,
                    onCaptureReport, onServiceConnected, onServiceDisconnected, onDestroy );

                syncSdkStreaming.start( function success() {
                    console.log("##Success start SDK!!!");
                }, function failed( error ) {
                    console.log("##Failed start SDK!!!");
                });
            }
            else console.log("Error: [start] trying to connect to device in a wrong timing");
        });
    };

    self.end = function () {
        syncSdkStreaming.getState( function success( data ) {
            // * Device is connected
            if ( syncSdkStreaming.STATE_DISCONNECTED != data ) {
                // * Disconnect device
                syncSdkStreaming.end( function success() {
                    console.log("##Success end SDK!!!");
                }, function failed( error ) {
                    console.log("##Failed end SDK!!!");
                });
            }
            else console.log("Error: [start] trying to disconnect with device in a wrong timing");
        });
    };

    self.eraseSync = function () {
        syncSdkStreaming.eraseSync();
    };

    self.setSyncMode = function ( id ) {
        // syncSdkStreaming.setSyncMode( syncSdkStreaming.MODE_FILE );
        // syncSdkStreaming.setSyncMode( syncSdkStreaming.MODE_NONE );
        // syncSdkStreaming.setSyncMode( syncSdkStreaming.MODE_CAPTURE );
        syncSdkStreaming.setSyncMode( id );
    };

    var canvas = $("#canvas")[0];
    $log.info( canvas );
    $log.info( canvas.getContext( '2d' ) );
    // self.manager.ready( canvas );

    function onStreamingStateChange( curState, prevState ) {
        $timeout( function() {
            self.manager.stateString = curState;
            self.manager.stateStringPrev = prevState;
        }, 0 );
    }

    function onErase() {
        alert( "onErase" );
    }

    function onSave() {
        alert( "onSave" );
    }

    function onCaptureReport( json ) {
        $timeout( function() {
            console.log( "Captured Report " + self.debugCount);
            self.debugCount = self.debugCount + 1;
            self.manager.xCoordinate = json.getX;
            self.manager.yCoordinate = json.getY;
            self.manager.pressure = json.getPressure;
            self.manager.hasTipSwitchFlag = json.hasTipSwitchFlag;
        }, 0 );
    }

    function onServiceConnected( isSuccess ) {
        alert( "connected: " + isSuccess );
    }

    function onServiceDisconnected() {
        alert( "disconnected" );
    }

    function onDestroy() {
    }
});
