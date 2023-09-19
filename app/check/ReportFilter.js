import React,{Component} from 'react';
import {
    StyleSheet,
    View,
    Platform,
    Dimensions,
    TouchableOpacity,
    Image,
    Text,
    TouchableWithoutFeedback,
    DeviceEventEmitter,
    FlatList
} from "react-native";
import RNStatusBar from "../components/RNStatusBar";
import I18n from "react-native-i18n";
import {Actions} from "react-native-router-flux";
import moment from "moment";
import DatePicker from "../thirds/datepicker/DatePicker";
import SlideModalEx from "../components/SlideModal";
import * as lib from "../common/PositionLib";
import PhoneInfo from "../entities/PhoneInfo";
import {EMITTER_REFRESH_REPORT} from "../common/Constant";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class ReportFilter extends Component{
    constructor(props){
        super(props);

        this.width = PhoneInfo.isEnLanguage() ? 60 : 50;
        this.store = this.props.store;

        this.viewCommon = {width:155,height:34,borderRadius: 2};
        this.textCommon = {height:34,lineHeight:34,textAlign:'center',textAlignVertical:'center'};
        this.viewSelect = {...this.viewCommon,backgroundColor:'#f21c65'};
        this.viewNormal = {...this.viewCommon,backgroundColor:'#ffffff',borderWidth:0.5,borderColor:'#dcdcdc'};
        this.textSelect = {...this.textCommon, color:'#ffffff'};
        this.textNormal = {...this.textCommon,color:'#19293b'};

        this.state = {
            data: JSON.parse(JSON.stringify(this.props.data)),
            provinces: [],
            cities: [],
            tips: false
        };
    }

    async componentDidMount() {
        await this.init(true);
        await this.init(false);
    }

    componentWillUnmount(){
        this.unInit();
    }

    onClose(){
        this.unInit();
        Actions.pop();
    }

    async init(type){
        try {
            let data = this.state.data;
            let name = type ? data.province : data.city;

            let region = this.store.map(p => {return type ? p.province : p.city});
            (region.length > 0) && (region = Array.from(new Set(region)));
            (region.length === 0) ? (region.push(I18n.t('All')))
                : (region.length > 1) ? (region = [I18n.t('All'),...region]) : null;

            let isAll = region.findIndex(p => p === name);
            (isAll === -1) && (region.length > 1) ? (name = region[0]) : null;

            type ? (data.province = name) : (data.city = name);
            await this.setState({
                data,
                provinces: type ? region : this.state.provinces,
                cities: !type ? region : this.state.cities
            });
        }catch (e) {
        }
    }

    unInit(){
        this.provinceList && this.provinceList.close();
        this.cityList && this.cityList.close();
    }

    confirm(){
        if((this.state.data.beginTs) > this.state.data.endTs ||
            ((this.state.data.endTs-this.state.data.beginTs) > 86400*30*1000)){
            this.setState({tips: true});
            return;
        }

        DeviceEventEmitter.emit(EMITTER_REFRESH_REPORT, this.state.data);
        Actions.pop();
    }

    onBeginTimeChanged(date){
        let data = this.state.data;
        data.beginTs = moment(date).startOf('day').unix()*1000;
        this.setState({data});
    }

    onEndTimeChanged(date){
        let data = this.state.data;
        data.endTs = moment(date).endOf('day').unix()*1000;
        this.setState({data});
    }

    onProvince(){
        this.cityList && this.cityList.close();
        this.provinceList && this.provinceList.open();
    }

    onCity(){
        this.provinceList && this.provinceList.close();
        this.cityList && this.cityList.open();
    }

    renderProvince(){
        return (
            <View style={styles.regionPanel}>
                <View style={[styles.regionLabel,{width:this.width}]}>
                    <Text style={styles.regionText}>{I18n.t('Region one')}</Text>
                </View>

                <TouchableOpacity style={styles.regionView} activeOpacity={0.6} onPress={()=>{this.onProvince()}}>
                    <Text style={styles.regionName}>{this.state.data.province}</Text>
                    <Image style={styles.pullDown} resizeMode={'contain'}
                           source={require('../assets/images/home_pulldown_icon_mormal.png')}/>
                </TouchableOpacity>
            </View>
        )
    }

    renderCity(){
        return (
            <View style={styles.regionPanel}>
                <View style={[styles.regionLabel,{width:this.width}]}>
                    <Text style={styles.regionText}>{I18n.t('Region two')}</Text>
                </View>

                <TouchableOpacity style={styles.regionView} activeOpacity={0.6} onPress={()=>{this.onCity()}}>
                    <Text style={styles.regionName}>{this.state.data.city}</Text>
                    <Image style={styles.pullDown} resizeMode={'contain'}
                           source={require('../assets/images/home_pulldown_icon_mormal.png')}/>
                </TouchableOpacity>
            </View>
        )
    }

    onProvinceSelect(item){
        this.provinceList && this.provinceList.close();

        let data = this.state.data;
        data.province = item;

        let region = this.store;
        (item !== I18n.t('All')) && (region = this.store.filter(p => p.province === item));
        region = region.map(p => {return p.city});

        (region.length > 0) && (region = Array.from(new Set(region)));
        (region.length === 0) ? (region.push(I18n.t('All')))
            : (region.length > 1) ? (region = [I18n.t('All'),...region]) : null;

        data.city = region[0];

        this.setState({data,cities: region});
    }

    renderProvinces= ({item,index})=>{
        let borderWidth = (index == this.state.provinces.length -1) ? 0 : 0.5;
        return (
            <TouchableOpacity activeOpacity={0.6} onPress={()=>this.onProvinceSelect(item)}>
                <View style={{height:40,borderBottomWidth:borderWidth,borderBottomColor:'#dcdcdc'}}>
                    <Text style={styles.regionContent}>{item}</Text>
                </View>
            </TouchableOpacity>
        )
    };

    onCitySelect(item){
        this.cityList && this.cityList.close();

        let data = this.state.data;
        data.city = item;
        this.setState({data});
    }

    renderCities = ({item,index})=>{
        let borderWidth = (index == this.state.cities.length -1) ? 0 : 0.5;
        return (
            <TouchableOpacity activeOpacity={0.6} onPress={()=>this.onCitySelect(item)}>
                <View style={{height:40,borderBottomWidth:borderWidth,borderBottomColor:'#dcdcdc'}}>
                    <Text style={styles.regionContent}>{item}</Text>
                </View>
            </TouchableOpacity>
        )
    };

    onBeginTime(){
        let beginTs = this.state.data.beginTs;
        this.refs.beginTimePicker && this.refs.beginTimePicker.open(new Date(beginTs));
        this.setState({tips:false});
    }

    onEndTime(){
        let endTs = this.state.data.endTs;
        this.refs.endTimePicker && this.refs.endTimePicker.open(new Date(endTs));
        this.setState({tips:false});
    }

    renderDateTime(){
        return (
            <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:18}}>
                <TouchableOpacity activeOpacity={0.6} onPress={()=>this.onBeginTime()}>
                    <View style={{width:(width-32-30)/2,height:28,borderBottomWidth: 0.5,borderBottomColor:'#dcdcdc'}}>
                        <Text style={{height:28,textAlign:'center',color:'#19293b',...Platform.select({ios:{lineHeight:28}})}}>
                            {moment(this.state.data.beginTs).format("YYYY/MM/DD")}
                        </Text>
                    </View>
                </TouchableOpacity>
                <View style={{width:30,height:28}}>
                    <Text style={{height:28,textAlign:'center',color:'#19293d', ...Platform.select({ios:{lineHeight:28}})}}>
                        {I18n.t('To')}
                    </Text>
                </View>
                <TouchableOpacity activeOpacity={0.6} onPress={()=>this.onEndTime()}>
                    <View style={{width:(width-32-30)/2,height:28,borderBottomWidth: 0.5,borderBottomColor:'#dcdcdc'}}>
                        <Text style={{height:28,textAlign:'center',color:'#19293b', ...Platform.select({ios:{lineHeight:28}})}}>
                            {moment(this.state.data.endTs).format("YYYY/MM/DD")}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    onOrderType(type){
        let data = this.state.data;
        data.orderType = type;
        this.setState({data});
    }

    renderOrderType(){
        return (
            <View style={{marginTop:6,flexDirection:'row',justifyContent:'flex-start'}}>
                <TouchableWithoutFeedback onPress={()=>{this.onOrderType(0)}}>
                    <View style={this.state.data.orderType === 0 ? {...this.viewSelect} : {...this.viewNormal}}>
                        <Text style={this.state.data.orderType === 0 ? {...this.textSelect} : {...this.textNormal}}>
                            {I18n.t('Order by time')}
                        </Text>
                    </View>
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback onPress={()=>{this.onOrderType(1)}}>
                    <View style={this.state.data.orderType === 1 ? {...this.viewSelect,marginLeft:10}
                        : {...this.viewNormal,marginLeft:10}}>
                        <Text style={this.state.data.orderType === 1 ? {...this.textSelect} : {...this.textNormal}}>
                            {I18n.t('Order by status')}
                        </Text>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        )
    }

    onMode(type,operator){
        let data = this.state.data;
        let index = data.modeType.findIndex(p => p === type);
        operator && (index === -1) && (data.modeType.push(type));
        !operator && (index !== -1) && (data.modeType.splice(index,1));
        this.setState({data});
    }

    renderModeType(){
        let mode = this.state.data.modeType;
        let remote = mode.findIndex(p => p === 0);
        let local = mode.findIndex(p => p === 1);
        return (
            <View style={{marginTop:6,flexDirection:'row',justifyContent:'flex-start'}}>
                <TouchableWithoutFeedback onPress={()=>{this.onMode(0,(remote !== -1) ? false : true)}}>
                    <View style={(remote !== -1) ? {...this.viewSelect,width:100}
                        : {...this.viewNormal,width:100}}>
                        <Text style={(remote !== -1) ? {...this.textSelect} : {...this.textNormal}}>
                            {I18n.t('Remote patrol')}
                        </Text>
                    </View>
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback onPress={()=>{this.onMode(1, (local !== -1) ? false : true)}}>
                    <View style={(local !== -1) ? {...this.viewSelect,width:100,marginLeft:10}
                        : {...this.viewNormal,width:100,marginLeft:10}}>
                        <Text style={(local !== -1) ? {...this.textSelect} : {...this.textNormal}}>
                            {I18n.t('Onsite patrol')}
                        </Text>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        )
    }

    onStatus(type,operator){
        let data = this.state.data;
        let index = data.statusType.findIndex(p => p === type);
        operator && (index === -1) && (data.statusType.push(type));
        !operator && (index !== -1) && (data.statusType.splice(index,1));
        this.setState({data});
    }

    renderStatusType(){
        let status = this.state.data.statusType;
        let good = status.findIndex(p => p === 2);
        let improved = status.findIndex(p => p === 1);
        let supervised = status.findIndex(p => p === 0);

        return (
            <View style={{marginTop:6,flexDirection:'row',justifyContent:'flex-start'}}>
                <TouchableWithoutFeedback onPress={()=>{this.onStatus(2,(good !== -1) ? false : true)}}>
                    <View style={(good !== -1) ? {...this.viewSelect,width:100}
                        : {...this.viewNormal,width:100}}>
                        <Text style={(good !== -1) ? {...this.textSelect} : {...this.textNormal}}>
                            {I18n.t('Dangerous')}
                        </Text>
                    </View>
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback onPress={()=>{this.onStatus(1,(improved !== -1) ? false : true)}}>
                    <View style={(improved !== -1) ? {...this.viewSelect,width:100,marginLeft:10}
                        : {...this.viewNormal,width:100,marginLeft:10}}>
                        <Text style={(improved !== -1) ? {...this.textSelect} : {...this.textNormal}}>
                            {I18n.t('Improve')}
                        </Text>
                    </View>
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback onPress={()=>{this.onStatus(0,(supervised !== -1) ? false : true)}}>
                    <View style={(supervised !== -1) ? {...this.viewSelect,width:100,marginLeft:10}
                        : {...this.viewNormal,width:100,marginLeft:10}}>
                        <Text style={(supervised !== -1) ? {...this.textSelect} : {...this.textNormal}}>
                            {I18n.t('Good')}
                        </Text>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        )
    }

    render(){
        let common = {fontSize:12,color:'#989ba3'};
        let tipColor = this.state.tips ? '#f21c65' : '#989ba3';

        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.navBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={()=>{this.onClose()}} style={{width:40,alignItems:'center'}}>
                        <Image source={require('../assets/images/img_navbar_close.png')} style={{width:48,height:48}}/>
                    </TouchableOpacity>
                    <View style={{width:width-130,height:48}}>
                        <Text style={styles.navBarText}>{I18n.t('Patrol report filter')}</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.5} onPress={()=>{this.confirm()}}>
                        <View style={{width:80,height:48,alignItems:'flex-end'}}>
                            <Text style={{fontSize:14,color:'#ffffff',marginRight:10,textAlignVertical:'center',height:48,
                                ...Platform.select({ios:{lineHeight:48}})}}>{I18n.t('Confirm')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{paddingLeft: 16,paddingRight: 16}}>
                    {this.renderProvince()}
                    {this.renderCity()}

                    <Text style={{...common,marginTop: 20}}>{I18n.t('Time filter')}</Text>
                    {this.renderDateTime()}
                    <Text style={{...common,marginTop: 12,color:tipColor}} numberOfLines={2}>
                        {I18n.t('Max query time')}
                     </Text>

                    <Text style={{...common,marginTop: 20}}>{I18n.t('Sort type')}</Text>
                    {this.renderOrderType()}

                    <Text style={{...common,marginTop: 12}}>{I18n.t('Mode type')}</Text>
                    {this.renderModeType()}

                    <Text style={{...common,marginTop: 12}}>{I18n.t('Status type')}</Text>
                    {this.renderStatusType()}
                </View>

                <DatePicker
                    ref={"beginTimePicker"}
                    mode={true}
                    initDate={new Date()}
                    onSelected={(date)=>{this.onBeginTimeChanged(date)}}
                />
                <DatePicker
                    ref={"endTimePicker"}
                    mode={true}
                    initDate={new Date()}
                    onSelected={(date)=>{this.onEndTimeChanged(date)}}
                />

                <SlideModalEx ref={(c) =>{this.provinceList = c}}
                              offsetX={this.width+16}
                              offsetY={lib.defaultStatusHeight()+82}
                              opacity={0}>
                    <FlatList
                        style={[styles.contentView,{width:width-32-this.width}]}
                        showsVerticalScrollIndicator={false}
                        data={this.state.provinces}
                        extraData={this.state}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderProvinces}
                    />
                </SlideModalEx>

                <SlideModalEx ref={(c) =>{this.cityList = c}}
                              offsetX={this.width+16}
                              offsetY={lib.defaultStatusHeight()+136}
                              opacity={0}>
                    <FlatList
                        style={[styles.contentView,{width:width-32-this.width}]}
                        showsVerticalScrollIndicator={false}
                        data={this.state.cities}
                        extraData={this.state}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderCities}
                    />
                </SlideModalEx>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    navBarPanel:{
        flexDirection: 'row',
        height: 48,
        backgroundColor: '#24293d',
        alignItems: 'center'
    },
    navBarText: {
        fontSize:18,
        height: 48,
        color:'#ffffff',
        textAlign: 'center',
        textAlignVertical: 'center',
        marginLeft:50,
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    },
    regionPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 30
    },
    regionLabel:{
        height: 24
    },
    regionText:{
        fontSize: 12,
        color: '#989ba3',
        height: 24,
        lineHeight: 24,
        textAlignVertical:'center'
    },
    regionView:{
        height:24,
        borderBottomWidth:0.5,
        borderBottomColor:'#dcdcdc',
        flex:1,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    regionName:{
        fontSize: 12,
        color: '#19293b',
        height: 24,
        lineHeight: 24,
        textAlignVertical:'center',
        marginTop: -2,
        marginLeft: 4
    },
    pullDown:{
        height:48,
        width:48,
        marginTop: -12,
        marginRight: -12
    },
    contentView:{
        maxHeight:132,
        borderWidth:1,
        borderColor:'#dcdcdc',
        borderRadius:2,
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor:'#ffffff'
    },
    regionContent:{
        fontSize:12,
        color:'#19293b',
        height:40,
        lineHeight:40,
        textAlignVertical:'center'
    },
});
