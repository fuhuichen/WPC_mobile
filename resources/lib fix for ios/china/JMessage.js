/**
 * JPush message manager.
 */
import {Platform,DeviceEventEmitter,AppState} from 'react-native';
import HttpUtil from "../utils/HttpUtil";
import {Actions} from "react-native-router-flux";
import UserPojo from "../entities/UserPojo";
import * as lib from '../common/PositionLib';
import StoreUtil from "../utils/StoreUtil";
//import JPush from 'jpush-react-native';
import RouteMgr from "./RouteMgr";

export default class JMessage{
    static messages = [];
    static NOTIFICATION_ARRIVED = "notificationArrived";
    static globalInitFlag = false;
    static chinaInitFlag = false;

    static appActive = true;

    static close(){

    }

    static async register(){
        /*JPush.getRegistrationID(res => {
            if(res != null && res.registerID != null){
                console.log('*********************** regesiterID:  '+ res.registerID);
                this.registerToken(res.registerID);
            }
        });*/
    }

    static async init(){
        /*if(!this.chinaInitFlag){
            JPush.init();

            AppState.addEventListener('change', (nextAppState) => {
                this.appActive = (nextAppState === 'active');
                this.appActive && JPush.clearAllNotifications();
                JPush.setSoundAndVibrate(false, !this.appActive);
            });

            JPush.addCustomMessagegListener((custom)=>{
               console.log('*********************** custom:  '+ JSON.stringify(custom));
               if(custom != null){
                   try {
                       let info = JSON.parse(custom.content);
                       this.addMessages(info);
                   }
                   catch (e) {
                   }
               }
           });
           JPush.addNotificationListener((notify)=>{
               console.log('*********************** notify:  '+ JSON.stringify(notify));
               if (notify != null && notify.notificationEventType === this.NOTIFICATION_ARRIVED){
                   this.appActive && JPush.clearAllNotifications();
               }

               if( notify != null && notify.notificationEventType !== this.NOTIFICATION_ARRIVED){
                   JPush.clearAllNotifications();
               }
           });
           this.chinaInitFlag = true;
         }*/
    }

    static addMessages(message){
        if(message != null && this.messages.length < 1000){
            this.messages.push(message);
            this.getMessage();
        }
    }

    static notifications(extraInfo){
        try {
            if(Actions.currentScene === 'loginScreen'){
                return;
            }

            if(Actions.currentScene === 'forgetPwd'){
                Actions.reset('loginScreen');
                return;
            }

            RouteMgr.setMessage(extraInfo);

            this.clearNotification();

            if((RouteMgr.getMessageType() == RouteMgr.visitorType) &&
                UserPojo.getAccountId() !== JSON.parse(extraInfo).accountId){
                return;
            }

            if (!RouteMgr.getActive()) {
                RouteMgr.setActive(true, true);
                return;
            }

            if((RouteMgr.getMessageType() == RouteMgr.visitorType)
                && RouteMgr.isVisitScreen()){
                DeviceEventEmitter.emit('onRefreshCustomer',
                    {storeId: JSON.parse(JSON.parse(extraInfo).content)[0].storeId});
                return;
            }

            if((RouteMgr.getMessageType() != RouteMgr.visitorType)
                && RouteMgr.isScreen('messageList')){
                return;
            }

            if(!RouteMgr.getIndicator()){
                RouteMgr.handle(false);
                DeviceEventEmitter.emit('OnMessageChange');
            }
            else {
                RouteMgr.setDialog(true);
                RouteMgr.handleEx(false);
            }
        }catch (e) {
        }
    }

    static registerToken(token){
        if(UserPojo.getToken() != null && UserPojo.getToken() !== ''){
            let platform = lib.isAndroid() ? 0 : 1;
            HttpUtil.post(`notify/register?registrationId=${token}&platform=${platform}`)
                .then(result => {
                    this.initialize = true;
                })
                .catch(error=>{
                })
        }
    }

    static router(){
        if(Actions.currentScene === 'homePage'){
            DeviceEventEmitter.emit('notification',0);
        }else{
            Actions.push('homePage');
        }
    }

    static unInit(){
        /*(async ()=>{
            await JPush.removeListener();
        })();

        AppState.removeEventListener('change', (nextAppState) =>{});*/
    }

    static getMessage(){
        let message = this.messages;
        if (message.length > 0){
            try{
                console.log('*********************** receive:  '+ JSON.stringify(message));
                let saveList = [];
                let messageId = [];
                message.forEach((item,index)=>{
                    messageId.push(item.messageId);
                    let find = StoreUtil.getMessageId(item.messageId);
                    if (find.length === 0){
                        item.read = false;
                        saveList.push(item);
                    }
                });
                if (saveList.length >0){
                    StoreUtil.save(saveList);
                    //DeviceEventEmitter.emit('onNotification',true);
                }
                if (messageId.length >0){
                    let request = {};
                    request.messageIds = messageId;
                    HttpUtil.post('notify/ack',request);
                }
            }
            catch (e) {
                console.log(e.message);
            }
        }
        this.messages = [];
        return message;
    }

    static clearNotification(){
        //JPush.clearAllNotifications();
    }
}
