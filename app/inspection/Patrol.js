import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    TouchableOpacity,
    DeviceEventEmitter,
    BackHandler,
    Platform
} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from "react-native-router-flux";
import PropTypes from 'prop-types';
import uuid from 'react-native-uuid';
import Navigation from "../element/Navigation";
import store from "../../mobx/Store";
import PatrolGroup from "./PatrolGroup";
import TouchableActive from "../touchables/TouchableActive";
import EventBus from "../common/EventBus";
import Feedback from "./Feedback";
import {checkoutInspect,getReportInfo,getWorkflowTaskInfo,getStoreInfo} from "../common/FetchRequest";
import PatrolCore from "./PatrolCore";
import {UPDATE_PATROL_DATA} from "../common/Constant";
import BasePatrol from "../customization/BasePatrol";
import NetInfoIndicator from "../components/NetInfoIndicator";
import ModalCenter from "../components/ModalCenter";
import PatrolStorage from "../components/inspect/PatrolStorage";
import AndroidBacker from "../components/AndroidBacker";
import {ColorStyles} from "../common/ColorStyles";
import PatrolCategory from "./PatrolCategory";
import RouteMgr from "../notification/RouteMgr";
import ViewIndicator from "../customization/ViewIndicator";
import PhoneInfo from "../entities/PhoneInfo";

const {width} = Dimensions.get('screen');
export default class Patrol extends BasePatrol{
    state = {
        patrolSelector: store.patrolSelector,
        paramSelector: store.paramSelector,
        enumSelector: store.enumSelector,
        screenSelector: store.screenSelector,
        storeSelector: store.storeSelector,
        approveSelector: store.approveSelector,
        viewType: store.enumSelector.viewType.LOADING
    };

    static propTypes = {
        uuid: PropTypes.string,
        reportId: PropTypes.string,
        scheduleId: PropTypes.string
    };

    static defaultProps = {
        uuid: null,
        reportId: null,
        scheduleId: null
    };

    componentDidMount(){
        (async ()=>{
            (this.props.reportId != null) ? (await this.modifyReport()) : ((this.props.uuid != null) ? (await this.keepData()) : (await this.fetchData()));
        })();

        this.emitter = DeviceEventEmitter.addListener(UPDATE_PATROL_DATA, () => {
            let {patrolSelector} = this.state;
            let {data, categoryType}= patrolSelector;

            patrolSelector.visible = false;
            //patrolSelector.collection = null;
            patrolSelector.interactive = false;
            if (categoryType !== null){
                patrolSelector.groups = data.find(p => p.id === categoryType).groups;
            }
            this.setState({patrolSelector});
        });
    }

    componentWillUnmount() {
        this.emitter && this.emitter.remove();
    }

    async modifyReport() {
        let {patrolSelector, paramSelector, enumSelector, screenSelector, storeSelector, approveSelector} = this.state;
        let {reportId} = this.props;
        let result = await getReportInfo({reportIds:[reportId]});
        if ((result.errCode !== enumSelector.errorType.SUCCESS) || (result.data.length === 0)) {
            this.setState({viewType: enumSelector.viewType.FAILURE});
            return;
        }
        let data = result.data[0];
        
        let store = {
                storeId: data.info.storeId,
                name: data.info.storeName,
            }, 
            inspect = {
                id: data.info.tagId,
                mode: data.info.mode,
                name: data.info.tagName,
                status: data.info.status,
                inspectSettings: data.inspectSettings
            };

        let resultStoreInfo = await getStoreInfo(store.storeId, false);
        if (resultStoreInfo.errCode == enumSelector.errorType.SUCCESS){
            store = resultStoreInfo.data;
        }

        let resultCheckout = await checkoutInspect(data.info.storeId, 1, data.info.tagId);

        if (resultCheckout.errCode !== enumSelector.errorType.SUCCESS){
            this.setState({viewType: enumSelector.viewType.FAILURE});
            return;
        }

        if (resultCheckout.data.groups.length === 0){
            this.setState({viewType: enumSelector.viewType.EMPTY});
            return;
        }

        patrolSelector.uuid = uuid.v4();
        patrolSelector.store = store;
        patrolSelector.inspect = inspect;
        patrolSelector.screen = screenSelector.patrolType.NORMAL;
        patrolSelector.router = screenSelector.patrolType.PATROL;
        patrolSelector = PatrolCore.init(patrolSelector, resultCheckout.data);
        patrolSelector.isWorkflowReport = true;
        patrolSelector.inspectReportId = reportId;
        // 填入/report/info data
        patrolSelector.comment = data.info.comment;
        patrolSelector.feedback = data.info.feedback;
        if(approveSelector.collection.cancelable == false) {
            patrolSelector.feedback.forEach(element => {
                element.modifyAble = false;
            });
        }
        patrolSelector.signatures = data.info.signatures;
        patrolSelector.data.forEach(element => {
            element.groups.forEach(group => {
                for(var i=0 ; i<data.info.groups.length ; ++i) {
                    if(group.groupId == data.info.groups[i].groupId) {
                        if(group.items.length == data.info.groups[i].items.length) {
                            group.items.forEach((item, index) => {
                                item.attachment = data.info.groups[i].items[index].attachment;
                                item.score = data.info.groups[i].items[index].score;
                                item.id = data.info.groups[i].items[index].id;
                                let scoreType = enumSelector.scoreType.SCORELESS;
                                if (item.score !== paramSelector.unValued){
                                    if (group.type !== enumSelector.categoryType.SCORE){
                                        scoreType = (item.score === 0) ? enumSelector.scoreType.UNQUALIFIED
                                            : enumSelector.scoreType.QUALIFIED;
                                    } else {
                                        scoreType = (item.score >= item.qualifiedScore) ? enumSelector.scoreType.PASS
                                            : enumSelector.scoreType.FAIL;
                                    }
                                } else if (item.type === 0){
                                    scoreType = enumSelector.scoreType.IGNORE;
                                }
                                item.scoreType = scoreType;
                                if(scoreType == enumSelector.scoreType.UNQUALIFIED || scoreType == enumSelector.scoreType.FAIL) {
                                    item.modifyAble = false;
                                } else {
                                    item.modifyAble = true;
                                }
                            });
                        }                        
                        break;
                    }
                }
            });
        });
        patrolSelector.groups = patrolSelector.data[0].groups;

        if (patrolSelector.categories.length === 0){
            this.setState({viewType: enumSelector.viewType.EMPTY});
            return;
        }        
        
        // 填入簽核資料
        let resultWorkflowTaskInfo = await getWorkflowTaskInfo(reportId, enumSelector.workflowInfoType.INSPECTREPORT);
        if (resultWorkflowTaskInfo.errCode == enumSelector.errorType.SUCCESS) {
            if(resultWorkflowTaskInfo.data.taskList.length > 0) {
                let tasks = [];
                resultWorkflowTaskInfo.data.taskList.forEach(element => {
                    if(element.parentId == -1 && 
                        (element.state == enumSelector.workflowType.CREATED || element.state == enumSelector.workflowType.APPROVED)) {
                        tasks = element.tasks;
                    }
                });
                if(tasks.length > 0) {
                    patrolSelector.attachments = tasks[0].comment.attachment;
                    patrolSelector.workflowDescription = tasks[0].comment.description;
                }                
                patrolSelector.workflowInfo = resultWorkflowTaskInfo.data.taskList;
            }
        }

        this.setState({
            patrolSelector,
            viewType: enumSelector.viewType.SUCCESS
        });
    }

    async keepData(){
        let {uuid} = this.props;
        let {patrolSelector, enumSelector, screenSelector} = this.state;

        let data = PatrolStorage.get(uuid);
        store.patrolSelector = PatrolStorage.parseState(data);
        store.patrolSelector.screen = screenSelector.patrolType.NORMAL;
        store.patrolSelector.router = screenSelector.patrolType.PATROL;
        patrolSelector = store.patrolSelector;

        this.setState({viewType: enumSelector.viewType.LOADING});
        let result = await checkoutInspect(patrolSelector.store.storeId, 1, patrolSelector.inspect.id);
        if (result.errCode !== enumSelector.errorType.SUCCESS){
            this.setState({viewType: enumSelector.viewType.FAILURE});
            return;
        }
        patrolSelector.data = this.checkInspectChange(patrolSelector.data, result.data.groups);

        this.setState({
            patrolSelector,
            viewType: enumSelector.viewType.SUCCESS
        });
    }

    checkInspectChange(keepData, newData) {
        let {enumSelector} = this.state;

        // 檢查巡檢評分項是否有變更評分選項
        let type1Items = [];
        newData.forEach((group) => {
            if(group.type == 1) {
                type1Items = type1Items.concat(group.items);
            }
        })

        keepData.forEach((e) => {
            if(e.type == 1) {
                e.groups.forEach((group) => {
                    group.items.forEach((item) => {
                        let newItem = type1Items.find(newItem => newItem.id == item.id);
                        if(newItem && this.isEqual(newItem.availableScores, item.availableScores) == false) {
                            item.availableScores = newItem.availableScores;
                            item.score = -(2**31);
                            item.type = newItem.type;
                            item.itemScore = newItem.itemScore;
                            item.qualifiedScore = newItem.qualifiedScore;
                            item.scoreType = enumSelector.scoreType.SCORELESS;
                        }
                    })
                })
            }
        })

        return keepData;
    }

    isEqual(a, b) {
        if (a === b ) return true;
        if (a == null || b == null ) return false;
        if (a.length !== b.length) return false;
        for (var i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    onBack(){
        let {patrolSelector} = this.state;
        if(patrolSelector.signTime != 0 || patrolSelector.distance != null) {
            patrolSelector.signTime = 0;
            patrolSelector.distance = null;
            this.setState({patrolSelector});
        }
        
        PatrolStorage.abandon(patrolSelector.uuid);

        EventBus.refreshTemporary();
        EventBus.refreshStoreDetail();
        EventBus.refreshStoreInfo();
        EventBus.refreshEventInfo();

        Actions.pop();
    }

    async fetchData(){
        let {store, inspect} = this.props;
        let {patrolSelector, enumSelector, screenSelector} = this.state;
        this.setState({viewType: enumSelector.viewType.LOADING});

        let result = await checkoutInspect(store.storeId, 1, inspect.id);
        if (result.errCode !== enumSelector.errorType.SUCCESS){
            this.setState({viewType: enumSelector.viewType.FAILURE});
            return;
        }

        if (result.data.groups.length === 0){
            this.setState({viewType: enumSelector.viewType.EMPTY});
            return;
        }

        let resultStoreInfo = await getStoreInfo(store.storeId, false);
        if (resultStoreInfo.errCode == enumSelector.errorType.SUCCESS){
            store.latitude = resultStoreInfo.data.latitude;
            store.longitude = resultStoreInfo.data.longitude;
        }

        patrolSelector.uuid = uuid.v4();
        patrolSelector.store = store;
        patrolSelector.inspect = inspect;
        patrolSelector.screen = screenSelector.patrolType.NORMAL;
        patrolSelector.router = screenSelector.patrolType.PATROL;
        patrolSelector.scheduleId = this.props.scheduleId;
        patrolSelector = PatrolCore.init(patrolSelector, result.data);

        if (patrolSelector.categories.length === 0){
            this.setState({viewType: enumSelector.viewType.EMPTY});
            return;
        }

        this.setState({patrolSelector, viewType: enumSelector.viewType.SUCCESS},
            () => {
            EventBus.updateBasePatrol();
        });
    }

    onRouter(){
        Actions.push('patrolSummary');
    }

    onPatrolUnfinished(){
        let {patrolSelector, screenSelector} = this.state;
        patrolSelector.visible = false;
        //patrolSelector.collection = null;
        patrolSelector.interactive = false;
        patrolSelector.router = screenSelector.patrolType.UNFINISHED;

        this.setState({patrolSelector}, () => {
            setTimeout(() => {
                Actions.push('patrolUnfinished');
            },100)
        });

        EventBus.closePopupPatrol();
    }

    onSearch(){
        let {patrolSelector, screenSelector} = this.state;
        patrolSelector.visible = false;
        patrolSelector.interactive = false;
        patrolSelector.router = screenSelector.patrolType.SEARCH;

        this.setState({patrolSelector}, () => {
            EventBus.closePopupPatrol();

            Actions.push('patrolSearch');
        });
    }

    onSummary(){
        this.category && this.category.onClose();

        let {patrolSelector, enumSelector, screenSelector} = this.state;
        EventBus.closePopupPatrol();
        patrolSelector.visible = false;
        //patrolSelector.collection = null;
        patrolSelector.interactive = false;
        this.setState({patrolSelector});

        let items = PatrolCore.getItems(patrolSelector);
        let remarkCount = items.filter(p => (p.type !== 0)).length;
        let scoreCount = items.filter(p => (p.scoreType !== enumSelector.scoreType.SCORELESS)).length;
        let requiredUnFinished = items.filter(p => (p.required && 
            ((p.type === 0 && p.scoreType === enumSelector.scoreType.SCORELESS) ||
            (p.type !== 0 && p.attachment.length === 0))
            )).length;
        let requiredMemoUnFinished = items.filter(item => this.checkMemoRequiredUnFinished(item)).length;
        if(requiredUnFinished > 0) {
            this.modalRequired && this.modalRequired.open();
        } else if(requiredMemoUnFinished > 0) {
            this.modalMemoRequired && this.modalMemoRequired.open();
        } else if((remarkCount + scoreCount) === items.length){
            this.onRouter();
        } else {
            this.modalUnfinished && this.modalUnfinished.open();
        }
    }

    checkMemoRequiredUnFinished(item) {
        let {enumSelector} = this.state;
        let unfinished = false;
        if(item.memo_is_advanced && item.memo_config) {
            if(item.memo_config.memo_required_type == enumSelector.memoRequiredType.REQUIRED || 
                (item.memo_config.memo_required_type == enumSelector.memoRequiredType.REQUIRED_UNQUALIFIED && 
                    (item.scoreType == enumSelector.scoreType.UNQUALIFIED || item.scoreType == enumSelector.scoreType.FAIL))) { // 必填或不合格時必填
                if(item.memo_config.memo_check_text && !item.attachment.find(p => p.mediaType == enumSelector.mediaTypes.TEXT)) {
                    unfinished = true;
                }
                if(item.memo_config.memo_check_media && !item.attachment.find(p => (p.mediaType == enumSelector.mediaTypes.VIDEO || p.mediaType == enumSelector.mediaTypes.IMAGE))) {
                    unfinished = true;
                }
            }
        }
        return unfinished;
    }

    enableRightButton(){
        let {patrolSelector, enumSelector} = this.state;
        let scoreType = enumSelector.scoreType;
        let items = PatrolCore.getItems(patrolSelector);

        return (items.filter(p => ((p.scoreType !== scoreType.SCORELESS) && (p.scoreType !== scoreType.IGNORE))).length > 0) ||
            (items.filter(p => p.type !== 0).length === items.length);
    }

    onGroup(item){
        let {patrolSelector} = this.state;
        let group = patrolSelector.groups.find(p => p.groupId === item.groupId);
        group.expansion = !item.expansion;

        if (patrolSelector.visible && (patrolSelector.collection != null)
            && (group.items.find(p => p.id === patrolSelector.collection.id) != null)){
            patrolSelector.visible = false;
        }

        this.setState({patrolSelector}, () =>{
            EventBus.updateBasePatrol();
        });
    }

    render() {
        let {viewType, patrolSelector, enumSelector} = this.state;
        let storeName = this.props.store ? this.props.store.name : '';
        storeName = ((storeName === '') && patrolSelector.store) ? patrolSelector.store.name : storeName;

        let padding = PhoneInfo.isSimpleLanguage() ? 11 : 8;

        return (
            <TouchableActive style={styles.container}>
                <Navigation
                    onLeftButtonPress={()=>{
                        this.category && this.category.onClose();
                        if (patrolSelector.categories.length !== 0){
                            this.modalBack && this.modalBack.open()
                        }else{
                            Actions.pop();
                        }
                    }}
                    title={storeName}
                    rightButtonTitle={I18n.t('Inspection finish')}
                    rightButtonEnable={this.enableRightButton()}
                    rightButtonStyle={{activeColor:'#C60957', inactiveColor:'#CCCED1',
                        textColor:'#ffffff', padding: padding, fontSize:14}}
                    onRightButtonPress={() => this.onSummary()}
                />
                <TouchableOpacity style={styles.searchPanel} activeOpacity={0.5} onPress={() => this.onSearch()}>
                    <Image source={require('../assets/img_search_label.png')} style={styles.search}/>
                </TouchableOpacity>
                <NetInfoIndicator/>

                {(viewType !== enumSelector.viewType.SUCCESS) && <ViewIndicator viewType={viewType} containerStyle={{marginTop:242}}
                    refresh={() => {
                        (async ()=> this.fetchData())()
                    }}/>}
                {(viewType === enumSelector.viewType.SUCCESS) && <View style={{flex:1}}>
                    <PatrolCategory ref={c => this.category = c} onClick={() => {
                        setTimeout(() => {
                            this.group && this.group.onScroll();
                        }, 100)
                    }}/>
                    {(patrolSelector.categoryType != null) && <PatrolGroup ref={c => this.group = c}
                                                                           data={patrolSelector.groups}
                                                                           showNumerator={true}
                                                                           onGroup={(item) => this.onGroup(item)}
                    />}
                    {(patrolSelector.categoryType == null) && <Feedback data={patrolSelector.feedback}
                                                                        onBacker={() => this.modalBack && this.modalBack.open()}/>}
                </View>}

                <ModalCenter ref={c => this.modalBack = c} title={I18n.t('Exit inspection')} description={I18n.t('Quitting confirm')}
                             confirm={() => this.onBack()}/>
                <ModalCenter ref={c => this.modalUnfinished = c} title={I18n.t('Inspection finish')} description={I18n.t('Unfinished prompt')}
                             enablePatrol={true} confirm={() => this.onRouter()} patrol={() => this.onPatrolUnfinished()}/>
                <ModalCenter ref={c => this.modalRequired = c} title={I18n.t('Inspection finish')} description={I18n.t('Required Unfinished prompt')}
                             showCancel={false}/>
                <ModalCenter ref={c => this.modalMemoRequired = c} title={I18n.t('Inspection finish')} description={I18n.t('Memo Required Unfinished prompt')}
                            showCancel={false}/>
                <AndroidBacker onPress={() => {
                    if (patrolSelector.categories.length !== 0){
                        this.modalBack && this.modalBack.open();
                        return true;
                    }
                }}/>
            </TouchableActive>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ColorStyles.STATUS_BACKGROUND_COLOR
    },
    header:{
        backgroundColor:'#E4E4E4'
    },
    view:{
        flexDirection:'row',
        justifyContent:'space-between'
    },
    searchPanel:{
        position:'absolute',
        left: 56,
        top: 0,
        width:54,
        ...Platform.select({
            android: {
                height:56
            },
            ios: {
                height:78
            }
        })
    },
    search:{
        width:20,
        height:20,
        ...Platform.select({
            android:{
                marginTop:13
            },
            ios:{
                marginTop:25
            }
        })
    }
});
