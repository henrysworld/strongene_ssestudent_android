/*
function StreamingTag() {

    return {
        // initialize the element's model
        ready: function( canvas ) {
            console.log("streaming ready");
            this.xCoordinate = 'N/A';
            this.yCoordinate = 'N/A';
            this.pressure = 'N/A';
            this.canvas = canvas;
            if ( canvas == null )
                alert("StreamingTag ready, canvas null");
            this.context = this.canvas.getContext('2d');
            this.setupContext();
            this.streamingManager = SyncStreamingManager.getInstance();
            this.streamingManager.addObserver(this);
            this.state = this.streamingManager.getState();
            this.stateString = this.stringForState(this.state);
            this.devices = this.streamingManager.getDevices();
        },
        erase: function() {
            this.context.clearRect(0, 0, SyncStreamingManager.MAX_X, SyncStreamingManager.MAX_Y);
            this.streamingManager.erase();
        },
        digitizer: function() {
            this.streamingManager.setMode(this.streamingManager.modes.DIGITIZER);
        },
        capture: function() {
            this.streamingManager.setMode(this.streamingManager.modes.CAPTURE);
        },
        connect: function(id) {
            this.streamingManager.connect(id);
        },
        disconnect: function(id) {
            this.streamingManager.disconnect(id);
        },
        setupContext: function() {
            this.context.scale(this.canvas.width / SyncStreamingManager.MAX_Y, this.canvas.height / SyncStreamingManager.MAX_X);
            this.context.rotate(-Math.PI / 2);
            this.context.translate(-SyncStreamingManager.MAX_X, 0);
            this.context.fillStyle = '#000000';
            this.context.lineCap = 'round';
            this.context.lineJoin = 'round';
        },
        stateChanged : function(oldState, newState) {
            this.stateString = this.stringForState(newState);
            this.state = newState;
        },
        receivedSyncCaptureReport: function(report) {
            this.xCoordinate = report.getX();
            this.yCoordinate = report.getY();
            this.pressure = report.getPressure();
        },
        receivedPaths: function(paths) {
            for (var index in paths) {
                var path = paths[index];
                this.context.beginPath();
                this.context.lineWidth = path.getLineWidth();
                this.context.moveTo(path.getX1(), path.getY1());
                this.context.lineTo(path.getX2(), path.getY2());
                this.context.stroke();
            }
        },
        updatedDevices: function() {
            this.devices = this.streamingManager.getDevices();
        },
        stringForState: function(state) {
            var states = this.streamingManager.states;
            switch(state) {
                case states.CONNECTED:
                    return 'Connected';
                case states.DISCONNECTED:
                    return 'Disconnected';
                case states.CONNECTING:
                    return 'Connecting';
                case states.DISCONNECTING:
                    return 'Disconnecting';
            }
            return 'N/A';
        }
    };

}

var streamingTag = new StreamingTag();*/
