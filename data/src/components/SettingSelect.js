import React from 'react';
import {Image,Text,View,TextInput,StyleSheet,TouchableOpacity,} from 'react-native';
import VALUES from '../utils/values';

export default class SettingInput extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
      this.state={isText:false}
  }

  renderDatePicker(){
      return (
          <View style={{width:30}}>
              <TouchableOpacity opacity={0.5} onPress={()=>{this.props.onPress()}}>
                  <Image source={require('../../images/home_pulldown_icon_mormal.png')} style={{width:32,height:32}}/>
              </TouchableOpacity>
          </View>
      )
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
    if(this.props.time){
        return (<View style={[styles.containerStyle, borderStyle]}>
                    <Text allowFontScaling={false} style={{width:70,color:VALUES.COLORMAP.white}}>
                      {this.props.title}
                    </Text>
                    <View style={{flex:1,flexDirection:'row',borderBottomWidth:1, marginLeft:30,
                      alignItems:'center',borderBottomColor:'#9da0b088'}}>
                      <Text allowFontScaling={false} style={styles.inputStyle}>
                        {this.props.value}
                      </Text>
                      {this.renderDatePicker()}
                    </View>
                  </View>);

    }
    return (<TouchableOpacity onPress={()=>{this.props.onPress()}} style={[styles.containerStyle, borderStyle]}>
              <Text allowFontScaling={false} style={{width:70,color:VALUES.COLORMAP.white}}>
                {this.props.title}
              </Text>
              <View style={{flex:1,flexDirection:'row',borderBottomWidth:1, marginLeft:30,
                alignItems:'center',borderBottomColor:'#9da0b088'}}>
                <Text allowFontScaling={false} style={styles.inputStyle}>
                  {this.props.value}
                </Text>
                <Image style={{width:42,height:42}} source={require('../../images/home_pulldown_icon_mormal.png')}/>
              </View>
            </TouchableOpacity>);
  }
}


const smallStyles = StyleSheet.create({
                          inputStyle:{
                            height:42,
                            marginLeft:5,
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
    height:32,
    marginTop:10,
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
