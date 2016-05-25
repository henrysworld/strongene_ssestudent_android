
app.controller( 'testpageController', function( $scope, $rootScope, loadingInfo, md5, $timeout, $http ) {

    httpRobustTest($rootScope, $http, $timeout);

    // * Run test 1
    runTestPageTest1();

    // Write your initial code here
    console.log( "This is how to gain access to the ui items:" + myNavigator );
    drawLatex();
    PNGCutTest($rootScope);
    drawPicTest($rootScope);
//    testDB($rootScope);
    activityIndicator($timeout, $rootScope, loadingInfo);
    // testChangePassword($rootScope, md5, $http);
});

function testChangePassword($rootScope, md5, $http) {
    $http({
        method: 'PUT',
        url: $rootScope.serverAddress + "/users/4",
        data:{
            passwd: md5.createHash( "20160002:" + $rootScope.realm + ":1234567" )
        },
        timeout: $rootScope.timeoutShort
    }).then(
        function (response) {
            myNavigator.popPage( { animation: 'slide'} );
            console.log( response );
        },
        function (error){
            alert("修改密码失败，网络错误");
            console.log( error );
        });
}

function activityIndicator($timeout, $rootScope, loadingInfo) {
    loadingInfo.show( $rootScope.loadingInfoReceiving );
    $timeout(function () {
        loadingInfo.hide();
    }, 2000);
}

function testDB($rootScope) {
    $rootScope.db.transaction(function (tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS testTable(id integer primary key, name text)');
        tx.executeSql('INSERT INTO testTable(id, name) VALUES(?,?)', [1, "xiaomi"]);
        tx.executeSql('SELECT * FROM testTable', [],function (tx, res) {
            var len = res.rows.length;
            for (var i=0; i<len; i++){
                alert("Row = " + i + " ID = " + res.rows.item(i).id + " name =  " + res.rows.item(i).name);
            }
        }, function (err) {
            alert("select err");
        });
    }, function (err) {

    }, function () {//after transaction done

    });
}

function runTestPageTest1() {
    console.log( "Changing the text from javascript using jquery" );
    var change_html_test = $("#change_html_test");
    if ( change_html_test )
        change_html_test.html( "<h5>Test1: Changing the text from javascript using jquery</h5>" );
}

function drawLatex() {
    var latex = $("#latex");
    if ( latex ) {
        MathJax.Hub.Typeset();
    }
}

function cutImage($cTemp)
{
    var ctx=$cTemp.getContext("2d");
    var width = $cTemp.width;
    var height = $cTemp.height;
    //alert( width + " " + height );
    var imageData = ctx.getImageData(0,0,width,height);
    var bt = height,bd = 0,bl = width,br = 0;

    for(var y=0;y<height;y++)
    {
        for(var x=0;x<width;x++)
        {
            if(imageData.data[(y*width+x)*4+0] < 0xff) //not white
            {
                if(y<bt)bt=y;
                if(y>bd)bd=y;
                if(x<bl)bl=x;
                if(x>br)br=x;
            }
        }
    }

    //alert( bt + " " + bd + " " + bl + " " + br );
    return [bt,bd,bl,br];
}

function cutImageRow($cTemp,$startRow)
{
    var ctx=$cTemp.getContext("2d");
    var width = $cTemp.width;
    var height = $cTemp.height;
    var imageData = ctx.getImageData(0,0,width,height);
    var bt = height,bd = 0,bl = width,br = 0;
    var emptyRowCnt = 0, findContent = false;

    for(var y=$startRow;y<height;y++)
    {
        var emptyRow = true;
        for(var x=0;x<width;x++)
        {
            if(imageData.data[(y*width+x)*4+0] < 0xff) //not white
            {
                emptyRow = false;
                findContent = true;
                if(y<bt)bt=y;
                if(y>bd)bd=y;
                if(x<bl)bl=x;
                if(x>br)br=x;
            }
        }
        if(emptyRow)
        {
            emptyRowCnt ++;
            if(findContent && emptyRowCnt >= 10) //find gap
                break;
        }
        else
            emptyRowCnt = 0;
    }

    return [bt,bd,bl,br];
}

function PNGCutTest($rootScope)
{
    var cReal=document.getElementById("RealCanvas");
    var cTemp=document.createElement('canvas');

    var img = new Image();

    img.src = $rootScope.testimg;
    img.onload=function() {
        //alert(img.width + " " + img.height);
        cTemp.width = img.width;
        cTemp.height = img.height;
        var ctx = cTemp.getContext("2d");
        ctx.drawImage(img,
            0, 0, img.width, img.height,
            0, 0, cTemp.width, cTemp.height);
        //var canvBorder = cutImage(cTemp);
        var canvBorder = cutImageRow(cTemp, 0);
        canvBorder = cutImageRow(cTemp, canvBorder[1]+1);
        if (canvBorder[0] <= canvBorder[1]) //find content
        {
            var border = new Array();
            border[0] = canvBorder[0] * img.height / cTemp.height - 1;
            border[1] = canvBorder[1] * img.height / cTemp.height + 1;
            border[2] = canvBorder[2] * img.width / cTemp.width - 1;
            border[3] = canvBorder[3] * img.width / cTemp.width + 1;
            //alert( border[0] + " " + border[1] + " " + border[2] + " " + border[3] );
            var ctxReal = cReal.getContext("2d");
            ctxReal.drawImage(img,
                border[2], border[0], border[3] - border[2] + 1, border[1] - border[0] + 1,
                0, 0, cReal.width, cReal.height);
        }
    }
}

function drawPicTest($rootScope)
{
    var canv, canv1;
    canv=document.getElementById("UECanvas");
    drawUnderline(canv);
    drawDefaultPic(canv);

    canv=document.getElementById("OECanvas");
    drawDefaultPic(canv);

    canv=document.getElementById("UFCanvas");
    drawUnderline(canv);

    canv1=document.getElementById("OFCanvas");
    var img = new Image();
    img.src=$rootScope.testimg;
    img.onload=function() {
        var ctx = canv.getContext("2d");
        ctx.drawImage(img,
            0, 0, img.width, img.height,
            0, 0, canv.width, canv.height-4);

        var ctx = canv1.getContext("2d");
        ctx.drawImage(img,
            0, 0, img.width, img.height,
            0, 0, canv.width, canv.height);
    }
}

var gHttpStatus = [];
function httpRobustTest($rootScope, $http, $timeout)
{
    var testCnt = 500;
    var helper = function (success, i, total){
        return function(res) {
            if(success)
                gHttpStatus[i] = 1;
            //else
            //    console.log(i + ' ' + JSON.stringify(res.status));
            counter++;
            successCnt += success;
            if (counter == total) {
                console.log(successCnt + " / " + counter);
                if(successCnt == total)
                {
                    for (var j = 0; j < total; j++)
                        gHttpStatus[j] = undefined;
                    console.log("finish all");
                }
                else
                {
                    console.log("wait for retry");
                    $timeout(function(){
                        httpRobustTest($rootScope, $http, $timeout);
                    }, Math.round(Math.random()*5000));
                }
            }
        };
    }

    console.log("retry start");
    var counter = 0, successCnt = 0;
    for(var i = 0; i < testCnt; i ++)
    {
        if(gHttpStatus[i] != 1)
        {
            $http({
                method: 'GET',
                url: $rootScope.serverAddress + "/timus/8?fields=id,tigantxt,tiganpic",
                timeout: $rootScope.timeoutShort
            }).then(helper(1, i, testCnt), helper(0, i, testCnt));
        }
        else
        {
            counter ++;
            successCnt ++;
        }
    }
}