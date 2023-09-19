import React from 'react';
import {Image, ImageBackground,Text,View,StyleSheet,TouchableOpacity, Dimensions,DeviceEventEmitter, StatusBar} from 'react-native';
import VALUES from '../utils/values';
import ImageButton from './ImageButton';
import Navigation from "../../../app/element/Navigation";
import {ColorStyles} from "../../../app/common/ColorStyles";


export default class UActionBar extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
  }

  render () {
    const {smallPhone} =this.props;
    var styles
    var size
    if(smallPhone){
      styles = smallStyles
      size = 48
    }
    else{
      styles = largeStyles
      size = 48
    }
    const screen = Dimensions.get('window')
    var bgImg = require('../../images/banner_type.png')
    return (  
        <View>
            <StatusBar backgroundColor={ColorStyles.STATUS_RGB_BLUE}/>
            <View style={styles.viewStyle}>  
                <Navigation
                    leftIconType= {this.props.leftIconType}
                    leftButtionIcon = { this.props.leftIconType=='switch'?require('../../../app/assets/images/img_navbar_switch.png'):null}
                    onLeftButtonPress={this.props.onLeftPress?this.props.onLeftPress:this.empty}
                    title={this.props.headerText}
                    rightButtonTitle={this.props.rightButtonTitle?this.props.rightButtonTitle:''}
                    rightButtonEnable={this.props.onRightPress?true:false}
                    onRightButtonPress={this.props.onRightPress?this.props.onRightPress:this.empty}
                />
                {/*<TouchableOpacity  onPress={this.props.onLeftPress?this.props.onLeftPress:this.empty} style={{flexDirection:'row',width:60,alignItems:'center'}}>
                <ImageButton height={size} width={size} type={this.props.leftIconType} onPress={this.props.onLeftPress?this.props.onLeftPress:this.empty}/>
                <Text  allowFontScaling={false} style={styles.textStyle}>{this.props.leftText}</Text>
                </TouchableOpacity>

                <View style={{flex:1}}/>
                <Text  allowFontScaling={false} style={styles.textStyleHead}>{this.props.headerText}</Text>
                <View style={{flex:1}}/>
                <TouchableOpacity   onPress={this.props.onRightPress?this.props.onRightPress:this.empty} style={{width:60,height:35,
                  flexDirection:'row',justifyContent:"flex-end",
                  alignItems:'center'}}>
                <ImageButton height={size} width={size} type={this.props.rightIconType}   onPress={this.props.onRightPress?this.props.onRightPress:this.empty} />
                </TouchableOpacity>*/}
              </View>
        </View>
      );
  }

}

const largeStyles = StyleSheet.create({
  viewStyle:{
    paddingTop:(Platform.OS === 'ios') ?30:10,
    height:40,
    backgroundColor: '#F7F9FA',
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
    color: VALUES.COLORMAP.dkk_gray,
    fontSize : 14,
  },

  imageStyle:{
    width: 60,
    height:60,
  }
});

const smallStyles = StyleSheet.create({
  viewStyle:{
    paddingTop:10,
    height:40,
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
    color: VALUES.COLORMAP.dkk_gray,
    fontSize : 14,

  },

  imageStyle:{
    width: 60,
    height:60,
  }
});
