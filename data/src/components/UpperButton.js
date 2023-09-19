import React from 'react';
import {Text,View,StyleSheet,TouchableOpacity} from 'react-native';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
export default class UpperButton extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
  }

  render () {
    const {smallPhone} =this.props;
    var styles;
    if(smallPhone) {
      styles = smallStyles;
    } else {
      styles = largeStyles;
    }

    var bgColor ;
    var textColor;
    if( this.props.id == this.props.selected) {
      bgColor = {
        height:36,
        width:76,
        marginTop:16,
        marginRight:10,
        borderRadius:10,
        alignItems:'center',
        justifyContent:'center',
        backgroundColor:VALUES.COLORMAP.dkk_blue,
      }
      textColor ={
        color:VALUES.COLORMAP.dkk_font_white,
      }
    } else {
      bgColor = {
        height:36,
        width:76,
        marginTop:16,
        marginRight:10,
        borderRadius:10,
        alignItems:'center',
        justifyContent:'center',
        backgroundColor:VALUES.COLORMAP.dkk_font_white
      }
      textColor ={
        color:VALUES.COLORMAP.middle_gray
      }
    }

    var needMini = false;
    if(I18n.locale == 'en' && this.props.children == I18n.t('bi_peoplecount_in')) {
      needMini = true;
    }

    return (<TouchableOpacity onPress={this.props.onPress} style={[bgColor,styles.shadowStyle]}>
              <Text  allowFontScaling={false} style={[styles.textStyle,textColor, needMini && miniStyles.textStyle]}>{this.props.children}</Text>
            </TouchableOpacity>);
  }
}


const smallStyles = StyleSheet.create({
    shadowStyle:{
        shadowColor: "rgba(0,0,0,0.16)",
            shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.80,
        shadowRadius: 1.41,
         elevation: 3,
    },
  textStyle: {
    alignSelf : 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});

const largeStyles = StyleSheet.create({
    shadowStyle:{
        shadowColor: "rgba(0,0,0,0.16)",
            shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.50,
        shadowRadius: 1.41,
        elevation: 3,
    },
  textStyle: {
    alignSelf : 'center',
    fontSize: 15,
    fontWeight: '600',
  },
});

const miniStyles = StyleSheet.create({
    shadowStyle:{
        shadowColor: "rgba(0,0,0,0.16)",
            shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.50,
        shadowRadius: 1.41,
         elevation: 2,
    },
  textStyle: {
    alignSelf : 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});
