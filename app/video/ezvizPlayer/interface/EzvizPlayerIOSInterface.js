import PlayerInterface from "./PlayerInterface";
import EzvizCache from "../util/EzvizCache";
import { findNodeHandle,DeviceEventEmitter,NativeModules,} from 'react-native';

const MyViewManager = NativeModules.MyViewManager;

export default class EzvizPlayerIOSInterface extends PlayerInterface {

    constructor(){
        super();
    }

    startReal(deviceSerial,cameraNo,callback){
        if(findNodeHandle(this.ref) != null){
            EzvizCache.getVideoLevel(deviceSerial).then((res)=>{
                let level = 0;
                if (res == 1){
                    level = 2;
                }
                MyViewManager.setVideoLevel(deviceSerial,cameraNo,level,findNodeHandle(this.ref)).then((data)=>{
                    EzvizCache.getVerifyCode(deviceSerial,cameraNo).then((res)=>{
                        if(findNodeHandle(this.ref) != null){
                            MyViewManager.startReal(deviceSerial,cameraNo,res,findNodeHandle(this.ref)).then((data) => {  
                                if (data.result){
                                    callback(true,null);
                                }
                                else{
                                    callback(false,null);
                                }
                            });
                        }
                     });
                });             
            });      
        }
    }

    resumeReal(){
        return true;
    }

    pauseReal(){
        return true;
    }

    stopReal(){
        return true;
    }

    startPlayback(deviceSerial,cameraNo,beginTime,callback){
        if(findNodeHandle(this.ref) != null){
            EzvizCache.getVerifyCode(deviceSerial,cameraNo).then((res)=>{
                MyViewManager.startPlayback(deviceSerial,cameraNo,res,beginTime,findNodeHandle(this.ref)).then((data) => {                  
                    if (data.result){;
                        callback(true,null);
                    }
                    else{
                        callback(false,null);
                    }
                }); 
             });
        }
    }

    resumePlayback(){
        return true;
    }

    pausePlayback(){
        return true;
    }

    stop(){
        let ref = findNodeHandle(this.ref);
        if (ref != null){
            MyViewManager.stop(ref);
        }
    }
    
    captureBase64(callback){
        MyViewManager.capture(findNodeHandle(this.ref)).then((data)=>{
            callback(true,data.base64);
        },(e)=>{
            callback(false,e);
        });
    }

    openSound(){
        return true;
    }

    closeSound(){
        return true;
    }

    startRecord(callback){
        MyViewManager.startRecord(findNodeHandle(this.ref)).then((data)=>{
            if (data.result){
                callback(true,null);
            }
            else{
                callback(false,null);
            }
        },(e)=>{
            callback(false,null);
        });
    }

    stopRecord(callback){
        MyViewManager.stopRecord(findNodeHandle(this.ref)).then((data) => {
            if (data.result){
                if (data.path){
                    callback(true,data.path);
                }
                else{
                    callback(false,null);
                }
            }
            else{
                callback(false,null);
            }
        })
    }

    seekDecrease(){
        MyViewManager.seekDecrease(findNodeHandle(this.ref));
        return true;
    }

    seekAdd(){
        MyViewManager.seekAdd(findNodeHandle(this.ref));
        return false;
    }

    setRef(ref){
         this.ref = ref;
    }

    raiseError(error){
        DeviceEventEmitter.emit('OnPlayerError',error);
    }   

}
