import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    ScrollView,
    Platform,
    TouchableOpacity,
    DeviceEventEmitter
} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import store from "../../mobx/Store";
import AndroidBacker from "../components/AndroidBacker";
import Navigation from "../element/Navigation";
import VideoSwitch from "../video/VideoSwitch";
import * as lib from '../common/PositionLib';
import VideoChannel from "../customization/VideoChannel";
import PatrolCore from "./PatrolCore";
import CommentResourcesBlock from "../components/comment/CommentResourcesBlock";
import EventBus from "../common/EventBus";
import ViewPager from "@react-native-community/viewpager";
import PatrolCell from "./PatrolCell";
import * as BorderShadow from "../element/BorderShadow";
import BasePatrol from "../customization/BasePatrol";
import PopupPatrol from "../customization/PopupPatrol";
import TouchableActive from "../touchables/TouchableActive";
import SlotPatrol from "../customization/SlotPatrol";
import TouchableInactive from "../touchables/TouchableInactive";
import CommentDialog from "../components/comment/CommentDialog";
import ModalCenter from "../components/ModalCenter";
import GlobalParam from "../common/GlobalParam";
import {DURATION} from "react-native-easy-toast";
import Toast from "react-native-easy-toast";
import {inject, observer} from "mobx-react";
import moment from "moment";
import PhotoEditor from "../components/comment/PhotoEditor";
import Dialog from "../components/comment/Dialog";
import {UPDATE_BASE_PATROL} from "../common/Constant";
import DialogPhotoEditor from "../components/comment/DialogPhotoEditor";
import PhoneInfo from "../entities/PhoneInfo";
import HeadSheet from "../element/HeadSheet";
import PatrolStorage from "../components/inspect/PatrolStorage";
import PatrolSelector from "../../mobx/PatrolSelector";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import CalendarTime from "../element/CalendarTime";
import ModalChannel from '../customization/ModalChannel';
import AccessHelper from '../common/AccessHelper';
const {width, height} = Dimensions.get('window');

@inject('store')
@observer
export default class PatrolVideo extends BasePatrol {
    state = {
        enumSelector: store.enumSelector,
        patrolSelector: store.patrolSelector,
        screenSelector: store.screenSelector,
        pages: [],
        fullScreen: false,
        devices: [],
        deviceId: -1,
        ivsId: '',
        channelId: -1,
        channelName: '',

        visible: false,
        subject: '',
        attachment: [],
        photoVisible: false,
        photoUrl: '',

        categories: [],
        dateTime:moment().unix()*1000
    };

    constructor(props){
        super(props);

        this.playerMode = -1;
        this.dashReady = false;

        this.initPage = true;
        this.onExitFullScreen = false;
        this.realPreview = true;
        this.screenId = GlobalParam.getScreenId();

        let {screenSelector, patrolSelector} = this.state;

        this.routerFeedback = (patrolSelector.router === screenSelector.patrolType.FEEDBACK);
        this.routerUnfinished = (patrolSelector.router === screenSelector.patrolType.UNFINISHED);
        this.routerSummary = (patrolSelector.router === screenSelector.patrolType.SUMMARY);
        this.routerSearch = (patrolSelector.router === screenSelector.patrolType.SEARCH);
        this.routerMonitor = (patrolSelector.router === screenSelector.patrolType.MONITOR);
    }

    componentDidMount() {
        this.parseData();

        this.refreshEmitter = DeviceEventEmitter.addListener(UPDATE_BASE_PATROL, () => {
            if (this.routerSummary){
                this.setState({pages: this.getItems()});
            }
        });

        this.attachEmitter = DeviceEventEmitter.addListener(`onAttachment${this.screenId}`,() => {
            this.toast && this.toast.show(I18n.t('Max attachments'), DURATION.LENGTH_SHORT);
        });

        this.soundEmitter = DeviceEventEmitter.addListener('onVideoSound', (isActive) => {
            this.keepSound(isActive);
        });

        let enableVideoLicense = AccessHelper.enableVideoLicense() != 0;
        if (!enableVideoLicense){
            DeviceEventEmitter.emit('Toast', I18n.t('Video license'));
        }
    }

    componentWillUnmount() {
        this.refreshEmitter && this.refreshEmitter.remove();
        this.attachEmitter && this.attachEmitter.remove();
        this.soundEmitter && this.soundEmitter.remove();
    }

    parseData(){
        let {patrolSelector, pages, attachment, devices, categories} = this.state;
        if (this.routerFeedback && (patrolSelector.keyIndex !== -1)){
            let index = patrolSelector.keyIndex;
            let data = patrolSelector.feedback[index].attachment;
            attachment = JSON.parse(JSON.stringify(data));
        }

        (!this.routerFeedback && !this.routerMonitor) && (pages = this.getItems());
        devices = this.getDevices();
        !this.routerMonitor && (categories = this.getCategories());
        this.setState({pages, devices, attachment, categories}, () => {
            if (devices.length > 0){
                let targetDevice = devices[0];
                if (this.routerMonitor && patrolSelector.deviceId != null){
                    let findDevice = devices.find(p => p.id == patrolSelector.deviceId);
                    if (findDevice != null){
                        targetDevice = findDevice;
                    }
                }
                this.onPlay(targetDevice);
            }
        })
    }

    onPlay(device){
        let {ivsId, channelId} = device, deviceId = device.id, channelName = device.name;

        this.player && this.player.enablePlay();

        if(this.realPreview){
            if (this.playerMode !== device.vendor){
                let {patrolSelector} = this.state;
                let devices = patrolSelector.store.device;
                let index = devices.findIndex(p => p === device);

                this.player && this.player.initPlayer(index);
            }else {
                this.player && this.player.startPlay(ivsId, channelId);
            }
        }
        else{
            let time = new Date(this.state.dateTime).getTime()/1000;
            if(this.playerMode !== device.vendor){
                this.player.setTime(time);
            }
            else{
                this.player.startPlay(ivsId, channelId,time);
            }
        }

        this.setState({deviceId, ivsId, channelId, channelName});
    }

    onStop(){
        this.player && this.player.disablePlay();
    }

    onBack(){
        if (!this.state.fullScreen){
            this.onStop();

            let {patrolSelector, screenSelector, categories} = this.state;
            patrolSelector.visible = false;
            patrolSelector.screen = screenSelector.patrolType.NORMAL;

            if (!this.routerUnfinished && !this.routerSearch && !this.routerSummary && !this.routerFeedback && !this.routerMonitor){
                patrolSelector.categoryType = patrolSelector.collection.rootId;
                EventBus.updatePatrolData();
            }

            this.setState({patrolSelector}, () => {
                EventBus.updateBasePatrol();
                Actions.pop();
            });
        }else {
            this.exitFullScreen();
        }
    }

    onPrevious(){
        let {patrolSelector, pages} = this.state;

        let index = pages.findIndex(p => p.id === patrolSelector.collection.id);
        if (index > 0){
            patrolSelector.collection = pages[--index];
            this.setState({patrolSelector}, () => {
                EventBus.updateBasePatrol();
            })
        }
    }

    onNext(){
        let {patrolSelector, pages} = this.state;

        let index = pages.findIndex(p => p.id === patrolSelector.collection.id);
        if (index < pages.length-1){
            patrolSelector.collection = pages[++index];
            this.setState({patrolSelector}, () => {
                EventBus.updateBasePatrol();
            })
        }
    }

    renderPatrol(){
        let {patrolSelector, pages} = this.state, maxWidth = width-158;
        let index = pages.findIndex(p => p.id === patrolSelector.collection.id);
        (pages.length === 1) && (maxWidth = width-60);

        return (
            <View style={styles.pager}>
                <View style={styles.patrolPanel}>
                    <Text style={[styles.label,{maxWidth}]} numberOfLines={1}>{this.getLabel()}</Text>
                    {
                        (pages.length > 1) ? <View style={styles.arrowPanel}>
                            <TouchableOpacity activeOpacity={(index === 0 ? 1 : 0.5)}
                                              onPress={() => this.onPrevious()}>
                                <Image source={require('../assets/img_arrow_left.png')}
                                       style={[styles.arrow,{opacity: (index === 0) ? 0.3 : 1}]}/>
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={(index === pages.length-1) ? 1 : 0.5}
                                              onPress={() => this.onNext()}>
                                <Image source={require('../assets/img_arrow_right.png')}
                                       style={[styles.arrow,{opacity: (index === pages.length-1) ? 0.3 : 1}]}/>
                            </TouchableOpacity>
                        </View> : null
                    }
                </View>
                <View style={[styles.cell, BorderShadow.div]}>
                    <PatrolCell maximum={0} showBorder={false} data={{
                        key: patrolSelector.collection,
                        value: this.getSequence()
                    }}/>
                </View>
            </View>
        )
    }

    onFeedback(){
        this.keepSound(true);

        let {patrolSelector, subject, attachment} = this.state;
        let index = patrolSelector.keyIndex;
        if (index !== -1){
            subject = patrolSelector.feedback[index].subject;
        }

        this.setState({visible:true, subject,  attachment});
    }

    renderFeedback(){
        return (
            <TouchableOpacity activeOpacity={0.5} onPress={() => {this.onFeedback()}}>
                <View style={styles.subjectPanel}>
                    <Image source={require('../assets/img_add_subject.png')} style={styles.add}/>
                    <Text style={styles.subject}>{I18n.t('Event Description')}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    renderAttachment(){
        let {patrolSelector, enumSelector} = this.state;
        let commentMediaRequired = false, collection = patrolSelector.collection;

        if(collection && collection.memo_is_advanced && collection.memo_config) {
            if(collection.memo_config.memo_required_type == enumSelector.memoRequiredType.REQUIRED || 
                (collection.memo_config.memo_required_type == enumSelector.memoRequiredType.REQUIRED_UNQUALIFIED && 
                    (collection.scoreType == enumSelector.scoreType.UNQUALIFIED || collection.scoreType == enumSelector.scoreType.FAIL))) { // 必填或不合格時必填                        
                if(collection.memo_config.memo_check_media && 
                    !collection.attachment.find(p => (p.mediaType == enumSelector.mediaTypes.VIDEO || p.mediaType == enumSelector.mediaTypes.IMAGE))) {
                    commentMediaRequired = true;
                }
            }
        }
        return <View style={styles.attachment}>
            <View style={{flexDirection:'row',marginLeft: 20,marginTop: 10}}>
                {commentMediaRequired && <Text style={{color:'#C60957'}}>{'*'}</Text>}
                <Text style={styles.attachLabel}>{I18n.t('Attachment area')}</Text>
            </View>
            <View style={styles.attachPanel}>
                <CommentResourcesBlock data={this.getAttachment()}
                                       showDelete={true}
                                       blockStyle={{marginTop:20,marginLeft:10}}
                                       onPlayItem={(item) => {this.keepSound(true)}}
                                       onDeleteItem={(item) => {this.onDelete(item)}}
                />
            </View>
        </View>;
    }

    renderMonitor(){
        return (
            <View>
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:20,marginLeft:18,marginRight:18,alignContent:'center'}}>
                         <Text style={{fontSize:14,color:'#85898E',}}>{I18n.t('Select datetime')}</Text>
                         <TouchableOpacity activeOpacity={0.6} onPress={() => {
                             this.realPreview = true;
                             this.setState({dateTime:moment().unix()*1000});
                             this.player && this.player.startPlay(this.state.ivsId, this.state.channelId,null);
                         }}>
                            <View style={[styles.viewStyle,{backgroundColor:'white'}]}>
                                <Text style={[styles.textStyle,{color:'#006AB7',width:100}]}>{I18n.t('Back present')}</Text>
                            </View>
                        </TouchableOpacity>
                </View>
                <View style={{marginLeft:18,marginTop:20}}>
                   <CalendarTime date={this.state.dateTime} width={width-36}
                            onClick={() => {}}
                            onSelect={(date) =>{
                            this.realPreview = false;
                            this.setState({dateTime:date});
                            let time = new Date(date).getTime()/1000;
                            this.player && this.player.startPlay(this.state.ivsId, this.state.channelId,time);
                        }}/>
               </View>
            </View>
        )
    }

    renderContent(){
        let {devices, deviceId} = this.state;
        let content = null;
        if (this.routerMonitor){
            content = this.renderMonitor();
        }
        else{
            content = <View>
                 {!this.routerFeedback ? this.renderPatrol() : this.renderFeedback()}
                 {this.renderAttachment()}
            </View>
        }
        let enableVideoLicense = AccessHelper.enableVideoLicense() != 0;
        return (
            <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableInactive>
                    <TouchableActive>
                        {enableVideoLicense && <VideoChannel data={devices} deviceId={deviceId} onChannel={(index) => this.onPlay(devices[index])}/>}
                        {content}
                    </TouchableActive>
                    <SlotPatrol />
                </TouchableInactive>
            </ScrollView>
        )
    }

    renderPhotoEditor(){
        let {photoVisible, photoUrl} = this.state;
        return (
            <DialogPhotoEditor visible={photoVisible}
                               SourceImage={photoUrl}
                               onConfrim={(url) => this.onMedia(url)}
                               onCancel={() => {
                                   this.keepSound(false);
                                   this.setState({photoVisible: false});
                               }} />
        )
    }

    onMore(){
        this.headSheet && this.headSheet.open();
    }

    onCategory(index){
        let {patrolSelector, categories, pages} = this.state;
        let collection = pages.find(p => p.rootId === categories[index].id);
        patrolSelector.collection = collection;

        this.setState({patrolSelector}, () => {
            EventBus.updateBasePatrol();
        })
    }

    render() {
        let {patrolSelector, fullScreen, screenSelector, visible,
            subject, attachment, channelName, categories,devices,deviceId} = this.state, selectIndex = 0;
        console.log("PatrolVideo="+patrolSelector.router)
        if (!this.routerFeedback && !this.routerMonitor){
            selectIndex = categories.findIndex(p => p.id === patrolSelector.collection.rootId);
        }
        let navigation = null, content = null, storeName = null, deviceName = null, popupPatrol = null;
        if (!fullScreen){
            navigation = <Navigation onLeftButtonPress={() => this.onExit()}
                                     title={''}
                                     borderBottomRadius={0}
                                     rightButtonMore={!this.routerSummary && !this.routerMonitor}
                                     onRightMore={() => {this.onMore()}}/>;
            content = this.renderContent();

            storeName = <View style={styles.storePanel}><Text style={styles.storeName} numberOfLines={1}>{patrolSelector.store.name}</Text></View>;
            deviceName =  <View style={styles.channelPanel}><Text style={styles.DeviceName}>{channelName}</Text></View>;
            popupPatrol = <PopupPatrol screen={screenSelector.patrolType.VIDEO}
                                        onDialogVisible={(isActive) => this.keepSound(isActive)}/>;
        }
        let enableVideoLicense = AccessHelper.enableVideoLicense() != 0;
        return (
            <TouchableActive style={styles.container}>
                {navigation}

                {enableVideoLicense && <VideoSwitch ref={c => this.player = c}
                             VideoType={'RemoteCheck'}
                             data={patrolSelector.store}
                             cameraItem={{}}
                             cameraIndex={0}
                             ezvizFullScreen={fullScreen}
                             FullScreen={(screen) => {
                                 this.setState({fullScreen: screen});
                             }}
                             FullChannel={() => {
                                this.modalChannel && this.modalChannel.open(devices,deviceId);
                            }}
                             PlayerMode={(mode) => {this.playerMode = mode}}
                             dashReady={(ready) => {this.dashReady = ready}}
                             createEvent={(isSnapshot,url) => {this.onEditor(isSnapshot,url)}}/> }

                {content}
                {storeName}
                {enableVideoLicense && deviceName}
                {!this.routerMonitor && popupPatrol}

                <CommentDialog
                    title={I18n.t('Event Description')}
                    questionMode={true}
                    contentMode={true}
                    visible={visible}
                    showEdit={true}
                    showDelete={true}
                    enableCapture={false}
                    enableImageLibrary={false}
                    defaultQuestion={subject}
                    defaultData={attachment}
                    onCancel={() => {
                        this.keepSound(false);
                        this.setState({visible:false});
                    }}
                    onClose={(data,question) => {this.onComment(data,question)}}/>

                {this.renderPhotoEditor()}

                <ModalCenter ref={c => this.modalBack = c} title={I18n.t('Exit feedback title')}
                             description={I18n.t('Exit feedback description')}
                             confirm={() => {this.onBack()}}
                             height={PhoneInfo.isJAKOLanguage() ? 260 : 200}/>

                <ModalChannel ref={c => this.modalChannel = c} onSelect={index => {
                    this.onPlay(devices[index]);
                }}/>
                <HeadSheet ref={c => this.headSheet = c} selectIndex={selectIndex}
                           data={categories.map(p => p.name)} onSelect={(index) => this.onCategory(index)}/>
                <Toast ref={c => this.toast = c} style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
                <AndroidBacker onPress={() => {
                    this.onExit();
                    return true;
                }}/>
            </TouchableActive>
        )
    }

    // Video function
    onEditor(isSnapshot, url){
        this.setState({photoUrl: url.replace("file:///",""), photoVisible: true});
        this.keepSound(true);
    }

    onMedia(url){
        this.keepSound(false);
        let {patrolSelector, enumSelector, attachment, deviceId} = this.state;
        let attach = {ts: moment().unix()*1000, mediaType: enumSelector.mediaTypes.IMAGE, url:url, deviceId};

        if (!this.routerFeedback && !this.routerMonitor){
            let collection = PatrolCore.findItem(patrolSelector);
            collection.attachment.push(attach);
            patrolSelector.collection = collection;
        }else {
            attachment.push(attach);
            if(this.routerMonitor){
                let params = {storeId: [patrolSelector.store.storeId], status: [0,1,3],attachment:attachment,deviceId:this.state.deviceId};
                Actions.push('eventAdd', params);
                attachment = [];
            }
        }

        this.setState({patrolSelector, attachment, photoVisible: false}, () => {
            EventBus.updateBasePatrol();
        });
    }

    onChannel(index){
        let {devices} = this.state;
        this.onPlay(devices[index]);
    }

    onDelete(item){
        let {patrolSelector, attachment} = this.state;
        if (!this.routerFeedback){
            let collection = PatrolCore.findItem(patrolSelector);
            let index = collection.attachment.findIndex(p => p === item);

            collection.attachment.splice(index, 1);
            patrolSelector.collection = collection;
        }else {
            let index = attachment.findIndex(p => p === item);
            attachment.splice(index, 1);
        }

        this.setState({patrolSelector, attachment}, () => {
            EventBus.updateBasePatrol();
        })
    }

    onComment(data, question){
        let {patrolSelector} = this.state;
        let index = patrolSelector.keyIndex;

        if (index === -1){
            patrolSelector.feedback.push({
                subject: question,
                attachment: data,
                headUnfold: false,
                attachUnfold: false
            });
        }else {
            patrolSelector.feedback[index].subject = question;
            patrolSelector.feedback[index].attachment = data;
        }

        this.setState({visible: false, patrolSelector}, () => {
            EventBus.updateBasePatrol();
            Actions.pop();
        });
    }

    keepSound(isActive){
        this.player && this.player.onPauseSound(isActive);
    }

    exitFullScreen(){
        //for dash
        if (this.playerMode === 0){
            this.player && this.player.onPauseStatus(0);
        }

        this.setState({fullScreen: false});
    }

    onExit(){
        !this.routerFeedback ? this.onBack() : (this.modalBack && this.modalBack.open());
    }

    // Video core
    getItems(){
        let {patrolSelector} = this.state, items = [];

        if (this.routerUnfinished){
            patrolSelector.unfinished.map(p => items.push(...p.items));
        }else if (this.routerSearch){
            patrolSelector.search.map(p => items.push(...p.items));
        }else if (this.routerSummary){
            items = [patrolSelector.collection];
        }else {
            items = PatrolCore.getItems(patrolSelector);
        }

        return items;
    }

    getDevices(){
        let {patrolSelector} = this.state;
        return patrolSelector.store.device;
    }

    getCategories(){
        let {patrolSelector} = this.state, categories = [];

        if (this.routerUnfinished){
            patrolSelector.unfinished.map(p => categories.push({id: p.id, name: p.groupName}));
        }else if(this.routerSearch){
            patrolSelector.search.map(p => categories.push({id: p.id, name: p.groupName}));
        } else if (!this.routerSummary && !this.routerFeedback){
            categories = JSON.parse(JSON.stringify(patrolSelector.categories));
            categories = categories.slice(0, categories.length-1);
        }

        return categories;
    }

    getAttachment(){
        let {patrolSelector, enumSelector, attachment} = this.state, medias = [];
        attachment = (!this.routerFeedback && !this.routerMonitor) ? patrolSelector.collection.attachment : attachment;

        medias = attachment.filter(p => (p.mediaType === enumSelector.mediaTypes.IMAGE) ||
            (p.mediaType === enumSelector.mediaTypes.VIDEO));
        GlobalParam.setAttachment(this.screenId, medias.length);

        return medias;
    }

    getLabel(){
        let {patrolSelector} = this.state;
        return PatrolCore.getGroup(patrolSelector).groupName;
    }

    getSequence(){
        let {patrolSelector} = this.state, items = [];

        if (this.routerUnfinished){
            items = PatrolCore.getUnfinished(patrolSelector).items;
        }else if (this.routerSearch){
            items = PatrolCore.getSearch(patrolSelector).items;
        }else if (this.routerSummary){
            items = [patrolSelector.collection];
        }else {
            items = PatrolCore.getGroup(patrolSelector).items;
        }

        return (items.length > 0) ? items.findIndex(p => p.id === patrolSelector.collection.id) : 0;
    }
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        backgroundColor:'#F7F9FA'
    },
    patrolPanel:{
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    label:{
        marginTop:19,
        marginBottom:16,
        marginLeft:16,
        fontSize:14,
        color:'rgb(133,137,142)'
    },
    arrowPanel:{
        width: 110,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop:10
    },
    arrow:{
        width: 37,
        height: 42
    },
    storePanel:{
        position:'absolute',
        ...Platform.select({
            android:{
                top: 10
            },
            ios:{
                top: 26
            }
        }),
        left:50,
        width:width-100,
        alignItems:'center'
    },
    channelPanel:{
        position:'absolute',
        ...Platform.select({
            android:{
                top: 36
            },
            ios:{
                top: lib.defaultStatusHeight()+30
            }
        }),
        left:0,
        width:width,
        alignItems:'center'
    },
    storeName:{
        color:'#fff',
        fontSize:18,
        textAlign:'center'
    },
    DeviceName:{
        color:'#fff',
        fontSize:10,
        textAlign:'center'
    },
    attachment:{
        backgroundColor:'#F7F9FA'
    },
    attachLabel:{
        fontSize:14,
        color:'rgb(133,137,142)',
        //marginLeft: 20,
        //marginTop: 10
    },
    attachPanel:{
        width:width-20,
        height:100,
        marginLeft:10,
        marginTop:12,
        backgroundColor: 'rgb(234,241,243)',
        borderRadius:10
    },
    cell:{
        width:width-40,
        borderRadius: 10,
        minHeight: 70,
        maxHeight: 90,
        backgroundColor:'#fff'
    },
    subjectPanel:{
        flexDirection:'row',
        justifyContent:'flex-start',
        paddingLeft:8,
        paddingRight:17,
        width:100,
        height:28,
        backgroundColor:'rgb(0,106,183)',
        marginLeft:16,
        marginTop:19,
        marginBottom:10,
        borderRadius:10
    },
    add:{
        width:16,
        height:16,
        alignSelf: 'center'
    },
    subject:{
        fontSize:12,
        color:'#fff',
        marginLeft:4,
        height:28,
        lineHeight:28,
        textAlignVertical:'center',
        marginTop:-1
    },
    dialog:{
        backgroundColor: 'transparent',
        width: width
    },
    pager:{
        width: width-40,
        marginLeft:20,
        justifyContent:'center'
    },
    viewStyle:{
        borderWidth: 1,
        borderColor: '#006AB7',
        borderRadius: 10,
        paddingLeft:12,
        paddingRight:12,
        height:30,
        minWidth:65
    },
    textStyle:{
        fontSize:14,
        color:'#02528B',
        height:30,
        lineHeight: 30,
        textAlign: 'center',
        textAlignVertical: 'center',
        marginTop:-2
    },
});
