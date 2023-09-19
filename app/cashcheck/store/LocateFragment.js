import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, ScrollView,Platform,BackHandler} from "react-native";
import I18n from 'react-native-i18n';
import RNLocation from 'react-native-location';
import {request,PERMISSIONS,RESULTS} from 'react-native-permissions';
import LocationServicesDialogBox from "react-native-android-location-services-dialog-box";
import StoreCell from "./StoreCell";
import * as lib from '../../common/PositionLib';
import TouchableActive from "../../touchables/TouchableActive";
import store from "../../../mobx/Store";
import TimeUtil from "../../utils/TimeUtil";
import {getAdjacent} from "../FetchRequest";
import LocateIndicator from "../../customization/LocateIndicator";
import SlotStore from "../../customization/SlotStore";
import BaseStore from "../../customization/BaseStore";

const {width} = Dimensions.get('screen');
RNLocation.configure({ allowsBackgroundLocationUpdates: true });

export default class LocateFragment extends BaseStore {
    state = {
        enumSelector: store.enumSelector,
        viewType: store.enumSelector.viewType.FAILURE,
        nearbyStores: []
    };

    constructor(props) {
        super(props);

        this.maxDistance = 1;
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
                            distance:this.maxDistance*1000,
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
                            let nearbyStores = result.data;
                            this.setState({viewType:enumSelector.viewType.SUCCESS, nearbyStores});
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
        const {nearbyStores,viewType, enumSelector} = this.state;
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
