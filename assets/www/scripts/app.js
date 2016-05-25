var app = ons.bootstrap('app', [
    'ui.bootstrap',
    'onsen',
    'angular-md5',
    'AuthDigest',
    'AuthDigestData',
    'LoadingInfo',
    'MessageStack',
    'CheckTongzhis',
    'SyncSdk',
    'Supervisor',
    'RenderEngine',
    'DigestAuthInterceptor'])
    .config( [ "$httpProvider", function ( $httpProvider ) {
        $httpProvider.interceptors.push('digestAuthInterceptor');
    }]);

var SSEDefaultAddress = "http://sseserver.strongene.com";
var debugServerAddress = "http://101.200.123.36:8800";
var NEW_WORK = 0;
var PARTLY_FINISHED_WORK = 1;
var PENDING_JUDGE_WORK = 2;
var NOT_READ_JUDGED_WORK = 3;
var ALREADY_READ_JUDGED_WORK = 4;
var NOT_TIME_TO_PUBLISH_WORK = 5;

function getServerAdress($http, $rootScope, callbackFunc)
{
    var isLocalAddress = function(addr)
    {
        var re=/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;//正则表达式
        if(re.test(addr))
        {
            var r1 = RegExp.$1;
            var r2 = RegExp.$2;
            var r3 = RegExp.$3;
            var r4 = RegExp.$4;
            if((r1==10 || (r1==172&&r2>=16&&r2<=31) || (r1==192&&r2==168)) &&
                (r3>=0 && r3<=255 && r4>=0 && r4<=255))
                return true;
        }
        return false;
    };
    var getFirstAddr = function(addr, onSuccess, onFail)
    {
        $http({
            method: 'GET',
            url: addr + "/serverinfos",
            timeout: 5000
        }).then(onSuccess, onFail);
    }
    var checkLocalAddr = function(addr, onSuccess, onFail)
    {
        if(addr == null)
            onFail();
        else
        {
            $http({
                method: 'GET',
                url: addr + "/serverinfos",
                timeout: 2000
            }).then(onSuccess, onFail);
        }
    }

    var startAddress = $rootScope.db.config.serveraddress;
    console.log("Try first addr: " + startAddress);
    checkLocalAddr(startAddress, function(){ //success
        console.log("Success: " + startAddress);
        $rootScope.serverAddress = startAddress;
        callbackFunc();
    }, function() //fail
    {
        console.log("Fail: " + startAddress);
        console.log("Try default address: " + SSEDefaultAddress);
        getFirstAddr(SSEDefaultAddress, function (response)
        {
            var helper = function (success, addr) {
                return function () {
                    if(success && successCnt == 0)
                    {
                        $rootScope.serverAddress = addr;
                        $rootScope.db.config.serveraddress = addr;
                        DBPutConfigure($rootScope.db, addr);
                        successCnt = 1;
                    }
                    if(success) console.log("Success: " + addr);
                    else        console.log("Fail: " + addr);
                    counter ++;
                    if(counter == total)
                    {
                        if(successCnt == 0)
                            $rootScope.serverAddress = SSEDefaultAddress;
                        callbackFunc();
                    }
                };
            };

            console.log("Success: " + SSEDefaultAddress);
            var counter = 0, successCnt = 0, total = 0;
            if(response.data.addresses != null)
            {
                for (var i = 0; i < response.data.addresses.length; i++)
                {
                    var addr = response.data.addresses[i].address;
                    var port = response.data.addresses[i].port;
                    if (isLocalAddress(addr))
                    {
                        total++;
                        var addrComp = "http://" + addr + ":" + port;
                        console.log("Try local address: " + addrComp);
                        checkLocalAddr(addrComp, helper(1, addrComp), helper(0, addrComp));
                    }
                    else
                        console.log(addr + " is not a local address");
                }
            }
            if(total == 0)
            {
                $rootScope.serverAddress = SSEDefaultAddress;
                callbackFunc();
            }
        }, function ()
        {
            $rootScope.serverAddress = SSEDefaultAddress;
            console.log("Fail: " + SSEDefaultAddress);
            callbackFunc();
        })
    });
}

// * Setup global functions and variables
app.run(function ($rootScope) {
    // * Add startCommandLine to global scope of Angular
    $rootScope.startCommandLine = startCommandLine;
    //$rootScope.serverAddress = "http://101.200.123.36:8800"; //moved after DB operation
    $rootScope.realm = "sseservice";
    $rootScope.dbName = "SSEStudent.db";
    $rootScope.imgSplitString = "_sse_";
    $rootScope.timeoutShort = 0;//20000;
    // * Angular使用的XMLHttpRequest的timeout机制有问题. 非常不推荐用这个参数作为重试标准
    // * 问题出在socket的重用机制和timeout的时间计算规则.
    // * 例: 比如同时执行50个请求, 如果每个请求需要2秒, 如果timeout设为10秒, 假设底层能用socket为5个, 则后面25请求必然会被timeout.
    $rootScope.timeoutLong = 0; // 15000;
    $rootScope.timeHttpRetry = 10000;
    $rootScope.timeHttpRandParam = 4000; //retry time is random in [6000 14000]
    $rootScope.timeGetTongzhi = 6000;
    //please update values below when release app
    $rootScope.debug = true;//display some debug information when this flag open
    $rootScope.version = "1.2.5";
});

(function () {
    "use strict";

    document.addEventListener('deviceready', onDeviceReady.bind(this), false);

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    }

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    }

    function onDeviceReady() {
        // Handle the Cordova pause and resume events
        document.addEventListener('pause', onPause.bind(this), false);
        document.addEventListener('resume', onResume.bind(this), false);

        ons.ready(function () {
            ons.ready(function () {
                // * Stop back button from exiting the app
                myNavigator.getDeviceBackButtonHandler().setListener(function (e) {
                    try {
                        console.log("Poping...." + e);
                        myNavigator.popPage();
                    }
                    catch (err) {
                        // event.callParentHandler();
                        console.log("Stopping2...." + e);
                    }
                });
            });

        });
    }
})();

//call after ng-repeat done
app.directive('ngcDone', function ($timeout) {
    return function (scope, element, attrs) {
        scope.$watch(attrs.ngcDone, function (callback) {

            if (scope.$last === undefined) {
                scope.$watch('htmlElement', function () {
                    if (scope.htmlElement !== undefined) {
                        $timeout(eval(callback), 1);
                    }
                });
            }

            if (scope.$last) {
                eval(callback)();
            }
        });
    }
});
//for compat ng-bind-html-unsafe
app.filter('to_trusted', ['$sce', function($sce){
    return function(text) {
        return $sce.trustAsHtml(text);
    };
}]);

app.directive('templateRender', function($rootScope){
    return {
        restrict: 'E',
        scope: false,
        templateUrl: $rootScope.templateRenderPage
    }
});

app.directive('onFinishRender', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.$emit('ngRepeatFinished');
                });
            }
        }
    }
});

app.directive("mathjaxBind", function() {
    return {
        restrict: "A",
        controller: ["$scope", "$element", "$attrs", function($scope, $element, $attrs) {
            $scope.$watch($attrs.mathjaxBind, function(value) {
                $element.text(value == undefined ? "" : value);
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, $element[0]]);
            });
        }]
    };
});
