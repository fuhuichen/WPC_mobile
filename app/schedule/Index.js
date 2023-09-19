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
import {REFRESH_SCHEDULE_INFO} from "../common/Constant";
import * as lib from '../common/PositionLib';
import {getBottomSpace} from "react-native-iphone-x-helper";
import TodayScheduleFragment from "./TodayScheduleFragment";
import AllScheduleFragment from "./AllScheduleFragment";

const {width} = Dimensions.get('screen');
export default class Schedule extends Component{
    state = {
        enumSelector: store.enumSelector,
        userSelector: store.userSelector,
        viewType: store.enumSelector.viewType.SUCCESS,
        scheduleType: store.enumSelector.scheduleType.TODAY
    };

    constructor(props){
        super(props);
    }

    onMenu(){
        this.props.onMenu(true);
    }

    onNotify(){

    }

    onChange(id){
        this.setState({scheduleType: id});
    }

    componentDidMount(){
        let {userSelector} = this.state;
        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_SCHEDULE_INFO, () => {
            this.fragment && this.fragment.loadData();
        });

        if(userSelector.scheduleType != '') {
            this.onChange(userSelector.scheduleType);
            userSelector.scheduleType = '';
        }
    }

    componentWillUnmount(){
        this.refreshEmitter && this.refreshEmitter.remove();
    }

    render(){
        let {enumSelector, userSelector, scheduleType} = this.state;
        let shortcuts = [{
            id: enumSelector.scheduleType.TODAY,
            uri: require('../assets/img_type_pending.png'),
            name: I18n.t('Today Schedule'),
            width: 15,
            height: 15
        },{
            id: enumSelector.scheduleType.ALL,
            uri: require('../assets/img_type_all.png'),
            name: I18n.t('All Schedule'),
            width: 15,
            height: 15
        }];
        
        const fragmentMap = [
            {
                type: enumSelector.scheduleType.TODAY,
                fragment: <TodayScheduleFragment ref={c => this.fragment = c}/>
            },
            {
                type: enumSelector.scheduleType.ALL,
                fragment: <AllScheduleFragment ref={c => this.fragment = c}/>
            }
        ];

        return (
            <TouchableActive style={styles.container} clearCollection={true}>
                <RNStatusBar translucent={false}/>
                <Card style={styles.card} elevation={0}>
                    <ImageBackground source={require('../assets/img_background.png')} style={styles.background}>
                        <HeaderBar onMenu={()=>{this.onMenu()}}
                                showSearch={false}
                                onNotify={()=>{this.onNotify()}}/>
                        <Overview data={shortcuts}
                                  id={scheduleType}
                                  onChange={(id)=>{this.onChange(id)}}/>
                    </ImageBackground>
                </Card>
                <NetInfoIndicator />

                <View style={styles.fragment}>
                    {fragmentMap.find(p => p.type === scheduleType).fragment}
                </View>
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
