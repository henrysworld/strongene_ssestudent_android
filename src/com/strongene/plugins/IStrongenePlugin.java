package com.strongene.plugins;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;

/**
 * Created by sj on 2016/4/26.
 */
public interface IStrongenePlugin {
    void execute(JSONArray args, CordovaPlugin plugin, CallbackContext callbackContext);
}
