package com.adv.player;

import android.content.Context;

import com.adv.player.module.EzvizModule;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.List;

public class EzvizPackage implements ReactPackage {
    private Context mContext;

    private EzvizVideoManager ezvizVideoManager;

    public EzvizPackage(Context context) {
        this.mContext = context;
        ezvizVideoManager = new EzvizVideoManager();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.<NativeModule>asList(
                new EzvizModule(reactContext)
        );
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(
                ezvizVideoManager
        );
    }
}
