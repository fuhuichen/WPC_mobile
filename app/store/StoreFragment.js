import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, FlatList, ScrollView, TouchableOpacity, DeviceEventEmitter} from "react-native";
import * as simpleStore from "react-native-simple-store";
import I18n from 'react-native-i18n';
import StorePicker from "../components/StorePicker";
import store from "../../mobx/Store";
import EventBus from "../common/EventBus";
import StoreCell from "./StoreCell";
import TimeUtil from "../utils/TimeUtil";
import {getStatusList, getStoreList} from "../common/FetchRequest";
import SlotStore from "../customization/SlotStore";
import Divider from "react-native-elements/dist/divider/Divider";
import StoreIndicator from "../customization/StoreIndicator";
import {REFRESH_STORE_LIST} from "../common/Constant";

const {width} = Dimensions.get('screen');
export default class StoreFragment extends Component {
    state = {
        storeSelector: store.storeSelector,
        enumSelector: store.enumSelector,
        viewType: store.enumSelector.viewType.FAILURE,
        storeData: []
    };

    componentDidMount(){
        (async ()=> {
            await this.fetchData();
        })();

        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_STORE_LIST, () => {
            (async ()=> {
                await this.fetchData();
            })();
        });
    }

    componentWillUnmount() {
        this.refreshEmitter && this.refreshEmitter.remove();
    }

    async fetchData(){
        let {storeSelector, enumSelector} = this.state;

        if ((storeSelector.storeList != null) && (storeSelector.storeList.length !== 0)){
            await this.parseData();
        }else {
            let result = await getStoreList();
            if (result.errCode === enumSelector.errorType.SUCCESS){
                storeSelector.storeList = result.data;

                this.setState({storeSelector}, async () => {
                    await this.parseData();
                })
            }else {
                await this.parseData();
            }
        }
    }

    async parseData(){
        let {storeSelector} = this.state;

        if(storeSelector.storeList == null || storeSelector.storeList.length === 0){
            this.setState({viewType:store.enumSelector.viewType.EMPTY});
            return false;
        }
        this.setState({viewType:store.enumSelector.viewType.LOADING});

        let storeTemp = storeSelector.storeList;

        const catchStore = await simpleStore.get('StorePicker');
        if(catchStore != null){
            /*if ((catchStore.country !== '') && (catchStore.province === '')){
                storeTemp = storeSelector.storeList.filter(p => p.country === catchStore.country);
            }

            if ((catchStore.country === '') && (catchStore.province !== '')){
                storeTemp = storeSelector.storeList.filter(p => p.province === catchStore.province);
            }

            if ((catchStore.country !== '') && (catchStore.province !== '')){
                storeTemp = storeSelector.storeList.filter(p => ((p.country === catchStore.country)
                    && (p.province === catchStore.province)));
            }*/
            if (catchStore.country){
                storeTemp = storeTemp.filter(p => p.country === catchStore.country);
            }
            if (catchStore.province){
                storeTemp = storeTemp.filter(p => p.province === catchStore.province);
            }
            if (catchStore.city){
                storeTemp = storeTemp.filter(p => p.city === catchStore.city);
            }
            if(catchStore.groups && catchStore.groups.length > 0) {
                let tmpList = [];
                storeTemp.forEach(store => {
                    if(store.groupList && store.groupList.length > 0) {
                        for(let i=0 ; i<catchStore.groups.length ; ++i) {
                            if(store.groupList.indexOf(catchStore.groups[i].id) != -1) {
                                tmpList.push(store);
                                break;
                            }
                        }
                    }
                })
                storeTemp = tmpList;
            }
            if(catchStore.types && catchStore.types.length > 0) {
                let tmpList = [];
                storeTemp.forEach(store => {
                    if(store.typeList && store.typeList.length > 0) {
                        for(let i=0 ; i<catchStore.types.length ; ++i) {
                            if(store.typeList.indexOf(catchStore.types[i].id) != -1) {
                                tmpList.push(store);
                                break;
                            }
                        }
                    }
                })
                storeTemp = tmpList;
            }

            storeTemp = [...Array.from(new Set(storeTemp))];
        }

        await this.getStoreList(storeTemp);
    }

    async getStoreList(storeTemp) {
        let storeIds = [];
        let {enumSelector} = this.state;
        storeTemp.forEach(item=>{
            storeIds.push(item.storeId);
        })
        let params = {
            beginTs:TimeUtil.getNowDay()[0],
            endTs:TimeUtil.getNowDay()[1],
            storeIds:storeIds
        }

        let result = await getStatusList(params);
        if(result.errCode !== enumSelector.errorType.SUCCESS){
            this.setState({viewType:enumSelector.viewType.FAILURE});
            return false;
        }
        let data = [],storeData = [];
        result.data.forEach(r_item=>{
            let resData = {};
            storeTemp.forEach(t_item=>{
                if (r_item.storeId === t_item.storeId){
                    resData.storeId = r_item.storeId;
                    resData.inspectTask = r_item.inspectTask;
                    resData.lastInspect = r_item.lastInspect;
                    resData.city = t_item.city;
                    resData.name = t_item.name;
                    resData.address = t_item.address;
                    resData.status = t_item.status;
                    data.push(resData);
                }
            })
        })

        let cities = [];
        data.forEach(item=>{
            if (cities.findIndex ( c => c == item.city) == -1){
                cities.push(item.city);
            }
        })
        cities.forEach(item=>{
            let cityTemp = {city:item,stores:[]}
            data.forEach(s_item=>{
                if(item === s_item.city){
                    cityTemp.stores.push(s_item)
                }
            })
            storeData.push(cityTemp);
        })

        this.setState({storeData,viewType: storeTemp.length > 0 ? enumSelector.viewType.SUCCESS : enumSelector.viewType.EMPTY});
    }

    onChange(data) {
        this.getStoreList(data);
    }

    renderColumns = ({ item,index}) => {
        return (
            <View style={styles.group}>
                <StoreCell data={{key:item,value:index}} />
            </View>
        )
    }

    renderItem = ({ item,index}) => {
        let {storeSelector} = this.state;
        return (
            <TouchableOpacity activeOpacity={1} onPress={()=>{
                storeSelector.collection = null;
                this.setState({storeSelector});
                EventBus.closeModalAll();
            }}>
                <View style={styles.cityGroup}>
                    <Text style={styles.cityText}>{item.city}</Text>
                    <FlatList
                        numColumns={3}
                        data={item.stores}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderColumns}
                        showsVerticalScrollIndicator={false}/>
                </View>
            </TouchableOpacity>
        )
    };

    render() {
        const {viewType, enumSelector,storeData,storeSelector} = this.state;

        return <View style={styles.container}>
                <StorePicker
                    type='store'
                    data={storeSelector.storeList}
                    onChange={(p)=>this.onChange(p)}/>
            {
                (viewType !== enumSelector.viewType.SUCCESS) && <StoreIndicator viewType={viewType}
                                    containerStyle={{marginTop:100}} prompt={I18n.t('Empty store')}
                                    refresh={() => {(async ()=> this.fetchData())()}}
                                />
            }
            {(viewType === enumSelector.viewType.SUCCESS) && <View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <FlatList style={styles.list}
                        data={storeData}
                        onScroll={()=>{EventBus.closeOptionSelector()}}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderItem}
                        ItemSeparatorComponent={() => <Divider style={styles.divider}/>}
                        showsVerticalScrollIndicator={false}/>
                    <SlotStore />
                </ScrollView>
            </View>}
        </View>
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft:10,
        paddingRight:10
    },
    cityGroup:{
        paddingBottom:30,
        borderBottomColor:'#fff'
    },
    list:{
        marginTop:24,
        backgroundColor:'#EDF0F2',
        borderRadius:10,
        paddingLeft:10,
        paddingRight:10
    },
    group:{
        flexDirection:'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems:'center'
    },
    cityText:{
        fontSize:14,
        color:'#85898E',
        marginTop:14,
        marginLeft:5,
        marginBottom:5
    },
    divider:{
        marginLeft:3,
        marginRight:3,
        height:2,
        backgroundColor:'#F7F9FA',
        borderBottomWidth:0
    }
});
