import React, { Component } from 'react';
import {StyleSheet, TouchableOpacity, View, DeviceEventEmitter, Image,Text,BackHandler,StatusBar} from 'react-native';
import { RNCamera } from 'react-native-camera';
import RNFS from 'react-native-fs';
import { Actions } from 'react-native-router-flux';
import Icon from "react-native-vector-icons/FontAwesome";
import {ColorStyles} from "../common/ColorStyles";
import moment from "moment";
import * as simpleStore from "react-native-simple-store";

export default class RecordVideo extends Component {

    constructor(props) {
        super(props);
        this.state = {
            videoUrl:null,
            isRecording:false,
            currentState:'ready',
            progress: 0,
            isFileSave: true
        };
    }

    componentWillMount(){
        DeviceEventEmitter.emit('onStatusBar', 'black');
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('hardwareBackPress', this.onBackAndroid);
        }
    }

    componentWillUnmount(){
        DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('hardwareBackPress', this.onBackAndroid);
        }
    }

    async componentDidMount(){
        this.getSetting();
    }

    async getSetting(){
        let res = await simpleStore.get('InspectionSetting');
        if (res != null) {
            let setting = JSON.parse(res);
            this.setState({isFileSave: setting.isFileSave});
        }
    }

    onBackAndroid = () => {
        this.onReturn();
        return true;
    };

    toFix(number){
        return (Array(2).join(0)+ number).slice(-2);
    }

    render() {
        let source = this.state.isRecording ? require('../assets/images/recording.png'):require('../assets/images/recordReady.png');
        let recordText = null;
        let text = '00:' + this.toFix(this.state.progress);
        if (this.state.isRecording){ recordText = (
            <View style={{flex: 1,backgroundColor: 'transparent',flexDirection: 'row',justifyContent: 'center'}} >
                   <View style={{ backgroundColor:'red',height:35,marginTop: 20, borderRadius: 8,padding: 5,
                                  alignItems: 'center',justifyContent: 'center'}} >
                       <Text style={{color: 'white',fontSize: 15}}>{text}</Text>
                   </View>
             </View>
        )
        }

        return (
            <View style={styles.container}>
                <RNCamera
                    ref={ref => {
                        this.camera = ref;
                    }}
                    style={styles.preview}
                    type={RNCamera.Constants.Type.back}
                    useNativeZoom={true}
                    flashMode={RNCamera.Constants.FlashMode.auto}
                    defaultVideoQuality={RNCamera.Constants.VideoQuality["720p"]}
                    onRecordingStart={this.onRecordingStart}
                    onRecordingEnd={this.onRecordingEnd}
                >
                    {
                        this.state.currentState == 'ready'?
                        <View>
                        {recordText} 
                        <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center', alignItems:'center',alignContent:'center' }}>
                                <TouchableOpacity onPress={()=>this.onReturn()} >
                                    <Icon name="angle-down" size={60} color="#D3D3D3" style={{marginBottom:50}}/>
                                </TouchableOpacity>
                                <TouchableOpacity  onPress={() => this.doVideo()} >
                                    <Image source={source} style={styles.imageVideo}/>
                                </TouchableOpacity>
                        </View>
                        </View> :
                            <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center', alignItems:'center'}}>
                                <TouchableOpacity onPress={() => this.onDiscard()} >
                                    <Image  style={styles.image} source={require('../assets/images/camera_discard.png')}/>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={()=>this.onReturn()}  >
                                    <Image  style={styles.image} source={require('../assets/images/camera_check.png')}/>
                                </TouchableOpacity>
                            </View>
                    }
                </RNCamera>
            </View>
        );
    }

    onRecordingStart = () => {
        this.setState({progress:0});
        this.timer = setInterval(() => {
            let progress = this.state.progress + 1 ;
            this.setState({progress: progress});
        }, 1000);
    }

    onRecordingEnd = () => {
        this.timer && clearInterval(this.timer);
    }

    onReturn(){    
        this.saveVideo(this.state.videoUrl);
        DeviceEventEmitter.emit('onVideoOut', this.state.videoUrl);
        Actions.pop();   
    }

    onDiscard(){
        this.timer && clearInterval(this.timer);
        setTimeout(() =>{
            this.camera.resumePreview();
            this.setState({videoUrl:null,currentState:'ready',progress:0});
        },800);

    }

    async doVideo(){
        if(!this.state.isRecording){
            await this.startVideo();
        }
        else{
            this.stopVideo();
        }
    }

    async startVideo() {
        try {
            const options = { maxDuration:10, quality: RNCamera.Constants.VideoQuality["720p"]};
            const promise = this.camera.recordAsync(options);
            if (promise){
                this.setState({isRecording: true,videoUrl:null});
                const data = await promise;
                this.setState({isRecording: false,videoUrl:data.uri, currentState:'check'});
            }
        } catch (e) {
            this.setState({isRecording:false});
            console.log(e);
        }
    }

    saveVideo(uri) {
        console.log("save Video uri : ", uri);
        let fileName = 'INSPECTVID' + moment().format('YYYYMMDDHHmmss') + '.mp4';
        /*console.log("RNFS.CachesDirectoryPath : ", RNFS.CachesDirectoryPath);
        console.log("RNFS.ExternalCachesDirectoryPath : ", RNFS.ExternalCachesDirectoryPath);
        console.log("RNFS.DocumentDirectoryPath : ", RNFS.DocumentDirectoryPath);
        console.log("RNFS.ExternalStorageDirectoryPath : ", RNFS.ExternalStorageDirectoryPath);
        console.log("RNFS.TemporaryDirectoryPath : ", RNFS.TemporaryDirectoryPath);
        console.log("RNFS.LibraryDirectoryPath : ", RNFS.LibraryDirectoryPath);
        console.log("RNFS.PicturesDirectoryPath : ", RNFS.PicturesDirectoryPath);
        console.log("save Video fileName : ", fileName);*/
        //console.log("save Video as : ", RNFS.ExternalStorageDirectoryPath + '/DCIM/Camera/' + fileName);
        console.log("save Video as : ", RNFS.ExternalStorageDirectoryPath + `/DCIM/${fileName}`);
        //RNFS.copyFile(uri, RNFS.ExternalStorageDirectoryPath + '/DCIM/Camera/' + fileName).then(() => {
        if(uri && this.state.isFileSave == true) {
            RNFS.copyFile(uri, RNFS.ExternalStorageDirectoryPath + `/DCIM/${fileName}`).then(() => {
                console.log("Video copied locally!!");
            }, (error) => {
                console.log("CopyFile fail for video: " + error);
            });
        }        
    }

    stopVideo() {
        if (this.state.isRecording === true){
            if (this.state.progress <= 1){
                setTimeout(()=>{
                    this.camera.stopRecording();
                },1000);
            }
            else {
                this.camera.stopRecording();
            }
        }
    }

}

const styles = StyleSheet.create({
    container: {
        flex:1,
        flexDirection: 'column',
    },
    image: {
        width: 60,
        height: 60,
        margin: 40,
        marginBottom: 40
    },
    imageVideo:{
        width: 60,
        height: 60,
        marginLeft: 80,
        marginBottom: 40
    },
    preview: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    }
});
