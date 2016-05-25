package com.strongene.plugins.update;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Created by chenhe on 2016/4/14.
 */
public class SharedPreferencesUtils {
    private static final String PREFS_NAME = "strongene_prefs";

    public static void setBooleanValue(Context context, String prefKey, boolean prefValue){
        SharedPreferences sp = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sp.edit();
        editor.putBoolean(prefKey, prefValue);

        editor.commit();
    }

    public static boolean getBooleanValue(Context context, String prefKey, boolean defValue){
        SharedPreferences sp = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean prefValue = sp.getBoolean(prefKey, defValue);

        return prefValue;
    }

    public static void setStringValue(Context context, String prefKey, String prefValue){
        SharedPreferences sp = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sp.edit();
        editor.putString(prefKey, prefValue);

        editor.commit();
    }

    public static String getStringValue(Context context, String prefKey, String defValue){
        SharedPreferences sp = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String prefValue = sp.getString(prefKey, defValue);

        return prefValue;
    }
}
