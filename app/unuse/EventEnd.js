import React, {Component} from 'react';
import { Actions } from 'react-native-router-flux';

import {
    Dimensions,
    Image,
    TextInput,
    StyleSheet, Text, TouchableOpacity,
    View, DeviceEventEmitter, ImageBackground,
    Platform,FlatList
} from 'react-native';


import HttpUtil from "../utils/HttpUtil";
import {EMITTER_EVENT, MEDIA_AUDIO, MEDIA_IMAGE, MEDIA_VIDEO, MODULE_EVENT} from "../common/Constant";
import OSSUtil from "../utils/OSSUtil";
let {width} =  Dimensions.get('screen');
import RNStatusBar from '../components/RNStatusBar';
import BusyIndicator from "../components/BusyIndicator";
import SoundPlayer from "../components/SoundPlayer";
import I18n from 'react-native-i18n';
import StringFilter from "../common/StringFilter";
import GlobalParam from "../common/GlobalParam";
import NetInfoIndicator from "../components/NetInfoIndicator";
import RouteMgr from "../notification/RouteMgr";
import SourceInput from "../components/SourceInput";
import Toast from "react-native-easy-toast";

export default class EventEnd extends Component {

    constructor(props) {
        super(props);

        this.state = {
            data:{
                attachment:[],
                uiType:'text'
            },
            showTip:false
        };
        this.onText = this.onText.bind(this);
    }

    onText(text){
        let data = this.state.data;
        data.description = StringFilter.all(text,200);
        this.setState({data: data,showTip:false});
    }

    onPicture(path){
        if (this.state.data.attachment.length < GlobalParam.MAX_ATTACHMENT){
            let data = this.state.data;
            data.attachment.unshift({
                mediaPath: path,
                mediaType: 2
            });
            this.setState({data: data,showTip:false});
        }
        else{
            this.refs.toast.show(I18n.t('Up to 5 attachments'), 3000);
        }
    }

    onLocalPictures(path){
        if (this.state.data.attachment.length + path.length <= GlobalParam.MAX_ATTACHMENT){
            let data = this.state.data;
            path.forEach((item,index)=>{
                data.attachment.unshift({
                    mediaPath: item,
                    mediaType: 2
                });
            });
            this.setState({data: data,showTip:false});
        }
        else{
            this.refs.toast.show(I18n.t('Up to 5 attachments'), 3000);
        }
    }

    onVideo(path){
        let videos = this.state.data.attachment.filter(p => p.mediaType == 1);
        if (videos.length < GlobalParam.MAX_VIDEO){
            if(this.state.data.attachment.length < GlobalParam.MAX_ATTACHMENT){
                let data = this.state.data;
                data.attachment.unshift({
                     mediaPath: path,
                     mediaType: 1
                 });
                this.setState({data: data,showTip:false});
            }
            else{
                this.refs.toast.show(I18n.t('Up to 5 attachments'), 3000);
            }
        }
        else{
            this.refs.toast.show(I18n.t('Video limit'), 3000);
        }
    }

    onAudio(audioPath){
        let data = this.state.data;
        data.audioPath = audioPath;
        this.setState({data: data,showTip:false});
        let audioPlay = this.refs.audioPlay;
        audioPlay.setAudioPath(audioPath);
    }

    audioDeleteClick(){
        this.onAudio(null);
    }

    mediaDeleteClick(item,index){
        let data = this.state.data;
        data.attachment.splice(index,1);
        this.setState({data: data});
    }

    onGoAudio(){
        let data = this.state.data;
        data.uiType  = 'audio';
        this.setState({data: data});
    }

    onGoText(){
        let data = this.state.data;
        data.uiType  = 'text';
        this.setState({data: data});
    }

    onCamera(){
        let data = this.state.data;
        data.uiType  = 'picture';
        this.setState({data: data});
    }

    onConfirm(){
        let submit = this.state.data;
        if (  (submit.description == null || submit.description == '')
            && submit.audioPath == null
            && submit.attachment.length == 0
        ){
            this.setState({showTip:true})
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
                if(item.mediaType === 1){
                    var ossKey = OSSUtil.formatOssUrl(MODULE_EVENT,MEDIA_VIDEO,storeId,deviceId+index.toString());
                    pArray.push(OSSUtil.upload(ossKey,item.mediaPath));
                    let addMedia = {};
                    addMedia.mediaType = 1;
                    addMedia.url = OSSUtil.formatRemoteUrl(ossKey);
                    attachment.push(addMedia);
                }
                else if (item.mediaType === 2){
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
                comment.status = this.props.status;
                request.comment = comment;

                HttpUtil.post('event/comment/add',request)
                    .then(res => {
                        this.refs.indicator.close();
                        DeviceEventEmitter.emit('onRefresh');
                        DeviceEventEmitter.emit(EMITTER_EVENT,0);
                        Actions.pop();
                    })
                    .catch(err=>{
                        this.refs.indicator.close();
                    })
            }).catch(error=>{
                this.refs.indicator.close();
            })
        }).catch((error)=>{
        });
    }

    renderAttachment = ({ item,index }) => {
        if (item.mediaType === 1){ childShow  = (
            <ImageBackground style={{width:150,height:100,alignItems:'center'}} source={require('../assets/images/image_videoThumbnail.png')} resizeMode='cover'>
                <TouchableOpacity onPress={() => Actions.push('videoPlayer',{uri: item.mediaPath})}>
                    <Image style={{width:35,height:35,marginTop:30}} source={require('../assets/images/pic_play_icon.png')} resizeMode='contain'/>
                </TouchableOpacity>
            </ImageBackground>
        )
        }
        else if (item.mediaType === 2){ childShow  = (
            <TouchableOpacity onPress={() => Actions.push('pictureViewer',{uri: item.mediaPath})}>
                <Image style={{width:150,height:100}} source={{uri: item.mediaPath}} resizeMode='cover'/>
            </TouchableOpacity>
        )
        }

        return (
            <View style={{flexDirection: 'row',justifyContent:'flex-start', marginLeft:15, width:150}}>
                {childShow}
                <TouchableOpacity style={{position:'absolute',width:20,height:20,left:130}} activeOpacity={0.5} onPress={() => {this.mediaDeleteClick(item,index)}}>
                    <Image style={{width:20,height:20}} source={require('../assets/images/img_media_delete.png')}></Image>
                </TouchableOpacity>
            </View>
        )};

    render() {
        let audio = null;
        let audioDelele = null;
        if (this.state.data.audioPath != null){ audioDelele = (
            <TouchableOpacity activeOpcity={0.5} onPress={()=>this.audioDeleteClick()}>
                <Image style={{width:24,height:24,marginLeft:12}} source={require('../assets/images/img_audio_delete.png')}></Image>
            </TouchableOpacity>
        )
        }
        if (this.state.data.uiType == 'text'){ audio = (
            <TextInput style={styles.issueDescription} multiline onChangeText={this.onText} placeholder={I18n.t('Provide details')}
                    value={this.state.data.description}/>
        )
        }
        else if (this.state.data.uiType == 'audio'){ audio = (
            <View style={styles.audioPanel}>
                    <SoundPlayer ref={'audioPlay'} input={true} path={this.state.data.audioPath}/>
                    {audioDelele}
            </View>
        )
        }
        else if (this.state.data.uiType == 'picture'){ audio = (
            <View style={styles.audioPanel}/>
        )
        }

        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={Actions.pop}>
                        <View style={{width:width/3,height:48}}>
                            <Image source={RouteMgr.getRenderIcon()} style={styles.NavBarImage}/>
                        </View>
                    </TouchableOpacity>
                    <View style={{width:width/3,height:48,alignItems: 'center'}}>
                        <Text style={[styles.NavBarTitle,{fontSize:18}]}>{this.props.title}</Text>
                    </View>
                    <TouchableOpacity activeOpacity={1} onPress={()=>this.onConfirm()} >
                        <View style={{width:width/3,height:48,flexDirection: 'row',justifyContent:'flex-end'}}>
                            <Text style={[styles.NavBarTitle,{fontSize:14,marginRight:12}]}>{I18n.t('Send')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <NetInfoIndicator/>
                <View style={{marginLeft: 16,marginTop:20}}>
                    <SourceInput type={'big'}
                                 onPicture={this.onPicture.bind(this)}
                                 onVideo={this.onVideo.bind(this)}
                                 onAudio={this.onAudio.bind(this)}
                                 onPressCamera= {this.onCamera.bind(this)}
                                 onPressAudio={this.onGoAudio.bind(this)}
                                 onPressText={this.onGoText.bind(this)}
                                 onLocalPictures={this.onLocalPictures.bind(this)}
                    />
                </View>
                <View style={{flexDirection: 'row',alignItems:'center',marginTop: 15,marginLeft: 15}}>
                    {audio}
                </View>

                <View style={{marginTop:15,marginRight:16}}>
                 <FlatList    data={this.state.data.attachment}
                              extraData={this.state}
                              keyExtractor={(item, index) => index.toString()}
                              renderItem={this.renderAttachment}
                              horizontal={true}
                              showsHorizontalScrollIndicator={false}
                    />
                </View>
                {
                    this.state.showTip ? <Text style={{fontSize:10,marginTop:4, marginLeft:15,color:'#ff2400'}}>{I18n.t('Enter info')}</Text> :null
                }
                <BusyIndicator ref={"indicator"} title={I18n.t('Submitting')}/>
                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
            </View>
        );
    }
}

var styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
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
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    },
    issueDescription:{
        width: width-32,
        height: 46,
        borderWidth: 1,
        borderColor: '#dcdcdc',
        marginRight: 23,
        paddingVertical: 0,
        borderRadius: 2,
        paddingLeft:10,
        ...Platform.select({
            ios:{paddingTop:13}
        })
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
    audioRecordIcon:{
        width: 48,
        height: 48,
        marginRight: 12
    },
});
