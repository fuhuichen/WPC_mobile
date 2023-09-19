import React from 'react';
import * as simpleStore from "react-native-simple-store";
import store from "../../../mobx/Store";
import moment from "moment";

export class ApproveCore {

    static async getStores(){
        let storeIds = [];
        //console.log("store.storeSelector.storeList : ", store.storeSelector.storeList);
        let storeTemp = store.storeSelector.storeList;
        const catchStore = await simpleStore.get('ApproveStorePicker');
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

    static formatRequest(){
        return {
            beginTs: 0,
            endTs: moment().endOf('day').unix()*1000,
            filter: {
                page: 0,
                size: 100
            },
            order: {
                direction: 'desc',
                property: 'processStartTs'
            }
        }
    }
}
