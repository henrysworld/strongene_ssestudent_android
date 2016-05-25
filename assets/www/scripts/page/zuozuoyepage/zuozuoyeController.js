/**
 * Created by xjxxjxwork1017 on 2016/1/5.
 *
 * self.timus = {
 *      id
 *      tixingName
 *      timuId //elementId
 *      canvas = {canvasId, canvasImg}//daan image
 *      datijilu //if current timu have datijilu
 *  }
 *
 */

app.controller( 'zuozuoyeController', function( $http, $log, $timeout, $rootScope, loadingInfo, $scope, $q, syncSdk, renderEngine, messageStack ) {
    var self = this;
    var page = myNavigator.getCurrentPage();
    self.zuoyeqindan = page.options.zuoyeqindan;
    self.currentSelectedCanvasId = null;
    self.timus = [];
    self.syncSDKMessage = "正在连接手写板...";

    $scope.renderEngine = renderEngine;

    DBGroupData($rootScope.db, $http, $rootScope, $timeout, function(){
        getTiXingsAndTimusFromCachedData($rootScope, self, renderEngine);
    }, function(){});

    if (self.zuoyeqindan.flag == NEW_WORK || self.zuoyeqindan.flag == PARTLY_FINISHED_WORK) {
        setUpWritingPad(self, $scope, $timeout, $rootScope, loadingInfo, syncSdk, renderEngine, messageStack);
        $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
            renderEngine.renderBlank();
            renderEngine.renderAnswer();
            setIdForEveryCanvas(self.timus);
            setClickEventForCanvas(self, $rootScope, renderEngine);
            if (self.zuoyeqindan.flag == PARTLY_FINISHED_WORK)
                addDatijiluForAlreadyFinished($rootScope, self, true, renderEngine);
            MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
            MathJax.Hub.Queue(["hide", loadingInfo]);
        });
        setUpSubmit($rootScope, self, $scope, loadingInfo);
    } else {
        console.log("error, shouldn't enter zuozuoyepage");
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, document.getElementsByClassName("zuozuoyeLatexRender")]);
        MathJax.Hub.Queue(["hide", loadingInfo]);
    }

    setUpBackButton($scope, self, $rootScope);
});

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

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}

function submitZuoyeqindan($rootScope, loadingInfo, self) {
    loadingInfo.show( $rootScope.loadingInfoSending );
    angular.forEach(self.timus, function(timu) {
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
                        datijilus[i].daan = daanBase64;//only update daan and guocheng
                        datijilus[i].guocheng = guochengBase64;
                        datijilus[i].submit = 1;
                        DBPutDatijilu($rootScope.db, datijilus[i], 0);
                        break;
                    }
                }
            } else {//insert
                if (timu.datiTime == 0) {
                    timu.datiTime = (new Date()).getTime();
                    sleep(1);//make sure datiTime is unique
                }
                var datijilu = {
                    xuesheng: $rootScope.db.userId,
                    timu: timu.id,
                    zuoyeqingdan: self.zuoyeqindan.id,
                    daan: daanBase64,
                    guocheng: guochengBase64,
                    zuotitime: timu.datiTime
                }
                datijilu.submit = 1;
                $rootScope.db.datijilus[self.zuoyeqindan.index].push(datijilu);
                DBPutDatijilu($rootScope.db, datijilu, 1);
            }
        }
    });
    $rootScope.db.qingdans[self.zuoyeqindan.index].postDatijiluDone = false;
    DBPutQingdanSubmit($rootScope.db, self.zuoyeqindan, "/datijilus");
    loadingInfo.hide();
    myNavigator.popPage();
}

function setUpBackButton($scope, self, $rootScope) {
    $scope.backClicked = function() {
        myNavigator.popPage();
    }
}