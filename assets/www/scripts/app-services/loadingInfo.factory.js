/**
 * Created by xjxxj on 3/7/2016.
 */
(function() {

    angular.module('LoadingInfo', []).factory('loadingInfo', LoadingInfo );
    LoadingInfo.$inject = [];
    function LoadingInfo() {
        return {
            isVisible: false,
            counters: [0, 0, 0, 0, 0],
            setMessage: function( _message ) {
                console.log( "LoadingInfo: setMessage function is not defined")
            },
            show:function( message ) {
                console.log( "LoadingInfo: show function is not defined" );
            },
            hide:function() {
                console.log( "LoadingInfo: hide function is not defined" );
            }
        };
    }

})();