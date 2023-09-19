import React, { Component } from 'react';
import {
    BackHandler,
    Platform,
} from 'react-native';

export default class AndroidBack extends Component {
    constructor(props) {
        super(props);
    }

    componentWillMount(){
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('hardwareBackPress', this.onBackAndroid);
        }
    }

    componentWillUnmount() {
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('hardwareBackPress', this.onBackAndroid);
        }
    }

    onBackAndroid = ()=>{
    }
}