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
import moment from "moment";
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
import TimeUtil from "../../utils/TimeUtil";
import Calendar from "../../element/Calendar";
import order_0 from "../../assets/img_desc_unselect.png";
import press_order_0 from "../../assets/img_desc_select.png";
import order_1 from "../../assets/img_asc_unselect.png";
import press_order_1 from "../../assets/img_asc_select.png";

const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class RecordFilter extends Component {
    state = {
        storeSelector: store.storeSelector,
        enumSelector: store.enumSelector,
        paramSelector: store.paramSelector,
        filterSelector: store.filterSelector,
        tipVisible: false,
        countries:[],
        provinces:[],
        cities:[],
        catchStore: null,
        params: {
            beginTs: store.filterSelector.cashcheckRecord.beginTs, //moment().subtract(1, 'months').startOf('day').unix()*1000,
            endTs: store.filterSelector.cashcheckRecord.endTs, //moment().endOf('day').unix()*1000,
            status: store.filterSelector.cashcheckRecord.status,
            order: store.filterSelector.cashcheckRecord.order
        }
    };

    static propTypes =  {
    };

    static defaultProps = {
    };

    componentWillMount(){
        let {storeSelector} = this.state;
        let catchStore = {
            country: storeSelector.catchRecordStore.country,
            province: storeSelector.catchRecordStore.province,
            city: storeSelector.catchRecordStore.city
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
        let {storeSelector,catchStore,filterSelector,params} = this.state;
        const threeMonthAgo = TimeUtil.getThreeMonths(params.endTs);
        if ((params.beginTs > params.endTs) ||
            (params.endTs - params.beginTs > params.endTs - threeMonthAgo)) {
            this.setState({tipVisible: true});
            return;
        }

        if(params.status == 'none') {
            params.status = null;
        }
        filterSelector.cashcheckRecord = params;

        storeSelector.catchRecordStore = catchStore;
        this.setState({storeSelector, filterSelector}, () => {
            EventBus.refreshCashCheckRecordList();
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

    onState(status){
        let {params, enumSelector} = this.state;
        if(params.status == null) {
            params.status = (status == enumSelector.cashcheckStatus.ABNORMAL) ? enumSelector.cashcheckStatus.NORMAL : enumSelector.cashcheckStatus.ABNORMAL;
        } else if (params.status == status) {
            params.status = 'none';
        } else if (params.status == 'none') {
            params.status = status;
        } else {
            params.status = null;
        }
        this.setState({params});
    }

    onDateChange(type,date){
        let {params} = this.state;
        if(type === 0){
            params.beginTs = moment(date).startOf('day').unix()*1000;
        }else{
            params.endTs = moment(date).endOf('day').unix()*1000;
        }
        this.setState({params});
    }

    onOrder(item){
        let {params} = this.state;
        params.order = item.order;
        this.setState({params});
    }

    renderStoreAddress() {
        const {countries, provinces, cities, catchStore} = this.state;
        const country = (catchStore.country === '') ? I18n.t('All') : catchStore.country;
        const province = (catchStore.province === '') ? I18n.t('All') : catchStore.province;
        const city = (catchStore.city === '') ? I18n.t('All') : catchStore.city;
        return (
            <View style={styles.containerAddress}>
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
        )
    }

    renderStatus(){
        let {params, paramSelector} = this.state;
        let summary = paramSelector.getCashCheckSummaries();
        return (
            <View style={{zIndex:-1}}>
                <Text style={styles.label}>{I18n.t('CashCheck Result')}</Text>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    <View style={styles.statusPanel}>
                        {
                            summary.map((item, index) => {
                                let isSelect = (params.status == null || params.status == item.id) ? true : false;
                                let backgroundColor = isSelect ?  '#006AB7' : '#ffffff';
                                let color = isSelect ? '#ffffff' : '#69727C';
                                return <TouchableOpacity activeOpacity={1} onPress={() => this.onState(item.id)}>
                                    <View style={[styles.status,{backgroundColor}, BorderShadow.div]}>
                                        <Text style={[styles.record,{color}]}>{item.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            })
                        }
                    </View>
                </ScrollView>
            </View>
        )
    }

    renderCalendar(){
        let {params, tipVisible} = this.state;
        let color = tipVisible ? '#f21c65' : '#989ba3';

        return <View>
            <Text style={styles.label}>{I18n.t('Execution date')}</Text>
            <View style={styles.calendar}>
                <Calendar date={params.beginTs} width={(width-48-23)/2}
                        onClick={() => {
                            this.setState({tipVisible: false});
                        }}
                        onSelect={(date) =>this.onDateChange(0,date)}/>
                <Text style={styles.range}>{I18n.t('To')}</Text>
                <Calendar date={params.endTs} width={(width-48-23)/2}
                        onClick={() => {
                            this.setState({tipVisible: false});
                        }}
                        onSelect={(date) =>this.onDateChange(1,date)}/>
            </View>
            <Text style={[styles.tips,{color}]} numberOfLines={2}>{I18n.t('Max query time')}</Text>
        </View>
    }

    renderOrder(){
        let {params} = this.state, width = 106;
        (PhoneInfo.isTHLanguage() || PhoneInfo.isVNLanguage() || PhoneInfo.isJALanguage()) && (width = 130);
        PhoneInfo.isIDLanguage() && (width = 150);

        let orders = [
            {
                order: 'asc',
                type: I18n.t('Time Asc'),
                uri: order_0,
                pressUri:press_order_0
            },
            {
                order: 'desc',
                type: I18n.t('Time Desc'),
                uri:order_1,
                pressUri:press_order_1
            }
        ];

        return (
            <View>
                <Text style={styles.label}>{I18n.t('Sort type')}</Text>
                <View style={styles.flexPanel}>
                    {
                        orders.map((item, index) => {
                            let backgroundColor = (item.order === params.order) ?  '#006AB7' : '#ffffff';
                            let color = (item.order === params.order) ? '#ffffff' : '#69727C';
                            let uri = (item.order === params.order) ? item.pressUri : item.uri;
                            return <TouchableOpacity activeOpacity={1} onPress={() => this.onOrder(item)}>
                                <View style={[styles.order,{backgroundColor, width}, BorderShadow.div]}>
                                    <Image source={uri} style={{width:20,height:20}}/>
                                    <Text style={[styles.type,{color}]}>{item.type}</Text>
                                </View>
                            </TouchableOpacity>
                        })
                    }
                </View>
            </View>
        )
    }

    render() {
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
                    {this.renderStoreAddress()}
                    {this.renderStatus()}
                    {this.renderCalendar()}
                    {this.renderOrder()}
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
        marginLeft:14
    },
    containerStyle:{
        maxWidth:100,
        marginLeft:20
    },
    status:{
        height:36,
        borderRadius: 10,
        marginRight:10,
        backgroundColor: '#ffffff',
        alignItems:'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingLeft:16,
        paddingRight:16
    },
    statusPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 8,
        marginLeft:14
    },
    record:{
        fontSize:14,
        height:40,
        lineHeight: 40,
        marginLeft:3,
        textAlign: 'center',
        textAlignVertical:'center'
    },
    selectStyle:{
        fontSize:16,
        color:'#3B3737'
    },
    calendar:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingLeft:14,
        paddingRight:14
    },
    range:{
        fontSize: 16,
        color:'#9D9D9D',
        alignSelf:'center'
    },
    tips:{
        fontSize:12,
        marginTop:3,
        marginLeft:14
    },
    order:{
        height:36,
        borderRadius: 10,
        marginRight:10,
        backgroundColor: '#ffffff',
        alignItems:'center',
        justifyContent: 'center',
        flexDirection: 'row'
    },
    type:{
        fontSize:14,
        height:40,
        lineHeight: 40,
        marginLeft:3,
        textAlign: 'center',
        textAlignVertical:'center'
    },
    flexPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 8,
        marginLeft:14
    },
    containerCountry: {
        ...Platform.select({
            ios:{
                zIndex:22
            }
        })
    },
    containerProvince: {
        ...Platform.select({
            ios:{
                zIndex:21
            }
        })
    },
    containerCity: {
        ...Platform.select({
            ios:{
                zIndex:19
            }
        })
    },
    containerAddress: {
        ...Platform.select({
            ios:{
                zIndex:15
            }
        })
    }
});
