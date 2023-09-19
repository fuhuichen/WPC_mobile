import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';;
import UshopRestClient from '../utils/webclient';
import DialogHandler from '../utils/DialogHandler';
// import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import {Dimensions, Image, Keyboard, Platform, ScrollView, StyleSheet, View,DeviceEventEmitter} from 'react-native';
import UTitleBar from '../components/UTitleBar';
import moment from 'moment';
import SettingInput from '../components/SettingInputEx'
import {Actions} from 'react-native-router-flux';
import * as storeSync from "react-native-simple-store";
import {inject, observer} from 'mobx-react';
import SettingSelect from '../components/SettingSelectEx';
import SettingItem from '../components/SettingItem'
import Toast, {DURATION} from 'react-native-easy-toast';
import Navigation from "../../../app/element/Navigation";
import {ColorStyles} from "../../../app/common/ColorStyles";

function sortNumber(item1, item2, attr, order) {
    var val1 = item1.date[0],
        val2 = item2.date[0];
    if (val1 == val2) return 0;
    if (val1 > val2) return 1*order;
    if (val1 < val2) return -1*order;
}

@inject('store')
@observer
export default class PageSettingTarget extends Component {
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
    var stores = []
    var storeIndex=-1;
    const tempReportStore = this.props.store.storeSelector.tempReportStoreBI;
    const storeList = this.props.store.storeSelector.storeListBI.slice();
    console.log("storeList : " + JSON.stringify(storeList));
    if(storeList){
      for(var k in storeList){
        //console.log(this.props.storeList[k])
        var item = {
            name:storeList[k].store_name,
            country:storeList[k].country,
            province:storeList[k].province,
            city:storeList[k].city,
            index:k,
        }
        stores.push(item);

        //stores.push(this.props.storeList[k].store_name);
        if(tempReportStore && storeList[k].store_id == tempReportStore.store_id){
          storeIndex = k;
        }
      }
    }
    let userInfo = this.props.store.userSelector.userInfo;
    this.state = {
      userInfo,
      styles,
      stores,storeIndex,
      ruleSaleTarget: undefined,
      sale:'',
      sale_week:'',
      sale_week_isSetting:false,
      userCount:1,
      cupCount:1,
      cupAvg:1,
      priceAvg:1,
      buyRate:1
    };
    if(userInfo == null){
      this.getUserInfo();
    }
  }

  componentDidMount() {
    //DeviceEventEmitter.emit('onStatusBar', '#006AB7');
    //DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
    const storeList = this.props.store.storeSelector.storeListBI.slice();
    this.getProperty('sales_target',storeList[this.state.storeIndex])
  }

  componentWillUnmount() {
    //DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_BACKGROUND_BLUE);
  }

  getUserInfo(){
    var req ={
      user_id : this.props.store.userSelector.userId,
      token : this.props.store.userSelector.token,
    };
    //console.log(req)
    const api = new UshopRestClient();
    api.getUserInfo(req).then(response => response)   // Successfully logged in
        .then(response=> this.onGetUserInfoSuccess(response))    // Remember your credentials
        .catch(err => this.onGetUserInfoFail(err.message));  // Catch any error
  }

  onGetUserInfoFail(msg) {
    console.log("Get Data Fail " + msg );
  }

  onGetUserInfoSuccess(response) {
    //console.log( response)
    if(response.status==1 ) {
      let accountList = this.props.store.userSelector.accountList.slice();
      for(var k in accountList){
        if(accountList[k].accountId == response.user.acc_id){
          this.setState({userInfo:response.user});
          this.props.store.userSelector.setUserInfo(response.user);
          break;
        }
      }
    }
  }

  getProperty(type,tempReportStore){
    console.log(tempReportStore)
    this.setState({loading:true})
    const token = this.props.store.userSelector.token;
    const api = new UshopRestClient();
   // var dateContent = moment(new Date()).format('YYYY/MM/DD');
    var d = new Date();
    var dateContent = moment(d).format('YYYY/MM/DD');
    var req = api.createListPropertyReq(type,token,tempReportStore.store_id,'mm' ,dateContent )
    console.log(JSON.stringify(req))
    api.listProperty(req)
      .then(response=> this.OnListPropertySuccess(response))    // Remember your credentials
      .catch(err => this.OnListPropertyFail(err.message));  // Catch any error
  }

  OnListPropertyFail(msg){
    console.log("Get BusinessInfo Fail " + msg );
    this.setState({loading: false});
  }

  OnListPropertySuccess(response){
    console.log(response)
    this.setState({loading: false});
    if(response.propertys.length>0){
      response.propertys =  response.propertys.sort((a,b)=>sortNumber(a,b,'date[0]',1));
      if( response.propertys[response.propertys.length-1].type  == 'sales_target'){
        console.log(response.propertys[response.propertys.length-1])
        console.log(parseInt(response.propertys[response.propertys.length-1].data.workday))
        this.setState({
          loading: false,
          ruleSaleTarget:response.propertys[response.propertys.length-1],
          sale:parseInt(response.propertys[response.propertys.length-1].data.workday),
          sale_week:parseInt(response.propertys[response.propertys.length-1].data.weekend),
          sale_week_isSetting: response.propertys[response.propertys.length-1].data.weekend ? true : false
        });
      }
    }
  }

  checkInteger(v){
    var pv = parseInt(v);
    if(pv) return pv + '';
    return '';
  }

  onTextInput(){

  }

  doSave(){
    if(parseInt(this.state.sale)>0 && parseInt(this.state.sale_week)>0){
      Keyboard.dismiss();
      var des = I18n.t("bi_confirm_modify")
      const screen = Dimensions.get('window')
      DialogHandler.openConfirmDialog(screen.width-100,'',des,this,{type:'next'});
    }
  }

  onChangeStore(){
    var stores ={ index:this.state.storeIndex,list:this.state.stores}
    const screen = Dimensions.get('window')
    DialogHandler.openStoresDialog(screen.width-40,I18n.t("Select Store"),stores ,this,{type:'store'});
  }

  onNextPressed(param){
    if(param.type=='next') {
      this.doUpdateData();
    } else if(param.type=='store') {
      this.setState({loading:true,storeIndex:param.index})
      this.state.storeIndex = param.index;
      this.state.sale = '';
      this.state.ruleSaleTarget = undefined;
      const storeList = this.props.store.storeSelector.storeListBI.slice();
      this.getProperty('sales_target',storeList[this.state.storeIndex])
    }
  }

  doUpdateData() {
    const {sale,sale_week,ruleSaleTarget} = this.state;
    const token = this.props.store.userSelector.token;
    const tempReportStore = this.props.store.storeSelector.tempReportStoreBI;
    const storeList = this.props.store.storeSelector.storeListBI.slice();
    const api = new UshopRestClient();
    var d = new Date();
    var dateContent = moment(d).format('YYYY/MM/DD');
    var promises = [];
    if(ruleSaleTarget){
      var data = {workday:parseInt(sale), weekend:parseInt(sale_week)}
      var req = api.createPropertyReq('sales_target',token,
                storeList[this.state.storeIndex].store_id, ruleSaleTarget.property_id,
                [dateContent], '',data);
      promises.push(api.updateProperty(req));
    } else {
       // var req
       // req = api.createAddBusinessReq(token,tempReportStore.store_id,
      //      dateContent, 0, 'mm', 1 ,9 , null)
      var data = {workday:parseInt(sale), weekend:parseInt(sale_week)}
      var req = api.createPropertyReq('sales_target',token,
                storeList[this.state.storeIndex].store_id, null,
                [dateContent], '',data)
      //console.log(req)
      promises.push(api.addProperty(req));
    }
    this.promiseRequests(promises)
  }

  promiseRequests(promises) {
    var handle = function(results) {
      if(results[0].status == 1) {
        this.handleResults(results);
      } else {
        this.logout();
      }
    }.bind(this)
    Promise.all(promises)
     .then(function(data){
       handle(data)})
     .catch(function(err){
        console.log(err)
      //this.setState({loading:false})
     });
  }

  logout() {
    this.refs.toast.show(I18n.t("bi_login_expired"),DURATION.LENGTH_SHORT);
    setTimeout(function() {
      let loginInfo = this.props.store.userSelector.loginInfo;
      //loginInfo.password = '';
      storeSync.save('Login',JSON.stringify(loginInfo));
      Actions.reset('loginScreen');
    }.bind(this),DURATION.LENGTH_SHORT+3);
  }

  handleResults(results){
    Actions.pop();
  }

  cancelPress(){
    Actions.pop();
  }

  render(){
    const {styles,regionList,stores,storeIndex,userInfo} = this.state;
    const smallPhone= this.props.store.phoneSelector.smallPhone;
    const {clear_gray,light_gray, bright_blue,white,black,white_half} = VALUES.COLORMAP;
    var imgPasword = require('../../images/password.png');
    var imgDate = require('../../images/date.png');
    var imgQa = require('../../images/qa.png');
    var imgAbout = require('../../images/about.png');
    var imgSetting = require('../../images/setting.png');
    var imgEmail = require('../../images/email.png');
    var imgLogout = require('../../images/logout.png');
    const screen = Dimensions.get('window');
    return (
      <View style={{paddingTop:0,
        backgroundColor:VALUES.COLORMAP.dkk_background,
        height:screen.height,width:screen.width}}>
        <Navigation
                    onLeftButtonPress={()=>Actions.pop()}
                    title={I18n.t("bi_target_setup")}
                    rightButtonTitle={I18n.t('Save')}
                    onRightButtonPress={()=>{this.doSave()}}
          />
          <SettingSelect title={I18n.t("Select Store")} unit={''}
             onPress={()=>this.onChangeStore()}
              value={stores[storeIndex]?stores[storeIndex].name:''}/>
          <SettingInput title={I18n.t("bi_input_day_target")} unit={''}
            sale={true}
            editable={userInfo != null && userInfo.roleid != 3}
            keyboardType={'numeric'}
            onTextInput={(v)=>this.onTextInput({v})}
            onChangeText={(sale)=> {
                if(this.state.sale_week_isSetting) {
                  this.setState({sale:this.checkInteger(sale)})
                } else {
                  this.setState({sale:this.checkInteger(sale), sale_week:this.checkInteger(sale)*7})
                }
              }
            }
            value={this.state.sale+''}/>
          <SettingInput title={I18n.t("bi_input_week_target")} unit={''}
            sale={true}
            editable={userInfo != null && userInfo.roleid != 3}
            keyboardType={'numeric'}
            onTextInput={(v)=>this.onTextInput({v})}
            onChangeText={(sale)=>this.setState({sale_week:this.checkInteger(sale)})}
            value={this.state.sale_week+''}/>
        <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
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
