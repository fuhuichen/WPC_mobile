import React from 'react';
import {DeviceEventEmitter, Image, StyleSheet, Text, View,TouchableOpacity} from 'react-native';
import VALUES from '../utils/values';
import ModalDropdown from 'react-native-modal-dropdown';
import {EMITTER_MODAL_CLOSE} from "../../../app/common/Constant";

export default class DropDownSelect extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
  }

  componentWillMount(){
      this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_MODAL_CLOSE,
          ()=>{
          this.refs.modal && this.refs.modal.hide();
      });
  }

  componentWillUnmount(){
      this.notifyEmitter && this.notifyEmitter.remove();
  }

  renderRow(option, index,isSelected,width){
    var fontSize = 14;
    //var image = require('../../images/home_pulldown_icon_mormal.png');
    var image = require('../../images/selectwhite.png');
    //console.log(option+index+isSelected);
    if(isSelected){
      return (
      <TouchableOpacity style={{ width:width-2,height:fontSize* 2.5, flexDirection:'column',justifyContent:'center',
        alignItems:'flex-start', backgroundColor:'#ECF7FF',borderColor:'#2C90D9',borderWidth:1,borderRadius:5}}>
        <Text allowFontScaling={false} style={{color: '#404554',backgroundColor:'#ECF7FF',
          fontSize: fontSize, textAlign:'center', alignSelf:'flex-start',paddingLeft:20,
          paddingTop:(index==0)?0:0,paddingBottom:(index==this.props.length-1)?16:0}}>{option}</Text>
      </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity style={{  width:width-2,height:fontSize* 2.5, flexDirection:'column',justifyContent:'center',
          alignItems:'flex-start',underlayColor:'#ECF7FF',backgroundColor:'#F7F9FA'}}>
          <Text allowFontScaling={false} style={{ color: '#404554',backgroundColor:'#F7F9FA',
            fontSize: fontSize, textAlign:'left', alignSelf:'flex-start',paddingLeft:20,
            paddingTop:(index==0)?0:0,paddingBottom:(index==this.props.length-1)?16:0}}>{option}</Text>
        </TouchableOpacity>
      );
    }
  }

  render () {
    const {smallPhone,list,content,width,changeType,mode} = this.props;
    const {light_gray, middle_gray,dark_gray,bright_blue,white,dkk_red} = VALUES.COLORMAP;
    //console.log("list:",list)
    var iconWidth = this.props.iconSize || 10;
    var iconHeight = this.props.iconSize || 10;
    var textWidth = width - iconWidth ;
    var fontSize = this.props.fontSize || 16;
    var innerHeight = this.props.innerHeight || 30;
    //var image = require('../../images/home_pulldown_icon_mormal.png');
    var image = require('../../images/btn_arrow_down_m.png');
    return   ( <View style={{alignItems:'center',
                flexDirection:'row',height:45,
                borderRadius:13,
                width:width}}>
                  <ModalDropdown ref={"modal"}
                    options={list} onSelect={(id)=>{ changeType(id) }}
                    defaultIndex={this.props.defaultIndex}
                    dropdownStyle={{
                      width:width,
                      backgroundColor:'#F7F9FA',
                      alignItems:'center',
                      height:fontSize*list.length*2.3 ,
                      maxHeight:300,
                      alwaysBouncesHorizontal:false }} 
                    dropdownTextHighlightStyle={{
                      backgroundColor:'white',
                      borderRadius:0,
                      color: '#ECF7FF',
                      fontSize : fontSize,
                      textAlign:'center',
                      alignSelf:'center',
                      width:width ,
                      height:30,
                    }} 
                    renderRow={(a,b,c)=>this.renderRow(a,b,c,width)}
                    dropdownTextStyle={{
                      color: 'white',
                      fontSize : fontSize,
                      textAlign:'left',
                      alignSelf:'center',
                      width:width,
                      height:30,
                    }} >
                    <View style={{height:innerHeight,justifyContent : 'flex-start',
                      borderBottomWidth:1,borderBottomColor:'#D4D4D4',
                      alignItems:'center',width,flexDirection:'row'}}>
                      <Text allowFontScaling={false} style={{textAlign:'left', paddingLeft: 10, width: textWidth, alignSelf:'center',color: '#64686D', fontSize: fontSize}}>
                        {content}
                      </Text>
                      <Image style={{width:iconWidth, height:iconHeight}} resizeMode={'contain'} source={image} />
                    </View>
                  </ModalDropdown>
           </View>);
  }
}

const smallStyles = StyleSheet.create({
  textStyle: {
    alignSelf : 'center',
    color: VALUES.COLORMAP.white,
    fontSize: 20,
    fontWeight: '600',
    paddingTop : 1,
    paddingBottom: 1
  },
});

const largeStyles = StyleSheet.create({
  textStyle: {
    alignSelf : 'center',
    color: VALUES.COLORMAP.white,
    fontSize: 22,
    fontWeight: '600',
    paddingTop : 1,
    paddingBottom: 1
  },
});
