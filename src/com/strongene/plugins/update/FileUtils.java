package com.strongene.plugins.update;

import android.content.Context;
import android.os.Environment;
import android.util.Log;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;

/**
 * Created by sj on 2016/5/5.
 */
public class FileUtils {

    public static final String TAG = FileUtils.class.getSimpleName();

    /**
     * 判断文件是否存在
     * by:chenhe at:2016年4月28日20:04:33
     *
     * @param filePath
     * @return
     */
    public static boolean fileIsExists(String filePath){
        File file = new File(filePath);
        if (!file.exists()){
            return false;
        }
        return true;
    }

    /**
     * 从assets中读取文件
     * by:chenhe 2016年5月5日16:58:58
     *
     * @param context
     * @param name
     * @return
     */
    public static JSONObject readFileToAssets(Context context, String name){
        JSONObject jsonObject = null;
        try {
            StringBuilder stringBuilder = new StringBuilder();
            BufferedReader bf = new BufferedReader(new InputStreamReader(context.getAssets().open(name)));
            String line;
            while ((line = bf.readLine()) != null){
                stringBuilder.append(line);
            }
            bf.close();
            jsonObject = new JSONObject(stringBuilder.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return jsonObject;
    }

    /**
     * 从sdcard读取文件
     * by:chenhe at:2016年5月5日17:09:32
     *
     * @param path
     * @return
     */
    public static JSONObject readFileToSdcard(String path){
        JSONObject jsonObject = null;
        try {
            StringBuilder stringBuilder = new StringBuilder();
            BufferedReader bf = new BufferedReader(new InputStreamReader(new FileInputStream(path)));
            String line;
            while ((line = bf.readLine()) != null){
                stringBuilder.append(line);
            }
            bf.close();
            jsonObject = new JSONObject(stringBuilder.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return jsonObject;
    }

    /**
     * 创建一个文件夹
     * by:chenhe at:2016年5月18日09:58:37
     *
     * @param tempPath
     * @param name
     */
    public static void createDir(String tempPath, String name){
        if (Environment.MEDIA_MOUNTED.equals(Environment.getExternalStorageState())){
            //得到一个路径，内容是sdcard的文件夹路径和名字
            String path = tempPath + File.separator + name;
            File file = new File(path);
            if (!file.exists()){
                //若不存在，创建目录
                file.mkdirs();
            }
        } else {
            Log.e(TAG, "createfile_onError：" + Environment.getExternalStorageState());
            return;
        }
    }

    /**
     * 删除单个文件
     * by:chenhe at:2016年5月19日17:54:46
     *
     * @return
     */
    public static boolean deleteOneFile(String filePath){
        File file = new File(filePath);
        if (file.isFile() && file.exists()) {
            return file.delete();
        }
        return false;
    }


    /**
     * 递归删除文件及文件夹
     */
    public static void delete(File file) {
        if (file.isFile()) {
            file.delete();
            return;
        }

        if(file.isDirectory()){
            File[] childFiles = file.listFiles();
            if (childFiles == null || childFiles.length == 0) {
                file.delete();
                return;
            }

            for (int i = 0; i < childFiles.length; i++) {
                delete(childFiles[i]);
            }
            file.delete();
        }
    }
}
