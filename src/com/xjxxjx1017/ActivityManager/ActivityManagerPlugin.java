package com.xjxxjx1017.ActivityManager;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.app.ActivityManager;
import android.app.usage.*;
import android.app.AppOpsManager;
import android.util.Log;
import java.util.*;
import android.content.Intent;

/**
 * The Class ActivityManagerPlugin.
 */
public class ActivityManagerPlugin extends CordovaPlugin {

    Boolean DEBUG = true;
    private static final String TAG = "ActivityManagerPlugin";
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

            ArrayList<String> activityList = this.getRunningApp();//this.getActivityList();

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


    private ArrayList<String> getRunningApp() {
        if (android.os.Build.VERSION.SDK_INT >= 21) {
            ArrayList<String> list = new ArrayList<String>();
        	AppOpsManager appOps = (AppOpsManager) this.cordova.getActivity().getApplicationContext()
                                    .getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow("android:get_usage_stats",
                                    android.os.Process.myUid(), this.cordova.getActivity().getApplicationContext().getPackageName());
            boolean granted = mode == AppOpsManager.MODE_ALLOWED;
            if (granted == false) {
                Log.d(TAG, "not granted PACKAGE_USAGE_STATS permission");
            } else {
                UsageStatsManager usm = (UsageStatsManager)this.cordova.getActivity().getApplicationContext().getSystemService(Context.USAGE_STATS_SERVICE);
                long time = System.currentTimeMillis();
                long beginTime = time - 2 * 60 * 1000;//TODO: use param passed from supervisor.factory.js to set this time.
                List<UsageStats> appList = usm.queryUsageStats(UsageStatsManager.INTERVAL_BEST, beginTime, time);
                if (appList == null) {
                    Log.d(TAG, "appList == null");
                } else if (appList.size() == 0) {
                    Log.d(TAG, "appList.size() == 0");
                } else {
                    //sort by lastUsedTime.
                    ArrayList<UsageStats> filteredList = new ArrayList<UsageStats>();
                    for (UsageStats usageStats : appList) {
                        if (usageStats.getPackageName().indexOf("com.android.systemui") == -1)
                            filteredList.add(usageStats);
                    }
                    Collections.sort(filteredList, new Comparator<UsageStats>(){
                                public int compare(UsageStats p1, UsageStats p2) {
                                    if (p1.getLastTimeUsed() > p2.getLastTimeUsed())
                                        return -1;
                                    else if (p1.getLastTimeUsed() < p2.getLastTimeUsed())
                                        return 1;
                                    else return 0;
                                }
                            });
                    for (UsageStats usageStats : filteredList) {
                        list.add(usageStats.getPackageName());
                    }
                }
            }
            return list;
        } else {
            return getActivityList();
        }
    }

}
