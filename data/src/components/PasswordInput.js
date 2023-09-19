import React from 'react';
import {Image, KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity} from 'react-native';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';

export default class AccountInput extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.state={isText:false}
  }

  render () {
    const {smallPhone} =this.props;
    var styles
    if(　I18n.locale=='en'){
      styles = smallStyles
    }
    else if(smallPhone ){
      styles = smallStyles
    }
    else{
      styles = largeStyles
    }
    var logoImage = require('../../images/login_password_pic.png')
    var   borderStyle = {paddingLeft:10,borderBottomWidth:1,borderBottomColor:VALUES.COLORMAP.white };
    return (< KeyboardAvoidingView behavior="padding" style={[styles.containerStyle,borderStyle]}>
              <Image style={{width:11,height:15,marginRight:5}} source={logoImage}/>
              <TextInput
                  allowFontScaling={false}
                  onFocus={()=>this.props.onTextInput(true)}
                  onBlur={()=>this.props.onTextInput(false)}
                  onEndEditing={()=>this.props.onTextInput(false)}
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
              <TouchableOpacity onPress={this.props.onPress} >
                        <Text  allowFontScaling={false} style={styles.textStyle}>{this.props.children}</Text>
              </TouchableOpacity>
           </KeyboardAvoidingView >);
  }
}


/*
const styles = StyleSheet.create({
  inputStyle:{
    marginLeft:12,
    marginRight:20,
    fontSize:14,
    flex:3,
    paddingLeft:5,
    paddingRight:5,
    color:VALUES.COLORMAP.white,
  },
  labelStyle:{
    marginLeft:5,
    color:VALUES.COLORMAP.white,
    fontSize:14,
    paddingLeft:10
  },
  logoImage: {
    marginLeft:5,
    width: 30,
    height:30,
 },
  containerStyle:{
    backgroundColor:'#00000088',
    height:50,
    padding:5,
    borderRadius:40,
    alignItems:'center',
    flexDirection: 'row',
  },
  textStyle: {
    alignSelf :'center',
    color:VALUES.COLORMAP.white,
    fontSize: 16,
    paddingTop : 15,
    paddingRight : 15,
    paddingBottom: 15
  },
});
*/
const smallStyles = StyleSheet.create({
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
  textStyle: {
    alignSelf :'center',
    color:VALUES.COLORMAP.white,
    fontSize: 12,
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
  textStyle: {
    alignSelf :'center',
    color:VALUES.COLORMAP.white,
    fontSize: 14,

  },
});
