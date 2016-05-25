
app.controller( 'clickableFloatingController', function( $scope, $http, $log ) {

    var self = $scope;

    self.clicked = false;

    self.imgClick = function(){
        self.clicked = !self.clicked;
    };
});
