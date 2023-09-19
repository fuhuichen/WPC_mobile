import {Platform} from 'react-native';
import EzvizPlayer from "../video/ezvizPlayer/util/EzvizPlayer";
import HttpUtil from "./HttpUtil";

export default class PlayerUtil {
    static getMode(appKey){
        let mode = (appKey !== "") ? 1 : 0;

        if(mode == 1 ){
            return Platform.OS === 'android' ? 2 : 3;
        }else{
            return Platform.OS === 'android' ? 0 : 1;
        }
    }

    static setMode(mode){
        this.videoMode = mode;
    }

    static videoMode = 0;

    static currentIvsId = null;
    static ezvizExpireTime = 0;
    static ezvizAccessToken = "";
    static ezvizCategory = false;

    static beseyeExpireTime = 0;
    static beseyeAccessToken = "";

    static skywatchExpireTime = 0;
    static skywatchAccessToken = "";

    static updateBeseyeToken(){
        try {
            (async ()=>{
               if(this.currentIvsId != null && (Date.parse(new Date()) > this.beseyeExpireTime)){
                   HttpUtil.get(`beseye/token?ivsId=${this.currentIvsId}`)
                       .then(result => {
                           if(result.errCode == 0){
                            if(result.data.accessToken !== this.beseyeAccessToken){
                                this.beseyeAccessToken = result.data.accessToken;
                                this.beseyeExpireTime = result.data.expireTime;
                            }
                           }
                           else{
                            if(result.errMsg == 'Not device License.' || result.errMsg == 'Device License overdue.' || result.errMsg == 'The number of authorizations exceeds the limit.'){
                                reject('license');
                            }
                            else{
                                reject();
                            }
                           }
                       })
                       .catch(error => {
                       })
               }
            })();
        }catch (e) {
        }
    }

    static getBeseyeToken(ivsId){
        return new Promise((resolve,reject)=>{
            if(this.currentIvsId == ivsId && (Date.parse(new Date()) < this.beseyeExpireTime)){
                resolve(this.beseyeAccessToken);
            }else{
                HttpUtil.get(`beseye/token?ivsId=${ivsId}`)
                    .then(result => {
                        if(result.errCode == 0){
                            resolve(result.data.accessToken);

                            this.currentIvsId = ivsId;
                            this.beseyeAccessToken = result.data.accessToken;
                            this.beseyeExpireTime = result.data.expireTime;
                        }
                        else{
                            if(result.errMsg == 'Not device License.' || result.errMsg == 'Device License overdue.' || result.errMsg == 'The number of authorizations exceeds the limit.'){
                                reject('license');
                            }
                            else{
                                reject();
                            }
                        }
                    })
                    .catch(error => {
                        reject();
                    })
            }
        })
    }

    static updateSkyWatchToken(){
        try {
            (async ()=>{
               if(this.currentIvsId != null && (Date.parse(new Date()) > this.skywatchExpireTime)){
                   HttpUtil.get(`skywatch/token?ivsId=${this.currentIvsId}`)
                       .then(result => {
                           if(result.errCode == 0){
                            if(result.data.apiKey !== this.skywatchAccessToken){
                                this.skywatchAccessToken = result.data.apiKey;
                                this.skywatchExpireTime = result.data.expireTime;
                            }
                           }
                           else{
                            if(result.errMsg == 'Not device License.' || result.errMsg == 'Device License overdue.' || result.errMsg == 'The number of authorizations exceeds the limit.'){
                                reject('license');
                            }
                            else{
                                reject();
                            }
                           }
                       })
                       .catch(error => {
                       })
               }
            })();
        }catch (e) {
        }
    }

    static getSkyWatchToken(ivsId){
        return new Promise((resolve,reject)=>{
            if(this.currentIvsId == ivsId && (Date.parse(new Date()) < this.skywatchExpireTime)){
                resolve(this.skywatchAccessToken);
            }else{
                HttpUtil.get(`skywatch/token?ivsId=${ivsId}`)
                    .then(result => {
                        if(result.errCode == 0){
                            resolve(result.data.apiKey);

                            this.currentIvsId = ivsId;
                            this.skywatchAccessToken = result.data.apiKey;
                            this.skywatchExpireTime = result.data.expireTime;
                        }
                        else{
                            if(result.errMsg == 'Not device License.' || result.errMsg == 'Device License overdue.' || result.errMsg == 'The number of authorizations exceeds the limit.'){
                                reject('license');
                            }
                            else{
                                reject();
                            }
                        }
                    })
                    .catch(error => {
                        reject();
                    })
            }
        })
    }



    static updateEzvizToken(){
        try {
            (async ()=>{
               if(this.currentIvsId != null && (Date.parse(new Date()) > this.ezvizExpireTime)){
                   HttpUtil.get("${v2.0}"+`/ezviz/token?ivsId=${this.currentIvsId}`)
                       .then(result => {
                           console.log(result)
                           if(result.errCode == 0){
                            if(result.data.accessToken !== this.ezvizAccessToken){
                                this.ezvizAccessToken = result.data.accessToken;
                                this.ezvizExpireTime = result.data.expireTime;
                                console.log(this.ezvizAccessToken)
                                EzvizPlayer.setToken(this.ezvizAccessToken);
                            }
                           }
                           else{
                            if(result.errMsg == 'Not device License.' || result.errMsg == 'Device License overdue.' || result.errMsg == 'The number of authorizations exceeds the limit.'){
                                reject('license');
                            }
                            else{
                                reject();
                            }
                           }
                       })
                       .catch(error => {
                       })
               }
            })();
        }catch (e) {
        }
    }

    static getEzvizToken(ivsId){
        return new Promise((resolve,reject)=>{
            if(this.currentIvsId == ivsId && (Date.parse(new Date()) < this.ezvizExpireTime)){
                resolve(this.ezvizAccessToken);
            }else{
                HttpUtil.get("${v2.0}"+`/ezviz/token?ivsId=${ivsId}`)
                    .then(result => {
                        console.log(ivsId)
                        console.log(result)
                        if(result.errCode == 0){
                            resolve(result.data.accessToken);
                            this.currentIvsId = ivsId;
                            this.ezvizAccessToken = result.data.accessToken;
                            this.ezvizExpireTime = result.data.expireTime;
                        }
                        else{
                            if(result.errMsg == 'Not device License.' || result.errMsg == 'Device License overdue.' || result.errMsg == 'The number of authorizations exceeds the limit.'){
                                reject('license');
                            }
                            else{
                                reject();
                            }
                        }
                    })
                    .catch(error => {
                        reject();
                    })
            }
        })
    }

    static updateToken(){
        if (this.videoMode == 1){
            this.updateEzvizToken();
        }
        else if (this.videoMode == 2){
            this.updateBeseyeToken();
        }
        else if (this.videoMode == 3){
            this.updateSkyWatchToken();
        }
    }

    static setCategory(value){
        this.ezvizCategory = value;
    }

    static getCategory(){
        return this.ezvizCategory;
    }
}
