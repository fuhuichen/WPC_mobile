import React from 'react';
import HttpUtil from "../utils/HttpUtil";
import store from "../../mobx/Store";

export function loginRequest(body){
    return HttpUtil.postAsync('login', body);
}

export function logoutRequest(){
    return HttpUtil.postAsync('logout');
}

export function getApiResult(){
    return HttpUtil.getApiResult();
}

export function getUserInfo(){
    return HttpUtil.getAsync('user/info');
}

export function tokenUpdate(body){
    return HttpUtil.postAsync('token/update', body);
}

export function getUserAccountList(){
    return HttpUtil.getAsync('user/account/list/viaPortal');
}

export function getStoreList(){
    if(store.userSelector.isMysteryModeOn == true) {
        return HttpUtil.getAsync('mystery/store/basic/list');
    } else {
        return HttpUtil.getAsync('store/basic/list');
    }
}

export function getAppVersion(platform){
    return HttpUtil.getAsync(`app/version?platform=${platform}`);
}

export function changeAccountId(accountId){
    return HttpUtil.postAsync(`user/change/account?accountId=${accountId}`);
}

export function getStatusList(data){
    return HttpUtil.postAsync('inspect/status/list', data);
}

export function getAdjacent(data){
    return HttpUtil.getAsync(`store/adjacent/basic/list?latitude=${data.latitude}&longitude=${data.longitude}&distance=${data.distance}&isMysteryMode=${store.userSelector.isMysteryModeOn}&size=${data.size}`);
}

export function getLastInspectList(data){
    data.isMysteryMode = store.userSelector.isMysteryModeOn ? true : false;
    data.personal = store.userSelector.isMysteryModeOn ? true : false;
    return HttpUtil.postAsync('store/last/inspect/list', data);
}

export function forgetpwd(data){
    return HttpUtil.post('user/forgetpwd', data);
}

export function getStoreHistory(param){
    if(store.userSelector.isMysteryModeOn) {
        param += '&isMysteryMode=true'
    }
    return HttpUtil.getAsync(`inspect/store/history?${param}`);
}

export function getStoreWeather(param){
    return HttpUtil.postAsync(`weather/info/check?${param}`);
}

export function getReportList(data){
    if(data.searchMysteryMode == null) {
        data.searchMysteryMode = store.userSelector.isMysteryModeOn ? 1 : -1;
        if(store.userSelector.isMysteryModeOn == true) {
            data.submitter = store.userSelector.userId;
        }
    }    
    return HttpUtil.postAsync('inspect/report/list', data);
}

export function getStoreInfo(storeId, includeRule) {
    if(store.userSelector.isMysteryModeOn == true) {
        return HttpUtil.getAsync(`mystery/store/info?storeId=${storeId}&includeRule=${includeRule}`);
    } else {
        return HttpUtil.getAsync(`store/info?storeId=${storeId}&includeRule=${includeRule}`);
    }
}

export function checkoutInspect(storeId, mode, inspectId) {
    return HttpUtil.getAsync("${v3.0}" + `/inspect/checkout?storeId=${storeId}&mode=${mode}&inspectId=${inspectId}`);
}

export function submitInspect(data){
    return HttpUtil.postAsync('${v3.0}/inspect/submit', data);
}

export function getInspectTagList(mode) {
    if(mode == null){
        if(store.userSelector.isMysteryModeOn == true) {
            return HttpUtil.getAsync(`mystery/inspect/tag/list`);
        } else {
            return HttpUtil.getAsync(`inspect/tag/list`);
        }
    }else{
        if(store.userSelector.isMysteryModeOn == true) {
            return HttpUtil.getAsync(`mystery/inspect/tag/list?mode=${mode}`);
        } else {
            return HttpUtil.getAsync(`inspect/tag/list?mode=${mode}`);
        }
    }
}

export function getReportInfo(data) {
    return HttpUtil.postAsync('${v5.0}/inspect/report/info', data);
}

export function getReportExport(data) {
    return HttpUtil.postAsync('inspect/report/export/app', data);
}

export function getReportTemplate() {
    return HttpUtil.getAsync('inspect/report/template/list?enable=true');
}

export function getEventStatisticsByStatus(data) {
    return HttpUtil.postAsync('statistics/store/event', data);
}

export function getEventByInspect(data) {
    return HttpUtil.postAsync('event/last/inspect', data);
}

export function addCommentWithFeedback(data) {
    return HttpUtil.postAsync('event/comment/add/one', data);
}

export function getEventList(data) {
    return HttpUtil.postAsync('event/list/comment', data);
}

export function batchEventClose(data) {
    return HttpUtil.postAsync('event/batch/close/store', data);
}

export function addEventComment(data) {
    return HttpUtil.postAsync('event/comment/add', data);
}

export function addEvent(data) {
    return HttpUtil.postAsync('event/add', data);
}

export function getInspectReportOverview(data) {
    return HttpUtil.postAsync('${v2.0}/statistics/inspect/report/overview', data);
}

export function getInspectItemOverview(data) {
    return HttpUtil.postAsync('${v2.0}/statistics/inspect/item/overview', data);
}

export function getEventLastInspectGroup(data) {
    return HttpUtil.postAsync('event/last/inspect/group', data);
}

export function getInspectStoreHistory(data){
    if(data.isMysteryMode != true) {
        data.isMysteryMode = store.userSelector.isMysteryModeOn ? true : false;
    }
    return HttpUtil.postAsync('inspect/store/history', data);
}

export function getInspectReportGroupOverview(data) {
    return HttpUtil.postAsync('statistics/inspect/report/group/overview', data);
}

export function getStatisticsEventOverview(data) {
    return HttpUtil.postAsync('${v2.0}/statistics/event/overview', data);
}

export function getStatisticsEventGroup(data) {
    return HttpUtil.postAsync('statistics/event/group', data);
}

export function getStatisticsInspectItemGroup(data) {
    return HttpUtil.postAsync('statistics/inspect/item/group', data);
}

export function getStatisticsInspectReportPersion(data) {
    return HttpUtil.postAsync('${v3.0}/statistics/inspect/report/person', data);
}

export function getStatisticsInspectStore(data){
    return HttpUtil.postAsync('statistics/inspect/store', data);
}

export function getInspectRuleSetting(inspectId) {
    return HttpUtil.getAsync(`inspect/rules?inspectId=${inspectId}`);
}

export function getStoreDefine(type){
    return HttpUtil.getAsync(`store/define/list?type=${type}`);
}

export function getUserDefine(type){
    return HttpUtil.getAsync(`user/define/list?type=${type}`);
}

export function getUserDefineAll(type){
    return HttpUtil.getAsync(`user/define/list/all?type=${type}`);
}

export function getUserList(){
    return HttpUtil.getAsync('user/list');
}

export function getUserListAll(){
    return HttpUtil.getAsync('user/list/all');
}

export function getStoreUser(data){
    return HttpUtil.postAsync('store/user',data);
}

export function getSystemTime(){
    return HttpUtil.getAsync('checkin/time');
}

export function uploadCheckin(data){
    return HttpUtil.postAsync('checkin/upload',data);
}

export function getEventStatusByLastInspect(data){
    return HttpUtil.postAsync('event/status/last/inspect',data);
}

export function getStoreContent(body) {
    return HttpUtil.postAsync('store/list', body);
}

export function getWorkflowTask(data) {
    return HttpUtil.postAsync('workflow/task', data);
}

export function getWorkflowTaskList(data) {
    data.isMysteryMode = store.userSelector.isMysteryModeOn ? true : false;
    return HttpUtil.postAsync('workflow/task/list', data);
}

export function getWorkflowForm(data){
    return HttpUtil.postAsync('workflow/form', data);
}

export function getWorkflowTaskConfig(data) {
    return HttpUtil.postAsync('workflow/config', data);
}

export function submitWorkflow(data) {
    return HttpUtil.postAsync('workflow/submit', data)
}

export function submitWorkflowTask(data) {
    return HttpUtil.postAsync('workflow/task/submit', data)
}

export function resubmitWorkflow(data) {
    return HttpUtil.postAsync('workflow/resubmit', data)
}

export function getWorkflowTaskInfo(id, type) {
    return HttpUtil.getAsync(`workflow/task/info?inspectReportId=${id}&type=${type}`);
}

export function getWorkflowTaskNode(id) {
    return HttpUtil.getAsync(`workflow/task/node?taskId=${id}`);
}

export function getWorkflowInfo(key) {
    return HttpUtil.getAsync(`workflow/info?processDefinitionKey=${key}`);
}

export function cancelWorkflow(data) {
    return HttpUtil.postAsync('workflow/cancel', data)
}

export function drawbackWorkflow(data) {
    return HttpUtil.postAsync('workflow/drawback', data)
}

export function modifyInspectReport(data) {
    return HttpUtil.postAsync('workflow/report/modify', data)
}

export function isMysteryMode() {
    return HttpUtil.getAsync(`mystery/isMysteryMode`);
}

export function getGeneralSetting() {
    return HttpUtil.getAsync('general/setting/get');
}

export function getScheduleList(data) {
    return HttpUtil.postAsync('report/schedule/person/task/fetch/filter', data)
}

export function getInspectScheduleList(data) {
    return HttpUtil.postAsync('report/schedule/person/task/stock/fetch', data)
}

export function getScheduleWhiteList() {
    return HttpUtil.getAsync('report/schedule/white/list');
}

export function getNotificationMessageList(data) {
    return HttpUtil.postAsync('notify/fetch', data)
}

export function clearNotificationMessageList(data) {
    return HttpUtil.postAsync('notify/update/clear', data)
}

export function clearAllNotificationMessageList(data) {
    return HttpUtil.postAsync('notify/clearAll', data)
}

export function readNotificationMessageList(data) {
    return HttpUtil.postAsync('notify/update/read', data)
}

export function getNotificationMessageUnread(data) {
    return HttpUtil.postAsync('notify/isUnread', data)
}

export function getAdvancedSetting(data) {
    return HttpUtil.postAsync('system/advanced/fetch/content', data);
}