package com.strongene.plugins.update;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.util.Log;
import android.widget.Toast;

import com.strongene.studyapp.MainActivity;
import com.zhy.http.okhttp.OkHttpUtils;
import com.zhy.http.okhttp.callback.FileCallBack;
import com.zhy.http.okhttp.callback.StringCallback;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.File;
import java.io.InputStreamReader;

import okhttp3.Call;

/**
 * Created by chenhe on 2016/4/13.
 */
public class UpdateUtils {

    public static final String TAG = UpdateUtils.class.getSimpleName();

    /**
     * 更新请求
     * by：chenhe at：2016-4-11 15:35:04
     */
    public static void requestUpdate(final Context context, String url, String client_type, final String version_code, final String apk_code, String source_code) {
        OkHttpUtils
                .get()
                .url(url)
                .addParams("clienttype", client_type)
                .addParams("versioncode", version_code)
                .addParams("apkcode", apk_code)
                .addParams("sourcecode", source_code)
                .build()
                .execute(new StringCallback() {
                    @Override
                    public void onError(Call call, Exception e) {
                        Log.e(TAG, "onError");
                    }

                    @Override
                    public void onResponse(String response) {
                        try {
                            Log.d(TAG, "onResponse:" + response);
                            JSONObject jsonObject = new JSONObject(response);
                            int updatetype = jsonObject.optInt("updatetype");
                            switch (updatetype) {
                                case 0:
                                    //不更新

                                    break;
                                case 1:
                                    //APK更新
                                    Toast.makeText(context, "APK更新", Toast.LENGTH_LONG).show();
                                    updateAPK(context, jsonObject, updatetype);
                                    break;
                                case 2:
                                    //资源更新
                                    Toast.makeText(context, "资源更新", Toast.LENGTH_LONG).show();
                                    String url_source = jsonObject.optString("url");
                                    String path = context.getExternalFilesDir("strongene").getAbsolutePath();

                                    downLoadFile(context, url_source, path, "www.zip", updatetype);
                                    break;
                            }
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    }
                });
    }

    /**
     * apk更新
     * by:chenhe at:2016年5月20日14:52:34
     *
     * @param context
     * @param jsonObject
     */
    public static void updateAPK(Context context, JSONObject jsonObject, int updatetype) {
        String url_apk = jsonObject.optString("url");
        String sdCardPath = Environment.getExternalStorageDirectory().getAbsolutePath();
        FileUtils.createDir(sdCardPath, "strongene");

        String[] srts = url_apk.split("/");
        String temp_name = srts[srts.length - 1];

        FileUtils.delete(new File(sdCardPath + File.separator + "strongene"));
        downLoadFile(context, url_apk, Environment.getExternalStorageDirectory().getAbsolutePath() + File.separator + "strongene", temp_name, updatetype);
    }

    /**
     * 下载文件
     * by:chenhe at:2016年5月9日10:53:53
     *
     * @param url          资源地址
     * @param destFileDir  目标文件夹
     * @param destFileName 目标文件名
     * @param updatetype   1:APK    2:资源文件
     */
    public static void downLoadFile(final Context context, final String url, final String destFileDir, final String destFileName, final int updatetype) {
        OkHttpUtils
                .get()
                .url(url)
                .build()
                .execute(new FileCallBack(destFileDir, destFileName) {
                    @Override
                    public void inProgress(float progress, long total) {
//                        Log.d(TAG, "progress:" + progress + "total:" + total);
//                        String result = textView.getText().toString();
                    }

                    @Override
                    public void onError(Call call, Exception e) {
                        Toast.makeText(context, "下载更新失败", Toast.LENGTH_LONG).show();
                        if (updatetype == 2){
                            FileUtils.deleteOneFile(context.getExternalFilesDir("strongene").getAbsolutePath() + File.separator + "www.zip");
                            downLoadFile(context, url, destFileDir, destFileName, updatetype);
                        }
                        Log.d(TAG, "onError:");
                    }

                    @Override
                    public void onResponse(File response) {
                        Toast.makeText(context, "下载完成", Toast.LENGTH_LONG).show();
                        Log.d(TAG, "onResponse:" + response.getAbsolutePath());
                        switch (updatetype) {
                            case 1:
                                //安装apk
                                FileUtils.delete(new File(context.getExternalFilesDir("strongene").getAbsolutePath()));
                                silentInstallationAPK(response);
                                break;
                            case 2:
                                //资源操作
//                                wwwSourceOpertaing(context);
                                new MyThread(context).run();
                                break;
                        }
                    }
                });
    }

    /**
     * 异步线程处理解压资源的操作
     */
   static class MyThread implements Runnable{
        private Context context;
        public MyThread(Context context){
            this.context = context;
        }

        @Override
        public void run() {
//            FileUtils.delete(new File(context.getExternalFilesDir("strongene").getAbsolutePath() + File.separator + "www"));
            wwwSourceOpertaing(context);
        }
    }


    /**
     * 处理下载完成的资源包
     * by:chenhe at:2016年5月20日15:03:03
     *
     * @param context
     */
    public static void wwwSourceOpertaing(Context context) {
        /*外部存储路径下的strongene的路径*/
        String strongeneExternalFilesDirPath = context.getExternalFilesDir("strongene").getAbsolutePath();
        /*www.zip文件的路径*/
        String zipFilePath = strongeneExternalFilesDirPath + File.separator + "www.zip";
        /*www文件夹的路径*/
        String wwwFilePath = strongeneExternalFilesDirPath + File.separator + "www";
        /*判断是否存在www文件夹*/
        boolean isExistWWW = !FileUtils.fileIsExists(strongeneExternalFilesDirPath + File.separator + "www");
        //是否解压完成
        boolean isfinish = ZipUtils.unZip(zipFilePath, strongeneExternalFilesDirPath);
        if (isfinish) {
            FileUtils.deleteOneFile(zipFilePath);
        }
        //如果不存在www文件夹，则重新loadUrl，改变加载资源的路径为/sdcard/Android/data/packageName/strongene/www
        String indexPath = wwwFilePath + File.separator + "scripts/index.html";
//                                String indexPath = wwwFilePath + File.separator + "index.html";
        if (isExistWWW) {
            ((MainActivity) context).loadUrl(indexPath);
        }
    }

    /**
     * 静默安装apk
     * by:chenhe at:2016年5月9日11:00:21
     *
     * @param file
     */
    public static void silentInstallationAPK(File file) {
//        List<String> revertList = new ArrayList<String>();
//        revertList.add("chmod 666 /data/ssestudent.apk");
////        revertList.add("chmod 666 /storage/emulated/0/Android/data/io.cordova.hellocordova/files/ssestudent.apk");
//        revertList.add("adb shell pm install /data/ssestudent.apk");
//        ShellUtils.execCommand(revertList, false);
//        runRootCommand("pm install -r /data/ssestudent.apk");
//        runRootCommand("pm install -r /storage/emulated/0/android-debug.apk");
//        runRootCommand("bak install -r /data/ssestudent.apk");
//        runRootCommand("pm install -r /storage/emulated/0/ssestudent.apk");
//        runRootCommand("bak install -r /storage/emulated/0/ssestudent.apk");
        runRootCommand("bak install -r " + file.getAbsolutePath());
    }


    /**
     * 正常安装apk
     * by:chenhe at:2016年5月20日15:06:04
     *
     * @param context
     * @param filePath
     * @return
     */
    public static boolean installNormal(Context context, String filePath) {
        Intent i = new Intent(Intent.ACTION_VIEW);
        File file = new File(filePath);
        if (file == null || !file.exists() || !file.isFile() || file.length() <= 0) {
            return false;
        }

        i.setDataAndType(Uri.parse("file://" + filePath), "application/vnd.android.package-archive");
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(i);
        return true;
    }


    /**
     * 请求ROOT权限后执行命令（最好开启一个线程）
     * by:chenhe at:2016年5月20日15:06:20
     *
     * @param cmd (pm install -r *.apk)
     * @return
     */
    public static boolean runRootCommand(String cmd) {
        Process process = null;
        DataOutputStream os = null;
        BufferedReader br = null;
        StringBuilder sb = null;
        try {
            process = Runtime.getRuntime().exec("su");
            os = new DataOutputStream(process.getOutputStream());
            os.writeBytes(cmd + "\n");
            os.writeBytes("exit\n");
            br = new BufferedReader(new InputStreamReader(process.getInputStream()));

            sb = new StringBuilder();
            String temp = null;
            while ((temp = br.readLine()) != null) {
                sb.append(temp + "\n");
                if ("Success".equalsIgnoreCase(temp)) {
//                    Log.e("----------"+sb.toString());
                    return true;
                }
            }
            process.waitFor();
        } catch (Exception e) {
//            Log.e("异常："+e.getMessage());
        } finally {
            try {
                if (os != null) {
                    os.flush();
                    os.close();
                }
                if (br != null) {
                    br.close();
                }
                process.destroy();

            } catch (Exception e) {
                return false;
            }
        }
        return false;
    }
}
