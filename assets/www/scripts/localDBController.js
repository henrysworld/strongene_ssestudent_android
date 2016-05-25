/**
 * Created by ckj on 2016/1/27.
 */
/* Data structure desciption
 config{id serveraddress}
 user{user(登录用户名) type banji name createtime zuoye pigai}
 kechengs{id name laoshi jihua jindu}
 课程下边包含清单,清单下边包含答题记录
 banji{id name ruxue renshu}
 tixings{id name jihua}
 jiaoxuerenwus[kechengIndex]{id name jihua parent next head}
 jiaoxuejihuas[kechengIndex]{id name head}
 qingdans{index id timus[] banji kecheng user fabutime beizhu xiugaitime yijiaoshu tijiaotime}
 datijilus[qingdanIndex]{id xuesheng timu zuoyeqingdan guocheng daan zuotitime pigai pigaijieguo pigaipizhu
    pigaitime pigaiyidu submit}
 cuotidatijilus(错题的提交记录){id xuesheng timu zuoyeqingdan guocheng daan zuotitime pigai pigaijieguo pigaipizhu
    pigaitime pigaiyidu}
 tijiaojilus[renwuId](所有提交的记录){id xuesheng timu zuoyeqingdan guocheng daan zuotitime pigai pigaijieguo pigaipizhu
    pigaitime pigaiyidu}
 timus[qingdanIndex]{id tigantxt tiganpic jietiguocheng youdaan daan tixing nandu beizhutxt beizhupic
    jiaoxuejihua jiaoxuerenwu buzhicishu time user shanchu}
 timusById[timuId]{same as timus}
 pulltime{userid kechengstime tixingstime renwustime qingdanstime datijilustime timustime}
 * */
/*
* 答题记录里存放着datijilus表和datijilusNotSubmit表中共同的答题记录,区别在于datijilusNotSubmit表
* 中的记录没有id属性.
* 我们对结构体$db.datijilus中的submit属性进行维护,标识一个答题记录是否已经提交过(用户点击提交按钮)
*
* tijiaojilus是所有提交的记录,包括有清单id的datijilus和没有清单id的cuotidatijilus.
*
* pulltime: 记录最近一次拉取相关数据的xiugaitime上界，下次拉取数据时应以其为下界避免拉取重复数据
*           另外，此pulltime只应用于情形一，不应用与情形二
*           情形一：http请求对应的接口为查询XX列表的类别，如获取课程列表；在pullkechengs中应用kechengstime，获取有更新的数据，若kechengstime之后无修改，获取的res.data为[]，当前代码逻辑下不更新任何数据
*           情形二：http请求对应的接口为查询XX的类别，如获取用户信息；若应用xiugaitime过滤，若无修改将返回404，当前代码逻辑下判定出错，故不适用
* */
/* Database structure desciption
 config{id serveraddress}
 user{id user type banji name createtime zuoye pigai}
 banji{id name ruxue renshu}
 kechengs{id name laoshi jihua jindu}
 tixings{id name jihua}
 jiaoxuerenwus{id name jihua parent next head}
 jiaoxuejihuas{id name head}
 qingdanzongbiao{id timu zuoyeqingdan}
 qingdans{id banji kecheng user fabutime beizhu xiugaitime yijiaoshu tijiaotime}
 datijilus{id xuesheng timu zuoyeqingdan guocheng daan zuotitime pigai pigaijieguo pigaipizhu
    pigaitime pigaiyidu}
 timus{id tigantxt tiganpic jietiguocheng youdaan daan tixing nandu beizhutxt beizhupic
    jiaoxuejihua jiaoxuerenwu buzhicishu time user shanchu}
 datijilusNotSubmit{idt xuesheng timu zuoyeqingdan guocheng daan zuotitime submit pigaiyidu}
 pulltime{userid kechengstime tixingstime renwustime qingdanstime datijilustime timustime}
 * */
/* Architecture and Operation desciption
 There's three places contain the data: server, database and jsonData. Other modules always use the data in jsonData.
 Pull: derive data from server, update database and jsonData
 Get: derive data from database, update jsonData
 Put: derive data from jsonData, update database
 Push: derive data from database, update server (auto run)
 * */

var TABDATIJILU = 0; //for datijilus
var QINGDANNOTSUBMIT = 1; //for qingdan not submit
var UPDATE_QINGDAN_PIGAIYIDU = 2;
var SUBMIT_CUOTI = 3;

function OpenDB($rootScope) {
    var db =  window.sqlitePlugin.openDatabase({name: $rootScope.dbName}, function(db) {
        db.transaction(function(tx) {
            console.log("create db:" + $rootScope.dbName);
        }, function(err) {
            console.log('Open database ERROR: ' + JSON.stringify(err));
        });
    });
    if( device.platform == "browser" )
    { //browser don't support sql, so disable it in code
        db.executeSql = function(){};
        db.transaction = function(){};
    }
    DBBuildTable(db);
    $rootScope.db = db;
    //DBDeleteAllTable(db); //for test
}

function DBPutConfigure($db, addr)
{
    $db.executeSql('INSERT OR REPLACE INTO config(id,serveraddress) VALUES(0,?)',
        [addr]);
}

function DBAddOrUpdateDatijilu($db, jl) {
    $db.executeSql('INSERT OR REPLACE INTO datijilus(id,xuesheng,timu,zuoyeqingdan,guocheng,daan,' +
        'zuotitime,pigai,pigaijieguo,pigaipizhu,pigaitime,pigaiyidu) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
        [jl.id, jl.xuesheng, jl.timu, jl.zuoyeqingdan, jl.guocheng, jl.daan, jl.zuotitime,
            jl.pigai, jl.pigaijieguo, jl.pigaipizhu, jl.pigaitime, jl.pigaiyidu]);
}

function DBAddOrUpdateTimus($db, t) {
    $db.executeSql('INSERT OR REPLACE INTO timus(id,tigantxt,tiganpic,jietiguocheng,youdaan,daan,' +
        'tixing,nandu,beizhutxt,beizhupic,jiaoxuejihua,jiaoxuerenwu,buzhicishu,time,user,shanchu) ' +
        'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [t.id, t.tigantxt, t.tiganpic, t.jietiguocheng, t.youdaan, t.daan, t.tixing, t.nandu, t.beizhutxt,
            t.beizhupic, t.jiaoxuejihua, t.jiaoxuerenwu, t.buzhicishu, t.time, t.user, t.shanchu]);
}

function DBDeleteDatijiluFromDatijilusNotSubmit($db, jilu) {
    $db.executeSql('DELETE FROM datijilusNotSubmit WHERE zuotitime==?',
        [jilu.zuotitime]);
}

// Notice: todolist cannot contain delete operation
// todolist{id objtab method url objid}
function DBPutOneTodo($db, objtab, method, url, objid)
{
    $db.transaction(function (tx) {
        tx.executeSql('INSERT INTO todolist(id,objtab,method,url,objid) VALUES(NULL,?,?,?,?)',
            [objtab, method, url, objid]);
        tx.executeSql('SELECT MAX(id) as maxid FROM todolist', [], function (tx, res) {
            var maxTodoId = res.rows.item(0).maxid;
            var todoObj = new Object;
            todoObj.id = maxTodoId;
            todoObj.objtab = objtab;
            todoObj.method = method;
            todoObj.url = url;
            todoObj.objid = objid;
            $db.todolist.push(todoObj);
        }, function (err) { console.log("select err"); });
    }, function (err) {
        console.log("trans err " + err);
    }, function () {//after transaction done
    });
}

function DBPutDatijiluPigaiyidu($db, qingdan, url) {
    DBPutOneTodo($db, UPDATE_QINGDAN_PIGAIYIDU, 'PUT', url, qingdan.id);
}

function DBPutDatijilu($db, jilu, insert)
{
    if (insert)
    {
        $db.executeSql('INSERT INTO datijilusNotSubmit(idt,xuesheng,timu,zuoyeqingdan,guocheng,daan,zuotitime,submit,pigaiyidu) ' +
            'VALUES(NULL,?,?,?,?,?,?,?,?)',
            [$db.user.id, jilu.timu, jilu.zuoyeqingdan, jilu.guocheng, jilu.daan, jilu.zuotitime, jilu.submit, jilu.pigaiyidu]);
    }
    else //update
    {
        var newTime = (new Date()).getTime();
        $db.executeSql('UPDATE datijilusNotSubmit SET guocheng=?, daan=?, zuotitime=?, submit=?, pigaiyidu=? WHERE zuotitime==?',
            [jilu.guocheng, jilu.daan, newTime, jilu.submit, jilu.pigaiyidu, jilu.zuotitime],
            function() {}, function (err) { console.log("update datijilu err," + JSON.stringify(err)); });
        jilu.zuotitime = newTime;
    }
}

function DBPutQingdanSubmit($db, qingdan, url)
{
    DBPutOneTodo($db, QINGDANNOTSUBMIT, 'POST', url, qingdan.id);
}

function DBPushOneTodo($db, $http, $rootScope, $timeout, callbackFunc, onPushFinish)
{
    var onSuccess = function (response)
    {
        console.log("a push success");
        $db.executeSql('DELETE FROM todolist WHERE id==?',[$db.todolist[0].id]);
        $db.todolist.shift();
        DBPushOneTodo($db, $http, $rootScope, $timeout, callbackFunc, onPushFinish);
    };
    var onFail = function (error)
    {
        console.log("push fail");
        callbackFunc($db, $http, $rootScope, $timeout);
        $rootScope.timerPushTodo = $timeout(function(){
                DBPushOneTodo($db, $http, $rootScope, $timeout, function(){}, onPushFinish)},
            $rootScope.timeHttpRetry - $rootScope.timeHttpRandParam +
            Math.round(Math.random()*$rootScope.timeHttpRandParam*2));
    };
    if($db.todolist.length > 0)
    {
        console.log("begin push");
        var op = $db.todolist[0];

        if(op.objtab == TABDATIJILU)
        {
        }
        else if(op.objtab == QINGDANNOTSUBMIT)
        {
            var helper = function (jilu, qingdan, success, total) {
                return function (res) {
                    if(success)
                    {
                        if ( typeCheck(res.data, Object) ) {
                            jilu.id = res.data.id;
                            jilu.postSuccess = true;
                            successCnt ++;
                            DBDeleteDatijiluFromDatijilusNotSubmit($db, jilu);
                            DBAddOrUpdateDatijilu($db, jilu);
                        } else
                            console.log('data type error: expected data type: Object, please check data: ' + JSON.stringify(res.data));
                    }
                    counter ++;
                    if(counter == total) {
                        if(successCnt == counter) {
                            var datijilus = $db.datijilus[qingdan.index];
                            for(var j = 0; j < datijilus.length; j ++) {
                                datijilus[j].postSuccess = undefined;
                            }
                            qingdan.postDatijiluDone = true;
                            onSuccess();
                        } else {
                            onFail();
                        }
                    }
                };
            };
            var counter = 0, successCnt = 0;
            for(var i = 0; i < $db.qingdans.length; i ++)
            {
                if($db.qingdans[i].id != op.objid) continue;
                var qingdan = $db.qingdans[i];
                var datijilus = $db.datijilus[i];
                //if current qingdan exist in post queue, this qingdan must be not post success.
                qingdan.postDatijiluDone = false;
                for (var j = 0; j < datijilus.length; j++) {
                    var jilu = datijilus[j];
                    if(jilu.postSuccess == undefined)
                        jilu.postSuccess = false;
                    if(jilu.postSuccess != true)
                    {
                        console.log("push jilu:" + JSON.stringify(jilu));
                        $http({
                            method: op.method,
                            url: $rootScope.serverAddress + op.url,
                            data: {
                                xuesheng: jilu.xuesheng,
                                timu: jilu.timu,
                                zuoyeqingdan: jilu.zuoyeqingdan,
                                guocheng: jilu.guocheng,
                                daan: jilu.daan,
                                zuotitime: jilu.zuotitime
                            },
                            timeout: $rootScope.timeoutLong
                        }).then(helper(jilu, qingdan, 1, qingdan.timus.length), helper(jilu, qingdan, 0, qingdan.timus.length));
                    }
                    else
                    {
                        counter ++;
                        successCnt ++;
                    }
                }
                break;
            }
        } else if (op.objtab == UPDATE_QINGDAN_PIGAIYIDU) {
            var helper = function (success, total, jilu) {
                return function () {
                    if (success) {
                        console.log("PUT jilu id(" + jilu.id + ") success");
                    } else {
                        console.log("PUT jilu id(" + jilu.id + ") failed");
                    }
                    counter ++;
                    successCnt += success;
                    if(counter == total)
                    {
                        if(successCnt == counter) onSuccess();
                        else onFail();
                    }
                };
            };
            var counter = 0, successCnt = 0;
            for(var i = 0; i < $db.qingdans.length; i ++)
            {
                if($db.qingdans[i].id != op.objid) continue;
                var qingdan = $db.qingdans[i];
                var datijilus = $db.datijilus[i];
                for(var j = 0; j < qingdan.timus.length; j ++)
                {
                    for(var k = 0; k < datijilus.length; k ++)
                    {
                        if(datijilus[k].timu == qingdan.timus[j])
                            break;
                    }
                    if(k == datijilus.length)
                    {
                        helper(0,qingdan.timus.length)();
                        continue;
                    }
                    var jilu = datijilus[k];
                    console.log("begin PUT jilu id(" + jilu.id + ")");
                    $http({
                        method: op.method,
                        url: $rootScope.serverAddress + op.url + "/" + jilu.id,
                        data: {
                            pigaiyidu: jilu.pigaiyidu,
                        },
                        timeout: $rootScope.timeoutLong
                    }).then(helper(1,qingdan.timus.length, jilu), helper(0,qingdan.timus.length, jilu));
                }
                break;
            }
        } else if (op.objtab == SUBMIT_CUOTI) {

        }
    }
    else
    {
        console.log("empty push list");
        callbackFunc($db, $http, $rootScope, $timeout);
        onPushFinish($db, $http, $rootScope, $timeout);
        $rootScope.timerPushTodo = $timeout(function(){
                DBPushOneTodo($db, $http, $rootScope, $timeout, function(){}, function(){})},
            $rootScope.timeHttpRetry - $rootScope.timeHttpRandParam +
            Math.round(Math.random()*$rootScope.timeHttpRandParam*2));
    }
}

function DBPushAllTodo($db, $http, $rootScope, $timeout, callbackFunc, onPushFinish)
{
    $db.executeSql('SELECT * FROM todolist ORDER BY id ASC', [], function (res) {
        $db.todolist = new Array();
        for(var i = 0; i < res.rows.length; i ++)
            $db.todolist.push(res.rows.item(i));
        DBPushOneTodo($db, $http, $rootScope, $timeout, callbackFunc, onPushFinish);
    }, function (err) { console.log("select err"); });
}

function DBDeleteAllTable($db)
{
    $db.executeSql('DELETE FROM todolist');
    $db.executeSql('DELETE FROM config');
    $db.executeSql('DELETE FROM user');
    $db.executeSql('DELETE FROM banji');
    $db.executeSql('DELETE FROM kechengs');
    $db.executeSql('DELETE FROM tixings');
    $db.executeSql('DELETE FROM jiaoxuerenwus');
    $db.executeSql('DELETE FROM jiaoxuejihuas');
    $db.executeSql('DELETE FROM qingdanzongbiao');
    $db.executeSql('DELETE FROM qingdans');
    $db.executeSql('DELETE FROM datijilus');
    $db.executeSql('DELETE FROM timus');
    $db.executeSql('DELETE FROM datijilusNotSubmit');
    $db.executeSql('DELETE FROM pulltime');
    $db.todolist = new Array();
    $db.pullList = new Array();
    $db.tixings = null;
    $db.user = null;
    $db.banji = null;
    $db.kechengs = null;
    $db.jiaoxuerenwus = null;
    $db.jiaoxuejihuas = null;
    $db.qingdans = null;
    $db.datijilus = null;
    $db.cuotidatijilus = null;
    $db.tijiaojilus = null;
    $db.timus = null;
    $db.timusById = null;
    $db.pulltime = null;
}

function DBBuildTable($db)
{
    $db.executeSql('CREATE TABLE IF NOT EXISTS todolist(id integer primary key, objtab integer, method text, ' +
        'url text, objid integer)');
    $db.executeSql('CREATE TABLE IF NOT EXISTS config(id integer primary key, serveraddress text)');
    $db.executeSql('CREATE TABLE IF NOT EXISTS user(id integer primary key, user text, type integer, ' +
        'banji integer, name text, createtime integer, zuoye integer, pigai integer)');
    $db.executeSql('CREATE TABLE IF NOT EXISTS banji(id integer primary key, name text, ruxue BIGINT,' +
        'renshu integer)');
    $db.executeSql('CREATE TABLE IF NOT EXISTS kechengs(id integer primary key, name text,' +
        'laoshi integer, jihua integer, jindu integer)');
    $db.executeSql('CREATE TABLE IF NOT EXISTS tixings(id integer primary key, name text, jihua integer)');
    $db.executeSql('CREATE TABLE IF NOT EXISTS jiaoxuerenwus(id integer primary key, name text, jihua integer,' +
        'parent integer, next integer, head integer)');
    $db.executeSql('CREATE TABLE IF NOT EXISTS jiaoxuejihuas(id integer primary key, name text, head integer)');
    $db.executeSql('CREATE TABLE IF NOT EXISTS qingdanzongbiao(id integer primary key, timu integer,' +
        'zuoyeqingdan integer)');
    $db.executeSql('CREATE TABLE IF NOT EXISTS qingdans(id integer primary key, banji integer, kecheng integer,' +
        'user integer, fabutime BIGINT, beizhu text, xiugaitime BIGINT, yijiaoshu integer, tijiaotime BIGINT)');
    $db.executeSql('CREATE TABLE IF NOT EXISTS datijilus(id integer primary key, xuesheng integer, timu integer,' +
        'zuoyeqingdan integer, guocheng BLOB, daan BLOB, zuotitime BIGINT, pigai TINYINT, pigaijieguo TINYINT,' +
        'pigaipizhu BLOB, pigaitime BIGINT, pigaiyidu TINYINT)');
    $db.executeSql('CREATE TABLE IF NOT EXISTS timus(id integer primary key, tigantxt text, tiganpic BLOB,' +
        'jietiguocheng BLOB, youdaan TINYINT, daan BLOB, tixing integer, nandu integer, beizhutxt text,' +
        'beizhupic BLOB, jiaoxuejihua integer, jiaoxuerenwu integer, buzhicishu integer, time BIGINT,' +
        'user integer, shanchu TINYINT)');
    $db.executeSql('CREATE TABLE IF NOT EXISTS datijilusNotSubmit(idt integer primary key, xuesheng integer, timu integer,' +
        'zuoyeqingdan integer, guocheng BLOB, daan BLOB, zuotitime BIGINT, submit TINYINT, pigaiyidu TINYINT)');
    $db.executeSql('CREATE TABLE IF NOT EXISTS pulltime(userid integer primary key, kechengstime BIGINT, tixingstime BIGINT, renwustime BIGINT, qingdanstime BIGINT, datijilustime BIGINT, timustime BIGINT)');
}

function updateObj(obj, data) {

    for (var key in data) {
        obj[key] = data[key];
    }
}

function updateObjArray(objArray, dataArray, primaryKey) {

    for (var i = 0; i < objArray.length; i++) {
        objArray[i].isOld = true;
    }

    for (var i = 0; i < dataArray.length; i++) {
        dataArray[i].isOld = false; // 某次更新数据后，未更新的数据标记为旧数据，后续相关的数据更新将据此选择性更新
        if (dataArray[i][primaryKey] != undefined) {
            for (var j = 0; j < objArray.length; j++) {
                if (dataArray[i][primaryKey] == objArray[j][primaryKey]) {
                    updateObj(objArray[j], dataArray[i]);
                    break;
                }
            }
            if (j == objArray.length)
                objArray.push(dataArray[i]);
        }
    }
}

function SSEUniqArray(a)
{
    for(var i = 1; i < a.length; )
    {
        for(var j = 0; j < i; j ++)
        {
            if(a[i]==a[j])
            {
                a.splice(i,1);
                break;
            }
        }
        if(j == i)
            i ++;
    }
}

function typeCheck(obj, expectedType) {
    switch (expectedType) {
        case Number:
            return typeof obj == 'number';
        case String:
            return typeof obj == 'string';
        case Object:
            return typeof obj == 'object' && obj.constructor == Object;
        case Array:
            return typeof obj == 'object' && obj.constructor == Array;
        default:
            console.log('Error: type unexpected: ' + expectedType.toString());
            return false;
    }
}

function getServerTime($db, $http, $rootScope, $timeout, onSuccess, onFail) {
    $http({
        method: 'GET',
        url: $rootScope.serverAddress + "/servertime",
        timeout: $rootScope.timeoutShort
    }).then(
        function (response) {
            if ( typeCheck(response.data, Number) ) {
                $db.servertime = response.data;
                console.log("servertime is " + $db.servertime);
                onSuccess();
            } else {
                console.log('data type error: expected data type: Number, please check data: ' + JSON.stringify(response.data));
                onFail();
            }
        },
        function (error){
            console.log("user http error:" + JSON.stringify(error));
            onFail();
        });
}

function DBPullUser($db, $http, $rootScope, $timeout, onSuccess, onFail)
{
    $http({
        method: 'GET',
        url: $rootScope.serverAddress + "/users/" + $db.userId,
        timeout: $rootScope.timeoutShort
    }).then(
        function (response){
            if ( typeCheck(response.data, Object) ) {
                if ($db.user == undefined) $db.user = response.data;
                else updateObj($db.user, response.data);

                var user = $db.user;
                $db.executeSql('INSERT OR REPLACE INTO user(id,user,type,banji,name,createtime,zuoye,pigai) VALUES(?,?,?,?,?,?,?,?)',
                    [user.id, user.user, user.type, user.banji, user.name, user.createtime, user.zuoye, user.pigai]);

                onSuccess();
            } else {
                console.log('data type error: expected data type: Object, please check data: ' + JSON.stringify(response.data));
                onFail();
            }
        },
        function (error){
            console.log("user http error:" + JSON.stringify(error));
            onFail();
        });
}

function DBPullBanji($db, $http, $rootScope, $timeout, onSuccess, onFail)
{
    $http({
        method: 'GET',
        url: $rootScope.serverAddress + "/banjis/"+$db.user.banji,
        timeout: $rootScope.timeoutShort
    }).then(
        function (response) {
            if ( typeCheck(response.data, Object) ) {
                if ($db.banji == undefined) $db.banji = response.data;
                else updateObj($db.banji, response.data);

                var bj = $db.banji;
                $db.executeSql('INSERT OR REPLACE INTO banji(id,name,ruxue,renshu) VALUES(?,?,?,?)',
                    [bj.id, bj.name, bj.ruxue, bj.renshu]);

                onSuccess();
            } else {
                console.log('data type error: expected data type: Object, please check data: ' + JSON.stringify(response.data));
                onFail();
            }
        },
        function (error){
            console.log("banjiDetail http error:" + JSON.stringify(error));
            onFail();
        });
}

function DBPullKechengs($db, $http, $rootScope, $timeout, onSuccess, onFail)
{
    var kechengstimeT0 = $db.pulltime.kechengstime || 0;
    var kechengstimeT1 = $db.servertime;

    $http({
        method: 'GET',
        url: $rootScope.serverAddress + "/banjis/"+$db.user.banji+"/kechengs" + "?fields=id,name,laoshi,jihua,jindu&xiugaitime=[" + kechengstimeT0 + "," + kechengstimeT1 + "]",
        timeout: $rootScope.timeoutShort
    }).then(
        function (response) {
            if ( typeCheck(response.data, Array) ) {
                if ($db.kechengs == undefined) $db.kechengs = response.data;
                else updateObjArray($db.kechengs, response.data, 'id');

                $db.kechengs.sort(function (a, b) {
                    return a.id < b.id ? -1 : 1
                });

                $db.transaction(function (tx) {
                    for (var i = 0; i < $db.kechengs.length; i++) {
                        var kc = $db.kechengs[i];
                        kc.index = i;
                        tx.executeSql('INSERT OR REPLACE INTO kechengs(id,name,laoshi,jihua,jindu) VALUES(?,?,?,?,?)',
                            [kc.id, kc.name, kc.laoshi, kc.jihua, kc.jindu]);
                    }
                }, function (err) {
                    console.log("transaction err:" + err.message );
                }, function () {
                    $db.pulltime.kechengstime = kechengstimeT1;
                    $db.executeSql('UPDATE pulltime SET kechengstime = ? WHERE userid = ?',
                        [kechengstimeT1, $db.userId]);
                });

                onSuccess();
            } else {
                console.log('data type error: expected data type: Array, please check data: ' + JSON.stringify(response.data));
                onFail();
            }
        },
        function (error){
            console.log("banjiDetail http error:" + JSON.stringify(error));
            onFail();
        });
}

function DBPullTixings($db, $http, $rootScope, $timeout, onSuccess, onFail)
{
    var tixingstimeT0 = $db.pulltime.tixingstime || 0;
    var tixingstimeT1 = $db.servertime;

    $http({
        method: 'GET',
        url: $rootScope.serverAddress + "/tixings" + "?fields=id,name,jihua&xiugaitime=[" + tixingstimeT0 + "," + tixingstimeT1 + "]",
        timeout: $rootScope.timeoutShort
    }).then(
        function (response){
            if ( typeCheck(response.data, Array) ) {
                if ($db.tixings == undefined) $db.tixings = response.data;
                else updateObjArray($db.tixings, response.data, 'id');

                $db.transaction(function (trx) {
                    for (var i = 0; i < $db.tixings.length; i++) {
                        var tx = $db.tixings[i];
                        trx.executeSql('INSERT OR REPLACE INTO tixings(id,name,jihua) VALUES(?,?,?)',
                            [tx.id, tx.name, tx.jihua]);
                    }
                }, function (err) {
                    console.log("transaction err:" + err.message );
                }, function () {
                    $db.pulltime.tixingstime = tixingstimeT1;
                    $db.executeSql('UPDATE pulltime SET tixingstime = ? WHERE userid = ?',
                        [tixingstimeT1, $db.userId]);
                });

                onSuccess();
            } else {
                console.log('data type error: expected data type: Object, please check data: ' + JSON.stringify(response.data));
                onFail();
            }
        },
        function (error){
            console.log("tixing http error:" + JSON.stringify(error));
            onFail();
        });
}

function DBPullJihuasAndRenwus($db, $http, $rootScope, $timeout, onSuccess, onFail)
{
    var renwustimeT0 = $db.pulltime.renwustime || 0;
    var renwustimeT1 = $db.servertime;

    var jihuahelper = function (success, i, total) {
        return function (response) {
            if(success)
            {
                if ( typeCheck(response.data, Object) ) {
                    if ($db.jiaoxuejihuas[i] == undefined) $db.jiaoxuejihuas[i] = response.data;
                    else updateObj($db.jiaoxuejihuas[i], response.data);
                    successCnt ++;

                    var jihua = $db.jiaoxuejihuas[i];
                    $db.executeSql('INSERT OR REPLACE INTO jiaoxuejihuas(id,name,head) VALUES(?,?,?)',
                        [jihua.id, jihua.name, jihua.head]);
                } else
                    console.log('data type error: expected data type: Object, please check data: ' + JSON.stringify(response.data));
            }
            counter ++;
            if(counter == total)
            {
                if(successCnt == counter) onSuccess();
                else onFail();
            }
        };
    };
    var renwuhelper = function (success, i, total) {
        return function (response) {
            if(success)
            {
                if ( typeCheck(response.data, Array) ) {
                    if ($db.jiaoxuerenwus[i] == undefined) $db.jiaoxuerenwus[i] = response.data;
                    else updateObjArray($db.jiaoxuerenwus[i], response.data, 'id');
                    successCnt ++;

                    $db.transaction(function (tx) {
                        for (var j = 0; j < response.data.length; j++) {
                            var renwu = $db.jiaoxuerenwus[i][j];
                            tx.executeSql('INSERT OR REPLACE INTO jiaoxuerenwus(id,name,jihua,parent,next,head) ' +
                                'VALUES(?,?,?,?,?,?)',
                                [renwu.id, renwu.name, renwu.jihua, renwu.parent, renwu.next, renwu.head]);
                        }
                    }, function (err) {
                        console.log("transaction err:" + err.message );
                    }, function () {});
                } else
                    console.log('data type error: expected data type: Array, please check data: ' + JSON.stringify(response.data));
            }
            counter ++;
            if(counter == total)
            {
                if(successCnt == counter)
                {
                    $db.pulltime.renwustime = renwustimeT1;
                    $db.executeSql('UPDATE pulltime SET renwustime = ? WHERE userid = ?',
                        [renwustimeT1, $db.userId]);
                    onSuccess();
                }
                else onFail();
            }
        };
    };
    if ($db.jiaoxuejihuas == null) $db.jiaoxuejihuas = new Array();
    if ($db.jiaoxuerenwus == null) $db.jiaoxuerenwus = new Array();
    var counter = 0, successCnt = 0;
    if($db.kechengs.length == 0)
        onSuccess();
    else
    {
        for (var i = 0; i < $db.kechengs.length; i++)
        {
            $http({
                method: 'GET',
                url: $rootScope.serverAddress + "/jiaoxuejihuas/" + $db.kechengs[i].jihua,
                timeout: $rootScope.timeoutShort
            }).then(jihuahelper(1, i, $db.kechengs.length * 2), jihuahelper(0, i, $db.kechengs.length * 2));
            $http({
                method: 'GET',
                url: $rootScope.serverAddress + "/jiaoxuejihuas/" + $db.kechengs[i].jihua + "/jiaoxuerenwus" + "?fields=id,name,jihua,parent,next,head&xiugaitime=[" + renwustimeT0 + "," + renwustimeT1 + "]",
                timeout: $rootScope.timeoutShort
            }).then(renwuhelper(1, i, $db.kechengs.length * 2), renwuhelper(0, i, $db.kechengs.length * 2));
        }
    }
}

function DBPullQingdans($db, $http, $rootScope, $timeout, onSuccess, onFail)
{
    var qingdanstimeT0 = $db.pulltime.qingdanstime || 0;
    var qingdanstimeT1 = $db.servertime;

    $http({
        method: 'GET',
        url: $rootScope.serverAddress + "/zuoyeqingdans?banji="+$db.banji.id + "&fields=id,timus,banji,kecheng,user,fabutime,beizhu,xiugaitime,yijiaoshu,tijiaotime&xiugaitime=[" + qingdanstimeT0 + "," + qingdanstimeT1 + "]",
        timeout: $rootScope.timeoutShort
    }).then(
        function (response){
            if ( typeCheck(response.data, Array) ) {
                if ($db.qingdans == undefined) $db.qingdans = response.data;
                else updateObjArray($db.qingdans, response.data, 'id');

                console.log("pull qingdans, qingdans size : " + $db.qingdans.length);
                $db.qingdans.sort(function (a, b) {
                    return a.id < b.id ? -1 : 1
                });

                for (var i = 0; i < $db.qingdans.length; i++) //convert banjiid to banjiname
                {
                    var qd = $db.qingdans[i];
                    //To visit timus of specific qingdan, use timus[qd.index]
                    qd.index = i;
                }
                $db.datijilus = $db.datijilus || [];
                $db.timus = $db.timus || [];

                $db.transaction(function (tx) {
                    for (var i = 0; i < response.data.length; i++) {
                        var qd = response.data[i];
                        SSEUniqArray(qd.timus);
                        $db.datijilus[qd.index] = $db.datijilus[qd.index] || [];
                        $db.timus[qd.index] = $db.timus[qd.index] || [];
                        tx.executeSql('INSERT OR REPLACE INTO qingdans(id,banji,kecheng,user,fabutime,beizhu,xiugaitime,' +
                            'yijiaoshu,tijiaotime) VALUES(?,?,?,?,?,?,?,?,?)',
                            [qd.id, qd.banji, qd.kecheng, qd.user, qd.fabutime, qd.beizhu, qd.xiugaitime,
                                qd.yijiaoshu, qd.tijiaotime]);
                        tx.executeSql('DELETE FROM qingdanzongbiao WHERE zuoyeqingdan==?', [qd.id]);
                        for (var j = 0; j < qd.timus.length; j++) {
                            tx.executeSql('INSERT OR REPLACE INTO qingdanzongbiao(id,timu,zuoyeqingdan) ' +
                                'VALUES(NULL,?,?)', [qd.timus[j], qd.id]);
                        }
                    }
                }, function (err) {
                    console.log("transaction err:" + err.message );
                }, function () {
                    $db.pulltime.qingdanstime = qingdanstimeT1;
                    $db.executeSql('UPDATE pulltime SET qingdanstime = ? WHERE userid = ?',
                        [qingdanstimeT1, $db.userId]);
                });

                console.log("pull qingdans done");
                onSuccess();
            } else {
                console.log('data type error: expected data type: Array, please check data: ' + JSON.stringify(response.data));
                onFail();
            }
        },
        function (error){
            console.log("qingdans http error:" + JSON.stringify(error));
            onFail();
        });
}
//find jilu from qingdandatijilu and cuotidatijilu
//indexed by renwuId
function DBFindTijiaojilus($db)
{
    $db.tijiaojilus = new Array();
    for( var i = 0; i < $db.kechengs.length; i ++ )
    {
        for( var j = 0; j < $db.jiaoxuerenwus[i].length; j ++ )
        {
            var renwu = $db.jiaoxuerenwus[i][j];
            $db.tijiaojilus[renwu.id] = new Array();
        }
    }

    //find tijiaos in qingdans
    for (var i = 0; i < $db.qingdans.length; i++)
    {
        for(var j = 0; j < $db.datijilus[i].length; j ++)
        {
            var jilu = $db.datijilus[i][j];
            var renwuId = $db.timusById[jilu.timu].jiaoxuerenwu;
            $db.tijiaojilus[renwuId].push(jilu);
        }
    }

    //find tijiaos in cuotidatijilus
    for (var i = 0; i < $db.cuotidatijilus.length; i ++)
    {
        var jilu = $db.cuotidatijilus[i];
        var renwuId = $db.timusById[jilu.timu].jiaoxuerenwu;
        $db.tijiaojilus[renwuId].push(jilu);
    }
}

function DBPullCuotiDatijilus($db, $http, $rootScope, $timeout, onSuccess, onFail) {
    $db.cuotidatijilus = new Array();
 //   onSuccess();//don't support cuoti now
    $http({
        method: 'GET',
        url: $rootScope.serverAddress + "/datijilus?zuoyeqingdan=null" +
        "&xuesheng=" + $db.user.id + "&fields=id,xuesheng,timu,zuoyeqingdan,guocheng,daan,zuotitime,pigai,pigaijieguo,pigaipizhu,pigaitime,pigaiyidu",
        timeout: $rootScope.timeoutLong
    }).then(
        function (response) {
            if($db.cuotidatijilus == null) $db.cuotidatijilus = new Array();
            for(var j = 0; j < response.data.length; j ++)
            {
                var jl = response.data[j];
                jl.submit = true;
                var k = 0;

                //find already exist datijilu and update it
                for(; k < $db.cuotidatijilus.length; k ++)
                {
                    if ($db.cuotidatijilus[k].id == null) {
                        //update datijilu from datijiluNotSubmit table
                        if($db.cuotidatijilus[k].zuotitime == jl.zuotitime) {
                            //remove record from datijilusNotSubmit and insert to datijilus table
                            $db.cuotidatijilus[k] = jl;
                            $db.executeSql('DELETE FROM datijilusNotSubmit WHERE zuotitime==?',
                                [jl.zuotitime]);
                            break;
                        }
                    } else {
                        //update datijilu from datijilu table
                        if(jl.id == $db.cuotidatijilus[k].id) {
                            $db.cuotidatijilus[k] = jl;
                            break;
                        }
                    }
                }
                //new datijilu, happened when user first time login
                if(k == $db.cuotidatijilus.length)
                    $db.cuotidatijilus.push(jl);

                $db.executeSql('INSERT OR REPLACE INTO datijilus(id,xuesheng,timu,zuoyeqingdan,guocheng,daan,' +
                    'zuotitime,pigai,pigaijieguo,pigaipizhu,pigaitime,pigaiyidu) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
                    [jl.id, jl.xuesheng, jl.timu, jl.zuoyeqingdan, jl.guocheng, jl.daan, jl.zuotitime,
                        jl.pigai, jl.pigaijieguo, jl.pigaipizhu, jl.pigaitime, jl.pigaiyidu]);
            }
            onSuccess();
        }, function (error) {
            console.log("cuotidatijilu http error:" + JSON.stringify(error));
            onFail();
        });
}

function DBPullDatijilus($db, $http, $rootScope, $timeout, onSuccess, onFail)
{
    var datijilustimeT0 = $db.pulltime.datijilustime || 0;
    var datijilustimeT1 = $db.servertime;

    var helper = function (success, i, total) {
        return function (response) {
            if(success)
            {
                if ( typeCheck(response.data, Array) ) {
                    $db.qingdans[i].pullSuccess = true;
                    if ($db.datijilus[i] == null) $db.datijilus[i] = new Array();
                    for (var j = 0; j < response.data.length; j++) {
                        var jl = response.data[j];
                        jl.submit = 1;
                        var k = 0;

                        //find already exist datijilu and update it
                        //happened when update local db cached data
                        for (; k < $db.datijilus[i].length; k++) {
                            if ($db.datijilus[i][k].id == null) {
                                alert("error");
                            } else {
                                //update datijilu from datijilu table
                                if (jl.id == $db.datijilus[i][k].id) {
                                    updateObj($db.datijilus[i][k], jl);
                                    break;
                                }
                            }
                        }
                        //new datijilu, happened when user first time login
                        if (k == $db.datijilus[i].length)
                            $db.datijilus[i].push(jl);

                        DBAddOrUpdateDatijilu($db, jl);
                    }
                    console.log("datijilu pull success, qingdan id " + $db.qingdans[i].id);
                    successCnt ++;
                } else
                    console.log('data type error: expected data type: Array, please check data: ' + JSON.stringify(response.data));
            } else
                console.log("datijilu pull error, qingdan id " + $db.qingdans[i].id);

            counter ++;
            if(counter == total)
            {
                if(successCnt == counter)
                {
                    for(var j = 0; j < $db.qingdans.length; j ++)
                        $db.qingdans[j].pullSuccess = undefined;

                    $db.pulltime.datijilustime = datijilustimeT1;
                    $db.executeSql('UPDATE pulltime SET datijilustime = ? WHERE userid = ?',
                        [datijilustimeT1, $db.userId]);

                    DBPullCuotiDatijilus($db, $http, $rootScope, $timeout, onSuccess, onFail);
                }
                else onFail();
            }
        };
    };
    if ($db.datijilus == null)
        $db.datijilus = new Array();
    var counter = 0, successCnt = 0;
    if($db.qingdans.length == 0)
        DBPullCuotiDatijilus($db, $http, $rootScope, $timeout, onSuccess, onFail);
    else
    {
        for (var i = 0; i < $db.qingdans.length; i++)
        {
            if($db.qingdans[i].pullSuccess == undefined)
                $db.qingdans[i].pullSuccess = false;
            if($db.qingdans[i].pullSuccess != true)
            {
                console.log("begin pull datijilu of qingdan id " + $db.qingdans[i].id);
                $http({
                    method: 'GET',
                    url: $rootScope.serverAddress + "/datijilus?zuoyeqingdan=" + $db.qingdans[i].id +
                    "&xuesheng=" + $db.user.id + "&fields=id,xuesheng,timu,zuoyeqingdan,guocheng,daan,zuotitime,pigai,pigaijieguo,pigaipizhu,pigaitime,pigaiyidu&xiugaitime=[" + datijilustimeT0 + "," + datijilustimeT1 + "]",
                    timeout: $rootScope.timeoutLong
                }).then(helper(1, i, $db.qingdans.length), helper(0, i, $db.qingdans.length));
            }
            else
            {
                counter ++;
                successCnt ++;
            }
        }
    }
}

function DBPullDatijilusForPigai($db, $http, $rootScope, $timeout, onSuccess, onFail)
{
    var datijilustimeT0 = $db.pulltime.datijilustime || 0;
    var datijilustimeT1 = $db.servertime;

    var helper = function (success, i, total) {
        return function (response) {
            if(success)
            {
                if ( typeCheck(response.data, Array) ) {
                    $db.qingdans[i].pullSuccess = true;
                    for (var j = 0; j < response.data.length; j++) {
                        var jl = response.data[j];

                        //find already exist datijilu and update it
                        for (var k = 0; k < $db.datijilus[i].length; k++) {
                            //update datijilu from datijilu table
                            if (jl.id == $db.datijilus[i][k].id) {
                                updateObj($db.datijilus[i][k], jl);
                                break;
                            }
                        }

                        $db.executeSql('UPDATE datijilus SET pigai = 1, pigaijieguo = ?, pigaipizhu = ?, pigaitime = ? WHERE id = ?',
                            [jl.pigaijieguo, jl.pigaipizhu, jl.pigaitime, jl.id]);

                    }
                    console.log("update datijilu for pigai success, qingdan id " + $db.qingdans[i].id);
                } else
                    console.log('data type error: expected data type: Array, please check data: ' + JSON.stringify(response.data));
            } else
                console.log("update datijilu for pigai failed, qingdan id " + $db.qingdans[i].id);

            counter ++;
            successCnt += success;
            if(counter == total)
            {
                if(successCnt == counter)
                {
                    for(var j = 0; j < $db.qingdans.length; j ++)
                        $db.qingdans[j].pullSuccess = undefined;

                    $db.pulltime.datijilustime = datijilustimeT1;
                    $db.executeSql('UPDATE pulltime SET datijilustime = ? WHERE userid = ?',
                        [datijilustimeT1, $db.userId]);

                    onSuccess();
                }
                else onFail();
            }
        };
    };
    var counter = 0, successCnt = 0;
    if($db.qingdans.length == 0)
        onSuccess();
    else
    {
        for (var i = 0; i < $db.qingdans.length; i++)
        {
            if($db.qingdans[i].pullSuccess == undefined)
                $db.qingdans[i].pullSuccess = false;
            if($db.qingdans[i].pullSuccess != true)
            {
                console.log("begin update datijilu for pigai");
                $http({
                    method: 'GET',
                    url: $rootScope.serverAddress + "/datijilus?zuoyeqingdan=" + $db.qingdans[i].id +
                    "&pigai=1&xuesheng=" + $db.user.id + "&fields=id,pigai,pigaijieguo,pigaipizhu,pigaitime&xiugaitime=[" + datijilustimeT0 + "," + datijilustimeT1 + "]",
                    timeout: $rootScope.timeoutLong
                }).then(helper(1, i, $db.qingdans.length), helper(0, i, $db.qingdans.length));
            }
            else
            {
                counter ++;
                successCnt ++;
            }
        }
    }
}

function DBPullTimus($db, $http, $rootScope, $timeout, onSuccess, onFail)
{
    //var timustimeT0 = $db.pulltime.timustime || 0;
    //var timustimeT1 = $db.servertime;

    var helper = function (success, i, total) {
        return function (response) {
            if(success)
            {
                if ( typeCheck(response.data, Array) ) {
                    //if($db.timus[i] == undefined) $db.timus[i] = new Array();
                    $db.timus[i] = new Array();
                    var qingdan = $db.qingdans[i];
                    //sort timu by order of qingdan.timus
                    for (var k = 0; k < qingdan.timus.length; k++) {
                        for (var j = 0; j < response.data.length; j++) {
                            if (response.data[j].id == qingdan.timus[k]) {
                                $db.timus[i].push(response.data[j]);
                                break;
                            }
                        }
                    }
                    for (var j = 0; j < $db.timus[i].length; j++) {
                        var t = $db.timus[i][j];
                        $db.timusById[t.id] = t;
                        DBAddOrUpdateTimus($db, t);
                    }
                    console.log("pull timu of qingdan " + $db.qingdans[i].id + " success");

                    if ($db.qingdans[i].timus.length != $db.timus[i].length) {
                        console.log("DBPullTimus error, only get " + $db.timus[i].length + " timus");
                        console.log("qingdan: " + JSON.stringify($db.qingdans[i]));
                    } else {
                        $db.qingdans[i].pullSuccess = true;
                        successCnt ++;
                    }
                } else
                    console.log('data type error: expected data type: Array, please check data: ' + JSON.stringify(response.data));
            } else
                console.log("pull timu failed, qingdanId " + $db.qingdans[i].id + ", " + JSON.stringify(response));
            counter ++;
            if(counter == total)
            {
                if(successCnt == counter)
                {
                    for(var j = 0; j < $db.qingdans.length; j ++)
                        $db.qingdans[j].pullSuccess = undefined;

                    //$db.pulltime.timustime = timustimeT1;
                    //$db.executeSql('UPDATE pulltime SET timustime = ? WHERE userid = ?',
                    //    [timustimeT1, $db.userId]);

                    onSuccess();
                }
                else onFail();
            }
        };
    };
    if($db.timus == null) $db.timus = new Array();
    if($db.timusById == null) $db.timusById = new Array();
    var counter = 0, successCnt = 0;
    if($db.qingdans.length == 0)
        onSuccess();
    else
    {
        for (var i = 0; i < $db.qingdans.length; i++)
        {
            var qingdan = $db.qingdans[i];
            if(qingdan.isOld && $db.timus[i] != undefined && $db.timus[i].length != 0)
                qingdan.pullSuccess = true;
            if(!qingdan.pullSuccess)
            {
                var idStr = "";
                if (qingdan.timus.length > 0)
                {
                    idStr += qingdan.timus[0];
                    for (var j = 1; j < qingdan.timus.length; j++)
                        idStr += "," + qingdan.timus[j];
                }
                console.log("begin pull timus in qingdan " + qingdan.id + ", timus: " + idStr);
                $http({
                    method: 'GET',
                    url: $rootScope.serverAddress + "/timus?id=" + idStr + "&fields=id,tigantxt,tiganpic,jietiguocheng,youdaan,daan,tixing,nandu,beizhutxt,beizhupic,jiaoxuejihua,jiaoxuerenwu,shanchu,buzhicishu,time,user",//&xiugaitime=[" + timustimeT0 + "," + timustimeT1 + "]",
                    timeout: $rootScope.timeoutLong
                }).then(helper(1, i, $db.qingdans.length), helper(0, i, $db.qingdans.length));
            }
            else
            {
                counter ++;
                successCnt ++;
                if(counter == $db.qingdans.length)
                {
                    if(successCnt == counter)
                    {
                        for(var j = 0; j < $db.qingdans.length; j ++)
                            $db.qingdans[j].pullSuccess = undefined;

                        //$db.pulltime.timustime = timustimeT1;
                        //$db.executeSql('UPDATE pulltime SET timustime = ? WHERE userid = ?',
                        //    [timustimeT1, $db.userId]);

                        onSuccess();
                    }
                    else onFail();
                }
            }
        }
    }
}

//将一些基本的数据结构进行聚合
function DBGroupData($db, $http, $rootScope, $timeout, onSuccess, onFail) {
    for (var i = 0; i < $db.kechengs.length; i++) {
        $db.kechengs[i].qingdans = [];
        for (var j = 0; j < $db.qingdans.length; j++) {
            if ($db.qingdans[j].kecheng == $db.kechengs[i].id) {
                $db.kechengs[i].qingdans.push($rootScope.db.qingdans[j]);
            }
        }
    }

    //group datijilu by qingdan
    for (var i = 0; i < $db.kechengs.length; i++) {
        for (var j = 0; j < $db.kechengs[i].qingdans.length; j++) {
            var datijiluIndex = $db.kechengs[i].qingdans[j].index;
            $db.kechengs[i].qingdans[j].datijilus = $db.datijilus[datijiluIndex];
        }
    }
    //analyse qingdan by datijilu
    var currentTime = (new Date()).getTime();
    for (var i = 0; i < $db.kechengs.length; i++) {
        for (var j = 0; j < $db.kechengs[i].qingdans.length; j++) {
            var qingdan = $db.kechengs[i].qingdans[j];
            if (qingdan.datijilus == undefined)
                qingdan.datijilus = [];
            if (qingdan.datijilus.length == 0) {
                if (qingdan.fabutime > currentTime)
                    qingdan.flag = NOT_TIME_TO_PUBLISH_WORK;
                else
                    qingdan.flag = NEW_WORK;
            } else {
                if (qingdan.datijilus.length < qingdan.timus.length) {
                    qingdan.flag = PARTLY_FINISHED_WORK;
                } else {
                    var judgedCount = 0;
                    for (var k = 0; k < qingdan.datijilus.length; k++) {
                        var jilu = qingdan.datijilus[k];
                        if (jilu.pigai && jilu.pigai == true) {
                            judgedCount++;
                        }
                    }
                    //we mark the qingdan that all datijilu was judged as judged
                    //partly judged also marked as not jueged
                    if (judgedCount == qingdan.datijilus.length) {
                        if (qingdan.datijilus[0].pigaiyidu == 1)
                            qingdan.flag = ALREADY_READ_JUDGED_WORK;
                        else
                            qingdan.flag = NOT_READ_JUDGED_WORK;
                    } else {
                        //partly judged
                        if (qingdan.datijilus[0].submit != 1){
                            qingdan.flag = PARTLY_FINISHED_WORK;
                        } else {
                            qingdan.flag = PENDING_JUDGE_WORK;
                        }
                    }
                }
            }
        }
    }

    //statistic qingdan.flag
    for (var i = 0; i < $db.kechengs.length; i++) {
        var kecheng = $db.kechengs[i];
        kecheng.xinzuoyeCount = 0;
        kecheng.wanchengbufenCount = 0;
        kecheng.daipigaiCount = 0;
        kecheng.daiyuedupigaiCount = 0;
        kecheng.yiyuedupigaiCount = 0;
        kecheng.daifabuCount = 0;
        kecheng.totalCount = kecheng.qingdans.length;

        for (var j = 0; j < kecheng.qingdans.length; j++) {
            var qingdan = kecheng.qingdans[j];
            if (qingdan.flag == NEW_WORK) {
                kecheng.xinzuoyeCount++;
            } else if (qingdan.flag == PARTLY_FINISHED_WORK) {
                kecheng.wanchengbufenCount++;
            } else if (qingdan.flag == PENDING_JUDGE_WORK) {
                kecheng.daipigaiCount++;
            } else if (qingdan.flag == NOT_READ_JUDGED_WORK) {
                kecheng.daiyuedupigaiCount++;
            } else if (qingdan.flag == ALREADY_READ_JUDGED_WORK) {
                kecheng.yiyuedupigaiCount++;
            } else if (qingdan.flag == NOT_TIME_TO_PUBLISH_WORK) {
                kecheng.daifabuCount++;
            } else {
                console.log("qingdan.flag error");
            }
        }
    }

    onSuccess();
}

function DBPullOneData($db, $http, $rootScope, $timeout, loadingInfo, callbackFunc, onPullFinish)
{
    var onSuccess = function ()
    {
        console.log("pull one data success");
        $db.pullList.shift();
        LoadingInfoDBUpdate( loadingInfo, $rootScope, $db, false, true );
        DBPullOneData($db, $http, $rootScope, $timeout, loadingInfo, callbackFunc, onPullFinish);
    };
    var onFail = function ()
    {
        console.log("pull one data failed");
        LoadingInfoDBUpdate( loadingInfo, $rootScope, $db, false, false );
        callbackFunc($db, $http, $rootScope, $timeout);
        $rootScope.timerPullData = $timeout(function(){
                DBPullOneData($db, $http, $rootScope, $timeout, loadingInfo, function(){}, onPullFinish)},
            $rootScope.timeHttpRetry - $rootScope.timeHttpRandParam +
            Math.round(Math.random()*$rootScope.timeHttpRandParam*2));
    };
    if($db.pullList.length > 0)
    {
        var func = $db.pullList[0];
        console.log("begin pull data");
        func($db, $http, $rootScope, $timeout, onSuccess, onFail);
    }
    else
    {
        if( $rootScope.logout ) return;
        callbackFunc($db, $http, $rootScope, $timeout);
        onPullFinish($db, $http, $rootScope, $timeout);
        $rootScope.timerPullData = $timeout(function(){
                DBPullOneData($db, $http, $rootScope, $timeout, loadingInfo, function(){}, function(){})},
            $rootScope.timeHttpRetry - $rootScope.timeHttpRandParam +
            Math.round(Math.random()*$rootScope.timeHttpRandParam*2));
    }
}

function LoadingInfoDBUpdate(loadingInfo, $rootScope, $db, isInitial, isSuccess) {
    // * Calculate message
    if ( isInitial )
        loadingInfo.counters[0] = $db.pullList.length;  // The counter for remains
    loadingInfo.counters[1] = $db.pullList.length;      // The counter for total tasks
    if ( isSuccess )
        loadingInfo.counters[2] = 0;                    // The counter for 重试
    else
        loadingInfo.counters[2]++;
    var m = $rootScope.loadingInfoReceiving +
        " (" + ( loadingInfo.counters[0] - loadingInfo.counters[1] + 1 ) + "/" + loadingInfo.counters[0] + ")";
    if ( loadingInfo.counters[2] != 0 )
        m += ", " + "重试" + loadingInfo.counters[2] +  "次";
    if ( loadingInfo.counters[1] == 0)
        m = $rootScope.loadingInfoReceived +
            " (" +  loadingInfo.counters[0] + "/" + loadingInfo.counters[0] + ")";

    // * show message
    loadingInfo.setMessage( m );
    console.log( "Message: " + m );
}

function DBPullAllData($db, $http, $rootScope, $timeout, loadingInfo, callbackFunc, onPullFinish)
{
    if($db.pullList == null) $db.pullList = new Array();
    $db.pullList.push(getServerTime);
    $db.pullList.push(DBPullTixings);
    $db.pullList.push(DBPullUser);
    var optAfterUser = function($db, $http, $rootScope, $timeout, onSuccess, onFail)
    {
        if ($db.user.type == 3)
        {//student
            $db.pullList.push(DBPullBanji);
            $db.pullList.push(DBPullKechengs);
            $db.pullList.push(DBPullJihuasAndRenwus);
            $db.pullList.push(DBPullQingdans);
            $db.pullList.push(DBPullDatijilus);
            $db.pullList.push(DBGroupData);
            $db.pullList.push(DBPullTimus);
            LoadingInfoDBUpdate( loadingInfo, $rootScope, $db, true, true );
        }
        onSuccess();
    };
    var findTijiaoAndFinish = function($db, $http, $rootScope, $timeout){
        DBFindTijiaojilus($db);
        onPullFinish($db, $http, $rootScope, $timeout);
    }
    $db.pullList.push(optAfterUser);
    LoadingInfoDBUpdate( loadingInfo, $rootScope, $db, true, true );
    DBPullOneData($db, $http, $rootScope, $timeout, loadingInfo, callbackFunc, findTijiaoAndFinish);
}

function DBGetUser($db, $http, $rootScope, $timeout, callbackFunc)
{
    $db.executeSql('SELECT * FROM user', [], function (res) {
        $db.user = res.rows.item(0);
        callbackFunc($db, $http, $rootScope, $timeout);
    }, function (err) { console.log("select err"); });
}

function DBGetBanjiAndKechengs($db, $http, $rootScope, $timeout, callbackFunc)
{
    $db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM banji', [], function (tx, res) {
            $db.banji = res.rows.item(0);
        }, function (err) { console.log("select err"); });
        tx.executeSql('SELECT * FROM kechengs', [], function (tx, res) {
            $db.kechengs = new Array();
            for(var i = 0; i < res.rows.length; i ++) {
                $db.kechengs.push(res.rows.item(i));
                $db.kechengs[i].index = i;
            }
            $db.kechengs.sort(function(a,b){return a.id<b.id?-1:1});
        }, function (err) { console.log("select err"); });
    }, function (err) {
        console.log("trans err " + err);
    }, function () {//after transaction done
        callbackFunc($db, $http, $rootScope, $timeout);
    });
}

function DBGetTixings($db, $http, $rootScope, $timeout, callbackFunc)
{
    $db.executeSql('SELECT * FROM tixings', [], function (res) {
        $db.tixings = new Array();
        for(var i = 0; i < res.rows.length; i ++)
            $db.tixings.push(res.rows.item(i));
        callbackFunc($db, $http, $rootScope, $timeout);
    }, function (err) { console.log("select err"); });
}

function DBGetJihuasAndRenwus($db, $http, $rootScope, $timeout, callbackFunc)
{
    $db.jiaoxuejihuas = [];
    $db.jiaoxuerenwus = [];
    if($db.kechengs.length == 0)
        callbackFunc($db, $http, $rootScope, $timeout);
    else {
        var q = '',
            p = [],
            index = [];
        for(var i = 0; i < $db.kechengs.length; i ++) {
            q += (q == '' ? '?' : ', ?');
            p.push($db.kechengs[i].jihua);
            index[$db.kechengs[i].jihua] = i;
            $db.jiaoxuerenwus[i] = [];
        }
        $db.executeSql('SELECT * FROM jiaoxuejihuas WHERE id IN (' + q + ')', p, function(res) {
            for(var i = 0; i < res.rows.length; i ++) {
                $db.jiaoxuejihuas[index[res.rows.item(i).id]] = res.rows.item(i);
            }
            $db.executeSql('SELECT * FROM jiaoxuerenwus WHERE jihua IN (' + q + ')', p, function(res) {
                for(var i = 0; i < res.rows.length; i ++) {
                    $db.jiaoxuerenwus[index[res.rows.item(i).jihua]].push(res.rows.item(i));
                }
                callbackFunc($db, $http, $rootScope, $timeout);
            }, function (err) {
                console.log("select err");
            });
        }, function (err) {
            console.log("select err");
        });
    }
}

function DBGetQingdans($db, $http, $rootScope, $timeout, callbackFunc)
{
    $db.qingdans = [];
    $db.executeSql('SELECT * FROM qingdans', [], function(res) {
        for(var i = 0; i < res.rows.length; i ++) {
            $db.qingdans.push(res.rows.item(i));
        }
        $db.qingdans.sort(function(a,b){return a.id<b.id?-1:1});

        var q = '',
            p = [],
            index = [];
        for(var i = 0; i < $db.qingdans.length; i ++) {
            q += (q == '' ? '?' : ', ?');
            p.push($db.qingdans[i].id);
            index[$db.qingdans[i].id] = i;
            $db.qingdans[i].timus = [];
        }
        $db.executeSql('SELECT * FROM qingdanzongbiao WHERE zuoyeqingdan IN (' + q + ')', p, function(res) {
            for(var i = 0; i < res.rows.length; i ++) {
                $db.qingdans[index[res.rows.item(i).zuoyeqingdan]].timus.push(res.rows.item(i).timu);
            }
            for(var i = 0; i < $db.qingdans.length; i ++)　{
                $db.qingdans[i].index = i;
                SSEUniqArray($db.qingdans[i].timus);
            }
            callbackFunc($db, $http, $rootScope, $timeout);
        }, function (err) {
            console.log("select err");
        });
    }, function (err) {
        console.log("select err");
    });
}

function DBGetCuotiDatijilus($db, $http, $rootScope, $timeout, callbackFunc)
{
    var helper = function (total, isFromNotSubmitTable) {
        return function (res) {
            for(var j = 0; j < res.rows.length; j ++){
                var jilu = res.rows.item(j);
                //if record came from datijiluNotSubmit table, no need to set submit property.
                //because we will maintain submit property of datijiluNotSubmit
                //while record came from datijilu table need to set
                if (isFromNotSubmitTable == false)
                    jilu.submit = 1;
                $db.cuotidatijilus.push(jilu);
            }
            if (isFromNotSubmitTable)
                console.log('Unsubmitted CuotiDatijilus Count: ' + res.rows.length);
            counter ++;
            if(counter == total)
                callbackFunc($db, $http, $rootScope, $timeout);
        };
    };

    $db.cuotidatijilus = new Array();
    var counter = 0;
    $db.executeSql('SELECT * FROM datijilus WHERE zuoyeqingdan==null',
        [], helper(2, false),
        function (err) { console.log("select err");});
    $db.executeSql('SELECT * FROM datijilusNotSubmit WHERE zuoyeqingdan==null',
        [], helper(2, true),
        function (err) { console.log("select err");});
}

function DBGetDatijilus($db, $http, $rootScope, $timeout, callbackFunc)
{
    $db.datijilus = [];
    if($db.qingdans.length == 0)
        DBGetCuotiDatijilus($db, $http, $rootScope, $timeout, callbackFunc);
    else {
        var q = '',
            p = [],
            index = [];
        for(var i = 0; i < $db.qingdans.length; i ++) {
            q += (q == '' ? '?' : ', ?');
            p.push($db.qingdans[i].id);
            index[$db.qingdans[i].id] = i;
            $db.datijilus[i] = [];
        }
        $db.executeSql('SELECT * FROM datijilus WHERE zuoyeqingdan IN (' + q + ')', p , function(res) {
            for(var i = 0; i < res.rows.length; i ++) {
                res.rows.item(i).submit = 1;
                $db.datijilus[index[res.rows.item(i).zuoyeqingdan]].push(res.rows.item(i));
            }
            $db.executeSql('SELECT * FROM datijilusNotSubmit WHERE zuoyeqingdan IN (' + q + ')', p , function(res) {
                for(var i = 0; i < res.rows.length; i ++) {
                    $db.datijilus[index[res.rows.item(i).zuoyeqingdan]].push(res.rows.item(i));
                }
                console.log('Unsubmitted Datijilus Count: ' + res.rows.length);
                DBGetCuotiDatijilus($db, $http, $rootScope, $timeout, callbackFunc);
            }, function (err) {
                console.log("select err");
            });
        }, function (err) {
            console.log("select err");
        });
    }
}

function DBGetTimus($db, $http, $rootScope, $timeout, callbackFunc)
{
    var helper = function (i, total) {
        return function (res) {
            var qingdan = $db.qingdans[i];
            $db.timus[i] = new Array();

            if (res.rows.length == 0) {
                console.log("error, get nothing from timus table, qingdan is=" + qingdan.id);
                console.log(JSON.stringify(qingdan));
            }

            for(var k = 0; k < qingdan.timus.length; k ++)
            {
                for(var j = 0; j < res.rows.length; j ++)
                {
                    var t = res.rows.item(j);
                    if(t.id == qingdan.timus[k])
                    {
                        $db.timus[i].push(res.rows.item(j));
                        $db.timusById[t.id] = t;
                        break;
                    }
                }
            }
            if (qingdan.timus.length != $db.timus[i].length) {
                console.log("DBGetTimus error, only get " + $db.timus[i].length + " timus");
                console.log(JSON.stringify(qingdan));
            }
            counter ++;
            if(counter == total)
                callbackFunc($db, $http, $rootScope, $timeout);
        };
    };
    $db.timus = new Array();
    $db.timusById = new Array();
    var counter = 0;
    if($db.qingdans.length == 0)
        callbackFunc($db, $http, $rootScope, $timeout);
    else
    {
        for (var i = 0; i < $db.qingdans.length; i ++)
        {
            var idStr = "";
            var qingdan = $db.qingdans[i];
            if(qingdan.timus.length > 0) {
                idStr += qingdan.timus[0];
                for(var j = 1; j < qingdan.timus.length; j ++)
                    idStr += "," + qingdan.timus[j];
            } else {
                console.log("error, timus of qingdan(" + qingdan.id + ") was empty");
                console.log(JSON.stringify(qingdan));
            }
            $db.executeSql('SELECT * FROM timus WHERE id IN (' + idStr + ')',
                [], helper(i, $db.qingdans.length),
                function (err)
                {
                    console.log("select err");
                });
        }
    }
}

function DBGetConfigure($db, $http, $rootScope, $timeout, callbackFunc)
{
    //default configure, don't add in sql sentence since web device will ignore it
    $db.config = new Object();
    $db.executeSql('SELECT * FROM config',
        [], function (res) {
            if(res.rows.length > 0)
                $db.config = res.rows.item(0);
            callbackFunc($db, $http, $rootScope, $timeout);
        }, function (err) { console.log("select err");});
}

function DBGetPullTime($db, $http, $rootScope, $timeout, callbackFunc)
{
    $db.pulltime = new Object();
    $db.executeSql('SELECT * FROM pulltime',
        [], function (res) {
            console.log('Pulltime: ' + JSON.stringify(res.rows.item(0)));
            if(res.rows.length > 0)
                $db.pulltime = res.rows.item(0);
            callbackFunc($db, $http, $rootScope, $timeout);
        }, function (err) { console.log("select err");});
}


function DBGetAllData($db, $http, $rootScope, $timeout, callbackFunc) {
    DBGetConfigure($db, $http, $rootScope, $timeout, function ($db, $http, $rootScope, $timeout) {
        DBGetPullTime($db, $http, $rootScope, $timeout, function ($db, $http, $rootScope, $timeout) {
            DBGetTixings($db, $http, $rootScope, $timeout, function ($db, $http, $rootScope, $timeout) {
                DBGetUser($db, $http, $rootScope, $timeout, function ($db, $http, $rootScope, $timeout) {
                    DBGetBanjiAndKechengs($db, $http, $rootScope, $timeout, function ($db, $http, $rootScope, $timeout) {
                        DBGetJihuasAndRenwus($db, $http, $rootScope, $timeout, function ($db, $http, $rootScope, $timeout) {
                            DBGetQingdans($db, $http, $rootScope, $timeout, function ($db, $http, $rootScope, $timeout) {
                                DBGetDatijilus($db, $http, $rootScope, $timeout, function ($db, $http, $rootScope, $timeout) {
                                    DBGroupData($db, $http, $rootScope, $timeout, function () {
                                    }, function () {
                                    });
                                    DBGetTimus($db, $http, $rootScope, $timeout, function ($db, $http, $rootScope, $timeout) {
                                        DBFindTijiaojilus($db);
                                        callbackFunc($db, $http, $rootScope, $timeout);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

function DBGetTiXingNameByTixingId(db, id) {
    for (var i = 0; i < db.tixings.length; i++) {
        var tixing = db.tixings[i];
        if (tixing.id == id) {
            return tixing.name;
        }
    }
    return "未知题型";
}