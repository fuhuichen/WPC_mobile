import messaging from "@react-native-firebase/messaging";
import app from "@react-native-firebase/app";
import * as lib from '../common/PositionLib';
import HttpUtil from "./HttpUtil";
import StoreUtil from "./StoreUtil";
import {changeAccountId} from "../common/FetchRequest";
import RNRestart from 'react-native-restart'
import store from "../../mobx/Store";
import * as simpleStore from "react-native-simple-store";

export default class FcmUtil{
    static init = async () => {
      try {
        this.accountId = '';
        console.log("FcmUtil init")
        const authStatus = await messaging().requestPermission({ provisional: true});
        console.log("authStatus : ", authStatus)
        const enabled =
           authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
           authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
         if (enabled) {
           console.log('Authorization status:', authStatus);
         }
  
        console.log("registerDeviceForRemoteMessages");
  
        await messaging().registerDeviceForRemoteMessages();
        messaging().onNotificationOpenedApp(async(remoteMessage) => {
          console.log("onNotificationOpenedApp remoteMessage : ", JSON.stringify(remoteMessage));
          console.log('*********************** open app message:  '+ JSON.stringify(remoteMessage.data));
          this.saveMessage(JSON.parse(remoteMessage.data.info));
          let message = JSON.parse(remoteMessage.data.info);
          if(message && message.accountId && store.userSelector.accountId != message.accountId) {
            let res = await simpleStore.get('LoginScreen');
            if (res != null) {
              let login = JSON.parse(res);
              login.accountId = message.accountId;
              simpleStore.save('LoginScreen',JSON.stringify(login));
            }
            let result = await changeAccountId(message.accountId);
            if(result.errCode === store.enumSelector.errorType.SUCCESS){
              RNRestart.Restart();
            }
          }
        });
        messaging().onMessage(async(remoteMessage) => {
          console.log("onMessage remoteMessage : ", JSON.stringify(remoteMessage));
          console.log('*********************** front message:  '+ JSON.stringify(remoteMessage.data));
          this.saveMessage(JSON.parse(remoteMessage.data.info));
        });
        messaging().setBackgroundMessageHandler(async(remoteMessage) => {
          console.log("FcmUtil setBackgroundMessageHandler remoteMessage : ", JSON.stringify(remoteMessage));
          console.log('*********************** back message:  '+ JSON.stringify(remoteMessage.data));
          this.saveMessage(JSON.parse(remoteMessage.data.info));
        });
        messaging()
            .getInitialNotification()
            .then(async(remoteMessage) => {
              if (remoteMessage) {
                console.log("FcmUtil getInitialNotification remoteMessage : ", JSON.stringify(remoteMessage));
                console.log('*********************** message:  '+ JSON.stringify(remoteMessage.data));
                this.saveMessage(JSON.parse(remoteMessage.data.info));
              }
            });
      }
      catch(e) {
        console.log("FcmUtil e : ", e);
      }
    };

    static getFCMToken = async () => {
      try {
        // await Firebase.initializeApp();
        const token = await messaging().getToken();
        console.log("FCM Token", token);
        return token;

      } catch (e) {
        console.log(e);
        return null;

      }
    };

    static register = async () => {
      try {
        let fcm_token = await this.getFCMToken();
        if(fcm_token != null && fcm_token !== ''){
          let platform = lib.isAndroid() ? 0 : 1;
          console.log("fcm register")
          HttpUtil.post(`notify/register?registrationId=${fcm_token}&platform=${platform}`)
              .then(result => {
                  this.initialize = true;
              })
              .catch(error=>{
                console.log("register erro : ", error);
              })
        }
      } catch (e) {
        console.log(e);
      }
    }

    static saveMessage(message){
      if (message != null){
          try{
              console.log('*********************** receive:  '+ JSON.stringify(message));
              this.accountId = message.accountId;
              let saveList = [];
              let messageId = [];
              messageId.push(message.messageId);
              let find = StoreUtil.getMessageId(message.messageId);
              if (find.length === 0){
                  message.read = false;
                  saveList.push(message);
              }
              if (saveList.length > 0){
                  StoreUtil.save(saveList);
              }
              if (messageId.length > 0){
                  let request = {};
                  request.messageIds = messageId;
                  HttpUtil.post('notify/ack',request);
              }
          }
          catch (e) {
              console.log(e.message);
          }
      }
    }

    static getAccountId() {
      return this.accountId;
    }

}
