import {DeviceEventEmitter} from "react-native";
import I18n from "react-native-i18n";
import * as simpleStore from "react-native-simple-store";
import store from "../../mobx/Store";
import UserPojo from "../entities/UserPojo";
import AccessHelper from "../common/AccessHelper";
import PlayerUtil from "./PlayerUtil";
import * as lib from '../common/PositionLib';
import {changeAccountId,getUserInfo,getApiResult,getGeneralSetting,getAdvancedSetting} from "../common/FetchRequest";
import {tokenUpdate_Cashcheck,getUserInfo_Cashcheck} from "../cashcheck/FetchRequest";

export default class AccountUtil{

    static setOriginalId(accountId){
        this.originalId = accountId;
    }

    static getOriginalId(){
        return this.originalId;
    }

    static onAccountChange(){
        let storeSelector = store.storeSelector;
        storeSelector.basicList = [];
        storeSelector.storeType = null;
        storeSelector.storeGroup = null;
        storeSelector.inspectTable = null;
        let userSelector = store.userSelector;
        userSelector.userList = null;
        userSelector.userPosition = null;
        /*let filterSelector = store.filterSelector;
        let data = {
        modeIndex:0,
        regionIndex:0,
        tabIndex:0,

        countries:[I18n.t('All')],
        provinces:[I18n.t('All')],
        positions:[I18n.t('All')],

        country:I18n.t('All'),
        province:I18n.t('All'),
        position:I18n.t('All'),

        searchTextStore:'',
        searchTextUser:'',
        selectStore:null,
        checkUserId:null,
        checkStoreId:null,
        lastCheckStoreId:null,
        lastCheckUserId:null,

        userData:[],
        storeData:[],
        inspectName:I18n.t('Select inspect'),
        inspectId:0,

        result:{
            type:1,
            inspect:[],
            userId:[],
            storeId:[],
            content:[],
            text:'',
        }
        }

        filterSelector.analysis.forEach(item =>{
            item.data = data;
        })*/

        store.filterSelector.initAnalysis();

        store.analysisSelector.unInitRanges();
    }

    static async changeAccount(accountId,show,clear){
        if (accountId !==  store.userSelector.accountId) {
            try {
                if (show){
                    DeviceEventEmitter.emit('changeAccount',true);
                }
                let result = await changeAccountId(accountId);
                if(result.errCode !== store.enumSelector.errorType.SUCCESS){
                    if (show){
                        DeviceEventEmitter.emit('changeAccount',false);
                    }
                    return false;
                }

                if(store.userSelector.serviceIndex == store.enumSelector.serviceIndex.CASHCHECK) {
                    let body = {
                        userId: store.userSelector.userId
                    }
                    let result = await tokenUpdate_Cashcheck(body);
                    if(result.errCode !== store.enumSelector.errorType.SUCCESS){
                        return false;
                    }
                }

                lib.isAndroid() && PlayerUtil.setCategory(result.data.ezvizGlobal);

                
                if(store.userSelector.serviceIndex == store.enumSelector.serviceIndex.CASHCHECK) {
                    result = await getUserInfo_Cashcheck();
                } else {
                    result = await getUserInfo();
                }
                if(result.errCode !== store.enumSelector.errorType.SUCCESS){
                    if (show){
                        DeviceEventEmitter.emit('changeAccount',false);
                    }
                    return false;
                }
                store.userSelector.accountId = result.data.accountId;
                store.userSelector.services = result.data.services ? result.data.services : [];
                store.userSelector.roleId = result.data.roleId;
                UserPojo.setUserName(result.data.userName);
                UserPojo.setAccountId(result.data.accountId);

                simpleStore.get('LoginScreen').then((res)=> {
                    if (res != null) {
                        let login = JSON.parse(res);
                        login.accountId = result.data.accountId;
                        simpleStore.save('LoginScreen',JSON.stringify(login));
                    }
                });

                if (clear){
                    simpleStore.delete('StorePicker');
                    simpleStore.delete('EventStorePicker');
                    store.storeSelector.catchStore = {country:'',province:''};
                    store.storeSelector.catchEventStore = {country:'',province:''};
                    store.storeSelector.storeList = null;
                    store.storeSelector.tempReportStore = null;
                }
                AccessHelper.setData(result.data.authorities);
                if (show){
                    DeviceEventEmitter.emit('changeAccount',false);
                }

                result = await getGeneralSetting();
                if(result.errCode == store.enumSelector.errorType.SUCCESS) {
                    if(result.data.settingContent.general_setting_inspect_status_name.is_customize_0 == true) {
                        store.paramSelector.summary0Text = result.data.settingContent.general_setting_inspect_status_name.status_0;
                    } else {
                        store.paramSelector.resetSummaries(0);
                    }
                    if(result.data.settingContent.general_setting_inspect_status_name.is_customize_1 == true) {
                        store.paramSelector.summary1Text = result.data.settingContent.general_setting_inspect_status_name.status_1;
                    } else {
                        store.paramSelector.resetSummaries(1);
                    }
                    if(result.data.settingContent.general_setting_inspect_status_name.is_customize_2 == true) {
                        store.paramSelector.summary2Text = result.data.settingContent.general_setting_inspect_status_name.status_2;
                    } else {
                        store.paramSelector.resetSummaries(2);
                    }
                }

                // 取得浮水印設定
                result = await getAdvancedSetting({contentKey: "water_print"});
                console.log("getAdvancedSetting result : ", JSON.stringify(result));
                if(result.errCode == store.enumSelector.errorType.SUCCESS) {
                    if(result.data.isFeatureActivate == true && result.data.content.isSwitchOn == true) {
                        store.userSelector.isWaterPrintOn = true;
                        store.paramSelector.setWaterPrintParam(result.data.content);
                    } else {
                        store.userSelector.isWaterPrintOn = false;
                    }
                }
            } catch (e) {
                if (show){
                    DeviceEventEmitter.emit('changeAccount',false);
                }
                return false;
            }
        }
        return true;
    }

    static async getErrorMsg(){
        let error = await getApiResult();
        if (error != null){
            return error.errMsg;
        }
        else {
            return I18n.t('Network error');
        }
    }
}
