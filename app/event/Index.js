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
import {REFRESH_EVENT_INFO} from "../common/Constant";
import * as lib from '../common/PositionLib';
import {getBottomSpace} from "react-native-iphone-x-helper";
import EventFragment from "./EventFragment";
import PopupEvent from "../customization/PopupEvent";
import DoneFragment from "./DoneFragment";
import RecentFragment from "./RecentFragment";
import ClosedFragment from "./ClosedFragment";
import PendingFragment from "./PendingFragment";
import ProcessResult from "./ProcessResult";

const {width} = Dimensions.get('screen');
export default class Event extends Component{
    state = {
        eventSelector: store.eventSelector,
        enumSelector: store.enumSelector,
        viewType: store.enumSelector.viewType.SUCCESS,
        eventType: store.enumSelector.eventType.ALL,
        actionType: store.enumSelector.actionType.ADD,
        actionResult: null
    };

    constructor(props){
        super(props);

        let {enumSelector} = this.state;
        this.shortcuts = [
            {
                id: enumSelector.eventType.ALL,
                name: I18n.t('Event all'),
                uri: require('../assets/img_event_all.png'),
                width: 14.8,
                height: 14.8
            },
            {
                id: enumSelector.eventType.RECENT,
                name: I18n.t('Event recent'),
                uri: require('../assets/img_event_recent.png'),
                width: 15,
                height: 15
            },
            {
                id: enumSelector.eventType.PENDING,
                name: I18n.t('Event pending'),
                uri: require('../assets/img_event_pending.png'),
                width: 15,
                height: 15
            },
            {
                id: enumSelector.eventType.DONE,
                name: I18n.t('Event done'),
                uri: require('../assets/img_event_done.png'),
                width: 15,
                height: 15
            },
            {
                id: enumSelector.eventType.CLOSED,
                name: I18n.t('Store event closed'),
                uri: require('../assets/img_event_closed.png'),
                width: 15,
                height: 15
            }
        ];
    }

    onMenu(){
        this.props.onMenu(true);
    }

    onSearch(){
        Actions.push('eventSearch');
    }

    onNotify(){

    }

    onMore(){

    }

    componentDidMount(){
        let {eventSelector} = this.state;
        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_EVENT_INFO, () => {
            eventSelector.visible = false;
            this.setState({eventSelector}, () => {
                this.fragment && this.fragment.fetchData();
            })
        });
    }

    componentWillUnmount(){
        this.refreshEmitter && this.refreshEmitter.remove();
    }

    onChange(id){
        let {eventSelector} = this.state;
        eventSelector.visible = false;
        this.setState({eventSelector, eventType: id, actionResult: null});
    }

    render(){
        let {eventType, enumSelector, actionType, actionResult} = this.state;
        const fragmentMap = [
            {
                type: enumSelector.eventType.ALL,
                fragment: <EventFragment ref={c => this.fragment = c}/>
            },
            {
                type: enumSelector.eventType.DONE,
                fragment: <DoneFragment ref={c => this.fragment = c}/>
            },
            {
                type: enumSelector.eventType.RECENT,
                fragment: <RecentFragment ref={c => this.fragment = c} onRefresh={(actionType) => {
                    this.setState({actionType, actionResult: true});
                }}/>
            },
            {
                type: enumSelector.eventType.CLOSED,
                fragment: <ClosedFragment ref={c => this.fragment = c}/>
            },
            {
                type: enumSelector.eventType.PENDING,
                fragment: <PendingFragment ref={c => this.fragment = c}/>
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
                        <Overview data={this.shortcuts}
                                  onChange={(id)=>{this.onChange(id)}}/>
                    </ImageBackground>
                </Card>
                <NetInfoIndicator />

                <View style={styles.fragment}>
                    {fragmentMap.find(p => p.type === eventType).fragment}
                </View>
                <ProcessResult actionType={actionType} actionResult={actionResult} margin={110}
                               reset={() => this.setState({actionResult: null})}/>
                <PopupEvent onTrigger={(actionType, actionResult) => {this.setState({actionType, actionResult})}}/>
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
