import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image,TouchableWithoutFeedback,Platform,
  TextInput,InputAccessoryView,Button,KeyboardAvoidingView,ScrollView,ImageBackground,
   DeviceEventEmitter, TouchableHighlight,FlatList} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import Toast, {DURATION} from 'react-native-easy-toast'
import { Dialog } from 'react-native-simple-dialogs';
const WIDTH = Dimensions.get('screen').width;
const HEIGHT = Dimensions.get('window').height;
import * as lib from '../../common/PositionLib';
import {launchImageLibrary,launchCamera} from "react-native-image-picker";
import {check,request,PERMISSIONS,RESULTS} from 'react-native-permissions';
import imgTakePicture from '../../assets/images/comment/icon_take_picture.png';
import imgTakeVideo from '../../assets/images/comment/icon_take_video.png';
import imgSelectPicture from '../../assets/images/comment/icon_select_picture.png';
import imgSelectVideo from '../../assets/images/comment/icon_select_video.png';
import tagSelect from '../../assets/images/comment/icon_select_tag.png';
import RNFS, {DocumentDirectoryPath} from "react-native-fs";
import ImageSize from 'react-native-image-size';
import ImageResizer from 'react-native-image-resizer';
const MAX_VIDEO_SIZE = 20*1024*1024;
const MAX_PICTURE_SIZE = 10*1024*1024;
import store from "../../../mobx/Store";
import CameraRoll from "@react-native-community/cameraroll";
import PropTypes from "prop-types";
import * as simpleStore from "react-native-simple-store";
export default class ImageVideoPanel extends Component {

    state = {
        patrolSelector: store.patrolSelector,
        enumSelector: store.enumSelector
    };

    static propTypes = {
        imageOverLimitMsg: PropTypes.Text,
        videoOverLimitMsg: PropTypes.Text
    };

    static defaultProps = {
        imageOverLimitMsg: I18n.t("Image Limit"),
        videoOverLimitMsg: I18n.t("Video Limit")
    };

    showError(e){
      if(this.props.onError)this.props.onError(e)
    }

    toMMSS(secs){
      var sec_num = parseInt(secs, 10)
      var minutes = Math.floor(sec_num / 60) % 60
      var seconds = sec_num % 60

      return [minutes,seconds]
          .map(v => v < 10 ? "0" + v : v)
          .join(":")
    }

    takePicture(){
        if(this.props.isImageOverLimit){
          return this.showError(this.props.imageOverLimitMsg)
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
                            mediaType:'photo',
                            quality:0.8,
                            maxWidth:1080,
                            maxHeight:1080,
                            cameraType:'back',
                            includeBase64:false,
                            saveToPhotos:false,
                            includeExtra:true,
                            selectionLimit:1
                            };
                            launchCamera(options,(response) => {
                                if (response.didCancel || response.errorCode) {}
                                else {
                                    let asset = response.assets[0];
                                    let targetUrl = asset.uri.replace("file://","");
                                    if (asset.fileSize > MAX_PICTURE_SIZE) {
                                        this.showError(I18n.t('Picture size limit'));
                                    } else if (asset.fileSize == 0) {
                                        this.showError(I18n.t('File Error'));
                                    } else {
                                        if (this.props.onImage){
                                            this.props.onImage([targetUrl],true,asset.width,asset.height);
                                        }
                                    }
                                }
                            });
                        } else {
                            this.showError(I18n.t('Microphone'));
                        }
                    });
                } else {
                    const options = {
                        mediaType:'photo',
                        quality:0.8,
                        maxWidth:1080,
                        maxHeight:1080,
                        cameraType:'back',
                        includeBase64:false,
                        saveToPhotos:false,
                        includeExtra:true,
                        selectionLimit:1
                    };
                    launchCamera(options,(response) => {
                        if (response.didCancel || response.errorCode) {}
                        else {
                            let asset = response.assets[0];
                            this.orientation = (asset.height > asset.width);
                            this.destPath = DocumentDirectoryPath +'/'+asset.fileName;
                            RNFS.moveFile(asset.uri, this.destPath).then((success)=>{
                                if (asset.fileSize > MAX_PICTURE_SIZE){
                                        this.showError(I18n.t('Picture size limit'));
                                } else if (asset.fileSize == 0) {
                                    this.showError(I18n.t('File Error'));
                                } else {
                                    ImageSize.getSize('file://'+ this.destPath).then(size => {
                                        if(size.rotation != 0){
                                            ImageResizer.createResizedImage(this.destPath,1080,1080,"JPEG", 100, 0).then(response =>{
                                                if (this.props.onImage){
                                                    this.props.onImage(['file://'+ response.path],true,response.width,response.height);
                                                }
                                            })
                                            .catch(err => {
                                            });
                                        }
                                        else{
                                            if (this.props.onImage){
                                                this.props.onImage(['file://'+this.destPath],true,asset.width,asset.height);
                                            }
                                        }
                                    })
                                }
                            }).catch(error=>{
                                console.log(error)
                            })
                        }
                    });
                }
            } else{
                AlertUtil.alert(I18n.t('Camera'));
            }
        });
    }

    pickerPicture(){
        if(this.props.isImageOverLimit){
          return this.showError(this.props.imageOverLimitMsg)
        }
        let limit = Platform.OS === 'ios' ? this.props.imageAvailableCount : 0;
        const options = {
            mediaType:'photo',
            quality:0.8,
            maxWidth:1080,
            maxHeight:1080,
            cameraType:'back',
            includeBase64:false,
            saveToPhotos:false,
            includeExtra:true,
            selectionLimit:limit
        };
        launchImageLibrary(options,(response) => {
            if (response.didCancel || response.errorCode) {}
            else {
                let pictures = [], heights = [], widths = [];
                response.assets.forEach((item,index) =>{
                    if(item.fileSize == 0) {
                        this.showError(I18n.t('File Error'));
                    } else {
                        if(Platform.OS === 'android'){
                            pictures.push(item.uri);
                        } else {
                            let path = RNFS.DocumentDirectoryPath + '/'+ item.fileName;
                            RNFS.moveFile(item.uri, path);
                            pictures.push(path);
                        }
                        heights.push(item.height);
                        widths.push(item.width);
                    }
                })
                if (pictures.length > 0){
                    if (pictures.length > this.props.imageAvailableCount){
                        return this.showError(this.props.imageOverLimitMsg);
                    }
                    else{
                        if (this.props.onImage){
                            this.props.onImage(pictures,false,widths,heights);
                        }
                    }
                }
            }
        });
    }

    async takeVideo(){
        this.isFileSave = true;
        let res = await simpleStore.get('InspectionSetting');
        if (res != null) {
            let setting = JSON.parse(res);
            this.isFileSave = setting.isFileSave;
        }
        if(this.props.isVideoOverLimit){
          return this.showError(this.props.videoOverLimitMsg)
        }
        if(this.props.isImageOverLimit){
          return this.showError(this.props.imageOverLimitMsg)
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
                    if (result ===  RESULTS.GRANTED) {
                        request(Platform.select({
                            android: PERMISSIONS.ANDROID.CAMERA,
                            ios: PERMISSIONS.IOS.CAMERA,
                        }),
                        ).then(result => {
                            if(Platform.OS === 'ios'){
                                console.log("this.isFileSave : ", this.isFileSave);
                                const options = {
                                    mediaType:'video',
                                    quality:0.8,
                                    maxWidth:1080,
                                    maxHeight:1080,
                                    videoQuality:'medium',
                                    durationLimit:10.1,
                                    cameraType:'back',
                                    includeBase64:false,
                                    includeExtra:true,
                                    saveToPhotos:this.isFileSave,
                                    includeExtra:true,
                                    selectionLimit:1
                                };
                                //if(this.props.onStartRecord)this.props.onStartRecord();
                                launchCamera(options,(response) => {
                                    if (response.didCancel || response.errorCode) {}
                                    else {
                                        let date = new Date();
                                        let time = date.getTime();
                                        let ipath = response.assets[0].uri.replace("file://","");
                                        console.log(ipath)

                                        setTimeout(function() {
                                          CameraRoll.save(ipath).then(function(result) {
                                            console.log("CameraRoll.save"+result)
                                              let path = RNFS.DocumentDirectoryPath + `/${time}.MOV`;
                                              RNFS.moveFile(response.assets[0].uri, path)
                                              .then((success) => {
                                                  console.log("Move File" + success)
                                                  if(this.props.onFinishRecord)this.props.onFinishRecord();
                                                  this.videoEmitter && this.videoEmitter.remove();
                                                  if(this.props.onVideo && path){
                                                      this.props.onVideo(path);
                                                  }
                                              })
                                              .catch((err) => {
                                                    console.log("  RNFS.moveFile error" +err)
                                              });
                                           }.bind(this)).catch(function(error) {
                                             console.log("  CameraRoll.save error=" +error)
                                             let path = RNFS.DocumentDirectoryPath + `/${time}.MOV`;
                                             RNFS.moveFile(response.assets[0].uri, path)
                                             .then((success) => {
                                                 if(this.props.onFinishRecord)this.props.onFinishRecord();
                                                 this.videoEmitter && this.videoEmitter.remove();
                                                 if(this.props.onVideo && path){
                                                     this.props.onVideo(path);
                                                 }
                                             })
                                           }.bind(this));
                                         }.bind(this), 1000);

                                    }
                                });
                            } else {
                                this.videoEmitter = DeviceEventEmitter.addListener('onVideoOut', this.onVideoFun.bind(this));
                                if(this.props.onStartRecord)this.props.onStartRecord();
                                Actions.push('recordVideo');
                            }});
                    } else {
                        AlertUtil.alert(I18n.t('Microphone'));
                    }
                });
            } else {
                AlertUtil.alert(I18n.t('Camera'));
            }
        });
    }

    onVideoFun(path){
        this.videoEmitter && this.videoEmitter.remove();
        if(this.props.onVideo && path){
            this.props.onVideo(path);
        }
        if(this.props.onFinishRecord){
          this.props.onFinishRecord();
        }
    }

    pickerVideo(){
        if(this.props.isVideoOverLimit){
          return this.showError(this.props.videoOverLimitMsg)
        }
        if(this.props.isImageOverLimit){
          return this.showError(this.props.imageOverLimitMsg)
        }
        const options = {
            mediaType:'video',
            cameraType:'back',
            includeExtra:true,
            selectionLimit:1
        };
        launchImageLibrary(options,async(response) => {
            if (response.didCancel || response.errorCode) {
                this.showError(I18n.t('File Error'));
            } else {
                let flag = true;
                let asset = response.assets[0];
                try{
                    let file = await RNFS.stat(Platform.OS === 'ios' ? decodeURIComponent(asset.uri) : asset.uri);
                    if (file.size > MAX_VIDEO_SIZE){
                        //DeviceEventEmitter.emit('OnShowIndicator',I18n.t('Video size limit'));
                        flag = false;
                        this.showError(I18n.t('Video size limit'));
                    }
                }
                catch(error){
                  console.log(error)
                }
                if(flag){
                    if(this.props.onVideo){
                        if(Platform.OS === 'ios'){
                            let date = new Date();
                            let time = date.getTime();
                            let path = RNFS.DocumentDirectoryPath + `/${time}.MOV`;
                            RNFS.moveFile(asset.uri, path)
                            .then((success) => {
                                this.props.onVideo(path);
                           })
                           .catch((err) => {});
                        }
                        else{
                            this.props.onVideo(asset.uri);
                        }
                    }
                }
            }
        });
    }

    openSelectMemo() {
        this.props.openModalMemo && this.props.openModalMemo(this.props.selectMemo);
    }

    renderItem = ({ item,index }) => {
        if(item.visible == false) {
            return null;
        }
        let isTagItem = (item.title == I18n.t('Comment Pick memo'));
        return (
            <View style={{width:((WIDTH-20))/4, alignItems:'center', marginTop:25}}>
                <TouchableHighlight style={styles.selectIconContainer} underlayColor="#69727C" onPress={() => item.clickFunc()}>
                    <View style={{height:60,width:60,justifyContent:'center',alignItems:'center', backgroundColor: '#f2f5f6', borderRadius: 10}}>
                        <Image resizeMode={'contain'} style={isTagItem ? {height:20,width:26} : {width:60}} source={item.img}/>
                    </View>
                </TouchableHighlight>
                <Text style={{fontSize:12,color:'#69727C',marginTop:8}}>{item.title}</Text>
                {item.required && <View style={{position:'absolute',height:15,width:15,borderRadius:10,top:-5,right:5,backgroundColor:'red'}}/>}
            </View>
        )
    }

    render() {
        const {patrolSelector, enumSelector} = this.state;
        let functionMap = [];

        let commentMediaRequired = false, collection = patrolSelector.collection;

        if(collection && collection.memo_is_advanced && collection.memo_config) {
            if(collection.memo_config.memo_required_type == enumSelector.memoRequiredType.REQUIRED ||
                (collection.memo_config.memo_required_type == enumSelector.memoRequiredType.REQUIRED_UNQUALIFIED &&
                    (collection.scoreType == enumSelector.scoreType.UNQUALIFIED || collection.scoreType == enumSelector.scoreType.FAIL))) { // 必填或不合格時必填
                if(collection.memo_config.memo_check_media &&
                    !collection.attachment.find(p => (p.mediaType == enumSelector.mediaTypes.VIDEO || p.mediaType == enumSelector.mediaTypes.IMAGE))) {
                    commentMediaRequired = true;
                }
            }
        }

        if(this.props.enableCapture == true) {
            functionMap.push({
                title: I18n.t('Comment Take photo'),
                clickFunc: () => this.takePicture(),
                img: imgTakePicture,
                required: commentMediaRequired
            })
        }
        if(this.props.enableImageLibrary == true) {
            functionMap.push({
                title: I18n.t('Comment Pick photo'),
                clickFunc: () => this.pickerPicture(),
                img: imgSelectPicture,
                required: commentMediaRequired
            })
        }
        if(this.props.enableCapture == true) {
            functionMap.push({
                title: I18n.t('Comment Take video'),
                clickFunc: () => this.takeVideo(),
                img: imgTakeVideo,
                required: commentMediaRequired
            })
        }
        if(this.props.enableImageLibrary == true) {
            functionMap.push({
                title: I18n.t('Comment Pick video'),
                clickFunc: () => this.pickerVideo(),
                img: imgSelectVideo,
                required: commentMediaRequired
            })
        }
        if(this.props.openModalMemo && collection && collection.memo_is_advanced && collection.memo_options.length > 0) {
            functionMap.push({
                title: I18n.t('Comment Pick memo'),
                clickFunc: () => this.openSelectMemo(),
                img: tagSelect,
                required: false
            })
        }
        return (
            <View style={{ width:WIDTH,height:HEIGHT/3,flexDirection:'row',justifyContent:'flex-start',
                           alignItems:'flex-start',paddingLeft:10,paddingRight:10,backgroundColor:'#FFF'}}>
                <FlatList numColumns={4}
                          data={functionMap}
                          renderItem={this.renderItem}
                          showsVerticalScrollIndicator={false}/>
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
     justifyContent:'center',alignItems:'center',width:24,height:28,
  },
  selectIconContainer:{
     justifyContent:'center',alignItems:'center',height:60,width:60,
      backgroundColor:'transparent',borderRadius:12,
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
