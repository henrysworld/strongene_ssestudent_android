/**
 * **************************************************************************
 * Copyright © 2014 Kent Displays, Inc.
 * <p/>
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * <p/>
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * <p/>
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * **************************************************************************
 */

package com.improvelectronics.sync.android;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.app.AlertDialog.Builder;
import android.app.Dialog;
import android.app.Service;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothServerSocket;
import android.bluetooth.BluetoothSocket;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.content.DialogInterface.OnDismissListener;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Binder;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.Message;
import android.util.Log;
import android.view.WindowManager;

import com.improvelectronics.sync.Config;
import com.improvelectronics.sync.hid.HIDMessage;
import com.improvelectronics.sync.hid.HIDSetReport;
import com.improvelectronics.sync.hid.HIDUtilities;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Set;
import java.util.Timer;
import java.util.TimerTask;
import java.util.UUID;
import android.widget.Toast;
import java.lang.reflect.Method;
import java.util.Arrays;

import com.strongene.studyapp.R;

/**
 * This service connects to the Boogie Board Sync devices and communicates with
 * the Sync using a custom implementation of the HID protocol. All of the
 * connections are done automatically since this service is always running while
 * Bluetooth is enabled. A client of this service can add a listener, that
 * implements
 * {@link com.improvelectronics.sync.android.SyncStreamingListener #SyncStreamingListener}
 * , to listen for changes of the streaming service as well as send commands to
 * the connected Boogie Board Sync. </p> This service also handles all the
 * notifications that are displayed when the Sync connects and disconnects. It
 * is necessary to display these notifications since the Android OS does not
 * show a current Bluetooth connection with the Bluetooth icon in the status
 * bar. Class also handles the case when the user has outdated firmware and will
 * direct them to a site with instructions on how to update the firmware.
 */
public class SyncStreamingService extends Service {

	private static final UUID LISTEN_UUID = UUID
			.fromString("d6a56f81-88f8-11e3-baa8-0800200c9a66");
	private static final UUID CONNECT_UUID = UUID
			.fromString("d6a56f80-88f8-11e3-baa8-0800200c9a66");
	private static final String TAG = SyncStreamingService.class
			.getSimpleName();
	private static final boolean DEBUG = Config.DEBUG;
	private static final int BLUE_TOOTH_SAFE_CLOSE_TIME = 5000;
	private static final int BLUE_TOOTH_SAFE_CLOSE_TIME_CHECK_INTERVAL = 100;
	private static final int BLUE_TOOTH_DEVICE_READY_CHECK_INTERVAL = 200;
	private static final int BLUE_TOOTH_DEVICE_READY = 2000;
	private BluetoothAdapter mBluetoothAdapter;
	private final IBinder mBinder = new SyncStreamingBinder();
	private List<SyncStreamingListener> mListeners;
	private int mState, mMode;
	private ConnectThread mConnectThread = null;
	private ConnectedThread mConnectedThread = null;
	private AcceptThread mAcceptThread = null;
	private List<BluetoothDevice> mPairedDevices;
	private List<SyncPath> mPaths;
	// * Accept套接字关闭是异步的, 在该套接字完全关闭之前, 会有好几次的重试, 属正常现象
	private int RETRY_COUNT_ADD_PERTIME = 2; // * 每次收到手写板启动信号后, 增加的尝试连接的次数
	private Boolean RETRY_COUNT_CLEAR = true;
	private int RETRY_COUNT_AFTER_DISCONNECT = 2; // * 在断开连接后, 重新尝试连接的次数
	private int RETRY_COUNT_INITIAL = 2; // * 初始尝试连接的次数
	private int mRetryCount = RETRY_COUNT_INITIAL;

	private static final int YEAR_OFFSET = 1980;

	private MessageHandler mMessageHandler;
	private static final int MESSAGE_DATA = 13;
	private static final int MESSAGE_CONNECTED = 14;
	private static final int MESSAGE_CONNECTION_BROKEN = 15;
	private static final int MESSAGE_BLUETOOTH_HACK = 16;
	private static final int MESSAGE_ACCEPTED = 17;
	private static String currentMac = "";

	public static final int STATE_CONNECTED = 0;
	public static final int STATE_CONNECTING = 1;
	public static final int STATE_DISCONNECTED = 2;
	public static final int STATE_LISTENING = 4;

	public static final int MODE_NONE = 1;
	public static final int MODE_CAPTURE = 4;
	public static final int MODE_FILE = 5;

	private static final String ACTION_BASE = "com.improvelectronics.sync.android.SyncStreamingService.action";

	public static final String ACTION_BUTTON_PUSHED = ACTION_BASE
			+ ".BUTTON_PUSHED";
	public static final String ACTION_STATE_CHANGED = ACTION_BASE
			+ ".STATE_CHANGED";
	public static final String EXTRA_BUTTON_PUSHED = "EXTRA_BUTTON_PUSHED";
	public static final String EXTRA_STATE = "EXTRA_STATE";
	public static final String EXTRA_PREVIOUS_STATE = "PREVIOUS_STATE";
	public static final String EXTRA_DEVICE = "EXTRA_DEVICE";
	public static final int SAVE_BUTTON = 13;

	public static final int ERROR_CANT_FIND_PAIRED_DEVICE = 1;
	public static final int ERROR_CANT_FIND_PAIRED_DEVICE_REBOOT = 2;
	public static final int ERROR_BLUETOOTH_NOT_AVAILABLE = 3;
	public static final int ERROR_UNDEFINED = -1;

	@Override
	@Deprecated
	public void onStart(Intent intent, int startId) {
		// TODO Auto-generated method stub
		super.onStart(intent, startId);
	}

	@Override
	public void onCreate() {
		// * 默认构造函数
		if (DEBUG)
			Log.d(TAG, "onCreate");
		super.onCreate();
		// * 初始化
		mBluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
		mMessageHandler = new MessageHandler(Looper.getMainLooper());
		mPairedDevices = new ArrayList<BluetoothDevice>();
		mPaths = new ArrayList<SyncPath>();
		mListeners = new ArrayList<SyncStreamingListener>();
		mState = STATE_DISCONNECTED;
		mMode = MODE_NONE;
		// * 决定该Service能够接收那些intent
		setupIntentFilter();
	}

	// * 在该service被绑定后, 触发该函数, 开始尝试建立连接
	public void startAfterBindService() {
		// * 新建一个线程, 监听手写板主动发来的建立连接请求 ( 手写板开机后发送 ).
		// * 这个线程会永久存在, 因为mState在4个状态下, 手写板都有可能处于关闭的状态, 开启后立即会发送仅一次的建立连接请求
		createAcceptThread();
		// * 检查是否已开启蓝牙
		if (mBluetoothAdapter == null || !mBluetoothAdapter.isEnabled()) {
			// onError( ERROR_BLUETOOTH_NOT_AVAILABLE, "错误: 侦测到蓝牙功能尚未开启." );
			mBluetoothAdapter.enable();
			// stopSelf();
		} else {
			if (DEBUG)
				Log.d(TAG, "startAfterBindService");
			// * 开始
			start();
		}
	}

	public void createAcceptThread() {
		if (mAcceptThread == null) {
			if (DEBUG)
				Log.d(TAG, "createAcceptThread mAcceptThread == null");
			mAcceptThread = new AcceptThread();
			mAcceptThread.start();
		} else {
			if (DEBUG)
				Log.d(TAG, "createAcceptThread mAcceptThread != null");
			mAcceptThread.cancel();
			mAcceptThread = new AcceptThread();
			mAcceptThread.start();
		}
	}

	@Override
	public void onDestroy() {
		if (DEBUG)
			Log.d(TAG, "onDestroy: start");
		// * 销毁
		super.onDestroy();
		stopThreads();
		stopBluetoothHack();
		updateDeviceState(STATE_DISCONNECTED);
		mListeners.clear();
		unregisterReceiver(mMessageReceiver);
		if (DEBUG)
			Log.d(TAG, "onDestroy: end");
	}

	private synchronized void onError(int error, String message) {
		Log.e(TAG, "Error: " + error + ", " + message);
		for (SyncStreamingListener listener : mListeners)
			listener.onError(error, message);
	}

	public synchronized void restart() {
		// * 在不该重试的时候避免重试
		if (mState != STATE_LISTENING) {
			onError(ERROR_UNDEFINED, "错误: 在错误的时机尝试重启蓝牙服务");
			return;
		}
		if (DEBUG)
			Log.d(TAG, "restart() - start - retryCount remained:" + mRetryCount);
		// * 重试
		stopThreads();
		start();
		if (DEBUG)
			Log.d(TAG, "restart() - end");
	}

	private synchronized void start() {
		if (DEBUG)
			Log.d(TAG, "start()");
		updatePairedDevices();
		if (mPairedDevices.size() > 0) {
			if (mPairedDevices.size() > 1)
				onError(ERROR_UNDEFINED,
						"错误: 发现两个或两个以上已配对的设备, 请仅保留一个已配对的设备. 设备数量: "
								+ mPairedDevices.size());
			// * 在设备列表中找到了设备
			if (DEBUG)
				Log.d(TAG,
						"start: mPairedDevices.size() == "
								+ mPairedDevices.size());
			// * 如果当前不是连接或正在尝试连接的状态, 则尝试建立连接
			if (mState != STATE_CONNECTED && mState != STATE_CONNECTING) {
				// * 获取设备信息
				BluetoothDevice device = mPairedDevices.get(0);
				currentMac = device.getAddress();
				if (DEBUG)
					Log.d(TAG,
							"BluetoothTarget - waitUntilBluetoothAvailable_end: "
									+ currentMac);
				// * 如果设备已绑定
				if (device.getBondState() == BluetoothDevice.BOND_BONDED)
					// * 尝试建立连接
					connect(device);
				else
					onError(ERROR_CANT_FIND_PAIRED_DEVICE_REBOOT,
							"错误: 建立连接失败. 尝试与未绑定的手写板建立连接");
			} else
				onError(ERROR_UNDEFINED,
						"错误: 建立连接失败. 尝试与手写板建立连接, 但连接已建立或者正在尝试建立连接");
		} else
			onError(ERROR_CANT_FIND_PAIRED_DEVICE, "错误: 建立连接失败. 没有发现已配对的设备");
	}

	private synchronized void connect(BluetoothDevice device) {
		if (DEBUG)
			Log.d(TAG, "SyncStreamingService.connect: to - " + device);
		// * 检查现在是不是一个正确的开始尝试连接的时机, 如果不是则报错
		if (mState == STATE_CONNECTING)
			onError(ERROR_UNDEFINED, "错误: 未知错误. 1");
		if (mConnectThread != null)
			onError(ERROR_UNDEFINED, "错误: 未知错误. 2 mConnectThread不为空");
		mConnectThread=null;
		if (mConnectedThread != null)
			onError(ERROR_UNDEFINED, "错误: 未知错误. 3 mConnectedThread不为空");
		// * 新建Connect线程, 尝试建立连接
		mConnectThread = new ConnectThread(device);
		mConnectThread.start();
		updateDeviceState(STATE_CONNECTING);
		if (DEBUG)
			Log.d(TAG, "SyncStreamingService.connect: finished");
	}

	private synchronized void connected(BluetoothSocket socket) {
		if (DEBUG)
			Log.d(TAG, "connected");
		// * 检查现在是不是一个正确的开始尝试通信的时机, 如果不是则报错
		if (mConnectThread != null)
			onError(ERROR_UNDEFINED, "错误: 未知错误. 4 mConnectThread不为空");
		if (mConnectedThread != null)
			onError(ERROR_UNDEFINED, "错误: 未知错误. 5 mConnectedThread不为空");
		mConnectedThread=null;
		// * 重置重连计数
		if (RETRY_COUNT_CLEAR)
			mRetryCount = RETRY_COUNT_AFTER_DISCONNECT;
		// * 新建Connected线程, 开始与手写板通信
		mConnectedThread = new ConnectedThread(socket);
		mConnectedThread.start();
		startBluetoothHack();
		updateDeviceState(STATE_CONNECTED);
	}

	public synchronized void stopThreads() {
		if (DEBUG)
			Log.d(TAG, "stop - start");
		// * 检查现在是不是一个正确的开始尝试销毁的时机, 如果不是则报错
		if (mConnectThread == null && mConnectedThread == null)
			Log.w(TAG, "警告: 逻辑冗余. 尝试销毁已销毁的线程");
		// * 销毁
		stopConnectThread();
		stopConnectedThread();
		if (DEBUG)
			Log.d(TAG, "stop - end");
	}

	private synchronized void stopConnectThread() {
		if (mConnectThread != null) {
			if (DEBUG)
				Log.d(TAG, "stop2 mConnectThread");
			mConnectThread.cancel();
			mConnectThread = null;
		}
	}

	private synchronized void stopConnectedThread() {
		if (mConnectedThread != null) {
			if (DEBUG)
				Log.d(TAG, "stop3 mConnectedThread");
			mConnectedThread.cancel();
			mConnectedThread = null;
		}
	}

	private boolean updatePairedDevices() {
		if (DEBUG)
			Log.d(TAG, "updatePairedDevices");
		Set<BluetoothDevice> pairedDevices = BluetoothAdapter
				.getDefaultAdapter().getBondedDevices();
		if (pairedDevices == null || pairedDevices.size() == 0)
			return false;
		// * 生成已配对的sync机器的列表
		if (DEBUG)
			Log.d(TAG, "searching for paired Syncs");
		mPairedDevices.clear();
		for (BluetoothDevice device : pairedDevices) {
			if (device.getName() != null && device.getName().equals("Sync")) {
				if (DEBUG)
					Log.d(TAG, "found a Boogie Board Sync");
				mPairedDevices.add(device);
			}
		}
		return true;
	}

	private void setupIntentFilter() {
		// * 设置本service能够接收那些intent, 并且初始化与intent对应的receiver
		if (DEBUG)
			Log.d(TAG, "setupIntentFilter");
		// * 接收state_change和bond_state_change两个intent,
		// 以mMessageReceiver为其对应的receiver
		IntentFilter intentFilter = new IntentFilter();
		intentFilter.addAction(BluetoothAdapter.ACTION_STATE_CHANGED);
		intentFilter.addAction(BluetoothDevice.ACTION_BOND_STATE_CHANGED);
		registerReceiver(mMessageReceiver, intentFilter);
	}

	private void updateDeviceState(int newState) {
		if (DEBUG)
			Log.d(TAG, "updateDeviceState: " + mState + "->" + newState);
		if (newState == mState)
			return;
		if (DEBUG)
			Log.d(TAG, "device state changed from " + mState + " to "
					+ newState);

		int oldState = mState;
		mState = newState;

		// Clean up objects when there is a disconnection.
		if (newState == STATE_DISCONNECTED) {
			// Reset the mode of the Boogie Board Sync.
			mMode = MODE_NONE;
			mPaths.clear();
		} else if (newState == STATE_CONNECTED) {
			setSyncMode(MODE_FILE);
			updateSyncTimeWithLocalTime();
			informSyncOfDevice();
		}

		broadcastStateChange(mState, oldState);

		if (mListeners.size() == 0)
			onError(ERROR_UNDEFINED, "错误: 没找到监听函数. 尝试广播设备状态 - " + oldState
					+ "->" + mState);
		for (SyncStreamingListener listener : mListeners) {
			listener.onStreamingStateChange(oldState, newState);
		}
	}
//int lianjiecishu=1;
	private class MessageHandler extends Handler {

		public MessageHandler(Looper looper) {
			super(looper);
		}

		@SuppressLint("NewApi")
		@Override
		public void handleMessage(Message message) {

			// Parse the message that was returned from the background thread.
			if (message.what == MESSAGE_DATA) {
				if (DEBUG)
					Log.d(TAG, "###handleMessage handleMessage: MESSAGE_DATA "
							+ message.what);

				byte[] buffer = (byte[]) message.obj;
				int numBytes = message.arg1;

				List<HIDMessage> hidMessages = HIDUtilities.parseBuffer(buffer,
						numBytes);

				if (hidMessages == null)
					return;

				// Received a capture report.
				for (HIDMessage hidMessage : hidMessages) {
					if (hidMessage == null) {
						onError(ERROR_UNDEFINED, "错误: 无法解析从手写板传来的消息");
					} else if (hidMessage instanceof SyncCaptureReport) {
						SyncCaptureReport captureReport = (SyncCaptureReport) hidMessage;
						for (SyncStreamingListener listener : mListeners)
							listener.onCaptureReport(captureReport);

						// Filter the paths that are returned from the Boogie
						// Board Sync.
						List<SyncPath> paths = Filtering
								.filterSyncCaptureReport(captureReport);
						if (paths.size() > 0) {
							for (SyncStreamingListener listener : mListeners)
								listener.onDrawnPaths(paths);
							mPaths.addAll(paths);
						}

						// Erase button was pushed.
						if (captureReport.hasEraseSwitchFlag()) {
							mPaths.clear();
							for (SyncStreamingListener listener : mListeners)
								listener.onErase();
						}

						if (DEBUG)
							Log.d(TAG,
									"## HasSaveFlag? "
											+ captureReport.hasSaveFlag());
						// Save button was pushed.
						if (captureReport.hasSaveFlag()) {
							for (SyncStreamingListener listener : mListeners)
								listener.onSave();

							// Dispatch a broadcast.
							broadcastButtonPush(SAVE_BUTTON);
						}
					}
				}
			}

			// 连接到一个接收或连接线程的设备。 通过对象将是一个套接字。
			else if (message.what == MESSAGE_CONNECTED) {
				if (DEBUG)
					Log.d(TAG,
							"###handleMessage handleMessage: MESSAGE_CONNECTED "
									+ message.what);
				connected((BluetoothSocket) message.obj);
			}

			// *从手写板接到了建立连接的请求， 如果此时是处于断开连接的状态， 则尝试重新连接
			else if (message.what == MESSAGE_ACCEPTED) {
				if (DEBUG)
					Log.d(TAG, "处理手写板发来的尝试连接请求");
				if (mState == STATE_DISCONNECTED) {
					if (mRetryCount > 0) {
						Log.d(TAG, "重试计数减少: " + mRetryCount + "->"
								+ (mRetryCount - 1));
						mRetryCount--;
						updateDeviceState(STATE_LISTENING);
					} else
						onError(ERROR_UNDEFINED,
								"错误: 接受到了建立连接的请求, 但由于没有足够的重试计数, 从而忽略了该请求");
				}
			}

			// Disconnected from the device on a worker thread.
			else if (message.what == MESSAGE_CONNECTION_BROKEN) {
				if (DEBUG)
					Log.d(TAG,
							"###handleMessage handleMessage: MESSAGE_CONNECTION_BROKEN "
									+ message.what);
				// Update the state of the device, want to show the
				// disconnection notification and then pop into listening mode
				// since the accept thread should still be running.
				if (DEBUG)
					Log.d(TAG,
							"Not Wanted: Disconnected from the device on a worker thread.");

				updateDeviceState(STATE_DISCONNECTED);

				// * 如果有从手写板收到尝试建立连接的请求( 说明此时手写板开机了 ), 则尝试请求与手写板建立连接
				// * 否则尝试保持与手写板的断开状态, 直到手写板状态改变
				if (mRetryCount > 0) {
					Log.d(TAG, "重试计数减少: " + mRetryCount + "->"
							+ (mRetryCount - 1));
					mRetryCount--;
					updateDeviceState(STATE_LISTENING);
				}else{
//					onError(ERROR_UNDEFINED, "连接次数==="+lianjiecishu);s
//					stopThreads();
//					createAcceptThread();
//					start();
//					lianjiecishu++;
					AlertDialog.Builder builder = new AlertDialog.Builder(getApplication());
					builder.setTitle("提示");
					builder.setMessage("需要手写板重新启动，点击手写板左上角开关重启手写板")
					.setPositiveButton("确定", new DialogInterface.OnClickListener() {
					@Override
					public void onClick(DialogInterface dialog, int which) {
//						stopThreads();
//						createAcceptThread();
//						start();
						dialog.dismiss();
					 }
					 });
//					builder.setNegativeButton("取消", new OnClickListener() {
//
//						@Override
//						public void onClick(DialogInterface dialog, int which) {
//							// TODO Auto-generated method stub
//							dialog.dismiss();
//						}
//					});
					 AlertDialog ad = builder.create();
					// ad.getWindow().setType(WindowManager.LayoutParams.TYPE_SYSTEM_DIALOG); //系统中关机对话框就是这个属性
					 ad.getWindow().setType(WindowManager.LayoutParams.TYPE_SYSTEM_ALERT);

					 ad.setCanceledOnTouchOutside(false); //点击外面区域不会让dialog消失
					 ad.setCancelable(false);
					 ad.setInverseBackgroundForced(true);
					 ad.show();
					 ad.setOnDismissListener(new OnDismissListener() {

						@Override
						public void onDismiss(DialogInterface dialog) {
							// TODO Auto-generated method stub

						}
					});
				}
				  if (DEBUG)
					Log.w(TAG, "警告: 由于没有足够的重试计数, 重连请求被忽略");

				stopBluetoothHack(); // Don't need to keep transmitting hack.
			}

			// Bluetooth hack, see reference below.
			else if (message.what == MESSAGE_BLUETOOTH_HACK) {
				// Only transmit, if we are in capture mode.
				if (mMode != MODE_CAPTURE)
					return;

				if (!write(DUMMY_PACKET))
					stopBluetoothHack();
			}
		}
	}

	private final BroadcastReceiver mMessageReceiver = new BroadcastReceiver() {
		@Override
		public void onReceive(Context context, Intent intent) {
			if (intent.getAction() == null)
				return;
			if (DEBUG)
				Log.d(TAG, "BroadcastReceiver: " + intent.getAction());
			if (intent.getAction()
					.equals(BluetoothAdapter.ACTION_STATE_CHANGED)) {
				// * 如果蓝牙状态发生改变
				int newState = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE,
						BluetoothAdapter.ERROR);
				int prevState = intent.getIntExtra(
						BluetoothAdapter.EXTRA_PREVIOUS_STATE,
						BluetoothAdapter.ERROR);
				if (DEBUG)
					Log.d(TAG, "Bluetooth STATE_CHANGED - " + prevState
							+ " -> " + newState);
				if (prevState == BluetoothAdapter.STATE_ON
						&& newState == BluetoothAdapter.STATE_TURNING_OFF) {
					// * 如果蓝牙被手动关闭了, 则停止服务
					stopThreads();
					stopBluetoothHack();
					updateDeviceState(STATE_DISCONNECTED);
					if (DEBUG)
						Log.w(TAG, "警告: 检测到蓝牙被关闭");
				} else if (prevState == BluetoothAdapter.STATE_TURNING_ON
						&& newState == BluetoothAdapter.STATE_ON) {
					// * 如果蓝牙被开启了, 则开始服务
					// * 开始服务前先恢复Accept线程的工作 (Accept线程在蓝牙关闭状态下会自毁)
					if (DEBUG)
						Log.w(TAG, "警告: 检测到蓝牙被开启");
					createAcceptThread();
					start();
				}
			} else if (intent.getAction().equals(
					BluetoothDevice.ACTION_BOND_STATE_CHANGED)) {
				// * 如果侦测到手写板配对状态发生改变
				int newState = intent
						.getIntExtra(BluetoothDevice.EXTRA_BOND_STATE,
								BluetoothDevice.ERROR);
				int prevState = intent.getIntExtra(
						BluetoothDevice.EXTRA_PREVIOUS_BOND_STATE,
						BluetoothDevice.ERROR);
				BluetoothDevice device = intent
						.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);

				if (DEBUG)
					Log.d(TAG, "ACTION_BOND_STATE_CHANGED - " + prevState
							+ " -> " + newState);
				if (DEBUG && device != null)
					Log.d(TAG,
							"ACTION_BOND_STATE_CHANGED - "
									+ device.getAddress());

				if (device != null && device.getName() != null
						&& device.getName().equals("Sync")) {
					if (prevState == BluetoothDevice.BOND_BONDING
							&& newState == BluetoothDevice.BOND_BONDED) {
						if (DEBUG)
							Log.d(TAG,
									"### SyncStreamingService BroadcastReceiver:  onReceive BOND_BONDED");
						// * 如果发现有新的手写板配对了, 则尝试开始建立连接
						start();
					} else if (prevState == BluetoothDevice.BOND_BONDED
							&& newState == BluetoothDevice.BOND_NONE) {
						if (DEBUG)
							Log.d(TAG,
									"### SyncStreamingService BroadcastReceiver:  onReceive BOND_NONE");
						onError(ERROR_UNDEFINED, "错误: 检测到手写板配对丢失 12 -> 10");
					} else if (prevState == BluetoothDevice.BOND_BONDING
							&& newState == BluetoothDevice.BOND_NONE) {
						onError(ERROR_UNDEFINED, "错误: 检测到手写板被解除配对 11 -> 10");
					}
				} else if (DEBUG)
					Log.d(TAG,
							"Found another device, which is not a Sync device");
			}
		}
	};

	/**
	 * This thread runs while attempting to make an outgoing connection with a
	 * device. It runs straight through; the connection either succeeds or
	 * fails.
	 */
	private class ConnectThread extends Thread {
		private BluetoothSocket mSocket;

		public ConnectThread(BluetoothDevice device) {
			if (DEBUG)
				Log.d(TAG, "ConnectThread.constructor()");
			// Get a BluetoothSocket for a connection with the given
			// BluetoothDevice
			BluetoothSocket tmp = null;
			try {
				tmp = device
						.createInsecureRfcommSocketToServiceRecord(CONNECT_UUID);
			} catch (IOException e) {
				onError(ERROR_UNDEFINED, "错误: 未成功取得UUID");
			}
			// * 把获取成功的套接字传递给mSocket
			mSocket = tmp;
			if (DEBUG)
				Log.d(TAG,
						"ConnectThread.constructor: finished creating socket - "
								+ mSocket.toString());
		}

		public void run() {
			setName("ConnectThread");
			// Always cancel discovery because it will slow down a connection
			mBluetoothAdapter.cancelDiscovery();
			// Make a connection to the BluetoothSocket
			try {
				if (DEBUG)
					Log.d(TAG,
							"ConnectThread.run - start: socket isConnected: "
									+ mSocket.isConnected());
				// 这是一个阻塞调用，将只返回一个成功的连接或异常
				mSocket.connect();
			} catch (IOException e) {
				// - 在手写板未开启 或 手写板在start()函数调用之后开启, 一定会发生这个Exception
				Log.w(TAG, "Warning: ConnectThread.run: Failed to connect - "
						+ e.getMessage());
				try {
					// Close the socket
					if (DEBUG)
						Log.d(TAG, "Close start");
					mSocket.close();
					if (DEBUG)
						Log.d(TAG, "Close finished");
				} catch (IOException e2) {
					onError(ERROR_UNDEFINED, "错误: 无法关闭套接字 1 - ConnectThread");
				}
				if (DEBUG)
					Log.d(TAG, "ConnectThread.run: send broken notifications");
				mMessageHandler.obtainMessage(MESSAGE_CONNECTION_BROKEN)
						.sendToTarget();
				return;
			}
			if (DEBUG)
				Log.d(TAG, "ConnectThread.run: Successfully connected");
			// * 任务完成, 销毁当前线程
			synchronized (SyncStreamingService.this) {
				mConnectThread = null;
			}
			if (DEBUG)
				Log.d(TAG, "mMessageHandler.obtainMessage");
			// * 将套接字传递给ConnectedThread
			mMessageHandler.obtainMessage(MESSAGE_CONNECTED, mSocket)
					.sendToTarget();
		}

		public void cancel() {
			try {
				if (DEBUG)
					Log.d(TAG, "ConnectThread.cancel: start");
				// * 如果当前线程没有被销毁( 依然在负责mSocket的处理 ), 则关闭套接字
				mSocket.close();
				if (DEBUG)
					Log.d(TAG, "ConnectThread.cancel: end");
			} catch (IOException e) {
				onError(ERROR_UNDEFINED, "错误: 无法关闭套接字 2 - ConnectThread");
			}
		}
	}

	/**
	 * This thread runs during a connection with a remote device. It handles all
	 * incoming and outgoing transmissions.
	 */
	private class ConnectedThread extends Thread {
		private BluetoothSocket mSocket;
		private final InputStream mInputStream;
		private final OutputStream mOutputStream;

		public ConnectedThread(BluetoothSocket socket) {
			if (DEBUG)
				Log.d(TAG, "ConnectedThread.constructor: start");
			mSocket = socket;
			InputStream tmpIn = null;
			OutputStream tmpOut = null;
			// Get the BluetoothSocket input and output streams
			try {
				tmpIn = socket.getInputStream();
				tmpOut = socket.getOutputStream();
			} catch (IOException e) {
				onError(ERROR_UNDEFINED, "错误: 建立套接字失败 3 - ConnectedThread");
			}
			// * 成功获取mInputStream和mOutputStream
			mInputStream = tmpIn;
			mOutputStream = tmpOut;
			if (DEBUG)
				Log.d(TAG, "ConnectedThread.constructor: end");
		}

		public void run() {
			byte[] buffer = new byte[1024];
			int bytes;
			if (DEBUG)
				Log.d(TAG, "ConnectedThread.run: start reading");
			// Keep listening to the InputStream while connected
			while (true) {
				try {
					// Read from the InputStream
					if (DEBUG)
						Log.d(TAG, "ConnectedThread.run - isConnected: "
								+ mSocket.isConnected());
					if (DEBUG)
						Log.d(TAG, "ConnectedThread.run: reading...");
					bytes = mInputStream.read(buffer);
					// Send the obtained bytes to the main thread to be
					// processed.
					if (DEBUG)
						Log.d(TAG, "ConnectedThread.run: read - " + bytes);
					mMessageHandler.obtainMessage(MESSAGE_DATA, bytes, -1,
							buffer).sendToTarget();
					// Reset buffer.
					buffer = new byte[1024];
				} catch (IOException e) {
					mMessageHandler.obtainMessage(MESSAGE_CONNECTION_BROKEN)
							.sendToTarget();
					// - 在成功建立连接之后, 断开手写板, 一定会发生这个Exception
					Log.w(TAG, "Warning: ConnectedThread.run: disconnected - "
							+ e.getMessage());
					break;
				}
			}
			if (DEBUG)
				Log.d(TAG, "ConnectedThread.run: end reading");
		}

		public void write(byte[] buffer) {
			if (DEBUG)
				Log.d(TAG, "ConnectedThread - write" + Arrays.toString(buffer));
			if (mSocket.isConnected() == false) // * Disconnected by stop
				return;
			try {
				mOutputStream.write(buffer);
			} catch (IOException e) {
				onError(ERROR_UNDEFINED, "错误: 向手写板发送数据时出错");
				Log.e(TAG, "Exception during write", e);
			}
		}

		public void cancel() {
			try {
				if (DEBUG)
					Log.d(TAG, "ConnectedThread:cancel");
				// * 该线程结束时, 一定是出于正在处理一个socket的状态, 关闭mSocket
				mSocket.close();
			} catch (IOException e) {
				onError(ERROR_UNDEFINED, "错误: 无法关闭套接字 4 - ConnectedThread");
				Log.e(TAG, "close() of connect socket failed", e);
			}
		}
	}

	private class AcceptThread extends Thread {
		// The local server socket
		private final BluetoothServerSocket mServerSocket;

		public AcceptThread() {
			BluetoothServerSocket tmp = null;

			// Create a new listening server socket.
			try {
				tmp = mBluetoothAdapter
						.listenUsingInsecureRfcommWithServiceRecord(
								"Sync Streaming Profile", LISTEN_UUID);
			} catch (IOException e) {
				onError(ERROR_UNDEFINED, "错误: 监听失败, 无法通过UUID取得套接字建立请求");
			}
			mServerSocket = tmp;
		}

		public void run() {
			// Server socket could be null if Bluetooth was turned off and it
			// threw an IOException
			if (mServerSocket == null) {
				if (DEBUG)
					Log.w(TAG,
							"警告: 服务器套接字为空, 蓝牙关闭会引发这个错误. 蓝牙开启后应该重启AcceptThread");
				// * 由于无法建立AcceptThread, 立即销毁当前线程
				synchronized (SyncStreamingService.this) {
					mAcceptThread = null;
				}
				return;
			}

			if (DEBUG)
				Log.d(TAG, "BEGIN mAcceptThread" + this);
			setName("AcceptThread");

			BluetoothSocket socket;
			while (true) {
				try {
					// 这是一个阻塞的呼叫，将只返回一个 成功连接或异常
					socket = mServerSocket.accept();
				} catch (IOException e) {
					Log.d(TAG, "警告: 服务套接字在尝试接受连接时出错, 从而中断. 将不再尝试与手写板建立连接.");
					break;
				}

				// If a connection was accepted
				if (socket != null) {
					synchronized (SyncStreamingService.this) {
						close(socket);
						// * 重连计数增加
						// * 向消息接收器发送尝试重连与重连计数增加请求
						Log.d(TAG, "重试计数增加: " + mRetryCount + "->"
								+ (mRetryCount + RETRY_COUNT_ADD_PERTIME));
						mRetryCount += RETRY_COUNT_ADD_PERTIME;
						// * if connection needs to be initialized
						if (mState == STATE_DISCONNECTED) {
							if (mRetryCount == RETRY_COUNT_ADD_PERTIME) {
								// * 这也是个错误的方案, 不知道为什么, 虽然收到了连接的套接字,
								// 但是无法通过套接字传输数据
								// mMessageHandler.obtainMessage(MESSAGE_CONNECTED,
								// socket).sendToTarget();

								// * Awful hacking method: Turn off and on
								// bluetooth switch
								// * 这个操作会自动触发尝试建立连接的操作
								turnOffAndOnBluetooth();

								// * 下面的方案是个错误的解决方案, 不知道为什么, 就是会有一定几率连接不上
								// mMessageHandler.obtainMessage(MESSAGE_ACCEPTED).sendToTarget();
							}
						} else
							Log.w(TAG,
									"警告: 在错误的时机(非state_disconnect)接受到了手写板发来的重连请求");
					}
				} else
					onError(ERROR_UNDEFINED, "错误: acceptThread - 服务器套接字为空");
			}
			if (DEBUG)
				Log.i(TAG, "END mAcceptThread");
		}

		public void cancel() {
			if (DEBUG)
				Log.d(TAG, "cancel " + this);
			try {
				if (mServerSocket != null)
					mServerSocket.close();
			} catch (IOException e) {
				onError(ERROR_UNDEFINED, "错误: 关闭服务器套接字时发生错误");
			}
		}

		public void close(BluetoothSocket socket) {
			// 立即关闭接收到的套接字, 否则会触发非常快的重连重试 (闪烁式重连)
			try {
				socket.close();
				socket = null;
			} catch (IOException e) {
				onError(ERROR_UNDEFINED, "错误: 无法关闭从服务器线程接收到的套接字");
			}
		}
	}

	public void turnOffAndOnBluetooth() {
		Log.d(TAG, "turnOffAndOnBluetooth - start");
		// * Turn off and on bluetooth switch
		if (setBluetooth(false) == false)
			Log.w(TAG, "start - Bluetooth disable failed");
		// * Wait untile bluetooth is OFF
		while (mBluetoothAdapter.getState() != BluetoothAdapter.STATE_OFF) {
			Log.w(TAG, "start - not off");
			// * Try to enable bluetooth ( multiple times is OK )
			if (setBluetooth(false) == false)
				Log.d(TAG, "start - Bluetooth disable failed");
			// * Sleep for a bliz
			try {
				Thread.sleep(BLUE_TOOTH_DEVICE_READY_CHECK_INTERVAL);
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		if (setBluetooth(true) == false)
			Log.w(TAG, "start - Bluetooth enable failed");

		// * Wait untile bluetooth is ON
		while (mBluetoothAdapter.getState() != BluetoothAdapter.STATE_ON) {
			Log.w(TAG, "start - not on");
			// * Try to enable bluetooth ( multiple times is OK )
			if (setBluetooth(true) == false)
				Log.d(TAG, "start - Bluetooth enable failed");
			// * Sleep for a bliz
			try {
				Thread.sleep(BLUE_TOOTH_DEVICE_READY_CHECK_INTERVAL);
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		// * update paired device list
		updatePairedDevices();
		Log.d(TAG, "turnOffAndOnBluetooth - end");
	}

	public boolean setBluetooth(boolean enable) {
		BluetoothAdapter bluetoothAdapter = BluetoothAdapter
				.getDefaultAdapter();
		boolean isEnabled = bluetoothAdapter.isEnabled();
		if (enable && !isEnabled) {
			return bluetoothAdapter.enable();
		} else if (!enable && isEnabled) {
			return bluetoothAdapter.disable();
		}
		// No need to change bluetooth state
		return true;
	}

	private void broadcastStateChange(int state, int previousState) {
		// * 播报蓝牙状态变化事件
		if (DEBUG)
			Log.d(TAG, "broadcastStateChange: " + previousState + "->" + state);
		Intent intent = new Intent(ACTION_STATE_CHANGED);
		intent.putExtra(EXTRA_STATE, state);
		intent.putExtra(EXTRA_PREVIOUS_STATE, previousState);
		if (mPairedDevices.size() > 0) {
			if (mPairedDevices.size() > 1)
				onError(ERROR_UNDEFINED,
						"错误: 发现两个或两个以上已配对的设备, 请仅保留一个已配对的设备. 设备数量: "
								+ mPairedDevices.size());
			intent.putExtra(EXTRA_DEVICE, mPairedDevices.get(0));
		}
		sendBroadcast(intent);
	}

	private void broadcastButtonPush(int button) {
		// * 播报手写板按钮按下事件
		if (DEBUG)
			Log.d(TAG, "broadcastButtonPush: " + button);
		Intent intent = new Intent(ACTION_BUTTON_PUSHED);
		intent.putExtra(EXTRA_BUTTON_PUSHED, button);
		sendBroadcast(intent);
	}

	public int getState() {
		if (DEBUG)
			Log.d(TAG, "getState: " + mState);
		return mState;
	}

	public class SyncStreamingBinder extends Binder {
		public SyncStreamingService getService() {
			return SyncStreamingService.this;
		}
	}

	@Override
	public IBinder onBind(Intent intent) {
		if (DEBUG)
			Log.d(TAG, "onBind");
		return mBinder;
	}

	private boolean write(byte[] out) {
		if (DEBUG)
			Log.d(TAG, "Service - write" + Arrays.toString(out));
		// Create temporary object
		ConnectedThread r;
		// Synchronize a copy of the ConnectedThread
		synchronized (this) {
			if (DEBUG)
				Log.d(TAG, "write mState: " + mState);
			if (mState != STATE_CONNECTED) {
				onError(ERROR_UNDEFINED, "错误: 设置手写板模式失败");
				return false;
			}
			r = mConnectedThread;
		}
		// Perform the write unsynchronized
		if (DEBUG)
			Log.d(TAG, "write: " + Arrays.toString(out));
		r.write(out);
		return true;
	}

	public boolean eraseSync() {
		if (DEBUG)
			Log.d(TAG, "eraseSync");
		if (mState != STATE_CONNECTED)
			return false;

		if (DEBUG)
			Log.d(TAG, "writing message to erase Boogie Board Sync's screen");

		// Clean up paths.
		mPaths.clear();

		// Create the HID message to be sent to the Sync to erase the screen.
		byte ERASE_MODE = 0x01;
		HIDSetReport setReport = new HIDSetReport(HIDSetReport.TYPE_FEATURE,
				HIDSetReport.ID_OPERATION_REQUEST, new byte[] { ERASE_MODE });

		return write(setReport.getPacketBytes());
	}

	private boolean updateSyncTimeWithLocalTime() {
		if (DEBUG)
			Log.d(TAG, "updateSyncTimeWithLocalTime");
		if (mState != STATE_CONNECTED)
			return false;

		// Construct the byte array for the time.
		Calendar calendar = Calendar.getInstance();
		int second = calendar.get(Calendar.SECOND) / 2;
		int minute = calendar.get(Calendar.MINUTE);
		int hour = calendar.get(Calendar.HOUR_OF_DAY);
		int day = calendar.get(Calendar.DAY_OF_MONTH);
		int month = calendar.get(Calendar.MONTH) + 1;
		int year = calendar.get(Calendar.YEAR) - YEAR_OFFSET;

		byte byte1 = (byte) ((minute << 5) | second);
		byte byte2 = (byte) ((hour << 3) | (minute >> 3));
		byte byte3 = (byte) ((month << 5) | day);
		byte byte4 = (byte) ((year << 1) | (month >> 3));

		// Create the HID message to be sent to the Sync to set the time.
		HIDSetReport setReport = new HIDSetReport(HIDSetReport.TYPE_FEATURE,
				HIDSetReport.ID_DATE, new byte[] { byte1, byte2, byte3, byte4 });
		if (DEBUG)
			Log.d(TAG, "writing message to update Boogie Board Sync's time");
		return write(setReport.getPacketBytes());
	}

	public boolean setSyncMode(int mode) {
		if (DEBUG)
			Log.d(TAG, "setSyncMode - start");
		// Check to see if a valid mode was sent.
		if (mMode == mode || mode < MODE_NONE || mode > MODE_FILE
				|| mState != STATE_CONNECTED)
			return false;

		if (mode == 4)
			Thread.currentThread().getStackTrace();

		if (DEBUG)
			Log.d(TAG, "setSyncMode - " + mMode + "->" + mode);
		// Create the HID message to be sent to the Sync to change its mode.
		HIDSetReport setReport = new HIDSetReport(HIDSetReport.TYPE_FEATURE,
				HIDSetReport.ID_MODE, new byte[] { (byte) mode });
		if (DEBUG)
			Log.d(TAG,
					"setSyncMode - "
							+ Arrays.toString(setReport.getPacketBytes()));
		if (write(setReport.getPacketBytes())) {
			mMode = mode;
			return true;
		} else {
			onError(ERROR_UNDEFINED, "错误: 设置手写板模式失败");
			return false;
		}
	}

	public List<BluetoothDevice> getPairedDevices() {
		return mPairedDevices;
	}

	public List<SyncPath> getPaths() {
		return mPaths;
	}

	private boolean informSyncOfDevice() {
		if (DEBUG)
			Log.d(TAG, "informSyncOfDevice");
		if (mState != STATE_CONNECTED)
			return false;

		// Create the HID message to be sent to the Sync to tell the Sync what
		// device this is.
		byte ANDROID_DEVICE = 8;
		HIDSetReport setReport = new HIDSetReport(HIDSetReport.TYPE_FEATURE,
				HIDSetReport.ID_DEVICE, new byte[] { ANDROID_DEVICE, 0x00,
						0x00, 0x00 });
		if (DEBUG)
			Log.d(TAG,
					"writing message to inform Boogie Board Sync what device we are");
		return write(setReport.getPacketBytes());
	}

	// * 取得已连接的设备, 如果没有已连接的设备则返回null
	public BluetoothDevice getConnectedDevice() {
		if (DEBUG)
			Log.d(TAG, "getConnectedDevice: " + (mState == STATE_CONNECTED));
		if (mState != STATE_CONNECTED)
			return null;
		else
			return mPairedDevices.get(0);
	}

	@Override
	public int onStartCommand(Intent intent, int flags, int startId) {
		if (DEBUG)
			Log.d(TAG, "onStartCommand");
		return Service.START_STICKY;
	}

	public boolean addListener(SyncStreamingListener listener) {
		Log.d(TAG, "addListener - add all");
		if (mListeners.contains(listener))
			return false;
		else
			mListeners.add(listener);
		return true;
	}

	public boolean removeListener(SyncStreamingListener listener) {
		Log.d(TAG, "removeListener - remove all");
		if (!mListeners.contains(listener))
			return false;
		else
			mListeners.remove(listener);
		return true;
	}

	/**
	 * On Android v0.4.3+, if you are constantly reading data from an input
	 * stream (using Bluetooth API) and are never sending any data over the
	 * output stream this shows up in the console log.
	 * <p/>
	 * W/bt-btif﹕ dm_pm_timer expires W/bt-btif﹕ dm_pm_timer expires 0
	 * W/bt-btif﹕ proc dm_pm_timer expires
	 * <p/>
	 * One can assume that there is a timer set to ensure there is back and
	 * forth communication between a Bluetooth device. Once it is hit, the input
	 * stream drops a lot of frames and some of the frames read are even
	 * corrupted.
	 * <p/>
	 * To combat this, every few seconds a FEND is sent to keep this timer alive
	 * and to ensure it does not expire. A.K.A. Bluetooth Hack
	 * <p/>
	 * Similar problem: http://stackoverflow.com/a/18508694
	 */

	private Timer mBluetoothHackTimer;
	private TimerTask mBluetoothHackTimerTask;
	private final byte[] DUMMY_PACKET = new byte[] { (byte) 0xC0 }; // Dummy
																	// packet
																	// just
																	// contains
																	// a frame
																	// end.

	private void startBluetoothHack() {
		if (Build.VERSION.SDK_INT < Build.VERSION_CODES.JELLY_BEAN_MR2)
			return;

		mBluetoothHackTimer = new Timer();
		mBluetoothHackTimerTask = new TimerTask() {
			public void run() {
				mMessageHandler.obtainMessage(MESSAGE_BLUETOOTH_HACK)
						.sendToTarget();
			}
		};

		int DELAY = 3000;
		mBluetoothHackTimer.scheduleAtFixedRate(mBluetoothHackTimerTask, DELAY,
				DELAY);
	}

	private void stopBluetoothHack() {
		if (Build.VERSION.SDK_INT < Build.VERSION_CODES.JELLY_BEAN_MR2)
			return;

		if (mBluetoothHackTimer != null) {
			mBluetoothHackTimer.cancel();
			mBluetoothHackTimer.purge();
		}
	}
}
