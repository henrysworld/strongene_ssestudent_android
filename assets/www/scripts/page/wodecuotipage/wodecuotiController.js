/*
 kechengs{id name laoshi jihua jindu}
 jiaoxuerenwus[kechengIndex]{id name jihua parent next head}+{prev renwuIdx level}
 jiaoxuejihuas[kechengIndex]{id name head}
 tijiaojilus[renwuId]{id xuesheng timu zuoyeqingdan guocheng daan zuotitime pigai pigaijieguo pigaipizhu
    pigaitime pigaiyidu}
 timus[qingdanIndex]{id tigantxt tiganpic jietiguocheng youdaan daan tixing nandu beizhutxt beizhupic
    jiaoxuejihua jiaoxuerenwu buzhicishu time user shanchu}
 timusById[timuId]{same as timus}
 */

function buildJiaoxuerenwuArray(self)
{
    function buildJiaoxuerenwuZhangjie(self, renwu, rwIdx, head, level)
    {
        var prev = -1;
        while (1)
        {
            head.prev = prev;
            prev = head.id;
            head.renwuIdx = rwIdx;
            head.level = level;
            renwu[rwIdx ++] = head;
            if(head.head >= 0)
                rwIdx = buildJiaoxuerenwuZhangjie(self, renwu, rwIdx, self.jiaoxuerenwu[i][head.head], level+1);
            if(head.next >= 0)
                head = self.jiaoxuerenwu[i][head.next];
            else
                break;
        }
        return rwIdx;
    }
    self.renwuArray = new Array();
    for( var i = 0; i < self.kechengs.length; i ++ )
    {
        self.renwuArray[i] = new Array();
        if(self.jiaoxuejihua[i].head >= 0)
            buildJiaoxuerenwuZhangjie(self, self.renwuArray[i], 0, self.jiaoxuerenwu[i][self.jiaoxuejihua[i].head], 0);
    }
}

app.controller( 'wodecuotiController', function( $http, $log, $timeout, $rootScope ) {
    var self = this;

    self.onYuedu = function()
    {
        myNavigator.pushPage( $rootScope.yueducuotiPage, { animation : 'slide',
            cuotijilus: self.cuotiweidu[self.currTab] } );
    }
    self.onClickZhangjie = function(renwuId, renwuIdx)
    {
        if(self.renwuArray[self.currTab][renwuIdx].head < 0) //is leaf node
        {
            myNavigator.pushPage( $rootScope.cuotiliebiaoPage, { animation : 'slide',
                jiaoxuerenwu: self.renwuArray[self.currTab][renwuIdx],
                datijilus: self.renwuArray[self.currTab][renwuIdx].tijiaos,
                cuotijilus: self.renwuArray[self.currTab][renwuIdx].tijiaos.cuoti } );
        }
        else //change hide info
        {
            var renwuArray = self.renwuArray[self.currTab];
            renwuArray[renwuIdx].isHide = !renwuArray[renwuIdx].isHide;
            for(var i = renwuIdx+1; i < renwuArray.length && renwuArray[i].level!=0; i ++)
            {
                renwuArray[i].isHide = renwuArray[renwuIdx].isHide;
            }
        }
    }
    self.updateShowUndone = function()
    {
        self.notShowUndone = !self.notShowUndone;
    };
    self.pushTijiao = function(kcIdx, renwuId, jilu)
    {
        var renwu = self.jiaoxuerenwu[kcIdx][renwuId];
        self.tijiaojilus[kcIdx][renwu.renwuIdx].push(jilu);
        if(renwu.parent != -1)
            self.pushTijiao(kcIdx, renwu.parent, jilu);
    };
    self.pushCuoti = function(kcIdx, renwuId, jilu)
    {
        var renwu = self.jiaoxuerenwu[kcIdx][renwuId];
        self.tijiaojilus[kcIdx][renwu.renwuIdx].cuoti.push(jilu);
        if(renwu.parent != -1)
            self.pushCuoti(kcIdx, renwu.parent, jilu);
    };
    self.currTab = 0;
    self.kechengs = $rootScope.db.kechengs;
    self.jiaoxuejihua = $rootScope.db.jiaoxuejihuas;
    self.jiaoxuerenwu = new Array();
    for( var i = 0; i < self.kechengs.length; i ++ )
    {
        self.jiaoxuerenwu[i] = new Array();
        for( var j = 0; j < $rootScope.db.jiaoxuerenwus[i].length; j ++ )
        {
            var renwu = $rootScope.db.jiaoxuerenwus[i][j];
            self.jiaoxuerenwu[i][renwu.id]=renwu;
        }
    }
    buildJiaoxuerenwuArray(self);

    self.tijiaojilus = new Array();
    self.cuotiweidu = new Array();
    for( var i = 0; i < self.kechengs.length; i ++ )
    {
        self.tijiaojilus[i] = new Array();
        self.cuotiweidu[i] = new Array();
        for( var j = 0; j < self.renwuArray[i].length; j ++ )
        {
            var renwu = self.renwuArray[i][j];

            self.tijiaojilus[i][j] = new Array();
            self.tijiaojilus[i][j].cuoti = new Array();
            if(renwu.head == -1) //only leaf node has cuoti
            {
                var tijiaojilus = $rootScope.db.tijiaojilus[renwu.id];

                for( var k = 0; k < tijiaojilus.length; k ++ )
                {
                    var jilu = tijiaojilus[k];
                    self.pushTijiao(i, renwu.id, jilu);
                    if(jilu.pigai && jilu.pigaijieguo == false)
                    {
                        self.pushCuoti(i, renwu.id, jilu);
                        if(jilu.pigaiyidu != 1)
                            self.cuotiweidu[i].push(jilu);
                    }
                }
            }
            if (renwu.renwuIdx == undefined)
                continue;
            self.renwuArray[i][renwu.renwuIdx].tijiaos = self.tijiaojilus[i][j];
        }
    }

    self.notShowUndone = true;
    for( var i = 0; i < self.kechengs.length; i ++ )
    {
        for( var j = 0; j < self.renwuArray[i].length; j ++ )
        {
            var renwu = self.renwuArray[i][j];
            renwu.isHide = false;
            renwu.isUndone = (renwu.tijiaos.cuoti.length == 0);
            //console.log( renwu.id + " "+ renwu.name + " " + renwu.level + " " + renwu.parent + " "
            //    + renwu.tijiaos.cuoti.length);
        }
    }
});