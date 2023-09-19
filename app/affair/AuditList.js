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
import I18n from 'react-native-i18n';
import StoreUtil from "../utils/StoreUtil";
import {DURATION} from "react-native-easy-toast";
import Toast from "react-native-easy-toast";
import AccessHelper from "../common/AccessHelper";
import ToastEx from "react-native-simple-toast";
let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class AuditList extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: [],
            showTip:true,
            lastPage: true,
            isRefresh:false,
            onEndReached:false,
            onPull:false,
            showFooter: 0,
            lastSeachInfo:{},
            stores: []
        };
        this.messageList = [];
        this.readCount = 0;
    }

    componentDidMount() {
        this.getStore();
    }

    componentWillUnmount(){
        if (this.readCount > 0){
            let data = {};
            data.type = 2;
            data.count = this.readCount;
            DeviceEventEmitter.emit('onAffairRead',data);
        }
    }

    getStore(){
        let message = StoreUtil.getType(2);
        if (message.length > 0){
            let eventId = [];
            message.forEach((item,index)=>{
                eventId.push(item.eventId);
            });
            this.messageList = message;
            if (eventId.length > 0){
                this.fetchEventList(0,eventId);
            }
        }
    }

    fetchEventList(page,eventId){
        this.fetchStores();

        if (page === 0){
            this.setState({lastPage:true,data:[], lastSeachInfo:null,onPull:true,showFooter: 0});
        }
        let request = {};
        request.beginTs = new Date().getTime() - 86400*7*1000;
        request.endTs = new Date().getTime();
        let filter = {};
        filter.page = page;
        filter.size = 50;
        request.filter = filter;
        let clause = {};
        clause.id = eventId;
        clause.status = 0;
        request.clause = clause;
        let order = {};
        order.direction = 'desc';
        order.property = 'ts';
        request.order = order;
        HttpUtil.post('lps/event/list',request)
            .then(result => {
                let  lastSeachInfo = {};
                lastSeachInfo.page = page;
                lastSeachInfo.eventId = eventId;
                this.setState({lastSeachInfo:lastSeachInfo});
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
                    let message =  this.messageList.find(element => element.eventId === item.id);
                    if (message != null){
                        add.messageId = message.messageId;
                        add.read = message.read;
                        add.accountId = message.accountId;
                    }
                    data.push(add);
                });
                let dataPush = result.data.first ? data : this.state.data.concat(data);
                this.setState({data: dataPush, lastPage:result.data.last,onPull:false,showFooter: 0});
            })
            .catch(error=>{
            })
    }

    onRefresh(){
        if(!this.state.isRefresh){
            if (this.state.lastSeachInfo != null && this.state.lastSeachInfo.eventId != null){
                this.fetchEventList(0, this.state.lastSeachInfo.eventId);
            }
        }
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

    onEndReached(){
        if (this.state.lastPage) {
            this.setState({showFooter: 1});
        }
        else if (!this.state.onEndReached && this.state.lastSeachInfo != null) {
            this.setState({onEndReached:true,showFooter: 2});
            this.fetchEventList(this.state.lastSeachInfo.page+1, this.state.lastSeachInfo.eventId);
        }
    }

    onPressItem(item,index){
        if (!AccessHelper.enableStoreMonitor() || !AccessHelper.enableVideoLicense()){
            ToastEx.show(I18n.t('Video license'), ToastEx.LONG);
            return;
        }

        if (item.read == false){
            let messages = [];
            let message = {};
            message.messageId = item.messageId;
            message.messageType = 2;
            message.eventId = item.id;
            message.ts = item.ts;
            message.read = true;
            message.accountId = item.accountId;
            messages.push(message);
            StoreUtil.save(messages);
            this.readCount++;
            let data = this.state.data;
            data[index].read = true;
            this.setState({data:data});
        }

        const storeIndex = this.state.stores.findIndex(p => p.storeId === item.storeId);
        if(storeIndex === -1){
            ToastEx.show(I18n.t('Get store error'), ToastEx.LONG);
            return;
        }

        Actions.push('affairDetail',
            {
                data: item,
                bAlarm: true,
                appKey:this.state.stores[storeIndex].ezvizAppKey
            });
    }

    renderItem(item,index) {
        let timeStr = TimeUtil.getTime(item.ts);
        let accountNo = I18n.t('Transaction id') + item.transactionId;
        let itemFlag = null;
        if (item.read == false) { itemFlag = (
            <View style={{backgroundColor:'#f76260',borderRadius:8,width:10,height:10,marginLeft:5}}/>
        )
        }

        return (
            <TouchableOpacity onPress={() => this.onPressItem(item,index)}>
                <View style={{flexDirection:'row',marginLeft:12,marginTop: 10,marginRight: 12,marginBottom: 10,alignItems:'center'}}>
                    <Image source={require('../assets/images/event_system_pic.png')} style={{width:25,height:25}}/>
                    <View style={{marginLeft:15,flex:1}}>
                        <View style={{flexDirection:'row'}}>
                            <Text ellipsizeMode={'tail'} numberOfLines={1} style={{color: '#19293b', fontSize:14, textAlignVertical: 'center',textAlign: 'left',width:210}}>{accountNo}</Text>
                            {itemFlag}
                        </View>
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
        let tip = null;
        if (this.state.showTip){ tip =(
            <View style={{flexDirection:'row',backgroundColor:'#f1f6fe',height:50,alignItems:'center',justifyContent:'flex-start'}}>
                <View style={{marginLeft:12,marginTop: 10,marginRight: 12,marginBottom: 10,flexDirection:'row',alignItems:'center',justifyContent:'flex-start'}} >
                    <Image source={require('../assets/images/message_pic.png')} style={{width:18,height:18}}/>
                    <TouchableOpacity onPress={()=> Actions.push('affairSearch')}>
                        <View style={{marginLeft:10}}>
                            <Text numberOfLines={2} style = {{fontSize:12,color:'#6097f4',fontWeight: 'bold',width:width-72}}>{I18n.t('Empty Sunday')}</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{marginLeft:5}}>
                        <TouchableOpacity onPress={() => this.setState({showTip:false})}>
                            <Image source={require('../assets/images/affair_close.png')} style={{width:10,height:10}}/>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
        }
        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={Actions.pop}>
                        <View style={{width:60,height:48}}>
                            <Image source={require('../assets/images/titlebar_back_icon_normal.png')} style={styles.NavBarImage}/>
                        </View>
                    </TouchableOpacity>
                    <View style={{width:width-120,height:48,alignItems: 'center'}}>
                        <Text style={[styles.NavBarTitle,{fontSize:18}]}>{I18n.t('To approved')}</Text>
                    </View>
                    <View style={{width:60,height:48,alignItems: 'center'}}>
                    </View>
                </View>
                {tip}
                <View style={{flex: 1}}>
                    <FlatList data={this.state.data} keyExtractor={(item, index) => index.toString()} extraData={this.state}
                              renderItem={({item,index}) => this.renderItem(item,index)}
                              showsVerticalScrollIndicator={false}
                              onEndReached={() => this.onEndReached()}
                              onEndReachedThreshold={0.1}
                              onRefresh={() => this.onRefresh()}
                              refreshing={this.state.isRefresh}
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
                                              <Image style={styles.imageIcon} source={require('../assets/images/img_audit_null.png')}></Image>
                                          </View>
                                          <Text style={styles.imageTip}>{I18n.t('No approved')}</Text>
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
