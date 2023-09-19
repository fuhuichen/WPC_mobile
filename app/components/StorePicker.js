import React, {Component} from 'react';
import {StyleSheet, View, Platform, TouchableOpacity, Text, DeviceEventEmitter} from "react-native";
import I18n from 'react-native-i18n';
import * as simpleStore from "react-native-simple-store";
import store from '../../mobx/Store';
import OptionSelector from "../element/OptionSelector";
import EventBus from "../common/EventBus";
import PhoneInfo from "../entities/PhoneInfo";
import {Actions} from "react-native-router-flux";
import {REFRESH_STORE_LIST} from "../common/Constant";

export default class StorePicker extends Component{

    constructor(props) {
        super(props);
        this.state = {
            countries:[],
            provinces:[],
            cities: [],
            storeList:this.props.data,
            catchStore: {
                country:'',
                province:'',
                city:''            
            },
            rightSelectorOptions:[],
            rightSelectorValue: ''
        };
        this.storeCacheFlag = '';
    }

    componentDidMount(){

        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_STORE_LIST, () => {
            (async ()=> {
                await this.initStore();
            })();
        });
    }

    componentWillUnmount() {
        this.refreshEmitter && this.refreshEmitter.remove();
    }

    componentWillMount(){
        let catchStore = null;
        if (this.props.type == 'store'){
            this.storeCacheFlag = "StorePicker";
            //catchStore = store.storeSelector.catchStore;
        }
        else if (this.props.type == 'event'){
            this.storeCacheFlag = "EventStorePicker";
            //catchStore = store.storeSelector.catchEventStore;
        }
        else if (this.props.type === 'approve' || this.props.type === 'approve_pending' || this.props.type == 'approve_submit'){
            this.storeCacheFlag = "ApproveStorePicker";
            //catchStore = store.storeSelector.catchApproveStore;

            /*let rightSelectorOptions = [], rightSelectorValue = '';
            if(this.props.type === 'approve_pending') {
                rightSelectorOptions = [I18n.t('Wait approve'), I18n.t('Approved')];
                rightSelectorValue = I18n.t('Wait approve');
            } else if (this.props.type == 'approve_submit') {
                rightSelectorOptions = [I18n.t('All'), I18n.t('Approve Finish'), I18n.t('Approving')];
                rightSelectorValue = I18n.t('All');
            }
            this.setState({rightSelectorOptions, rightSelectorValue});*/
        }

        //this.setState({catchStore},async ()=>{
            this.initStore();
        //});
    }

    async initStore(){
        let {storeList, countries, provinces, catchStore} = this.state;
        countries = storeList.map(p => p.country);
        countries = [I18n.t('All'), ...Array.from(new Set(countries))];

        provinces = storeList.map(p => p.province);
        provinces = [I18n.t('All'), ...Array.from(new Set(provinces))];

        const storeCache = await simpleStore.get(this.storeCacheFlag);
        if(storeCache != null){
            if ((storeCache.country !== '') && (countries.find(p => p === storeCache.country) == null)){
                storeCache.country = '';
                storeCache.province = '';
            }

            if ((storeCache.province !== '') && (provinces.find(p => p === storeCache.province) == null)){
                storeCache.province = '';
            }

            if (storeCache.country !== ''){
                provinces = storeList.filter(p => p.country === storeCache.country).map(v => v.province);
                provinces = [I18n.t('All'), ...Array.from(new Set(provinces))];
            }

            simpleStore.save(this.storeCacheFlag, storeCache);
            catchStore = storeCache;
        }

        this.setState({countries, provinces, catchStore});
    }

    async onCountrySelect(country){
        let {storeList, provinces, cities, catchStore} = this.state;
        country = (country !== I18n.t('All')) ? country : '';

        if (country !== catchStore.country){
            catchStore.country = country;
            catchStore.province = '';
            catchStore.city = '';

            let stores = (country !== '') ? storeList.filter(p => p.country === country) : storeList;
            provinces = stores.map(p => p.province);
            provinces = [I18n.t('All'), ...Array.from(new Set(provinces))];
            cities = stores.map(p => p.city);
            cities = [I18n.t('All'), ...Array.from(new Set(cities))];

            simpleStore.save(this.storeCacheFlag, catchStore);
            this.props.onChange && this.props.onChange(stores);

            this.setState({provinces, cities, catchStore});
        }
    }

    onProvinceSelect(province) {
        let {storeList, cities, catchStore} = this.state;
        province = (province !== I18n.t('All')) ? province : '';

        if (province !== catchStore.province){
            catchStore.province = province;
            catchStore.city = '';

            let stores = (province !== '') ? storeList.filter(p => p.province === province) : storeList;
            cities = stores.map(p => p.city);
            cities = [I18n.t('All'), ...Array.from(new Set(cities))];

            simpleStore.save(this.storeCacheFlag, catchStore);
            this.props.onChange && this.props.onChange(stores);

            this.setState({cities, catchStore});
        }
    }

    onApproveTypeSelect(value) {
        const { type } = this.props;
        this.setState({rightSelectorValue: value});
        this.props.onChange && this.props.onChange(type, value);
    }

    onClick(visible){
        EventBus.closePopupStore();
    }

    render(){
        const {countries, provinces, catchStore, rightSelectorOptions, rightSelectorValue} = this.state;
        const { type } = this.props;
        const country = (catchStore.country === '') ? I18n.t('All') : catchStore.country;
        const province = (catchStore.province === '') ? I18n.t('All') : catchStore.province;

        //let showRightSelector = (type == 'approve_pending' || type == 'approve_submit') ? true : false;
        let marginLeft = 0;
        PhoneInfo.isJALanguage() && (marginLeft = 10);
        
        return (
            <View style={styles.container}>
                <OptionSelector options={countries} majorKey={'country'}
                                defaultValue={country}
                                selectTextStyle={styles.selectCountry}
                                containerStyle={styles.country}
                                optionContainerStyle={{width:140}}
                                onClick={(visible)=>{this.onClick(visible)}}
                                onSelect={async (item) => {await this.onCountrySelect(item)}}/>
                <OptionSelector options={provinces} majorKey={'province'}
                                defaultValue={province}
                                selectTextStyle={styles.selectProvince}
                                containerStyle={styles.province}
                                optionContainerStyle={{width:140}}
                                onClick={(visible)=>{this.onClick(visible)}}
                                onSelect={(item) => {this.onProvinceSelect(item)}}/>
                <View style={{flex:1}}/>
                {/*showRightSelector && <OptionSelector options={rightSelectorOptions} majorKey={'approve'}
                                defaultValue={rightSelectorValue}
                                selectTextStyle={styles.selectCountry}
                                containerStyle={styles.approve}
                                optionContainerStyle={{width:140, right: -10}}
                                onClick={(visible)=>{this.onClick(visible)}}
        onSelect={(value) => {this.onApproveTypeSelect(value)}}/>*/}                
                <TouchableOpacity activeOpacity={0.6} onPress={() => {Actions.push('Storefilter', {type:type})}}>
                    <Text style={[styles.filter,{marginLeft}]}>{I18n.t('Filter')}</Text>
                </TouchableOpacity>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection:'row',
        marginTop:24,
        paddingLeft:10,
        paddingRight:10,
        ...Platform.select({
            ios:{
                zIndex:10
            }
        })
    },
    country:{
        maxWidth:100
    },
    province:{
        maxWidth:100,
        marginLeft:20
    },
    approve:{
        maxWidth:100
    },
    sortCity:{
        fontSize:12,
        marginTop:-3,
        color:'#3B3737'
    },
    selectCountry:{
        fontSize:16,
        color:'#3B3737'
    },
    selectProvince:{
        fontSize:16,
        color:'#3B3737',
        ...Platform.select({
            ios: {
                marginTop: PhoneInfo.isEnLanguage() ? 1 : 2
            }
        })
    },
    filter:{
        fontSize:17,
        color:'#006AB7',
        paddingLeft: 5,
        marginTop: -8
    }
});
