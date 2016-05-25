
app.controller( 'httpTestController', function( $scope, $http, $log ) {
    // * $http is an angular service(class) that provide http services.
    // * Angular use two-way-binding, so when "$scope.httpResponseData" is changed, the display will change as well.
    var req = {
        method: 'GET',
        url: "http://www.google.com",
        headers: {
            'Content-Type': undefined
        },
        data: { test: 'test' }
    };
    $http(req).then(
        function ( response ) {
            var showResultString = response.data;
            if ( showResultString != null )
                showResultString = showResultString.substring(0, 20);
            $scope.httpResponseData = "Success: " + showResultString;
            $log.info(response);
        },
        function ( error ) {
            var showResultString = error.data;
            if ( showResultString != null )
                showResultString = showResultString.substring(0, 20);
            $scope.httpResponseData = "Error: " + showResultString;
            $log.info(error);
        });
});