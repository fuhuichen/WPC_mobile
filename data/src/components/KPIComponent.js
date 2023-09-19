import React, {Component} from 'react';
import VALUES from '../utils/values';
import {connect} from 'react-redux';
import * as actions from '../actions';
import I18n from 'react-native-i18n';
import Card from '../components/Card';
import {PieChart} from 'react-native-svg-charts'
import DataHandler from '../utils/DataHandler'
// import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import {Dimensions, StyleSheet, Text, View} from 'react-native';

class KPIComponent extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    const {loginInfo} = this.props;
    var email = '';
    var password = ''
    if(loginInfo){
       email = 'user@advantech.com.tw';
       password = "12345677";
    }

    const {smallPhone} = this.props;
    var styles
    if(smallPhone){
      styles = smallStyles
    }
    else{
      styles = largeStyles
    }
    console.log("Lan=" + I18n.locale);
    this.state = { styles:styles, email, password,error:false, loading: false};

  }

  componentDidMount() {

  }

  decimalToHex(d, padding) {
      var hex = Number(d).toString(16);
      padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

      while (hex.length < padding) {
          hex = "0" + hex;
      }

      return hex;
  }
  calculateColor(index){
    const {smallPhone,type,data} = this.props;
    var value = 0;
    if(type =="bi_sale_values"){
        if(data.target.sale>0){
          value = parseInt( data.sale*40 /data.target.sale )
        }
    }
    else   if(type =="bi_shopper_count"){
        if(data.target.userCount>0){
          value = parseInt( data.userCount*40/data.target.userCount )
        }

    }
    else   if(type =="bi_sales_count"){
      if(data.target.cupCount>0){
        value = parseInt( data.cupCount*40/data.target.cupCount )
      }
    }
    if(value>40){
      value = 40;
    }
    if(index<20 || index>=40)
    {
      var cindex=index;
      if(index>=40){
        cindex = index -40
      }
      else{
        cindex = index+ 20;
      }

      var r =  72  + parseInt(180*cindex /40);
      var g =  96  - parseInt(20*cindex /40);
      var b =  230  - parseInt(140*cindex /40);
      if(value==0 || cindex > value){
        return '#31385aDD'
      }
      return '#'+ this.decimalToHex(r,2)+ this.decimalToHex(g,2)+ this.decimalToHex(b,2)
    }
    else{return 'transparent'}

    //4856ed
  //  fb4c5d
  }
  renderChart() {

       var data = [ ]
       for(var k=0;k<60 ;k++){
         data.push(10)
       }
       var pieData = data.map(function(value,index){
        var color  =this.calculateColor(index)
      //  console.log(color)
         return {
             value,
             svg: {
                 fill: color,
                 onPress: () => console.log('press', index),
             },
             key: `pie-${index}`,
         }
       }.bind(this))

       const screen = Dimensions.get('window')
       return (
           <PieChart
               innerRadius={'84%'}
               style={ { height:screen.width-60} }
               data={ pieData }
           />
       )
   }
   renderColorBar(){
      const {smallPhone,type} = this.props;
     if(type =="bi_sale_values"){
       return  ( <View style={{marginTop:10,flexDirection:'row'}}>
                   <View style={{backgroundColor:'#fb4c5b',borderRadius:8,height:8,width:8}}/>
                   <View style={{height:8,width:5}}/>
                   <View style={{backgroundColor:'#5f6573',borderRadius:8,height:8,width:8}}/>
                   <View style={{height:8,width:5}}/>
                   <View style={{backgroundColor:'#5f6573',borderRadius:8,height:8,width:8}}/>
                </View>)
     }
     else   if(type =="bi_shopper_count"){
       return  ( <View style={{marginTop:10,flexDirection:'row'}}>
                   <View style={{backgroundColor:'#5f6573',borderRadius:8,height:8,width:8}}/>
                   <View style={{height:8,width:5}}/>
                   <View style={{backgroundColor:'#fb4c5b',borderRadius:8,height:8,width:8}}/>
                   <View style={{height:8,width:5}}/>
                   <View style={{backgroundColor:'#5f6573',borderRadius:8,height:8,width:8}}/>
                </View>)
     }
    else   if(type =="bi_sales_count"){
      return  ( <View style={{marginTop:10,flexDirection:'row'}}>
                  <View style={{backgroundColor:'#5f6573',borderRadius:8,height:8,width:8}}/>
                  <View style={{height:8,width:5}}/>
                  <View style={{backgroundColor:'#5f6573',borderRadius:8,height:8,width:8}}/>
                  <View style={{height:8,width:5}}/>
                  <View style={{backgroundColor:'#fb4c5b',borderRadius:8,height:8,width:8}}/>
               </View>)
     }
   }
   renderContentValue(){
    const {smallPhone,type,data} = this.props;
    var value =0;
    var bottomTitle;
    var bottomValue;
    var bottomUnit;
    if(type =="bi_sale_values"){
      value=0;
      if(data.target.sale>0){
        value = parseInt( data.sale*100/data.target.sale )
      }
      bottomTitle=I18n.t('目前營業額')  + ' ';
      bottomValue=data.sale;
      bottomUnit=  ' ' + I18n.t("bi_chinese_dollor");
    }
    else   if(type =="bi_shopper_count"){
      value=0;
      if(data.target.userCount>0){
        value = parseInt( data.userCount*100/data.target.userCount )
      }
      bottomTitle= I18n.t('目前消費人數')  + ' ';
      bottomValue=data.userCount;
      bottomUnit=  ' ' + I18n.t("bi_unit_person");
    }
    else   if(type =="bi_sales_count"){
      value=0;
      if(data.target.cupCount>0){
        value = parseInt( data.cupCount*100/data.target.cupCount)
      }
      bottomTitle=I18n.t('目前銷售個數')  + ' ';
      bottomValue=data.cupCount;
      bottomUnit= ' ' + I18n.t("bi_unit_item");
    }
     if(value >100) value =100;
     var msg =DataHandler.getCompleteMessage(value);
     const screen = Dimensions.get('window')
     return (
       <View  style={{ position: 'absolute',
        top:  0,
        left: 0,alignItems:'center', justifyContent:'center',
              height:screen.width-60,width:screen.width}}>
              <View  style={{flexDirection:'row',alignItems:'flex-end'}}>
                <Text  allowFontScaling={false}  style={{marginLeft:18,color:VALUES.COLORMAP.dkk_font_white,fontSize:80 }}>
                    {value}
                </Text>
                <Text  allowFontScaling={false}  style={{marginBottom:20,marginLeft:1,color:VALUES.COLORMAP.dkk_font_white,fontSize:14 }}>
                    {'%'}
                </Text>
              </View>
              <Text  allowFontScaling={false}  style={{marginLeft:18,color:VALUES.COLORMAP.dkk_font_white,fontSize:14 }}>
                  {msg}
              </Text>
              <View  style={{flexDirection:'row',alignItems:'flex-end',marginTop:18}}>
              <Text  allowFontScaling={false}  style={{marginBottom:5,color:VALUES.COLORMAP.dkk_font_white,fontSize:12 }}>
                  {bottomTitle}
              </Text>
              <Text  allowFontScaling={false}  style={{color:VALUES.COLORMAP.dkk_font_white,fontSize:24 }}>
                  {bottomValue}
              </Text>
              <Text  allowFontScaling={false}  style={{marginBottom:5,color:VALUES.COLORMAP.dkk_font_white,fontSize:12 }}>
                  {bottomUnit}
              </Text>
              </View>
              { this.renderColorBar()}
           </View>
         );

   }
  render () {
      const {styles} = this.state;
      const {smallPhone,type,data} = this.props;
      var gap
      if(smallPhone){
        gap=60;
      }
      else{
          gap=60;
      }
      const screen = Dimensions.get('window')
      if(data.loading){
       return ( <Card>
            <View style={{height:screen.width+100,width:screen.width}}>
            </View>
            </Card>);
      }
      return (
                <Card>
                    <View style={{height:screen.width+100,width:screen.width}}>
                      {this.renderChart()}
                      {this.renderContentValue()}
                    </View>
                    <View style={{flex:1}}/>

                </Card>);
    }

}


const smallStyles = StyleSheet.create({
  backgroundImage: {
     flex: 1,
     alignSelf: 'stretch',
     width: null,
   },
  container:{
    paddingTop:60,
    paddingRight:30,
    paddingLeft:30,
    paddingBottom:25,
    alignItems:'center',
    justifyContent:'flex-start',
  },
  logoImage: {
    width:0
  },
  inputTitle: {
     paddingTop:2,
     paddingBottom:4,
     marginLeft:10,
     fontSize:14,
     justifyContent:'flex-start',
     alignItems:'center',
     backgroundColor:'transparent',
     color:VALUES.COLORMAP.white},
   forgetPwdText: {
        textDecorationLine:'underline',
        paddingTop:2,
        paddingBottom:4,
        marginLeft:20,
        fontSize:12,
        alignItems:'center',
        color:VALUES.COLORMAP.white},
});

const largeStyles = StyleSheet.create({
  backgroundImage: {
     flex: 1,
     alignSelf: 'stretch',
     width: null,
   },
  container:{
    paddingTop:60,
    paddingRight:30,
    paddingLeft:30,
    paddingBottom:25,
    alignItems:'center',
  },
   logoImage: {
     width:0
   },
   inputTitle: {
      paddingTop:2,
      paddingBottom:4,
      marginLeft:10,
      fontSize:12,
      justifyContent:'flex-start',
      alignItems:'center',
      backgroundColor:'transparent',
      color:VALUES.COLORMAP.white},
   forgetPwdText: {
           textDecorationLine:'underline',
           paddingTop:2,
           paddingBottom:4,
           marginLeft:20,
           fontSize:10,
           alignItems:'center',
           justifyContent:'flex-end',
           color:VALUES.COLORMAP.white},

});


const mapStateToProps = state =>{
  return {lan: I18n.locale,
    smallPhone:state.smallPhone,
    serverAddress:state.serverAddress,
    currentPage: state.currentPage,loginInfo:state.loginInfo};
};
export default connect(mapStateToProps, actions)(KPIComponent);
