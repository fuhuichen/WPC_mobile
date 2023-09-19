import React, { Component } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    View,
    Alert,
    Image,
    Dimensions,
    TouchableOpacity,
    BackHandler,
    DeviceEventEmitter,
    PixelRatio,
    SafeAreaView,
    NativeModules,
} from 'react-native';
import RNFS, {DocumentDirectoryPath,stat} from "react-native-fs";
import RNSketchCanvas from '@terrylinla/react-native-sketch-canvas';
import CameraRoll from "@react-native-community/cameraroll";
import TextEditor from "./TextEditor";
import DragText from "./DragText";
import moment from "moment";
import store from "../../../mobx/Store";
import I18n from 'react-native-i18n';
import {isIphoneX,getStatusBarHeight} from "react-native-iphone-x-helper";
import ImageResizer from 'react-native-image-resizer';
import { Actions } from 'react-native-router-flux';
import {CLOSE_PHOTEDITOR } from "../../common/Constant";
import {HEIGHT,WIDTH,STATUS_BAR} from './Constant'
import * as simpleStore from "react-native-simple-store";

const dp2px = dp =>PixelRatio.getPixelSizeForLayoutSize(dp);
const px2dp = px =>PixelRatio.roundToNearestPixel(px);
const fileFolder = 'Canvas';
export default class PhotoEditor extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.strokeColor = [{color:"#FFFFFF"},{color:"#F11E66"},{color:"#FFC136"},{color:"#006AB7"},{color:"#000000"}];
        this.strokeWidth = [1,3,5,7,9];
        this._screenScale = PixelRatio.get();
        this.strokePath = [];
        this.HEIGHT = Platform.OS === 'android'? (HEIGHT+1) : HEIGHT-(isIphoneX()?44:14);
        if(this.props.height){
          this.HEIGHT = Platform.OS === 'android'? (this.props.height+1) : this.props.height-(isIphoneX()?44:14);
        }
        this.isHorizontal = (this.props.ImgWidth>this.props.ImgHeight);
        this.cnavasHeight = this.HEIGHT;
        this.state={
            imageWidth: 0,
            imageHeight: 0,
            fileName:'',
            colorIndex: store.strokeSelector.StrokeColor,
            strokeIndex:store.strokeSelector.StrokeWidth,
            editMode:'color', //color, pen, text
            image:this.props.SourceImage,
            selText:null,
            editTextMode:'add', //'add', 'modify'
            TextObjs:[],
            saveText:[],
            height:this.HEIGHT,
            isFileSave:true
        }
        //console.log("this._screenScale:",this._screenScale)
    }

    componentWillUpdate(nextProps, nextState) {
      if(nextProps.height != this.props.height){

        this.HEIGHT = Platform.OS === 'android'? (HEIGHT+1) : HEIGHT-(isIphoneX()?44:14);
        if(nextProps.height){
          this.HEIGHT = Platform.OS === 'android'? (nextProps.height+1) : nextProps.height-(isIphoneX()?44:14);
        }
        //console.log("Change HEIGHT to "+ this.HEIGHT)
        this.cnavasHeight = this.HEIGHT;
        this.setState({height:this.HEIGHT})
      }
    }

    async componentDidMount(){
        try {            
            this.getSetting();
            let uri = this.props.SourceImage; //傳進來的照片路徑
            let startIndex = 0;
            startIndex = uri.includes(fileFolder) ? uri.indexOf('-') : uri.lastIndexOf('/');
            var fileLoc = !uri.startsWith("file://") && Platform.OS === 'android'?"file://"+uri:uri;
            const statResult = await stat(fileLoc);
            //console.log('****image size: ' + statResult.size);
            //console.log("Component Did mount"+fileLoc)
            Image.getSize(fileLoc, (width, height) => {
              //console.log("Image Height"+height+" "+width)
              this.setState({imageWidth:width,imageHeight:height}
            )});
            let fileName = uri.substring(startIndex+1,uri.length-4);
            this.setState({fileName});
        }catch (e) {
            console.log("error in componentDidMount:",e);
        }
    }

    async getSetting(){
        let res = await simpleStore.get('InspectionSetting');
        if (res != null) {
            let setting = JSON.parse(res);
            this.setState({isFileSave: setting.isFileSave});
        }
    }
    
    onCancel(){
        if(this.props.onCancel != null && typeof this.props.onCancel != 'undefined'){
            this.props.onCancel();
        }else{
            console.log("this.props.onCancel() is null!");
        }
    }

    clear(){
        try{
        this.setState({TextObjs:[]});
        this.canvas.clear();
        }catch(err){
            console.log("clear stroke error:",err);
        }
    }

    undo(){
        if(this.strokePath.length>0){
            let lastStep = this.strokePath.pop();
            if(lastStep.type == "pen"){this.canvas.undo();}
            else if(lastStep.type == "text"){
                let txt = this.state.TextObjs;
                txt.pop();
                this.setState({TextObjs:txt});
            }else if(lastStep.type == 'textMove'){
                for(let i=this.strokePath.length-1; i>=0; i--){
                    let preTextStep = this.strokePath[i];
                    //console.log("preTextStep:",preTextStep);
                    if(preTextStep && preTextStep.id== lastStep.id && (preTextStep.type=="text" || preTextStep.type=='textMove')){
                        let txt = JSON.parse(JSON.stringify(this.state.TextObjs));
                        let idx = txt.findIndex((item)=> item.id==lastStep.id)
                        if(txt[idx])
                        {
                            //console.log("txt[idx:",txt[idx]);
                            txt[idx].position = {...preTextStep.position};
                            this.setState({TextObjs:txt});
                            break;
                        }
                    }
                }

            }
        }
    }

    doGetStroksPath(){
        let strokes = this.canvas.getPaths();
    }

    async sketchSaved(path){//存檔後複製到手機相簿        
        if(this.props.onConfrim != null && typeof this.props.onConfrim != 'undefined'){
            let destPath = "file://"+path;

            ImageResizer.createResizedImage(destPath,1080,1080,"JPEG", 80, 0).then(response =>{
                let date = new Date();
                let time = date.getTime();
                //let path = RNFS.DocumentDirectoryPath + `/${time}.jpg`;
                if(this.state.isFileSave == false) {    //關閉儲存功能
                    let finalPath = Platform.OS === 'android' ? 'file://'+response.path : response.path;
                    this.props.onConfrim(finalPath);
                } else {
                    if(Platform.OS === 'android'){
                        let path = RNFS.PicturesDirectoryPath + `/${time}.jpg`;
                        //console.log("sketchSaved path :"+path);
                        RNFS.moveFile(response.path,path)
                        .then((success) => {
                            this.props.onConfrim("file://"+path);
                        })
                        .catch((err) => {});
                    } else {
                        var promise = CameraRoll.save(response.path);
                        promise.then(function(result) {
                            let path = RNFS.DocumentDirectoryPath + `/${time}.jpg`;
                            //console.log("sketchSaved path :"+path);
                            RNFS.moveFile(response.path,path)
                            .then((success) => {
                                this.props.onConfrim(path);
                            })
                            .catch((err) => {});
                        }.bind(this)).catch(function(error) {
                            console.log('error', error);
                        });
                    }
                }
            })
            .catch(err => {
            });
        } else {
            console.log("this.props.onConfirm() is null!");
        }
    }

    canvasDone(TextObjs){
        //console.log("Canvas Dones")
      //  const {ImgWidth,ImgHeight} = this.props;
        //console.log(this.props.imgWidth,this.props.imgHeight,this.state.imageWidth,this.state.imageHeight)
        var ImgWidth = this.props.imgWidth?this.props.imgWidth:this.state.imageWidth;
        var ImgHeight= this.props.imgHeight?this.props.imgHeight:this.state.imageHeight;
        this.isHorizontal =ImgWidth >ImgHeight;
        //console.log(ImgHeight,ImgWidth ,this.state.height-148,WIDTH,this.isHorizontal)
        var txtArray = [];
        let scaleH = this._screenScale>2 ? (px2dp(this.state.height-148)/ImgHeight)*this._screenScale:this._screenScale;
        let scaleW = (px2dp(WIDTH)/ImgWidth);
        var cHeight = this.state.height-148

        var shiftY= 0.5*cHeight - (ImgHeight*WIDTH) / (2*ImgWidth);
        //console.log("px2dp:"+px2dp(WIDTH)+", dp2px:"+dp2px(WIDTH));
        for(let i=0;i<TextObjs.length;i++){
            let txtContain = {...TextObjs[i]}
            let txtX = TextObjs[i].position.x;
            let txtY = TextObjs[i].position.y;
            if( Platform.OS == 'ios'){
              if(this.isHorizontal){
                  let scale = ImgWidth/WIDTH;
                  txtX = txtX *scale;
                  txtY = (txtY-shiftY)*scale;
                  txtContain.fontSize = TextObjs[i].fontSize *scale ;
              }else{
                let scale = ImgWidth/WIDTH;
                let scaleY = ImgHeight/cHeight;
                txtX = (txtX + 10)*scale;
                txtY = txtY*scaleY;
                txtContain.fontSize = TextObjs[i].fontSize *scale ;
              }
            }
            else{
                if(this.isHorizontal){
                    let scale = ImgWidth/WIDTH;
                    txtX =( txtX +10  )*scale;
                    txtY = (txtY-shiftY+10)*scale;
                    txtContain.fontSize = TextObjs[i].fontSize *scale ;
                }else{
                    let scale = ImgWidth/WIDTH;
                    let scaleY = ImgHeight/cHeight;
                    txtX = (txtX + 10)*scale;
                    txtY = txtY*scaleY;
                    txtContain.fontSize = TextObjs[i].fontSize *scale ;
                }
            }

            let position = {x:txtX,y:txtY};
            txtContain.position = position;

            //txtContain.fontColor = 'midnightblue';
            txtArray.push(txtContain);
        }
        this.setState({saveText:txtArray,TextObjs:[]});
        try {
            let timeout =  100;
            setTimeout(()=>{this.canvas.save()},timeout);
        }catch (e) {
        }

    }

    doGetSpecificImage(index,type,isSelect){
        const {colorIndex} = this.state;
        let image = null;
        switch(type){
            case 'color':
                if(index == 0){image = isSelect? require('../../assets/images/comment/icoColor0_sel.png') : require('../../assets/images/comment/icoColor0.png');}
                else if(index == 1){image = isSelect?require('../../assets/images/comment/icoColor1_sel.png') : require('../../assets/images/comment/icoColor1.png');}
                else if(index == 2){image = isSelect?require('../../assets/images/comment/icoColor2_sel.png') : require('../../assets/images/comment/icoColor2.png');}
                else if(index == 3){image = isSelect?require('../../assets/images/comment/icoColor3_sel.png') : require('../../assets/images/comment/icoColor3.png');}
                else if(index == 4){image = isSelect?require('../../assets/images/comment/icoColor4_sel.png') : require('../../assets/images/comment/icoColor4.png');}
                break;
            case 'stroke':
                switch (colorIndex){
                    case 0: //white
                        if(index == 0){image = isSelect? require('../../assets/images/comment/icoStroke0_w_sel.png') : require('../../assets/images/comment/icoStroke0_w.png');}
                        else if(index == 1){image = isSelect?require('../../assets/images/comment/icoStroke1_w_sel.png') : require('../../assets/images/comment/icoStroke1_w.png');}
                        else if(index == 2){image = isSelect?require('../../assets/images/comment/icoStroke2_w_sel.png') : require('../../assets/images/comment/icoStroke2_w.png');}
                        else if(index == 3){image = isSelect?require('../../assets/images/comment/icoStroke3_w_sel.png') : require('../../assets/images/comment/icoStroke3_w.png');}
                        else if(index == 4){image = isSelect?require('../../assets/images/comment/icoStroke4_w_sel.png') : require('../../assets/images/comment/icoStroke4_w.png');}
                        //else if(index == 5){image = isSelect?require('../../assets/images/comment/icoStroke5_w_sel.png') : require('../../assets/images/comment/icoStroke5_w.png');}
                        break;
                    case 1: //Red
                        if(index == 0){image = isSelect? require('../../assets/images/comment/icoStroke0_r_sel.png') : require('../../assets/images/comment/icoStroke0_r.png');}
                        else if(index == 1){image = isSelect?require('../../assets/images/comment/icoStroke1_r_sel.png') : require('../../assets/images/comment/icoStroke1_r.png');}
                        else if(index == 2){image = isSelect?require('../../assets/images/comment/icoStroke2_r_sel.png') : require('../../assets/images/comment/icoStroke2_r.png');}
                        else if(index == 3){image = isSelect?require('../../assets/images/comment/icoStroke2_r_sel.png') : require('../../assets/images/comment/icoStroke3_r.png');}
                        else if(index == 4){image = isSelect?require('../../assets/images/comment/icoStroke4_r_sel.png') : require('../../assets/images/comment/icoStroke4_r.png');}
                        //else if(index == 5){image = isSelect?require('../../assets/images/comment/icoStroke5_r_sel.png') : require('../../assets/images/comment/icoStroke5_r.png');}
                        break;
                    case 2: //Yellow
                        if(index == 0){image = isSelect? require('../../assets/images/comment/icoStroke0_y_sel.png') : require('../../assets/images/comment/icoStroke0_y.png');}
                        else if(index == 1){image = isSelect?require('../../assets/images/comment/icoStroke1_y_sel.png') : require('../../assets/images/comment/icoStroke1_y.png');}
                        else if(index == 2){image = isSelect?require('../../assets/images/comment/icoStroke2_y_sel.png') : require('../../assets/images/comment/icoStroke2_y.png');}
                        else if(index == 3){image = isSelect?require('../../assets/images/comment/icoStroke3_y_sel.png') : require('../../assets/images/comment/icoStroke3_y.png');}
                        else if(index == 4){image = isSelect?require('../../assets/images/comment/icoStroke4_y_sel.png') : require('../../assets/images/comment/icoStroke4_y.png');}
                        //else if(index == 5){image = isSelect?require('../../assets/images/comment/icoStroke5_y_sel.png') : require('../../assets/images/comment/icoStroke5_y.png');}
                        break;
                    case 3: //blue
                        if(index == 0){image = isSelect? require('../../assets/images/comment/icoStroke0_b_sel.png') : require('../../assets/images/comment/icoStroke0_b.png');}
                        else if(index == 1){image = isSelect?require('../../assets/images/comment/icoStroke1_b_sel.png') : require('../../assets/images/comment/icoStroke1_b.png');}
                        else if(index == 2){image = isSelect?require('../../assets/images/comment/icoStroke2_b_sel.png') : require('../../assets/images/comment/icoStroke2_b.png');}
                        else if(index == 3){image = isSelect?require('../../assets/images/comment/icoStroke3_b_sel.png') : require('../../assets/images/comment/icoStroke3_b.png');}
                        else if(index == 4){image = isSelect?require('../../assets/images/comment/icoStroke4_b_sel.png') : require('../../assets/images/comment/icoStroke4_b.png');}
                        //else if(index == 5){image = isSelect?require('../../assets/images/comment/icoStroke5_b_sel.png') : require('../../assets/images/comment/icoStroke5_b.png');}
                        break;
                    case 4: //black
                        if(index == 0){image = isSelect? require('../../assets/images/comment/icoStroke0_black_sel.png') : require('../../assets/images/comment/icoStroke0_black.png');}
                        else if(index == 1){image = isSelect?require('../../assets/images/comment/icoStroke1_black_sel.png') : require('../../assets/images/comment/icoStroke1_black.png');}
                        else if(index == 2){image = isSelect?require('../../assets/images/comment/icoStroke2_black_sel.png') : require('../../assets/images/comment/icoStroke2_black.png');}
                        else if(index == 3){image = isSelect?require('../../assets/images/comment/icoStroke3_black_sel.png') : require('../../assets/images/comment/icoStroke3_black.png');}
                        else if(index == 4){image = isSelect?require('../../assets/images/comment/icoStroke4_black_sel.png') : require('../../assets/images/comment/icoStroke4_black.png');}
                        //else if(index == 5){image = isSelect?require('../../assets/images/comment/icoStroke5_black_sel.png') : require('../../assets/images/comment/icoStroke5_black.png');}
                        break;
                }
                break;
            case 'colorPicker':
                if(index == 0){image = require('../../assets/images/comment/icoColorPicker0.png');}
                else if(index == 1){image = require('../../assets/images/comment/icoColorPicker1.png');}
                else if(index == 2){image = require('../../assets/images/comment/icoColorPicker2.png');}
                else if(index == 3){image = require('../../assets/images/comment/icoColorPicker3.png');}
                else if(index == 4){image = require('../../assets/images/comment/icoColorPicker4.png');}
                break;
        }
        return image;
    }

    renderColorPicker(){
        const {colorIndex} = this.state;
        //console.log("colorIndex:",colorIndex);
        return [0,1,2,3,4].map((item,idx)=>{
            let image = this.doGetSpecificImage(idx,'color',(colorIndex==idx))//(colorIndex==idx)? require('../../assets/images/comment/icoColor3_sel.png'):require(imgPath);
            return(
                <TouchableOpacity id={idx} style={{flex:1,width:42,height:42,alignContent:'center',zIndex:21,paddingTop:8}} onPress={()=>{this.setState({colorIndex:idx});store.strokeSelector.setStrokeColor(idx);}}>
                    <Image source={image} resizeMode={'contain'} style={styles.colorPicker} />
                </TouchableOpacity>
            )
        })
    }

    renderStrokeOption(){
        const {strokeIndex} = this.state;
        return [0,1,2,3,4].map((item,idx)=>{
            let image = this.doGetSpecificImage(idx,'stroke',(strokeIndex==idx))//(colorIndex==idx)? require('../../assets/images/comment/icoColor3_sel.png'):require(imgPath);
            return(
                <TouchableOpacity id={idx} style={{flex:1,width:42,height:42,alignContent:'center',zIndex:21,paddingTop:8}} onPress={()=>{this.setState({strokeIndex:idx});store.strokeSelector.setStrokeWidth(idx);}}>
                    <Image source={image} resizeMode={'contain'} style={styles.colorPicker} />
                </TouchableOpacity>
            )
        })
    }

    renderDragText(){
        const {TextObjs} = this.state;
        //console.log("TextObjs:",TextObjs)
        return TextObjs.map((item,index)=>{
            return (
                <DragText
                    Key = {item.id}
                    TextInfo = {item}
                    Position = {item.position}
                    width = {WIDTH}
                    height = {this.cnavasHeight}
                    onTextPositionChanged = {(id,textObj)=>{
                        this.doSaveText(textObj,'modify', id);
                    }}
                />
            )
        });
    }

    doSaveText(textObj,mode,id){
        var txt = JSON.parse(JSON.stringify( this.state.TextObjs));
        //console.log('1.txt:',txt);
        var newTxt = JSON.parse(JSON.stringify( textObj));
        if(mode =='add'){
            if(newTxt.text.trim()!=''){
                id = txt.length+1;
                newTxt["id"] = id;
                txt.push(newTxt);
                this.strokePath.push({type:'text',id:id,position:{...newTxt.position},time: moment().unix() })
            }
        }else{
            //console.log('newTxt.position:',newTxt.position);
            let idx = txt.findIndex((item)=> item.id==id)
            this.strokePath.push({type:'textMove',id:id,position:{...newTxt.position},time: moment().unix() });
            txt[idx] = newTxt;
        }
        //console.log('strokePath:',this.strokePath);
        this.setState({TextObjs:txt,editMode:'color'});
    }

    renderTextEditor(){
        const {colorIndex,editMode,selText,editTextMode} = this.state;
        const {Width} = this.props;
        var ImgWidth = this.props.imgWidth?this.props.imgWidth:this.state.imageWidth;
        var ImgHeight= this.props.imgHeight?this.props.imgHeight:this.state.imageHeight;
        let h = this.state.height;
        if(this.isHorizontal){
            let w = Width/ImgWidth;
            h = ImgHeight*w;
        }
        let text = (editTextMode=='add')? "":selText;
        return(
            <TextEditor
                width={WIDTH}
                height={this.state.height}
                imgH = {h}
                isHorizontal={this.isHorizontal}
                Color={this.strokeColor[colorIndex].color}
                Text = {text}
                onConfirmTextChanged = {(textObj)=>{this.doSaveText(textObj,'add',0)}}
                BackgroundImage = {this.props.SourceImage}
            ></TextEditor>
        )
    }

    renderModeSelection(){
        const {editMode,colorIndex} = this.state;
        if(editMode == 'color'){
            return (
                <View style={{position:'absolute',zIndex:20, flexDirection:'row',justifyContent:'space-between',width:WIDTH,height:50,top:this.state.height-168,backgroundColor:'#707070'}}>
                    {this.renderColorPicker()}
                </View>
            );
        }else if(editMode == 'pen'){
            return (
                <View style={{position:'absolute',zIndex:20, flexDirection:'row',justifyContent:'space-between',width:WIDTH,height:50,top:this.state.height-168,backgroundColor:'#707070'}}>
                    {this.renderStrokeOption()}
                </View>
            );
        }else if(editMode == 'text'){
            return (
                <SafeAreaView style={{position:'absolute',zIndex:20, flexDirection:'row',width:WIDTH,height:this.state.height,top:-58}}>
                    {this.renderTextEditor()}
                </SafeAreaView>
            );
        }else{
            return <View />
        }
    }

    render() {
        const {image,colorIndex,strokeIndex,editMode,saveText,TextObjs} = this.state;
        var ImgWidth = this.props.imgWidth?this.props.imgWidth:this.state.imageWidth;
        var ImgHeight= this.props.imgHeight?this.props.imgHeight:this.state.imageHeight;
        let imgColorPicker = this.doGetSpecificImage(colorIndex,'colorPicker',false);
        //console.log("this.props.SourceImage:",this.props.SourceImage.replace('file://',''));
        //console.log("image:",image.replace('file://',''));

        let w = WIDTH;
        let h = this.state.height-118;
        let ishorizontal = false;
        if(ImgWidth>ImgHeight){
            w = w/ImgWidth;
            h = ImgHeight*w;
            this.cnavasHeight = h
            ishorizontal = true;
        }
        {
        //let rate = h/ImgHeight;
        //w = ImgWidth*rate;
        if(Platform.OS == 'ios'){
              return (<SafeAreaView style={[styles.container,{height:this.state.height}]}>
                        <View style={styles.topPanel}>
                            <TouchableOpacity  style={{flex:1,flexDirection:'row', alignContent:'center',alignItems:'center'}} activeOpacity={0.5} onPress={()=>this.onCancel()}>
                                <Text style={[styles.button]}>{I18n.t('Cancel')}</Text>
                            </TouchableOpacity>
                            <View style={{flex:2}}></View>
                            <TouchableOpacity style={{flex:1,flexDirection:'row', alignContent:'center'}} activeOpacity={0.5}
                                onPress={()=>{this.canvasDone(TextObjs);}}>
                                    <Text style={[styles.button,{textAlign:'right'}]}>{I18n.t('Confirm')}</Text>
                            </TouchableOpacity>
                        </View>
                        <SafeAreaView style={{height:this.state.height-38,flexDirection: 'column'}}>
                            <RNSketchCanvas
                                ref={ref => this.canvas = ref}
                                containerStyle={{flexDirection:'row',alignContent:'space-around', backgroundColor: 'transparent', height:this.state.height-118,width:WIDTH}}
                                canvasStyle={{ backgroundColor: '#A7A6A6', height:h,width:WIDTH,alignSelf:'center',marginTop:(ishorizontal?-27:0)}}
                                strokeColors={this.strokeColor}
                                strokeColor = {this.strokeColor[colorIndex].color}
                                strokeWidth={this.strokeWidth[strokeIndex]}
                                savePreference={() => {
                                return {
                                    folder: fileFolder,
                                    filename: moment().format('x')+'-'+this.state.fileName,//String(Math.ceil(Math.random() * 100000000)),
                                    transparent: false,
                                    imageType: 'jpg',
                                    includeImage:true,
                                    includeText:true,
                                    cropToImageSize: true,
                                    transparent:true
                                }
                                }}
                                onSketchSaved={(success,path)=>this.sketchSaved(path)}
                                text={saveText}
                                localSourceImage = {{
                                    filename: image.replace('file://',''),  // e.g. 'image.png' or '/storage/sdcard0/Pictures/image.png'
                                    directory: '',
                                    mode:'AspectFill'
                                }}
                                onStrokeEnd={(strokPath) => {this.strokePath.push({type:'pen',id:strokPath.path.id});}}
                            />
                            <View style={{position:'absolute',top:0,left:0}}>
                                {this.renderDragText()}
                            </View>
                            {this.renderModeSelection()}
                            <SafeAreaView style={[styles.toolBar,{width:WIDTH}]}>
                                <TouchableOpacity style={styles.toolButton} onPress={()=>this.setState({editMode:'color'})}>
                                    <Image source={imgColorPicker} resizeMode={'contain'} style={styles.toolButtonImg} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.toolButton} onPress={()=>this.setState({editMode:'pen'})}>
                                    <Image source={editMode=='pen' ? require('../../assets/images/comment/icoPen_sel.png'):require('../../assets/images/comment/icoPen.png')} resizeMode={'contain'} style={styles.toolButtonImg} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.toolButton} onPress={()=>this.setState({editMode:'text',editTextMode:'add'})}>
                                    <Image source={editMode=='text' ? require('../../assets/images/comment/icoTextEdit_sel.png'):require('../../assets/images/comment/icoTextEdit.png')} resizeMode={'contain'} style={styles.toolButtonImg} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.toolButton} onPress={()=>this.clear()}>
                                    <Image source={require('../../assets/images/comment/icoDrawingClean.png')} resizeMode={'contain'} style={styles.toolButtonImg} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.toolButton} onPress={()=>this.undo()}>
                                    <Image source={require('../../assets/images/comment/icoUndo.png')} resizeMode={'contain'} style={styles.toolButtonImg} />
                                </TouchableOpacity>
                            </SafeAreaView>
                        </SafeAreaView>
                    </SafeAreaView>);
        }else{
            return(
                <View style={[styles.container,{height:this.state.height,marginTop:-1,alignContent:'flex-start'}]}>
                    <View style={styles.topPanel}>
                        <TouchableOpacity  style={{flex:1,flexDirection:'row', alignContent:'center',alignItems:'center'}} activeOpacity={0.5} onPress={()=>this.onCancel()}>
                            <Text style={[styles.button]}>{I18n.t('Cancel')}</Text>
                        </TouchableOpacity>
                        <View style={{flex:2}}></View>
                        <TouchableOpacity style={{flex:1,flexDirection:'row', alignContent:'center'}} activeOpacity={0.5}
                            onPress={()=>{this.canvasDone(TextObjs);}}>
                                <Text style={[styles.button,{textAlign:'right'}]}>{I18n.t('Confirm')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{height:this.state.height-58,flexDirection: 'column',alignContent:'flex-start'}}>
                        <RNSketchCanvas
                            ref={ref => this.canvas = ref}
                            containerStyle={{flexDirection:'row',alignSelf:'flex-start',alignContent:'flex-start', backgroundColor: '#000', height:this.state.height-118,width:WIDTH,marginTop:0}}
                            canvasStyle={{ backgroundColor: '#A7A6A6', alignSelf:'center',height:h,width:WIDTH,marginTop:(ishorizontal?-27:0)}}
                            strokeColors={this.strokeColor}
                            strokeColor = {this.strokeColor[colorIndex].color}
                            strokeWidth={this.strokeWidth[strokeIndex]}
                            savePreference={() => {
                            return {
                                folder: fileFolder,
                                filename: moment().format('x')+'-'+this.state.fileName,//String(Math.ceil(Math.random() * 100000000)),
                                transparent: false,
                                imageType: 'jpg',
                                includeImage:true,
                                includeText:true,
                                cropToImageSize: true,
                                transparent:true
                            }
                            }}
                            onSketchSaved={(success,path)=>this.sketchSaved(path)}
                            text={saveText}
                            localSourceImage = {{
                                filename: image.replace('file://',''),  // e.g. 'image.png' or '/storage/sdcard0/Pictures/image.png'
                                directory: '',
                                mode: this.isHorizontal?'AspectFit':'ScaleToFill'
                            }}
                            onStrokeEnd={(strokPath) => {this.strokePath.push({type:'pen',id:strokPath.path.id});}}
                        />
                        <View style={{position:'absolute',top:0,left:0}}>
                            {this.renderDragText()}
                        </View>

                        {this.renderModeSelection()}
                        <View style={[styles.toolBar,{width:WIDTH,height:60}]}>
                            <TouchableOpacity style={styles.toolButton} onPress={()=>this.setState({editMode:'color'})}>
                                <Image source={imgColorPicker} resizeMode={'contain'} style={styles.toolButtonImg} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.toolButton} onPress={()=>this.setState({editMode:'pen'})}>
                                <Image source={editMode=='pen' ? require('../../assets/images/comment/icoPen_sel.png'):require('../../assets/images/comment/icoPen.png')} resizeMode={'contain'} style={styles.toolButtonImg} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.toolButton} onPress={()=>this.setState({editMode:'text',editTextMode:'add'})}>
                                <Image source={editMode=='text' ? require('../../assets/images/comment/icoTextEdit_sel.png'):require('../../assets/images/comment/icoTextEdit.png')} resizeMode={'contain'} style={styles.toolButtonImg} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.toolButton} onPress={()=>this.clear()}>
                                <Image source={require('../../assets/images/comment/icoDrawingClean.png')} resizeMode={'contain'} style={styles.toolButtonImg} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.toolButton} onPress={()=>this.undo()}>
                                <Image source={require('../../assets/images/comment/icoUndo.png')} resizeMode={'contain'} style={styles.toolButtonImg} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>);
              }
        }
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection:'column',
        alignContent:'space-between',
    },
    topPanel:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignContent:'center',
        height:58,
        backgroundColor:'#000',
        paddingLeft: 16,
        paddingRight: 16
    },
    button:{
        flex:1,
        color:'#FFF',
        alignSelf:'center',
        flex:1,
    },
    strokeColorButton: {
      marginHorizontal: 2.5, marginVertical:8, width: 30, height: 30, borderRadius: 15,zIndex:99
    },
    strokeWidthButton: {
      marginHorizontal: 2.5, marginVertical: 10, width: 30, height: 30, borderRadius: 15,
      justifyContent: 'center', alignItems: 'center', backgroundColor: '#39579A'
    },
    functionButton: {
      marginHorizontal: 2.5,
      marginVertical: 10,
      height: 30,
      width: 60,
      backgroundColor: '#39579A', justifyContent: 'center', alignItems: 'center', borderRadius: 5,
    },
    toolBar:{
        height:74,
        alignContent:'space-between',
        justifyContent:'space-between',
        backgroundColor:'#484848',
        flexDirection:'row'
    },
    toolButton:{
        flex:1,
        flexDirection:'row',
        alignContent:'center',
        marginTop: (Platform.OS==='ios')?-21:-14
    },
    toolButtonImg:{
        flex:1,
        alignSelf:'center',
        width:30,
        height:30
    },
    colorPicker:{
        flex:1,
        alignSelf:'center',
        width:42,
        height:42,
    }
});
