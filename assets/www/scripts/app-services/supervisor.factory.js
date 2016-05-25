/**
 * Created by xjxxj on 3/17/2016.
 */

( function() {

    angular.module( "Supervisor", ['LocalStorageModule']).factory( "supervisor", Supervisor );
    Supervisor.$inject = ['$timeout', '$http', 'localStorageService', '$rootScope', '$filter'];
    function Supervisor( $timeout, $http, localStorageService, $rootScope, $filter ) {

        var ALERT = false;
        var DEBUG = false;
        var CLEAR_CATCHE_ON_START = false;
        var TABLE1_LIMIT = 10000;
        var CHECK_INTERVAL = 30 * 1000;
        var CHECK_RUNNING_APP_INTERVAL = 2 * 60 * 1000;
        var UPLOAD_INTERVAL = 2 * 60 * 1000;
        var currentTableId = 0;
        var SUPERVISOR_SIZE_OF_CURRENT_LIST = "SUPERVISOR_SIZE_OF_CURRENT_LIST";
        var SUPERVISOR_WHITE_LIST_INSTALL = "SUPERVISOR_WHITE_LIST_INSTALL";
        var SUPERVISOR_WHITE_LIST_RUNNING = "SUPERVISOR_WHITE_LIST_RUNNING";
        var SUPERVISOR_TABLE_0 = "SUPERVISOR_TABLE_0";
        var SUPERVISOR_TABLE_1 = "SUPERVISOR_TABLE_1";
        var SUPERVISOR_TABLE_1_LAST_CHECK_DATE = "SUPERVISOR_TABLE_1_LAST_CHECK_DATE";
        var mac = null;
        var whiteListInstall = ['QQi', 'fakeAppXXXXXXXX',
            '爱奇艺视频HD', '台电游戏中心', 'Game Center',
            'Explorer','App Search',
            'Maps','TeclastBootManager',
            'Google Pinyin Input'
        ];
        var whiteListRunning = ['com.xxxx.fakeapp', 'com.strongene.studyapp'];
        var oldRunningAppLists = [];

        return {
            initial: initial,
            sendMac: sendMac
        };

        function getLocalStorage( tag ) {
            return localStorageService.get( tag );
        }

        function saveLocalStorage( tag, item ) {
            return localStorageService.set( tag, item );
        }

        function _fail(e) {
            console.log("FileSystem Error");
        }

        function _writeToLog(logStr) {
            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(dir) {
                dir.getFile("log.txt", {create:true}, function(file) {
                    var logOb = file;
                    var str = logStr;
                    if(!logOb) return;
                    var time = $filter('date')((new Date()), "yyyy-MM-dd HH:mm:ss");
                    var log = str + " [" + time + "]\n";
                    logOb.createWriter(function(fileWriter) {
                        fileWriter.seek(fileWriter.length);
                        var blob = new Blob([log], {type:'text/plain'});
                        fileWriter.write(blob);
                    }, _fail);
                });
            });
        }

        function _checkRunningApps() {
            // * Get running app list, package name
            window.ActivityManager.getActivityList(
                function( listObj ) {
                    console.log("begin check running apps------");

                    var runningAppList = listObj.list;
                    var otherAppList = [];
                    runningAppList.forEach(function (name) {
                        otherAppList.push(name);
                    });
                    //app not in white app list was runned
                    if (otherAppList.length != 0) {
                        //otherAppList not same with oldRunningAppLists
                        if (angular.equals(otherAppList, oldRunningAppLists) == false) {
                            var logStr = "";
                            otherAppList.forEach(function(name){
                                logStr += name + "\n";
                            });
                            _writeToLog(logStr);
                            console.log(logStr);
                            if (ALERT)
                                alert(logStr);
                            oldRunningAppLists = otherAppList;
                        }

                    }
                },
                function( failed ) {
                    console.log("checkRunningApps failed.");
                }
            );
        }

        function beginCheckRunningApps() {
            $timeout(beginCheckRunningApps, CHECK_RUNNING_APP_INTERVAL);
            _checkRunningApps();
        }


        function sendMac() {
            if ( device.platform != "browser" ) {
                // * Get mac adress
                window.MacAddress.getMacAddress(
                    function( macAddress ) {
                        // console.log( "supervisor.factory - sendMac - " + $rootScope.serverAddress + "/users/" + $rootScope.db.user.id );
                        var tmpS = macAddress.split(":").join('');
                        console.log( "supervisor.factory - sendMac - " + macAddress + " - " + tmpS );
                        var macInt = parseInt(tmpS, 16 );
                        console.log( "supervisor.factory - sendMac - " + macAddress + " - " + macInt );
                        // * Send macAddress to the server
                        $http({
                            method: 'PUT',
                            url: $rootScope.serverAddress + "/users/"+$rootScope.db.user.id,
                            data:{
                                mac: macInt
                            },
                            timeout: $rootScope.timeoutShort
                        }).then(
                            function (response) { console.log( response ); },
                            function (error){ console.log( error ); });
                    },
                    function( failed ) { alert( failed ); }
                );
            }
        }

        function clearLocalStorage() {
            localStorageService.set( SUPERVISOR_TABLE_0, null );
            localStorageService.set( SUPERVISOR_TABLE_1, null );
        }

        function initial() {
            if ( device.platform == "browser" )
                return;
            if ( CLEAR_CATCHE_ON_START )
                clearLocalStorage();
            // * Don't delete this
            /*
            window.MacAddress.getMacAddress(
                function( macAddress ) {
                    if ( DEBUG )
                        console.log( macAddress );
                    mac = macAddress;
                    // * Start checking, run until app closed
                    superviseCheck();
                },
                function( failed ) {
                    alert("supervisor.factory.js - Applist.createEvent - " + failed);
                }
            );
            */
            beginCheckRunningApps();
        }

        function getDifference( whiteList, curList ) {
            var difference = "";
            var sList = "";
            var listNotInWhite = [];
            var listWhiteNotExist = [];

            // * Check whether any app is not wanted
            curList.forEach( function( name ) {
                if ( whiteList.indexOf(name) == -1 ) {
                    // * Not in white list
                    listNotInWhite.push(name);
                }
            });
            // * Check whether any app is missing
            whiteList.forEach( function(name) {
                if ( curList.indexOf(name) == -1 ) {
                    // * The item in white list not exist
                    listWhiteNotExist.push(name);
                }
            });
            // * Get the text of difference
            listWhiteNotExist.forEach( function (s) {
                difference += "- " + s + "\n";
            });
            listNotInWhite.forEach( function (s) {
                difference += "+ " + s + "\n";
            });

            // * Debugging output
            sList += "Total app cunt: " + whiteList.length + "\n";
            sList += "Lack app cunt: " + listWhiteNotExist.length + "\n";
            sList += "Extra app cunt: " + listNotInWhite.length + "\n";
            sList += difference;
            if ( ALERT )
                alert( sList );
            if ( DEBUG )
                console.log( sList );

            return difference;
        }

        function superviseCheck() {
            if ( device.platform == "browser" )
                return null;
            _superviseCheck();
        }

        function _superviseCheck() {
            $timeout( _superviseCheck, CHECK_INTERVAL );
            superviseCheckStep1();
        }

        function superviseCheckStep1() {
            // * Get installed app list
            Applist.createEvent('', '', '', '', '',
                function(app_list) {
                    var app_list_name = [];
                    // * Get name of all the app installed
                    app_list.forEach( function( i ) {
                        app_list_name.push(i.name);
                    });
                    superviseCheckStep2( app_list_name );
                },
                function(app_list) {
                    alert("supervisor.factory.js - Applist.createEvent - " + app_list);
                } );
        }

        function superviseCheckStep2( app_list_name ) {
            // * Get running app list, package name
            window.ActivityManager.getActivityList(
                function( listObj ) {
                    if( ALERT )
                        alert( listObj.list.length );
                    if ( DEBUG )
                        console.log( listObj.list.length );
                    onSuperviseCheckSuccess( app_list_name, listObj.list );
                },
                function( failed ) {
                    alert( failed );
                }
            );
        }

        function onSuperviseCheckSuccess( app_list_name, running_list_packagename ) {
            var difference = "";
            var differenceSeparator = "----\n";

            // * Load table0 in local storage
            var rList = [];
            var tmp = null;// localStorageService.get( SUPERVISOR_TABLE_0 );
            if ( tmp ) {
                rList = JSON.parse( tmp );
                if ( ALERT )
                    alert( "_superviseCheck - Load list: " + rList.length );
            }

            difference += getDifference( whiteListInstall, app_list_name );
            difference += differenceSeparator;
            difference += getDifference( whiteListRunning, running_list_packagename );

            // * Server output
            if ( difference != null && difference != "" && difference != differenceSeparator ) {
                // * Send to the server
                rList.push( {
                    mac: mac,
                    date: (new Date()).toString(),
                    diff: difference
                } );
                // * Save to local storage
                var rString = "";
                rString = JSON.stringify(rList);
                localStorageService.set( SUPERVISOR_TABLE_0, rString );
                if ( ALERT )
                    alert( rString );
            }
        }

        function superviseUpload() {
            if ( device.platform == "browser" )
                return null;
            _superviseUpload();
        }

        function _superviseUpload() {
            $timeout(_superviseUpload, UPLOAD_INTERVAL);

            var tmp = localStorageService.get( SUPERVISOR_TABLE_0 );
            var rList = [];
            if ( tmp ) {
                rList = JSON.parse( tmp );
                if ( ALERT )
                    alert( "_superviseUpload - Load list: " + rList.length );
            }

            if ( rList != null && rList.length > 0 ) {
                rList.forEach( function(i) {
                    $http( { method:"PUT" }).then(
                        // * TODO: not fully uploaded problem, err handling
                        // * TODO: should save list to TABLE_1, multiple problems ( timing, format, synchronization )
                        function() { localStorageService.set( SUPERVISOR_TABLE_0, null ); },
                        function( err ) { console.log( "Update supervised data failed: " + err ); }
                    );
                });
            }
        }
    }
})();