import React from 'react';
import {Image, Text,View,StyleSheet,TouchableOpacity} from 'react-native';
import VALUES from '../utils/values';
import ImageButton from './ImageButton';
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
      size = 25
    }
    else{
      styles = largeStyles
      size = 26
    }

    return (<View style={styles.viewStyle}>
                <TouchableOpacity  onPress={this.props.onLeftPress?this.props.onLeftPress:this.empty} style={{paddingLeft:10,paddingTop:7,flexDirection:'row',width:100,height:35}}>
                <ImageButton height={size} width={size} type={this.props.leftIconType} onPress={this.props.onLeftPress?this.props.onLeftPress:this.empty}/>
                <View style={{flex:1}}/>
                </TouchableOpacity>
                <Text  allowFontScaling={false} style={styles.textStyleHead}>{this.props.headerText}</Text>
                <TouchableOpacity   onPress={this.props.onRightPress?this.props.onRightPress:this.empty} style={{paddingRight:20,paddingTop:7,flexDirection:'row',width:100,height:35}}>
                <View style={{flex:1}}/>
                <ImageButton height={size} width={size} type={this.props.rightIconType}   onPress={this.props.onRightPress?this.props.onRightPress:this.empty} />
                </TouchableOpacity>
            </View>);
  }
}
const largeStyles = StyleSheet.create({
  viewStyle:{
    backgroundColor : 'transparent',
    justifyContent : 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    height : 35,
    position:'relative',
    paddingLeft:5,
    paddingRight:5,
  },
  textStyleHead:{
    color: VALUES.COLORMAP.black,
    fontSize : 16,

  },
  textStyle:{
    color: VALUES.COLORMAP.white,
    fontSize : 18,

  },

  imageStyle:{
    width: 50,
    height:50,
  }
});

const smallStyles = StyleSheet.create({
  viewStyle:{
    backgroundColor : 'transparent',
    justifyContent : 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    height : 35,
    position:'relative',
    paddingLeft:5,
    paddingRight:5,
  },
  textStyle:{
    color: VALUES.COLORMAP.white,
    fontSize : 16,

  },
  textStyleHead:{
    color: VALUES.COLORMAP.black,
    fontSize : 16,

  },

  imageStyle:{
    width: 35,
    height:35,
  }
});
