/**
 * Created by xjxxjxwork1017 on 2016/1/7.
 */

app.controller( 'xiugaidenglumimaController', function( $http, $log, $rootScope, md5, localStorageService ) {
    var self = this;

    self.checkPwd = function(pwd, pwd2)
    {
        if(pwd != pwd2) {
            alert( "两次输入密码不一致，请重新输入。" );
            return false;
        }
        if(pwd.length < 6)
        {
            alert("密码长度至少6位");
            return false;
        }
        var notSupport = "[@/'\"#$%&^*]+=";
        var reg = new RegExp(notSupport);
        if(reg.test(pwd))
        {
            alert("新密码包含非法字符！");
            return false;
        }

        return true;
    };
    self.onTijiao = function()
    {
        console.log( "ontijiao()" );
        if(self.checkPwd(self.pwdNew, self.pwdRetype))
        {
            var HA1 = md5.createHash([self.user.user, $rootScope.realm, self.pwdCurr].join(':'));
            var curHA1 = localStorageService.get( "HA1" );
            if ( HA1 == curHA1 ) {
                self.pwdNewMd5 = md5.createHash([self.user.user, $rootScope.realm, self.pwdNew].join(':'));
                httpPutPassword($rootScope, $http, self, $log);
            }
            else alert( "当前密码不正确" );
        }
    };

    self.user = $rootScope.db.user;
    self.pwdCurr = "";
    self.pwdNew = "";
    self.pwdRetype = "";

    function httpPutPassword($rootScope, $http, self, $log)
    {
        //TODO: didn't verified with current password, INSECURE!!!
        console.log( $rootScope.serverAddress + "/users/"+$rootScope.db.user.id );
        console.log( self.pwdNewMd5 );
        $http({
            method: 'PUT',
            url: $rootScope.serverAddress + "/users/"+$rootScope.db.user.id,
            data:{
                passwd: self.pwdNewMd5
            },
            timeout: $rootScope.timeoutShort
        }).then(
            function (response) {
                myNavigator.popPage( { animation: 'slide'} );
                $log.info( response );
                localStorageService.set( "HA1", self.pwdNewMd5 );
            },
            function (error){
                alert("修改密码失败，网络错误");
                $log.info( error );
            });
    }
});
/**
 * Created by xjxxjxwork1017 on 2016/1/7.
 */
