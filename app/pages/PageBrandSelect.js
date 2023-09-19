import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {AppContainer,PageContainer,OptionContainer,IconButton,
  Header,Container,Typography,NormalButton} from '../../framework'
import {LangUtil,FilterUtil,StorageUtil,DimUtil} from '../../framework'
import MainAPI from "../api/main"
import CcmAPI from "../api/ccm"
import moment from 'moment'
import {ERROR_CODE,ENVIRONMENT,PAGES,OPTIONS, STORAGES} from  "../define"
class PageBrandSelect extends Component {
  constructor(props) {
    super(props);
    this.state ={
      options:[],selected:null,logined:false
    }
  }

  componentWillUnmount() {


  }
  async componentDidMount() {
    const {loginInfo} = this.props;
    //console.log(loginInfo)
    let options =[]
    let selected =null;
    if(loginInfo && loginInfo.accountList){
        selected = loginInfo.accountId;
        loginInfo.accountList.forEach((item, i) => {
            options.push({label:item.name,id:item.id})
        });

    }
    //console.log(options)
    let oldLoginInfo = await StorageUtil.getObj(STORAGES.LOGIN_INFO)
    let logined =oldLoginInfo&&oldLoginInfo.accountId?true:false;
    if(!selected)selected = options[0].id
    this.setState({options,selected,logined })
  }
  async onSave(){
  //  console.log("OnChangeAccount")
    const {navigation,loginInfo} = this.props;
    const {options,selected} = this.state;
    this.props.setLoading(true);
    let result ;
    result= await MainAPI.changeAccountId(selected)
    if(result.status == ERROR_CODE.SUCCESS){

      let newInfo = JSON.parse(JSON.stringify(loginInfo));
      newInfo.accountId = selected;
      //console.log(result)
      result = await MainAPI.getUserInfo()
      if(result.status == ERROR_CODE.SUCCESS){
        console.log("Change User Info")
        console.log(result.user)
        newInfo.userInfo = result.user;
        newInfo.userId = result.user.user_id;

      }
      let ac = loginInfo.accountList.find(p=>p.id == selected)
      newInfo.hasColdchain = ac.hasColdchain;
      let stores  = [];
      if(ac.hasColdchain){
        CcmAPI.setToken(null,null,null)
        result = await CcmAPI.redirect(newInfo.token,newInfo.userId,newInfo.accountId)
        console.log("Redirect")
        console.log(result)
        if(result.status != ERROR_CODE.SUCCESS){
          this.props.setLoading(false);
          this.setState({errorPassword:LangUtil.getStringByKey("error_auth_fail")})
          return;
        }
        CcmAPI.setToken(result.token,newInfo.userId,newInfo.accountId)
        result = await CcmAPI.getBranchList()
        //console.log(result)
        if(result.status != ERROR_CODE.SUCCESS){
          this.props.setLoading(false);
          this.setState({errorPassword:LangUtil.getStringByKey("error_auth_fail")})
          return;
        }
        console.log("Set Filters")
        stores = result.branchs;
        if(!stores)stores = [];
      }
      else{
        stores = [];
        result = await MainAPI.getStoreList();
        if(result.status != ERROR_CODE.SUCCESS){
          this.props.setLoading(false);
          this.setState({errorPassword:LangUtil.getStringByKey("error_auth_fail")})
          return;
        }
        result.stores.forEach((item, i) => {
            item.branch_id = item.store_id;
            item.branch_name = item.store_name;
            item.contact = {};
            item.contact.zone_1 =item.province
            item.contact.zone_2 =item.city
            stores.push(item)
        })
      }
      //console.log(result)
      /*
      result = await CcmAPI.redirect(newInfo.token,newInfo.userId,newInfo.accountId)
      //console.log(result)
      if(result.status != ERROR_CODE.SUCCESS){
        this.props.setLoading(false);
        this.setState({errorPassword:LangUtil.getStringByKey("error_auth_fail")})
        return;
      }
      CcmAPI.setToken(result.token,userId)
      */


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

      this.props.setStoreList(stores)
      this.props.setCcmFilter(filter)
      this.props.setLoginInfo(newInfo)
      StorageUtil.setObj( STORAGES.LOGIN_INFO,newInfo)
      this.props.setLoading(false);
      return true;
    }
    return false
  }
  onSelectBrand(id){

    this.setState({selected:id})
  }
  render(){
    const {navigation,loginInfo} = this.props;
    const {options,selected,logined} = this.state;
    let state = navigation.getState();
    let routeName = state.routes[state.index].name
  　 //console.log(routeName)
    //console.log(state)
    if(!logined){

      return (  <PageContainer
                    backgrouncImage
                    isHeader={false} style={{paddingTop:DimUtil.getTopPadding()}}>
                    <Container
                      fullwidth
                      alignItems="center"
                      style={{height:48,marginBottom:10}}
                      flexDirection="row">
                      <IconButton
                        textStyle={"text01"}
                        mode="static"
                        type="back"
                        iconStyle={{width:24,height:24}}
                        style={{position:'absolute',left:0}}
                        onPress={()=>{navigation.pop(1)}}
                        text={LangUtil.getStringByKey("welcome_page")}/>
                      <IconButton
                        textStyle={"text01"}
                        style={{position:'absolute',right:0}}
                        onPress={async()=>{if(selected){let res = await this.onSave();if(res){navigation.pop(1)}}}}
                        text={selected?LangUtil.getStringByKey("common_confirm"):null}/>
                    </Container>
                  <Container
                      fullwidth
                      scrollable
                      justifyContent={"flex-start"}
                      alignItems={"flex-start"}
                      style={{flex:1,backgroundColor:"#F0F0F0",borderRadius:8,marginBottom:20}}>
                      <OptionContainer
                        selected={selected}
                        onSelect={(id)=>this.onSelectBrand(id)}
                        options={
                          options
                        }/>
                  </Container>
               </PageContainer>);

    }
    return ( <PageContainer  isHeader={true}>
                <Header
                  leftIcon={"header-back"}
                  onLeftPressed={()=>{navigation.pop(1)}}
                  text={LangUtil.getStringByKey("brand_select")}
                  rightText={selected?LangUtil.getStringByKey("common_confirm"):null}
                  onRightPressed={async()=>{if(selected){let res = await this.onSave();if(res){navigation.pop(1)}}}}
                />
                <Container
                    fullwidth
                    scrollable
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1}}>
                    <OptionContainer
                      style={{marginTop:20,marginBottom:20}}
                      selected={selected}
                      onSelect={(id)=>this.onSelectBrand(id)}
                      options={
                        options
                      }/>
                </Container>
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo};
};
export default connect(mapStateToProps, actions)(PageBrandSelect);
