import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image,TouchableWithoutFeedback,
  TextInput,InputAccessoryView,Button,KeyboardAvoidingView,ScrollView,ImageBackground,
   DeviceEventEmitter, TouchableOpacity,FlatList} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import Toast, {DURATION} from 'react-native-easy-toast'
import { Dialog } from 'react-native-simple-dialogs';
const WIDTH = Dimensions.get('screen').width;
const HEIGHT = Dimensions.get('window').height;
import * as lib from '../../common/PositionLib';
import NavigationBar from 'react-native-navbar-color'
import PropTypes from 'prop-types';
const inputAccessoryViewID = 'uniqueID';
import { Keyboard, KeyboardEvent } from 'react-native';
import addInmage from '../../assets/images/comment/btn_add.png';
import microphoneImage from '../../assets/images/comment/btn_microphone.png';
import cancelImage from '../../assets/images/comment/btn_cancel.png';

import imgMicrophoneGreen  from '../../assets/images/comment/btn_microphone_green.png';
import imgTakePicture from '../../assets/images/comment/icon_take_picture.png';
import imgTakeVideo from '../../assets/images/comment/icon_take_video.png';
import imgSelectPicture from '../../assets/images/comment/icon_select_picture.png';
import imgSelectVideo from '../../assets/images/comment/icon_select_video.png';

import imgViceSmall from '../../assets/images/comment/icon_voice_small.png';
import imgPlaySmall from '../../assets/images/comment/icon_voice_play.png';
import imgPauseSmall from '../../assets/images/comment/icon_pause_small.png';
import imgCloseSmall from '../../assets/images/comment/icon_text_delete.png';
import imgPlaygingLong from '../../assets/images/comment/voice_play_long.png';
import imgPlaygingLong0 from '../../assets/images/comment/voice_play_long_0.png';
import imgPlaygingLong1 from '../../assets/images/comment/voice_play_long_1.png';
import imgPlaygingLong2 from '../../assets/images/comment/voice_play_long_2.png';
import imgPlaygingLong3 from '../../assets/images/comment/voice_play_long_3.png';
import imgPlaygingLong4 from '../../assets/images/comment/voice_play_long_4.png';

import imgPlaygingShort from '../../assets/images/comment/voice_play_short.png';
import imgPlaygingShort0 from '../../assets/images/comment/voice_play_short_0.png';
import imgPlaygingShort1 from '../../assets/images/comment/voice_play_short_1.png';
import imgPlaygingShort2 from '../../assets/images/comment/voice_play_short_2.png';
import imgPlaygingShort3 from '../../assets/images/comment/voice_play_short_3.png';
import imgPlaygingShort4 from '../../assets/images/comment/voice_play_short_4.png';

import imgShortGif from '../../assets/images/comment/short.gif';
import imgLongGif from '../../assets/images/comment/long.gif';
import RepeatImage from './RepeatImage'

import {Card} from 'react-native-shadow-cards';
import Sound from 'react-native-sound';
import SoundUtil from "../../utils/SoundUtil";
import EzvizPlayer from '../ezvizPlayer/EzvizPlayer';
import {EMITTER_SOUND_STOP} from "../../common/Constant";


import moment from 'moment'
import TouchableOpacityEx from "../../touchables/TouchableOpacityEx";
export default class CommentAudioItem extends Component {
    static propTypes = {
        style: PropTypes.style
    };

    static defaultProps = {
        style: {}
    };

    state = {
        playing:false,
        audioDuration:0,
    };
    componentDidMount() {
        let path = this.props.data.url;
        if (path != null){
            this.setAudioPath(path);
        }
    }

    componentWillMount(){
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_SOUND_STOP,
            ()=>{
                console.log("On Sounce Sleep")
                if(this.state.playing){
                  EzvizPlayer.pausePlayer();
                  SoundUtil.stop();
                  this.setState({playing:false})
                }

            });
    }

    componentWillUnmount(){
        SoundUtil.stop();
        this.notifyEmitter && this.notifyEmitter.remove();
    }
    setAudioPath(path){
        try {
            if(SoundUtil.checkPath(path)){
                let sound = new Sound(path, null, (error) => {
                    if (error) {
                        console.log(error);
                        this.setState({audioDuration:0});
                    }
                    else {
                        let maxLength = 180;
                        if (this.props.maxLength != null){
                            maxLength = this.props.maxLength;
                        }
                        let duration = Math.floor(sound.getDuration());
                        if (duration === 0)
                            duration = 0;
                        let radio =  maxLength/5.5;
                        let length = Math.sqrt(duration)*radio;
                        if (length < 50)
                            length = 50;
                        if (length > maxLength)
                            length = maxLength;
                        console.log('AUdio actual len='+duration)
                        this.setState({audioDuration:duration,picLength:length,path:path});

                    }
                    sound.release();
                });
            }
            else {
                this.setState({audioDuration:0});
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    async play(path){
        const {playing,audioDuration} =this.state;
        const {data} = this.props;
        var time =data.duration?data.duration:audioDuration;
        if(playing){
        //  console.log("Pause")
          EzvizPlayer.pausePlayer();
          SoundUtil.stop();
          clearTimeout(this.timer)
          this.setState({playing:false})
        }
        else{
          DeviceEventEmitter.emit(EMITTER_SOUND_STOP);
          EzvizPlayer.pausePlayer();
          SoundUtil.play(path);
          this.setState({playing:true})

          clearTimeout(this.timer)
          this.timer = setTimeout(function(){

            if(this.state.playing){
              EzvizPlayer.pausePlayer();
              SoundUtil.stop();
              this.setState({playing:false})
            }
          }.bind(this),(time+1)*1000);

        }
    }
    showDuration(d){
        if(d==0)return ' '
        return d<10?'00:0'+d:'00:'+d
    }
    render() {
        const {data,showDelete,style} =this.props;
        const {playing,audioDuration} = this.state;
        var time =data.duration?data.duration:audioDuration;
        return (
          <View style={[styles.container, style]}>
              <View style={styles.topZone}>
                    {   showDelete ?<View style={{flex:1}}/>:null}
                    {
                        showDelete ? <TouchableOpacity activeOpacity={1}
                                    onPress={()=>{this.props.onDelete(data)}}>
                              <Image  style={{height:16,width:16,marginTop:12,marginRight:8}} resizeMode={"stretch"} source={imgCloseSmall}/>
                        </TouchableOpacity> : null
                    }

                    <Card  elevation={1} opacity={0.1}  style={{height:40,width:time>=15?256:182,paddingTop:3,paddingBottom:3,alignItems:'center'
                    ,borderRadius:8,flexDirection:'row',padding:5,flex:0,justifyContent:"flex-end"}}>
                        <Text style={{fontSize:14,color:'#6E6E6E',marginLeft:10,marginRight:12}}>{(time?this.showDuration(time):this.showDuration(audioDuration))}</Text>
                        { playing?<ImageBackground resizeMode={'contain'}   source={time>=15?imgLongGif:imgShortGif}
                           style={{width:time>=15?149:78,height:12}}/>:
                          <Image   resizeMode={'contain'}   source={time>=15?imgPlaygingLong:imgPlaygingShort}/>}
                        <View style={{backgroundColor:'#F2F2F2',width:2,height:30,marginLeft:6,marginRight:3}}/>
                        <TouchableOpacityEx activeOpacity={1}
                              style={{width:28,justifyContent:'center',alignItems:'center'}}
                              onPress={()=>{this.play(data.url)}}>
                              <Image    style={{height:16,width:14,marginLeft:2}} resizeMode={"stretch"} source={playing?imgPauseSmall:imgPlaySmall}/>
                        </TouchableOpacityEx>
                    </Card>

              </View>
          </View>

        )
    }
}

const styles = StyleSheet.create({
  container: {
    width:'100%',
    height:45,
    borderRadius:5,
    padding:5,
    flexDirection:'column',
    justifyContent:'center',
    alignItems:'flex-start',marginTop:2,
    backgroundColor:'#F9F9F9'},
    topZone:{
        flexDirection:"row",
        justifyContent:'flex-start',
        alignItems:'flex-start',
        width:"100%",
        paddingLeft:5,
    },
   bottomZone:{
     flexDirection:"row",
     justifyContent:'flex-start',
     alignItems:'center',
     height:15,
     paddingLeft:5,
     width:"100%",
   },
});
