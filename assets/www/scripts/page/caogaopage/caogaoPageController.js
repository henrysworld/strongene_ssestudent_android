/**
 * Created by fanyingming on 16/2/26.
 */

function SSEDrawPointHE($timeout, ctx)
{
    var drawing = false;
    var strokeTimer = null;
    var drawingPath = 0;
    var isDynamicWidth = false;
    var pointBuf = new Array();
    var prevLineWidth = 0;
    var prevLastPoint = {x:0, y:0, z:0};
    var lineThresh = 36;

    //line width from 1 to 10
    var transPressureToLinewidth = function(z_sum, z_cnt, prevWidth)
    { //it can be assumed that these samples is taken from a constant time
        //z from 0 to 1023
        if(z_cnt == 0) return 1;
        var sqrt_avg = (Math.sqrt(z_sum/z_cnt) - 7)*1.3;
        if (prevWidth != 0)
            sqrt_avg = (sqrt_avg + prevWidth) / 2;
        if(sqrt_avg > 8) sqrt_avg = 8;
        else if(sqrt_avg < -1.4) sqrt_avg = 1;
        else if(sqrt_avg < 2) sqrt_avg = 2;
        return sqrt_avg;
    };
    var strokeLoop = function(){
        if(pointBuf.length > 0)
        {
            var z_sum = 0, z_cnt = 0;
            for (var i = 0; i < pointBuf.length; i++)
            {
                var p = pointBuf[i];
                var x = p.x, y = p.y, z = p.z;
                if (z > lineThresh) //pressure threshold, there will be no line if too slight
                {
                    if (drawingPath == 0)
                    {
                        ctx.moveTo(x, y);
                        prevLineWidth = 0;
                    }
                    z_sum += z;
                    z_cnt ++;
                    drawingPath = 3; //filter the case that there is no data within (drawingPath-1)*50ms
                    ctx.lineTo(x, y);
                }
                else
                    drawingPath = 0; //line is broken
            }
            if(isDynamicWidth)
            {
                ctx.lineWidth = transPressureToLinewidth(z_sum, z_cnt, prevLineWidth);
                { //make some attempt to reduce bad effect of sharp line width change
                    prevLineWidth = ctx.lineWidth;
                    if (prevLastPoint.z > lineThresh && pointBuf[0].z > lineThresh)
                    {
                        //draw extra 2 lines at the first point
                        if (prevLineWidth - ctx.lineWidth > 1) //处理笔锋
                        {
                            var diff = (prevLineWidth - ctx.lineWidth) / 2;
                            ctx.moveTo(prevLastPoint.x + diff, prevLastPoint.y);
                            ctx.lineTo(pointBuf[0].x, pointBuf[0].y);
                            ctx.moveTo(prevLastPoint.x - diff, prevLastPoint.y);
                            ctx.lineTo(pointBuf[0].x, pointBuf[0].y);
                        }
                        /*else if (ctx.lineWidth - prevLineWidth > 3) //cannot be handled with current linewidth
                         {
                         }*/
                    }
                }
            }
            ctx.stroke();
            ctx.beginPath();
            { //redraw last point, otherwise there will be a blank line
                var p = pointBuf[pointBuf.length-1];
                var x = p.x, y = p.y, z = p.z;
                ctx.moveTo(x, y);
                prevLastPoint = angular.copy(p);
            }
            pointBuf = new Array(); //flush the buf array, it is said that new operation is faster
        }
        else
            prevLastPoint.z = 0;
        if(drawingPath > 0)
            drawingPath --;
        strokeTimer = $timeout(function(){
            strokeLoop();
        }, 50); //keep 24fps stoke
    };
    var startDraw = function(){
        drawing = true;
        pointBuf.length = 0;
        strokeLoop();
    };
    var endDraw = function(){
        drawing = false;
        if(strokeTimer != null)
            $timeout.cancel(strokeTimer);
    };
    var setDrawMode = function(dynamicWidth) {
        isDynamicWidth = dynamicWidth;
    }
    var drawPoint = function(x, y, z){
        pointBuf.push({x:x, y:y, z:z});
    };

    return {
        startDraw: startDraw,
        endDraw: endDraw,
        setDrawMode: setDrawMode,
        drawPoint: drawPoint
    };
}

app.controller( 'caogaoPageController', function( syncSdk, $http, $log, $timeout, $rootScope ) {
    var self = this;

    self.onClear = function(){
        ctx.beginPath();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0,0,caogaoCanvas.width,caogaoCanvas.height);
        self.onUsePen();
    };
    self.onUsePen = function(){
        ctx.beginPath();
        SSEDraw.setDrawMode(true);
        ctx.strokeStyle = "#000000";
        ctx.fillStyle = "#000000";
    };
    self.onUseEraser = function(){
        ctx.beginPath();
        SSEDraw.setDrawMode(false);
        ctx.lineWidth = 40;
        ctx.strokeStyle = "#ffffff";
        ctx.fillStyle = "#ffffff";
    };
    self.onStreamingStatusChange = function( curState, prevState ) {
        if ( curState == syncSdk.STREAMING_STATE_CONNECTED ) {
            self.syncSDKStatus = "STREAMING CONNECTED";
            self.syncSDKMessage = "手写板已成功连接";
        } else if ( curState == syncSdk.STREAMING_STATE_DISCONNECTED ) {
            self.syncSDKStatus = "STREAMING DISCONNECTED";
            $timeout(function(){
                self.syncSDKMessage = "手写板断开连接";
            }, 0);

            $timeout(function() {
                if ( self.syncSDKStatus != "STREAMING CONNECTED" )
                    self.syncSDKMessage = "正在重连手写板...";
            }, 2000);

        } else if ( curState == syncSdk.STREAMING_NULL ) {
            self.syncSDKStatus = "STREAMING DESTROYED";
        }
    }

    self.syncSDKMessage = "正在连接手写板...";
    syncSdk.startOnce();
    syncSdk.initial( empty, function(){ //erase
        self.onClear();
    }, empty, empty, self.onStreamingStatusChange, empty, callbackOnCaptureReport );
    self.onStreamingStatusChange( syncSdk.getStreamingState(), "" );

    var caogaoCanvas = document.getElementById("caogaoCanvas");
    caogaoCanvas.width = Math.round(20280 * 0.08);
    caogaoCanvas.height = Math.round(13942 * 0.08);
    caogaoCanvas.style.width = Math.round(20280 * 0.03) + "px";
    caogaoCanvas.style.height = Math.round(13942 * 0.03) + "px";
    var ctx = caogaoCanvas.getContext("2d");

    var SSEDraw = SSEDrawPointHE($timeout, ctx);
    SSEDraw.startDraw();
    self.onClear();

    function empty() { }
    function callbackOnCaptureReport( json ) {
/*        json.put( "getX", captureReport.getX() );
        json.put( "getY", captureReport.getY() );
        json.put( "getPressure", captureReport.getPressure() );
        json.put( "hasTipSwitchFlag", captureReport.hasTipSwitchFlag() );*/
        /* MAX_X = 20280.0f; MAX_Y = 13942.0f;*/
        //console.log( json );
        SSEDraw.drawPoint(json.getX * 0.08, json.getY * 0.08, json.getPressure );
    }
});