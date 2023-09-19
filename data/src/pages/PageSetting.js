import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import {
    BackHandler,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableHighlight,
    View,
    DeviceEventEmitter, TouchableOpacity
} from 'react-native';
import UTitleBar from '../components/UTitleBar'

import {Actions} from 'react-native-router-flux';
import * as storeSync from "react-native-simple-store";
import {inject, observer} from 'mobx-react'
import UshopRestClient from "../utils/webclient";
import Toast, {DURATION} from 'react-native-easy-toast'
//import JMessage from "../../../app/notification/JMessage";
import {Environment} from '../../../environments/Environment';
import VersionUtil from "../../../app/utils/VersionUtil";
import RNUpdate from "../../../app/thirds/autoupdate";
import Wallpaper from "../../../app/login/Wallpaper";
import store from "react-native-simple-store";
import Package from "../../../app/entities/Package";
import Navigation from "../../../app/element/Navigation";
import * as lib from '../../../app/common/PositionLib';
import Spinner from "../../../app/element/Spinner";
import {ColorStyles} from '../../../app/common/ColorStyles';
import { FileLogger } from "react-native-file-logger";
import Config from "react-native-config";
import moment from 'moment';
import DeviceInfo from 'react-native-device-info';
import RNLocation from 'react-native-location';
import clear from 'react-native-clear-app-cache';
import ModalCenter from "../../../app/components/ModalCenter";
import StoreUtil from "../../../app/utils/StoreUtil";
import PatrolStorage from "../../../app/components/inspect/PatrolStorage";
//import StoreSelector from "../stores/StoreSelector";
let {width} =  Dimensions.get('screen');

const paddingHorizontal = 24;
@inject('store')
@observer
export default class PageSetting extends Component {
    state = {
        onStore: false,
        onTarget: false,
        onInput: false,
        onKPI: false,
        onUser: false,
        onPassword: false,
        onLanguage: false,
        onQuestion: false,
        onInspectExecution: false,
        onUpdate: false,
        onAbout: false,
        onClearCache: false,
        onSendLog: false
    };

  constructor(props) {
    super(props);
    this.props = props;
    this.backHandler = null;
    const tempReportStore =null;//this.props.store.storeSelector.tempReportStoreBI;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    var styles;
    if(smallPhone) {
      styles = smallStyles
    } else {
      styles = largeStyles
    }

    this.state = {styles,loading:(tempReportStore != null) ? false : true};
    this.refreshStore = false;
  }

  componentDidMount() {
    this.fetchData();
    this.backHandler = BackHandler.addEventListener("pageSettingBackPress", () => {
    });
  }

  componentWillUnmount() {
    this.backHandler && this.backHandler.remove();
  }

  fetchData(){
    var req ={
      user_id : this.props.store.userSelector.userId,
      token : this.props.store.userSelector.token,
    };
    console.log(req);
    const api = new UshopRestClient();
    api.getStoreList(req).then(response => response)   // Successfully logged in
        .then(response=> this.onStoreListSuccess(response))    // Remember your credentials
        .catch(err => this.onStoreListFail(err.message));  // Catch any error
  }

  onStoreListFail(msg){
      this.refreshStore = false;
      this.refs.toast.show(I18n.t('Get store error'),DURATION.LENGTH_SHORT);
      this.setState({loading:false})
  }

  onStoreListSuccess(response){
    // console.log('onStoreListSuccess ',response)
    if(response.status == 1) {
      // const { storeListetting,groupList} = this.props;
      var stores =[];
      var storeList = response.stores;
      for(var k in storeList){
        storeList[k].sensors =[];
        //console.log(storeList[k])
        var item = {
          name:storeList[k].store_name,
          country:storeList[k].country,
          province:storeList[k].province,
          city:storeList[k].city,
          index:k,
        }
        stores.push(item);
      }
      if(stores.length>0){
        this.setState({stores,storeIndex:0})
        this.props.store.storeSelector.setStoreListBI(storeList)
        this.props.store.storeSelector.setTempReportStoreBI(storeList[0]);
        this.refreshStore && this.onStoreSetting();

      }else {
          this.refs.toast.show(I18n.t('Get store empty'),DURATION.LENGTH_SHORT)
      }
      this.setState({loading:false});
    } else {
      this.logout();
    }

    this.refreshStore = false;
  }

  logout() {
    //this.refs.toast.show(I18n.t("bi_login_expired"),DURATION.LENGTH_SHORT);
    setTimeout(function() {
      let loginInfo = this.props.store.userSelector.loginInfo;
      loginInfo.password = '';
      store.get('Login').then((res)=> {
            if (res != null) {
                let login = JSON.parse(res);
                if (login.accountId != null){
                    loginInfo.accountId = login.accountId;
                }
                if (login.serviceIndex != null){
                    loginInfo.serviceIndex = login.serviceIndex;
                }
            }
          store.save('Login',JSON.stringify(loginInfo));
          //JMessage.close();
          Actions.reset('loginScreen',{reset:true});
        });
    }.bind(this),DURATION.LENGTH_SHORT+3);
  }

    udpate(){
      this.setState({onUpdate:false});
      if(VersionUtil.data != null){
          $RNUpdate.onShow(VersionUtil.data,true);
      }else{
          this.refs.toast.show(I18n.t('Latest version'),DURATION.LENGTH_SHORT)
      }
    }

    onStoreSetting(){
      try {
          this.setState({onStore:false});
          if (this.props.store.storeSelector.tempReportStoreBI == null){
              this.refreshStore = true;
              this.setState({loading: true},()=>{
                this.fetchData();
              })
          }else if (this.props.store.storeSelector.storeListBI.length === 0){
              this.refs.toast.show(I18n.t('Get store empty'),DURATION.LENGTH_SHORT)
          }else {
              Actions.push('pageSettingStore');
          }
      }catch (e) {
      }
    }

    onTargetSetting(){
      this.setState({onTarget:false});
      if (this.props.store.storeSelector.tempReportStoreBI == null){
          this.refs.toast.show(I18n.t('Get store empty'),DURATION.LENGTH_SHORT);
      }else {
          Actions.push('pageSettingTarget');
      }
    }

    onPosSetting(){
        this.setState({onInput:false});
        if (this.props.store.storeSelector.tempReportStoreBI == null) {
            this.refs.toast.show(I18n.t('Get store empty'), DURATION.LENGTH_SHORT);
        }else {
            Actions.push('pageSettingPos');
        }
    }

    onWeightSetting(){
        this.setState({onKPI:false});
        if (this.props.store.storeSelector.tempReportStoreBI == null) {
            this.refs.toast.show(I18n.t('Get store empty'), DURATION.LENGTH_SHORT);
        }else {
            Actions.push('pageSettingWeight');
        }
    }

    backDrawer(){
      DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGBA_BLUE);
      DeviceEventEmitter.emit('onStatusBarTrans', true);
      Actions.pop();
    }

    clearCache() {
      clear.getAppCacheSize((value, unit) => {
        console.log("缓存大小", value);
        console.log("缓存单位", unit);
      })

      clear.clearAppCache(() => {
        console.log("清理缓存成功");
        this.refs.toast.show(I18n.t('Clear Cache Finish'),DURATION.LENGTH_SHORT);

        StoreUtil.deleteAll();
        PatrolStorage.deleteAll();
      })
    }

    sendLogFile() {
      let osVersion = DeviceInfo.getSystemVersion();
      RNLocation.getCurrentPermission().then(currentPermission => {
        let GPSPermission = 'Disable';
        if(currentPermission === 'authorizedFine' || currentPermission === 'authorizedWhenInUse'){
          GPSPermission = 'Enable';
        }
        let usedMemory = DeviceInfo.getUsedMemorySync() / 1024 / 1024;
        let body =  'APP Version : ' + Environment.APP_VERSION + '\n' +
                    'OS : ' + Platform.OS + '\n' +
                    'OS Version : ' + osVersion + '\n' +
                    'GPS Permission : ' + GPSPermission + '\n' +
                    'APP Used Memory : ' + usedMemory.toFixed(2) + 'MB';
        FileLogger.sendLogFilesByEmail({
          to: 'system.admin@storevue.com',
          subject: I18n.t('Problem Report') + '_' + moment().format("YYYY/MM/DD"),
          body: body
        });
      });
    }

  render() {
    const {styles,regionList} = this.state;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    const {clear_gray,light_gray, bright_blue,white,black,white_half} = VALUES.COLORMAP;
    var imgPasword = require('../../images/password.png');
    var imgDate = require('../../images/date.png');
    var imgQa = require('../../images/qa.png');
    var imgAbout = require('../../images/about.png');
    var imgSetting = require('../../images/setting.png');
    var imgEmail = require('../../images/email.png');
    var imgLogout = require('../../images/logout.png');
    const screen = Dimensions.get('window');
    const source = require('../../../app/assets/img_shape_arrow.png');
    const arrow = require('../../../app/assets/img_select_arrow.png');

    let { onStore, onTarget, onInput, onKPI, onUser, onPassword, onLanguage,
          onQuestion, onInspectExecution, onUpdate, onAbout, onPush, onClearCache, onSendLog} = this.state;

    let showNotification = (this.props.store.userSelector.serviceIndex != this.props.store.enumSelector.serviceIndex.CASHCHECK);

    return (
       <View style={{height:screen.height,width:screen.width}}>
        <Navigation title={I18n.t("bi_simple_setting")}
            onLeftButtonPress={()=>{this.backDrawer()}}/>
        <ScrollView style={{marginBottom:50}}>
          <View style={{height:28,width:screen.width,flexDirection:'row',alignItems:'center',marginTop:12}}>
            <Text  allowFontScaling={false}  style={{marginLeft:paddingHorizontal,fontSize:14,color:'#006ab7'}}>{I18n.t("bi_store_setting")}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.6}
                            onPress={()=>this.onStoreSetting()}
                            onPressIn={() => this.setState({onStore: true})}
                            onPressOut={() => this.setState({onStore: false})}>
            <View style={{height:36,alignItems:'flex-end',flexDirection:'row'}}>
              <Text allowFontScaling={false} style={[styles.dataValue,{color:onStore? '#006ab7':'#484848'}]}>{I18n.t("bi_store_setting")}</Text>
              <View style={{flex:1}}/>
              <Image style={{height:16,width:16 ,marginLeft:10,marginRight:paddingHorizontal}} resizeMode={'contain'}
                     source={onStore ? arrow : source} />
            </View>
          </TouchableOpacity>
            <View style={{width:width-48,height:1,marginLeft:24, marginTop:6, backgroundColor: onStore ? '#006AB7' : '#dcdcdc'}}/>
          <TouchableOpacity activeOpacity={0.6} style={{backgroundColor:'transparent'}}
                            onPress={()=>{this.onTargetSetting()}}
                            onPressIn={() => this.setState({onTarget: true})}
                            onPressOut={()=> this.setState({onTarget: false})}>
            <View style={{height:36,alignItems:'flex-end',flexDirection:'row'}}>
              <Text allowFontScaling={false} style={[styles.dataValue,{color:onTarget? '#006ab7':'#484848'}]}>{I18n.t("bi_target_setup")}</Text>
              <View style={{flex:1}}/>
              <Image style={{height:16, width:16, marginLeft:10, marginRight:paddingHorizontal}} resizeMode={'contain'}
                     source={onTarget ? arrow : source} />
            </View>
          </TouchableOpacity>
            <View style={{width:width-48,height:1,marginLeft:24, marginTop:6, backgroundColor: onTarget ? '#006AB7' : '#dcdcdc'}}/>
          <TouchableOpacity activeOpacity={0.6} style={{backgroundColor:'transparent'}}
                            onPress={()=>{this.onPosSetting()}}
                            onPressIn={() => this.setState({onInput: true})}
                            onPressOut={()=> this.setState({onInput: false})}>
            <View style={{height:36,alignItems:'flex-end',flexDirection:'row'}}>
              <Text allowFontScaling={false}  style={[styles.dataValue,{color:onInput? '#006ab7':'#484848'}]}>{I18n.t("bi_pos_data_input")}</Text>
              <View style={{flex:1}}/>
              <Image style={{height:16,width:16 ,marginLeft:10,marginRight:paddingHorizontal}} resizeMode={'contain'}
                     source={onInput ? arrow : source} />
            </View>
          </TouchableOpacity>
            <View style={{width:width-48,height:1,marginLeft:24, marginTop:6, backgroundColor: onInput ? '#006AB7' : '#dcdcdc'}}/>
          <TouchableOpacity activeOpacity={0.6} style={{backgroundColor:'transparent'}}
                            onPress={()=>{this.onWeightSetting()}}
                            onPressIn={() => this.setState({onKPI: true})}
                            onPressOut={()=> this.setState({onKPI: false})}>
            <View style={{height:36,alignItems:'flex-end',flexDirection:'row'}}>
              <Text allowFontScaling={false}  style={[styles.dataValue,{color:onKPI? '#006ab7':'#484848'}]}>{I18n.t("bi_abastract_kpi_setup")}</Text>
              <View style={{flex:1}}/>
              <Image style={{height:16,width:16 ,marginLeft:10,marginRight:paddingHorizontal}} resizeMode={'contain'}
                     source={onKPI ? arrow : source} />
            </View>
          </TouchableOpacity>
          <View style={{width:width-48,height:1,marginLeft:24, marginTop:6, backgroundColor: onKPI ? '#006AB7' : '#dcdcdc'}}/>

          <View style={{ height:28,width:screen.width,flexDirection:'row',alignItems:'center',marginTop:12}}>
            <Text allowFontScaling={false}  style={{marginLeft:paddingHorizontal,fontSize:14,color:'#006AB7'}}>{I18n.t("bi_change_person_info")}</Text>
          </View>

          <TouchableOpacity activeOpacity={0.6} style={{backgroundColor:'transparent'}}
                            onPress={() => {Actions.push('pageSettingPwd')}}
                            onPressIn={() => this.setState({onPassword: true})}
                            onPressOut={() => {this.setState({onPassword:false})}}>
            <View style={{height:40,alignItems:'flex-end',flexDirection:'row'}}>
              <Text allowFontScaling={false}  style={[styles.dataValue,{color:onPassword? '#006ab7':'#484848'}]}>{I18n.t("bi_change_pwd")}</Text>
              <View style={{flex:1}}/>
              <Image style={{height:16,width:16 ,marginLeft:10,marginRight:paddingHorizontal}} resizeMode={'contain'}
                     source={onPassword ? arrow : source} />
            </View>
          </TouchableOpacity>
          <View style={{width:width-48,height:1,marginLeft:24, marginTop:6, backgroundColor: onPassword ? '#006AB7' : '#dcdcdc'}}/>

          <View style={{ height:28, width:screen.width, flexDirection:'row', alignItems:'center',marginTop:12}}>
            <Text allowFontScaling={false} style={{marginLeft:paddingHorizontal,fontSize:14,color:'#006AB7'}}>{I18n.t('General')}</Text>
          </View>

          <TouchableOpacity activeOpacity={0.6} style={{backgroundColor:'transparent'}}
                            onPress={() => {Actions.push('pageSettingLan')}}
                            onPressIn={() => this.setState({onLanguage: true})}
                            onPressOut={() => {this.setState({onLanguage:false})}}>
            <View style={{height:36,alignItems:'flex-end',flexDirection:'row'}}>
              <Text allowFontScaling={false}  style={[styles.dataValue,{color:onLanguage? '#006ab7':'#484848'}]}>{I18n.t("bi_multlan")}</Text>
              <View style={{flex:1}}/>
              <Image style={{height:16,width:16 ,marginLeft:10,marginRight:paddingHorizontal}} resizeMode={'contain'}
                     source={onLanguage ? arrow : source} />
            </View>
          </TouchableOpacity>
          <View style={{width:width-48,height:1,marginLeft:24, marginTop:6, backgroundColor: onLanguage ? '#006AB7' : '#dcdcdc'}}/>

          {showNotification && <TouchableOpacity activeOpacity={0.6} style={{backgroundColor:'transparent'}}
                          onPress={() => {Actions.push('pageSettingPush')}}
                          onPressIn={() => this.setState({onPush: true})}
                          onPressOut={() => {this.setState({onPush:false})}}>
            <View style={{height:36,alignItems:'flex-end',flexDirection:'row'}}>
              <Text allowFontScaling={false}  style={[styles.dataValue,{color:onPush? '#006ab7':'#484848'}]}>{I18n.t('Notification new')}</Text>
              <View style={{flex:1}}/>
              <Image style={{height:16,width:16 ,marginLeft:10,marginRight:paddingHorizontal}} resizeMode={'contain'}
                     source={onPush ? arrow : source} />
            </View>
          </TouchableOpacity>}
          {showNotification && <View style={{width:width-48, height:1,marginLeft:24, marginTop:6, backgroundColor: onPush ? '#006AB7' : '#dcdcdc'}}/>}

          <TouchableOpacity activeOpacity={0.6} style={{backgroundColor:'transparent'}}
                            onPress={() => {Actions.push('pageSettingInspection')}}
                            onPressIn={() => this.setState({onInspectExecution: true})}
                            onPressOut={() => {this.setState({onInspectExecution:false})}}>
            <View style={{height:36,alignItems:'flex-end',flexDirection:'row'}}>
              <Text allowFontScaling={false}  style={[styles.dataValue,{color:onInspectExecution? '#006ab7':'#484848'}]}>{I18n.t("Inspection Execution")}</Text>
              <View style={{flex:1}}/>
              <Image style={{height:16,width:16 ,marginLeft:10,marginRight:paddingHorizontal}} resizeMode={'contain'}
                     source={onInspectExecution ? arrow : source} />
            </View>
          </TouchableOpacity>
          <View style={{width:width-48,height:1,marginLeft:24, marginTop:6, backgroundColor: onInspectExecution ? '#006AB7' : '#dcdcdc'}}/>

          { VALUES.DEBUGMODE ? <TouchableHighlight underlayColor={'#AAAAAA12' } style={{backgroundColor:'transparent'}} onPress={()=>{Actions.push('pageSettingURL')}}>
            <View style={{height:36,alignItems:'flex-end',flexDirection:'row'}}>
              <Text allowFontScaling={false}  style={styles.dataValue}>{'URL Connect Test'}</Text>
              <View style={{flex:1}}/>
              <Image style={{height:16,width:16 ,marginLeft:10,marginRight:paddingHorizontal}} resizeMode={'contain'} source={source} />
            </View>
          </TouchableHighlight> : null}

	        <View style={{height:28,width:screen.width,flexDirection:'row',alignItems:'center',marginTop:12}}>
            <Text allowFontScaling={false}  style={{marginLeft:paddingHorizontal,fontSize:14,color:'#006AB7'}}>{I18n.t("bi_simple_about")}</Text>
          </View>

          <TouchableOpacity activeOpacity={0.6} style={{backgroundColor:'transparent'}}
                            onPressIn={() => this.setState({onQuestion: true})}
                            onPressOut={() => {this.setState({onQuestion:false})}}>
            <View style={{height:36,alignItems:'flex-end',flexDirection:'row'}}>
              <Text allowFontScaling={false}  style={[styles.dataValue,{color:onQuestion? '#006ab7':'#484848'}]}>{I18n.t("bi_common_question")}</Text>
              <View style={{flex:1}}/>
              <Image style={{height:16,width:16 ,marginLeft:10,marginRight:paddingHorizontal}} resizeMode={'contain'}
                     source={onQuestion ? arrow : source} />
            </View>
          </TouchableOpacity>
          <View style={{width:width-48,height:1,marginLeft:24, marginTop:6, backgroundColor: onQuestion ? '#006AB7' : '#dcdcdc'}}/>

          <TouchableOpacity activeOpacity={0.6} style={{backgroundColor:'transparent'}}
                            onPress={() => this.udpate()}
                            onPressIn={() => this.setState({onUpdate: true})}
                            onPressOut={() => this.setState({onUpdate: false})}>
            <View  style={{height:36,alignItems:'flex-end',flexDirection:'row'}}>
              <Text  allowFontScaling={false}  style={[styles.dataValue,{color:onUpdate? '#006ab7':'#484848'}]}>{I18n.t("bi_check_update")}</Text>
              <View style={{flex:1}}/>
                {
                  VersionUtil.data != null ? <View style={{width:50,height:18,borderRadius:6,backgroundColor:'#F11E66',marginRight:10,alignItems:'center'}}>
                      <Text style={{fontSize:12,color:'white',textAlign: 'center',height:18,...Platform.select({ios:{lineHeight:18}})}}>
                          {I18n.t('New')}
                      </Text>
                  </View> : null
                }
              <Image style={{height:16,width:16 ,marginLeft:10,marginRight:paddingHorizontal}} resizeMode={'contain'}
                     source={onUpdate ? arrow : source} />
            </View>
          </TouchableOpacity>
          <View style={{width:width-48,height:1,marginLeft:24, marginTop:6, backgroundColor: onUpdate ? '#006AB7' : '#dcdcdc'}}/>

          <TouchableOpacity activeOpacity={0.6} style={{backgroundColor:'transparent'}}
                            onPress={() => {Actions.push('pageSettingAbout')}}
                            onPressIn={() => {this.setState({onAbout:true})}}
                            onPressOut={() => {this.setState({onAbout:false})}}>
            <View style={{height:36,alignItems:'flex-end',flexDirection:'row'}}>
              <Text allowFontScaling={false}  style={[styles.dataValue,{color:onAbout? '#006ab7':'#484848'}]}>{Package.getBuildName(I18n.t("bi_about_StoreVue"))}</Text>
              <View style={{flex:1}}/>
              <Image style={{height:16,width:16 ,marginLeft:10,marginRight:paddingHorizontal}} resizeMode={'contain'}
                     source={onAbout ? arrow : source} />
            </View>
          </TouchableOpacity>
          <View style={{width:width-48,height:1,marginLeft:24, marginTop:6, backgroundColor: onAbout ? '#006AB7' : '#dcdcdc'}}/>

          <TouchableOpacity activeOpacity={0.6} style={{backgroundColor:'transparent'}}
                            onPress={() => this.modalClear && this.modalClear.open()}
                            onPressIn={() => {this.setState({onClearCache:true})}}
                            onPressOut={() => {this.setState({onClearCache:false})}}>
            <View style={{height:36,alignItems:'flex-end',flexDirection:'row'}}>
              <Text allowFontScaling={false}  style={[styles.dataValue,{color:onClearCache? '#006ab7':'#484848'}]}>{I18n.t('Clear Cache')}</Text>
              <View style={{flex:1}}/>
              <Image style={{height:16,width:16 ,marginLeft:10,marginRight:paddingHorizontal}} resizeMode={'contain'}
                     source={onClearCache ? arrow : source} />
            </View>
          </TouchableOpacity>
          <View style={{width:width-48,height:1,marginLeft:24, marginTop:6, backgroundColor: onClearCache ? '#006AB7' : '#dcdcdc'}}/>

          <TouchableOpacity activeOpacity={0.6} style={{backgroundColor:'transparent'}}
                            onPress={() => this.sendLogFile()}
                            onPressIn={() => {this.setState({onSendLog:true})}}
                            onPressOut={() => {this.setState({onSendLog:false})}}>
            <View  style={{height:36,alignItems:'flex-end',flexDirection:'row'}}>
              <Text  allowFontScaling={false}  style={[styles.dataValue,{color:onSendLog? '#006ab7':'#484848'}]}>{I18n.t('Problem Report')}</Text>
              <View style={{flex:1}}/>
              <Image style={{height:16,width:16 ,marginLeft:10,marginRight:paddingHorizontal}} resizeMode={'contain'}
                     source={onSendLog ? arrow : source} />
            </View>
          </TouchableOpacity>
          <View style={{width:width-48,height:1,marginLeft:24, marginTop:6, marginBottom:Platform.select({ios:30,android:0}),backgroundColor: onSendLog ? '#006AB7' : '#dcdcdc'}}/>
        </ScrollView>

        <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
        <RNUpdate ref={r=>global.$RNUpdate = r}/>
        <Spinner visible={this.state.loading} textContent={I18n.t('Loading')} textStyle={{color:'#ffffff',fontSize:14,marginTop:-50}}/>
        <ModalCenter ref={c => this.modalClear = c} title={I18n.t('Clear Cache')} description={I18n.t('Clear Cache prompt')}
                      confirm={() => this.clearCache()}/>
      </View>
      )
  }
}

const smallStyles = StyleSheet.create({
  dataValue: {
    backgroundColor:'transparent',
    fontSize:16,
    marginTop:3,
      marginLeft:24,
    justifyContent:'center',
    alignItems:'center',
  },
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
    color:VALUES.COLORMAP.white
  },
  forgetPwdText: {
    textDecorationLine:'underline',
    paddingTop:2,
    paddingBottom:4,
    marginLeft:20,
    fontSize:12,
    alignItems:'center',
    color:VALUES.COLORMAP.white
  },
});

const largeStyles = StyleSheet.create({
  dataValue: {
    backgroundColor:'transparent',
    fontSize:16,
    marginTop:3,
      marginLeft:24,
    justifyContent:'center',
    alignItems:'center',
    color:'#484848'},
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
