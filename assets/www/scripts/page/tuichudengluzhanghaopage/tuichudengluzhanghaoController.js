/**
 * Created by xjxxjxwork1017 on 2016/1/7.
 */

app.controller( 'tuichudengluzhanghaoController', function( $http, $log, $timeout, $rootScope, authDigest ) {
    var self = this;

    self.isDelete = true;
    self.confirm = function () {
        // * Pop all the pages
        var pageCount = myNavigator.getPages().length;
        for ( var i = 1; i < pageCount; i++ ) {
            myNavigator.popPage();
        }
        $rootScope.logout = true;
        myNavigator.replacePage($rootScope.dengluPage, { animation : 'none' } );
        cleanData($rootScope, $timeout);
        authDigest.logout();
    }
});
