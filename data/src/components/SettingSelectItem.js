import React from 'react';
import {Image,Text,View,StyleSheet,TouchableOpacity} from 'react-native';
import VALUES from '../utils/values';
export default class SettingSelectItem extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
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
    var color, textColor;
    const {id,fontColor} = this.props
    if(id == this.props.selected ){
        color = {  backgroundColor: VALUES.COLORMAP.tifanny};
        textColor = {  color:VALUES.COLORMAP.white}
    }
    else{
       color = {  backgroundColor: VALUES.COLORMAP.white};
       textColor = {  color:VALUES.COLORMAP.kpi_title_gray}
    }

   return (<TouchableOpacity onPress={()=>this.props.onPress(id)} style={[styles.SettingSelectItemStyle, {paddingLeft:this.props.offset},color]}>
                <Text  allowFontScaling={false} style={[styles.textStyle, textColor]}>{this.props.children}</Text>
            </TouchableOpacity>);
  }
}

SettingSelectItem.propTypes = {   children: React.PropTypes.any,
  onPress : React.PropTypes.any};
SettingSelectItem.defaultProps = {   children:undefined, onPress:undefined};

const smallStyles = StyleSheet.create({
  textStyle: {
    alignSelf : 'center',
    fontSize: 13,

  },
  SettingSelectItemStyle:{
    flexDirection:'row',
    height : 45,
    paddingLeft:15,
    alignItems:'center',
    justifyContent:'flex-start',
    borderBottomWidth:1,
    borderBottomColor:VALUES.COLORMAP.light_gray
  },
});

const largeStyles = StyleSheet.create({
  textStyle: {
    alignSelf : 'center',
    fontSize: 16,

  },
  SettingSelectItemStyle:{
    flexDirection:'row',
    height : 60,
    paddingLeft:15,
    alignItems:'center',
    justifyContent:'flex-start',
    borderBottomWidth:1,
    borderBottomColor:VALUES.COLORMAP.light_gray
  },
});
