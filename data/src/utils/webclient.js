import RestClient from 'react-native-rest-client';
import { Platform, StyleSheet,AsyncStorage } from 'react-native';
import * as actions from '../actions';
import {connect} from 'react-redux';
import RNFetchBlob from 'rn-fetch-blob'
import md5 from "react-native-md5";
import {Environment} from '../../../environments/Environment';
global.gUrl = Environment.USHOP_URL;

export default class UshopRestClient extends RestClient {
  constructor (url) {
    // Initialize with your base URL
    super('https://sys.ecretail.com.tw/');
    if( url )global.gUrl= url ;
    this.url = global.gUrl
    //console.log(this.url)
  }

  _loadInitialState = async () => {
    try {
      let value = await AsyncStorage.getItem('privatecloud');
      if(value){
        var setting=JSON.parse(value);
        //console.log(setting);
        if(setting.enable) {
          this.url = setting.ip
        }
      }
    }
    catch (error) {
    }
  };

  // Now you can write your own methods easily
  login (email, password) {
    console.log('Login:'+email+", "+password)
    var md5pwd ;
    if(VALUES.APPTYPE=='Master'){
      md5pwd  = md5.hex_md5( password );
    }
    else{
      md5pwd  =  password ;
    }
    console.log(md5pwd)
    // Returns a Promise with the response.
    //return this.POST('/api/login', { email, password });
    return this.callAPI('/api/login', { email, password:md5pwd });
  }

  widgetList(req){
    return this.callAPI('/api/widget/list', req);
  }

  changePwd(token,user_id,pwd){
    var new_password = md5.hex_md5( pwd );
    return this.callAPI('/api/user/changepwd',{token,user_id,new_password});
  }

  widgetData(dataSource) {
  //  console.log(JSON.stringify(dataSource))
    for(var k in dataSource.data_source.source){
      var source = dataSource.data_source.source[k];
      if(source.preprocess_type!='hot_area'){
        for(var j in source.sources){
          if(source.sources[j].sensors != null){
              delete source.sources[j].sensors;
          }
          //source.sources[j].sensors=  [];
        }
      }
    }
    //console.log("widgetData : ", JSON.stringify(dataSource));
    return this.callAPI('/api/widget/data', dataSource);
    //return this.POST('/api/widget/data', dataSource);
  }

  getUserInfo(dataSource) {
    return this.callAPI('/api/user/info', dataSource);
    //return this.POST('/api/widget/data', dataSource);
  }

  getAccountList(token) {
    return this.callAPI('/api/user/accountlist', {token});
  }

  changeAccount(token,acc_id) {
    return this.callAPI('/api/user/changeacc', {token,acc_id});
  }

  getDefineInfo(dataSource){
    return this.callAPI('/api/define/list', dataSource);
  }

  getStoreList(dataSource) {
    //console.log("getStoreList data : " + JSON.stringify(dataSource));
    return this.callAPI('/api/store/list', dataSource);
    //return this.POST('/api/widget/data', dataSource);
  }

  getStoreExt(dataSource) {
    //console.log("getStoreList data : " + JSON.stringify(dataSource));
    return this.callAPI('/api/store/list', dataSource);
    //return this.POST('/api/widget/data', dataSource);
  }

  getTagList(req) {
    //console.log("getTagList : ", JSON.stringify(req));
    return this.callAPI('/api/tag/list', req);
  }

  addTag(req) {
    return this.callAPI('/api/tag/add', req);
  }

  deleteTag(req) {
    return this.callAPI('/api/tag/delete', req);
  }

  updateUserInfo(req){
    return this.callAPI('/api/user/update', req);
  }

  forgetPassword(email){
    return this.callAPI('/api/user/forgetpwd', {email})
  }

  updateStore(req){
    return this.callAPI('/api/store/update', req);
  }

　createListPropertyReq(type,token,store_id,range,date){
    var req ={
      store_id, token, range, type:type,date:date
    }
    return req;
  }

  createDeletePropertyRequest(token,property_id){
    req = {
       property_id, token
    }
    return req;
  }

  createPropertyReq(type,token,store_id,property_id,date,range,data){
    var req;
    if(property_id ){
      req ={
        token:token,
        property:{
          property_id:property_id,
          store_id:store_id,
          date :date,
          range:range,
          data:data,
          type:type
        }
      }
    } else {
      req ={
        token:token,
        store_id:store_id,
        date :date,
        range:range,
        data:data,
        type:type
      }
    }
    return req;
  }

  createAddBusinessReq(token,store_id,date,day_index,range, start,end,old_data){
    var day_range = [];
    var property_id ;
    day_range.push(start)
    day_range.push(end)
    var data =[] ;
    if(old_data) {
      property_id = old_data.property_id
    }
    if(old_data && day_index != 0 ) {
      data = JSON.parse(JSON.stringify(old_data.data));
      var find = false
      for(var k in data){
        if( data[k].index == day_index){
          find = true
          data[k].from_to =  day_range;
        }
      }
      if( !find){
        data.push( { index:day_index, from_to:day_range})
      }
    } else {
      if( day_index == 0 ){
        data.push( { index:0, from_to:day_range})
      } else {
        data.push({ index:day_index, from_to:day_range})
        //data.push( { index:0, from_to:[0,0]})
      }
    }
    var dates = [];dates.push(date)
    var req;
    if(old_data){
      req ={
        token:token,
        property:{
          property_id:property_id,
          store_id:store_id,
          date :dates,
          range:range,
          data:data,
          type:'business_hour'
        }
      }
    } else {
      req ={
        token:token,
        store_id:store_id,
        date :dates,
        range:range,
        data:data,
        type:'business_hour'
      }
    }
    return req;
  }

  createAddStaffNumReq(token,store_id,date,day_index,range, staff,old_data){
    var property_id ;
    var zero_staff = [];
    for(var i=0;i<24;i++){
      zero_staff.push(0)
    }
    var data =[] ;
    if( old_data){
       property_id = old_data.property_id
    }
    if(old_data && day_index != 0 ) {
      data = JSON.parse(JSON.stringify(old_data.data));
      var find = false
      for(var k in data){
         if( data[k].index == day_index){
            find = true
            data[k].each_hour = staff;
         }
      }
      if( !find){
        data.push( { index:day_index, each_hour:staff });
      }
    } else {
      if( day_index == 0 ) {
        data.push( { index:0, each_hour:staff})
      } else {
        data.push({ index:day_index, each_hour:staff });
        data.push({ index:0, each_hour:zero_staff });
      }
    }
    var dates = [];dates.push(date);
    var req;
    if(old_data){
      req ={
        token:token,
        property:{
          property_id:property_id,
          store_id:store_id,
          date :dates,
          range:range,
          data:data,
          type:'staff_num'
        }
      }
    } else {
      req ={
        token:token,
        store_id:store_id,
        date :dates,
        range:range,
        data:data,
        type:'staff_num'
      }
    }
    return req;
  }

  addProperty(req){
      return this.callAPI('/api/store/property/add', req);
  }

  deleteProperty(req){
      return this.callAPI('/api/store/property/delete', req);
  }

  listProperty(req){
    console.log('*req:',req)
      return this.callAPI('/api/store/property/list', req);
  }

  updateProperty(req){
      return this.callAPI('/api/store/property/update', req);
  }

  getAccountInfo(req){
      return this.callAPI('/api/account/info', req);
  }
  /*
  callAPI( api, dataSource){
    //console.log('api=' + this.url);
    if (Platform.OS === 'ios'){
      return  fetch(this.url + api, {
              method: 'post',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(dataSource),
           }).then(response => response.json());

    }
    else{
    return  pinch.fetch(this.url + api, {
            method: 'post',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataSource),
            timeoutInterval: 30000,
            sslPinning: {
                cert: 'my'
              }
         }).then(response => JSON.parse(response.bodyString));;
    }
  }
  */
  callAPI( api, dataSource){
    //console.log("webclient url,",this.url);
    //console.log("api,",api);
    //console.log("dataSource,",dataSource);
    return RNFetchBlob.config({
    timeout:30000,
    trusty : true
  }).fetch('POST', this.url + api, {
    'Accept': 'application/json',
    'Content-Type' : 'application/json',
  },JSON.stringify(dataSource)).then((res)  =>{return res.json()})

  }

};
