import React, {Component } from 'react';
import {Dimensions, Image, StyleSheet, TextInput,SafeAreaView, View,Platform,BackHandler,PixelRatio,
    TouchableWithoutFeedback,
    KeyboardAvoidingView} from 'react-native'
import Slider from 'react-native-slider';
//import MultiSlider from '@ptomasroos/react-native-multi-slider'
import I18n from 'react-native-i18n';
//import CustomMarker from './CustomMarker'

export default class TextEditor extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.state = { txtValue:'',txtSize:20,touchOutside:false,onTextFocus:true,
            comfirmProccessing:false,
            viewTxtValue:'',
            ViewTextHeight:0,
            txtHeight:27,
            fsizetag:0
        };
        this.txtIdx = 0;
        this._textStyles = {
            style: {
              fontSize:20
            },
        };
        //console.log('DEVICE Name:',utils.doGetDeviceName())
    }

    componentWillMount() {
        this.viewTextNewLineProccessinge = true;
        this.newLineTxt = "";
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('TextEditBack', this.onBackAndroid);
        }
    }

    componentWillUnmount() {
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('TextEditBack', this.onBackAndroid);
        }
    }

    onBackAndroid = () => {
        this.onConfirmClick();
        return true;
    }

    onChangeText = (text) =>{
        this.setState({txtValue:text.trimStart()});
      }

    onTextHeightChanged(contentSize){
        const {textContentHeight,txtValue,txtLine,txtSize }= this.state;
        const {width} = this.props;
        console.log("textContentWidth:",contentSize);
        console.log("txtSize:",txtSize);
        if(textContentHeight != contentSize.height) this.setState({textContentHeight:contentSize.height});
        /*if(contentSize.width >= width-42 && txtValue.trim()!="",textContentHeight==0){
            let lastText = txtValue.slice(txtValue.length-1,txtValue.lengtAAAA,1);
            console.log("lastText:",lastText);
            let txt = txtValue.substr(0,txtValue.length-1)+"\r\n"+lastText;
            console.log("txt:",txt);
            this.setState({txtValue:txt,textContentHeight:contentSize.height,txtLine:1});
        }else if(txtLine>1){

        }*/
    }
    onConfirmClick(){
        const {txtValue,txtSize,comfirmProccessing} = this.state;
        this.setState({comfirmProccessing:true});
        //this.doTextLineUp();
        this.doBackToPhotoEditor(txtValue.trimStart())
        //console.log("click!");
    }

    onViewTextHeightChanged(contentSize){
        const {textContentHeight,ViewTextHeight,viewTxtValue,txtValue} = this.state;
        console.log("viewTxtValue:",viewTxtValue);
        console.log("ViewTextHeight:",ViewTextHeight);
        console.log("ViewcontentSize:",contentSize);
        if(contentSize.height==textContentHeight){
            this.viewTextNewLineProccessinge = false;
            this.setState({ViewTextHeight:contentSize.height,comfirmProccessing:true});

            let newText = this.newLineTxt;
            newText = newText+txtValue.substr(newText.length-1,txtValue.length);
            console.log("2.newText:",newText);
                //this.doBackToPhotoEditor(newText);
        }else{
            if(ViewTextHeight<contentSize.height){
                this.newLineTxt = this.newLineTxt.substr(0,this.newLineTxt.length-1)+"\r\n"+this.newLineTxt.substr(-1);
                console.log("1.newText:",this.newLineTxt);
            }else{
                this.setState({viewTxtValue:txtValue.substr(0,txtIdx+1)});
                this.txtIdx+=1;
            }
            this.setState({ViewTextHeight:contentSize.height})
        }
    }
    doTextLineUp(){
        const {txtValue,ViewTextHeight} = this.state;
        console.log("line up");
        let txt = [...txtValue];
        //this.newText="";
        this.setState({viewTxtValue:txtValue.substr(0,txtIdx+1)});
        this.txtIdx+=1;
        /*for(var i=0;i< txt.length;i++){
            console.log("this.viewTextNewLineProccessinge:"+this.viewTextNewLineProccessinge+" ,i:"+i)
            if(!this.viewTextNewLineProccessinge) {
                console.log("this.state.viewTxtValue:",this.state.viewTxtValue);
                break;
            };
            this.newLineTxt = this.newLineTxt+txtValue.substr(i,1);
            this.setState({viewTxtValue:txtValue.substr(0,i+1)});
            this.sleep(100)
            //newText = newText+"\r\n";
            //newText = newText+txt[i];
        }*/
    }
    sleep(milliseconds) {
        const date = Date.now();
        let currentDate = null;
        do {
          currentDate = Date.now();
        } while (currentDate - date < milliseconds);
    }
    doBackToPhotoEditor(newText){
        const {imgH,isHorizontal} = this.props;
        const {txtSize} = this.state;
        this.txtInput.measureInWindow((px, py, width, height, fx, fy) => {
            console.log("w:"+width+", h:"+height+', px:'+px+', py:'+py);
            let textPx = (Platform.OS==='ios')?px:this.props.width - (width/PixelRatio.get());
            let textPy = (Platform.OS==='android' && isHorizontal)?parseInt(py+(imgH)):py;
            var text = {
                text:newText,
                font: '',
                fontSize:txtSize,
                fontColor:this.props.Color,
                position:{x:textPx,y:textPy} ,
                alignment: 'Center',
                width: width,
                height: height,
                lineHeightMultiple: 1.2,
                overlay:'TextOnSketch'
            };
            //console.log('text:',text);
            this.props.onConfirmTextChanged(text);
        })
    }
    renderViewTextIpnout(){
        const {width,height,Color} = this.props;
        const {comfirmProccessing,viewTxtValue,txtSize,textContentHeight} = this.state;
        console.log('render txtSize:'+txtSize+', txtValue:'+viewTxtValue);
            if(comfirmProccessing){
                return(
                    <View style={{height:height-(60+height/2)}}>
                        <View  style={{maxWidth:width-50,height:height/2-20,alignSelf:'center',backgroundColor:'pink'}}>
                        <TextInput
                            autoFocus = {false}
                            multiline = {true}
                            style={[styles.TextInput,{fontSize:txtSize,color:Color,maxWidth:width-50,height:textContentHeight}]}
                            value={viewTxtValue}
                            onContentSizeChange ={(event)=>this.onViewTextHeightChanged(event.nativeEvent.contentSize)}
                            onChange = {(event)=>{console.log("value change:")}}
                        />
                        </View>
                    </View>
                );
            }else{
                return(
                    <View style={{height:height-(60+height/2)}}>
                    </View>
                );
            }
    }

    doFontSizeChanged(size){
        //console.log('size:',size)
        
        this._textStyles.style.fontSize = size;
        this.txtInput && this.txtInput.setNativeProps(this._textStyles);
        if(Platform.OS==="ios" && this.state.txtValue.trim()!=""){
            let fsizetag = this.state.fsizetag;
            let txtValue = '';
            if(fsizetag%2==0){
                txtValue = ' '+this.state.txtValue.trimStart();
            }else{
                txtValue = '  '+this.state.txtValue.trimStart();
            }
            fsizetag+=1;
            this.setState({txtSize:parseInt(size),txtValue,fsizetag}) ;  
        }else{
            this.setState({txtSize:parseInt(size)}) ;
        }
    }

    render(){
        const {width,height,Color,BackgroundImage,isHorizontal} = this.props;
        const {txtValue,txtSize,textContentHeight} = this.state;
        const screen = Dimensions.get("screen");
        //let markComp = (<Image source={require('../../assets/images/comment/Oval.png')} style={{width:40,height:40}} resizeMode="contain"/>);
        return (
            <KeyboardAvoidingView behavior='position' keyboardVerticalOffset={0} style={{flexDirection:'column',width,height, alignContent:'center',justifyContent:'flex-start',backgroundColor:'#000'}}>
                <Image source={{uri:BackgroundImage}} style={{flex:1,width,height:this.props.imgH,resizeMode:isHorizontal?'contain':'cover',position:'absolute',marginTop:isHorizontal?height/2:0 }} />
                
                    <TouchableWithoutFeedback onPress={()=>{this.onConfirmClick()}}>
                    <SafeAreaView style={{width:width+1000,height:height-100,flexDirection:'row',alignContent:'center',alignSelf:'center',justifyContent:'space-around'}}>
                            <View  style={{alignSelf:'center',paddingLeft:10,marginTop:200}}>

                                <TextInput
                                    ref={ref => this.txtInput=ref}
                                    autoFocus = {true}
                                    allowFontScaling={false}
                                    multiline = {true}
                                    placeholder = {I18n.t('Input Text')}
                                    placeholderTextColor = {'rgba(255, 255, 255, 0.9)'}
                                    style={[styles.TextInput,{minWidth:width ,maxWidth:width+1000,color:Color,fontSize:txtSize,textAlign:'center'}]}
                                    value={txtValue}
                                    onChangeText={(text) =>
                                        {
                                            this.onChangeText(text);
                                        }
                                    }
                                    //onContentSizeChange ={(event)=>this.onTextHeightChanged(event.nativeEvent.contentSize)}
                                    //onFocus = {()=>this.setState({touchOutside:false,onTextFocus:true})}
                                />
                            </View>
                    </SafeAreaView>
                    </TouchableWithoutFeedback>
                    <SafeAreaView style={{flexDirection:'row',width: width, height: 40,alignContent:'center'}}>
                        <View style={{position:'absolute',width:width-80,height: 40,flexDirection:'row',alignContent:'center',left:40,zIndex:1}}>
                            <Image source={require('../../assets/images/comment/bgFontSizeAdjust.png')} style={{flex:1,alignSelf:'center',zIndex:2}} resizeMode={'contain'} />
                        </View>
                        <Slider
                            style={{felx:3,width: screen.width-60, height: 40,marginLeft:30,zIndex:5}}
                            minimumValue={12}
                            maximumValue={76}
                            value = {txtSize}
                            step = {1}
                            //onValueChange = {(value)=>this.setState({txtSize:parseInt(value)})}
                            onSlidingComplete = {(value)=>this.doFontSizeChanged(value)}
                            minimumTrackTintColor="transparent"
                            maximumTrackTintColor="transparent"
                            thumbStyle={{width:40,height:40,backgroundColor:'transparent'}}
                            thumbImage ={require('../../assets/images/comment/Oval.png')}
                            trackStyle ={{backgroundColor:'transparent'}}
                        />
                    </SafeAreaView>
                    <TouchableWithoutFeedback onPress={()=>{this.onConfirmClick()}}>
                        <View style={{width:width,height:40}}></View>
                    </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        );
    }
}

const styles = StyleSheet.create({
    TextInput:{
        textAlign:'left',
        color:'black',
        alignSelf:'center',
        fontSize:20
    }
})
