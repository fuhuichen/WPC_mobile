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
import Navigation from "../../element/Navigation";
import store from "../../../mobx/Store";
import {inject, observer} from "mobx-react";
import NetInfoIndicator from "../../components/NetInfoIndicator";
import AndroidBacker from "../../components/AndroidBacker";
import BorderShadow from '../../element/BorderShadow';
import OptionSelector from "../../element/OptionSelector";
import PhoneInfo from "../../entities/PhoneInfo";
import EventBus from "../../common/EventBus";

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
        catchStore: null
    };

    static propTypes =  {
    };

    static defaultProps = {
    };

    componentWillMount(){
        let {storeSelector} = this.state;
        let catchStore = null;
        catchStore = {
            country: storeSelector.catchStore.country,
            province: storeSelector.catchStore.province,
            city: storeSelector.catchStore.city,
        }

        this.setState({catchStore},async ()=>{
            await this.initStore();
        });
    }

    componentDidMount(){
    }

    async initStore(){
        let {countries, provinces, cities, storeSelector} = this.state;
        let storeList = storeSelector.storeList;
        countries = storeList.map(p => p.country);
        countries = [I18n.t('All'), ...Array.from(new Set(countries))];

        provinces = storeList.map(p => p.province);
        provinces = [I18n.t('All'), ...Array.from(new Set(provinces))];

        cities = storeList.map(p => p.city);
        cities = [I18n.t('All'), ...Array.from(new Set(cities))];

        this.setState({countries, provinces, cities});
    }

    onConfirm(){
        let {storeSelector,catchStore} = this.state;

        storeSelector.catchStore = catchStore;
        this.setState({storeSelector}, () => {
            EventBus.refreshStoreList();
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

    onClick(visible){
        EventBus.closePopupStore();
    }

    render() {
        const {countries, provinces, cities, catchStore} = this.state;
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
        maxWidth:100,
        marginLeft:20
    },
    selectStyle:{
        fontSize:16,
        color:'#3B3737'
    },
    containerCountry: {
        ...Platform.select({
            ios:{
                zIndex:3
            }
        })
    },
    containerProvince: {
        ...Platform.select({
            ios:{
                zIndex:2
            }
        })
    },
    containerCity: {
        ...Platform.select({
            ios:{
                zIndex:1
            }
        })
    }
});
