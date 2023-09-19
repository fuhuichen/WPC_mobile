/**
 * React native tab navigator
 */

import React, {Component} from 'react';
import {AppState, BackHandler, DeviceEventEmitter, Image, Platform, StyleSheet,View,
        ImageBackground, KeyboardAvoidingView,Text} from 'react-native';
import TabNavigator from 'react-native-tab-navigator';
import NetInfo from '@react-native-community/netinfo';

import Record from './record/Index';
import Monitor from '../monitor/Index';
import {EMITTER_EVENT, EMITTER_MONITOR, EMITTER_ANALYSIS, REFRESH_ANALYSIS_INFO} from "../common/Constant";
import SoundUtil from "../utils/SoundUtil";
import {ColorStyles} from '../common/ColorStyles';
import I18n from 'react-native-i18n';
import store from "../../mobx/Store";
import Store from "./store/Index";
import Drawer from 'react-native-drawer';
import ServiceDrawer from '../login/ServiceDrawer';
import EventBus from "../common/EventBus";
import AccessHelper from "../common/AccessHelper";
import HeaderBar from "../element/HeaderBar";
import * as lib from '../common/PositionLib';
import {getBottomSpace} from "react-native-iphone-x-helper";
import Bugsnag from '@bugsnag/react-native'


export default class AppLauncher extends Component {
    componentDidMount() {
        console.log("Bugsnag start")
        Bugsnag.start()
        DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
        if(store.userSelector.launcherSelectTab != '') {
            this.setState({ selectedTab: store.userSelector.launcherSelectTab });
            store.userSelector.launcherSelectTab = '';
        }
    }

    onNetChange(isConnected){
        if (!isConnected){
            store.netInfoSelector.offline = true;
        }
        else {
            store.netInfoSelector.offline = false;
        }
    }

    onAppStateChange(nextAppState){
        if (nextAppState != 'active') {
            SoundUtil.stop();
        }
    }

    componentWillMount(){
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('hardwareBackPress', this.onBackAndroid);
        }
        this.unsubscribe = NetInfo.addEventListener(state=>{
            this.onNetChange(state.isConnected);
        });
        AppState.addEventListener('change', this.onAppStateChange);
    }

    componentWillUnmount() {
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('hardwareBackPress', this.onBackAndroid);
        }
        this.unsubscribe && this.unsubscribe();
        AppState.removeEventListener('change', this.onAppStateChange);
        this.emitter && this.emitter.remove();
    }

    onBackAndroid(){
    }

    state= {
        selectedTab: 'Store',
        userSelector: store.userSelector,
        offset:0
    };

    tabItemSelected = (text) =>{
        if(this.state.selectedTab !== text) {
            SoundUtil.stop();
            EventBus.closeModalAll();
        }
        this.setState({
            selectedTab: text
        })
    }

    onDrawer(open){
        let {userSelector} = this.state;
        userSelector.openDrawer = open;
        this.setState({userSelector});

        this.refs.serviceDrawer && this.refs.serviceDrawer.onNotify();
    }

    render() {
        let {userSelector, offset, selectedTab} = this.state;

        let showRecordTab = true;
        if(!AccessHelper.enableRecordView()) {
            showRecordTab = false;
        }
        return (
            <Drawer
                type='overlay'
                content={<ServiceDrawer ref={'serviceDrawer'} onDrawer={(open)=>{this.onDrawer(open)}}/>}
                open={userSelector.openDrawer}
                tapToClose={true}
                openDrawerOffset={offset}
                onCloseStart={() => {}}
                tweenHandler={(ratio) => ({mainOverlay: {opacity:userSelector.openDrawer ? 0.6 : 0,backgroundColor:'black'}})}>
                <TabNavigator style={styles.container} hidesTabTouch={true} tabBarStyle={{backgroundColor:'#ffffff'}}>
                    <TabNavigator.Item
                        selected={selectedTab === 'Store'}
                        title={I18n.t('Check')}
                        titleStyle={{color: "#85898E",marginBottom: 5}}
                        selectedTitleStyle={{color: '#006AB7'}}
                        renderIcon={() => <Image style={styles.image} source={require('../assets/img_cashcheck_normal.png')}/>}
                        renderSelectedIcon={() => <Image style={styles.image} source={require('../assets/img_cashcheck_select.png')}/>}
                        onPress={()=>this.tabItemSelected('Store')}>
                        <Store onMenu={(open)=>{this.onDrawer(open)}}/>
                    </TabNavigator.Item>
                    {showRecordTab && <TabNavigator.Item
                        selected={selectedTab === 'Record'}
                        title={I18n.t('History record')}
                        titleStyle={{color: "#85898E",marginBottom: 5}}
                        selectedTitleStyle={{color: '#006AB7'}}
                        renderIcon={() => <Image style={styles.image} source={require('../assets/img_record_normal.png')} />}
                        renderSelectedIcon={() => <Image style={styles.image} source={require('../assets/img_record_select.png')} />}
                        onPress={()=>this.tabItemSelected('Record')}>
                        <Record onMenu={(open)=>{this.onDrawer(open)}}/>
                    </TabNavigator.Item>}
                </TabNavigator>
            </Drawer>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    image:{
        width: 28,
        height: 28,
        marginBottom:-5
    },
    background:{
        height: Platform.select({
            android: 84,
            ios: 114-lib.statusBarHeight() + (getBottomSpace() > 0 ? 10 : 0)
        }),
        marginTop: Platform.select({
            android: -40,
            ios: -40-lib.statusBarHeight()+ (getBottomSpace() > 0 ? 10 : 0)
        }),
        paddingTop:40
    },
    nopermission:{
        textAlign: 'center',
        marginTop: 200,
        fontSize: 16
    }
});
