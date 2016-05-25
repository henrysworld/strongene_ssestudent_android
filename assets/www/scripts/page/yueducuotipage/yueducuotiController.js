/**
 * Created by ckj on 2016/3/4.
 */
/*
 tijiaojilus[renwuId]{id xuesheng timu zuoyeqingdan guocheng daan zuotitime pigai pigaijieguo pigaipizhu
    pigaitime pigaiyidu}
 timus[qingdanIndex]{id tigantxt tiganpic jietiguocheng youdaan daan tixing nandu beizhutxt beizhupic
    jiaoxuejihua jiaoxuerenwu buzhicishu time user shanchu}
 timusById[timuId]{same as timus}
 */

app.controller( 'yueducuotiController', function( $http, $log, $timeout, $rootScope, $scope, $q, syncSdk ) {
    var self = this;

    self.backClicked = function()
    {
        myNavigator.popPage( { animation: 'slide'} );
    }
    self.cuotijilus = myNavigator.getCurrentPage().options.cuotijilus;
    self.timus = new Array();
    for( var i = 0; i < self.cuotijilus.length; i ++ )
    {
        var timu = $rootScope.db.timusById[self.cuotijilus[i].timu];
        self.timus.push(timu);
    }

    $scope.render = function(){
        renderBlank(0);
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, document.getElementsByClassName("yueducuotiLatexRender")]);
    }
});