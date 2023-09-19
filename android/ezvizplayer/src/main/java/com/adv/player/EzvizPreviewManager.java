package com.adv.player;

import android.app.Application;

import com.adv.player.ezviz.EzvizPreviewActivity;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.videogo.openapi.EZOpenSDK;


public class EzvizPreviewManager extends SimpleViewManager<EzvizPreviewActivity> {
    private final String REACT_CLASS = "RCTPreview";

    private ThemedReactContext mContext;
    private EzvizPreviewActivity reactActivity;

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected EzvizPreviewActivity createViewInstance(ThemedReactContext reactContext) {
        mContext = reactContext;

        reactActivity = new EzvizPreviewActivity(reactContext,null);
        return reactActivity;
    }

    @ReactProp(name="text")
    public void setText(final EzvizPreviewActivity videoView, String text){
    }
}

