import React, {Component} from 'react';
import {
    BackHandler,
    DeviceEventEmitter,
    Dimensions,
    FlatList,
    Image, Platform, ScrollView,
    StyleSheet,
    Text,
    TouchableHighlight,
    TouchableOpacity,
    View
} from 'react-native';

import RNStatusBar from '../components/RNStatusBar';
import {Actions} from "react-native-router-flux";
import {ColorStyles} from '../common/ColorStyles';
import {inject, observer} from 'mobx-react'
import I18n from 'react-native-i18n';
import {DURATION} from "react-native-easy-toast";
import BusyIndicator from "../components/BusyIndicator";
import store from "react-native-simple-store";
import StoreUtil from "../utils/StoreUtil";
import AccountUtil from "../utils/AccountUtil";
import * as lib from '../common/PositionLib';
import {EMITTER_MODAL_CLOSE} from "../common/Constant";
import SlideModalEx from "../components/SlideModal";
import Toast from "react-native-easy-toast";
import GlobalParam from "../common/GlobalParam";
import HttpUtil from "../utils/HttpUtil";
import AccessHelper from "../common/AccessHelper";
import PhoneInfo from "../entities/PhoneInfo";
import TouchableHighlightEx from "../touchables/TouchableHighlightEx";

const width = Dimensions.get('screen').width;
const LOGIN_INFO = 'Login';

@inject('store')
@observer
export default class ServiceList extends Component {
    constructor(props){
        super(props);

        this.state={
            accountIndex:-1,
            showNew: false,
        }
        this.accountList = this.props.store.userSelector.accountList;
        this.showFirst = false;
        this.serviceIndex = -1;
    }

    async componentWillMount() {
        let findAccountId = this.props.store.userSelector.accountId;
        let res = await store.get(LOGIN_INFO);
        if (res != null) {
            let login = JSON.parse(res);
            if (login.email !== this.props.store.userSelector.loginInfo.email || login.accountId == null) {
                this.showFirst = true;
            }
            if (login.accountId != null) {
                findAccountId = login.accountId;
            }
            if (login.serviceIndex != null){
                this.serviceIndex = login.serviceIndex;
            }
        }
        this.freshEmitter = DeviceEventEmitter.addListener('onMessageList', this.onMessage.bind(this));
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_MODAL_CLOSE,
            ()=>{
                this.modalDownList && this.modalDownList.close();
            });

        if (this.showFirst && Platform.OS === 'android') {
            BackHandler.addEventListener('hardwareBackPress', this.onBackAndroid);
        }
        let index = this.accountList.findIndex(p => p.accountId === findAccountId);
        if (-1 !== index) {
            this.setState({accountIndex: index});
        }
        else {
            this.setState({accountIndex: 0});
        }
        let message = StoreUtil.filterAndGetAll();
        if (message.length > 0) {
            this.setState({showNew: true});
        }
        else {
            this.setState({showNew: false});
        }
        AccountUtil.setOriginalId(findAccountId);
    }

    componentWillUnmount(){
        this.freshEmitter && this.freshEmitter.remove();
        this.notifyEmitter && this.notifyEmitter.remove();
        if (this.showFirst && Platform.OS === 'android') {
            BackHandler.removeEventListener('hardwareBackPress', this.onBackAndroid);
        }
    }

    onBackAndroid = () => {
        return true;
    };

    onMessage(flag){
        if (flag){
            let message = StoreUtil.filterAndGetAll();
            if (message.length > 0){
                this.setState({showNew:true});
            }
            else {
                this.setState({showNew:false});
            }
        }
        else {
            this.setState({showNew:flag});
        }
    }

    async confirm(index){
        this.modalDownList && this.modalDownList.close();
        let accountId = this.accountList[this.state.accountIndex].accountId;

        let login = {};
        login.email = this.props.store.userSelector.loginInfo.email;
        login.password = this.props.store.userSelector.loginInfo.password;
        login.accountId = accountId;
        login.serviceIndex = index;
        store.save(LOGIN_INFO,JSON.stringify(login));
        AccountUtil.setOriginalId(accountId);

        if (index == 2) {
            HttpUtil.post('store/list',{})
                .then((result)=>{
                    GlobalParam.setStores(result.data.content);
                    Actions.reset(GlobalParam.services[index]);
                })
                .catch((error)=>{
                    this.refs.toast.show(I18n.t('Get store error'),DURATION.LENGTH_SHORT);
                });
        }else {
            Actions.reset(GlobalParam.services[index]);
        }
    }

    async backClick(){
        this.modalDownList && this.modalDownList.close();
        if (this.serviceIndex !== -1){
            await this.confirm(this.serviceIndex);
        }
        else {
            Actions.pop();
        }
    }

    changeAccount(){
        this.modalDownList && this.modalDownList.open();
    }

    async clickRow(item,index){
        setTimeout(() => {
            this.modalDownList && this.modalDownList.close();
        }, 200);

        let accountId = this.accountList[index].accountId;
        if (! await AccountUtil.changeAccount(accountId,true,true)){
            this.refs.toast.show(AccountUtil.getErrorMsg(),DURATION.LENGTH_SHORT);
            return;
        }

        this.setState({accountIndex:index});
    }

    renderRow = ({ item,index}) => {
        let color = index === this.state.accountIndex ? '#ffffff': '#9da0ae';
        return (
            <TouchableOpacity activeOpacity={1} onPress={this.clickRow.bind(this,item,index)} >
                <View style={styles.brandItemSelected}>
                    <Text style={[styles.brandName,{color:color}]} numberOfLines={1}>{item.name}</Text>
                    <View style={{height: 1, width: width - 32, backgroundColor: 'rgba(203,203,203,0.2)'}}/>
                </View>
            </TouchableOpacity>
        )
    }

    render() {
        let height = Dimensions.get('window').height - 150;
        let accountName = this.state.accountIndex === -1 ? '' : this.accountList[this.state.accountIndex].name;
        let showNewFlag = null;
        if (this.state.showNew) { showNewFlag = (
            <View style={{backgroundColor:'#f76260',borderRadius:8,width:10,height:10,marginLeft:5}}/>
        )
        }

        let accountPanel = null;
        if (this.accountList.length > 1){ accountPanel = (
            <TouchableOpacity onPress={this.changeAccount.bind(this)}>
                <View style={{height:60,alignItems:'center',flexDirection:'row',justifyContent:'center',marginTop:-10}}>
                    <Text allowFontScaling={false}  style={styles.NarBarTitle}>{accountName}</Text>
                    <View style={{flex:1}}/>
                    <Image style={{height:37,width:48,marginLeft:10}} resizeMode={'contain'} source={require('../assets/images/home_pulldown_icon_mormal.png')}/>
                </View>
            </TouchableOpacity>
        )
        }
        else {accountPanel = (
            <View style={{height:60,alignItems:'center',flexDirection:'row',justifyContent:'center',marginTop:-10}}>
                <Text allowFontScaling={false}  style={styles.NarBarTitle}>{accountName}</Text>
                <View style={{flex:1}}/>
            </View>
        )
        }

        let accountSrp = (this.state.accountIndex === -1 || this.accountList[this.state.accountIndex].srp == null) ? []
            : this.accountList[this.state.accountIndex].srp;
        let serviceEnable = this.props.store.userSelector.services.find(p => p === 'Custom_UShopService');
        let viuBIService = accountSrp.find(p => p.type === 'Custom_UShopService');
        let viuBIEnable = (serviceEnable && (viuBIService != null)) ? viuBIService.enable : false;

        serviceEnable = this.props.store.userSelector.services.find(p => p === 'Custom_Inspection');
        let viuMOService = accountSrp.find(p => p.type === 'Custom_Inspection');
        let viuMOEnable = (serviceEnable && (viuMOService != null)) ? viuMOService.enable : false;

        serviceEnable = this.props.store.userSelector.services.find(p => p === 'Custom_VIPRecognition');
        let visitorService = accountSrp.find(p => p.type === 'Custom_VIPRecognition');
        let visitorEnable = (serviceEnable && (visitorService != null)) ? visitorService.enable : false;

        return (
            <View style={styles.container}>
                <RNStatusBar />
                {
                    this.showFirst ?
                        <View style={{width:48,height:48,marginLeft:-16}}/> :
                        <TouchableOpacity activeOpacity={0.5} onPress={this.backClick.bind(this)}>
                            <Image source={require('../assets/images/img_navbar_back.png')} style={{width:48,height:48,marginLeft:-16}} />
                        </TouchableOpacity>
                }
                {accountPanel}
                <View style={{height: 1, width: width - 32, backgroundColor: 'rgba(203,203,203,0.2)',marginTop:-10,marginLeft:-3}}/>
                <SlideModalEx ref={(c) => { this.modalDownList = c; }} offsetY={90}>
                    <FlatList
                        style={{maxHeight:height}}
                        data={this.accountList}
                        extraData={this.state}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderRow}
                    />
                </SlideModalEx>

                <Text style={styles.serviceLabel}>{I18n.t('Select service')}</Text>
                <View style={[styles.services, {justifyContent:'space-between'}]}>
                    <TouchableHighlight underlayColor={viuBIEnable ? '#495086' : '#2c314d'} activeOpacity={viuBIEnable ? 0.6 : 1}
                                        style={[PhoneInfo.isEnLanguage() ? {} : {marginLeft:15},{opacity: viuBIEnable ? 1 : 0.2}]}
                                        onPress={()=>{viuBIEnable ? this.confirm(0) : null}}>
                        <View style={styles.servicePanel}>
                            <Image style={styles.itemIcon} source={require('../assets/images/img_service_data.png')}/>
                            <Text style={styles.itemTitle}>{I18n.t('ViuBI')}</Text>
                        </View>
                    </TouchableHighlight>
                    <TouchableHighlight underlayColor={viuMOEnable ? '#495086' : '#2c314d'} activeOpacity={viuMOEnable ? 0.6 : 1}
                                        style={{opacity: viuMOEnable ? 1 : 0.2}}
                                        onPress={()=>{viuMOEnable ? this.confirm(1) : null}}>
                        <View style={styles.servicePanel}>
                            <Image style={styles.itemIcon} source={require('../assets/images/img_service_monitor.png')}/>
                            <Text style={styles.itemTitle}>{I18n.t('ViuMo')}</Text>
                        </View>
                    </TouchableHighlight>
                    <TouchableHighlight underlayColor={visitorEnable ? '#495086' : '#2c314d'} activeOpacity={visitorEnable ? 0.6 : 1}
                                        style={{marginRight:15, opacity: visitorEnable ? 1 : 0.2}}
                                        onPress={()=>{visitorEnable ? this.confirm(2) : null}}>
                            <View style={[styles.servicePanel,PhoneInfo.isEnLanguage() ? {paddingLeft:0,paddingRight:0} : {}]}>
                                <Image style={styles.itemIcon} source={require('../assets/images/img_service_visitor.png')}/>
                                <Text style={styles.itemTitle}>{I18n.t('Visitors')}</Text>
                            </View>
                    </TouchableHighlight>
                </View>

                {
                    this.showFirst ?
                        <View style={{position:'absolute',top:125+lib.statusBarHeight(),left:115,flexDirection:'row',zIndex:50}}>
                            <Image source={require('../assets/images/tipArrow.png')} style={{width:60,height:45}}/>
                            <Text style={{fontSize:16, color:'#f31d65', marginLeft:-48,marginTop:-30}}>{I18n.t('Default service')}</Text>
                        </View>:null
                }

                <View style={{height:20}}/>
                <View>
                    <TouchableHighlightEx underlayColor={'#AAAAAA12'} style={{backgroundColor:'transparent', marginLeft:-16,marginRight:-16}} onPress={()=>{Actions.push('messageList',{back:true})}}>
                        <View style={{height:60,alignItems:'center',flexDirection:'row'}}>
                            <Image style={{height:15,width:15 ,marginLeft:21,marginRight:10}} resizeMode={'contain'} source={ require('../../data/images/setting_10_pic.png')} />
                            <Text allowFontScaling={false}  style={styles.dataValue}>{I18n.t('Notification new')}</Text>
                            <View style={{flex:1}}/>
                            {showNewFlag}
                            <Image style={{height:25,width:25 ,marginLeft:10,marginRight:16}} resizeMode={'contain'} source={ require('../../data/images/setting_nextstep_icon_mormal.png')} />
                        </View>
                    </TouchableHighlightEx>
                    <TouchableHighlightEx underlayColor={'#AAAAAA12'} style={{backgroundColor:'transparent', marginLeft:-16,marginRight:-16}} onPress={()=>{Actions.push('pageSetting')}}>
                        <View style={{height:60,alignItems:'center',flexDirection:'row'}}>
                            <Image style={{height:15,width:15 ,marginLeft:21,marginRight:10}} resizeMode={'contain'} source={ require('../../data/images/setting_12_pic.png')} />
                            <Text allowFontScaling={false}  style={styles.dataValue}>{I18n.t('Setting')}</Text>
                            <View style={{flex:1}}/>
                            <Image style={{height:25,width:25 ,marginLeft:10,marginRight:16}} resizeMode={'contain'} source={ require('../../data/images/setting_nextstep_icon_mormal.png')} />
                        </View>
                    </TouchableHighlightEx>
                </View>
                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
                <BusyIndicator ref={"indicator"} title={I18n.t('Loading')}/>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ColorStyles.COLOR_STATUS_BACKGROUND,
        paddingLeft:16,
        paddingRight:16
    },
    NavBarPanel:{
        flexDirection:'row',
        width:width,
        height:48,
        backgroundColor:ColorStyles.COLOR_STATUS_BACKGROUND,
        paddingLeft: 16,
        paddingRight: 16
    },
    NarBarTitle: {
        fontSize: 18,
        color: '#ffffff',
        height: 48,
        textAlignVertical: 'center',
        lineHeight: 48
    },
    servicePanel:{
        paddingLeft:16,
        paddingRight:16,
        justifyContent: 'center',
        alignItems:'center',
    },
    itemIcon:{
        marginTop:14,
        width: 60,
        height: 60,
        alignSelf:'center'
    },
    itemTitle:{
        fontSize: 14,
        textAlignVertical:'center',
        marginTop: 14,
        marginBottom:14,
        color: ColorStyles.COLOR_MAIN_WHITE
    },
    buttomPanel:{
        position:'absolute',
        bottom:0,
        width: width,
        height: 44,
        backgroundColor:ColorStyles.COLOR_MAIN_RED
    },
    buttomText:{
        fontSize: 16,
        color: '#ffffff',
        height:44,
        lineHeight:44,
        textAlign: 'center',
        textAlignVertical: 'center'
    },
    serviceLabel:{
        fontSize: 12,
        color: '#989ba3',
        marginTop: 15
    },
    dataValue: {
        fontSize:14,
        justifyContent:'center',
        alignItems:'center',
        color:'red'
    },
    brandItemSelected:{
        width: width-32,
        marginLeft:12,
        marginRight:12,
        backgroundColor: '#3b426e',
    },
    brandName:{
        fontSize: 14,
        marginLeft: 20,
        height:60,
        textAlignVertical: 'center',
        ...Platform.select({
            ios:{
                lineHeight:60
            }
        })
    },
    services:{
        flexDirection:'row',
        backgroundColor:'#2c314d',
        width:325,
        height:120,
        borderRadius:2,
        marginTop:20
    }
});
