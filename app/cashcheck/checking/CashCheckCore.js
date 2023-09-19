import React from 'react';
import _ from "lodash";
import I18n from 'react-native-i18n';
import store from "../../../mobx/Store";
import { DeviceEventEmitter } from "react-native";

export default class CashCheckCore {
    static init(selector, data){
        let categories = [], tmpRootGroups = [];
        if(data.groups && data.groups.length > 0) {
            data.groups.forEach((element, index) => {
                let rootGroup = element.rootGroup;
                if(index == 0) {
                    selector.categoryType = rootGroup.id;
                }
                let category = {
                    id: rootGroup.id,
                    name: rootGroup.name,
                    isDynamic: rootGroup.groupSettings.is_dynamic_edit,
                    copyMax: rootGroup.groupSettings.number_limit_of_dynamic,
                    copyCount: 1
                }
                categories.push(category);

                let groups = [], itemList = [];
                if(element.hasSubGroups == true && element.subGroups != null) {
                    element.subGroups.forEach(subGroup => {
                        let items = [];
                        if(subGroup.itemList != null) {
                            subGroup.itemList.forEach(item => {
                                let tmpItem = {
                                    id: item.id,
                                    parentId: item.groupId,
                                    subject: item.name,
                                    inputType: item.inputType, // 數值輸入, 文字輸入, 系統計算
                                    isRequired: item.isRequired,
                                    calcSettings: item.calcSettings,
                                    conditions: item.conditions,
                                    value: null
                                }
                                items.push(tmpItem);
                            })
                        }
                        
                        let tmpsubGroup = {
                            groupId: subGroup.id,
                            groupName: subGroup.name,
                            parentId: subGroup.parentGroupId,
                            items: items
                        }
                        groups.push(tmpsubGroup);
                    });                    
                } else if(element.hasSubGroups == false && element.rootGroup.itemList != null) {
                    element.rootGroup.itemList.forEach(item => {
                        let tmpItem = {
                            id: item.id,
                            parentId: item.groupId,
                            subject: item.name,
                            inputType: item.inputType, // 數值輸入, 文字輸入, 系統計算
                            isRequired: item.isRequired,
                            calcSettings: item.calcSettings,
                            conditions: item.conditions,
                            value: null
                        }
                        itemList.push(tmpItem);
                    })
                }
                let tmpRootGroup = {
                    id: rootGroup.id,
                    name: rootGroup.name,
                    groups: groups,
                    itemList: itemList,
                    isCopy: false
                }
                tmpRootGroups.push(tmpRootGroup);
            });
        }
        categories.push({
            id:null,
            name:I18n.t('Attachment'),
            isDynamic:false
        })
        selector.categories = categories;
        selector.rootGroups = tmpRootGroups;
        selector.appViewConfig = data.appViewConfig;
        selector.tagName = data.tagName;
        selector.signatures = [];
        selector.attachments = [];
        selector.status = null;

        return selector;
    }

    static initModify(selector, data){
        let categories = [], tmpRootGroups = [];

        if(data.rootGroups && data.rootGroups.length > 0) {
            let tmpReferGroupId = "";
            data.rootGroups.forEach((rootGroup, index) => {
                if(index == 0) {
                    selector.categoryType = rootGroup.id;
                }
                let category = {
                    id: rootGroup.id,
                    referGroupId: rootGroup.referGroupId,
                    name: rootGroup.groupName,
                    isDynamic: rootGroup.groupSettings.is_dynamic_edit,
                    copyMax: rootGroup.groupSettings.number_limit_of_dynamic,
                    copyCount: this.getCopyCount(data.rootGroups, rootGroup.referGroupId),
                    isCopy: (rootGroup.referGroupId == tmpReferGroupId) ? true : false
                }
                categories.push(category);

                let groups = [], itemList = [];
                if(rootGroup.subGroups.length > 0) {
                    rootGroup.subGroups.forEach(subGroup => {
                        let items = [];
                        if(subGroup.items != null) {
                            subGroup.items.forEach(item => {
                                let tmpItem = {
                                    id: item.id,
                                    referItemId: item.referItemId,
                                    parentId: item.groupId,
                                    subject: item.itemName,
                                    inputType: item.inputType, // 數值輸入, 文字輸入, 系統計算
                                    isRequired: item.isRequired,
                                    calcSettings: item.calcSettings,
                                    conditions: item.conditions,
                                    value: item.value
                                }
                                items.push(tmpItem);
                            })
                        }
                        
                        let tmpsubGroup = {
                            groupId: subGroup.id,
                            groupName: subGroup.groupName,
                            parentId: subGroup.parentGroupId,
                            items: items
                        }
                        groups.push(tmpsubGroup);
                    });                    
                } else if(rootGroup.items != null) {
                    rootGroup.items.forEach(item => {
                        let tmpItem = {
                            id: item.id,
                            referItemId: item.referItemId,
                            parentId: item.groupId,
                            subject: item.itemName,
                            inputType: item.inputType, // 數值輸入, 文字輸入, 系統計算
                            isRequired: item.isRequired,
                            calcSettings: item.calcSettings,
                            conditions: item.conditions,
                            value: item.value
                        }
                        itemList.push(tmpItem);
                    })
                }
                let tmpRootGroup = {
                    id: rootGroup.id,
                    name: rootGroup.groupName,
                    groups: groups,
                    itemList: itemList,
                    isCopy: (rootGroup.referGroupId == tmpReferGroupId) ? true : false
                }
                tmpRootGroups.push(tmpRootGroup);
                tmpReferGroupId = rootGroup.referGroupId;
            });
        }
        categories.push({
            id:null,
            name:I18n.t('Attachment'),
            isDynamic:false
        })

        selector.categories = categories;
        selector.rootGroups = tmpRootGroups;
        selector.appViewConfig = data.formSetting ? data.formSetting.setting_app_view : {};
        selector.tagName = data.formName;
        data.signatures.forEach(signature => {
            signature.content = signature.url;
        })
        selector.signatures = data.signatures;
        selector.attachments = data.attachments;
        selector.status = data.status;
        return selector;
    }

    static getCopyCount(rootGroups, groupId) {
        let count = 0;
        rootGroups.forEach(rootGroup => {
            if(rootGroup.referGroupId == groupId) {
                count++;
            }
        })
        return count;
    }

    static isInteger(data){
        return data.every(p => {
            return Number.isInteger(p);
        });
    }

    static getItems(selector){
        let itemList = [];
        selector.rootGroups.forEach(rootGroup => {
            if(rootGroup.groups && rootGroup.groups.length > 0) {
                rootGroup.groups.forEach(group => {
                    if(group.items && group.items.length > 0) {
                        group.items.forEach(item => {
                            let itemTmp = JSON.parse(JSON.stringify(item));
                            if(itemTmp.inputType == store.enumSelector.cashcheckInputType.NUMBER) {
                                itemTmp.value = parseInt(itemTmp.value);
                            }
                            itemList.push(itemTmp);
                        })
                    }
                })
            } else if (rootGroup.itemList && rootGroup.itemList.length > 0) {
                rootGroup.itemList.forEach(item => {
                    let itemTmp = JSON.parse(JSON.stringify(item));
                    if(itemTmp.inputType == store.enumSelector.cashcheckInputType.NUMBER) {
                        itemTmp.value = parseInt(itemTmp.value);
                    }
                    itemList.push(itemTmp);
                })
            }
        })
        return itemList;
    }

    static setItemValue(selector, id, value) {
        try{
            selector.rootGroups.forEach(rootGroup => {
                if(rootGroup.id == selector.categoryType) {
                    if(rootGroup.groups && rootGroup.groups.length > 0) {                    
                        rootGroup.groups.forEach(group => {
                            if(group.items && group.items.length > 0) {
                                group.items.forEach(item => {
                                    if(item.id == id) {
                                        item.value = value;
                                    }
                                })
                            }
                        })
                    } else if (rootGroup.itemList && rootGroup.itemList.length > 0) {
                        rootGroup.itemList.forEach(item => {
                            if(item.id == id) {
                                item.value = value;
                            }
                        })
                    }
                }
            })
        }
        catch(e) {
            console.log("setItemValue error : ", e)
        }
    }

    static checkItemRequiredUnfinish(selector) {
        let unfinished = false;
        selector.rootGroups.forEach(rootGroup => {
            if(rootGroup.groups && rootGroup.groups.length > 0) {
                rootGroup.groups.forEach(group => {
                    if(group.items && group.items.length > 0) {
                        group.items.forEach(item => {
                            if(item.inputType == store.enumSelector.cashcheckInputType.SYSTEMCALC) {
                                // 填入系統計算項目的值
                                item.value = this.getSystemCalculateValue(selector, item.id);
                                if(item.value == null) {
                                    item.value = 0;
                                }
                            } else if(item.isRequired == true && (item.value == "" || item.value == null)) {
                                unfinished = true;
                            }
                        })
                    }
                })
            } else if (rootGroup.itemList && rootGroup.itemList.length > 0) {
                rootGroup.itemList.forEach(item => {
                    if(item.inputType == store.enumSelector.cashcheckInputType.SYSTEMCALC) {
                        // 填入系統計算項目的值
                        item.value = this.getSystemCalculateValue(selector, item.id);
                        if(item.value == null) {
                            item.value = 0;
                        }
                    } else if(item.isRequired == true && (item.value == "" || item.value == null)) {
                        unfinished = true;
                    }
                })
            }
        })
        return unfinished;
    }

    static checkItemTypeNumberCorrect(selector) {
        let correct = true;
        selector.rootGroups.forEach(rootGroup => {
            if(rootGroup.groups && rootGroup.groups.length > 0) {
                rootGroup.groups.forEach(group => {
                    if(group.items && group.items.length > 0) {
                        group.items.forEach(item => {
                            if(item.inputType == store.enumSelector.cashcheckInputType.NUMBER && item.value != null && item.value != '') {
                                item.value = parseInt(item.value);
                                if(isNaN(item.value) == true) {
                                    correct = false
                                }
                            }
                        })
                    }
                })
            }
        })
        return correct;
    }

    static categoryDynamicSet(selector, categories) {
        try {
            let tmpCategories = this.filterCategories(selector, categories);            
            let ids = [];
            tmpCategories.forEach(category => {
                ids.push(category.id);
            })
            let tmpRootGroups = [];
            // 刪除多餘的類別
            selector.rootGroups.forEach(rootGroup => {
                if(rootGroup.id.toString().includes('_') == true || rootGroup.isCopy == true) {
                    if(ids.indexOf(rootGroup.id) !== -1) {
                        tmpRootGroups.push(rootGroup);
                    }
                } else {
                    let oriCopyCount = this.getCategoryCopyCount(selector.categories, rootGroup.id);
                    let newCopyCount = this.getCategoryCopyCount(categories, rootGroup.id);
                    if(oriCopyCount == 1 && newCopyCount > 1) {
                        rootGroup.name += '1';
                    } else if(oriCopyCount > 1 && newCopyCount == 1) {
                        rootGroup.name = rootGroup.name.slice(0,-1);
                    }
                    tmpRootGroups.push(rootGroup);
                }
            })
            // 新增動態增加的類別
            let newCopyCount = 0, tmp2RootGroups = [], templateRootGroup = null, newIndex = 1;
            tmpRootGroups.forEach(rootGroup => {
                if(rootGroup.id.toString().includes('_') == false || rootGroup.isCopy == false) {
                    if(newCopyCount > 0) {
                        for(let i=0 ; i<newCopyCount ; i++) {
                            tmp2RootGroups.push({
                                id: templateRootGroup.id + '_' + newIndex,
                                name: templateRootGroup.name.slice(0,-1) + newIndex,
                                groups: this.getClearValueGroups(templateRootGroup.groups),
                                itemList: this.getClearValueItemList(templateRootGroup.itemList),
                                isCopy: true
                            })
                            newIndex++;
                        }
                        tmp2RootGroups.push(rootGroup);
                        templateRootGroup = JSON.parse(JSON.stringify(rootGroup));
                        newCopyCount = this.getCategoryCopyCount(categories, rootGroup.id) - this.getCategoryCopyCount(selector.categories, rootGroup.id);
                        newIndex = this.getCategoryCopyCount(selector.categories, rootGroup.id) + 1;
                    } else {
                        tmp2RootGroups.push(rootGroup);
                        templateRootGroup = JSON.parse(JSON.stringify(rootGroup));
                        newCopyCount = this.getCategoryCopyCount(categories, rootGroup.id) - this.getCategoryCopyCount(selector.categories, rootGroup.id);
                        newIndex = this.getCategoryCopyCount(selector.categories, rootGroup.id) + 1;
                        // 先存起來等之前複製的push進去
                    }
                } else {                
                    tmp2RootGroups.push(rootGroup);
                }
            })
            if(newCopyCount > 0) {
                for(let i=0 ; i<newCopyCount ; i++) {
                    tmp2RootGroups.push({
                        id: templateRootGroup.id + '_' + newIndex,
                        name: templateRootGroup.name.slice(0,-1) + newIndex,
                        groups: this.getClearValueGroups(templateRootGroup.groups),
                        itemList: this.getClearValueItemList(templateRootGroup.itemList),
                        isCopy: true
                    })
                    newIndex++;
                }                
            }
            selector.categories = tmpCategories;
            selector.rootGroups = tmp2RootGroups;
            let categoryTypeDelete = true;
            tmpCategories.forEach(category => {
                if(selector.categoryType == category.id) {
                    categoryTypeDelete = false;
                }
            })
            if(categoryTypeDelete == true) {
                selector.categoryType = tmpCategories[0].id;
            }
        }
        catch(e) {
            console.log("categoryDynamicSet error : ", JSON.stringify(e));
        }        
    }

    static filterCategories(selector, categories) {
        let tmpCategories = [], remainCopyCount = 0, newCopyCount = 0;
        categories.forEach(category => {
            if(category.isCopy == false || category.isCopy == null) {   // 非複製的類別
                let oriCopyCount = this.getCategoryCopyCount(selector.categories, category.id);
                newCopyCount = (category.copyCount > oriCopyCount) ? (category.copyCount - oriCopyCount) : 0;
                remainCopyCount = ((category.copyCount > 1) && (oriCopyCount > 1)) ? ((category.copyCount >= oriCopyCount) ? (oriCopyCount - 1) : (category.copyCount - 1)) : 0;
                //let nowCopyCount = this.getCopyCount(selector.rootGroups, category.referGroupId)
                let oriCategoryName = '';
                if(oriCopyCount == 1 && category.copyCount > 1) {
                    oriCategoryName = category.name;
                    category.name += '1';
                } else if(oriCopyCount > 1 && category.copyCount == 1) {
                    category.name = category.name.slice(0,-1);
                    oriCategoryName = category.name;
                } else if(oriCopyCount > 1 && category.copyCount > 1) {
                    oriCategoryName = category.name.slice(0,-1);
                }
                tmpCategories.push(category);
                if(category.isDynamic == true && remainCopyCount == 0 && newCopyCount > 0) {
                    for(var i=2 ; newCopyCount > 0 ; ++i) {
                        tmpCategories.push({
                            id: category.id + '_' + i,
                            referGroupId: category.referGroupId || category.id,
                            name: oriCategoryName + i,
                            isCopy: true
                        })
                        newCopyCount--;
                    }
                }
            } else if(category.isCopy == true) {    // 複製的類別
                if(remainCopyCount > 0) {
                    tmpCategories.push(category);
                    remainCopyCount--;
                    if(remainCopyCount == 0 && newCopyCount > 0) {
                        for(var i=category.copyCount+1 ; newCopyCount > 0 ; ++i) {
                            tmpCategories.push({
                                id: category.id + '_' + i,
                                referGroupId: category.referGroupId || category.id,
                                name: oriCategoryName + i,
                                isCopy: true
                            })
                            newCopyCount--;
                        }
                    }
                }
            }
        })
        return tmpCategories;
    }

    static getCategoryCopyCount(categories, id) {
        let copyCount = 1;
        categories.forEach(category => {
            if(category.id == id) {
                copyCount = category.copyCount;
            }
        })
        return copyCount;
    }

    static getClearValueGroups(groups) {
        if(groups && groups.length > 0) {
            groups.forEach(group => {
                group.items.forEach(item => {                    
                    item.value = "";
                })
            })
        }
        return JSON.parse(JSON.stringify(groups));
    }

    static getClearValueItemList(itemList) {
        if(itemList && itemList.length > 0) {
            itemList.forEach(item => {                
                item.value = "";
            })
        }
        return JSON.parse(JSON.stringify(itemList));
    }

    static getSystemCalculateValue(selector, itemId, itemId2) {
        let itemId_ori = itemId2 ? itemId2 : itemId;
        let result = 0;
        let itemList = this.getItems(selector);
        let calculateItem = itemList.find(p => p.id == itemId);
        let infiniteLoop = false;
        if(calculateItem != null && calculateItem.calcSettings != null && calculateItem.calcSettings.items_ordered != null) {
            let operatorType = store.enumSelector.cashcheckOperatorType.PLUS;
            calculateItem.calcSettings.items_ordered.forEach(element => {
                if(element.status != false) {
                    let items = itemList.filter(p => (p.id == element.itemId || p.referItemId == element.itemId));
                    items.forEach(item => {
                        if(item.id == itemId_ori) {
                            DeviceEventEmitter.emit('Toast', item.subject + ' ' + I18n.t('CashCheck infinite loop'));
                            infiniteLoop = true;
                            return null;
                        }
                        if(item.inputType == store.enumSelector.cashcheckInputType.SYSTEMCALC) {
                            item.value = this.getSystemCalculateValue(selector, item.id, itemId_ori);
                            if(item.value == null) {
                                infiniteLoop = true;
                                return null;
                            }
                        }
                        if(operatorType == store.enumSelector.cashcheckOperatorType.PLUS) {
                            let value = parseInt(item.value);
                            if(isNaN(value) == false) {
                                result = result + value;
                            }
                        } else if(operatorType == store.enumSelector.cashcheckOperatorType.SUBTRACT) {
                            let value = parseInt(item.value);
                            if(isNaN(value) == false) {
                                result = result - value;
                            }
                        }
                    })
                    operatorType = element.operatorType;
                }                
            })
        }
        if(infiniteLoop == true) {
            return null;
        } else {
            return result;
        }        
    }

    static isAbnormalTrigger(selector){
        let result = false;
        selector.rootGroups.forEach(rootGroup => {
            if(rootGroup.groups && rootGroup.groups.length > 0) {
                rootGroup.groups.forEach(group => {
                    if(group.items && group.items.length > 0) {
                        group.items.forEach(item => {
                            if(item.conditions != null && item.conditions.length > 0) {
                                item.conditions.forEach(condition => {
                                    let condition_type = condition.conditionSettings.condition_type;
                                    let condition_target = condition.conditionSettings.condition_target;
                                    if(condition_type == store.enumSelector.cashcheckConditionType.MORE) {
                                        if(item.value > condition_target) {
                                            result = true;
                                        }
                                    } else if(condition_type == store.enumSelector.cashcheckConditionType.EQUAL) {
                                        if(item.value == condition_target) {
                                            result = true;
                                        }
                                    } else if(condition_type == store.enumSelector.cashcheckConditionType.LESS) {
                                        if(item.value < condition_target) {
                                            result = true;
                                        }
                                    }
                                })
                            }
                        })
                    }
                })
            } else if (rootGroup.itemList && rootGroup.itemList.length > 0) {
                rootGroup.itemList.forEach(item => {
                    if(item.conditions != null && item.conditions.length > 0) {
                        item.conditions.forEach(condition => {
                            let condition_type = condition.conditionSettings.condition_type;
                            let condition_target = condition.conditionSettings.condition_target;
                            if(condition_type == store.enumSelector.cashcheckConditionType.MORE) {
                                if(item.value > condition_target) {
                                    result = true;
                                }
                            } else if(condition_type == store.enumSelector.cashcheckConditionType.EQUAL) {
                                if(item.value == condition_target) {
                                    result = true;
                                }
                            } else if(condition_type == store.enumSelector.cashcheckConditionType.LESS) {
                                if(item.value < condition_target) {
                                    result = true;
                                }
                            }
                        })
                    }
                })
            }
        })
        return result;
    }
}
