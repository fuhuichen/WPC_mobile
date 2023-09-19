import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Platform,
    DeviceEventEmitter
} from "react-native";
import I18n from "react-native-i18n";
import {Actions} from "react-native-router-flux";
import dismissKeyboard from "react-native-dismiss-keyboard";
import {inject, observer} from "mobx-react";
import Navigation from "../element/Navigation";
import store from "../../mobx/Store";
import PatrolClassify from "./PatrolClassify";
import PatrolRecord from "./PatrolRecord";
import * as lib from '../common/PositionLib';
import Signature from "../components/Signature";
import Attachment from "../components/Attachment";
import ModalCenter from "../components/ModalCenter";
import StringFilter from "../common/StringFilter";
import PopupPatrol from "../customization/PopupPatrol";
import EventBus from "../common/EventBus";
import TouchableActive from "../touchables/TouchableActive";
import TouchableInactive from "../touchables/TouchableInactive";
import Feedback from "./Feedback";
import NP from "number-precision/src/index";
import PatrolParser from "../components/inspect/PatrolParser";
import PatrolCore from "./PatrolCore";
import {MEDIA_AUDIO, MEDIA_IMAGE, MEDIA_VIDEO, MODULE_INSPECT, UPDATE_BASE_PATROL} from "../common/Constant";
import ProgressIndicator from "../components/ProgressIndicator";
import SoundUtil from "../utils/SoundUtil";
import OSSUtil from "../utils/OSSUtil";
import moment from "moment";
import { submitInspect, getWorkflowInfo, getUserListAll, getUserDefineAll,
         submitWorkflow, resubmitWorkflow, modifyInspectReport, getInspectScheduleList, getScheduleWhiteList } from "../common/FetchRequest";
import UserPojo from "../entities/UserPojo";
import BasePatrol from "../customization/BasePatrol";
import NetInfoIndicator from "../components/NetInfoIndicator";
import PatrolStorage from "../components/inspect/PatrolStorage";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import BorderShadow from '../element/BorderShadow';
import PatrolResult from "./PatrolResult";
import ScrollTop from "../element/ScrollTop";
import TemporaryResult from "./TemporaryResult";
import SlotPatrol from "../customization/SlotPatrol";
import AndroidBacker from "../components/AndroidBacker";
import PhoneInfo from "../entities/PhoneInfo";
import Orientation from 'react-native-orientation-locker';
import {Divider} from "react-native-elements";
import ModalSchedule from "../customization/ModalSchedule";
import AccessHelper from "../common/AccessHelper";

const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class PatrolSummary extends BasePatrol {
    state = {
        showScrollTop: false,
        status: -1,
        summary: [],
        totalPoints: 0,
        enumSelector: store.enumSelector,
        paramSelector: store.paramSelector,
        patrolSelector: store.patrolSelector,
        reportSelector: store.reportSelector,
        screenSelector: store.screenSelector,
        userSelector: store.userSelector,
        submitResult: null,
        temporaryResult: null,
        weatherType: null,
        isBindWorkflow: false,
        nextAuditName: '',
        ccUsersName: '',
        userList: [],
        inspectReportId: '',
        mapURI: '',
        schedules: [],
        selectSchedule: null,
        categoryData: [],
        whiteList: []
    };

    constructor(props) {
        super(props);
        Orientation.lockToPortrait();
        this.score = PatrolParser.getScore();
        this.initScoreRules();
    }
    orientationDidChange(orientation){
      if (orientation === 'LANDSCAPE') {
        // do something with landscape layout
      } else {
        // do something with portrait layout
      }
    }
    componentDidMount(){
        this.onCompute();
        Orientation.addOrientationListener(this.orientationDidChange);
        this.emitter = DeviceEventEmitter.addListener(UPDATE_BASE_PATROL,()=>{
            this.onCompute();
        });

        (async ()=>{
            await this.checkApprove();
            await this.getSchedules();
        })();

        this.initMapURI();

        (async () => {
            let result = await getScheduleWhiteList();
            this.setState({whiteList: result.data});
        })()      
    }

    componentWillUnmount(){
        this.emitter && this.emitter.remove();
    }

    initMapURI() {
        let {patrolSelector} = this.state;
        if((patrolSelector.signTime != null) && (patrolSelector.signTime !== 0) && patrolSelector.latitude && patrolSelector.longitude 
            && patrolSelector.store && patrolSelector.store.latitude && patrolSelector.store.longitude) {
            let mapWidth = 600;//(width - 60);
            let mapHeight = 450;//((width - 60)*3/4);
            let localGPS = patrolSelector.latitude + ',' + patrolSelector.longitude;
            let disGPS = patrolSelector.store.latitude + ',' + patrolSelector.store.longitude;
            let localIcon = 'https://maps.gstatic.com/mapfiles/ms2/micons/man.png';
            let dislIcon = 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png';
            let uri = 'https://maps.googleapis.com/maps/api/staticmap?&size=' + mapWidth + 'x' + mapHeight +
                    '&scale=2&style=visibility:on&format=jpg&style=feature:water|element:geometry|visibility:on&style=feature:landscape|element:geometry|visibility:on&markers=icon:' +
                    localIcon + '|' + localGPS + '&markers=icon:' + dislIcon + '|' + disGPS + '&path=color:0x0000ff|weight:5|' + localGPS + '|' + disGPS + '&key=AIzaSyCinmJi-9W-g7QjG7GF6DfRJOgipkdiF5c';
            uri = encodeURI(uri)
            this.setState({mapURI: uri});
            OSSUtil.download(uri, function(mapDownloadPath) {
                patrolSelector.mapDownloadPath = mapDownloadPath;
            });
        }
    }
    
    async getSchedules() {
        let {patrolSelector, userSelector, enumSelector} = this.state;
        let body = {
            userId: userSelector.userId,
            inspectTagId: patrolSelector.inspect.id,
            storeId: patrolSelector.store.storeId
        }
        let result = await getInspectScheduleList(body);
        if(result.errCode == enumSelector.errorType.SUCCESS) {
            let selectSchedule = null;
            if(result.data.length > 0) {
                if(patrolSelector.scheduleId != null) {
                    result.data.forEach(schedule => {
                        if(schedule.id == patrolSelector.scheduleId) {
                            selectSchedule = schedule;
                        }
                    })
                } else {
                    selectSchedule = result.data[0];
                }                
            }
            this.setState({schedules: result.data, selectSchedule});
        }
    }

    async checkApprove() {
        try {
            let {patrolSelector, enumSelector, userSelector} = this.state;
            if(patrolSelector.isBindWorkflow) {  // 綁定簽核流程
                this.setState({isBindWorkflow: patrolSelector.isBindWorkflow});
                let processDefinitionKey = "";
                patrolSelector.inspectSettings.forEach((item) => {
                    if(item.name == 'workflow') {
                        processDefinitionKey = item.value.processDefinitionKey;
                    }
                });
                if(processDefinitionKey != "") {
                    let result = await getWorkflowInfo(processDefinitionKey);
                    if(result.errCode == enumSelector.errorType.SUCCESS) {
                        let resultUserList = await getUserListAll();
                        if (resultUserList.errCode == enumSelector.errorType.SUCCESS){
                            this.setState({userList : resultUserList.data});
                        }
                        if (userSelector.userPosition == null){
                            let resultUserDefine = await getUserDefineAll(0);
                            if (resultUserDefine.errCode == enumSelector.errorType.SUCCESS){
                                userSelector.userPosition = resultUserDefine.data;
                            }
                        }
                        let nextAuditName = '', ccUsersName = '';
                        let firstAuditNode = result.data.nextAuditNode.nextAuditNode
                        if(firstAuditNode != null) {
                            if(firstAuditNode.auditTargetType == enumSelector.auditTargetType.USER) {
                                nextAuditName = firstAuditNode.auditByUsers.length > 0 ? this.getUserNameById(firstAuditNode.auditByUsers[0]) : '';
                            } else {
                                nextAuditName = firstAuditNode.auditByGroups.length > 0 ? this.getGroupNameById(firstAuditNode.auditByGroups[0]) : '';
                            }
                        }

                        if(result.data.copyToUsers.length > 0) {
                            result.data.copyToUsers.forEach((item, index) => {
                                if(index > 0) {
                                    ccUsersName += ', ';
                                }
                                ccUsersName += this.getUserNameById(item);
                            });
                        }
                        this.setState({nextAuditName, ccUsersName});
                    }
                }
            }
        }catch (e) {
        }
    }

    getUserNameById(id) {
        let {userList} = this.state;
        let name = "";
        userList.forEach((item) => {
            if(item.userId == id) {
                name = item.userName;
            }
        });
        return name;
    }

    getGroupNameById(id) {
        let {userSelector} = this.state;
        let name = ""
        userSelector.userPosition.forEach((item) => {
            if(item.defineId == id) {
                name = item.defineName;
            }
        });
        return name;
    }

    onSeed(){
        EventBus.closePopupPatrol();
        dismissKeyboard();

        let {status, patrolSelector} = this.state;
        if (status === -1){
            DeviceEventEmitter.emit('Toast', I18n.t('Select overall'));
            return false;
        }

        if(!PatrolCore.isRemote(patrolSelector)) {
            if (PatrolCore.getOnsiteSignature(patrolSelector) && (patrolSelector.signatures.length === 0)){
                DeviceEventEmitter.emit('Toast', I18n.t('Give sign'));
                return false;
            }

            if(PatrolCore.getOnsiteSignatureExtra(patrolSelector)) {
                for(let i=0 ; i<patrolSelector.signatures.length ; ++i) {
                    if(patrolSelector.signatures[i].optional == true && patrolSelector.signatures[i].content == null) {
                        DeviceEventEmitter.emit('Toast', I18n.t('Give sign'));
                        return false;
                    }
                }
            }
        }

        this.modalConfirm && this.modalConfirm.open();
    }

    async onSubmit(){
        try {
            let {patrolSelector, reportSelector, enumSelector, status, weatherType, isBindWorkflow, userSelector, selectSchedule, totalPoints} = this.state;
            this.keyIndex = 0;
            SoundUtil.stop();

            OSSUtil.init(patrolSelector.store.storeId).then(async ()=>{
                let patrols = this.formatPatrol();
                let feedback = this.formatFeedback();
                let signature = this.formatSignature();
                let attachments = this.formatApproveAttachment();
                let map = this.formatMapImage();

                this.indicator && this.indicator.open();
                let pArray = [...patrols.uploads,...feedback.uploads,...signature.uploads,...map.uploads];
                Promise.all(pArray).then(async (res) => {
                    let body = {
                        status: status,
                        comment: patrolSelector.comment,
                        items: patrols.data,
                        feedback: feedback.data,
                        signatures: signature.data,
                        reportScore: totalPoints
                    };

                    (patrolSelector.signTime !== 0) && (body.checkinId = patrolSelector.checkinId);
                    (patrolSelector.weatherId != null) && (body.uuid = patrolSelector.weatherId);
                    (weatherType != null) && (body.weatherType = weatherType);

                    if(patrolSelector.isWorkflowReport) {   // 簽核流程中的編輯報告
                        body.reportId = patrolSelector.inspectReportId;
                        body.items.forEach(element => {
                            element.id = element.inspectItemId;
                            element.score = element.grade;
                        });
                        let result = await modifyInspectReport(body);
                        let submitResult = ((result.errCode === enumSelector.errorType.SUCCESS) || result.errMsg.indexOf('resubmit') != -1);
                        if (submitResult){
                            let workflowResubmitResult = await this.onReSubmitWorkflow(attachments);
                            PatrolStorage.delete(patrolSelector.uuid);

                            setTimeout(() => {
                                reportSelector.temporaries = PatrolStorage.getManualCaches();
                                this.setState({reportSelector});

                                this.indicator && this.indicator.close();
                                EventBus.refreshApprovePage();
                                if(workflowResubmitResult.data && workflowResubmitResult.data.isSystemReject == true) {
                                    this.setState({inspectReportId: patrolSelector.inspectReportId});
                                    setTimeout(function(){
                                        this.modalSystemReject && this.modalSystemReject.open();
                                    }.bind(this),Platform.OS === 'ios'?700:100)

                                } else {
                                    Actions.push('reportDetail',{data:{id: patrolSelector.inspectReportId, patrol:true}, noShare: true});
                                }
                            }, 1000);
                        } else {
                            if(result.errCode == enumSelector.errorType.SUBMITFAIL_NOPERMISSION) {
                                DeviceEventEmitter.emit('Toast', I18n.t('No Inspection Permission'));
                            }
                            this.indicator && this.indicator.close();
                            this.setState({submitResult});
                        }
                    } else {
                        if(map.content != "") {
                            body.report_sign_map_url = map.content;
                        }
                        if((patrolSelector.signTime != null) && (patrolSelector.signTime !== 0)){
                            body.sign_in_ts = patrolSelector.signTime;
                        }
                        if(patrolSelector.distance != null){
                            body.execute_sign_distance = patrolSelector.distance == null ? -1 : patrolSelector.distance;
                        } else {
                            body.execute_sign_distance = -1;
                        }
                        if(selectSchedule != null) {
                            body.taskId = selectSchedule.id;
                        }
                        body.isMysteryMode = userSelector.isMysteryModeOn;
                        console.log("submitInspect body : ", JSON.stringify(body));
                        let result = await submitInspect(body);
                        console.log("submitInspect result : ", JSON.stringify(result));
                        EventBus.refreshScheduleInfo();

                        let submitResult = ((result.errCode === enumSelector.errorType.SUCCESS) || result.errMsg.indexOf('resubmit') != -1);
                        if (submitResult){
                            let workflowSubmitResult = await this.onSubmitWorkflow(result.data.inspectId, attachments, patrolSelector.workflowDescription);
                            PatrolStorage.delete(patrolSelector.uuid);

                            setTimeout(() => {
                                reportSelector.temporaries = PatrolStorage.getManualCaches();
                                this.setState({reportSelector});

                                this.indicator && this.indicator.close();
                                if(workflowSubmitResult.data && workflowSubmitResult.data.isSystemReject == true) {
                                    this.setState({inspectReportId: result.data.inspectId});
                                    setTimeout(function(){
                                        this.modalSystemReject && this.modalSystemReject.open();
                                    }.bind(this),Platform.OS === 'ios'?700:100)
                                } else {
                                    Actions.push('reportDetail',{data:{id: result.data.inspectId, patrol:true}, noShare: isBindWorkflow});
                                }
                            }, 1000);
                        } else {
                            if(result.errCode == enumSelector.errorType.SUBMITFAIL_NOPERMISSION) {
                                DeviceEventEmitter.emit('Toast', I18n.t('No Inspection Permission'));
                            }
                            this.indicator && this.indicator.close();
                            this.setState({submitResult});
                        }
                    }
                }).catch(error => {
                    console.log("submit inspect error : ", JSON.stringify(error));
                    this.indicator && this.indicator.close();
                    this.setState({submitResult: false});
                })
            }).catch(error => {
            });
        }catch (e) {
        }
    }

    onActionPush() {
        let {inspectReportId} = this.state;
        Actions.push('reportDetail',{data:{id: inspectReportId, patrol:true}, noShare: true});
        this.setState({inspectReportId: ''});
    }

    async onReSubmitWorkflow(attachments) {
        let {patrolSelector} = this.state;
        let attachment = [];
        attachments.data.forEach((item) => {
            attachment.push({
                mediaType: item.mediaType,
                url: item.content,
                ts: item.ts,
                fileName: item.fileName || ''
            });
        });
        let body = {
            inspectReportId: patrolSelector.inspectReportId,
            comment: {
                description: patrolSelector.workflowDescription,
                attachment: attachment
            }
        };
        let result = await resubmitWorkflow(body);
        return result;
    }

    async onSubmitWorkflow(inspectId, attachments, workflowDescription) {
        let {patrolSelector} = this.state;
        if(patrolSelector.isBindWorkflow) {
            let attachment = [];
            attachments.data.forEach((item) => {
                attachment.push({
                    mediaType: item.mediaType,
                    url: item.content,
                    ts: item.ts,
                    fileName: item.fileName || ''
                });
            });
            let body = {
                inspectReportId: inspectId,
                comment: {
                    description: workflowDescription,
                    attachment: attachment
                }
            };
            let result = await submitWorkflow(body);
            return result;
        } else {
            return {};
        }
    }

    formatReport(id){
        let {patrolSelector, status, totalPoints} = this.state;
        return {
            id: id,
            date: this.reportTime,
            name: patrolSelector.store.name,
            list: patrolSelector.inspect.name,
            inspector: UserPojo.getUserName(),
            type: patrolSelector.inspect.mode,
            result: status,
            points: totalPoints
        }
    }

    onCompute(){
        try {
            let {patrolSelector, enumSelector, categoryData} = this.state;
            let rateData = [], scoreData = [], appendData = [];
            let rateGroup = null, scoreGroup = null, appendGroup = null;

            let rateCategories = patrolSelector.data.filter(p => p.type === enumSelector.categoryType.RATE);
            let scoreCategories = patrolSelector.data.filter(p => p.type === enumSelector.categoryType.SCORE);
            let appendCategories = patrolSelector.data.filter(p => p.type === enumSelector.categoryType.APPEND);

            rateCategories.map(p => rateData.push(...p.groups));
            scoreCategories.map(p => scoreData.push(...p.groups));
            appendCategories.map(p => appendData.push(...p.groups));

            (rateData.length > 0) && (rateGroup = this.onRateTable(rateData, scoreData, appendData));
            (scoreData.length > 0) && (scoreGroup = this.onScoreTable(scoreData));
            (appendData.length > 0) && (appendGroup = this.onAppendTable(appendData));

            categoryData = []
            categoryData = categoryData.concat(rateData);
            categoryData = categoryData.concat(scoreData);
            categoryData = categoryData.concat(appendData);
            //console.log('categoryData : ', JSON.stringify(categoryData))
            this.setState({categoryData});
            this.onSummary(rateGroup, scoreGroup, appendGroup);
        }catch (e) {
            console.log("onCompute e : ", e)
        }
    }

    onSummary(rateGroup, scoreGroup, appendGroup){
        let summary = [0,1,2], status = this.state.status, points = 0, totalPoints = 0;
        let focuses = [], ignores = [];

        if (rateGroup != null){
            if (this.setting_isAutoMappingActivate && this.dangerousOnFailedItem){
                (rateGroup.unqualified !== 0) ? (summary = [0]) : null;
                (rateGroup.unqualified !== 0) ? (status = 0) : null;
            }

            points = NP.plus(points, rateGroup.points);
            totalPoints = NP.plus(totalPoints, rateGroup.totalPoints);

            (rateGroup.focuses.length > 0) && focuses.push(...rateGroup.focuses);
            (rateGroup.ignores.length > 0) && ignores.push(...rateGroup.ignores);
        }

        if (scoreGroup != null){
            if (!this.includedInTotalScoreWithType1){
                points = 0;
                totalPoints = 0;
            }
            points = NP.plus(points, scoreGroup.points);
            totalPoints = NP.plus(totalPoints, scoreGroup.totalPoints);

            (scoreGroup.focuses.length > 0) && focuses.push(...scoreGroup.focuses);
            (scoreGroup.ignores.length > 0) && ignores.push(...scoreGroup.ignores);
        }

        if (this.hundredMarkType === 0){
            totalPoints = (totalPoints === 0) ? totalPoints : NP.round(points*100/totalPoints, 1);
        } else {
            totalPoints = points;
        }

        if (appendGroup != null){
            if (scoreGroup == null && !this.includedInTotalScoreWithType1){
                totalPoints = 0;
            }
            totalPoints = NP.plus(totalPoints, appendGroup.totalPoints);

            (appendGroup.focuses.length > 0) && focuses.push(...appendGroup.focuses);
            (appendGroup.ignores.length > 0) && ignores.push(...appendGroup.ignores);
        }

        if (this.hundredMarkType === 1){
            totalPoints += this.baseScore;
        }

        totalPoints = totalPoints.toFixed(1);

        (totalPoints > this.maxScore) ? (totalPoints = this.maxScore)
            : (totalPoints < this.minScore) ? (totalPoints = this.minScore): null;

        if(this.setting_isAutoMappingActivate && this.setting_autoMappingByTotalScore && this.mappingScore_bottom != null && this.mappingScore_top != null) {
            if(totalPoints > this.mappingScore_top) {
                summary = [2];
                status = 2;
            } else if(totalPoints >= this.mappingScore_bottom) {
                summary = [1];
                status = 1;
            } else {
                summary = [0];
                status = 0;
            }
        }

        this.setState({
            summary,
            status,
            totalPoints,
            focuses,
            ignores
        });
    }

    onRateTable(categories, scoreData, appendData){
        let group = {points:0, totalPoints: 0, qualified: 0, unqualified: 0, items: [], focuses: [], ignores: [], count: 0};
        group.count = categories.reduce((p,e) => p + e.items.length, 0);

        categories.forEach((item)=>{
            let qualified = item.items.filter(p => p.score === this.score[2].label);
            let unqualified = item.items.filter(p => p.score === this.score[1].label);
            let autoItems = item.items.filter(p => (p.type === 0) && (p.score === this.score[0].label));

            let pointItems = this.qualifiedForIgnoredWithType1 ? [...qualified, ...autoItems] : qualified;
            let totalItems = this.qualifiedForIgnoredWithType1 ? item.items : [...qualified, ...unqualified];

            let points = pointItems.reduce((p,e) => NP.plus(p, e.itemScore), 0);
            let totalPoints = totalItems.reduce((p,e) => NP.plus(p, e.itemScore), 0);

            if(item.isAdvanced == true) {
                if(item.groupScore > 0) {
                    if(points > item.groupScore) {
                        points = item.groupScore;
                    }
                    if(totalPoints > item.groupScore) {
                        totalPoints = item.groupScore;
                    }
                } else {
                    if(points < item.groupScore) {
                        points = item.groupScore;
                    }
                    if(totalPoints < item.groupScore) {
                        totalPoints = item.groupScore;
                    }
                }
                // 比例制時，分母固定為上限值
                if(this.hundredMarkType == 0 && totalPoints != 0) {
                    totalPoints = item.groupScore;
                }
            }

            if(item.weight != -1) {
                points = (points * item.weight / 100);
                totalPoints = (totalPoints * item.weight / 100);
            }

            if (!this.includedInTotalScoreWithType1 && (scoreData.length > 0 || appendData.length > 0)){
                points = 0;
                totalPoints = 0;
            }

            item.points = points;
            item.totalPoints = totalPoints;
            group.points = NP.plus(group.points, points);
            group.totalPoints = NP.plus(group.totalPoints, totalPoints);

            group.qualified += qualified.length;
            group.unqualified += unqualified.length;

            group.focuses.push(...unqualified);
            group.ignores.push(...autoItems);

            group.items.push({
                name: item.groupName,
                size: item.items.length,
                qualified: qualified.length,
                unqualified: unqualified.length,
                inapplicable: autoItems.length
            });
        });

        return group;
    }

    onScoreTable(categories){
        let group = {points:0, totalPoints: 0, items:[], focuses: [], ignores: [], count: 0};
        group.count = categories.reduce((p,e) => p + e.items.length, 0);

        categories.forEach((item,index)=>{
            let scoreItems = item.items.filter(p => p.score !== this.score[0].label);
            let autoItems = item.items.filter(p => p.score === this.score[0].label);
            let focusItems = item.items.filter(p => (p.type === 0) && (p.score !== this.score[0].label) && (p.score < p.qualifiedScore));
            let pointItems = this.qualifiedForIgnoredWithType2 ? item.items : scoreItems;
            let points = pointItems.reduce((p,e) => NP.plus(p, ((e.score!=undefined && e.score !== this.score[0].label) ? e.score : e.itemScore)), 0);
            let totalPoints = pointItems.reduce((p,e) => NP.plus(p, e.itemScore), 0);
            if(item.isAdvanced == true) {
                if(item.groupScore > 0) {
                    if(points > item.groupScore) {
                        points = item.groupScore;
                    }
                    if(totalPoints > item.groupScore) {
                        totalPoints = item.groupScore;
                    }
                } else {
                    if(points < item.groupScore) {
                        points = item.groupScore;
                    }
                    if(totalPoints < item.groupScore) {
                        totalPoints = item.groupScore;
                    }
                }
                // 比例制時，分母固定為上限值
                if(this.hundredMarkType == 0 && totalPoints != 0) {
                    totalPoints = item.groupScore;
                }
            }
            if(item.weight != -1) {
                points = (points * item.weight / 100);
                totalPoints = (totalPoints * item.weight / 100);
            }

            item.points = points;
            item.totalPoints = totalPoints;
            group.points = NP.plus(group.points, points);
            group.totalPoints = NP.plus(group.totalPoints, totalPoints);

            group.focuses.push(...focusItems);
            group.ignores.push(...autoItems);

            group.items.push({
                name: item.groupName,
                size: item.items.length,
                totalPoints: totalPoints,
                inapplicable: autoItems.length,
                points: points,
            });
        });

        return group;
    }

    onAppendTable(categories){
        let group = {totalPoints:0, items: [], focuses: [], ignores: [], count: 0};
        group.count = categories.reduce((p,e) => p + e.items.length, 0);

        categories.forEach((item)=>{
            let qualified = item.items.filter(p => p.score === this.score[2].label);
            let unqualified = item.items.filter(p => p.score === this.score[1].label);
            let autoItems = item.items.filter(p => (p.type === 0) && (p.score === this.score[0].label));

            let points = qualified.reduce((p,e) => NP.plus(p, ((e.itemScore > 0) ? e.itemScore : 0)), 0);
            points = NP.plus(points, unqualified.reduce((p,e) => NP.plus(p, ((e.itemScore < 0) ? e.itemScore : 0)), 0));

            if(item.isAdvanced == true) {
                if(item.groupScore > 0) {
                    if(points > item.groupScore) {
                        points = item.groupScore;
                    }
                } else {
                    if(points < item.groupScore) {
                        points = item.groupScore;
                    }
                }
            }

            item.points = points;
            item.totalPoints = 0;
            group.totalPoints = NP.plus(group.totalPoints, points);
            group.focuses.push(...unqualified);
            group.ignores.push(...autoItems);

            group.items.push({
                name: item.groupName,
                size: item.items.length,
                qualified: qualified.length,
                unqualified: unqualified.length,
                inapplicable: autoItems.length,
                points: points,
            });
        });

        return group;
    }

    initScoreRules(){
        let {patrolSelector} = this.state;

        this.includedInTotalScoreWithType1 = false;
        this.qualifiedForIgnoredWithType1 = true;
        this.qualifiedForIgnoredWithType2 = true;
        this.hundredMarkType = -1;
        this.minScore = 0;
        this.maxScore = 100;
        this.dangerousOnFailedItem = false;
        this.baseScore = 100;
        this.setting_isAutoMappingActivate = false;
        this.setting_autoMappingByTotalScore = false;
        this.mappingScore_bottom = null;
        this.mappingScore_top = null;

        let inspectSettings = patrolSelector.inspectSettings;
        let keyIndex = inspectSettings.findIndex(p => p.name === 'includedInTotalScoreWithType1');
        (keyIndex !== -1) ? (this.includedInTotalScoreWithType1 = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'qualifiedForIgnoredWithType1');
        (keyIndex !== -1) ? (this.qualifiedForIgnoredWithType1 = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'qualifiedForIgnoredWithType2');
        (keyIndex !== -1) ? (this.qualifiedForIgnoredWithType2 = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'hundredMarkType');
        (keyIndex !== -1) ? (this.hundredMarkType = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'minScore');
        (keyIndex !== -1) ? (this.minScore = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'maxScore');
        (keyIndex !== -1) ? (this.maxScore = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'dangerousOnFailedItem');
        (keyIndex !== -1) ? (this.dangerousOnFailedItem = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'setting_isAutoMappingActivate');
        (keyIndex !== -1) ? (this.setting_isAutoMappingActivate = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'setting_autoMappingByTotalScore');
        (keyIndex !== -1) ? (this.setting_autoMappingByTotalScore = inspectSettings[keyIndex].value) : null;
        if(this.setting_autoMappingByTotalScore == true) {
            this.mappingScore_bottom = inspectSettings[keyIndex].extra.find(item => item.key == "mappingScore_bottom").value;
            this.mappingScore_top = inspectSettings[keyIndex].extra.find(item => item.key == "mappingScore_top").value;
        }

        keyIndex = inspectSettings.findIndex(p => p.name === 'baseScore');
        (keyIndex !== -1) ? (this.baseScore = inspectSettings[keyIndex].value) : null;
    }

    renderStatus(){
        let {paramSelector, summary, status} = this.state;
        return (
            <View style={{marginTop:26,marginLeft:10,marginRight:10}}>
                <View style={{flexDirection:'row', justifyContent:'flex-start'}}>
                    <Text style={[styles.starLabel,{marginLeft:0}]}>*</Text>
                    <Text style={[styles.label,{marginLeft:3}]}>{I18n.t('Overall summary')}</Text>
                </View>
                <View style={styles.statusView}>
                {
                    paramSelector.getSummaries().map((item) => {
                        return ((summary.find(p => p === item.id) != null) ? <TouchableOpacity activeOpacity={1}
                                                 onPress={()=>{
                                                     EventBus.closePopupPatrol();
                                                     this.setState({status: item.id})
                                                 }}>
                            <BoxShadow setting={{width:(width-60)/3, height:32, color:"#000000",
                                border:2, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:12}}}>
                                <View style={[styles.statusPanel, (item.id === status) && {backgroundColor:'#006AB7'}]}>
                                    <Text style={[styles.statusContent,(item.id === status) && {color:'#ffffff'}]}>{item.name}</Text>
                                </View>
                            </BoxShadow>
                        </TouchableOpacity> : null)
                    })
                }
                </View>
            </View>
        )
    }

    onComment(text){
        let {patrolSelector} = this.state;
        patrolSelector.comment = StringFilter.all(text, 1000);
        this.setState(patrolSelector, () => {
            EventBus.updatePatrolCache();
        });
    }

    onWorkflowDescription(text){
        let {patrolSelector} = this.state;
        patrolSelector.workflowDescription = StringFilter.all(text, 1000);
        this.setState(patrolSelector, () => {
            EventBus.updatePatrolCache();
        });
    }

    renderComment(){
        let {patrolSelector} = this.state;
        return (
            <TextInput style={[styles.comment,BorderShadow.div]}
                       multiline={true}
                       placeholder={I18n.t('Give advices')}
                       autoCorrect={false}
                       autoCapitalize={'none'}
                       placeholderTextColor="#ACAEB1"
                       value={patrolSelector.comment}
                       onFocus={()=>{EventBus.closePopupPatrol()}}
                       onChangeText={(text)=>this.onComment(text)}/>
        )
    }

    renderSignature(){
        let {patrolSelector} = this.state;
        let marginLeft = PatrolCore.getOnsiteSignature(patrolSelector) ? 3 : 10;
        let signatureExtra = PatrolCore.getOnsiteSignatureExtra(patrolSelector) || [];

        if(signatureExtra.length > 0 && patrolSelector.signatures.length == 0) {
            signatureExtra.forEach(element => {
                patrolSelector.signatures.push(element);
            });
            this.setState({patrolSelector}, () =>{
                EventBus.updatePatrolCache();
            });
        }

        return (
            !PatrolCore.isRemote(patrolSelector) ? <View style={{marginTop:16}}>
                <View style={styles.signPanel}>
                    {
                        PatrolCore.getOnsiteSignature(patrolSelector) ? <Text style={styles.starLabel}>*</Text> : null
                    }
                    <Text style={[styles.label,{marginLeft:marginLeft}]}>{I18n.t('Label signature or photo')}</Text>
                </View>
                <Signature data={patrolSelector.signatures} extra={signatureExtra}
                    onSign={(sign, index) => {
                        if(index == -1) {
                            patrolSelector.signatures.push(sign);
                        } else {
                            if(patrolSelector.signatures[index]) {
                                patrolSelector.signatures[index] = sign;
                            }
                        }
                        this.setState({patrolSelector}, () =>{
                            EventBus.updatePatrolCache();
                        });
                    }}
                    onDelete={(index) => {
                        if(patrolSelector.signatures[index].header == null) {
                            patrolSelector.signatures.splice(index, 1);
                        } else {
                            patrolSelector.signatures[index] = {
                                header: patrolSelector.signatures[index].header,
                                optional: patrolSelector.signatures[index].optional
                            }
                        }
                        this.setState({patrolSelector}, () => {
                            EventBus.updatePatrolCache();
                        });
                    }}/>
            </View> : null
        )
    }

    renderWorkflow() {
        let {nextAuditName, ccUsersName, isBindWorkflow, patrolSelector} = this.state;
        return (
            isBindWorkflow ? <View style={{marginTop:24}}>
                <Text style={styles.title}>{I18n.t('Approve Submit')}</Text>
                <Attachment data={patrolSelector.attachments} onAttach={(item) => {
                    patrolSelector.attachments.push(item);
                    this.setState({patrolSelector}, () =>{
                        EventBus.updatePatrolCache();
                    });
                }} onDelete={(index) => {
                    patrolSelector.attachments.splice(index, 1);
                    this.setState({patrolSelector}, () => {
                        EventBus.updatePatrolCache();
                    });
                }}/>
                <TextInput style={[styles.comment,BorderShadow.div]}
                       multiline={true}
                       placeholder={I18n.t('Approve Description')}
                       autoCorrect={false}
                       autoCapitalize={'none'}
                       placeholderTextColor="#ACAEB1"
                       value={patrolSelector.workflowDescription}
                       onFocus={()=>{EventBus.closePopupPatrol()}}
                       onChangeText={(text)=>this.onWorkflowDescription(text)}/>
                <View style={{marginTop:16}}>
                    <Text style={styles.title}>{I18n.t('Next Auditor')}</Text>
                    <Text style={styles.name}>{nextAuditName}</Text>
                    <Text style={styles.title}>{I18n.t('Copy to')}</Text>
                    <Text style={styles.name}>{ccUsersName}</Text>
                </View>
            </View> : null
        )
    }

    renderMap() {
        let {patrolSelector, mapURI} = this.state;

        if(mapURI == '') {
            return null;
        }

        let mapWidth = (width - 60);
        let mapHeight = ((width - 60)*3/4);
        let durationText = '';
        if (patrolSelector.distance != null) {
            durationText = I18n.t('Store distance',{store:patrolSelector.store.name, distance:patrolSelector.distance});
        } else {
            durationText = I18n.t('Checked in Distance Over');
        }
        return (
            <View style={{marginTop:26,marginLeft:10,marginRight:10}}>
                <Text style={styles.label}>{I18n.t('Checked in Info')}</Text>
                <View style={[{marginTop:10, border:2, borderRadius:10},BorderShadow.div]}>
                    <View style={{padding: 10}}>
                        <Text style={styles.content}>{durationText}</Text>
                        <Divider style={styles.divider}/>
                        <Image style={{marginTop: 10, width: mapWidth, height: mapHeight}} source={{uri: mapURI}}/>
                    </View>
                </View>
            </View>
        )
    }

    renderSchedule() {
        let {schedules, selectSchedule} = this.state;

        return (
            <View style={{marginTop:26}}>
                <Text style={[styles.label,{marginLeft:10}]}>{I18n.t('Inspect schedule')}</Text>
                <View style={{backgroundColor:'#E8EFF472', borderRadius:10, width:width-20, marginTop: 15}}>
                    <View style={[styles.scheduleContainer,BorderShadow.div]}>
                        {schedules.length == 0 ? <View style={{padding: 12,alignItems:'center'}}>
                            <Image style={{width: 100, height: 100}} source={require('../assets/img_view_empty.png')}/>
                            <Text style={[styles.content,{textAlign:'center'}]}>{I18n.t('No schedule')}</Text>
                        </View> :
                        <View style={{padding: 12}}>
                            <Text style={styles.scheduleTitle}>{selectSchedule.taskName}</Text>
                            <Divider style={styles.divider}/>
                            <Text style={styles.scheduleContent}>{I18n.t('Start') + " : " + moment(selectSchedule.remindTime).format("YYYY/MM/DD")}</Text>
                            <Divider style={{backgroundColor:'#006AB7', height:2}}/>
                            <Text style={styles.scheduleChange} onPress={() => {this.modalSchedule && this.modalSchedule.open()}}>{I18n.t('Modify')}</Text>
                        </View>
                        }
                    </View>
                </View>
            </View>
        )
    }

    formatPatrol(){
        let dataSet = {data:[], uploads:[]};
        let {patrolSelector, enumSelector} = this.state;

        this.reportTime = moment();
        let data = PatrolCore.getItems(patrolSelector);
        data.forEach((item) => {
            let inspect = {};
            inspect.ts = this.reportTime.valueOf();
            inspect.inspectItemId = item.id;
            inspect.storeId = patrolSelector.store.storeId;
            inspect.grade = item.score;
            inspect.attachment = [];

            //if ((inspect.grade !== this.score[0].label) || (item.type !== 0)){
                item.attachment.forEach((key) => {
                    let url = JSON.parse(JSON.stringify(key.url));
                    if (key.mediaType !== enumSelector.mediaTypes.TEXT){
                        if(url.substring(0,5) != 'https') {
                            let ossKey = OSSUtil.formatOssUrl(MODULE_INSPECT, key.mediaType,
                                patrolSelector.store.storeId,item.id + '_' + this.keyIndex++);
                            url = (Platform.OS === 'android' && key.mediaType === enumSelector.mediaTypes.AUDIO) ? `file://${key.url}` : key.url;

                            dataSet.uploads.push(OSSUtil.upload(ossKey, url));
                            url = OSSUtil.formatRemoteUrl(ossKey);
                        }
                    }

                    inspect.attachment.push({
                        ts: key.ts,
                        mediaType: key.mediaType,
                        url: url,
                        deviceId: (key.deviceId != null) ? key.deviceId : -1
                    });
                });
            //}

            dataSet.data.push(inspect);
        });

        return dataSet;
    }

    formatFeedback(){
        let dataSet = {data:[], uploads:[]};
        let {patrolSelector, enumSelector} = this.state;

        let time = new Date().getTime();
        patrolSelector.feedback.forEach((item) => {
            let event = {
                ts: time,
                subject: item.subject,
                storeId: patrolSelector.store.storeId,
                deviceId: (item.deviceId) != null ? item.deviceId : -1,
                attachment: [],
                id: item.id ? item.id : -1
            };

            let addNullComment = true;
            item.attachment.forEach((key) => {
                addNullComment = false;
                let url = JSON.parse(JSON.stringify(key.url))
                if (key.mediaType !== enumSelector.mediaTypes.TEXT){
                    if(url.substring(0,5) != 'https') {
                        let ossKey = OSSUtil.formatOssUrl(MODULE_INSPECT, key.mediaType,
                            patrolSelector.store.storeId,event.deviceId + '_' + this.keyIndex++);
                        url = (Platform.OS === 'android' && key.mediaType === enumSelector.mediaTypes.AUDIO )? `file://${key.url}` : key.url;
    
                        dataSet.uploads.push(OSSUtil.upload(ossKey, url));
                        url = OSSUtil.formatRemoteUrl(ossKey);
                    }
                }

                event.attachment.push({
                    ts:key.ts,
                    mediaType: key.mediaType,
                    url: url,
                    deviceId: (key.deviceId != null) ? key.deviceId : -1
                });
            });
            if(addNullComment) {
                event.attachment.push({
                    ts:time,
                    mediaType: enumSelector.mediaTypes.TEXT,
                    url: '',
                    deviceId: -1
                });
            }

            dataSet.data.push(event);
        });

        return dataSet;
    }

    formatSignature(){
        let dataSet = {data:[], uploads:[]};
        let {patrolSelector, enumSelector} = this.state;

        patrolSelector.signatures.forEach((item) => {
            if(item.content && item.content.substring(0,5) != 'https') {
                let ossImageKey = OSSUtil.formatOssUrl(MODULE_INSPECT, enumSelector.mediaTypes.IMAGE,
                    patrolSelector.store.storeId,'-1' + this.keyIndex++);

                dataSet.uploads.push(OSSUtil.upload(ossImageKey,item.content));
                dataSet.data.push({
                    type: item.signPhoto ? 2 : 1,
                    orientation: item.signOrientation,
                    content: OSSUtil.formatRemoteUrl(ossImageKey),
                    header: item.header,
                    optional: item.optional
                })
            } else {
                dataSet.data.push(item);
            }
        });
        return dataSet;
    }

    formatApproveAttachment(){
        let dataSet = {data:[], uploads:[]};
        let {patrolSelector, enumSelector} = this.state;

        patrolSelector.attachments.forEach((item) => {
            if(item.content.substring(0,5) != 'https') {
                let ossImageKey = OSSUtil.formatOssUrl(MODULE_INSPECT, item.isPhoto ? enumSelector.mediaTypes.IMAGE : enumSelector.mediaTypes.PDF,
                    patrolSelector.store.storeId,'-1' + this.keyIndex++);
                dataSet.uploads.push(OSSUtil.upload(ossImageKey,item.content));
                dataSet.data.push({
                    mediaType: item.isPhoto ? enumSelector.mediaTypes.IMAGE : enumSelector.mediaTypes.PDF,
                    orientation: item.orientation,
                    content: OSSUtil.formatRemoteUrl(ossImageKey),
                    ts: moment().unix(),
                    fileName: item.fileName
                })
            } else {
                dataSet.data.push(item);
            }
        });
        return dataSet;
    }

    formatMapImage() {
        let {patrolSelector, enumSelector} = this.state;
        let dataSet = {content:'', uploads:[]};
        if(patrolSelector.mapDownloadPath) {
            let ossImageKey = OSSUtil.formatOssUrl(MODULE_INSPECT, enumSelector.mediaTypes.IMAGE,
                patrolSelector.store.storeId,'-1' + this.keyIndex++);
            dataSet.uploads.push(OSSUtil.upload(ossImageKey, patrolSelector.mapDownloadPath));
            dataSet.content = OSSUtil.formatRemoteUrl(ossImageKey);
        }
        return dataSet;
    }

    getData(){
        let {patrolSelector, totalPoints} = this.state;
        return {
            inspectTagId: patrolSelector.inspect.id,
            inspectTagName: patrolSelector.inspect.name,
            inspectReportId: 0,
            score: totalPoints,
            status: 0,
            mode: patrolSelector.inspect.mode,
            ts: moment().unix()*1000
        };
    }

    getType(){
        let {patrolSelector, enumSelector} = this.state;
        let scoreType = enumSelector.scoreType;
        let items = PatrolCore.getItems(patrolSelector);

        return (items.filter(p => p.type !== 0).length === items.length) ? 1 : 0;
    }

    onTemporary(){
        let {patrolSelector, reportSelector, enumSelector, status, weatherType, totalPoints} = this.state;

        if(patrolSelector.isWorkflowReport) {
            try {
                this.keyIndex = 0;
                SoundUtil.stop();

                OSSUtil.init(patrolSelector.store.storeId).then(()=>{
                    let patrols = this.formatPatrol();
                    let feedback = this.formatFeedback();
                    let signature = this.formatSignature();
                    let attachments = this.formatApproveAttachment();

                    this.indicator && this.indicator.open();
                    let pArray = [...patrols.uploads,...feedback.uploads,...signature.uploads];
                    Promise.all(pArray).then(async (res) => {
                        let body = {
                            status: status,
                            comment: patrolSelector.comment,
                            items: patrols.data,
                            feedback: feedback.data,
                            signatures: signature.data,
                            isCreateEvent: false,    // 暫存報告，不產生事件
                            reportScore: totalPoints
                        };

                        (patrolSelector.signTime !== 0) && (body.checkinId = patrolSelector.checkinId);
                        (patrolSelector.weatherId != null) && (body.uuid = patrolSelector.weatherId);
                        (weatherType != null) && (body.weatherType = weatherType);

                        body.reportId = patrolSelector.inspectReportId;
                        body.items.forEach(element => {
                            element.id = element.inspectItemId;
                            element.score = element.grade;
                        });
                        let result = await modifyInspectReport(body);
                        let submitResult = ((result.errCode === enumSelector.errorType.SUCCESS) || result.errMsg.indexOf('resubmit') != -1);
                        if (submitResult){
                            PatrolStorage.delete(patrolSelector.uuid);

                            setTimeout(() => {
                                reportSelector.temporaries = PatrolStorage.getManualCaches();
                                this.setState({reportSelector});

                                this.indicator && this.indicator.close();
                                EventBus.refreshApprovePage();
                                Actions.push('reportDetail',
                                    {
                                        data:{id: patrolSelector.inspectReportId, patrol:false},
                                        temporaryResult: true,
                                        noShare: true,
                                        modifyReport: true
                                    });
                            }, 1000);
                        } else {
                            if(result.errCode == enumSelector.errorType.SUBMITFAIL_NOPERMISSION) {
                                DeviceEventEmitter.emit('Toast', I18n.t('No Inspection Permission'));
                            }
                            this.indicator && this.indicator.close();
                            this.setState({submitResult});
                        }
                    }).catch(error => {
                        console.log("modify inspect error : ", JSON.stringify(error));
                        this.indicator && this.indicator.close();
                        this.setState({submitResult: false});
                    })
                }).catch(error => {
                });
            }catch (e) {
            }
        } else {
            let data = PatrolStorage.getManualCaches();
            if (data.length < 10){
                PatrolStorage.save({
                    uuid: patrolSelector.uuid,
                    mode: patrolSelector.inspect.mode,
                    tagName: patrolSelector.inspect.name,
                    storeName: patrolSelector.store.name,
                    autoState: '',
                    manualState: JSON.stringify(patrolSelector),
                    isMysteryModeOn: store.userSelector.isMysteryModeOn.toString()
                });

                reportSelector.temporaries = PatrolStorage.getManualCaches();
                this.setState({
                    temporaryResult: true,
                    reportSelector
                });
            }else {
                this.prompt && this.prompt.open();
            }
        }
    }

    renderHeader(){
        let {patrolSelector} = this.state, maxWidth = width-130;
        PhoneInfo.isEnLanguage() && (maxWidth = maxWidth-30);

        return (
            <View style={styles.header}>
                <Text style={[styles.storeName,{maxWidth}]}>{patrolSelector.store.name}</Text>
                <TouchableOpacity activeOpacity={0.6} onPress={() => this.onTemporary()}>
                    <View style={styles.temporary}>
                        <Image style={styles.saveIcon} source={require('../assets/img_save_report.png')}/>
                        <Text style={styles.saveText}>{I18n.t('Temporary report')}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    renderSignIn(){
        let {patrolSelector} = this.state, content = '';
        if ((patrolSelector.signTime != null) && (patrolSelector.signTime !== 0)){
            content = moment(patrolSelector.signTime).format('YYYY/MM/DD HH:mm:ss');
            content = `${I18n.t('Checked in Time')} : ${content}`;

            if(patrolSelector.checkinIgnore == false) {
                return <Text style={styles.signIn}>{content}</Text>
            } else {
                return  <View style={{flexDirection:'row', alignItems:'center'}}>
                            <Text style={styles.signIn}>{content}</Text>
                            <Text style={styles.ignore}>{I18n.t('Checkin Ignore')}</Text>
                        </View>
            }
        }
        return null;
    }

    renderDistance(){
        let {patrolSelector} = this.state;
        if((patrolSelector.signTime != null) && (patrolSelector.signTime !== 0)) {
            if (patrolSelector.distance != null) {
                let distance = `${I18n.t('Checked in Distance')} : ${patrolSelector.distance}m`;
                return <Text style={styles.distance}>{distance}</Text>;
            } else {
                return <Text style={styles.distance}>{I18n.t('Checked in Distance Over')}</Text>;
            }
        }

        return null;
    }

    onBack(){
        let {patrolSelector, screenSelector} = this.state;
        patrolSelector.router = screenSelector.patrolType.PATROL;

        this.setState({patrolSelector}, () => {
            EventBus.updatePatrolData();
            EventBus.closePopupPatrol();
            Actions.pop()
        });
    }

    render() {
        let {patrolSelector, submitResult, temporaryResult, showScrollTop, schedules, categoryData, whiteList, userSelector} = this.state;
        let isShowSchedule = false;
        if(whiteList.length > 0) {
            if(whiteList.indexOf(userSelector.accountId) != -1) {
                isShowSchedule = true;
            }
        }
        return (
            <TouchableActive style={styles.container}>
                <Navigation
                    onLeftButtonPress={() => {this.onBack()}}
                    title={I18n.t('Confirm summary')}
                    rightButtonTitle={I18n.t('Report send')}
                    rightButtonStyle={{activeColor:'#C60957', inactiveColor:'#DCDFE5',
                        textColor:'#ffffff', padding: 12, fontSize:14}}
                    onRightButtonPress={()=>{this.onSeed()}}
                />
                <NetInfoIndicator/>

                <TouchableInactive>
                    <ScrollView ref={c => this.scroll = c}
                                onScroll={event => {
                                    let showScrollTop = (event.nativeEvent.contentOffset.y > 200);
                                    this.setState({showScrollTop});
                                }}
                                style={styles.panel}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps={'never'}>
                        <TouchableActive>
                            {this.renderHeader()}
                            {this.renderSignIn()}
                            {this.renderDistance()}
                            <PatrolRecord storeId={patrolSelector.store.storeId}
                                          data={this.getData()}
                                          additionalInfo={false}
                                          changeWeather={true}
                                          onSelect={(weatherType) => {this.setState({weatherType})}}
                                          type={this.getType()}/>
                            {this.renderStatus()}
                            {this.renderComment()}
                            {this.renderSignature()}
                            {this.renderWorkflow()}
                            {this.renderMap()}

                            <PatrolClassify data={patrolSelector.data} categoryData={categoryData} inspectSettings={patrolSelector.inspectSettings} />
                            <Feedback data={patrolSelector.feedback} showOperator={false}/>

                            {isShowSchedule && !AccessHelper.enableSchedule() == false && this.renderSchedule()}
                        </TouchableActive>
                        <SlotPatrol />
                    </ScrollView>
                    <ScrollTop showOperator={showScrollTop} onScroll={()=> {this.scroll && this.scroll.scrollTo({x:0,y:0,animated:true})}}/>
                </TouchableInactive>
                <PopupPatrol />

                <ModalCenter ref={c => this.modalConfirm = c}
                             title={I18n.t('Report send')}
                             description={I18n.t('Patrol submit')}
                             confirm={()=>this.onSubmit()} />

                <ModalCenter ref={c => this.prompt = c}
                             title={I18n.t('Temporary max title')}
                             description={I18n.t('Temporary max detail')}
                             showCancel={false} />

                <ModalCenter ref={c => this.modalSystemReject = c}
                             title={I18n.t('System Approve Withdraw')}
                             description={I18n.t('System Reject Description')}
                             showCancel={false}
                             confirm={()=>this.onActionPush()} />
                
                <ModalSchedule  ref={c => this.modalSchedule = c} data={schedules}
                                onSelect={(data) => {
                                    this.setState({selectSchedule: data});
                                }}/>

                <ProgressIndicator ref={c => this.indicator = c} />
                <PatrolResult status={submitResult} reset={() => {this.setState({submitResult: null})}}/>
                <TemporaryResult status={temporaryResult} reset={() => {this.setState({temporaryResult: null})}}/>
                <AndroidBacker onPress={() => {
                    this.onBack();
                    return true;
                }}/>
            </TouchableActive>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor:'#F7F9FA'
    },
    title:{
        fontSize: 16,
        marginTop: 16,
        marginLeft:10,
        color:'#64686D'
    },
    panel:{
        paddingLeft:10,
        paddingRight:10
    },
    storeName:{
        fontSize:20,
        marginLeft:10,
        color:'#64686D',
        marginTop:-6
    },
    label:{
        fontSize:16,
        color:'#64686D'
    },
    content:{
        fontSize:14,
        color:'#86888A'
    },
    statusView:{
        flexDirection:'row',
        justifyContent:'space-between'
    },
    statusPanel:{
        width:(width-60)/3,
        backgroundColor:'#ffffff',
        borderRadius:10,
        height: 32
    },
    statusContent:{
        fontSize:14.5,
        color:'#86888A',
        textAlign:'center',
        textAlignVertical:'center',
        height:32,
        lineHeight:32
    },
    comment:{
        width:width-40,
        maxHeight:120,
        marginLeft:10,
        paddingTop:11,
        paddingBottom:11,
        paddingRight: 16,
        borderRadius:10,
        marginTop:16,
        paddingLeft:16,
        fontSize:14,
        color:'#1E272E',
        backgroundColor:'#ffffff'
    },
    name:{
        width:width-40,
        maxHeight:120,
        marginLeft:10,
        paddingTop:11,
        paddingBottom:11,
        paddingRight: 16,
        borderRadius:10,
        marginTop:8,
        marginBottom: 16,
        paddingLeft:16,
        fontSize:14,
        color:'#1E272E',
        backgroundColor:'#EBF1F4'
    },
    pencil:{
        position:'absolute',
        top: 43,
        right:20,
        width:16,
        height:16
    },
    header:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop:30,
        paddingRight:20
    },
    temporary:{
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    saveIcon:{
        width:15,
        height:15
    },
    map:{
        marginTop:10
    },
    saveText:{
        fontSize:12,
        color:'#006AB7',
        marginLeft:6
    },
    signPanel:{
        flexDirection:'row',
        justifyContent:'flex-start',
        marginTop:18
    },
    starLabel:{
        color:'#ff2400',
        marginLeft:10
    },
    signIn:{
        fontSize:12,
        color:'rgb(134,136,138)',
        marginTop:4,
        marginLeft:10,
        marginBottom:10
    },
    ignore:{
        fontSize:12,
        color:'rgba(133, 137, 142, 0.5)',
        backgroundColor:'#EFEFEF',
        borderRadius:4,
        marginTop:4,
        marginLeft:10,
        marginBottom:10,
        paddingRight:4,
        paddingLeft:4,
        paddingTop:2,
        paddingBottom:2
    },
    distance:{
        fontSize:12,
        color:'rgb(134,136,138)',
        marginLeft:10,
        marginBottom:10
    },
    divider:{
        height:2,
        marginTop:11,
        backgroundColor: 'rgb(242,242,242)',
        borderBottomWidth:0
    },
    scheduleContainer:{
        backgroundColor:'#fff', 
        marginTop:12, 
        marginBottom:20, 
        marginLeft:14, 
        marginRight:14, 
        borderRadius:10, 
        flex:1
    },
    scheduleTitle:{
        fontSize:14,
        color:'rgb(134,136,138)'
    },
    scheduleContent:{
        fontSize:14,
        color:'rgb(100,104,109)',
        marginTop:11,
        marginBottom:10
    },
    scheduleChange:{
        fontSize:16,
        color:'rgb(0,106,183)',
        textAlign:'right',
        marginTop:15,
        marginRight:12
    }
});
