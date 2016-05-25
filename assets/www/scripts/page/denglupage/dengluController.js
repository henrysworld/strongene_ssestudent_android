
app.controller( 'dengluController', function( $http, $log, $timeout, $rootScope, loadingInfo, $scope, authDigest, checkTongzhis ) {
    var self = this;
    self.isSuccess = false;
    self.isFailed = false;
    self.submitClicked = submitClicked;
    if ($rootScope.debug) {
        self.username = "20161001";
        self.password = "1234567";
    }

    //hide loading displayed by globalController
    loadingInfo.hide();

    function submitClicked(){
        loadingInfo.show( $rootScope.loadingInfoReceiving );

        authDigest.login(
            self.username,
            self.password,
            function (response) {
                console.log('YES success 1', response + response.data.token);
                console.log("token: " + response.data.token);
                console.log("id: " + response.data.id);
                $timeout( function() { self.isSuccess = true; self.isFailed = false; }, 0 );
                $rootScope.db.userId = response.data.id;
                $rootScope.db.pulltime = {};
                $rootScope.logout = false;
                $rootScope.db.executeSql('INSERT OR REPLACE INTO pulltime(userid) VALUES(?)',[$rootScope.db.userId]);

                if ($rootScope.timerPushTodo == null)
                    DBPushAllTodo($rootScope.db, $http, $rootScope, $timeout, loginCallBackFunc, loginFinishCallBackFunc);
                else
                    loginCallBackFunc();
            },
            function (response) {
                if ( response.data == "Unauthorized" )
                    $timeout( function() { self.failedMessage = "不正确的用户名或密码"; }, 0 );
                else
                    $timeout( function() { self.failedMessage = "网络已断开连接"; }, 0 );
                $timeout( function() { self.isSuccess = false; self.isFailed = true; }, 0 );
                loadingInfo.hide();
            }
        );
    }

    var loginCallBackFunc = function () {
        DBPullAllData($rootScope.db, $http, $rootScope, $timeout, loadingInfo, function(){},
            function($db, $http, $rootScope, $timeout) {//login success
                loadingInfo.hide();

                if ($rootScope.db.user.type == 3) {
                    myNavigator.replacePage($rootScope.studentClientEntrance, { animation : 'slide' } );
                    checkTongzhis.initial($rootScope.db);
                } else {
                    console.log("not student account");
                    $timeout( function() { self.failedMessage = "不正确的用户名或密码."; }, 0 );
                    $timeout( function() { self.isSuccess = false; self.isFailed = true; }, 0 );
                    cleanData($rootScope, $timeout);
                    loadingInfo.hide();
                    //         myNavigator.replacePage($rootScope.teacherClientEntrance, { animation : 'slide' } );
                }
            });
    };
    var loginFinishCallBackFunc = function () {};
});