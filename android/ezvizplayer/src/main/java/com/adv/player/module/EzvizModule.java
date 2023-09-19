package com.adv.player.module;

import android.app.Application;
import android.util.Log;
import com.adv.player.Utils.EzvizConstant;
import com.adv.player.Utils.EzvizMessage;
import com.adv.player.ezviz.EzvizVideoActivity;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.videogo.openapi.EZGlobalSDK;
import com.videogo.openapi.EZOpenSDK;
import com.videogo.openapi.bean.EZCameraInfo;
import com.videogo.openapi.bean.EZDeviceInfo;
import com.videogo.openapi.bean.EZVideoQualityInfo;

import org.json.JSONArray;

import java.util.ArrayList;
import java.util.List;

@ReactModule(name = EzvizModule.REACT_CLASS)
public class EzvizModule extends BaseModule {
    public static final String REACT_CLASS = "EzvizModule";

    private EzvizVideoActivity mVideoPlayer = null;
    private EZDeviceInfo mDeviceInfo = null;
    private EZCameraInfo mCameraInfo = null;

    private Application mApplication = null;
    private String mAppKey = "";
    private Boolean mCategory = false;

    public EzvizModule(ReactApplicationContext reactContext) {
        super(reactContext);
        context = reactContext;
    }

    public void setVideoActivity(EzvizVideoActivity player){
        this.mVideoPlayer = player;

        if (mVideoPlayer != null){
            mVideoPlayer.setCategory(mCategory);
        }
    }

    public Application getApplication(){
        return mApplication;
    }

    public String getAppKey(){
        return mAppKey;
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    public void initialize() {
        super.initialize();
        mApplication = (Application) getReactApplicationContext().getBaseContext();
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        unInitLib();
    }

    private void unInitLib(){
        try{
            if (!mCategory){
                EZOpenSDK.finiLib();
            }
            else {
                EZGlobalSDK.finiLib();
            }
        }catch (Exception ex){
        }
    }

    @ReactMethod
    public void initLib(String appKey, Boolean category){
        mAppKey = appKey;
        mCategory = category;

        unInitLib();

        try{
            if (mVideoPlayer != null){
                mVideoPlayer.setCategory(category);
            }

            if(!mCategory){
                EZOpenSDK.initLib(mApplication, mAppKey);
            }else{
                EZGlobalSDK.initLib(mApplication, mAppKey);
            }
        }catch (Exception ex){
        }
    }

    @ReactMethod
    public void setAccessToken(String accessToken){
        
        try{
            if (!mCategory){
                EZOpenSDK.getInstance().setAccessToken(accessToken);
            }
            else {
                EZGlobalSDK.getInstance().setAccessToken(accessToken);
            }
        }catch (Exception ex){
        }
    }

    /**
     * Refactor functions
     */
    @ReactMethod
    public void startVideo(String deviceSerial, int cameraNo, int timeStamp, String verifyCode) {
        try {
            if (mVideoPlayer != null) {
                EZCameraInfo cameraInfo = new EZCameraInfo();
                cameraInfo.setDeviceSerial(deviceSerial);
                cameraInfo.setCameraNo(cameraNo);

                mVideoPlayer.setParams(cameraInfo, timeStamp, verifyCode);
                mVideoPlayer.onHandle(EzvizMessage.MSG_VIDEO_START);
            }
        } catch (Exception e) {
        }
    }

    @ReactMethod
    public void stopVideo(){
        mVideoPlayer.onHandle(EzvizMessage.MSG_VIDEO_STOP);
    }

    @ReactMethod
    public void pausePlayback(){
        mVideoPlayer.onHandle(EzvizMessage.MSG_PLAYBACK_PAUSE);
    }

    @ReactMethod
    public void resumePlayback(){
        mVideoPlayer.onHandle(EzvizMessage.MSG_PLAYBACK_RESUME);
    }

    @ReactMethod
    public void seekForward(int offset){
        mVideoPlayer.setOffset(offset);
        mVideoPlayer.onHandle(EzvizMessage.MSG_SEEK_PLAY);
    }

    @ReactMethod
    public void seekBackward(int offset){
        mVideoPlayer.setOffset(-offset);
        mVideoPlayer.onHandle(EzvizMessage.MSG_SEEK_PLAY);
    }

    @ReactMethod
    public void openSound(){
        mVideoPlayer.onHandle(EzvizMessage.MSG_SOUND_OPEN);
    }

    @ReactMethod
    public void closeSound(){
        mVideoPlayer.onHandle(EzvizMessage.MSG_SOUND_CLOSE);
    }

    @ReactMethod
    public void onCapture(){
        Log.d("Ezviz","OnCapture" );
        mVideoPlayer.onHandle(EzvizMessage.MSG_VIDEO_CAPTURE);
    }

    @ReactMethod
    public void startRecord(){
        mVideoPlayer.onHandle(EzvizMessage.MSG_RECORD_START);
    }

    @ReactMethod
    public void stopRecord(){
        mVideoPlayer.onHandle(EzvizMessage.MSG_RECORD_STOP);
    }

    /**
     * Get video level.
     */
    @ReactMethod
    public void getVideoLevel(String deviceSerial, int cameraNo){
        try {
            mDeviceInfo = EZOpenSDK.getInstance().getDeviceInfo(deviceSerial);
            for(EZCameraInfo cameraInfo: mDeviceInfo.getCameraInfoList()){
                if(cameraNo == cameraInfo.getCameraNo()){
                    mCameraInfo = cameraInfo;
                }
            }
            List<Integer> list=new ArrayList<Integer>();
            for (EZVideoQualityInfo qualityInfo: mCameraInfo.getVideoQualityInfos()){
                switch (qualityInfo.getVideoLevel()){
                    case 0:
                        list.add(0);
                        break;
                    case 1:
                        list.add(1);
                        break;
                    case 2:
                        list.add(2);
                        break;
                    case 3:
                        list.add(3);
                        break;
                    default:break;
                }
            }
            System.out.println(list);
            JSONArray jsonArray= new JSONArray(list);
            System.out.println(jsonArray.toString());
            nativeCallRn(EzvizConstant.VIDEO_LEVEL, jsonArray.toString());
        }catch (Exception ex){
        }
    }

    @ReactMethod
    public void setVideoLevel(String deviceSerial, int cameraNo, int level){
        try {
            EZCameraInfo cameraInfo = new EZCameraInfo();
            cameraInfo.setDeviceSerial(deviceSerial);
            cameraInfo.setCameraNo(cameraNo);
            cameraInfo.setVideoLevel(level);

            if(mVideoPlayer != null){
                mVideoPlayer.setVideoLevel(cameraInfo);
            }
        }catch (Exception ex){
        }
    }
}
