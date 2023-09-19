import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
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
      const {type,range } = this.props;
      var prefix = '區間'
      if( range == 'ww'){
        prefix = '周'
      }
      else if( range == 'mm'){
        prefix = '月'
      }
      else if( range == 'yyyy'){
        prefix = '年'
      }
      var title = '';

      if(type == 'avg'){
        if( I18n.locale=='en'){
          title='Average'
        }
        else{
          title = prefix + "bi_avg"
        }

      }
      else if(type == 'sum'){
        if( I18n.locale=='en'){
          title='Summary'
        }
          else{
            title = prefix + '加總'
          }

      }
      else if(type == 'max'){
          title = '最高時段'
      }
      else if(type == 'min'){
          title = '最低時段'
      }
      if(this.props.title){
        var font
        if( I18n.locale=='en'){
          font = {fontSize:8};
        }
        return   <Text  allowFontScaling={false} style={[styles.textStyle,font]}>{I18n.t(this.props.title)}</Text>;
      }
      return   <Text  allowFontScaling={false} style={styles.textStyle}>{I18n.t(title)}</Text>;
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
           if(I18n.locale=='en')
           {
              value = 'Week ' + value;
           }
           else{
             value = '第' +value+ '周'
           }

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
      if(type == 'sum'){
              item.value = d[0].sum;
              if( d[1].sum > 0 ){
                 item.label = 100* (d[0].sum - d[1].sum )/ d[1].sum
                 item.label = item.label.toFixed(1)
              }
      }
      if(type == 'avg'){
              item.value = d[0].avg ;
              if( d[1].avg > 0 ){
                 item.label = (d[0].avg - d[1].avg )/ d[1].avg
                 item.label = item.label.toFixed(1)
              }
      }
      else if(type == 'max'){
              item.value = d[0].max;
              if( this.props.display == "bi_proportions"){
                if(item.value !=null && d[0].sum!=0){
                  item.value = (item.value*100)/d[0].sum;
                  item.value = item.value.toFixed(1)
                }
                item.value = item.value  + "%"
              }
              for(var k in d[0].row){
                if( d[0].max == d[0].row[k]){
                  item.label = d[0].label[k]
                  item.label = this.convertPeriod(item.label, date, range, unit)
                  break;
                }
              }
      }
      else if(type == 'min'){
              item.value = d[0].min;
              if( this.props.display == "bi_proportions"){
                if(item.value !=null && d[0].sum!=0){
                  item.value = (item.value*100)/d[0].sum;
                  item.value = item.value.toFixed(1)
                }
                item.value = item.value  + "%"
              }
              for(var k in d[0].row){
                if( d[0].min == d[0].row[k]){
                  item.label = d[0].label[k]
                  item.label = this.convertPeriod(item.label, date, range, unit)
                  break;
                }
              }
      }
       if( ! ( (type == 'max' || type == 'min') && this.props.display == "bi_proportions")){
          item.value = DataHandler.fixDataValue(item.value ,widget);
       }

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
    if(type == 'max' || type == 'min'){
          var font = { fontSize:10}
          if( value.length > 8){
             font = { fontSize:8}
          }
         return (<Text  allowFontScaling={false} style={[styles.textStyle,font]}>{value}</Text>)
    }
    else{
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
         var font = { fontSize:10}
         return (<View style={{flexDirection:'row',alignItems:'center'}}>
          <Text  allowFontScaling={false} style={[styles.subTextStyle,subColor,font ]}>{value}</Text>
          <Image style={{marginLeft:3,width:10,height:10}} resizeMode={'contain'}  source={image} />
          </View>)
    }

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
    var image;
    var subColor  = { color: VALUES.COLORMAP.white};
    image = require('../../resources/img/time.png');
    if(type == 'avg' || type == 'sum'){

        image = require('../../resources/img/data_sum.png');
    }
    else if(type == 'max'){
          image = require('../../resources/img/top_num_icon.png');
          subColor  = { color: VALUES.COLORMAP.middle_gray};
    }
    else if(type == 'min'){
          image = require('../../resources/img/buttom_num_icon.png');
          subColor  = { color: VALUES.COLORMAP.middle_gray};
    }

    if( this.props.title){
       if(this.props.title=='人均產值'){
          image = require('../../resources/img/conversion_icon.png');
       }
       else if(this.props.title=='最高客流時段'){
          image =  require('../../resources/img/traffic_icon.png');
       }
       else if(this.props.title=='最高銷售時段'){
          image =  require('../../resources/img/sales_amout.png');
       }
    }

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
               <Image style={styles.imageStyle} resizeMode={'contain'}  source={image} />
               <View  style={styles.DataStyle}>
                          <View style={styles.TitleStyle}>
                            {this.renderTitle()}
                          </View>
                          <View style={{flex:1}}>
                              <View style={{flex:1,alignItems:'center',justifyContent:'flex-end',flexDirection:'row'}}>
                                <Text  allowFontScaling={false} style={dymStyle}>{content.value}</Text>
                              </View>
                          </View>
                          <View style={styles.TitleStyle}>
                             {this.renderBottom(type, content.label)}
                          </View>
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
    justifyContent:'flex-end',
    backgroundColor: VALUES.COLORMAP.white
  },
  textStyle: {
    alignSelf : 'flex-end',
    color: VALUES.COLORMAP.kpi_title_gray,
    fontSize: 9,
    paddingTop : 5,
    paddingBottom: 5
  },
  subTextStyle: {
    alignSelf : 'flex-end',
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
    alignItems:'flex-end',
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
    borderWidth:1,
    borderColor:VALUES.COLORMAP.light_gray,
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
    justifyContent:'flex-end',
    backgroundColor: VALUES.COLORMAP.white
  },
  textStyle: {
    alignSelf : 'flex-end',
    color: VALUES.COLORMAP.kpi_title_gray,
    fontSize: 10,
    paddingTop : 5,
    paddingBottom: 5
  },
  subTextStyle: {
    alignSelf : 'flex-end',
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
    alignItems:'flex-end',
    justifyContent:'center',
    marginLeft:2,
  },
  DataInfoStyle:{
    backgroundColor:VALUES.COLORMAP.white,
    flex:1,
    height:80,
    paddingRight:3,
    paddingLeft:0,
    paddingTop:2,
    paddingBottom:2,
    borderWidth:1,
    borderColor:VALUES.COLORMAP.light_gray,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
  },
  imageStyle:{width:40,height:40},
});
