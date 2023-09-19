import React, {Component} from 'react';
import {
    BackHandler,
    DeviceEventEmitter,
    Dimensions,
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {Actions} from "react-native-router-flux";
import RNStatusBar from '../components/RNStatusBar';
import I18n from 'react-native-i18n';
import TimeUtil from "../utils/TimeUtil";
import StoreUtil from "../utils/StoreUtil";
import {inject, observer} from "mobx-react";
import {SwipeRow} from "react-native-swipe-list-view";
import ModalCenter from "../components/ModalCenter";
import RouteMgr from "../notification/RouteMgr";
import AccountUtil from "../utils/AccountUtil";
import Toast from "react-native-easy-toast";
//import JMessage from "../notification/JMessage";
import PatrolPrompt from "../components/inspect/PatrolPrompt";
import PatrolStorage from "../components/inspect/PatrolStorage";
import PatrolParser from "../components/inspect/PatrolParser";

let {width} =  Dimensions.get('screen');

@inject('store')
@observer
export default class MessageList extends Component {
    constructor(props){
        super(props);
        this.state = {
            data: [],
            showTip:true,
            isRefresh:false,
            item: null
        };
        this.rowRef = [];

        this.assets = [
            {type: 3, source: require('../assets/images/news_check_pic.png')},
            {type: 5, source: require('../assets/images/news_event_pic.png')},
            {type: 6, source: require('../assets/images/news_visitor_pic.png')},
            {type: 8, source: require('../assets/images/news_report_pic.png')}
        ];
    }

    componentDidMount(){
        RouteMgr.setPopbackScreen(true);
        RouteMgr.setActive(true,false);
        this.freshEmitter = DeviceEventEmitter.addListener('onMessageList', this.onAddMessage.bind(this));
        this.backEmitter = DeviceEventEmitter.addListener('onMessageListBack', async () => {
            await this.backClick();
        });
        this.reloadData();
    }

    onAddMessage(flag){
        this.reloadData();
    }

    reloadData(){
        let message = StoreUtil.filterAndGetAll();
        let data = [];
        message.forEach((item,index)=>{
            data.push(item);
        });
        this.setState({
            data: [],
        },()=>{
            this.setState({data:data});
        });
    }

    onDeleteItem(item,index){
        try {
            this.rowRef[index].closeRow();
            let newData = this.state.data;
            newData.splice(index, 1);
            this.setState({data: newData});
            //StoreUtil.deleteMessage(item.messageId);
            //JMessage.clearNotification();
        }
        catch (e) {}
    }

    deleteAll(){
        try {
            this.refs.closeAllNotice.close();
            this.setState({data: []});
            //StoreUtil.deleteAll();
            //JMessage.clearNotification();
        }
        catch (e) {}
    }

    async onPressItem(item,index){
        if(await AccountUtil.changeAccount(item.accountId,true,false)){
            if (item.messageType === 3 && PatrolParser.isExist()) {
                this.setState({item},()=>{
                   this.refs.prompt.open();
                });
            }else{
                RouteMgr.pushRouter(item);
            }
        }else{
            this.refs.toast.show(I18n.t('Switch brand error'), 3000);
        }
        this.onDeleteItem(item,index);
    }

    async backClick(){
        if(await AccountUtil.changeAccount(AccountUtil.getOriginalId(),true,false)){
            if (this.state.data.length === 0){
                DeviceEventEmitter.emit('onMessageList',false);
            }
            RouteMgr.resetParam();
            this.freshEmitter && this.freshEmitter.remove();
            this.backEmitter && this.backEmitter.remove();
        }else{
            this.refs.toast.show(I18n.t('Switch brand error'), 3000);
        }
    }

    onConfirm(category){
        Actions.push((category === 1) ? 'localCheck' : 'remoteCheck',{data:{name:''}});
    }

    onCancel(){
        PatrolStorage.delete();
        RouteMgr.pushRouter(this.state.item);
    }

    onRowOpen(item,index){
        try {
            for(let i=0;i <= this.state.data.length-1;i++){
                if( i !== index){
                    this.rowRef[i].closeRow();
                }
            }
        }
        catch (e) {}
    }

    renderItem(item,index) {
        let accountList = this.props.store.userSelector.accountList;
        let accountName = '';
        let findItem = accountList.find(p => p.accountId === item.accountId);
        if (findItem != null){
            accountName = '[' + findItem.name + ']';
        }
        let timeStr = TimeUtil.getTime(item.ts);
        let eventSource = null;
        let assetKey = this.assets.findIndex(p => p.type === item.messageType);
        (assetKey !== -1) ? (eventSource = this.assets[assetKey].source): null;

        let content = JSON.parse(item.content);
        let storeName = content[0].storeName;
        if (content.length > 1 ){
            storeName += '...';
        }
        let splitLine = null;
        if (this.state.data.length > 0 && index === this.state.data.length -1 ) {
            splitLine = (
                <View style={{height: 1, width: width, backgroundColor: '#dcdcdc'}}/>
            )
        }

        return (
            <View>
                <SwipeRow rightOpenValue={-60} disableRightSwipe={true} stopRightSwipe={-60}  ref={ref => {this.rowRef[index] = ref;}} onRowOpen={()=>this.onRowOpen(item,index)} style={{flex:1,backgroundColor: 'white'}}>
                    <View style={{alignItems: 'center', backgroundColor: '#fd4747', flexDirection: 'row', flex:1, justifyContent: 'flex-end', fontSize:14,padding: 15}}>
                        <TouchableOpacity onPress={() => this.onDeleteItem(item,index)}>
                            <Text style={{color: 'white'}}>{I18n.t('Delete')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{backgroundColor: 'white'}}>
                        <TouchableOpacity onPress={() => this.onPressItem(item,index)}>
                            <View style={{flexDirection:'row',marginTop:10,marginLeft:12,marginBottom:10}}>
                                <Image  style={{width:25,height:25,marginTop:3}} source={eventSource}/>
                                <View style={{marginLeft:12,width:width-65}}>
                                    <View style={{flexDirection:'row'}}>
                                        <Text ellipsizeMode={'tail'} numberOfLines={1} style={{color: '#19293b', fontSize:14, textAlignVertical: 'center',textAlign: 'left'}}>{accountName}</Text>
                                        <Text ellipsizeMode={'tail'} numberOfLines={1} style={{color: '#19293b', fontSize:14, textAlignVertical: 'center',textAlign: 'left',marginLeft:5}}>{storeName}</Text>
                                    </View>
                                    <Text numberOfLines={2} style={{color: '#19293b', fontSize:12, textAlignVertical: 'center',textAlign: 'left', marginTop:2}}>{item.subject}</Text>
                                    <Text style={{color: '#989ba3', fontSize:12, textAlignVertical: 'center',textAlign: 'left', marginTop:4}}>{timeStr}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </SwipeRow>
                {splitLine}
            </View>
        );
    }

    render() {
        let tip = null;
        let sortMessage = this.state.data.length >1 ? this.state.data.sort((a, b) => b.ts - a.ts): this.state.data;
        let icon = require('../assets/images/img_navbar_close.png');
        if (this.props.back === true){
            icon = require('../assets/images/titlebar_back_icon_normal.png');
        }
        if (this.state.showTip && this.state.data.length > 0){ tip =(
            <View style={{flexDirection:'row',backgroundColor:'#f1f6fe',height:50,alignItems:'center',justifyContent:'flex-start',
                           marginTop:20,marginLeft:16,marginRight:16,borderWidth:1,borderColor:'#a0c1f8'}}>
                <View style={{marginLeft:12,marginTop: 10,marginRight: 12,marginBottom: 10,flexDirection:'row',alignItems:'center',justifyContent:'flex-start'}} >
                    <Image source={require('../assets/images/message_pic.png')} style={{width:18,height:18}}/>
                    <View style={{marginLeft:10,flexDirection:'row'}}>
                        <Text style = {{fontSize:12,color:'#6097f4'}}>{this.state.data.length}</Text>
                        <Text style = {{fontSize:12,color:'#6097f4'}}>{I18n.t('Unread messages')}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => this.setState({showTip:false})} style={{position:'absolute',top:8,right: 3}}>
                    <View style={{width:16,height:16}}>
                        <Image source={require('../assets/images/affair_close.png')} style={{width:10,height:10}}/>
                    </View>
                </TouchableOpacity>
            </View>
        )}
        let deleteAllBtn = null;
        if (this.state.data.length > 0){ deleteAllBtn = (
            <TouchableOpacity onPress={()=> this.refs.closeAllNotice.open()}>
               <Image source={require('../assets/images/titlebar_clear_icon.png')} style={{width:48,height:48}}/>
            </TouchableOpacity>
        )
        }
        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <TouchableOpacity onPress={this.backClick.bind(this)}>
                        <View style={{width:48,height:48}}>
                            <Image source={icon} style={{width:48,height:48}}/>
                        </View>
                    </TouchableOpacity>
                    <View style={{flex:1}}/>
                    <View style={{width:width/3,height:48,alignItems: 'center'}}>
                        <Text style={styles.NavBarText}>{I18n.t('Notification new')}</Text>
                    </View>
                    <View style={{flex:1}}/>
                    <View style={{width:48,height:48}}>
                        {deleteAllBtn}
                    </View>
                </View>
                {tip}
                {
                    this.state.data.length && this.state.showTip > 0 ? <View style={{
                        height: 1,
                        width: width,
                        backgroundColor: '#dcdcdc',
                        marginTop:10
                    }}/> : null
                }

                <FlatList data={sortMessage} keyExtractor={(item, index) => index.toString()} extraData={this.state}
                          renderItem={({item,index}) => this.renderItem(item,index)}
                          showsVerticalScrollIndicator={false}
                          onRefresh={this.reloadData.bind(this)}
                          refreshing={this.state.isRefresh}
                          ItemSeparatorComponent={() => <View style={{
                              height: 1,
                              width: width,
                              backgroundColor: '#dcdcdc'
                          }}/>}
                          ListEmptyComponent={() =>
                              <View style={{width: '100%', alignItems: 'center', justifyContent: 'center'}}>
                                  <View>
                                      <View style={styles.imagePanel}>
                                          <Image style={styles.imageIcon} source={require('../assets/images/img_nodata.png')}/>
                                      </View>
                                      <Text style={styles.imageTip}>{I18n.t('No data')}</Text>
                                  </View>
                              </View>
                          }
                />
                <ModalCenter ref={"closeAllNotice"} title={I18n.t('Clear all notice')} confirm={this.deleteAll.bind(this)}/>
                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
                <PatrolPrompt ref={"prompt"} confirm={(category)=>this.onConfirm(category)} cancel={()=>{this.onCancel()}}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        flex:1
    },
    NavBarPanel:{
        flexDirection:'row',
        height: 48,
        backgroundColor: '#24293d'
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
