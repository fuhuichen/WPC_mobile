package com.adv.player.ezviz;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.os.Environment;
import android.os.Handler;
import android.os.Message;
import android.os.SystemClock;
import android.text.TextUtils;
import android.util.AttributeSet;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.adv.player.Utils.ActionInterface;
import com.adv.player.Utils.ActionListener;
import com.adv.player.Utils.EzvizConstant;
import com.adv.player.Utils.EzvizErrorCode;
import com.adv.player.Utils.EzvizLanguage;
import com.adv.player.Utils.EzvizMessage;
import com.adv.player.common.EZUtils;
import com.adv.player.module.EzvizModule;
import com.example.ezvizplayer.R;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.videogo.errorlayer.ErrorInfo;
import com.videogo.exception.BaseException;
import com.videogo.exception.ErrorCode;
import com.videogo.exception.InnerException;
import com.videogo.openapi.EZConstants;
import com.videogo.openapi.EZConstants.EZVideoLevel;
import com.videogo.openapi.EZConstants.EZRealPlayConstants;
import com.videogo.openapi.EZGlobalSDK;
import com.videogo.openapi.EZOpenSDK;
import com.videogo.openapi.EZOpenSDKListener;
import com.videogo.openapi.EZPlayer;
import com.videogo.openapi.bean.EZCameraInfo;
import com.videogo.openapi.bean.EZDeviceInfo;
import com.videogo.openapi.bean.EZVideoQualityInfo;
import com.videogo.realplay.RealPlayStatus;
import com.videogo.util.LocalInfo;
//import com.videogo.util.LogUtil;
import com.videogo.util.SDCardUtil;
import com.videogo.util.Utils;
import com.videogo.widget.CheckTextButton;

import org.json.JSONArray;

import java.io.File;
import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

public class EzvizPreviewActivity extends LinearLayout implements SurfaceHolder.Callback,
        Handler.Callback{
    private static final String TAG = EzvizPreviewActivity.class.getSimpleName();
    private EzvizModule ezvizModule = null;
    private Object mLockPlayer = new Object();

    private Context mContext = null;
    private SurfaceView mSurfaceView = null;
    private SurfaceHolder mSurfaceHolder = null;

    private EZPlayer mEZPlayer = null;
    private Handler mHandler = null;
    private EZCameraInfo mCameraInfo = null;

    private int mStatus = RealPlayStatus.STATUS_INIT;

    private ActionListener mActionListener = null;
    private LocalInfo mLocalInfo = null;
    private Boolean mSoundActive = false;

    private Activity activity = null;
    private RelativeLayout indicatorView;
    private RelativeLayout videoTipsView;
    private TextView videoTips;
    private RelativeLayout recordTipsView;
    private TextView videoRecordTips;

    // Real play controls.
    private View rootView = null;
    private View realPlayControls = null;

    private ImageButton realPlayBtn = null;
    private ImageButton realSoundBtn = null;
    private ImageButton realPictureBtn = null;
    private ImageButton realVideoBtn = null;
    private CheckTextButton realFullScreen = null;

    // Full Screen.
    private Boolean mFullScreen = false;
    private Boolean mRecordActive = false;
    private Timer mUpdateTimer = null;
    private TimerTask mUpdateTimerTask = null;
    private String mRecordPath = "";
    private int mRecordTime = EzvizConstant.MAX_RECORD_TIME;

    private Thread mPlayThread = null;
    private Boolean mExitPlay = false;
    private int mPlayTotalTime = 0;

    private Boolean mPlayActive = false;
    private String mVerifyCode = "";
    private long mLastClickTime = 0L;
    private Boolean mRecordSuccess = false;
    private Boolean mCategory = false;
    public static final int MSG_SET_VEDIOMODE_SUCCESS = 105;
    public static final int MSG_SET_VEDIOMODE_FAIL = 106;
    /**
     * ============================================================
     * Constructor & init layout
     */
    public EzvizPreviewActivity(Context context, @androidx.annotation.Nullable AttributeSet attrs) {
        super(context, attrs);
        mContext = context;

        initData(context);
        initView();
    }

    private void initData(Context context){
        ezvizModule = ((ThemedReactContext)context).getNativeModule(EzvizModule.class);
        //ezvizModule.setPreviewActivity(this);

        LocalInfo.init(ezvizModule.getApplication(), ezvizModule.getAppKey());
        mLocalInfo = LocalInfo.getInstance();
        mLocalInfo.setSoundOpen(false);

        mHandler = new Handler(this);

        mActionListener = new ActionListener(this.getContext());
        mActionListener.setInterface(new ActionInterface() {
            @Override
            public void onRecent() {
                if (mStatus == RealPlayStatus.STATUS_START ||
                        mStatus == RealPlayStatus.STATUS_PLAY){
                    stopRealPlay();
                    mPlayActive = true;
                }

                if (mLocalInfo.isSoundOpen()){
                    playSound(true);
                    mSoundActive = true;
                }

                stopRecord(false);
            }
        });
        mActionListener.startListen();

        activity = ((ThemedReactContext) context).getCurrentActivity();
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private void startThread(){
        updatePlayTime(false);
        mExitPlay = false;

        mPlayThread = new Thread(){
            @Override
            public void run() {
                while (!mExitPlay){
                    try {
                        updatePlayTime(true);
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }

                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                };
            }
        };

        mPlayThread.start();
    }

    private void stopThread(){
        mExitPlay = true;

        if(mPlayThread != null && mPlayThread.isAlive()){
            mPlayThread.interrupt();

            try {
                mPlayThread.join(100);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    private void updatePlayTime(Boolean plus){
        if(plus){
            mPlayTotalTime++;
            if(mPlayTotalTime == EzvizConstant.MAX_PLAY_TIME){
                sendMessage(EzvizMessage.MSG_AUTO_HANDLE,0);
            }
        }else{
            mPlayTotalTime = 0;
        }
    }

    private void initView() {
        rootView = LayoutInflater.from(this.getContext()).inflate(R.layout.ez_preview_page, this);
        rootView.setFocusableInTouchMode(true);
        rootView.requestFocus();

        initSurfaceView();
        initRealPlayView();
    }

    private void initSurfaceView(){
        mSurfaceView = findViewById(R.id.realplay_sv);

        mSurfaceHolder = mSurfaceView.getHolder();
        mSurfaceHolder.addCallback(this);

        indicatorView = rootView.findViewById(R.id.real_play_loading);
        videoTipsView = rootView.findViewById(R.id.real_play_tips);
        videoTips = videoTipsView.findViewById(R.id.tv_video_tips);
        recordTipsView = rootView.findViewById(R.id.realplay_record_prompt);
        videoRecordTips = recordTipsView.findViewById(R.id.video_record_tv);
    }

    /**
     * ============================================================
     * Real play controls.
     */
    private void initRealPlayView(){
        realPlayControls = rootView.findViewById(R.id.real_play_view);

        realPlayBtn = realPlayControls.findViewById(R.id.realplay_play_btn);
        realSoundBtn = realPlayControls.findViewById(R.id.realplay_sound_btn);
        realPictureBtn = realPlayControls.findViewById(R.id.realplay_picture);
        realVideoBtn = realPlayControls.findViewById(R.id.realplay_video);
        realFullScreen = realPlayControls.findViewById(R.id.fullscreen_button);

        realPlayBtn.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                ezvizModule.nativeCallRn(EzvizConstant.ON_PLAYER,false);
                if (mStatus == RealPlayStatus.STATUS_INIT  ||
                        mStatus == RealPlayStatus.STATUS_STOP){
                    startRealPlay();
                } else {
                    setRealPlayStopUI();
                    stopRealPlay();

                    playSound(true);
                    stopRecord(false);
                }
            }
        });

        realSoundBtn.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                playSound(mLocalInfo.isSoundOpen());
            }
        });

        realPictureBtn.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                onAttachment(0);
            }
        });

        realVideoBtn.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                onAttachment(1);
            }
        });

        realFullScreen.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                onFullScreenClick();
            }
        });

        enableRealView(false);
    }

    /**
     * Real play functions.
     */
    private void startRealPlay(){
      //  LogUtil.debugLog(TAG, "startRealPlay");

        if(mCameraInfo == null){
            if(mFullScreen){
                setRealPlayFailUI(EzvizLanguage.getString("Unselected channel"));
            }
            return;
        }

        if (mStatus == RealPlayStatus.STATUS_START || mStatus == RealPlayStatus.STATUS_PLAY) {
            return;
        }

        setRealPlayLoadingUI();

        synchronized (mLockPlayer){
            if (!mCategory){
                mEZPlayer = EZOpenSDK.getInstance().createPlayer(
                        mCameraInfo.getDeviceSerial(),
                        mCameraInfo.getCameraNo());
            }else {
                mEZPlayer = EZGlobalSDK.getInstance().createPlayer(
                        mCameraInfo.getDeviceSerial(),
                        mCameraInfo.getCameraNo());
            }

            if (mEZPlayer != null){
                mEZPlayer.setHandler(mHandler);
                mEZPlayer.setStreamDownloadCallback(new EZOpenSDKListener.EZStreamDownloadCallback() {
                    @Override
                    public void onSuccess(String s) {
                        if(mRecordSuccess){
                            sendMessage(EzvizMessage.MSG_RECORD_SUCCESS,0);
                        }
                    }

                    @Override
                    public void onError(EZOpenSDKListener.EZStreamDownloadError ezStreamDownloadError) {
                    }
                });

                mEZPlayer.setPlayVerifyCode(mVerifyCode);
                mEZPlayer.setSurfaceHold(mSurfaceHolder);
                mEZPlayer.startRealPlay();
            }
        }
    }

    private void stopRealPlay(){
      //  LogUtil.debugLog(TAG, "stopRealPlay");

        mStatus = RealPlayStatus.STATUS_STOP;

        synchronized (mLockPlayer){
            if(mEZPlayer != null){
                mEZPlayer.stopRealPlay();
            }

            if(videoTipsView != null){
                videoTipsView.setVisibility(VISIBLE);
                videoTips.setText("");
            }
        }

        enableRealView(false);
        stopThread();
    }

    private void setRealPlayLoadingUI(){
        mStatus = RealPlayStatus.STATUS_START;

        videoTipsView.setVisibility(INVISIBLE);

        indicatorView.setVisibility(VISIBLE);
        realPlayBtn.setBackgroundResource(R.drawable.play_stop_selector);
    }

    private void setRealPlaySuccessUI(){
        indicatorView.setVisibility(INVISIBLE);
        indicatorView.requestLayout();
        realPlayBtn.setBackgroundResource(R.drawable.play_stop_selector);
    }

    private void setRealPlayStopUI(){
        enableRealView(false);
        indicatorView.setVisibility(INVISIBLE);

        realPlayBtn.setBackgroundResource(R.drawable.play_play_selector);
    }

    private void setRealPlayFailUI(String text){
        indicatorView.setVisibility(INVISIBLE);

        videoTipsView.setVisibility(VISIBLE);
        videoTips.setText(text);
        videoTips.requestLayout();
    }

    private void enableRealView(boolean enable){
        realSoundBtn.setEnabled(enable);
        realPictureBtn.setEnabled(enable);
        realVideoBtn.setEnabled(enable);
    }

    private void handlePlaySuccess(Message msg){
        mStatus = RealPlayStatus.STATUS_PLAY;

        setRealPlaySuccessUI();
        enableRealView(true);

        startThread();

        if(!mLocalInfo.isSoundOpen() && mSoundActive){
            playSound(false);
            mSoundActive = false;
        }
    }

    private void handlePlayFail(Object object){
        int errorCode = 0;
        if (object != null) {
            ErrorInfo errorInfo = (ErrorInfo) object;
            errorCode = errorInfo.errorCode;
          //  LogUtil.debugLog(TAG, "handlePlayFail:" + errorInfo.errorCode);
        }

        if(EzvizErrorCode.PLAY_RELEASE_FAIL == errorCode){
            return;
        }

        stopRealPlay();
        updateRealPlayFailUI(errorCode);

        playSound(true);
        stopRecord(false);
    }

    private void updateRealPlayFailUI(int errorCode) {
        try {
            String txt = null;
          //  LogUtil.debugLog(TAG, "updateRealPlayFailUI: errorCode:" + errorCode);

            switch (errorCode) {
                case ErrorCode.ERROR_TRANSF_ACCESSTOKEN_ERROR:
                    return;
                case ErrorCode.ERROR_CAS_MSG_PU_NO_RESOURCE: {
                    txt = EzvizLanguage.getString("Max connection");
                    break;
                }
                case ErrorCode.ERROR_INNER_DEVICE_NULLINFO: {
                    txt = EzvizLanguage.getString("Invalid device");
                    break;
                }
                case ErrorCode.ERROR_TRANSF_DEVICE_OFFLINE:
                    if (mCameraInfo != null) {
                        mCameraInfo.setIsShared(0);
                    }

                    txt = EzvizLanguage.getString("Offline device");
                    break;
                case ErrorCode.ERROR_INNER_STREAM_TIMEOUT: {
                    txt = EzvizLanguage.getString("Connect fail");
                    break;
                }
                case ErrorCode.ERROR_WEB_CODE_ERROR:
                    break;
                case ErrorCode.ERROR_WEB_HARDWARE_SIGNATURE_OP_ERROR:
                    break;
                case ErrorCode.ERROR_TRANSF_TERMINAL_BINDING:
                    txt = "Please close the terminal binding on the fluorite client";
                    break;
                case ErrorCode.ERROR_INNER_VERIFYCODE_NEED:
                case ErrorCode.ERROR_INNER_VERIFYCODE_ERROR: {
                    if(ezvizModule != null){
                        WritableMap map = new WritableNativeMap();
                        map.putString("serialId",mCameraInfo.getDeviceSerial());
                        map.putInt("channelId",mCameraInfo.getCameraNo());
                        ezvizModule.nativeCallRn(EzvizConstant.VIDEO_ENCRYPTED, map);
                    }

                    txt = EzvizLanguage.getString("Verify code");
                    break;
                }
                case ErrorCode.ERROR_STREAM_VTDU_STATUS_402: {
                    txt = EzvizLanguage.getString("No record file");
                    break;
                }
                case ErrorCode.ERROR_STREAM_VTDU_STATUS_451: {
                    txt = EzvizLanguage.getString("Stream type error");
                    break;
                }
                case ErrorCode.ERROR_STREAM_VTDU_STATUS_544:{
                    txt = EzvizLanguage.getString("No video source");
                    break;
                }
                case ErrorCode.ERROR_EXTRA_SQUARE_NO_SHARING:
                default:
                    txt = EzvizLanguage.getString("Play fail") + "(" +  String.valueOf(errorCode) + ")";
                    break;
            }

            setRealPlayStopUI();
            if (!TextUtils.isEmpty(txt)) {
                setRealPlayFailUI(txt);
            }
        }catch (Exception ex){
        }
    }

    private void playSound(boolean enable){
        if(mEZPlayer == null || mLocalInfo == null){
            return;
        }

        if (!enable){
            realSoundBtn.setBackgroundResource(R.drawable.ezopen_vertical_preview_sound_selector);
            mEZPlayer.openSound();
        }else{
            realSoundBtn.setBackgroundResource(R.drawable.ezopen_vertical_preview_sound_off_selector);
            mEZPlayer.closeSound();
        }

        ezvizModule.nativeCallRn(EzvizConstant.ON_SOUND,false);
        mLocalInfo.setSoundOpen(!enable);
    }

    private void setQualityMode() {
            Thread thr = new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        EZOpenSDK.getInstance().setVideoLevel(
                                mCameraInfo.getDeviceSerial(),
                                mCameraInfo.getCameraNo(),
                                mCameraInfo.getVideoLevel().getVideoLevel());
                        sendMessage(MSG_SET_VEDIOMODE_SUCCESS,0);
                    } catch (BaseException e) {
                        e.printStackTrace();
                        sendMessage(MSG_SET_VEDIOMODE_FAIL,0);
                    }
                }
            }) {
            };
            thr.start();
    }

    private void handleQualitySuccess(){
        stopRealPlay();
        SystemClock.sleep(500);
        startRealPlay();

        if (ezvizModule != null) {
            ezvizModule.nativeCallRn(EzvizConstant.VIDEO_LEVEL, true);
        }
    }

    private void handleQualityFail(){
        if (ezvizModule != null) {
            ezvizModule.nativeCallRn(EzvizConstant.VIDEO_LEVEL, false);
        }
    }

    /**
     * Full screen layout and functions.
     */
    private void onFullScreenClick(){
        mFullScreen = !mFullScreen;
        if (ezvizModule != null) {
            ezvizModule.nativeCallRn(EzvizConstant.FULLSCREEN_SUCCESS, mFullScreen);
        }

        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                if(mFullScreen){
                    realFullScreen.setBackgroundResource(R.drawable.fullscreen_button_selector);
                }else{
                    realFullScreen.setBackgroundResource(R.drawable.preview_enlarge_selector);
                }
            }
        },500);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        switch (keyCode){
            case KeyEvent.KEYCODE_BACK:
                if(mFullScreen){
                    onFullScreenClick();
                }
                break;
            default:
                break;
        }

        return super.onKeyDown(keyCode, event);
    }

    /**
     * ============================================================
     * Surface holder callbacks.
     */
    @Override
    public void surfaceCreated(SurfaceHolder holder) {
        synchronized (mLockPlayer){
            if (mEZPlayer != null){
                mEZPlayer.setSurfaceHold(holder);
            }
        }

        mSurfaceHolder = holder;
    }

    @Override
    public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) {

    };

    @Override
    public void surfaceDestroyed(SurfaceHolder holder) {
        synchronized (mLockPlayer){
            if (mEZPlayer != null){
                mEZPlayer.setSurfaceHold(null);
            }
        }

        mSurfaceHolder = null;
    }

    @Override
    protected void onDetachedFromWindow() {
        stopRealPlay();
        playSound(true);
        stopRecord(false);

        release();
        mActionListener.stopListen();
        super.onDetachedFromWindow();
    }

    @Override
    public void requestLayout() {
        super.requestLayout();
        post(measureAndLayout);
    }

    private final Runnable measureAndLayout = new Runnable() {
        @Override
        public void run() {
            measure(
                    MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
                    MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
            layout(getLeft(), getTop(), getRight(), getBottom());
        }
    };

    @Override
    protected void onWindowVisibilityChanged(int visibility) {
        if (visibility == 8 && mStatus == RealPlayStatus.STATUS_START ||
                mStatus == RealPlayStatus.STATUS_PLAY){
            stopRealPlay();
            mPlayActive = true;
        } else if(visibility == 0 && mPlayActive){
            startRealPlay();
            mPlayActive = false;
        }

        if (visibility == 8 && mLocalInfo.isSoundOpen()){
            playSound(true);
            mSoundActive = true;
        }

        if(visibility == 8){
            stopRecord(false);
        }
        super.onWindowVisibilityChanged(visibility);
    }

    @SuppressLint("NewApi")
    @Override
    public boolean handleMessage(Message msg) {
        switch (msg.what) {
            case EZRealPlayConstants.MSG_REALPLAY_PLAY_SUCCESS:
                handlePlaySuccess(msg);
                break;
            case EZRealPlayConstants.MSG_REALPLAY_PLAY_FAIL:
                handlePlayFail(msg.obj);
                break;
            case EzvizMessage.MSG_AUTO_PREVIEW:
                autoPreviewEx();
                break;
            case EzvizMessage.MSG_AUTO_RESUME:
                autoResumeEx();
                break;
            case EzvizMessage.MSG_AUTO_STOP:
                autoStopEx();
                break;
            case EzvizMessage.MSG_CAPTURE_ENABLE:
                onCaptureEnable();
                break;
            case EzvizMessage.MSG_CAPTURE_TOAST:
                onCaptureToast();
                break;
            case EzvizMessage.MSG_RECORD_FINISH:
                stopRecord(true);
                //onRecordFinish();
                break;
            case EzvizMessage.MSG_RECORD_SUCCESS:
                onRecordFinish();
                break;
            case EzvizMessage.MSG_STATUS_PAUSE:
                onPausePlayStatus();
                break;
            case EzvizMessage.MSG_UPDATE_RECORD:
                onUpdateRecordTips(msg.arg1);
                break;
            case EzvizMessage.MSG_AUTO_HANDLE:{
                onAutoStop();
                break;
            }
            case EzvizMessage.MSG_RECORD_UPDATE:{
                onUpdateRecordUI();
                break;
            }
            case EzvizMessage.MSG_EXIT_FULLSCREEN:{
                if(mFullScreen){
                    onFullScreenClick();
                }
                break;
            }
            case EzvizMessage.MSG_DO_ATTACHMENT:{
                if(msg.arg1 == 0){
                    onCapture();
                }else{
                    onRecord();
                }
                break;
            }
            case EzvizMessage.MSG_SET_VIDEO_LEVEL:{
                setQualityMode();
                break;
            }
            case MSG_SET_VEDIOMODE_SUCCESS:{
                handleQualitySuccess();
                break;
            }
            case MSG_SET_VEDIOMODE_FAIL:{
                handleQualityFail();
                break;
            }
            default:
                break;
        }
        return false;
    }

    public void sendMessage(int msg, int arg1) {
        if (mHandler != null) {
            Message message = Message.obtain();
            message.what = msg;
            message.arg1 = arg1;
            mHandler.sendMessage(message);
        }
    }

    /**
     * ============================================================
     * Capture picture.
     */
    private void onCapture(){
        // Toast when prompt SD card is not available.
        if (!SDCardUtil.isSDCardUseable() || (SDCardUtil.getSDCardRemainSize() < SDCardUtil.PIC_MIN_MEM_SPACE)) {
            Utils.showToast(this.getContext(), EzvizLanguage.getString("Insufficient memory"));
            return;
        }

        if(mFullScreen){
            onFullScreenClick();
        }

        realPictureBtn.setEnabled(false);
        realVideoBtn.setEnabled(false);

        if(mEZPlayer != null){
            Thread thr = new Thread(){
                @Override
                public void run() {
                    Bitmap bmp = mEZPlayer.capturePicture();
                    if(bmp != null){
                        try {
                            Date date = new Date();
                                final String path = Environment.getExternalStorageDirectory().getPath() + "/StoreViu/Capture/" + String.format("%tY", date)
                                    + String.format("%tm", date) + String.format("%td", date) + "/"
                                    + String.format("%tH", date) + String.format("%tM", date) + String.format("%tS", date) + String.format("%tL", date) +".jpg";

                            if (TextUtils.isEmpty(path)) {
                                bmp.recycle();
                                bmp = null;
                                return;
                            }

                            EZUtils.saveCapturePictrue(path, bmp);

                            if (ezvizModule != null){
                                ezvizModule.nativeCallRn(EzvizConstant.CAPTURE_SUCCESS, path);
                            }

                            if(mLocalInfo != null && mLocalInfo.isSoundOpen()){
                                playSound(true);
                                //mSoundActive = true;
                            }

                        }catch (InnerException ex){
                            ex.printStackTrace();
                        }finally {
                            sendMessage(EzvizMessage.MSG_CAPTURE_ENABLE, 0);

                            if (bmp != null) {
                                bmp.recycle();
                                bmp = null;
                                return;
                            }
                        }
                    }else{
                        sendMessage(EzvizMessage.MSG_CAPTURE_TOAST, 0);
                    }

                    super.run();
                }
            };

            thr.start();
        }
    }

    private void onCaptureEnable(){
        realPictureBtn.setEnabled(true);
        realVideoBtn.setEnabled(true);
    }

    private void onCaptureToast(){
        onCaptureEnable();
        Toast.makeText(activity.getBaseContext(), EzvizLanguage.getString("Capture fail"),
                Toast.LENGTH_SHORT).show();
    }
    /**
     * ============================================================
     * Video Recorder.
     */
    private void onRecord(){
        if (!SDCardUtil.isSDCardUseable() || (SDCardUtil.getSDCardRemainSize() < SDCardUtil.PIC_MIN_MEM_SPACE)) {
            Utils.showToast(this.getContext(), EzvizLanguage.getString("Insufficient memory"));
            return;
        }

        if(!mRecordActive){
            startRecord();
        }else{
            realVideoBtn.setEnabled(false);
            sendMessage(EzvizMessage.MSG_RECORD_FINISH,0);
        }
    }

    private void startRecord(){
        java.util.Date date = new java.util.Date();
        mRecordPath = Environment.getExternalStorageDirectory().getPath() + "/StoreViu/Record/" + String.format("%tY", date)
                + String.format("%tm", date) + String.format("%td", date) + "/"
                + String.format("%tH", date) + String.format("%tM", date) + String.format("%tS", date) + String.format("%tL", date) + ".mp4";

        if(mEZPlayer != null && mEZPlayer.startLocalRecordWithFile(mRecordPath)){
            mLastClickTime = System.currentTimeMillis();

            startUpdateTimer();
            mRecordActive = true;

            realPictureBtn.setEnabled(false);
            realVideoBtn.setBackgroundResource(R.drawable.record_video_tips_selector);
        }
    }

    private void stopRecord(boolean success){
        mRecordSuccess = success;

        if(!mRecordActive){
            return;
        }

        stopUpdateTimer();

        long timeOffset = System.currentTimeMillis()-mLastClickTime;
        if(timeOffset < EzvizConstant.MIN_RECORD_TIME){
            new Handler().postDelayed(new Runnable() {
                @Override
                public void run() {
                    sendMessage(EzvizMessage.MSG_RECORD_UPDATE,0);
                }
            },EzvizConstant.MIN_RECORD_TIME-timeOffset);
        }else{
            onUpdateRecordUI();
        }
    }

    private void onUpdateRecordUI(){
        if(mEZPlayer != null){
            mEZPlayer.stopLocalRecord();
        }

        mRecordActive = false;
        realPictureBtn.setEnabled(true);
        realVideoBtn.setBackgroundResource(R.drawable.ezopen_vertical_preview_video_selector);
    }

    private void startUpdateTimer(){
        recordTipsView.setVisibility(VISIBLE);

        mRecordTime = EzvizConstant.MAX_RECORD_TIME;
        mUpdateTimer = new Timer();
        mUpdateTimerTask = new TimerTask() {
            @Override
            public void run() {
                if(mRecordTime != -1){
                    sendMessage(EzvizMessage.MSG_UPDATE_RECORD, mRecordTime);
                    mRecordTime--;

                    if(mRecordTime == -1){
                        sendMessage(EzvizMessage.MSG_RECORD_FINISH,0);
                    }
                }
            }
        };

        mUpdateTimer.schedule(mUpdateTimerTask,0,1000);
    }

    private void onUpdateRecordTips(int timeStamp){
        if(videoRecordTips != null) {
            videoRecordTips.setText(String.format("%02d",timeStamp));
        }
    }

    private void stopUpdateTimer(){
        recordTipsView.setVisibility(INVISIBLE);

        if(mUpdateTimer != null){
            mUpdateTimer.cancel();
            mUpdateTimer = null;
        }

        if(mUpdateTimerTask != null){
            mUpdateTimerTask.cancel();
            mUpdateTimerTask = null;
        }
    }

    private void onRecordFinish(){
        if(!mRecordPath.equals("")){
            File file = new File(mRecordPath);
            if(!file.renameTo(file)){
                new Handler().postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        sendMessage(EzvizMessage.MSG_RECORD_SUCCESS,0);
                    }
                },300);
                return;
            }
        }

        if(mLocalInfo != null && mLocalInfo.isSoundOpen()){
            playSound(true);
            mSoundActive = true;
        }

        if(mFullScreen){
            onFullScreenClick();
        }

        if(ezvizModule != null && !mRecordPath.equals("")){
            ezvizModule.nativeCallRn(EzvizConstant.RECORD_SUCCESS, mRecordPath);
        }

        realVideoBtn.setEnabled(true);
    }

    public void setCategory(Boolean category) {
        mCategory = category;
    }

    /**
     * React native functions.
     */
    public void autoPreview(EZCameraInfo cameraInfo,String verifyCode){
        mVerifyCode = verifyCode;
        if (mCameraInfo == null || !cameraInfo.getDeviceSerial().equals(mCameraInfo.getDeviceSerial()) ||
                cameraInfo.getCameraNo() != mCameraInfo.getCameraNo()){

            mCameraInfo = cameraInfo;
            sendMessage(EzvizMessage.MSG_AUTO_PREVIEW,0);
        } else {
            sendMessage(EzvizMessage.MSG_AUTO_RESUME,0);
        }
    }

    private void autoPreviewEx(){
        if (mEZPlayer != null){
            stopRealPlay();
            playSound(true);
            stopRecord(false);

            synchronized (mLockPlayer){
                mEZPlayer.release();
                mEZPlayer = null;
            }
        }

        mStatus = RealPlayStatus.STATUS_INIT;
        startRealPlay();
    }

    public void stopPreview(){
        sendMessage(EzvizMessage.MSG_AUTO_STOP,0);
    }

    private void onAutoStop(){
        stopRealPlay();
        setRealPlayStopUI();

        playSound(true);
        stopRecord(false);
    }

    private void autoStopEx(){
        stopRealPlay();
        setRealPlayStopUI();

        playSound(true);
        stopRecord(false);

        mCameraInfo = null;
    }

    private void autoResumeEx(){
        if (mStatus != RealPlayStatus.STATUS_START &&
                mStatus != RealPlayStatus.STATUS_PLAY){
            startRealPlay();
        }

        playSound(true);
        stopRecord(false);
    }

    public void release(){
        synchronized (mLockPlayer){
            if (mEZPlayer != null){
                if(mStatus == RealPlayStatus.STATUS_START ||
                        mStatus == RealPlayStatus.STATUS_PLAY){
                    mEZPlayer.stopRealPlay();
                }

                mEZPlayer.release();
                mEZPlayer = null;
            }
        }

        mCameraInfo = null;
        mStatus = RealPlayStatus.STATUS_INIT;
    }

    public void quitFullScreen(){
        if(mFullScreen){
            onFullScreenClick();
        }
    }

    public void pausePlayStatus(){
        sendMessage(EzvizMessage.MSG_STATUS_PAUSE,0);
    }

    private void onPausePlayStatus(){
        if(mLocalInfo != null && mLocalInfo.isSoundOpen()){
            playSound(true);
        }

        stopRecord(false);
    }

    public void setVerifyCode(String code){
        mVerifyCode = code;
        autoPreviewEx();
    }

    public void exitFullScreen(){
        sendMessage(EzvizMessage.MSG_EXIT_FULLSCREEN,0);
    }

    public void setVideoLevel(EZCameraInfo cameraInfo){
        mCameraInfo = cameraInfo;
        sendMessage(EzvizMessage.MSG_SET_VIDEO_LEVEL, 0);
    }

    /**
     * Remote patrol attachments
     */
    private void onAttachment(int msg){
        if (ezvizModule != null){
            ezvizModule.nativeCallRn(EzvizConstant.MAX_ATTACHMENT, msg);
        }
    }

    public void doAttachment(int code){
        sendMessage(EzvizMessage.MSG_DO_ATTACHMENT,code);
    }
}
