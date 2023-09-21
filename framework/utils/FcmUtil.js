
import messaging from "@react-native-firebase/messaging";
import app from "@react-native-firebase/app";
import StorageUtil from './StorageUtil'
import StoreUtil from './StoreUtil'
import moment from 'moment'
export default class FcmUtil{
    static nav = null;
    static toPage =null;
    static notifing = false;
    static add  = async(item)=>{
        console.log("Add ItemXXXXX")
        //console.log(item)
        let  list=[];
        let  ts = parseInt(item.data.ts);
        console.log("Get TEST="+ts  +  "  " + new Date(ts))
        let  date = moment ( new Date(ts)).format("YYYY-MM-DD HH:mm:ss")
        let stores  = JSON.parse(item.data.stores)
        list.push({
             acc_id:item.data.acc_id,
             event_id:item.data.event_id,
             product_name: "Custom_iQM_ColdChain",
             service_name:item.data.service_name,
             notify: item.data.notify,
             sources:item.data.sources,
             stores:stores[0]?stores[0].id:"",
             date:date,
             ts:ts})
       console.log("Add List")
        console.log(list)
        StoreUtil.save(list)
      }
     static init = async (callback,navigation,toPage, loginDef,loginPage) => {
      await StorageUtil.setObj("OpenNotify","FALSE")
      nav = navigation;
      toPage = toPage;
      const authStatus = await messaging().requestPermission({ provisional: true});
      const enabled =
         authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
         authStatus === messaging.AuthorizationStatus.PROVISIONAL;

       if (enabled) {
         console.log('Authorization status:', authStatus);
       }

      console.log("registerDeviceForRemoteMessages")

      await messaging().registerDeviceForRemoteMessages();
      messaging().onNotificationOpenedApp(async(remoteMessage) => {
        //this.add(remoteMessage)
        console.log("onNotificationOpenedApp")
        let isOpen = await StorageUtil.getObj("OpenNotify")
        console.log(
          'Notification caused app to open from background state:'+isOpen
        );
        if(isOpen == "TRUE" || this.notifing )return ;
        this.notifing = true;
        await StorageUtil.setObj("OpenNotify","TRUE")
        let loginInfo = await StorageUtil.getObj(loginDef)
        if(nav  && loginInfo&& loginInfo.accountId != remoteMessage.data.acc_id ){
            nav.replace(loginPage,{notify:remoteMessage})
        }
        else if(nav){
           console.log("TO Page " +toPage)
           let state = nav.getState();
          // console.log(JSON.stringify(state))
           if(state.routes[0].name == 'Login'){
             callback(remoteMessage)
           }
           else{
             console.log(remoteMessage)
             console.log("TO find notification")
             for(var k in state.routes){
               console.log(state.routes[k].name)
               if(state.routes[k].name == "Notification"){
                 console.log("FInd Notification "+k)
                 console.log(" Need to psop="+(state.routes.length-parseInt(k)))
                 nav.pop(state.routes.length-parseInt(k))
                 break;
                 //console.log("Find NOtifcation="+k + " Need to psop="+state.routes.length-k);

               }
             }
             nav.push(toPage,{notify:remoteMessage})
           }
           //
         }
         this.notifing = false;
       });

    // Check whether an initial notification is available
        messaging()
            .getInitialNotification()
            .then(async(remoteMessage) => {
              if (remoteMessage) {
                //this.add(remoteMessage)
                if(!nav  )return ;
                this.notifing = true;
                await StorageUtil.setObj("OpenNotify","TRUE")
                let state = nav.getState();
               // console.log(JSON.stringify(state))
                if(state.routes[0].name == 'Login'){
                  callback(remoteMessage)
                }
                this.notifing = false;
              }
            });
    };
    static getFCMToken = async () => {
      try {
        // await Firebase.initializeApp();
        console.log("Get FCM Token")
        const token = await messaging().getToken();
        console.log(token);
        return token;

      } catch (e) {
        console.log(e);
        return null;

      }
    };

}
