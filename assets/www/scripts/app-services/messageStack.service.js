

(function() {
    angular.module('MessageStack', []).service('messageStack', MessageStack );
    MessageStack.$inject = ['$timeout'];
    function MessageStack( $timeout ) {
        var messageStack = [];
        var minMessageFlashTime = 2000;
        var minResponseTime = 1000;
        return {
            prepareUpdateState: function ( newMessage, callback ) {
                messageStack.push( newMessage );
                $timeout(
                    function () { callback( messageStack.shift() ); } ,
                    minMessageFlashTime * ( messageStack.length - 1 ) + minResponseTime
                );
            }
        };
    }

})();
