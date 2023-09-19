import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, ScrollView,Platform,BackHandler} from "react-native";
import I18n from 'react-native-i18n';
import RNLocation from 'react-native-location';
import {request,PERMISSIONS,RESULTS} from 'react-native-permissions';
import LocationServicesDialogBox from "react-native-android-location-services-dialog-box";
import StoreCell from "./StoreCell";
import * as lib from '../common/PositionLib';
import TouchableActive from "../touchables/TouchableActive";
import store from "../../mobx/Store";
import TimeUtil from "../utils/TimeUtil";
import {getAdjacent,getStatusList} from "../common/FetchRequest";
import LocateIndicator from "../customization/LocateIndicator";
import SlotStore from "../customization/SlotStore";
import BaseStore from "../customization/BaseStore";

const {width} = Dimensions.get('screen');
RNLocation.configure({ allowsBackgroundLocationUpdates: true });

export default class LocateFragment extends BaseStore {
    state = {
        enumSelector: store.enumSelector,
        viewType: store.enumSelector.viewType.FAILURE,
        locationStore: [],
        nearbyStores: []
    };

    constructor(props) {
        super(props);

        this.maxDistance = 10;
        this.longitude = null;
        this.latitude = null;
        this.data = [];
    }

    componentDidMount(){
        this.doGpsLocation();
    }

    fetchData(){
        this.doGpsLocation();
    }

    refreshLocation(){
        request(Platform.select({
                android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
                ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
            }),
        ).then(result => {
            if (result ===  RESULTS.GRANTED){
                this.doGpsLocation();
            }
            else {
                this.setState({viewType:store.enumSelector.viewType.FAILURE});
            }
        });
    }

    doGpsLocation(){
        this.stopUpdatingLocation();

        this.setState({ viewType:store.enumSelector.viewType.LOADING },()=>{
            RNLocation.configure({distanceFilter: 5.0});

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
                            })
                                .then((success)=>{
                                   this.startUpdatingLocation();
                                })
                                .catch((error)=>{
                                    this.setState({viewType:store.enumSelector.viewType.FAILURE});
                                })
                        }else {
                            this.startUpdatingLocation();
                        }
                    }else{
                        this.refreshLocation();
                    }
                }).catch((err)=>{
                    this.refreshLocation();
            });
        });
    }

    startUpdatingLocation = () => {
        try {
            this.locationSubscription = RNLocation.subscribeToLocationUpdates(
                async locations => {
                    if (this.longitude == null && this.latitude == null){
                        this.longitude = locations[0].longitude;
                        this.latitude = locations[0].latitude;

                        let params = {
                            latitude:locations[0].latitude,
                            longitude:locations[0].longitude,
                            distance:10*1000,
                            size:10
                        };
                        const {enumSelector} = this.state;
                        let result = await getAdjacent(params);
                        if(result.errCode !== enumSelector.errorType.SUCCESS){
                            this.stopUpdatingLocation();
                            this.setState({viewType:enumSelector.viewType.FAILURE});
                            return false;
                        }

                        if (result.data.length > 0) {
                            this.data = result.data;
                            this.setState({viewType:enumSelector.viewType.SUCCESS},()=>{
                                this.fetchStatus();
                            })
                        } else {
                            this.setState({viewType:enumSelector.viewType.EMPTY});
                        }
                        this.stopUpdatingLocation();
                    }
                });
        }catch (e) {
            console.log("StoreCenter-startUpdatingLocation:" + e);
        }
    };

    stopUpdatingLocation = () => {
        this.locationSubscription && this.locationSubscription();
        this.locationSubscription = null;
        this.longitude = null;
        this.latitude = null;
    };

    async fetchStatus() {
        let storeIds = [];
        this.data.forEach(item=>{
            storeIds.push(item.storeId);
        })
        let params = {
            beginTs:TimeUtil.getNowDay()[0],
            endTs:TimeUtil.getNowDay()[1],
            storeIds:storeIds
        }

        let {locationStore, nearbyStores,enumSelector} = this.state;
        let result = await getStatusList(params);
        if(result.errCode !== enumSelector.errorType.SUCCESS){
            this.setState({viewType:enumSelector.viewType.FAILURE});
            return false;
        }

        let data = [];
        this.data.forEach(t_item=>{
            let resData = {};

            result.data.forEach(r_item=>{
                if (r_item.storeId === t_item.storeId){
                    resData.storeId = r_item.storeId;
                    resData.inspectTask = r_item.inspectTask;
                    resData.lastInspect = r_item.lastInspect;
                    resData.city = t_item.city;
                    resData.name = t_item.name;
                    resData.address = t_item.address;
                    resData.distance = t_item.distance;
                    resData.status = t_item.status;
                    data.push(resData);
                }
            });

        });

        data = data.filter(p => p.distance <= this.maxDistance*1000);
        (data.length > 0) && (locationStore.push(data[0]));
        (data.length > 1) && (nearbyStores = data.slice(1,data.length));
        this.setState({locationStore, nearbyStores});
    }

    renderStore(){
        let {locationStore,nearbyStores} = this.state;
        let borderRadius = nearbyStores.length>0 ? null : 10;
        let borderBottomWidth = nearbyStores.length>0 ? 2 : 0;
        return (
            <View style={[styles.storePanel,{borderRadius}]}>
                <Text style={styles.locate}>{I18n.t('Locate store')}</Text>
                <View style={[styles.storeGroup,{borderBottomWidth}]}>
                    <StoreCell data={{key:locationStore[0],value:0}} />
                </View>
            </View>
        )
    }

    renderNearbyStores(){
        let {nearbyStores} = this.state;
        return (
            <View style={styles.nearPanel}>
                <Text style={styles.locate}>{I18n.t('Distance nearby',{key:this.maxDistance})}</Text>
                <View style={[styles.group,styles.storeGroup]}>
                    {
                        nearbyStores.map((item,index) => {
                            return <StoreCell data={{key:item,value:index}}/>
                        })
                    }
                </View>
            </View>
        )
    }

    render() {
        const {locationStore, nearbyStores,viewType, enumSelector} = this.state;

        const location = (locationStore.length > 0) && this.renderStore();
        const nearby = (nearbyStores.length > 0) && this.renderNearbyStores()
        return (
            <View style={{flex:1}}>
                {
                    (viewType !== enumSelector.viewType.SUCCESS) && <LocateIndicator viewType={viewType}
                                                                                  refresh={() => this.doGpsLocation()}/>
                }
                {(viewType === enumSelector.viewType.SUCCESS) && <ScrollView
                    style={styles.container} showsVerticalScrollIndicator={false}>
                {<TouchableActive>
                    {location}
                    {nearby}
                </TouchableActive>}
                <SlotStore offset={40}/>
            </ScrollView>}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        marginLeft:10,
        marginRight:10,
        marginTop:24,
    },
    storePanel:{
       backgroundColor:'#EDF0F2',
       borderTopLeftRadius:10,
       borderTopRightRadius:10,
       paddingLeft:10,
       paddingRight:10,
       paddingTop:15,
    },
    nearPanel:{
       backgroundColor:'#EDF0F2',
       borderBottomLeftRadius:10,
       borderBottomRightRadius:10,
       paddingTop:24,
       paddingLeft:10,
       paddingRight:10
    },
    storeGroup:{
        marginTop:5,
        paddingBottom:30,
        borderColor:'#fff',
    },
    group:{
        flexDirection:'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems:'center'
    },
    locate:{
        color:'#85898E',
        fontSize:14,
        marginTop:5,
        marginLeft:5,
    }
});
