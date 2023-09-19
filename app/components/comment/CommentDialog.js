import React, {Component} from 'react';
import {BackHandler,StyleSheet, View, Text, Dimensions, Image,TouchableWithoutFeedback,NativeModules,
    TextInput,InputAccessoryView,Button,KeyboardAvoidingView,ScrollView,ImageBackground,Modal,
    DeviceEventEmitter, TouchableOpacity,  SafeAreaView,FlatList} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import Toast, {DURATION} from 'react-native-easy-toast'
import Dialog from './Dialog';
import {STATUS_BAR} from './Constant'

//const {height} = Dimensions.get('window');
//const {width} = Dimensions.get('screen');　
import DimUtil from '../../common/DimUtil'
const {height,width} = DimUtil.getDimensions("portrait")
//console.log("Commont")
//console.log("SFSDF"+height+"/"+width)
const HEIGHT =height;
const WIDTH = width;


import * as lib from '../../common/PositionLib';
import { Keyboard, KeyboardEvent,ActivityIndicator } from 'react-native';
import addInmage from '../../assets/images/comment/btn_add.png';
import microphoneImage from '../../assets/images/comment/btn_microphone.png';
import cancelImage from '../../assets/images/comment/btn_cancel.png';
import imgSend from '../../assets/images/comment/btn_send.png';

import imgMicrophoneGreen  from '../../assets/images/comment/btn_microphone_green.png';
import imgAddContent from '../../assets/images/comment/feedback_add_content.png';
import store from "../../../mobx/Store";
import AudioRecordPanel from './AudioRecordPanel'
import ImageVideoPanel from './ImageVideoPanel'
import DialogPhotoEditor from './DialogPhotoEditor'
import CommentResourcesBlock from './CommentResourcesBlock'
import ErrorMessage from './ErrorMessage'
import Navigation from "../../element/Navigation";
import {Card} from 'react-native-shadow-cards';
import {CLOSE_PREVIEW,EMITTER_SOUND_STOP,CLOSE_PHOTEDITOR } from "../../common/Constant";
import ModalMemo from "../../customization/ModalMemo";
import Marker, {Position} from "react-native-image-marker";
import UserPojo from "../../entities/UserPojo";
import rnTextSize, { TSFontSpecs } from 'react-native-text-size'
const TEXT_RESOURCE_LIMIT = 5;
const VIDEO_RESOURCE_LIMIT = 2;
const IMAGE_VIDEO_LIMIT = 10;
const INPUT_TEXT_LEN_MAX = 1000;
const TOTAL_IMAGE_VIDEO_LIMIT = 120;

export default class CommentDialog extends Component {
    state = {
      visible:this.props.visible,
      text:'', keyboardHeight:0,
      isLoading:false,
      mode: ( this.props.enableImageLibrary | (this.props.enableCapture==undefined | this.props.enableCapture) )?'image':'text',
      question:this.props.defaultQuestion?this.props.defaultQuestion:'',
      isAudioRecording:false,
      dataList:this.props.defaultData?JSON.parse(JSON.stringify(this.props.defaultData)):[],
      audioRecordInfo:{},
      bottomHeigh:55,
      contentMode:false,
      editTarget:null,
      editText:'',
      previewing:false,
      editImage:false,
      imgPath:null,
      imgWidth:0,
      imgHeight:0,
      height:HEIGHT,
      selectMemo: []
    };

    constructor(props) {
        super(props);
        this.showErrorMsg = this.showErrorMsg.bind(this);
    }

    componentDidMount(){
      Keyboard.addListener('keyboardDidShow', this.onKeyboardDidShow.bind(this));
      Keyboard.addListener('keyboardDidHide', this.onKeyboardDidHide.bind(this));
      if (Platform.OS === 'android') {
          BackHandler.addEventListener('commentDialogeBack', this.onBackAndroid);
      }
      this.notifyEmitter = DeviceEventEmitter.addListener(CLOSE_PREVIEW, ()=>{
          if(this.state.priviewing) {
              this.setState({visible:this.props.visible ? true : false, priviewing:false});
          }
      });
    }

    onBackAndroid = () => {
        const {editImage,imgPath,editText,editTarget} = this.state;
        if(editImage) {
          this.onCancelImageEditor()
        } else if(editTarget) {
          this.setState({editTarget:false})
        } else {
          this.cancel()
        }
        return true;
    }

    componentWillUnmount(){
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('commentDialogeBack', this.onBackAndroid);
        }
        Keyboard.removeListener('keyboardDidShow', this.onKeyboardDidShow.bind(this));
        Keyboard.removeListener('keyboardDidHide', this.onKeyboardDidHide.bind(this));
        this.notifyEmitter && this.notifyEmitter.remove();
        this.imgEditorEmitter && this.imgEditorEmitter.remove();
        DeviceEventEmitter.emit(EMITTER_SOUND_STOP);
    }

    componentWillReceiveProps(nextProp){
      if(!this.state.visible && nextProp.visible){
        this.setState({
          isLoading:false,
          contentMode:false,
          visible:true,
          text:'', keyboardHeight:0,
          mode:'text',
          isAudioRcording:false,
          dataList:nextProp.defaultData?JSON.parse(JSON.stringify(nextProp.defaultData)):[],
          audioRecordInfo:{},
          question:nextProp.defaultQuestion?nextProp.defaultQuestion:'',priviewing:false,
        })
      } else{
        if(this.state.visible && !nextProp.visible){
            this.setState({isLoading:false,priviewing:false})
        }
        this.setState({visible:nextProp.visible})
      }
    }

    showErrorMsg(msg){
      this.setState({isLoading:false})
      this.refs.toastsaving.show(msg);
    }

    isTextOverLimit(){
      const {dataList} = this.state;
      var count = 0;
      for(var k in dataList){
          if(dataList[k].mediaType==store.enumSelector.mediaTypes.TEXT)
            count+=1;
      }
      return count>=TEXT_RESOURCE_LIMIT;
    }

    isAudioOverLimit(){
      const {dataList} = this.state;
      var count = 0;
      for(var k in dataList){
          if(dataList[k].mediaType==store.enumSelector.mediaTypes.AUDIO)
            count+=1;
      }
      return count>=TEXT_RESOURCE_LIMIT;
    }

    isImageOverLimit(){
      const {dataList} = this.state;
      var icount = 0;
      var vcount = 0;
      for(var k in dataList){
          if(dataList[k].mediaType==store.enumSelector.mediaTypes.IMAGE)
            icount+=1;
          if(dataList[k].mediaType==store.enumSelector.mediaTypes.VIDEO)
            vcount+=1;
      }
      let otherAttachmentCount = this.props.otherAttachmentCount ? this.props.otherAttachmentCount : 0;
      return (icount+vcount+otherAttachmentCount)>=TOTAL_IMAGE_VIDEO_LIMIT;
    }

    imageAvailableCount(){
      const {dataList} = this.state;
      var icount = 0;
      var vcount = 0;
      for(var k in dataList){
          if(dataList[k].mediaType==store.enumSelector.mediaTypes.IMAGE)
            icount+=1;
          if(dataList[k].mediaType==store.enumSelector.mediaTypes.VIDEO)
            vcount+=1;
      }
      return TOTAL_IMAGE_VIDEO_LIMIT - (icount+vcount);
    }

    isVideoOverLimit() {
      const {dataList} = this.state;
      var icount = 0;
      var vcount = 0;
      for(var k in dataList) {
        if(dataList[k].mediaType==store.enumSelector.mediaTypes.IMAGE)
          icount+=1;
        if(dataList[k].mediaType==store.enumSelector.mediaTypes.VIDEO)
          vcount+=1;
      }
      let otherAttachmentCount = this.props.otherAttachmentCount ? this.props.otherAttachmentCount : 0;
      return (icount+vcount+otherAttachmentCount)>=TOTAL_IMAGE_VIDEO_LIMIT;
    }

    onKeyboardDidShow(e) {
      if(!this.state.editTarget) {
        this.setState({keyboardHeight:e.endCoordinates.height});
      }
    }

    onKeyboardDidHide(e) {
      this.setState({keyboardHeight:0});
    }

    isEmpty() {
      const {dataList} =this.state;
      if(dataList.length ==0 ){
         return true;
      } else {
        return false;
      }
    }

    onDeleteItem(c){
        var dataList =this.state.dataList;
        var newList =[]
        for(var k in dataList){
            if(dataList[k]!=c){
                newList.push(dataList[k])
            }
        }
        this.setState({dataList:newList});
    }

    onEditItem(c){
      if(c && c.mediaType==store.enumSelector.mediaTypes.TEXT){
        if(c.isMemo) {
          this.setState({selectMemo: c.url.split('，')}, function() {
            this.modalMemo && this.modalMemo.open();
          });
        } else {
          this.setState({editTarget:c, editText:c.url, keyboardHeight:0})
        }
      }
    }

    hideDialog(){
      setTimeout(function(){
        this.setState({visible:false,priviewing:true})
      }.bind(this),100)
    }

    onPlayItem(c){
      this.hideDialog()

    }

    renderContent() {
      const {dataList} =this.state;
      if(this.isEmpty()){
        return(<View >
          <ErrorMessage ref="toastsaving" mode={"saving"}/>
        </View>)
      } else {
        return <View style={{flex:1,marginBottom:60,paddingTop:10}}>
                <CommentResourcesBlock blockStyle={{backgroundColor:'#EAF1F3',padding:16}}
                  data={dataList}
                  showDelete={this.props.showDelete}
                  showEdit={this.props.showEdit}
                  onPlayItem={(c)=>this.onPlayItem(c)}
                  onEditItem={(c)=>this.onEditItem(c)}
                  onDeleteItem={(c)=>this.onDeleteItem(c)}
                />
                <ErrorMessage ref="toastsaving" mode={"saving"}/>
                </View>
      }
    }

    cancel(){
      this.setState({visible:false})
      if(this.props.onCancel)this.props.onCancel();
    }

    canClose(){
      const {dataList} = this.state;
      var question = this.state.question.trim()

      if(this.props.needImage || this.props.title == I18n.t('Relate')){
        let isImage= false;
        for(var k in dataList){
          if(dataList[k].mediaType == store.enumSelector.mediaTypes.IMAGE){
            isImage = true;
            break;
          }
        }
        if(!isImage)
          return false;
      }
      if(this.props.needContent){
        if(dataList.length==0){
            //this.refs.toast.show(I18n.t('Neet Resource'))
            return false;
        }
      }
      if(this.props.questionMode){
          if(!question || question.length==0){
            return false;
          }
      }
      return true;
    }

    close(){
      const {dissmissWhenClose,onClose,onNotClose} = this.props;
      const {dataList,question} = this.state;

      if(this.props.questionMode){
          if(!question || question.length==0){
            this.refs.toast.show(I18n.t('Neet Qustion'))
            return;
          }
      }
      if(this.props.needContent){
        if(dataList.length==0){
           this.refs.toast.show(I18n.t('Neet Resource'))
            return ;
        }
      }
      this.hideKeyboard();
      if(dissmissWhenClose==undefined || dissmissWhenClose ){
        if(onClose) {
          onClose(dataList,question.trim());
        }
        this.setState({visible:false,mode:'image',text:''})
      } else{
        if(onNotClose)onNotClose(dataList,question.trim());
        this.setState({isLoading:true})
      }
    }

    addText(c){
       if(!this.isTextOverLimit()) {
         const {text} =this.state;
         var newText = text +c
         if(this.isTextLenOk(newText,INPUT_TEXT_LEN_MAX))
            this.setState({text:newText})
       } else{
          this.refs.toast.show(I18n.t('Text Limit'))
       }
    }

    changeBottomHeight(h){
      h = h+16;
      if(h<55)h=55;
      if(h>94)h=94;
      this.setState({bottomHeigh:h})
    }

    getTextLen(val) {
        var returnValue = '';
        var byteValLen = 0;
        for (var i = 0; i < val.length; i++) {
            if (val[i].match(/[^\x00-\xff]/ig) != null)
                byteValLen += 2;
            else
                byteValLen += 1;
        }
        return byteValLen;
    }

    getTextLast(val,max) {
        var returnValue = '';
        var index = 0;
        var byteValLen = 0;
        for (var i =val.length-1; i>=0; i--) {
            if (val[i].match(/[^\x00-\xff]/ig) != null)
                byteValLen += 2;
            else
                byteValLen += 1;
            if(byteValLen>max){
              return val.substring(i,val.length)
            }
        }
        return val;
    }

    filterText(temp){
       if(temp && this.state.keyboardHeight == 0){
         var output = temp;
         var arr = temp.split('\n');
         for(var k = arr.length-1;k>=0;k--){
           if(arr[k] && arr[k].length>0){
             var out =  arr[k];
             if(this.getTextLen(out)> 24 || arr.length>1){
               out = this.getTextLast(out,24)
               return '... ' +out;
             }
             return out;
           }
         }
         return ''
       }
       return temp;
    }

    isTextLenOk(val, max) {
        var returnValue = '';
        var byteValLen = 0;
        for (var i = 0; i < val.length; i++) {
            if (val[i].match(/[^\x00-\xff]/ig) != null)
                byteValLen += 2;
            else
                byteValLen += 1;
            if (byteValLen > max)
            {
                return false;
            }
        }
        return true;
    }

    renderModeText(){
      if(this.state.editTarget){
        return null;
      }
      const {text, keyboardHeight, mode, bottomHeigh, dataList} = this.state;
      var quickList=["OK",  I18n.t("Do Right Now"),I18n.t("Next Time Notice")];
      var isFile = this.props.enableImageLibrary | (this.props.enableCapture==undefined | this.props.enableCapture);
      var quickNodes = quickList.map(function(c,i){
          return  (<TouchableOpacity
                    style={styles.quickButton}
                    onPress={()=>this.addText(c)}>
                    <Text style={{fontSize:12}}>{c}</Text>
                  </TouchableOpacity>)
      }.bind(this))
      let selectMemo = [];
      dataList.forEach(item => {
        if(item.isMemo == true) {
          selectMemo = item.url.split('，');
        }
      })

      let commentRequire = false;
      if(store.patrolSelector && store.patrolSelector.collection) {
        let collection = store.patrolSelector.collection;
        let attachment = store.patrolSelector.collection.attachment || [];
        if(collection.memo_is_advanced && collection.memo_config) {
          if(collection.memo_config.memo_required_type == store.enumSelector.memoRequiredType.REQUIRED ||
              (collection.memo_config.memo_required_type == store.enumSelector.memoRequiredType.REQUIRED_UNQUALIFIED &&
                  (collection.scoreType == store.enumSelector.scoreType.UNQUALIFIED || collection.scoreType == store.enumSelector.scoreType.FAIL))) { // 必填或不合格時必填
            if(collection.memo_config.memo_check_text && !attachment.find(p => p.mediaType == store.enumSelector.mediaTypes.TEXT)) {
                commentRequire = true;
            }
          }
        }
      }

      let collection = store.patrolSelector.collection;
      let isMemoSelect = (collection && collection.memo_is_advanced && collection.memo_options && collection.memo_options.length > 0);

      return (
        <View style={(keyboardHeight>0 ) ?Platform.OS=='ios'?{position:'absolute',
                  top:this.state.height-keyboardHeight-bottomHeigh-33 - (commentRequire?18:0)}:{position:'absolute',bottom:0}:{position:'absolute',bottom:0}}
                           alwaysVisible={true}
                           avoidKeyboard={true}
                           hideBorder={true}
                           androidAdjustResize>
          {commentRequire && <Text style={{paddingLeft: 5, color: '#C60957'}}>{I18n.t('Patrol commented Required')}</Text>}
          <View style={[styles.bottomZone,{height:bottomHeigh}]}>
             {mode=='text' ? (isFile || isMemoSelect) ? <TouchableOpacity style={styles.imageButton}
                       onPress={()=>{this.hideKeyboard();this.setState({keyboardHeight:0,mode:'image'})}}>
                     <Image source={addInmage}   resizeMode={'stretch'}  style={[styles.imageButton,{marginLeft:4,width:24,height:24}]}  />
             </TouchableOpacity>:<View style={[styles.imageButton,{width:9}]}/>:null}
             {mode=='voice'? isFile?<TouchableOpacity style={styles.imageButton}
                       enabled={!this.state.isAudioRecording}
                       onPress={()=>{this.hideKeyboard();this.setState({keyboardHeight:0,mode:'image'})}}>
                     <Image source={addInmage} resizeMode={'stretch'}  style={[styles.imageButton,{marginLeft:4,width:24,height:24}]}/>
            </TouchableOpacity>:<View style={[styles.imageButton,{width:9}]}/>:null}
             {mode=='image'? <TouchableOpacity style={styles.imageButton}
                        onPress={()=>{this.hideKeyboard();this.setState({keyboardHeight:0,mode:'text'})}}>
                      <Image source={cancelImage} resizeMode={'stretch'}  style={[styles.imageButton,{marginLeft:4,width:24,height:24}]}/>
              </TouchableOpacity>:null}
              <TextInput
                  ref="textinput"
                  editable={!this.state.isAudioRecording}
                  onChangeText={(v) =>{
                    if(!this.isTextOverLimit(v)) {
                      if(this.isTextLenOk(v,INPUT_TEXT_LEN_MAX)) this.setState({text:v})
                    } else {
                      this.refs.toast.show(I18n.t('Text Limit'))
                    }
                  }}
                  value={this.filterText(text)}
                  multiline={true}
                  blurOnSubmit={false}
                  autoFocus={false}
                  autoCorrect={false}
                  autoCapitalize="none"
                  placeholderStyle={{lineHeight: 22,fontSize:14}}
                  onBlur={()=>{this.setState({keyboardHeight:0,bottomHeigh:55})}}
                  onFocus={()=>{
                    this.setState({mode:'text'});
                    if(this.isTextOverLimit()){this.refs.toast.show(I18n.t('Text Limit'))}}}
                  onContentSizeChange={(event) => {
                    this.changeBottomHeight( event.nativeEvent.contentSize.height)
                  }}
                  style={{backgroundColor:"#fff",marginBottom:8,marginTop:8,lineHeight: 22,
                  width:WIDTH-100,paddingLeft:18,paddingRight:18,fontSize:14,paddingTop:4,paddingBottom:8,
                  borderRadius:10,flex:1,marginLeft:3,marginRight:3}}
                  placeholder={I18n.t('Input Message')}
               />
            {( mode=='text' && keyboardHeight>0 && text.trim().length>0)?
              <TouchableOpacity style={styles.imageButton}
                    onPress={()=>{this.onAddText(text.trim())}}>
                     <Image source={imgSend} resizeMode={'stretch'} style={[styles.imageButton]}/>
              </TouchableOpacity>:
               mode=='text'?<TouchableOpacity style={styles.imageButton}
                     onPress={()=>{this.hideKeyboard();this.setState({keyboardHeight:0,mode:'voice'});}}>
                      <Image source={microphoneImage} resizeMode={'stretch'} style={styles.imageButton}/>
              </TouchableOpacity>:null}
              {mode=='voice'?<TouchableOpacity style={styles.imageButton}
                      enabled={!this.state.isAudioRecording}
                      onPress={()=>{this.hideKeyboard();this.setState({keyboardHeight:0,mode:'text'})}}>
                      <Image source={imgMicrophoneGreen} resizeMode={'stretch'} style={[styles.imageButton]}/>
              </TouchableOpacity>:null}
              {mode=='image'?<TouchableOpacity style={styles.imageButton}
                     onPress={()=>{this.hideKeyboard();this.setState({keyboardHeight:0,mode:'voice'});}}>
                      <Image source={microphoneImage} resizeMode={'stretch'} style={styles.imageButton}/>
              </TouchableOpacity>:null}
          </View>
          <View >
          {mode=='voice'?<AudioRecordPanel
              onError={(e)=>this.onError(e)}
              isOverLimit={this.isAudioOverLimit()}
              onStartAudio={()=>this.onStartAudio()}
              onStopAudio={(f,d,e)=>this.onStopAudio(f,d,e)}
          />:null}
            {mode=='image'? <ImageVideoPanel
                 isImageOverLimit={this.isImageOverLimit()}
                 isVideoOverLimit={this.isVideoOverLimit()}
                 imageOverLimitMsg={I18n.t("Attachment Total Limit")}
                 videoOverLimitMsg={I18n.t("Attachment Total Limit")}
                 imageAvailableCount={this.imageAvailableCount()}
                 onError={(e)=>this.onError(e)}
                 onStartRecord={()=>{this.hideDialog()}}
                 onFinishRecord={()=>{this.setState({visible:true,priviewing:false})}}
                 enableImageLibrary={this.props.enableImageLibrary}
                 enableCapture={(this.props.enableCapture==undefined | this.props.enableCapture)}
                 onImage={(p,e,imgW,imgH)=>this.onImage(p,e,imgW,imgH)}
                 onVideo={(p)=>this.onVideo(p)}
                 openModalMemo={(selectMemo)=>{this.openModalMemo(selectMemo)}}
                 selectMemo={selectMemo}
              />:null}
            {(keyboardHeight>0 && mode=='text') ?
            <ScrollView keyboardShouldPersistTaps='handled' horizontal={true} style={{backgroundColor:'#C2C6CC'}}>
              <View style={styles.quickmenu}>
                {quickNodes}
              </View>
            </ScrollView> : null}
            <ErrorMessage ref="toast"/>
            {( mode=='text' && keyboardHeight==0) ?
              <View style={{height:42, width:WIDTH, backgroundColor:'#C2C6CC'}}/> : null}
          </View>
        </View>
      )
    }

    onAddText(text){
      const {dataList} = this.state;
      dataList.push({
         mediaType: store.enumSelector.mediaTypes.TEXT,
         url: text,
         ts: new Date().getTime()
      })
      text = '';
      this.setState({dataList,text})
    }

    onAddMemo(data){
      if(data && data.length > 0) {
        let text = '';
        data.forEach(item => {
          if(text != '') {
            text += '，';
          }
          text += item;
        })

        const {dataList} = this.state;
        let memoTextExist = false;
        dataList.forEach(item => {
          if(item.isMemo == true) {
            item.url = text;
            item.ts = new Date().getTime();
            memoTextExist = true
          }
        })
        if(memoTextExist == false) {
          dataList.push({
            mediaType: store.enumSelector.mediaTypes.TEXT,
            url: text,
            ts: new Date().getTime(),
            isMemo: true
          })
        }
        this.setState({dataList})
      }
    }

    async onStartAudio(){
      this.setState({isAudioRecording:true})
    }

    async onStopAudio(f,d,e){
      const {dataList} = this.state;
      clearInterval(this.audioTimer)
      this.setState({isAudioRecording:false})
      if(e){
        console.log("Record Error="+e)
      } else if(f){
        dataList.push({
           mediaType:store.enumSelector.mediaTypes.AUDIO,
           duration:d,
           url:f,
           ts:new Date().getTime()
        })
        this.setState({dataList})
      }
    }

    toMMSS(secs){
      var sec_num = parseInt(secs, 10)
      var minutes = Math.floor(sec_num / 60) % 60
      var seconds = sec_num % 60

      return [minutes,seconds]
          .map(v => v < 10 ? "0" + v : v)
          .join(":")
    }

    onError(e){
      this.refs.toast.show(e)
    }

    getStrLength(str) {
      return str.replace(/[A-Z]/g,"xx").replace(/[^\x00-\xff]/g,"xx").length;
    }

    getTextWidth(str, fontSize) {
      let result = 0;
      let ele = React.createElement('div', {
        innerText: str,
        style: {
          "font-size": '44px',
          "opacity": 0
        }
      });
      //ele.style.position = "absolute";
      //ele.style.whiteSpace = "nowrap";
      //ele.style.fontSize = fontSize;
      //ele.style.opacity = 0;
      //ele.innerText = str;
      //document.body.append(ele);
      //result = ele.getBoundingClientRect().width;
      result = ele.current.offsetWidth;
     // document.body.removeChild(ele);
      return result;
    }

    rgba2hex(orig) {
      let a, isPercent,
      rgb = orig.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
      alpha = (rgb && rgb[4] || "").trim(),
      hex = rgb ?
      (rgb[1] | 1 << 8).toString(16).slice(1) +
      (rgb[2] | 1 << 8).toString(16).slice(1) +
      (rgb[3] | 1 << 8).toString(16).slice(1) : orig;

      if (alpha !== "") {
        a = alpha;
      } else {
        a = '01';
      }
      // multiply before convert to HEX
      a = ((a * 255) | 1 << 8).toString(16).slice(1)
      hex = hex + a;

      return '#' + hex;
    }

    async addMarker(path, e, imgW, imgH) {
      //console.log("Add Marker")
      let settings = store.paramSelector.waterPrintParam;
      let fontSize = parseFloat(settings.waterPrintSize.replace('px', ''));
      let color = this.rgba2hex(settings.waterPrintColor);
      let text = settings.waterPrintType == 0 ? settings.waterPrintText : UserPojo.getUserName();
      let options = {
        src: path,
        text: text,
        //position: settings.waterPrintPosition,
        //X: imgW - length - 10,
        //Y: imgH/2 - (fontSize/2),
        color: color,
        fontName:'Arial',
        fontSize: fontSize,
        /*shadowStyle: {
          dx: 5,
          dy: 5,
          radius: 5,
          color: '#000000'
        },*/
        /*textBackgroundStyle: {
          type: 'default',
          paddingX: 10,
          paddingY: 10,
          color: '#0f0'
        },*/
        scale: 1,
        quality: 100
      }
      if( settings.waterPrintPosition == "topLeft" || settings.waterPrintPosition == "topCenter" ||
          settings.waterPrintPosition == "topRight" || settings.waterPrintPosition == "center" ||
          settings.waterPrintPosition == "bottomLeft" || settings.waterPrintPosition == "bottomCenter" ||
          settings.waterPrintPosition == "bottomRight") {
        options.position = settings.waterPrintPosition;
      } else if(settings.waterPrintPosition == "centerLeft") {  // 中左
        options.X = 20;
        options.Y = imgH/2 - (fontSize/2);
      } else if(settings.waterPrintPosition == "centerRight") { // 中右
        const fontSpecs = {
          fontFamily: undefined,
          fontSize: fontSize,
          fontStyle: 'Arial'
        }
        const textSize = await rnTextSize.measure({
          text,             // text to measure, can include symbols
          imgW,            // max-width of the "virtual" container
          ...fontSpecs,     // RN font specification
        })
        options.X = imgW - 20 - textSize.width;
        options.Y = imgH/2 - (fontSize/2);
      } else {
        options.position = 'center';
      }
      Marker.markText(options).then((res) => {
          if(e && (this.props.enablePhotoEdit==undefined || this.props.enablePhotoEdit) ){
            this.setState({editImage:true, imgPath:res, imgWidth:imgW, imgHeight:imgH});
          } else {
            let array = [];
            array.push('file://' + res)
            this.onConfirmImageEditor(array)
          }
      }).catch((err) => {
          console.log("Marker.markText err : ", err)
          if(e && (this.props.enablePhotoEdit==undefined || this.props.enablePhotoEdit) ){
            this.setState({editImage:true,imgPath:path,imgWidth:imgW,imgHeight:imgH});
          } else {
            let array = [];
            array.push(path)
            this.onConfirmImageEditor(array)
          }
      })
    }

    async onImage(p, e, imgW, imgH){
      if(p && p.length>0){
        if(store.userSelector.isWaterPrintOn == true) {
          if(p.length > 1 && p.length == imgW.length && p.length == imgH.length) {
            for(let i=0 ; i<p.length ; ++i) {
              await this.addMarker(p[i], e, imgW[i], imgH[i]);
            }
          } else {
            await this.addMarker(p[0], e, imgW, imgH);
          }
        } else {
          if(e && (this.props.enablePhotoEdit==undefined || this.props.enablePhotoEdit) ){
            this.setState({editImage:true,imgPath:p[0],imgWidth:imgW,imgHeight:imgH});
          } else {
            this.onConfirmImageEditor(p)
          }
        }
      }
    }

    onVideo(p,e){
      if(p){
        const {dataList} =this.state;
        dataList.push({
           mediaType:store.enumSelector.mediaTypes.VIDEO,
           url:p,
           ts:new Date().getTime()
        })
        this.setState({dataList})
      }
    }

    onConfirmImageEditor(p){
      if(p){
        const {dataList} =this.state;
        for(var k in p){
          dataList.push({
             mediaType:store.enumSelector.mediaTypes.IMAGE,
             url:p[k],
             ts:new Date().getTime()
          })
        }
        DeviceEventEmitter.emit(CLOSE_PHOTEDITOR, null);
        this.setState({dataList, editImage:false,visible:true})
      }
    }

    onCancelImageEditor(){
      DeviceEventEmitter.emit(CLOSE_PHOTEDITOR, null);
      this.setState({editImage:false,visible:true})
    }

    renderImageEditor(){
      const {imgPath,keyboardHeight,imgWidth,imgHeight,height} = this.state;
      console.log("imgWidth : ", imgWidth)
      console.log("imgHeight : ", imgHeight)
      return <DialogPhotoEditor
                 visible={this.state.visible}
                 SourceImage={imgPath}
                 imgWidth={imgWidth}
                 imgHeight={imgHeight}
                 onConfrim = {(p)=>{this.onConfirmImageEditor([p]);}}
                 onCancel = {()=>{this.onCancelImageEditor();}}
              />
    }

    renderLoading(){
      if(this.state.isLoading){
        return <View style={{height:this.state.height,width:WIDTH,
                position:'absolute',top:0,left:0,justifyContent:'center',alignItems:'center',
                backgroundColor:'#00000048'}}>
                    <View style={{height:85,width:90,backgroundColor:'transparent',marginTop:this.state.height/10,padding:9}}>
                      <ActivityIndicator animating={true} color='#ffffff' size="large"/>
                      <Text allowFontScaling={false} style={{textAlign:'center',color:'#FFFFFF',fontSize:14,marginTop:9}}>
                        {I18n.t('Saving')}
                      </Text>
                    </View>
                </View>
      } else {
        return null;
      }
    }

    hideKeyboard(){
      if(this.refs.textinput)this.refs.textinput.blur();
      if(this.refs.qinput)this.refs.qinput.blur();
    }

    openModalMemo(selectMemo) {
      if(selectMemo) {
        this.setState({selectMemo}, function() {
          this.modalMemo && this.modalMemo.open();
        })
      } else {
        this.modalMemo && this.modalMemo.open();
      }
    }

    selectMemo(data) {
        this.setState({selectMemo: data});
        this.onAddMemo(data);
    }

    closeMemo() {
    }

    render() {
        const {keyboardHeight,mode,question,editTarget,editText,editImage,priviewing} = this.state;
        /*if(priviewing){
          console.log("Previewing")
        }*/

        if(editImage){
          return (this.renderImageEditor())
        }
        if(editTarget){
          return (<Dialog visible={this.state.visible}
                        editText={true}
                        dialogStyle={[styles.dialog,{height:this.state.height-keyboardHeight}]}>
              <View style={{width:WIDTH,height:this.state.height-keyboardHeight,backgroundColor:'#F7F9FA',
                    justifyContent:"flex-start"}}>
                <Navigation
                    leftButtonTitle={''}
                    onLeftButtonPress={()=>{this.hideKeyboard();setTimeout(function(){ this.setState({editTarget:null})}.bind(this),50)}}
                    title={I18n.t('Text Edit')}
                    rightButtonEnable={(editText&&editText.trim().length>0)?true:false}
                    rightButtonTitle={ I18n.t('Finish')}
                    onRightButtonPress={()=>{editTarget.url=editText;this.hideKeyboard();setTimeout(function(){ this.setState({editTarget:null})}.bind(this),50)}}
                />
                <View style={{height:this.state.height-keyboardHeight-120, position:'absolute',top:Platform.select({android:56, ios:78})}}>
                  <TextInput
                    ref="textinput"
                    onChangeText={(v) =>{ if(this.isTextLenOk(v,INPUT_TEXT_LEN_MAX)) this.setState({editText:v}) } }
                    value={editText}
                    multiline={true}
                    blurOnSubmit={false}
                    autoFocus={true}
                    autoCorrect={false}
                    autoCapitalize="none"
                    style={{color:'#484848',
                    width:WIDTH,paddingLeft:24,paddingRight:24,lineHeight: 22,
                    fontSize:14,paddingTop:20,
                    textAlignVertical:'top',paddingBottom:5,
                    backgroundColor:'#F7F9FA',}}
                    placeholder={I18n.t('Input Message')}/>
                </View>
              </View>
              <ErrorMessage ref="toast"/>
          </Dialog>)
        }
        if(this.props.questionMode){
            var isFile = this.props.enableImageLibrary | (this.props.enableCapture==undefined | this.props.enableCapture);

            return (
              <Dialog visible={this.state.visible} dialogStyle={null}>
                  <View style={{width:'100%',height:'100%'}} onLayout={(event) => {
                        var {width, height} = event.nativeEvent.layout;
                        if(height> HEIGHT-100) {
                          this.setState({width,height:height})
                        }
                      }}>
                    <TouchableOpacity style={{height:this.state.height-48,marginTop:48,width:'100%',backgroundColor:'transparent'}}
                        activeOpacity={1.0} disabled={ mode=='text' && keyboardHeight==0} onPress={()=>{this.hideKeyboard();this.setState({mode:'text'})}}>
                      <View style={[styles.main]}>
                          <View style={styles.title}>
                              <TouchableOpacity style={{width:85}}>
                                <Text style={{fontSize:16,color:'#64686D'}} onPress={()=>this.cancel()}> {I18n.t('Cancel')}</Text>
                              </TouchableOpacity>
                              <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                                <Text style={{fontSize:16,color:'#64686D'}}>{this.props.title?this.props.title:I18n.t('Feedbacks')}</Text>
                              </View>
                              <View style={{width:25}}/>
                              <TouchableOpacity activeOpacity={1.0} disabled={!this.canClose()} onPress={()=>this.close()}
                                  style={{backgroundColor:this.canClose()?'#C60957':'#DCDFE5',alignItems:'center',justifyContent:'center',
                                                           width:60,height:28,borderRadius:10}}>
                                  <Text style={{fontSize:12,color:this.canClose()?'#ffffff':'#85898e'}}> {I18n.t('Finish')}</Text>
                              </TouchableOpacity>
                          </View>

                          <View style={{paddingLeft:15,paddingRight:15}}>
                            <View style={{flexDirection:'row',marginTop:10}}>
                              <Text style={{fontSize:14,color:'#C60957',marginRight:3}}>{'*'}</Text>
                              <Text style={{fontSize:12,color:'#666666'}}>{I18n.t('Title')}</Text>
                            </View>
                            <Card elevation={1} opacity={0.1}  style={{marginTop:4,borderRadius:5,width:WIDTH-32}}>
                              <TextInput ref="qinput" onChangeText={(v) =>this.setState({question:v})} value={question}
                                maxLength={50} multiline={true} blurOnSubmit={false} autoFocus={false} autoCorrect={false}
                                autoCapitalize="none" editable={true} onFocus={()=>{this.setState({contentMode:false})}}
                                style={{backgroundColor:"#fff", color: this.state.contentMode?'#000':'#6E6E6E',
                                width:WIDTH-32,paddingLeft:15,paddingRight:15,fontSize:14,lineHeight: 22,
                                paddingTop:10,paddingBottom:10,borderRadius:8}} placeholder={I18n.t('Input Message')}
                              />
                            </Card>
                            <View style={{flexDirection:'row'}}>
                              {this.state.contentMode && keyboardHeight>0?
                                <TouchableOpacity style={{height:28,justifyContent:'center',flexDirection:'row',
                                    padding:7,alignItems:'center',marginTop:10,borderWidth:0,borderColor:'#A7A6A6',
                                    borderRadius:10,backgroundColor:'#006AB7'}} disabled={false}>
                                  <Image source={imgAddContent} style={{height:20,width:20}} resizeMode={"stretch"}/>
                                  <Text style={{color:'#FFF',fontSize:12,marginLeft:3}}>{I18n.t('Add Content or Picture')}</Text>
                                </TouchableOpacity>:
                                <TouchableOpacity style={{height:28,justifyContent:'center',flexDirection:'row',padding:7,alignItems:'center',
                                                        marginTop:10,borderWidth:0,borderColor:'#A7A6A6',borderRadius:10,backgroundColor:'#006AB7'}}
                                      disabled={false} onPress={()=>{this.hideKeyboard();this.setState({contentMode:true,mode:isFile?'image':'text'});}}>
                                <Image source={imgAddContent} style={{height:20,width:20}} resizeMode={"stretch"}/>
                                <Text style={{color:'#FFF',fontSize:12,marginLeft:3}}>{I18n.t('Add Content or Picture')}</Text>
                              </TouchableOpacity>}
                            <View style={{flex:1}}/>
                          </View>
                        </View>
                        {this.renderContent()}
                      </View>
                  </TouchableOpacity>
                  {this.state.contentMode ? this.renderModeText() : <ErrorMessage ref="toast"/>}
                  {this.renderLoading()}
                  </View>
              </Dialog>
            )
        }

        return (
          <Dialog visible={this.state.visible}
              dialogStyle={null}>
              <View style={{width:'100%',height:'100%'}}
               onLayout={(event) => {
                  var {x, y, width, height} = event.nativeEvent.layout;
                   if(height> HEIGHT-100) {
                      this.setState({width,height})
                   }
                }}>
                <TouchableOpacity disabled={mode=='text' && keyboardHeight==0}
                  style={{height:this.state.height-48,marginTop:48,width:'100%',backgroundColor:'transparent'}}
                  activeOpacity={1.0} onPress={()=>{this.hideKeyboard();this.setState({mode:'text'})}}>
                  <View style={[styles.main]}>
                      <View style={styles.title}>
                          <TouchableOpacity style={{width:85}}>
                            <Text style={{fontSize:16,color:'#64686D'}} onPress={()=>this.cancel()}>
                              {I18n.t('Cancel')}
                            </Text>
                          </TouchableOpacity>
                          <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                            <Text style={{fontSize:16,color:'#64686D'}}>
                              {this.props.title?this.props.title:I18n.t('direct_comment')}
                            </Text>
                          </View>
                          <View style={{width:25}}/>
                          <TouchableOpacity
                            activeOpacity={1.0}
                            disabled={!this.canClose()}
                            onPress={()=>this.close()}
                            style={{backgroundColor:this.canClose()?'#C60957':'#DCDFE5',alignItems:'center',justifyContent:'center',
                                                    width:60,height:28,borderRadius:10}}>
                            <Text style={{fontSize:12,color:this.canClose()?'#ffffff':'#85898e'}}>
                              {I18n.t('Finish')}
                            </Text>
                          </TouchableOpacity>
                      </View>
                      {this.renderContent()}
                  </View>
                </TouchableOpacity>
                {this.renderModeText()}
                {this.renderLoading()}

                {store.patrolSelector.collection &&
                  <ModalMemo ref={c => this.modalMemo = c}
                    onSelect={(data) => this.selectMemo(data)}
                    onClose={() => this.closeMemo()}
                    data={store.patrolSelector.collection.memo_options}
                    selectMemo={this.state.selectMemo}/>
                }
              </View>
          </Dialog>
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
        padding:0,backgroundColor:"#000"
    },
    overlay:{
        backgroundColor:'#000000CC',
        opacity: 1,
    },
    dialog: {
        backgroundColor: 'transparent',
        width:WIDTH,
    },
    main:{
        backgroundColor:'#F7F9FA',
      //  borderRadius:10,
        borderTopLeftRadius:10,
        borderTopRightRadius:10,
        flex:1,
        width:WIDTH,
        paddingTop:0,
        paddingBottom:42,
    },
    title:{
        flexDirection:"row",
        justifyContent:'center',
        alignItems:'center',
        backgroundColor:'#fff',
        borderBottomWidth:1,
        borderBottomColor:'#ccc',
        paddingLeft:15,paddingRight:15,
        height:48,
        borderTopLeftRadius:10,
        borderTopRightRadius:10,
    },
    quickmenu:{
        backgroundColor:'#C2C6CC',
        paddingLeft:15,
        height:35,
        flexDirection:"row",
        alignItems:'flex-start',
        justifyContent:'flex-start'
    },
    quickButton:{
        fontSize:12,
        backgroundColor:'white',
        paddingRight:10,
        paddingLeft:10,
        marginRight:5,
        height:25,
        borderRadius:10,
        justifyContent:'center',
        alignItems:'center'
    },
    bottomZone:{
        height:55,
        backgroundColor:'#C2C6CC',
        borderTopLeftRadius: 7,
        borderTopRightRadius: 7,
        flexDirection:"row",
        justifyContent:'flex-start',
        alignItems:'center',
        width:WIDTH,
        paddingLeft:4,
        paddingRight:4,
    },
    imageButton:{
        justifyContent:'center',alignItems:'center',width:32,height:32,
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
