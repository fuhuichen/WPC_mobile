import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import UshopRestClient from '../utils/webclient'
import {Dimensions, Platform, ScrollView, StyleSheet, Text, View} from 'react-native';
import UTitleBarText from '../components/UTitleBarText'

import SettingInput from '../components/SettingInput'
import Spinner from '../components/Spinner';
import {inject, observer} from 'mobx-react'
import {Actions} from "react-native-router-flux";

@inject('store')
@observer
export default class PageForgetPwd extends Component {
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
    this.state = {email:'',error:''};
  }

  onTextInput(){

  }
  checkEmail(email){
    if(email && email.length>0){
      if(this.validateEmail(email)){
          this.setState({error:''})
      }
      else{
            this.setState({error:I18n.t('郵箱地址不合法!')})
      }
      this.setState({email})
    }
    else{
        this.setState({error:'',email:''})
    }



  }
  validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }
  doSave(){
    if(this.validateEmail(this.state.email)){
      this.setState(
        {
          loading: true
        }
      );
      const api = new UshopRestClient(this.state.serverAddress);
      api.forgetPassword(this.state.email)
      .then(token => this.onForgetSuccess(token))    // Remember your credentials
      .catch(err => this.onForgetFail(err.message));  // Catch any error
    }
  }

  onForgetFail(){
      const screen = Dimensions.get('window')
      this.setState({loading: false,error:I18n.t('寄送失敗!')})

  }
  onForgetSuccess(res){
    const screen = Dimensions.get('window')
    if(res.status ==1){
      Actions.pop();
    //      DialogHandler.openAlertDialog(screen.width-100,'','已將密碼重設信寄到郵箱',this,{type:'sendemail'});
    }
    else{
      this.setState({error:I18n.t('郵箱地址不存在!')})
    //    DialogHandler.openAlertDialog(screen.width-100,'','無此帳號',this,{type:'sendemail'});
    }
    this.setState(
      {
        loading: false
      }
    );


  }
  onNextPressed(){
    const api = new UshopRestClient(this.state.serverAddress);
    api.forgetPassword(param.email)
    .then(token => this.onForgetSuccess(token))    // Remember your credentials
    .catch(err => this.onForgetFail(err.message));  // Catch any error
  }

  render(){
    const {styles,regionList,email} = this.state;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    const {clear_gray,light_gray, bright_blue,white,black,white_half} = VALUES.COLORMAP;
    var imgPasword =   require('../../images/password.png');
    var imgDate=   require('../../images/date.png');
    var imgQa =   require('../../images/qa.png');
    var imgAbout =   require('../../images/about.png');
    var imgSetting =   require('../../images/setting.png');
    var imgEmail =   require('../../images/email.png');
    var imgLogout =   require('../../images/logout.png');
    const screen = Dimensions.get('window')
    return (

      <View style={{paddingTop:(Platform.OS === 'ios'  ) ? 25 : 0,
        backgroundColor:VALUES.COLORMAP.dkk_background,
        height:screen.height,width:screen.width}}>
        <UTitleBarText    smallPhone={smallPhone}
          headerText={I18n.t('忘記密碼')}
          onLeftPress={()=>Actions.pop()}
          onRightPress={()=>{this.doSave()}}
          rightText={I18n.t('Confirm')}
          leftText={I18n.t('Cancel')}/>
          <ScrollView style={{marginBottom:50}}>

            <SettingInput title={I18n.t('郵箱地址')} unit={''}
                               isEng={I18n.locale=='en'}
                               onTextInput={(v)=>this.onTextInput({v})}
                               onChangeText={(email)=>this.checkEmail(email)}
                               secureTextEntry={false}
                               value={this.state.email}/>
            <Text  allowFontScaling={false} style={{color:VALUES.COLORMAP.dkk_red,fontSize:12,marginLeft:90,paddingTop:0 }}>
                {this.state.error}
          </Text>
            <Text  allowFontScaling={false} style={{paddingLeft:10,color:VALUES.COLORMAP.dkk_font_white,fontSize:12,marginLeft:10,paddingTop:6 }}>
                  {I18n.t('將新密碼寄至信箱')}
            </Text>
          </ScrollView >
          <Spinner visible={this.state.loading} />
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
