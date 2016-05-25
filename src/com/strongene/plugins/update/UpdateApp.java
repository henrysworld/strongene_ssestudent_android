package com.strongene.plugins.update;

import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Environment;

import com.strongene.plugins.IStrongenePlugin;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;


/**
 * Created by sj on 2016/4/26.
 */
public class UpdateApp implements IStrongenePlugin {
    @Override
    public void execute(JSONArray args, CordovaPlugin plugin, CallbackContext callbackContext) {
        Activity context = plugin.cordova.getActivity();
        JSONObject jsonObject = getJsonResult(context);

        if (jsonObject == null){
            callbackContext.error("parser error");
            return;
        }
        String url = "http://101.200.123.36:8800/gengxin";
        String client_type = "0";
        String version_code = jsonObject.optString("version_code");
//        String apk_code = getApkCode(context);
        String apk_code = "0.0.2";
//        String source_code = jsonObject.optString("source_code");
        String source_code = "1";
        UpdateUtils.requestUpdate(context, url, client_type, version_code, apk_code, source_code);
    }


    /**
     * 获取关于版本信息的json内容
     * by:chenhe at:2016年5月5日17:15:57
     *
     * @param context
     * @return
     */
    private JSONObject getJsonResult(Context context){
        JSONObject jsonObject = null;
        String sdCardPath = Environment.getExternalStorageDirectory().getAbsolutePath();
        String filePath = sdCardPath + File.separator + "strongene" + File.separator + "version.json";
        if (!FileUtils.fileIsExists(filePath)){
            jsonObject = FileUtils.readFileToAssets(context, "version.json");
        } else {
            jsonObject = FileUtils.readFileToSdcard(filePath);
        }
        return jsonObject;
    }

    /**
     * 获取当前应用的版本号
     * by:chenhe at:2016年5月5日14:47:53
     *
     * @return
     */
    private String getApkCode(Context context){
        try {
            PackageManager manager = context.getPackageManager();
            PackageInfo info = manager.getPackageInfo(context.getPackageName(), 0);
//            String version = String.valueOf(info.versionCode);
            String version = info.versionName;
            return version;
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
        return null;
    }



}
