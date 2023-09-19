import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, FlatList, ScrollView, TouchableOpacity, DeviceEventEmitter} from "react-native";
import * as simpleStore from "react-native-simple-store";
import I18n from 'react-native-i18n';
import store from "../../../mobx/Store";
import EventBus from "../../common/EventBus";
import StoreCell from "./StoreCell";
import TimeUtil from "../../utils/TimeUtil";
import {getStoreList_Cashcheck} from "../FetchRequest";
import SlotStore from "../../customization/SlotStore";
import Divider from "react-native-elements/dist/divider/Divider";
import StoreIndicator from "../../customization/StoreIndicator";
import {REFRESH_STORE_LIST} from "../../common/Constant";
import SearchBar from "react-native-elements/dist/searchbar/SearchBar";
import PhoneInfo from "../../entities/PhoneInfo";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import {Actions} from "react-native-router-flux";
import StringFilter from "../../common/StringFilter";

const {width} = Dimensions.get('screen');
export default class StoreFragment extends Component {
    state = {
        storeSelector: store.storeSelector,
        enumSelector: store.enumSelector,
        viewType: store.enumSelector.viewType.FAILURE,
        storeData: [],
        search: ''
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
            this.parseData();
        } else {
            this.setState({viewType: enumSelector.viewType.LOADING});
            let result = await getStoreList_Cashcheck();
            if (result.errCode === enumSelector.errorType.SUCCESS){
                storeSelector.storeList = result.data;

                this.setState({storeSelector}, async () => {
                    this.parseData();
                })
            } else {
                this.setState({viewType: enumSelector.viewType.FAILURE});
            }
        }
    }

    parseData(){
        let {storeSelector, enumSelector, search} = this.state;

        if(storeSelector.storeList == null || storeSelector.storeList.length === 0){
            this.setState({viewType: enumSelector.viewType.EMPTY});
            return false;
        }        

        let storeTemp = storeSelector.storeList;

        const catchStore = storeSelector.catchStore;
        if(catchStore != null){
            if (catchStore.country){
                storeTemp = storeTemp.filter(p => p.country === catchStore.country);
            }
            if (catchStore.province){
                storeTemp = storeTemp.filter(p => p.province === catchStore.province);
            }
            if (catchStore.city){
                storeTemp = storeTemp.filter(p => p.city === catchStore.city);
            }
            storeTemp = [...Array.from(new Set(storeTemp))];
        }
        if(search != '') {
            storeTemp = storeTemp.filter(p => p.name.indexOf(search) >= 0);
        }
        let cities = [], storeData = [];
        storeTemp.forEach(item=>{
            if (cities.findIndex ( c => c == item.city) == -1){
                cities.push(item.city);
            }
        })
        cities.forEach(item=>{
            let cityTemp = {city:item,stores:[]}
            storeTemp.forEach(s_item=>{
                if(item === s_item.city){
                    cityTemp.stores.push(s_item)
                }
            })
            storeData.push(cityTemp);
        })
        this.setState({storeData, viewType: enumSelector.viewType.SUCCESS});
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

    updateSearch = (text) => {
        this.setState({search: StringFilter.all(text.trim(),30)});
    };

    onClear(){
        this.setState({search: ''}, function() {
            this.fetchData();
        });        
    }

    onSearch(){
        this.fetchData();
    }

    renderOperator(){
        let {search, enumSelector} = this.state, searchWidth = width-80, marginLeft = 0;
        PhoneInfo.isJALanguage() && (searchWidth = searchWidth-20);
        PhoneInfo.isJALanguage() && (marginLeft = 10);
        let placeholderStyle = styles.input;
        (PhoneInfo.isIDLanguage()) && (placeholderStyle = {
            fontSize: searchWidth > 280 ? 9 : 8,
            paddingRight:0
        });
        (PhoneInfo.isVNLanguage()) && (placeholderStyle = {
            fontSize:searchWidth > 280 ? 10 : 9,
            paddingRight:2
        });

        return (<View style={styles.operator}>
            <BoxShadow setting={{width:searchWidth, height:38, color:"#000000",
                border:1, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:0}}}>
                <SearchBar placeholder={I18n.t('Enter search store')}
                           underlineColorAndroid={'#006AB7'}
                           containerStyle={[styles.searchBar,{width: searchWidth}]}
                           inputContainerStyle={[styles.inputView,{width: searchWidth-20}]}
                           inputStyle={search ? styles.input : placeholderStyle}
                           rightIconContainerStyle={{marginRight:-6}}
                           onChangeText={this.updateSearch}
                           value={search}
                           searchIcon={false}
                           returnKeyType={'search'}
                           onClear={() => this.onClear()}
                           onSubmitEditing={() => this.onSearch()}/>
            </BoxShadow>
            <TouchableOpacity activeOpacity={0.6} onPress={() => {Actions.push('cashcheckStorefilter')}}>
                <Text style={[styles.filter,{marginLeft}]}>{I18n.t('Filter')}</Text>
            </TouchableOpacity>
        </View>)
    }

    render() {
        const {viewType, enumSelector,storeData,storeSelector} = this.state;

        return <View style={styles.container}>
            {
                (viewType !== enumSelector.viewType.SUCCESS) && <StoreIndicator viewType={viewType}
                                    containerStyle={{marginTop:100}} prompt={I18n.t('Empty store')}
                                    refresh={() => {(async ()=> this.fetchData())()}}
                                />
            }
            {(viewType === enumSelector.viewType.SUCCESS) && <View>
                {this.renderOperator()}
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
    },
    operator:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        marginTop:10,
        paddingRight:10
    },
    searchBar:{
        height:38,
        marginRight:16,
        borderRadius:10,
        marginTop:0.5,
        backgroundColor:'#FFFFFF',
        borderTopColor:'#fff',
        borderBottomColor:'#fff',
        borderRightWidth:1,
        borderRightColor:'#fff',
        borderLeftWidth:1,
        borderLeftColor:'#fff',
        justifyContent:'center'
    },
    inputView:{
        height:36,
        backgroundColor:'#fff'
    },
    input:{
        fontSize:12,
        paddingRight:6
    },
    filter:{
        fontSize:17,
        color:'#006AB7'
    }
});
