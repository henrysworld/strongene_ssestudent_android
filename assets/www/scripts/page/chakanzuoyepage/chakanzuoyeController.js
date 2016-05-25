/**
 * Created by fanyingming on 16/3/30.
 */


app.controller( 'chakanzuoyeController', function( $http, $log, $timeout, $rootScope, loadingInfo, $scope, renderEngine ) {
    var self = this;
    var page = myNavigator.getCurrentPage();
    self.zuoyeqindan = page.options.zuoyeqindan;
    self.timus = [];

    $scope.renderEngine = renderEngine;

    DBGroupData($rootScope.db, $http, $rootScope, $timeout, function(){
        getTiXingsAndTimusFromCachedData($rootScope, self, renderEngine);
    }, function(){});

    if (self.zuoyeqindan.flag == PENDING_JUDGE_WORK || self.zuoyeqindan.flag == NOT_READ_JUDGED_WORK || self.zuoyeqindan.flag == ALREADY_READ_JUDGED_WORK) {
        $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
            renderEngine.renderBlank();
            renderEngine.renderAnswer();
            setIdForEveryCanvas(self.timus);
            addDatijiluForAlreadyFinished($rootScope, self, false, renderEngine);
            if (self.zuoyeqindan.flag == NOT_READ_JUDGED_WORK)
                MarkasPigaiyidu($rootScope, self);
            MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
            MathJax.Hub.Queue(["hide", loadingInfo]);
        });
    } else {
        console.log("error, shouldn't enter chakanzuoyeyepage");
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, document.getElementsByClassName("chakanzuoyeLatexRender")]);
        MathJax.Hub.Queue(["hide", loadingInfo]);
    }

    $scope.backClicked = function() {
        myNavigator.popPage();
    }
});

function MarkasPigaiyidu($rootScope, self) {
    var datijilus = $rootScope.db.datijilus[self.zuoyeqindan.index];
    for (var i = 0; i < datijilus.length; i++) {
        datijilus[i].pigaiyidu = 1;
        DBAddOrUpdateDatijilu($rootScope.db, datijilus[i]);
    }

    DBPutDatijiluPigaiyidu($rootScope.db, self.zuoyeqindan, "/datijilus");
}