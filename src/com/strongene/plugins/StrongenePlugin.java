package com.strongene.plugins;

import android.content.Context;
import android.widget.Toast;

import com.strongene.plugins.update.FileUtils;
import com.strongene.plugins.update.UpdateApp;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import java.io.File;


/**
 * Created by sj on 2016/4/26.
 */
public class StrongenePlugin extends CordovaPlugin {
    private static final String STRONGENE_UPDATEAPP = "strongene_updateapp";
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        Context context = cordova.getActivity();
        if (action.isEmpty()){
            callbackContext.error("action error");
            return false;
        }
//        JSONObject jsonObject = args.getJSONObject(0);
        if (action.equals(STRONGENE_UPDATEAPP)){
            Toast.makeText(context, "开始执行更新任务", Toast.LENGTH_LONG).show();
//            FileUtils.delete(new File(context.getExternalFilesDir("strongene").getAbsolutePath()));
            new UpdateApp().execute(args, this, callbackContext);

        }
        return true;
    }
}
