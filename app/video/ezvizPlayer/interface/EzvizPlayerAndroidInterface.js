import PlayerInterface from "./PlayerInterface";
import EzvizCache from "../util/EzvizCache";
import {DeviceEventEmitter,NativeModules,} from 'react-native';

const EzvizModule = NativeModules.EzvizModule;

export default class EzvizPlayerAndroidInterface extends PlayerInterface {

    constructor(){
        super();
    }

    startVideo(deviceSerial,cameraNo,timeStamp){
        EzvizCache.getVerifyCode(deviceSerial,cameraNo).then((res)=>{
            EzvizModule.startVideo(deviceSerial,cameraNo,timeStamp,res); 
         });
    }

    resumeReal(){
        return true;
    }

    pauseReal(){
        return true;
    }

    resumePlayback(){
        EzvizModule.resumePlayback();
        return true;
    }

    pausePlayback(){
        EzvizModule.pausePlayback();
        return true;
    }

    stopReal(){
        EzvizModule.stopVideo();
        return true;
    }
    
    captureBase64(){
        EzvizModule.onCapture();
        return true;
    }

    openSound(){
        EzvizModule.openSound();
        return true;
    }

    closeSound(){
        EzvizModule.closeSound();
        return true;
    }

    startRecord(){
        EzvizModule.startRecord();
    }

    stopRecord(){
        EzvizModule.stopRecord();
        return true;
    }

    seekDecrease(offset){
        EzvizModule.seekBackward(offset);
        return true;
    }

    getVideoLevel(deviceSerial,cameraNo){
        EzvizModule.getVideoLevel(deviceSerial,cameraNo);
    }

    setVideoLevel(deviceSerial,cameraNo,level){
        EzvizModule.setVideoLevel(deviceSerial,cameraNo,level);            
    }

    seekAdd(offset){
        EzvizModule.seekForward(offset);
        return false;
    }

    raiseError(error){
        DeviceEventEmitter.emit('OnPlayerError',error);
    }
    
}
