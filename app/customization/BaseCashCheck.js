import React, {Component} from 'react';
import {DeviceEventEmitter} from "react-native";
import {UPDATE_BASE_CASHCHECK, UPDATE_CASHCHECK_CACHE} from "../common/Constant";
import store from "../../mobx/Store";
import CashCheckStorage from "../cashcheck/checking/CashCheckStorage";


export default class BasePatrol extends Component {
    constructor(props) {
        super(props);

        this.emitter = DeviceEventEmitter.addListener(UPDATE_BASE_CASHCHECK,(cache)=>{
            this.forceUpdate();
            cache && this.onPersist();
        });

        this.cacher = DeviceEventEmitter.addListener(UPDATE_CASHCHECK_CACHE, () => {
            this.onPersist();
        });
    }

    onPersist(){
        let cashcheckSelector = store.cashcheckSelector;
        let storeSelector = store.storeSelector;
        if ((cashcheckSelector != null) && (cashcheckSelector.tagName != null) && (storeSelector.collection != null)){
            CashCheckStorage.save({
                uuid: cashcheckSelector.uuid,
                //mode: cashcheckSelector.inspect.mode,
                tagName: cashcheckSelector.tagName,
                storeName: storeSelector.collection.name,
                autoState: JSON.stringify(cashcheckSelector),
                manualState: ''
            });
        }
    }

    componentWillUnmount(){
        this.emitter && this.emitter.remove();
        this.cacher && this.cacher.remove();
    }
}
