import React, { Component } from 'react';
import {
    View,
    Dimensions,
    Platform,
    Image,
    AppState,
    TouchableOpacity,
    ActivityIndicator,
    DeviceEventEmitter, Text
} from 'react-native';

import Video from "react-native-video";
import Toast from "react-native-easy-toast";
import PropType from "prop-types";
import HttpUtil from "../utils/HttpUtil";
import RNFS from "react-native-fs";
import I18n from 'react-native-i18n';
import Orientation from 'react-native-orientation-locker';
import dismissKeyboard from "react-native-dismiss-keyboard";
import {getBottomSpace, getStatusBarHeight, isIphoneX} from "react-native-iphone-x-helper";
import {EMITTER_PLAYER_STOP} from "../common/Constant";
import GlobalParam from "../common/GlobalParam";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class ReactVideo extends Component {

    static propTypes ={
        createEvent: PropType.func,
        dashReady:PropType.func,
        dashError:PropType.func,
        onFullScreen:PropType.func
    }

    constructor(props){
        super(props);
        this.state = {
            uri:null,
            height:220,
            play:true,
            fullScreen:false,
            paused:false,
            muted:false,
            currentState:'blank',  // 'blank','loading','play','inline'
            error:'',
            enableCapture:true,
        }
        this.streamProtocol = Platform.OS === 'android' ? "DASH" : "HLS";
        this.sessionId = null;
        this.userName = null;
        this.password = null;
        this.IVSID = null;
        this.channelId = null;
        this.realType = true;
        this.lastTime = null;
        this.lastHeight = 220;
        this.currentTime = null;
        this.onEndflag = false;
    }

    componentDidMount() {
        AppState.addEventListener('change', this.onAppStateChange);
        HttpUtil.get('device/dash/info')
            .then(result => {
                console.log("2device/dash/info"+JSON.stringify(result))
                if(result.data){
                  let apiport = result.data.url.indexOf('https') !== -1 ? result.data.httpsCmdPort : result.data.httpCmdPort;
                  this.userName = result.data.loginId;
                  this.password = result.data.password;
                  let url = result.data.url + ":" + apiport + '/AdvStreamingService/';
                  HttpUtil.setDashHost(url);
                  this.props.dashReady();

                }
                else{
                  this.setState({currentState:'blank',error:I18n.t("Video type error")});
                }

            })
            .catch(error=>{
                if (error.message !== 'Network request failed'){
                    this.setState({currentState:'blank',error:error});
                }
            })
    }

    componentWillMount(){
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_PLAYER_STOP,
            (value)=>{
                AppState.removeEventListener('change', this.onAppStateChange);
                if(this.state.fullScreen){
                    this.onFullScreen();
                }

                if(value){
                    (async ()=>{
                        await this.onPlay();
                    })();
                }

                setTimeout(()=>{
                    AppState.addEventListener('change', this.onAppStateChange);
                },200);
            });
    }

    componentWillUnmount(){
        AppState.removeEventListener('change', this.onAppStateChange);
        this.stopVideo();
        this.dirtyTimer && clearTimeout(this.dirtyTimer);
        this.notifyEmitter && this.notifyEmitter.remove();
    }

    onAppStateChange = (nextAppState) => {
        if (nextAppState === 'active') {
            if (this.realType && !this.state.paused){
                if (this.state.currentState === 'play'){
                    this.startVideo(this.IVSID,this.channelId,null);
                }
            }
        }
    }

    doDirtyWork(){
        setTimeout(() => {
            if(this.state.currentState === 'play'){
                this.dirtyTimer && clearTimeout(this.dirtyTimer);
                this.dirtyTimer = setTimeout(() => {
                    if (AppState.currentState === 'active'){
                        this.onPlay();
                    }
                }, 300000);
            }
        }, 500);
    }

    async startVideo(IVSID, channelId, startTs){
        try {
            if (IVSID === null || channelId === null){
                let error = I18n.t('DashPlayer error')+ '5';
                this.setState({currentState:'blank',error:error});
            }
            else {
                this.timerOut && clearTimeout(this.timerOut);
                if (!await this.stopVideoPlay()){
                    return;
                }
                if (!await this.online()){
                    return;
                }
                this.IVSID = IVSID;
                this.channelId = channelId.toString();
                if (startTs){
                    await this.history(startTs);
                }
                else {
                    await this.realTime();
                    this.doDirtyWork();
                }
            }
        }
        catch (e) {
            if (e.message !== 'Network request failed'){
                this.setState({currentState:'blank',error:e.message});
            }
        }
    }

    async stopVideo(){
        if(this.sessionId){
            let state = this.state.currentState;
            this.setState({currentState:'blank',error:''});
            if (state === 'play'){
                await this.disconnectVideo();
            }
            return await this.offline();
        }
        else {
            this.setState({currentState:'blank',error:''});
            return true;
        }
    }

    async stopVideoPlay(){
        if(this.sessionId){
            let state = this.state.currentState;
            this.setState({currentState:'loading'});
            if (state === 'play'){
                await this.disconnectVideo();
            }
            return await this.offline();
        }
        else {
            return true;
        }
    }

    async online() {
        let data = {};
        let request = {};
        request.username = this.userName;
        request.password = this.password;
        data.request = request;
        this.setState({currentState:'loading'});
        if (await HttpUtil.putDash('Authority/Online', data)) {
            this.sessionId = HttpUtil.getResult().SessionID;
            return true;
        }
        else {
            let error = I18n.t('DashPlayer error');
            if(HttpUtil.getResult() != null){
                error += HttpUtil.getResult().ErrorCode;
            }
            this.setState({currentState:'blank',error:error});
            return false;
        }
    }

    async offline(){
        if(this.sessionId != null){
            let data = {};
            let request = {};
            request.sessionID = this.sessionId;
            data.request = request;
            if (await HttpUtil.putDash('Authority/Offline',data)){
                this.sessionId = null;
                return true;
            }
            else {
                if(HttpUtil.getResult() != null){
                    let errorCode = HttpUtil.getResult().ErrorCode;
                    if (errorCode === 3){
                        this.sessionId = null;
                        return true;
                    }
                    else {
                        let error = I18n.t('DashPlayer error')+ errorCode;
                        return false;
                    }
                }
                else {
                    return false;
                }
            }
        }
        else {
            return  true;
        }
    }

    async realTime() {
        let data = {};
        let request = {};
        request.method = 'connection';
        request.sessionID = this.sessionId;
        request.streamingProtocol = this.streamProtocol;
        request.withAudio = true;
        request.streamType = 'SubStream';
        request.IVSID = this.IVSID;
        request.channel = this.channelId;
        data.request = request;
        this.realType = true;
        if (await HttpUtil.putDash('LiveStream',data)){
            let url = HttpUtil.getResult().mpd;
            this.setState({uri:url,paused:false,error:'',currentState:'play'});
            this.timerOut= setTimeout(() => {
                this.setState({currentState:'blank',error:I18n.t('Video load error')});
            }, 15000);
            return true;
        }
        else {
            let error = I18n.t('DashPlayer error');
            if(HttpUtil.getResult() != null){
                error += HttpUtil.getResult().ErrorCode;
            }
            this.setState({currentState:'blank',error:error});
            return false;
        }
    }

    async history(startTs){
        let data = {};
        let request = {};
        request.method = 'connection';
        request.sessionID = this.sessionId;
        request.streamingProtocol = this.streamProtocol;
        request.withAudio = true;
        request.transcodeResolution = 'D1';
        request.IVSID = this.IVSID;
        request.channel = this.channelId;
        request.beginTime = startTs.toString();
        request.endTime = (startTs + 300).toString();

        data.request = request;
        this.realType = false;
        if (await HttpUtil.putDash('PlaybackStream', data)){
            let url = HttpUtil.getResult().mpd;
            this.setState({uri:url,paused:false,error:'',currentState:'play'});
            this.onEndflag = false;
            this.lastTime = startTs + 300;
            this.timerOut= setTimeout(() => {
                this.setState({currentState:'blank',error:I18n.t('Video load error')});
            }, 15000);
            return true;
        }
        else {
            let error = I18n.t('DashPlayer error');
            if(HttpUtil.getResult() != null) {
                error += HttpUtil.getResult().ErrorCode;
            }
            this.setState({currentState:'blank',error:error});
            return false;
        }
    }

    async disconnectVideo(){
        if(this.sessionId != null){
            let data = {};
            let request = {};
            request.method = 'disconnection';
            request.sessionID = this.sessionId;
            request.IVSID = this.IVSID;
            request.channel = this.channelId;
            data.request = request;
            let url = this.realType ? 'LiveStream':'PlaybackStream';
            if (await HttpUtil.putDash(url, data)){
                return true;
            }
            else {
                if(HttpUtil.getResult() != null){
                    let errorCode = HttpUtil.getResult().ErrorCode;
                    if (errorCode === 3){
                        return  true;
                    }
                    else {
                        if(errorCode !== 24){
                            let error = I18n.t('DashPlayer error')+ errorCode;
                            //this.props.dashError(error);
                        }
                        return false;
                    }
                }
                else {
                    return false;
                }
            }
        }
        else {
            return  true;
        }
    }

    saveSnapFile(base64){
        let date = new Date();
        let time = date.getTime();
        let path = RNFS.DocumentDirectoryPath + `/${time}.jpeg`;
        RNFS.writeFile(path, base64, 'base64')
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
    }

    async onSnap(){
        try {
            if (GlobalParam.onAttachment()) {
                await this.setState({enableCapture:false});
                let data = {};
                let request = {};
                request.sessionID = this.sessionId;
                if (!this.realType) {
                    request.timestamp = this.currentTime.toString();
                }
                data.request = request;
                if (await HttpUtil.putDash('Snapshot', data)) {
                    let base64 = HttpUtil.getResult().data;
                    this.saveSnapFile(base64);
                }
                else{
                    this.setState({enableCapture:true});
                    this.refs.toast.show(I18n.t('Snapshot error'), 3000);
                }
            }else{
                this.setState({enableCapture:true});
                this.state.fullScreen && this.onFullScreen();
            }
        }
        catch (e) {
        }
    }

    onLoad(data) {
        this.timerOut && clearTimeout(this.timerOut);
        if(Platform.OS === 'android'){
            let maxHeight = height*0.618 ;
            let minHeight = 200;
            let heighSet = data.naturalSize.height * width/data.naturalSize.width;
            if (heighSet > maxHeight){
                heighSet = maxHeight
            }
            if (heighSet < minHeight){
                heighSet = minHeight
            }
            //this.setState({height:heighSet});
        }
    }

    async onEnd(){
        this.onEndflag = true;
        this.setState({paused:true});
    }

    onProgress(data){
         this.currentTime = data.currentTime;
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
                let heightX = isIphoneX()? width-45-getBottomSpace()-getStatusBarHeight() : width-45-20;
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

    async onPlay(){
        let paused = !this.state.paused;
        if (this.realType === true){
            if (paused){
                await this.disconnectVideo();
                await this.offline();
                this.setState({currentState:'inline',paused:true});
            }
            else {
                await this.startVideo(this.IVSID, this.channelId, null);
            }
        }
        else {
            if (paused){
                this.setState({paused:true});
            }
            else {
                if (!this.onEndflag){
                    this.setState({paused:false});
                }
                else {
                    this.startVideo(this.IVSID, this.channelId, this.lastTime);
                }
            }
        }
    }

    render() {
        let backBtn = null;
        let btnSize = this.state.fullScreen ? 45:35;
        let marginSize = this.state.fullScreen ? 15 :10;
        if ( !this.realType ){ backBtn =(
            <TouchableOpacity onPress={()=> {
                this.setState({paused:false});
                this.player.seek(this.currentTime-10);
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
                this.player.seek(this.currentTime+10);
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
        if ( this.props.showSnap !== false ){ captureBtn =(
            <View pointerEvents={pointerChannel}>
            <TouchableOpacity onPress={()=> {
                this.onSnap();
            }}>
                <Image source={require('../assets/images/preview_camera_btn.png')} style={{height:btnSize,width:btnSize}}/>
            </TouchableOpacity>
            </View>
        )
        }

        let sourcePlay = this.state.paused ? require('../assets/images/preview_play_btn.png'):require('../assets/images/stoplay_btn.png');
        let sourceSound = this.state.muted ?require('../assets/images/preview_unvoice_btn.png'):require('../assets/images/preview_voice_btn.png');
        let sourceFullScreen = this.state.fullScreen ? require('../assets/images/fullscreen_exit.png'):require('../assets/images/preview_enlarge.png');

        let controlBar = null;
        if (true){ controlBar = (
            <View style={{width:'100%',flexDirection:'row',justifyContent:'space-between',backgroundColor:'black',opacity: 0.7}}>
                <View style={{flexDirection:'row'}}>
                    {backBtn}
                    <TouchableOpacity onPress={this.onPlay.bind(this)}>
                        <Image source={sourcePlay} style={{marginLeft:marginSize,height:btnSize,width:btnSize}}/>
                    </TouchableOpacity>
                    {forwardBtn}
                </View>

                <View style={{flexDirection:'row'}}>
                    {captureBtn}
                    <TouchableOpacity onPress={()=> {
                        this.setState({muted:!this.state.muted});
                    }}>
                        <Image source={sourceSound} style={{marginLeft:marginSize,height:btnSize,width:btnSize}}/>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={this.onFullScreen.bind(this)}>
                        <Image source={sourceFullScreen} style={{marginLeft: marginSize,height:btnSize,width:btnSize}}/>
                    </TouchableOpacity>
                </View>
            </View>
        )
        }

        let videoPlayer = null;
        if ( this.state.currentState === 'play' ){ videoPlayer =(
            <Video source={{uri: this.state.uri}}
                   ref={(ref) => {this.player = ref}}
                   resizeMode={'contain'}
                   controls={false}
                   onLoad={this.onLoad.bind(this)}
                   onEnd={this.onEnd.bind(this)}
                   onProgress={this.onProgress.bind(this)}
                   paused={this.state.paused}
                   muted = {this.state.muted}
                   style={{width:'100%',height:this.state.height,backgroundColor: 'black'}}
            />
        )
        }
        else if ( this.state.currentState === 'blank' || this.state.currentState === 'inline' ) { videoPlayer =(
            <View style={{width:'100%',height:this.state.height,backgroundColor:'black',justifyContent:'center',alignItems:'center'}}>
                <Text style={{fontSize: 16, color: 'white', textAlignVertical:'center'}}>{this.state.error}</Text>
            </View>
        )
        }

        else if ( this.state.currentState === 'loading' ) { videoPlayer =(
            <View style={{width:'100%',height:this.state.height,backgroundColor:'black',justifyContent:'center',alignItems:'center'}}>
                <ActivityIndicator animating={true} size="large" color='#ffffff'/>
            </View>
        )
        }

        return (
            <View>
                {videoPlayer}
                {controlBar}
                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}} position='top' positionValue={90}/>
            </View>
        )
    }
}
