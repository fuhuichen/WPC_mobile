package com.adv.player;

import com.adv.player.ezviz.EzvizPlaybackActivity;
import com.adv.player.ezviz.EzvizPreviewActivity;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;


public class EzvizPlaybackManager extends SimpleViewManager<EzvizPlaybackActivity> {
    private final String REACT_CLASS = "RCTPlayback";

    private ThemedReactContext mContext;
    private EzvizPlaybackActivity reactActivity;

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected EzvizPlaybackActivity createViewInstance(ThemedReactContext reactContext) {
        mContext = reactContext;

        reactActivity = new EzvizPlaybackActivity(reactContext,null);
        return reactActivity;
    }

    @ReactProp(name="captureEnable")
    public void setText(final EzvizPlaybackActivity view, boolean enable){
        reactActivity.setCaptureMode(enable);
    }
}
