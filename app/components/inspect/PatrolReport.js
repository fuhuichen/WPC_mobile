import I18n from "react-native-i18n";
import moment from "moment";
import {NativeModules} from 'react-native';
import RNFS, {DocumentDirectoryPath} from "react-native-fs";
const SendIntentAndroid = require("react-native-send-intent");
import Package from "../../entities/Package";
import HttpUtil from "../../utils/HttpUtil";
import PatrolAsset from "./PatrolAsset";
import store from "../../../mobx/Store";
import {getReportExport} from "../../common/FetchRequest";
import NP from "number-precision/src/index";
const MyViewManager = NativeModules.MyViewManager;

export default class PatrolReport {
    static jobId = null;
    static params = null;
    static fileDate = "";
    static filePath = "";

    static share(params,callback){
        try {
            this.params = params;
            this.formatFilePath();

            callback(true, false);

            (async ()=> {
                let inspectId = this.params.id, templateId = this.params.templateId;
                let result = await HttpUtil.get(`inspect/report/export?inspectId=${inspectId}&type=0&templateId=${templateId}`,
                    180);
                if (result.errCode === store.enumSelector.errorType.SUCCESS){
                    RNFS.writeFile(this.filePath, result.data, 'base64')
                        .then(()=>{
                            callback(false, false);
                            this.callNative(false);
                        })
                        .catch(()=>{
                            callback(false, true);
                        });
                }else{
                    callback(false, true);
                }
            })();
        }catch (e) {
        }
    }

    static shareScore(params,categoryData,inspectSettings,callback){
        try {
            this.params = params;
            this.formatFilePath();

            callback(true, false);

            let hundredMarkType = -1;
            if(inspectSettings) {
                keyIndex = inspectSettings.findIndex(p => p.name === 'hundredMarkType');
                (keyIndex !== -1) ? (hundredMarkType = inspectSettings[keyIndex].value) : null;
            }

            let totalPoints = 0;
            categoryData.forEach(data => {
                data.finalPoints = data.points;
                totalPoints = NP.plus(totalPoints, data.totalPoints);
            })
            if(hundredMarkType == 0) {   // 比例制
                categoryData.forEach(data => {
                    if(data.type != store.enumSelector.categoryType.APPEND) {
                        data.finalPoints = NP.round(data.points*100/totalPoints, 1);
                    }
                })
            }
            // 計算父類別groupScore
            categoryData.forEach(data => {
                let isRoot = (data.parentId == -1) ? true : false;
                if(isRoot) {
                    let groupScore = null;
                    categoryData.forEach(subdata => {
                        if(data.groupId == subdata.parentId) {
                            if(groupScore == null) {
                                groupScore = 0;
                            }
                            groupScore = NP.plus(groupScore, subdata.finalPoints);
                        }
                    });
                    if(groupScore != null) {
                        data.finalPoints = groupScore;
                    }
                }
            });

            (async ()=> {
                let inspectId = this.params.id, templateId = this.params.templateId;

                let groups = [];
                categoryData.forEach(data => {
                    let isRoot = (data.parentId == -1) ? true : false;
                    let finalPoints = data.finalPoints.toFixed(2);
                    let points = data.points.toFixed(2);
                    let totalPoints = data.totalPoints.toFixed(2);
                    groups.push({
                        groupId: data.groupId,
                        groupScore: isRoot ? finalPoints : 0,
                        actualScore: /*isRoot ? 0 :*/ points,
                        totalScore: totalPoints
                    })
                })

                let body = {
                    inspectId: inspectId,
                    templateId: templateId,
                    groups: groups
                }
                let result = await getReportExport(body);
                if(result.errCode === store.enumSelector.errorType.SUCCESS){
                    RNFS.writeFile(this.filePath, result.data, 'base64')
                        .then(()=>{
                            callback(false, false);
                            this.callNative(false);
                        })
                        .catch(()=>{
                            callback(false, true);
                        });
                } else {
                    callback(false, true);
                }
            })();
        }catch (e) {
            console.log("shareScore e : ", JSON.stringify(e));
        }
    }

    static callNative(now){
        const component = Platform.select({
            android: ()=>{
                SendIntentAndroid.openChooserWithOptions({
                    subject: this.formatSubject(),
                    text: this.formatEmail(),
                    pdfUrl: this.filePath
                },"")
            },
            ios:()=>{
                if (now){
                    MyViewManager.shareItem(this.filePath);
                }
                else{
                    setTimeout(()=>{
                        MyViewManager.shareItem(this.filePath);
                    },1500);
                }
            }
        });
        component();
    }

    static formatFilePath(){
        this.fileDate = moment(this.params.date).format('YYYYMMDDHHmmss');
        this.filePath = `${DocumentDirectoryPath}/${this.params.name}-${this.params.inspector}-${this.fileDate}.pdf`;
    }

    static formatSubject(){
        //return Package.getBuildName(I18n.t('Email subject')).concat(this.fileDate);
        let filePathArray = this.filePath.split('/');
        let fileName = filePathArray[filePathArray.length - 1];
        return fileName;
    }

    static formatEmail(){
        let content = Package.getBuildName(I18n.t('Email detail')) + '\r\n\r\n\r\n';

        content = content.concat(I18n.t('Store name',{key: this.params.name}) + '\r\n');

        let date = moment(this.params.date).format('YYYY.MM.DD HH:mm:ss');
        content = content.concat(I18n.t('Inspection date',{key: date}) + '\r\n');

        content = content.concat(I18n.t('Inspection list',{key: this.params.list}) + '\r\n');
        content = content.concat(I18n.t('Inspector',{key: this.params.inspector}) + '\r\n');
        content = content.concat(I18n.t('Inspection type',{key: PatrolAsset.getMode()[this.params.type]}) + '\r\n');
        content = content.concat(I18n.t('Inspection result',{key: PatrolAsset.getStatus()[this.params.result]}) + '\r\n');
        content = content.concat(I18n.t('Inspection points',{key: this.params.points}));

        return content;
    }
}
