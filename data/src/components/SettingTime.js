import React from 'react';
import {Image,Text,View,TextInput,StyleSheet,TouchableOpacity,} from 'react-native';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import ImageView from './ImageView';
import ModalDropdown from 'react-native-modal-dropdown';
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
    const options =[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
    return (<View
      style={[styles.containerStyle,borderStyle]}>
                <Text  allowFontScaling={false} style={{width:50,color:VALUES.COLORMAP.white,fontSize:12}}>
                  {this.props.title}
                </Text>
                <View style={{flex:1,flexDirection:'row',borderBottomWidth:2, marginLeft:30,paddingLeft:0,
                justifyContent:'center',
                alignItems:'center',borderBottomColor:'#9da0b088'}}>
                <ModalDropdown
                        width={80}
                        options={options}
                        onSelect={this.props.onStartChange}
                         dropdownStyle={{backgroundColor:VALUES.COLORMAP.dkk_background,height:158,padding:7}}
                        dropdownTextStyle={styles.textDropdownStyle}>
                  <View style={{alignItems:'center',flexDirection:'row'}}>
                      <Text  allowFontScaling={false} style={{width:30,marginLeft:10,color:VALUES.COLORMAP.white,fontSize:20}}>
                        {this.props.start+''}
                      </Text>
                       <Image style={{width:42,height:42}} source={require('../../images/home_pulldown_icon_mormal.png')}/>
                  </View>

                </ModalDropdown>

              </View>
              <Text  allowFontScaling={false} style={{width:40,color:VALUES.COLORMAP.white,fontSize:20}}>
                {'時~'}
              </Text>
              <View style={{flex:1,flexDirection:'row',borderBottomWidth:2, marginLeft:30,paddingLeft:0,
              justifyContent:'center',
              alignItems:'center',borderBottomColor:'#9da0b088'}}>
              <ModalDropdown
                      width={80}
                      options={options}
                      onSelect={this.props.onEndChange}
                      dropdownStyle={{backgroundColor:VALUES.COLORMAP.dkk_background,height:158,padding:7}}
                      dropdownTextStyle={styles.textDropdownStyle}>
                <View style={{alignItems:'center',flexDirection:'row'}}>
                    <Text  allowFontScaling={false} style={{width:30,marginLeft:10,color:VALUES.COLORMAP.white,fontSize:20}}>
                      {this.props.end+''}
                    </Text>
                    <Image style={{width:42,height:42}} source={require('../../images/home_pulldown_icon_mormal.png')}/>
                </View>
              </ModalDropdown>
            </View>
            <Text  allowFontScaling={false} style={{width:20,color:VALUES.COLORMAP.white,fontSize:14}}>
              {'時'}
            </Text>
           </View>);
  }
}


const smallStyles = StyleSheet.create({
                            textDropdownStyle:{
                              height:35,
                              backgroundColor:VALUES.COLORMAP.dkk_background,
                              color: VALUES.COLORMAP.white,
                              fontSize : 14,
                              paddingRight:10,
                              paddingLeft:5,
                              paddingTop:2,
                              paddingBottom:2
                            },
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
    textDropdownStyle:{
        height:35,
        backgroundColor:VALUES.COLORMAP.dkk_background,
        color: VALUES.COLORMAP.white,
        fontSize : 16,
        paddingRight:10,
        paddingLeft:5,
        paddingTop:2,
        paddingBottom:2
    },
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
