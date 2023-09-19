import {NativeModules} from 'react-native';
import RNFS, {ExternalStorageDirectoryPath, DocumentDirectoryPath} from "react-native-fs";
import PatrolParser from "../components/inspect/PatrolParser";
import * as lib from '../common/PositionLib';
import CashCheckParser from "../cashcheck/checking/CashCheckParser";
import clear from 'react-native-clear-app-cache';

export default class FileUtil {
    static documentPath = RNFS.DocumentDirectoryPath;
    static cameraPath = RNFS.CachesDirectoryPath+ '/Camera';
    static canvasPath = NativeModules.AudioRecorderManager.PicturesDirectoryPath+ '/canvas';
    static capturePath = ExternalStorageDirectoryPath +'/StoreViu/Capture';
    static capturePath2 = ExternalStorageDirectoryPath +'/Documents/StoreViu/Capture';
    static recordPath = ExternalStorageDirectoryPath +'/StoreViu/Record';

    static cacheFiles = [];

    static clearAll(){
        try {
            console.log("clearAll")
            this.cacheFiles = PatrolParser.getCacheFiles();
            this.cacheFiles = this.cacheFiles.concat(CashCheckParser.getCacheFiles());
    
            console.log("All cacheFiles : ", JSON.stringify(this.cacheFiles));
    
            this.clearDocument();
            this.clearCamera();
            this.clearCanvas();
            this.clearCapture();
            this.clearRecord();
    
            this.clearCaches();

            clear.getAppCacheSize((value, unit) => {
                console.log("缓存大小", value);
                console.log("缓存单位", unit);
            })

            /*if(this.cacheFiles.length == 0) {
                clear.clearAppCache(() => {
                    console.log("清理缓存成功");
                })
            }*/
        }
        catch(e) {
            console.log("clearAll e : ", JSON.stringify(e))
        }
    }

    static clearDocument(){
        try {
            RNFS.readdir(this.documentPath)
                .then((path) => {
                    path.forEach((item)=>{
                        if (item.endsWith('.pdf')){
                            this.delete(this.documentPath + '/'+item);
                        }

                        if (item.endsWith('.jpeg') || item.endsWith('.jpg') || item.endsWith('.aac') || item.endsWith('.MOV') || item.endsWith('.png')){
                            !this.contains(item) && this.delete(this.documentPath + '/'+item);
                        }
                    });
                }).catch((err) => {});
        }
        catch (e) {}
    }

    static clearCaches(){
        try {
            if (lib.isAndroid()){
                this.fileCanvas = `${DocumentDirectoryPath}/canvas`;
                RNFS.readdir(this.fileCanvas)
                    .then((path) => {
                        path.forEach((item)=>{
                            if (item.endsWith('.jpg')){
                                !this.contains(item) && this.delete(this.fileCanvas + '/'+item);
                            }
                        });
                    }).catch((err) => {});
            }
        }
        catch (e) {}
    }

    static clearCamera(){
        try {
            RNFS.readdir(this.cameraPath)
                .then((path) => {
                    path.forEach((item)=>{
                        if (item.endsWith('.jpg') || item.endsWith('.mp4')){
                            !this.contains(item) && this.delete(this.cameraPath + '/'+item);
                        }
                    });
                }).catch((err) => {});
        }
        catch (e) {}
    }

    static clearCanvas(){
        try {
            RNFS.readdir(this.canvasPath)
                .then((path) => {
                    path.forEach((item)=>{
                        if (item.endsWith('.jpg')){
                            !this.contains(item) && this.delete(this.canvasPath + '/'+item);
                        }
                    });
                }).catch((err) => {});
        }
        catch (e) {}
    }

    static clearCapture(){
        this.delete(this.capturePath);
        this.delete(this.capturePath2);
    }

    static clearRecord(){
        try {
            RNFS.readdir(this.recordPath)
                .then((path) => {
                    path.forEach((item,index)=>{
                        if (item.endsWith('.mp4')){
                            !this.contains(item) && this.delete(this.recordPath + '/'+item);
                        }
                    });
                }).catch((err) => {});
        }
        catch (e) {}
    }

    static delete(path){
        try {
            RNFS.unlink(path)
                .then(() => {})
                .catch((err) => {});
        }
        catch (e) {}
    }

    static contains(item){
        return (this.cacheFiles.findIndex( p => p === item) !== -1)
    }
}
