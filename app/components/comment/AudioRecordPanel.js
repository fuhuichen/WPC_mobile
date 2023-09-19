import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image,TouchableWithoutFeedback,Animated,
  TextInput,InputAccessoryView,Button,KeyboardAvoidingView,ScrollView,ImageBackground,
   DeviceEventEmitter, TouchableOpacity,FlatList,PanResponder} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import Toast, {DURATION} from 'react-native-easy-toast'
import {AudioRecorder, AudioUtils} from 'react-native-audio';
import {check,request,PERMISSIONS,RESULTS} from 'react-native-permissions';

const WIDTH = Dimensions.get('screen').width;
const HEIGHT = Dimensions.get('window').height;

import imgRecordLeft from '../../assets/images/comment/icon_group_left.png';
import imgRecordCenter from '../../assets/images/comment/icon_circle_record.png';
import imgRecordRight from '../../assets/images/comment/icon_group_right.png';
import imgVoice from '../../assets/images/comment/icon_voice.png';
import {EMITTER_SOUND_STOP} from "../../common/Constant";

export default class AudioRecordPanel extends Component {

    state = {
      isAudioRecording:false,
      audioRecordInfo:{},
      count:0,
    };

    componentDidMount() {
      check(Platform.select({
          android: PERMISSIONS.ANDROID.RECORD_AUDIO,
          ios: PERMISSIONS.IOS.MICROPHONE,
      }),
      ).then(result => {
          if (result !== RESULTS.GRANTED) {
            request(Platform.select({
                android: PERMISSIONS.ANDROID.RECORD_AUDIO,
                ios: PERMISSIONS.IOS.MICROPHONE,
              }),
            ).then(result => {
              if (result !== RESULTS.GRANTED){
                  this.showError('Microphone');
              }
            });
          }
      });
    }
    componentWillMount(){
      this._panResponder = PanResponder.create({
        onStartShouldSetPanResponder: (evt, gestureState) => true,
        onStartShouldSetPanResponderCapture: (evt, gestureState) =>
        true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) =>
        true,

      onPanResponderGrant: (evt, gestureState) => {

         if(!this.state.isAudioRecording){
            console.log("Grand")
           this.state.press = true;
           this.onStartAudio()
         }

        // The gesture has started. Show visual feedback so the user knows
        // what is happening!
        // gestureState.d{x,y} will be set to zero now
      },
      onPanResponderMove: (evt, gestureState) => {
        // console.log("Move")
        // The most recent move distance is gestureState.move{X,Y}
        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
      },
      onPanResponderTerminationRequest: (evt, gestureState) =>
        false,
      onPanResponderRelease: (evt, gestureState) => {

         if(this.state.press){
           console.log("Release")
           this.state.press = false;
           this.onStopAudio()
         }

        // The user has released all touches while this view is the
        // responder. This typically means a gesture has succeeded
      },
      onPanResponderTerminate: (evt, gestureState) => {
        console.log("TEerminate")
        // Another component has become the responder, so this gesture
        // should be cancelled
      },
      onShouldBlockNativeResponder: (evt, gestureState) => {

        // Returns whether this component should block native components from becoming the JS
        // responder. Returns true by default. Is currently only supported on android.
        return true;
      }
        });
    }
    componentWillUnmount(){

    }
    componentWillReceiveProps(nextProp){

    }
    doFinishRecord(path,duration){
      console.log("Do Finish Record Len="+duration)
      if(path && duration>=1){
        if(this.props.onStopAudio)this.props.onStopAudio(path,duration);
      }
      else{
        this.showError(I18n.t("Audio is Too Short"))
        if(this.props.onStopAudio)this.props.onStopAudio(null,0,"Error Too Short");
      }
    }
    showError(e){
      if(this.props.onError)this.props.onError(e)
    }
    async startAudioRecording(){

        if(this.props.isOverLimit){
          return this.showError(I18n.t("Audio Limit"));
        }
        if(this.state.isAudioRecording){
          console.log("Already Recording")
          return ;
        }
        this.state.count +=1;
        console.log("Start record count"+this.state.count)
        this.state.isAudioRecording = true;
        var audioRecordInfo={duration:0}
        let path = this.prepareRecordingPath();

        this.setState({audioRecordInfo,isAudioRecording:true})
        this.props.onStartAudio()
        if (Platform.OS === 'ios') {
            AudioRecorder.onFinished = (data) => {
                console.log("On IOS Audio Record Finished")
                this.doFinishRecord(path,this.state.audioRecordInfo.duration)
                this.setState({isAudioRecording:false})
            };
        }
        try {
            console.log("Start Audio Rrecord")
            DeviceEventEmitter.emit(EMITTER_SOUND_STOP);
            await AudioRecorder.startRecording();

            clearInterval(this.audioTimer)
            this.audioTimer= setInterval(function(){
                var audioRecordInfo  = this.state.audioRecordInfo
                audioRecordInfo.duration  +=1;
                if(audioRecordInfo.duration>=30){
                  this.onPressOut()
                }
                this.setState({audioRecordInfo})
            }.bind(this),1000)
        } catch (error) {
            this.showError(error);
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

    async onStartAudio() {
      /*check(Platform.select({
              android: PERMISSIONS.ANDROID.RECORD_AUDIO,
              ios: PERMISSIONS.IOS.MICROPHONE,
          }),
      ).then(result => {
          if (result === RESULTS.GRANTED) {
            this.startAudioRecording();
          } else {
            request(Platform.select({
                android: PERMISSIONS.ANDROID.RECORD_AUDIO,
                ios: PERMISSIONS.IOS.MICROPHONE,
              }),
            ).then(result => {
              if (result !==  RESULTS.GRANTED){
                  this.showError('Microphone');
              }
              else{
                  this.startAudioRecording();
              }
            });
          }
      });*/

      this.startAudioRecording();
    }
    async onPressOut(){
      const {isAudioRecording,audioRecordInfo} =this.state;
        try {
            if(this.state.isAudioRecording){
                console.log("Stop record count"+this.state.count)
                clearInterval(this.audioTimer)
              //  console.log("Do Stop Audio Recording 1")
                let filePath = await AudioRecorder.stopRecording();
                if (Platform.OS === 'android') {
                    this.doFinishRecord(filePath,audioRecordInfo.duration)
                    setTimeout(function(){
                      this.setState({isAudioRecording:false})
                    }.bind(this),800)
                }
              //  console.log("Do Stop Audio Recording 2")

            }
            else{
              console.log("No thing happen")
            }
        } catch (error) {
            this.showError(I18n.t("Audio is Too Short"))
        }
    }
    async onStopAudio(){

      setTimeout(()=>{
        //  console.log("STop audio delay")
          this.onPressOut();
      },300);

    }
    toMMSS(secs){
    var sec_num = parseInt(secs, 10)
    var minutes = Math.floor(sec_num / 60) % 60
    var seconds = sec_num % 60

    return [minutes,seconds]
        .map(v => v < 10 ? "0" + v : v)
        .join(":")
    }
    getDisplaySec(sec){
        if(sec >=21){
           return I18n.t('Count Down') + ' ' +(30- sec) + I18n.t('Second');
        }
        else{
           return this.toMMSS(sec);
        }
    }
    render() {
        const {isAudioRecording,audioRecordInfo} =this.state;
        return (
          <View style={{backgroundColor:'white'}}>
            {isAudioRecording?(<View style={{width:WIDTH,height:50,flexDirection:'column',justifyContent:'flex-end',
                                alignItems:'center',backgroundColor:'#FFF',paddingBottom:5}}>
                            <View style={{height:25,flexDirection:'row',justifyContent:'center',borderRadius:10,paddingLeft:10,paddingRight:10,
                                              alignItems:'center',backgroundColor:'#D23636'}}>
                                    <Text style={{color:'#FFF',fontSize:15}}>{this.getDisplaySec(audioRecordInfo.duration)}</Text>
                            </View>
                      <View style={styles.triangle}></View>
            </View>):
            (<View style={{width:WIDTH,height:50,flexDirection:'column',justifyContent:'flex-end',
                          alignItems:'center',backgroundColor:'#FFF',paddingBottom:5}}>
            </View>)}
            <View style={{height:WIDTH/3+50 }}>
              <View style={{width:WIDTH,height:WIDTH/3,flexDirection:'row',justifyContent:'center',
                            alignItems:'center',backgroundColor:'#FFF'}}>
                  <Image  resizeMode={'contain'}  style={{width:WIDTH/10,marginRight:WIDTH/22}}  source={imgRecordLeft}/>
                  <View {...this._panResponder.panHandlers} >
                      <View style={{width:WIDTH/3, borderRadius:WIDTH/3,borderWidth:5,borderColor:isAudioRecording?'#D23636':'#C2C6CC',height:WIDTH/3,
                      justifyContent:'center',
                                    alignItems:'center'}}>
                            <Image  resizeMode={'contain'}  style={{width:WIDTH/12}}  source={imgVoice}/>
                      </View>
                  </View>
                  <Image  resizeMode={'contain'}  style={{width:WIDTH/10,marginLeft:WIDTH/22}}  source={imgRecordRight}/>
              </View>
            </View>
          </View>

        )
    }
}

const styles = StyleSheet.create({
  container: {
  },
  loading:{
      marginTop:0
  },
  content:{
      padding:0
  },
  overlay:{
      backgroundColor:'#000000CC',
      opacity: 1,
  },
  dialog: {
      backgroundColor: 'transparent',
      width:WIDTH,
      flex:1,
      position: 'absolute',
      left:0,
      marginTop:200,
      bottom:0,

  },
  main:{
      backgroundColor:'#FFFFFF',
      borderRadius:10,
      marginLeft:15,
      flex:1,
      width:WIDTH-30,
      paddingTop:10,
      paddingBottom:10,
      paddingLeft:15,
      paddingRight:15,
      marginBottom:8,
  },
  title:{
    flexDirection:"row",
    justifyContent:'flex-start'
  },
  quickmenu:{
    paddingLeft:15,
    backgroundColor:'#ffffff',
    height:40,
    flexDirection:"row",
    alignItems:'center',
    justifyContent:'flex-start'
  },
  quickButton:{
    fontSize:12,borderWidth:1,borderColor:'#000000',paddingRight:10,
    paddingLeft:10,marginRight:5,height:25,borderRadius:12,paddingTop:4,paddingBottom:4
  },
  bottomZone:{
      flexDirection:"row",
      justifyContent:'flex-start',
      padding:3,
      backgroundColor:'#FFFFFF',
      alignItems:'center',
      height:45,
      width:WIDTH,
  },
  imageButton:{
     justifyContent:'center',alignItems:'center',width:32,height:28,
  },
  selectIconContainer:{
     justifyContent:'center',alignItems:'center',flex:1,height:28,
  },
  triangle: {
     width: 0,
     height: 0,
     backgroundColor: 'transparent',
     borderStyle: 'solid',
     borderTopWidth: 7,
     borderRightWidth: 5,
     borderBottomWidth: 0,
     borderLeftWidth: 5,
     borderBottomColor: 'transparent',
     borderRightColor: 'transparent',
     borderTopColor: '#D23636',
     borderLeftColor: 'transparent',
   },
});
