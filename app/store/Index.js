import React, {Component} from 'react';
import {View, StyleSheet, ImageBackground, Dimensions, DeviceEventEmitter, Platform} from 'react-native';
import I18n from 'react-native-i18n';
import {Card} from 'react-native-shadow-cards';
import {Actions} from "react-native-router-flux";
import HeaderBar from "../element/HeaderBar";
import Overview from "../element/Overview";
import store from '../../mobx/Store';
import LocateFragment from "./LocateFragment";
import StoreFragment from "./StoreFragment";
import PopupStore from "../customization/PopupStore";
import TouchableActive from "../touchables/TouchableActive";
import OverdueFragment from "./OverdueFragment";
import NetInfoIndicator from "../components/NetInfoIndicator";
import RNStatusBar from "../components/RNStatusBar";
import {REFRESH_STORE_INFO} from "../common/Constant";
import PatrolStorage from "../components/inspect/PatrolStorage";
import * as lib from '../common/PositionLib';
import {getBottomSpace} from "react-native-iphone-x-helper";

const {width} = Dimensions.get('screen');
export default class Store extends Component{
    state = {
        storeSelector: store.storeSelector,
        reportSelector: store.reportSelector,
        enumSelector: store.enumSelector,
        viewType: store.enumSelector.viewType.SUCCESS,
        storeType: store.enumSelector.storeType.ALL
    };

    constructor(props){
        super(props);

        let {enumSelector} = this.state;
        this.shortcuts = [
            {
                id: enumSelector.storeType.ALL ,
                uri: require('../assets/images/store_all.png'),
                name: I18n.t('Store list'),
                width:16,
                height:14
            },
            {
                id: enumSelector.storeType.LOCATE,
                uri: require('../assets/images/store_near.png'),
                name: I18n.t('Nearby store'),
                width:12,
                height:16
            },
            {
                id: enumSelector.storeType.OVERDUE,
                uri: require('../assets/images/store_not_completed.png'),
                name: I18n.t('Overdue store'),
                width:15,
                height:15
            },
        ];
    }

    onMenu(){
        this.props.onMenu(true);
    }

    onSearch(){
        Actions.push('storeSearch');
    }

    onNotify(){

    }

    onMore(){

    }

    componentDidMount(){
        let {reportSelector} = this.state;
        reportSelector.temporaries = PatrolStorage.getManualCaches();
        (async () => {
            await this.setState({reportSelector});
        })();

        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_STORE_INFO, () => {
            this.fragment && this.fragment.fetchData();
        });
    }

    componentWillUnmount(){
        this.refreshEmitter && this.refreshEmitter.remove();
    }

    onChange(id){
        let {storeSelector} = this.state;
        storeSelector.visible = false;
        this.setState({storeSelector,storeType: id});
    }

    render(){
        let {storeType, enumSelector} = this.state;
        const fragmentMap = [
            {
                type: enumSelector.storeType.ALL,
                fragment: <StoreFragment ref={c => this.fragment = c}/>
            },
            {
                type: enumSelector.storeType.LOCATE,
                fragment: <LocateFragment ref={c => this.fragment = c}/>
            },
            {
                type: enumSelector.storeType.OVERDUE,
                fragment: <OverdueFragment ref={c => this.fragment = c}/>
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
                    {fragmentMap.find(p => p.type === storeType).fragment}
                </View>
                <PopupStore />
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
