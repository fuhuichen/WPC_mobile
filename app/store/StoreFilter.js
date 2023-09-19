import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    TouchableOpacity,
    DeviceEventEmitter,
    FlatList,
    Platform,
    ScrollView
} from "react-native";
import I18n from "react-native-i18n";
import {Actions} from "react-native-router-flux";
import Navigation from "../element/Navigation";
import store from "../../mobx/Store";
import {inject, observer} from "mobx-react";
import NetInfoIndicator from "../components/NetInfoIndicator";
import AndroidBacker from "../components/AndroidBacker";
import BorderShadow from '../element/BorderShadow';
import OptionSelector from "../element/OptionSelector";
import PhoneInfo from "../entities/PhoneInfo";
import EventBus from "../common/EventBus";
import * as simpleStore from "react-native-simple-store";
import PropTypes from "prop-types";
import {getStoreDefine} from "../common/FetchRequest";

const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class StoreFilter extends Component {
    state = {
        storeSelector: store.storeSelector,
        enumSelector: store.enumSelector,
        countries:[],
        provinces:[],
        cities:[],
        groups:[],
        types:[],
        approvePendingOptions: [I18n.t('Wait approve'), I18n.t('Approved')],
        approveSubmitOptions: [I18n.t('All'), I18n.t('Approve Finish'), I18n.t('Approving')],
        catchStore: {
            country:'',
            province:'',
            city:'',
            groups:[],
            types:[],
            approvePendingStatus: I18n.t('Wait approve'),
            approveSubmitStatus: I18n.t('All')
        }
    };

    static propTypes =  {
        type: PropTypes.string,
    };

    static defaultProps = {
    };

    async componentWillMount(){
        let {storeSelector, catchStore} = this.state;
        if (this.props.type == 'store'){
            this.storeCacheFlag = "StorePicker";
        } else if (this.props.type == 'event'){
            this.storeCacheFlag = "EventStorePicker";
        } else if (this.props.type === 'approve' || this.props.type === 'approve_pending' || this.props.type == 'approve_submit'){
            this.storeCacheFlag = "ApproveStorePicker";            
        }
        const storeCache = await simpleStore.get(this.storeCacheFlag);
        if(storeCache != null) {
            catchStore = {
                country: storeCache.country || '',
                province: storeCache.province || '',
                city: storeCache.city || '',
                groups: storeCache.groups || [],
                types: storeCache.types || [],
                approvePendingStatus: storeCache.approvePendingStatus || I18n.t('Wait approve'),
                approveSubmitStatus: storeCache.approveSubmitStatus || I18n.t('All')
            }
        }

        this.setState({catchStore},async ()=>{
            await this.initStore();
        });
    }

    componentDidMount(){
    }

    async initStore(){
        let {countries, provinces, cities, storeSelector, catchStore, enumSelector} = this.state;
        let storeList = storeSelector.storeList;
        if (storeSelector.storeGroup == null){
            let result = await getStoreDefine(1);
            if(result.errCode === enumSelector.errorType.SUCCESS){
                storeSelector.storeGroup = result.data;
                this.setState({storeSelector});
            }
        }
        if (storeSelector.storeType == null){
            let result = await getStoreDefine(0);
            if(result.errCode === enumSelector.errorType.SUCCESS) {
                storeSelector.storeType = result.data;
                this.setState({storeSelector});
            }
        }
        let groups = [];
        if(storeSelector.storeGroup != null) {
            storeSelector.storeGroup.forEach(group => {
                groups.push({
                    id: group.defineId,
                    name: group.defineName
                })
            })
            groups = [I18n.t('All'), ...Array.from(new Set(groups))];
        }
        let types = [];
        if(storeSelector.storeType != null) {
            storeSelector.storeType.forEach(type => {
                types.push({
                    id: type.defineId,
                    name: type.defineName
                })
            })
            types = [I18n.t('All'), ...Array.from(new Set(types))];
        }
        countries = storeList.map(p => p.country);
        countries = [I18n.t('All'), ...Array.from(new Set(countries))];

        if (catchStore.country !== ''){
            provinces = storeList.filter(p => p.country === catchStore.country).map(v => v.province);
            provinces = [I18n.t('All'), ...Array.from(new Set(provinces))];
        } else {
            provinces = storeList.map(p => p.province);
            provinces = [I18n.t('All'), ...Array.from(new Set(provinces))];
        }

        if (catchStore.province !== ''){
            cities = storeList.filter(p => p.province === catchStore.province).map(v => v.city);
            cities = [I18n.t('All'), ...Array.from(new Set(cities))];
        } else {
            cities = storeList.map(p => p.city);
            cities = [I18n.t('All'), ...Array.from(new Set(cities))];
        }

        this.setState({countries, provinces, cities, groups, types});
    }

    onConfirm(){
        let {storeSelector,catchStore} = this.state;
        
        simpleStore.save(this.storeCacheFlag, catchStore);

        storeSelector.catchStore = catchStore;
        this.setState({storeSelector}, () => {
            EventBus.refreshStoreList();
            EventBus.refreshApprovePage();
            Actions.pop();
        });
    }

    onCountrySelect(country){
        let {storeSelector, provinces, catchStore, cities} = this.state;
        let storeList = storeSelector.storeList;
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

            this.setState({provinces, cities, catchStore});
        }
    }

    onProvinceSelect(province) {
        let {storeSelector, catchStore, cities} = this.state;
        let storeList = storeSelector.storeList;
        province = (province !== I18n.t('All')) ? province : '';

        if (province !== catchStore.province){
            catchStore.province = province;
            catchStore.city = '';

            let stores = (province !== '') ? storeList.filter(p => p.province === province) : storeList;
            cities = stores.map(p => p.city);
            cities = [I18n.t('All'), ...Array.from(new Set(cities))];

            this.setState({cities, catchStore});
        }
    }

    onCitySelect(city) {
        let {catchStore} = this.state;
        city = (city !== I18n.t('All')) ? city : '';

        if (city !== catchStore.city){
            catchStore.city = city;

            this.setState({catchStore});
        }
    }

    onGroupSelect(group) {
        let {catchStore, groups} = this.state;
        if (group == I18n.t('All')) {
            if(catchStore.groups.length == (groups.length)) {                
                catchStore.groups = [];
            } else {
                catchStore.groups = [...Array.from(new Set(groups))];
            }
        } else {
            let selectIds = [];
            if(catchStore.groups != null) {
                catchStore.groups.forEach(select => {
                    selectIds.push(select.id);
                })
            }
            if(group.id && selectIds.indexOf(group.id) == -1) {
                catchStore.groups.push(group);
                if(catchStore.groups.length == (groups.length-1)) {
                    catchStore.groups = [...Array.from(new Set(groups))];
                }
            } else {
                if(catchStore.groups.length == groups.length) {
                    catchStore.groups.splice(0, 1);
                }
                catchStore.groups.splice(catchStore.groups.indexOf(group), 1);
            }
        }
        this.setState({catchStore});
    }

    onTypeSelect(type) {
        let {catchStore, types} = this.state;
        if (type == I18n.t('All')) {
            if(catchStore.types.length == (types.length)) {                
                catchStore.types = [];
            } else {
                catchStore.types = [...Array.from(new Set(types))];
            }
        } else {
            let selectIds = [];
            if(catchStore.types != null) {
                catchStore.types.forEach(select => {
                    selectIds.push(select.id);
                })
            }
            if(type.id && selectIds.indexOf(type.id) == -1) {
                catchStore.types.push(type);
                if(catchStore.types.length == (types.length-1)) {
                    catchStore.types = [...Array.from(new Set(types))];
                }
            } else {
                if(catchStore.types.length == types.length) {
                    catchStore.types.splice(0, 1);
                }
                catchStore.types.splice(catchStore.types.indexOf(type), 1);
            }
        }
        this.setState({catchStore});
    }

    onApprovePendingSelect(status) {
        let {catchStore} = this.state;
        catchStore.approvePendingStatus = status;
        this.setState({catchStore});
    }

    onApproveSubmitSelect(status) {
        let {catchStore} = this.state;
        catchStore.approveSubmitStatus = status;
        this.setState({catchStore});
    }

    onClick(visible){
        EventBus.closePopupStore();
    }

    render() {
        const {countries, provinces, cities, catchStore, groups, types, approvePendingOptions, approveSubmitOptions} = this.state;
        const country = (catchStore.country === '') ? I18n.t('All') : catchStore.country;
        const province = (catchStore.province === '') ? I18n.t('All') : catchStore.province;
        const city = (catchStore.city === '') ? I18n.t('All') : catchStore.city;
        return (
            <View style={styles.container}>
                <Navigation
                    onLeftButtonPress={()=>{
                        Actions.pop();
                    }}
                    title={I18n.t('Filter')}
                    rightButtonTitle={I18n.t('Confirm')}
                    onRightButtonPress={()=> {this.onConfirm()}}
                />
                <NetInfoIndicator/>
                <View style={styles.panel}>
                    <View style={styles.containerCountry}>
                        <Text style={styles.label}>{I18n.t('Country')}</Text>
                        <View style={styles.flexPanel}>
                            <OptionSelector options={countries} majorKey={'country'}
                                            defaultValue={country}
                                            selectTextStyle={styles.selectStyle}
                                            containerStyle={styles.containerStyle}
                                            optionContainerStyle={{width:140}}
                                            onClick={(visible)=>{this.onClick(visible)}}
                                            onSelect={(item) => {this.onCountrySelect(item)}}/>
                        </View>
                    </View>

                    <View style={styles.containerProvince}>
                        <Text style={styles.label}>{I18n.t('Region one')}</Text>
                        <View style={styles.flexPanel}>
                            <OptionSelector options={provinces} majorKey={'province'}
                                            defaultValue={province}
                                            selectTextStyle={styles.selectStyle}
                                            containerStyle={styles.containerStyle}
                                            optionContainerStyle={{width:140}}
                                            onClick={(visible)=>{this.onClick(visible)}}
                                            onSelect={(item) => {this.onProvinceSelect(item)}}/>
                        </View>
                    </View>

                    <View style={styles.containerCity}>
                        <Text style={styles.label}>{I18n.t('Region two')}</Text>
                        <View style={styles.flexPanel}>
                            <OptionSelector options={cities} majorKey={'city'}
                                            defaultValue={city}
                                            selectTextStyle={styles.selectStyle}
                                            containerStyle={styles.containerStyle}
                                            optionContainerStyle={{width:140}}
                                            onClick={(visible)=>{this.onClick(visible)}}
                                            onSelect={(item) => {this.onCitySelect(item)}}/>
                        </View>
                    </View>

                    <View style={styles.containerStoreGroup}>
                        <Text style={styles.label}>{I18n.t('Store group')}</Text>
                        <View style={styles.flexPanel}>
                            <OptionSelector options={groups} majorKey={'group'}
                                            multiselect={true}
                                            multiselectValue={catchStore.groups}
                                            selectTextStyle={styles.selectStyle}
                                            containerStyle={styles.containerStyle}
                                            optionContainerStyle={{width:140}}
                                            onClick={(visible)=>{this.onClick(visible)}}
                                            onSelect={(item) => {this.onGroupSelect(item)}}/>
                        </View>
                    </View>

                    <View style={styles.containerStoreType}>
                        <Text style={styles.label}>{I18n.t('Store type')}</Text>
                        <View style={styles.flexPanel}>
                            <OptionSelector options={types} majorKey={'type'}
                                            multiselect={true}
                                            multiselectValue={catchStore.types}
                                            selectTextStyle={styles.selectStyle}
                                            containerStyle={styles.containerStyle}
                                            optionContainerStyle={{width:140}}
                                            onClick={(visible)=>{this.onClick(visible)}}
                                            onSelect={(item) => {this.onTypeSelect(item)}}/>
                        </View>
                    </View>

                    {this.props.type === 'approve_pending' && 
                    <View style={styles.containerApprovePending}>
                        <Text style={styles.label}>{I18n.t('Approve Status')}</Text>
                        <View style={styles.flexPanel}>
                            <OptionSelector options={approvePendingOptions} majorKey={'approve_pending'}
                                            defaultValue={catchStore.approvePendingStatus}
                                            selectTextStyle={styles.selectStyle}
                                            containerStyle={styles.containerStyle}
                                            optionContainerStyle={{width:140}}
                                            onClick={(visible)=>{this.onClick(visible)}}
                                            onSelect={(item) => {this.onApprovePendingSelect(item)}}/>
                        </View>
                    </View>}

                    {this.props.type === 'approve_submit' && 
                    <View style={styles.containerApproveSubmit}>
                        <Text style={styles.label}>{I18n.t('Approve Status')}</Text>
                        <View style={styles.flexPanel}>
                            <OptionSelector options={approveSubmitOptions} majorKey={'approve_submit'}
                                            defaultValue={catchStore.approveSubmitStatus}
                                            selectTextStyle={styles.selectStyle}
                                            containerStyle={styles.containerStyle}
                                            optionContainerStyle={{width:140}}
                                            onClick={(visible)=>{this.onClick(visible)}}
                                            onSelect={(item) => {this.onApproveSubmitSelect(item)}}/>
                        </View>
                    </View>}
                </View>

                <AndroidBacker onPress={() => {
                    Actions.pop();
                    return true;
                }}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:'#ECF1F5'
    },
    panel:{
        paddingLeft:10,
        paddingRight:10
    },
    label:{
        color:'#666666',
        fontSize:12,
        marginTop:16,
        marginLeft:14
    },
    flexPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 8,
        marginLeft:14,
        ...Platform.select({
            ios:{
                zIndex:10
            }
        })
    },
    containerStyle:{
        maxWidth:200,
        marginLeft:20
    },
    selectStyle:{
        fontSize:16,
        color:'#3B3737'
    },
    containerCountry: {
        ...Platform.select({
            ios:{
                zIndex:7
            }
        })
    },
    containerProvince: {
        ...Platform.select({
            ios:{
                zIndex:6
            }
        })
    },
    containerCity: {
        ...Platform.select({
            ios:{
                zIndex:5
            }
        })
    },
    containerStoreGroup: {
        ...Platform.select({
            ios:{
                zIndex:4
            }
        })
    },
    containerStoreType: {
        ...Platform.select({
            ios:{
                zIndex:3
            }
        })
    },
    containerApprovePending: {
        ...Platform.select({
            ios:{
                zIndex:2
            }
        })
    },
    containerApproveSubmit: {
        ...Platform.select({
            ios:{
                zIndex:1
            }
        })
    }
});
