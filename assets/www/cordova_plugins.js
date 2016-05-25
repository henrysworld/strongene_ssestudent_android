cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/com-strongene/www/StrongenePlugin.js",
        "id": "com-strongene.StrongenePlugin",
        "clobbers": [
            "StrongenePlugin"
        ]
    },
    {
        "file": "plugins/at.gofg.sportscomputer.powermanagement/www/powermanagement.js",
        "id": "at.gofg.sportscomputer.powermanagement.device",
        "clobbers": [
            "window.powerManagement"
        ]
    },
    {
        "file": "plugins/boogie-board-sync-sdk-cordova/www/syncSdkStreaming.js",
        "id": "boogie-board-sync-sdk-cordova.syncSdkStreaming",
        "clobbers": [
            "window.syncSdkStreaming"
        ]
    },
    {
        "file": "plugins/boogie-board-sync-sdk-cordova/www/syncSdkFileTransfer.js",
        "id": "boogie-board-sync-sdk-cordova.syncSdkFileTransfer",
        "clobbers": [
            "window.syncSdkFileTransfer"
        ]
    },
    {
        "file": "plugins/com-badrit-macaddress/www/MacAddress.js",
        "id": "com-badrit-macaddress.MacAddress",
        "clobbers": [
            "window.MacAddress"
        ]
    },
    {
        "file": "plugins/com-xjxxjx1017-activity-manager/www/ActivityManager.js",
        "id": "com-xjxxjx1017-activity-manager.ActivityManager",
        "clobbers": [
            "window.ActivityManager"
        ]
    },
    {
        "file": "plugins/com-xjxxjx1017-alarm-manager/www/AlarmManager.js",
        "id": "com-xjxxjx1017-alarm-manager.AlarmManager",
        "clobbers": [
            "window.AlarmManager"
        ]
    },
    {
        "file": "plugins/com.napolitano.cordova.plugin.intent/www/android/IntentPlugin.js",
        "id": "com.napolitano.cordova.plugin.intent.IntentPlugin",
        "clobbers": [
            "IntentPlugin"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/DirectoryEntry.js",
        "id": "org.apache.cordova.file.DirectoryEntry",
        "clobbers": [
            "window.DirectoryEntry"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/DirectoryReader.js",
        "id": "org.apache.cordova.file.DirectoryReader",
        "clobbers": [
            "window.DirectoryReader"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/Entry.js",
        "id": "org.apache.cordova.file.Entry",
        "clobbers": [
            "window.Entry"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/File.js",
        "id": "org.apache.cordova.file.File",
        "clobbers": [
            "window.File"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/FileEntry.js",
        "id": "org.apache.cordova.file.FileEntry",
        "clobbers": [
            "window.FileEntry"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/FileError.js",
        "id": "org.apache.cordova.file.FileError",
        "clobbers": [
            "window.FileError"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/FileReader.js",
        "id": "org.apache.cordova.file.FileReader",
        "clobbers": [
            "window.FileReader"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/FileSystem.js",
        "id": "org.apache.cordova.file.FileSystem",
        "clobbers": [
            "window.FileSystem"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/FileUploadOptions.js",
        "id": "org.apache.cordova.file.FileUploadOptions",
        "clobbers": [
            "window.FileUploadOptions"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/FileUploadResult.js",
        "id": "org.apache.cordova.file.FileUploadResult",
        "clobbers": [
            "window.FileUploadResult"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/FileWriter.js",
        "id": "org.apache.cordova.file.FileWriter",
        "clobbers": [
            "window.FileWriter"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/Flags.js",
        "id": "org.apache.cordova.file.Flags",
        "clobbers": [
            "window.Flags"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/LocalFileSystem.js",
        "id": "org.apache.cordova.file.LocalFileSystem",
        "clobbers": [
            "window.LocalFileSystem"
        ],
        "merges": [
            "window"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/Metadata.js",
        "id": "org.apache.cordova.file.Metadata",
        "clobbers": [
            "window.Metadata"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/ProgressEvent.js",
        "id": "org.apache.cordova.file.ProgressEvent",
        "clobbers": [
            "window.ProgressEvent"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/requestFileSystem.js",
        "id": "org.apache.cordova.file.requestFileSystem",
        "clobbers": [
            "window.requestFileSystem"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.file/www/resolveLocalFileSystemURI.js",
        "id": "org.apache.cordova.file.resolveLocalFileSystemURI",
        "clobbers": [
            "window.resolveLocalFileSystemURI"
        ]
    },
    {
        "file": "plugins/com.synconset.cordovaHTTP/www/cordovaHTTP.js",
        "id": "com.synconset.cordovaHTTP.CordovaHttpPlugin",
        "clobbers": [
            "plugins.CordovaHttpPlugin"
        ]
    },
    {
        "file": "plugins/com.uniclau.alarmplugin/www/alarmplugin.js",
        "id": "com.uniclau.alarmplugin.AlarmPlugin",
        "clobbers": [
            "window.alarm"
        ]
    },
    {
        "file": "plugins/cordova-plugin-applist2/www/Applist.js",
        "id": "cordova-plugin-applist2.Applist",
        "clobbers": [
            "window.Applist"
        ]
    },
    {
        "file": "plugins/cordova-plugin-blob-constructor-polyfill/Blob.js",
        "id": "cordova-plugin-blob-constructor-polyfill.blob-constructor",
        "merges": [
            "window"
        ]
    },
    {
        "file": "plugins/cordova-plugin-bluetooth-serial/www/bluetoothSerial.js",
        "id": "cordova-plugin-bluetooth-serial.bluetoothSerial",
        "clobbers": [
            "window.bluetoothSerial"
        ]
    },
    {
        "file": "plugins/cordova-plugin-device/www/device.js",
        "id": "cordova-plugin-device.device",
        "clobbers": [
            "device"
        ]
    },
    {
        "file": "plugins/cordova-plugin-dialogs/www/notification.js",
        "id": "cordova-plugin-dialogs.notification",
        "merges": [
            "navigator.notification"
        ]
    },
    {
        "file": "plugins/cordova-plugin-dialogs/www/android/notification.js",
        "id": "cordova-plugin-dialogs.notification_android",
        "merges": [
            "navigator.notification"
        ]
    },
    {
        "file": "plugins/cordova-plugin-whitelist/whitelist.js",
        "id": "cordova-plugin-whitelist.whitelist",
        "runs": true
    },
    {
        "file": "plugins/cordova-sqlite-storage/www/SQLitePlugin.js",
        "id": "cordova-sqlite-storage.SQLitePlugin",
        "clobbers": [
            "SQLitePlugin"
        ]
    },
    {
        "file": "plugins/plugin.http.request/www/http-request.js",
        "id": "plugin.http.request.phonegap-http-requst",
        "clobbers": [
            "cordova.plugins.http-request"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "at.gofg.sportscomputer.powermanagement": "1.1.2",
    "boogie-board-sync-sdk-cordova": "0.4.6",
    "com-badrit-macaddress": "0.2.0",
    "com-xjxxjx1017-activity-manager": "0.2.0",
    "com-xjxxjx1017-alarm-manager": "0.2.0",
    "com.napolitano.cordova.plugin.intent": "0.1.3",
    "org.apache.cordova.file": "0.2.5",
    "com.synconset.cordovaHTTP": "0.1.4",
    "com.uniclau.alarmplugin": "0.1.0",
    "cordova-plugin-applist2": "0.1.4",
    "cordova-plugin-blob-constructor-polyfill": "1.0.3-dev",
    "cordova-plugin-bluetooth-serial": "0.4.5",
    "cordova-plugin-device": "1.1.1",
    "cordova-plugin-dialogs": "1.2.0",
    "cordova-plugin-whitelist": "1.2.0",
    "cordova-sqlite-storage": "0.7.14",
    "plugin.http.request": "1.0.4"
};
// BOTTOM OF METADATA
});