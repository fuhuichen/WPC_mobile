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
        RegionSelection,
        NormalButton} from '../../framework'
import {LangUtil,StorageUtil} from '../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES, STORAGES} from  "../define"
class PageAccountList extends Component {
  constructor(props) {
    super(props);
  }

  componentWillUnmount() {

  }
  async componentDidMount() {
    this.open = false;

  }
  async showBrandSelect(){
    const {navigation} = this.props;
    if(this.open)return;
    this.open =true;
    setTimeout(function(){
      this.open = false;
    }.bind(this),1000)
    navigation.push(PAGES.BRAND_SELECT)

  }
  async next(){
    const {loginInfo,navigation,storeList} = this.props;
    StorageUtil.setObj( STORAGES.LOGIN_INFO,loginInfo)
    if(storeList.length==0){
      navigation.replace(PAGES.MORE,{})
    }
    else if(loginInfo.hasColdchain)
      navigation.replace(PAGES.EVENT_MANAGE,{})
    else
      navigation.replace(PAGES.DEVICE_MANAGE,{})

  //  navigation.replace(PAGES.EVENT_MANAGE,{})
  }
  render(){
    const {loginInfo,navigation} = this.props;
  //  console.log("PageAccountList")
  //  console.log(loginInfo)
    let accountName = null ;
    if(loginInfo && loginInfo.accountList && loginInfo.accountId){
      let account  =loginInfo.accountList.find(p=>p.id == loginInfo.accountId);
      //console.log(account)
      if(account)accountName =account.name
    }
    console.log(accountName)
    return ( <PageContainer
                  backgrouncImage
                  isHeader={false} style={{paddingTop:50}}>
                <Container fullwidth
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"} style={{flex:1}}>
                  <Typography
                      style={{marginBottom:10}}
                      font={"subtitle02"}
                      text={"Welcome"}
                      color='black'/>
                  <Typography
                      style={{marginBottom:20}}
                      font={"content00"}
                      text={"WISE-iService"}
                      color='black'/>
                  <RegionSelection
                        style={{marginBottom:2,borderRadius:0,marginTop:10,
                              borderTopLeftRadius:8,borderTopRightRadius:8}}
                            text={LangUtil.getStringByKey("common_brand")}
                            value={accountName?accountName:LangUtil.getStringByKey("common_please_select")}
                            type="string"
                            onPress={async()=>{await this.showBrandSelect()}}
                        hint={""}/>
                        <Typography
                            style={{marginBottom:2,marginTop:20,marginLeft:10}}
                            font={"text00"}
                            text={LangUtil.getStringByKey("common_service")}
                            color='#A5A5A5'/>
                        <Container tabContainer flexDirection="row" fullwidth style={{
                               borderRadius:8,height:78,padding:8}}>
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
                </Container>
                <NormalButton
                  disabled={!accountName}
                  style={{marginBottom:30}}
                  onPress={()=>{this.next()}}
                  text={LangUtil.getStringByKey("common_begin")}/>
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageAccountList);
