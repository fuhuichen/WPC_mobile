import React from 'react';
import HttpUtil from "../utils/HttpUtil";
import store from "../../mobx/Store";

export function getUserInfo_Cashcheck(){
    return HttpUtil.getAsync_CashCheck('user/info');
}

export function tokenUpdate_Cashcheck(data){
    return HttpUtil.postAsync_CashCheck('token/update', data);
}

export function getCashCheckFormTemplate(data) {
    return HttpUtil.postAsync_CashCheck('form/template/fetch/detail', data)
}

export function submitCashCheckReport(data) {
    return HttpUtil.postAsync_CashCheck('report/instance/submit', data)
}

export function modifyCashCheckReport(data) {
    return HttpUtil.postAsync_CashCheck('report/instance/modify', data)
}

export function getCashCheckReportList(data) {
    return HttpUtil.postAsync_CashCheck('report/instance/list', data)
}

export function getCashCheckAdvancedConfig(data) {
    return HttpUtil.postAsync_CashCheck('form/template/config/advanced/fetch', data)
}

export function getCashCheckExecuteFormList(data) {
    return HttpUtil.postAsync_CashCheck('form/template/execute/list', data)
}

export function getCashCheckReportInfo(data) {
    return HttpUtil.postAsync_CashCheck('report/instance/checkout', data)
}

export function getAdjacent(data){
    return HttpUtil.getAsync_CashCheck(`store/adjacent/basic/list?latitude=${data.latitude}&longitude=${data.longitude}&distance=${data.distance}&isMysteryMode=${store.userSelector.isMysteryModeOn}`);
}

export function getStoreList_Cashcheck(){
    return HttpUtil.getAsync_CashCheck('store/basic/list');
}
