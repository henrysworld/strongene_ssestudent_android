/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
 */

package com.strongene.studyapp;

import android.os.Bundle;

import com.strongene.plugins.update.FileUtils;

import org.apache.cordova.*;

import java.io.File;

public class MainActivity extends CordovaActivity
{
    private String baseUrl;
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        // Set by <content src="index.html" /> in config.xml
//        loadUrl(launchUrl);
        reloadUrl();
    }

    //动态加载资源地址
    private void reloadUrl(){
        String indexPath = getExternalFilesDir("strongene").getAbsolutePath() + File.separator + "www" + File.separator + "scripts/index.html";
//        String indexPath = getExternalFilesDir("strongene").getAbsolutePath() + Fil e.separator + "www" + File.separator + "index.html";
        if (!FileUtils.fileIsExists(indexPath)){
            baseUrl = launchUrl;
        } else {
            baseUrl = "file:///" + indexPath;
        }

        loadUrl(baseUrl);
    }
}
