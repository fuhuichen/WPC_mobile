import UserPojo from "../../entities/UserPojo";
import store from "react-native-simple-store";

let VERIFY_CODE = UserPojo.getUserId() + 'EzvizVerifyCode';

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
}