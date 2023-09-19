package com.adv.player;

import com.adv.player.ezviz.EzvizPreviewActivity;
import com.adv.player.ezviz.EzvizVideoActivity;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;


public class EzvizVideoManager extends SimpleViewManager<EzvizVideoActivity> {
    private final String REACT_CLASS = "RCTVideoMgr";

    private ThemedReactContext mContext;
    private EzvizVideoActivity videoActivity;

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected EzvizVideoActivity createViewInstance(ThemedReactContext reactContext) {
        mContext = reactContext;

        videoActivity = new EzvizVideoActivity(reactContext,null);
        return videoActivity;
    }
}

