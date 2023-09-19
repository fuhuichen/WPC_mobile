import React, {Component} from 'react';
import VALUES from '../utils/values';
import {connect} from 'react-redux';
import * as actions from '../actions';
import I18n from 'react-native-i18n';
import UshopRestClient from '../utils/webclient'
import DialogHandler from '../utils/DialogHandler'
import {Dimensions, Keyboard, Platform, ScrollView, StyleSheet, View} from 'react-native';
import UTitleBarText from '../components/UTitleBar'
import SettingInput from '../components/SettingInputEx'
import {Actions} from "react-native-router-flux";
import {inject, observer} from 'mobx-react';
import SettingSelect from '../components/SettingSelectEx'
import Navigation from "../../../app/element/Navigation";
import ModalSingleSelect from '../components/ModalSingleSelect';
import ModalMultiSelect from '../components/ModalMultiSelect';

@inject('store')
@observer
export default class PageSettingAccount extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    var styles;
    if(smallPhone){
      styles = smallStyles;
    } else {
      styles = largeStyles;
    }
    this.state = {
      userInfo:this.props.store.userSelector.userInfo,
      departmentIndexs: [],
      positionIndex:-1,
      departmentText:'',
      positionText:'',
    };
    this.departmentList = [];
    this.positionList = [];
  }

  fetchList(){
    var req ={
      define_object: 'user',
      define_usage:'department',
      token  : this.props.store.userSelector.token,
    };

    const api = new UshopRestClient();
    api.getDefineInfo(req).then(response => response)
      .then(response=> {
        console.log('************ depart ready');
        response.defines.forEach((item,index)=>{
          let define = {};
          define.id = item.id;
          define.code = item.code;
          define.name = item.name;
          this.departmentList.push(define);
         });
         if(this.state.userInfo != null){
           let depart = this.state.userInfo.office_info.departments;
           let indexs = [];
           depart.forEach((item,index)=>{
              let indexfind = this.departmentList.findIndex(p => p.id == item.id);
              if (indexfind != -1){
                indexs.push(indexfind);
              }
           });
           this.setState({departmentIndexs:indexs});
         }
      })
      .catch(err => {
      });

      var req2 ={
        define_object: 'user',
        define_usage:'position',
        token  : this.props.store.userSelector.token,
      };

      api.getDefineInfo(req2).then(response => response)
        .then(response=> {
          console.log('************ positon ready');
          response.defines.forEach((item,index)=>{
            let define = {};
            define.id = item.id;
            define.code = item.code;
            define.name = item.name;
            this.positionList.push(define);
           });
           if(this.state.userInfo != null){
            let index = -1;
            let position = this.state.userInfo.office_info.positions;
            if(position.length > 0){
               index = this.positionList.findIndex(p => p.id == position[0].id);
            }
            this.setState({positionIndex:index});
          }
        })
        .catch(err => {
        });
  }

  componentWillMount(){
    if (this.state.userInfo == null){
       this.getUserInfo();
    }
    else{
      this.checkUserInfo(this.state.userInfo);
      this.fetchList();
    }
  }

  checkUserInfo(userInfo){
    if(userInfo == null){
      return;
    }
    let depart = '';
    userInfo.office_info.departments.forEach((item,index)=>{
        depart += item.name + ',';
    });
    if(depart.endsWith(',')){
      depart = depart.substr(0,depart.length-1);
    }
    this.setState({departmentText:depart});

    let positon = '';
    userInfo.office_info.positions.forEach((item,index)=>{
       positon += item.name + ',';
    });
    if(positon.endsWith(',')){
       positon = positon.substr(0,positon.length-1);
     }
    this.setState({positionText:positon});
  }

  onTextInput(){

  }

  getUserInfo(){
    var req ={
      user_id : this.props.store.userSelector.userId,
      token : this.props.store.userSelector.token,
    };
    //console.log(req)
    const api = new UshopRestClient();
    api.getUserInfo(req).then(response => response)   // Successfully logged in
        .then(response=> this.onGetUseInfoSuccess(response))    // Remember your credentials
        .catch(err => this.onGetUseInfoFail(err.message));  // Catch any error
  }

  onGetUseInfoFail(msg) {
    console.log("Get Data Fail " + msg );
  }

  onGetUseInfoSuccess(response) {
    if(response.status==1 ) {
      let accountList = this.props.store.userSelector.accountList.slice();
      for(var k in accountList){
        if(accountList[k].accountId == response.user.acc_id){
          this.setState({userInfo:response.user});
          this.props.store.userSelector.setUserInfo(response.user);
          setTimeout(()=>{
            this.checkUserInfo(this.state.userInfo);
            this.fetchList();
         },200);
          break;
        }
      }
    } else {
      this.setState({loading:false})
    }
  }

  doSave() {
    Keyboard.dismiss();
    var des = I18n.t("bi_confirm_modify")
    const screen = Dimensions.get('window')
    DialogHandler.openConfirmDialog(screen.width-100,'',des,this,{type:'next'});
  }

  onNextPressed(param){
    console.log("PageStoresCompare onNextPressed param, ", param);
    if (param.type == 'next'){
      const token = this.props.store.userSelector.token;
      const {userInfo} = this.state;
      let office_info = {};
      let departments = [];
      let positions = [];
      if (this.state.positionIndex != -1){
        positions.push(this.positionList[this.state.positionIndex]);
      }
      this.state.departmentIndexs.forEach((item,index)=>{
        departments.push(this.departmentList[item]);
      });
      office_info.departments = departments;
      office_info.positions = positions;
      userInfo.office_info = office_info;

      const api = new UshopRestClient();
      var req = {
        token:token,
        user: userInfo
      }
      api.updateUserInfo(req).then(response=> this.onUseInfoSuccess(response))    // Remember your credentials
        .catch(err => this.onUseInfoFail(err.message));  // Catch any error
    }
  }

  onUseInfoFail(msg) {
    console.log("Get Data Fail " + msg );
  }

  onUseInfoSuccess(response) {
    console.log(response);
    if(response.status == 1) {
      const {userInfo} = this.state;
      this.props.store.userSelector.setUserInfo(userInfo);
      Actions.pop();
    }
  }

  onChangeStore() {

  }

  roleidToName(id) {
    if(id=='3' || id == 3)  {
      return I18n.t("bi_common_user")
    } else if(id=='2' || id == 2) {
      return I18n.t('bi_manager')
    } else {
      return I18n.t("bi_admin")
    }
  }

  changeDepartment(){
    if (this.departmentList.length > 0){
      let list = [];
      this.departmentList.forEach((item,index)=>{
        list.push(item.name);
      });
      this.modalMulti.open(I18n.t("bi_customer_department"),this.state.departmentIndexs,list);
    }
  }

  changePosition(){
    if(this.positionList.length > 0){
      let list = [];
      this.positionList.forEach((item,index)=>{
        list.push(item.name);
      });
      this.modalSingle.open(I18n.t("bi_customer_position"),this.state.positionIndex,list);
    }
  }

  render(){
    let {styles,userInfo} = this.state;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    const {clear_gray,light_gray, bright_blue,white,black,white_half} = VALUES.COLORMAP;
    var imgPasword = require('../../images/password.png');
    var imgDate = require('../../images/date.png');
    var imgQa = require('../../images/qa.png');
    var imgAbout = require('../../images/about.png');
    var imgSetting = require('../../images/setting.png');
    var imgEmail = require('../../images/email.png');
    var imgLogout = require('../../images/logout.png');
    const screen = Dimensions.get('window')
    if(userInfo == null){
       let user = {};
       user.roleid = 3;
       userInfo = user;
    }
    var role = this.roleidToName(userInfo.roleid+'')
    return (
      <View style={{paddingTop:0,
        backgroundColor:VALUES.COLORMAP.dkk_background,
        height:screen.height,width:screen.width}}>
        <Navigation
                    onLeftButtonPress={()=>Actions.pop()}
                    title={I18n.t("bi_change_customer_info")}
                    rightButtonTitle={I18n.t('Save')}
                    onRightButtonPress={()=>{this.doSave()}}
          />
        <ScrollView style={{marginBottom:20}}>
          <SettingInput title={I18n.t("bi_login_account")} unit={null}
                             onTextInput={(v)=>this.onTextInput({v})}
                             onChangeText={(email)=>this.setState({email})}
                             editable={false}
                             value={userInfo.email}/>
          <SettingInput title={I18n.t("bi_system_permision")} unit={null}
                            onTextInput={(v)=>this.onTextInput({v})}
                            onChangeText={(email)=>{}}
                             editable={false}
                             value={role}/>
          <SettingInput title={I18n.t("bi_customer_name")} unit={null}
                              onTextInput={(v)=>this.onTextInput({v})}
                             onChangeText={(value) => { userInfo.fullname =value;this.setState({ userInfo})}}
                              editable={true}
                              value={userInfo.fullname}/>

          <SettingSelect title={I18n.t("bi_customer_department")} unit={''}
               onPress={()=>this.changeDepartment()}
               editable={userInfo.roleid == 1 ? true: false}
               value={this.state.departmentText}/>

          <SettingSelect title={I18n.t("bi_customer_position")} unit={''}
               onPress={()=>this.changePosition()}
               editable={userInfo.roleid == 3 ? false: true}
               value={this.state.positionText}/>

          <SettingInput     title={I18n.t("bi_customer_id")} unit={null}
                            onTextInput={(v)=>this.onTextInput({v})}
                            keyboardType={'numeric'}
                            editable={userInfo.roleid == 3 ? false: true}
                            onChangeText={(value) => { userInfo.code =value;this.setState({ userInfo})}}
                            value={userInfo.code}/>
          <SettingInput title={I18n.t("bi_customer_phone")} unit={null}
                          editable={true}
                          onTextInput={(v)=>this.onTextInput({v})}
                          onChangeText={(value) => { userInfo.cellphone =value;this.setState({ userInfo})}}
                          value={userInfo.cellphone}/>

          <ModalSingleSelect  ref={c => this.modalSingle = c} onSelect={index => {
                       this.setState({positionIndex:index})
                       let positon = '';
                       if (this.positionList[index]!= null){
                          positon = this.positionList[index].name;
                       }
                       this.setState({positionText:positon});
           }}/>
           <ModalMultiSelect  ref={c => this.modalMulti = c} onSelect={index => {
                 this.setState({departmentIndexs:index});
                 let depart = '';
                 index.forEach((item,index)=>{
                   depart += this.departmentList[item].name + ',';
                 });
                 if(depart.endsWith(',')){
                   depart = depart.substr(0,depart.length-1);
                 }
                 this.setState({departmentText:depart});
           }}/>
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
