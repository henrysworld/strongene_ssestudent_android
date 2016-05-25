/**
 * Created by fanyingming on 16/4/19.
 */
(function() {

    angular.module('RenderEngine', []).factory('renderEngine', RenderEngine );
    RenderEngine.$inject = ['$rootScope'];
    function RenderEngine($rootScope) {
        var _ssePopoverContent = {};
        var _ssePopoverResult  = {};
        // timu type
        $rootScope.SSETIGAN_TXT = 0; //text
        $rootScope.SSETIGAN_UDL = 1; //underline
        $rootScope.SSETIGAN_SLT = 2; //select
        $rootScope.SSETIGAN_BR  = 3; //<br>
        $rootScope.SSETIGAN_TAB = 4; //table
        $rootScope.SSETIGAN_ANS = 5; //answer region contain guocheng and daan
        $rootScope.SSETIGAN_PIC = 6; //timu picture
        $rootScope.alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']; //maybe it's enough
        return {
            SSEParseTimu: SSEParseTimu,
            setPopoverInfo: setPopoverInfo,
            getPopoverContent: getPopoverContent,
            getPopoverResult: getPopoverResult,
            renderBlank: renderBlank,
            renderAnswer: renderAnswer,
            drawDefaultPic: drawDefaultPic,
            drawUnderline: drawUnderline
        };

        function SSEParseTimu(tigantxt,tiganpic) //null will be returned if expression is invalid
        {
            var timu = new Object();
            var haveUnserlineAndSelDistrict = false;
            //将旧表达式转换为新的表达式
            //console.log("origin tigantxt : " + tigantxt);
            //replace &nbsp; with ' '
            var reg = new RegExp("&nbsp;","g");
            tigantxt = tigantxt.replace(reg, ' ');
            //replace <br> with ###br###
            var reg = new RegExp("<br>","g");
            tigantxt = tigantxt.replace(reg, '###br###');
            //replace <label class="underline"> with ###underline##
            var reg = new RegExp("<label class=\"underline\">","g");
            tigantxt = tigantxt.replace(reg, '###underline##');
            var reg = new RegExp("<label class=\'underline\'>","g");
            tigantxt = tigantxt.replace(reg, '###underline##');
            //replace </label> with ###
            var reg = new RegExp("</label>","g");
            tigantxt = tigantxt.replace(reg, '###');
            //console.log("new tigantxt : " + tigantxt);

            //parse info
            var contentArray = tigantxt.split('###');
            
            if(contentArray.length&1 != 1)
            {
                console.log("分隔符不匹配");
                return null;
            }

            timu.info = new Array();
            for (var i = 0; i < contentArray.length; i += 2) //parse text part
            {
                timu.info[i] = new Array();
                timu.info[i][0] = $rootScope.SSETIGAN_TXT;
                timu.info[i][1] = contentArray[i];
            }
            for (var i = 1; i < contentArray.length; i += 2) //parse self defined part
            {
                timu.info[i] = new Array();
                var content = contentArray[i];
                if (content.indexOf("underline") == 0)
                {
                    timu.info[i][0] = $rootScope.SSETIGAN_UDL;
                    var ctntArray = content.split('##');
                    if (ctntArray.length != 2)
                    {
                        console.log("error in parse " + content);
                        return null;
                    }
                    timu.info[i][1] = ctntArray[1];
                    haveUnserlineAndSelDistrict = true;
                }
                else if (content.indexOf("select") == 0)
                {
                    timu.info[i][0] = $rootScope.SSETIGAN_SLT;
                    var ctntArray = content.split('##');
                    if (ctntArray.length != 2)
                    {
                        console.log("error in parse " + content);
                        return null;
                    }
                    timu.info[i][1] = ctntArray[1].split('@@');
                    haveUnserlineAndSelDistrict = true;
                }
                else if (content.indexOf("br") == 0)
                {
                    timu.info[i][0] = $rootScope.SSETIGAN_BR;
                }
                else if (content.indexOf("table") == 0)
                {
                    timu.info[i][0] = $rootScope.SSETIGAN_TAB;
                    var ctntArray = content.split('##');
                    timu.info[i][1] = new Array();
                    //ctntArray[0] == 'table'
                    for(var j = 1; j < ctntArray.length; j ++)
                    {
                        timu.info[i][1][j] = ctntArray[j].split('@@');
                    }
                }
                else
                {
                    console.log("error: undefined type in " + content);
                    return null;
                }
            }

            //init control
            timu.ctrl = new Array();
            for(var i = 0; i < timu.info.length; i ++)
            {
                timu.ctrl[i] = new Object();
                if(timu.info[i][0] == $rootScope.SSETIGAN_SLT)
                {//init select
                    timu.ctrl[i].idx = -1;
                }
            }
            
            if (tiganpic != null && tiganpic.length > 0) {
                var index = timu.info.length;
                timu.info[index] = [];
                timu.info[index][0] = $rootScope.SSETIGAN_PIC;
                timu.info[index][1] = {};
            }
            //if no select and underline, answer canvas was needed
            if (haveUnserlineAndSelDistrict == false) {
                var index = timu.info.length;
                timu.info[index] = [];
                timu.info[index][0] = $rootScope.SSETIGAN_ANS;
                timu.info[index][1] = {};
            }

            timu.haveUnserlineAndSelDistrict = haveUnserlineAndSelDistrict;

            return timu;
        }

        function renderBlank(drawAddIcon) {
            if (drawAddIcon == undefined) drawAddIcon = true;
            var underlineCanvas = document.getElementsByClassName("underline");
            for (var i = 0; i < underlineCanvas.length; i++ ) {
                var canvasElement = underlineCanvas[i];
                drawUnderline(canvasElement);
                if (drawAddIcon)
                    drawDefaultPic(canvasElement);
            }
        }

        function renderAnswer() {
            var guochengCanvas = document.getElementsByClassName("guocheng");
            var daanCanvas = document.getElementsByClassName("daan");
            for (var i = 0; i < guochengCanvas.length; i++){
                var e = guochengCanvas[i];
                var ctx = e.getContext("2d");
                ctx.fillStyle = 'rgb(48, 48, 48)';
                ctx.fillRect(0, 0, e.width, e.height);
                drawDefaultPic(e);
            }
            for (var i = 0; i < daanCanvas.length; i++){
                var e = daanCanvas[i];
                var ctx = e.getContext("2d");
                ctx.fillStyle = 'rgb(48, 48, 48)';
                ctx.fillRect(0, 0, e.width, e.height);
                drawDefaultPic(e);
            }
        }

        function drawUnderline(canv)
        {
            var ctx = canv.getContext("2d");
            var width = canv.width;
            var height = canv.height;
            ctx.beginPath();
            ctx.strokeStyle = "rgb(255,255,255)";
            ctx.lineWidth = 2;
            ctx.moveTo(0,height-1);
            ctx.lineTo(width,height-1);
            ctx.stroke();
        }

        function drawDefaultPic(canv)
        {
            var ctx = canv.getContext("2d");
            var width = canv.width;
            var height = canv.height;
            var w2 = width/2;
            var h2 = height/2;

            ctx.beginPath();
            ctx.strokeStyle = "rgb(176,176,176)";
            ctx.lineWidth = 5;
            ctx.moveTo(w2-15,h2);
            ctx.lineTo(w2+15,h2);
            ctx.stroke();
            ctx.moveTo(w2,h2-15);
            ctx.lineTo(w2,h2+15);
            ctx.stroke();
            ctx.moveTo(w2+20,h2);
            ctx.arc(w2,h2,20,0,2*Math.PI);
            ctx.stroke();
        }

        function setPopoverInfo(contentArray, state) {
            _ssePopoverContent = contentArray;
            _ssePopoverResult = state;
        }

        function getPopoverContent() {
            return _ssePopoverContent;
        }

        function getPopoverResult() {
            return _ssePopoverResult;
        }
    }

})();