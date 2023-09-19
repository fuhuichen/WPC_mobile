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
    BackHandler,
    FlatList
} from "react-native";
import I18n from "react-native-i18n";
import {Actions} from "react-native-router-flux";
import {inject, observer} from "mobx-react";
import Navigation from "../../element/Navigation";
import store from "../../../mobx/Store";
import Signature from "../../components/Signature";
import TouchableActive from "../../touchables/TouchableActive";
import TouchableInactive from "../../touchables/TouchableInactive";
import {Badge} from "react-native-elements";
import ScrollTop from "../../element/ScrollTop";
import {getCashCheckReportInfo} from "../FetchRequest";
import BasePatrol from "../../customization/BasePatrol";
import AndroidBacker from "../../components/AndroidBacker";
import RouteMgr from "../../notification/RouteMgr";
import * as storage from 'react-native-simple-store';
import PatrolFragment from "../../inspection/PatrolFragment";
import EventBus from "../../common/EventBus";
import ViewIndicator from "../../customization/ViewIndicator";
import BorderShadow from '../../element/BorderShadow';
import SlotView from "../../customization/SlotView";
import moment from "moment";
import PhoneInfo from "../../entities/PhoneInfo";
import PropTypes from 'prop-types';
import {Divider} from "react-native-elements";
import CommentResourcesBlock from '../../components/comment/CommentResourcesBlock';
import TimeUtil from "../../utils/TimeUtil";

const {width, height} = Dimensions.get('window');

@inject('store')
@observer
export default class RecordDetail extends BasePatrol {
    state = {
        showScrollTop: false,
        viewType: store.enumSelector.viewType.LOADING,
        enumSelector: store.enumSelector,
        paramSelector: store.paramSelector,
        data: null
    };

    static propTypes = {
        reportId: PropTypes.number,
        version: PropTypes.number
    };

    static defaultProps = {
        version: 1
    };

    constructor(props){
        super(props);
    }

    componentDidMount(){
        this.fetchData();
    }

    async fetchData(){
        let {enumSelector} = this.state;
        let {reportId, version} = this.props;
        if(reportId != null) {
            this.setState({viewType: enumSelector.viewType.LOADING});
    
            let body = {
                reportId: reportId,
                version: version
            }
            let result = await getCashCheckReportInfo(body);
            if (result.errCode !== enumSelector.errorType.SUCCESS) {
                this.setState({viewType: enumSelector.viewType.FAILURE});
                return;
            }
            this.setState({
                data: result.data,
                viewType: enumSelector.viewType.SUCCESS
            });
        }
    }

    renderContent(){
        let {data} = this.state;
        let content = [];
        if(data.rootGroups && data.rootGroups.length > 0) {
            data.rootGroups.forEach(rootGroup => {
                if(rootGroup.items && rootGroup.items.length > 0) {
                    content = content.concat(rootGroup.items);
                } else if(rootGroup.subGroups && rootGroup.subGroups.length > 0) {
                    rootGroup.subGroups.forEach(subGroup => {
                        if(subGroup.items && subGroup.items.length > 0) {
                            content = content.concat(subGroup.items);
                        }
                    })
                }
            })
        }
        if(data.formSetting && data.formSetting.setting_app_view && data.formSetting.setting_app_view.is_customize_order == true) {
            let tmpContent = [];
            if(data.formSetting.setting_app_view.customize_order && data.formSetting.setting_app_view.customize_order.length > 0) {
                data.formSetting.setting_app_view.customize_order.forEach(orderId => {
                    content.forEach(element => {
                        if(element.referItemId == orderId) {
                            tmpContent.push(element);
                        }
                    })
                })
                content = tmpContent;
            }
        }

        return (
            <FlatList
                data={content}
                keyExtractor={(item, index) => index.toString()}
                renderItem={this.renderItem}
                showsVerticalScrollIndicator={false}/>            
        )
    }

    renderItem = ({ item,index}) => {
        let {enumSelector} = this.state;
        let value = (item.value || item.value == 0) ? item.value.toString() : '';
        if((item.inputType == enumSelector.cashcheckInputType.NUMBER || item.inputType == enumSelector.cashcheckInputType.SYSTEMCALC) && value != '') {
            value = value.replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, "$1,");
        }
        return (
            <View style={{marginTop:14}}>
                <Text style={styles.label}>{item.itemName}</Text>
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
        let {data} = this.state;
        let signatures = data.signatures;
        /*let signatures = [{
            "type":1,
            "content":"https://storevuestorage.blob.core.windows.net/storevue-mgmt-portals/image/20230118/inspect_094342_1MJR3BkFX92v_-11.jpg",
            "header":null,
            "optional":false
        }];*/

        if(signatures && signatures.length > 0){
            signatures.forEach(signature => {
                signature.content = signature.url;
            })
            return (
                <View style={{marginTop:16}}>
                    <Text style={styles.label}>{I18n.t('Signature')}</Text>
                    <Signature showOperator={false} data={signatures} editable={false}/>
                </View>
            )
        } else {
            return null;
        }        
    }
    
    renderAttachment(){
        let {data} = this.state;
        let attachments = data.attachments;
        if(attachments && attachments.length > 0){
            return (
                <View style={{marginTop:16, marginBottom: 10}}>
                    <View style={styles.signPanel}>
                        <Text style={styles.label}>{I18n.t('CashCheck Attachment')}</Text>
                    </View>
                    <View style={{flex:1,paddingRight:10,paddingLeft:10,marginTop:10}}>
                        <CommentResourcesBlock blockStyle={{backgroundColor:'#EAF1F3',paddingTop:10,marginBottom:120,borderRadius:10}}
                            data={attachments}
                            showDelete={false}
                            showEdit={false}
                            multiLine={true}
                        />
                    </View>
                </View>
            )
        } else {
            return null;
        }
    }

    renderHeader() {
        let {paramSelector, data} = this.state;
        let summary = paramSelector.getCashCheckSummaries().find(p => p.id === data.status) || {};
        const date = TimeUtil.getDetailTime(data.ts);
        
        return (
            <View style={styles.header}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <View>
                        <Text style={styles.storeName}>{data.storeName}</Text>
                        <Text style={styles.submitter}>{date[3]}  {date[1]}</Text>
                    </View>
                    <Badge value={summary.name} badgeStyle={[styles.badge,{backgroundColor:summary.backgroundColor}]}
                        textStyle={[styles.text,{color:summary.color, fontSize:16}]}/>
                </View>
                <Text style={styles.submitter}>{data.formName + " | " + data.submitterName}</Text>
            </View>
        )
    }

    onBack(){
        const routerCashCheck = 'cashchecking';
        EventBus.refreshCashCheckRecordList();
        if (RouteMgr.isContain(routerCashCheck)){
            EventBus.refreshStoreInfo();
            Actions.popTo('cashcheckhomePage');
        } else {
            Actions.pop();
        }

        return true;
    }

    onEdit() {
        let {reportId, version} = this.props;
        Actions.push('cashchecking', {reportId, version});
    }

    render() {
        let {viewType, enumSelector, showScrollTop} = this.state;
        let rightButtonEnable = (viewType === enumSelector.viewType.SUCCESS);
        
        return (
            <TouchableActive style={styles.container}>
                <Navigation
                    onLeftButtonPress={()=>{this.onBack()}}
                    title={I18n.t('CashCheck Detail')}
                    rightButtonEnable={rightButtonEnable}
                    rightButtonImg={require('../../assets/analysis_record.png')}
                    onRightButtonPress={() => {this.onEdit()}}
                />

                {
                    (viewType !== enumSelector.viewType.SUCCESS) &&  <ViewIndicator viewType={viewType} containerStyle={{marginTop:242}}
                         refresh={() => this.fetchData()} />
                }
                {(viewType === enumSelector.viewType.SUCCESS) && <TouchableInactive>
                    <ScrollView ref={c => this.scroll = c}
                                onScroll={event =>{
                                    let showScrollTop = (event.nativeEvent.contentOffset.y > 200);
                                    this.setState({showScrollTop});
                                }}
                                style={styles.panel} showsVerticalScrollIndicator={false}>
                        <TouchableActive>
                            {this.renderHeader()}
                            {this.renderContent()}
                            {this.renderSignature()}
                            {this.renderAttachment()}
                            <SlotView containerStyle={{height:50}}/>
                        </TouchableActive>
                    </ScrollView>

                    <ScrollTop showOperator={showScrollTop} onScroll={() => {this.scroll && this.scroll.scrollTo({x:0 ,y:0, animated:true})}}/>
                </TouchableInactive>}

                <AndroidBacker onPress={() => this.onBack()}/>
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
        marginTop:5,
        marginLeft:10,
        paddingLeft:16,
        fontSize:14,
        color:'#1E272E',
        backgroundColor: 'rgb(227,228,229)'//'#ffffff'
    },
    pencil:{
        position:'absolute',
        top: 43,
        right:20,
        width:16,
        height:16
    },
    header:{        
        paddingLeft:15,
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
    signPanel:{
        flexDirection:'row',
        justifyContent:'flex-start',
        marginLeft:10,
        marginTop:18
    },
});
