import UserPojo from "../../../entities/UserPojo";
import store from "react-native-simple-store";

let VERIFY_CODE = UserPojo.getUserId() + 'EzvizVerifyCode';
let VIDEO_LEVEL = UserPojo.getUserId() + 'EzvizVideoLevel';

export default class EzvizCache {
    static save(serialId,channelId,verifyCode){
        store.get(VERIFY_CODE).then((res)=>{
            if(res != null){
                let index = res.findIndex(p=>p.serialId === serialId && p.channelId === channelId);
                if(index !== -1){
                    res[index].verifyCode = verifyCode
                }else{
                    res.push({serialId:serialId,channelId:channelId,verifyCode:verifyCode});
                }
            }else{
                res = [{serialId:serialId,channelId:channelId,verifyCode:verifyCode}];
            }

            store.save(VERIFY_CODE, res);
        });
    }

    static getVerifyCode(serialId,channelId){
        return new Promise((resolve => {
            store.get(VERIFY_CODE).then((res)=>{
                let verifyCode = "";
                if(res != null){
                    let index = res.findIndex(p=>p.serialId === serialId && p.channelId === channelId);
                    if(index !== -1) {
                        verifyCode = res[index].verifyCode;
                    }
                }

                resolve(verifyCode);
            });
        }));
    }

    static saveVideoLevel(serialId,videoLevel){
        store.get(VIDEO_LEVEL).then((res)=>{
            if(res != null){
                let index = res.findIndex(p=>p.serialId === serialId);
                if(index !== -1){
                    res[index].videoLevel = videoLevel
                }else{
                    res.push({serialId:serialId,videoLevel:videoLevel});
                }
            }else{
                res = [{serialId:serialId,videoLevel:videoLevel}];
            }

            store.save(VIDEO_LEVEL, res);
        });
    }

    static getVideoLevel(serialId){
        return new Promise((resolve => {
            store.get(VIDEO_LEVEL).then((res)=>{
                let videoLevel = 0;
                if(res != null){
                    let index = res.findIndex(p=>p.serialId === serialId);
                    if(index !== -1) {
                        videoLevel = res[index].videoLevel;
                    }
                }
                resolve(videoLevel);
            });
        }));
    }
}