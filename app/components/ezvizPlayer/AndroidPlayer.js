import React, {Component} from 'react';
import PropTypes from 'prop-types'

import {DeviceEventEmitter, NativeModules, requireNativeComponent} from 'react-native';
import Orientation from 'react-native-orientation';
import EzvizCache from "./EzvizCache";
import {EMITTER_PLAYER_STOP} from "../../common/Constant";
import GlobalParam from "../../common/GlobalParam";

let EzvizPreview = requireNativeComponent('RCTPreview',EzvizAndroidPlayer)
let EzvizPlayback = requireNativeComponent('RCTPlayback',EzvizAndroidPlayer)

class EzvizAndroidPlayer extends Component{
    static propTypes = {
        text: PropTypes.string,
        videoMode: PropTypes.boolean,
        captureEnable: PropTypes.boolean,
        dashReady: PropTypes.func,
        createEvent: PropTypes.func,
        startPreview: PropTypes.func,
        startPlayback: PropTypes.func,
        stopPreview: PropTypes.func,
        onFullScreen: PropTypes.func,
        onPauseStatus: PropTypes.func,
        onExitScreen: PropTypes.func
    };

    constructor(props){
        super(props);

        /**
         *  Preview: true; Playback: false
         */
        this.state = {
            mode: this.props.videoMode ? this.props.videoMode : true
        }
    }

    componentDidMount(): void {
        setTimeout(()=>{
            this.props.dashReady();
        },1000)
    }

    componentWillMount(): void{
        this.captureEmitter = DeviceEventEmitter.addListener('CaptureSuccess',
            (msg) =>{
                this.props.createEvent(true,msg);
            });

        this.recordEmitter = DeviceEventEmitter.addListener('RecordSuccess',
            (msg) =>{
                this.props.createEvent(false,msg);
            });

        this.fullScreenEmitter = DeviceEventEmitter.addListener('FullScreen',
            (msg) =>{
                msg ? Orientation.lockToLandscape() : Orientation.lockToPortrait();
                this.props.onFullScreen(msg);

                msg && DeviceEventEmitter.emit('onGuideClose',null);
            });

        this.pausePlayEmitter = DeviceEventEmitter.addListener('PausePlayer',
            () => {
                this.onPauseStatus();
            });

        this.encryptEmitter = DeviceEventEmitter.addListener('VideoEncrypted',
            (device) => {
                DeviceEventEmitter.emit('EzvizModal',device);
            });

        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_PLAYER_STOP,
            (value)=>{
                this.onExitScreen();
                value && this.stopPreview();
                value && this.stopPlayback();
        });

        this.attachmentEmitter = DeviceEventEmitter.addListener('MaxAttachment',(msg)=>{
            GlobalParam.onAttachment() ? this.onAttachment(msg) : this.onExitScreen();
        });
    }

    componentWillUnmount(): void {
        this.captureEmitter && this.captureEmitter.remove();
        this.recordEmitter && this.recordEmitter.remove();
        this.fullScreenEmitter && this.fullScreenEmitter.remove();
        this.pausePlayEmitter && this.pausePlayEmitter.remove();
        this.encryptEmitter && this.encryptEmitter.remove();
        this.notifyEmitter && this.notifyEmitter.remove();
        this.attachmentEmitter && this.attachmentEmitter.remove();
    }

    startPreview(deviceSerial,cameraNo){
        this.deviceSerial = deviceSerial;
        this.cameraNo = cameraNo;

        this.state.mode && this.startNativePreview(false);
        !this.state.mode && this.setState({mode: true},()=>{
            this.startNativePreview(true);
        });
    }

    stopPreview(){
        this.state.mode && NativeModules.EzvizModule.stopPreview();
    }

    stopPlayback(){
        !this.state.mode && NativeModules.EzvizModule.stopPlayback();
    }

    startNativePreview(auto){
        EzvizCache.getVerifyCode(this.deviceSerial,this.cameraNo).then((res)=>{
            !auto && this.state.mode && NativeModules.EzvizModule.startPreview(
                this.deviceSerial,
                this.cameraNo,
                res);
            auto && setTimeout(()=>{
                this.startNativePreview(false);
            },1000);
        });
    }

    startPlayback(deviceSerial,cameraNo,time){
        this.deviceSerial = deviceSerial;
        this.cameraNo = cameraNo;
        this.playTime = time;

        !this.state.mode && this.startNativePlayback(false);
        this.state.mode && this.setState({mode: false},()=>{
            this.startNativePlayback(true);
        });
    }

    startNativePlayback(auto){
        EzvizCache.getVerifyCode(this.deviceSerial,this.cameraNo).then((res)=>{
            !auto && !this.state.mode && NativeModules.EzvizModule.startPlayback(
                this.deviceSerial,
                this.cameraNo,
                this.playTime,
                res);
            auto && setTimeout(()=>{
                this.startNativePlayback(false);
            },1000);
        });
    }

    onPauseStatus(){
        this.state.mode && NativeModules.EzvizModule.pausePreviewStatus();
        !this.state.mode && NativeModules.EzvizModule.pausePlaybackStatus();
    }

    onExitScreen(){
        NativeModules.EzvizModule.exitFullScreen();
    }

    onAttachment(value){
        this.state.mode && NativeModules.EzvizModule.doAttachment(value);
    }

    render(){
        return (!this.state.mode || (this.props.videoMode != null && !this.props.videoMode))
            ? <EzvizPlayback{...this.props}/> : <EzvizPreview {...this.props}/>
    }
}

let InitSDK = function (appKey,category) {
    NativeModules.EzvizModule.initLib(appKey, category);
}

let SetToken = function (token) {
    NativeModules.EzvizModule.setAccessToken(token);
}

let PausePlayer = function () {
    DeviceEventEmitter.emit('PausePlayer',null);
}

let SetLocale = function (locale) {
    NativeModules.EzvizModule.setLocale(locale);
}

let SetVerifyCode = function (code) {
    NativeModules.EzvizModule.setVerifyCode(code);
}

module.exports = EzvizAndroidPlayer;
module.exports.InitSDK = InitSDK;
module.exports.SetToken = SetToken;
module.exports.PausePlayer = PausePlayer;
module.exports.SetLocale = SetLocale;
module.exports.SetVerifyCode = SetVerifyCode;
