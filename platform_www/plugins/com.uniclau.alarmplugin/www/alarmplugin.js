cordova.define("com.uniclau.alarmplugin.AlarmPlugin", function(require, exports, module) {
var alarm = {
    set: function(alarmDate, successCallback, errorCallback) {
        if(alarmDate < new Date()) {
            console.log( "The date is smaller than current date" );
            return;
        }
    	
        cordova.exec(
            successCallback,
            errorCallback,
            "AlarmPlugin",
            "programAlarm",
            [alarmDate]
        );
    }
};
module.exports = alarm;

});
