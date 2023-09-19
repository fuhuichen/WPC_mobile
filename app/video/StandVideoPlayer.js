import React, { Component } from 'react';
import {
    Image,
    StyleSheet, TouchableOpacity,
    View,
    findNodeHandle,
    Dimensions,
    Text,
    Platform,
    AppState, DeviceEventEmitter, ActivityIndicator,
    FlatList,
    UIManager
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import PropType from "prop-types";
import RNFS from "react-native-fs";
import I18n from 'react-native-i18n';
import Orientation from 'react-native-orientation-locker';
let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
import {isIphoneX,getStatusBarHeight,getBottomSpace} from "react-native-iphone-x-helper";
import dismissKeyboard from 'react-native-dismiss-keyboard';
import {EMITTER_PLAYER_STOP} from "../common/Constant";
import GlobalParam from "../common/GlobalParam";
import KeepAwake from 'react-native-keep-awake'
import SlideModalEx from "../components/SlideModal";
import {ColorStyles} from '../common/ColorStyles';
import MyView from './ezvizPlayer/native/MyView';
import EzvizAndroidView from './ezvizPlayer/native/EzvizAndroidView';
import EzvizPlayerIOSInterface from "./ezvizPlayer/interface/EzvizPlayerIOSInterface";
import EzvizPlayerAndroidInterface from "./ezvizPlayer/interface/EzvizPlayerAndroidInterface";
import EzvizCache from "./ezvizPlayer/util/EzvizCache";
import EzvizModal from "./ezvizPlayer/util/EzvizModal";
import ImageResizer from 'react-native-image-resizer';

export default class StandVideoPlayer extends Component {

    static propTypes ={
        createEvent: PropType.func,
        dashReady:PropType.func,
        dashError:PropType.func,
        onFullScreen:PropType.func
    }

    constructor(props){
        super(props);
        this.state = {
            height:220,
            sound:false,
            play:false,
            fullScreen: false,
            bReal: true,
            record :false,
            currentCount:0,
            error:'',
            enableCapture:true,
            loading:false,
            currentState:'play', // 'blank',play'
            isError:false,
            enableOperate:true,
            enableRecord: true,
            videoLevel:0
        }
        this.lastHeight = 220;
        this.recordFlag  = true;
        this.discardRecord = false;
        this.deviceSerial = null;
        this.cameraNo = null;
        this.beginTime = null;
        this.player = null;
        this.playerMode = 1;    // 1: ezvizPlayer
        this.seekPlay = false;
        this.netFire = false;
        this.videoLevels = Platform.OS === 'ios'? [I18n.t('LD'),I18n.t('HD')]:[];
        this.videoLevelForAndroid = [];
        this.pauseStatus = false;
    }

    componentWillMount() {
        this.listener = DeviceEventEmitter.addListener('onSetVerifyCode', this.onRead.bind(this));
        this.errorListener = DeviceEventEmitter.addListener('OnPlayerError', this.onError.bind(this));
        this.unsubscribe = NetInfo.addEventListener(state=>{
            this.onNetChange(state.isConnected);
        });

        this.recordListener = DeviceEventEmitter.addListener('OnRecordAudio', this.onRecordAudio.bind(this));

        this.captureEmitter = DeviceEventEmitter.addListener('CaptureSuccess',(msg) =>{this.afterCapture(msg)});
        this.recordEmitter = DeviceEventEmitter.addListener('RecordSuccess',(msg) =>{this.afterRecord(msg)});
        this.playSuccessEmitter = DeviceEventEmitter.addListener('PlaySuccess',(msg) =>{this.playSuccess(msg)});
        this.videoEncryptedEmitter = DeviceEventEmitter.addListener('VideoEncrypted',(msg) =>{this.videoEncrypted(msg)});
        this.videoErrorEmitter = DeviceEventEmitter.addListener('VideoError',(msg) =>{this.videoError(msg)});
        this.cancelCreateEmitter = DeviceEventEmitter.addListener('cancelCreateEvent',() =>{!this.state.sound ? this.onSound() : null});
        this.videoLevelEmitter = DeviceEventEmitter.addListener('OnVideoLevel',(msg)=>{
            if(typeof msg=== 'boolean'){
                if(msg){
                    EzvizCache.getVideoLevel(this.deviceSerial).then((res)=>{
                        this.setState({videoLevel:res});
                    });
                    this.startVideoEx(this.deviceSerial,this.cameraNo,this.beginTime);
                }
            }
            else{
                this.videoLevelForAndroid = JSON.parse(msg);
                this.videoLevelForAndroid.forEach(item=>{
                    if((item === 0 || item === 1) && !this.videoLevels.includes(I18n.t('LD'))){
                        this.videoLevels.push(I18n.t('LD'));
                    }else if((item === 2 || item === 3) &&  !this.videoLevels.includes(I18n.t('HD'))){
                        this.videoLevels.push(I18n.t('HD'));
                    }
                })
                this.startVideo(this.deviceSerial,this.cameraNo,this.beginTime);
            }
        });

        AppState.addEventListener('change', this.onAppStateChange);
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_PLAYER_STOP, (value)=>{
            AppState.removeEventListener('change', this.onAppStateChange);
            if(this.state.fullScreen) {
                this.onFullScreen();
            }
            this.pauseRecord();
            value && this.stop();
            setTimeout(()=>{
                AppState.addEventListener('change', this.onAppStateChange);
            },200);
        });
    }

    componentDidMount(){
        if(this.props.playerMode != null){
            this.playerMode = this.props.playerMode;
        }
        if(this.playerMode == 1){
            if(Platform.OS === 'ios'){
                this.player = new EzvizPlayerIOSInterface();
                this.player.setRef(this.refs.theMyView);
            }else if(Platform.OS === 'android'){
                this.player = new EzvizPlayerAndroidInterface();
            }
        }
        KeepAwake.activate();
        setTimeout(() => {
            this.props.dashReady();
        }, 1000);
    }

    componentWillUnmount(){
        this.onPauseStatus();
        this.stop();
        KeepAwake.deactivate();
        AppState.removeEventListener('change', this.onAppStateChange);
        this.dirtyTimer && clearTimeout(this.dirtyTimer);

        this.captureEmitter && this.captureEmitter.remove();
        this.recordEmitter && this.recordEmitter.remove();
        this.playSuccessEmitter && this.playSuccessEmitter.remove();
        this.videoEncryptedEmitter && this.videoEncryptedEmitter.remove();
        this.videoErrorEmitter && this.videoErrorEmitter.remove();
        this.cancelCreateEmitter && this.cancelCreateEmitter.remove();
        this.recordListener && this.recordListener.remove();
        this.videoLevelEmitter && this.videoLevelEmitter.remove();

        this.listener && this.listener.remove();
        this.errorListener && this.errorListener.remove();
        this.unsubscribe && this.unsubscribe();
        this.notifyEmitter && this.notifyEmitter.remove();
    }

    onNetChange(isConnected){
        if (!isConnected){
            this.netFire = true;
            this.setState({play:false});
            if (this.state.bReal){
                this.do({type:'stopReal'},(result,data) => {});
            }
            else{
                this.do({type:'pausePlayback'},(result,data) => {});
            }
        }
        else {
            if (this.netFire){
                this.setState({loading:true});
                if(this.state.bReal){
                    this.do({type:'startReal'},(result,data) => {
                        this.setState({loading:false});
                        if (result){
                            this.setState({currentState:'play',play:true});
                        }
                    });
                }
                else{
                    this.do({type:'resumePlayback'},(result,data) => {
                        this.setState({loading:false});
                        if (result){
                            this.setState({currentState:'play',play:true});
                        }
                    });
                }
            }
        }
    }

    onAppStateChange = (nextAppState) => {
        if(nextAppState == 'active'){
            this.doDirtyWork();
            if (this.state.play){
                this.setState({loading:true});
                if(this.state.bReal){
                    let playSuccessParams  = {};
                    playSuccessParams.beginTime = this.beginTime;
                    playSuccessParams.type = this.beginTime === 0 ? 'real' : 'playback';
                    playSuccessParams.deviceSerial = this.deviceSerial;
                    playSuccessParams.cameraNo = this.cameraNo;
                    const params = Platform.OS === 'android' ? playSuccessParams : {type:'startReal'};
                    this.do(params,(result,data) => {
                        Platform.OS === 'ios' ? this.setState({loading:false}): null;
                    });
                }
                else{
                    this.do({type:'resumePlayback'},(result,data) => {
                        this.setState({loading:false});
                    });
                }
            }
        }
        else if (Platform.OS === 'android' && nextAppState == 'background' || nextAppState == 'inactive'){
            this.pauseRecord();
            if(this.state.bReal){
                this.do({type:'stopReal'},(result,data) => {});
            }
            else{
                this.do({type:'pausePlayback'},(result,data) => {});
            }
        }
    }

    onRecordAudio(){
        if (this.state.sound){
            this.onSound();
        }
    }

    onRead(){
        setTimeout(()=>{
           if(Platform.OS === 'android'){
              this.startVideoEx(this.deviceSerial,this.cameraNo,this.beginTime);
           }
           else{
              this.startVideo(this.deviceSerial,this.cameraNo,this.beginTime);
           }
        },1000);
    }

    startVideo(deviceSerial,cameraNo,beginTime){
        if( (this.state.loading)
            && this.deviceSerial == deviceSerial && this.cameraNo == cameraNo ){
            return false;
        }
        this.deviceSerial = deviceSerial;
        this.cameraNo = cameraNo;
        this.beginTime = beginTime;
        if(Platform.OS === 'android' && (beginTime == null || beginTime == 0) ){
            if(this.videoLevels.length == 0){
                this.player.getVideoLevel(deviceSerial,cameraNo);
            }
            else{
                EzvizCache.getVideoLevel(deviceSerial).then((res)=>{
                    let level = 0;
                    this.videoLevelForAndroid.sort(function (a, b) {
                        return a-b;
                      });
                    if(res === 0){
                        level = this.videoLevelForAndroid[0];
                    }else{
                        level = this.videoLevelForAndroid[this.videoLevelForAndroid.length-1] > 2 ? (this.videoLevelForAndroid.includes(2) ? 2 : 3) : this.videoLevelForAndroid[this.videoLevelForAndroid.length-1];
                    }
                    this.player.setVideoLevel(deviceSerial,cameraNo,level);
                });
            }
        }
        else{
            this.startVideoEx(deviceSerial,cameraNo,beginTime);
        }
    }

    startVideoEx(deviceSerial,cameraNo,beginTime){
        this.setState({loading:true,enableOperate:true});
        //!this.state.sound ? this.onSound() : null
        this.pauseRecord();
        let params  = {};
        if(Platform.OS === 'android'){
            params.beginTime = beginTime;
            params.type = beginTime === 0 ? 'real' : 'playback';
        }else if(Platform.OS === 'ios'){
            params.beginTime = beginTime !== null ? beginTime : null;
            params.type = beginTime === null ? 'real' : 'playback';
        }
        params.deviceSerial = deviceSerial;
        params.cameraNo = cameraNo;
        this.setState({bReal:params.type==='real'});
        this.do(params,(result,data) => {
            if(Platform.OS === 'ios'){
                this.setState({loading:false,isError:false});
                if (result){
                    EzvizCache.getVideoLevel(deviceSerial).then((res)=>{
                        this.setState({videoLevel:res});
                    });
                    this.setState({play:true});
                    this.doDirtyWork();
                }
            }
        });
    }

    playSuccess(msg){
        this.seekPlay = true;
        this.setState({loading:false,isError:false,play:true});
        this.doDirtyWork();
    }

    stop(){
        if (this.state.currentState == 'play'){
            if(Platform.OS === 'android'){
                this.onPauseStatus()
                this.onPlay();
            }else{
                this.player.stop();
            }
        }
    }

    setPlayEnable(status){
        this.setState({enableOperate:status});
    }

    doDirtyWork(){
        setTimeout(() => {
            if(this.state.play){
                this.dirtyTimer && clearTimeout(this.dirtyTimer);
                this.dirtyTimer = setTimeout(() => {
                    if (AppState.currentState === 'active'){
                        this.pauseRecord();
                        if(this.state.play){
                            this.onPlay();
                        }
                    }
                }, 300000);
            }
        }, 500);
    }

    onPauseStatus(){
        if (this.state.sound){
            this.onSound();
        }
        this.pauseRecord();
    }

    onPauseSound(status){
        if(status){
            if (this.state.sound){
                this.pauseStatus = true;
                this.onSound();
            }
            this.pauseRecord();
        }
        else{
            if (this.pauseStatus && !this.state.sound){
                this.pauseStatus = false;
                this.onSound();
            }
        }
    }

    pauseRecord(){
        if (this.state.record){
            this.recordFlag = false;
            this.onRecord();
        }
    }

    async do(params,callback){
        await this.setState({currentState:'play'});
        if(Platform.OS === 'ios'){
            this.player.setRef(this.refs.theMyView);
        }
        if (params.type == 'capture'){
            this.player.captureBase64((result,data) => {
                callback(result,data);
            });
        }
        else if(params.type == 'real' && Platform.OS === 'ios'){
            this.player.startReal(params.deviceSerial,params.cameraNo,(result,data) => {
                callback(result,data);
            });
        }
        else if(params.type == 'playback' && Platform.OS === 'ios'){
            this.player.startPlayback(params.deviceSerial,params.cameraNo,params.beginTime,(result,data) => {
                callback(result,data);
            });
        }
        else if((params.type == 'real' || params.type == 'playback') && Platform.OS === 'android'){
            this.player.startVideo(params.deviceSerial,params.cameraNo,params.beginTime);
        }
        else if(params.type == 'stop'){
            this.player.stop();
        }
        else if(params.type == 'startRecord'){
            if(Platform.OS === 'android'){
                this.player.startRecord()
                callback(true,null);
            }else{
                this.player.startRecord((result,data) => {
                    callback(result,data);
                });
            }
        }
        else if(params.type == 'stopRecord'){
            if(Platform.OS === 'android'){
                this.player.stopRecord();
            }else{
                this.player.stopRecord((result,data) => {
                    callback(result,data);
                });
            }
        }
        else if(params.type == 'seekDecrease'){
            if(Platform.OS === 'android'){
                this.player.seekDecrease(10);
            }else{
                this.player.seekDecrease();
            }
        }
        else if(params.type == 'seekAdd'){
            if(Platform.OS === 'android'){
                this.player.seekAdd(10);
            }else{
                this.player.seekAdd();
            }
        }
        else if(params.type == 'openSound'){
            if (this.player.openSound()){
                callback(true,null);
            }
            else{
                callback(false,null);
            }
        }
        else if(params.type == 'closeSound'){
            if (this.player.closeSound()){
                callback(true,null);
            }
            else{
                callback(false,null);
            }
        }
        else if(params.type == 'startReal'){
            if (this.player.resumeReal()){
                callback(true,null);
            }
            else{
                callback(false,null);
            }
        }
        else if(params.type == 'stopReal'){
            if (this.player.stopReal()){
                callback(true,null);
            }
            else{
                callback(false,null);
            }
        }
        else if(params.type == 'resumePlayback'){
            if (this.player.resumePlayback()){
                callback(true,null);
            }
            else{
                callback(false,null);
            }
        }
        else if(params.type == 'pausePlayback'){
            if (this.player.pausePlayback()){
                callback(true,null);
            }
            else{
                callback(false,null);
            }
        }
    }

    fireEvent(path){
        if(this.state.fullScreen){
            this.onFullScreen();
            setTimeout(() => {
                this.props.createEvent(true,path);
                this.setState({enableCapture:true});
            }, 500);
        }
        else {
            this.props.createEvent(true,path);
            this.setState({enableCapture:true});
        }
    }

    async capture(){
        this.videoLevelList && this.videoLevelList.close();
        if(!this.state.play || this.state.isError || this.state.loading){
            return false;
        }
        if(GlobalParam.onAttachment()){
            await this.setState({enableCapture:false});
            this.do({type:'capture'},(result,data) => {
                if(Platform.OS === 'ios'){
                    if (result){
                        let date = new Date();
                        let time = date.getTime();
                        let path = RNFS.DocumentDirectoryPath + `/${time}.jpeg`;
                        RNFS.writeFile(path, data, 'base64')
                            .then((success) => {
                                this.pauseRecord();
                                if(this.props.closeSound){
                                    this.state.sound ? this.onSound() : null;
                                }
                                if(!this.state.bReal){
                                    this.state.play && this.onPlay();
                                }
                                let level = this.videoLevels[this.state.videoLevel];
                                if (level == I18n.t('HD')){
                                    ImageResizer.createResizedImage(path,1280,1280,"JPEG", 80, 0).then(response =>{
                                        this.fireEvent(response.path);
                                    })
                                    .catch(err => {
                                    });
                                }
                                else{
                                    this.fireEvent(path);
                                }
                            })
                            .catch((err) => {
                            });
                    }
                    else{
                        this.setState({enableCapture:true});
                    }
                }
            });
        }
    }

    afterCapture(data){
        this.pauseRecord();
        if(this.props.closeSound){
            this.state.sound ? this.onSound() : null;
        }
        if(!this.state.bReal){
            this.state.play && this.onPlay();
        }
        let date = new Date();
        let time = date.getTime();
        let path = RNFS.DocumentDirectoryPath + `/${time}.jpeg`;
        RNFS.copyFile(data,path)
            .then((success) => {
                let level = this.videoLevels[this.state.videoLevel];
                if (level == I18n.t('HD')){
                    ImageResizer.createResizedImage(path,1280,1280,"JPEG", 80, 0).then(response =>{
                        this.fireEvent(response.path);
                    })
                    .catch(err => {
                    });
                }
                else{
                    this.fireEvent(path);
                }
            })
            .catch((err) => {
            });

}

    onVideoLoad(event){
        if (!this.state.fullScreen){
            let maxHeight = height*0.618 ;
            let minHeight = 200;
            let heighSet = event.height * width/event.width;
            if (heighSet > maxHeight){
                heighSet = maxHeight
            }
            if (heighSet < minHeight){
                heighSet = minHeight
            }
        }
    }

    onError(error){
        this.setState({currentState:'blank',error:error});
    }

    onVideoError(event){
        this.setState({loading:false,isError:true,play:false});
        if (event.errorCode === 101){
            this.setState({currentState:'blank',error:I18n.t('Play no video')})
        }
        else if (event.errorCode === 102){
            this.pauseRecord();  // playback over
        }
        else if (event.errorCode === 103){

        }
        else if (event.errorCode === 105){

        }
        else if (event.errorCode === 104){
            this.setState({currentState:'blank',error:I18n.t('Record error')})
        }
        else if (event.errorCode === 395404){
            this.setState({currentState:'blank',error:I18n.t('Device offline')})
        }
        else if (event.errorCode === 395416){
            this.setState({currentState:'blank',error:I18n.t('Device connection limit')})
        }
        else if (event.errorCode === 395451){
            this.setState({currentState:'blank',error:I18n.t('Video type error')})
        }
        else if (event.errorCode === 395544){
            this.setState({currentState:'blank',error:I18n.t('Video source error')})
        }
        else if (event.errorCode === 400035 || event.errorCode === 400036){
            let device = {};
            device.serialId = this.deviceSerial;
            device.channelId = this.cameraNo;
            DeviceEventEmitter.emit('EzvizModal',device);
        }
        else {
            this.setState({currentState:'blank',error:I18n.t('EzvizPlayer error')+ event.errorCode})
        }
    }

    videoEncrypted(msg){
        let device = {};
        device.serialId = msg.serialId;
        device.channelId = msg.channelId;
        DeviceEventEmitter.emit('EzvizModal',device);
    }

    videoError(msg){
        this.setState({loading:false,isError:true,play:false});
        if(this.state.record){
            this.pauseRecord();
            this.discardRecord = true;
        }
        switch(msg){
            case 960001:
                this.setState({currentState:'blank',error:I18n.t('Insufficient memory')});
                break;
            case 960002:
                this.setState({currentState:'blank',error:I18n.t('Capture fail')});
                break;
            case 380045:
                this.setState({currentState:'blank',error:I18n.t('Max connection')});
                break;
            case 400901:
                this.setState({currentState:'blank',error:I18n.t('Offline device')});
                break;
            case 40032:
                this.setState({currentState:'blank',error:I18n.t('Invalid device')});
                break;
            case 400034:
                this.setState({currentState:'blank',error:I18n.t('Connect fail')});
                break;
            case 400036:
                this.setState({currentState:'blank',error:I18n.t('Verify code')});
                break;
            case 395402:
                this.setState({currentState:'blank',error:I18n.t('No record file')});
                break;
            case 395451:
                this.setState({currentState:'blank',error:I18n.t('Stream type error')});
                break;
            case 395544:
                this.setState({currentState:'blank',error:I18n.t('No video source')});
                break;
            default:
                this.setState({currentState:'blank',error:msg});
                break;
        }
    }

    onFullScreen(){
        this.videoLevelList && this.videoLevelList.close();
        let fullScreen = !this.state.fullScreen;
        if (fullScreen){
            Orientation.getOrientation((err, orientation) => {
                dismissKeyboard();
                if(orientation !== 'PORTRAIT'){
                    Orientation.lockToPortrait();
                }
                if (Platform.OS === 'android'){
                    Orientation.lockToLandscapeLeft();
                }
                else {
                    Orientation.lockToLandscapeRight();
                }
                this.props.onFullScreen(true);
                this.lastHeight = this.state.height;
                let heightX = width-45-getBottomSpace()-getStatusBarHeight();
                this.setState({height:heightX,fullScreen:true});
            });

            DeviceEventEmitter.emit('onGuideClose',null);
        }
        else {
            Orientation.getOrientation((err, orientation) => {
                if(orientation !== 'LANDSCAPE'){
                    if (Platform.OS === 'android'){
                        Orientation.lockToLandscapeLeft();
                    }
                    else {
                        Orientation.lockToLandscapeRight();
                    }
                }
                Orientation.lockToPortrait();
                this.props.onFullScreen(false);
                this.setState({height:this.lastHeight,fullScreen:false});
            });
        }
    }

    onRecord(){
        this.videoLevelList && this.videoLevelList.close();
        if(!this.state.play || this.state.isError || this.state.loading){
            return false;
        }
        if(GlobalParam.onAttachment()){
            if (!this.state.record){
                this.setState({enableRecord: false},()=>{
                    this.do({type:'startRecord'},(result,data) => {
                        if (result){
                            this.recordFlag = true;
                            this.discardRecord = false;
                            this.setState({record:true});
                            this.setState({currentCount:30});
                            this.timerOut = setTimeout(() => {
                                this.onRecord();
                            }, 30000);
                            this.timerInterval = setInterval(() => {
                                let currentCount = this.state.currentCount -1 ;
                                this.setState({currentCount: currentCount});
                            }, 1000);
                        }
                    });
                    setTimeout(() => {
                        this.setState({enableRecord: true});
                    }, 1500);
                });
            }
            else {
                this.timerOut && clearTimeout(this.timerOut);
                this.timerInterval && clearInterval(this.timerInterval);
                if(Platform.OS==='ios' && AppState.currentState != 'active'){
                    this.setState({record:false});
                    return;
                }
                if(this.state.enableRecord){
                    this.do({type:'stopRecord'},(result,data) => {
                        if (result&&Platform.OS==='ios'){
                            this.setState({record:false});
                            if (this.recordFlag || !this.state.play){
                                if (!this.discardRecord){
                                    if(this.props.closeSound){
                                        this.state.sound ? this.onSound() : null;
                                    }
                                    if(this.state.fullScreen){
                                        this.onFullScreen();
                                        setTimeout(() => {
                                            this.props.createEvent(false,data);
                                        }, 500);
                                    }
                                    else {
                                        this.props.createEvent(false,data);
                                    }
                                }
                            }
                        }
                    });
                }else{
                    this.setState({record:false});
                }
            }
        }else{
            this.state.fullScreen && this.onFullScreen();
        }
    }

    afterRecord(data){
        this.setState({record:false});
        if (this.recordFlag || !this.state.play){
            if (!this.discardRecord){
                if(this.props.closeSound){
                    this.state.sound ? this.onSound() : null;
                }
                if(this.state.fullScreen){
                    this.onFullScreen();
                    setTimeout(() => {
                        this.props.createEvent(false,data);
                    }, 500);
                }
                else {
                    this.props.createEvent(false,data);
                }
            }
        }
    }

    onPlay(){
        this.videoLevelList && this.videoLevelList.close();
        if(this.state.error == I18n.t('No record file')|| this.state.loading){
            return false;
        }

        let play = !this.state.play;
        if (play){
            this.setState({loading:true});
            if (this.state.bReal){
                let params  = {};
                if(Platform.OS === 'android'){
                    params.beginTime = this.beginTime;
                    params.type = 'real';
                }else if(Platform.OS === 'ios'){
                    params.beginTime = this.beginTime !== null ? this.beginTime : null;
                    params.type = 'startReal';
                }

                params.deviceSerial = this.deviceSerial;
                params.cameraNo = this.cameraNo;
                this.do(params,(result,data) => {
                    if(Platform.OS === 'ios'){
                        this.setState({loading:false,isError:false});
                        if (result){
                            this.setState({play:true});
                        }
                    }
                });
            }
            else{
                this.do({type:'resumePlayback'},(result,data) => {
                    this.setState({loading:false});
                    if (result){
                        this.setState({play:true});
                    }
                });
            }
        }
        else{
            if(this.state.record){
                this.pauseRecord();
                this.discardRecord = true;
            }
            if (this.state.bReal){
                this.do({type:'stopReal'},(result,data) => {
                    if (result){
                        this.setState({play:false});
                        Platform.OS === 'android' ? this.setState({currentState:'blank'}) : null;
                    }
                });
            }
            else{
                this.do({type:'pausePlayback'},(result,data) => {
                    if (result){
                        this.setState({play:false});
                    }
                });
            }
        }
        this.doDirtyWork();
    }

    onSound(){
        let sound = !this.state.sound;
        if (sound){
            this.do({type:'openSound'},(result,data) => {
                if (result){
                    this.setState({sound:true});
                }
            });
        }
        else{
            this.do({type:'closeSound'},(result,data) => {
                if (result){
                    this.setState({sound:false});
                }
            });
        }
    }

    onSeekAdd(){
        if (Platform.OS === 'android'){
            if(!this.seekPlay || this.state.isError || this.state.loading){
                return false;
            }
            this.setState({loading:true,play:false});
            this.seekPlay = false;
        }
        else{
            if(this.state.isError || this.state.loading){
                return false;
            }
            this.setState({loading:true});
        }
        this.do({type:'seekAdd'});
        this.pauseRecord();
        this.discardRecord = true;
        setTimeout(()=>{
            this.setState({loading:false});
        },1500);
    }

    onSeekDecrease(){
        if (Platform.OS === 'android'){
            if(!this.seekPlay || this.state.isError || this.state.loading){
                return false;
            }
            this.setState({loading:true,play:false});
            this.seekPlay = false;
        }
        else{
            if(this.state.isError || this.state.loading){
                return false;
            }
            this.setState({loading:true});
        }
        this.do({type:'seekDecrease'});
        this.pauseRecord();
        this.discardRecord = true;
        setTimeout(()=>{
            this.setState({loading:false});
         },1500);
    }

    onVideoLevel(){
        if(this.deviceSerial == null){
            return;
        }
        const handle = findNodeHandle(this.refs.videoLevelTag);
        if(handle!= null){
             UIManager.measure(handle,(x, y, width, height, pageX, pageY)=>{
             let py = 0;
             if (Platform.OS === 'ios'){
                py = pageY-35;
             }
             else{
                 py = pageY-10;
             }
             this.videoLevelList && this.videoLevelList.openExc(pageX-10,py);
        })
       }
    }

    onVideoLevelSelect(index){
        this.videoLevelList && this.videoLevelList.close();
        EzvizCache.saveVideoLevel(this.deviceSerial,index);
        setTimeout(() => {
            if(Platform.OS === 'ios'){
                this.startVideoEx(this.deviceSerial,this.cameraNo, this.beginTime);
            }
            else{
                let level = 0;
                this.videoLevelForAndroid.sort(function (a, b) {
                    return a-b;
                });
                if(index === 0){
                    level = this.videoLevelForAndroid[0];
                }else{
                    level = this.videoLevelForAndroid[this.videoLevelForAndroid.length-1] > 2 ? (this.videoLevelForAndroid.includes(2) ? 2 : 3) : this.videoLevelForAndroid[this.videoLevelForAndroid.length-1];
                }
                this.player.setVideoLevel(this.deviceSerial,this.cameraNo,level);
            }
        }, 500);
    }


    renderVideoLevel = ({item,index})=>{
        let backColor = (index === this.state.videoLevel) ? '#2C90D9':null;
        let borderRadius = (index === this.state.videoLevel) ? 4 : 0;
        let borderColor = (index === this.state.videoLevel) ? '#2C90D9' : null;
        let borderWidth = (index === this.state.videoLevel) ? 1 : 0;
        return (
            <TouchableOpacity activeOpacity={0.6} onPress={()=>this.onVideoLevelSelect(index)}>
                <View style={{height:30,justifyContent:'center',backgroundColor:'black',opacity: 0.7}}>
                    <View style={{fontSize:12,height:20, width:45,backgroundColor:backColor,borderRadius,borderColor,borderWidth,justifyContent:'center'}}>
                       <Text style={{fontSize:12,color:'white',height:20, width:45,textAlignVertical:'center', textAlign:'center',lineHeight:20}}>{item}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        )
    };

    render() {
        let backBtn = null;
        let barHeight = this.state.fullScreen ? 45:35;
        let btnSize = this.state.fullScreen ? 28:22;
        let marginSize = this.state.fullScreen ? 20:15;
        if ( !this.state.bReal ){ backBtn =(
            <TouchableOpacity onPress={()=> {
                this.onSeekDecrease();
            }}>
                <Image source={require('../assets/images/playback_backward_btn.png')} style={{height:btnSize,width:btnSize}}/>
            </TouchableOpacity>
        )
        }
        else { backBtn =(
            <View style={{height:btnSize,width:btnSize}}>
            </View>
        )
        }

        let forwardBtn = null;
        if ( !this.state.bReal ){ forwardBtn =(
            <TouchableOpacity onPress={()=> {
               this.onSeekAdd();
            }}>
                <Image source={require('../assets/images/playback_forward_btn.png')} style={{marginLeft:marginSize,height:btnSize,width:btnSize}}/>
            </TouchableOpacity>
        )
        }
        else { forwardBtn =(
            <View style={{marginLeft:marginSize,height:btnSize,width:btnSize}}>
            </View>
        )
        }

        let pointerChannel = this.state.enableCapture === true ? 'auto':'none';

        let captureBtn = null;
        if ( this.props.showOperate != false ){ captureBtn =(
            <View pointerEvents={pointerChannel}>
            <TouchableOpacity onPress={()=> {
                this.capture();
            }}>
                <Image source={require('../assets/images/preview_camera_btn.png')} style={{marginLeft:marginSize,height:btnSize,width:btnSize}}/>
            </TouchableOpacity>
            </View>
        )
        }

        let recordBtn = null;
        let sourceRecord = this.state.record ? require('../assets/images/preview_video_btn_sel.png'):require('../assets/images/preview_video_btn.png');
        let pointerRecord = this.state.enableRecord === true ? 'auto':'none';
        if ( this.props.showOperate != false ){ recordBtn =(
            <View pointerEvents={pointerRecord}>
                <TouchableOpacity onPress={()=> {
                this.onRecord();
            }}>
                <Image source={sourceRecord} style={{marginLeft:marginSize,height:btnSize,width:btnSize}}/>
            </TouchableOpacity>
            </View>
        )
        }

        let fullChannelBtn = null;
        if (this.state.fullScreen){ fullChannelBtn =(
            <TouchableOpacity onPress={()=> {
                this.props.onFullChannel();
            }}>
                <Image source={require('../assets/images/fullChannel.png')} style={{height:btnSize,width:btnSize}}/>
            </TouchableOpacity>
        )
        }

        let sourcePlay = this.state.play ? require('../assets/images/stoplay_btn.png'):require('../assets/images/preview_play_btn.png');
        let sourceSound = this.state.sound ?require('../assets/images/preview_voice_btn.png'):require('../assets/images/preview_unvoice_btn.png');
        let sourceFullScreen = this.state.fullScreen ? require('../assets/images/fullscreen_exit.png'):require('../assets/images/preview_enlarge.png');

        let recordText = null;
        if (this.state.record){ recordText = (
            <View style={styles.recordText}>
                <View style={styles.commonView}>
                    <View style={{backgroundColor:'#f76260',borderRadius:4,width:5,height:5, marginLeft:3}}/>
                    <Text style={styles.commonText}>{this.state.currentCount}</Text>
                </View>
            </View>
        )
        }

        let videoPlayer = null;
        let errorMsg = this.state.currentState == 'blank' ? this.state.error: '';
        if ( this.state.currentState == 'play' && this.playerMode == 1 && Platform.OS === 'ios'){ videoPlayer =(
            <MyView
                ref="theMyView"
                sound={this.state.sound}
                play={this.state.play}
                fullScreen={this.state.fullScreen}
                onVideoLoad = {this.onVideoLoad.bind(this)}
                onVideoError = {this.onVideoError.bind(this)}
                style={{width:'100%',height:this.state.height,backgroundColor: 'black',justifyContent:'center',alignItems:'center'}}
            >
            </MyView>
        )
        }else if( this.state.currentState == 'play' && this.playerMode == 1 && Platform.OS === 'android'){videoPlayer =(
            <EzvizAndroidView
                sound={this.state.sound}
                play={this.state.play}
                fullScreen={this.state.fullScreen}
                style={{width:'100%',height:this.state.height,backgroundColor: 'black',justifyContent:'center',alignItems:'center'}}
            >
            </EzvizAndroidView>
        )
        }
        else if (this.state.currentState == 'blank'){ videoPlayer =(
            <View style={{width:'100%',height:this.state.height,backgroundColor:'black',justifyContent:'center',alignItems:'center'}}>
                <Text style={{fontSize: 16, color: 'white', textAlignVertical:'center'}}>{errorMsg}</Text>
            </View>
        )
        }

        let left = this.state.fullScreen ? height/2-10 : width/2-10;
        let top = this.state.fullScreen ? 120 : 90;
        let loadingIndicator = null;
        if ( this.state.loading ) { loadingIndicator =(
            <View style={{position: 'absolute',left:left,top:top}}>
                 <ActivityIndicator animating={true} size="large" color='#ffffff'/>
           </View>
        )
        }

        let videoLevelHeight = this.state.fullScreen ? 30:20;
        let videoLevelBtn = null ;
        if  (this.state.bReal && this.videoLevels.length > 0){ videoLevelBtn = (
            <TouchableOpacity  onPress={()=> {
                this.onVideoLevel();
             }}>
                <View style={{marginLeft:marginSize,width:45,borderColor:'#ffffff',borderWidth:1,alignItems:'center'}} >
                   <Text ref='videoLevelTag' style={{color: '#ffffff',fontSize: 12,textAlignVertical:'center',height:videoLevelHeight,lineHeight:videoLevelHeight}}>{this.videoLevels[this.state.videoLevel]}</Text>
                </View>
            </TouchableOpacity>
        )
        }

        let pointer = this.state.enableOperate === true ? 'auto':'none';
        return (
            <View style={{backgroundColor: '#F5FCFF'}}>
               {videoPlayer}
               {loadingIndicator}
                <View pointerEvents={pointer} style={{width:'100%',flexDirection:'row',justifyContent:'space-between',backgroundColor:'black',opacity: 0.7,height:barHeight,alignItems:'center'}}>
                    <View style={{flexDirection:'row'}}>
                        {backBtn}
                        <TouchableOpacity onPress={()=> {
                            this.onPlay();
                        }}>
                            <Image source={sourcePlay} style={{marginLeft:marginSize,height:btnSize,width:btnSize}}/>
                        </TouchableOpacity>
                        {forwardBtn}
                    </View>

                    <View style={{flexDirection:'row'}}>
                        {fullChannelBtn}
                        {videoLevelBtn}
                        {captureBtn}
                        <TouchableOpacity onPress={()=> {
                            this.onSound();
                        }}>
                            <Image source={sourceSound} style={{marginLeft:marginSize,height:btnSize,width:btnSize}}/>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={this.onFullScreen.bind(this)}>
                            <Image source={sourceFullScreen} style={{marginLeft: marginSize,height:btnSize,width:btnSize,marginRight: marginSize}}/>
                        </TouchableOpacity>
                    </View>
                </View>
                {recordText}
                <SlideModalEx ref={(c) =>{this.videoLevelList = c}}
                              direction = 'up'
                              opacity={0}>
                    <FlatList
                        style={[styles.contentView]}
                        showsVerticalScrollIndicator={false}
                        data={this.videoLevels}
                        extraData={this.state}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderVideoLevel}
                    />
                </SlideModalEx>
                <EzvizModal />
            </View>
        );
    }
}


var styles = StyleSheet.create({
    recordText: {
        position: 'absolute',
        padding:3,
        right: 10,
        top:10,
        backgroundColor: '#24293d',
        opacity: 0.8,
        borderRadius: 4
    },
    commonView: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems:'center',
    },
    commonText: {
        color: '#ffffff',
        textAlignVertical: 'center',
        fontSize: 12,
        marginRight: 3,
        marginLeft:5
    },
    indicator:{
        position: 'absolute',
        left:width/2-10,
        top:90
    },
    contentView:{
        height:60,
        width:45,
        backgroundColor:'#ffffff'
    },
});
