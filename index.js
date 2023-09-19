/**
 * Main page for Look Store.
 */

import {name as appName} from './app.json';
import React, {Component} from 'react';
import {AppRegistry, StyleSheet, Text, View, YellowBox, Alert, DeviceEventEmitter, Platform,SafeAreaView, I18nManager} from 'react-native';

import RouterUtil from './app/utils/RouterUtil';
import {MenuProvider} from 'react-native-popup-menu';
import {ColorStyles} from './app/common/ColorStyles';
import * as lib from './app/common/PositionLib';
import I18n from 'react-native-i18n';
import * as RNLocalize from "react-native-localize";
import PhoneInfo from "./app/entities/PhoneInfo";
import Orientation from 'react-native-orientation-locker';
import {Actions} from "react-native-router-flux";
//import JMessage from "./app/notification/JMessage";
import PlayerUtil from "./app/utils/PlayerUtil";
import {setJSExceptionHandler} from 'react-native-exception-handler';
import ModalCenter from "./app/components/ModalCenter";
import RouteMgr from "./app/notification/RouteMgr";
import bgMessaging from './app/notification/bgMessaging';
import BusyIndicator from "./app/components/BusyIndicator";
import Toast from "react-native-easy-toast";
import RNStatusBar from "./app/components/RNStatusBar";
import {getBottomSpace} from "react-native-iphone-x-helper";
import DeviceInfo from 'react-native-device-info';
const timer = require('react-native-timer');


I18n.fallbacks = true;
I18n.translations = {
    'en': require('./app/languages/en'),
    'zh-CN': require('./app/languages/zh-CN'),
    'zh-TW': require('./app/languages/zh-TW'),
    'zh-HK': require('./app/languages/zh-TW'),
    'zh-Hans': require('./app/languages/zh-CN'),
    'zh-Hant': require('./app/languages/zh-TW'),
    'zh-Hans-CN': require('./app/languages/zh-CN'),
    'zh-Hant-CN': require('./app/languages/zh-TW'),
    'zh-Hans-US': require('./app/languages/zh-CN'),
    'zh-Hant-US': require('./app/languages/zh-TW'),
    'zh-Hant-TW': require('./app/languages/zh-TW'),
    'zh-Hant-HK': require('./app/languages/zh-TW'),
    'zh-Hant-MO': require('./app/languages/zh-TW'),
    'ja': require('./app/languages/ja'),
    'ko': require('./app/languages/ko'),
    'vn': require('./app/languages/vn'),
    'id': require('./app/languages/id'),
    'th': require('./app/languages/th'),
};

RNLocalize.addEventListener("change", () => {
    if(PhoneInfo.setSystemLocale()){
        //JMessage.close();
        Actions.reset('loginScreen');
    }
});

const errorHandler = (e, isFatal) => {
    if (isFatal) {
        Alert.alert(
            'Unexpected error occurred',
            `Error:${e.name} ${e.message}`,
            [{text: 'OK'}]
        );
    }
};

setJSExceptionHandler(errorHandler,false);

let globalTimer = 'globalTimer';
class WPCMobile extends Component {
    state = {
        slotHeight: 0
    };

    componentDidMount(){
        I18nManager.forceRTL(false);
        I18nManager.allowRTL(false);

        Orientation.lockToPortrait();
        this.emitter = DeviceEventEmitter.addListener('OnMessageChange', this.onOpenModal.bind(this));
        this.indicator = DeviceEventEmitter.addListener('OnBusyIndicator', this.BusyIndicatorShow.bind(this));
        this.toast = DeviceEventEmitter.addListener('Toast', this.onToast.bind(this));
        this.runTask();

        if (!lib.isAndroid()){
            (async ()=> {
                const deviceName = await DeviceInfo.getDeviceName();
                if (deviceName.includes('mini')){
                    this.setState({slotHeight: 4});
                }
            })();
        }
    }

    componentWillUnmount(): void {
        this.emitter && this.emitter.remove();
        this.indicator && this.indicator.remove();
        this.toast && this.toast.remove();
        if(timer.intervalExists(globalTimer)){
            (async ()=>{
                await timer.clearInterval(globalTimer);
            })();
        }
        //JMessage.unInit();
    }

    onToast(str){
        this.refs.toast && this.refs.toast.show(str, 3000);
    }

    BusyIndicatorShow(flag){
        if (flag){
            this.refs.indicator.openEx(I18n.t('Loading'));
        }
        else {
            this.refs.indicator.close();
        }
    }

    onOpenModal(){
        this.refs.notification.openEx(I18n.t('Switch New'));
    }

    onCloseModal(){
        this.refs.notification.close();
        RouteMgr.handleEx(false);
    }

    runTask(){
        timer.setInterval(globalTimer,()=>{
           try {
                if(Actions.currentScene !== 'loginScreen'){
                    PlayerUtil.updateToken();
                }
           }catch (e) {
           }
        },3000)
    }

    render() {
        return (
            <MenuProvider>
                <View style={{height: this.state.slotHeight, backgroundColor: ColorStyles.STATUS_RGB_BLUE}}/>
                <View style={{flex:1,backgroundColor: ColorStyles.COLOR_STATUS_BACKGROUND,
                        marginBottom: Platform.select({android:0, ios: -getBottomSpace()})}}>
                    <RNStatusBar/>
                    <View style={styles.container}>
                        <RouterUtil />
                    </View>

                    <ModalCenter ref={"notification"} title={I18n.t('Switch New')} confirm={()=>this.onCloseModal()}/>
                    <BusyIndicator ref={"indicator"} title={I18n.t('Loading')}/>
                    <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
                </View>
                {
                    (Platform.OS === 'ios') ? <SafeAreaView style={{backgroundColor:'#fff'}}/> : null
                }
            </MenuProvider>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
        marginBottom: lib.defaultBottomSpace()
    }
});

Text.defaultProps = Object.assign({}, Text.defaultProps, {allowFontScaling: false})
YellowBox.ignoreWarnings(['ListView is deprecated']);
console.disableYellowBox = true

AppRegistry.registerComponent(appName, () => WPCMobile);
//AppRegistry.registerHeadlessTask('RNFirebaseBackgroundMessage', () => bgMessaging);
