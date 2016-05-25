/*
 jiaoxuerenwu{id name jihua parent next head}+{prev renwuIdx level}
 cuotijilus{id xuesheng timu zuoyeqingdan guocheng daan zuotitime pigai pigaijieguo pigaipizhu
    pigaitime pigaiyidu}
 timus[qingdanIndex]{id tigantxt tiganpic jietiguocheng youdaan daan tixing nandu beizhutxt beizhupic
    jiaoxuejihua jiaoxuerenwu buzhicishu time user shanchu}
 timusById[timuId]{same as timus}
* */
/*- 主窗口：已掌握错题的摘要列表
- 错题1题干摘要
- 错题2题干摘要
- 错题3题干摘要
- ...（更多题目，若存在）
- 子窗口/边栏：
- 按题型筛选按钮组（选择题、填空题、判断题、计算题、证明题）
- 按难度筛选按钮组（难度评级列表）
- 返回按钮*/

app.controller( 'cuotiliebiaoController', function( $log, $timeout, $rootScope, $scope, renderEngine ) {

    var self = this;

    self.onClickTimu = function(timu)
    {
     //   myNavigator.pushPage( $rootScope.zuocuotiPage, { animation : 'slide', timu : timu } );
    };
    self.jiaoxuerenwu = myNavigator.getCurrentPage().options.jiaoxuerenwu;
    self.datijilus = myNavigator.getCurrentPage().options.datijilus;
    self.cuotijilus = myNavigator.getCurrentPage().options.cuotijilus;
    self.cuotiList = new Array();
    for(var i = 0; i < self.cuotijilus.length; i ++)
    {
        var jilu = self.cuotijilus[i];
        var cuoti = $rootScope.db.timusById[jilu.timu];
        for(var j = 0; j < self.cuotiList.length; j ++)
        {
            if(self.cuotiList[j].id == cuoti.id)
            {
                self.cuotiList[j].cnt ++;
                if(cuoti.lastJilu.zuotitime < jilu.zuotitime);
                    cuoti.lastJilu = jilu;
                break;
            }
        }
        if(j == self.cuotiList.length)
        {
            cuoti.cnt = 1;
            cuoti.lastJilu = jilu;
            cuoti.tixingName = DBGetTiXingNameByTixingId($rootScope.db, cuoti.tixing);
            cuoti.rendering = renderEngine.SSEParseTimu(cuoti.tigantxt, cuoti.tiganpic);
            self.cuotiList.push(cuoti);
        }
    }

    $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
        renderEngine.renderBlank(false);

        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
        MathJax.Hub.Queue(["hide", loadingInfo]);
    });
});
