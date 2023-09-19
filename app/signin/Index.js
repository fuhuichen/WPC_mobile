import React, { Component } from 'react';
import PropTypes from 'prop-types'
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    DeviceEventEmitter,
    Dimensions,
    Platform
} from 'react-native';

import ModalBox from 'react-native-modalbox';
import {Actions} from "react-native-router-flux";
import I18n from 'react-native-i18n';
import store from "../../mobx/Store";
import Locating from "./Locating";
import LocateSuccess from "./LocateSuccess";
import LocateFailure from "./LocateFailure";
import Signing from "./Signing";
import SignSuccess from "./SignSuccess";
import SignFailure from "./SignFailure";
import TimeUtil from "../utils/TimeUtil";
import moment from "moment";
import RNLocation from "react-native-location";
import * as lib from "../common/PositionLib";
import LocationServicesDialogBox from "react-native-android-location-services-dialog-box";
import {getAdjacent, getSystemTime, uploadCheckin} from "../common/FetchRequest";
import {PERMISSIONS, request, RESULTS} from "react-native-permissions";

RNLocation.configure({
    allowsBackgroundLocationUpdates: true,
    distanceFilter: 5.0
});

const {width} = Dimensions.get('screen');
export default class SignIn extends Component {
    state = {
        enumSelector: store.enumSelector,
        patrolSelector: store.patrolSelector,
        viewType: store.enumSelector.signType.LOCATING,
        systemTime: 0,
        storeId: ''
    };

    componentWillUnmount() {
        this.interval && clearInterval(this.interval);
        this.stopUpdatingLocation();
    }

    open(data){
        let {store, inspect} = data;
        this.data = data;

        let {enumSelector, patrolSelector} = this.state;

        let checkin = (inspect.inspectSettings != null) ? inspect.inspectSettings.find(p => p.name === 'checkin') : null;
        if ((inspect.mode === enumSelector.patrolType.REMOTE) || (checkin == null) || !checkin.value){
            patrolSelector.signTime = 0;
            patrolSelector.distance = null;
            patrolSelector.mapDownloadPath = null;
            this.setState({patrolSelector});

            Actions.push('patrol',{store, inspect});
        }else {
            this.setState({
                systemTime: 0,
                storeId: data.store.storeId,
                viewType: enumSelector.signType.LOCATING
            }, () => {
                this.onPermission();
            });
        }
    }

    openCashCheck(formId) {
        Actions.push('cashchecking', {formId: formId});
    }

    onPermission(){
        request(Platform.select({
                android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
                ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
            }),
        ).then(result => {
            if (result ===  RESULTS.GRANTED){
                this.onLocation();
            }
            else {
                if (Platform.OS === 'ios'){
                    DeviceEventEmitter.emit('Toast',I18n.t('Turn on locate permission'))
                }
            }
        });
    }

    onLocation(){
        RNLocation.getCurrentPermission()
            .then(currentPermission => {
                if(currentPermission === 'authorizedFine' || currentPermission === 'authorizedWhenInUse'){
                    if(lib.isAndroid()){
                        LocationServicesDialogBox.checkLocationServicesIsEnabled({
                            message: I18n.t('Open locate'),
                            ok: I18n.t('Confirm'),
                            cancel: I18n.t('Cancel'),
                            showDialog: true,
                            openLocationServices:true
                        }).then((success)=>{
                            this.startUpdatingLocation();
                        }).catch((error)=>{})
                    }else {
                        this.startUpdatingLocation();
                    }
                }
            }).catch((err)=>{});
    }

    startUpdatingLocation(){
        let {patrolSelector} = this.state;

        try {
            this.locationSubscription = RNLocation.subscribeToLocationUpdates(
                async locations => {
                    patrolSelector.longitude = locations[0].longitude;
                    patrolSelector.latitude = locations[0].latitude;
                    patrolSelector.store = this.data.store;

                    this.stopUpdatingLocation();
                    this.setState({patrolSelector}, () => {
                        this.modal && this.modal.open();
                    });
                });
        }catch (e) {
        }
    }

    stopUpdatingLocation = () => {
        this.locationSubscription && this.locationSubscription();
        this.locationSubscription = null
    };

    close(){
        this.modal && this.modal.close();
    }

    renderHeader(){
        let {systemTime} = this.state, dateTime = '', weekTime = '';

        if (systemTime !== 0){
            dateTime = moment(systemTime).format('YYYY/MM/DD');
            weekTime = TimeUtil.getDetailTime(systemTime, true)[6];
        }

        return (
            <View style={styles.header}>
                <Text style={styles.title}>{I18n.t('Store sign in')}</Text>
                <Text style={styles.date}>{dateTime} {weekTime}</Text>
            </View>
        )
    }

    renderCancel(){
        let {viewType, enumSelector} = this.state;
        return (
            <View style={styles.cancel}>
            <TouchableOpacity activeOpacity={0.5} onPress={() => {this.modal && this.modal.close()}}>
                <View style={[styles.button,{marginRight:8}]}>
                    <Text style={styles.operator}>{I18n.t('Cancel')}</Text>
                </View>
            </TouchableOpacity>
            {viewType == enumSelector.signType.LOCATE_FAILURE && <TouchableOpacity activeOpacity={0.5} onPress={async () => await this.onIgnore()}>
                <View style={[styles.button,{marginRight:8}]}>
                    <Text style={styles.operator}>{I18n.t('Patrol skip')}</Text>
                </View>
            </TouchableOpacity>}
            </View>
        )
    }

    async onIgnore(){
        this.modal && this.modal.close();

        await this.checkinIgnore();

        let {store, inspect} = this.data;
        Actions.push('patrol',{store, inspect});
    }

    async checkinIgnore(){
        try {
            let {systemTime, enumSelector, patrolSelector} = this.state;
            
            let result = await uploadCheckin({
                ts: systemTime,
                longitude: patrolSelector.longitude,
                latitude: patrolSelector.latitude,
                isCheckInIgnore: true
            });

            if (result.errCode === enumSelector.errorType.SUCCESS){
                patrolSelector.checkinId = result.data.id;
                patrolSelector.signTime = systemTime;
                patrolSelector.checkinIgnore = true;
                patrolSelector.distance = null;
                this.setState({patrolSelector});
            }
        }catch (e) {
        }
    }

    onConfirm(){
        this.modal && this.modal.close();

        let {store, inspect} = this.data;
        Actions.push('patrol',{store, inspect});
    }

    onInterval(){
        let {enumSelector} = this.state;

        this.interval = setInterval(async () => {
            let result = await getSystemTime();
            if (result.errCode === enumSelector.errorType.SUCCESS){
                this.setState({systemTime: result.data.ts});
            }
        }, 600*1000);
    }

    renderBottom(){
        return (
            <View style={styles.bottom}>
                <TouchableOpacity activeOpacity={0.5} onPress={() => {this.modal && this.modal.close()}}>
                    <View style={[styles.button,{marginRight:8}]}>
                        <Text style={styles.operator}>{I18n.t('Cancel')}</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.5} onPress={() => this.onConfirm()}>
                    <View style={[styles.button,{marginRight:8}]}>
                        <Text style={styles.operator}>{I18n.t('Sign confirm')}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    render() {
        let {enumSelector, viewType, systemTime, storeId} = this.state;

        const fragmentMap = [
            {
                type: enumSelector.signType.LOCATING,
                fragment: <Locating time={systemTime}
                                    storeId={storeId}
                                    onTime={(systemTime) => {
                                        this.setState({systemTime});
                                        this.onInterval();
                                    }}
                                    onData={(viewType) => this.setState({viewType})}/>
            },
            {
                type: enumSelector.signType.LOCATE_SUCCESS,
                fragment: <LocateSuccess time={systemTime}
                                         onData={(viewType) => this.setState({viewType})}/>
            },
            {
                type: enumSelector.signType.LOCATE_FAILURE,
                fragment: <LocateFailure time={systemTime}
                                         onTime={(systemTime) => {
                                            this.setState({systemTime});
                                            this.onInterval();
                                         }}
                                         onData={(viewType) => this.setState({viewType})}/>
            },
            {
                type: enumSelector.signType.SIGNING,
                fragment: <Signing time={systemTime}
                                   onData={(viewType) => this.setState({viewType})}/>
            },
            {
                type: enumSelector.signType.SIGN_SUCCESS,
                fragment: <SignSuccess time={systemTime}/>
            },
            {
                type: enumSelector.signType.SIGN_FAILURE,
                fragment: <SignFailure time={systemTime}
                                       onData={(viewType) => this.setState({viewType})}/>
            }
        ];
        
        let modalBox_height = viewType == enumSelector.signType.LOCATE_FAILURE ? 601 : 381;
        let panel_height = viewType == enumSelector.signType.LOCATE_FAILURE ? 549 : 329;
        let marginTop = viewType == enumSelector.signType.LOCATE_FAILURE ? -110 : 0;

        return (
            <ModalBox style={[styles.modalBox, {height: modalBox_height, marginTop: marginTop}]}
                      ref={c => this.modal = c}
                      position={"center"}
                      isDisabled={false}
                      swipeToClose={false}
                      backdropPressToClose={false}
                      backButtonClose={true}
                      coverScreen={true}>
                <View style={[styles.panel, {height: panel_height}]}>
                    {this.renderHeader()}
                    {fragmentMap.find(p => p.type === viewType).fragment}
                </View>
                {(viewType !== enumSelector.signType.SIGN_SUCCESS) && this.renderCancel()}
                {(viewType === enumSelector.signType.SIGN_SUCCESS) && this.renderBottom()}
            </ModalBox>
        )
    }
}

const styles = StyleSheet.create({
    modalBox: {
        width: width-60,
        height: 381,
        borderRadius: 10,
        backgroundColor: 'rgb(247,249,250)'
    },
    panel:{
        height: 329,
        justifyContent: 'center'
    },
    cancel:{
        backgroundColor: '#fff',
        height: 52,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'flex-end',
        borderBottomLeftRadius:10,
        borderBottomRightRadius:10
    },
    bottom:{
        backgroundColor: '#fff',
        height: 52,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'flex-end',
        borderBottomLeftRadius:10,
        borderBottomRightRadius:10
    },
    header:{
        height:91,
        paddingLeft:16,
        paddingRight:16,
        alignItems:'center'
    },
    title:{
        fontSize:19,
        color:'rgb(134,136,138)',
        marginTop:25
    },
    date:{
        fontSize:16,
        color:'rgb(100,104,109)',
        marginTop:18
    },
    button:{
        paddingLeft:22,
        paddingRight: 22,
        height: 36
    },
    operator:{
        height: 36,
        lineHeight: 36,
        textAlignVertical:'center',
        color:'rgb(0,106,183)'
    }
});
