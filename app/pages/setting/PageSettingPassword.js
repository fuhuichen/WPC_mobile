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
        DataInput,
        Tab,
        BottomNav,
        TextInput,
        NormalButton} from '../../../framework'
import {LangUtil} from '../../../framework'
import MainAPI from "../../api/main"
import { DeviceEventEmitter} from 'react-native';
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS} from  "../../define"
import Subtitle from '../../components/Subtitle'
import BottomNavigation from "../../components/BottomNavigation"
class PageSettingPassword extends Component {
  constructor(props) {
    super(props);
    this.state={
      newPwd:"",
      confirmPwd:"",
      errorPwd:"",
    }
  }

  componentWillUnmount() {

  }
  async componentDidMount() {

  }

  //DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_deldev_success"),type:'success'})
//  DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_deldev_fail"),type:'error'})


  async onSave(){
    const {navigation} = this.props;
    const {newPwd,confirmPwd} = this.state;
    await this.setState({errorPwd:""})
    if(!newPwd || !confirmPwd || newPwd <8 || confirmPwd.length<8 ){
        DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("error_password_limit"),type:'error'})
        return
    }
    if(newPwd != confirmPwd){
        DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("error_password_not_equal"),type:'error'})
        return
    }
    this.props.setLoading(true);
    let result = await MainAPI.changePwd(newPwd)
    console.log(result)
    this.props.setLoading(false);
    if(result.status != ERROR_CODE.SUCCESS){
        DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_modpwd_fail"),type:'error'})
        return;
    }
    DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_modpwd_success"),type:'success'})
    navigation.replace(PAGES.MORE,{})
  }
  render(){
    const {loginInfo,navigation} = this.props;
    const {newPwd,confirmPwd,errorPwd} = this.state;
    return ( <PageContainer
                navigation={this.props.navigation}
                isHeader={true}>
                <Header
                  leftIcon={"header-back"}
                  onLeftPressed={()=>{navigation.replace(PAGES.MORE,{})}}
                  text={LangUtil.getStringByKey("setting_password_change")}
                  rightText={LangUtil.getStringByKey("common_confirm")}
                  onRightPressed={async()=>{res = await this.onSave();if(res){navigation.pop(1)}}}
                />
                <Container
                    fullwidth
                    scrollable
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1}}>
                    <Subtitle
                      style={{marginTop:20,marginLeft:6}}
                      text={LangUtil.getStringByKey("setting_new_pwd")}/>
                    <TextInput
                      placeholder={""}
                      onChangeText={(t)=>this.setState({newPwd:t})}
                      style={{borderRadius:8}}
                      mode={"password"}
                      onPress={()=>this.setState({newPwd:""})}
                      value={newPwd}/>
                      <Subtitle
                        style={{marginLeft:6}}
                        text={LangUtil.getStringByKey("error_password_limit")}/>
                      <Subtitle
                          style={{marginTop:20,marginLeft:6}}
                          text={LangUtil.getStringByKey("setting_confirm_pwd")}/>
                      <TextInput
                        placeholder={""}
                        onChangeText={(t)=>this.setState({confirmPwd:t})}
                        style={{borderRadius:8}}
                        mode={"password"}
                        onPress={()=>this.setState({confirmPwd:""})}
                        value={confirmPwd}/>
                      <Subtitle
                          style={{marginLeft:6}}
                          text={LangUtil.getStringByKey("error_password_not_equal")}/>
                </Container>
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo};
};
export default connect(mapStateToProps, actions)(PageSettingPassword);
