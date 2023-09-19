package com.adv.player.module;

import com.adv.player.Utils.EzvizConstant;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.HashMap;
import java.util.Map;

import androidx.annotation.Nullable;

abstract public class BaseModule extends ReactContextBaseJavaModule {

    protected ReactApplicationContext context;

    public BaseModule(ReactApplicationContext reactContext) {
        super(reactContext);
        context = reactContext;
    }

    @javax.annotation.Nullable
    @Override
    public Map<String, Object> getConstants() {
        Map<String,Object> params = new HashMap<>();
        params.put(EzvizConstant.CAPTURE_SUCCESS, EzvizConstant.CAPTURE_SUCCESS);
        params.put(EzvizConstant.RECORD_SUCCESS, EzvizConstant.RECORD_SUCCESS);
        return params;
    }

    /**
     *
     * @param eventName
     * @param params
     */
    public void sendEvent(String eventName,@Nullable WritableMap params) {
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    public void nativeCallRn(String eventName,Object message) {
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, message);
    }
}