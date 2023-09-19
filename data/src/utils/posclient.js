import RestClient from 'react-native-rest-client';
import { Platform, StyleSheet,AsyncStorage } from 'react-native';
import * as actions from '../actions';
import {connect} from 'react-redux';
import RNFetchBlob from 'rn-fetch-blob'
import md5 from "react-native-md5";
import {Environment} from '../../../environments/Environment';
global.gPostUrl = Environment.POST_URL;

export default class PosRestClient extends RestClient {
  constructor (url) {
    super('http://pos.ushop-plus.com/');
    //if( url )global.gPostUrl= url ;
    this.url = global.gPostUrl
  }

  getItemData(account_id,token,rks,period,unit){
    if(unit == 'wd')unit = 'dd'
    //console.log('getitemData',JSON.stringify({account_id,token,rks,period,unit}))
    return this.callAPI('/api/pos/query', {account_id,token:{token},rks,period,unit});
  }

  getPosData(account_id,token,rk,period){
    console.log({account_id,token:{token},rk,period})
    return this.callAPI('/api/pos/export', {account_id,token:{token},rk,period});
  }

  updatePosData(account_id,token,rk,period,unit,content){
    console.log(JSON.stringify({data_type:"upload",account_id,token:{token},rk,unit,content}))
    return this.callAPI('/api/pos/upload', {data_type:"upload",account_id,token:{token},rk,unit,content});
  }

  queryReturnData(account_id,token,access_key,frsid,date,period, unit){
    console.log('/api/return/query')
    console.log(JSON.stringify({account_id,token:{token},frsid,date,period, unit}))
    return this.callAPI('/api/return/query',
    {account_id,token:{token},frsid,date,period, unit});
  }
  /*
  "frsid": ["EwAU5Xn5cE"],
"date": ["2019/12/01", "2019/12/31"],
"unit": "dd",
"period": "7D",
"account_id": "advantech",
"access_key": "IuYDpkX8qJbLiqtl",
"token":{token}
 */


  callAPI( api, dataSource){
    //console.log("posclient url,",this.url);
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
