import React, { Component } from 'react';
import { Dimensions, View, TouchableOpacity, StyleSheet, DeviceEventEmitter, Text, Image, AppState, ActivityIndicator, Platform} from 'react-native';
import RNFetchBlob from "rn-fetch-blob";
import { VLCPlayer } from 'react-native-vlc-media-player';
import ViewShot from "react-native-view-shot";
import Orientation from 'react-native-orientation-locker';
import NetInfo from '@react-native-community/netinfo';
import I18n from 'react-native-i18n';
import { getBottomSpace, getStatusBarHeight, isIphoneX } from "react-native-iphone-x-helper";
import { EMITTER_PLAYER_STOP } from "../common/Constant";
import dismissKeyboard from "react-native-dismiss-keyboard";
import KeepAwake from 'react-native-keep-awake'
import PropType from "prop-types";
import PlayerUtil from '../utils/PlayerUtil';
import Video from "react-native-video";
import GlobalParam from "../common/GlobalParam";

let { width, height } = Dimensions.get('window');

export default class SkywatchPlayer extends Component {

  static propTypes = {
    onFullScreen: PropType.func,
    createEvent: PropType.func,
    dashReady: PropType.func,
    dashError: PropType.func,
  }

  constructor(props) {
    super(props);

    this.state = {
      device: null,
      uri: null,
      fullScreen: false,
      height: 220,
      paused: true,
      currentState: 'blank',
      muted:true,
      enableCapture: true,
      enableOperate: true
    };

    this.realType = true;
    this.apikey = PlayerUtil.skywatchAccessToken;
    this.deviceId = '';
    this.lastPostion = 0;
    this.duration = 0;
    this.playList = [];
    this.pauseStatus = false;
  }

  componentWillMount() {
    this.unsubscribe = NetInfo.addEventListener(state => {
      this.onNetChange(state.isConnected);
    });
    AppState.addEventListener('change', this.onAppStateChange);
    this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_PLAYER_STOP, (value) => {
      AppState.removeEventListener('change', this.onAppStateChange);
      if (this.state.fullScreen) {
        this.onFullScreen();
      }
      value && this.stop();
      setTimeout(() => {
        AppState.addEventListener('change', this.onAppStateChange);
      }, 200);
    });
  }

  componentWillUnmount() {
    this.stop();
    KeepAwake.deactivate();
    AppState.removeEventListener('change', this.onAppStateChange);
    this.dirtyTimer && clearTimeout(this.dirtyTimer);
    this.unsubscribe && this.unsubscribe();
    this.notifyEmitter && this.notifyEmitter.remove();
  }

  componentDidMount() {
    KeepAwake.activate();
    console.log("SkywatchPlayer componentDidMount")
    setTimeout(() => {
      this.props.dashReady();
    }, 500);
  }

  stop() {
    if (this.realType) {
      this.setState({ url: null });
    }
    this.setState({ paused: true, currentState: 'blank' });
  }

  onAppStateChange = (nextAppState) => {
    if (nextAppState == 'active') {
      this.doDirtyWork();
      if (this.realType) {
        if (!this.state.paused) {
          this.startVideo(this.deviceId, null, null);
        }
      }
      else {
        this.setState({ paused: false });
      }
    }
    else if (Platform.OS === 'android' && nextAppState == 'background' || nextAppState == 'inactive') {
      if (this.realType) {
        this.setState({ url: null });
      }
      else {
        this.setState({ paused: true });
      }
    }
  }

  onNetChange(isConnected) {
    if (!isConnected) {
      if (this.realType) {
        this.stop();
      }
      else {
        this.setState({ paused: true });
      }
    }
    else {
      if (this.realType) {
        this.startVideo(this.deviceId, null, null);
      }
      else {
        this.setState({ paused: false });
      }
    }
  }

  doDirtyWork() {
    setTimeout(() => {
      if (!this.state.paused) {
        this.dirtyTimer && clearTimeout(this.dirtyTimer);
        this.dirtyTimer = setTimeout(() => {
          if (AppState.currentState === 'active') {
            if (!this.state.paused) {
              this.onPlay();
            }
          }
        }, 300000);
      }
    }, 500);
  }

  setPlayEnable(status) {
    this.setState({ enableOperate: status });
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

  startVideo(ivsId, channelId, time) {
    if (ivsId == '' || PlayerUtil.skywatchAccessToken == '') {
      return;
    }
    if ((this.state.currentState == 'loading' || this.state.currentState == 'play')
      && this.deviceId == ivsId && time == null) {
      return;
    }
    this.stop();
    this.deviceId = ivsId;
    this.setState({ currentState: 'loading', enableOperate: true });
    if (time) {
      this.realType = false;
      this.getRecordList(time);
    }
    else {
      this.realType = true;
      this.getLiveStreaming()
      this.doDirtyWork();
    }
    this.timerOut && clearTimeout(this.timerOut);
    this.timerOut = setTimeout(() => {
      this.setState({ currentState: 'error' });
    }, 30000);
  }


  getLiveStreaming() {
    let apikey = PlayerUtil.skywatchAccessToken;
    RNFetchBlob.fetch('GET', 'https://service.skywatch24.com/api/v2/devices/' + this.deviceId + '/rtmpstream?api_key=' + apikey, {
      'Content-Type': 'application/x-www-form-urlencoded',
    })
      .then((res) => {
        console.log("****** skywatch get get LiveStreaming: " + res.text());
        this.setState({uri: res.text()});
        this.timerOut && clearTimeout(this.timerOut);
        this.setState({ currentState: 'play', paused: false });
      })
      .catch((err) => {
      })
  }

  getNewList(list) {
    let time = [];
    list.forEach((item) => {
      let str = item.substr(item.lastIndexOf("-") + 1);
      time.push(parseInt(str));
    })
    time.sort();
    let newList = [];
    time.forEach((item) => {
      let findItem = list.find(p => p.indexOf(item) != -1);
      if (findItem != null) {
        newList.push(findItem);
      }
    })
    return newList;
  }

  getRecordList(start) {
    let end = start + 300;
    let apikey = PlayerUtil.skywatchAccessToken;
    RNFetchBlob.fetch('GET', 'https://service.skywatch24.com/tw/api/v2/devices/' + this.deviceId + '/archives?scope=CloudArchives&start_time=' + start + '&end_time=' + end + '&api_key=' + apikey, {
      'Content-Type': 'application/x-www-form-urlencoded',
    })
      .then((res) => {
        let records = res.json().archives;
        let playList = [];
        records.forEach((item) => {
          playList.push(item.id);
        })
        if (playList.length > 0) {
          let newList = this.getNewList(playList);
          console.log("****** skywatch get record list :" + newList);
          this.getRecordAddress(newList[0]);
          newList.shift();
          this.playList = newList;
        }
        else {
          this.timerOut && clearTimeout(this.timerOut);
          this.setState({ currentState: 'noRocord' });
        }
      })
      .catch((err) => {
        console.log("****** skywatch get record list err: " + err);
      })
  }

  getRecordAddress(id) {
    let apikey = PlayerUtil.skywatchAccessToken;
    RNFetchBlob.fetch('GET', 'https://service.skywatch24.com/tw/api/v2/devices/' + this.deviceId + '/archives/link?scope=CloudArchives&archive_id=' + id + '&media_type=mp4&region=gcs-asia&smart_ff=0&avi=0&from=skywatch&api_key=' + apikey, {
      'Content-Type': 'application/x-www-form-urlencoded',
    })
      .then((res) => {
        console.log("****** skywatch get record Address :" + res.text());
        this.lastPostion = 0;
        this.setState({ uri: res.text(), currentState: 'playback', paused: false });
        if (Platform.OS === 'ios'){
           this.timerOut && clearTimeout(this.timerOut);
        }
      })
      .catch((err) => {
      })
  }


  videoError(e) {
    console.log("****** ONError")
    this.setState({ currentState: 'error' });
  }

  onLoadAndroid(){
    this.timerOut && clearTimeout(this.timerOut);
  }

  onEndAndroid(){
    if(!this.realType){
       console.log("****** ONEnd");
       if (this.playList.length > 0) {
        this.getRecordAddress(this.playList[0]);
        this.playList.shift();
      }
    }
  }

  onProgressAndroid(data){
    this.currentTime = data.currentTime;
}

  onProgressIOS(data) {
    if (!this.realType) {
      if (this.lastPostion > data.position) {
        console.log("****** ONEnd");
        this.setState({paused:true});
        if (this.playList.length > 0) {
          this.getRecordAddress(this.playList[0]);
          this.playList.shift();
        }
      }
      else {
        this.lastPostion = data.position;
        this.duration = data.duration;
      }
    }
  }

  async onPressTakeSnapshot() {
    if (this.state.currentState != 'play' && this.state.currentState != 'playback') {
      return;
    }
    if(!GlobalParam.onAttachment()){
       return;
    }
    await this.setState({ enableCapture: false });
    this.refs.viewShot.capture().then(uri => {
      var RNFS = require('react-native-fs');
      let date = new Date();
      let time = date.getTime();
      let path = RNFS.DocumentDirectoryPath + `/${time}.jpeg`;
      RNFS.copyFile(uri, path)
        .then((success) => {
          if (this.state.fullScreen) {
            this.onFullScreen();
            setTimeout(() => {
              this.setState({ enableCapture: true });
              this.props.createEvent(true, path);
            }, 500);
          }
          else {
            this.setState({ enableCapture: true });
            this.props.createEvent(true, path);
          }
        })
        .catch((err) => {
          this.setState({ enableCapture: true });
          console.log(err.message);
        });
    })
  }

  async onPlay() {
    let paused = !this.state.paused;
    if (this.realType === true) {
      if (paused) {
        this.stop();
      }
      else {
        this.startVideo(this.deviceId, null, null);
      }
    }
    else {
      if (paused) {
        this.setState({ paused: true });
      }
      else {
        this.setState({ paused: false });
      }
    }
    this.doDirtyWork();
  }

  onFullScreen() {
    let fullScreen = !this.state.fullScreen;
    if (fullScreen) {
      Orientation.getOrientation((err, orientation) => {
        dismissKeyboard();
        if (orientation !== 'PORTRAIT') {
          Orientation.lockToPortrait();
        }
        if (Platform.OS === 'android') {
          Orientation.lockToLandscapeLeft();
        }
        else {
          Orientation.lockToLandscapeRight();
        }
        this.props.onFullScreen(true);
        this.lastHeight = this.state.height;
        let heightX = width-45-getBottomSpace()-getStatusBarHeight();
        this.setState({ height: heightX, fullScreen: true });
      });

    }
    else {
      Orientation.getOrientation((err, orientation) => {
        if (orientation !== 'LANDSCAPE') {
          if (Platform.OS === 'android') {
            Orientation.lockToLandscapeLeft();
          }
          else {
            Orientation.lockToLandscapeRight();
          }
        }
        Orientation.lockToPortrait();
        this.props.onFullScreen(false);
        this.setState({ height: this.lastHeight, fullScreen: false });
      });
    }
  }

  render() {
    let backBtn = null;
    let barHeight = this.state.fullScreen ? 45:35;
    let btnSize = this.state.fullScreen ? 28:22;
    let marginSize = this.state.fullScreen ? 20:15;
    if (!this.realType) {
      backBtn = (
        <TouchableOpacity onPress={() => {
          this.setState({ paused: false });
          if (Platform.OS === 'ios'){
            let pos = this.lastPostion - 10000 / this.duration;
            if (pos > 0 && pos < 1) {
              this.player && this.player.seek(pos);
              this.lastPostion = pos;
            }
          }
          else{
            this.player2 && this.player2.seek(this.currentTime-10);
          }
        }}>
          <Image source={require('../assets/images/playback_backward_btn.png')} style={{ height: btnSize, width: btnSize }} />
        </TouchableOpacity>
      )
    }
    else {
      backBtn = (
        <View style={{ height: btnSize, width: btnSize }}>
        </View>
      )
    }

    let forwardBtn = null;
    if (!this.realType) {
      forwardBtn = (
        <TouchableOpacity onPress={() => {
          this.setState({ paused: false });
          if (Platform.OS === 'ios'){
            let pos = this.lastPostion + 10000 / this.duration;
            if (pos > 0 && pos < 1) {
              this.player && this.player.seek(pos);
              this.lastPostion = pos;
            }
          }
          else{
            this.player2 && this.player2.seek(this.currentTime+10);
          }
        }}>
          <Image source={require('../assets/images/playback_forward_btn.png')} style={{ marginLeft: marginSize, height: btnSize, width: btnSize }} />
        </TouchableOpacity>
      )
    }
    else {
      forwardBtn = (
        <View style={{ marginLeft: marginSize, height: btnSize, width: btnSize }}>
        </View>
      )
    }
    let pointerChannel = this.state.enableCapture === true ? 'auto' : 'none';

    let captureBtn = null;
    if (this.props.showOperate != false) {
      captureBtn = (
        <View pointerEvents={pointerChannel}>
          <TouchableOpacity onPress={() => {
            this.onPressTakeSnapshot();
          }}>
            <Image source={require('../assets/images/preview_camera_btn.png')} style={{marginLeft:marginSize, height: btnSize, width: btnSize }} />
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

    let sourcePlay = this.state.paused ? require('../assets/images/preview_play_btn.png') : require('../assets/images/stoplay_btn.png');
    let sourceFullScreen = this.state.fullScreen ? require('../assets/images/fullscreen_exit.png') : require('../assets/images/preview_enlarge.png');

    let pause = this.realType ? false : this.state.paused;
    let videoPlayer = null;
    if (this.state.currentState == 'play' || this.state.currentState == 'playback' && Platform.OS === 'ios' ) {
      videoPlayer = (
        <ViewShot ref="viewShot" options={{ format: "jpg", quality: 0.9 }}>
          <VLCPlayer source={{ uri: this.state.uri }}
            ref={(ref) => { this.player = ref }}
            onError={this.videoError.bind(this)}
            onProgress={this.onProgressIOS.bind(this)}
            paused={pause}
            muted={this.state.muted}
            style={{ width: '100%', height: this.state.height }} />
        </ViewShot>
      )
    }

    else if (this.state.currentState == 'playback' && Platform.OS === 'android') {
      videoPlayer = (
        <ViewShot ref="viewShot" options={{ format: "jpg", quality: 0.9 }}>
        <Video source={{ uri: this.state.uri }}
          ref={(ref) => { this.player2 = ref }}
          onError={this.videoError.bind(this)}
          onLoad={this.onLoadAndroid.bind(this)}
          onEnd={this.onEndAndroid.bind(this)}
          onProgress={this.onProgressAndroid.bind(this)}
          muted={this.state.muted}
          paused={this.state.paused}
          style={{ width: '100%', height: this.state.height, backgroundColor:'black'}} />
      </ViewShot>
      )
    }

    else if (this.state.currentState == 'blank') {
      videoPlayer = (
        <View style={{ width: '100%', height: this.state.height, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        </View>
      )
    }

    else if (this.state.currentState == 'loading') {
      videoPlayer = (
        <View style={{ width: '100%', height: this.state.height, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator animating={true} size="large" color='#ffffff' />
        </View>
      )
    }
    else if (this.state.currentState == 'error') {
      videoPlayer = (
        <View style={{ width: '100%', height: this.state.height, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'white', textAlignVertical: 'center' }}>{I18n.t('Video load error')}</Text>
        </View>
      )
    }
    else if (this.state.currentState == 'noRocord') {
      videoPlayer = (
        <View style={{ width: '100%', height: this.state.height, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'white', textAlignVertical: 'center' }}>{I18n.t('No record file')}</Text>
        </View>
      )
    }
    let sourceSound = this.state.muted ?require('../assets/images/preview_unvoice_btn.png'):require('../assets/images/preview_voice_btn.png');
    let pointer = this.state.enableOperate === true ? 'auto' : 'none';
    return (
      <View style={{ backgroundColor: '#F5FCFF' }}>
        {videoPlayer}
        <View pointerEvents={pointer} style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'black', opacity: 0.7,height:barHeight,alignItems:'center' }}>
          <View style={{ flexDirection: 'row' }}>
            {backBtn}
            <TouchableOpacity onPress={this.onPlay.bind(this)}>
              <Image source={sourcePlay} style={{ marginLeft: marginSize, height: btnSize, width: btnSize }} />
            </TouchableOpacity>
            {forwardBtn}
          </View>

          <View style={{ flexDirection: 'row' }}>
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
              <Image source={sourceFullScreen} style={{ marginLeft: marginSize, height: btnSize, width: btnSize,marginRight: marginSize }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}
