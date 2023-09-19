import React, {Component} from 'react';
import {View, StyleSheet, ImageBackground, Dimensions, DeviceEventEmitter, Platform} from 'react-native';
import I18n from 'react-native-i18n';
import {Card} from 'react-native-shadow-cards';
import {Actions} from "react-native-router-flux";
import HeaderBar from "../../element/HeaderBar";
import Overview from "../../element/Overview";
import store from '../../../mobx/Store';
import RecordFragment from "./RecordFragment";
import TouchableActive from "../../touchables/TouchableActive";
import NetInfoIndicator from "../../components/NetInfoIndicator";
import RNStatusBar from "../../components/RNStatusBar";
import {REFRESH_STORE_INFO} from "../../common/Constant";
import PatrolStorage from "../../components/inspect/PatrolStorage";
import * as lib from '../../common/PositionLib';
import {getBottomSpace} from "react-native-iphone-x-helper";

const {width} = Dimensions.get('screen');
export default class Store extends Component{
    state = {
        storeSelector: store.storeSelector,
        reportSelector: store.reportSelector,
        enumSelector: store.enumSelector,
        viewType: store.enumSelector.viewType.SUCCESS
    };

    constructor(props){
        super(props);
    }

    onMenu(){
        this.props.onMenu(true);
    }

    onNotify(){

    }

    onMore(){

    }

    componentDidMount(){
        let {reportSelector} = this.state;
        reportSelector.temporaries = PatrolStorage.getManualCaches();
        this.setState({reportSelector});

        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_STORE_INFO, () => {
            this.fragment && this.fragment.fetchData();
        });
    }

    componentWillUnmount(){
        this.refreshEmitter && this.refreshEmitter.remove();
    }

    render(){
        let {} = this.state;

        return (
            <TouchableActive style={styles.container} clearCollection={true}>
                <RNStatusBar translucent={false}/>
                <Card style={styles.card} elevation={0}>
                    <ImageBackground source={require('../../assets/img_background.png')} style={styles.background}>
                        <HeaderBar onMenu={()=>{this.onMenu()}}
                                showSearch={false}
                                onNotify={()=>{this.onNotify()}}/>
                        <Overview data={[]} title={I18n.t('CashCheck Record')}/>
                    </ImageBackground>
                </Card>
                <NetInfoIndicator />

                <View style={styles.fragment}>
                <RecordFragment ref={c => this.fragment = c}/>
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
