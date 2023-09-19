import React from 'react';
import _ from "lodash";
import I18n from 'react-native-i18n';
import store from "../../mobx/Store";

export default class PatrolCore {
    static init(selector, data){
        selector.data = [];
        selector.feedback = [];
        selector.categories = [];
        selector.signatures = [];
        selector.attachments = [];
        selector.comment = '';
        selector.isWorkflowReport = false;
        selector.inspectReportId = '';
        selector.workflowInfo = [];
        selector.workflowDescription = '';

        selector.inspectSettings = data.inspectSettings;
        selector.signature = data.signature;
        selector.weatherId = data.uuid;
        selector.isBindWorkflow = data.isBindWorkflow;

        // Categories
        let categories = data.groups.filter(p => p.parentId === -1).map(p =>
                Object.assign({id: p.groupId, name: p.groupName, type: p.type, weight: p.weight}
            ));

        categories.forEach((category) =>{
            let groups = data.groups.filter(p => (p.parentId !== -1) ? (p.parentId === category.id)
                : ((p.groupName === category.name) && (p.items.length > 0)));
            groups.forEach((group) => {
                group.expansion = true;
                group.unfold = false;
                group.weight = category.weight;
                group.items.map(item => {
                    item.rootId = category.id;
                    item.parentType = group.type;
                    item.parentId = group.groupId;

                    item.scoreType = store.enumSelector.scoreType.SCORELESS;
                    item.availableScores = this.defaultScores(item.availableScores, item.itemScore);
                    item.score = store.paramSelector.unValued;
                    item.attachment = [];
                    item.subjectUnfold = false;
                    item.detailUnfold = false;
                    item.attachUnfold = false;

                    if (this.getScoreLength(item.availableScores) > 3){
                        selector.dataType = store.enumSelector.dataType.FLOAT;
                    }
                })
            });

            selector.data.push({...category, unfold: false, groups});
        });

        // sort by type
        categories.sort((a,b) => a.type - b.type);

        // Feedback
        (categories.length > 0) && categories.push({id: null, name: I18n.t('Feedbacks'), type: null});
        selector.categories = categories;

        if (selector.data.length > 0) {
            selector.categoryType = selector.data[0].id;
            selector.groups = selector.data[0].groups;
        }

        return selector;
    }

    static isInteger(data){
        return data.every(p => {
            return Number.isInteger(p);
        });
    }

    static getScoreLength(data){
        let length = 0;

        data.forEach(p => {
            let scoreLength = p.toString().replace(".", '').length;
            (scoreLength > length) && (length = scoreLength);
        });

        return length;
    }

    static defaultScores(scores, maxScore){
        return (scores.length > 0) ? scores : _.range(0, maxScore + 1).reverse();
    }

    static findItem(selector){
        selector.groups = [];

        let groups = selector.data.find(p => p.id === selector.collection.rootId).groups;
        let items = groups.find(p => p.groupId === selector.collection.parentId).items;
        let collection = items.find(p => p.id === selector.collection.id);

        selector.groups = groups;
        return collection;
    }

    static queryItem(selector, data){
        selector.groups = [];

        let groups = selector.data.find(p => p.id === data.rootId).groups;
        let items = groups.find(p => p.groupId === data.parentId).items;
        let collection = items.find(p => p.id === data.id);

        selector.groups = groups;
        return collection;
    }

    static getItems(selector){
        let data = [];
        selector.data.forEach((item) => {
            item.groups.forEach((group) => {
                data.push(...group.items);
            })
        });

        return data;
    }

    static getUnfinished(selector){
        let rootId = selector.collection.rootId;
        return selector.unfinished.find(p => p.id === rootId);
    }

    static getSearch(selector){
        let rootId = selector.collection.rootId;
        return selector.search.find(p => p.id === rootId);
    }

    static getGroup(selector){
        let groups = selector.data.find(p => p.id === selector.collection.rootId).groups;
        return groups.find(p => p.groupId === selector.collection.parentId);
    }

    static enableCapture(selector){
        return (selector.inspect.mode === store.enumSelector.patrolType.ONSITE)
    }

    static enableImageLibrary(selector){
        let setting = selector.inspectSettings.find(p => p.name == 'onSitePhotoOnly');
        return (setting != null && !setting.value);
    }

    static getOptionsForType(selector, type){
        let setting = selector.inspectSettings.find(p => p.name == `itemOptionsForType${type+1}`);
        return (setting != null) ? setting.value.map(p => p.name).reverse() : [];
    }

    static getQualifiedForIgnoredWithType(selector, type){
        let setting = selector.inspectSettings.find(p => p.name == `qualifiedForIgnoredWithType${type+1}`);
        return (setting != null) ? setting.value : true;
    }

    static getOnsiteSignature(selector){
        let setting = selector.inspectSettings.find(p => p.name === 'onSiteSignature');
        return (setting != null) ? setting.value : false;
    }

    static getOnsiteSignatureExtra(selector){
        let setting = selector.inspectSettings.find(p => p.name === 'onSiteSignature');
        if(setting != null && setting.value == true) {
            if(setting.extra != null && setting.extra.length == 1 && setting.extra[0].header == '') {
                return null
            }
            return setting.extra;
        }
        return null;
    }

    static isRemote(selector){
        return (selector.inspect.mode === store.enumSelector.patrolType.REMOTE);
    }
}
