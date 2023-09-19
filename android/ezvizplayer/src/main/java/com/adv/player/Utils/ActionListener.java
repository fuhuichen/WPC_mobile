package com.adv.player.Utils;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;

public class ActionListener {

    public ActionInterface mKeyFun;
    public Context mContext;
    public IntentFilter mHomeBtnIntentFilter = null;
    public HomeBtnReceiver mHomeBtnReceiver = null;
    public static final String TAG = ActionListener.class.getSimpleName();

    public ActionListener(Context context) {
        mContext = context;
        mHomeBtnIntentFilter = new IntentFilter(Intent.ACTION_CLOSE_SYSTEM_DIALOGS);
        mHomeBtnReceiver = new HomeBtnReceiver();
    }

    public void startListen() {
        synchronized (mContext){
            if (mContext != null )
                mContext.registerReceiver(mHomeBtnReceiver, mHomeBtnIntentFilter);
            else
                Log.e(TAG, "mContext is null and startListen fail");
        }
    }
    public void stopListen() {
        synchronized (mContext){
            if (mContext != null ){
                mContext.unregisterReceiver(mHomeBtnReceiver);
            }
            else
                Log.e(TAG, "mContext is null and stopListen fail");
        }
    }

    public void setInterface(ActionInterface keyFun){
        mKeyFun = keyFun;

    }
    class HomeBtnReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (action.equals(Intent.ACTION_CLOSE_SYSTEM_DIALOGS)) {
                String reason = intent.getStringExtra("reason");
                if (reason != null) {
                    if(null != mKeyFun ){
                        if (reason.equals("homekey")) {
                            //mKeyFun.home();
                        } else if (reason.equals("recentapps")) {
                            mKeyFun.onRecent();
                        } else if (reason.equals("assist")) {
                            //mKeyFun.longHome();
                        }
                    }
                }
            }

            if(action.equals(Intent.ACTION_SCREEN_ON)){
                //mKeyFun.onScreenOn();
            }else if(action.equals(Intent.ACTION_SCREEN_OFF)){
                //mKeyFun.onScreenOff();
            }
        }
    }
}