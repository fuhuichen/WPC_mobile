import React, {Component} from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import I18n from 'react-native-i18n';
import * as simpleStore from "react-native-simple-store";
import {Actions} from "react-native-router-flux";
import Toast, {DURATION} from 'react-native-easy-toast'
import store from "../../mobx/Store";
import AccountUtil from "../utils/AccountUtil";
import AccessHelper from "../common/AccessHelper";
import AccountPanel from "../components/AccountPanel";
import topBackground from '../assets/images/subtraction_8.png';
import dataImage from '../assets/images/img_service_data.png';
import monitorImage from '../assets/images/img_service_monitor.png';
import visitorImage from '../assets/images/img_service_visitor.png';
import cashcheckImage from '../assets/images/img_service_cashcheck.png';
import Spinner from "../element/Spinner";
import {getStoreList} from "../common/FetchRequest";
import {getStoreList_Cashcheck,tokenUpdate_Cashcheck} from "../cashcheck/FetchRequest";
import {Environment} from '../../environments/Environment';
import BorderShadow from '../element/BorderShadow';

const width = Dimensions.get('screen').width;
export default class AccountList extends Component {
    state = {
        errMsg:'',
        serviceIndex:-1,
        visible:false,
        serviceList:[
            {path:dataImage,name:I18n.t('ViuBI'),check:false,show:true},
            {path:monitorImage,name:I18n.t('ViuMo'),check:false,show:true},
            {path:visitorImage,name:I18n.t('Visitors'),check:false,show:AccessHelper.enableVisitor()},
            {path:cashcheckImage,name:I18n.t('CashCheck'),check:false,show:true}
        ],
        storeSelector:store.storeSelector,
        enumSelector: store.enumSelector,
        userSelector: store.userSelector,
    };

    constructor(props){
        super(props);

        this.showFirst = false;
    }

    componentDidMount() {
        this.state.serviceList[2].show = AccessHelper.enableVisitor();
        this.setState({serviceList:this.state.serviceList});
    }

    async onService(index){
        let {enumSelector,serviceList,userSelector,storeSelector} = this.state;
        serviceList.forEach((s_item,s_index)=>{
            s_item.check = index === s_index;
        });
        this.setState({serviceIndex:index,visible:false});
    }

    async next(){
        let {enumSelector, storeSelector, userSelector, serviceIndex} = this.state;
        let accountId = userSelector.accountId;

        let login = {};
        login.email = userSelector.loginInfo.email;
        login.password = userSelector.loginInfo.password;
        login.accountId = accountId;
        login.serviceIndex = serviceIndex;
        simpleStore.save('LoginScreen',JSON.stringify(login));
        AccountUtil.setOriginalId(accountId);

        userSelector.serviceIndex = serviceIndex;
        this.setState({userSelector});

        if (serviceIndex === enumSelector.serviceIndex.VIUMO) {
            let result = await getStoreList();
            if(result.errCode !== enumSelector.errorType.SUCCESS){
                this.refs.toast.show(I18n.t('Get store error'),DURATION.LENGTH_SHORT);
                return false;
            }
            storeSelector.storeList = result.data;
            this.setState({storeSelector});
            AccountUtil.onAccountChange();
        } else if (serviceIndex === enumSelector.serviceIndex.CASHCHECK) {
            let body = {
                userId: userSelector.userId
            }
            let result = await tokenUpdate_Cashcheck(body);
            if(result.errCode !== enumSelector.errorType.SUCCESS){
                this.refs.toast.show(I18n.t('Get store error'),DURATION.LENGTH_SHORT);
                return false;
            }
            result = await getStoreList_Cashcheck();
            if(result.errCode !== enumSelector.errorType.SUCCESS){
                this.refs.toast.show(I18n.t('Get store error'),DURATION.LENGTH_SHORT);
                return false;
            }
            storeSelector.storeList = result.data;
            this.setState({storeSelector});
            AccountUtil.onAccountChange();
        }
        if (serviceIndex !== -1){
            this.setState({visible:true});
            await this.onService(serviceIndex);
            Actions.push('welcome',{index:serviceIndex});
            AccountUtil.onAccountChange();
        }
    }

    changeAccount(isChange){
        let serviceList = this.state.serviceList;
        serviceList[2].show = AccessHelper.enableVisitor();
        serviceList.forEach(p => (p.check = false));
        this.setState({serviceList});
    }

    renderService = ({item,index}) => {
        const {userSelector} = this.state;
        const backgroundColor = item.check ? '#ECF7FF' : '#ffffff';
        let accountSrp = (userSelector.accountList[userSelector.accountIndex].srp == null) ? []
            : userSelector.accountList[userSelector.accountIndex].srp;
        let serviceEnable = userSelector.services.find(p => p === 'Custom_UShopService');
        let viuBIService = accountSrp.find(p => p.type === 'Custom_UShopService');
        let viuBIEnable = (serviceEnable && (viuBIService != null)) ? viuBIService.enable : false;

        serviceEnable = userSelector.services.find(p => p === 'Custom_Inspection');
        let viuMOService = accountSrp.find(p => p.type === 'Custom_Inspection');
        let viuMOEnable = (serviceEnable && (viuMOService != null)) ? viuMOService.enable : false;
        
        serviceEnable = userSelector.services.find(p => p === 'Custom_VIPRecognition');
        let visitorService = accountSrp.find(p => p.type === 'Custom_VIPRecognition');
        let visitorEnable = (serviceEnable && (visitorService != null)) ? visitorService.enable : false;

        serviceEnable = userSelector.services.find(p => p === 'Custom_CashCheck');
        let viuCCService = accountSrp.find(p => p.type === 'Custom_CashCheck');
        let viuCCEnable = (serviceEnable && (viuCCService != null)) ? viuCCService.enable : false;

        const opacity = index === 0 ? viuBIEnable : (index === 1 ? viuMOEnable : (index === 2 ? visitorEnable : viuCCEnable));
        if(item.show) {
            return (
                <View style={[styles.itemContainer,{borderRadius:10}]}>
                    <TouchableOpacity disabled={!opacity}
                                      onPress={()=>opacity ? this.onService(index) : null}
                                      style={[styles.serviceItem,item.check ? styles.checkItem : null,{backgroundColor:backgroundColor,opacity:opacity ? 1 :0.2}]}>
                        <Image source={item.path} style={styles.serviceImage}/>
                        <Text style={styles.serviceName}>{item.name}</Text>
                    </TouchableOpacity>
                </View>
            )
        } else {
            return null;
        }        
    }

    render() {
        const {serviceList,visible,serviceIndex} = this.state;

        return (
            <View style={styles.container}>
                <Text style={styles.welcome}>{I18n.t('Welcome FirstTime')}</Text>
                <AccountPanel drawer={false} changeAccount={(isChange)=>this.changeAccount(isChange)}
                    toast={(content) => {this.refs.toast && this.refs.toast.show(content, 3000)}}/>
                <View style={styles.errMsgView}>
                    <Text style={styles.errMsg}>{this.state.errMsg}</Text>
                </View>
                <View style={styles.titleView}>
                    <Text style={styles.title}>{I18n.t('Select service')}</Text>
                </View>
                <View style={[styles.serviceList,BorderShadow.div]}>
                    <FlatList
                        horizontal={true}
                        data={serviceList}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderService}
                    />
                </View>
                <TouchableOpacity activeOpacity={(serviceIndex === -1) ? 1 : 0.5} onPress={this.next.bind(this)}>
                    <View style={[styles.submitView, (serviceIndex === -1) && {backgroundColor:'#CCCED1'}]}>
                        <Text style={[styles.submitText, (serviceIndex === -1) && {color:'#85898E'}]}>{I18n.t('Next')}</Text>
                    </View>
                </TouchableOpacity>
                <Text style={styles.version}>{I18n.t('App version')} {Environment.APP_VERSION}</Text>
                <Spinner visible={visible} textContent={I18n.t('Login in')} textStyle={{color:'#ffffff',fontSize:14,marginTop:-50}}/>
                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        position: 'relative',
        flex:1,
        backgroundColor:'#F7F9FA',
        paddingTop:130
    },
    version:{
        position: 'absolute',
        bottom:28,
        fontSize:14,
        color:'#A7A6A6'
    },
    itemContainer:{
        backgroundColor:'#fff',
        width:(width-50)/3,
    },
    serviceItem:{
        width:(width-50)/3,
        height:92,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius:12
    },
    checkItem:{
        borderWidth:1,
        borderColor:'#2C90D9',
        borderRadius:10
    },
    serviceImage:{
        width:50,
        height:50
    },
    serviceName:{
        fontSize:12,
        color:'#000000',
        marginTop:6,
        textAlign: 'center',
    },
    welcome:{
        marginTop:-26,
        color:'#000000',
        fontSize:30,
        lineHeight:42,
        marginLeft:16,
        marginRight:16
    },
    errMsgView:{
        width: width-48,
        textAlign:'left',
        lineHeight:15
    },
    errMsg:{
        color:'#F11E66',
        fontSize:12,
    },
    titleView:{
        width: width-48,
        textAlign:'left',
        lineHeight:18,
        marginTop:10
    },
    title:{
        color:'#000000',
        fontSize:18,
    },
    serviceList:{
        marginTop:6,
        width: width-48,
        height:96,
        borderRadius:10,
        flexDirection:'row',
        alignItems: 'center',
        backgroundColor:'#fff'
    },
    submitView:{
        width: width-48,
        marginTop:18,
        backgroundColor:'#0365AE',
        height:46,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius:10,
    },
    submitText:{
        fontSize:18,
        color:'#ffffff',
    }
});
