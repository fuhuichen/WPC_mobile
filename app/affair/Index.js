import React, { Component } from 'react';
import {
    Dimensions,
    StyleSheet,
    View,
    Image,
    TouchableOpacity,
    DeviceEventEmitter, Text, Platform, FlatList,
} from 'react-native';

let {width} =  Dimensions.get('screen');
import RNStatusBar from '../components/RNStatusBar'
import {EMITTER_AFFAIR} from "../common/Constant";
import MarqueeVertical from '../components/MarqueeVertical';
import {Actions} from "react-native-router-flux";
import SoundTouch from "../components/SoundTouch";
import TimeUtil from "../utils/TimeUtil";
import I18n from 'react-native-i18n';
import HttpUtil from "../utils/HttpUtil";
import StoreUtil from "../utils/StoreUtil";
//import JMessage from "../notification/JMessage";
import moment from "moment";
import NetInfoIndicator from "../components/NetInfoIndicator";

export default class Affair extends Component {
    constructor(props){
        super(props)

        this.state = {
            floatTextList:[],
            floatHeadList:[],
            floatTailList:[],
            spotCheckNo:0,
            auditNo:0,
            routeCheckNo:0,
            outStandData:[],
            rotateBtn:false
        }
        this.outStandList = [];
        this.TextList = [];
        this.HeadList = [];
        this.TailList = [];
        this.firstEnter = true;
    }

    componentDidMount(){
        this.fetchInspects();
        this.listener = DeviceEventEmitter.addListener(EMITTER_AFFAIR,
            (param)=>{

            });
        this.freshEmitter = DeviceEventEmitter.addListener('onAffairRead', this.onRead.bind(this));
        //this.intervalTimer = setInterval(this.onReadData.bind(this), 3000);
        //StoreUtil.init();
        //let messages = StoreUtil.filterAndGetAll();
        //this.spreadMessage(messages);
    }

    componentWillUnmount(){
        this.listener.remove();
        this.freshEmitter.remove();
        //this.intervalTimer && clearInterval(this.intervalTimer);
    }

    fetchInspects(){
        try {
            let body = {};
            body.beginTs = moment().startOf('day').subtract(7,'days').unix()*1000;
            body.endTs = moment().endOf('day').add(0,'days').unix()*1000;
            body.clause = {status: [0]};
            HttpUtil.post('inspect/task/count',body)
                .then(result => {
                    this.setState({routeCheckNo: result.data.totalTasks});
                })
                .catch(error=>{
                })
        }catch (e) {
        }
    }

    onReadData(){
        /*try{
            let message = JMessage.getMessage();
            if (message.length > 0){
                //console.log('*********************** receive:  '+ JSON.stringify(message));
                let saveList = [];
                let messageId = [];
                message.forEach((item,index)=>{
                    messageId.push(item.messageId);
                    let find = StoreUtil.getMessageId(item.messageId);
                    if (find.length === 0){
                        item.read = false;
                        saveList.push(item);
                    }
                });
                if (saveList.length >0){
                    StoreUtil.save(saveList);
                    this.spreadMessage(saveList);
                }
                if (messageId.length >0){
                    let request = {};
                    request.messageIds = messageId;
                    HttpUtil.post('notify/ack',request);
                }
            }
        }
        catch (e) {
            console.log(e.message);
        }*/
    }

    onRead(data){
        if (data.type == 1){
            let spotCheckNo = this.state.spotCheckNo - data.count;
            this.setState({spotCheckNo:spotCheckNo})
        }
        else if (data.type == 2){
            let auditNo = this.state.auditNo - data.count;
            this.setState({auditNo:auditNo})
        }
        else if (data.type == 3){
            this.fetchInspects();
            //let routeCheckNo = this.state.routeCheckNo - data.count;
            //this.setState({routeCheckNo:routeCheckNo})
        }
    }

    spreadMessage(message) {
        let spotCheckNo = 0;
        let auditNo = 0;
        let routeCheckNo = 0;
        let bulletinIds = [];
        let outStandIds = [];
        message.forEach((item,index)=>{
            switch (item.messageType) {
                case 1:
                    if(item.read == false){
                        spotCheckNo++;
                    }
                    break;
                case 2:
                    if(item.read == false){
                        auditNo++;
                    }
                    break;
                case 3:
                    if(item.read == false){
                        routeCheckNo++;
                    }
                    break;
                case 4:
                    bulletinIds.push(item.eventId);
                    break;
                case 5:
                    outStandIds.push(item.eventId);
                    break;
            }
        });
        if (spotCheckNo >0 || auditNo>0 || routeCheckNo > 0){
            this.setState({
                spotCheckNo: this.state.spotCheckNo + spotCheckNo,
                auditNo:this.state.auditNo + auditNo,
                routeCheckNo:this.state.routeCheckNo + routeCheckNo
            });
        }
        if (bulletinIds.length >0){
            this.fetchBulletin(bulletinIds);
        }
        if (outStandIds.length > 0){
            this.fetchOutStandEvent(outStandIds);
        }
    }

    fetchBulletin(eventId){
        let request = {};
        request.bulletinIds = eventId;
        HttpUtil.post('bulletin/list',request)
            .then(result => {
                let content = result.data;
                content.forEach((item,index)=>{
                    this.TextList.push(item.subject);
                    this.HeadList.push(item.storeName);
                    let timeStr = TimeUtil.getFullTime(item.ts);
                    this.TailList.push(timeStr);
                });
                this.addBulletin();
            })
            .catch(error=>{
            })
    }

    fetchOutStandEvent(eventId){
        let request = {};
        request.beginTs = new Date().getTime() - 86400*7*1000;
        request.endTs = new Date().getTime();
        let filter = {};
        filter.page = 0;
        filter.size = 200;
        request.filter = filter;
        let clause = {};
        clause.id = eventId;
        request.clause = clause;
        let order = {};
        order.direction = 'desc';
        order.property = 'ts';
        request.order = order;
        HttpUtil.post('event/list',request)
            .then(result => {
                let content = result.data.content.reverse();
                content.forEach((item,index)=>{
                    let add = {};
                    add.id = item.id;
                    add.ts = item.ts;
                    add.subject = item.subject;
                    add.storeName = item.storeName;
                    add.status = item.status;
                    add.deviceId = item.deviceId;
                    add.storeId =  item.storeId;
                    add.assignerName = item.assignerName;
                    add.assigneeName = item.assigneeName;
                    add.deviceId = item.deviceId;
                    add.sourceType = item.sourceType;
                    add.score = item.score;
                    add.description = item.initialComment.description;
                    let attachment = item.initialComment.attachment;
                    if (attachment != null){
                        let itemAudio = attachment.find(element => element.mediaType === 0);
                        if (itemAudio != null){
                            add.audioPath = itemAudio.url;
                        }
                        let itemVideo = attachment.find(element => element.mediaType === 1);
                        if (itemVideo != null){
                            add.videoPath = itemVideo.url;
                        }
                        let itemImage = attachment.find(element => element.mediaType === 2);
                        if (itemImage != null){
                            add.imagePath = itemImage.url;
                        }
                    }
                    this.outStandList.unshift(add);
                });
                if (this.firstEnter == true){
                    this.firstEnter = false;
                    this.setState({rotateBtn:true})
                    this.onChangeEvent();
                }
            })
            .catch(error=>{
            })
    }

    addBulletin(){
        let floatHeadList = [];
        for (let head of this.HeadList){
            let text = head + ':';
            let addHead = (
                <View style={{flexDirection:'row',alignItems:'center',marginLeft:12}}>
                    <Image source={require('../assets/images/message_pic.png')} style={{width:18,height:18}}/>
                    <Text numberOfLines={1} style = {{fontSize:12,color:'#6097f4',marginLeft:10}}>{text}</Text>
                </View>
            )
            floatHeadList.push(addHead);
        }

        let floatTextList = [];
        for(let text of this.TextList){
            let addText = {};
            addText.label = text;
            addText.value = text;
            floatTextList.push(addText);
        }

        let floatTailList = [];
        for (let tail of this.TailList){
            let addTail = (
                <Text style = {{fontSize:12,color:'#6097f4',marginRight:12,textAlign:'right'}}>{tail}</Text>
            )
            floatTailList.push(addTail);
        }
        this.setState({floatTextList, floatTailList, floatHeadList});
    }


    onClick(tag){
        tag === 1 ? null : tag === 2 ? Actions.push('auditList') :
            Actions.push('patrolList');
    }

    onChangeEvent(){
        if (this.outStandList.length > 0){
            let outStand = [];
            for(let i=0;i<4;i++){
                let data = this.outStandList.shift();
                if (data != null){
                    if(-1 === outStand.findIndex(element => element === data)){
                        outStand.push(data);
                    }
                    this.outStandList.push(data);
                }
                else {
                    break;
                }
            }
            if (outStand.length>0){
                this.setState({outStandData:outStand});
            }
        }
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

        let desc = null;
        if (item.description){ desc = (
            <Text style={{color: '#989ba3', fontSize:12, textAlignVertical: 'center',textAlign: 'left', marginTop:5,marginBottom:5}}>{item.description}</Text>
        )
        }

        let eventSource = null;
        if (item.sourceType === 0){
            eventSource = require('../assets/images/event_monitor_pic.png')
        }
        else if (item.sourceType === 1){
            eventSource = require('../assets/images/event_telnet_pic.png')
        }
        else if (item.sourceType === 2){
            eventSource = require('../assets/images/event_site_pic.png')
        }

        return (
            <TouchableOpacity onPress={() => Actions.push('eventDetail',{data: item})}>
                <View style={{flex: 1,flexDirection:'column'}} >
                    <View style={styles.itemContainer}>
                        <View style={styles.itemLeft}>
                            <View style={{width:48, height: 20,backgroundColor: color, borderRadius:2}}>
                                <Text style={{color: '#ffffff', fontSize:12, textAlignVertical: 'center',textAlign: 'center',lineHeight: 20}}>{statusStr}</Text>
                            </View>
                            <Image  style={{width:25,height:25,marginTop:8}} source={eventSource}/>
                        </View>
                        <View style={styles.itemMiddle}>
                            <Text ellipsizeMode={'tail'} numberOfLines={1} style={{color: '#19293b', fontSize:14, textAlignVertical: 'center',textAlign: 'left',marginBottom: 3,marginTop:4}}>{item.subject}</Text>
                            <Text style={{color: '#19293b', fontSize:12, textAlignVertical: 'center',textAlign: 'left', marginTop:2}}>{item.storeName}</Text>
                            <Text style={{color: '#989ba3', fontSize:12, textAlignVertical: 'center',textAlign: 'left', marginTop:4}}>{timeStr}</Text>
                        </View>
                        <View style={styles.itemRight}>
                            <SoundTouch path={item.audioPath}/>
                        </View>
                        <Text/>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    render() {
        let float = null;
        if  (this.state.floatTextList.length > 0) { float = (
            <MarqueeVertical
                textList = {this.state.floatTextList}
                width = {width}
                height = {50}
                headViews = {this.state.floatHeadList}
                tailViews = {this.state.floatTailList}
                direction = {'down'}
                delay = {3000}
                numberOfLines = {1}
                bgContainerStyle = {{backgroundColor : '#f1f6fe'}}
                textStyle = {{fontSize : 12,color : '#6097f4',marginLeft:15}}
                onTextClick = {(item) => {
                }}
            />
        )
        }

        let circleSpotCheck = null;
        if (this.state.spotCheckNo > 0){ circleSpotCheck = (
            <View style={styles.circle}>
                <Text style={{fontSize:12,textAlign:'center',color:'#fff'}}>{this.state.spotCheckNo}</Text>
            </View>
        )
        }

        let circleAudit = null;
        if (this.state.auditNo > 0){ circleAudit = (
            <View style={styles.circle}>
                <Text style={{fontSize:12,textAlign:'center',color:'#fff'}}>{this.state.auditNo}</Text>
            </View>
        )
        }

        let circleWholeCheck = null;
        if (this.state.routeCheckNo > 0){ circleWholeCheck = (
            <View style={styles.circle}>
                <Text style={{fontSize:12,textAlign:'center',color:'#fff'}}>{this.state.routeCheckNo}</Text>
            </View>
        )
        }

        let rotateBtn = null;
        if (this.state.rotateBtn === true){ rotateBtn = (
            <TouchableOpacity onPress={this.onChangeEvent.bind(this)}>
                <Text style={{fontSize:10,textAlign:'center',color:'#989ba3',marginRight: 10}}>{I18n.t('Rotate')}</Text>
            </TouchableOpacity>
        )
        }

        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <View style={{width:width,height:48,alignItems: 'center'}}>
                        <Text style={[styles.NavBarTitle,{fontSize:18}]}>{I18n.t('Feed')}</Text>
                    </View>
                </View>
                <NetInfoIndicator/>
                <View style={{flexDirection:'row'}}>

                    <TouchableOpacity onPress={()=>this.onClick(1)} >
                        <View style={{justifyContent:'center',alignItems:'center',width:width/3,height:100}}>
                            <Image source={require('../assets/images/message_icon1.png')} style={styles.NavBarImage}/>
                            <Text style={{fontSize:14,textAlign:'center',color:'#19293b',marginTop:8}}>{I18n.t('To checked')}</Text>
                            {circleSpotCheck}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={()=>this.onClick(2)} >
                        <View style={{justifyContent:'center',alignItems:'center',width:width/3,height:100}}>
                            <Image source={require('../assets/images/message_icon2.png')} style={styles.NavBarImage}/>
                            <Text style={{fontSize:14,textAlign:'center',color:'#19293b',marginTop:8}}>{I18n.t('To approved')}</Text>
                            {circleAudit}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={()=>this.onClick(3)} >
                        <View style={{justifyContent:'center',alignItems:'center',width:width/3,height:100}}>
                            <Image source={require('../assets/images/message_icon3.png')} style={styles.NavBarImage}/>
                            <Text style={{fontSize:14,textAlign:'center',color:'#19293b',marginTop:8}}>{I18n.t('To patrolled')}</Text>
                            {circleWholeCheck}
                        </View>
                    </TouchableOpacity>

                </View>
                {float}
                <View style={{flexDirection:'row',justifyContent:'space-between',marginTop: 10}}>
                    <Text style={{fontSize:14,textAlign:'center',color:'black',marginLeft: 10,fontWeight: 'bold'}}>{I18n.t('Outstanding events')}</Text>
                    {rotateBtn}
                </View>
                <FlatList style={{marginTop:10}}
                          data={this.state.outStandData} keyExtractor={(item, index) => index.toString()} extraData={this.state}
                          renderItem={({item,index}) => this.renderItem(item,index)}
                          showsVerticalScrollIndicator={false}
                          ItemSeparatorComponent={() => <View style={{
                              height: 1,
                              width: width - 24,
                              marginLeft: 12,
                              backgroundColor: '#dcdcdc'
                          }}/>}
                          ListEmptyComponent={() => <View
                              style={{
                                  width: '100%',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                              }}>
                              <View style={{height: 140, backgroundColor: '#ffffff',alignItems: 'center'}}>
                                  <Image style={{width: 100,height: 100, marginTop: 40}}
                                         source={require('../assets/images/img_affair_null.png')}></Image>
                              </View>
                              <Text style={{fontSize: 18, color: '#d5dbe4', textAlign: 'center'}}>
                                  {I18n.t('No optimal')}
                              </Text>
                          </View>}
                />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    NavBarPanel:{
        flexDirection:'row',
        height: 48,
        backgroundColor: '#24293d'
    },
    NavBarTitle: {
        fontSize: 18,
        height: 48,
        color: '#ffffff',
        textAlignVertical:'center',
        lineHeight: 48
    },
    NavBarPic:{
        width: 48,
        height: 48
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
    IconButton:{
        alignItems:'center',
        justifyContent: 'center',
        flexDirection:'row'
    },
    NavBarImage: {
        width: 40,
        height: 40
    },
    circle:{
        position:'absolute',
        left:width/6+12,
        top:10,
        alignItems:'center',
        justifyContent:'center',
        backgroundColor:'#f76260',
        minWidth:20,
        borderRadius:8,
        padding: 3
    },
    itemContainer:{
        flex:1,
        flexDirection:'row',
    },
    itemLeft:{
        width:25,
        flexDirection:'column',
        marginLeft:12,
        marginTop: 0,
        marginBottom: 8
    },
    itemMiddle:{
        flex:1,
        flexDirection:'column',
        marginLeft:10,
        marginTop: 20,
        marginBottom: 8
    },
    itemRight:{
        width:46,
        flexDirection:'column',
        marginRight:12
    },
});
