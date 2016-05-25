
(function() {

    angular
        .module('AuthDigest', [ 'LocalStorageModule', 'AuthDigestData' ])
        .service('authDigest', AuthDigest);

    AuthDigest.$inject = ['$rootScope', '$http', '$q', 'localStorageService', 'authDigestData'];
    function AuthDigest( $rootScope, $http, $q, localStorageService, authDigestData ) {

        var lastToken = null;
        var TRY_LOGIN = 1;

        return {
            login: login,
            loginAuto: loginAuto,
            logout: logout,
            http: http,
            testTokenExpire: testTokenExpire
        };

        function login(username, password, success, failed) {
            // * add new password and user names
            authDigestData.username = username;
            localStorageService.set('username', username);
            authDigestData.password = password;
            // * clear HA1
            authDigestData.HA1 = null;
            localStorageService.set('HA1', null);
            // * try login
            _login( success, failed );
        }

        function loginAuto( success, failed ) {
            authDigestData.username = localStorageService.get('username');  // * Noted username is also used in the auth header
            authDigestData.password = null;
            // * restore HA1
            authDigestData.HA1 = localStorageService.get('HA1');
            _login( success, failed );
        }

        function logout() {
            // * clear all
            lastToken = null;
            authDigestData.username = null;
            localStorageService.set('username', null);
            authDigestData.password = null;
            authDigestData.HA1 = null;
            localStorageService.set('HA1', null);
        }

        function testTokenExpire() {
            lastToken = "";
        }

        function http( object ) {
            return _http( object, 0 );
        }

        function get_http_resolveFunc(resolve) { return function (response) {
                // * save the new token
                lastToken = response.data.token;
                resolve( response );
            };
        }

        function get_http_rejectFunc(resolve, reject, object, tryCount) { return function (response) {
                // * if failed, try login again once
                console.log( "Note: Out-dated token or password/username has changed");
                console.log( tryCount );
                if (tryCount < TRY_LOGIN) {
                    _login(
                        function() {
                            _http( object, tryCount + 1).then( resolve( response ), reject( response )  );
                        },
                        function() { reject( response ); }
                    );
                }
                else reject( response );
            };
        }

        function _http( object, tryCount ) {
            return $q(function(resolve, reject) {
                // * Set the header for authentication
                if ( lastToken != null && lastToken != "" )
                    $http.defaults.headers.common.Authorization = 'Bearer ' + lastToken;
                // * post request
                $http( object ).then(
                    get_http_resolveFunc(resolve),
                    get_http_rejectFunc(resolve, reject, object, tryCount)
                );
            });
        }

        function _login( success, failed ) {
            // * try login
            $http({
                method: 'POST',
                url: $rootScope.serverAddress + "/logins",
                headers: { 'Accept': "/" },
                isAuthenticate: true,
                timeout: $rootScope.timeoutLong
            }).then(
                function (response) {
                    // * save the new token
                    lastToken = response.data.token;
                    success( response );
                },
                function (response) { failed( response ); });
        }
    }

})();