import React from 'react';
import {Image,Text,View,TextInput,StyleSheet,Dimensions} from 'react-native';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
export default class SettingInput extends React.Component {

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
    var borderStyle = {borderWidth:0};
    const screen = Dimensions.get('window');
    if(this.props.sale){
        var borderStyle = {borderWidth:0, flexDirection:'column', justifyContent:'flex-start', alignItems:'center', marginBottom: 40};
        return (<View style={[borderStyle]}>
                  <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.dkk_blue, fontSize:18}}>
                    {this.props.title}
                  </Text>
                  <View style={{width:screen.width-100, borderBottomWidth:1,
                    marginLeft:50,marginRight:50, alignItems:'center',borderBottomColor:'#D4D4D4'}}>
                    <TextInput
                      onFocus={()=>this.props.onTextInput(true)}
                      onBlur={()=>this.props.onTextInput(false)}
                      onEndEditing={()=>this.props.onTextInput(false)}
                      placeholderTextColor={VALUES.COLORMAP.white}
                      underlineColorAndroid="transparent"
                      keyboardType={this.props.keyboardType?this.props.keyboardType:'default'}
                      autoCorrect={false}
                      editable={this.props.editable}
                      placeholder={this.props.placeholder}
                      secureTextEntry={this.props.secureTextEntry}
                      style={{width:screen.width-100,height:50,marginBottom:-10,color:VALUES.COLORMAP.dkk_gray,fontSize:20,textAlign:'center'}}
                      value={this.props.value}
                      onChangeText={(text)=>{
                      if(text.length>0){
                        this.setState({isText:true})
                      } else {
                        this.setState({isText:false})
                      }
                      this.props.onChangeText(text)}}>
                    </TextInput>
                  </View>
               </View>);
    }
    if(this.props.isEng){
        return (<View   style={[styles.containerStyle,borderStyle,{flexDirection:'column',height:80,alignItems:'flex-start',paddingLeft:20}]}>
                    <Text  allowFontScaling={false} style={{color:VALUES.COLORMAP.dkk_blue,fontSize:12}}>
                      {this.props.title}
                    </Text>
                    <View style={{flexDirection:'row',borderBottomWidth:1,
                    alignItems:'center',borderBottomColor:'#9da0b088'}}>
                    <TextInput
                    onFocus={()=>this.props.onTextInput(true)}
                    onBlur={()=>this.props.onTextInput(false)}
                    onEndEditing={()=>this.props.onTextInput(false)}
                    placeholderTextColor={VALUES.COLORMAP.dkk_gray}
                    underlineColorAndroid="transparent"
                    autoCorrect={false}
                    keyboardType={this.props.keyboardType?this.props.keyboardType:'default'}
                    editable={this.props.editable}
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
                  {this.props.unit?<Text  allowFontScaling={false} style={{width:50,textAlign:'right',color:VALUES.COLORMAP.dkk_gray,fontSize:12}}>
                    {this.props.unit}
                  </Text>:null}
                  </View>
               </View>);
    }


    return (<View style={[styles.containerStyle,borderStyle]}>
              <Text allowFontScaling={false} style={[{color:VALUES.COLORMAP.dkk_blue,fontSize:12},this.props.titleWidth ? {width: this.props.titleWidth} : {}]}>
                {this.props.title}
              </Text>
              <View style={{flex:1,flexDirection:'row',borderBottomWidth:1,marginLeft:30,alignItems:'center',borderBottomColor:'#D4D4D4'}}>
                <TextInput
                  onFocus={()=>this.props.onTextInput(true)}
                  onBlur={()=>this.props.onTextInput(false)}
                  onEndEditing={()=>this.props.onTextInput(false)}
                  placeholderTextColor={VALUES.COLORMAP.dkk_gray}
                  underlineColorAndroid="transparent"
                  autoCorrect={false}
                  keyboardType={this.props.keyboardType?this.props.keyboardType:'default'}
                  editable={this.props.editable}
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
                {this.props.unit?<Text  allowFontScaling={false} style={{width:50,textAlign:'right',color:VALUES.COLORMAP.dkk_gray,fontSize:12}}>
                {this.props.unit}
                </Text>:null}
              </View>
           </View>);
  }
}


const smallStyles = StyleSheet.create({
                          inputStyle:{
                            marginLeft:5,
                            marginRight:20,
                            fontSize:14,
                            paddingLeft:5,
                            paddingRight:5,
                            color:VALUES.COLORMAP.ddk_gray,
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
                            marginTop:10,
                            backgroundColor:'transparent',
                            height:42,
                            padding:1,
                            paddingLeft:10,
                            marginRight:12,
                            borderRadius:44,
                            alignItems:'center',
                            justifyContent:'center',
                            flexDirection: 'row',
                          },
                        });

const largeStyles = StyleSheet.create({
  inputStyle:{
    textAlign: 'left',
    marginLeft:5,
    marginRight:20,
    fontSize:14,
    flex:3,
    alignItems:'center',
    paddingLeft:5,
    paddingRight:5,
    color:VALUES.COLORMAP.white,
  },
  labelStyle:{
    textAlign: 'left',
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
    marginTop:10,
    backgroundColor:'transparent',
    height:42,
    padding:1,
    paddingLeft:10,
    marginRight:12,
    borderRadius:44,
    alignItems:'center',
    flexDirection: 'row',
  },
});
