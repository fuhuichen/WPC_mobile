import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {AppContainer,
        PageContainer,
        Header,Container,
        Selection,
        Typography,
        Tab,
        BottomNav,
        DataInput,
        TouchCard,
        NormalButton} from '../../../framework'
import {LangUtil,StorageUtil} from '../../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES} from  "../../define"
import BottomNavigation from "../../components/BottomNavigation"
class PageSettingAddress extends Component {
  constructor(props) {
    super(props);
  }

  componentWillUnmount() {

  }
  async componentDidMount() {

  }
  async showBrandSelect(){
    const {navigation} = this.props;
    navigation.push(PAGES.BRAND_SELECT)
  }
  async next(){
    const {loginInfo,navigation} = this.props;
    let info  = JSON.parse(JSON.stringify(loginInfo))
    info.token = null;
    StorageUtil.setObj( STORAGES.LOGIN_INFO,info)
    this.props.setLoginInfo(info)
    navigation.replace(PAGES.LOGIN,{})
  }
  render(){
    const {loginInfo,navigation} = this.props;
    return ( <PageContainer
                navigation={this.props.navigation}
                isHeader={true}>
                <Header
                  leftIcon={"header-back"}
                  onLeftPressed={()=>{navigation.pop(1)}}
                  text={LangUtil.getStringByKey("setting_address")}
                />
                <Container
                    fullwidth
                    scrollable
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1}}>
                    <Typography
                            style={{marginBottom:2,marginTop:20}}
                            font={"subtitle04"}
                            text={LangUtil.getStringByKey("setting_address_current")}
                            color='black'/>
                  <Container style={{padding:16,backgroundColor:'#E2E2E2',marginBottom:20,marginTop:3,borderRadius:8}}>
                    <Typography     numberOfLines={2}
                                    font={"text01"}
                                    text={loginInfo.isPrivate?loginInfo.privateUrl:LangUtil.getStringByKey("login_hint_public_cloud")}
                                    color='text'/>
                    </Container>
                      <TouchCard
                            fullwidth
                              flexDirection="row"
                              justifyContent={"center"}
                              alignItems={"center"}
                              onPress={async()=>{await this.next()}}
                              style={{height:44,width:'100%',backgroundColor:'white',
                              borderRadius:8,marginTop:20}}>
                              <Typography
                                    color={"error"}
                                    text={LangUtil.getStringByKey("setting_address_button")}
                                    font={"text01"}/>
                      </TouchCard>
                </Container>
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo};
};
export default connect(mapStateToProps, actions)(PageSettingAddress);
