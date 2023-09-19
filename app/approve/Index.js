import React, {Component} from 'react';
import {View, StyleSheet, ImageBackground, Dimensions, DeviceEventEmitter, Platform} from 'react-native';
import I18n from 'react-native-i18n';
import {Card} from 'react-native-shadow-cards';
import {Actions} from "react-native-router-flux";
import HeaderBar from "../element/HeaderBar";
import Overview from "../element/Overview";
import store from '../../mobx/Store';
import TouchableActive from "../touchables/TouchableActive";
import NetInfoIndicator from "../components/NetInfoIndicator";
import RNStatusBar from "../components/RNStatusBar";
import {APPROVE_SUCCESS, REFRESH_APPROVE_INFO} from "../common/Constant";
import * as lib from '../common/PositionLib';
import {getBottomSpace} from "react-native-iphone-x-helper";
import PendingFragment from "./PendingFragment";
import CCMineFragment from "./CCMineFragment";
import SubmittedFragment from "./SubmittedFragment";
import ProcessResult from "../event/ProcessResult";
import AccessHelper from "../common/AccessHelper";

const {width} = Dimensions.get('screen');
export default class Approve extends Component{
    state = {
        enumSelector: store.enumSelector,
        approveSelector: store.approveSelector,
        userSelector: store.userSelector,
        viewType: store.enumSelector.viewType.SUCCESS,
        approveType: store.enumSelector.approveType.PENDING,
        screenType: store.approveSelector.screenType.MAIN,
        actionResult: null,
        actionTitle: ''
    };

    constructor(props){
        super(props);
    }

    onMenu(){
        this.props.onMenu(true);
    }

    onSearch(){
        Actions.push('approveSearch');
    }

    onNotify(){

    }

    onMore(){

    }

    componentDidMount(){
        let {approveSelector, userSelector, enumSelector} = this.state;
        let isMysteryModeOn = userSelector.isMysteryModeOn;

        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_APPROVE_INFO, () => {
            this.fragment && this.fragment.loadData();
        });

        this.promptEmitter = DeviceEventEmitter.addListener(APPROVE_SUCCESS, (data) => {
            if (data.type === approveSelector.screenType.MAIN){
                this.setState({actionResult: true, actionTitle: data.prompt});
            }

            this.fragment && this.fragment.loadData();
        });

        if(isMysteryModeOn) {
            this.onChange(enumSelector.approveType.SUBMITTED);
        } else {
            if(!AccessHelper.enableWaitAudit()) {                
                if(AccessHelper.enableSendAudit()) {
                    this.onChange(enumSelector.approveType.SUBMITTED);
                } else if(AccessHelper.enableTranscriptNotify()) {
                    this.onChange(enumSelector.approveType.CC_MINE);
                }
            } else {
                this.onChange(enumSelector.approveType.PENDING);
            }
        }

        if(userSelector.approveType != '') {
            this.onChange(userSelector.approveType);
            userSelector.approveType = '';
        }
    }

    componentWillUnmount(){
        this.refreshEmitter && this.refreshEmitter.remove();
        this.promptEmitter && this.promptEmitter.remove();
    }

    onChange(id){
        let {approveSelector} = this.state;
        approveSelector.type = id;
        this.setState({approveSelector, approveType: id});
    }

    render(){
        let {approveType, enumSelector, actionResult, actionTitle, userSelector} = this.state;
        let isMysteryModeOn = userSelector.isMysteryModeOn;
        let shortcuts = [];

        if(isMysteryModeOn) {            
            //if (AccessHelper.enableSendAudit()){
                shortcuts = [
                    {
                        id: enumSelector.approveType.SUBMITTED,
                        uri: require('../assets/img_type_uncommitted.png'),//require('../assets/img_type_approved.png'),
                        name: I18n.t('Send Approval'),
                        width: 15,
                        height:15
                    }
                ];
                if(approveType != enumSelector.approveType.SUBMITTED) {
                    this.onChange(enumSelector.approveType.SUBMITTED);
                }
            //}            
        } else {
            if (AccessHelper.enableWaitAudit()){
                shortcuts.push({
                    id: enumSelector.approveType.PENDING,
                    uri: require('../assets/img_type_pending.png'),
                    name: I18n.t('Wait approve'),
                    width: 15,
                    height: 15
                });
            }
            if (AccessHelper.enableSendAudit()){
                shortcuts.push({
                    id: enumSelector.approveType.SUBMITTED,
                    uri: require('../assets/img_type_uncommitted.png'),//require('../assets/img_type_approved.png'),
                    name: I18n.t('Send Approval'),
                    width: 15,
                    height:15
                });
            }
            if (AccessHelper.enableTranscriptNotify()){
                shortcuts.push({
                    id: enumSelector.approveType.CC_MINE,
                    uri: require('../assets/img_type_mine.png'),
                    name: I18n.t('Approved copy'),
                    width: 15,
                    height: 15
                });
            }
        }
        
        const fragmentMap = [
            {
                type: enumSelector.approveType.PENDING,
                fragment: <PendingFragment ref={c => this.fragment = c}/>
            },
            {
                type: enumSelector.approveType.SUBMITTED,
                fragment: <SubmittedFragment ref={c => this.fragment = c}/>
            },
            {
                type: enumSelector.approveType.CC_MINE,
                fragment: <CCMineFragment ref={c => this.fragment = c}/>
            }
        ];

        return (
            <TouchableActive style={styles.container} clearCollection={true}>
                <RNStatusBar translucent={false}/>
                <Card style={styles.card} elevation={0}>
                    <ImageBackground source={require('../assets/img_background.png')} style={styles.background}>
                        <HeaderBar onMenu={()=>{this.onMenu()}}
                                onSearch={()=>{this.onSearch()}}
                                onNotify={()=>{this.onNotify()}}/>
                        <Overview data={shortcuts}
                                  id={approveType}
                                  onChange={(id)=>{this.onChange(id)}}/>
                    </ImageBackground>
                </Card>
                <NetInfoIndicator />

                <View style={styles.fragment}>
                    {fragmentMap.find(p => p.type === approveType).fragment}
                </View>
                <ProcessResult actionResult={actionResult}
                               title={actionTitle}
                               margin={110}
                               reset={() => this.setState({actionResult: null})}/>
            </TouchableActive>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FA',
    },
    fragment:{
        flex:1,
    },
    card:{
        width:width,
        ...Platform.select({
            android:{
                height:164
            },
            ios:{
                marginTop: -10 - (getBottomSpace() > 0 ? 10 : 0)
            }
        })
    },
    background:{
        height: Platform.select({
            android: 204,
            ios: 234-lib.statusBarHeight() + (getBottomSpace() > 0 ? 10 : 0)
        }),
        marginTop: Platform.select({
            android: -40,
            ios: -40-lib.statusBarHeight()+ (getBottomSpace() > 0 ? 10 : 0)
        }),
        paddingTop:40
    }
});
