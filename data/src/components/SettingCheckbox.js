import React from 'react';
import {Image, Text,View,StyleSheet} from 'react-native';
import VALUES from '../utils/values';
import ImageButton from './ImageButton';
import CheckBox from 'react-native-checkbox';
export default class SettingItem extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
  }
  renderContent(){
      const {smallPhone} =this.props;
      var styles

      var fontSize = 12
      if(smallPhone){
        fontSize = 10
        styles = smallStyles
      }
      else{
        styles = largeStyles
      }
      const {id,enable,type,data,checked,color} = this.props;
      var bgcolor = 'transparent'
      var dataColor = {backgroundColor:bgcolor,fontSize:fontSize,color:VALUES.COLORMAP.kpi_content_gray}

      return (
          <View style={{backgroundColor:bgcolor,flexDirection:"row",justifyContent:'flex-start'}}>
            <CheckBox
              checkedImage={require('../../images/circlePress.png')}
              uncheckedImage={require('../../images/main_unclick.png')}
              label={data}
              checked={checked}
              containerStyle={{marginBottom:0,backgroundColor:bgcolor}}
              labelStyle={dataColor}
              checkboxStyle={[{borderWidth:1,borderColor:VALUES.COLORMAP.kpi_title_gray,backgroundColor:'#FFFFFF'},styles.imageStyle]}
              onChange={(checked) => this.props.onCheckPress(!checked,id)}
            />
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
      return (<View style={styles.viewStyle}>
                    {this.renderContent()}
              </View>);
  }
}

SettingItem.propTypes = {   headerText: React.PropTypes.string.isRequired};
SettingItem.defaultProps = {   headerText: 'ABC'};

const smallStyles = StyleSheet.create({
  viewStyle:{
    flexDirection: 'row',
  },
  textStyle:{
    color: VALUES.COLORMAP.font_gray,
    fontSize : 15,
  },
  changeTextStyle:{
    fontSize : 15,
  },
  imageStyle:{
    width: 20,
    height:20,
  }
});

const largeStyles = StyleSheet.create({
  viewStyle:{
    flexDirection: 'row',
    paddingLeft:10,
  },
  textStyle:{
    color: VALUES.COLORMAP.font_gray,
    fontSize : 18,
  },
  changeTextStyle:{
    fontSize : 18,
  },
  imageStyle:{
    width: 20,
    height:20,
  }
});
