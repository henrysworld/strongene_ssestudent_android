/**
 * Created by xjxxjxwork1017 on 2016/1/5.
 */

app.controller( 'wodexinxiController', function( $http, $log, $timeout, $rootScope ) {

    var self = this;
    self.userInfo = {};
    self.data = { };

    self.logout = function () {
        myNavigator.pushPage( $rootScope.tuichudengluzhanghaoPage, { animation: 'fade' } );
    };

    self.changePassword = function () {
        myNavigator.pushPage( $rootScope.xiugaidenglumimaPage, { animation: 'slide' } );
    };

    self.updateApp = function () {
        StrongenePlugin.updateApp(function(){alert("Success")}, function(){alert("Error")});
    };

    self.userInfo.user = $rootScope.db.user.user;
    self.userInfo.name = $rootScope.db.user.name;
    self.userInfo.banji = $rootScope.db.banji;
});