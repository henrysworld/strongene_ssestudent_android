cordova.define("com-xjxxjx1017-alarm-manager.AlarmManager", function(require, exports, module) {
/*
 * MacAddress
 * Implements the javascript access to the cordova plugin for retrieving the device mac address. Returns 0 if not running on Android
 * @author Olivier Brand
 */

/**
 * @return the mac address class instance
 */
 var ActivityManager = {

	getActivityList: function(successCallback, failureCallback){
 		cordova.exec(successCallback, failureCallback, 'ActivityManagerPlugin',
 			'getActivityList', []);
 	}
 };

 module.exports = ActivityManager;
});
