import React from 'react';
import {DeviceEventEmitter, Dimensions,Image, StyleSheet, Text, View,TouchableOpacity} from 'react-native';
import VALUES from '../utils/values';
import ModalDropdown from 'react-native-modal-dropdown';
import {EMITTER_MODAL_CLOSE} from "../../../app/common/Constant";

export default class DropDownSelect extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    const screen = Dimensions.get('window')
    console.log(screen.width + ' x '+ screen.height)
    var smallPhone = false;
    if(screen.width <= 320){
      smallPhone = true;
    }
    this.state ={smallPhone}
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
    var fontSize = 12;
    if(this.state.smallPhone){
      fontSize = 10;
    }
    var image = require('../../images/home_pulldown_icon_mormal.png');
    //console.log(option+index+isSelected);
      if(isSelected){
        return (
      <TouchableOpacity  style={{ width:width,height:fontSize* 3.5,
         flexDirection:'column',justifyContent:'center',
          alignItems:'flex-start',
          backgroundColor:'#ECF7FF',borderRadius:5,
          borderColor:'#2C90D9',
          borderWidth:1,}}>

        <Text  allowFontScaling={false} style={{
        
        color: VALUES.COLORMAP.dkk_font_grey,
        fontSize : fontSize,
        textAlign:'center',
        alignSelf:'center',
      }}>{option}</Text>
        </TouchableOpacity>
      );
      }
      else{
          return (
          <TouchableOpacity  style={{  width:width,height:fontSize* 3.5,
             flexDirection:'column',justifyContent:'center',
              alignItems:'flex-start',backgroundColor:"white"}}>
                <Text  allowFontScaling={false} style={{
                borderRadius:0,
                color: VALUES.COLORMAP.dkk_font_grey,
                fontSize : fontSize,
                textAlign:'center',
                alignSelf:'center'
              }}>{option}</Text>
          </TouchableOpacity>
        );
      }
  }
  render () {
    const {smallPhone,list,content,width,changeType,mode} =this.props;
    const {light_gray, middle_gray,dark_gray,bright_blue,white,dkk_red} = VALUES.COLORMAP;

    var iconWidth = 25;
    var iconHeight = 25;
    var textWidth = width - iconWidth ;
    var fontSize = 12;
    var Style = largeStyles;
    if(this.state.smallPhone){
      fontSize = 10;
      Style = smallStyles;
    }
    var image = require('../../images/home_pulldown_icon_mormal.png');
    return   ( <View style={[Style.contain,{width:width}]}>
                  <ModalDropdown ref={"modal"}
                      options={list} onSelect={(id) =>
                     {
                        changeType(id)
                    }}
                    defaultIndex={this.props.defaultIndex}
                    dropdownStyle={[Style.dropdownBoxStyle,{height:fontSize*list.length*3.5+1 ,width:width}]}
                    dropdownTextHighlightStyle={{
                    backgroundColor:'transparent',
                    borderRadius:0,
                    color: VALUES.COLORMAP.white,
                    backgroundColor:VALUES.COLORMAP.green,
                    fontSize : fontSize,
                    textAlign:'center',
                    alignSelf:'center',
                    width:width ,
                    height:25,
                    }}
                    renderRow={(a,b,c)=>this.renderRow(a,b,c,width)}
                    dropdownTextStyle={{
                    color: 'transparent',
                    fontSize : fontSize,
                    textAlign:'center',
                    alignSelf:'center',
                    width:width,
                    height:35,

                  }}>
                      <View  style={{height:35,justifyContent : 'flex-start', alignItems:'center',width,flexDirection:'row'}}>
                      <Text  allowFontScaling={false} style={{ marginLeft:10,textAlign:'center',width:textWidth-15 , alignSelf:'center',color: VALUES.COLORMAP.white,
                      fontSize : fontSize}}>{content}</Text>
                      <Image style={{width:iconWidth,height:iconHeight}} resizeMode={'contain'}  source={image} />
                      </View>
                  </ModalDropdown>
           </View>);
  }
}

const smallStyles = StyleSheet.create({
  contain:{
    alignItems:'center',
    flexDirection:'row',height:25,
    borderRadius:13,
    backgroundColor:'#006AB7',
  },
  dropdownBoxStyle:{
    backgroundColor:VALUES.COLORMAP.dkk_background2,
    borderWidth:0,
    alignItems:'center',
    shadowColor: "rgba(0, 0, 0, 0.06)",
    shadowOffset: {
	    width: 0,
	    height: 2,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  textStyle: {
    alignSelf : 'center',
    color: '#f31d65',
    fontSize: 20,
    fontWeight: '600',
    paddingTop : 1,
    paddingBottom: 1


  },
});

const largeStyles = StyleSheet.create({
  contain:{
    alignItems:'center',
    flexDirection:'row',height:25,
    borderRadius:13,
    backgroundColor:'#006AB7',
  },
  dropdownBoxStyle:{
    backgroundColor:VALUES.COLORMAP.dkk_background2,
    borderWidth:0,
    borderRadius:13,
    alignItems:'center',
    shadowColor: "rgba(0,0,0,0.16)",
    shadowOffset: {
	    width: 0,
	    height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textStyle: {
    alignSelf : 'center',
    color: '#f31d65',
    fontSize: 22,
    fontWeight: '600',
    paddingTop : 1,
    paddingBottom: 1


  },
});
