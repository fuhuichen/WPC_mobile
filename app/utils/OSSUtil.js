/*
* aliyun/aliyun-oss-react-native
*/
import AliyunOSS from 'aliyun-oss-react-native'
import {MEDIA_IMAGE, MEDIA_VIDEO} from "../common/Constant";
import moment from 'moment';
import StorageInfo from "../entities/StorageInfo";
import Toast from "./ToastUtil";
import {Platform} from "react-native";
import NetInfo from '@react-native-community/netinfo';
import I18n from 'react-native-i18n';
import AliyunOSSAndroid from '../thirds/aliyun-oss-react-native/index'
import HttpUtil from "./HttpUtil";
import RNFetchBlob from "rn-fetch-blob";
import store from "../../mobx/Store";

const configuration = {
    maxRetryCount: 3,
    timeoutIntervalForRequest: 30,
    timeoutIntervalForResource: 24 * 60 * 60
};

export default class OSSUtil{
    static getTotalcount(){
        return this.totalcount;
    }

    static getProgress(){
        return this.progress;
    }

    static reset() {
        this.totalcount = 0;
        this.progress = 0;
    }

    static init(storeId){
        return new Promise((resolve,reject)=>{
            HttpUtil.get(`storage/info?storeId=${storeId}`)
                .then(result => {
                    if (result.data.vendor == null){
                        result.data.vendor = 1;
                    }
                    if( result.data.ossEndPoint !== StorageInfo.getEndPoint() ||
                        result.data.ossBucketName !== StorageInfo.getBucketName()){
                        StorageInfo.setInfo(result.data);
                        if (result.data.vendor === 1){
                            let aliyunLib = Platform.OS === 'android' ? AliyunOSSAndroid : AliyunOSS;
                            aliyunLib.enableDevMode()
                            aliyunLib.initWithPlainTextAccessKey(
                                result.data.ossAccessKeyId,
                                result.data.ossAccessKeySecret,
                                result.data.ossEndPoint,
                                configuration);
                        }
                    }
                    this.totalcount  = 0;
                    this.progress = 0;
                    resolve();
                })
                .catch(error=>{
                    reject(error);
                })
        });
    }

    static download(path, callbackFunc) {
        const { config } = RNFetchBlob;
        let options = {
            fileCache: true
        };
        config(options)
        .fetch('GET', path)
        .then(res => {
            callbackFunc(Platform.OS === 'android' ? `file://${res.path()}` : `${res.path()}`);
        })
        .catch((errorMessage, statusCode) => {
            console.log("errorMessage : ", errorMessage);
            callbackFunc(null);
            // error handling
        });
    }

    static upload(key,path){
        if (StorageInfo.getVendor() === 2){
            let url = `https://${StorageInfo.getEndPoint()}/${StorageInfo.getBucketName()}/${key}${StorageInfo.getAccessSecret()}`;
            return new Promise((resolve,reject) => {
                RNFetchBlob.fetch('PUT', url, {
                        'x-ms-version':'2019-07-07',
                        'x-ms-blob-type':'BlockBlob'
                    },
                    RNFetchBlob.wrap(path)
                )
                    .then((res) => {
                        if (res.respInfo.status === 201){
                            this.progress++;
                            resolve(res);
                        }
                        else {
                            Toast.show(`${I18n.t('Upload error')}: ${res.respInfo.headers['x-ms-error-code']}`, Toast.LONG);
                            reject();
                        }
                    })
                    .catch((error) => {
                        console.log("upload error : ", JSON.stringify(error));
                        NetInfo.fetch().then(isConnected => {
                            if (isConnected){
                                Toast.show(I18n.t('Upload error'), Toast.LONG);
                            }
                            else {
                                Toast.show(I18n.t('Network error'), Toast.LONG);
                            }
                            reject(error);
                        });
                    })
            })
        }
        else {
            return new Promise((resolve,reject) => {
                let aliyunLib = Platform.OS === 'android' ? AliyunOSSAndroid : AliyunOSS;
                aliyunLib.asyncUpload(StorageInfo.getBucketName(),key,path)
                    .then((res)=>{
                        this.progress++;
                        resolve(res);
                    })
                    .catch((error)=>{
                        NetInfo.fetch().then(isConnected => {
                            if (isConnected){
                                Toast.show(I18n.t('Upload error'), Toast.LONG);
                            }
                            else {
                                Toast.show(I18n.t('Network error'), Toast.LONG);
                            }
                            reject(error);
                        });
                    })
            })
        }
    }

    static formatOssUrl(module,type,storeId,itemId){
        this.totalcount ++;
        let media = store.paramSelector.mediaMaps.find(p => p.type === type);
        return `${media.name}/${moment().format("YYYYMMDD")}/${module}_` +
            `${moment().format("HHmmssSSS")}_${storeId}_${itemId}${media.suffix}`;
    }

    static formatRemoteUrl(key){
        if (StorageInfo.getVendor() === 2){
            return `https://${StorageInfo.getEndPoint()}/${StorageInfo.getBucketName()}/${key}`;
        }
        else {
            return `http://${StorageInfo.getBucketName()}.${StorageInfo.getEndPoint()}/${key}`;
        }
    }
}
