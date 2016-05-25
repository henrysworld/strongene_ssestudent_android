/**
 * Created by xjxxjxwork1017 on 2016/1/2.
 */

app.controller('globalController', function ($rootScope, $scope, $http, $timeout, loadingInfo, checkTongzhis, supervisor) {
    var self = this;
    ons.ready(function () {
        // * Use $rootScope for globalController
        setIntent($timeout);
        // setAlarm();

        setupPageNavigation($rootScope);
        setupLoadInfo( self, $timeout, loadingInfo );
        getDeviceWidthHeight($rootScope);
        setDefaultAlert();
        supervisor.initial();

        loadingInfo.show( $rootScope.loadingInfoReceiving );

        OpenDB($rootScope);

        //get current data and push todolist before pull data
        DBGetAllData($rootScope.db, $http, $rootScope, $timeout, function($db, $http, $rootScope, $timeout)
        {
            getServerAdress($http, $rootScope,function()
            {
                console.log("Final server address is: " + $rootScope.serverAddress);
                if ($rootScope.debug) {
                    $rootScope.serverAddress = debugServerAddress;
                }
                //Have to call this func to enable retry logic
                DBPushAllTodo($rootScope.db, $http, $rootScope, $timeout, function ($db, $http, $rootScope, $timeout)
                {
                    if ($rootScope.db.user != undefined)
                    {
                        //login automatically, show page before http request to improve QOS
                        if ($rootScope.db.user.type == 3)
                        {
                        //    supervisor.sendMac();
                            myNavigator.replacePage($rootScope.studentClientEntrance, {animation: 'none'});
                        } else
                        {
                            console.log("teacher push page");
                            myNavigator.replacePage($rootScope.teacherClientEntrance, {animation: 'none'});
                        }

                        $rootScope.db.userId = $rootScope.db.user.id;
                        //do not pull anything when push fails!!!
                        //checkTongzhis($rootScope.db, $rootScope, $http, $timeout);
                        //DBPullAllData($rootScope.db, $http, $rootScope, $timeout, function(){});
                    } else
                    {
                        myNavigator.replacePage($rootScope.dengluPage, {animation: 'none'});
                    }
                }, function ($db, $http, $rootScope, $timeout)
                {
                    if ($rootScope.db.user != undefined)
                    {
                        //login automatically, show page before http request to improve QOS
                        DBPullAllData($rootScope.db, $http, $rootScope, $timeout, loadingInfo, function ()
                        {
                            //called always
                        }, function ()
                        {
                            console.log("DBPullAllData success, checkTongzhis initialing");
                            //called after pull finish
                            //if pull fails, tongzhi center will not pull success, either
                            checkTongzhis.initial($rootScope.db);
                        });
                    }
                });
            });
        });

        console.log( "Device: ", device.platform );
        // * Skip DB phase for webOS
        if( device.platform == "browser" )
        {
            getServerAdress($http, $rootScope,function()
            {
                console.log("Final server address is: " + $rootScope.serverAddress);
                if ($rootScope.debug) {
                    $rootScope.serverAddress = "http://101.200.123.36:8800";
                }
             //   supervisor.sendMac();
                myNavigator.replacePage($rootScope.dengluPage, {animation: 'none'});
            });
        }

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

function setIntent( $timeout ) {
    if ( device.platform == "browser" )
        return;
    window.plugins.intent.getCordovaIntent(
        function (intent) {
            console.log( "intent 2 is fired: " + intent.action );
            // * Receive intent while the program is NOT running

            if ( intent.action = "android.intent.action.MAIN" ) {
                console.log( "Normal start up intent detected" );
                var hours = new Date().getHours();
                console.log( "Hours: " + hours );
                setWakeLock( $timeout );
            }
        }, function () {
            console.log('intent Error: getCordovaIntent failed');
        });

    function setWakeLock( $timeout ) {

        // === 唤醒锁检查的逻辑
        // * 如果现在时间是在 8 - 22 点, 则
        // *    1. 设置一个唤醒锁直到 22 点
        // *    2. 设置一个timer, 在下一天的8点触发另一个唤醒锁检查
        // * 否则
        // *    如果时间是在 8 点之前, 则
        // *        1.1. 在当天的 8 点触发另一个唤醒锁检查
        // *    否则 ( 时间在22点之后 )
        // *        1.2. 在第二天的 8 点触发另一个唤醒锁检查

        var LATEST_HOUR = 19;
        var EARLIEST_HOUR = 9;
        var HOURS_IN_A_DAY = 24;
        var today = new Date();
        var hours = today.getHours();
        var minutes = today.getMinutes();

        if( hours >= EARLIEST_HOUR && hours < LATEST_HOUR ) {
            // * Acquire wake_lock until 22:00
            var msUntil = ( ( LATEST_HOUR - hours ) * 3600 - minutes * 60 ) * 1000;
            console.log( "Set wake lock for - " + msUntil + " ms" );
            acquireWakeLockWithExpireTime( msUntil );
            // * Check and set wake_lock at 8:00 in the next day
            var msCheckNextDayAt8 = ( ( EARLIEST_HOUR + HOURS_IN_A_DAY - hours ) * 3600 - minutes * 60 ) * 1000;
            console.log( "Check next wake lock after - " + msCheckNextDayAt8 + " ms" );
            $timeout( function () { setWakeLock( $timeout ); }, msCheckNextDayAt8 );
        }
        else if ( hours < EARLIEST_HOUR ) {
            // * Check and set wake_lock at 8:00
            var msCheckTodayAt8 = ( ( EARLIEST_HOUR - hours ) * 3600 - minutes * 60 ) * 1000;
            console.log( "Check next wake lock after - " + msCheckTodayAt8 + " ms" );
            $timeout( function () { setWakeLock( $timeout ); }, msCheckTodayAt8 );
        }
        else {
            // * Check and set wake_lock at 8:00 in the next day
            var msCheckNextDayAt8 = ( ( EARLIEST_HOUR + HOURS_IN_A_DAY - hours ) * 3600 - minutes * 60 ) * 1000;
            console.log( "Check next wake lock after - " + msCheckNextDayAt8 + " ms" );
            $timeout( function () { setWakeLock( $timeout ); }, msCheckNextDayAt8 );
        }
    }

    function acquireWakeLockWithExpireTime( time ) {
        console.log( "Acquire wake lock for - " + time );

        console.log('Wakelock+++');
        // * Set power to partial lock
        window.powerManagement.dimWithExpireTime( time, function() {
            console.log('+++Wakelock acquired');
        }, function() {
            console.log('---Failed to acquire wakelock');
        });
        // * lock will be maintained when paused
        window.powerManagement.setReleaseOnPause( false, function() {
            console.log('+++Set successfully');
        }, function() {
            console.log('---Failed to set');
        });
    }
}

function setDefaultAlert() {
    if( device.platform != "browser" ) {
        window.alert = function (message) {
            navigator.notification.alert(
                message,    // message
                null,       // callback
                "通知",   // title
                '确定'    // buttonName
            );
        };
    }
}

function setupPageNavigation($rootScope) {

    // * Define pages
    $rootScope.testpageEntrance = "page/slidemenupage/mainPage.html";
    $rootScope.studentClientEntrance = "page/zhudaolan/zhudaolan.html";
    $rootScope.teacherClientEntrance = "page/zhudaolan/zhudaolanlaoshi.html";
    $rootScope.dengluPage = "page/denglupage/denglu.html";
    $rootScope.bluetoothTestEntrance = "page/bluetoothtestpage/bluetoothtest.html";
    $rootScope.testPage = "page/testpage/testPage.html";
    $rootScope.profilePage = "page/profilepage/profilePage.html";
    $rootScope.commandlinePage = "page/commandlinepage/commandlinePage.html";
    $rootScope.zuozuoyePage = "page/zuozuoyepage/zuozuoye.html";
    $rootScope.chakanzuoyePage = "page/chakanzuoyepage/chakanzuoye.html";
    $rootScope.xiugaidenglumimaPage = "page/xiugaidenglumimapage/xiugaidenglumima.html";
    $rootScope.tuichudengluzhanghaoPage = "page/tuichudengluzhanghaopage/tuichudengluzhanghao.html";
    $rootScope.cuotiliebiaoPage = "page/cuotiliebiaopage/cuotiliebiao.html";
    $rootScope.zuocuotiPage = "page/zuocuotipage/zuocuoti.html";
    $rootScope.yueducuotiPage = "page/yueducuotipage/yueducuoti.html";
    $rootScope.caogaoPage = "page/caogaopage/caogaoPage.html";
    $rootScope.sseselectPage = "page/sseselect/sseselect.html";
    $rootScope.templateRenderPage = "page/directiveTemplatePage/templateRender.html";

    // * Page list
    var pageSequence = [$rootScope.testPage, $rootScope.profilePage, $rootScope.commandlinePage];
    // * Page for slide menu
    $rootScope.menuTestPage = "page/slidemenupage/slideMenuPage.html";
    $rootScope.firstTestPage = $rootScope.testPage;

    $rootScope.loadingInfoReceiving = "正在获取数据";
    $rootScope.loadingInfoReceived = "获取数据完成";
    $rootScope.loadingInfoSending = "正在发送数据";
    $rootScope.loadingInfoBluetooth = "蓝牙正在传输";

    // * Get the next page for current page
    $rootScope.getNextPage = function (curPage) {
        var index = pageSequence.indexOf(curPage);
        index++;
        if (index >= pageSequence.length)
            index = 0;
        console.log(pageSequence[index]);
        return pageSequence[index];
    };
    //test img
    $rootScope.testimg = "../img/test.png";

    myNavigator.on("postpop", onPostpopController);
    myNavigator.on("postpush", onPostpushController);
}

function setupLoadInfo( self, $timeout, loadingInfo ) {
    self.loadingMessage = "";
    loadingInfo.setMessage = function( message ) {
        $timeout( function() { self.loadingMessage = message; }, 0 );
    };
    loadingInfo.show = function ( message ) {
        loadingInfo.setMessage( message );
        loading_modal.show();
        loadingInfo.isVisible = true;
    };
    loadingInfo.hide = function () {
        loading_modal.hide();
        loadingInfo.isVisible = false;
        self.loadingMessage = "";
    };
    // loadingInfo.message
    // loadingInfo.isVisible
}

function getDeviceWidthHeight( $rootScope ) {
    var deviceWidth = window.screen.width;
    var deviceHeight = window.screen.height;
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        x = w.innerWidth || e.clientWidth || g.clientWidth,
        y = w.innerHeight|| e.clientHeight|| g.clientHeight;

    $rootScope.deviceWidth = deviceWidth;
    $rootScope.deviceHeight = deviceHeight;
    $rootScope.windowWidth = x;
    $rootScope.windowHeight = y;
    console.log( "Device: " + deviceHeight + " x " + deviceWidth );
    console.log( "Window: " + x + " x " + y );
}

function onPostpopController()
{
    if( myNavigator.getCurrentPage().options.postpopFunc != null )
    {
        var param = myNavigator.getCurrentPage().options.postpopParam;
        myNavigator.getCurrentPage().options.postpopFunc(param[0], param[1], param[2]);
    }
}

function onPostpushController()
{
    if( myNavigator.getCurrentPage().options.postpushFunc != null )
    {
        var param = myNavigator.getCurrentPage().options.postpushParam;
        myNavigator.getCurrentPage().options.postpushFunc(param[0], param[1], param[2]);
    }
}

function cleanData($rootScope, $timeout) {
    if ($rootScope.timerCheckTongzhi)
        $timeout.cancel($rootScope.timerCheckTongzhi);
    if ($rootScope.timerPullData)
        $timeout.cancel($rootScope.timerPullData);
    if ($rootScope.timerPushTodo) {
        $timeout.cancel($rootScope.timerPushTodo);
        $rootScope.timerPushTodo = null;
    }

    DBDeleteAllTable($rootScope.db);
}