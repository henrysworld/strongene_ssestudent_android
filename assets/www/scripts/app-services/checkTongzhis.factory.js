

(function() {

    angular.module('CheckTongzhis', []).factory('checkTongzhis', CheckTongzhis );
    CheckTongzhis.$inject = ['$rootScope', '$http', '$timeout'];
    function CheckTongzhis($rootScope, $http, $timeout) {
        var listeners = [];
        var $db;
        var NEW_ZUOYE = 1,
            NEW_ZUOYEPIGAI= 2,
            ERR= -1;
        var xinzuoyeList = [],
            daiyuedupigaiList = [];
        var getServerAdressCounter = 0;
        return {
            NEW_ZUOYE: NEW_ZUOYE,
            NEW_ZUOYEPIGAI: NEW_ZUOYEPIGAI,
            ERR: ERR,
            initial: initial,
            addListeners: addListeners,
            removeListeners: removeListeners
        };

        function initial( _$db ) {
            console.log( "initialize db" );
            $db = _$db;
            getServerAdressCounter = 0;
            getQingdanList($db, xinzuoyeList, 0);
            getQingdanList($db, daiyuedupigaiList, 3);
            _checkTongzhis($db, $rootScope, $http, $timeout);
        }

        function addListeners( func ) {
            if ( listeners.indexOf( func ) < 0 )
                listeners.push( func );
        }

        function removeListeners( func ) {
            var ii = listeners.indexOf( func );
            if ( ii > -1 )
                listeners.splice(ii, 1);
            console.log( "removeListeners: " + listeners.length );
        }

        function _callListeners( message, obj ) {
            listeners.forEach( function ( item, i, list ) {
                item( message, obj );
            });
        }

        function getQingdanList($db, list, flag) {

            list.length = 0;

            for (var i = 0; i < $db.kechengs.length; i++) {
                for (var j = 0; j < $db.kechengs[i].qingdans.length; j++) {
                    var qingdan = $db.kechengs[i].qingdans[j];
                    if (qingdan.flag == flag) {
                        list.push(qingdan);
                    }
                }
            }
        }

        function existsNew(oldList, newList) {
            for ( var i = 0; i < newList.length; i++ ) {
                var qingdan = newList[i];
                var isNew = true;
                for ( var j = 0; j < oldList.length; j++ ) {
                    if ( qingdan.id == oldList[j].id ) {
                        isNew = false;
                        break;
                    }
                }
                if ( isNew ) {
                    return true;
                }
            }
            return false;
        }

        function _checkTongzhis($db, $rootScope, $http, $timeout) {
            var setDelayCheck = function() {
                $rootScope.timerCheckTongzhi = $timeout( function(){
                    _checkTongzhis($db, $rootScope, $http, $timeout);
                }, $rootScope.timeGetTongzhi);
            };

            var pushWithCb = function(DBFunc, cb) {
                var func = function($db, $http, $rootScope, $timeout, onSuccess, onFail) {
                    var myOnSuccess = function() {
                        cb($db, onSuccess);
                    };
                    DBFunc($db, $http, $rootScope, $timeout, myOnSuccess, onFail);
                };
                $db.pullList.push(func);
            };

            var notifyZuoye = function ($db, next){
                var oldList = xinzuoyeList.concat();
                getQingdanList($db, xinzuoyeList, 0);
                if ( existsNew(oldList, xinzuoyeList) ) {
                    // _callListeners( NEW_ZUOYE, XXX );
                    alert('有新布置的作业');
                }
                next();
            };

            var notifyPigai = function ($db, next) {
                var oldList = daiyuedupigaiList.concat();
                getQingdanList($db, daiyuedupigaiList, 3);
                if ( existsNew(oldList, daiyuedupigaiList) ) {
                    // _callListeners( NEW_ZUOYEPIGAI, XXX );
                    alert('有新的作业批改！');
                }
                next();
            };

            var notifyZuoyeAndPigai = function($db, next) {
                notifyZuoye($db, function() {
                    notifyPigai($db, next);
                });
            };

            var doCheck = function()
            {
                var date = new Date();
                //console.log("check tongzhi start: id " + $db.userId + " time: " +
                //    date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "." + date.getMilliseconds());
                $http({
                    method: "GET",
                    url: $rootScope.serverAddress + "/users/" + $db.userId + "?fields=zuoye,pigai",
                    timeout: $rootScope.timeoutShort
                }).then(
                    function (res) {
                        if ( !typeCheck(res.data, Object) ) {
                            console.log('data type error: expected data type: Object, please check data: ' + JSON.stringify(res.data));
                            _callListeners( ERR, err );
                            return setDelayCheck();
                        }
                        var tongzhi = res.data;
                        var zuoye = $db.user.zuoye;
                        var pigai = $db.user.pigai;

                        console.log('tongzhi NUMBER: ' + tongzhi.zuoye + ' ' + tongzhi.pigai + ' VS ' + zuoye + ' ' + pigai);
                        console.log('pullList length: ' + $db.pullList.length);
                        if ($db.todolist)
                            console.log('todoList length: ' + $db.todolist.length);
                        if ( tongzhi.zuoye > zuoye ) {
                            $db.pullList.push(getServerTime);
                            $db.pullList.push(DBPullQingdans);
                            if ( tongzhi.pigai > pigai ) {
                                $db.pullList.push(DBPullDatijilusForPigai);
                                pushWithCb(DBGroupData, notifyZuoyeAndPigai);
                            } else
                                pushWithCb(DBGroupData, notifyZuoye);
                            $db.pullList.push(DBPullTimus);
                        } else if ( tongzhi.pigai > pigai ) {
                            $db.pullList.push(getServerTime);
                            $db.pullList.push(DBPullDatijilusForPigai);
                            pushWithCb(DBGroupData, notifyPigai);
                        } else { //check if exists qingdan whose flag change from 5 to 0;
                            DBGroupData($db, $http, $rootScope, $timeout, function() {
                                notifyZuoye($db, function(){});
                            }, function(){});
                        }

                        if ( tongzhi.zuoye > zuoye || tongzhi.pigai > pigai ) {
                            $db.user.zuoye = tongzhi.zuoye;
                            $db.user.pigai = tongzhi.pigai;
                            $db.executeSql('UPDATE user SET zuoye = ?, pigai = ? WHERE id = ?', [tongzhi.zuoye, tongzhi.pigai, $db.userId]);
                        }
                        setDelayCheck();
                    },
                    function (err) {
                        console.log("check Tongzhis http error " + JSON.stringify(err));
                        _callListeners( ERR, err );
                        setDelayCheck();
                    }

                )
            }

            getServerAdressCounter ++;
            if(getServerAdressCounter > 45) //250s
            {
                getServerAdress($http, $rootScope, function() {
                    getServerAdressCounter = 0;
                    if ($rootScope.debug) {
                        $rootScope.serverAddress = debugServerAddress;
                    }
                    doCheck();
                });
            }
            else
                doCheck();
        }
    }
})();