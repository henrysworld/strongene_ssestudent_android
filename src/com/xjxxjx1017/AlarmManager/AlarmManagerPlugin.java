package com.xjxxjx1017.AlarmManager;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.app.ActivityManager;
import android.util.Log;
import java.util.*;

/**
 * The Class ActivityManagerPlugin.
 */
public class AlarmManagerPlugin extends CordovaPlugin {

    Boolean DEBUG = false;
    private static final String TAG = "AlarmManagerPlugin";
    /*
     * (non-Javadoc)
     * 
     * @see org.apache.cordova.api.Plugin#execute(java.lang.String,
     * org.json.JSONArray, java.lang.String)
     */
    @Override
    public boolean execute(String action, JSONArray args,
            CallbackContext callbackContext) {
        if ( DEBUG )
            Log.d(TAG, "execute-action: " + action);

        if (action.equals("getActivityList")) {

            ArrayList<String> activityList = this.getActivityList();

            if ( activityList != null ) {
                JSONObject result = new JSONObject();
                try {
                    JSONArray list = new JSONArray();

                    for( String s: activityList ){
                        list.put(s);
                    }

                    result.put("list", list);

                    PluginResult r = new PluginResult(PluginResult.Status.OK, result);
                    // callbackContext.success(result);
                    r.setKeepCallback(true);
                    callbackContext.sendPluginResult(r);
                    return true;
                } catch (JSONException jsonEx) {
                     PluginResult r = new PluginResult(
                             PluginResult.Status.JSON_EXCEPTION);
                     // callbackContext.error("error");
                     r.setKeepCallback(true);
                     callbackContext.sendPluginResult(r);
                     return true;
                }
            }
        }
        return false;
    }

    private ArrayList<String> getActivityList() {
        ArrayList<String> list = new ArrayList<String>();

        ActivityManager am = (ActivityManager) this.cordova.getActivity()
            .getApplicationContext().getSystemService(Context.ACTIVITY_SERVICE);
        List<ActivityManager.RunningAppProcessInfo> runningAppProcessInfo = am.getRunningAppProcesses();

        if ( runningAppProcessInfo == null )
            return list;

        for (int i = 0; i < runningAppProcessInfo.size(); i++) {
            String activityName = runningAppProcessInfo.get(i).processName;
            if ( activityName != null && activityName != "" ) {
                list.add( activityName );
                if ( DEBUG )
                    Log.d(TAG, "getActivityList: " + activityName);
            }
        }

        return list;
    }
}
