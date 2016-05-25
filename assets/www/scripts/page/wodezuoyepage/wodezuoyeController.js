/**
 * Created by xjxxjxwork1017 on 2016/1/5.
 * self.kechengs = {
 *      qingdans = {
 *          id	int	作业清单的ID号
 *          timus[count]	string	count个题目ID组成的数组
 *          banji	int	作业清单针对的班级ID
 *          kecheng	int	作业清单针对的课程ID
 *          user	int	发布作业清单的老师的ID
 *          fabutime	date	作业清单的发布时间
 *          beizhu	string	作业清单的文字备注
 *          xiugaitime	date	作业清单的最后修改时间
 *          yijiaoshu	int	已交齐作业的学生人数
 *          tijiaotime	date	最后提交作业的提交时间
 *          flag
 *          datijilus   答题记录
 *       }
 *     }
 *     通过答题记录,分辨每个作业清单的类型,0: 未提交 1:做了部分,还未提交 2: 已提交 3:未阅读的批改 4:已阅读的批改 5:未到时间发布
 */

app.controller( 'wodezuoyeController', function($rootScope, $timeout, loadingInfo, $http, syncSdk, $scope) {
    var self = this;

    $scope.NEW_WORK = NEW_WORK;
    $scope.PARTLY_FINISHED_WORK = PARTLY_FINISHED_WORK;
    $scope.PENDING_JUDGE_WORK = PENDING_JUDGE_WORK;
    $scope.NOT_READ_JUDGED_WORK = NOT_READ_JUDGED_WORK;
    $scope.ALREADY_READ_JUDGED_WORK = ALREADY_READ_JUDGED_WORK;
    $scope.NOT_TIME_TO_PUBLISH_WORK = NOT_TIME_TO_PUBLISH_WORK;

    syncSdk.setEmptyCallback();
    syncSdk.startOnce();

    loadingInfo.show( $rootScope.loadingInfoReceiving );

    self.onItemClick = function ( itemId ) {
        var zuoyeqingdan = self.kechengs[self.currentTab].qingdans[itemId];
        var timus = $rootScope.db.timus[zuoyeqingdan.index];

        console.log("wodezuoye: a qingdan was clicked.");
        console.log("zuoyeqingdan: " + JSON.stringify(zuoyeqingdan));
        console.log("timus of current qingdan: " + JSON.stringify(timus));

        if (timus == null || timus.length == 0 || timus.length < zuoyeqingdan.timus.length) {
            if ($rootScope.db.pullList.length == 0) {
                alert("内部错误,无法下载当前作业里的题目");
            } else {
                alert('正在下载当前作业里的题目');
            }
        } else if (timus.length > zuoyeqingdan.timus.length) {
            alert("内部数据错误,请重新登录");
        } else {
            loadingInfo.show( $rootScope.loadingInfoReceiving );

            if (zuoyeqingdan.flag == NEW_WORK || zuoyeqingdan.flag == PARTLY_FINISHED_WORK)
                myNavigator.pushPage( $rootScope.zuozuoyePage, { animation : 'slide', zuoyeqindan : zuoyeqingdan } );
            else
                myNavigator.pushPage( $rootScope.chakanzuoyePage, { animation : 'slide', zuoyeqindan : zuoyeqingdan } );
        }
    };

    DBGroupData($rootScope.db, $http, $rootScope, $timeout, function(){
        getKechengsAndQingdans($rootScope, self);
    }, function(){});

    myNavigator.getCurrentPage().options.postpopFunc = function($rootScope, self, $timeout){
        DBGroupData($rootScope.db, $http, $rootScope, $timeout, function(){
            getKechengsAndQingdans($rootScope, self);
        }, function(){});

        $timeout(function(){},0);//validate disp change
    };
    myNavigator.getCurrentPage().options.postpopParam = [$rootScope, self, $timeout];

    loadingInfo.hide();
});
//use cached data to construct data that fit the view
function getKechengsAndQingdans($rootScope, self){
    //console.log("begin getKechengsAndQingdans ... ");
    self.currentTab = 0;
    self.xinzuoyeCount = 0;
    self.wanchengbufenCount = 0;
    self.daipigaiCount = 0;
    self.daiyuedupigaiCount = 0;
    self.yiyuedupigaiCount = 0;
    self.totalCount = 0;
    self.kechengs = $rootScope.db.kechengs;

    for (var i = 0; i < self.kechengs.length; i++) {
        var kecheng = self.kechengs[i];
        self.xinzuoyeCount += kecheng.xinzuoyeCount;
        self.wanchengbufenCount += kecheng.wanchengbufenCount;
        self.daipigaiCount += kecheng.daipigaiCount;
        self.daiyuedupigaiCount += kecheng.daiyuedupigaiCount;
        self.yiyuedupigaiCount += kecheng.yiyuedupigaiCount;
        self.totalCount += kecheng.totalCount;
    }

}