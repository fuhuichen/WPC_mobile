import React from 'react';
import {Image,Text,View,StyleSheet,TouchableOpacity} from 'react-native';
import VALUES from '../utils/values';
import DataHandler from '../utils/DataHandler'
import moment from 'moment'
import I18n from 'react-native-i18n';
export default class DataInfo extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
  }
  renderTitle(){
    const {smallPhone} =this.props;
    var styles
    if(smallPhone){
      styles = smallStyles
    }
    else{
      styles = largeStyles
    }
    var font
    if( I18n.locale=='en'){
      font = {fontSize:7};
    }

    const {data, date, unit,range,type,widget} = this.props;
    return   <Text  allowFontScaling={false} style={[styles.textStyle,font]}>{I18n.t(widget.title)}</Text>;
  }
  convertPeriod(value, date, range, unit){
    var d = new Date();
    if(date){
      d = moment(date, 'YYYY/MM/DD').toDate();
    }


    if( range == 'ww'){
        value = DataHandler.gconverEngWeekend(value);
    }
    else if( range == 'mm'){
          var m  = moment(d).format('YYYY/MM/');
          value = m + value;

    }
    else if( range == 'yyyy'){
      if( unit == 'mm'){
          var y = moment(d).format('YYYY/');
          value = y + value;
      }
      else{
           value = '第' +value+ '周'
      }
    }
    return value;
  }


  getContent(){
    const {data, date, unit,range,type,widget} = this.props;
    if( data){
      var item = {};
      var d = data;
      //var d = DataHandler.parseDataResponse(data, widget.data_source);
      //d = DataHandler.cleanData(d, widget);
      //console.log(d);
      item.label = 0;
      if(  widget.title == "bi_people_single_buy" ||
            widget.title == "bi_turnin_rate" ||
            widget.title == '提袋率' ||
            widget.title == "bi_teturncustom_rate" ||
            widget.title == '連帶率'   ){
              item.value = d[0].avg;
              if( d[1].avg > 0 ){
                item.label = 100* (d[0].avg - d[1].avg )/ d[1].avg
                item.label = item.label.toFixed(1)
              }
      }
      else{
        item.value = d[0].sum;
        if( d[1].sum > 0 ){
          item.label = 100* (d[0].sum - d[1].sum )/ d[1].sum
          item.label = item.label.toFixed(1)
        }
      }

      item.value = DataHandler.fixDataValue(item.value ,widget);

      return item ;
    }
  }

  renderBottom(type, value){

    const {smallPhone} =this.props;
    var styles
    if(smallPhone){
      styles = smallStyles
    }
    else{
      styles = largeStyles
    }
    var subColor  = { color: VALUES.COLORMAP.middle_gray};
    var image;

      if(  value >0){
          value  = '+' + value  ;
          subColor  = { color: VALUES.COLORMAP.green};
          image = require('../../resources/img/upicon.png');
      }
      else if(value< 0 ){
        image = require('../../resources/img/down.png');
        subColor  = { color: VALUES.COLORMAP.red};
      }
      value  = value  + '%';
          //console.log(value)
         var font = { fontSize:10}
         return (<View style={{flexDirection:'row',alignItems:'center'}}>
          <Text  allowFontScaling={false} style={[styles.subTextStyle,subColor,font ]}>{value}</Text>
          <Image style={{marginLeft:3,width:10,height:10}} resizeMode={'contain'}  source={image} />
          </View>)


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
    var content = this.getContent();

    const {type} = this.props;

    var subColor  = { color: VALUES.COLORMAP.white};

    content.value = '' + content.value;
    var dymStyle ;
    if( content.value.length >= 6){
      dymStyle = styles.smallTextStyle
    }
    else{
      dymStyle = styles.bigTextStyle
    }
    return (
           <View  style={styles.DataInfoStyle}>
               <View  style={styles.DataStyle}>

                            {this.renderTitle()}
                            <Text  allowFontScaling={false} style={dymStyle}>{content.value}</Text>
                            <View style={{height:2,width:50,backgroundColor:VALUES.COLORMAP.light_gray}}/>
                            {this.renderBottom(type, content.label)}

                </View>
            </View>);
  }
}

DataInfo.propTypes = {   children: React.PropTypes.any,
  onPress : React.PropTypes.any};
DataInfo.defaultProps = {   children:undefined, onPress:undefined};

const smallStyles = StyleSheet.create({

  TitleStyle:{
    paddingTop:2,
    paddingBottom:2,
    paddingRight:5,
    justifyContent:'center',
    backgroundColor: VALUES.COLORMAP.white
  },
  textStyle: {
    alignSelf : 'center',
    color: VALUES.COLORMAP.kpi_title_gray,
    fontSize: 10,
    paddingTop : 5,
    paddingBottom: 5
  },
  subTextStyle: {
    alignSelf : 'center',
    paddingTop : 5,
    paddingBottom: 5
  },
  smallTextStyle: {
    marginRight:1,
    color: VALUES.COLORMAP.kpi_content_gray,
    fontSize: 11,
  },
  bigTextStyle: {
    marginRight:1,
    color: VALUES.COLORMAP.kpi_content_gray,
    fontSize: 13,
  },

  DataStyle:{
    backgroundColor:VALUES.COLORMAP.white,
    flex:1,
    height:60,
    alignItems:'center',
    justifyContent:'center',
    marginLeft:2,
  },
  DataInfoStyle:{
    backgroundColor:VALUES.COLORMAP.white,
    flex:1,
    height:60,
    paddingRight:3,
    paddingLeft:0,
    paddingTop:1,
    paddingBottom:1,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
  },
  imageStyle:{width:30,height:30},
});

const largeStyles = StyleSheet.create({

  TitleStyle:{
    paddingTop:2,
    paddingBottom:2,
    paddingRight:5,
    justifyContent:'center',
    backgroundColor: VALUES.COLORMAP.white
  },
  textStyle: {
    alignSelf : 'center',
    color: VALUES.COLORMAP.kpi_title_gray,
    fontSize: 11,
    paddingTop : 5,
    paddingBottom: 5
  },
  subTextStyle: {
    alignSelf : 'center',
    paddingTop : 5,
    paddingBottom: 5
  },
  smallTextStyle: {
    marginRight:1,
    color: VALUES.COLORMAP.kpi_content_gray,
    fontSize: 14,
  },
  bigTextStyle: {
    marginRight:1,
    color: VALUES.COLORMAP.kpi_content_gray,
    fontSize: 16,
  },

  DataStyle:{
    backgroundColor:VALUES.COLORMAP.white,
    flex:1,
    height:78,
    alignItems:'center',
    justifyContent:'center',
    marginLeft:2,
  },
  DataInfoStyle:{
    backgroundColor:VALUES.COLORMAP.white,
    flex:1,
    height:80,
    paddingRight:5,
    paddingLeft:5,
    paddingTop:2,
    paddingBottom:2,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
  },
  imageStyle:{width:40,height:40},
});
