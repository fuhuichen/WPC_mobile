import React, { Component } from 'react';
import {
    DeviceEventEmitter,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import { Actions } from 'react-native-router-flux';
import RNStatusBar from "../components/RNStatusBar";
import HttpUtil from "../utils/HttpUtil";
import TimeUtil from "../utils/TimeUtil";
import {DURATION} from "react-native-easy-toast";
import Toast from "react-native-easy-toast";
import I18n from 'react-native-i18n';
import AccessHelper from "../common/AccessHelper";
import ToastEx from "react-native-simple-toast";
import NetInfoIndicator from "../components/NetInfoIndicator";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');


export default class DataList extends Component {

    constructor(props) {
        super(props);
        this.state = {
            lastPage: true,
            onEndReached:false,
            isRefresh:false,
            onPull:false,
            showFooter: 0,
            lastSeachInfo:{},
            data: [],
            stores:[]
        };
    }

    componentDidMount() {
        this.fetchEventList(0,this.props.data.beginTs,this.props.data.endTs,
            this.props.data.eventType,this.props.data.payment,this.props.data.searchContent);
    }

    fetchEventList(page,beginTs,endTs,eventType,payment,searchContent){
        this.fetchStores();

        if (page == 0){
            this.setState({lastPage:true,data:[], lastSeachInfo:null,onPull:true,showFooter: 0});
        }

        let request = {};
        request.beginTs = beginTs;
        request.endTs = endTs;
        let filter = {};
        filter.page = page;
        filter.size = 50;
        request.filter = filter;
        let clause = {};
        if (eventType.length != 0){
            clause.eventType = eventType;
        }
        if (payment != ''){
            clause['content.paymentDetail'] = payment;
        }
        request.clause = clause;
        let like = {};
        if (searchContent != ''){
            like.transactionId = searchContent;
            like.storeName = searchContent;
            like.deviceName = searchContent;
            like['content.orderDetail'] = searchContent;
        }
        request.like = like;
        let order = {};
        order.direction = 'desc';
        order.property = 'ts';
        request.order = order;
        HttpUtil.post('lps/data/list',request)
            .then(result => {
                let  lastSeachInfo = {};
                lastSeachInfo.page = page;
                lastSeachInfo.beginTs = beginTs;
                lastSeachInfo.endTs = endTs;
                lastSeachInfo.eventType = eventType;
                lastSeachInfo.payment = payment;
                lastSeachInfo.searchContent = searchContent;
                this.setState({lastSeachInfo:lastSeachInfo,onEndReached:false});

                let content = result.data.content;
                let data = [];
                content.forEach((item,index)=>{
                    let add = {};
                    add.id = item.id;
                    add.ts = item.ts;
                    add.transactionId = item.transactionId;
                    add.storeName = item.storeName;
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

    fetchStores(){
        try {
            let request = {filter:{page:0,size:1000}};
            HttpUtil.post('store/list',request)
                .then(result => {
                    this.setState({stores:result.data.content});
                })
                .catch(error=>{
                })
        }catch (e) {
        }
    }

    onRefresh(){
        if(!this.state.isRefresh){
            if (this.state.lastSeachInfo != null){
                this.fetchEventList(0,
                    this.state.lastSeachInfo.beginTs,
                    this.state.lastSeachInfo.endTs,
                    this.state.lastSeachInfo.eventType,
                    this.state.lastSeachInfo.payment,
                    this.state.lastSeachInfo.searchContent);
            }
            else {
                this.fetchEventList(0,this.props.data.beginTs,this.props.data.endTs,
                    this.props.data.eventType,this.props.data.payment,this.props.data.searchContent);
            }
        }
    }

    onEndReached(){
        if (this.state.lastPage) {
            this.setState({showFooter: 1});
        }
        else if (!this.state.onEndReached && this.state.lastSeachInfo != null) {
            this.setState({onEndReached:true,showFooter: 2});
            this.fetchEventList(this.state.lastSeachInfo.page+1, this.state.lastSeachInfo.beginTs,
                this.state.lastSeachInfo.endTs, this.state.lastSeachInfo.eventType,
                this.state.lastSeachInfo.payment,this.state.lastSeachInfo.searchContent);
        }
    }

    onPressItem(item,index){
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
                data: item,
                bAlarm: false,
                appKey:this.state.stores[storeIndex].ezvizAppKey
            });
    }

    renderItem(item,index) {
        let timeStr = TimeUtil.getTime(item.ts);
        let accountNo = I18n.t('Transaction id') + item.transactionId;
        return (
            <TouchableOpacity onPress={() => this.onPressItem(item,index)}>
                <View style={{flexDirection:'row',marginLeft:12,marginTop: 10,marginRight: 12,marginBottom: 10,alignItems:'center'}}>
                    <Image source={require('../assets/images/event_system_pic.png')} style={{width:25,height:25}}/>
                    <View style={{marginLeft:15,flex:1}}>
                        <View style={{flexDirection:'row'}}>
                            <Text ellipsizeMode={'tail'} numberOfLines={1} style={{color: '#19293b', fontSize:14, textAlignVertical: 'center',textAlign: 'left'}}>{accountNo}</Text>
                        </View>
                        <View style={{flexDirection:'row'}} >
                            <Text style={{color: '#19293b', fontSize:12, textAlignVertical: 'center',textAlign: 'left', marginTop:2}}>{item.storeName}</Text>
                            <Text style={{color: '#19293b', fontSize:12, textAlignVertical: 'center',textAlign: 'left', marginTop:2,marginLeft:8}}>{item.deviceName}</Text>
                        </View>
                        <Text style={{color: '#989ba3', fontSize:12, textAlignVertical: 'center',textAlign: 'left', marginTop:4}}>{timeStr}</Text>
                    </View>
                    <View style = {{backgroundColor : '#f6f8fa',padding :5,borderRadius :3,marginTop:-30}}>
                        <Text ellipsizeMode={'tail'} numberOfLines={1} style={{color: '#989ba3', fontSize:12}}>{item.eventName}</Text>
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

    render() {
        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={Actions.pop}>
                        <View style={{width:width/3,height:48}}>
                            <Image source={require('../assets/images/titlebar_back_icon_normal.png')} style={styles.NavBarImage}/>
                        </View>
                    </TouchableOpacity>
                    <View style={{width:width/3,height:48,alignItems: 'center'}}>
                        <Text style={[styles.NavBarTitle,{fontSize:18}]}>{I18n.t('Transactions')}</Text>
                    </View>
                    <View style={{width:width/3,height:48,flexDirection: 'row',justifyContent:'flex-end'}}>
                    </View>
                </View>
                <NetInfoIndicator/>
                <View style={{flex: 1}}>
                    <FlatList data={this.state.data} keyExtractor={(item, index) => index.toString()} extraData={this.state}
                              renderItem={({item,index}) => this.renderItem(item,index)}
                              onEndReached={() => this.onEndReached()}
                              onEndReachedThreshold={0.1}
                              onRefresh={() => this.onRefresh()}
                              refreshing={this.state.isRefresh}
                              showsVerticalScrollIndicator={false}
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
                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}} position='bottom' positionValue={150}/>
            </View>
        );
    }

}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent:'center',
    },
    NavBarPanel:{
        flexDirection: 'row',
        height: 48,
        backgroundColor: '#24293d',
    },
    NavBarImage: {
        width: 48,
        height: 48
    },
    NavBarTitle: {
        fontSize: 18,
        height: 48,
        color: '#ffffff',
        textAlignVertical:'center',
        lineHeight: 48
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
