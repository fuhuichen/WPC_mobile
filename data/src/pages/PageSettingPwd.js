import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import UshopRestClient from '../utils/webclient'
import DialogHandler from '../utils/DialogHandler'

import {
    AsyncStorage,
    Dimensions,
    Keyboard,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    DeviceEventEmitter
} from 'react-native';
import UTitleBarText from '../components/UTitleBar'

import SettingInput from '../components/SettingInputEx'
import {Actions} from "react-native-router-flux";
import store from "react-native-simple-store";
import {inject, observer} from 'mobx-react'
import {ColorStyles} from "../../../app/common/ColorStyles";
import Navigation from "../../../app/element/Navigation";

@inject('store')
@observer
export default class PageSettingAccount extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    var styles
    if(smallPhone){
      styles = smallStyles
    }
    else{
      styles = largeStyles
    }
    this.state = {pwd:'',cpwd:'',err:''};
  }

  componentDidMount() {
    //DeviceEventEmitter.emit('onStatusBar', '#24293d');
  }

  componentWillUnmount() {
    //DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_BACKGROUND_BLUE);
  }

  onTextInput(){

  }
  validatePwd(pwd) {
       var re = /^(?=.*\d.*)(?=.*[a-zA-Z].*).{8,32}$/;
       return re.test(String(pwd));
   }
  doSave(){
    Keyboard.dismiss();
    const {pwd,cpwd}=this.state;
    console.log(pwd,' ',cpwd)
    if(!pwd || pwd.length<1 || !cpwd || cpwd.length<1){
        this.setState({err:"bi_please_input_pwd"})
        return;
    }
    if(pwd!=cpwd){
        this.setState({err:"bi_pwd_not_equal"})
        return;
    }
    if(!this.validatePwd(pwd)){
        this.setState({err:"bi_pwd_wrong_format"})
        return;
    }
    var des = I18n.t("bi_confirm_modify")
    const screen = Dimensions.get('window')
    DialogHandler.openConfirmDialog(screen.width-100,'',des,this,{type:'next'});
  }
  onNextPressed(){
    const {pwd,cpwd}=this.state;
    const userId = this.props.store.userSelector.userId;
    const token = this.props.store.userSelector.token;

    const api = new UshopRestClient();
    api.changePwd(token,userId,pwd).then(response => response)   // Successfully logged in
       .then(response=>{
           if(response.status == 1){
               let loginInfo = this.props.store.userSelector.loginInfo;
               loginInfo.password = pwd;
               store.save('Login',JSON.stringify(loginInfo));
               Actions.pop();
           }
           else(
             this.setState({err:"bi_setup_fail"})
           )

        })    // Remember your credentials
       .catch(err =>{
           console.log(err)
           this.setState({err:"bi_setup_fail"})
        });  // Catch any error
  }
  onChangeStore(){

  }
  forgetPwd(){
      Actions.push('pageForgetPwd');
  }
  render(){
    const {styles,regionList,email} = this.state;
    const smallPhone= this.props.store.phoneSelector.smallPhone;
    const {clear_gray,light_gray, bright_blue,white,black,white_half} = VALUES.COLORMAP;
    const screen = Dimensions.get('window')
    return (

      <View style={{paddingTop:0,
        backgroundColor:VALUES.COLORMAP.dkk_background,
        height:screen.height,width:screen.width}}>
          <Navigation
                    onLeftButtonPress={()=>Actions.pop()}
                    title={I18n.t("bi_to_change_pwd")}
                    rightButtonTitle={I18n.t('Save')}
                    onRightButtonPress={()=>{this.doSave()}}
          />
          <ScrollView style={{marginBottom:50}}>
            <SettingInput title={I18n.t("bi_new_pwd")} unit={''}
                              isEng={I18n.locale=='en'}
                              onTextInput={(v)=>this.onTextInput({v})}
                              onChangeText={(pwd)=>this.setState({pwd})}
                              secureTextEntry={true}
                               value={this.state.pwd}/>
            <SettingInput title={I18n.t("bi_confirm_pwd")} unit={''}
                                isEng={I18n.locale=='en'}
                                onTextInput={(v)=>this.onTextInput({v})}
                               onChangeText={(cpwd)=>this.setState({cpwd})}
                                secureTextEntry={true}
                                value={this.state.cpwd}/>
        <Text  allowFontScaling={false}  style={{paddingLeft:10,color:'#9d9d9d',fontSize:12,marginLeft:10,marginBottom:5,marginTop:8,}}>
         {I18n.t("bi_pwd_rule")}
        </Text>
        <Text  allowFontScaling={false}  style={{color:VALUES.COLORMAP.dkk_red,fontSize:12,marginLeft:20,marginBottom:5,marginTop:8,}}>
            {this.state.err.length>0? I18n.t(this.state.err):''}
        </Text>
        <TouchableOpacity
                  onPress={()=>{this.forgetPwd()}}>
            <Text  allowFontScaling={false}  style={{paddingLeft:10,marginLeft:10,color:'#FFFFFF77',fontSize:12}}>
             {I18n.t("bi_forget_pwd?")}
            </Text>
        </TouchableOpacity>
          </ScrollView >
        </View>
      )

  }

}
const smallStyles = StyleSheet.create({
  dataValue: {
    backgroundColor:'transparent',
    fontSize:14,
    marginTop:3,
    justifyContent:'center',
    alignItems:'center',
    color:VALUES.COLORMAP.white},
  backgroundImage: {
     flex: 1,
     alignSelf: 'stretch',
     width: null,
   },
   triangle: {
     width: 0,
     height: 0,
     backgroundColor: 'transparent',
     borderStyle: 'solid',
     borderTopWidth: 0,
     borderRightWidth: 45,
     borderBottomWidth: 90,
     borderLeftWidth: 45,
     borderTopColor: 'transparent',
     borderRightColor: 'transparent',
     borderBottomColor: 'red',
     borderLeftColor: 'transparent',
   },
  container:{
    paddingTop:44,
    paddingRight:30,
    paddingLeft:30,
    paddingBottom:25,
    alignItems:'center',
    justifyContent:'flex-start',
  },
  logoImage: {
    width:0
  },
  inputTitle: {
     paddingTop:2,
     paddingBottom:4,
     marginLeft:10,
     fontSize:14,
     justifyContent:'flex-start',
     alignItems:'center',
     backgroundColor:'transparent',
     color:VALUES.COLORMAP.white},
   forgetPwdText: {
        textDecorationLine:'underline',
        paddingTop:2,
        paddingBottom:4,
        marginLeft:20,
        fontSize:12,
        alignItems:'center',
        color:VALUES.COLORMAP.white},
});

const largeStyles = StyleSheet.create({
  dataValue: {
    backgroundColor:'transparent',
    fontSize:14,
    marginTop:3,
    justifyContent:'center',
    alignItems:'center',
    color:VALUES.COLORMAP.white},
  backgroundImage: {
     flex: 1,
     alignSelf: 'stretch',
     width: null,
   },
   triangle: {
     width: 0,
     height: 0,
     backgroundColor: 'transparent',
     borderStyle: 'solid',
     borderTopWidth: 0,
     borderRightWidth: 45,
     borderBottomWidth: 90,
     borderLeftWidth: 45,
     borderTopColor: 'transparent',
     borderRightColor: 'transparent',
     borderBottomColor: 'red',
     borderLeftColor: 'transparent',
   },
  container:{
    paddingTop:44,
    paddingRight:30,
    paddingLeft:30,
    paddingBottom:25,
    alignItems:'center',
  },
   logoImage: {
     width:0
   },
   inputTitle: {
      paddingTop:2,
      paddingBottom:4,
      marginLeft:10,
      fontSize:12,
      justifyContent:'flex-start',
      alignItems:'center',
      backgroundColor:'transparent',
      color:VALUES.COLORMAP.white},
   forgetPwdText: {
           textDecorationLine:'underline',
           paddingTop:2,
           paddingBottom:4,
           marginLeft:20,
           fontSize:10,
           alignItems:'center',
           justifyContent:'flex-end',
           color:VALUES.COLORMAP.white},

});
