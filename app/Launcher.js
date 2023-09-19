/**
 * React native tab navigator
 */

import React, {Component} from 'react';
import {AppState, BackHandler, DeviceEventEmitter, Image, Platform, StyleSheet,View,
        ImageBackground, KeyboardAvoidingView,Text} from 'react-native';
import TabNavigator from 'react-native-tab-navigator';
import NetInfo from '@react-native-community/netinfo';

import Event from './event/Index';
import Monitor from './monitor/Index';
import {EMITTER_EVENT, EMITTER_MONITOR, EMITTER_ANALYSIS, REFRESH_ANALYSIS_INFO} from "./common/Constant";
import SoundUtil from "./utils/SoundUtil";
import {ColorStyles} from './common/ColorStyles';
import I18n from 'react-native-i18n';
import Analysis from "./analysis/Index";
import store from "../mobx/Store";
import Store from "./store/Index";
import Drawer from 'react-native-drawer';
import ServiceDrawer from './login/ServiceDrawer';
import EventBus from "./common/EventBus";
import Approve from "./approve/Index";
import Schedule from "./schedule/Index";
import AccessHelper from "./common/AccessHelper";
import HeaderBar from "./element/HeaderBar";
import * as lib from './common/PositionLib';
import {getBottomSpace} from "react-native-iphone-x-helper";
//import Bugsnag from '@bugsnag/react-native'
import {getScheduleWhiteList} from "./common/FetchRequest";

export default class AppLauncher extends Component {

    state= {
        selectedTab: 'Store',
        userSelector: store.userSelector,
        offset:0,
        whiteList: []
    };

    componentDidMount() {
        //Bugsnag.start()
        DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
        if(store.userSelector.launcherSelectTab != '') {
            this.setState({ selectedTab: store.userSelector.launcherSelectTab });
            store.userSelector.launcherSelectTab = '';
        }

        (async () => {
            let result = await getScheduleWhiteList();
            this.setState({whiteList: result.data});
        })()
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
        this.emitter = DeviceEventEmitter.addListener('notification', this.notification.bind(this));
    }

    componentWillUnmount() {
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('hardwareBackPress', this.onBackAndroid);
        }
        this.unsubscribe && this.unsubscribe();
        AppState.removeEventListener('change', this.onAppStateChange);
        this.emitter && this.emitter.remove();
    }

    notification(){
        this.tabItemSelected('Statistics');
    }

    onBackAndroid(){
    }

    tabItemSelected = (text) =>{
        this.setState({
            selectedTab: text
        })

        if(this.state.selectedTab !== text) {
            SoundUtil.stop();
            EventBus.closeModalAll();

            if(text === 'Monitor'){
                DeviceEventEmitter.emit(EMITTER_MONITOR,0);
            }else if(text === 'Event'){
                DeviceEventEmitter.emit(EMITTER_EVENT,0);
            }
            else if (text === 'Statistics'){
                DeviceEventEmitter.emit(REFRESH_ANALYSIS_INFO,0);
            }
        }
    }

    onDrawer(open){
        let {userSelector} = this.state;
        userSelector.openDrawer = open;
        this.setState({userSelector});

        this.refs.serviceDrawer && this.refs.serviceDrawer.onNotify();
    }

    render() {
        let {userSelector, offset, selectedTab, whiteList} = this.state;
        let isMysteryModeOn = userSelector.isMysteryModeOn;
        let showStoreTab = true, showEventTab = true, showApproveTab = true, showScheduleTab = true, showStatisticsTab = true;
        if(isMysteryModeOn && !AccessHelper.enableSendAudit()) {
            showApproveTab = false;
        } else if(!AccessHelper.enableWaitAudit() && !AccessHelper.enableSendAudit() && !AccessHelper.enableTranscriptNotify()) {
            showApproveTab = false;
        }

        if(!AccessHelper.enableLocalInspect() && !AccessHelper.enableRemoteInspect()
            && !AccessHelper.enableInspectReport() && !AccessHelper.enableStoreMonitor()) {
            showStoreTab = false;
        }

        if(!AccessHelper.enableEventHandle() && !AccessHelper.enableEventAdd()
            && !AccessHelper.enableEventClose() && !AccessHelper.enableEventReject()) {
            showEventTab = false;
        }

        if(!AccessHelper.enablePatrolEvaStatistics() && !AccessHelper.enableEventStatistics()
            && !AccessHelper.enableSupervisionEffStatistics() && !AccessHelper.enableSingleStoreStatStatistics()) {
            showStatisticsTab = false;
        }

        if(!AccessHelper.enableSchedule()) {
            showScheduleTab = false;
        }

        if(isMysteryModeOn) {
            if(selectedTab === 'Event' || selectedTab === 'Statistics') {
                this.tabItemSelected('Store');
            }
            showStoreTab = true;
            showApproveTab = true;
            showScheduleTab = false;
        }

        if(!showStoreTab && selectedTab === 'Store') {
            if(showEventTab) {
                this.tabItemSelected('Event');
            } else if(showApproveTab) {
                this.tabItemSelected('Approve');
            } else if(showStatisticsTab) {
                this.tabItemSelected('Statistics');
            }
        }
        let isShowSchedule = false;
        if(whiteList.length > 0) {
            if(whiteList.indexOf(userSelector.accountId) != -1) {
                isShowSchedule = true;
            }
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
                    {(!showStoreTab && !showEventTab && !showApproveTab && !showStatisticsTab) &&
                        <View>
                            <ImageBackground source={require('./assets/img_background.png')} style={styles.background}>
                                <HeaderBar onMenu={()=>{this.onDrawer(true)}} showSearch={false}/>
                            </ImageBackground>
                            <Text style={styles.nopermission}>{I18n.t('No Permission')}</Text>
                        </View>}
                {(showStoreTab || showEventTab || showApproveTab || showStatisticsTab) &&
                <TabNavigator style={styles.container} hidesTabTouch={true} tabBarStyle={{backgroundColor:'#ffffff'}}>
                    {showStoreTab && <TabNavigator.Item
                        selected={this.state.selectedTab === 'Store'}
                        title={I18n.t('Patrol')}
                        titleStyle={{color: "#85898E",marginBottom: 5}}
                        selectedTitleStyle={{color: '#006AB7'}}
                        renderIcon={() => <Image style={styles.image} source={require('./assets/img_patrol_normal.png')}/>}
                        renderSelectedIcon={() => <Image style={styles.image} source={require('./assets/img_patrol_select.png')}/>}
                        onPress={()=>this.tabItemSelected('Store')}>
                        <Store onMenu={(open)=>{this.onDrawer(open)}}/>
                    </TabNavigator.Item>}
                    {(showEventTab && !isMysteryModeOn) && <TabNavigator.Item
                        selected={this.state.selectedTab === 'Event'}
                        title={I18n.t('Event')}
                        titleStyle={{color: "#85898E",marginBottom: 5}}
                        selectedTitleStyle={{color: '#006AB7'}}
                        renderIcon={() => <Image style={styles.image} source={require('./assets/img_event_normal.png')} />}
                        renderSelectedIcon={() => <Image style={styles.image} source={require('./assets/img_event_select.png')} />}
                        onPress={()=>this.tabItemSelected('Event')}>
                        <Event onMenu={(open)=>{this.onDrawer(open)}}/>
                    </TabNavigator.Item>}
                    {showApproveTab && <TabNavigator.Item
                        selected={this.state.selectedTab === 'Approve'}
                        title={I18n.t('Approve')}
                        titleStyle={{color: "#85898E",marginBottom: 5}}
                        selectedTitleStyle={{color: '#006AB7'}}
                        renderIcon={() => <Image style={styles.image} source={require('./assets/img_approve_normal.png')} />}
                        renderSelectedIcon={() => <Image style={styles.image} source={require('./assets/img_approve_select.png')} />}
                        onPress={()=>{ this.tabItemSelected('Approve'); EventBus.refreshApproveInfo();} }>
                        <Approve onMenu={(open)=>{this.onDrawer(open)}}/>
                    </TabNavigator.Item>}
                    {isShowSchedule && showScheduleTab && <TabNavigator.Item
                        selected={this.state.selectedTab === 'Schedule'}
                        title={I18n.t('Schedule')}
                        titleStyle={{color: "#85898E",marginBottom: 5}}
                        selectedTitleStyle={{color: '#006AB7'}}
                        renderIcon={() => <Image style={styles.image} source={require('./assets/img_schedule_normal.png')} />}
                        renderSelectedIcon={() => <Image style={styles.image} source={require('./assets/img_schedule_select.png')} />}
                        onPress={()=>{ this.tabItemSelected('Schedule'); EventBus.refreshScheduleInfo();} }>
                        <Schedule onMenu={(open)=>{this.onDrawer(open)}}/>
                    </TabNavigator.Item>}
                    {(showStatisticsTab && !isMysteryModeOn) && <TabNavigator.Item
                        selected={this.state.selectedTab === 'Statistics'}
                        title={I18n.t('Statistics')}
                        titleStyle={{color: "#85898E", marginBottom: 5}}
                        selectedTitleStyle={{color: '#006AB7'}}
                        renderIcon={() => <Image style={styles.image} source={require('./assets/img_analyze_normal.png')} />}
                        renderSelectedIcon={() => <Image style={styles.image} source={require('./assets/img_analyze_select.png')} />}
                        onPress={()=>this.tabItemSelected('Statistics')}>
                        <Analysis onMenu={(open)=>{this.onDrawer(open)}}/>
                    </TabNavigator.Item>}
                </TabNavigator>}
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
