/**
 * Created by xjxxjxwork1017 on 2016/1/2.
 */

app.controller('sampleController', function ($interval, $timeout, $rootScope, $log, $scope, syncSdk) {

    var self = this;
    self.manager = {};
    // * prevent problems
    // * values for file transfer
    self.stateString2 = " ";
    self.fileList2 = [];

    var isRunning = false;

/*    self.start = syncSdk.start;
    self.end = syncSdk.end;*/
    self.start = start;
    self.end = end;
    self.setSyncMode = function ( id ) { syncSdk.setSyncMode( id ); };

    function start() {
/*        if ( isRunning ) {
            console.log( "<Start> unsafe to start");
            return;
        }
        console.log( "<Start> Lock on");
        isRunning = true;*/
        callbackOnStreamingStateChanged( syncSdk.getStreamingState(), "" );
        syncSdk.initial( callbackOnSave,
            callbackOnErase,
            callbackOnGetFileComplete,
            callbackOnFtpStateChanged,
            callbackOnStreamingStateChanged,
            callbackOnFailed );
        syncSdk.startOnce();
    }

    function end() {
/*        if ( !isRunning ) {
            console.log( "<end> unsafe to end");
            return;
        }*/
        console.log( "########## Start destroy !!!!!!!!!");
        syncSdk.setEmptyCallback();
    }

    // * Close the connection after page destroyed
    $scope.$on('$destroy', function () {
        // So some clean-up...
        console.log("# Destroy sampleController");
        syncSdk.setEmptyCallback();
    });

    function callbackOnSave() {}

    function callbackOnErase() {
        alert( "onErase" );
    }

    function callbackOnGetFileComplete( data ) {
        showCanvasWithByteArray( data );
    }

    function callbackOnFtpStateChanged( curState, prevState ){
        console.log( "FTP " + curState );
        if ( curState == syncSdk.FTP_STATE_CONNECTED )
            console.log( "<0> FTP CONNECTED");
        else if ( curState == syncSdk.FTP_STATE_DISCONNECTED )
            console.log( "<1> FTP DISCONNECTED");
        else if ( curState == syncSdk.FTP_STATE_CONNECTING )
            console.log( "<2> FTP CONNECTING");
        else if ( curState == syncSdk.FTP_NULL )
            console.log( "<-1> FTP DESTROYED");
        $timeout( function() { self.stateString2 = curState; }, 0 );
    }

    function callbackOnStreamingStateChanged( curState, prevState ) {
        console.log( "STREAMING " + curState );
        if ( curState == syncSdk.STREAMING_STATE_CONNECTED )
            console.log( "<0> STREAMING CONNECTED");
        if ( curState == syncSdk.STREAMING_STATE_CONNECTING )
            console.log( "<1> STREAMING CONNECTING");
        else if ( curState == syncSdk.STREAMING_STATE_LISTENING )
            console.log( "<4> STREAMING LISTENING" );
        else if ( curState == syncSdk.STREAMING_STATE_DISCONNECTED ) {
            console.log( "<2> STREAMING DISCONNECTED");
        }
        else if ( curState == syncSdk.STREAMING_NULL ) {
            console.log( "<-1> STREAMING DESTROYED");
            console.log( "<end> Lock off");
            isRunning = false;
        }
        $timeout( function() { self.manager.stateString = curState; }, 0 );
    }

    function callbackOnFailed( source, error ) {
        if ( source == syncSdk.FAILED_ON_STREAMING_DISCONNECTED ) {
            alert( "FAID_ON STREAMING DISCONNECTED" );
        }
        if ( source == syncSdk.FAILED_ON_FTP_DISCONNECTED )
            alert( "FAID_ON FTP DISCONNECTED" );
        console.log( "Source: " + source + "\nError: " + error );
    }

    // * draw pdf on canvas
    function showCanvas( dataOrUrl, canvas ) {
        PDFJS.workerSrc = '../lib/pdfjs/pdf.worker.js';

        // Fetch the PDF document from the URL using promises.
        PDFJS.getDocument(dataOrUrl).then(function (pdf) {
            // Fetch the page.
            pdf.getPage(1).then(function (page) {
                var scale = 1;
                var viewport = page.getViewport(scale, 180);    // Do transformation here

                // Prepare canvas using PDF page dimensions.
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render PDF page into canvas context.
                var renderContext = {
                    canvasContext: canvas.getContext('2d'),
                    viewport: viewport
                };
                page.render(renderContext);
            });
        });
    }

    function showCanvasWithByteArray( stream ) {
        console.log("showCanvasWithByteArray ##1");
        showCanvas( stream, document.getElementById('sample-canvas') );
    }

    showCanvas( '../img/helloworld.pdf', document.getElementById('sample-canvas') );

});
