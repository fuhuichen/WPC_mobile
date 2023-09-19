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
import * as lib from '../common/PositionLib';
import {getBottomSpace} from "react-native-iphone-x-helper";
import StoreFragment from "./store/StoreFragment";
import PatrolFragment from "./patrol/PatrolFragment";
import EventFragment from "./event/EventFragment";
import RecordFragment from "./record/RecordFragment";
import ProcessResult from "../event/ProcessResult";
import {REFRESH_ANALYSIS_INFO} from "../common/Constant";
import FilterCore from "./common/FilterCore";
import SlotView from "../customization/SlotView";
import RNStatusBar from "../components/RNStatusBar";
import AccessHelper from "../common/AccessHelper";

const {width} = Dimensions.get('screen');
export default class Analysis extends Component{
    state = {
        analysisSelector: store.analysisSelector,
        enumSelector: store.enumSelector,
        viewType: store.enumSelector.viewType.SUCCESS,
        analysisType: store.enumSelector.analysisType.STORE,
        actionType: store.enumSelector.actionType.ADD,
        actionResult: null
    };

    constructor(props){
        super(props);

        let {enumSelector} = this.state;
        /*this.shortcuts = [
            {
                id: enumSelector.analysisType.STORE,
                uri: require('../assets/analysis_store.png'),
                name: I18n.t('Analysis store'),
                width: 16,
                height: 14
            },
            {
                id: enumSelector.analysisType.PATROL,
                uri: require('../assets/analysis_patrol.png'),
                name: I18n.t('Analysis patrol'),
                width: 13,
                height: 15
            },
            {
                id: enumSelector.analysisType.EVENT,
                uri: require('../assets/analysis_event.png'),
                name: I18n.t('Analysis event'),
                width: 15,
                height: 16
            },
            {
                id: enumSelector.analysisType.RECORD,
                uri: require('../assets/analysis_record.png'),
                name: I18n.t('Analysis record'),
                width: 14,
                height: 14
            }
        ];*/
        this.shortcuts = [];
        if(AccessHelper.enableSingleStoreStatStatistics()) {
            this.shortcuts.push({
                id: enumSelector.analysisType.STORE,
                uri: require('../assets/analysis_store.png'),
                name: I18n.t('Analysis store'),
                width: 16,
                height: 14
            });
        }
        if(AccessHelper.enablePatrolEvaStatistics()) {
            this.shortcuts.push({
                id: enumSelector.analysisType.PATROL,
                uri: require('../assets/analysis_patrol.png'),
                name: I18n.t('Analysis patrol'),
                width: 13,
                height: 15
            });
        }
        if(AccessHelper.enableEventStatistics()) {
            this.shortcuts.push({
                id: enumSelector.analysisType.EVENT,
                uri: require('../assets/analysis_event.png'),
                name: I18n.t('Analysis event'),
                width: 15,
                height: 16
            });
        }
        if(AccessHelper.enableSupervisionEffStatistics()) {
            this.shortcuts.push({
                id: enumSelector.analysisType.RECORD,
                uri: require('../assets/analysis_record.png'),
                name: I18n.t('Analysis record'),
                width: 14,
                height: 14
            });
        }
    }

    onMenu(){
        this.props.onMenu(true);
    }

    onSearch(){

    }

    onNotify(){

    }

    onMore(){

    }

    componentDidMount(){
        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_ANALYSIS_INFO, () => {
            this.fragment && this.fragment.fetchData();
        });
    }

    componentWillUnmount(){
        this.refreshEmitter && this.refreshEmitter.remove();
    }

    onChange(id){
        this.setState({analysisType: id, actionResult: null});
    }

    render(){
        let {analysisType, enumSelector, actionType, actionResult} = this.state;
        const fragmentMap = [
            {
                type: enumSelector.analysisType.STORE,
                fragment: <StoreFragment ref={c => this.fragment = c} onRefresh={(actionType) => {
                    this.setState({actionType, actionResult: true});
                }}/>
            },
            {
                type: enumSelector.analysisType.PATROL,
                fragment: <PatrolFragment ref={c => this.fragment = c}/>
            },
            {
                type: enumSelector.analysisType.EVENT,
                fragment: <EventFragment ref={c => this.fragment = c}/>
            },
            {
                type: enumSelector.analysisType.RECORD,
                fragment: <RecordFragment ref={c => this.fragment = c}/>
            }
        ];

        return (
            <TouchableActive style={styles.container}>
                <RNStatusBar translucent={false}/>
                <Card style={styles.card} elevation={0}>
                    <ImageBackground source={require('../assets/img_background.png')} style={styles.background}>
                        <HeaderBar showSearch={false}
                                onMenu={()=>{this.onMenu()}}
                                onSearch={()=>{this.onSearch()}}
                                onNotify={()=>{this.onNotify()}}/>
                        <Overview data={this.shortcuts}
                                  onChange={(id)=>{this.onChange(id)}}/>
                    </ImageBackground>
                </Card>
                <NetInfoIndicator />

                <View style={styles.fragment}>
                    {fragmentMap.find(p => p.type === analysisType).fragment}
                </View>
                <ProcessResult actionType={actionType} actionResult={actionResult} margin={110}
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
        flex:1
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
