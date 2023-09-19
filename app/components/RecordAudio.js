import React, {Component} from 'react';
import PropTypes from 'prop-types'

import {
    StyleSheet,
    View,
    TouchableOpacity,
    Image,
    Platform
} from 'react-native';

import {AudioRecorder, AudioUtils} from 'react-native-audio';
import AudioIndicator from "./AudioIndicator";
import AlertUtil from "../utils/AlertUtil";
import I18n from 'react-native-i18n';
import EzvizPlayer from './ezvizPlayer/EzvizPlayer';
import {check,request,PERMISSIONS,RESULTS} from 'react-native-permissions';

export default class RecordAudio extends Component {
    static propTypes = {
        audioPressOut: PropTypes.func,
        onPress:PropTypes.func,
        disable: PropTypes.bool
    };

    constructor(props) {
        super(props);
        this.state = {
            status:false,
            audioPath :null,
            iconPath:require('../assets/images/record_icon_normal.png'),
        };
    }

    _finishRecording(filePath) {
        this.props.audioPressOut(filePath);
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

    async startRecording(){
        let path = this.prepareRecordingPath();
        this.setState({iconPath:require('../assets/images/record_icon_pressed.png'),status:true});
        if (Platform.OS === 'ios') {
            AudioRecorder.onFinished = (data) => {
                this._finishRecording(path);
            };
        }
        try {
            this.refs.indicator.open();
            this.timer = setTimeout(() => {
                this.onPressOut();
            }, 31000);
            await AudioRecorder.startRecording();
        } catch (error) {
            this.setState({status:false});
        }
    }

    async onPressIn(){
        if (this.props.disable != null){
            return;
        }

        check(Platform.select({
                android: PERMISSIONS.ANDROID.RECORD_AUDIO,
                ios: PERMISSIONS.IOS.MICROPHONE,
            }),
        ).then(result => {
            if (result ===  RESULTS.GRANTED){
                EzvizPlayer.pausePlayer();
                this.startRecording();
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

    async onPressOut(){
        try {
            if(this.state.status){
                this.timer && clearTimeout(this.timer);
                this.setState({audioPath:filePath,iconPath:require('../assets/images/record_icon_normal.png'),status:false});
                let filePath = await AudioRecorder.stopRecording();
                if (Platform.OS === 'android') {
                    this._finishRecording(filePath);
                }
                this.refs.indicator.close();
            }
        } catch (error) {
            console.error(error);
        }
    }

    pressOut(){
        (this.props.disable == null) && setTimeout(()=>{
            this.onPressOut();
        },1000);
    }

    onPress(){
        (this.props.disable == null) && this.props.onPress();
    }

    render() {
        let size = 48;
        if (this.props.size != null){
            size = this.props.size;
        }
        return (
            <View style={styles.container}>
                <TouchableOpacity  onLongPress={()=>this.onPressIn()} onPressOut={()=>this.pressOut()} onPress={()=>this.onPress()}
                    activeOpacity={(this.props.disable != null) ? 1 : 0}>
                    <Image  style={{width:size,height:size}} source={this.state.iconPath}/>
                </TouchableOpacity>
                <AudioIndicator ref={"indicator"} title={I18n.t('Recording')}/>
            </View>
        );
    }
}

var styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
