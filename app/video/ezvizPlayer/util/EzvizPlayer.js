import * as lib from '../../../common/PositionLib';
import {NativeModules} from "react-native";
import PlayerUtil from "../../../utils/PlayerUtil";
const MyViewManager = NativeModules.MyViewManager;
const EzvizModule = NativeModules.EzvizModule;

export default class EzvizPlayer {
    static init(appKey){
         console.log("EZPLAYER "+appKey)
        lib.isAndroid() ? EzvizModule.initLib(appKey,PlayerUtil.getCategory())
            : MyViewManager.init(appKey);
    }

    static setToken(token){
      console.log("EZPLAYER "+token)
        lib.isAndroid() ? EzvizModule.setAccessToken(token)
            : MyViewManager.setToken(token);
    }

    static resumePlay(){
        EzvizModule.ResumePlayer();
    }

    static pausePlayer(){
        EzvizModule.PausePlayer();
    }

    static setVerifyCode(code){
        EzvizModule.SetVerifyCode(code);
    }
}
