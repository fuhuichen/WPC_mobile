import React, {Component} from 'react';
import {DeviceEventEmitter} from "react-native";
import {UPDATE_BASE_PATROL, UPDATE_PATROL_CACHE} from "../common/Constant";
import store from "../../mobx/Store";
import PatrolStorage from "../components/inspect/PatrolStorage";


export default class BasePatrol extends Component {
    constructor(props) {
        super(props);

        this.emitter = DeviceEventEmitter.addListener(UPDATE_BASE_PATROL,(cache)=>{
            this.forceUpdate();
            cache && this.onPersist();
        });

        this.cacher = DeviceEventEmitter.addListener(UPDATE_PATROL_CACHE, () => {
            this.onPersist();
        });
    }

    onPersist(){
        let patrolSelector = store.patrolSelector;
        if ((patrolSelector != null) && (patrolSelector.inspect != null) && (patrolSelector.store != null)){
            PatrolStorage.save({
                uuid: patrolSelector.uuid,
                mode: patrolSelector.inspect.mode,
                tagName: patrolSelector.inspect.name,
                storeName: patrolSelector.store.name,
                autoState: JSON.stringify(patrolSelector),
                manualState: ''
            });
        }
    }

    componentWillUnmount(){
        this.emitter && this.emitter.remove();
        this.cacher && this.cacher.remove();
    }
}
