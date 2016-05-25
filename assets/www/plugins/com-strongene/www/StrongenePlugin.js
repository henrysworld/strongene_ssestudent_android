cordova.define("com-strongene.StrongenePlugin", function(require, exports, module) {
 var StrongenePlugin = {

 		updateApp: function(successCallback, failureCallback){
     		cordova.exec(successCallback, failureCallback, 'StrongenePlugin',
     			'strongene_updateapp', []);
     	}
 };

 module.exports = StrongenePlugin;
});
