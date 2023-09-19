import React from 'react';
import {StyleSheet, TextInput, View} from 'react-native';
import VALUES from '../utils/values';

export default class AccountInput extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.state={isText:false}
  }
  componentDidMount () {
      this.textInputRef.focus()
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

    var borderStyle = {borderWidth:1,borderColor:'#9da0b088'};

    return (<View   style={[styles.containerStyle,borderStyle]}>
                <TextInput
                  ref={ref => this.textInputRef = ref}
                  autoFocus={true}
                  onFocus={()=>this.props.onTextInput(true)}
                  onBlur={()=>this.props.onTextInput(false)}
                  onEndEditing={()=>this.props.onTextInput(false)}
                  keyboardType={'email-address'}
                  placeholderTextColor={VALUES.COLORMAP.font_gray}
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
                            marginLeft:5,
                            marginRight:20,
                            fontSize:13,
                            flex:3,
                            paddingLeft:5,
                            paddingRight:5,
                            textAlign:'center',
                            color:VALUES.COLORMAP.white,
                          },
                          labelStyle:{
                            marginLeft:5,
                            color:VALUES.COLORMAP.white,
                            fontSize:15,
                            paddingLeft:10
                          },
                          logoImage: {
                            marginLeft:5,
                            width: 20,
                            height:20,
                         },
                          containerStyle:{
                            backgroundColor:'transparent',
                            height:42,
                            padding:1,
                            paddingLeft:10,
                            paddingRight:10,
                            borderRadius:42,
                            alignItems:'center',
                            flexDirection: 'row',
                          },
                        });

const largeStyles = StyleSheet.create({
  inputStyle:{
    marginLeft:5,
    marginRight:20,
    fontSize:13,
    flex:3,
    textAlign:'center',
    paddingLeft:5,
    paddingRight:5,
    color:VALUES.COLORMAP.white,
  },
  labelStyle:{
    marginLeft:5,
    color:VALUES.COLORMAP.white,
    fontSize:15,
    paddingLeft:10
  },
  logoImage: {
    marginLeft:5,
    width: 30,
    height:30,
 },
  containerStyle:{
    backgroundColor:'transparent',
    height:42,
    padding:1,
    paddingLeft:10,
    paddingRight:10,
    borderRadius:42,
    alignItems:'center',
    flexDirection: 'row',
  },
});
