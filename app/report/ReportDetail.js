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
    DeviceEventEmitter,
    BackHandler
} from "react-native";
import I18n from "react-native-i18n";
import {Actions} from "react-native-router-flux";
import {inject, observer} from "mobx-react";
import Navigation from "../element/Navigation";
import store from "../../mobx/Store";
import PatrolRecord from "../inspection/PatrolRecord";
import Signature from "../components/Signature";
import TouchableActive from "../touchables/TouchableActive";
import TouchableInactive from "../touchables/TouchableInactive";
import Feedback from "../inspection/Feedback";
import {Badge} from "react-native-elements";
import ScrollTop from "../element/ScrollTop";
import {getReportInfo, getReportTemplate, cancelWorkflow, checkoutInspect} from "../common/FetchRequest";
import PatrolCore from "../inspection/PatrolCore";
import PatrolReport from "../components/inspect/PatrolReport";
import BusyIndicator from "../components/BusyIndicator";
import BasePatrol from "../customization/BasePatrol";
import PatrolResult from "../inspection/PatrolResult";
import AndroidBacker from "../components/AndroidBacker";
import RouteMgr from "../notification/RouteMgr";
import HeadSheet from "../element/HeadSheet";
import * as storage from 'react-native-simple-store';
import PatrolFragment from "../inspection/PatrolFragment";
import EventBus from "../common/EventBus";
import ViewIndicator from "../customization/ViewIndicator";
import BorderShadow from '../element/BorderShadow';
import SlotView from "../customization/SlotView";
import moment from "moment";
import PhoneInfo from "../entities/PhoneInfo";
import PropTypes from 'prop-types';
import ModalCenter from "../components/ModalCenter";
import TemporaryResult from "../inspection/TemporaryResult";
import {Divider} from "react-native-elements";
import PatrolParser from "../components/inspect/PatrolParser";
import NP from "number-precision/src/index";

const {width, height} = Dimensions.get('window');

@inject('store')
@observer
export default class ReportDetail extends BasePatrol {
    state = {
        showScrollTop: false,
        viewType: store.enumSelector.viewType.LOADING,
        enumSelector: store.enumSelector,
        paramSelector: store.paramSelector,
        userSelector: store.userSelector,
        reportSelector: store.reportSelector,
        dataType: store.enumSelector.dataType.INT,
        approveSelector: store.approveSelector,
        source: [],
        signatures: [],
        feedback: [],
        comment: '',
        submitResult:null,
        temporaryResult:null,
        templateId: null,
        templates: [],
        statistics: {
            qualified: 1,
            chart: 0,
            data: []
        },
        switches: [],
        enableComment: true,
        enableStatistics: true,
        categoryData: [],
        includedInTotalScoreWithType1: false,
        qualifiedForIgnoredWithType1: true,
        qualifiedForIgnoredWithType2: true,
        hundredMarkType: -1
    };

    static propTypes = {
        modifyReport: PropTypes.boolean,
        noShare: PropTypes.boolean,
        showCancel: PropTypes.boolean
    };

    static defaultProps = {
        modifyReport: false,
        noShare: false,
        showCancel: false
    };

    constructor(props){
        super(props);

        let {enumSelector} = this.state;
        this.switchMaps = [
            {
                name: 'defaultAll',
                type: enumSelector.switchType.ALL,
                title: I18n.t('Switch all')
            },
            {
                name: 'feedbackItem',
                type: enumSelector.switchType.FEEDBACK,
                title: I18n.t('Switch feedback')
            },
            {
                name: 'focalItem',
                type: enumSelector.switchType.FOCAL,
                title: I18n.t('Switch focal')
            },
            {
                name: 'qualifiedItem',
                type: enumSelector.switchType.QUALIFIED,
                title: I18n.t('Switch qualified')
            },
            {
                name: 'ignoredItem',
                type: enumSelector.switchType.IGNORED,
                title: I18n.t('Switch ignored')
            },
            {
                name: 'notJoinItem',
                type: enumSelector.switchType.REMARK,
                title: I18n.t('Switch remark')
            }
        ];

        this.switches = [
            {
                enable: true,
                name: "defaultAll",
                position: -1
            },
            {
                enable: true,
                name: "feedbackItem",
                position: 0
            }
        ];

        this.score = PatrolParser.getScore();
    }

    componentDidMount(){
        let {userSelector} = this.state;
        this.majorKey = `inspectTemplate-${userSelector.userId}${userSelector.accountId}`;

        (async ()=>{
            await this.fetchData();
        })();
    }

    async fetchData(){
        try {
            let {enumSelector, statistics, templates, templateId, reportSelector, feedback} = this.state;
            this.setState({viewType: enumSelector.viewType.LOADING});

            let result = await getReportInfo({reportIds:[this.props.data.id]});
            if ((result.errCode !== enumSelector.errorType.SUCCESS) || (result.data.length === 0)) {
                this.setState({viewType: enumSelector.viewType.FAILURE});
                return;
            }

            this.data = result.data[0];
            this.initScoreRules();
            statistics.data = this.data.info.summary;
            reportSelector.inspectSettings = this.data.inspectSettings;

            result = await getReportTemplate();
            if (result.errCode === enumSelector.errorType.SUCCESS){
                templates = result.data.filter(p => p.enable);
            }

            // Template parser
            result = await storage.get(this.majorKey);
            (result != null) && (templateId = result);

            let index = templates.findIndex(p => p.id === templateId);
            ((index === -1) && (templates.length > 0)) && (index = 0);
            (index !== -1) ? (templateId = templates[index].id) : (templateId = null);
            (templateId != null) && (await storage.save(this.majorKey, templateId));

            let data = this.formatData(this.data.info);
            let config = this.getConfig(templates,templateId);
            this.onCompute(this.data.info.groups);
            this.assignData(data.source, config.switches, data.feedback);

            this.setState({
                templateId,
                templates,
                source: data.source,
                dataType: data.dataType,
                feedback: data.feedback,
                statistics: config.statistics,
                switches: config.switches,
                enableComment: config.enableComment,
                enableStatistics: config.enableStatistics,
                comment: this.data.info.comment,
                signatures: this.data.info.signatures,
                viewType: enumSelector.viewType.SUCCESS,
                reportSelector
            }, () => {
                this.props.data.patrol && this.setState({submitResult:true});
                this.props.temporaryResult && this.setState({temporaryResult:true});
            });

        }catch (e) {
        }
    }

    initScoreRules(){
        let includedInTotalScoreWithType1 = false;
        let qualifiedForIgnoredWithType1 = true;
        let qualifiedForIgnoredWithType2 = true;
        let hundredMarkType = -1;

        let inspectSettings = this.data.inspectSettings;

        let keyIndex = inspectSettings.findIndex(p => p.name === 'includedInTotalScoreWithType1');
        (keyIndex !== -1) ? (includedInTotalScoreWithType1 = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'qualifiedForIgnoredWithType1');
        (keyIndex !== -1) ? (qualifiedForIgnoredWithType1 = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'qualifiedForIgnoredWithType2');
        (keyIndex !== -1) ? (qualifiedForIgnoredWithType2 = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'hundredMarkType');
        (keyIndex !== -1) ? (hundredMarkType = inspectSettings[keyIndex].value) : null;
        this.setState({includedInTotalScoreWithType1, qualifiedForIgnoredWithType1, qualifiedForIgnoredWithType2, hundredMarkType})
    }

    onCompute(data){
        try {
            let {enumSelector, categoryData} = this.state;
            let rateGroup = null, scoreGroup = null, appendGroup = null;

            let rateData = data.filter(p => p.type === enumSelector.categoryType.RATE);
            let scoreData = data.filter(p => p.type === enumSelector.categoryType.SCORE);
            let appendData = data.filter(p => p.type === enumSelector.categoryType.APPEND);

            (rateData.length > 0) && (rateGroup = this.onRateTable(rateData, scoreData, appendData));
            (scoreData.length > 0) && (scoreGroup = this.onScoreTable(scoreData));
            (appendData.length > 0) && (appendGroup = this.onAppendTable(appendData));

            categoryData = [];
            categoryData = categoryData.concat(rateData);
            categoryData = categoryData.concat(scoreData);
            categoryData = categoryData.concat(appendData);
            this.setState({categoryData});
        }catch (e) {
            console.log("onCompute e : ", e)
        }
    }

    onRateTable(categories, scoreData, appendData){
        let group = {points:0, totalPoints: 0, qualified: 0, unqualified: 0, items: [], focuses: [], ignores: [], count: 0};
        group.count = categories.reduce((p,e) => p + e.items.length, 0);

        categories.forEach((item)=>{
            let qualified = item.items.filter(p => p.score === this.score[2].label);
            let unqualified = item.items.filter(p => p.score === this.score[1].label);
            let autoItems = item.items.filter(p => (p.type === 0) && (p.score === this.score[0].label));

            let pointItems = this.state.qualifiedForIgnoredWithType1 ? [...qualified, ...autoItems] : qualified;
            let totalItems = this.state.qualifiedForIgnoredWithType1 ? item.items : [...qualified, ...unqualified];

            let points = pointItems.reduce((p,e) => NP.plus(p, e.itemScore), 0);
            let totalPoints = totalItems.reduce((p,e) => NP.plus(p, e.itemScore), 0);

            if(isNaN(points) || points === Infinity || points == Number.MAX_VALUE) {
                points = 0;
            }
            if(isNaN(totalPoints) || totalPoints === Infinity || totalPoints == Number.MAX_VALUE) {
                totalPoints = 0;
            }
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
                if(this.state.hundredMarkType == 0 && totalPoints != 0) {
                    totalPoints = item.groupScore;
                }
            }

            if(item.weight != -1) {
                points = (points * item.weight / 100);
                totalPoints = (totalPoints * item.weight / 100);
            }

            if (!this.state.includedInTotalScoreWithType1 && (scoreData.length > 0 || appendData.length > 0)){
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
            let pointItems = this.state.qualifiedForIgnoredWithType2 ? item.items : scoreItems;
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
                if(this.state.hundredMarkType == 0 && totalPoints != 0) {
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

    formatData(data){
        let {enumSelector, paramSelector, dataType} = this.state;
        let source = [];

        let categories = data.groups.filter(p => p.parentId === -1).map(p =>
            Object.assign({id: p.groupId, name: p.groupName, type: p.type}
            ));

        categories.forEach((category) => {
            let groups = data.groups.filter(p => (p.parentId !== -1) ? (p.parentId === category.id)
                : ((p.groupName === category.name) && (p.items.length > 0)));

            groups.forEach((group) => {
                group.unfold = false;
                (group.groupId === category.id) ? (group.groupName = '') : null;

                group.items.map(item => {
                    item.rootId = category.id;
                    item.parentId = group.groupId;
                    item.parentType = group.type;

                    let scoreType = enumSelector.scoreType.SCORELESS;
                    if (item.score !== paramSelector.unValued){
                        if (group.type !== enumSelector.categoryType.SCORE){
                            scoreType = (item.score === 0) ? enumSelector.scoreType.UNQUALIFIED
                                : enumSelector.scoreType.QUALIFIED;
                        }else {
                            scoreType = (item.score >= item.qualifiedScore) ? enumSelector.scoreType.PASS
                                : enumSelector.scoreType.FAIL;
                        }
                    }else if (item.type === 0){
                        scoreType = enumSelector.scoreType.IGNORE;
                    }

                    if ((item.score !== paramSelector.unValued) && !PatrolCore.isInteger([item.score])){
                        dataType = enumSelector.dataType.FLOAT;
                    }

                    item.scoreType = scoreType;
                    item.subjectUnfold = false;
                    item.detailUnfold = false;
                    item.attachUnfold = false;
                })
            });

            source.push({...category, unfold: false, groups});
        });

        let feedback = data.feedback.map(item => Object.assign(item, {headUnfold: false, attachUnfold: false}));
        return {source, dataType, feedback};
    }

    getConfig(templates, id){
        let {statistics, switches, enableComment, enableStatistics} = this.state;

        let template = templates.find(p => p.id === id);
        if (template != null){
            let item = template.config.switches.find(p => p.name === 'statistics');
            statistics.qualified = (item != null) ? item.qualified : 1;
            statistics.chart = (item != null) ? item.chart : 0;
            enableStatistics = (item != null) ? item.enable : enableStatistics;

            let comment = template.config.switches.find(p => p.name === 'comment');
            enableComment = (comment != null) ? comment.enable : enableComment;

            let switchMaps = JSON.parse(JSON.stringify(this.switchMaps));
            let filters = switchMaps.slice(1).map(p => p.name);
            let defaultAll = template.config.switches.filter(p => p.enable && (p.name === this.switchMaps[0].name));
            switches = (defaultAll.length !== 0) ? this.switches : template.config.switches.filter(p => p.enable && filters.includes(p.name));
        }

        return {statistics, switches, enableComment, enableStatistics};
    }

    assignData(source, swithes, feedback){
        let switchType = this.state.enumSelector.switchType;

        swithes.forEach((item, index) => {
            let data = JSON.parse(JSON.stringify(source));
            let type = this.switchMaps.find(p => p.name === item.name).type;

            switch (type) {
                case switchType.ALL: {
                    item.data = data;
                    break;
                }
                case switchType.FOCAL:{
                    item.data = this.filerData(data, [1,3], false);
                    break;
                }
                case switchType.QUALIFIED:{
                    item.data = this.filerData(data, [2,4], false);
                    break;
                }
                case switchType.IGNORED:{
                    item.data = this.filerData(data, [5], false);
                    break
                }
                case switchType.REMARK:{
                    item.data = this.filerData(data, [1], true);
                    break;
                }
                case switchType.FEEDBACK:{
                    item.data = JSON.parse(JSON.stringify(feedback));
                    break;
                }
                default:
            }
        });
    }

    filerData(data, filters, isMark){
        let categories = [];
        data.forEach((category) => {
            let groups = [];
            category.groups.map((item) => {
                let items = item.items.filter(p => (
                    isMark ? (filters.find(v => v === p.type) != null) : ((p.type === 0) &&
                        (filters.find(v => v === p.scoreType) != null))
                ));
                if (items.length > 0) {
                    item.items = items;
                    groups.push(item);
                }
            });

            (groups.length > 0) && categories.push({
                id: category.id,
                name: category.name,
                type: category.type,
                unfold: category.unfold,
                groups: groups
            });
        });

        return categories;
    }

    onShare(){
        let {categoryData} = this.state;
        let report = {
            id: this.data.id,
            templateId: this.state.templateId,
            date: this.data.info.ts,
            name: this.data.info.storeName,
            list: this.data.info.tagName,
            inspector: this.data.info.submitterName,
            type: this.data.info.mode,
            result: this.data.info.status,
            points: this.data.info.totalScore
        };

        /*PatrolReport.share(report, (result, prompt)=>{
            result ? (this.indicator && this.indicator.open()) : (this.indicator && this.indicator.close());
            prompt && DeviceEventEmitter.emit('Toast', I18n.t('Share failed'));
        });*/

        let tmpData = JSON.parse(JSON.stringify(categoryData));

        PatrolReport.shareScore(report, tmpData, this.data.inspectSettings, (result, prompt)=>{
            result ? (this.indicator && this.indicator.open()) : (this.indicator && this.indicator.close());
            prompt && DeviceEventEmitter.emit('Toast', I18n.t('Share failed'));
        });
    }

    renderComment(){
        let {comment} = this.state;
        return (
            <View style={{marginTop:14}}>
                <Text style={styles.label}>{I18n.t('Improvement advices')}</Text>
                <TextInput style={[styles.comment,BorderShadow.div]}
                           editable={false}
                           multiline={true}
                           autoCapitalize={'none'}
                           returnKeyType={'done'}
                           value={comment}
                />
            </View>
        )
    }

    renderSignature(){
        let {signatures} = this.state;

        let signatures_filter = [];
        if(signatures && signatures.length > 0) {
            signatures.forEach(signature => {
                if(signature.content != null) {
                    signatures_filter.push(signature);
                }
            })
        }        

        return (
            (signatures_filter.length > 0) ? <View style={{marginTop:16}}>
                    <Text style={styles.label}>{I18n.t('Signature')}</Text>
                    <Signature showOperator={false} data={signatures_filter} editable={false}/>
                </View> : null
        )
    }

    renderModifyReport(){
        let {modifyReport} = this.props;
        let {enumSelector, approveSelector} = this.state;

        return (
            (modifyReport) ? <TouchableOpacity activeOpacity={0.5} onPress={async () => {
                let isBindWorkflow = false
                if(this.data && this.data.info) {
                    let resultCheckout = await checkoutInspect(this.data.info.storeId, 1, this.data.info.tagId);
                    if (resultCheckout.errCode == enumSelector.errorType.SUCCESS){
                        isBindWorkflow = resultCheckout.data.isBindWorkflow;
                    }
                }
                if(isBindWorkflow) {
                    this.setState({approveSelector}, () => {
                        Actions.push('patrol', {reportId: approveSelector.collection.inspectReportId});
                    });
                } else {
                    DeviceEventEmitter.emit('Toast', I18n.t('Workflow Bind Cancel'));
                }
            }}>
                <View style={styles.approvePanel}>
                    <Image style={styles.approveIcon} source={require('../assets/img_approve_prompt.png')}/>
                    <Text style={styles.submitApprove}>{I18n.t('Modify Report')}</Text>
                </View>
            </TouchableOpacity> : null
        )
    }

    renderHeader(){
        let info = this.data.info, checkedinTime = '', checkedinDuration = '', checkedinDistance = '', checkinIgnore = false;
        let {paramSelector} = this.state;
        let summary = paramSelector.getSummaries().find(p => p.id === info.status) || {};

        if (info.checkinRecord != null) {
            checkedinTime = moment(info.checkinRecord.ts).format('YYYY/MM/DD HH:mm:ss');
            checkedinTime = `${I18n.t('Checked in Time')} : ${checkedinTime}`;

            checkedinDuration = moment.utc(moment(info.ts).diff(moment(info.checkinRecord.ts))).format("HH:mm:ss");
            checkedinDuration = `${I18n.t('Checked in Duration')} : ${checkedinDuration}`;

            if(info.checkinRecord.execute_sign_distance != -1) {
                checkedinDistance = `${I18n.t('Checked in Distance')} : ${info.checkinRecord.execute_sign_distance}m`;
            } else {
                checkedinDistance = I18n.t('Checked in Distance Over');
            }            

            checkinIgnore = info.checkinRecord.is_ignore;
        }

        let fontSize = 16;
        if(info.status == 0) {  // 立即督導
            PhoneInfo.isIDLanguage() && (fontSize = 12);
            PhoneInfo.isTHLanguage() && (fontSize = 14);
            PhoneInfo.isVNLanguage() && (fontSize = 12);
        }
        
        return (
            <View style={styles.header}>
                <View>
                    <Text style={styles.storeName}>{info.storeName}</Text>
                    <View style={{flexDirection:'row',marginTop:8, maxWidth:120}}>
                        <Text style={styles.submitter}>{I18n.t('Submitter')}</Text>
                        <Text style={styles.submitterName}>{info.submitterName}</Text>
                    </View>
                    {
                        (checkedinTime !== '') ? <View style={{flexDirection:'row'}}>
                                <Text style={styles.signIn}>{checkedinTime}</Text>
                                {checkinIgnore && <Text style={styles.ignore}>{I18n.t('Checkin Ignore')}</Text>}
                            </View> : null
                    }
                    {
                        (checkedinDuration !== '') ? <Text style={styles.signIn}>{checkedinDuration}</Text> : null
                    }
                    {
                        (checkedinDistance !== '') ? <Text style={styles.signIn}>{checkedinDistance}</Text> : null
                    }
                </View>
                <Badge value={summary.name} badgeStyle={[styles.badge,{backgroundColor:summary.backgroundColor}]}
                       textStyle={[styles.text,{color:summary.color, fontSize}]}/>
            </View>
        )
    }

    renderMap() {
        let info = this.data.info;

        if(!info.checkinRecord || !info.checkinRecord.report_sign_map_url) {
            return null;
        }

        let mapWidth = (width - 60);
        let mapHeight = ((width - 60)*3/4);
        let durationText = '';
        if(info.checkinRecord.execute_sign_distance != -1) {
            durationText = I18n.t('Store distance',{store:info.storeName, distance:info.checkinRecord.execute_sign_distance});
        } else {
            durationText = I18n.t('Checked in Distance Over');
        }   
        return (
            <View style={{marginTop:26,marginLeft:10,marginRight:10}}>
                <Text style={styles.labelMap}>{I18n.t('Checked in Info')}</Text>                
                <View style={[{marginTop:10, border:2, borderRadius:10},BorderShadow.div]}>
                    <View style={{padding: 10}}>
                        <Text style={styles.contentMap}>{durationText}</Text>
                        <Divider style={styles.divider}/>
                        <Image style={{marginTop: 10, width: mapWidth, height: mapHeight}} source={{uri: info.checkinRecord.report_sign_map_url}}/>
                    </View>
                </View>
            </View>
        )
    }

    getData(){
        let info = this.data.info;
        return {
            inspectTagId: info.tagId,
            inspectTagName: info.tagName,
            inspectReportId: this.props.data.id,
            score: info.totalScore,
            status: info.status,
            mode: info.mode,
            ts: info.ts,
            weatherInfo: info.weatherInfo,
            standard: info.standard,
            type: info.type
        };
    }

    onBack(){
        const routerDetail = 'storeDetail', routerSearch = 'storeSearch', routerPatrol = 'patrol';
        if (RouteMgr.isContain(routerPatrol)){
            EventBus.refreshStoreInfo();
            EventBus.refreshStoreDetail();
            EventBus.refreshTemporary();
            EventBus.refreshEventInfo();

            if (RouteMgr.isContain(routerDetail)){
                Actions.popTo(routerDetail);
            }else if (RouteMgr.isContain(routerSearch)){
                Actions.popTo(routerSearch);
            }else {
                Actions.popTo('homePage');
            }
        }else {
            Actions.pop();
        }

        return true;
    }

    onTemplate(index) {
        let {templates, templateId, source, feedback} = this.state;
        templateId = templates[index].id;

        let config = this.getConfig(templates, templateId);
        this.assignData(source, config.switches, feedback);

        this.setState({
            templateId,
            statistics: config.statistics,
            switches: config.switches,
            enableComment: config.enableComment,
            enableStatistics: config.enableStatistics
        });

        (async () => {
            await storage.save(this.majorKey, templateId);
        })();
    }

    onCategory(data, index, id){
        let {switches} = this.state;
        let category = switches[index].data.find(p => p.id === id);
        category.unfold = !category.unfold;
        this.setState({switches});
    }

    onGroup(data, index, item){
        let {switches} = this.state;
        let category = switches[index].data.find(p => p.id === item.parentId);
        let group = category.groups.find(p => p.groupId === item.groupId);
        group.unfold = !group.unfold;

        this.setState({switches});
    }

    onSubject(data, index, item){
        let {switches} = this.state;
        let category = switches[index].data.find(p => p.id === item.rootId);
        let group = category.groups.find(p => p.groupId === item.parentId);
        let query = group.items.find(p => p.id === item.id);
        query.subjectUnfold = !query.subjectUnfold;

        this.setState({switches});
    }

    onDetail(data, index, item){
        let {switches} = this.state;
        let category = switches[index].data.find(p => p.id === item.rootId);
        let group = category.groups.find(p => p.groupId === item.parentId);
        let query = group.items.find(p => p.id === item.id);
        query.detailUnfold = !query.detailUnfold;

        this.setState({switches});
    }

    onAttach(data, index, item){
        let {switches} = this.state;
        let category = switches[index].data.find(p => p.id === item.rootId);
        let group = category.groups.find(p => p.groupId === item.parentId);
        let query = group.items.find(p => p.id === item.id);
        query.attachUnfold = !query.attachUnfold;

        this.setState({switches});
    }

    async doCancel() {
        let {approveSelector,enumSelector} = this.state;
        let collection = approveSelector.collection;
        let body = {
            inspectReportId: collection.inspectReportId
        }
        let result = await cancelWorkflow(body);
        if(result.errCode == enumSelector.errorType.SUCCESS) {
            EventBus.refreshApprovePage();
            Actions.popTo('homePage');
        }
    }

    renderSwitch(){
        let {switches, dataType, enumSelector, categoryData} = this.state;

        let hundredMarkType = -1;
        this.data.inspectSettings.forEach(settings => {
            if(settings.name == "hundredMarkType") {
                hundredMarkType = settings.value;
            }
        })

        return (
            switches.map((item,index) => {
                let data = this.switchMaps.find(p => p.name === item.name);

                return (data && data.type !== enumSelector.switchType.FEEDBACK) ? <PatrolFragment data={item.data} isPatrol={false} showEdit={false}
                            title={data.title} showTitle={true} dataType={dataType}
                            onCategory={(id) => {this.onCategory(data, index, id)}}
                            onGroup={(item) => {this.onGroup(data, index, item)}}
                            onSubject={(item) => {this.onSubject(data, index, item)}}
                            onDetail={(item) => {this.onDetail(data, index, item)}}
                            onAttach={(item) => {this.onAttach(data, index, item)}}
                            categoryData={categoryData}
                            hundredMarkType={hundredMarkType}
                            inspectSettings={this.data.inspectSettings}
                /> : <View>
                    {(item.data && item.data.length > 0) && <Text style={styles.feedHeader}>{I18n.t('Feedback project')}</Text>}
                    <Feedback isPatrol={false} data={item.data} showTitle={false} showOperator={false} showEdit={false}/>
                </View>
            })
        )
    }

    render() {
        let { noShare, showCancel } = this.props;
        let {viewType, enumSelector, feedback, dataType, statistics, submitResult, temporaryResult,
                templates, templateId, showScrollTop, enableComment, enableStatistics} = this.state;
        let rightButtonEnable = (viewType === enumSelector.viewType.SUCCESS);
        let selectIndex = templates.findIndex( p => p.id === templateId);
        selectIndex = (selectIndex !== -1) ? selectIndex : 0;

        let fontSize = 14;
        (PhoneInfo.isVNLanguage() || PhoneInfo.isIDLanguage()) && (fontSize = 10);

        let rightButtonTitle = '';
        if(rightButtonEnable) {
            if(noShare == false) {
                rightButtonTitle = I18n.t('Share report');
            } else if (showCancel) {
                rightButtonTitle = I18n.t('Cancel');
            }
        }
        
        return (
            <TouchableActive style={styles.container}>
                <Navigation
                    onLeftButtonPress={()=>{this.onBack()}}
                    title={I18n.t('Report details')}
                    rightButtonEnable={rightButtonEnable}
                    rightButtonTitle={rightButtonTitle}
                    onRightButtonPress={(noShare && showCancel) ? () => {this.modalCancel && this.modalCancel.open()} : ()=>{this.onShare()}}
                    rightButtonMore={true}
                    onRightMore={() => {this.headSheet && this.headSheet.open()}}
                />

                {
                    (viewType !== enumSelector.viewType.SUCCESS) &&  <ViewIndicator viewType={viewType} containerStyle={{marginTop:242}}
                         refresh={() => this.fetchData()} />
                }
                {(viewType === enumSelector.viewType.SUCCESS) && <TouchableInactive>
                    {this.renderModifyReport()}
                    <ScrollView ref={c => this.scroll = c}
                                onScroll={event =>{
                                    let showScrollTop = (event.nativeEvent.contentOffset.y > 200);
                                    this.setState({showScrollTop});
                                }}
                                style={styles.panel} showsVerticalScrollIndicator={false}>
                        <TouchableActive>
                            {this.renderHeader()}
                            <PatrolRecord storeId={this.data.info.storeId}
                                          data={this.getData()}
                                          showChart={enableStatistics} statistics={statistics}/>
                            {enableComment && this.renderComment()}
                            {this.renderSignature()}
                            {this.renderMap()}
                            {this.renderSwitch()}
                            <SlotView containerStyle={{height:50}}/>
                        </TouchableActive>
                    </ScrollView>

                    <ScrollTop showOperator={showScrollTop} onScroll={() => {this.scroll && this.scroll.scrollTo({x:0 ,y:0, animated:true})}}/>
                </TouchableInactive>}

                <BusyIndicator ref={c => this.indicator = c} title={I18n.t('Report share waiting')} width={null} fontSize={fontSize}/>
                <PatrolResult status={submitResult} reset={() => {this.setState({submitResult: null})}}/>
                <TemporaryResult status={temporaryResult} reset={() => {this.setState({temporaryResult: null})}}/>
                <HeadSheet ref={c => this.headSheet = c} selectIndex={selectIndex}
                    data={templates.map(p => p.name)} onSelect={(index) => this.onTemplate(index)}/>
                <AndroidBacker onPress={() => this.onBack()}/>
                <ModalCenter ref={c => this.modalCancel = c} title={I18n.t('Cancel Approve')} description={I18n.t('Cancel Approve Confirm')}
                             confirm={() => this.doCancel()}/>
            </TouchableActive>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor:'#F7F9FA'
    },
    storeName:{
        fontSize:20,
        color:'#64686D',
        maxWidth: 160
    },
    panel:{
        paddingLeft:10,
        paddingRight:10
    },
    label:{
        fontSize:16,
        color:'#64686D',
        marginLeft: 10
    },
    labelMap:{
        fontSize:16,
        color:'#64686D'
    },
    contentMap:{
        fontSize:14,
        color:'#86888A'
    },
    statusView:{
        flexDirection:'row',
        justifyContent:'space-between',
        marginTop: 6
    },
    statusPanel:{
        width:100,
        backgroundColor:'#ebebeb',
        borderWidth:1,
        borderColor:'#000',
        borderRadius:6,
        height: 35
    },
    statusContent:{
        paddingTop:7,
        fontSize:14.5,
        textAlign:'center',
        textAlignVertical:'center'
    },
    comment:{
        width:width-40,
        paddingTop:11,
        paddingBottom:11,
        paddingRight: 16,
        borderRadius:10,
        marginTop:12,
        marginLeft:10,
        paddingLeft:16,
        fontSize:14,
        color:'#1E272E',
        backgroundColor:'#ffffff'
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
        paddingLeft:20,
        paddingRight:16,
        paddingTop:36,
        paddingBottom:16
    },
    badge:{
        width:100,
        height:37,
        borderRadius:16,
        marginTop:8
    },
    text:{
        fontSize:16
    },
    submitter:{
        color:'#86888A',
        marginTop:4
    },
    submitterName:{
        color:'#64686D',
        fontSize:16,
        marginLeft:10,
        marginTop:2
    },
    feedHeader:{
        color:'#64686D',
        fontSize:16,
        marginTop:36,
        marginLeft: 16
    },
    signIn:{
        fontSize:12,
        color:'rgb(134,136,138)',
        marginTop:4
    },
    approvePanel:{
        height:40,
        backgroundColor:'rgb(255,242,239)',
        alignItems:'center',
        flexDirection:'row',
        justifyContent:'center'
    },
    approveIcon:{
        width:20,
        height:20
    },
    submitApprove:{
        fontSize:14,
        color:'rgb(245,120,72)',
        marginLeft:2
    },
    divider:{
        height:2,
        marginTop:11,
        backgroundColor: 'rgb(242,242,242)',
        borderBottomWidth:0
    },
    ignore:{
        fontSize:12,
        color:'rgba(133, 137, 142, 0.5)',
        backgroundColor:'#EFEFEF',
        borderRadius:4,
        marginLeft:6,
        paddingRight:4,
        paddingLeft:4,
        paddingTop:2,
        paddingBottom:1
    }
});
