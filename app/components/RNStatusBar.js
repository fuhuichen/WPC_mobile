/**
 * Reference: react-native-status-bar-color
 */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
    View,
    StatusBar,
    Platform,
    DeviceEventEmitter
} from 'react-native';

import * as lib from '../common/PositionLib';
import {ColorStyles} from "../common/ColorStyles";
import NavigationBar from 'react-native-navbar-color'

export default class RNStatusBar extends Component{
    state = {
        color: ColorStyles.STATUS_RGB_BLUE,
        theme: 'light',
        translucent:false
    };

    propTypes = {
        color: PropTypes.string,
        theme: PropTypes.string
    };

    componentDidMount(){
        this.setStatusBar();

        this.colorEmitter = DeviceEventEmitter.addListener('onStatusBar',(color)=>{
            let theme = (color !== ColorStyles.STATUS_RGB_BLUE && color !== 'black') ? 'dark' : 'light';
            this.setState({color,theme}, () => {this.setStatusBar();});
        });

        this.translucentEmitter = DeviceEventEmitter.addListener('onStatusBarTrans',(translucent)=>{
            this.setState({translucent});
        });
    }

    componentWillUnmount() {
        this.colorEmitter && this.colorEmitter.remove();
        this.translucentEmitter && this.translucentEmitter.remove();
    }

    setStatusBar(){
        let {color, theme} = this.state;
        let component = Platform.select({
            android: () => {
                NavigationBar.setStatusBarColor(color,false);
                NavigationBar.setStatusBarTheme(theme,false);
            },
            ios: () => {}
        });

        component();
    }

    render(){
        return (
            <View style={{height: lib.statusBarHeight(),backgroundColor:this.state.color}}>
                <StatusBar
                    androidTranslucent={true}
                    backgroundColor={this.state.color}
                    barStyle={`${this.state.theme}-content`}
                    networkActivityIndicatorVisible={false}/>
            </View>
        )
    }
}
