import React, {Component} from 'react';
import PropTypes from 'prop-types'
import {
    View,
    TouchableOpacity,
    Image,
    Text,
    Platform,
    DeviceEventEmitter,
    Dimensions,
    StyleSheet,
} from 'react-native';
import RNFS, {DocumentDirectoryPath} from "react-native-fs";
import {launchImageLibrary,launchCamera} from "react-native-image-picker";
import { Actions } from 'react-native-router-flux';
import AlertUtil from "../utils/AlertUtil";
import I18n from 'react-native-i18n';
import AudioIndicator from "./AudioIndicator";
import {AudioRecorder, AudioUtils} from 'react-native-audio';
import {check,request,PERMISSIONS,RESULTS} from 'react-native-permissions';
import SYImagePicker from 'react-native-syan-image-picker';
import ModalBox from 'react-native-modalbox';
import * as lib from '../common/PositionLib';
import {EMITTER_MODAL_CLOSE} from "../common/Constant";
import moment from 'moment';
let {width} =  Dimensions.get('screen');

const PicSource = {
    picture: {
        check:require('../assets/images/photo_icon_select.png'),
        uncheck:require('../assets/images/photo_icon_nomal.png'),
    },
    video: {
        check:require('../assets/images/video_icon_select.png'),
        uncheck:require('../assets/images/video_icon_nomal.png'),
    },
    audio: {
        check:require('../assets/images/voice_icon_select.png'),
        uncheck:require('../assets/images/voice_icon_nomal.png'),
    },
    text: {
        check:require('../assets/images/text_icon_select.png'),
        uncheck:require('../assets/images/text_icon_normal1.png'),
    },
    picker:{
        check:require('../assets/images/picker_icon_nomal.png'),
        uncheck:require('../assets/images/picker_icon_nomal.png'),
    }
};

const MAX_VIDEO_SIZE = 20*1024*1024;
const MAX_PICTURE_SIZE = 10*1024*1024;

export default class SourceInput extends Component {

    static propTypes = {
        onPicture:PropTypes.func,
        onVideo:PropTypes.func,
        onAudio:PropTypes.func,
        onLocalPictures:PropTypes.func,
        onPressCamera:PropTypes.func,
        onPressAudio:PropTypes.func,
        onPressText:PropTypes.func
    };

    constructor(props) {
        super(props);
        this.state = {
            pictrueSource:PicSource.picture.uncheck,
            videoSource:PicSource.video.uncheck,
            pickerSource:PicSource.picker.uncheck,
            audioSource:PicSource.audio.uncheck,
            textSource:PicSource.text.check,
        };
        this.isRecordingAudio = false;
    }

    componentDidMount() {
        if (this.props.initType){
            this.changeUI(this.props.initType);
        }
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_MODAL_CLOSE,
            ()=>{
                this.refs.modalBox && this.refs.modalBox.close();
            });
    }

    componentWillMount(){
        this.notifyEmitter && this.notifyEmitter.remove();
        this.refs.modalBox && this.refs.modalBox.close();
    }

    changeUI(type){
       if(type == 'picture'){
         if(this.props.onPressCamera){
            this.props.onPressCamera();
         }
         this.setState({
             pictrueSource: PicSource.picture.check,
             videoSource:PicSource.video.uncheck,
             audioSource:PicSource.audio.uncheck,
             textSource:PicSource.text.uncheck,
        });
       }
       else if (type == 'video'){
        if(this.props.onPressCamera){
            this.props.onPressCamera();
        }
        this.setState({
            pictrueSource: PicSource.picture.uncheck,
            videoSource:PicSource.video.check,
            audioSource:PicSource.audio.uncheck,
            textSource:PicSource.text.uncheck,
         });
       }
       else if (type == 'audio'){
        if (this.props.onPressAudio){
            this.props.onPressAudio();
        }
        this.setState({
            pictrueSource: PicSource.picture.uncheck,
            videoSource:PicSource.video.uncheck,
            audioSource:PicSource.audio.check,
            textSource:PicSource.text.uncheck,
         });
       }
       else if (type == 'text'){
        if(this.props.onPressText){
            this.props.onPressText();
        }
        this.setState({
            pictrueSource: PicSource.picture.uncheck,
            videoSource:PicSource.video.uncheck,
            audioSource:PicSource.audio.uncheck,
            textSource:PicSource.text.check,
         });
       }
    }

    onPicture(){
        //this.changeUI('picture');
        if (this.props.disable != null){
            return;
        }

        request(Platform.select({
            android: PERMISSIONS.ANDROID.CAMERA,
            ios: PERMISSIONS.IOS.CAMERA,
        }),
        ).then(result => {
         if (result ===  RESULTS.GRANTED){
            if(Platform.OS === 'ios'){
                request(PERMISSIONS.IOS.MICROPHONE)
                .then(result => {
                    if (result ===  RESULTS.GRANTED){
                        const options = {
                            mediaType:'mixed',
                            quality:0.8,
                            maxWidth:1080,
                            maxHeight:1080,
                            videoQuality:'medium',
                            durationLimit:15,
                            includeExtra:true,
                            noData:true,
                            includeExtra:true,
                            storageOptions: {skipBackup:true, path:'images',cameraRoll:false}
                        };
                        launchCamera(options,(response) => {
                            if (response.didCancel || response.error) {}
                            else {
                                if(response.type){
                                    this.picEmitter = DeviceEventEmitter.addListener('onPictureOut', this.onPictureFun.bind(this));
                                    let uri = response.uri.replace('file://','');
                                    Actions.push('imageCanvas',{type:'onPictureOut', uri:uri, orientation:response.height > response.width});
                                }
                                else{
                                    if (this.props.onVideo){
                                        this.props.onVideo(response.uri);
                                    }
                                }
                            }
                        });
                    }
                    else {
                        AlertUtil.alert(I18n.t('Microphone'));
                    }
                });
            }
            else{
                const options = {
                    mediaType:'photo',
                    quality:0.8,
                    maxWidth:1080,
                    maxHeight:1080,
                    noData:true,
                    includeExtra:true,
                    storageOptions: {skipBackup:true, path:'images',cameraRoll:false}
                };
                launchCamera(options,(response) => {
                    if (response.didCancel || response.error) {}
                    else {
                        this.orientation = (response.height > response.width);
                        this.destPath = DocumentDirectoryPath + `/${moment().format('x')}.jpg`;
                        RNFS.copyFile(response.uri, this.destPath).then(()=>{
                                this.picEmitter = DeviceEventEmitter.addListener('onPictureOut', this.onPictureFun.bind(this));
                                Actions.push('imageCanvas',{type:'onPictureOut', uri:this.destPath, orientation:this.orientation});
                            }).catch(error=>{})
                    }
                });
            }
         }
         else{
             AlertUtil.alert(I18n.t('Camera'));
         }
    });
    }

    onPictureFun(path){
        Actions.pop();
        this.picEmitter && this.picEmitter.remove();
        if(path != null){
            if (this.props.onPicture){
                this.props.onPicture(path);
            }
        }
    }

    onVideo(){
        //this.changeUI('video');
        if (this.props.disable != null){
            return;
        }
        request(Platform.select({
            android: PERMISSIONS.ANDROID.CAMERA,
            ios: PERMISSIONS.IOS.CAMERA,
        }),
        ).then(result => {
         if (result ===  RESULTS.GRANTED){
             request(Platform.select({
                     android: PERMISSIONS.ANDROID.RECORD_AUDIO,
                     ios: PERMISSIONS.IOS.MICROPHONE,
                 }),
             ).then(result => {
                 if (result ===  RESULTS.GRANTED){
                     this.videoEmitter = DeviceEventEmitter.addListener('onVideoOut', this.onVideoFun.bind(this));
                     Actions.push('recordVideo');
                 }
                 else {
                     AlertUtil.alert(I18n.t('Microphone'));
                 }
             });
         }
         else{
             AlertUtil.alert(I18n.t('Camera'));
         }
       });
    }

    onVideoFun(path){
        this.videoEmitter && this.videoEmitter.remove();
        if (this.props.onVideo){
            if(path){
                this.props.onVideo(path);
            }
        }
    }

    async onStartAudio(){
        if (this.props.disable != null){
            return;
        }
        this.changeUI('audio');
        check(Platform.select({
                android: PERMISSIONS.ANDROID.RECORD_AUDIO,
                ios: PERMISSIONS.IOS.MICROPHONE,
            }),
        ).then(result => {
            if (result ===  RESULTS.GRANTED){
                this.startAudioRecording();
            }
            else{
                request(Platform.select({
                        android: PERMISSIONS.ANDROID.RECORD_AUDIO,
                        ios: PERMISSIONS.IOS.MICROPHONE,
                    }),
                ).then(result => {
                    if (result !==  RESULTS.GRANTED){
                        AlertUtil.alert(I18n.t('Microphone'));
                    }
                });
            }
        });
    }

    onStopAudio(){
        setTimeout(()=>{
            this.onPressOut();
        },1000);
    }

    async startAudioRecording(){
        let path = this.prepareRecordingPath();
        this.isRecordingAudio = true;
        if (Platform.OS === 'ios') {
            AudioRecorder.onFinished = (data) => {
                this.onFinishAudioRecording(path);
            };
        }
        try {
            this.refs.indicator.open();
            this.timer = setTimeout(() => {
                this.onPressOut();
            }, 31000);
            await AudioRecorder.startRecording();
        } catch (error) {
            this.isRecordingAudio = false;
        }
    }

    async onPressOut(){
        try {
            if(this.isRecordingAudio){
                this.timer && clearTimeout(this.timer);
                this.isRecordingAudio = false;
                let filePath = await AudioRecorder.stopRecording();
                if (Platform.OS === 'android') {
                    this.onFinishAudioRecording(filePath);
                }
                this.refs.indicator.close();
            }
        } catch (error) {
            console.error(error);
        }
    }

    onFinishAudioRecording(filePath) {
        if (this.props.onAudio){
            this.props.onAudio(filePath);
        }
    }

    prepareRecordingPath(){
        let date = new Date();
        let time = date.getTime();
        let path = AudioUtils.DocumentDirectoryPath + `/${time}.aac`;
        AudioRecorder.prepareRecordingAtPath(path, {
            SampleRate: 22050,
            Channels: 1,
            AudioQuality: "Medium",
            AudioEncoding: "aac",
            AudioEncodingBitRate: 32000
        });
        return path;
    }

    onPressAudio(){
        if (this.props.disable != null){
            return;
        }
        this.changeUI('audio');
    }

    onPressText(){
        if (this.props.disable != null){
            return;
        }
        this.changeUI('text');
    }

    pickerPicture(){
        this.refs.modalBox.close();
        setTimeout(()=>{
            SYImagePicker.asyncShowImagePicker({
                imageCount:10
            })
            .then(photos => {
              let pictures = [];
              let flag = false;
              photos.forEach((item,index)=>{
                    if (item.size > MAX_PICTURE_SIZE){
                        flag = true;
                    }
                    else{
                        if (item.uri){
                            pictures.push('file://'+item.uri);
                        }
                    }
               });
               if (flag){
                   DeviceEventEmitter.emit('OnShowIndicator',I18n.t('Picture size limit'));
               }
               if (pictures.length > 0){
                    if (this.props.onLocalPictures){
                        this.props.onLocalPictures(pictures);
                    }
                }
            })
            .catch(err => {
            });
        },500)
    }

    pickerVideo(){
        this.refs.modalBox.close();
        setTimeout(()=>{
            const options = {
                includeExtra:true,
                mediaType:'video'
            };
            launchImageLibrary(options,async(response) => {
                if (response.didCancel || response.error) {}
                else {
                    let flag = true;
                    try{
                        let file = await RNFS.stat(response.uri);
                        if (file.size > MAX_VIDEO_SIZE){
                            DeviceEventEmitter.emit('OnShowIndicator',I18n.t('Video size limit'));
                            flag = false;
                       }
                    }
                    catch(error){}
                    if(flag){
                        if(this.props.onVideo){
                            this.props.onVideo(response.uri);
                        }
                    }
                }
            });
        },500)
    }

    onPicker(){
        if (this.props.disable != null){
            return;
        }
        this.refs.modalBox.open();
    }

    cancel(){
        this.refs.modalBox.close();
    }

    render() {
        let totalwidth = this.props.width ? this.props.width: width-32;
        let activeOpacity = this.props.disable ? 1: 0.2;

        let video = null;
        if (Platform.OS === 'android'){ video = (
            <TouchableOpacity  onPress={()=>this.onVideo()} activeOpacity={activeOpacity}>
               <Image  style={{width:50,height:32,marginLeft:10}} source={this.state.videoSource}/>
            </TouchableOpacity>
        )
        }

        let picker = null;
        if (this.props.picker == null || this.props.picker == true ){ picker = (
            <TouchableOpacity  onPress={()=>this.onPicker()} activeOpacity={activeOpacity}>
               <Image  style={{width:50,height:32,marginLeft:10}} source={this.state.pickerSource}/>
            </TouchableOpacity>
        )
        }

        return (
            <View>
            <View style={{flexDirection: 'row', justifyContent:'space-around', alignItems:'center',height:32,backgroundColor:'#F7F8FC',borderRadius:25,width:totalwidth}}>
                <TouchableOpacity  onPress={()=>this.onPicture()} activeOpacity={activeOpacity}>
                    <Image  style={{width:50,height:32,marginLeft:10}} source={this.state.pictrueSource}/>
                </TouchableOpacity>
                {video}
                {picker}
                <TouchableOpacity  onLongPress={()=>this.onStartAudio()} onPressOut={()=>this.onStopAudio()} onPress={()=>this.onPressAudio()} activeOpacity={activeOpacity}>
                    <Image  style={{width:50,height:32,marginLeft:10}} source={this.state.audioSource}/>
                </TouchableOpacity>
                <TouchableOpacity onPress={()=>this.onPressText()} activeOpacity={activeOpacity}>
                    <Image  style={{width:50,height:32,marginLeft:10,marginRight:10}} source={this.state.textSource}/>
                </TouchableOpacity>
                <AudioIndicator ref={"indicator"} title={I18n.t('Recording')}/>
                </View>
                <ModalBox style={styles.modalBox} ref={"modalBox"} position={"bottom"}
                      isDisabled={false}
                      swipeToClose={false}
                      backdropPressToClose={true}
                      backButtonClose={false}
                      coverScreen={true}>
                <View>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.pickerPicture.bind(this)}>
                        <View style={styles.itemPanel}>
                           <Text style={styles.itemText}>{I18n.t('Album picture')}</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{width:width,height:1,backgroundColor:'#D8D8D8'}}/>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.pickerVideo.bind(this)}>
                        <View style={styles.itemPanel}>
                           <Text style={styles.itemText}>{I18n.t('Album video')}</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{width:width,height:10,backgroundColor:'#E1E1E1'}}/>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.cancel.bind(this)}>
                        <View style={styles.itemPanel}>
                           <Text style={styles.itemText}>{I18n.t('Cancel')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ModalBox>
            </View>
        );
    }
}


const styles = StyleSheet.create({
    modalBox: {
        width: width,
        height:156 + lib.defaultBottomSpace(),
    },
    itemPanel:{
        width: width,
        height: 50,
        backgroundColor: 'white',
        justifyContent:'center',
        alignItems:'center'
    },
    itemText:{
        fontSize: 14,
        color: '#232324',
        alignContent:'center'
    },
});
