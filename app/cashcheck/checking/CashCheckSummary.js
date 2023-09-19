import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    TouchableOpacity,
    TextInput,
    FlatList,
    ScrollView,
    Platform,
    DeviceEventEmitter
} from "react-native";
import I18n from "react-native-i18n";
import {Actions} from "react-native-router-flux";
import dismissKeyboard from "react-native-dismiss-keyboard";
import {inject, observer} from "mobx-react";
import Navigation from "../../element/Navigation";
import store from "../../../mobx/Store";
import * as lib from '../../common/PositionLib';
import Signature from "../../components/Signature";
import Attachment from "../../components/Attachment";
import ModalCenter from "../../components/ModalCenter";
import StringFilter from "../../common/StringFilter";
import EventBus from "../../common/EventBus";
import TouchableActive from "../../touchables/TouchableActive";
import TouchableInactive from "../../touchables/TouchableInactive";
import NP from "number-precision/src/index";
import PatrolParser from "../../components/inspect/PatrolParser";
import CashCheckCore from "./CashCheckCore";
import {MEDIA_AUDIO, MEDIA_IMAGE, MEDIA_VIDEO, MODULE_INSPECT, UPDATE_BASE_CASHCHECK} from "../../common/Constant";
import ProgressIndicator from "../../components/ProgressIndicator";
import SoundUtil from "../../utils/SoundUtil";
import OSSUtil from "../../utils/OSSUtil";
import moment from "moment";
import { submitCashCheckReport, modifyCashCheckReport, getCashCheckAdvancedConfig } from "../FetchRequest";
import UserPojo from "../../entities/UserPojo";
import BaseCashCheck from "../../customization/BaseCashCheck";
import NetInfoIndicator from "../../components/NetInfoIndicator";
import CashCheckStorage from "./CashCheckStorage";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import BorderShadow from '../../element/BorderShadow';
import PatrolResult from "../../inspection/PatrolResult";
import ScrollTop from "../../element/ScrollTop";
import TemporaryResult from "../../inspection/TemporaryResult";
import AndroidBacker from "../../components/AndroidBacker";
import PhoneInfo from "../../entities/PhoneInfo";
import Orientation from 'react-native-orientation-locker';
import {Divider} from "react-native-elements";
import AccessHelper from "../../common/AccessHelper";
import CommentResourcesBlock from '../../components/comment/CommentResourcesBlock';

const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class CashCheckSummary extends BaseCashCheck {
    state = {
        showScrollTop: false,
        totalPoints: 0,
        enumSelector: store.enumSelector,
        paramSelector: store.paramSelector,
        cashcheckSelector: store.cashcheckSelector,
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
        selectSchedule: null,
        advancedConfig: null
    };

    constructor(props) {
        super(props);
        Orientation.lockToPortrait();
    }

    orientationDidChange(orientation){
      if (orientation === 'LANDSCAPE') {
        // do something with landscape layout
      } else {
        // do something with portrait layout
      }
    }
    componentDidMount(){
        Orientation.addOrientationListener(this.orientationDidChange);
        this.emitter = DeviceEventEmitter.addListener(UPDATE_BASE_CASHCHECK,()=>{
        });        
        this.getAdvancedConfig();
    }

    componentWillUnmount(){
        this.emitter && this.emitter.remove();
    }

    async getAdvancedConfig() {
        let { cashcheckSelector, enumSelector } = this.state;
        let body = { formId: cashcheckSelector.formId};
        let result = await getCashCheckAdvancedConfig(body);
        if(result.errCode == enumSelector.errorType.SUCCESS) {
            let advancedConfig = result.data;
            if(advancedConfig.is_any_abnormal_result_in_fail == true && CashCheckCore.isAbnormalTrigger(cashcheckSelector) == true) {
                this.onStatus(enumSelector.cashcheckStatus.ABNORMAL);
            }
            this.setState({advancedConfig});
        }
    }

    onSeed(){
        dismissKeyboard();
        let {cashcheckSelector, advancedConfig} = this.state;

        if (cashcheckSelector.status == null){
            DeviceEventEmitter.emit('Toast', I18n.t('Select cashcheck overall'));
            return false;
        }

        if (advancedConfig.is_signature && (cashcheckSelector.signatures.length === 0)){
            DeviceEventEmitter.emit('Toast', I18n.t('Give sign'));
            return false;
        }

        this.modalConfirm && this.modalConfirm.open();
    }

    async onSubmit(){
        try {
            let {cashcheckSelector, enumSelector, advancedConfig} = this.state;
            this.keyIndex = 0;
            SoundUtil.stop();

            OSSUtil.init(cashcheckSelector.store.storeId).then(async ()=>{
                let signature = this.formatSignature();
                let attachments = this.formatAttachment();

                this.indicator && this.indicator.open();
                let pArray = [...signature.uploads];
                Promise.all(pArray).then(async (res) => {
                    let body = {
                        formId: cashcheckSelector.formId,
                        status: cashcheckSelector.status,
                        storeId: cashcheckSelector.store.storeId,
                        items: CashCheckCore.getItems(cashcheckSelector),
                        attachmentsList: attachments.data,
                        signatures: signature.data
                    };
                    let submitResult = false, result = null;
                    if(this.props.reportId == null) {
                        result = await submitCashCheckReport(body);
                        submitResult = (result.errCode === enumSelector.errorType.SUCCESS);
                    } else {
                        body.reportId = this.props.reportId;
                        result = await modifyCashCheckReport(body);
                        submitResult = (result.errCode === enumSelector.errorType.SUCCESS);                        
                    }
                    if(submitResult && result != null) {
                        CashCheckStorage.delete(cashcheckSelector.uuid);
                        this.indicator && this.indicator.close();
                        this.setState({submitResult}, function() {
                            Actions.pop();
                            Actions.push('recordDetail', {reportId: result.data.reportId, version: result.data.version});
                        });                        
                    } else {
                        if(result && result.errCode == enumSelector.errorType.SUBMITFAIL) {
                            let interval = '';
                            if(advancedConfig) {
                                if(advancedConfig.period_restrict_unit == enumSelector.dateUnit.DAY) {
                                    interval = I18n.t('Day within', {number: advancedConfig.period_restrict_limited});
                                } else if(advancedConfig.period_restrict_unit == enumSelector.dateUnit.MONTH) {
                                    interval = I18n.t('Month within', {number: advancedConfig.period_restrict_limited});
                                } else if(advancedConfig.period_restrict_unit == enumSelector.dateUnit.YEAR) {
                                    interval = I18n.t('Year within', {number: advancedConfig.period_restrict_limited});
                                }
                            }
                            DeviceEventEmitter.emit('Toast', I18n.t('CashCheck Submit Fail', {interval: interval}));
                        }
                        this.indicator && this.indicator.close();
                        this.setState({submitResult});
                    }
                    this.indicator && this.indicator.close();
                }).catch(error => {
                    this.indicator && this.indicator.close();
                })
            }).catch(error => {
                console.log("submit cashcheck error : ", JSON.stringify(error));
                this.indicator && this.indicator.close();
                this.setState({submitResult: false});
            });
        }catch (e) {
        }
    }

    onStatus(status) {
        let {cashcheckSelector} = this.state;
        cashcheckSelector.status = status;
        this.setState({cashcheckSelector}, function() {
            EventBus.updateBaseCashCheck();
        })
    }

    renderStatus(){
        let {cashcheckSelector, paramSelector, advancedConfig, enumSelector} = this.state;
        let isOnlyAbnormal = (advancedConfig && advancedConfig.is_any_abnormal_result_in_fail && CashCheckCore.isAbnormalTrigger(cashcheckSelector));
        let summary = isOnlyAbnormal ? paramSelector.getCashCheckSummary(enumSelector.cashcheckStatus.ABNORMAL) : paramSelector.getCashCheckSummaries();
        return (
            <View style={{marginTop:26,marginLeft:10,marginRight:10}}>
                <View style={{flexDirection:'row', justifyContent:'flex-start'}}>
                    <Text style={[styles.label]}>{I18n.t('CashCheck Result')}</Text>
                </View>
                <View style={styles.statusView}>
                {
                    summary.map((item) => {
                        let name = item.name;
                        if(item.id == enumSelector.cashcheckStatus.NORMAL && advancedConfig && advancedConfig.is_customize_display_normal) {
                            name = advancedConfig.customize_display_normal;
                        } else if (item.id == enumSelector.cashcheckStatus.ABNORMAL && advancedConfig && advancedConfig.is_customize_display_abnormal) {
                            name = advancedConfig.customize_display_abnormal;
                        }
                        return <TouchableOpacity activeOpacity={1} onPress={()=>{ this.onStatus(item.id) }} style={{marginRight:10}}>
                            <BoxShadow setting={{width:(width-60)/3, height:32, color:"#000000",
                                border:2, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:12}}}>
                                <View style={[styles.statusPanel, (item.id === cashcheckSelector.status) && {backgroundColor:'#006AB7'}]}>
                                    <Text style={[styles.statusContent,(item.id === cashcheckSelector.status) && {color:'#ffffff'}]}>{name}</Text>
                                </View>
                            </BoxShadow>
                        </TouchableOpacity>
                    })
                }
                </View>
            </View>
        )
    }

    renderContent(){        
        let {cashcheckSelector} = this.state;
        let items = CashCheckCore.getItems(cashcheckSelector);
        if(cashcheckSelector.appViewConfig != null && cashcheckSelector.appViewConfig.is_customize_order == true) {
            items = this.filterCashCheckItem(items, cashcheckSelector.appViewConfig.customize_order);
        }
        return (
            <View style={{marginTop:10}}>
                <FlatList
                    data={items}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={this.renderItem}
                    showsVerticalScrollIndicator={false}/>            
            </View>
        )
    }

    filterCashCheckItem(items, customizeOrder) {
        let tmpItems = [];
        customizeOrder.forEach(id => {
            items.forEach(item => {
                if(item.id == id || item.referItemId == id) {
                    tmpItems.push(item);
                }
            })
        })
        return tmpItems;
    }

    renderItem = ({ item,index}) => {
        let {enumSelector} = this.state;
        let value = (item.value || item.value == 0) ? item.value.toString() : '';
        if((item.inputType == enumSelector.cashcheckInputType.NUMBER || item.inputType == enumSelector.cashcheckInputType.SYSTEMCALC) && value != '') {
            value = value.replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, "$1,");
        }

        return (
            <View style={{marginTop:14}}>
                <Text style={styles.content}>{item.subject}</Text>
                <TextInput style={[styles.comment/*,BorderShadow.div*/]}
                           editable={false}
                           multiline={true}
                           autoCapitalize={'none'}
                           returnKeyType={'done'}
                           value={value}
                />
            </View>
        )
    };

    renderSignature(){
        let {cashcheckSelector, advancedConfig} = this.state;

        let isRequired = advancedConfig != null ?  advancedConfig.is_signature : false;
        return (
            <View style={{marginTop:16, marginBottom: 10}}>
                <View style={styles.signPanel}>
                    {isRequired && <Text style={{color:'#C60957', lineHeight: 20}}>{'*'}</Text>}
                    <Text style={styles.label}>{I18n.t('Label signature or photo')}</Text>
                </View>
                <Signature data={cashcheckSelector.signatures} maxCount={1}
                    onSign={(sign, index) => {
                        if(index == -1) {
                            cashcheckSelector.signatures.push(sign);
                        } else {
                            if(cashcheckSelector.signatures[index]) {
                                cashcheckSelector.signatures[index] = sign;
                            }
                        }
                        this.setState({cashcheckSelector}, () =>{
                            //EventBus.updateCashCheckCache();
                            EventBus.updateBaseCashCheck();
                        });
                    }}
                    onDelete={(index) => {
                        if(cashcheckSelector.signatures[index].header == null) {
                            cashcheckSelector.signatures.splice(index, 1);
                        } else {
                            cashcheckSelector.signatures[index] = {
                                header: cashcheckSelector.signatures[index].header,
                                optional: cashcheckSelector.signatures[index].optional
                            }
                        }
                        this.setState({cashcheckSelector}, () => {
                            //EventBus.updateCashCheckCache();
                            EventBus.updateBaseCashCheck();
                        });
                    }}/>
            </View>
        )
    }
    
    renderAttachment(){
        let {cashcheckSelector} = this.state;
        if(cashcheckSelector.attachments.length > 0){
            return <View style={{marginTop:16, marginBottom: 10}}>
                <View style={styles.signPanel}>
                    <Text style={styles.label}>{I18n.t('CashCheck Attachment')}</Text>
                </View>
                <View style={{flex:1,paddingRight:10,paddingLeft:10,marginTop:10}}>
                    <CommentResourcesBlock blockStyle={{backgroundColor:'#EAF1F3',paddingTop:10,marginBottom:120,borderRadius:10}}
                        data={cashcheckSelector.attachments}
                        showDelete={false}
                        showEdit={false}
                        multiLine={true}
                    />
                </View>
            </View>
        } else {
            return null;
        }
    }

    formatSignature(){
        let dataSet = {data:[], uploads:[]};
        let {cashcheckSelector, enumSelector} = this.state;

        cashcheckSelector.signatures.forEach((item) => {
            if(item.content && item.content.substring(0,5) != 'https') {
                let ossImageKey = OSSUtil.formatOssUrl(MODULE_INSPECT, enumSelector.mediaTypes.IMAGE,
                    cashcheckSelector.store.storeId,'-1' + this.keyIndex++);

                dataSet.uploads.push(OSSUtil.upload(ossImageKey,item.content));
                dataSet.data.push({
                    type: item.signPhoto ? 2 : 1,
                    //orientation: item.signOrientation,
                    url: OSSUtil.formatRemoteUrl(ossImageKey),
                    header: item.header,
                    optional: item.optional
                })
            } else {
                dataSet.data.push(item);
            }
        });
        return dataSet;
    }

    formatAttachment(){
        let dataSet = {data:[], uploads:[]};
        let {cashcheckSelector, enumSelector} = this.state;

        cashcheckSelector.attachments.forEach((item) => {
            if(item.url.substring(0,5) != 'https') {
                let ossImageKey = OSSUtil.formatOssUrl(MODULE_INSPECT, item.mediaType,
                    cashcheckSelector.store.storeId,'-1' + this.keyIndex++);
                dataSet.uploads.push(OSSUtil.upload(ossImageKey,item.url));
                dataSet.data.push({
                    mediaType: item.mediaType,
                    url: OSSUtil.formatRemoteUrl(ossImageKey),
                    //ts: moment().unix()
                })
            } else {
                dataSet.data.push(item);
            }
        });
        return dataSet;
    }

    renderHeader(){
        let {cashcheckSelector} = this.state, maxWidth = width-130;
        PhoneInfo.isEnLanguage() && (maxWidth = maxWidth-30);

        return (
            <View style={styles.header}>
                <Text style={[styles.storeName,{maxWidth}]}>{cashcheckSelector.store.name}</Text>
                <Text style={[styles.tagName,{maxWidth}]}>{cashcheckSelector.tagName}</Text>
            </View>
        )
    }

    renderSignIn(){
        let {} = this.state, content = '';

        return <Text style={styles.signIn}>{content}</Text>
    }

    onBack(){
        let {} = this.state;

        this.setState({}, () => {
            //EventBus.updatePatrolData();
            Actions.pop()
        });
    }

    render() {
        let {submitResult, temporaryResult, showScrollTop} = this.state;
        return (
            <TouchableActive style={styles.container}>
                <Navigation
                    onLeftButtonPress={() => {this.onBack()}}
                    title={I18n.t('CashCheck summary')}
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
                            {/*this.renderSignIn()*/}
                            {this.renderStatus()}
                            {this.renderContent()}
                            {this.renderSignature()}
                            {this.renderAttachment()}
                        </TouchableActive>
                    </ScrollView>
                    <ScrollTop showOperator={showScrollTop} onScroll={()=> {this.scroll && this.scroll.scrollTo({x:0,y:0,animated:true})}}/>
                </TouchableInactive>

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

                <ProgressIndicator ref={c => this.indicator = c} />
                <PatrolResult status={submitResult} reset={() => {this.setState({submitResult: null})}}/>
                {/*<TemporaryResult status={temporaryResult} reset={() => {this.setState({temporaryResult: null})}}/>*/}
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
    tagName:{
        color:'#86888A',
        marginTop:5,
        marginLeft:10
    },
    label:{
        fontSize:16,
        color:'#64686D'
    },
    content:{
        fontSize:14,
        color:'#86888A',
        marginLeft: 10
    },
    statusView:{
        flexDirection:'row',
        justifyContent:'flex-start'
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
        paddingTop:11,
        paddingBottom:11,
        paddingRight: 16,
        borderRadius:10,
        marginTop:5,
        marginLeft:10,
        paddingLeft:16,
        fontSize:14,
        color:'#1E272E',
        backgroundColor: 'rgb(227,228,229)'//'#ffffff'
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
        //flexDirection: 'row',
        //justifyContent: 'space-between',
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
        marginLeft:10,
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
