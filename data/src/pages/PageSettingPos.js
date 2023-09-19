import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import DialogHandler from '../utils/DialogHandler'
import {Dimensions, Keyboard, Platform, ScrollView, StyleSheet, View,DeviceEventEmitter} from 'react-native';
import UTitleBarText from '../components/UTitleBar'
import PosRestClient from '../utils/posclient'
import SettingInput from '../components/SettingInputEx'
import SettingSelect from '../components/SettingSelectEx'
import DataHandler from '../utils/DataHandler'
import moment from 'moment'
import Spinner from '../components/Spinner';

import {inject, observer} from 'mobx-react'
import {Actions} from "react-native-router-flux";
import DatePicker from "../../../app/thirds/datepicker/DatePicker";
import Navigation from "../../../app/element/Navigation";
import {ColorStyles} from "../../../app/common/ColorStyles";

@inject('store')
@observer
export default class PageSettingPos extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    const {smallPhone} = this.props;
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
    var d = new Date();
    var date = moment(d).format('YYYY/MM/DD');
    this.state = {loading:false,stores, storeIndex,styles,date,
        amount: '0',transaction:'0',count:'0'};
    //    this.getItemData( this.props.tempReportStore);
  }

  componentDidMount() {
    //DeviceEventEmitter.emit('onStatusBar', '#24293d');
  }

  componentWillUnmount() {
    //DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_BACKGROUND_BLUE);
  }

  handlePosData(data){
      if(data && data.datas && data.datas[0] && data.datas[0].retrived&&
          data.datas[0].retrived.length>0){
          var amount= data.datas[0].retrived[0].total_amount+'';
          var transaction= data.datas[0].retrived[0].transaction_count +'';
          var count= data.datas[0].retrived[0].item_count +'';

          this.setState({amount,transaction,count})

      }
  }
  getItemData(tempReportStore){
    console.log('getItemData')
    const api = new PosRestClient();
    const {token,userInfo} = this.props;
    var promises = [];
    api.getItemData(userInfo.acc_id,token,[tempReportStore.register_key]
    ,DataHandler.ceateDatePeriod(this.state.date,'dd'),'dd').then(response => response)   // Successfully logged in
       .then(res=>{
           //console.log(res)
           this.setState(
           {
               loading: false
             }
           );
           this.handlePosData(res);
        })    // Remember your credentials
       .catch(err =>{
           console.log(err)
           this.setState(
           {
               loading: false
             }
           );
        });  // Catch any error
  }
  updatePosData(){
      console.log('getItemData')
      const api = new PosRestClient();
      const token = this.props.store.userSelector.token;
      const accountId = this.props.store.userSelector.accountId;
      const storeList = this.props.store.storeSelector.storeListBI.slice();
      const tempReportStore = storeList[this.state.storeIndex];

      var promises = [];
      var d = new Date(this.state.date)
      var content = {
          datetime:moment(d).format('YYYY-MM-DD'),
          item_count: parseInt(this.state.count),
          transaction_count: parseInt(this.state.transaction),
          total_amount: parseInt(this.state.amount),
      }
      api.updatePosData(accountId,token,tempReportStore.register_key,
          DataHandler.ceateDatePeriod(this.state.date,'dd'),'dd',[content])
      .then(response => response)   // Successfully logged in
         .then(res=>{
             console.log(res)
             this.setState(
             {
                 loading: false
               }
             );
             Actions.pop();
          })    // Remember your credentials
         .catch(err =>{
             console.log(err)
             this.setState(
             {
                 loading: false
               }
             );
          });  // Catch any error
    }

  onTextInput(){

  }

  doSave(){
    Keyboard.dismiss();
    var des = I18n.t("bi_confirm_modify")
    const screen = Dimensions.get('window')
    DialogHandler.openConfirmDialog(screen.width-100,'',des,this,{type:'next'});
  }
  onChangeStore(){
    var stores ={ index:this.state.storeIndex,list:this.state.stores}
    const screen = Dimensions.get('window')
    DialogHandler.openStoresDialog(screen.width-40,I18n.t("Select Store"),stores ,this,{type:'store'});
  }
  onNextPressed(param){
    if(param.type=='next' ){
        this.updatePosData();
        //this.doUpdateData();
    }
    else if(param.type=='store' ){
        this.setState({loading:false,amount: '0',transaction:'0',count:'0'})
        this.setState({storeIndex:param.index})
        //this.getItemData(this.props.storeList[param.index])
        //this.setState({ruleSpace:null,rent:'0',area:'0',start:0,end:0,ruleBuss:null})
    //    this.getProperty('space',this.props.storeList[param.index])
        //this.props.setTempReportStore(this.props.storeList[param.index])
    }

  }
  checkInteger(v){

    var pv = parseInt(v);
    if(pv) return pv + '';
    //console.log('check interget',v, ' ',pv)
    return '';
  }

  onDateSelected(date){
      this.setState({date:moment(date).format('YYYY/MM/DD')});
  }

  render(){
    const {styles,regionList,stores,storeIndex,date} = this.state;
    const smallPhone= this.props.store.phoneSelector.smallPhone;
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
                    title={I18n.t("bi_pos_data_input")}
                    rightButtonTitle={I18n.t('Save')}
                    onRightButtonPress={()=>{this.doSave()}}
          />
          <ScrollView>
          <SettingSelect title={I18n.t("Select Store")} unit={''}
             onPress={()=>this.onChangeStore()}
              value={stores[storeIndex].name}/>
                <SettingSelect title={I18n.t("bi_date_selection")} unit={''}
                   time={true}
                    onPress={()=>{this.refs.datePicker.open(new Date(this.state.date))}}
                    value={date}/>
                            <SettingInput title={I18n.t("bi_total_sale")} unit={''}
                               keyboardType={'numeric'}
                               onTextInput={(v)=>this.onTextInput({v})}
                               onChangeText={(amount)=>this.setState({amount:this.checkInteger(amount)})}
                                value={this.state.amount}/>
                                <SettingInput title={I18n.t("bi_shopper_count")} unit={I18n.t("bi_unit_person")}
                                   keyboardType={'numeric'}
                                   onTextInput={(v)=>this.onTextInput({v})}
                                   onChangeText={(transaction)=>this.setState({transaction:this.checkInteger(transaction)})}
                                    value={this.state.transaction}/>
                                    <SettingInput title={I18n.t("bi_production_number")} unit={''}
                                       keyboardType={'numeric'}
                                       onTextInput={(v)=>this.onTextInput({v})}
                                       onChangeText={(count)=>this.setState({count:this.checkInteger(count)})}
                                        value={this.state.count}/>

          </ScrollView>
          <Spinner visible={this.state.loading} />
          <DatePicker ref={"datePicker"} mode={true} initDate={new Date(this.state.date)} onSelected={(date)=>this.onDateSelected(date)}/>
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
