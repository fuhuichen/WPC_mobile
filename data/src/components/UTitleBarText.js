import React from 'react';
import {Image, ImageBackground,Text,View,StyleSheet,TouchableOpacity, Dimensions,DeviceEventEmitter} from 'react-native';
import VALUES from '../utils/values';
import ImageButton from './ImageButton';
import {ColorStyles} from "../../../app/common/ColorStyles";

export default class UTitleBarText extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
  }

  componentDidMount() {
    DeviceEventEmitter.emit('onStatusBar', '#006AB7');
    //DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
  }

  render () {
    const {smallPhone} =this.props;
    var styles
    var size
    if(smallPhone){
      styles = smallStyles
      size = 60
    }
    else{
      styles = largeStyles
      size = 60
    }
    const screen = Dimensions.get('window')
    var bgImg = require('../../images/banner_type.png')
    return (  <View style={styles.viewStyle}>
                <TouchableOpacity  onPress={this.props.onLeftPress?this.props.onLeftPress:this.empty}
                style={{flexDirection:'row',paddingLeft:10,width:75,alignItems:'center'}}>
                      <Text  allowFontScaling={false} style={styles.textStyle}>{this.props.leftText}</Text>
                </TouchableOpacity>
                <View style={{flex:1}}/>
                <Text  allowFontScaling={false} style={styles.textStyleHead}>{this.props.headerText}</Text>
                <View style={{flex:1}}/>
                <TouchableOpacity   onPress={this.props.onRightPress?this.props.onRightPress:this.empty} style={{width:75,height:35,
                  flexDirection:'row',justifyContent:"flex-end",
                  alignItems:'center'}}>
                <Text  allowFontScaling={false} style={styles.textStyle}>{this.props.rightText}</Text>
                </TouchableOpacity>
              </View>);

  }

}

const largeStyles = StyleSheet.create({
  viewStyle:{
    height:60,
    backgroundColor: '#006AB7',
    alignSelf: 'stretch',
    width: null,
    justifyContent : 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  textStyleHead:{
    color: VALUES.COLORMAP.white,
    fontSize : 18,

  },
  textStyle:{
    color: VALUES.COLORMAP.white,
    fontSize : 14,
    marginRight:10

  },

  imageStyle:{
    width: 60,
    height:60,
  }
});

const smallStyles = StyleSheet.create({
  viewStyle:{
    height:60,
    backgroundColor: 'transparent',
    alignSelf: 'stretch',
    width: null,
    justifyContent : 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  textStyleHead:{
    color: VALUES.COLORMAP.white,
    fontSize : 18,

  },
  textStyle:{
    color: VALUES.COLORMAP.white,
    fontSize : 14,
    marginRight:10

  },

  imageStyle:{
    width: 60,
    height:60,
  }
});
