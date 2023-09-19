import React, { Component } from 'react';
import {
    BackHandler,
    DeviceEventEmitter,
    Dimensions,
    FlatList,
    Image, ImageBackground, Platform, ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Actions } from 'react-native-router-flux';
import RNStatusBar from "../components/RNStatusBar";
import HttpUtil from "../utils/HttpUtil";
import Toast from "react-native-easy-toast";
import Timeline from "react-native-timeline-listview";
import { Table, Row } from 'react-native-table-component';
import TimeUtil from "../utils/TimeUtil";
import { FlatGrid } from 'react-native-super-grid';
import {ColorStyles} from "../common/ColorStyles";
import OSSUtil from "../utils/OSSUtil";
import {MEDIA_AUDIO, MEDIA_IMAGE, MEDIA_VIDEO, MODULE_EVENT} from "../common/Constant";
import ShowBox from './ShowBox';
import BusyIndicator from "../components/BusyIndicator";
import I18n from 'react-native-i18n';
import EventTemplateComment from "../unuse/EventTemplateComment";
import VideoSwitch from '../video/VideoSwitch';
let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class AffairDetail extends Component {

    constructor(props) {
        super(props);
        this.state = {
            selectTab: 1,
            comment: [],
            status: this.props.data.status,
            relate: [],
            ezvizFullScreen: false
        }
        this.bAlarm = this.props.bAlarm;
        this.deviceList = [];
        this.tempStatus = null;
        this.detail = []
    }

    componentDidMount(){
        this.refs.VideoSwitch.initPlayer(this.props.vendorIndex);
        this.imageEmitter = DeviceEventEmitter.addListener('onImageRefresh', this.onImageRefresh.bind(this));
        this.eventEmitter = DeviceEventEmitter.addListener('onCheckRefresh', this.onAddComment.bind(this));
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('hardwareBackPress', this.refs.VideoSwitch.onBackAndroid);
        }
        this.fetchDeviceList();
        setTimeout(() => {
            this.fetchRelatedEvent();
            if (this.bAlarm){
                this.fetchCommentList();
            }
        }, 500);
    }

    componentWillUnmount() {
        this.imageEmitter.remove();
        this.eventEmitter.remove();
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('hardwareBackPress', this.refs.VideoSwitch.onBackAndroid);
        }
    }

    onAddComment(submit){
        if (  (submit.description == null || submit.description == '')
            && submit.audioPath == null
            && submit.attachment.length == 0
        ){
            return;
        }

        OSSUtil.init(this.props.data.storeId).then(()=>{
            let storeId = this.props.data.storeId;
            let deviceId = this.props.data.deviceId;
            let pArray = [];
            let request = {};
            let eventIds = [];
            eventIds.push(this.props.data.id);
            request.eventIds = eventIds;
            let comment = {};
            comment.ts = new Date().getTime();
            comment.description = submit.description;
            let attachment = [];
            if (submit.audioPath != null){
                var ossKey = OSSUtil.formatOssUrl(MODULE_EVENT,MEDIA_AUDIO,storeId,deviceId);
                pArray.push(OSSUtil.upload(ossKey,`file://${submit.audioPath}`));

                let addMedia = {};
                addMedia.mediaType = 0;
                addMedia.url = OSSUtil.formatRemoteUrl(ossKey);
                attachment.push(addMedia);
            }

            submit.attachment.forEach((item,index)=>{
                if (item.mediaType == 1){
                    var ossKey = OSSUtil.formatOssUrl(MODULE_EVENT,MEDIA_VIDEO,storeId,deviceId+index.toString());
                    pArray.push(OSSUtil.upload(ossKey,item.mediaPath));
                    let addMedia = {};
                    addMedia.mediaType = 1;
                    addMedia.url = OSSUtil.formatRemoteUrl(ossKey);
                    attachment.push(addMedia);
                }
                else if (item.mediaType == 2){
                    var ossKey = OSSUtil.formatOssUrl(MODULE_EVENT,MEDIA_IMAGE,storeId,deviceId+index.toString());
                    pArray.push(OSSUtil.upload(ossKey,item.mediaPath));   
                    let addMedia = {};
                    addMedia.mediaType = 2;
                    addMedia.url = OSSUtil.formatRemoteUrl(ossKey);
                    attachment.push(addMedia);
                }
            });

            this.refs.indicator.open();
            Promise.all(pArray).then((result) => {
                comment.attachment = attachment;
                comment.status = this.tempStatus;
                request.comment = comment;

                HttpUtil.post('lps/event/comment/add',request)
                    .then(res => {
                        this.fetchCommentList();
                        this.refs.indicator.close();
                    })
                    .catch(err=>{
                        this.refs.indicator.close();
                    })
            }).catch(error=>{
                this.refs.indicator.close();
            })
        }).catch((error)=>{
            this.refs.indicator.close();
        });
    }

    onImageRefresh(path) {
        if (path != null){
            this.refs.VideoSwitch.onPauseStatus(1);
            Actions.replace('createCheckEvent',{uri:path,camera:false, title:I18n.t('Handling'),subject:false});
        }
        else {
            Actions.pop();
        }
    }

    onSnapShot(isSnapshot,uri){
        if (this.bAlarm && this.state.status != 2){
            this.tempStatus = 1;
            if (isSnapshot){
                Actions.push('imageCanvas',{type:'onImageRefresh',uri});
            }
            else {
                this.refs.VideoSwitch.onPauseStatus(1);
                Actions.push('createCheckEvent',{videoUri:uri,camera:false, title:I18n.t('Handling'),subject:false});
            }
        }
    }

    onEndCommit(){
        this.tempStatus = 2;
        this.refs.VideoSwitch.onPauseStatus(1);
        Actions.push('createCameraEvent',{title:I18n.t('Handling'),subject:false});
    }

    fetchDeviceList(){
        HttpUtil.get('device/list')
            .then(result => {
                this.deviceList = result.data;
            })
            .catch(error=>{
            })
    }

    onSelectChange(tab){
        if (this.state.selectTab !== tab){
            this.setState({selectTab:tab});
            if (tab === 1){
                let relate = this.state.relate;
                relate.forEach((itemChild, indexChild) => {
                    itemChild.check = false;
                });
                this.setState({relate:relate});
                this.refs.VideoSwitch.onDashReady();
            }
        }
    }

    fetchCommentList(){
        this.setState({comment: []});
        let request = {};
        let eventIds = [];
        eventIds.push(this.props.data.id);
        request.eventIds = eventIds;
        HttpUtil.post('lps/event/comment/list',request)
            .then(result => {
                let comments  = result.data;
                let comment = comments[0].comment;
                comment.pop();
                let data = [];
                comment.forEach((item,index)=>{
                    let add = {};
                    if (item.status === 0){
                        add.time = I18n.t('Pending');
                        add.icon = require('../assets/images/img_dot_first.png')
                    }
                    else if (item.status === 1) {
                        add.time = I18n.t('Done');
                        add.icon = require('../assets/images/img_dot_second.png')
                    }
                    else if (item.status === 2){
                        add.time = I18n.t('Closed');
                        add.icon = require('../assets/images/img_dot_over.png')
                    }
                    else if (item.status === 3){
                        add.time = I18n.t('Reject');
                        add.icon = require('../assets/images/img_dot_first.png')
                    }
                    add.ts = item.ts;
                    add.accountName = item.accountName;
                    add.description = item.description;
                    add.attachment = [];
                    let attachment = item.attachment;
                    if (attachment != null){
                        attachment.forEach((item,index)=>{
                            if(item.mediaType === 0){
                                add.audioPath = item.url;
                            }
                            else{
                                add.attachment.push(item);
                            }
                        });
                    }
                    data.push(add);
                    if (index == 0){
                        this.setState({status: item.status});
                    }
                });
                this.setState({comment: data});
            })
            .catch(error=>{
            })
    }

    fetchRelatedEvent(){
        let request = {};
        request.beginTs = this.props.data.ts - 86400*1000;
        request.endTs = this.props.data.ts + 86400*1000;
        let filter = {};
        filter.page = 0;
        filter.size = 1000;
        request.filter = filter;
        let clause = {};
        clause.storeId = this.props.data.storeId;
        clause.transactionId = this.props.data.transactionId;
        request.clause = clause;
        let order = {};
        order.direction = 'desc';
        order.property = 'ts';
        request.order = order;
        HttpUtil.post('lps/data/list',request)
            .then(result => {
                let content = result.data.content;
                let data = [];
                content.forEach((item,index)=>{
                    let add = {};
                    add.transactionId = item.transactionId;
                    add.ts = item.ts;
                    let itemDevice = this.deviceList.find(element => element.id === item.deviceId);
                    if (itemDevice != null) {
                        add.name = itemDevice.name;
                        add.ivsId = itemDevice.ivsId;
                        add.channelId = itemDevice.channelId;
                        add.thumbnailUrl = itemDevice.thumbnailUrl;
                    }
                    add.content = item.content;
                    add.check = false;
                    if (add.ivsId != null){
                        data.push(add);
                    }
                });
                this.setState({relate: data});
            })
            .catch(error=>{
            })
    }

    renderCommit(rowData, sectionID, rowID) {
        let account = null;
        if (rowData.accountName){ account = (
            <Text style={{color: '#19293b', fontSize:14, textAlignVertical: 'center',textAlign: 'left',
                ...Platform.select({
                    ios:{
                        marginTop:-8
                    },
                    android:{
                        marginTop:-10
                    }
                })
                ,marginBottom:5}}>
                {rowData.accountName}
            </Text>
        )
        }
        return (
            <View>
                {account}
                <EventTemplateComment data={rowData} style={{marginBottom:10}} />
            </View>
        )
    }

    renderGrid(item,index){
        let timeStr = TimeUtil.getTime(item.ts);
        return (
            <View>
                <ImageBackground style={styles.thumbnail} imageStyle={item.check? {borderColor: ColorStyles.COLOR_MAIN_RED, borderWidth:3}:null}
                                 source={{uri: item.thumbnailUrl == null ? '' : item.thumbnailUrl,cache: 'reload'}} resizeMode='contain'>
                    <TouchableOpacity onPress={()=>this.onPlayVideo(item,index)}>
                        <Image style={styles.thumbIcon} source={require('../assets/images/pic_play_icon.png')} resizeMode='contain'/>
                    </TouchableOpacity>
                    <View style={styles.channelInfoPanel}>
                        <Text style={{fontSize:12,color:'#ffffff',padding:3}}>{item.name}</Text>
                    </View>
                </ImageBackground>
                <View style={{flexDirection:'row',alignItems: 'center',marginTop:10}}>
                    <Text style={{fontSize:11,textAlignVertical:'center',color:'#19293b',marginLeft:5}}>{I18n.t('Transaction id')}</Text>
                    <Text ellipsizeMode={'tail'} numberOfLines={1} style={{fontSize:11,textAlignVertical:'center',color:'#19293b',marginLeft:2,width:60}}>{item.transactionId}</Text>
                    <TouchableOpacity  onPress={()=>this.onShowBox(item)}>
                        <Image  style={{width:20,height:20}} source={require('../assets/images/show_more_icon.png')}/>
                    </TouchableOpacity>
                </View>
                <View style={{flexDirection:'row'}}>
                    <Text style={{fontSize:11,textAlignVertical:'center',color:'#888C95',marginTop:5,marginLeft:5}}>{I18n.t('Transaction time')}</Text>
                    <Text numberOfLines={1} style={{fontSize:11,textAlignVertical:'center',color:'#888C95',marginTop:5,marginLeft:2}}>{timeStr}</Text>
                </View>
            </View>
        );
    }

    onShowBox(item){
        let detailList = this.addDetail(item);
        this.ShowBox.open(detailList);
    }

    addDetail(content){
        this.detail = [];
        let timeStr = TimeUtil.getTime(content.ts);
        this.addLine(I18n.t('Transaction time').replace(":",""),timeStr);
        this.addLine(I18n.t('Store'),content.storeName);
        this.addLine(I18n.t('Transaction id').replace(":",""),content.transactionId);
        this.addLine(I18n.t('Transaction types'),content.eventName);
        let detail = content.content;
        for(let p in detail){
            if (detail[p] instanceof Array){
                let tableHead = [];
                let tableData = [];
                for (let t in detail[p]){
                    let tableLine = [];
                    for (let s in detail[p][t]){
                        if (t == 0){
                            tableHead.push(s);
                        }
                        tableLine.push(detail[p][t][s]);
                    }
                    tableData.push(tableLine);
                }
                this.addTable(p,tableHead,tableData);
            }
            else {
                this.addLine(p,detail[p]);
            }
        }
        return this.detail;
    }

    addLine(title,content){
        let detail = this.detail;
        let addContent = (
            <View style={{flexDirection: 'row',marginTop:5}}>
                <Text style={{fontSize:12,textAlignVertical:'center',color:'#19293b',width:(width-24)/3}}>{title}</Text>
                <Text style={{fontSize:12,textAlignVertical:'center',color:'#19293b',marginLeft:10,width:2*(width-24)/3-16}} ellipsizeMode={'tail'} numberOfLines={1}>{content}</Text>
            </View>
        )
        detail.push(addContent);
    }

    addTable(title,tableHead,tableData){
        let detail = this.detail;
        let addContent = (
            <View style={{marginTop:5}}>
                <Text style={{fontSize:12,textAlignVertical:'center',color:'#19293b',width:(width-24)/3}}>{title}</Text>
                <Table borderStyle={{borderColor: '#C1C0B9'}}style={{marginTop:5,marginBottom:3}}>
                    <Row data={tableHead} style={{backgroundColor: '#f6f8fa'}} textStyle={{fontSize:10,textAlignVertical:'center',color:'#888c95',textAlign: 'center'}}/>
                    {
                        tableData.map((rowData, index) => (
                            <Row key={index} data={rowData}
                                 textStyle={{fontSize:12,textAlignVertical:'center',color:'#19293b',textAlign: 'center'}}
                            />
                        ))
                    }
                </Table>
            </View>
        )
        detail.push(addContent);
    }

    onPlayVideo(item,index){
        let relate = this.state.relate;
        relate.forEach((itemChild, indexChild) => {
            itemChild.check = indexChild == index ? true: false;
        });
        this.setState({relate:relate});
        let time = item.ts/1000;
        this.refs.VideoSwitch.startPlay(item.ivsId,item.channelId,time);
    }

    render(){
        let selectColor1 = this.state.selectTab == 1 ? '#f31d65':'#888c95';
        let selectColor2 = this.state.selectTab == 1 ? '#888c95':'#f31d65';
        let detailList = this.addDetail(this.props.data);
        let accountNo = I18n.t('Transaction id') + this.props.data.transactionId;
        let selectContent = null;
        let endButton = null;
        if (this.bAlarm && this.state.status != 2){ endButton = (
            <View style={{width:width/3,height:48,flexDirection: 'row',alignItems:'flex-end',justifyContent:'flex-end'}}>
                <TouchableOpacity activeOpacity={0.5} onPress={()=>this.onEndCommit()} style={{width:60,alignItems:'flex-end',justifyContent:'flex-end'}}>
                    <Text style={[styles.NavBarTitle,{fontSize:14,marginRight:12}]}>{I18n.t('Closing')}</Text>
                </TouchableOpacity>
            </View>
        )
        }

        let commit = null;
        if (this.bAlarm){ commit = (
            <View>
                <Text style={{fontSize:14,textAlignVertical:'center',color:'#19293b'}}>{I18n.t('Handling')}</Text>
                <Timeline
                    style={{paddingTop:5}}
                    data={this.state.comment}
                    circleSize={20}
                    circleColor='rgba(0,0,0,0)'
                    innerCircle={'icon'}
                    lineColor='#dcdcdc'
                    timeContainerStyle={{minWidth:52}}
                    timeStyle={{fontSize:12,textAlign: 'center',textAlignVertical: 'center',
                        backgroundColor:'#434c5e', color:'white', borderRadius:0, height:22,
                        ...Platform.select({
                            ios:{
                                lineHeight: 22
                            }
                        })
                    }}
                    descriptionStyle={{color:'gray'}}
                    options={{style:{paddingTop:5}}}
                    renderDetail={this.renderCommit.bind(this)}
                />
            </View>
        )
        }

        if  (this.state.selectTab == 1){ selectContent = (
            <View style={{marginLeft:12,marginRight:12,marginTop: 10}}>
                {commit}
                <Text style={{fontSize:14,textAlignVertical:'center',color:'#19293b',marginTop:10}}>{I18n.t('Transaction detail')}</Text>
                <View style={{marginTop: 5,marginBottom:15}} >
                    {detailList}
                </View>
            </View>
        )
        }
        else { selectContent = (
            <View style={{marginLeft:12,marginRight:12,marginTop: 10}}>
                {this.state.relate.length > 0 ?
                    <FlatGrid
                    itemDimension={150}
                    items={this.state.relate}
                    renderItem={({item,index}) => this.renderGrid(item,index)}
                    /> :
                    <View>
                        <View style={styles.imagePanel}>
                            <Image style={styles.imageIcon} source={require('../assets/images/img_inspect_report.png')}></Image>
                        </View>
                        <Text style={styles.imageTip}>{I18n.t('No events')}</Text>
                    </View>
                }
            </View>
        )
        }

        return (
            <View style={styles.container}>
                <RNStatusBar/>
                {
                    !this.state.ezvizFullScreen ?  <View style={styles.NavBarPanel}>
                        <View style={{width:width/3,height:48}}>
                            <TouchableOpacity activeOpacity={0.5} onPress={Actions.pop} style={{width:48}}>
                                <Image source={require('../assets/images/titlebar_back_icon_normal.png')} style={styles.NavBarImage} />
                            </TouchableOpacity>
                        </View>
                        <View style={{width:width/3,alignItems:'center',marginTop:5}}>
                            <Text ellipsizeMode={'tail'} numberOfLines={1} style={{fontSize:16,color: '#ffffff', textAlignVertical:'center',width:width/1.6,textAlign:'center'}}>{accountNo}</Text>
                            <Text ellipsizeMode={'tail'} numberOfLines={1} style={{fontSize:12,color: '#ffffff', textAlignVertical:'center',width:width/1.6,textAlign:'center'}}>{this.props.data.eventName}</Text>
                        </View>
                        {endButton}
                    </View> : null
                }

                <VideoSwitch ref={'VideoSwitch'}
                             VideoType={'AffairDetail'}
                             data={this.props.store}
                             time={this.props.data.ts}
                             deviceList={this.deviceList}
                             vendorIndex={this.props.vendorIndex}
                             ezvizFullScreen={this.state.ezvizFullScreen}
                             showSnap={this.bAlarm && (this.state.status !== 2)}
                             FullScreen={(screen)=>this.setState({ezvizFullScreen: screen})}
                             createEvent={(isSnapshot,uri)=>{this.onSnapShot(isSnapshot,uri)}}/>

                <View style={styles.SelectBarPanel}>
                    <TouchableOpacity onPress={()=>this.onSelectChange(1)}>
                        <Text style={{fontSize:12,height: 38, textAlignVertical:'center',lineHeight: 38,color: selectColor1}}>{I18n.t('Event detail')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>this.onSelectChange(2)}>
                        <Text style={{fontSize:12,height: 38, textAlignVertical:'center',lineHeight: 38,color:selectColor2}}>{I18n.t('Relate events')}</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.tabLinePanel}>
                    <View style={this.state.selectTab === 1 ? styles.tabSelected : styles.tabNormal}></View>
                    <View style={this.state.selectTab === 2 ? styles.tabSelected : styles.tabNormal}></View>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'handled'} ref={'scrollView'} >
                    {selectContent}
                </ScrollView>
                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}} position='top' positionValue={200}/>
                <BusyIndicator ref={"indicator"} title={I18n.t('Creating')}/>
                <ShowBox ref={ref => this.ShowBox = ref}/>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
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
    SelectBarPanel:{
        backgroundColor: '#eff2f5',
        height: 40,
        textAlignVertical:'center',
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    channelInfoPanel:{
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.45)',
        //height: 20,
        bottom: 8,
        marginLeft:10
    },
    thumbnail: {
        marginTop:15,
        width: 150,
        height: 100,
        alignSelf: 'flex-start',
    },
    thumbIcon:{
        width: 40,
        height: 40,
        alignSelf: 'center',
        marginTop:30
    },
    tabLinePanel:{
        flexDirection:'row',
        justifyContent:'space-between',
        marginLeft:12,
        marginRight:12,
    },
    tabSelected:{
        width:width/2-12*2,
        height:2,
        backgroundColor:ColorStyles.COLOR_MAIN_RED
    },
    tabNormal:{
        width:width/2-12*2,
        height:2,
        backgroundColor:'#ffffff'
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
