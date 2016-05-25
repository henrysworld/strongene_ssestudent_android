/**
 * Created by fanyingming on 16/3/3.
 */

function removeDraft(canv)
{
    var ctx=canv.getContext("2d");
    var width = canv.width;
    var height = canv.height;
    var imageDataHandle = ctx.getImageData(0,0,width,height);
    var imageData = imageDataHandle.data;
    var checkBlank = 20;

    if(width < checkBlank * 2 + 2) return; //will cause bug

    var tryColumn = [checkBlank, width-1-checkBlank]; //tryColumn[1] > tryColumn[0]

    var findStartPos = function()
    {
        var posArray = new Array();
        for (var y = 0; y < height; y ++) //from top to bottom
        {
            //for (var x = 0; x < 4; x ++)
            var x = tryColumn[0]; //find start in left 5th column
            {
                if( imageData[(y*width+x)*4+0] < 0xff )
                    posArray.push(y);
            }
        }
        return posArray;
    };
    var findDraftHight = function(start)
    {
        //init
        for(var x = 0; x < width; x ++)
            draftStart[x] = height;
        var searchPoint = new Array();
        var searchPos = function(x, y)
        {
            searchPoint.push([x, y]);
            fillMap[(y*width+x)*4] = true;
        }

        //search
        searchPos(tryColumn[0], start);

        while(searchPoint.length > 0)
        {
            var point = searchPoint.shift();
            var x = point[0];
            var y = point[1];
            var idx = (y*width+x)*4;
            if(imageData[idx] < 0xff)
            {
                if(y < draftStart[x])
                    draftStart[x] = y;
                if(x > 0 && !fillMap[idx-4])
                    searchPos(x-1,y);
                if(x < width-1 && !fillMap[idx+4])
                    searchPos(x+1,y);
                if(y > 0 && !fillMap[idx-4*width])
                    searchPos(x,y-1);
                if(y < height-1 && !fillMap[idx+4*width])
                    searchPos(x,y+1);

                if(x > 0 && y > 0 && !fillMap[idx-4-4*width])
                    searchPos(x-1,y-1);
                if(x < width-1 && y > 0 && !fillMap[idx+4-4*width])
                    searchPos(x+1,y-1);
                if(x > 0 && y < height-1 && !fillMap[idx-4+4*width])
                    searchPos(x-1,y+1);
                if(x < width-1 && y < height-1 && !fillMap[idx+4+4*width])
                    searchPos(x+1,y+1);
            }
        }

        //summary
        if(draftStart[tryColumn[1]] < height)
        {
            for(var x = tryColumn[0]-1; x >= 0; x -- )
            {
                if(draftStart[x] == height)
                    draftStart[x] = draftStart[x+1]
            }
            for(var x = tryColumn[1]+1; x < width; x ++ )
            {
                if(draftStart[x] == height)
                    draftStart[x] = draftStart[x-1]
            }
            return true;
        }
        else
            return false;
    }
    var remove = function()
    {
        for(var x = 0; x < width; x ++)
        {
            for(var y = height - 1; y >= draftStart[x]; y --)
            {
                var idx = (y*width+x)*4;
                imageData[idx] = imageData[idx+1] = imageData[idx+2] = 0xff;
            }
        }
        ctx.putImageData(imageDataHandle, 0, 0)
    };

    var fillMap = new Array();
    var draftStart = new Array();
    var startPos = findStartPos();
    for(var i = 0; i < startPos.length; i ++)
    {
        var start = startPos[i];
        if( findDraftHight(start) )
        {
            remove();
            break;
        }
    }
}

//为填空题除外的题目添加canvas答案区域
function addCanvasForSubjects(timus, drawAddIcon) {
    for (var i = 0; i < timus.length; i++) {
        var timu = timus[i];
        if (timu.tigantxt.indexOf("label") >= 0)
            continue;

        var container = document.getElementById(timu.timuId);
        var spaceSpan = document.createElement("div");
        spaceSpan.innerHTML = "过程：&nbsp";
        container.appendChild(spaceSpan);

        var guochengCanvas = document.createElement("canvas");
        guochengCanvas.width = 400;
        guochengCanvas.height = 300;
        //for center display
        guochengCanvas.style.paddingLeft = 0;
        guochengCanvas.style.paddingRight = 0;
        guochengCanvas.style.marginLeft = "auto";
        guochengCanvas.style.marginRight = "auto";
        guochengCanvas.style.display = "block";
        var ctx = guochengCanvas.getContext("2d");
        ctx.fillStyle = 'rgb(48, 48, 48)';
        ctx.fillRect(0, 0, guochengCanvas.width, guochengCanvas.height);
        container.appendChild(guochengCanvas);
        timu.guochengCanvCnt = 1;

        var spaceSpan = document.createElement("div");
        spaceSpan.innerHTML = "答案：&nbsp";

        var daanCanvas = document.createElement("canvas");
        daanCanvas.width = 400;
        daanCanvas.height = 50;
        //for center display
        daanCanvas.style.paddingLeft = 0;
        daanCanvas.style.paddingRight = 0;
        daanCanvas.style.marginLeft = "auto";
        daanCanvas.style.marginRight = "auto";
        daanCanvas.style.display = "block";
        var ctx = daanCanvas.getContext("2d");
        ctx.fillStyle = 'rgb(48, 48, 48)';
        ctx.fillRect(0, 0, daanCanvas.width, daanCanvas.height);

        if (timu.youdaan == null || timu.youdaan == 0) {
            spaceSpan.style.display = "none";
            daanCanvas.style.display= "none";
        }
        container.appendChild(spaceSpan);
        container.appendChild(daanCanvas);

        if (drawAddIcon == 1) {
            drawDefaultPic(guochengCanvas);
            drawDefaultPic(daanCanvas);
        }
    }
}

function insertCanvasForGuocheng($rootScope, self, timu, canWrite, renderEngine)
{
    if (timu.tigantxt.indexOf("label") >= 0)
        return;

    //malloc a new canvas
    var guochengCanvas = document.createElement("canvas");
    guochengCanvas.width = 400;
    guochengCanvas.height = 200;
    //for center display
    guochengCanvas.style.paddingLeft = 0;
    guochengCanvas.style.paddingRight = 0;
    guochengCanvas.style.marginLeft = "auto";
    guochengCanvas.style.marginRight = "auto";
    guochengCanvas.style.display = "block";
    var ctx = guochengCanvas.getContext("2d");
    ctx.fillStyle = 'rgb(48, 48, 48)';
    ctx.fillRect(0, 0, guochengCanvas.width, guochengCanvas.height);
    renderEngine.drawDefaultPic(guochengCanvas);

    //insert canvas
    var timuIndexId = timu.timuIndexId;
    var timuElement = document.getElementById(timuIndexId);
    var canvasArray = timuElement.getElementsByTagName("canvas");
    var daanCanvas = canvasArray[timu.guochengCanvCnt];
    var lastGuochengCanvas = canvasArray[timu.guochengCanvCnt-1];
  //  timuElement.insertBefore(guochengCanvas, lastGuochengCanvas.nextSibling);
    lastGuochengCanvas.parentNode.appendChild(guochengCanvas);
    timu.guochengCanvCnt ++;

    //set id
    daanCanvas.id = timuIndexId + "_" + timu.guochengCanvCnt;
    guochengCanvas.id = timuIndexId + "_" + (timu.guochengCanvCnt - 1);
    guochengCanvas.style.border = "medium solid #444444";
    var canvInfo = {};
    canvInfo.canvasId = guochengCanvas.id;
    canvInfo.canvasImg = "";
    timu.canvas.splice(timu.guochengCanvCnt-1, 0, canvInfo);
    timu.canvas[timu.guochengCanvCnt].canvasId = daanCanvas.id;

    if(canWrite)
    {
        //set click event
        guochengCanvas.addEventListener('click', function ()
        {
            onCanvasClick(this.id, self, $rootScope, renderEngine);
        }, false);
    }
}

function setIdForEveryCanvas(timus) {
    for (var i = 0; i < timus.length; i++) {
        var timu = timus[i];
        var timuIndexId = timu.timuIndexId;
        var timuElement = document.getElementById(timuIndexId);
        var canvasArray = timuElement.getElementsByTagName("canvas");
        timu.canvas = [];

        //bind data with html element
        for (var j = 0; j < canvasArray.length; j++) {
            var canvas = canvasArray[j];
            canvas.id = timuIndexId + "_" + j;
            canvas.style.border = "medium solid #444444";
            timu.canvas[j] = {};
            timu.canvas[j].canvasId = canvas.id;
            timu.canvas[j].canvasImg = "";
        }
    }
}

function saveDatijilu(self, $rootScope, timu) {
    var guochengBase64 = "";
    //combine timu daan img base64 strings as one string
    var daanBase64 = "";
    var startIndex;

    if (timu.tigantxt.indexOf("label") > 0) {
        guochengBase64 = "";
        startIndex = 0;
    } else {
        guochengBase64 = timu.canvas[0].canvasImg;
        for(var j = 1; j < timu.guochengCanvCnt-1; j ++) //the last guocheng canvas is empty
        {
            guochengBase64 += $rootScope.imgSplitString + timu.canvas[j].canvasImg;
        }
        startIndex = timu.guochengCanvCnt;
    }

    for (var j = startIndex; j < timu.canvas.length - 1; j++) {
        var canvas = timu.canvas[j];
        daanBase64 += canvas.canvasImg + $rootScope.imgSplitString;
    }
    daanBase64 += timu.canvas[j].canvasImg;

    //detect if cached
    if (timu.datijilu) {//update
        var datijilus = $rootScope.db.datijilus[self.zuoyeqindan.index];
        for (var i = 0; i < datijilus.length; i++) {
            if (datijilus[i].timu == timu.id) {
                datijilus[i].daan = daanBase64;//only update daan
                datijilus[i].guocheng = guochengBase64;
                datijilus[i].submit = 0;
                DBPutDatijilu($rootScope.db, datijilus[i], 0);
                break;
            }
        }
    } else {//insert
        var datijilu = {
            xuesheng: $rootScope.db.userId,
            timu: timu.id,
            zuoyeqingdan: self.zuoyeqindan.id,
            daan: daanBase64,
            guocheng: guochengBase64,
            zuotitime: timu.datiTime
        }
        datijilu.submit = 0;
        timu.datijilu = datijilu;
        $rootScope.db.datijilus[self.zuoyeqindan.index].push(datijilu);
        DBPutDatijilu($rootScope.db, datijilu, 1);
    }
}

function setUpWritingPad(self, $scope, $timeout,  $rootScope, loadingInfo, syncSdk, renderEngine, messageStack) {
    self.manager = {};
    // * values for file transfer
    self.syncSDKStatus = "";

    // * draw pdf on canvas
    function showCanvas( dataOrUrl, canvas ) {
        // Fetch the PDF document from the URL using promises.
        PDFJS.getDocument(dataOrUrl).then(function (pdf) {
            // Fetch the page.
            pdf.getPage(1).then(function (page) {
                //draw pdf to temp canvas
                var cTemp = document.createElement('canvas');
                var scale = 1;
                var viewport = page.getViewport(scale, 180);

                cTemp.height = viewport.height;
                cTemp.width = viewport.width;

                // Render PDF page into canvas context.
                var renderContext = {
                    canvasContext: cTemp.getContext('2d'),
                    viewport: viewport
                };

                //Step 1: store a refer to the renderer
                var pageRendering = page.render(renderContext);
                //Step : hook into the pdf render complete event
                var completeCallback = pageRendering.internalRenderTask.callback;
                pageRendering.internalRenderTask.callback = function (error) {
                    //Step 2: what you want to do before calling the complete method
                    completeCallback.call(this, error);
                    //Step 3: do some more stuff
                    {
                        console.log("img: " + cTemp.toDataURL("image/png"));
                        var draftCanvas = cTemp;
                        removeDraft(draftCanvas);
                        //pdf->png
                        var image = new Image();
                        image.src = draftCanvas.toDataURL("image/png");
                        image.onload = function() {
                            //cut tmp cavas
                            var border = cutImage(draftCanvas);
                            var ctx = draftCanvas.getContext("2d");
                            var width = border[3] - border[2] + 1;
                            var height = border[1] - border[0] + 1;
                            draftCanvas.width = width;
                            draftCanvas.height= height;
                            ctx.drawImage(image,
                                border[2], border[0], width, height,
                                0, 0, width, height);

                            //image for save
                            var img = new Image();
                            img.src = draftCanvas.toDataURL("image/png");

                            img.onload = function() {
                                //push img data to model
                                var canvasID = canvas.id;
                                var arr = canvasID.split("_");
                                //       console.log("canvasID = " + canvasID + ", arr = " + arr.toString());
                                //the format of canvasId
                                var timuIndex = arr[1];
                                var timuCanvasIndex = arr[2];
                                var timu = self.timus[timuIndex];
                                timu.canvas[timuCanvasIndex].canvasImg = img.src;
                                //         console.log("img.src = " + self.timus[timuIndex].canvas[timuCanvasIndex].canvasImg);
                                //cover old time
                                timu.datiTime = (new Date()).getTime();

                                putImgToCanvas(canvas, img, timu.tigantxt.indexOf("label") >= 0, renderEngine);
                                if(timu.tigantxt.indexOf("label") < 0)
                                {
                                    if(timuCanvasIndex == timu.guochengCanvCnt-1)
                                        insertCanvasForGuocheng($rootScope, self, timu, true, renderEngine);
                                }
                                saveDatijilu(self, $rootScope, timu);
                            };
                        };
                    }
                }
            });
        });
    }

    function showCanvasWithByteArray( stream ) {
        console.log("showCanvasWithByteArray ##1");
        showCanvas( stream, document.getElementById(self.currentSelectedCanvasId) );
    }

    syncSdk.initial( callbackOnSave,
        callbackOnErase,
        callbackOnGetFileComplete,
        callbackOnFtpStateChanged,
        callbackOnStreamingStateChanged,
        callbackOnFailed,
        callbackOnCaptureReport);
    callbackOnStreamingStateChanged( syncSdk.getStreamingState(), "" );

    // * Close the connection after page destroyed
    $scope.$on('$destroy', function () {
        // So some clean-up...
        syncSdk.setEmptyCallback();
    });

    function callbackOnCaptureReport( json ) {

    }

    function callbackOnSave() {
        loadingInfo.show( $rootScope.loadingInfoBluetooth );
    }

    function callbackOnErase() {}

    function callbackOnGetFileComplete( data ) {
        showCanvasWithByteArray( data );
        loadingInfo.hide();
    }

    function callbackOnFtpStateChanged( curState, prevState ){

    }

    function callbackOnStreamingStateChanged( curState, prevState ) {
        function updateState( message ) {
            self.syncSDKMessage = message;
        }
        if ( curState == syncSdk.STREAMING_STATE_CONNECTED ) {
            self.syncSDKStatus = "STREAMING CONNECTED";
            messageStack.prepareUpdateState( "手写板已成功连接", updateState );
        } else if ( curState == syncSdk.STREAMING_STATE_DISCONNECTED ) {
            self.syncSDKStatus = "STREAMING DISCONNECTED";
            messageStack.prepareUpdateState( "手写板断开连接", updateState );
        } else if ( curState == syncSdk.STREAMING_STATE_LISTENING ) {
            messageStack.prepareUpdateState( "正在重连手写板...", updateState );
        } else if ( curState == syncSdk.STREAMING_STATE_CONNECTING ) {
            messageStack.prepareUpdateState( "正在连接手写板...", updateState );
        } else if ( curState == syncSdk.STREAMING_NULL ) {
            self.syncSDKStatus = "STREAMING DESTROYED";
        }
    }

    function callbackOnFailed( source, error ) {
        if ( source == syncSdk.FAILED_ON_STREAMING_DISCONNECTED ) {
            //      alert("蓝牙连接失败");
            self.syncSDKMessage = "手写板连接失败";
        }
        console.log( "Source: " + source + "\nError: " + error );
    }
}

function setClickEventForCanvas(self, $rootScope, renderEngine) {
    for (var i = 0; i < self.timus.length; i++) {
        for (var j = 0; j < self.timus[i].canvas.length; j++ ) {
            var canvas = document.getElementById(self.timus[i].canvas[j].canvasId);
            canvas.addEventListener('click', function () {
                onCanvasClick(this.id, self, $rootScope, renderEngine);
            }, false);
        }
    }
}

function onCanvasClick(canvasId, self, $rootScope, renderEngine) {
    if (self.currentSelectedCanvasId != null) {
        document.getElementById(self.currentSelectedCanvasId).style.border = "medium solid #444444";
    }
    document.getElementById(canvasId).style.border = "medium solid red";
    self.currentSelectedCanvasId = canvasId;

    if ($rootScope.debug) {
        var canvas = document.getElementById(self.currentSelectedCanvasId);
        var canvasID = canvas.id;
        var arr = canvasID.split("_");
        //the format of canvasId
        var timuIndex = arr[1];
        var timuCanvasIndex = arr[2];
        var timu = self.timus[timuIndex];
        //draw test image once you click the canvas
        fillTestStringToCanvas($rootScope, canvas, timu.tigantxt.indexOf("label") >= 0, renderEngine);
        timu.canvas[timuCanvasIndex].canvasImg = canvas.toDataURL("image/png");
        //cover old time
        timu.datiTime = (new Date()).getTime();
        if(timu.tigantxt.indexOf("label") < 0)
        {
            if(timuCanvasIndex == timu.guochengCanvCnt-1)
                insertCanvasForGuocheng($rootScope, self, timu, true, renderEngine);
        }
        saveDatijilu(self, $rootScope, timu);
    }

}

function fillTestStringToCanvas($rootScope, canvas, containUnderlineLabel, renderEngine) {
    var underlineHeight = 0;
    var spareLineWidth = 0;
    var imgPadding = 4;
    if (containUnderlineLabel) {
        underlineHeight = 5;
        spareLineWidth = 6;
    }

    var img = {};
    img.width = 140;
    img.height = 80;

    canvas.width = img.width + imgPadding*2 + spareLineWidth*2;
    canvas.height = img.height + underlineHeight + imgPadding*2;
    canvas.style.width = (canvas.width*1.5)+"px";
    canvas.style.height = (canvas.height*1.5)+"px";
    var context = canvas.getContext("2d");

    context.fillStyle = 'rgb(255, 255, 255)';
    context.fillRect(spareLineWidth, 0, img.width + imgPadding*2, img.height + imgPadding*2)

    context.font = "bold 25px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = 'black';
    context.fillText(canvas.id, img.width/2, img.height/2 -15);
    context.fillText($rootScope.db.user.user, img.width/2, img.height/2 + 15);
    if (containUnderlineLabel)
        renderEngine.drawUnderline(canvas);
}

function putImgToCanvas(canvas, img, containUnderlineLabel, renderEngine) {
    var underlineHeight = 0;
    var spareLineWidth = 0;
    var imgPadding = 4;
    if (containUnderlineLabel) {
        underlineHeight = 5;
        spareLineWidth = 6;
    }

    canvas.width = img.width + imgPadding*2 + spareLineWidth*2;
    canvas.height = img.height + underlineHeight + imgPadding*2;
    canvas.style.width = (canvas.width*1.5)+"px";
    canvas.style.height = (canvas.height*1.5)+"px";

    //bottom 4 pixel for draw underline
    var ctxReal = canvas.getContext("2d");
    ctxReal.fillStyle = 'rgb(255, 255, 255)';
    ctxReal.fillRect(spareLineWidth, 0, img.width + imgPadding*2, img.height + imgPadding*2);
    ctxReal.drawImage(img,
        0, 0, img.width, img.height,
        imgPadding + spareLineWidth, imgPadding, img.width, img.height);

    if (containUnderlineLabel)
        renderEngine.drawUnderline(canvas);
}

function addAdditionalInfoForTimu(timus, db, renderEngine) {
    for (var i = 0; i < timus.length; i++) {
        var timu = timus[i];
        timu.tixingName = DBGetTiXingNameByTixingId(db, timu.tixing);
        timu.datiTime = 0;//init datiTime
        timu.rendering = renderEngine.SSEParseTimu(timu.tigantxt, timu.tiganpic);
        timu.timuIndexId = "timu_" + i;
        if (timu.tigantxt.indexOf("label") == -1)
            timu.guochengCanvCnt = 1;
    }
}

function getTiXingsAndTimusFromCachedData($rootScope, self, renderEngine) {
    var qingdanIndex = self.zuoyeqindan.index;
    self.timus = angular.copy($rootScope.db.timus[qingdanIndex]);

    addAdditionalInfoForTimu(self.timus, $rootScope.db, renderEngine);
}

function addDatijiluForAlreadyFinished($rootScope, self, canWrite, renderEngine) {
    for (var i = 0; i < self.timus.length; i++) {
        var timu = self.timus[i];
        timu.datijilu = null;
        //This codes will set datijilu for current timu of current qingdan.
        for (var j = 0; j < self.zuoyeqindan.datijilus.length; j++) {
            var datijilu = self.zuoyeqindan.datijilus[j];
            if (timu.id == datijilu.timu) {
                timu.datijilu = datijilu;
                break;
            }
        }

        //draw daan and guocheng to canvas
        if (timu.datijilu) {
            var guochengArray = null;
            var daanArray = null;
            var pigaipizhuArray = null;
            var guochengLength = 0;
            var answerIndex = 0;

            if (timu.datijilu.guocheng){
                guochengArray = timu.datijilu.guocheng.split($rootScope.imgSplitString);
                guochengLength = guochengArray.length;
            } else {
                if (timu.tigantxt.indexOf("underline") >= 0)
                    guochengLength = 0;
                else
                    guochengLength = 1;
            }

            if (timu.datijilu.daan) {
                daanArray = timu.datijilu.daan.split($rootScope.imgSplitString);
            }

            if (timu.datijilu.pigaipizhu) {
                pigaipizhuArray = timu.datijilu.pigaipizhu.split($rootScope.imgSplitString);
            }

            if (guochengArray && guochengArray.length > 0 && timu.rendering.haveUnserlineAndSelDistrict == false) {
                for(var k = 0; k < guochengArray.length; k ++)
                {
                    var guocheng = guochengArray[k];
                    answerIndex = k;
                    if (guocheng == "")
                        continue;
                    //replace answer image by pizhu image
                    if (pigaipizhuArray && pigaipizhuArray[answerIndex] && pigaipizhuArray[answerIndex].length > 0)
                        guocheng = pigaipizhuArray[answerIndex];

                    timu.canvas[k].canvasImg = guocheng;
                    var canvasId = timu.canvas[k].canvasId;
                    var e = document.getElementById(canvasId);
                    var img = new Image();
                    img.src = guocheng;
                    img.onload = (function(img, e) {
                        return function () {
                            putImgToCanvas(e, img, 0, renderEngine);
                        }
                    })(img, e);
                    if( !(k == guochengArray.length-1 && !canWrite) )//no need to add an empty canvas if cannot write
                        insertCanvasForGuocheng($rootScope, self, timu, canWrite, renderEngine);
                }
            }

            if (daanArray && daanArray.length > 0) {
                var index = 0;
                var heightForUnderline = 4;
                if (timu.tigantxt.indexOf("label") < 0) {
                    index = timu.guochengCanvCnt;
                    heightForUnderline = 0;
                }

                for (var k = 0; k < daanArray.length; k++) {
                    var daan = daanArray[k];
                    answerIndex = guochengLength + k;
                    if (daan == "") {
                        continue;
                    }
                    //replace answer image by pizhu image
                    if (pigaipizhuArray && pigaipizhuArray[answerIndex] && pigaipizhuArray[answerIndex].length > 0)
                        daan = pigaipizhuArray[answerIndex];

                    timu.canvas[k+index].canvasImg = daan;
                    var canvasId = timu.canvas[k+index].canvasId;
                    var e = document.getElementById(canvasId);
                    var img = new Image();

                    img.src = daan;

                    img.onload = (function(img, e, timu, heightForUnderline) {
                        return function () {
                            putImgToCanvas(e, img, timu.tigantxt.indexOf("label") >= 0, renderEngine);
                        }
                    })(img, e, timu, heightForUnderline);
                }
            }
        }
    }
}