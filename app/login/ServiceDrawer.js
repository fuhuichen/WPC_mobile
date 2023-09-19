import React, {Component} from 'react';
import {
    StyleSheet, 
    View, 
    Text, 
    Dimensions, 
    Image,
    Platform,
    BackHandler,
    TouchableHighlight, 
    TouchableOpacity,
    FlatList,
    DeviceEventEmitter,
    ScrollView
} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import Toast, {DURATION} from 'react-native-easy-toast'
import * as simpleStore from "react-native-simple-store";
import store from "../../mobx/Store";
import GlobalParam from "../common/GlobalParam";
import ModalCenter from '../components/ModalCenter';
import AccountPanel from "../components/AccountPanel";
import drawerLogo from '../assets/images/drawer_logo.png';
import people from '../assets/images/icon_people.png';
import setting from '../assets/images/icon_setting.png';
import ViuBiCheck from '../assets/images/ViuBI_icon_check.png';
import ViuBiUncheck from '../assets/images/ViuBI_icon_uncheck.png';
import ViuMoCheck from '../assets/images/ViuMo_icon_check.png';
import ViuMoUncheck from '../assets/images/ViuMo_icon_uncheck.png';
import ViuCCCheck from '../assets/images/ViuCC_icon_check.png';
import ViuCCUncheck from '../assets/images/ViuCC_icon_uncheck.png';
import btnCheck from '../assets/images/btn_check_service.png';
import btnUncheck from '../assets/images/btn_uncheck_service.png';
import otherService from '../assets/images/other_service.png';
import settingPress from '../assets/images/icon_setting-press.png';
import {getStoreList, getUserInfo, tokenUpdate, getNotificationMessageUnread, logoutRequest} from "../common/FetchRequest";
import {getStoreList_Cashcheck, getUserInfo_Cashcheck, tokenUpdate_Cashcheck} from "../cashcheck/FetchRequest";
import AccessHelper from "../common/AccessHelper";
import UserPojo from "../entities/UserPojo";
import {ColorStyles} from '../common/ColorStyles';
import * as lib from '../common/PositionLib';
import {Environment} from '../../environments/Environment';
import BorderShadow from '../element/BorderShadow';
import {REFRESH_NOTIFICATION} from "../common/Constant";
import StoreUtil from "../utils/StoreUtil";
import AccountUtil from '../utils/AccountUtil';
import EventBus from "../common/EventBus";

const {height} = Dimensions.get('window');const {width} = Dimensions.get('screen');
export default class ServiceDrawer extends Component {
    state = {
        activeIndex:-1,
        changeAccount:false,
        storeSelector: store.storeSelector,
        enumSelector: store.enumSelector,
        userSelector: store.userSelector,
        notifySelector: store.notifySelector,
        logColor:'#484848',
        setColor:'#484848',
        onModal: false,
        userName:  UserPojo.getUserName(),
        msgColor:'#484848',
        showNew: false
    };

    constructor(props) {
        super(props);
        let {enumSelector} = this.state;
        this.sections = [
                {index: enumSelector.serviceIndex.VIUBI, title:I18n.t('ViuBI'), check:false, 
                 uri:ViuBiUncheck, pressUri:ViuBiCheck, push:'pageIndex', show:true},

                {index: enumSelector.serviceIndex.VIUMO, title:I18n.t('ViuMo'), check:false, 
                 uri:ViuMoUncheck, pressUri:ViuMoCheck, push:'homePage',show:true},

                 {index: enumSelector.serviceIndex.CASHCHECK, title:I18n.t('CashCheck'), check:false, 
                  uri:ViuCCUncheck, pressUri:ViuCCCheck, push:'cashcheckhomePage', show:true},
                 
                {index: enumSelector.serviceIndex.VISITORS, title:I18n.t('Visitors'), check:false, 
                 uri:otherService, pressUri:otherService, push:'visitorPage', show:AccessHelper.enableVisitor()},
            ];
    }

    componentDidMount(){
        this.onNotify();
        this.notifyEmitter = DeviceEventEmitter.addListener(REFRESH_NOTIFICATION, () => {
            this.onNotify();
        });

        this.accountEmitter = DeviceEventEmitter.addListener('onAccount', (accountId) =>{
            let {userSelector, userName} = this.state;
            userSelector.accountIndex = userSelector.accountList.findIndex(p => p.accountId === accountId);
            userName = UserPojo.getUserName();

            this.refs.account && this.refs.account.update(userSelector.accountIndex);
            this.setState({userSelector, userName, changeAccount: (this.accountId !== accountId)});
        });
    }

    componentWillMount(){
        let {userSelector} = this.state;
        this.sections.forEach((item)=>{
            if(userSelector.serviceIndex === item.index){
                item.check = true;
            }
            if(item.index == 2) {
                item.show = AccessHelper.enableVisitor();
            }
        });
        //this.sections[2].show = AccessHelper.enableVisitor();
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('closeDrawer', this.onBackAndroid);
        }
    }

    componentWillUnmount() {
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('closeDrawer', this.onBackAndroid);
        }

        this.notifyEmitter && this.notifyEmitter.remove();
    }

    onBackAndroid = () => {
        let {userSelector} = this.state;
        if(userSelector.openDrawer){
            userSelector.backDrawer = true;
            this.setState({userSelector});
            this.backClick();
        }
    };

    async onNotify(){
        let {userSelector,enumSelector} = this.state;
        //StoreUtil.refresh();
        //this.setState({showNew: StoreUtil.getSize() > 0});

        let result = await getNotificationMessageUnread();
        //console.log("getNotificationMessageUnread result : ", JSON.stringify(result));
        if(result.errCode == enumSelector.errorType.SUCCESS) {
            this.setState({showNew: result.data});
        }

        this.accountId = userSelector.accountId;
    }

    onItemIn(item,index) {
        this.sections.forEach((s_item)=>{
                s_item.check = (item.item.index === s_item.index);
        });
        this.setState({activeIndex:item.item.index});
    }

    async onItemOut(serviceIndex,index) {
        let {userSelector,storeSelector,enumSelector} = this.state;
        
        // change user authorities
        if (serviceIndex == enumSelector.serviceIndex.CASHCHECK) {
            let body = {
                userId: userSelector.userId
            }
            let result = await tokenUpdate_Cashcheck(body);
            if(result.errCode !== enumSelector.errorType.SUCCESS){
                this.refs.toast && this.refs.toast.show(I18n.t('Change service error'),DURATION.LENGTH_SHORT);
                return false;
            }
            result = await getUserInfo_Cashcheck();
            if(result.errCode == enumSelector.errorType.SUCCESS){
                AccessHelper.setData(result.data.authorities);
            }
        } else {
            let body = {
                userId: userSelector.userId
            }
            let result = await tokenUpdate(body);
            if(result.errCode !== enumSelector.errorType.SUCCESS){
                this.refs.toast && this.refs.toast.show(I18n.t('Change service error'),DURATION.LENGTH_SHORT);
                return false;
            }
            result = await getUserInfo();
            if(result.errCode == enumSelector.errorType.SUCCESS){
                AccessHelper.setData(result.data.authorities);
            }
        }

        //this.sections[this.state.activeIndex].check=false;
        this.sections.forEach((s_item)=>{
            s_item.check = (serviceIndex === s_item.index);
        });
        this.setState({activeIndex:serviceIndex});
        let accountId = userSelector.accountList[userSelector.accountIndex].accountId;
        let login = {};
        login.email = userSelector.loginInfo.email;
        login.password = userSelector.loginInfo.password;
        login.accountId = accountId;
        login.serviceIndex = serviceIndex;
        simpleStore.save('LoginScreen',JSON.stringify(login));

        if (serviceIndex == enumSelector.serviceIndex.VIUMO) {
            let result = await getStoreList();
            if(result.errCode !== enumSelector.errorType.SUCCESS){
                this.refs.toast && this.refs.toast.show(I18n.t('Get store error'),DURATION.LENGTH_SHORT);
                return false;
            }
            storeSelector.storeList = result.data;
            this.setState({storeSelector});
        } else if (serviceIndex == enumSelector.serviceIndex.CASHCHECK) {
            let result = await getStoreList_Cashcheck();
            if(result.errCode !== enumSelector.errorType.SUCCESS){
                this.refs.toast && this.refs.toast.show(I18n.t('Get store error'),DURATION.LENGTH_SHORT);
                return false;
            }
            storeSelector.storeList = result.data;
            this.setState({storeSelector});
        }
        userSelector.openDrawer = false;
        userSelector.serviceIndex = serviceIndex;
        this.setState({userSelector});
        DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
        DeviceEventEmitter.emit('onStatusBarTrans', false);
        Actions.reset(GlobalParam.services[serviceIndex]);
    }

    confirm(index){
        if(index === 0){
            DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
            DeviceEventEmitter.emit('onStatusBarTrans', false);
            this.setState({setColor:'#484848'});
            Actions.push('pageSetting');
        }else if(index === 1){
            DeviceEventEmitter.emit('drawerOffset', false);
            this.setState({logColor:'#484848'});
            this.refs.signOut.open();
        }else if(index === 2){
            let {notifySelector, enumSelector} = this.state;
            notifySelector.type = enumSelector.notifyType.EVENT;
            this.setState({msgColor:'#484848', notifySelector});

            Actions.push('notification');
        }
    }

    async signOutConfirm(){
        let {enumSelector} = this.state;
        let result = await logoutRequest();
        if(result.errCode == enumSelector.errorType.SUCCESS) {
            setTimeout(function() {
                let loginInfo = store.userSelector.loginInfo;
                loginInfo.password = '';
                simpleStore.get('LoginScreen').then((res)=> {
                    if (res != null) {
                        let login = JSON.parse(res);
                        if (login.accountId != null){
                            loginInfo.accountId = login.accountId;
                        }
                        if (login.serviceIndex != null){
                            loginInfo.serviceIndex = login.serviceIndex;
                        }
                    }
                    simpleStore.save('LoginScreen',JSON.stringify(loginInfo));
                    simpleStore.delete('StorePicker');
                    simpleStore.delete('EventStorePicker');
                    store.storeSelector.catchStore = {country:'',province:'',city:''};
                    store.storeSelector.catchEventStore = {country:'',province:''};
                    store.userSelector.openDrawer = false;
                    store.userSelector.isMysteryMode = false;
                    store.userSelector.isMysteryModeOn = false;
                    DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
                    DeviceEventEmitter.emit('onStatusBarTrans', false);
                    Actions.reset('loginScreen',{reset:true});
                });
            }.bind(this),DURATION.LENGTH_SHORT+3);
        } else {
            DeviceEventEmitter.emit('Toast', I18n.t('Network error'));
        }        
    }

    async backClick(){
        let {enumSelector,storeSelector,userSelector} = this.state;

        let serviceBI = userSelector.services.find(p => p === 'Custom_UShopService');
        let serviceMO = userSelector.services.find(p => p === 'Custom_Inspection');

        let check = true;
        if ((serviceBI == null) && (serviceMO == null) ){
            check = false;
        } 
        if(userSelector.serviceIndex  != -1){
             if (userSelector.serviceIndex  == 0 && serviceBI == null){
                 check = false;
             }
             if (userSelector.serviceIndex  == 1 && serviceMO == null){
                 check = false;
             }
        }

        if(!check){
            this.refs.toast && this.refs.toast.show(I18n.t('Select service'),DURATION.LENGTH_SHORT);
            return false;
        }

        this.refs.account.close();

        let color = null;
        if(userSelector.serviceIndex  == 2){
            color = ColorStyles.STATUS_RGB_BLACK
        }else{
            color = ColorStyles.STATUS_RGB_BLUE
        }
        DeviceEventEmitter.emit('onStatusBar', color);
        DeviceEventEmitter.emit('onStatusBarTrans', false);
        this.props.onDrawer(false);
        if (this.state.changeAccount){
            if (userSelector.serviceIndex == enumSelector.serviceIndex.CASHCHECK) {
                let result = await getStoreList_Cashcheck();
                if(result.errCode !== enumSelector.errorType.SUCCESS){
                    this.refs.toast && this.refs.toast.show(I18n.t('Get store error'),DURATION.LENGTH_SHORT);
                    return false;
                }
                storeSelector.storeList = result.data;
                storeSelector.tempReportStoreBI = null;
                storeSelector.storeListBI = result.data;
                result.data.length !==0 && this.setState({storeSelector});
            } else {
                let result = await getStoreList();
                if(result.errCode !== enumSelector.errorType.SUCCESS){
                    this.refs.toast && this.refs.toast.show(I18n.t('Get store error'),DURATION.LENGTH_SHORT);
                    return false;
                }
                storeSelector.storeList = result.data;
                storeSelector.tempReportStoreBI = null;
                storeSelector.storeListBI = result.data;
                result.data.length !==0 && this.setState({storeSelector});
            }
            let login = JSON.parse(await simpleStore.get('LoginScreen'));
            Actions.reset(GlobalParam.services[login.serviceIndex]);
        }

    }

    changeAccount(isChange){
        let {enumSelector,userSelector} = this.state;
        AccountUtil.onAccountChange();
        //this.sections[2].show = AccessHelper.enableVisitor();
        this.sections.forEach((item)=>{
            if(item.index == 2) {
                item.show = AccessHelper.enableVisitor();
            }
        });        

        if(userSelector.serviceIndex == enumSelector.serviceIndex.CASHCHECK) {
            let serviceEnable = userSelector.services.find(p => p === 'Custom_CashCheck');
            if(serviceEnable == null) {
                this.onItemOut(enumSelector.serviceIndex.VIUMO)
            }
        }
        this.setState({
            changeAccount:isChange,
            userName: UserPojo.getUserName()
        });
    }

    async switchMyteryMode(isMysteryModeOn) {
        let {userSelector, storeSelector, enumSelector} = this.state;
        userSelector.isMysteryModeOn = isMysteryModeOn;
        let result = await getStoreList();
        if (result.errCode === enumSelector.errorType.SUCCESS){
            storeSelector.storeList = result.data;
        }
        this.setState({userSelector, storeSelector});
        EventBus.refreshStoreList();
        EventBus.refreshApprovePage();
    }

    renderMysteryMode() {
        let {userSelector} = this.state;
        let isMysteryModeOn = userSelector.isMysteryModeOn;
        let myteryModes = [
            {
                title: I18n.t('General'),
                modeOn: false
            },{
                title: I18n.t('Mystery'),
                modeOn: true
            }
        ]
        return (
            <View style={{marginTop: 10}}>
                <View style={{alignItems:'flex-end'}}>
                    <Text style={styles.mysteryModeTitle}>{I18n.t('Mode Select')}</Text>
                    <View style={styles.mysteryModeContainer}>
                        {
                            myteryModes.map(item => {
                                let backgroundColor = (isMysteryModeOn == item.modeOn) ? '#006AB7' : 'transparent';
                                let color = (isMysteryModeOn == item.modeOn) ? '#FFFFFF' : '#8A8A8A';
                                return (
                                    <TouchableOpacity activeOpacity={1} onPress={async ()=>{ await this.switchMyteryMode(item.modeOn)} } 
                                            style={[styles.mysteryModeButton, {backgroundColor}]}>
                                        <Text style={[styles.mysteryModeName,{color}]}>{item.title}</Text>
                                    </TouchableOpacity>
                                )
                            })
                        }
                    </View>
                </View>
            </View>
        )
    }

    renderItem = (item,index) => {
        let color = item.item.check ? '#006AB7': '#484848';
        let uri = item.item.check ? item.item.pressUri : item.item.uri;
        const services = this.sections.filter(p=>p.show);
        const borderBottomWidth = item.index === services.length-1 ? 0 : 1;
        const serviceCheck = item.item.check ? btnCheck : btnUncheck;

        const {userSelector} = this.state;
        let accountSrp = (userSelector.accountList[userSelector.accountIndex].srp == null) ? []
            : userSelector.accountList[userSelector.accountIndex].srp;

        let serviceEnable = userSelector.services.find(p => p === 'Custom_UShopService');
        let viuBIService = accountSrp.find(p => p.type === 'Custom_UShopService');
        let viuBIEnable = (serviceEnable && (viuBIService != null)) ? viuBIService.enable : false;
        ((item.item.index === 0) && (serviceEnable == null)) && (color = '#484848');
        ((item.item.index === 0) && (serviceEnable == null)) && (uri = item.item.uri);

        serviceEnable = userSelector.services.find(p => p === 'Custom_Inspection');
        let viuMOService = accountSrp.find(p => p.type === 'Custom_Inspection');
        let viuMOEnable = (serviceEnable && (viuMOService != null)) ? viuMOService.enable : false;
        ((item.item.index === 1) && (serviceEnable == null)) && (color = '#484848');
        ((item.item.index === 1) && (serviceEnable == null)) && (uri = item.item.uri);

        serviceEnable = userSelector.services.find(p => p === 'Custom_VIPRecognition');
        let visitorService = accountSrp.find(p => p.type === 'Custom_VIPRecognition');
        let visitorEnable = (serviceEnable && (visitorService != null)) ? visitorService.enable : false;
        ((item.item.index === 2) && (serviceEnable == null)) && (color = '#484848');
        ((item.item.index === 2) && (serviceEnable == null)) && (uri = item.item.uri);

        serviceEnable = userSelector.services.find(p => p === 'Custom_CashCheck');
        let viuCCService = accountSrp.find(p => p.type === 'Custom_CashCheck');
        let viuCCEnable = (serviceEnable && (viuCCService != null)) ? viuCCService.enable : false;
        ((item.item.index === 3) && (serviceEnable == null)) && (color = '#484848');
        ((item.item.index === 3) && (serviceEnable == null)) && (uri = item.item.uri);

        const opacity = item.item.index === 0 ? viuBIEnable : (item.item.index === 1 ? viuMOEnable : (item.item.index === 2 ? visitorEnable : viuCCEnable));
        return(
            <View>
                {item.item.show ?
                    <View>
                        <TouchableOpacity activeOpacity={1} onPress={()=>(opacity ? this.onItemOut(item.item.index) : null)}
                                            disabled={!opacity}
                                            style={{opacity:opacity ? 1 : 0.2}}>
                            <View style={[styles.serviceItem,{borderBottomWidth}]}>
                                <Image source={uri} style={styles.itemImage}/>
                                <Text style={{color:color,flex:1}}>{item.item.title}</Text>
                                {opacity && <Image style={{width:12,height:12}} source={serviceCheck}/>}
                            </View>
                        </TouchableOpacity>                        
                        {(userSelector.isMysteryMode && item.item.title == I18n.t('ViuMo') && item.item.check == true) && this.renderMysteryMode()}    
                    </View> : null
                }
            </View>
        )
    };

    render() {
        const {userSelector,setColor,logColor, msgColor, onModal, userName, showNew, enumSelector} = this.state;
        let isMysteryModeOn = userSelector.isMysteryModeOn;
        return (
            <View style={styles.container}>
                <View style={styles.leftPanel}>
                    <TouchableOpacity onPress={this.backClick.bind(this)} style={styles.backbtn}>
                        <Image style={{width:9,height:16}} source={require('../assets/images/back_arrow.png')}/>
                    </TouchableOpacity>
                    <View style={styles.logo}>
                        <Image style={{width:132,height:21}} source={drawerLogo}/>
                    </View>
                    <Text style={styles.accountName}>{userName}</Text>
                    <Text style={styles.account}>{userSelector.loginInfo.email}</Text>

                    <View style={[styles.item,{borderColor: onModal ? '#2C90D9' : '#D4D4D4'}]}>
                        <AccountPanel ref={'account'} drawer={true} changeAccount={(isChange)=>this.changeAccount(isChange)}
                            onModal={(value) => this.setState({onModal: value})}
                            toast={(content) => {this.refs.toast && this.refs.toast.show(content, 3000)}}/>
                    </View>

                    {!isMysteryModeOn && <TouchableOpacity activeOpacity={1} onPressIn={()=>this.setState({setColor:'#006AB7'})} onPressOut={()=>this.confirm(0)}>
                        <View style={[styles.item,{borderColor:setColor === '#484848' ? '#D4D4D4' : setColor}]}>
                            <Text style={{color:setColor}}>{I18n.t('bi_simple_setting')}</Text>
                        </View>
                    </TouchableOpacity>}

                    {userSelector.serviceIndex != enumSelector.serviceIndex.CASHCHECK && !isMysteryModeOn && 
                    <TouchableOpacity activeOpacity={1} onPressIn={()=>this.setState({msgColor:'#006AB7'})} onPressOut={()=>this.confirm(2)}>
                        <View style={[styles.item,{borderColor:msgColor === '#484848' ? '#D4D4D4' : msgColor}]}>
                            <Text style={{color:msgColor}}>{I18n.t('Notifications')}</Text>
                            {showNew && <View style={styles.message}/>}
                        </View>
                    </TouchableOpacity>}

                    <TouchableOpacity activeOpacity={1} onPressIn={()=>this.setState({logColor:'#006AB7'})} onPressOut={()=>this.confirm(1)}>
                        <View style={[styles.item,{borderColor:logColor === '#484848' ? '#D4D4D4' : logColor}]}>
                            <Text style={{color:logColor}}>{I18n.t('Log out')}</Text>
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.serviceTitle}>{I18n.t('Select service')}</Text>
                    <View style={{flex:1, paddingBottom:50}}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={[styles.serviceView, BorderShadow.div]}>
                                <FlatList
                                    data={this.sections}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={this.renderItem}
                                />
                            </View>
                        </ScrollView>
                    </View>
                    <Text style={styles.version}>{I18n.t('App version')} {Environment.APP_VERSION}</Text>
                    <ModalCenter ref={"signOut"} title={I18n.t('LogOut title')} description={I18n.t('Confirm LogOut')}
                                 height={175} enableDraw={true}
                                 confirm={()=>this.signOutConfirm()}/>
                    <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
                </View>
                <TouchableOpacity activeOpacity={1} onPress={async () => {await this.backClick()}}>
                       <View style={styles.rightPanel} />
                </TouchableOpacity>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container:{
        flexDirection:'row'
    },
    leftPanel:{
        width:243,
        backgroundColor:'#fff',
        ...Platform.select({
            ios:{
                paddingTop:lib.statusBarHeight(),
            },
            android:{
                paddingTop:20,
            }
        })
    },
    rightPanel:{
        width:width-243,
        height:'100%',
        backgroundColor:'transparent'
    },
    version:{
        position: 'absolute',
        bottom:10,
        left:24,
        //padding:24,
        fontSize:14,
        color:'#A7A6A6'
    },
    logo:{
        alignItems: 'center',
        paddingTop:38,
        paddingBottom:20
    },
    header:{
        color:'#484848',
        fontSize:14,
        paddingLeft:24,
        paddingTop:5
    },
    serviceView:{
        width:222,
        marginLeft:10,
        borderRadius:10
    },
    serviceItem:{
        flexDirection:'row',
        alignItems: 'center',
        height:50,
        lineHeight:50,
        marginLeft:13,
        marginRight:13,
        borderColor:'#484848'
    },
    title:{
        color:'#000000',
        fontSize:14
    },
    serviceTitle:{
        color:'#484848',
        marginTop:38,
        marginLeft:24,
        marginBottom:12
    },
    item:{
        flexDirection:'row',
        alignItems: 'center',
        height:37,
        lineHeight:37,
        marginLeft:24,
        marginRight:24,
        marginTop:8,
        borderBottomWidth:1
    },
    itemImage:{
        width:22,
        height:22,
        marginRight:7
    },
    accountName:{
        marginTop:24,
        fontSize:20,
        color:'#000000',
        marginLeft:24
    },
    account:{
        fontSize:12,
        color:'#8A8A8A',
        marginLeft:24
    },
    backbtn:{
        marginTop:8,
        flexDirection:'row',
        alignItems: 'center',
        marginLeft:16,
    },
    backText:{
        marginLeft:6,
        fontSize:17,
        color:'#666666'
    },
    message:{
        position:'absolute',
        right:0,
        top:10,
        width:10,
        height:10,
        borderRadius:5,
        backgroundColor:'rgb(245,120,72)'
    },
    mysteryModeTitle:{
        fontSize:12, 
        color:'#8A8A8A', 
        width:170
    },
    mysteryModeContainer:{
        flexDirection:'row',
        borderRadius:8,
        borderColor:'#00000010',
        marginTop:8,
        marginRight:12,
        //marginBottom:24,
        borderWidth:1,
        width:170
    },
    mysteryModeButton:{
        flexDirection:'row',
        justifyContent:'center',
        width:85,
        height:32,
        borderRadius:8
    },
    mysteryModeName:{
        height:32,
        lineHeight:32,
        fontSize:14,
        textAlignVertical:'center'
    }
});
