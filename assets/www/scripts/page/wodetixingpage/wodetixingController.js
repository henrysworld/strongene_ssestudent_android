/**
 * Created by xjxxjxwork1017 on 2016/1/5.
 */

app.controller('wodetixingController', function ($http, $log, $timeout, $rootScope, $scope, loadingInfo) {

    var self = this;

    $scope.NEW_WORK = NEW_WORK;
    $scope.PARTLY_FINISHED_WORK = PARTLY_FINISHED_WORK;
    $scope.PENDING_JUDGE_WORK = PENDING_JUDGE_WORK;
    $scope.NOT_READ_JUDGED_WORK = NOT_READ_JUDGED_WORK;
    $scope.ALREADY_READ_JUDGED_WORK = ALREADY_READ_JUDGED_WORK;
    $scope.NOT_TIME_TO_PUBLISH_WORK = NOT_TIME_TO_PUBLISH_WORK;

    loadingInfo.hide();

    self.onItemClick = function(index) {
        var options = {
            animation: "none"
        };
        zhudaolan.setActiveTab(1, options);
    };

    self.qingdans = [];
    self.user = $rootScope.db.user;
    self.time = (new Date()).getTime();

    DBGroupData($rootScope.db, $http, $rootScope, $timeout, function(){
        getZuoyeAndPigai($rootScope.db, self);
    }, function(){});

    myNavigator.getCurrentPage().options.postpushFunc = function($rootScope, self, $timeout){
        console.log("wodetixing page");
        $timeout(function(){},0);//validate disp change
    };
    myNavigator.getCurrentPage().options.postpushParam = [$rootScope, self, $timeout];

});

function getZuoyeAndPigai($db, self) {
    self.qingdans = [];
    self.xinzuoyeCount = 0;
    self.daiyuedupigaiCount = 0;
    self.totalCount = 0;

    //all kecheng tixing display together
    for (var i = 0; i < $db.kechengs.length; i++) {
        for (var j = 0; j < $db.kechengs[i].qingdans.length; j++) {
            self.qingdans.push($db.kechengs[i].qingdans[j]);
        }
    }

    for (var i = 0; i < self.qingdans.length; i++) {
        var qingdan = self.qingdans[i];
        if (qingdan.flag == NEW_WORK) {
            self.xinzuoyeCount++;
            self.totalCount++;
        }
        if (qingdan.flag == NOT_READ_JUDGED_WORK) {
            self.daiyuedupigaiCount++;
            self.totalCount++;
        }
    }
}