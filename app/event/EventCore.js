import React from 'react';
import I18n from "react-native-i18n";
import AccessHelper from "../common/AccessHelper";
import * as simpleStore from "react-native-simple-store";
import store from "../../mobx/Store";

export class EventCore {

    static append(){
        return {
            type: store.enumSelector.actionType.ADD,
            name: I18n.t('Relate'),
            status: null,
            enable: () => AccessHelper.enableEventAdd()
        };
    }

    static add(){
        return {
            type: store.enumSelector.actionType.ADD,
            name: I18n.t('Adding'),
            status: null,
            enable: () => AccessHelper.enableEventAdd()
        };
    }

    static handle(){
        return {
            type: store.enumSelector.actionType.HANDLE,
            name: I18n.t('Handling'),
            status: store.enumSelector.statusType.DONE,
            enable: () => AccessHelper.enableEventHandle()
        }
    }

    static close(){
        return {
            type: store.enumSelector.actionType.CLOSE,
            name: I18n.t('Closing'),
            status: store.enumSelector.statusType.CLOSED,
            enable: () => AccessHelper.enableEventClose()
        }
    }

    static reject(){
        return {
            type: store.enumSelector.actionType.REJECT,
            name: I18n.t('Rejects'),
            status: store.enumSelector.statusType.REJECT,
            enable: () => AccessHelper.enableEventReject()
        }
    }

    static async getEventStore(){
        let storeIds = [];
        let storeTemp = store.storeSelector.storeList;
        const catchStore = await simpleStore.get('EventStorePicker');
        if(catchStore != null){
            /*if ((catchStore.country !== '') && (catchStore.province === '')){
                storeTemp = store.storeSelector.storeList.filter(p => p.country === catchStore.country);
            }

            if ((catchStore.country === '') && (catchStore.province !== '')){
                storeTemp = store.storeSelector.storeList.filter(p => p.province === catchStore.province);
            }

            if ((catchStore.country !== '') && (catchStore.province !== '')){
                storeTemp = store.storeSelector.storeList.filter(p => ((p.country === catchStore.country)
                    && (p.province === catchStore.province)));
            }*/
            
            if (catchStore.country){
                storeTemp = storeTemp.filter(p => p.country === catchStore.country);
            }
            if (catchStore.province){
                storeTemp = storeTemp.filter(p => p.province === catchStore.province);
            }
            if (catchStore.city){
                storeTemp = storeTemp.filter(p => p.city === catchStore.city);
            }
            if(catchStore.groups && catchStore.groups.length > 0) {
                let tmpList = [];
                storeTemp.forEach(store => {
                    if(store.groupList && store.groupList.length > 0) {
                        for(let i=0 ; i<catchStore.groups.length ; ++i) {
                            if(store.groupList.indexOf(catchStore.groups[i].id) != -1) {
                                tmpList.push(store);
                                break;
                            }
                        }
                    }
                })
                storeTemp = tmpList;
            }
            if(catchStore.types && catchStore.types.length > 0) {
                let tmpList = [];
                storeTemp.forEach(store => {
                    if(store.typeList && store.typeList.length > 0) {
                        for(let i=0 ; i<catchStore.types.length ; ++i) {
                            if(store.typeList.indexOf(catchStore.types[i].id) != -1) {
                                tmpList.push(store);
                                break;
                            }
                        }
                    }
                })
                storeTemp = tmpList;
            }

            storeTemp = [...Array.from(new Set(storeTemp))];
        }
        storeTemp.forEach(item=>{
            storeIds.push(item.storeId);
        })
        if (storeIds.length == 0) {
            return -1;
        }
        if (storeIds.length == store.storeSelector.storeList.length){
            return [];
        }
        return storeIds;
    }
}
