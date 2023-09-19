import React from 'react';
import HttpUtil from "../utils/HttpUtil";

export function loginRequest(body){
    return HttpUtil.postAsync('login', body);
}

export function getApiResult(){
    return HttpUtil.getApiResult();
}

export function getUserInfo(){
    return HttpUtil.getAsync('user/info');
}

export function getUserAccountList(){
    return HttpUtil.getAsync('user/account/list/viaPortal');
}

export function getStoreList(){
    return HttpUtil.getAsync('store/basic/list');
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
    return HttpUtil.getAsync(`store/adjacent/basic/list?latitude=${data.latitude}&longitude=${data.longitude}`);
}

export function getLastInspectList(data){
    return HttpUtil.postAsync('store/last/inspect/list', data);
}

export function forgetpwd(data){
    return HttpUtil.post('user/forgetpwd', data);
}

export function getStoreHistory(param){
    return HttpUtil.getAsync(`inspect/store/history?storeId=${param.storeId}&inspectTagId=${param.inspectTagId}`);
}

export function getReportList(data){
    return HttpUtil.postAsync('inspect/report/list', data);
}

export function getStoreInfo(storeId) {
    return HttpUtil.getAsync(`store/info?storeId=${storeId}`);
}

export function checkoutInspect(storeId, mode, inspectId) {
    return HttpUtil.getAsync("${v3.0}" + `/inspect/checkout?storeId=${storeId}&mode=${mode}&inspectId=${inspectId}`);
}

export function submitInspect(data){
    return HttpUtil.postAsync('${v3.0}/inspect/submit', data);
}

export function getInspectTagList(mode) {
    if(mode == null){
        return HttpUtil.getAsync(`inspect/tag/list`);
    }else{
        return HttpUtil.getAsync(`inspect/tag/list?mode=${mode}`);
    }
}

export function getReportInfo(data) {
    return HttpUtil.postAsync('${v5.0}/inspect/report/info', data);
}
