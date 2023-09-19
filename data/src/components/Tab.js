import React from 'react';
import {Image,Text,View,StyleSheet,TouchableOpacity} from 'react-native';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
export default class Tab extends React.Component {

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
    textColor = { color: '#D3D4D6'};

    if( id == 'heatmap'|| id=='turnin'
        || id=='shoprate' || id=='return' || id=='trend'
      || id=='rank' || id=='sale' || id=='proportion'
      || id=="bi_shopper_count" || id=="bi_sale_values"){
      var  image ;
      if(id != this.props.selected ){
          if( id == 'heatmap'){
              image = require('../../images/passengerflow_toolbar_hotspot_icon_normal.png');
          //  image = require('../../resources/img/main_kpi.png');
          }
          else if(id=='turnin' ){
              image = require('../../images/passengerflow_toolbar_enter_icon_normal.png');
          //  image = require('../../resources/img/main_ranking.png');
          }
          else if( id=='shoprate'){
              image = require('../../images/passengerflow_toolbar_buy_icon_normal.png');
          //  image = require('../../resources/img/main_compare.png');
          }
          else if( id=='return'){
              image = require('../../images/return_icon_normal.png');
          //  image = require('../../resources/img/main_compare.png');
          }
          else if( id=='trend'){
              image = require('../../images/img_trend_normal.png');
          //  image = require('../../resources/img/main_compare.png');
          }
          else if( id=='proportion'){
              image = require('../../images/img_proportion_normal.png');
          }
          else if( id=='rank'){
              image = require('../../images/condition_toolbar_cup_icon_normal1.png');
          //  image = require('../../resources/img/main_compare.png');
          }
          else if( id=='sale'){
              image = require('../../images/condition_toolbar_money_icon_mormal.png');
          //  image = require('../../resources/img/main_compare.png');
          }
          else if( id=="bi_shopper_count"){
              image = require('../../images/turnover_toolbar_buy_icon_normal.png');
          //  image = require('../../resources/img/main_compare.png');
          }
          else if( id=="bi_sale_values"){
              image = require('../../images/turnover_toolbar_turnover_icon_normal.png');
          //  image = require('../../resources/img/main_compare.png');
          }

      }
      else{
          //if( I18n.locale=='en') {
            textColor = { color: '#006AB7'};
          //} else {
            //textColor = { color: '#f31d65',fontSize:12};
          //}
          if( id == 'heatmap'){
              image = require('../../images/passengerflow_toolbar_hotspot_icon_seleted.png');
          //  image = require('../../resources/img/main_kpi.png');
          }
          else if(id=='turnin' ){
              image = require('../../images/passengerflow_toolbar_enter_icon_selected.png');
          //  image = require('../../resources/img/main_ranking.png');
          }
          else if(id=='shoprate' ){
              image = require('../../images/passengerflow_toolbar_buy_icon_selected.png');
          //  image = require('../../resources/img/main_ranking.png');
          }
          else if( id=='return'){
              image = require('../../images/passengerflow_toolbar_visitor_icon_pressed.png');
          //  image = require('../../resources/img/main_compare.png');
          }
          else if( id=='trend'){
              image = require('../../images/img_trend_selected.png');
          //  image = require('../../resources/img/main_compare.png');
          }
          else if( id=='proportion'){
              image = require('../../images/img_proportion_selected.png');
          }
          else if( id=='rank'){
              image = require('../../images/condition_toolbar_cup_icon_selected.png');
          //  image = require('../../resources/img/main_compare.png');
          }
          else if( id=='sale'){
              image = require('../../images/condition_toolbar_money_icon_pressed.png');
          //  image = require('../../resources/img/main_compare.png');
          }
          else if( id=="bi_shopper_count"){
              image = require('../../images/turnover_toolbar_buy_icon_selected.png');
          //  image = require('../../resources/img/main_compare.png');
          }
          else if( id=="bi_sale_values"){
              image = require('../../images/turnover_toolbar_turnover_icon_selected.png');
          //  image = require('../../resources/img/main_compare.png');
          }
      }

      var tStyle;
      if( I18n.locale=='en'){
            tStyle = styles.textEnStyle;
            return (<TouchableOpacity onPress={this.props.onPress} style={[styles.TabStyle, color]}>
                      <Image style={styles.imageStyle} resizeMode={'stretch'}  source={image} />
                      <View style={{height:25,justifyContent:'center',paddingLeft:5,paddingRight:5}}>
                      <Text  allowFontScaling={false} style={[styles.textStyle, textColor]}>{this.props.text}</Text>
                      </View>
                    </TouchableOpacity>);
      }
      else{
            tStyle = styles.textSmallStyle;
            return (<TouchableOpacity onPress={this.props.onPress} style={[styles.TabStyle, color,{paddingTop:10}]}>
                      <Image style={styles.imageStyle} resizeMode={'stretch'}  source={image} />
                      <View style={{height:25,justifyContent:'center',paddingLeft:5,paddingRight:5}}>
                      <Text  allowFontScaling={false} style={[styles.textStyle, textColor]}>{this.props.text}</Text>
                      </View>
                    </TouchableOpacity>);
      }


    }
    else{
      return (<TouchableOpacity onPress={this.props.onPress} style={[styles.TabStyle, color]}>
                <Text  allowFontScaling={false} style={[styles.textStyle, textColor]}>{this.props.children}</Text>
              </TouchableOpacity>);
    }

  }
}

const smallStyles = StyleSheet.create({
    textStyle: {
      textAlign : 'center',
      fontSize: 10,

    },
  textSmallStyle: {
    textAlign : 'center',
    fontSize: 9,

  },
  textEnStyle: {
    textAlign : 'center',
    fontSize: 9,

  },
  TabStyle:{
    paddingLeft:5,
    paddingRight:5,
    flex:1,
    alignItems:'center',
    justifyContent:'center',
  },
  imageStyle:{resizeMode:'stretch',height:24,width:24},
});

const largeStyles = StyleSheet.create({
  textStyle: {
    textAlign : 'center',
    fontSize: 12,

  },
  textSmallStyle: {
    textAlign : 'center',
    fontSize: 9,

  },
  textEnStyle: {
    textAlign : 'center',
    fontSize: 9,

  },
  TabStyle:{
    paddingLeft:5,
    paddingRight:5,
    flex:1,
    alignItems:'center',
    justifyContent:'center',
  },
  imageStyle:{resizeMode:'stretch',height:30,width:30},
});
