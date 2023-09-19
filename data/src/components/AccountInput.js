import React from 'react';
import {Image, StyleSheet, TextInput, View} from 'react-native';
import VALUES from '../utils/values';

export default class AccountInput extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.state={isText:false}
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
    var logoImage = require('../../images/login_usename_pic.png')
    var borderStyle = {paddingLeft:10,borderBottomWidth:1,borderBottomColor:VALUES.COLORMAP.white  };
//
    return (<View   style={[styles.containerStyle,borderStyle]}>
                <Image style={{width:14,height:14,marginRight:5}} source={logoImage}/>
                <TextInput
                  allowFontScaling={false}
                  onFocus={()=>this.props.onTextInput(true)}
                  onBlur={()=>this.props.onTextInput(false)}
                  onEndEditing={()=>this.props.onTextInput(false)}
                  keyboardType={'email-address'}
                  placeholderTextColor={VALUES.COLORMAP.white}
                  underlineColorAndroid="transparent"
                  autoCorrect={false}
                  placeholder={this.props.placeholder}
                  secureTextEntry={this.props.secureTextEntry}
                  style={styles.inputStyle}
                  value={this.props.value}
                  onChangeText={(text)=>{
                  if(text.length>0){
                    this.setState({isText:true})
                  }
                  else{
                    this.setState({isText:false})
                  }
                  this.props.onChangeText(text)}}>
              </TextInput>
           </View>);
  }
}


const smallStyles = StyleSheet.create({
                          inputStyle:{
                            fontSize:14,
                            flex:3,
                            color:VALUES.COLORMAP.white,
                          },
                          labelStyle:{
                            marginLeft:5,
                            color:VALUES.COLORMAP.white,
                            fontSize:14,
                          },
                          logoImage: {
                            marginLeft:5,
                            width: 20,
                            height:20,
                         },
                          containerStyle:{
                            backgroundColor:'transparent',
                            height:42,
                            alignItems:'center',
                            flexDirection: 'row',
                          },
                        });

const largeStyles = StyleSheet.create({
  inputStyle:{
    marginLeft:5,
    marginRight:20,
    fontSize:14,
    flex:3,
    color:VALUES.COLORMAP.white,
  },
  labelStyle:{
    marginLeft:5,
    color:VALUES.COLORMAP.white,
    fontSize:14,
  },
  logoImage: {
    marginLeft:5,
    width: 30,
    height:30,
 },
  containerStyle:{
    backgroundColor:'transparent',
    height:42,
    borderRadius:10,
    alignItems:'center',
    flexDirection: 'row',
  },
});
