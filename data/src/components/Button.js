import React from 'react';
import {DeviceEventEmitter, StyleSheet, Text, TouchableOpacity} from 'react-native';
import VALUES from '../utils/values';
import {EMITTER_MODAL_CLOSE} from "../../../app/common/Constant";

export default class Button extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
  }

  componentWillMount(){
    this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_MODAL_CLOSE,
        ()=>{
        this.props.onExit();
    });
  }

  componentWillUnmount(){
    this.notifyEmitter && this.notifyEmitter.remove();
  }

  render () {
    const {smallPhone} =this.props;
    var styles
    if(smallPhone){
      styles = smallStyles
    }
    else{
      styles = largeStyles
    }

    var bgColor = {
      alignSelf: 'stretch',
      backgroundColor: VALUES.COLORMAP.background_blue,
    }
    if( this.props.color){
      bgColor = {
        alignSelf: 'stretch',
        backgroundColor:this.props.color,
      }
    }

    return (<TouchableOpacity onPress={this.props.onPress} style={[bgColor]}>
              <Text  allowFontScaling={false} style={[styles.textStyle,{color:this.props.textColor}]}>{this.props.children}</Text>
            </TouchableOpacity>);
  }
}


const smallStyles = StyleSheet.create({
  textStyle: {
    alignSelf : 'center',
    color: '#CCCCCC55',
    fontSize: 16,
    fontWeight: '300',
    paddingTop : 10,
    paddingBottom: 10


  },
});

const largeStyles = StyleSheet.create({
  textStyle: {
    alignSelf : 'center',
    color: VALUES.COLORMAP.blue_font,
    fontSize: 16,
    fontWeight: '300',
    paddingTop : 15,
    paddingBottom: 15


  },
});
