package com.adv.player.ezviz;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.os.Environment;
import android.os.Handler;
import android.os.Message;
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
import com.adv.player.Utils.DeviceRecordFile;
import com.adv.player.Utils.EzvizConstant;
import com.adv.player.Utils.EzvizLanguage;
import com.adv.player.Utils.EzvizMessage;
import com.adv.player.Utils.ManualResetEvent;
import com.adv.player.Utils.PlaybackStatus;
import com.adv.player.common.EZUtils;
import com.adv.player.module.EzvizModule;
import com.example.ezvizplayer.R;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.videogo.errorlayer.ErrorInfo;
import com.videogo.exception.ErrorCode;
import com.videogo.exception.InnerException;
import com.videogo.openapi.EZGlobalSDK;
import com.videogo.openapi.EZOpenSDK;
import com.videogo.openapi.EZOpenSDKListener;
import com.videogo.openapi.EZPlayer;
import com.videogo.openapi.bean.EZCameraInfo;
import com.videogo.openapi.bean.EZDeviceRecordFile;
import com.videogo.remoteplayback.RemotePlayBackMsg;
import com.videogo.util.LocalInfo;
//import com.videogo.util.LogUtil;
import com.videogo.util.SDCardUtil;
import com.videogo.util.Utils;
import com.videogo.widget.CheckTextButton;

import java.io.File;
import java.util.Calendar;
import java.util.Date;
import java.util.Timer;
import java.util.TimerTask;

public class EzvizPlaybackActivity extends LinearLayout implements SurfaceHolder.Callback,
        Handler.Callback {
    private static final String TAG = EzvizPlaybackActivity.class.getSimpleName();
    private static final int MSG_PLAY_NO_FILE = 1001;

    private EzvizModule ezvizModule = null;
    private ActionListener mActionListener = null;
    private Object mLockPlayer = new Object();

    private SurfaceView mSurfaceView = null;
    private SurfaceHolder mSurfaceHolder = null;

    private EZPlayer mEZPlayer = null;
    private Handler mHandler = null;

    private EZCameraInfo mCameraInfo = null;

    private DeviceRecordFile mRecordFile = null;
    private EZDeviceRecordFile mCurrentFile = null;

    private Thread mPlayThread = null;
    private Boolean mExitPlay = false;
    private ManualResetEvent mOSDEvent = null;

    private int mStatus = PlaybackStatus.STATUS_INIT;
    private Boolean mPlayActive = false;
    private Boolean mSoundActive = false;
    private LocalInfo mLocalInfo = null;
    private Calendar mPlayTime = Calendar.getInstance();

    private Activity activity = null;
    private RelativeLayout indicatorView;
    private RelativeLayout videoTipsView;
    private TextView videoTips;
    private RelativeLayout recordTipsView;
    private TextView videoRecordTips;

    private Boolean mCapture = true;
    // Playback controls.
    private View rootView = null;
    private View playbackControls = null;

    private ImageButton playbackBtn = null;
    private ImageButton playbackBackwardBtn = null;
    private ImageButton playbackForwardBtn = null;
    private ImageButton playbackSoundBtn = null;
    private ImageButton playbackCaptureBtn = null;
    private ImageButton playbackRecordBtn = null;
    private CheckTextButton fullScreenBtn = null;

    // Full Screen.
    private Boolean mFullScreen = false;
    private Boolean mRecordActive = false;
    private Timer mUpdateTimer = null;
    private TimerTask mUpdateTimerTask = null;
    private String mRecordPath = "";
    private int mRecordTime = EzvizConstant.MAX_RECORD_TIME;
    private int mPlayTotalTime = 0;
    private String mVerifyCode = "";
    private long mLastClickTime = 0L;
    private Boolean mRecordSuccess = false;
    private Boolean mCategory = false;
    /**
     * ============================================================
     * Constructor & init layout
     */
    public EzvizPlaybackActivity(Context context, @androidx.annotation.Nullable AttributeSet attrs) {
        super(context, attrs);

        initData(context);
        initView();
    }

    private void initData(Context context){
        ezvizModule = ((ThemedReactContext)context).getNativeModule(EzvizModule.class);
        //ezvizModule.setPlaybackActivity(this);

        LocalInfo.init(ezvizModule.getApplication(), ezvizModule.getAppKey());
        mLocalInfo = LocalInfo.getInstance();
        mLocalInfo.setSoundOpen(false);

        mHandler = new Handler(this);
        mOSDEvent = new ManualResetEvent(false);

        mActionListener = new ActionListener(this.getContext());
        mActionListener.setInterface(new ActionInterface() {
            @Override
            public void onRecent() {
                if (mStatus == PlaybackStatus.STATUS_START ||
                        mStatus == PlaybackStatus.STATUS_PLAY){
                    pausePlayback();
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

    private void startOSDThread(){
        updatePlayTime(false);
        mExitPlay = false;

        mPlayThread = new Thread(){
            @Override
            public void run() {
                while (!mExitPlay){
                    try {
                        mOSDEvent.WaitOne();

                        synchronized (mLockPlayer){
                            if (mEZPlayer != null){
                                Calendar osdTime = mEZPlayer.getOSDTime();
                                if (osdTime != null){
                                    mPlayTime = osdTime;
                                }
                            }
                        }

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

    private void stopOSDThread(){
        mExitPlay = true;
        mOSDEvent.Set();

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
        rootView = LayoutInflater.from(this.getContext()).inflate(R.layout.ez_playback_page, this);
        rootView.setFocusableInTouchMode(true);
        rootView.requestFocus();

        initSurfaceView();
        initPlaybackView();
    }

    private void initSurfaceView(){
        mSurfaceView = findViewById(R.id.playback_sv);

        mSurfaceHolder = mSurfaceView.getHolder();
        mSurfaceHolder.addCallback(this);

        indicatorView = rootView.findViewById(R.id.playback_loading);
        videoTipsView = rootView.findViewById(R.id.playback_tips);
        videoTips = videoTipsView.findViewById(R.id.tv_video_tips);

        recordTipsView = rootView.findViewById(R.id.playback_record_prompt);
        videoRecordTips = recordTipsView.findViewById(R.id.video_record_tv);
    }

    /**
     * ============================================================
     * Playback controls.
     */
    private void initPlaybackView(){
        playbackControls = rootView.findViewById(R.id.playback_view);

        playbackBtn = playbackControls.findViewById(R.id.playback_play_btn);
        playbackBackwardBtn = playbackControls.findViewById(R.id.playback_backward_btn);
        playbackForwardBtn = playbackControls.findViewById(R.id.playback_forward_btn);
        playbackSoundBtn = playbackControls.findViewById(R.id.playback_sound_btn);
        playbackCaptureBtn = playbackControls.findViewById(R.id.playback_capture_btn);
        playbackRecordBtn = playbackControls.findViewById(R.id.playback_record_btn);
        fullScreenBtn = playbackControls.findViewById(R.id.playback_fullscreen_button);

        playbackBtn.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                switch (mStatus){
                    case PlaybackStatus.STATUS_INIT:
                    case PlaybackStatus.STATUS_START:
                    case PlaybackStatus.STATUS_STOP:
                        startPlayback();
                        seekPlayback();
                        startOSDThread();
                        break;
                    case PlaybackStatus.STATUS_PLAY:
                        pausePlayback();

                        if(mLocalInfo.isSoundOpen()){
                            playSound(true);
                            mSoundActive = true;
                        }

                        stopRecord(false);
                        break;
                    case PlaybackStatus.STATUS_PAUSE:
                        resumePlayback();

                        if(mSoundActive){
                            playSound(false);
                        }
                        break;
                    default:
                        break;
                }
            }
        });

        playbackBackwardBtn.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                stopRecord(false);

                setPlaybackLoadingUI();
                mPlayTime.add(Calendar.SECOND,-10);
                seekPlayback();
            }
        });

        playbackForwardBtn.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                stopRecord(false);

                setPlaybackLoadingUI();
                mPlayTime.add(Calendar.SECOND,10);
                seekPlayback();
            }
        });

        playbackSoundBtn.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                playSound(mLocalInfo.isSoundOpen());
            }
        });

        playbackCaptureBtn.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                onCapture();
            }
        });

        playbackRecordBtn.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                onRecordClick();
            }
        });

        fullScreenBtn.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                onFullScreenClick();
            }
        });

        enablePlaybackView(false);
    }

    /**
     * Playback functions.
     */
    private void startPlayback(){
      //  LogUtil.debugLog(TAG, "startPlayback");

        if (mStatus == PlaybackStatus.STATUS_START || mStatus == PlaybackStatus.STATUS_PLAY) {
            return;
        }

        setPlaybackLoadingUI();

        synchronized (mLockPlayer){
            if ( mEZPlayer == null && mCameraInfo != null){
                if (!mCategory){
                    mEZPlayer = EZOpenSDK.getInstance().createPlayer(
                            mCameraInfo.getDeviceSerial(),
                            mCameraInfo.getCameraNo());
                }
                else {
                    mEZPlayer = EZGlobalSDK.getInstance().createPlayer(
                            mCameraInfo.getDeviceSerial(),
                            mCameraInfo.getCameraNo());
                }
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
            }
        }
    }

    private void seekPlayback(){
        updatePlayTime(false);
        synchronized (mLockPlayer){
            if (mPlayTime != null && mEZPlayer != null){
                Calendar endTime = (Calendar) mPlayTime.clone();
                endTime.add(Calendar.YEAR,1);

                mEZPlayer.startPlayback(mPlayTime, endTime);
            }
        }
    }

    private void stopPlayback(){
      //  LogUtil.debugLog(TAG, "stopPlayback");
        mStatus = PlaybackStatus.STATUS_STOP;

        stopOSDThread();

        synchronized (mLockPlayer){
            if(mEZPlayer != null){
                mEZPlayer.stopPlayback();
            }
        }

        if(videoTipsView != null){
            videoTipsView.setVisibility(VISIBLE);
            videoTips.setText("");
        }

        enablePlaybackView(false);
    }

    private void pausePlayback(){
      //  LogUtil.debugLog(TAG, "pausePlayback");

        mOSDEvent.Reset();
        setPlaybackPauseUI();

        synchronized (mLockPlayer){
            if(mEZPlayer != null){
                mEZPlayer.pausePlayback();
            }
        }
    }

    private void resumePlayback(){
        //LogUtil.debugLog(TAG, "resumePlayback");

        updatePlayTime(false);
        mOSDEvent.Set();
        setPlaybackLoadingUI();

        seekPlayback();
    }

    private void playSound(boolean enable){
        if(mEZPlayer == null || mLocalInfo == null){
            return;
        }

        if (!enable){
            playbackSoundBtn.setBackgroundResource(R.drawable.ezopen_vertical_preview_sound_selector);
            mEZPlayer.openSound();
        }else{
            playbackSoundBtn.setBackgroundResource(R.drawable.ezopen_vertical_preview_sound_off_selector);
            mEZPlayer.closeSound();
        }

        mLocalInfo.setSoundOpen(!enable);
    }

    private void setPlaybackLoadingUI(){
        mStatus = PlaybackStatus.STATUS_START;

        videoTipsView.setVisibility(INVISIBLE);
        indicatorView.setVisibility(VISIBLE);
        playbackBtn.setBackgroundResource(R.drawable.play_stop_selector);
    }

    private void setPlaybackSuccessUI(){
        mStatus = PlaybackStatus.STATUS_PLAY;

        indicatorView.setVisibility(INVISIBLE);
        indicatorView.requestLayout();
        playbackBtn.setBackgroundResource(R.drawable.play_stop_selector);
    }

    private void setPlaybackPauseUI(){
        mStatus = PlaybackStatus.STATUS_PAUSE;

        enablePlaybackView(false);
        playbackBtn.setBackgroundResource(R.drawable.play_play_selector);
    }

    private void setPlaybackStopUI(){
        enablePlaybackView(false);
        indicatorView.setVisibility(INVISIBLE);

        playbackBtn.setBackgroundResource(R.drawable.play_play_selector);
    }

    private void setPlaybackFailUI(String text){
        indicatorView.setVisibility(INVISIBLE);

        videoTipsView.setVisibility(VISIBLE);
        videoTips.setText(text);
        videoTips.requestLayout();
    }

    private void enablePlaybackView(boolean enable){
        playbackBackwardBtn.setEnabled(enable);
        playbackForwardBtn.setEnabled(enable);
        playbackSoundBtn.setEnabled(enable);
        if(this.mCapture)
        {
            playbackCaptureBtn.setEnabled(enable);
            playbackRecordBtn.setEnabled(enable);
        }else{
            playbackCaptureBtn.setEnabled(false);
            playbackRecordBtn.setEnabled(false);
        }
    }

    private void handlePlaySuccess(Message msg){
        mStatus = PlaybackStatus.STATUS_PLAY;
        mOSDEvent.Set();

        setPlaybackSuccessUI();
        enablePlaybackView(true);

        if(!mLocalInfo.isSoundOpen() && mSoundActive){
            playSound(false);
            mSoundActive = false;
        }

        // Handle audio for forward and backward.
        if(mLocalInfo != null && mLocalInfo.isSoundOpen()){
            if(mEZPlayer != null){
                mEZPlayer.openSound();
            }
        }
    }

    private void handlePlayFail(Object object){
        int errorCode = 0;
        if (object != null) {
            ErrorInfo errorInfo = (ErrorInfo) object;
            errorCode = errorInfo.errorCode;
          //  LogUtil.debugLog(TAG, "handlePlayFail:" + errorInfo.errorCode);
        }

        stopPlayback();
        updateRealPlayFailUI(errorCode);

        playSound(true);
        stopRecord(false);
    }

    private void handlePlayFinish(){
        if (mStatus == PlaybackStatus.STATUS_PLAY){

            mStatus = PlaybackStatus.STATUS_START;

            videoTipsView.setVisibility(INVISIBLE);
            indicatorView.setVisibility(VISIBLE);
        }
    }

    private void handlePlayEnd(){
        stopPlayback();
        setPlaybackStopUI();
        setPlaybackFailUI("Play completed");

        playSound(true);
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
                case ErrorCode.ERROR_TRANSF_DEVICE_OFFLINE: {
                    if (mCameraInfo != null) {
                        mCameraInfo.setIsShared(0);
                    }

                    txt = EzvizLanguage.getString("Offline device");
                    break;
                }
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

            setPlaybackStopUI();
            if (!TextUtils.isEmpty(txt)) {
                setPlaybackFailUI(txt);
            }
        }catch (Exception ex){
        }
    }

    /**
     * Full screen.
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
                    fullScreenBtn.setBackgroundResource(R.drawable.fullscreen_button_selector);
                }else{
                    fullScreenBtn.setBackgroundResource(R.drawable.preview_enlarge_selector);
                }
            }
        },500);
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

    @SuppressLint("NewApi")
    @Override
    public boolean handleMessage(Message msg) {
        switch (msg.what) {
            case RemotePlayBackMsg.MSG_REMOTEPLAYBACK_PLAY_SUCCUSS:
                handlePlaySuccess(msg);
                break;
            case RemotePlayBackMsg.MSG_REMOTEPLAYBACK_PLAY_FAIL:
                handlePlayFail(msg.obj);
                break;
            case RemotePlayBackMsg.MSG_REMOTEPLAYBACK_PLAY_FINISH:
                //handlePlayFinish();
                break;
            case MSG_PLAY_NO_FILE:
                //handlePlayEnd();
                break;
            case EzvizMessage.MSG_AUTO_PLAYBACK:
                autoPlaybackEx();
                break;
            case EzvizMessage.MSG_AUTO_RESUME:
                autoResumeEx();
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
            default:
                break;
        }
        return false;
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

    @Override
    protected void onWindowVisibilityChanged(int visibility) {
        if (visibility == 8 && mStatus == PlaybackStatus.STATUS_START ||
                mStatus == PlaybackStatus.STATUS_PLAY){
            pausePlayback();
            mPlayActive = true;
        } else if(visibility == 0 && mPlayActive){
            resumePlayback();
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

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);
    }

    @Override
    protected void onDetachedFromWindow() {
        stopPlayback();
        playSound(true);
        stopRecord(false);

        release();
        mActionListener.stopListen();

        super.onDetachedFromWindow();
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

        playbackCaptureBtn.setEnabled(false);
        playbackRecordBtn.setEnabled(false);

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
                                mSoundActive = true;
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
        playbackCaptureBtn.setEnabled(true);
        playbackRecordBtn.setEnabled(true);
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
    private void onRecordClick(){
        if (!SDCardUtil.isSDCardUseable() || (SDCardUtil.getSDCardRemainSize() < SDCardUtil.PIC_MIN_MEM_SPACE)) {
            Utils.showToast(this.getContext(), EzvizLanguage.getString("Insufficient memory"));
            return;
        }

        if(!mRecordActive){
            startRecord();
        }else{
            playbackRecordBtn.setEnabled(false);
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

            playbackCaptureBtn.setEnabled(false);
            playbackRecordBtn.setBackgroundResource(R.drawable.video_record_tips_btn);
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
        playbackCaptureBtn.setEnabled(true);
        playbackRecordBtn.setBackgroundResource(R.drawable.ezopen_vertical_preview_video_selector);
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

        playbackRecordBtn.setEnabled(true);
    }

    private void onUpdateRecordTips(int timeStamp){
        if(videoRecordTips != null) {
            videoRecordTips.setText(String.format("%02d",timeStamp));
        }
    }

    private void onAutoStop(){
        stopPlayback();
        playSound(true);
        stopRecord(false);

        mStatus = PlaybackStatus.STATUS_INIT;
        playbackBtn.setBackgroundResource(R.drawable.play_play_selector);
    }

    public void setCategory(Boolean category){
        mCategory = category;
    }

    /**
     * React native functions.
     */
    public void autoPlayback(EZCameraInfo cameraInfo,Calendar playTime,String verifyCode){
        mVerifyCode = verifyCode;
        if (mCameraInfo == null || !mCameraInfo.getDeviceSerial().equals(cameraInfo.getDeviceSerial()) ||
                mCameraInfo.getCameraNo() != cameraInfo.getCameraNo() ||
                playTime.getTimeInMillis() != mPlayTime.getTimeInMillis() ||
                (playTime.getTimeInMillis() == mPlayTime.getTimeInMillis() &&
                mStatus == PlaybackStatus.STATUS_STOP)){
            mCameraInfo = cameraInfo;
            mPlayTime = playTime;

            sendMessage(EzvizMessage.MSG_AUTO_PLAYBACK,0);
        }else{
            sendMessage(EzvizMessage.MSG_AUTO_RESUME,0);
        }
    }

    private void autoPlaybackEx(){
        if (mEZPlayer != null){
            stopPlayback();
            playSound(true);
            stopRecord(false);

            synchronized (mLockPlayer){
                mEZPlayer.release();
                mEZPlayer = null;
            }
        }

        mStatus = PlaybackStatus.STATUS_INIT;

        startPlayback();
        seekPlayback();
        startOSDThread();
    }

    private void autoResumeEx(){
        if (mStatus == PlaybackStatus.STATUS_PAUSE){
            resumePlayback();
        }
    }

    public void release(){
        synchronized (mLockPlayer){
            if (mEZPlayer != null){
                if(mStatus == PlaybackStatus.STATUS_START ||
                        mStatus == PlaybackStatus.STATUS_PLAY ||
                        mStatus == PlaybackStatus.STATUS_PAUSE){
                    mEZPlayer.stopPlayback();
                }

                mEZPlayer.release();
                mEZPlayer = null;
            }
        }

        mStatus = PlaybackStatus.STATUS_INIT;
    }

    public void setCaptureMode(Boolean enable){
        this.mCapture = enable;
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
        autoPlaybackEx();
    }

    public void stop(){
        sendMessage(EzvizMessage.MSG_AUTO_HANDLE,0);
    }

    public void exitFullScreen(){
        sendMessage(EzvizMessage.MSG_EXIT_FULLSCREEN,0);
    }
}
