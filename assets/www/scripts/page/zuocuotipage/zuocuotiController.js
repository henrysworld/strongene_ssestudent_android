/**
 * Created by ckj on 2016/3/4.
 */

app.controller( 'zuocuotiController', function( $http, $log, $timeout, $rootScope, loadingInfo, $scope, $q, syncSdk, renderEngine, messageStack ) {
    var self = this;
    var page = myNavigator.getCurrentPage();
    self.timus = [];//use array to reuse zuozuoye codes
    self.timus.push(page.options.timu);
    self.currentSelectedCanvasId = null;
    self.syncSDKMessage = "正在连接手写板...";

    loadingInfo.show( $rootScope.loadingInfoReceiving );

    addAdditionalInfoForTimu(self.timus, $rootScope.db);

    $scope.render = function() {
        setUpWritingPad(self, $scope, $timeout, $rootScope, loadingInfo, syncSdk, renderEngine, messageStack);
        renderBlank(1);
        addCanvasForSubjects(self.timus, 1);
        setIdForEveryCanvas(self.timus, self);
        setClickEventForCanvas(self, $rootScope);
        addDatijiluForAlreadyFinished($rootScope, self);
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, document.getElementsByClassName("zuocuotiLatexRender")]);
        setUpSubmit($rootScope, self, $scope, loadingInfo);
        setUpBackButton($scope, self, $rootScope);
        MathJax.Hub.Queue(["hide", loadingInfo]);
    };

    function showSubmitConfirmDialog($rootScope, self, loadingInfo) {
        var r = confirm("提交之后不能修改。确定提交吗?");
        if (r == true) {
            submitZuoyeqindan($rootScope, loadingInfo, self);
        }
    }

    function setUpSubmit($rootScope, self, $scope, loadingInfo) {
        $scope.submit = function() {
            showSubmitConfirmDialog($rootScope, self, loadingInfo);
        }
    }

    function setUpBackButton($scope, self, $rootScope) {
        $scope.backClicked = function() {
            var timu = self.timus[0];
            //if timu.datiTime == 0, means student haven't write answer
            /*
            if (timu.id && timu.datiTime != 0) {
                var guochengBase64 = "";
                //combine timu daan img base64 strings as one string
                var daanBase64 = "";
                var startIndex;

                if (timu.tigantxt.indexOf("label") > 0) {
                    guochengBase64 = "";
                    startIndex = 0;
                } else {
                    guochengBase64 = timu.canvas[0].canvasImg;
                    startIndex = 1;
                }

                for (var j = startIndex; j < timu.canvas.length - 1; j++) {
                    var canvas = timu.canvas[j];
                    daanBase64 += canvas.canvasImg + $rootScope.imgSplitString;
                }
                daanBase64 += timu.canvas[j].canvasImg;

                //detect if cached
                if (timu.datijilu) {//update
                    var datijilus = $rootScope.db.cuotidatijilus;
                    for (var i = 0; i < datijilus.length; i++) {
                        if (datijilus[i].timu == timu.id && datijilus[i].submit != 1) {
                            datijilus[i].daan = daanBase64;//only update daan
                            datijilus[i].guocheng = guochengBase64;
                            datijilus[i].submit = 0;
                            DBPutDatijilu($rootScope.db, datijilus[i], 0, 1);
                            break;
                        }
                    }
                } else {//insert
                    var datijilu = {
                        xuesheng: $rootScope.db.userId,
                        timu: timu.id,
            //            zuoyeqingdan: self.zuoyeqindan.id,
                        daan: daanBase64,
                        guocheng: guochengBase64,
                        zuotitime: timu.datiTime
                    }
                    datijilu.submit = 0;
                    $rootScope.db.cuotidatijilus.push(datijilu);
                    DBPutDatijilu($rootScope.db, datijilu, 1, 1);
                }

                DBFindTijiaojilus($rootScope.db);
            }
            */
            myNavigator.popPage();
        }
    }

    function submitZuoyeqindan($rootScope, loadingInfo, self) {
        loadingInfo.show( $rootScope.loadingInfoSending );

        var timu = self.timus[0];
        if (timu.id) {
            var guochengBase64 = "";
            //combine timu daan img base64 strings as one string
            var daanBase64 = "";
            var startIndex;

            if (timu.tigantxt.indexOf("label") > 0) {
                guochengBase64 = "";
                startIndex = 0;
            } else {
                guochengBase64 = timu.canvas[0].canvasImg;
                startIndex = 1;
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
                        datijilus[i].daan = daanBase64;//only update daan and guocheng
                        datijilus[i].guocheng = guochengBase64;
                        datijilus[i].submit = 1;
                        DBPutDatijilu($rootScope.db, datijilus[i], 0, 1);
                        break;
                    }
                }
            } else {//insert
                if (timu.datiTime == 0)
                    timu.datiTime = (new Date()).getTime();
                var datijilu = {
                    xuesheng: $rootScope.db.userId,
                    timu: timu.id,
                    //        zuoyeqingdan: self.zuoyeqindan.id,
                    daan: daanBase64,
                    guocheng: guochengBase64,
                    zuotitime: timu.datiTime
                }
                datijilu.submit = 1;
                //      $rootScope.db.datijilus[self.zuoyeqindan.index].push(datijilu);
                $rootScope.db.cuotidatijilus.push(datijilu);
                DBPutDatijilu($rootScope.db, datijilu, 1, 1/*dummy*/);
            }

     //       DBPutQingdanSubmit($rootScope.db, self.zuoyeqindan, "/datijilus");
            //todo:write DBPutCuotidatijiluSubmit function.
            //db.cuotidatijilus changed, so tijiaojilus need update.
            //todo: only update needed part.
            DBFindTijiaojilus($rootScope.db);
        }

        loadingInfo.hide();
        myNavigator.popPage();
    }

    //this function need future consideration
    function addDatijiluForAlreadyFinished($rootScope, self) {
        /*
        for (var i = 0; i < self.timus.length; i++) {
            var timu = self.timus[i];
            for (var j = 0; j < self.zuoyeqindan.datijilus.length; j++) {
                var datijilu = self.zuoyeqindan.datijilus[j];
                if (timu.id == datijilu.timu) {
                    timu.datijilu = datijilu;
                    break;
                }
            }
            //draw daan and guocheng to canvas
            if (timu.datijilu) {
                var guocheng  = timu.datijilu.guocheng;
                var daanArray = timu.datijilu.daan.split($rootScope.imgSplitString);

                if (guocheng && guocheng.length > 0) {
                    timu.canvas[0].canvasImg = guocheng;
                    var canvasId = timu.canvas[0].canvasId;
                    var e = document.getElementById(canvasId);
                    var img = new Image();

                    img.src = guocheng;

                    img.onload = (function(img, e) {
                        return function () {
                            e.width = img.width;
                            e.height = img.height;
                            var ctx = e.getContext("2d");
                            ctx.drawImage(img,
                                0, 0, img.width, img.height,
                                0, 0, e.width, e.height);
                        }
                    })(img, e);
                }

                if (daanArray && daanArray.length > 0) {
                    var index = 0;
                    var heightForUnderline = 4;
                    if (timu.tigantxt.indexOf("label") < 0) {
                        index = 1;
                        heightForUnderline = 0;
                    }

                    for (var k = 0; k < daanArray.length; k++) {
                        var daan = daanArray[k];
                        if (daan == "") {
                            continue;
                        }
                        timu.canvas[k+index].canvasImg = daan;
                        var canvasId = timu.canvas[k+index].canvasId;
                        var e = document.getElementById(canvasId);
                        var img = new Image();

                        img.src = daan;

                        img.onload = (function(img, e, timu, heightForUnderline) {
                            return function () {
                                e.width = img.width;
                                e.height = img.height + heightForUnderline;
                                var ctx = e.getContext("2d");
                                ctx.drawImage(img,
                                    0, 0, img.width, img.height,
                                    0, 0, e.width, e.height - heightForUnderline);
                                if (timu.tigantxt.indexOf("label") >= 0) {
                                    drawUnderline(e);
                                }
                            }
                        })(img, e, timu, heightForUnderline);
                    }
                }
            }
        }
        */
    }
});

