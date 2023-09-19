/**
 * App route manager.
 */
import {Actions} from "react-native-router-flux";
import {
    DeviceEventEmitter,
    AsyncStorage
} from "react-native";
import {
    EMITTER_MODAL_CLOSE,
    EMITTER_PLAYER_STOP,
    EMITTER_SOUND_STOP,
    EMITTER_SUBMIT_WAIT
} from "../common/Constant";
import GlobalParam from "../common/GlobalParam";

const NOTIFY_SCREEN = 'messageList';
const NOTIFY_CUSTOMER= 'customerList';
export default class RouteMgr{
    /**
     *  App Routers.
     */
    static messageType = 0;
    static messageParam = '';
    static visitorType = 6;
    static popBackScreen = null;

    static setMessage(value){
        this.messageType = JSON.parse(value).messageType;
        if(JSON.parse(JSON.parse(value).content).length > 0)
        {
            this.messageParam = JSON.parse(JSON.parse(value).content)[0];
        }
    }

    static getMessageType(){
        return this.messageType;
    }

    static setPopbackScreen(value){
        if(value){
            this.popBackScreen == null ? (this.popBackScreen = Actions.currentScene)
                : null;
        }else{
            this.popBackScreen = null;
        }
    }
    /**
     * Message notification routes.
     */
    static active = false;
    static submitIndicator = false;
    static autoRouter = false;
    static showDialog = false;

    static VIDEO_PLAYERS = [
        'videoMonitor',
        'remoteCheck',
        'affairDetail',
        'videoPlayer',
        'createEvent'
    ];

    static setActive(value,update){
        this.active = value;
        update && this.handleEx(true);
    }

    static getActive(){
        return this.active;
    }

    static setIndicator(value){
        this.submitIndicator = value;

        if(this.submitIndicator) {
            return false;
        }

        if(this.autoRouter){
            this.messageType != this.visitorType ? this.messageRouter(false):
                this.visitRouter();
            this.autoRouter = false;
        }else{
            this.showDialog ? setTimeout(()=>{
                DeviceEventEmitter.emit('OnMessageChange');
            },300): null;
            this.showDialog = false;
        }

        return true;
    }

    static getIndicator(){
        return this.submitIndicator;
    }

    static setDialog(value){
        return this.showDialog = value;
    }

    static resetParam(){
        if(this.popBackScreen != null){
            Actions.popTo(this.popBackScreen);
            this.active = false;
            this.popBackScreen = null;
        }

        this.submitIndicator = false;
        this.autoRouter = false;
    }

    static handle(value){
        (this.VIDEO_PLAYERS.findIndex(
            p => p === Actions.currentScene) > -1
        ) && DeviceEventEmitter.emit(EMITTER_PLAYER_STOP, value);

        DeviceEventEmitter.emit(EMITTER_MODAL_CLOSE, null);
        DeviceEventEmitter.emit(EMITTER_SOUND_STOP, null);
    }

    static handleEx(auto){
        this.autoRouter = auto;

        if(this.submitIndicator){
            DeviceEventEmitter.emit(EMITTER_SUBMIT_WAIT, null);
        }else{
            this.handle(true);
            this.messageType != this.visitorType ? this.messageRouter(true)
                : this.visitRouter();
        }
    }

    static messageRouter(value){
        setTimeout(()=>{
            if(value && this.isContain(NOTIFY_SCREEN)){
                Actions.popTo(NOTIFY_SCREEN);
            }else{
                this.popBackScreen == null ? this.setPopbackScreen(true) : null;
                Actions.push(NOTIFY_SCREEN);
            }
        },300);
    }

    static isContain(screen){
        return (Actions.state.routes.findIndex(
            p => p.routeName === screen) == -1) ? false : true;
    }

    static isScreen(screen){
        return Actions.currentScene === screen;
    }

    static getRenderIcon(){
        return this.active ? require('../assets/images/img_navbar_close.png')
            : require('../assets/images/titlebar_back_icon_normal.png');
    }

    static pushRouter(data){
        try {
            //RouteMgr.deleteCustomerStore();
            const messageType = data.messageType;
            switch(data.messageType){
                case 3:
                    Actions.push('patrolList');
                    break;
                case 5:
                    const content = JSON.parse(data.content)[0];
                    content.ts = data.ts;
                    content.notify = true;
                    Actions.push('eventDetail',{data:content});
                    break;
                case 8:
                    Actions.push('inspectList');
                    break;
                default:
                    break;
            }
        }catch (e) {
        }
    }

    static popRouter(){
        switch (Actions.currentScene) {
            case 'eventDetail':{
                this.active ? Actions.popTo(NOTIFY_SCREEN) : Actions.pop();
                break;
            }
            case 'inspectSuccess':{
                GlobalParam.getInspectStatus() == 0 ? Actions.popTo('homePage')
                    : Actions.popTo('patrolList');

                DeviceEventEmitter.emit('onPatrolList',null);
                break;
            }
            case 'customerList':{
                if(this.popBackScreen == null){
                    if(Actions.state.routes.length == 1 ||
                        this.isContain('loginScreen')){
                        Actions.reset('homePage');
                        //this.deleteCustomerStore();
                    }else{
                        Actions.pop();
                    }

                    if(!this.isContain(NOTIFY_SCREEN)){
                        this.active =false;
                    }
                }else{
                    this.resetParam();
                }
                break;
            }
            case 'messageList':{
                DeviceEventEmitter.emit('onMessageListBack');
                break;
            }
            default:{
                break;
            }
        }
    }

    /**
     * Visitor notification routers.
     */
    static isVisitRoutes(){
        return this.isContain(NOTIFY_CUSTOMER);
    }

    static isVisitScreen(){
        return this.isScreen(NOTIFY_CUSTOMER);
    }

    static visitRouter(){
        if(this.isVisitScreen()){
            DeviceEventEmitter.emit('onRefreshCustomer',
                {storeId: this.messageParam.storeId});
            return;
        }

        if(this.isVisitRoutes()){
            setTimeout(()=>{
                Actions.popTo(NOTIFY_CUSTOMER);
                DeviceEventEmitter.emit('onRefreshCustomer',
                    {storeId: this.messageParam.storeId});
            },300);
            return;
        }

        setTimeout(()=>{
            this.popBackScreen == null ? this.setPopbackScreen(true) : null;
            Actions.push(NOTIFY_CUSTOMER,{storeId:this.messageParam.storeId});
        },300);
    }
}
