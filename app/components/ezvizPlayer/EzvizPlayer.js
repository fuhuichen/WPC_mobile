import * as Module from "./AndroidPlayer";
import * as lib from '../../common/PositionLib';
import {NativeModules} from "react-native";
import PlayerUtil from "../../utils/PlayerUtil";
const MyViewManager = NativeModules.MyViewManager;

export default class EzvizPlayer {
    static init(appKey){
        lib.isAndroid() ? Module.InitSDK(appKey,PlayerUtil.getCategory())
            : MyViewManager.init(appKey);
    }

    static setToken(token){
        lib.isAndroid() ? Module.SetToken(token)
            : MyViewManager.setToken(token);
    }

    static resumePlay(){
        Module.ResumePlayer();
    }

    static pausePlayer(){
        Module.PausePlayer();
    }

    static setLocale(locale){
        Module.SetLocale(locale);
    }

    static setVerifyCode(code){
        Module.SetVerifyCode(code);
    }
}
