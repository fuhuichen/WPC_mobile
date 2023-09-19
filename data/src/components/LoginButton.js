import React from 'react';
import {StyleSheet, Text, TouchableHighlight} from 'react-native';
import VALUES from '../utils/values';

export default class LoginButton extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.state={pressed:false}
  }

  render () {
    const {noborder,smallPhone} =this.props;
    var styles
    var imgName;
    if(smallPhone){
      styles = smallStyles
    }
    else{
      styles = largeStyles
    }
    var borderStyle = {borderWidth:1, borderRadius:0};
    var bgStyle = {borderColor: this.props.backgroundColor,backgroundColor: this.props.backgroundColor}
    var textStyle={fontSize:15,color:this.props.color}
    var underlayColor = "transparent";
    if(this.state.pressed){
      bgStyle = {borderColor:"#00000011",backgroundColor: '#00000011'}
      borderStyle = {borderWidth:1, borderRadius:0};
      textStyle={fontSize:15,color:"#ffffff"}
    }
    if(this.props.loginStyle){
      // bgStyle = {borderColor:"#ffffff",backgroundColor: '#FFFFFF11'}
       borderStyle = {borderWidth:1,borderRadius:7};
    //   textStyle={fontSize:15,color:"#ffffff"}
    }
    return (
                <TouchableHighlight underlayColor={"#ffffff34"}
                onPressIn={() => this.setState({pressed:true})}
                onPressOut={() => {this.setState({pressed:false});this.props.onPress()}}
                style={[styles.LoginButtonStyle,bgStyle,borderStyle]}>
                <Text  allowFontScaling={false} style={textStyle}>{this.props.children}</Text>
                </TouchableHighlight>

            );
  }
}

const largeStyles = StyleSheet.create({
  backgroundImage: {
   alignSelf: 'stretch',
   height:40,
   width: null,

  },
  LoginButtonStyle:{
    height:40,
    alignItems:'center',
    justifyContent:'center',
    borderColor: VALUES.COLORMAP.white,
  },
});

const smallStyles = StyleSheet.create({
  backgroundImage: {
   alignSelf: 'stretch',
   height:30,
   width: null,
  },
  LoginButtonStyle:{
    height:30,
    alignItems:'center',
    justifyContent:'center',
    borderColor: VALUES.COLORMAP.white,
    borderRadius:5,
  },
});
