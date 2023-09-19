import {Actions} from "react-native-router-flux";
import {DeviceEventEmitter} from "react-native";
import {AsyncStorage} from "react-native";
import UserPojo from "../entities/UserPojo";
import store from "../../mobx/Store";
import I18n from 'react-native-i18n';

export default class GlobalParam {
    static STATUS_INSPECTION = 0;
    static MAX_ATTACHMENT = 10;
    static MAX_VIDEO = 2;
    static TOTAL_MAX_ATTACHMENT = 120;

    static setInspectStatus(mode){
        this.STATUS_INSPECTION = mode;
    }

    static getInspectStatus(){
        return this.STATUS_INSPECTION;
    }

    /**
     * Max attachment for remote patrol
     */
    static MaxAttachment = [];

    static setAttachment(id,value){
        let index = this.findAttachment(id);
        (index !== -1) ? (this.MaxAttachment[index].count = value)
            : (this.MaxAttachment.push({id:id, count:value}));
    }

    static getAttachment(id){
        let index = this.findAttachment(id);
        return (index !== -1) ? (this.MaxAttachment[index].count) : 0;
    }

    static onAttachment(){
        if(Actions.currentScene === 'videoMonitor'){
            return true;
        }

        let attachmentCount = 0;
        store.patrolSelector.data.forEach(element => {
            element.groups.forEach(group => {
                group.items.forEach(item => {
                    item.attachment.forEach(attachmentTmp => {
                        if( attachmentTmp.mediaType == store.enumSelector.mediaTypes.IMAGE || 
                            attachmentTmp.mediaType == store.enumSelector.mediaTypes.VIDEO) {
                                attachmentCount++;
                        }
                    })
                })
            })
        })
        store.patrolSelector.feedback.forEach(element => {
            element.attachment.forEach(attachmentTmp => {
                if( attachmentTmp.mediaType == store.enumSelector.mediaTypes.IMAGE || 
                    attachmentTmp.mediaType == store.enumSelector.mediaTypes.VIDEO) {
                        attachmentCount++;
                }
            })
        })

        if(attachmentCount >= this.TOTAL_MAX_ATTACHMENT) {
            DeviceEventEmitter.emit('Toast', I18n.t('Attachment Total Limit'));
            return false;
        }

        /*let id = Actions.state.routes.length;
        if(this.getAttachment(id) >= this.MAX_ATTACHMENT){
            DeviceEventEmitter.emit(`onAttachment${id}`,null);
            return false;
        }

        if(this.getAttachment(id-1) >= this.MAX_ATTACHMENT){
            DeviceEventEmitter.emit(`onAttachment${id-1}`,null);
            return false;
        }

        if(this.getAttachment(id-2) >= this.MAX_ATTACHMENT){
            DeviceEventEmitter.emit(`onAttachment${id-2}`,null);
            return false;
        }*/

        return true;
    }

    static clearAttachment(id){
        let index = this.findAttachment(id);
        let count = this.MaxAttachment.length;
        (index !== -1) ? (this.MaxAttachment.splice(index,count-index)) : null;
    }

    static findAttachment(id) {
        return this.MaxAttachment.findIndex(p => p.id === id);
    }

    /**
     * Message emitter for remote patrol(Normal and notification)
     */
    static getScreenId(){
        return Actions.state.routes.length;
    }

    static isValidScreen(id){
        let index = this.getScreenId();
        return ((index-id) >= 0) && ((index-id) <= 3) ;
    }

    /**
     * Auto login screens
     */
    static services = [
        'pageIndex',
        'homePage',
        'visitorPage',
        'cashcheckhomePage',
    ];

    /**
     * Global store list
     */
    static stores = [];

    static setStores(value){
        this.stores = value;
    }

    static async getDefaultStore(key){
        let store = {id:'',name:''};
        let storeId = await this.getAsyncStore(key);
        let index = this.stores.findIndex(p=>p.storeId === storeId);

        (index == -1) && (this.stores.length > 0) && (index = 0);
        (index !== -1) ? (store.id = this.stores[index].storeId) : null;
        (index !== -1) ? (store.name = this.stores[index].name) : null;
        await this.setAsyncStore(key,store.id);

        return store;
    }

    /**
     * Async store information.
     */
    static async setAsyncStore(key,value){
        try {
            let storeKey = `${key}-${UserPojo.getUserId()}`;
            await AsyncStorage.setItem(storeKey,JSON.stringify(value));
        }catch (e) {
        }
    }

    static async getAsyncStore(key){
        try {
            let storeKey = `${key}-${UserPojo.getUserId()}`;
            const value = await AsyncStorage.getItem(storeKey);
            return value != null ? JSON.parse(value) : null;
        }catch (e) {
            return null;
        }
    }

    /*
    static async deleteAsyncStore(key){
        try {
            let storeKey = `${key}-${UserPojo.getUserId()}`;
            await AsyncStorage.removeItem(storeKey);
        }catch (e) {
        }
    }
    */
}
