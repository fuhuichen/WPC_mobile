import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import UshopRestClient from '../utils/webclient'
import DialogHandler from '../utils/DialogHandler'
import {Dimensions, Keyboard, Platform, ScrollView, StyleSheet, Text, View,DeviceEventEmitter} from 'react-native';
import UTitleBarText from '../components/UTitleBar'
import SettingInput from '../components/SettingInputEx'
import SettingSelect from '../components/SettingSelectEx'
import moment from 'moment'
import Spinner from '../components/Spinner';
import {Actions} from 'react-native-router-flux';
import {inject, observer} from 'mobx-react'
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
export default class PageSettingStore extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    var styles;
    if(smallPhone) {
      styles = smallStyles;
    } else {
      styles = largeStyles;
    }
    var stores = [];
    var storeIndex=-1;
    let storeList = this.props.store.storeSelector.storeListBI.slice();
    console.log("**storeList:",tempReportStore );
    let tempReportStore = this.props.store.storeSelector.tempReportStoreBI;
    console.log("**tempReportStore:",tempReportStore );
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
    this.state = {loading:false,stores, storeIndex,styles,rent:'0',area:'0',start:0,end:23,ruleSpace:null,ruleBuss:null};
    this.getProperty('space',tempReportStore)
    this.getProperty('business_hour',tempReportStore)
  }

  componentDidMount() {
    //DeviceEventEmitter.emit('onStatusBar', '#24293d');
  }

  componentWillUnmount() {
    //DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_BACKGROUND_BLUE);
  }

  getProperty(type,tempReportStore){
    this.setState({loading:true});
    const token = this.props.store.userSelector.token;
    const api = new UshopRestClient();
   // var dateContent = moment(new Date()).format('YYYY/MM/DD');
    var d = new Date();
    var   dateContent = moment(d).format('YYYY/MM/DD');
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
    this.setState({loading: false});
    if(response.propertys.length>0) {
      response.propertys =  response.propertys.sort((a,b)=>sortNumber(a,b,'date[0]',1));
      if( response.propertys[response.propertys.length-1].type  == 'space') {
        this.setState({
          loading: false,
          ruleSpace: response.propertys[response.propertys.length-1],
          rent: response.propertys[response.propertys.length-1].data.rent,
          area: response.propertys[response.propertys.length-1].data.area
        });
      }
      else if( response.propertys[response.propertys.length-1].type  == 'business_hour') {
        for(var k in  response.propertys ){
          if(response.propertys[k].date[0]  =='forever'){
            console.log('FOrever businees',response.propertys[k]);
            this.setState({
              loading: false,
              ruleBuss: response.propertys[k],
              start: response.propertys[k].data[0].from_to[0],
              end: response.propertys[k].data[0].from_to[1]
            });
          }
        }
      }
    }
  }

  onTextInput(){

  }

  doSave(){
    Keyboard.dismiss();
    var des = I18n.t("bi_confirm_modify")
    const screen = Dimensions.get('window')
    DialogHandler.openConfirmDialog(screen.width-100,'',des,this,{type:'next'});
  }

  onNextPressed(param){
    if(param.type=='next') {
      //this.props.selectPage('PageSetting')
      this.doUpdateData();
    } else if(param.type=='store') {
      this.setState({storeIndex:param.index})
      this.setState({ruleSpace:null,rent:'0',area:'0',start:0,end:23,ruleBuss:null})
      this.getProperty('space',this.props.store.storeSelector.storeListBI[param.index])
      this.getProperty('business_hour',this.props.store.storeSelector.storeListBI[param.index])
      //this.props.setTempReportStore(this.props.storeList[param.index])
    }
  }

  doUpdateData(){
    const {rent,area,start,end,ruleSpace,ruleBuss} = this.state;
    const token = this.props.store.userSelector.token;
    const tempReportStore = this.props.store.storeSelector.tempReportStoreBI;
    const api = new UshopRestClient();
    var d = new Date();
    var dateContent = moment(d).format('YYYY/MM/DD');
    var promises = [];
    if(ruleSpace) {
      var data = {area, rent}
      var req = api.createPropertyReq('space',token,
                tempReportStore.store_id, ruleSpace.property_id,
                [dateContent], '',data)
        promises.push(api.updateProperty(req));
    } else {
       // var req
       // req = api.createAddBusinessReq(token,tempReportStore.store_id,
      //      dateContent, 0, 'mm', 1 ,9 , null)
      var data = {area, rent}
      var req = api.createPropertyReq('space',token,
                tempReportStore.store_id, null,
                [dateContent], '',data)
      //console.log(req)
      promises.push(api.addProperty(req));
    }
    this.promiseRequests(promises)
  }

  promiseRequests(promises){
    var handle = function(results){
      this.handleResults(results)
    }.bind(this)
    Promise.all(promises)
     .then(function(data){
       handle(data)})
     .catch(function(err){
        console.log(err)
      //this.setState({loading:false})
     });
  }

  handleResults(results){
    console.log(results)
    Actions.pop();
  }

  checkInteger(v){
    var pv = parseInt(v);
    if(pv) return pv + '';
    //console.log('check interget',v, ' ',pv)
    return '';
  }

  onChangeStore(){
    var stores ={ index:this.state.storeIndex,list:this.state.stores}
    const screen = Dimensions.get('window')
    DialogHandler.openStoresDialog(screen.width-40,I18n.t("Select Store"),stores ,this,{type:'store'});
  }

  weekArrayToString(array){
    var output ='';
    for(var k in array) {
      if(output.length>0) {
        output = output + ','
      }
      if(k==5) {
        output = output + '\n'
      }
      switch(array[k]) {
        case 1:
           output = output + I18n.t('Mon');
           break;
        case 2:
           output = output + I18n.t('Tue');
           break;
        case 3:
           output = output + I18n.t('Wed');
           break;
        case 4:
            output = output + I18n.t('Thur');
            break;
        case 5:
            output = output + I18n.t('Fri');
            break;
        case 6:
            output = output + I18n.t('Sat');
            break;
        default:
            output = output + I18n.t('Sun');
            break;
      }
    }
    return output;
  }

  renderBusiness(){
    const {ruleBuss} = this.state;
    const screen = Dimensions.get('window')
    var arrayBusiness =[];
    var arrayVocation =[];
    var start=0;
    var end=0;
    var range=''
    if(ruleBuss) {
      if(ruleBuss.data.length>0) {
        start=ruleBuss.data[0].from_to[0];
        end=ruleBuss.data[0].from_to[1];
        range=start +':00 - '+end+':00'
      }
      for(var n in ruleBuss.data) {
        arrayBusiness.push(parseInt(ruleBuss.data[n].index));
      }
      for(var k=1;k<8;k++){
        if( arrayBusiness.indexOf(k)<0 ) {
          arrayVocation.push(k);
        }
      }
      return <View style={{margin:4, marginTop:10, paddingLeft:10,paddingRight:10,marginLeft:5,marginRight:5, backgroundColor:'#ebf1f4',paddingTop:20,paddingBottom:20,borderRadius:10}}>
                {arrayBusiness.length>0?<View style={{ marginLeft:10, marginRight:10, flexDirection:'row', alignItems:'flex-start' }}>
              <Text allowFontScaling={false} style={{width:screen.width*0.6-30, color:'#404554',fontSize:14}}>
                {this.weekArrayToString(arrayBusiness)}
              </Text>
              <View style={{flex:1}}/>
              <Text allowFontScaling={false} style={{marginLeft:14, color:'#404554',fontSize:14}}>
                {range}
              </Text>
              </View>:null}
              { arrayVocation.length>0 ? <View style={{ marginTop:20, marginLeft:10, marginRight:10, flexDirection:'row', alignItems:'flex-start' }}>
              <Text allowFontScaling={false} style={{ width: screen.width*0.6-30, color:'#404554',fontSize:14 }}>
                {this.weekArrayToString(arrayVocation)}
              </Text>
              <View style={{flex:1}}/>
              <Text allowFontScaling={false} style={{ marginLeft:14, color:'#404554',fontSize:14 }}>
                {I18n.t("bi_takeoff")}
              </Text>
              </View> : null }
            </View>
    } else {
      return <View style={{margin:4,marginTop:10,
            paddingLeft:10,paddingRight:10,marginLeft:5,marginRight:5,
            backgroundColor:'#ebf1f4',paddingTop:20,paddingBottom:20,borderRadius:10}}>
            <Text allowFontScaling={false} style={{width:screen.width*0.6, color:'#404554',fontSize:14}}>
              {I18n.t("bi_active_time_not_setup")}
            </Text>
          </View>
    }
  }

  render(){
    const {styles,regionList,stores,storeIndex} = this.state;
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
      <View style={{paddingTop:0,
        backgroundColor:VALUES.COLORMAP.dkk_background,
        height:screen.height,width:screen.width}}>
         <Navigation
                    onLeftButtonPress={()=>Actions.pop()}
                    title={I18n.t("bi_store_info")}
                    rightButtonTitle={I18n.t('Save')}
                    onRightButtonPress={()=>{this.doSave()}}
          />
          <ScrollView style={{marginBottom:50,paddingRight:10}}>
                <SettingSelect title={I18n.t("Select Store")} unit={''}
                            onPress={()=>this.onChangeStore()}
                              value={stores[storeIndex].name}/>
                              <SettingInput title={I18n.t("bi_store_rent")} unit={''}
                               keyboardType={'numeric'}
                                onTextInput={(v)=>this.onTextInput({v})}
                                onChangeText={(rent)=>this.setState({rent:this.checkInteger(rent)})}
                                value={this.state.rent}/>
                                <SettingInput
                                   keyboardType={'numeric'}
                                   title={I18n.t("bi_store_area")}
                                   unit={I18n.t("bi_mxm")}
                                   onTextInput={(v)=>this.onTextInput({v})}
                                   onChangeText={(area)=>this.setState({area:this.checkInteger(area)})}
                                    value={this.state.area}/>
                <View style={{marginBottom:50,paddingLeft:10}}>
                 <Text allowFontScaling={false}
                                      style={{marginLeft:10,marginTop:10,
                                        color:'#666666',fontSize:12}}>
                                        {I18n.t("bi_active_time")}</Text>
                                        {this.renderBusiness()}
                </View>
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
