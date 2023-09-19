import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import SplashScreen from 'react-native-splash-screen'
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {AppContainer,
        PageContainer,
        Typography,
        Container,
        Icon,
        DataInput,
        NormalButton,
        Tab,
        IconButton} from '../../framework'
import {StringUtil, DimUtil,LangUtil,StorageUtil,HttpUtil,StoreUtil,FilterUtil,FcmUtil} from '../../framework'
import MainAPI from "../api/main"
import CcmAPI from "../api/ccm"
import {ERROR_CODE,ENVIRONMENT,PAGES,STORAGES,OPTIONS} from  "../define"
import ServiceList from '../api/serviceList'
import moment from 'moment'
class PageLogin extends Component {
  constructor(props) {
    super(props);
    this.state={
      step:1,
      account:"",
      password:"",
      forgetEmail:"",
      errorCloud:"",
      errorAccount:"",
      errorPassword:"",
      errorForgetEmail:"",
      privateUrl:"",
      isPrivate:false,
      notify:null,
    }
  }

  componentWillUnmount() {

  }
  async onInitNotify(notify){
    console.log("Set Init notify")
    console.log(notify)
    if(!this.state.notify){
      await this.setState({notify})
    }
  }
  async componentDidMount() {
      //
      const {route} = this.props;

      SplashScreen.hide();
      console.log("Store Util Init")
      if(route.params && route.params.force){
        let dialog = {title:LangUtil.getStringByKey("service_need_add_title")
        ,msg1:"",msg2: LangUtil.getStringByKey("service_force_logout")}
        this.setState({dialog})
      }
      if(route.params && route.params.networkfail){
        let dialog = {title:LangUtil.getStringByKey("service_need_add_title")
        ,msg1:"",msg2: LangUtil.getStringByKey("error_network")}
        this.setState({dialog})
      }
      if(route.params && route.params.notify){
            await this.setState({notify:route.params.notify})
      }
      await StoreUtil.init();
      await this.init();


  }
  async init(){
    //  console.log("Init")
      let info = await StorageUtil.getObj( STORAGES.LOGIN_INFO)
      if(info){
        console.log(info.account)
        await this.setState({account:info.account,isPrivate:info.isPrivate,privateUrl:info.privateUrl})
        if(info.isPrivate && info.privateUrl.length>0){
          this.props.setLoading(true);
          let mainUrl  = "https://"+ info.privateUrl+ "/api/";
          let ccmUrl   = "https://"+ info.privateUrl+ "/api/iqm_ccm/";
          MainAPI.init(mainUrl)
          CcmAPI.int(ccmUrl)
        }
        else{
          MainAPI.init(ENVIRONMENT.mainURL)
          CcmAPI.init(ENVIRONMENT.ccmURL)
        }
        if(info.token){
        //  console.log(info.token)
          await this.login(info)
        }
      }

      //MainAPI.init(ENVIRONMENT.mainURL)
      //this.setState({privateUrl:ENVIRONMENT.mainURL,ccmUrl:ENVIRONMENT.ccmUrl})

  }
  async login(info){
    const {account,password,privateUrl,isPrivate,notify} = this.state;
    const { navigation} = this.props;
    let oldLoginInfo = await StorageUtil.getObj(STORAGES.LOGIN_INFO)
    let accountId = "";
    let userId = "";
    let token = undefined;
    let userInfo = undefined;
    this.props.setLoading(true)
    this.setState({errorPassword:""})
    let fcm_token;
    await FcmUtil.init(this.onInitNotify.bind(this),navigation,PAGES.NOTIFICATION,  STORAGES.LOGIN_INFO,PAGES.LOGIN);
    fcm_token=await FcmUtil.getFCMToken();
    console.log("FCMTOKEN="+ fcm_token)
    let result ;
    if(info){
      token = info.token;
      userId = info.userId;
      result = await MainAPI.isLogin(token)
      //console.log(result)
      if(result.status != ERROR_CODE.SUCCESS || !result.isLogin){
        this.props.setLoading(false);
        return;
      }
    }
    else{

      result = await MainAPI.loginRequest(account,password,fcm_token)
    //  console.log(result)
      if(result.status ==9999){
        this.props.setLoading(false);
        this.setState({errorPassword:LangUtil.getStringByKey("error_network")})
        return;
      }
      else if(result.status != ERROR_CODE.SUCCESS){
        this.props.setLoading(false);
        this.setState({errorPassword:LangUtil.getStringByKey("error_auth_fail")})
        return;
      }
      userId= result.user_id;
      token = result.token;
    }

    MainAPI.setToken(token,userId)
    //console.log("Get Account List")
    result = await MainAPI.getAccountList()
    //console.log(JSON.stringify(result))
    if(result.status ==9999){
      this.props.setLoading(false);
      this.setState({errorPassword:LangUtil.getStringByKey("error_network")})
      return;
    }
    else if(result.status != ERROR_CODE.SUCCESS){
      this.props.setLoading(false);
      this.setState({errorPassword:LangUtil.getStringByKey("error_auth_fail")})
      return;
    }
    let serviceTypes = ServiceList.getServiceTypes();
    let accountList =[];
    for(var k in result.accs){
      let ac = result.accs[k];
    //  console.log(ac)
      let f = ac&& ac.products ?ac.products.find(p=>serviceTypes.indexOf(p.product_code)>=0 && p.status>=0 && p.status<=60):null
    //  console.log("Account*************"+ac.name)
      //console.log(ac.service_briefs)

      if(f){
         ac.hasColdchain = true;
      }
      else{
        ac.hasColdchain = false;
      }
      //console.log("Has coldchain="+ac.hasColdchain)
      accountList.push(ac)
      //console.log(JSON.stringify(ac.products))
      //console.log(ac.service_briefs);
    }
    //console.log(accountList);
    if(accountList.length==0){
      this.props.setLoading(false);
      this.setState({errorPassword:LangUtil.getStringByKey("error_no_permission")})
      return;
    }

    //console.log("Get User Info")
    result = await MainAPI.getUserInfo()
    //console.log(result)
    if(result.status != ERROR_CODE.SUCCESS){
      this.props.setLoading(false);
      this.setState({errorPassword:LangUtil.getStringByKey("error_auth_fail")})
      return;
    }
    userInfo = result.user;
    accountId = userInfo.acc_id;
    console.log("Login acocunt="+accountId)
    if(info && info.accountId && info.accountId!=""&&info.account == account ){
        accountId = info.accountId;
       console.log("Record acocunt="+accountId)
    }
    else   if(oldLoginInfo && oldLoginInfo.account &&  oldLoginInfo.account==account){
        accountId = oldLoginInfo.accountId
    }
    let findAccount = accountList.find(a=>a.id == accountId)
    if(!findAccount ){
      accountId = accountList[0].id;
      console.log("Reset to first id="+accountId)
    }
    if(notify){
      console.log("Login with notify")
      console.log("Login with id " + notify.data.acc_id)
      let find = accountList.find(a=>a.id == notify.data.acc_id)
      if(find ){
        accountId = notify.data.acc_id
      }
    }



    console.log("Find Account")
    //console.log(findAccount)
    if(  accountId!=userInfo.acc_id){
      console.log("Change Account ID = "+ accountId)
      result = await MainAPI.changeAccountId(accountId)
      //console.log(result)
      if(result.status != ERROR_CODE.SUCCESS){
        this.props.setLoading(false);
        this.setState({errorPassword:LangUtil.getStringByKey("error_no_permission")})
        return;
      }
      result = await MainAPI.getUserInfo()
      //console.log(result)
      if(result.status != ERROR_CODE.SUCCESS){
        this.props.setLoading(false);
        console.log("Get User info fail" + result)
        this.setState({errorPassword:LangUtil.getStringByKey("error_auth_fail")})
        return;
      }
      userInfo = result.user;
      accountId = userInfo.acc_id;
    }
    let first = oldLoginInfo &&  oldLoginInfo.account==account && oldLoginInfo.token ?false:true;
    //first = true;

    if(info && info.lastNotificaton ){
       starttime = info.lastNotificaton;
    }
    else{
      let d = new Date();
      d.setMonth(d.getMonth()-1)
      starttime = moment(d).format("YYYY-MM-DD 00:00:00")
    }
    let dd = new Date();
    dd.setDate(dd.getDate()-1)
    starttime = moment(dd).format("YYYY-MM-DD 00:00:00")

    let evResult = await MainAPI.getEventList({starttime})
    //console.log(evResult)
    if(evResult.status == ERROR_CODE.SUCCESS ){
      let list=[];
      evResult.events.forEach((item, i) => {
         //console.log("Event ")
        // console.log(item.target_info.ways)
         if(!item.target_info.ways || item.target_info.ways.find(p=>p=="app")){
           //console.log("Add Event="+i)
           list.push({
             acc_id:item.src.acc_id,
             event_id:item.src.event_id,
             product_name: item.sender,
             service_name:item.notify_info.service_name,
             notify: JSON.stringify(item.notify_info.notify),
             sources: JSON.stringify(item.src.sources),
             stores:item.src.store_id&&item.src.store_id.length>0?item.src.store_id:( item.src.store_ids&&item.src.store_ids[0])? item.src.store_ids[0]:"",
             date:item.status.ts,
             ts:item.notify_info&&item.notify_info.notify?item.notify_info.notify.ts:0,
           })
         }
         //console.log(JSON.stringify(item))

     });
     console.log("Get New Notification Length="+list.length)
     if(list.length>0){
        StoreUtil.save(list)
      }
      let evs = StoreUtil.getSize(accountId)
      console.log("get Event Length="+ evs)
    }
    StoreUtil.refresh();
    let acInfo = accountList.find(p=>p.id == accountId);
    let loginInfo ={hasColdchain:acInfo.hasColdchain,
       userInfo,accountId:first?null:accountId,token,lastNotificaton:moment(new Date()).format("YYYY-MM-DD HH:mm:00"),
       userId:userInfo.user_id,account,privateUrl,isPrivate,accountList,unread:StoreUtil.getSize(accountId)
    }
    let stores =[];

    if(acInfo && acInfo.hasColdchain){
      console.log("Do Redirect")
      CcmAPI.setToken(null,null,null)
      console.log("USER ID="+userInfo.user_id)
      console.log(token)
      result = await CcmAPI.redirect(token,userInfo.user_id,accountId)
      if(result.status != ERROR_CODE.SUCCESS){
        this.props.setLoading(false);
        console.log("Redirect fail")
        console.log(result)
        this.setState({errorPassword:LangUtil.getStringByKey("error_auth_fail")})
        return;
      }
      CcmAPI.setToken(result.token,userId,accountId,navigation)
      result = await CcmAPI.getBranchList()
      console.log(result)
      if(result.status != ERROR_CODE.SUCCESS){
        this.props.setLoading(false);
        this.setState({errorPassword:LangUtil.getStringByKey("error_auth_fail")})
        return;
      }
      stores = result.branchs;
      if(!stores)stores = []

    }
    else{
      stores = [];
      result = await MainAPI.getStoreList();
      if(result.status != ERROR_CODE.SUCCESS){
        this.props.setLoading(false);
        this.setState({errorPassword:LangUtil.getStringByKey("error_auth_fail")})
        return;
      }
      console.log("Get Store List")
      console.log(result)
      if(result && result.stores){
        result.stores.forEach((item, i) => {
            item.branch_id = item.store_id;
            item.branch_name = item.store_name;
            item.contact = {};
            item.contact.zone_1 =item.province
            item.contact.zone_2 =item.city
            stores.push(item)
        });
      }
    }

    /*
    for(var k =0 ; k<10 ; k++){
      for(var m = 0 ; m < 20;m ++){
        let s = {"acc_id": "D35BNGPKtecC", "access_time": {"update": ""}, "branch_code": "", "branch_id": "BtU9LWFwt54Q", "branch_name": "Linkou-Wende", "contact": {"address": "桃園市龜山區文德路27號", "country": "Taiwan", "tel": "2792-7818", "time_zone": "+8", "zone_1": "Taoyuan", "zone_2": "Guishan", "zone_3": ""}, "descr": "", "groups": [], "status": 22}
        s.branch_id = "id-"+k+"-"+m;
        s.branch_name  = "store-"+k+"-"+m;
        s.contact.zone_1 = "台北-"+k;
        s.contact.zone_2 = "新店-"+k+"-"+ parseInt(Math.random()*7);
        stores.push(s)
      }
    }
    */

    this.props.setStoreList(stores)
    let options = FilterUtil.getStoreOptions(stores,null,null);
    //console.log(JSON.stringify(options))
    let d = new Date();
    let end  =moment(d).format("YYYY/MM/DD 23:59:59");
    let d1 = new Date();
    //d1.setDate(d1.getDate()-6);
    let startSameDate  =moment(d1).format("YYYY/MM/DD 00:00:00");
    d.setDate(d.getDate()-2);
    let start = moment(d).format("YYYY/MM/DD 00:00:00");
    let firstStore = stores.length>0?stores[0].branch_id: null;
    let firstName = stores.length>0?stores[0].branch_name: null;
    let filter={
        event:{
          options,
          sort:OPTIONS.EVENT[0],
          region1:null,
          region2:null,
          store: firstStore,
          storeName:firstName,
          startTime:start,
          endTime:end,
        },
        data:{
          options,
          sort:OPTIONS.DATA[0],
          region1:null,
          region2:null,
          store: firstStore,
          storeName:firstName,
          startTime:startSameDate,
          endTime:end,
          dataMode:1,
        },
        device:{
          options,
          sort:OPTIONS.DEVICE[0],
          region1:null,
          region2:null,
          store: firstStore,
          storeName:firstName,
        },
        notification:{
          options,
          sort:OPTIONS.NOTIFICATION[0],
          region1:null,
          region2:null,
          store: null,
          startTime:start,
          endTime:end,
        },
        cache:{
          event:null,
          data:null,
          device:null,
          notification:null
        }

    }
    this.props.setLoginInfo(loginInfo)
    this.props.setCcmFilter(filter)
    //console.log(filter)
    if(!first){
      StorageUtil.setObj( STORAGES.LOGIN_INFO,loginInfo)
      this.props.setLoading(false)
      let nf =info&&this.state.notify?this.state.notify:null;
      if(stores.length==0){
        navigation.replace(PAGES.MORE,{})
      }
      else if(acInfo.hasColdchain)
        navigation.replace(PAGES.EVENT_MANAGE,{notify:nf})
      else
        navigation.replace(PAGES.DEVICE_MANAGE,{})
    }
    else{
      this.props.setLoading(false)
      navigation.replace(PAGES.ACCOUNT_LIST,{})
    }
  }
  async next(){
    const {step,account,password, forgetEmail,isPrivate,privateUrl} = this.state;
    const {navigation} = this.props;
    //navigation.replace(PAGES.MORE)
    if(step == 1){
      this.doCheckAccountChange(account)
      this.setState({errorCloud:""});
      if(isPrivate){
        if(!privateUrl || privateUrl.length == 0){
          this.setState({errorCloud:LangUtil.getStringByKey("error_invalid_url_format")});
          return false;
        }
        if(!StringUtil.validateUrl(privateUrl)){
          this.setState({errorCloud:LangUtil.getStringByKey("error_invalid_url_format")});
          return false;
        }
        this.props.setLoading(true);
        let testurl = "https://"+ privateUrl + "/api/server/info";
        let result = await HttpUtil.testget(testurl,3);
        this.props.setLoading(false);
        console.log(result)
        if(result.status != ERROR_CODE.SUCCESS){
          this.setState({errorCloud:LangUtil.getStringByKey("error_connect_url")});
          console.log("ERror "+LangUtil.getStringByKey("error_connect_url"))
          return false;
        }
        let mainUrl  = "https://"+ privateUrl + "/api/";
        let ccmUrl   = "https://"+ privateUrl + "/api/iqm_ccm/";
        MainAPI.init(mainUrl)
        CcmAPI.int(ccmUrl)
      }
      else{
        MainAPI.init(ENVIRONMENT.mainURL)
        CcmAPI.init(ENVIRONMENT.ccmURL)
      }

      this.setState({step:2})
    }
    else if(step == 2){
      if(account.length==0){
        this.setState({errorAccount:LangUtil.getStringByKey("error_empty_email")})
        return;
      }
      if(account.length>0 && !StringUtil.validateEmail(account)){
        this.setState({errorAccount:LangUtil.getStringByKey("error_invalid_email")})
        return;
      }
      this.setState({step:3})
    }
    else if(step == 3){
      if(password.length==0){
        this.setState({errorPassword:LangUtil.getStringByKey("error_empty_password")})
        return;
      }
      await this.login();
    }
    else if(step ==4){
      if(forgetEmail.length==0){
        this.setState({errorForgetEmail:LangUtil.getStringByKey("error_empty_email")})
        return;
      }
      if(forgetEmail.length>0 && !StringUtil.validateEmail(forgetEmail)){
        this.setState({errorForgetEmail:LangUtil.getStringByKey("error_invalid_email")})
        return;
      }
      await this.doForgetPassword();
      //this.setState({step:5})
    }
    else if(step ==5){
      this.setState({step:1})
    }
  }
  async doForgetPassword(){
    const {forgetEmail} = this.state;
    this.props.setLoading(true)
    this.setState({errorPassword:""})
    let result = await MainAPI.forgetpwd(forgetEmail)
    console.log(result)
    this.props.setLoading(false)
    if(result.status != ERROR_CODE.SUCCESS){
      this.setState({errorForgetEmail:LangUtil.getStringByKey("error_send_fail")})
      return;
    }
    this.setState({step:5})

  }
  async previous(){
    const {step} = this.state;
    console.log("Step="+step)
    if(step == 5){
      this.setState({step:4,errorAccount:"",errorPassword:""})
    }
    else if(step == 4){
      this.setState({step:3,errorAccount:"",errorPassword:""})
    }
    else if(step == 3){
      this.setState({step:2,errorAccount:"",errorPassword:""})
    }
    else if(step == 2){
      this.setState({step:1,errorAccount:"",errorPassword:""})
    }
  }
  doCheckAccountChange(t){
    if(t ){
      let err = "";
      if(t.length>0 && !StringUtil.validateEmail(t)){
        err = LangUtil.getStringByKey("error_invalid_email")
      }
      this.setState({account:t,errorAccount:err})
    }
    else{
      this.setState({account:"",errorAccount:""})
    }

  }
  doCheckUrlChange(t){
    if(t ){
      let err = "";
      if(t.length>0 && !StringUtil.validateUrl(t)){
        err = LangUtil.getStringByKey("error_invalid_url_format")
      }
      this.setState({privateUrl:t,errorCloud:err})
    }
    else{
      this.setState({privateUrl:"",errorCloud:""})
    }

  }
  doCheckForgetEmail(t){
    if(t ){
      let err = "";
      if(t.length>0 && !StringUtil.validateEmail(t)){
        err = LangUtil.getStringByKey("error_invalid_email")
      }
      this.setState({forgetEmail:t,errorForgetEmail:err})
    }
    else{
      this.setState({forgetEmail:"",errorForgetEmail:""})
    }

  }
  doCheckPasswordChange(t){
      this.setState({password:t,errorPassword:""})
  }
  renderStep1(){
    const {step,isPrivate,account,errorCloud,privateUrl} = this.state;
    if(step ==1)
      return <Container fullwidth alignItems={"flex-start"} style={{marginTop:15}}>
                <Typography
                    style={{marginBottom:10}}
                    font={"text02"}
                    text={"Welcome"}
                    color='black'/>
                <Typography
                    style={{marginBottom:30}}
                    font={"head01"}
                    text={"WISE-iService/ ColdChain"}
                    color='black'/>
                <Container tabContainer flexDirection="row" fullwidth style={{height:32,marginBottom:20,
                  backgroundColor:'#EEE',borderRadius:7}}>
                      {!isPrivate?<NormalButton
                        style={{flex:1,height:28,borderRadius:7,marginRight:2,backgroundColor:'#fff',
                        shadowColor:"#BBB",
                        shadowOffset: { width:2 , height:2},
                        shadowOpacity: 0.2,
                        shadowRadius: 2,
                        elevation:5}}
                        onPress={async()=>{}}
                              font="text00"
                              color="text"
                        text={LangUtil.getStringByKey("login_public_cloud")}/>:
                        <IconButton
                        　　 textStyle="text"
                            font="text"
                            style={{flex:1,height:44,marginLeft:2}}
                            onPress={async()=>{await this.setState({isPrivate:false})}}
                            text={LangUtil.getStringByKey("login_public_cloud")}/>
                      }
                      {false?isPrivate?<NormalButton
                        style={{flex:1,height:28,marginRight:4}}
                        onPress={async()=>{}}
                        text={LangUtil.getStringByKey("login_private_cloud")}/>:
                        <IconButton
                            style={{flex:1,height:44,marginLeft:4}}
                              onPress={async()=>{await this.setState({isPrivate:true})}}
                        text={LangUtil.getStringByKey("login_private_cloud")}/>:<View style={{flex:1,height:44,marginLeft:4}}/>
                      }
                </Container>
                <Typography
                        style={{marginBottom:5,marginTop:10}}
                        font={"text00"}
                        numberOfLines={2}
                        text={LangUtil.getStringByKey(isPrivate?"login_info_private_cloud":"login_info_public_cloud")}
                        color='lightText'/>
                <NormalButton
                  onPress={async()=>{await this.next()}}
                  text={LangUtil.getStringByKey("common_next_step")}/>
              </Container>
  }
  renderStep2(){
    const {step,account,errorAccount} = this.state;
    if(step ==2)
      return <Container fullwidth alignItems={"flex-start"} style={{paddingTop:15}}>
                <Typography
                    style={{marginBottom:10}}
                    font={"text02"}
                    text={"Welcome"}
                    color='black'/>
                <Typography
                    style={{marginBottom:30}}
                    font={"head01"}
                    text={"WISE-iService/ ColdChain"}
                    color='black'/>
                <DataInput
                  alert={errorAccount!=""}
                  mode={"email"}
                  placeholder={LangUtil.getStringByKey("error_empty_email")}
                  onChangeText={this.doCheckAccountChange.bind(this)}
                  style={{marginBottom:7}}
                  value={account}/>
                <Typography
                          style={{marginBottom:7,marginLeft:5}}
                          font={"subtitle04"}
                          text={errorAccount}
                          color='error'/>
                <NormalButton
                    onPress={async()=>{await this.next()}}
                    text={LangUtil.getStringByKey("common_next_step")}/>
              </Container>
  }
  renderStep3(){
    const {step,password,errorPassword} = this.state;
    if(step ==3)
    return <Container fullwidth alignItems={"flex-start"} style={{paddingTop:105}}>
              <Container fullwidth
                  alignItems={"flex-start"}
                  justifyContent={'center'}
                  style={{position:'absolute',top:0,width:'100%'}}>
                  <IconButton
                    type={"back"}
                    mode="static"
                    textStyle="text01"
                    onPress={async()=>{await this.previous()}}
                    text={LangUtil.getStringByKey("login_account")}/>
              </Container>
              <DataInput
                  alert={errorPassword!=""}
                  mode={"password"}
                  placeholder={LangUtil.getStringByKey("login_enter_password")}
                  onChangeText={this.doCheckPasswordChange.bind(this)}
                  style={{marginBottom:7}}
                  value={password}/>
                  <Typography
                            style={{marginBottom:7,marginLeft:5}}
                            font={"subtitle04"}
                            text={errorPassword}
                            color='error'/>
                <NormalButton
                      onPress={async()=>{this.next()}}
                  text={LangUtil.getStringByKey("login_btn")}/>
             <Container fullwidth >
               <IconButton
                 type={"none"}
                 onPress={async()=>{await this.setState({step:4,forgetEmail:"",errorForgetEmail:""})}}
                 text={LangUtil.getStringByKey("login_forget_password")}/>
            </Container>
  </Container>
  }
  renderStep4(){
    const {width,height} = DimUtil.getDimensions("portrait")
    const {step,password,errorPassword,errorForgetEmail,forgetEmail} = this.state;
    return <Container fullwidth alignItems={"flex-start"}
    　　　　　　 style={{height,width,position:'absolute',top:0,backgroundColor:"#000000BB"}}>
            <Container 　justifyContent="flex-start" alignItems="flex-start"
               fullwidth style={{height:height-47,position:'absolute',top:47,
                 borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",padding:16}}>
              <Container fullwidth
                  alignItems={"flex-start"}
                  justifyContent={'center'}
                  style={{width:'100%'}}>
                  <IconButton
                    textStyle="text01"
                    onPress={async()=>{await this.previous()}}
                    text={LangUtil.getStringByKey("common_cancel")}/>
              </Container>
              <Container fullwidth
                    alignItems={"center"}
                    justifyContent={'center'}
                        style={{width:'100%',marginTop:20}}>
                <Typography
                    style={{marginBottom:10}}
                    font={"title05"}
                    text={LangUtil.getStringByKey("forget_password_inputmail")}
                    color='text'/>
                <Typography
                    style={{marginBottom:30,width:'80%',textAlign:'center'}}
                    font={"text01"}
                    numberOfLines={2}
                    text={LangUtil.getStringByKey("login_msg_inputmail")}
                    color='text'/>
              </Container>
              <DataInput
                        alert={errorForgetEmail!=""}
                        mode={"email"}
                        placeholder={LangUtil.getStringByKey("forget_password_please_inputmail")}
                        onChangeText={this.doCheckForgetEmail.bind(this)}
                        style={{marginBottom:7}}
                        value={forgetEmail}/>
                <Typography
                    style={{marginBottom:7,marginLeft:5}}
                    font={"subtitle04"}
                    text={errorForgetEmail}
                  color='error'/>
                <NormalButton
                  onPress={async()=>{await this.next()}}
                  text={LangUtil.getStringByKey("login_send_reset_mail")}/>
        </Container>
      </Container>
  }
  renderStep5(){
    const {width,height} = DimUtil.getDimensions("portrait")
    const {step,password,errorPassword,errorForgetEmail,forgetEmail} = this.state;
    return <Container fullwidth alignItems={"flex-start"}
    　　　　　　 style={{height,width,position:'absolute',top:0,backgroundColor:"#000000BB"}}>
            <Container 　justifyContent="flex-start" alignItems="flex-start"
               fullwidth style={{height:height-47,position:'absolute',top:47,
                 borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",padding:16}}>
              <Container fullwidth
                    alignItems={"center"}
                    justifyContent={'center'}
                    style={{width:'100%',marginTop:0}}>
                <Icon type="mail"  mode="static" style={{marginTop:30,width:51.5,height:38.5,marginBottom:16}}/>
                <Typography
                    style={{marginBottom:15}}
                    font={"title05"}
                    text={LangUtil.getStringByKey("login_send_success")}
                    color='text'/>
                <Typography
                    style={{marginBottom:2,textAlign:"center"}}
                    font={"text01"}
                    numberOfLines={2}
                    text={LangUtil.getStringByKey("login_msg_send_success")}
                    color='text'/>
                    <Typography
                        style={{marginBottom:2}}
                        font={"text01"}
                        text={forgetEmail}
                        color='text'/>
                  <Typography
                            style={{marginBottom:15}}
                            font={"text01"}
                            text={LangUtil.getStringByKey("login_msg_send_success_end")}
                            color='text'/>
              </Container>
                <Typography
                    style={{marginBottom:7,marginLeft:5}}
                    font={"subtitle04"}
                    text={errorForgetEmail}
                  color='error'/>
                  <NormalButton
                    onPress={async()=>{await this.next()}}
                    text={LangUtil.getStringByKey("login_btn_relogin")}/>
        </Container>
      </Container>


    if(step ==5)
    return <Container fullwidth alignItems={"flex-start"} style={{paddingTop:50}}>
              <Container fullwidth
                  alignItems={"flex-start"}
                  justifyContent={'center'}
                  style={{backgroundColor:'white',position:'absolute',top:0,width:'100%'}}>
                  <IconButton
                    type={"back"}
                    onPress={async()=>{await this.previous()}}
                    text={LangUtil.getStringByKey("common_previous_step")}/>
              </Container>
              <Container fullwidth>
                <Icon type="successful" style={{margin:10,width:40,height:40}}/>
                <Typography
                    style={{marginBottom:10}}
                    font={"subtitle02"}
                    text={LangUtil.getStringByKey("login_send_success")}
                    color='black'/>
                <Typography
                    style={{marginBottom:20,width:'80%',textAlign:'center'}}
                    font={"content03"}
                    numberOfLines={2}
                    text={LangUtil.getStringByKey("login_msg_send_success")}
                    color='black'/>
                  <NormalButton
                    onPress={async()=>{await this.next()}}
                    text={LangUtil.getStringByKey("login_btn_relogin")}/>
             </Container>
  </Container>
  }
  render(){
    const {dialog,step} =this.state;
    if(step==4){
      return this.renderStep4()
    }
    if(step==5){
      return this.renderStep5()
    }
    return ( <PageContainer
              backgrouncImage
              dialog={dialog}
              onCloseDialog={()=>this.setState({dialog:null})}
              style={{paddingTop:DimUtil.getTopPadding()+12}}>
                {this.renderStep1()}
                {this.renderStep2()}
                {this.renderStep3()}
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loading:state.loading};
};
export default connect(mapStateToProps, actions)(PageLogin);
