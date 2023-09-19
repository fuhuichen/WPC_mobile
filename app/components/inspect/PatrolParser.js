import PatrolStorage from "./PatrolStorage";
import _ from 'lodash';
import I18n from "react-native-i18n";
import store from "../../../mobx/Store";
import {Platform} from "react-native";
import RNFS, {DocumentDirectoryPath} from "react-native-fs";

export default class PatrolParser {
   static storage = null;
   static state = null;
   static cacheFiles = [];

   static init(){
       this.score = [
           {
               label: -(2**31),
               score: I18n.t('Select')
           },
           {
               label: 0,
               score: I18n.t('Failed')
           },
           {
               label: 1,
               score: I18n.t('Pass')
           }
       ];
   }

    static getScore(){
        this.score = [
            {
                label: -(2**31),
                score: I18n.t('Select')
            },
            {
                label: 0,
                score: I18n.t('Failed')
            },
            {
                label: 1,
                score: I18n.t('Pass')
            }
        ];
        return this.score;
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

        let storage = PatrolStorage.getAutoCache();
        let exist = !PatrolStorage.isEmpty(storage);
        exist && (this.storage = storage[0]);
        exist && (this.state = PatrolStorage.parseState(this.storage));
        return exist;
    }

    static getUUID(){
        return this.storage.uuid;
    }

    static getMode(){
       return this.storage.mode;
    }

    static getStoreName(){
       return this.storage.storeName;
    }

    static getCacheFiles(){
        this.init();
        PatrolStorage.init();
        PatrolStorage.clear();

        let cacheData = PatrolStorage.getAll();
        for(let i = 0; i < cacheData.length; i++){    
            PatrolStorage.flush(cacheData[i]);
            let cacheState = PatrolStorage.parseState(cacheData[i]);
            this.parseData(cacheState.data);
            this.parseFeedback(cacheState.feedback);
            this.parseSignature(cacheState.signatures);
            if (Platform.OS == 'ios'){
                let isManual = cacheData[i].autoState !== '' ? false : true;
                PatrolStorage.flushState(isManual,cacheData[i],JSON.stringify(cacheState));
            }
        }
       
        return this.cacheFiles;
    }

    static getNewDocumentPath(path){
        let name = path.substr(path.lastIndexOf('/')+1);
        return RNFS.DocumentDirectoryPath + '/' + name;
    }

    static parseData(data){
        let groups = [], items = [], attachments = [];
        data.map(p => groups.push(...p.groups));
        groups.map(p => items.push(...p.items));
        items.map(p => attachments.push(...p.attachment));

        attachments.forEach((attach) => {
            if (attach.mediaType !== store.enumSelector.mediaTypes.TEXT){
                if(Platform.OS == 'ios'){
                    attach.url = this.getNewDocumentPath(attach.url);
                }
                this.parseFile(attach.url);
            }
        })
    }

    static parseFeedback(data){
       let attachments = [];
       data.map(p => attachments.push(...p.attachment));

        attachments.forEach((attach) => {
            if (attach.mediaType !== store.enumSelector.mediaTypes.TEXT){
                if(Platform.OS == 'ios'){
                    attach.url = this.getNewDocumentPath(attach.url);
                }
                this.parseFile(attach.url);
            }
        })
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
