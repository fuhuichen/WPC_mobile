import React, { Component } from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    FlatList,
    DeviceEventEmitter,
    TextInput,
    ScrollView,
    Platform,
    ActivityIndicator, TouchableWithoutFeedback
} from 'react-native';
import Tab from '../thirds/beeshell/Tab';
import  FilterPanel from '../components/FilterPanel/index';
import TimeUtil from "../utils/TimeUtil";
import { Actions } from 'react-native-router-flux';
import { setVaribles} from 'beeshell/common/styles/varibles';
import HttpUtil from "../utils/HttpUtil";
import {EMITTER_EVENT, EMITTER_MODAL_CLOSE} from "../common/Constant";
import Toast, {DURATION} from 'react-native-easy-toast'
import {ColorStyles} from '../common/ColorStyles';
import moment from "moment";
import I18n from 'react-native-i18n';
let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
import AccessHelper from "../common/AccessHelper";
import ToastEx from "react-native-simple-toast";
import StringFilter from "../common/StringFilter";
import * as lib from '../common/PositionLib';
import {inject, observer} from "mobx-react";
import TimePicker from "../thirds/datepicker/TimePicker";
import NavBarPanel from "../components/NavBarPanel";

setVaribles({
    colors: {
        brandPrimary:ColorStyles.COLOR_MAIN_RED
    }
});

@inject('store')
@observer
export default class AffairSearch extends Component {

    constructor(props) {
        super(props);
        this.state = {
            tabValue: 1,
            lastPage: true,
            onEndReached:false,
            isRefresh:false,
            onPull:true,
            showFooter: 0,
            title:[
                {
                    value: 1,
                    label: I18n.t('Suspicious transaction'),
                },
                {
                    value: 2,
                    label: I18n.t('Transaction searching'),
                }
            ],
            data: [],
            filterPanelInfo:[
                {
                    "category_name": I18n.t('Sort type'),
                    "items": [
                        {
                            "label_name": I18n.t('Time Desc'),
                            "label_id": 0,
                            "selected": true
                        },
                        {
                            "label_name": I18n.t('Time Asc'),
                            "label_id": 1,
                            "selected": false
                        },
                    ],
                    "category_id": 1,
                    "support_muti_choice": 0 
                },
                {
                    "category_name": I18n.t('Status filter'),
                    "items": [
                        {
                            "label_name": I18n.t('Pending'),
                            "label_id": 0
                        },
                        {
                            "label_name": I18n.t('Closed'),
                            "label_id": 2
                        },
                    ],
                    "category_id": 2,
                    "support_muti_choice": 1 
                }
            ],
            filterPanelInfoData:[
                {
                    "category_name": I18n.t('Payment'),
                    "items": [
                        {
                            "label_name": I18n.t('Cash'),
                            "label_id": 0
                        },
                        {
                            "label_name": I18n.t('Wechat'),
                            "label_id": 1
                        },
                        {
                            "label_name": I18n.t('Alipay'),
                            "label_id": 2
                        },
                    ],
                    "category_id": 2,
                    "support_muti_choice": 0 
                },
            ],
            initialFilterPanelData: [],
            searchContent: '',
            searchTimeBegin:new Date(new Date().toLocaleDateString()),
            searchTimeEnd:new Date(new Date(new Date().toLocaleDateString()).getTime()+24*60*60*1000-1),
            stores: []
        };
        this.dataType = [];
        this.alarmType = [];
        this.currentPage = 0;
        this.seachInfo = {
            beginTs: moment().subtract(30, 'days').startOf('day').unix()*1000,
            endTs: moment().endOf('day').unix()*1000,
            sortDesc: true,
            status: [],
            storeId:[],
            eventType:[]    
        },
        this.lastStore = null;
        this.scrollFlag = false;
        this.firstSearch = true;
    }

    componentDidMount() {
        this.setState({initialFilterPanelData:this.state.filterPanelInfoData});
        this.listener = DeviceEventEmitter.addListener(EMITTER_EVENT,this.onThisRefresh.bind(this));
        this.filterEmitter = DeviceEventEmitter.addListener("OnSeachFilter",this.onFilter.bind(this));
        this.fetchStoreList();
        this.fetchConfig();
        setTimeout(() => {
            this.onChangeTab(1);
        }, 500);
    }

    componentWillUnmount(){
        this.listener && this.listener.remove();
        this.filterEmitter && this.filterEmitter.remove();
    }

    onCancel(){
        Actions.pop();
    }

    onThisRefresh(){
        this.onChangeTab(1);
    }

    onFilter(data){
        this.firstSearch = false;
        this.seachInfo.beginTs = data.beginTs;
        this.seachInfo.endTs = data.endTs;
        this.seachInfo.storeId = data.storeId;
        this.lastStore = data.lastStore;
        this.seachInfo.status = [];
        this.seachInfo.eventType = [];
        data.filter.forEach((item,index)=>{
            if(item.category_id == 1){
                item.items.forEach((itemChild,indexChild)=>{
                        if (itemChild.selected == true){
                            if (itemChild.label_id == 1){
                                this.seachInfo.sortDesc = false;
                            }
                            else{
                                this.seachInfo.sortDesc = true;
                            }
                        }
                    }
                )
            }
            else if (item.category_id == 2){
                this.seachInfo.status = [];
                item.items.forEach((itemChild,indexChild)=>{
                    if (itemChild.selected == true){
                        this.seachInfo.status.push(itemChild.label_id);
                    }
                })
            }
            else if(item.category_id == 3){
                item.items.forEach((itemChild,indexChild)=>{
                    if (itemChild.selected == true){
                        this.seachInfo.eventType.push(itemChild.label_id);
                    }
                })
            }
        });      
        this.fetchEventList(0);
        this.setState({filterPanelInfo:data.filter});
    }

    fetchStoreList(){
        let request = {};
        let filter = {};
        filter.page = 0;
        filter.size = 1000;
        request.filter = filter;
        HttpUtil.post('store/list',request)
            .then(result => {
                let content = result.data.content;
                this.setState({stores:content});
            })
            .catch(error=>{
            })
    }

    fetchConfig(){
        HttpUtil.get(`lps/config`)
            .then(result => {
                result.data.dataTypes.forEach((item,index)=>{
                    let oneitem = {};
                    oneitem.label_name = item.name;
                    oneitem.label_id = item.id;
                    this.dataType.push(oneitem);
                });
                result.data.alarmTypes.forEach((item,index)=>{
                    let oneitem = {};
                    oneitem.label_name = item.name;
                    oneitem.label_id = item.id;
                    this.alarmType.push(oneitem);
                });
                if (this.alarmType.length > 0){
                    let filterUserInfo = {};
                    filterUserInfo.category_name = I18n.t('Suspicious types');
                    filterUserInfo.items = this.alarmType;
                    filterUserInfo.category_id = 3;
                    filterUserInfo.support_muti_choice = 1;
                    let filterPanelInfo = this.state.filterPanelInfo;
                    filterPanelInfo.push(filterUserInfo);
                    this.setState({filterPanelInfo:filterPanelInfo});
                }
                if (this.dataType.length > 0){
                    let filterUserInfo = {};
                    filterUserInfo.category_name = I18n.t('Transaction types');
                    filterUserInfo.items = this.dataType;
                    filterUserInfo.category_id = 1;
                    filterUserInfo.support_muti_choice = 1;
                    let filterPanelInfo = this.state.filterPanelInfoData;
                    filterPanelInfo.push(filterUserInfo);
                    this.setState({filterPanelInfoData:filterPanelInfo,initialFilterPanelData:filterPanelInfo});
                }
            })
            .catch(error=>{
            })
    }

    fetchEventList(page){
        if (page === 0){
            if(this.seachInfo.storeId.length > 0 || this.firstSearch){
                this.setState({
                    lastPage:true,
                    data:[],
                    onPull:true,
                    showFooter: 0,
                },()=>{
                    this.scrollFlag = false;
                    this.fetchEventListEx(page);
                });
            }
            else{
                this.setState({data:[]});
            } 
        }
        else{
            this.fetchEventListEx(page);
        } 
    }

    fetchEventListEx(page){
        let request = {};
        request.beginTs = this.seachInfo.beginTs;
        request.endTs = this.seachInfo.endTs;
        let filter = {};
        filter.page = page;
        filter.size = 100;
        request.filter = filter;
        let clause = {};
        if (this.seachInfo.status.length > 0){
            clause.status = this.seachInfo.status;
        }
        if (this.seachInfo.storeId.length > 0){
            clause.storeId = this.seachInfo.storeId;
        }
        if (this.seachInfo.eventType.length > 0){
            clause.eventType = this.seachInfo.eventType;
        }
        request.clause = clause;
        let order = {};
        if (this.seachInfo.sortDesc){
            order.direction = 'desc';
        }
        else {
            order.direction = 'asc';
        }
        order.property = 'ts';
        request.order = order;
        HttpUtil.post('lps/event/list',request)
            .then(result => {
                this.currentPage  = page;
                this.setState({onEndReached:false});
                let content = result.data.content;
                let data = [];
                content.forEach((item,index)=>{
                    let add = {};
                    add.id = item.id;
                    add.ts = item.ts;
                    add.transactionId = item.transactionId;
                    add.storeName = item.storeName;
                    add.status = item.status;
                    add.deviceId = item.deviceId;
                    add.deviceName = item.deviceName;
                    add.storeId =  item.storeId;
                    add.content = item.content;
                    add.eventName = item.eventName;
                    add.eventType = item.eventType;
                    data.push(add);
                });
                let dataPush = result.data.first ? data : this.state.data.concat(data);
                this.setState({data: dataPush, lastPage:result.data.last,onPull:false,showFooter: 0});
            })
            .catch(error=>{
            })
    }

    onChangeTab(value){
        if (value === 1){
            this.fetchEventList(0);
        }
        this.setState({tabValue:value});
    }

    onFilterConfirmData(result, filterPanelInfo){
        let beginTs = moment(this.state.searchTimeBegin).valueOf();
        let endTs = moment(this.state.searchTimeEnd).valueOf();
        if (beginTs >= endTs){
            this.refs.toast.show(I18n.t('Time range error'), DURATION.LENGTH_SHORT);
            return;
        }

        this.setState({filterPanelInfoData:filterPanelInfo});
        let eventType = [];
        let payment = '';
        filterPanelInfo.forEach((item,index)=>{
            if(item.category_id == 1){
                item.items.forEach((itemChild,indexChild)=>{
                        if (itemChild.selected == true){
                            eventType.push(itemChild.label_id);
                        }
                    }
                )
            }
            else if (item.category_id == 2){
                item.items.forEach((itemChild,indexChild)=>{
                        if (itemChild.selected == true){
                            payment = itemChild.label_name;
                        }
                    }
                )
            }
        });
        if (eventType.length == 1){
            eventType = eventType[0];
        }
        let data = {};
        data.beginTs = beginTs;
        data.endTs =  endTs;
        data.eventType = eventType;
        data.payment = payment;
        data.searchContent = this.state.searchContent.trim();
        Actions.push('dataList',{data:data});
    }

    onFilterClearData(){
        this.setState({searchTimeBegin:new Date(new Date().toLocaleDateString()),
            searchTimeEnd:new Date(new Date(new Date().toLocaleDateString()).getTime()+24*60*60*1000-1),
            searchContent:''
        })
    }

    onRefresh(){
        if(!this.state.isRefresh){
            this.fetchEventList(0);
        }
    }

    onEndReached(){
        if (this.state.lastPage) {
            this.scrollFlag ? this.setState({showFooter: 1})
            : this.setState({showFooter: 0});
        }
        else if (!this.state.onEndReached ) {
            this.setState({onEndReached:true,showFooter: 2});
            this.fetchEventList(this.currentPage+1);
        }
    }

    onPressItem(item,index){
        if(this.modalCascader!= null) {
            this.modalCascader.close();
        }
        if(this.modalFilter!= null){
            this.modalFilter.close();
        }

        if (!AccessHelper.enableStoreMonitor() || !AccessHelper.enableVideoLicense()){
            ToastEx.show(I18n.t('Video license'), ToastEx.LONG);
            return;
        }

        const storeIndex = this.state.stores.findIndex(p => p.storeId === item.storeId);
        if(storeIndex === -1){
            ToastEx.show(I18n.t('Get store error'), ToastEx.LONG);
            return;
        }

        Actions.push('affairDetail',
            {
                data:item,
                bAlarm:true,
                appKey:this.state.stores[storeIndex].ezvizAppKey
            });
    }

    renderItem(item,index) {
        let timeStr = TimeUtil.getTime(item.ts);
        let status = item.status;
        let statusStr = I18n.t('Pending');
        let color = '#fcba3f';
        if (status === 1){
            color = '#434c5e';
            statusStr = I18n.t('Done');
        }
        else if (status === 2){
            color = '#6097f4';
            statusStr = I18n.t('Closed');
        }
        else if (status === 3){
            statusStr = I18n.t('Reject');
        }

        let accountNo = I18n.t('Transaction id') + item.transactionId;
        return (
            <TouchableOpacity onPress={() => this.onPressItem(item,index)}>
                <View style={{flex: 1}} >
                    <View style={{marginLeft:12,width:48, height: 20,backgroundColor: color, borderRadius:2}}>
                        <Text style={{color: '#ffffff', fontSize:12, textAlignVertical: 'center',textAlign: 'center',lineHeight: 20}}>{statusStr}</Text>
                    </View>
                    <View style={{flexDirection:'row',marginLeft:12,marginTop: 10,marginRight: 12,marginBottom: 10,alignItems:'center'}}>
                        <Image source={require('../assets/images/event_system_pic.png')} style={{width:25,height:25}}/>
                        <View style={{marginLeft:15,flex:1}}>
                            <Text ellipsizeMode={'tail'} numberOfLines={1} style={{color: '#19293b', fontSize:14, textAlignVertical: 'center',textAlign: 'left'}}>{accountNo}</Text>
                            <View style={{flexDirection:'row'}} >
                                <Text style={{color: '#19293b', fontSize:12, textAlignVertical: 'center',textAlign: 'left', marginTop:2}}>{item.storeName}</Text>
                                <Text style={{color: '#19293b', fontSize:12, textAlignVertical: 'center',textAlign: 'left', marginTop:2,marginLeft:8}}>{item.deviceName}</Text>
                            </View>
                            <Text style={{color: '#989ba3', fontSize:12, textAlignVertical: 'center',textAlign: 'left', marginTop:4}}>{timeStr}</Text>
                        </View>
                        <View style = {{backgroundColor : '#fee8ef',padding :5,borderRadius :3,marginTop:-30}}>
                            <Text ellipsizeMode={'tail'} numberOfLines={1} style={{color: '#f31d65', fontSize:12}}>{item.eventName}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    renderFooter(){
        if (this.state.showFooter === 1) {
            return (
                <View style={{height:40,alignItems:'center',justifyContent:'center',flexDirection:'row'}}>
                    <View style={{width:50,height:1,backgroundColor:'#dcdcdc'}}></View>
                    <Text style={{color:'#989ba3',fontSize:10,marginLeft:10}}>
                        {I18n.t('No further')}
                    </Text>
                    <View style={{width:50,height:1,backgroundColor:'#dcdcdc',marginLeft:10}}></View>
                </View>
            );
        } else if(this.state.showFooter === 2) {
            return (
                <View style={styles.footer}>
                    <ActivityIndicator color={'#989ba3'}/>
                    <Text style={{fontSize:10,color:'#989ba3'}}>{I18n.t('Loading data')}</Text>
                </View>
            );
        } else if(this.state.showFooter === 0){
            return null;
        }
    }

    onConfirmClick(){
        DeviceEventEmitter.emit('OnFilterConfirm');
    }

    onGoSearchClick(){
        let data = {};
        data.filter = this.state.filterPanelInfo;
        data.lastStore = this.lastStore;
        data.beginTs = this.seachInfo.beginTs;
        data.endTs = this.seachInfo.endTs;
        data.title = I18n.t('Suspicious transaction');
        Actions.push('searchFilter',{data:data})
    }

    onScrollBegin(){
        this.scrollFlag = true;
    }

    render() {
        let tabContent = null;
        if (this.state.tabValue == 1){ tabContent =(
            <View style={{flex:1}}>
                    <FlatList data={this.state.data} keyExtractor={(item, index) => index.toString()} extraData={this.state}
                              style={{marginBottom:10}}
                              renderItem={({item,index}) => this.renderItem(item,index)}
                              onEndReached={() => this.onEndReached()}
                              onEndReachedThreshold={0.1}
                              onRefresh={() => this.onRefresh()}
                              refreshing={this.state.isRefresh}
                              showsVerticalScrollIndicator={false}
                              onMomentumScrollBegin={()=> this.onScrollBegin()}
                              ItemSeparatorComponent={() => <View style={{
                                  height: 1,
                                  width: width - 24,
                                  marginLeft: 12,
                                  backgroundColor: '#dcdcdc'
                              }}/>}
                              ListFooterComponent={()=>this.renderFooter()}
                              ListEmptyComponent={() => <View
                                  style={{
                                      width: '100%',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                  }}>
                                  {
                                      this.state.onPull ? null : <View>
                                          <View style={styles.imagePanel}>
                                              <Image style={styles.imageIcon} source={require('../assets/images/img_inspect_report.png')}></Image>
                                          </View>
                                          <Text style={styles.imageTip}>{I18n.t('No events')}</Text>
                                      </View>
                                  }
                              </View>}
                    />
                </View>
        )
        }
        else {
            tabContent = (
                <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{marginLeft:12,marginRight:12,marginBottom:10,marginTop:10}}>
                    <View style={{flexDirection: 'row',alignItems:'center',justifyContent:'center'}}>
                        <Image source={require('../assets/images/search_icon.png')} style={{height:20,width:20}}/>
                        <TextInput style={{width:width-80,marginLeft:10,height:40,textAlignVertical:'center'}} numberOfLines={1} placeholder={I18n.t('Keyword')}
                                   value={this.state.searchContent} onChangeText={(text)=> this.setState({searchContent:StringFilter.standard(text,50)})} />
                    </View>
                    <View style={{height:1,backgroundColor:'#dcdcdc'}}/>
                    <View style={{flexDirection: 'row',marginTop:10,alignItems:'center'}}>
                        <Text style={{width:70}}>{I18n.t('Start time')}</Text>
                        <View style={{marginLeft:20,flex:1}}>
                            <TouchableWithoutFeedback onPress={()=>{this.refs.beginPicker.open(this.state.searchTimeBegin)}}>
                                <View style={{flex:1,flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingLeft:12,paddingRight:5}}>
                                    <Text style={{textAlignVertical:'center',fontSize:15}}>
                                        {moment(this.state.searchTimeBegin).format("YYYY-MM-DD HH:mm")}
                                    </Text>
                                    <Image style={{width:32,height:32}} source={require('../assets/images/Calendar2.png')}/>
                                </View>
                            </TouchableWithoutFeedback>
                            <View style={{height:1,backgroundColor:'#dcdcdc',marginTop:4}}/>
                        </View>
                    </View>
                    <View style={{flexDirection: 'row',marginTop:10,alignItems:'center'}}>
                        <Text style={{width:70}}>{I18n.t('End time')}</Text>
                        <View style={{marginLeft:20,flex:1}}>
                            <TouchableWithoutFeedback onPress={()=>{this.refs.endPicker.open(this.state.searchTimeEnd)}}>
                                <View style={{flex:1,flexDirection:'row',justifyContent:'space-between', alignItems:'center',paddingLeft:12,paddingRight:5}}>
                                    <Text style={{textAlignVertical:'center',fontSize:15}}>
                                        {moment(this.state.searchTimeEnd).format("YYYY-MM-DD HH:mm")}
                                    </Text>
                                    <Image style={{width:32,height:32}} source={require('../assets/images/Calendar2.png')}/>
                                </View>
                            </TouchableWithoutFeedback>
                            <View style={{height:1,backgroundColor:'#dcdcdc',marginTop:4}}/>
                        </View>
                    </View>
                    <View style={{marginTop:10,marginLeft:0}}>
                        <FilterPanel filterPanelInfo={this.state.filterPanelInfoData}
                                     panelMaxHeight={height*2}
                                     activeExpand={true}
                                     hasConfirmBtns={false}
                                     selectedTextStyle={{ color: 'white'}} selectedBlockStyle={{ backgroundColor: ColorStyles.COLOR_MAIN_RED, borderColor:ColorStyles.COLOR_MAIN_RED}}
                                     onConfirm={(result, filterPanelInfo) => this.onFilterConfirmData(result, filterPanelInfo)}
                                     onClear={()=>this.onFilterClearData()}
                        />
                    </View>
                </View>
                </ScrollView>
            )
        }

        let NavBar = null;
        if (this.state.tabValue !== 1){ NavBar = (
            <NavBarPanel title={I18n.t('Transaction monitoring')} confirmText={I18n.t('Confirm search')} onConfirm={this.onConfirmClick.bind(this)} onCancel={this.onCancel.bind(this)}/>
        )
        }
        else { NavBar = (
            <NavBarPanel title={I18n.t('Transaction monitoring')} confirmText={''} onCancel={this.onCancel.bind(this)} confirmText={I18n.t('Filter')} onConfirm={this.onGoSearchClick.bind(this)} />
        )
        }

        return (
            <View style={styles.container}>
                {NavBar}
                <View style={styles.TabBarPanel}>
                    <Tab value={this.state.tabValue} options={this.state.title} showCount={false}
                         onChange={(value) => this.onChangeTab(value)}/>
                </View>
                <View style={styles.tabLinePanel}>
                    <View style={this.state.tabValue === 1 ? styles.tabSelected : styles.tabNormal}></View>
                    <View style={this.state.tabValue === 2 ? styles.tabSelected : styles.tabNormal}></View>
                </View>
                {tabContent}
                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}} position='bottom' positionValue={150}/>
                <TimePicker
                    ref={"beginPicker"}
                    mode={true}
                    initDate={this.state.searchTimeBegin}
                    onSelected={(date)=>this.setState({searchTimeBegin:date})}
                />
                <TimePicker
                    ref={"endPicker"}
                    mode={true}
                    initDate={this.state.searchTimeEnd}
                    onSelected={(date)=>this.setState({searchTimeEnd:date})}
                />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: '#ffffff'
    },
    NavBarPanel:{
        flexDirection:'row',
        height: 48,
        backgroundColor: '#24293d',
    },
    NavBarTitle: {
        height: 48,
        width: width/3
    },
    NavBarText:{
        fontSize: 18,
        height: 48,
        color: '#ffffff',
        textAlign:'center',
        textAlignVertical:'center',
        ...Platform.select({
            ios:{
                lineHeight: 48
            }
        })
    },
    NavBarTextSmall:{
        fontSize: 15,
        height: 48,
        color: '#ffffff',
        textAlign:'center',
        textAlignVertical:'center',
        marginRight:12,
        ...Platform.select({
            ios:{
                lineHeight: 48
            }
        })
    },
    TabBarPanel:{
        height: lib.isAndroid() ? 30 : 38,
    },
    FilterBarPanel:{
        backgroundColor: '#eff2f5',
        textAlignVertical:'center',
        flexDirection: 'row',
        height:40
    },
    FilterTextLeft: {
        marginLeft:10,
        height: 38,
        textAlignVertical:'center',
        lineHeight: 38,
        color: '#989ba3',
    },
    FilterText:{
        height: 38,
        textAlignVertical:'center',
        lineHeight: 38,
        color: '#989ba3',
    },
    FilterLine:{
        height: 38,
        textAlignVertical:'center',
        lineHeight: 38,
        color: '#dcdcdc',
    },
    tabLinePanel:{
        flexDirection:'row',
        justifyContent:'space-between',
        marginTop: lib.isAndroid() ? 10 : 0
    },
    tabSelected:{
        width:width/2,
        height:2,
        backgroundColor:ColorStyles.COLOR_MAIN_RED
    },
    tabNormal:{
        width:width/2,
        height:1,
        backgroundColor:'#cbcbcb'
    },
    searchSubject:{
        fontSize: 14,
        color: '#232324',
    },
    footer:{
        flexDirection:'row',
        height:24,
        justifyContent:'center',
        alignItems:'center',
        marginBottom:10,
    },
    imagePanel:{
        height: 140,
        backgroundColor: '#ffffff',
        alignItems: 'center'
    },
    imageIcon: {
        width: 100,
        height: 100,
        marginTop: 40
    },
    imageTip: {
        fontSize: 18,
        color: '#d5dbe4',
        textAlign: 'center'
    }
});
