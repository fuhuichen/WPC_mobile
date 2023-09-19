package com.adv.player.ezviz;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.os.Environment;
import android.os.Handler;
import android.os.Message;
import android.os.SystemClock;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.os.Build;
import com.adv.player.Utils.EzvizConstant;
import com.adv.player.Utils.EzvizErrorCode;
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
import com.videogo.openapi.EZConstants.EZRealPlayConstants;
import com.videogo.openapi.EZGlobalSDK;
import com.videogo.openapi.EZOpenSDK;
import com.videogo.openapi.EZPlayer;
import com.videogo.openapi.bean.EZCameraInfo;
import com.videogo.remoteplayback.RemotePlayBackMsg;
import com.videogo.util.LocalInfo;
import com.videogo.util.SDCardUtil;

import java.io.File;
import java.util.Calendar;
import java.util.Date;
import android.util.Log;
public class EzvizVideoActivity extends LinearLayout implements SurfaceHolder.Callback,
        Handler.Callback{
    private static final String TAG = EzvizVideoActivity.class.getSimpleName();
    private EzvizModule ezvizModule = null;
    private Object mLockPlayer = new Object();

    private Context mContext = null;
    private SurfaceView mSurfaceView = null;
    private SurfaceHolder mSurfaceHolder = null;

    private EZPlayer mEZPlayer = null;
    private Handler mHandler = null;
    private EZCameraInfo mCameraInfo = null;

    private LocalInfo mLocalInfo = null;
    private long mLastClickTime = 0L;
    private String mRecordPath = "";

    private Activity activity = null;
    private View rootView = null;

    private Boolean mCategory = false;
    private String mVerifyCode = "";
    private int mPlayOffset = 0;
    private int mTimeStamp = 0;

    public static final int MSG_SET_VEDIOMODE_SUCCESS = 105;
    public static final int MSG_SET_VEDIOMODE_FAIL = 106;

    public EzvizVideoActivity(Context context, @androidx.annotation.Nullable AttributeSet attrs) {
        super(context, attrs);
        mContext = context;

        initData(context);
        initView();
    }

    private void initData(Context context){
        ezvizModule = ((ThemedReactContext)context).getNativeModule(EzvizModule.class);
        ezvizModule.setVideoActivity(this);

        LocalInfo.init(ezvizModule.getApplication(), ezvizModule.getAppKey());
        mLocalInfo = LocalInfo.getInstance();
        mLocalInfo.setSoundOpen(false);

        mHandler = new Handler(this);

        activity = ((ThemedReactContext) context).getCurrentActivity();
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private void initView() {
        rootView = LayoutInflater.from(this.getContext()).inflate(R.layout.ez_player_page, this);
        rootView.setFocusableInTouchMode(true);
        rootView.requestFocus();

        mSurfaceView = findViewById(R.id.sv_player);

        mSurfaceHolder = mSurfaceView.getHolder();
        mSurfaceHolder.addCallback(this);
    }


    private void handlePlaySuccess(){
        if (ezvizModule != null){
            ezvizModule.nativeCallRn(EzvizConstant.PLAY_SUCCESS, "");
        }
    }

    private void handlePlayFail(Object object){
        if ((object != null) && (ezvizModule != null)) {
            ErrorInfo errorInfo = (ErrorInfo)object;

            if (errorInfo.errorCode == ErrorCode.ERROR_INNER_VERIFYCODE_ERROR){
                WritableMap map = new WritableNativeMap();
                map.putString("serialId", mCameraInfo.getDeviceSerial());
                map.putInt("channelId", mCameraInfo.getCameraNo());

                ezvizModule.nativeCallRn(EzvizConstant.VIDEO_ENCRYPTED, map);
            }else {
                ezvizModule.nativeCallRn(EzvizConstant.VIDEO_ERROR, errorInfo.errorCode);
            }
        }
    }

    @Override
    public void surfaceCreated(SurfaceHolder holder) {
        synchronized (mLockPlayer){
            if (mEZPlayer != null){
                mEZPlayer.setSurfaceHold(holder);
            }
        }

        //mSurfaceHolder = holder;
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

//        mSurfaceHolder = null;
    }

    @Override
    protected void onDetachedFromWindow() {
        release();
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

    @SuppressLint("NewApi")
    @Override
    public boolean handleMessage(Message msg) {
        switch (msg.what) {
            case EZRealPlayConstants.MSG_REALPLAY_PLAY_SUCCESS:
            case RemotePlayBackMsg.MSG_REMOTEPLAYBACK_PLAY_SUCCUSS: {
                handlePlaySuccess();
                break;
            }
            case EZRealPlayConstants.MSG_REALPLAY_PLAY_FAIL:
            case RemotePlayBackMsg.MSG_REMOTEPLAYBACK_PLAY_FAIL:{
                handlePlayFail(msg.obj);
                break;
            }
            case EzvizMessage.MSG_VIDEO_START: {
                startVideo();
                break;
            }
            case EzvizMessage.MSG_VIDEO_STOP: {
                stopVideo();
                break;
            }
            case EzvizMessage.MSG_SEEK_PLAY: {
                seekPlayback();
                break;
            }
            case EzvizMessage.MSG_SOUND_OPEN: {
                openSound();
                break;
            }
            case EzvizMessage.MSG_SOUND_CLOSE: {
                closeSound();
                break;
            }
            case EzvizMessage.MSG_VIDEO_CAPTURE: {
                onCapture();
                break;
            }
            case EzvizMessage.MSG_RECORD_START: {
                startRecord();
                break;
            }
            case EzvizMessage.MSG_RECORD_STOP: {
                stopRecord();
                break;
            }
            case EzvizMessage.MSG_RECORD_UPDATE:{
                updateRecord();
                break;
            }
            case EzvizMessage.MSG_PLAYBACK_PAUSE:{
                pausePlayback();
                break;
            }
            case EzvizMessage.MSG_PLAYBACK_RESUME:{
                resumePlayback();
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

    // Native functions
    public void setCategory(Boolean category) {
        mCategory = category;
    }

    public void setParams(EZCameraInfo cameraInfo, int timeStamp, String verifyCode){
        mCameraInfo = cameraInfo;
        mTimeStamp = timeStamp;
        mVerifyCode = verifyCode;
    }

    public void setOffset(int offset){
        mPlayOffset = offset;
    }

    public void onHandle(int msg) {
        if (mHandler != null) {
            Message message = Message.obtain();
            message.what = msg;
            message.arg1 = 0;
            mHandler.sendMessage(message);
        }
    }

    private void startVideo(){
        stopVideo();
        SystemClock.sleep(500);

        synchronized (mLockPlayer){
            if(mEZPlayer == null){
                if (!mCategory){
                    mEZPlayer = EZOpenSDK.getInstance().createPlayer(
                            mCameraInfo.getDeviceSerial(),
                            mCameraInfo.getCameraNo());
                }else {
                    mEZPlayer = EZGlobalSDK.getInstance().createPlayer(
                            mCameraInfo.getDeviceSerial(),
                            mCameraInfo.getCameraNo());
                }
            }

            if (mEZPlayer != null){
                mEZPlayer.setHandler(mHandler);
                mEZPlayer.setPlayVerifyCode(mVerifyCode);
                mEZPlayer.setSurfaceHold(mSurfaceHolder);

                if (mTimeStamp == 0){
                    mEZPlayer.startRealPlay();
                }else {
                    Calendar calendar = Calendar.getInstance();
                    calendar.setTimeInMillis(mTimeStamp*1000L);

                    Calendar endTime = (Calendar)calendar.clone();
                    endTime.add(Calendar.YEAR,1);

                    mEZPlayer.startPlayback(calendar, endTime);
                }
            }
        }
    }

    private void stopVideo(){
        synchronized (mLockPlayer){
            if (mEZPlayer != null){
                if (!mCategory){
                    mEZPlayer.stopRealPlay();
                }else {
                    mEZPlayer.stopPlayback();
                }
            }
            mEZPlayer = null;
        }
    }

    private void pausePlayback(){
        synchronized (mLockPlayer){
            if (mEZPlayer != null){
                mEZPlayer.pausePlayback();
            }
        }
    }

    private void resumePlayback(){
        synchronized (mLockPlayer){
            if (mEZPlayer != null){
                mEZPlayer.resumePlayback();
            }
        }
    }

    private void seekPlayback(){
        synchronized (mLockPlayer){
            if (mEZPlayer != null){
                Calendar playTime = mEZPlayer.getOSDTime();
                playTime.add(Calendar.SECOND, mPlayOffset);
                mEZPlayer.seekPlayback(playTime);
            }
        }
    }

    private void openSound(){
        synchronized (mLockPlayer){
            if (mEZPlayer != null){
                mEZPlayer.openSound();
            }
        }
    }

    private void closeSound(){
        synchronized (mLockPlayer){
            if (mEZPlayer != null){
                mEZPlayer.closeSound();
            }
        }
    }

    // Video capture
    private void onCapture(){
        Log.d("Ezviz","Player OnCapture" );
        if (!sufficientMemory()){
            Log.d("Ezviz","No sufficientMemory" );
            return;
        }

        if(mEZPlayer != null){
            Thread thread = new Thread(){
                @Override
                public void run() {
                    Bitmap bmp = mEZPlayer.capturePicture();

                    if(bmp != null){
                        Log.d("Ezviz","Bmp not null" );
                        try {
                            String path = getExternalPath().replace(EzvizConstant.REPLACE_PATH,
                                    EzvizConstant.CAPTURE_PATH) +".jpg";
                            Log.d("Ezviz","EzvizConstant.REPLACE_PATH="+EzvizConstant.REPLACE_PATH );
                            Log.d("Ezviz","EzvizConstant.CAPTURE_PATH="+EzvizConstant.CAPTURE_PATH );
                            Log.d("Ezviz","EzvizConstant.CAPTURE_PATH="+ path );
                            EZUtils.saveCapturePictrue(path, bmp);

                            ezvizModule.nativeCallRn(EzvizConstant.CAPTURE_SUCCESS, path);
                        }catch (InnerException ex){
                            ex.printStackTrace();
                        }finally {
                            bmp.recycle();
                            bmp = null;
                            return;
                        }
                    }else{
                        Log.d("Ezviz","Bmp is null" );
                        ezvizModule.nativeCallRn(EzvizConstant.VIDEO_ERROR, EzvizErrorCode.ERROR_CAPTURE_FAILURE);
                    }

                    super.run();
                }
            };

            thread.start();
        }
    }

    // Video record
    private void startRecord(){
        if(sufficientMemory()){
            Date date = new Date();
            mRecordPath = getExternalPath().replace(EzvizConstant.REPLACE_PATH,
                    EzvizConstant.RECORD_PATH) + ".mp4";

            if (mEZPlayer != null){
                mEZPlayer.startLocalRecordWithFile(mRecordPath);
            }

            mLastClickTime = System.currentTimeMillis();
        }
    }

    private void stopRecord() {
        if(mEZPlayer != null){
            mEZPlayer.stopLocalRecord();

            long timeOffset = System.currentTimeMillis() - mLastClickTime;
            if (timeOffset < EzvizConstant.MIN_RECORD_TIME){
                ezvizModule.nativeCallRn(EzvizConstant.VIDEO_ERROR,
                        EzvizErrorCode.ERROR_RECORD_FAILURE);
            }else{
                onHandle(EzvizMessage.MSG_RECORD_UPDATE);
            }
        }
    }

    private void updateRecord(){
        if(!mRecordPath.equals("")){
            File file = new File(mRecordPath);
            if(!file.renameTo(file)){
                new Handler().postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        onHandle(EzvizMessage.MSG_RECORD_UPDATE);
                    }
                },300);
            }else {
                ezvizModule.nativeCallRn(EzvizConstant.RECORD_SUCCESS, mRecordPath);
            }
        }
    }

    // Common functions
    private boolean sufficientMemory(){
        if (!SDCardUtil.isSDCardUseable() || (SDCardUtil.getSDCardRemainSize() < SDCardUtil.PIC_MIN_MEM_SPACE)) {
            ezvizModule.nativeCallRn(EzvizConstant.VIDEO_ERROR, EzvizErrorCode.ERROR_INSUFFICIENT_MEMORY);
            return false;
        }

        return true;
    }

    private String getExternalPath(){
        Date date = new Date();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
        {
          return Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS).getPath()  + EzvizConstant.REPLACE_PATH
                  + String.format("%tY", date) + String.format("%tm", date) + String.format("%td", date) + "/"
                  + String.format("%tH", date) + String.format("%tM", date) + String.format("%tS", date)
                  + String.format("%tL", date);
        }
        else
        {
          return Environment.getExternalStorageDirectory().getPath() + EzvizConstant.REPLACE_PATH
                  + String.format("%tY", date) + String.format("%tm", date) + String.format("%td", date) + "/"
                  + String.format("%tH", date) + String.format("%tM", date) + String.format("%tS", date)
                  + String.format("%tL", date);
        }

    }

    // Release player
    private void release() {
        synchronized (mLockPlayer) {
            stopVideo();

            if (mEZPlayer != null) {
                mEZPlayer.release();
                mEZPlayer = null;
            }
        }

        mCameraInfo = null;
    }

    // For video level
    public void setVideoLevel(EZCameraInfo cameraInfo){
        mCameraInfo = cameraInfo;
        onHandle(EzvizMessage.MSG_SET_VIDEO_LEVEL);
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
                    onHandle(MSG_SET_VEDIOMODE_SUCCESS);
                } catch (BaseException e) {
                    e.printStackTrace();
                    onHandle(MSG_SET_VEDIOMODE_FAIL);
                }
            }
        }) {
        };
        thr.start();
    }

    private void handleQualitySuccess(){
        startVideo();

        if (ezvizModule != null) {
            ezvizModule.nativeCallRn(EzvizConstant.VIDEO_LEVEL, true);
        }
    }

    private void handleQualityFail(){
        if (ezvizModule != null) {
            ezvizModule.nativeCallRn(EzvizConstant.VIDEO_LEVEL, false);
        }
    }

}
