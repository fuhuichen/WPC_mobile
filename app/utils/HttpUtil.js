/**
 * Fetch http component.
 */
import UserPojo from "../entities/UserPojo";
import {Actions} from "react-native-router-flux";
//import JMessage from "../notification/JMessage";
import {Environment} from '../../environments/Environment';
import store from "../../mobx/Store";

const ErrorMsgCheck = 'Network request failed';

export default class HttpUtil{

    static parseVersion(url){
        let version = url.includes('$') ? url.replace('${','').replace('}','') : 'v1.0/'+url;
        return Environment.onWebSite() + version;
    }

    static parseVersion_CashCheck(url){
        let version = url.includes('$') ? url.replace('${','').replace('}','') : 'v1.0/'+url;
        return Environment.onWebSite_CashCheck() + version;
    }

    static async get(url, timeout = 15){
        let httpUrl = this.parseVersion(url)
        return await new Promise((resolve,reject) => {
            let timer = setTimeout(function() {
                resolve({errCode:store.enumSelector.errorType.ERROR});
                if(!url.includes('ezviz')){
                    store.netInfoSelector.offline = true;
                }
            }, timeout*1000);
            fetch(httpUrl,{
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Token': UserPojo.getToken()
                }
            })
                .then(response => response.json())
                .then(result => {
                    clearTimeout(timer);
                    store.netInfoSelector.offline = false;
                    if(result.errCode === 500 && result.errMsg === 'Invalid token'
                        && !url.includes('ezviz')){
                        //JMessage.close();
                        Actions.reset('loginScreen',{token:false});
                    }
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timer);
                    resolve({errCode:store.enumSelector.errorType.ERROR});
                    if (error.message != null && error.message == ErrorMsgCheck
                        && !url.includes('ezviz')){
                        store.netInfoSelector.offline = true;
                    }
                })
        })
    }

    static async post(url,data){
        let httpUrl = this.parseVersion(url);
        return await new Promise((resolve,reject) => {
            let timer = setTimeout(function() {
                resolve({errCode:store.enumSelector.errorType.ERROR});
                if(!url.includes('notify')){
                    store.netInfoSelector.offline = true;
                }
            }, 15000);
            fetch(httpUrl,{
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Token': UserPojo.getToken()
                },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .then(result => {
                    clearTimeout(timer);
                    store.netInfoSelector.offline = false;
                    if(result.errCode === 500 && result.errMsg === 'Invalid token' && !url.includes('notify')){
                        //JMessage.close();
                        Actions.reset('loginScreen',{token:false});
                    }
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timer);
                    resolve({errCode:store.enumSelector.errorType.ERROR});
                    if (error.message != null && error.message == ErrorMsgCheck
                        && !url.includes('notify')){
                            store.netInfoSelector.offline = true;
                    }
                })
        })
    }

    static async postAsync(url,data){
        let httpUrl = this.parseVersion(url);
        console.log(">>>>>>>>>>>>>>>>>>> POST ", url);
        return await new Promise((resolve,reject) => {
            let timer = setTimeout(function() {
                resolve({errCode:store.enumSelector.errorType.ERROR});
            }, 30000);
            fetch(httpUrl,{
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Token': UserPojo.getToken()
                },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .then(result => {
                    clearTimeout(timer);
                    if(result.errCode === 500 && result.errMsg === 'Invalid token' && !url.includes('notify')){
                        //JMessage.close();
                        Actions.reset('loginScreen',{token:false});
                    }
                    resolve(result);
                })
                .catch(error =>{
                    clearTimeout(timer);
                    resolve({errCode:store.enumSelector.errorType.ERROR});
                })
        })
    }

    static async postAsync_CashCheck(url,data){
        let httpUrl = this.parseVersion_CashCheck(url);
        console.log(">>>>>>>>>>>>>>>>>>> POST ", url);
        return await new Promise((resolve,reject) => {
            let timer = setTimeout(function() {
                resolve({errCode:store.enumSelector.errorType.ERROR});
            }, 30000);
            fetch(httpUrl,{
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Token': UserPojo.getToken()
                },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .then(result => {
                    clearTimeout(timer);
                    if(result.errCode === 500 && result.errMsg === 'Invalid token' && !url.includes('notify')){
                        //JMessage.close();
                        Actions.reset('loginScreen',{token:false});
                    }
                    resolve(result);
                })
                .catch(error =>{
                    clearTimeout(timer);
                    resolve({errCode:store.enumSelector.errorType.ERROR});
                })
        })
    }

    static async getAsync(url,data){
        let httpUrl = this.parseVersion(url)
        console.log(">>>>>>>>>>>>>>>>>>> GET ", url);
        return await new Promise((resolve,reject) => {
            let timer = setTimeout(function() {
                resolve({errCode:store.enumSelector.errorType.ERROR});
            }, 30000);
            fetch(httpUrl,{
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Token': UserPojo.getToken()
                }
            })
                .then(response => response.json())
                .then(result => {
                    clearTimeout(timer);
                    if(result.errCode === 500 && result.errMsg === 'Invalid token' && !url.includes('notify')){
                        //JMessage.close();
                        Actions.reset('loginScreen',{token:false});
                    }
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timer);
                    resolve({errCode:store.enumSelector.errorType.ERROR});
                })
        })
    }

    static async getAsync_CashCheck(url,data){
        let httpUrl = this.parseVersion_CashCheck(url)
        console.log(">>>>>>>>>>>>>>>>>>> GET ", url);
        return await new Promise((resolve,reject) => {
            let timer = setTimeout(function() {
                resolve({errCode:store.enumSelector.errorType.ERROR});
            }, 30000);
            fetch(httpUrl,{
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Token': UserPojo.getToken()
                }
            })
                .then(response => response.json())
                .then(result => {
                    clearTimeout(timer);
                    if(result.errCode === 500 && result.errMsg === 'Invalid token' && !url.includes('notify')){
                        //JMessage.close();
                        Actions.reset('loginScreen',{token:false});
                    }
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timer);
                    resolve({errCode:store.enumSelector.errorType.ERROR});
                })
        })
    }

    static getApiResult(){
        return this.apiResult;
    }

    static setDashHost(url){
        this.DASH_HOST = url;
    }

    static async putDash(url,data){
        let httpUrl = this.DASH_HOST + url;
        let timer = setTimeout(function() {
            store.netInfoSelector.offline = true;
        }, 30000);
        try {
            let response = await fetch(httpUrl,{
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            let responseJson = await response.json();
            this.awaitResult = responseJson.result;
            clearTimeout(timer);
            store.netInfoSelector.offline = false;
            return responseJson.result.ErrorCode ? false : true;
        }
        catch (error) {
            if (error.message != null && error.message === ErrorMsgCheck){
                store.netInfoSelector.offline = true;
            }
            this.awaitResult = null;
            clearTimeout(timer);
            return false;
        }
    }

    static getResult(){
        return this.awaitResult;
    }
}
