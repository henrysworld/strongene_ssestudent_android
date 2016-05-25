package com.megster.cordova;

import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Handler;
import android.os.Message;
import android.provider.Settings;
import android.util.Log;
import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.apache.cordova.LOG;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Set;

import android.app.Fragment;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.IBinder;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import com.improvelectronics.sync.android.SyncFtpListener;
import com.improvelectronics.sync.android.SyncFtpService;
import com.improvelectronics.sync.android.SyncStreamingService;
import com.improvelectronics.sync.obex.OBEXFtpFolderListingItem;

import java.util.ArrayList;
import java.util.List;
import android.util.Log;
import android.util.Base64;
import android.net.Uri;


public class SyncSdkFileTransfer extends CordovaPlugin implements SyncFtpListener {

    // actions
    private static SyncFtpListener self;
    private static final String START = "start";
    private static final String END = "end";
    private static final String SUBSCRIBE = "subscribe";
    private static final String UNSUBSCRIBE = "unsubscribe";
    private static final String GET_FILE = "getFile";
    private static final String DELETE_FILE = "deleteFile";
    private static final String CHANGE_FOLDER = "changeFolder";
    private static final String GET_URI = "getDirectoryUri";
    private static final String GET_STATE = "getState";
    private static List<OBEXFtpFolderListingItem> curFileList = new ArrayList<OBEXFtpFolderListingItem>();

    // callbacks
    private CallbackContext notificationCallback;

    // Debugging
    private static final String TAG = "SyncSdkFileTransfer";
    private static final boolean D = true;

    private SyncFtpService mFtpService;
    private boolean mFtpServiceBound, mConnectedToFtp;

    @Override
    public boolean execute(String action, CordovaArgs args, CallbackContext callbackContext) throws JSONException {

        boolean validAction = true;
        Log.i(TAG, "###action = " + action);

        if (action.equals(START))
        {
            if ( notificationCallback == null ) {
                Log.e(TAG, "WARNING!! notificationCallback not found!");
                Log.e(TAG, "WARNING!! You need to subscribe first to get the connected notification!");
            }

            Log.d(TAG, "###onCreate" );
            self = this;

            // Bind to the ftp service.
            Intent intent = new Intent(cordova.getActivity(), SyncFtpService.class);
            cordova.getActivity().bindService(intent, mConnection, Context.BIND_AUTO_CREATE);
        }
        else if ( action.equals(END) )
        {
            Log.d(TAG, "###onDestroy" );

            JSONObject json = new JSONObject();
            try {
                json.put( "type", "onDestroy" );
            }  catch (JSONException e) {
                e.printStackTrace();
            }
            sendJsonDataToCallbackLast( json );
            notificationCallback = null;

            if (mFtpServiceBound) {
                // Be sure to send a disconnect if the server was still connected.
                if(mConnectedToFtp) mFtpService.disconnect();

                // Don't forget to remove the listener and unbind from the service.
                mFtpService.removeListener(self);
                cordova.getActivity().unbindService(mConnection);
                self = null;
            }
        }
        else if (action.equals(SUBSCRIBE))
        {
            // * Subscribe should only be called once
            notificationCallback = callbackContext;

            PluginResult result = new PluginResult(PluginResult.Status.NO_RESULT);
            result.setKeepCallback(true);
            callbackContext.sendPluginResult(result);

            JSONObject json = new JSONObject();
            try {
                json.put( "type", "subscribeTest" );
                json.put( "data", "testString" );
            }  catch (JSONException e) {
                e.printStackTrace();
            }
        }
        else if (action.equals(UNSUBSCRIBE)) {
            // send no result, so Cordova won't hold onto the data available callback anymore
            PluginResult result = new PluginResult(PluginResult.Status.NO_RESULT);
            notificationCallback.sendPluginResult(result);
            notificationCallback = null;
            callbackContext.success();
        }
        else if (action.equals( GET_FILE )) {
            boolean b = mFtpService.getFile( curFileList.get( args.getInt(0) ) );
            Log.d(TAG, "FileName: " + curFileList.get( args.getInt(0) ) );
            if ( b )
                callbackContext.success();
            else
                callbackContext.error( "GET_FILE Error" );
        }
        else if (action.equals( DELETE_FILE )) {

            Log.d(TAG, "##### deleting: " + args.getString(0) );
            boolean b = mFtpService.deleteFile( args.getString(0) );
            if ( b )
                callbackContext.success();
            else
                callbackContext.error( "DELETE_FILE Error" );
        }
        else if (action.equals( CHANGE_FOLDER )) {
            Log.d(TAG, "##### changing to: " + args.getString(0) );
            boolean b = mFtpService.changeFolder( args.getString(0) );
            if ( b )
                callbackContext.success();
            else
                callbackContext.error( "CHANGE_FOLDER Error" );
        }
        else if (action.equals( GET_URI )) {
            Uri uri = mFtpService.getDirectoryUri( );
            if ( uri != null )
            {
                Log.d(TAG, "$$$ get uri: " + uri.toString() );
                callbackContext.success( uri.toString() );
            }
            else callbackContext.error( "Get URI failed" );
        }
        else if (action.equals( GET_STATE )) {
            int state = SyncFtpService.STATE_DISCONNECTED;
            if ( mFtpService != null )
                state = mFtpService.getState( );
            Log.d(TAG, "$$$ get state: " + state );
            callbackContext.success( state );
        }
        else validAction = false;

        return validAction;
    }

    @Override
    public void onFtpDeviceStateChange(int oldState, int newState) {
        if (newState == SyncFtpService.STATE_CONNECTED) {
            // Connect to the ftp server.
            mFtpService.connect();
        }

        JSONObject json = new JSONObject();
        try {
            json.put( "type", "onFtpDeviceStateChange" );
            json.put( "stateIdPrev", oldState );
            json.put( "stateIdNew", newState );
        }  catch (JSONException e) {
            e.printStackTrace();
        }
        sendJsonDataToCallback( json );
    }

    @Override
    public void onConnectComplete(int result) {
        if(result == SyncFtpService.RESULT_OK) {
            mConnectedToFtp = true;
            mFtpService.changeFolder("");
        }

        JSONObject json = new JSONObject();
        try{
            json.put( "type", "onConnectComplete" );
            json.put( "isSuccess", result == SyncFtpService.RESULT_OK );
        }  catch (JSONException e) {
            e.printStackTrace();
        }
        sendJsonDataToCallback( json );
    }

    @Override
    public void onDisconnectComplete(int result) {
        mConnectedToFtp = false;

        JSONObject json = new JSONObject();
        try{
            json.put( "type", "onDisconnectComplete" );
        }  catch (JSONException e) {
            e.printStackTrace();
        }
        sendJsonDataToCallback( json );
    }

    @Override
    public void onFolderListingComplete(List<OBEXFtpFolderListingItem> items, int result) {

        curFileList = items;

        // * Convert List<OBEXFtpFolderListingItem> to json
        JSONArray jsonArray = new JSONArray();

        for ( int i = 0; i < items.size(); i++ )
        {
            OBEXFtpFolderListingItem item = items.get(i);
            jsonArray.put( obexItem2Json( item ) );
        }
        Log.d( TAG, jsonArray.toString() );

        JSONObject json = new JSONObject();
        try{
            json.put( "type", "onFolderListingComplete" );
            json.put( "isSuccess", result == SyncFtpService.RESULT_OK );
            json.put( "data", jsonArray );
        }  catch (JSONException e) {
            e.printStackTrace();
        }
        sendJsonDataToCallback( json );
    }

    public JSONObject obexItem2Json( OBEXFtpFolderListingItem item ) {

        JSONObject json = new JSONObject();
        try{
            String base64Encoded = Base64.encodeToString( item.getData(), Base64.DEFAULT );
            json.put( "name", item.getName() );
            json.put( "time", item.getTime() );
            json.put( "size", item.getSize() );
            json.put( "data", base64Encoded );
            json.put( "isFile", item.getSize() != 0 );
        }  catch (JSONException e) {
            e.printStackTrace();
        }
        return json;
    }

    @Override
    public void onChangeFolderComplete(Uri uri, int result) {

        // Get the contents of the folder.
        mFtpService.listFolder();

        JSONObject json = new JSONObject();
        try{
            json.put( "type", "onChangeFolderComplete" );
            json.put( "uri", uri );
        }  catch (JSONException e) {
            e.printStackTrace();
        }
        sendJsonDataToCallback( json );
    }

    @Override
    public void onDeleteComplete(OBEXFtpFolderListingItem file, int result) {
        JSONObject json = new JSONObject();
        try{
            json.put( "type", "onDeleteComplete" );
        }  catch (JSONException e) {
            e.printStackTrace();
        }
        sendJsonDataToCallback( json );
    }

    @Override
    public void onGetFileComplete(OBEXFtpFolderListingItem file, int result) {
        JSONObject o = obexItem2Json( file );
        JSONObject json = new JSONObject();
        try{
            json.put( "type", "onGetFileComplete" );
            json.put( "item", o );
        }  catch (JSONException e) {
            e.printStackTrace();
        }
        sendJsonDataToCallback( json );
    }

    private final ServiceConnection mConnection = new ServiceConnection() {
        public void onServiceConnected(ComponentName name, IBinder service) {
            // Set up the service
            mFtpServiceBound = true;
            SyncFtpService.SyncFtpBinder binder = (SyncFtpService.SyncFtpBinder) service;
            mFtpService = binder.getService();
            mFtpService.addListener( self );// Add listener to retrieve events from ftp service.

            if(mFtpService.getState() == SyncStreamingService.STATE_CONNECTED) {
                // Connect to the ftp server.
                mFtpService.connect();
            }

            JSONObject json = new JSONObject();
            try{
                json.put( "type", "onServiceConnected" );
                json.put( "isSuccess", mFtpService.getState() == SyncStreamingService.STATE_CONNECTED );
            }  catch (JSONException e) {
                e.printStackTrace();
            }
            sendJsonDataToCallback( json );
        }

        public void onServiceDisconnected(ComponentName name) {
            mFtpService = null;
            mFtpServiceBound = false;

            JSONObject json = new JSONObject();
            try{
                json.put( "type", "onServiceDisconnected" );
            }  catch (JSONException e) {
                e.printStackTrace();
            }
            sendJsonDataToCallback( json );
        }
    };

    private void sendJsonDataToCallback( JSONObject obj ) {
        _sendJsonDataToCallback( obj, true );
    }

    private void sendJsonDataToCallbackLast( JSONObject obj ) {
        _sendJsonDataToCallback( obj, false );
    }

    private void _sendJsonDataToCallback( JSONObject obj, boolean isKeepCallback ) {
        if (notificationCallback != null) {
            Log.d(TAG, obj.toString() );
            PluginResult result = new PluginResult(PluginResult.Status.OK, obj);
            result.setKeepCallback(isKeepCallback);
            notificationCallback.sendPluginResult(result);
        } else {
            Log.e(TAG, "WARNING!! notificationCallback not found!");
            Log.e(TAG, "WARNING!! You need to subscribe first to get any report or notification!");
        }
    }
}
