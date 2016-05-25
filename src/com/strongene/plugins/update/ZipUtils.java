package com.strongene.plugins.update;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Created by chenhe on 2016/5/9.
 */
public class ZipUtils {


    /**
     * 解压zip
     * by:chenhe at：2016年5月19日17:24:09
     *
     * @param zipFileName
     * @param outputDirectory
     * @return
     */
    public static boolean unZip(String zipFileName, String outputDirectory) {
        try {
            if (!FileUtils.fileIsExists(zipFileName)) {
                return false;
            }
            return unZip(new FileInputStream(zipFileName), outputDirectory);
        }catch (IOException e){
            return false;
        }
    }


    /**
     * 解压zip
     * by:chenhe at:2016年5月9日11:43:38
     *
     * @param inputStream
     * @param extractionPath
     */
    public static boolean unZip(InputStream inputStream, String extractionPath){
        //通过inputStream获取ZipInputStream
        ZipInputStream zis = new ZipInputStream(inputStream);
        ZipEntry zipEntry = null;
        try {
            //循环遍历获取zipEntry
            while ((zipEntry = zis.getNextEntry()) != null){
                //判断zipEntry是不是目录
                if (!zipEntry.isDirectory()){
                    File file = new File(extractionPath + File.separator + zipEntry.getName());
                    //下面两段代码的含义是如果想创建路径为a/b/c.txt的文件，那么在创建c.txt之前需要先创建a/b两个文件夹
                    file.getParentFile().mkdirs();
                    //创建c.txt文件
                    file.createNewFile();
                    FileOutputStream fos = new FileOutputStream(file);
                    byte[] buffer = new byte[1024];
                    int count = 0;
                    while ((count = zis.read(buffer)) != -1){
                        fos.write(buffer, 0 , count);
                        //保证缓存清空并且强制输出
                        fos.flush();
                    }

                    fos.close();
                }
            }

            zis.close();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
        return true;
    }
}
