import React, { Component } from 'react';
import {StyleSheet, View,Dimensions,Platform,BackHandler,DeviceEventEmitter} from 'react-native';
import ReactVideo from './ReactVideo'
import StandVideoPlayer from "./StandVideoPlayer";
import PlayerUtil from "../utils/PlayerUtil";
import * as lib from '../common/PositionLib';
import EzvizPlayer from "./ezvizPlayer/util/EzvizPlayer";
import BeseyeVideo from "./BeseyeVideo";
import SkywatchPlayer from './SkywatchPlayer';
import Toast, {DURATION} from "react-native-easy-toast";
import PropTypes from "prop-types";
import I18n from "react-native-i18n";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class VideoSwitch extends Component {
    static propTypes = {
        NavTitle: PropTypes.func,
        FullScreen: PropTypes.func
    };

    constructor(props) {
        super(props);
        this.state = {
            playerMode: 0,
            enableTouch:false,
        };
        this.time = null;
        this.deviceIndex = -1;
    }

    initPlayer(index){
        this.deviceIndex = index;
        console.log(this.props.data.device[index])
        this.props.data.device.length > 0 && index !== -1 ? this.setState({playerMode: this.props.data.device[index].vendor},()=>{
            if(this.props.VideoType!=='AffairDetail'){
                PlayerUtil.setMode(this.state.playerMode);
                this.props.PlayerMode(this.state.playerMode);
            }
            if (this.state.playerMode == 1){
                EzvizPlayer.init(this.props.data.ezvizAppKey);
                PlayerUtil.getEzvizToken(this.props.data.device[index].ivsId)
                .then((token)=>{
                    EzvizPlayer.setToken(token);
                }).catch((err)=>{
                    if(err == 'license'){
                        this.refs.toast.show(I18n.t('Video license'), 3000);
                    }
                })
            }
            else if(this.state.playerMode == 2){
                PlayerUtil.getBeseyeToken(this.props.data.device[index].ivsId)
                .then((token)=>{
                }).catch((err)=>{
                    if(err == 'license'){
                        this.refs.toast.show(I18n.t('Video license'), 3000);
                    }
                })
            }
            else if (this.state.playerMode == 3){
                PlayerUtil.getSkyWatchToken(this.props.data.device[index].ivsId)
                .then((token)=>{
                }).catch((err)=>{
                    if(err == 'license'){
                        this.refs.toast.show(I18n.t('Video license'), 3000);
                    }
                })
            }
        }) : null;
    }

    startPlay(ivsId,channelId,time){
        if( this.state.playerMode  === 0){
            time == null ? this.refs.reactVideo.startVideo(ivsId,channelId,null)
                : this.refs.reactVideo.startVideo(ivsId,channelId,time);
        }else if(this.state.playerMode  === 1 && Platform.OS === 'android' && this.refs.ezvizPlayer != null){
            if (PlayerUtil.ezvizAccessToken == ''){
                PlayerUtil.getEzvizToken(this.props.data.device[this.deviceIndex].ivsId)
                .then((token)=>{
                    EzvizPlayer.setToken(token);
                    time == null ? this.refs.ezvizPlayer.startVideo(ivsId,channelId,0)
                    : this.refs.ezvizPlayer.startVideo(ivsId,channelId,time);
                }).catch((err)=>{
                    if(err == 'license'){
                        this.refs.toast.show(I18n.t('Video license'), 3000);
                    }
                })
            }
            else{
                time == null ? this.refs.ezvizPlayer.startVideo(ivsId,channelId,0)
                : this.refs.ezvizPlayer.startVideo(ivsId,channelId,time);
            }
        }else if(this.state.playerMode  === 1 && Platform.OS === 'ios' && this.refs.ezvizPlayerIOS != null){
            if (PlayerUtil.ezvizAccessToken == ''){
                PlayerUtil.getEzvizToken(this.props.data.device[this.deviceIndex].ivsId)
                .then((token)=>{
                    EzvizPlayer.setToken(token);
                    time == null ? this.refs.ezvizPlayerIOS.startVideo(ivsId,channelId,null)
                    : this.refs.ezvizPlayerIOS.startVideo(ivsId,channelId,time*1000);
                }).catch((err)=>{
                    if(err == 'license'){
                        this.refs.toast.show(I18n.t('Video license'), 3000);
                    }
                })
            }
            else{
                time == null ? this.refs.ezvizPlayerIOS.startVideo(ivsId,channelId,null)
                : this.refs.ezvizPlayerIOS.startVideo(ivsId,channelId,time*1000);
            }
        }
        else if(this.state.playerMode  === 2 && this.refs.beseyeVideo != null){
            if(PlayerUtil.beseyeAccessToken == ''){
                PlayerUtil.getBeseyeToken(this.props.data.device[this.deviceIndex].ivsId)
                .then((token)=>{
                    if(token != ''){
                        time == null ? this.refs.beseyeVideo.startVideo(ivsId,channelId,null)
                        : this.refs.beseyeVideo.startVideo(ivsId,channelId,time*1000);
                    }
                }).catch((err)=>{
                    if(err == 'license'){
                        this.refs.toast.show(I18n.t('Video license'), 3000);
                    }
                })
            }
            else{
                time == null ? this.refs.beseyeVideo.startVideo(ivsId,channelId,null)
                : this.refs.beseyeVideo.startVideo(ivsId,channelId,time*1000);
            }
        }
        else if(this.state.playerMode  === 3 && this.refs.skywatchPlayer != null){
            if(PlayerUtil.skywatchAccessToken == ''){
                PlayerUtil.getSkyWatchToken(this.props.data.device[this.deviceIndex].ivsId)
                .then((token)=>{
                    if(token != ''){
                        time == null ? this.refs.skywatchPlayer.startVideo(ivsId,channelId,null)
                        : this.refs.skywatchPlayer.startVideo(ivsId,channelId,time);
                    }
                }).catch((err)=>{
                    if(err == 'license'){
                        this.refs.toast.show(I18n.t('Video license'), 3000);
                    }
                })
            }
            else{
                time == null ? this.refs.skywatchPlayer.startVideo(ivsId,channelId,null)
                : this.refs.skywatchPlayer.startVideo(ivsId,channelId,time);
            }
        }
    }

    stopPlay(){
        if(this.state.playerMode === 0){
            this.refs.reactVideo.stopVideo();
        }else if(this.state.playerMode === 1 && Platform.OS === 'android' ){
            this.refs.ezvizPlayer.stop();
        }else if(this.state.playerMode === 1 && Platform.OS === 'ios'){
            this.refs.ezvizPlayerIOS.stop();
        }
        else if(this.state.playerMode === 2 ){
            this.refs.beseyeVideo.stop();
        }
        else if(this.state.playerMode === 3 ){
            this.refs.skywatchPlayer.stop();
        }
    }

    disablePlay(){
        if(this.state.playerMode === 0){
            this.refs.reactVideo.stopVideo();
            this.refs.reactVideo.setPlayEnable(false);
        }else if(this.state.playerMode === 1 && Platform.OS === 'android' ){
            this.refs.ezvizPlayer.stop();
            this.refs.ezvizPlayer.setPlayEnable(false);
        }else if(this.state.playerMode === 1 && Platform.OS === 'ios'){
            this.refs.ezvizPlayerIOS.stop();
            this.refs.ezvizPlayerIOS.setPlayEnable(false);
        }
        else if(this.state.playerMode === 2 ){
            this.refs.beseyeVideo.stop();
            this.refs.beseyeVideo.setPlayEnable(false);
        }
        else if(this.state.playerMode === 2 ){
            this.refs.skywatchPlayer.stop();
            this.refs.skywatchPlayer.setPlayEnable(false);
        }
    }

    enablePlay(){
        if(this.state.playerMode === 0){
            this.refs.reactVideo.setPlayEnable(true);
        }else if(this.state.playerMode === 1 && Platform.OS === 'android' ){
            this.refs.ezvizPlayer.setPlayEnable(true);
        }else if(this.state.playerMode === 1 && Platform.OS === 'ios'){
            this.refs.ezvizPlayerIOS.setPlayEnable(true);
        }
        else if(this.state.playerMode === 2 ){
            this.refs.beseyeVideo.setPlayEnable(true);
        }
        else if(this.state.playerMode === 3 ){
            this.refs.skywatchPlayer.setPlayEnable(true);
        }
    }

    setTime(time){
        this.time = time;
    }

    onPauseSound(status){
        if(this.state.playerMode === 0){
            this.refs.reactVideo.onPauseSound(status);
        }
        else if(this.state.playerMode === 1 && Platform.OS === 'android' ){
            this.refs.ezvizPlayer.onPauseSound(status);
        }else if(this.state.playerMode === 1 && Platform.OS === 'ios'){
            this.refs.ezvizPlayerIOS.onPauseSound(status);
        }
        else if(this.state.playerMode === 2){
            this.refs.beseyeVideo.onPauseSound(status);
        }
        else if(this.state.playerMode === 3 ){
            this.refs.skywatchPlayer.onPauseSound(status);
        }
    }

    onDashReady(){
        if(this.props.VideoType==='VideoMonitor'){
            let device = this.props.data.device;
            if (Platform.OS === 'android') {
                BackHandler.addEventListener('videoMonitorBack', this.onBackAndroid);
            }
            this.props.EnableTouch(true);
            if (device.length >= 1){
                device.forEach((itemChild, indexChild) => {
                    itemChild.check = indexChild == this.props.vendorIndex ? true: false;
                });
                this.props.Device(device);
                let thisDevice = device[this.props.vendorIndex];
                this.props.NavTitle(thisDevice.name);
                this.startPlay(thisDevice.ivsId,thisDevice.channelId,this.time);
            }
        }else if(this.props.VideoType==='RemoteCheck'){
            try {
                this.props.dashReady(true);
                if (Platform.OS === 'android') {
                    BackHandler.addEventListener('videoMonitorBack', this.onBackAndroid);
                }
                let item = this.props.cameraItem;
                let index = this.props.cameraIndex;
                if(item == null || index == null){
                    return;
                }
                let device = this.props.data.device;
                if(device.length !== 0){
                    let thisDevice = device[this.deviceIndex];
                    this.startPlay(thisDevice.ivsId,thisDevice.channelId,this.time);
                }
            }catch (e) {
            }
        }else if(this.props.VideoType==='AffairDetail'){
            setTimeout(() => {
                let itemDevice = this.props.deviceList.find(element => element.id === this.props.data.deviceId);
                if (itemDevice != null){
                    // this.props.data.ivsId = itemDevice.ivsId;
                    // this.props.data.channelId = itemDevice.channelId;
                    let time = this.props.time/1000;
                    this.startPlay(itemDevice.ivsId,itemDevice.channelId,time);
                }
            }, 500);
        }
    }

    onDashError(errMsg){
        this.refs.toast.show(errMsg, 3000);
    }

    onBackAndroid = () => {
        let {width,height} =  Dimensions.get('screen');
        if ( width < height ){
            DeviceEventEmitter.emit(this.emitter,0);
        }
        else {
            if(this.state.playerMode === 0){
                this.refs.reactVideo && this.refs.reactVideo.onFullScreen();
            }
            else if(this.state.playerMode === 1 && Platform.OS === 'android' ){
                this.refs.ezvizPlayer.onFullScreen();
            }else if(this.state.playerMode === 1 && Platform.OS === 'ios'){
                this.refs.ezvizPlayerIOS.onFullScreen();
            }
            else if(this.state.playerMode === 2){
                this.refs.beseyeVideo.onFullScreen();
            }
            else if(this.state.playerMode === 3 ){
                this.refs.skywatchPlayer.onFullScreen();
            }
            return true;
        }
    };

    onPauseStatus(mode){
        if(mode===0){
            this.refs.reactVideo && this.refs.reactVideo.onFullScreen();
        }else if(mode===1){
            this.refs.ezvizPlayer && this.refs.ezvizPlayer.onPauseStatus();
            this.refs.ezvizPlayerIOS && this.refs.ezvizPlayerIOS.onPauseStatus();
        }
    }

    render() {
        let videoPlayer = null;
        if(this.state.playerMode  === 0){
            videoPlayer =  <ReactVideo ref={'reactVideo'}
                                dashError={this.onDashError.bind(this)}
                                dashReady={this.onDashReady.bind(this)}
                                showSnap={this.props.VideoType==='AffairDetail' ? this.props.showSnap : null}
                                createEvent={(isSnapshot,uri)=>this.props.createEvent(isSnapshot,uri)}
                                onFullScreen={(enable)=>{{this.props.FullScreen(enable)}}}/>
        }else if(this.state.playerMode  === 1 && Platform.OS === 'android'){
            videoPlayer =  <StandVideoPlayer ref={'ezvizPlayer'} style={!this.props.ezvizFullScreen ?
                                {width:width,height:238} : {width:height+1,height:width-lib.defaultStatusHeight()}}
                                dashReady={this.onDashReady.bind(this)}
                                videoMode={this.props.VideoType==='AffairDetail' ? false : null}
                                captureEnable={this.props.VideoType==='AffairDetail' ? this.props.showSnap : null}
                                createEvent={(isSnapshot,uri)=>{this.props.createEvent(isSnapshot,uri)}}
                                onFullScreen={(enable)=>{{this.props.FullScreen(enable)}}}
                                onFullChannel={()=>{this.props.FullChannel()}}
                                closeSound={this.props.VideoType==='VideoMonitor'}/>
        }
        else if(this.state.playerMode  === 1 && Platform.OS === 'ios'){
            videoPlayer =  <StandVideoPlayer ref={'ezvizPlayerIOS'} style={!this.props.ezvizFullScreen ?
                                {width:width,height:238} : {width:height+1,height:width-lib.defaultStatusHeight()}}
                                dashReady={this.onDashReady.bind(this)}
                                dashError={this.onDashError.bind(this)}
                                playerMode={1}
                                showOperate={this.props.VideoType==='AffairDetail' ? this.props.showSnap : null}
                                createEvent={(isSnapshot,uri)=>{this.props.createEvent(isSnapshot,uri)}}
                                onFullScreen={(enable)=>{{this.props.FullScreen(enable)}}}
                                onFullChannel={()=>{this.props.FullChannel()}}
                                closeSound={this.props.VideoType==='VideoMonitor'}
            />
        }
        else if(this.state.playerMode  === 2){
            videoPlayer =  <BeseyeVideo ref={'beseyeVideo'} style={!this.props.ezvizFullScreen ?
                                {width:width,height:238} : {width:height+1,height:width-lib.defaultStatusHeight()}}
                                dashReady={this.onDashReady.bind(this)}
                                dashError={this.onDashError.bind(this)}
                                showOperate={this.props.VideoType==='AffairDetail' ? this.props.showSnap : null}
                                createEvent={(isSnapshot,uri)=>{this.props.createEvent(isSnapshot,uri)}}
                                onFullScreen={(enable)=>{{this.props.FullScreen(enable)}}}
                                onFullChannel={()=>{this.props.FullChannel()}}
            />
        }
        else if(this.state.playerMode  === 3){
            videoPlayer =  <SkywatchPlayer ref={'skywatchPlayer'} style={!this.props.ezvizFullScreen ?
                                {width:width,height:238} : {width:height+1,height:width-lib.defaultStatusHeight()}}
                                dashReady={this.onDashReady.bind(this)}
                                dashError={this.onDashError.bind(this)}
                                showOperate={this.props.VideoType==='AffairDetail' ? this.props.showSnap : null}
                                createEvent={(isSnapshot,uri)=>{this.props.createEvent(isSnapshot,uri)}}
                                onFullScreen={(enable)=>{{this.props.FullScreen(enable)}}}
                                onFullChannel={()=>{this.props.FullChannel()}}
            />
        }
        return (
        <View>
            {videoPlayer}
            <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}} position='top' positionValue={100}/>
        </View>
        );
    }

}
const styles = StyleSheet.create({
});
