import React from 'react';
import {HttpUtil} from "../../framework";
import { DeviceEventEmitter} from 'react-native';

export default class CcmAPI{
  static CCM_URL = ""
  static TOKEN= null;
  static USER_ID = null;
  static ACCOUNT_ID = null;
  static init(url){
      this.CCM_URL = url;
  }
  static setToken(token,userId,accId,nav){
      this.TOKEN = token;
      this.USER_ID = userId;
      this.ACCOUNT_ID = accId;
      if(nav){
        this.NAVIATION = nav
        this.listener  = DeviceEventEmitter.addListener("NETWORK_FAIL", async(event)=>{
          console.log("NetworkFail")
          if(this.NAVIATION){
            this.NAVIATION.replace('Login',{networkfail:true})
            this.NAVIATION = null
          }

        })
      }
      //console.log("SetToken=",this.TOKEN ,this.USER_ID,this.ACCOUNT_ID )
  }
  static setAccount(accId){
      this.ACCOUNT_ID = accId;
      //console.log("SetToken=",this.TOKEN ,this.USER_ID,this.ACCOUNT_ID )
  }
  static async postRequestAsync(api,data){
    if(!data){
      data = {}
    }


      if(this.TOKEN){
        data.token = this.TOKEN;
      }
      if(this.USER_ID){
        data.user_id = this.USER_ID;
      }
    if( api !='user/changeacc'){
      if(this.ACCOUNT_ID ){
        data.acc_id = this.ACCOUNT_ID;
      }
    }

    let res =  HttpUtil.postAsync(this.CCM_URL+api,data)
    return res;
  }


  static async redirect(token,user_id,acc_id){
        console.log({token,user_id,acc_id})
        return this.postRequestAsync('account/redirect', {token,user_id,acc_id});
  }
  static async getBranchList(){
        return this.postRequestAsync('branch/list', {});
  }
  static async getUserInfo(){
      return this.postRequestAsync('user/info');
  }
  static async changeAccountId(acc_id){
      return this.postRequestAsync('user/changeacc',{acc_id});
  }

  static async getMonitorModuleList(branch_id){
      return this.postRequestAsync('monitor_module/list',{branch_id});
  }
  static async getBriefAlertRecords(data){
      return this.postRequestAsync('alert_record/brief_list',data);
  }
  static async getUserDepartmentDefineList(){
      return this.postRequestAsync('define/list',{"define_object":"user","define_usage":"department"});
  }
  static async getUserPositionDefineList(){
      return this.postRequestAsync('define/list',{"define_object":"user","define_usage":"position"});
  }
  static async getAlertRuleList(){
      return this.postRequestAsync('rule_template/alert/list',{});
  }
  static async getMonitorRuleList(){
      return this.postRequestAsync('rule_template/monitor/list',{});
  }
  static async getAlertInfo(alert_id){
      return this.postRequestAsync('alert_record/info',{alert_id});
  }
  static async addAlertCause(alert_id,content_type,content){
      return this.postRequestAsync('alert_record/add',{alert_id,content_type,content});
  }
  static async getSensorList(branch_id){
      return this.postRequestAsync('sensor/list',{branch_id});
  }
  static async getGatewayList(branch_id){
      return this.postRequestAsync('gateway/list',{branch_id});
  }
  static async getDataRetrive(target_id,start,end){
      return this.postRequestAsync('data/retrieve',{
        retrieve_type:'monitor_module',target_id,period:[start,end]});
  }


}
