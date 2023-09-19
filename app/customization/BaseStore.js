import React, {Component} from 'react';
import {DeviceEventEmitter} from "react-native";
import {UPDATE_BASE_STORE} from "../common/Constant";
import store from "../../mobx/Store";
import PatrolStorage from "../components/inspect/PatrolStorage";


export default class BaseStore extends Component {
    constructor(props) {
        super(props);

        this.emitter = DeviceEventEmitter.addListener(UPDATE_BASE_STORE,()=>{
            this.forceUpdate();
        });
    }

    componentWillUnmount(){
        this.emitter && this.emitter.remove();
    }
}
