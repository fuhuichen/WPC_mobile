import React, { Component } from 'react';
import {StyleSheet, View,TouchableOpacity,Image , PermissionsAndroid, Platform, Text,DeviceEventEmitter} from 'react-native';
import { Actions } from 'react-native-router-flux';
import Video from '../components/af-video-player/Video';
import Orientation from 'react-native-orientation';
import PhoneInfo from "../entities/PhoneInfo";
import CameraRoll from "@react-native-community/cameraroll";
import RNFetchBlob from "rn-fetch-blob";
import BusyIndicator from "../components/BusyIndicator";
import Toast from "react-native-easy-toast";
import I18n from 'react-native-i18n';
import AndroidBacker from "./AndroidBacker";
import {ColorStyles} from "../common/ColorStyles";

export default class VideoPlayer extends Component {

    constructor(props) {
        super(props);
        this.local = this.props.uri.indexOf('http') === -1 ? true: false;
    }

    componentDidMount() {
        DeviceEventEmitter.emit('onStatusBar', 'white');
        Orientation.unlockAllOrientations();
    }

    componentWillUnmount() {
        DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
        Orientation.lockToPortrait();
    }

    onPress() {
        DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
        Actions.pop();
    }

    async onVideoSave(){
        try{
            if (Platform.OS === "android" ) {
               const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
               let hasPermission = await PermissionsAndroid.check(permission);
               if (!hasPermission) {
                    let status = await PermissionsAndroid.request(permission);
                    if (status !== 'granted'){
                        return;
                    }
               }
            }

            if(!this.local){
                this.refs.indicator.open();
                RNFetchBlob
                .config({fileCache : true, appendExt : 'mp4', timeout:20000})
                .fetch('GET', this.props.uri)
                .then((res) => {
                    let url =   'file://' + res.path();
                    CameraRoll.save(url,{type:'video'});
                    this.refs.indicator.close();
                    this.refs.toast.show(I18n.t('Save success'), 3000);
                })
                .catch((err) =>{
                    this.refs.indicator.close();
                    this.refs.toast.show(I18n.t('Save error'), 3000);
                })
            }
            else{
                CameraRoll.save(this.props.uri,{type:'video'});
                this.refs.toast.show(I18n.t('Save success'), 3000);
            }
        }
        catch(err){
            this.refs.indicator.close();
            this.refs.toast.show(I18n.t('Save error'), 3000);
        }
    }

    render() {
      //  console.log("Video Player="+this.props.uri)
        return (
            <View style={styles.container}>
                <Video url={this.props.uri}  fullScreenOnly title={' '} logo={' '}
                       onMorePress={() => this.onPress()}/>
                 <View style={{position:'absolute',right:12,top:18}}>
                     <TouchableOpacity activeOpacity={0.5} onPress={()=>this.onVideoSave()}>
                       <View style={{borderRadius:10,paddingLeft:12,paddingRight:12,height:30,backgroundColor:ColorStyles.COLOR_MAIN_RED,alignItems:'center',justifyContent:'center'}}>
                         <Text style={{color:'white',fontSize:14}}>{I18n.t('Download')}</Text>
                      </View>
                   </TouchableOpacity>
                </View>

                <BusyIndicator ref={"indicator"} title={I18n.t('Waiting')} />
                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
                <AndroidBacker onPress={() => {
                    DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
                    Actions.pop();
                    return true
                }}/>
            </View>
        );
    }

}
const styles = StyleSheet.create({
    container: {
        flex:1,
        justifyContent: 'center',
    }
});
