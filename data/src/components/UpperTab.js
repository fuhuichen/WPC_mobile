import React from 'react';
import {Text,View,StyleSheet,TouchableOpacity} from 'react-native';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
export default class UpperTab extends React.Component {

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
        paddingLeft:20,
        paddingRight:20,
        flex:1,
        alignItems:'center',
        justifyContent:'center',
        borderBottomWidth:2,
        borderBottomColor:VALUES.COLORMAP.deadline_red,
      }
      textColor ={
        color:VALUES.COLORMAP.deadline_red,
      }
    } else {
      bgColor = {
        paddingLeft:20,
        paddingRight:20,
        flex:1,
        alignItems:'center',
        justifyContent:'center',
        borderBottomWidth:1,
        borderBottomColor:'rgba(203, 203, 203, 0.15)',//VALUES.COLORMAP.middle_gray,
      }
      textColor ={
        color:VALUES.COLORMAP.middle_gray
      }
    }

    var needMini = false;
    if(I18n.locale == 'en' && this.props.children == I18n.t('bi_peoplecount_in')) {
      needMini = true;
    }

    return (<TouchableOpacity onPress={this.props.onPress} style={bgColor}>
              <Text  allowFontScaling={false} style={[styles.textStyle,textColor, needMini && miniStyles.textStyle]}>{this.props.children}</Text>
            </TouchableOpacity>);
  }
}


const smallStyles = StyleSheet.create({
  textStyle: {
    alignSelf : 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});

const largeStyles = StyleSheet.create({
  textStyle: {
    alignSelf : 'center',
    fontSize: 15,
    fontWeight: '600',
  },
});

const miniStyles = StyleSheet.create({
  textStyle: {
    alignSelf : 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});
