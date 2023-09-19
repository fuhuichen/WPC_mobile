import React, {Component } from 'react';
import {Dimensions,Platform,View,TouchableOpacity,DeviceEventEmitter,Text,Image,ActivityIndicator,AppState} from 'react-native';
import RNFetchBlob from "rn-fetch-blob";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCView,
  mediaDevices
} from 'react-native-webrtc';
import ViewShot from "react-native-view-shot";
import Orientation from 'react-native-orientation-locker';
import {getBottomSpace, getStatusBarHeight, isIphoneX} from "react-native-iphone-x-helper";
import dismissKeyboard from "react-native-dismiss-keyboard";
import PropType from "prop-types";
import PlayerUtil from '../utils/PlayerUtil';
import I18n from 'react-native-i18n';
import Video from "react-native-video";
import { VLCPlayer} from "react-native-vlc-media-player";
import NetInfo from '@react-native-community/netinfo';
import {EMITTER_PLAYER_STOP} from "../common/Constant";
import KeepAwake from 'react-native-keep-awake'
import RNFS from "react-native-fs";
import GlobalParam from "../common/GlobalParam";
const BESEYE_URL= "https://oregon-p1-stage-api-1.beseye.com"
const API_PATH= "/open_api/v1/live_stream_info/"
const DD = "{Mobile}_{YH-EXTERNAL}_{395e6b65-b612-4791-9ae2-99910f606126}";
const ICESERVER = [{ url:"turn:13.250.13.83:3478?transport=udp",
        username:"YzYNCouZM1mhqhmseWk6", password:"YzYNCouZM1mhqhmseWk6" }];

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class BeseyeVideo extends Component {

  static propTypes ={
    onFullScreen:PropType.func,
    createEvent: PropType.func,
    dashReady:PropType.func,
    dashError:PropType.func,
}

  constructor(props) {
    super(props);
    this.props = props;
    this.state ={
      fullScreen:false,
      height:220,
      paused:true,
      muted:true,
      dashurl:null,
     
      currentState:'blank',
      isPlaying:false,
      stream:null,info:{},
      snapshotOption: null,
      enableCapture: true,
      enableOperate:true
    }

    this.realType = true;
    this.lastHeight = 220;
    this.VCAMID = '';
    this.currentTime = null;
    this.play_list = [];
    this.lastEndTime = null;
    this.pauseStatus = false;
  }

  componentWillMount() {
    this.unsubscribe = NetInfo.addEventListener(state=>{
        this.onNetChange(state.isConnected);
    });
    AppState.addEventListener('change', this.onAppStateChange);
    this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_PLAYER_STOP, (value)=>{
        AppState.removeEventListener('change', this.onAppStateChange);
        if(this.state.fullScreen) {
            this.onFullScreen();
        }
        value && this.stop();
        setTimeout(()=>{
            AppState.addEventListener('change', this.onAppStateChange);
        },200);
    });
}


  componentDidMount() {
    DeviceEventEmitter.addListener('WebRTCViewSnapshotResult', (data)=>this.onWebRTCViewSnapshotResult(data));
    KeepAwake.activate();
 /*    mediaDevices.getUserMedia({audio:true})
        .then((stream) => {
            console.log('got stream', stream);
            return stream;
        })
        .then((stream) => {
        })
        .catch((err) => {
            console.error('Something wrong in capture stream', err);
        }) */
    setTimeout(() => {
      this.props.dashReady();
  }, 500);
  }

  componentWillUnmount() {
     this.stop();
     KeepAwake.deactivate();
     DeviceEventEmitter.removeAllListeners('WebRTCViewSnapshotResult');
     AppState.removeEventListener('change', this.onAppStateChange);
     this.dirtyTimer && clearTimeout(this.dirtyTimer);
     this.unsubscribe && this.unsubscribe();
     this.notifyEmitter && this.notifyEmitter.remove();
  }

  onNetChange(isConnected){
    if (!isConnected){     
        if (this.realType){
           this.stop(); 
        }
        else{
          this.setState({paused:true});
        }
    }
    else {         
        if(this.realType){               
          this.startVideo(this.VCAMID,null,null);
        }
        else{
          this.setState({paused:false});
        }      
    }
}

onAppStateChange = (nextAppState) => {
  if(nextAppState == 'active'){
      this.doDirtyWork();
      if(this.realType){
        if (!this.state.paused){
          this.startVideo(this.VCAMID,null,null);
        }    
      }
      else {
        this.setState({paused:false});
      }
  }
  else if (Platform.OS === 'android' && nextAppState == 'background' || nextAppState == 'inactive'){
      if(this.realType){
        this.state.pc && this.state.pc.close();
        this.state.ws && this.state.ws.close();
        this.setState({stream:null});
      }
      else{
        this.setState({paused:true});
      }
  }
}

doDirtyWork(){
  setTimeout(() => {
      if(!this.state.paused){
          this.dirtyTimer && clearTimeout(this.dirtyTimer);
          this.dirtyTimer = setTimeout(() => {
              if (AppState.currentState === 'active'){
                  if (!this.state.paused){
                      this.onPlay();
                  }                 
              }
          }, 300000);
      }
  }, 500);
}

  stop(){
    this.state.pc && this.state.pc.close();
    this.state.ws && this.state.ws.close();
    this.setState({paused:true,currentState:'blank',stream:null});
  }

  setPlayEnable(status){
    this.setState({enableOperate:status});
  }

  onPauseSound(status){
    if(status){
        if (!this.state.muted){
            this.pauseStatus = true;
            this.setState({muted:true});
        }
    }
    else{
        if (this.pauseStatus && this.state.muted){
            this.pauseStatus = false;
            this.setState({muted:false});
        }
    }    
  }

  startVideo(ivsId,channelId,time){
    if((this.state.currentState == 'loading' || this.state.currentState == 'play')
       && this.VCAMID == ivsId && time == null){
      return;
    }
    this.stop();
    this.VCAMID = ivsId;
    this.setState({currentState:'loading',enableOperate:true});
    if (time){
      this.realType = false;
      this.doPlayBack(time);
    }
    else{
      this.realType = true;
      this.state.pc = this.initPeerConnection();
      this.init();
      this.doDirtyWork();
    } 
    this.timerOut && clearTimeout(this.timerOut);
    this.timerOut= setTimeout(() => {
      this.setState({currentState:'error'});
    }, 30000);
  }

  onLoad(data) {
    console.log('***** onload: ');
    this.timerOut && clearTimeout(this.timerOut);
  }

  onEnd(){
    if(this.lastEndTime != this.currentTime){
      this.lastEndTime = this.currentTime;
      console.log('***** onEnd: '+ this.currentTime);
      this.setState({paused:true});
      if (this.play_list.length > 0){
        this.doGetPlayInfo(this.play_list[0]);
        this.play_list.shift();;
      }
    }
  }

  onError(error){
    this.timerOut && clearTimeout(this.timerOut);
    this.setState({currentState:'error'});
    console.log('***** error1: ' + JSON.stringify(error));
  }

  onProgress(data){
    this.currentTime = data.currentTime;
}

  getLocation(href) {
    var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
    return match && {
        href: href,
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port: match[4],
        pathname: match[5],
        search: match[6],
        hash: match[7]
    }
}
   doGetPlayInfo(info){ 
      let token = PlayerUtil.beseyeAccessToken; 
      let url = this.getLocation(info.server);
      var dashurl = encodeURI(`https://${url.host}/playlist?host=${url.hostname}&token=${token}&dd=${DD}&vci=${this.VCAMID}&videoArray=${info.stream}`);
      console.log('***** dashurl: ' + dashurl)
      this.setState({dashurl:dashurl,currentState:'playback',paused:false});
      if(Platform.OS === 'android'){
         this.timerOut && clearTimeout(this.timerOut);
      }
    }
  
    doPlayBack(time){
      let token = PlayerUtil.beseyeAccessToken; 
      var duration = 300000;
      var url = `/open_api/v1/dvr_playlist_info/${this.VCAMID}?start_time=${time}&duration=${duration}`   
      this.getAPIDash(BESEYE_URL,url,token,DD  ).then((response) => response.json()).then(response => {
          console.log("***** Get Play list: " + JSON.stringify(response));
          if(response.play_list && response.play_list.length > 0){
            this.doGetPlayInfo(response.play_list[0]);
            response.play_list.shift();
            this.play_list = response.play_list;
          }
    
      }).catch(err =>{
        console.log(err)
      });
    }

  init(){
    let token = PlayerUtil.beseyeAccessToken;
    this.getAPI( BESEYE_URL,API_PATH+this.VCAMID,token,DD ).then(response => {
      console.log('****** BESEYE_URL api result: ' + JSON.stringify(response));
      if(response.application_name &&response.stream ){
        let info = {
          applicationName:response.application_name,
          streamName: response.stream
        }
        this.setState({info})
        var ws_url = response.ws_url;
        var url = `${ws_url}?token=${token}&vci=${this.VCAMID}&dd=${DD}`;
        var encoded_url =  encodeURI(url)
        console.log("WebSocket URL="+encoded_url)
        this.initWebSocket(encoded_url,info)
      }
     }).catch(err =>{
        console.log(err)
      });
  }

  getAPI(url,api,token,dd ){
    return RNFetchBlob.fetch('GET',url+ api
    , {Authorization: "Bearer "+token,
       Accept: "application/json",
       "Accept-Charset": "utf-8",
       "Accept-Encoding": "gzip, deflate",
       "Bes-Client-Devudid":dd  } ).then((res)=>
      {
         return res.json();
      })
  }

  getAPIDash(url,api,token,dd){
   return fetch(url+ api, {
     method: 'GET',
     headers: {
       Authorization: "Bearer "+token,
       "Accept-Charset": "utf-8",dashurl:null,
       "Accept-Encoding": "gzip",
        Accept: "application/json",
        "Bes-Client-Devudid":dd  }
   })
}


createOfferRequest(info){
  var obj = {
      "direction": "play",
      "command": "getOffer",
      "streamInfo": {
        "applicationName": info.applicationName,
        "streamName": info.streamName,
      }
  }
  return obj;
}


initPeerConnection(){
  var pc = new RTCPeerConnection();
  pc.onaddstream = function(event) {
    //console.log(event.stream)
    if(event.stream){
      this.setState({stream:event.stream})
    }
  }.bind(this);

  pc.onsignalingstatechange = function(event) {
    console.log("pc.signalingState="+pc.signalingState)
    const {info,sessionId,ws} = this.state;

    if(pc.signalingState == "have-remote-offer"){
      pc.createAnswer().then(function(answer) {
      //  console.log("PC Create Answer "+JSON.stringify(answer))
        pc.setLocalDescription(answer).then(function(){
            console.log('setLocalDescription');
            console.log("Send Response")
            const resobj = {
                "direction": "play",
                "command": "sendResponse",
                "sdp":answer,
                "streamInfo": {
                  "applicationName": info.applicationName,
                  "streamName": info.streamName,
                  "sessionId":sessionId
                }

            }
            console.log(resobj)
            ws.send(JSON.stringify( resobj ));
          });
      })
    }
  }.bind(this);

  pc.onicecandidate = function( ev ) {
  //  console.log("Ice Connections State="+pc.iceConnectionState)
    //console.log("onicecandidate" + ev)
    if (ev.candidate) {
        console.log("On Ice Candidate"+JSON.stringify(ev.candidate));
        pc.addIceCandidate(ev.candidate)
    }
  }

  // pc.oniceconnectionstatechange = function(event) {
  //   console.log("*********** Ice connection state="+pc.iceConnectionState)
  //   if(pc.iceConnectionState == 'connected'){
  //      this.setState({isPlaying:true,paused:false});
  //   }
  // };
  pc.oniceconnectionstatechange = this.stateChange.bind(this);
  return pc;
}

stateChange(event){
  console.log("*********** Ice connection state="+this.state.pc.iceConnectionState)
  if(this.state.pc.iceConnectionState == 'connected'){
     this.timerOut && clearTimeout(this.timerOut);
     this.setState({currentState:'play',paused:false});
  }
}


initWebSocket(encoded_url,info){
    const {pc} = this.state;
    var ws = new WebSocket(encoded_url);
    ws.onopen = () => {
        var request  = JSON.stringify(this.createOfferRequest(info))
        console.log("Send Offer "+request)
        ws.send(request);
    };

    ws.onmessage = (e) => {
      //console.log("WS OnMessage="+e.data)
      var res = JSON.parse(e.data)
      if(res.streamInfo && res.streamInfo.sessionId){
        var sessionId = res.streamInfo.sessionId;
        this.setState({sessionId})
        console.log("Set Session ID="+sessionId);
      }
      if(res && res.sdp){
        console.log("Set Remote Discriptor");
        pc.setRemoteDescription(new RTCSessionDescription(res.sdp),function(){
        });
      }
      if(res && res.iceCandidates){
        for(var k in res.iceCandidates){
            console.log("Add Remote Candidatae="+res.iceCandidates[k])
            pc.addIceCandidate(res.iceCandidates[k])
        }
      }

    };

    ws.onerror = (e) => {
      console.log("WS ERROR "+e.message )
    };

    ws.onclose = (e) => {
      console.log("WS CLOSE",e.code, e.reason);
    };
    this.setState({ws})

}

   onWebRTCViewSnapshotResult(data) {
    console.log("********** onWebRTCViewSnapshotResult")
    // --- reset option after we got event. It's okey to not reset, since it will trigger a new screenshot as long as props did change again. (likely use shallow compare.)
    this.setState({ snapshotOption: null , enableCapture:true });
    if (data.file) {
        console.log("File to save"+data.file);
        let date = new Date();
        let time = date.getTime();
        let path = RNFS.DocumentDirectoryPath + `/${time}.jpeg`;
        RNFS.copyFile(data.file,path)
        .then((success) => {
          if(this.state.fullScreen){
            this.onFullScreen();
            setTimeout(() => {
                this.props.createEvent(true,path);
              }, 500);
            }
            else {
               this.props.createEvent(true,path);
           }            
        })
        .catch((err) => {
        });   
    }
   }

   onPress(){
     this.onPressTakeSnapshot()
   }

   async checkScreenshotPermission(){
      return true;
   }

   async onPressTakeSnapshot() {
      if (this.state.currentState != 'play' && this.state.currentState != 'playback' ){
          return;
      }
      if(!GlobalParam.onAttachment()){
        return;
     }
      await this.setState({enableCapture:false}); 
      if (Platform.OS === 'android' && this.state.currentState == 'play') {
        let date = new Date();
        let time = date.getTime().toString();
        let hasEnoughPermission = await this.checkScreenshotPermission();
        if (!hasEnoughPermission) {
            return false;
        }
       // --- if snapshotOption != null and changed, the remote RTCView will trigger snapshot once and fire an event for result.
        let snapshotOption = {
            id: time, // --- use any value you think it's unique for each screenshot
            saveTarget: 'cameraRoll',
        };
        console.log("Set snapshotOption")
        this.setState({ snapshotOption: snapshotOption });
        } else {
          this.refs.viewShot.capture().then(uri => {
            var RNFS = require('react-native-fs');
            let date = new Date();
            let time = date.getTime();
            let path = RNFS.DocumentDirectoryPath + `/${time}.jpeg`;
             RNFS.copyFile(uri, path )
                  .then((success) => {
                    if(this.state.fullScreen){
                     this.onFullScreen();
                     setTimeout(() => {
                          this.setState({enableCapture:true});
                         this.props.createEvent(true,path);
                       }, 500);
                     }
                     else {
                        this.setState({enableCapture:true});
                        this.props.createEvent(true,path);
                    }
                 })
                 .catch((err) => {
                   this.setState({enableCapture:true});
                   console.log(err.message);
                 });
        })
        }
   }


   async onPlay(){
    let paused = !this.state.paused;
    if (this.realType === true){
        if (paused){
            this.stop();   
        }
        else {
            this.startVideo(this.VCAMID,null,null);
        }
    }
    else{
      if (paused){
        this.setState({paused:true});
      }
      else {
        this.setState({paused:false});
      }
    }
    this.doDirtyWork();
  }

  onFullScreen(){
    let fullScreen = !this.state.fullScreen;
        if (fullScreen){
            Orientation.getOrientation((err, orientation) => {
                dismissKeyboard();
                if(orientation !== 'PORTRAIT'){
                    Orientation.lockToPortrait();
                }
                if (Platform.OS === 'android'){
                    Orientation.lockToLandscapeLeft();
                }
                else {
                    Orientation.lockToLandscapeRight();
                }
                this.props.onFullScreen(true);
                this.lastHeight = this.state.height;
                let heightX = width-45-getBottomSpace()-getStatusBarHeight();
                this.setState({height:heightX,fullScreen:true});
            });

        }
        else {
            Orientation.getOrientation((err, orientation) => {
                if(orientation !== 'LANDSCAPE'){
                    if (Platform.OS === 'android'){
                        Orientation.lockToLandscapeLeft();
                    }
                    else {
                        Orientation.lockToLandscapeRight();
                    }
                }
                Orientation.lockToPortrait();
                this.props.onFullScreen(false);
                this.setState({height:this.lastHeight,fullScreen:false});
            });
        }
  }
   
   render () {
        let backBtn = null;
        let barHeight = this.state.fullScreen ? 45:35;
        let btnSize = this.state.fullScreen ? 28:22;
        let marginSize = this.state.fullScreen ? 20:15;
        if ( !this.realType ){ backBtn =(
            <TouchableOpacity onPress={()=> {
                this.setState({paused:false});
                this.player && this.player.seek(this.currentTime-10);
            }}>
                <Image source={require('../assets/images/playback_backward_btn.png')} style={{height:btnSize,width:btnSize}}/>
            </TouchableOpacity>
        )
        }
        else { backBtn =(
            <View style={{height:btnSize,width:btnSize}}>
            </View>
        )
        }

        let forwardBtn = null;
        if ( !this.realType ){ forwardBtn =(
            <TouchableOpacity onPress={()=> {
                this.setState({paused:false});
                this.player && this.player.seek(this.currentTime+10);
            }}>
                <Image source={require('../assets/images/playback_forward_btn.png')} style={{marginLeft:marginSize,height:btnSize,width:btnSize}}/>
            </TouchableOpacity>
        )
        }
        else { forwardBtn =(
            <View style={{marginLeft:marginSize,height:btnSize,width:btnSize}}>
            </View>
        )
        }

        let pointerChannel = this.state.enableCapture === true ? 'auto':'none';

        let captureBtn = null;
        if ( this.props.showOperate != false ){ captureBtn =(
          <View pointerEvents={pointerChannel}>
            <TouchableOpacity onPress={()=> {
                this.onPressTakeSnapshot();
            }}>
                <Image source={require('../assets/images/preview_camera_btn.png')} style={{marginLeft:marginSize,height:btnSize,width:btnSize}}/>
            </TouchableOpacity>
          </View>
        )
        }

        let fullChannelBtn = null;
        if (this.state.fullScreen){ fullChannelBtn =(
            <TouchableOpacity onPress={()=> {
                this.props.onFullChannel();
            }}>
                <Image source={require('../assets/images/fullChannel.png')} style={{height:btnSize,width:btnSize}}/>
            </TouchableOpacity>
        )
        }

        let sourcePlay = this.state.paused ? require('../assets/images/preview_play_btn.png'):require('../assets/images/stoplay_btn.png');
        let sourceSound = this.state.muted ?require('../assets/images/preview_unvoice_btn.png'):require('../assets/images/preview_voice_btn.png');
        let sourceFullScreen = this.state.fullScreen ? require('../assets/images/fullscreen_exit.png'):require('../assets/images/preview_enlarge.png');

      if(this.state.stream){
        var tracks = this.state.stream.getAudioTracks();
        console.log('track: '+ tracks);
        if(tracks[0] ){
          tracks[0].enabled = !this.state.muted;
        }
      }

      let videoPlayer = null;
        if ( this.state.currentState == 'play' ){ videoPlayer =(
          <ViewShot ref="viewShot" options={{ format: "jpg", quality: 0.9 }}>
          <RTCView streamURL={this.state.stream?this.state.stream.toURL():null}
                   snapshotOption={(this.state.stream ? this.state.snapshotOption : null)}
                   style={{width:'100%',height:this.state.height,backgroundColor: 'black'}}/>
          </ViewShot>
        )
        }
        else if ( this.state.currentState == 'blank' ){ videoPlayer =(
            <View style={{width:'100%',height:this.state.height,backgroundColor:'black',justifyContent:'center',alignItems:'center'}}>
            </View>
        )
        }
         
        else if ( this.state.currentState == 'loading' ) { videoPlayer =(
          <View style={{width:'100%',height:this.state.height,backgroundColor:'black',justifyContent:'center',alignItems:'center'}}>
              <ActivityIndicator animating={true} size="large" color='#ffffff'/>
          </View>
      )
      }

      else if ( this.state.currentState == 'error' ) { videoPlayer =(
        <View style={{width:'100%',height:this.state.height,backgroundColor:'black',justifyContent:'center',alignItems:'center'}}>
            <Text style={{fontSize: 16, color: 'white', textAlignVertical:'center'}}>{I18n.t('Video load error')}</Text>
        </View>
    )
    }

    else if ( this.state.currentState == 'playback' && Platform.OS === 'android' ) { videoPlayer =(
      <ViewShot ref="viewShot" options={{ format: "jpg", quality: 0.9 }}>
        <Video style={{width: '100%', height:this.state.height,backgroundColor: 'black'}}
             ref={(ref) => {this.player = ref}}
             onLoad={this.onLoad.bind(this)}
             onEnd={this.onEnd.bind(this)}
             onError={this.onError.bind(this)}
             onProgress={this.onProgress.bind(this)}
             muted = {this.state.muted}
             paused={this.state.paused}
             source={{uri:this.state.dashurl,type:'mpd'}}
             bufferConfig={{
                 minBufferMs: 15000,
                 maxBufferMs: 50000,
                 bufferForPlaybackMs: 2500,
                 bufferForPlaybackAfterRebufferMs: 5000
            }}
       />
      </ViewShot>    
  )
  }

  else if ( this.state.currentState == 'playback' && Platform.OS === 'ios' ) { videoPlayer =(
    <ViewShot ref="viewShot" options={{ format: "jpg", quality: 0.9 }}>
      <VLCPlayer style={{width: '100%', height:this.state.height,backgroundColor: 'black'}}
           ref={(ref) => {this.player = ref}}
           onLoadStart={this.onLoad.bind(this)}
           onEnd={this.onEnd.bind(this)}
           onError={this.onError.bind(this)}
           onProgress={this.onProgress.bind(this)}
           paused={this.state.paused}
           source={{uri:this.state.dashurl}}
     />
    </ViewShot>    
  )
  }

      let pointer = this.state.enableOperate === true ? 'auto':'none';
      
      return (
           <View style={{backgroundColor: '#F5FCFF'}}>
              {videoPlayer}
              <View pointerEvents={pointer} style={{width:'100%',flexDirection:'row',justifyContent:'space-between',backgroundColor:'black',opacity: 0.7,height:barHeight,alignItems:'center'}}>
                <View style={{flexDirection:'row'}}>
                    {backBtn}
                    <TouchableOpacity onPress={this.onPlay.bind(this)}>
                        <Image source={sourcePlay} style={{marginLeft:marginSize,height:btnSize,width:btnSize}}/>
                    </TouchableOpacity>
                    {forwardBtn}
                </View>

                <View style={{flexDirection:'row'}}>
                    {fullChannelBtn}
                    {captureBtn}
                    <TouchableOpacity onPress={()=> {
                       if (this.state.currentState == 'play' || this.state.currentState == 'playback'){
                          this.setState({muted:!this.state.muted});
                       }      
                    }}>
                        <Image source={sourceSound} style={{marginLeft:marginSize,height:btnSize,width:btnSize}}/>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={this.onFullScreen.bind(this)}>
                        <Image source={sourceFullScreen} style={{marginLeft: marginSize,height:btnSize,width:btnSize,marginRight:marginSize}}/>
                    </TouchableOpacity>
                </View>
            </View>
           </View>
    );
    }
}


