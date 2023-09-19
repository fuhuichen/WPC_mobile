import CashCheckStorage from "./CashCheckStorage";
import _ from 'lodash';
import I18n from "react-native-i18n";
import store from "../../../mobx/Store";
import {Platform} from "react-native";
import RNFS, {DocumentDirectoryPath} from "react-native-fs";

export default class CashCheckParser {
   static storage = null;
   static state = null;
   static cacheFiles = [];

   static init(){
   }

    static deCycle(data){
       let target = _.cloneDeep(data);
       target.forEach((item)=>{
           item.items.forEach((_item)=>{
               _item.score = _item.score.toString();
           })
       });

       return target;
   }

    static isExist(){
        this.storage = null;

        let storage = CashCheckStorage.getAutoCache();
        let exist = !CashCheckStorage.isEmpty(storage);
        exist && (this.storage = storage[0]);
        exist && (this.state = CashCheckStorage.parseState(this.storage));
        return exist;
    }

    static getUUID(){
        return this.storage.uuid;
    }

    static getStoreName(){
       return this.storage.storeName;
    }

    static getCacheFiles(){
        this.init();
        CashCheckStorage.init();
        CashCheckStorage.clear();

        let cacheData = CashCheckStorage.getAll();
        for(let i = 0; i < cacheData.length; i++){    
            CashCheckStorage.flush(cacheData[i]);
            let cacheState = CashCheckStorage.parseState(cacheData[i]);
            this.parseAttachments(cacheState.attachments);
            this.parseSignature(cacheState.signatures);
            if (Platform.OS == 'ios'){
                let isManual = cacheData[i].autoState !== '' ? false : true;
                CashCheckStorage.flushState(isManual,cacheData[i],JSON.stringify(cacheState));
            }
        }       
        return this.cacheFiles;
    }

    static getNewDocumentPath(path){
        let name = path.substr(path.lastIndexOf('/')+1);
        return RNFS.DocumentDirectoryPath + '/' + name;
    }

    static parseAttachments(attachments){
        if(attachments != null) {
            attachments.forEach((attach) => {
                if (attach.mediaType !== store.enumSelector.mediaTypes.TEXT){
                    if(Platform.OS == 'ios'){
                        attach.url = this.getNewDocumentPath(attach.url);
                    }
                    this.parseFile(attach.url);
                }
            })
        }
    }

    static parseSignature(data){
        if(data != null) {
            data.forEach((item) => {
                if(item.content) {
                    if(Platform.OS == 'ios'){
                        item.content = this.getNewDocumentPath(item.content);
                    }          
                    this.parseFile(item.content);
                }            
            })
        }        
    }

    static parseFile(path){
        this.cacheFiles.push(path.substr(path.lastIndexOf('/')+1));
    }
}
