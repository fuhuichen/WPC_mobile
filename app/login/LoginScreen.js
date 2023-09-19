import React, {Component} from 'react';
import {
    Dimensions,
    Image,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    DeviceEventEmitter
} from 'react-native';
//import firebase from 'react-native-firebase';
import I18n from 'react-native-i18n';
import {Card} from 'react-native-shadow-cards';
import * as simpleStore from "react-native-simple-store";
import {Actions} from 'react-native-router-flux';
import DeviceInfo from 'react-native-device-info';
import Toast, {DURATION} from 'react-native-easy-toast'
import SplashScreen from "react-native-splash-screen";
import dismissKeyboard from 'react-native-dismiss-keyboard';
import {request,PERMISSIONS,RESULTS} from 'react-native-permissions';
import store from "../../mobx/Store";
import FileUtil from "../utils/FileUtil";
import StoreUtil from "../utils/StoreUtil";
import AlertUtil from "../utils/AlertUtil";
import UserPojo from "../entities/UserPojo";
import * as lib from '../common/PositionLib';
import AccountUtil from "../utils/AccountUtil";
import PhoneInfo from "../entities/PhoneInfo";
import VersionUtil from "../utils/VersionUtil";
import GlobalParam from "../common/GlobalParam";
import AccessHelper from "../common/AccessHelper";
import StringFilter from "../common/StringFilter";
import DataStorage from "../common/DataStorage";
import RNUpdate from "../thirds/autoupdate/index";
import RNStatusBar from '../components/RNStatusBar';
import loginLogo from '../assets/images/group_3.png';
import backArrowImage from '../assets/images/back_arrow.png';
import visibilityOnImage from '../assets/images/trailing_icon.png';
import visibilityOffImage from '../assets/images/visibility_off.png';
import Spinner from "../element/Spinner";
import {loginRequest,getUserInfo,getUserAccountList,getStoreList,getAppVersion,isMysteryMode,getGeneralSetting,getAdvancedSetting} from "../common/FetchRequest";
import {tokenUpdate_Cashcheck,getStoreList_Cashcheck,getUserInfo_Cashcheck} from "../cashcheck/FetchRequest";
import BorderShadow from '../element/BorderShadow';
//import JMessage from "../notification/JMessage";
import FcmUtil from "../utils/FcmUtil";
import PlayerUtil from "../utils/PlayerUtil";
import { FileLogger } from "react-native-file-logger";
import Config from "react-native-config";
import Bugsnag from '@bugsnag/react-native'

const WIDTH = Dimensions.get('screen').width;
export default class LoginScreen extends Component {
    state={
        user:'',
        password:'',
        errMsg:'',
        status:0,
        visible:false,
        autoFocus:false,
        isFocus:false,
        securePassword:true,
        userSelector:store.userSelector,
        storeSelector: store.storeSelector,
        enumSelector: store.enumSelector,
        paramSelector: store.paramSelector
    }

    constructor(props){
        super(props);

        this.autoAccountId = -1;
        this.autoServiceIndex = -1;
        this.autoUser = '';
        this.auto = false;
        this.resetFlag = false;
    }

    async componentDidMount(){
        FileLogger.configure();
        DeviceEventEmitter.emit('onStatusBar', '#F7F9FA');
        await PhoneInfo.setAppLocale();
        if(this.props.token != null && !this.props.token){
            this.refs.toast.show(I18n.t('Resign in'),3000);
            this.resetFlag = true;
        }
        if (!this.resetFlag && this.props.reset == null){
            let platform = lib.isAndroid() ? 0 : 1;
            let result = await getAppVersion(platform);
            if(result.errCode === 0){
                if(VersionUtil.compare(result.data.version) > 0){
                    VersionUtil.setVersion(result.data);
                    SplashScreen.hide();
                    $RNUpdate.onShow(result.data,false);
                    return;
                }
            }
        }

        let {userSelector} = this.state;
        userSelector.openDrawer = false;
        await this.setState({userSelector});

        await this.init();
    }

    async onCancelUpdate(){
        await this.init();
    }

    async init(){
        let res = await simpleStore.get('LoginScreen');
        if (res != null) {
            let login = JSON.parse(res);
            this.setState({user: login.email, password: login.password});
            if (login.accountId != null && login.serviceIndex != null){
                this.auto = true;
                this.autoAccountId = login.accountId;
                this.autoServiceIndex = login.serviceIndex;
                this.autoUser = login.email;
            }

            if (!this.resetFlag && login.user !== '' && login.password !== ''){
                SplashScreen.hide();
                await this.login();
                return;
            }
        }
        setTimeout(()=>{
            SplashScreen.hide();
        },1000);
    }

    userChanged(text){
        this.setState({
            user: StringFilter.all(text,50)
        })
    }

    passwordChanged(text){
        this.setState({
            password: StringFilter.all(text,50)
        })
    }

    checkLogin(){
        if(this.state.status === 0 && this.state.user == ''){
            this.setState({errMsg:I18n.t('Enter account')});
            return false;
        }else if(this.state.status === 1 && this.state.password == ''){
            this.setState({errMsg:I18n.t('Enter password')});
            return false;
        }
        return true;
    }

    next() {
        this.setState({pressNext: false});
        if(this.state.status === 0){
            if(this.state.user == ''){
                this.setState({errMsg:I18n.t('Enter account')});
                return false;
            }
            let {userSelector,user} = this.state;
            userSelector.email = user;
            this.setState({status:1,autoFocus:true,userSelector,errMsg:''});
        }else{
            this.setState({isFocus:false});
            if(Platform.OS === 'android') {
                this.login();
                /*request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE)
                    .then(result => {
                        console.log("request WRITE_EXTERNAL_STORAGE result : ", JSON.stringify(result))
                        if (result ===  RESULTS.GRANTED){
                            this.login();
                        }
                        else {
                            AlertUtil.alert(I18n.t('Storage'));
                        }
                    });*/
            }
            else {
                this.login();
            }
        }
    }

    async login() {
        UserPojo.setUser(null);
        let {storeSelector,userSelector,enumSelector,paramSelector} = this.state;
        storeSelector.tempReportStore = null;        
        store.filterSelector.initAnalysis();
        dismissKeyboard();
        this.setState({errMsg:''});
        if(!this.checkLogin()){
            return false;
        }
        try{
            this.setState({visible:true});
            //await JMessage.init();
            await FcmUtil.init();

            let body = {};
            body.email = this.state.user;
            body.password = this.state.password;
            body.lang = PhoneInfo.getLocale();
            body.clientId = DeviceInfo.getUniqueId();

            FileUtil.clearAll();
            let result = await loginRequest(body);
            console.log("loginRequest result : ", JSON.stringify(result));

            if(result.errCode !== enumSelector.errorType.SUCCESS){
                this.errorMsg(result.errMsg);
                return false;
            }

            let originalToken = result.data.originalToken;
            let userId = result.data.userId;
            userSelector.loginInfo = {email:body.email,password:body.password};
            userSelector.token = originalToken;
            userSelector.userId = userId;
            UserPojo.setUser(result.data);
            if(lib.isAndroid()){
                PlayerUtil.setCategory(result.data.ezvizGlobal);
            }

            if(this.autoServiceIndex == enumSelector.serviceIndex.CASHCHECK) {
                let body = {
                    userId: userSelector.userId
                }
                result = await tokenUpdate_Cashcheck(body);
                if(result.errCode !== enumSelector.errorType.SUCCESS){
                    this.errorMsg(result.errMsg);
                    return false;
                }
                result = await getUserInfo_Cashcheck();
            } else {
                result = await getUserInfo();
            }
            
            if(result.errCode !== enumSelector.errorType.SUCCESS){
                this.errorMsg(result.errMsg);
                return false;
            }

            let accountId = result.data.accountId;
            if(FcmUtil.getAccountId() != "") {
                this.autoAccountId = FcmUtil.getAccountId();
            }
            let userName = result.data.userName;
            userSelector.roleId = result.data.roleId;
            userSelector.services = result.data.services ? result.data.services : [];
            UserPojo.setUserName(userName);
            AccessHelper.setData(result.data.authorities);

            result = await getUserAccountList();
            if(result.errCode !== enumSelector.errorType.SUCCESS){
                this.errorMsg(result.errMsg);
                return false;
            }
            UserPojo.setAccountIds(result.data);
            userSelector.accountList = result.data;

            let findAccount = result.data.find(p => p.accountId === accountId);
            if(!findAccount){
                accountId = result.data[0].accountId;
                await AccountUtil.changeAccount(accountId,false,false);
                {
                    result = await getUserInfo();

                    if(result.errCode !== enumSelector.errorType.SUCCESS){
                        this.errorMsg(result.errMsg);
                        return false;
                    }
                    let userName = result.data.userName;
                    userSelector.roleId = result.data.roleId;
                    userSelector.services = result.data.services ? result.data.services : [];
                    UserPojo.setUserName(userName);
                    AccessHelper.setData(result.data.authorities);
                }
            }
            UserPojo.setAccountId(accountId);
            userSelector.accountId = accountId;
            userSelector.accountList.forEach((item,index)=>{
                if(item.accountId === accountId){
                    userSelector.accountIndex = index;
                }
            })
            StoreUtil.init();

            let jumpFlag = false;
            if (this.auto && this.autoUser === this.state.user){
                jumpFlag = await AccountUtil.changeAccount(this.autoAccountId,false,false);
                if (jumpFlag){
                    let serviceBI = userSelector.services.find(p => p === 'Custom_UShopService');
                    let serviceMO = userSelector.services.find(p => p === 'Custom_Inspection');
                    let check = true;
                    if ((serviceBI == null) && (serviceMO == null)){
                        check = false;
                    }
                    if(this.autoServiceIndex  != -1){
                        if (this.autoServiceIndex == 0 && serviceBI == null){
                            check = false;
                        }
                        if (this.autoServiceIndex == 1 && serviceMO == null){
                            check = false;
                        }
                    }
                    if(!check){
                        let login = {};
                        login.email = this.state.user;
                        login.password = this.state.password;
                        simpleStore.save('LoginScreen',JSON.stringify(login));
                        this.setState({visible:false});
                        Actions.reset('accountList');
                        return;
                    }

                    if(this.autoServiceIndex == enumSelector.serviceIndex.CASHCHECK) {                        
                        result = await getStoreList_Cashcheck();
                        if(result.errCode !== enumSelector.errorType.SUCCESS){
                            this.errorMsg(result.errMsg);
                            return false;
                        }
                        storeSelector.storeList = result.data;
                    } else {
                        result = await getStoreList();
                        if(result.errCode !== enumSelector.errorType.SUCCESS){
                            this.errorMsg(result.errMsg);
                            return false;
                        }
                        storeSelector.storeList = result.data;
                    }

                    AccountUtil.setOriginalId(this.autoAccountId);
                    let login = {};
                    login.email = this.state.user;
                    login.password = this.state.password;
                    login.accountId = this.autoAccountId;
                    login.serviceIndex = this.autoServiceIndex;
                    simpleStore.save('LoginScreen',JSON.stringify(login));
                    userSelector.serviceIndex = this.autoServiceIndex;
                    this.setState({visible:false});

                    Actions.reset(GlobalParam.services[this.autoServiceIndex]);
                }
            }

            result = await isMysteryMode();
            if(result.errCode == enumSelector.errorType.SUCCESS){
                userSelector.isMysteryMode = result.data.isMysteryModeOn;
                userSelector.isMysteryModeOn = false;
            }

            result = await getGeneralSetting();
            if(result.errCode == enumSelector.errorType.SUCCESS){
                if(result.data.settingContent.general_setting_inspect_status_name.is_customize_0 == true) {
                    paramSelector.summary0Text = result.data.settingContent.general_setting_inspect_status_name.status_0;
                } else {
                    paramSelector.resetSummaries(0);
                }
                if(result.data.settingContent.general_setting_inspect_status_name.is_customize_1 == true) {
                    paramSelector.summary1Text = result.data.settingContent.general_setting_inspect_status_name.status_1;
                } else {
                    paramSelector.resetSummaries(1);
                }
                if(result.data.settingContent.general_setting_inspect_status_name.is_customize_2 == true) {
                    paramSelector.summary2Text = result.data.settingContent.general_setting_inspect_status_name.status_2;
                } else {
                    paramSelector.resetSummaries(2);
                }
            }

            // 取得浮水印設定
            result = await getAdvancedSetting({contentKey: "water_print"});
            console.log("getAdvancedSetting result : ", JSON.stringify(result));
            if(result.errCode == enumSelector.errorType.SUCCESS) {
                if(result.data.isFeatureActivate == true && result.data.content.isSwitchOn == true) {
                    userSelector.isWaterPrintOn = true;
                    paramSelector.setWaterPrintParam(result.data.content);
                } else {
                    userSelector.isWaterPrintOn = false;
                }
            }
            console.log("userSelector.isWaterPrintOn : ", userSelector.isWaterPrintOn);
            console.log("paramSelector waterPrintParam : ", paramSelector.waterPrintParam);

            this.setState({userSelector,storeSelector,paramSelector});
            if (!jumpFlag){
                let login = {};
                login.email = this.state.user;
                login.password = this.state.password;
                simpleStore.save('LoginScreen',JSON.stringify(login));
                this.setState({visible:false});
                Actions.reset('accountList');
            }

            //await JMessage.register();
            await FcmUtil.register();
            return true;
        }catch(error){
            this.setState({visible:false});
            return false;
        }
    }

    async errorMsg(errMsg){
        this.setState({visible:false});
        if ((errMsg === '405-login fail. Please check ID and password.') ||
                (errMsg === '1005-No privilege for the required operation:')){
            this.setState({errMsg:I18n.t('Check error')});
        }
        else {
            this.setState({errMsg:I18n.t('Login error')});
        }
    }

    onEmail(){
        this.setState({isFocus:false,errMsg:''});
        Actions.push('forgetPwd');
    }

    render() {
        const {autoFocus,securePassword,password,errMsg,user,status,visible,isFocus,pressNext} = this.state;
        const secure = securePassword ? visibilityOffImage : visibilityOnImage;

        let userInput = null, pwdInput = null, navigationBar = null, forgetPwd = null;
        if(status === 0){
            userInput = (<View style={[styles.inputPanel,isFocus ? styles.inputFocus : BorderShadow.div]}>
                    <TextInput
                        style={styles.userInput}
                        placeholder={I18n.t('Account')}
                        autoCorrect={false}
                        autoCapitalize={'none'}
                        returnKeyType={'done'}
                        placeholderTextColor="#9D9D9D"
                        underlineColorAndroid="transparent"
                        value={user}
                        onChangeText={this.userChanged.bind(this)}
                        onFocus={() => this.setState({errMsg:'',isFocus:true})}
                    />
                </View>)
        }else{
            navigationBar = (<TouchableOpacity activeOpacity={0.5} onPress={()=>this.setState({status:0,errMsg:''})} style={styles.navbar}>
                    <Image style={{width:9,height:16}} source={backArrowImage}/>
            </TouchableOpacity>);

            forgetPwd = (<TouchableOpacity activeOpacity={0.5} onPress={()=>this.onEmail()}>
                <Text style={styles.pwdforget}>{I18n.t('Forgot password')}?</Text>
            </TouchableOpacity>)
        }

        pwdInput = (status === 1) && <View style={[styles.inputPanel, isFocus ? styles.inputFocus : BorderShadow.div]}>
            <TextInput
                style={[styles.passwordInput,{height: (status === 1) ? 46 : 0}]}
                placeholder={I18n.t('Password')}
                autoCorrect={false}
                autoFocus={autoFocus}
                autoCapitalize={'none'}
                returnKeyType={'done'}
                placeholderTextColor="#9D9D9D"
                underlineColorAndroid="transparent"
                secureTextEntry={securePassword}
                value={password}
                onChangeText={this.passwordChanged.bind(this)}
                onFocus={() => this.setState({errMsg:'',isFocus:true})}
            />
            <TouchableOpacity activeOpacity={0.5} onPress={()=>this.setState({securePassword:!securePassword})}>
                <Image source={secure} style={styles.secureIcon}/>
            </TouchableOpacity>
        </View>;

        return (
            <View style={styles.container}>
                {navigationBar}
                <Image source={loginLogo} style={styles.logo}/>
                {userInput}
                {pwdInput}
                <View style={styles.errMsgView}>
                    <Text style={styles.errMsg}>{errMsg}</Text>
                </View>
                <TouchableOpacity activeOpacity={1} onPressIn={()=>this.setState({pressNext: true})} onPressOut={()=>this.next()}>
                    <View style={[styles.submitView,{backgroundColor:pressNext ? '#2C5A7D' : '#0365AE'}]}>
                        <Text style={styles.submitText}>{I18n.t('Next')}</Text>
                    </View>
                </TouchableOpacity>
                {forgetPwd}
                <Spinner visible={visible} textContent={I18n.t('Login in')} textStyle={{color:'#ffffff',fontSize:14,marginTop:-50}}/>
                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
                <RNUpdate ref={r=>global.$RNUpdate = r}  onCancel={this.onCancelUpdate.bind(this)}/>
            </View>
        )
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
    navbar:{
        flexDirection:'row',
        alignItems: 'center',
        paddingLeft:16,
        position: 'absolute',
        top: 10,
        zIndex:99,
        width: '100%',
    },
    navTitle:{
        fontSize:17,
        color:'#666666',
        marginLeft:6
    },
    pwdforget:{
        color:'#00346E',
        fontSize:12,
        marginTop:14
    },
    logo:{
        marginTop:-20,
        width:200,
        height:32
    },
    inputFocus:{
        borderWidth:1,
        borderColor:'#0365AE'
    },
    inputPanel:{
        marginTop:33.41,
        width: WIDTH-48,
        height:46,
        borderRadius:8,
        flexDirection:'row',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    userInput: {
        backgroundColor: 'transparent',
        width: '95%',
        height: 46,
        paddingLeft: 16,
        color:'#1E272E'
    },
    passwordInput: {
        backgroundColor: 'transparent',
        width: '88%',
        height: 46,
        paddingLeft: 16,
        color:'#1E272E'
    },
    errMsgView:{
        width: WIDTH-48,
        textAlign:'left',
        lineHeight:15,
        paddingLeft: 16,
        paddingTop:2
    },
    errMsg:{
        color:'#F11E66',
        fontSize:12,
    },
    submitView:{
        width: WIDTH-48,
        marginTop:18,
        height:46,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius:10,
    },
    submitText:{
        fontSize:18,
        color:'#ffffff',
    },
    secureIcon:{
        width:24,
        height:24
    }
});
