import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import VALUES from '../utils/values';
import * as actions from '../actions';
import {connect} from 'react-redux';

class KPI extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    var styles;
    const {smallPhone} = this.props;
    if(smallPhone){
      //  console.log('small kpi')
        styles = smallStyles
    }
    else{
      //console.log('large kpi')
        styles = largeStyles
    }
    this.state = { styles:styles,data:undefined};
  }
  componentWillReceiveProps(nextProps){

  }
  onPressed(){

  }


  render () {
    const {styles} = this.state;
    const {smallPhone} = this.props;
    var img;
    var desc;
    var per ='' ;
    var unit ='台';
    var borderColor = VALUES.COLORMAP.green;
    var imgStyle = {width:0,height:0}
    if(this.props.type==0 ){

      per = this.props.percentage+'%'
      img = require('../../images/red_temp.jpg')
      borderColor = VALUES.COLORMAP.red;
      desc = '溫度異常'
    }
    else   if(this.props.type==1 ){
      per = this.props.percentage+'%'
      img = require('../../images/blue_temp.jpg')
      desc = '溫度正常'
    }
    else  if(this.props.type==2 ){

      img = require('../../images/lightening.jpg')
      desc = '低電量'
    }
    else   if(this.props.type==3 ){
      img = require('../../images/refrig.jpg')
      desc = '冰箱暫停使用'
    }
    else   if(this.props.type==4){
      img = require('../../images/red_temp.jpg')
      desc = '溫度異常'
      unit ='筆';
      borderColor = VALUES.COLORMAP.red;
    }
    else   if(this.props.type==5 ){
      img = require('../../images/lightening.jpg')
      desc = '電量異常'
      unit ='筆';
      borderColor = VALUES.COLORMAP.red;
    }
    else   if(this.props.type==6 ){
      img = require('../../images/lightening.jpg')
      desc = '特殊狀態'
      unit ='台';
    }
    //                    <Text  allowFontScaling={false} style={styles.textStyle} >{per}</Text>

    return   (<View style={[styles.KPIStyle,{width:this.props.width,borderColor}]}>
                  <Image style={imgStyle} source={img}/>
                  <View style={{height:30}} >
                      <Text  allowFontScaling={false} style={[styles.textStyle,{color:borderColor}]} >{desc}</Text>
                  </View>
                  <View style={{flex:1,height:50,width:this.props.width-30,flexDirection:'row',justifyContent:'flex-end',alignItems:'flex-end'}} >
                      <Text  allowFontScaling={false} style={[styles.textStyle,{color:borderColor}]} >{per}</Text>
                      <Text  allowFontScaling={false} style={[styles.BigTextStyle,{color:borderColor}]} >{this.props.count+''}</Text>
                      <Text  allowFontScaling={false} style={[styles.textStyle,{color:borderColor}]} >{unit}</Text>
                  </View>
              </View>);
  }
}

const smallStyles = StyleSheet.create({
  textStyle: {
    color: VALUES.COLORMAP.dark_gray,
    fontSize: 20,
  },
  BigTextStyle: {
    textAlign:'right',
    width:100,
    color: VALUES.COLORMAP.black,
    fontWeight:'600',
    fontSize: 45,
    marginRight:5,
  },

  KPIStyle:{
    borderWidth:1,
    padding:10,
    marginBottom:20,
    height:100,
    alignSelf: 'stretch',
    flexDirection:'column',
    justifyContent:'flex-start',
    alignItems:'flex-start',
    backgroundColor: VALUES.COLORMAP.white,
  },
});


const largeStyles = StyleSheet.create({
  textStyle: {
    color: VALUES.COLORMAP.dark_gray,
    fontSize: 22,
  },
  BigTextStyle: {
    textAlign:'right',
    width:100,
    color: VALUES.COLORMAP.black,
    fontWeight:'600',
    fontSize: 45,
    marginRight:5,
  },

  KPIStyle:{
    borderWidth:1,
    padding:10,
    marginBottom:20,
    height:100,
    alignSelf: 'stretch',
    flexDirection:'column',
    justifyContent:'flex-start',
    alignItems:'flex-start',
    backgroundColor: VALUES.COLORMAP.white,
  },
});


const mapStateToProps = (state, ownProps) =>{
  return {smallPhone:state.smallPhone,token:state.token, compareTime:state.compareTime, storeList:state.selectedStoreList, date:state.date, unit: state.overviewUnit, range:state.overviewRange};
};
export default connect(mapStateToProps , actions)(KPI);
