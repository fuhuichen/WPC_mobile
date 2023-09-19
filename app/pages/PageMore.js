import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {AppContainer,
        PageContainer,
        Header,Container,
        Selection,
        Typography,
        Tab,
        Brand,
        TouchCard,
        CircleText,
        RegionSelection,
        NormalButton} from '../../framework'
import {LangUtil,StorageUtil,COLORS,StringUtil,StoreUtil,DimUtil} from '../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES,VERSION} from  "../define"
import MainAPI from "../api/main"
import BottomNavigation from "../components/BottomNavigation"
class PageMore extends Component {
  constructor(props) {
    super(props);
      let dialog
      if(this.props.storeList.length==0){
        dialog = {title:LangUtil.getStringByKey("service_need_add_title")
        ,msg1:"",msg2: LangUtil.getStringByKey("service_need_add_store")}
        this.setState({dialog})
      }
      let unread =  StoreUtil.getSize(props.loginInfo.accountId)
      this.state={
        unread,serverVer:"",dialog
      }
  }

  componentWillUnmount() {

  }
  async componentDidMount() {
    let dialog
    this.open = false;
    let res = await MainAPI.getServerInfo();
    console.log(res)
    if(res.version){
      this.setState({serverVer:res.version})
    }
  }
  async showBrandSelect(){
    const {navigation} = this.props;
    if(this.open) return;
    this.open = true;
    setTimeout(function(){
      this.open = false;
    }.bind(this),1000)
    navigation.push(PAGES.BRAND_SELECT)
  }
  roleidToName(id){
      console.log(id)
      if(id=='3' || id == 3){
        　return LangUtil.getStringByKey("role_user")
      }
      else if(id=='2' || id == 2){
          return LangUtil.getStringByKey("role_manager")
      }
      else{
          return LangUtil.getStringByKey("role_admin")
      }
    }
  async logout(){
    const {loginInfo,navigation} = this.props;

    if(!this.open){
         this.open = true;
         let info  = JSON.parse(JSON.stringify(loginInfo))
         let res = await MainAPI.logoutRequest();
         console.log(res)
         info.token = null;
         info.lastNotificaton = null;
         await StoreUtil.init();
         await StoreUtil.clear()
         StorageUtil.setObj( STORAGES.LOGIN_INFO,{account:info.account})
         this.props.setLoginInfo(info)
         navigation.replace(PAGES.LOGIN,{})
         setTimeout(function(){
             this.open = false;
         }.bind(this),5000)
    }

  }
  componentWillReceiveProps(p){
    if(p.storeList.length==0){
      dialog = {title:LangUtil.getStringByKey("service_need_add_title")
      ,msg1:"",msg2: LangUtil.getStringByKey("service_need_add_store")}
      this.setState({dialog})
    }
    //  console.log("componentWillReceiveProps")
    //  console.log(p.navigation.getState())
  }
  render(){
    const {loginInfo,navigation} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait");
    const {dialog} = this.state;
    let accountName = null ;
    if(loginInfo && loginInfo.accountList && loginInfo.accountId){
      console.log("Login Info id = "+loginInfo.accountId)
      let account  =loginInfo.accountList.find(p=>p.id == loginInfo.accountId);
      if(account)accountName =account.name
    }
    let state = navigation.getState();
    let routeName = state.routes[state.index].name
    console.log(state.routes)
　  //console.log(routeName)
    //console.log(state)
    //console.log(loginInfo.userInfo)
    return ( <PageContainer
                bottom={CCMFUNCTIONS}
                routeName={PAGES.MORE}
                dialog={dialog}
                onCloseDialog={()=>this.setState({dialog:null})}
                hasStore={this.props.storeList&&this.props.storeList.length>0?true:false}
                navigation={this.props.navigation}
                hasColdchain={loginInfo.hasColdchain&&this.props.storeList.length>0}
                style={{paddingLeft:0,paddingRight:0}}
                isHeader={true}>
                <Header
                  leftIcon={this.state.unread?"header-event-alert":"header-event"}
                  onLeftPressed={()=>{
                    if(!this.open){
                         this.open = true;
                         navigation.push(PAGES.NOTIFICATION,{})
                         setTimeout(function(){
                             this.open = false;
                         }.bind(this),2000)
                    }
                  }}
                  text={LangUtil.getStringByKey("function_more")}
                />
                <Container
                    fullwidth
                    scrollable
                    justifyContent={"flex-start"}
                    alignItems={"center"}
                    style={{flex:1,paddingLeft:16,paddingRight:16}}>
                <Container
                    fullwidth
                    justifyContent={"flex-start"}
                    alignItems={"center"}
                    style={{height:96,width:'100%'}}>
                    <Container
                            style={{height:40,width:40,marginTop:20,margainBottom:30}}>
                        <CircleText text={StringUtil.getShortName(loginInfo.userInfo.fullname?loginInfo.userInfo.fullname:loginInfo.userInfo.name)} height={44}/>
                    </Container>
                    <Typography
                        font={"subtitle02"}
                        style={{marginTop:10}}
                        text={loginInfo.userInfo.fullname}
                        color='primary'/>
                    <Typography
                            font={"content04"}
                            text={loginInfo.userInfo.email}
                            color='gray'/>
                </Container>
                    <RegionSelection
                      style={{marginBottom:2,borderRadius:0,marginTop:10,
                            borderTopLeftRadius:8,borderTopRightRadius:8}}
                          text={LangUtil.getStringByKey("common_brand")}
                          value={accountName}
                          type="string"
                          onPress={async()=>{await this.showBrandSelect()}}
                      hint={""}/>
                    <Typography
                        style={{marginBottom:2,marginTop:20,marginLeft:10}}
                        font={"text00"}
                        text={LangUtil.getStringByKey("common_service")}
                        color='#A5A5A5'/>
                    <Container tabContainer flexDirection="row" fullwidth style={{borderRadius:8,height:78,padding:8}}>
                           <Brand selected={true} text={LangUtil.getStringByKey("Custom_iQM_ColdChain")}
                              type="Custom_iQM_ColdChain-active"
                              mode='static'
                              noborder
                              style={{marginRight:4,backgroundColor:'transparent'}}
                              height={72}/>
                           <Brand selected={true} text={LangUtil.getStringByKey("Custom_iQM_ColdChain")}
                             disabled
                             style={{marginLeft:4}}
                             height={72}/>
                    </Container>
                    <Typography
                        style={{marginBottom:2,marginTop:20,marginLeft:10}}
                        font={"text00"}
                        text={LangUtil.getStringByKey("setting_persional_data")}
                        color='#A5A5A5'/>
                    <RegionSelection
                          style={{marginBottom:2,borderRadius:8}}
                              text={LangUtil.getStringByKey("setting_password_change")}
                              value={" "}
                              type="string"
                              onPress={()=>{
                                if(!this.open){
                                     this.open = true;
                                     navigation.push(PAGES.SETTING_PASSWORD)
                                     setTimeout(function(){
                                         this.open = false;
                                     }.bind(this),2000)
                                }

                              }}
                          hint={""}/>
                    <Typography
                              style={{marginBottom:2,marginTop:20,marginLeft:10}}
                              font={"text00"}
                              text={LangUtil.getStringByKey("setting_common")}
                              color='#A5A5A5'/>
                    <RegionSelection
                                style={{marginBottom:1,borderRadius:0,borderTopLeftRadius:8,borderTopRightRadius:8}}
                                    text={LangUtil.getStringByKey("setting_language")}
                                    value={" "}
                                    type="string"
                                    onPress={()=>{
                                      if(!this.open){
                                           this.open = true;
                                           navigation.push(PAGES.SETTING_LANG)
                                           setTimeout(function(){
                                               this.open = false;
                                           }.bind(this),2000)
                                      }

                                    }}
                                hint={""}/>
                   <RegionSelection
                                style={{marginBottom:1,borderRadius:0}}
                                text={LangUtil.getStringByKey("setting_address")}
                                value={" "}
                                type="string"
                                onPress={()=>{
                                  if(!this.open){
                                       this.open = true;
                                       navigation.push(PAGES.SETTING_ADDRESS)
                                       setTimeout(function(){
                                           this.open = false;
                                       }.bind(this),2000)
                                  }

                                }}
                                hint={""}/>
                    <Container
                          fullwidth
                            flexDirection="row"
                            justifyContent={"flex-start"}
                            alignItems={"center"}
                            style={{height:44,width:'100%',backgroundColor:'white',
                            borderBottomLeftRadius:8,borderBottomRightRadius:8}}>
                            <Typography
                                  style={{marginLeft:12}}
                                  color={"text"}
                                  text={LangUtil.getStringByKey("common_version")}
                                  font={"text01"}/>
                            <View style={{flex:1}}/>
                            <Typography
                                style={{marginRight:12}}
                                color={"grayText"}
                                text={VERSION + ENVIRONMENT.prefix + " |  v" +this.state.serverVer}
                               font={"text01"}/>
                    </Container>
                    <TouchCard
                          fullwidth
                            flexDirection="row"
                            justifyContent={"center"}
                            alignItems={"center"}
                            onPress={async()=>this.logout()}
                            style={{height:44,width:'100%',backgroundColor:'white',
                            borderRadius:8,marginTop:20,marginBottom:30}}>
                            <Typography
                                  color={"error"}
                                  text={LangUtil.getStringByKey("setting_logout")}
                                  font={"text01"}/>
                    </TouchCard>
                </Container>
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageMore);
