import React, {Component} from 'react';
import {
    DeviceEventEmitter,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform
} from 'react-native';
import {Actions} from 'react-native-router-flux';
import RecordAudio from "../components/RecordAudio";
import SoundPlayer from "../components/SoundPlayer";
import HttpUtil from "../utils/HttpUtil";
import {MEDIA_AUDIO, MEDIA_IMAGE, MEDIA_VIDEO, MODULE_EVENT} from "../common/Constant";
import OSSUtil from "../utils/OSSUtil";
import RNStatusBar from '../components/RNStatusBar';
import BusyIndicator from '../components/BusyIndicator';
import Toast, {DURATION} from 'react-native-easy-toast'
import * as lib from '../common/PositionLib';
import {ColorStyles} from '../common/ColorStyles';
import I18n from 'react-native-i18n';
import Video from '../components/af-video-player/Video';
import dismissKeyboard from "react-native-dismiss-keyboard";
import StringFilter from "../common/StringFilter";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";

let {width} =  Dimensions.get('screen');

let height = lib.dashVideoHeight();
export default class CreateEvent extends Component {
    constructor(props){
        super(props);

        this.evtType = this.props.evtType;
        this.thumbnailUrl = require('../assets/images/image_videoThumbnail.png');

        this.state = {
            createEvent: true,
            eventInfo:{
                storeId: this.props.storeId,
                storeName: this.props.storeName,
                channelId: this.props.channelId,
                subject:'',
                eventDescription:'',
                isTextDescription:false,
                eventTimeStamp: '',
                audioPath: null,
                sendTo: '',
                eventId:'',
                descriptionHeight:46
            },
            uri: this.props.uri,
            tipsColor:'#dcdcdc'
        }
        this.createClick = this.createClick.bind(this);
        this.issueNameChanged = this.issueNameChanged.bind(this);
        this.issueDescriptionChanged = this.issueDescriptionChanged.bind(this);
        this.audioDeleteClick = this.audioDeleteClick.bind(this);
    }

    componentDidMount() {
        this.eventEmitter = DeviceEventEmitter.addListener('onAttachEvent', this.onAttachFun.bind(this));
    }

    componentWillUnmount() {
        this.eventEmitter.remove();
    }

    onAttachFun(data){
        let tipsColor = data.subject.trim() !== '' ? '#dcdcdc' : this.state.tipsColor;
        let eventInfo = this.state.eventInfo;
        eventInfo.subject = data.subject;
        eventInfo.eventId = data.id;
        this.setState({eventInfo:eventInfo,tipsColor});
    }

    sketchSaved(){
        let upTime = new Date().getTime();
        let evt = {};
        if (this.state.createEvent){
            evt.ts = upTime;
            evt.storeId = this.state.eventInfo.storeId;
            evt.deviceId = this.state.eventInfo.channelId;
            evt.subject = this.state.eventInfo.subject.trim();
        }
        else {
            let eventIds = [];
            eventIds.push(this.state.eventInfo.eventId);
            evt.eventIds = eventIds;
        }

        let comment = {};
        comment.ts = upTime;
        comment.status = 0;
        comment.description = this.state.eventInfo.eventDescription.trim();
        comment.attachment = [];

        OSSUtil.init(this.state.eventInfo.storeId).then(()=>{
            let pArray = [];
            let media = (this.evtType === 'Image') ? 2 : 1;
            let mediaType = (this.evtType === 'Image') ? MEDIA_IMAGE : MEDIA_VIDEO;
            let ossKey = OSSUtil.formatOssUrl(MODULE_EVENT,mediaType,this.state.eventInfo.storeId,this.state.eventInfo.channelId);
            pArray.push(OSSUtil.upload(ossKey,this.state.uri));
            comment.attachment.push({mediaType:media, url:OSSUtil.formatRemoteUrl(ossKey)});

            if (this.state.eventInfo.audioPath != null){
                let ossKey = OSSUtil.formatOssUrl(MODULE_EVENT,MEDIA_AUDIO,this.state.eventInfo.storeId,this.state.eventInfo.channelId);
                pArray.push(OSSUtil.upload(ossKey,`file://${this.state.eventInfo.audioPath}`));
                comment.attachment.push({mediaType:0, url:OSSUtil.formatRemoteUrl(ossKey)});
            }

            evt.comment = comment;

            Promise.all(pArray).then((result) => {
                this.state.createEvent ? this.submitAddEvent(evt) :  this.submitAttachEvent(evt);
            }).catch((error) => {
                this.refs.indicator.close();
                Actions.push('submitFailture');
            });
        }).catch((error)=>{
            this.refs.indicator.close();
            Actions.push('submitFailture');
        });
    }

    createClick(){
        try{
            let subject = this.state.eventInfo.subject;
            if(subject.trim() === ''){
                dismissKeyboard();
                this.setState({tipsColor:'#ff2400'});
                return;
            }

            this.refs.indicator.open();
            this.sketchSaved();
        }catch (e) {
            this.refs.indicator.close();
            Actions.push('submitFailture');
            console.log("CreateEvent-createClick:" + e);
        }
    }

    submitAttachEvent(event){
        HttpUtil.post('event/comment/add',event)
            .then(result => {
                this.refs.indicator.close();
                Actions.push('submitSuccess',{data: this.state.eventInfo});
            })
            .catch(error=>{
                this.refs.indicator.close();
                Actions.push('submitFailture');
            })
    }

    submitAddEvent(event){
        HttpUtil.post('event/add',event)
            .then(result => {
                let users = '';
                result.data.notifiedTo.forEach((item,index)=>{
                    if((index+1) === result.data.notifiedTo.length){
                        users = users + item.userName;
                    }else {
                        users = users + item.userName + ',';
                    }
                });

                let data = Object.assign({}, this.state.eventInfo, { sendTo:users});
                this.setState({
                    eventInfo:data
                },()=>{
                    this.refs.indicator.close();
                    Actions.push('submitSuccess',{data: this.state.eventInfo});
                });
            })
            .catch(error=>{
                this.refs.indicator.close();
                Actions.push('submitFailture');
            })
    }

    onAudio(audioPath){
        let eventInfo = this.state.eventInfo;
        eventInfo.audioPath = audioPath;
        this.setState({eventInfo: eventInfo});
        let audioPlay = this.refs.audioPlay;
        audioPlay.setAudioPath(audioPath);
    }

    issueNameChanged(text){
        let eventInfo = this.state.eventInfo;
        eventInfo.subject  = StringFilter.standard(text,50);
        this.setState({eventInfo: eventInfo});
    }

    issueDescriptionChanged(text){
        let eventInfo = this.state.eventInfo;
        eventInfo.eventDescription = StringFilter.all(text,200);
        this.setState({eventInfo: eventInfo});
    }

    onDescriptionChange = (event) => {
        let eventInfo = this.state.eventInfo;
        eventInfo.eventDescription = StringFilter.all( event.nativeEvent.text,200);
        this.setState({
            eventInfo
        });
    }

    onContentSizeChange = (event) => {
        this.setState({
            descriptionHeight: event.nativeEvent.contentSize.height
        });
    }

    audioDeleteClick(){
        this.onAudio(null);
    }

    onGoRecord(){
        let eventInfo = this.state.eventInfo;
        eventInfo.isTextDescription = false;
        this.setState({eventInfo: eventInfo});
    }

    onGoText(){
        let eventInfo = this.state.eventInfo;
        eventInfo.isTextDescription = true;
        this.setState({eventInfo: eventInfo});
    }

    onAttachEvent(){
        this.setState({createEvent:false});
        Actions.push('attachEvent',{data: this.props.storeId});
    }

    render() {
        let audio = null;
        let audioDelete = null;

        let audioPath = this.state.eventInfo.audioPath;
        if ( audioPath!= null){ audioDelete = (
            <TouchableOpacityEx activeOpcity={0.5} onPress={()=>this.audioDeleteClick()}>
                <Image style={{width:24,height:24,marginLeft:12}} source={require('../assets/images/img_audio_delete.png')}></Image>
            </TouchableOpacityEx>
        )
        }
        if (this.state.eventInfo.isTextDescription == true){ audio = (
            <View style={{flexDirection: 'row',justifyContent:'flex-end',alignItems:'center',marginBottom: 20}}>
                <TextInput style={[styles.issueDescription,{height:this.state.descriptionHeight}]} multiline onChangeText={this.issueDescriptionChanged}
                           value={this.state.eventInfo.eventDescription} placeholder={I18n.t('Enter info')}
                           onChange={() => this.onDescriptionChange.bind(this)}
                           />
                <TouchableOpacity onPress={()=>this.onGoRecord()}>
                    <Image  style={styles.audioRecordIcon} source={require('../assets/images/text_icon_normal.png')}/>
                </TouchableOpacity>
            </View>
        )
        }
        else { audio = (
            <View style={{flexDirection: 'row',justifyContent:'flex-end',alignItems:'center'}}>
                <View style={styles.audioPanel}>
                    <SoundPlayer ref={'audioPlay'} maxLength={140} input={true} path={audioPath}/>
                    {audioDelete}
                </View>
                <View style={styles.audioRecordIcon}>
                    <RecordAudio audioPressOut={this.onAudio.bind(this)} onPress={this.onGoText.bind(this)}/>
                </View>
            </View>
        )
        }

        let showArea = null;
        if (this.evtType === 'Image'){ showArea = (
            <TouchableOpacity onPress={() => Actions.push('pictureViewer',{uri: this.state.uri})}>
                <Image style={{width:width,height:height}} source={{uri: this.state.uri}} resizeMode='stretch'/>
            </TouchableOpacity>
        )
        }
        else { showArea = (
            <Video url={this.props.uri} title={' '} logo={' '}/>
        )
        }

        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={Actions.pop}>
                        <View style={{width:60,height:48}}>
                            <Text style={[styles.NavBarTitle,{fontSize:14,marginLeft:12}]}>{I18n.t('Cancel')}</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{width:width-120,height:48,alignItems: 'center'}}>
                        <Text style={[styles.NavBarTitle,{fontSize:18}]}>{I18n.t('Create problem')}</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.createClick}>
                        <View style={{width:60,height:48,flexDirection: 'row',justifyContent:'flex-end'}}>
                            <Text style={[styles.NavBarTitle,{fontSize:14,marginRight:12}]}>{I18n.t('Create')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'handled'}>
                    <View style={styles.showPanel}>
                        {showArea}
                    </View>
                    <View style={styles.createLabelPanel}>
                        <Text style={[styles.createLabelText,{marginLeft:16}]}>{I18n.t('Create problem')}</Text>
                    </View>
                    <View style={styles.tabSwitchPanel}>
                        <TouchableOpacity style= {[this.state.createEvent ? styles.eventSelected : styles.eventNormal,{marginLeft:16}]}
                                          onPress={()=>this.setState({createEvent:true})}
                                          activeOpacity={0.6}>
                            <Text style={this.state.createEvent ? styles.textSelected : styles.textNormal}>{I18n.t('Create issue')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style= {[this.state.createEvent ? styles.eventNormal : styles.eventSelected,{marginLeft:20}]}
                                          onPress={() => this.onAttachEvent()}
                                          activeOpacity={0.6}>
                            <Text style={this.state.createEvent ? styles.textNormal : styles.textSelected}>{I18n.t('Historical issue')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{flexDirection:'row',justifyContent:'flex-start'}}>
                        <Text style={{color:'#ff2400',marginLeft: 16,marginTop:15}}>*</Text>
                        <View style={styles.createLabelPanel}>
                            <Text style={[styles.createLabelText,{marginLeft:2}]}>{I18n.t('Event title')}</Text>
                        </View>
                    </View>
                    <TextInput style={[styles.issueName,{borderColor:this.state.tipsColor}]} value={this.state.eventInfo.subject}
                               onChangeText={this.issueNameChanged} editable = {this.state.createEvent ? true : false}
                               onFocus={()=>{this.setState({tipsColor:'#dcdcdc'})}} multiline/>
                    {
                        this.state.tipsColor === '#dcdcdc' ? null
                            : <Text style={{fontSize:10,color:'#ff2400',marginLeft:16,marginTop:2}}>
                                {I18n.t('Invalid title')}
                            </Text>
                    }
                    <View style={styles.createLabelPanel}>
                        <Text style={[styles.createLabelText,{marginLeft:16}]}>{I18n.t('Event Description')}</Text>
                    </View>
                    {audio}
                </ScrollView>

                <BusyIndicator ref={"indicator"} title={I18n.t('Creating')}/>
                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
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
        flexDirection: 'row',
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
    showPanel: {
        width: width,
        //height: height,
        backgroundColor: 'gray',
        overflow:'hidden'
    },
    imageBottomPanel: {
        position:'absolute',
        flexDirection: 'row',
        width: width,
        height: 30,
        backgroundColor: 'rgba(0,0,0,0.6)',
        bottom: 0,
        left:0
    },
    editCancelPanel:{
        marginLeft: width/4-40 ,
        flexDirection: 'row',
        width: 80,
        height: 30
    },
    editIcon: {
        width: 14,
        height: 14,
        marginTop: 8
    },
    editCancelText: {
        fontSize: 12,
        color: '#ffffff',
        marginTop: 7,
        marginLeft: 20,
        lineHeight: 16
    },
    imageLine: {
        width: 1,
        height: 30,
        marginLeft: width/4-40,
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        opacity: 0.6
    },
    editConfirmPanel: {
        marginLeft: width/4-40 ,
        flexDirection: 'row',
        width: 80,
        height: 30
    },
    editConfirmText:{
        fontSize: 12,
        color: '#ffffff',
        marginTop: 7,
        marginLeft: 20,
        lineHeight: 16
    },
    colorPanel:{
        position: 'absolute',
        right: 20,
        top: 20
    },
    actionButtonIcon: {
        fontSize: 20,
        height: 0,
        color: 'white'
    },
    createLabelPanel:{
        height: 44,
        backgroundColor: '#ffffff'
    },
    createLabelText: {
        fontSize: 14,
        marginTop: 16
    },
    tabSwitchPanel: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        height: 46,
        backgroundColor: '#ffffff'
    },
    eventNormal:{
        width: 140,
        height: 46,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#dcdcdc',
        backgroundColor: '#ffffff'
    },
    eventSelected:{
        width: 140,
        height: 46,
        borderRadius: 10,
        backgroundColor: ColorStyles.COLOR_MAIN_RED
    },
    textNormal: {
        fontSize: 14,
        color: '#dcdcdc',
        textAlignVertical: 'center',
        height:46,
        alignSelf: 'center',
        lineHeight: 46
    },
    textSelected: {
        fontSize: 16,
        height:46,
        color: '#ffffff',
        alignSelf: 'center',
        textAlignVertical: 'center',
        lineHeight: 46
    },
    issueName:{
        width: width-32,
        height: 44,
        borderWidth: 1,
        marginLeft: 16,
        borderRadius: 2,
        paddingLeft:10
    },
    issueDescription:{
        width: width-100,
        borderWidth: 1,
        borderColor: '#dcdcdc',
        marginRight: 23,
        paddingTop:8,
        paddingBottom:8,
        paddingVertical: 0,
        borderRadius: 2,
        paddingLeft: 10
    },
    audioRecordIcon:{
        width: 48,
        height: 48,
        marginRight: 12
    },
    audioPanel:{
        width: width-100,
        height: 46,
        borderColor: '#dcdcdc',
        marginRight: 23,
        paddingVertical: 0,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        overflow: 'hidden'
    },
    canvasPage: {
        flex: 1,
        elevation: 2,
        marginTop: 0,
        marginBottom: 0,
        backgroundColor: 'transparent',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.75,
        shadowRadius: 2
    }
});
