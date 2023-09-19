import React from 'react';
import {HttpUtil} from "../../framework";
import md5 from "react-native-md5";

export default class MainAPI{
  static MAIN_URL = ""
  static TOKEN= null;
  static USER_ID = null;
  static init(url){
      this.MAIN_URL = url;
  }
  static setToken(token,userId){
      this.TOKEN = token;
      this.USER_ID = userId;
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
    console.log(this.TOKEN,this.USER_ID)
    console.log(this.MAIN_URL+api)
    console.log(data)
    return HttpUtil.postAsync(this.MAIN_URL+api,data)
  }
  static async loginRequest(email,password,app_client_id){
      let md5pwd  = md5.hex_md5( password );
      let body = {email,password:md5pwd,app_client_id}
      body.app_sec={
          package:"storevue",
          type:"app",
          app_secret:"q8r4a3bfWVFOff7MOef53k6EnXJm67"
      };
      return this.postRequestAsync('login', body);
  }
  static async isLogin(token){
      let body = {token}
      return this.postRequestAsync('islogin', body);
  }
  static async logoutRequest(){
      return this.postRequestAsync('logout');
  }
  static async getServerInfo(){
      return this.postRequestAsync('server/info');
  }

  static async getUserInfo(){
      return this.postRequestAsync('user/info');
  }
  static async getAccountList(){
      return this.postRequestAsync('user/accountlist');
  }

  static async getStoreList(){
      return this.postRequestAsync('store/list');
  }

  static async addDeviceTo(data){
      return this.postRequestAsync('device/add_to',data);
  }

  static async updateDevice(data){
      return this.postRequestAsync('device/update',data);
  }

  static async deleteDevice(data){
      return this.postRequestAsync('device/delete',data);
  }
  static async changeAccountId(acc_id){
      return this.postRequestAsync('user/changeacc',{acc_id});
  }
  static async forgetpwd(email){
      return this.postRequestAsync('user/forgetpwd',{email});
  }
  static async changePwd(new_password){
      let md5pwd  = md5.hex_md5( new_password);
      return this.postRequestAsync('user/changepwd',{new_password:md5pwd});
  }
  static async getEventList(data){
      return this.postRequestAsync('event/list',data);
  }
  static async addDeviceToyy(data){
      return this.postRequestAsync('device/add_to',data);
  }


}
