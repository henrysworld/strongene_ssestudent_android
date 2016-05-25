

(function() {

    angular.module('AuthDigestData', []).factory('authDigestData', AuthDigestData );
    AuthDigestData.$inject = [];
    function AuthDigestData() {
        var INVALID = null;
        return {
            INVALID: INVALID,
            TIME_OUT: "TIME_OUT",
            USER_ERROR: "USER_ERROR",
            username: INVALID,
            password: INVALID,
            HA1: INVALID,
            lastErrorMessage: INVALID,  // Not in use
            token: INVALID,             // Not in use
            isLoginInfoAvailable: function () {
                return ( ( username != INVALID && username != null ) && ( password != INVALID && password != null ) ||
                    ( HA1 != INVALID && HA1 != null ) );
            },
            isHA1Available: function () {
                return HA1 != INVALID && HA1 != null;
            }
        };
    }

})();