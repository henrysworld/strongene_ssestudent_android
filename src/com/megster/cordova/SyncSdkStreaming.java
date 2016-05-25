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

import com.improvelectronics.sync.android.SyncCaptureReport;
import com.improvelectronics.sync.android.SyncPath;
import com.improvelectronics.sync.android.SyncStreamingListener;
import com.improvelectronics.sync.android.SyncStreamingService;

import java.util.List;
import android.util.Log;


public class SyncSdkStreaming extends CordovaPlugin implements SyncStreamingListener {

    // actions
    private static SyncStreamingListener self;
    private static final String START = "start";
    private static final String END = "end";
    private static final String GET_STATE = "getState";
    private static final String SUBSCRIBE = "subscribe";
    private static final String UNSUBSCRIBE = "unsubscribe";
    private static final String ERASE_SYNC = "eraseSync";
    private static final String SET_SYNC_MODE = "setSyncMode";
    private static final String RESTART = "restart";

    // callbacks
    private CallbackContext notificationCallback;

    // Debugging
    private static final String TAG = "SyncSdkStreaming";
    private static final boolean D = true;

    private SyncStreamingService mStreamingService;
    private boolean mStreamingServiceBound;

    @Override
    public boolean execute(String action, CordovaArgs args, CallbackContext callbackContext) throws JSONException {

        boolean validAction = true;
        Log.i(TAG, "###action = " + action);

        if(action.equals(RESTART)) {
            Log.d(TAG, "###onRestart" );
            if (mStreamingServiceBound) {
                mStreamingService.restart();
            }
            else
                Log.e(TAG, "execute-END FAILED: mStreamingServiceBound == null");
	}
	else if (action.equals(START))
        {
            Log.d(TAG, "###onCreate" );
            self = this;
            // Bind to the ftp service.
            Log.d(TAG, "###onStart1");
            Intent intent = new Intent(cordova.getActivity(), SyncStreamingService.class);
            Log.d(TAG, "###onStart2");
            cordova.getActivity().bindService(intent, mConnection, Context.BIND_AUTO_CREATE);
            Log.d(TAG, "###onStart3");
        }
        else if (action.equals(END)) {
            Log.e(TAG, "ERROR: This method is Deprecated!");
            Log.d(TAG, "###onEnd1");
            if (mStreamingServiceBound) {
                // Put the Boogie Board Sync back into MODE_NONE.
                // This way it doesn't use Bluetooth and saves battery life.
                Log.d(TAG, "###onEnd2");
                if(mStreamingService.getState() == SyncStreamingService.STATE_CONNECTED) mStreamingService.setSyncMode(SyncStreamingService.MODE_NONE);
                // Don't forget to remove the listener and unbind from the service.
                Log.d(TAG, "###onEnd3");
                mStreamingService.stopThreads();
                Log.d(TAG, "###onEnd4");
                cordova.getActivity().unbindService(mConnection);
                Log.d(TAG, "###onEnd5");

                JSONObject json = new JSONObject();
                try {
                    json.put( "type", "onDestroy" );
                }  catch (JSONException e) {
                    e.printStackTrace();
                }
                sendJsonDataToCallbackLast( json );
            }
            else
                Log.e(TAG, "execute-END FAILED: mStreamingServiceBound == null");
        }
        else if (action.equals( GET_STATE )) {
            int state = SyncStreamingService.STATE_DISCONNECTED;
            if ( mStreamingService != null )
                state = mStreamingService.getState( );
            Log.d(TAG, "$$$ get state: " + state );
            callbackContext.success( state );
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
            sendJsonDataToCallback(json);
        }
        else if (action.equals(UNSUBSCRIBE)) {
            // send no result, so Cordova won't hold onto the data available callback anymore
            PluginResult result = new PluginResult(PluginResult.Status.NO_RESULT);
            notificationCallback.sendPluginResult(result);
            notificationCallback = null;
            callbackContext.success();
        }
        else if (action.equals(ERASE_SYNC)) {
            Log.d(TAG, "### erases " );
            if ( mStreamingService != null )
                mStreamingService.eraseSync();
            else Log.e(TAG, "### erase error, service not found");
            callbackContext.success();
        }
        else if (action.equals(SET_SYNC_MODE)) {
            Log.d(TAG, "### setSyncMode: " + args.getInt(0) );
            if ( mStreamingService != null )
                mStreamingService.setSyncMode( args.getInt(0) );
            else Log.e(TAG, "### setmode error, service not found");
            callbackContext.success();
        }
        else validAction = false;

        return validAction;
    }

    private final ServiceConnection mConnection = new ServiceConnection() {
        public void onServiceConnected(ComponentName name, IBinder service)   {
            Log.d(TAG, "###onServiceConnected..." );

            // Set up the service
            mStreamingServiceBound = true;
            SyncStreamingService.SyncStreamingBinder binder = (SyncStreamingService.SyncStreamingBinder) service;
            mStreamingService = binder.getService();
            mStreamingService.addListener(self);// Add listener to retrieve events from streaming service.

            // * <bug fix> Call this after service is binded, otherwise Cordova won't get any notification, which will cause some async bugs
            mStreamingService.startAfterBindService();

            JSONObject json = new JSONObject();
            try{
                json.put( "type", "onServiceConnected" );
                json.put( "isSuccess", mStreamingService.getState() == SyncStreamingService.STATE_CONNECTED );
            }  catch (JSONException e) {
                e.printStackTrace();
            }
            sendJsonDataToCallback( json );

            // Put the streaming service in capture mode to get data from Boogie Board Sync.
            if(mStreamingService.getState() == SyncStreamingService.STATE_CONNECTED) {
                Log.d(TAG, "###onServiceConnected Success!" );
                mStreamingService.setSyncMode(SyncStreamingService.MODE_CAPTURE);
            }
            else
                Log.d(TAG, "###onServiceConnected not success" );
        }

        public void onServiceDisconnected(ComponentName name)  {
            // * only called when disconnected unexpectedly
            Log.d(TAG, "###onServiceDisconnected" );

            JSONObject json = new JSONObject();
            try {
                json.put( "type", "onServiceDisconnected" );
            }  catch (JSONException e) {
                e.printStackTrace();
            }
            sendJsonDataToCallback( json );

            mStreamingService = null;
            mStreamingServiceBound = false;
        }
    };

    @Override
    public void onStreamingStateChange(int prevState, int newState) {
        Log.d(TAG, "###onStreamingStateChange" );

        // Put the streaming service in capture mode to get data from Boogie Board Sync.
        if(newState == SyncStreamingService.STATE_CONNECTED) {
            mStreamingService.setSyncMode(SyncStreamingService.MODE_CAPTURE);
        }

        JSONObject json = new JSONObject();
        try {
            json.put( "type", "onStreamingStateChange" );
            json.put( "stateIdPrev", prevState );
            json.put( "stateIdNew", newState );
        }  catch (JSONException e) {
            e.printStackTrace();
        }
        sendJsonDataToCallback( json );
    }


    @Override
    public void onErase() {
        Log.d(TAG, "###Erase");

        JSONObject json = new JSONObject();
        try {
            json.put( "type", "onErase" );
        }  catch (JSONException e) {
            e.printStackTrace();
        }
        sendJsonDataToCallback( json );
    }

    @Override
    public void onSave() {
        Log.d(TAG, "###Save");

        JSONObject json = new JSONObject();
        try {
            json.put( "type", "onSave" );
        }  catch (JSONException e) {
            e.printStackTrace();
        }
        sendJsonDataToCallback( json );
    }

    @Override
    public void onDrawnPaths(List<SyncPath> paths) {}

    @Override
    public void onCaptureReport(SyncCaptureReport captureReport) {
        String b = captureReport.hasTipSwitchFlag() ? "true" : "false";
        Log.d(TAG, "X:" + captureReport.getX() + ", Y:" + captureReport.getY() + ", P:" + captureReport.getPressure() + ", hasTipSwitchFlag:" + b );

        JSONObject json = new JSONObject();
        try {
            json.put( "type", "onCaptureReport" );
            json.put( "getX", captureReport.getX() );
            json.put( "getY", captureReport.getY() );
            json.put( "getPressure", captureReport.getPressure() );
            json.put( "hasTipSwitchFlag", captureReport.hasTipSwitchFlag() );
        }  catch (JSONException e) {
            e.printStackTrace();
        }
        sendJsonDataToCallback(json);
    }

    @Override
    public void onError( int error, String message ) {
        Log.d(TAG, "###Error");
        JSONObject json = new JSONObject();
        try {
            json.put( "type", "onError" );
			json.put( "error", error );
			json.put( "message", message );
        }  catch (JSONException e) {
            e.printStackTrace();
        }
        sendJsonDataToCallback( json );
    }

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
