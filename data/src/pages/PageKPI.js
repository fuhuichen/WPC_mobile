import React, {Component} from 'react';
import VALUES from '../utils/values';
import {connect} from 'react-redux';
import * as actions from '../actions';
import I18n from 'react-native-i18n';
import LoginButton from '../components/LoginButton';
import UshopRestClient from '../utils/webclient'
import KPIComponent from '../components/KPIComponent'
import DataHandler from '../utils/DataHandler'
// import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import {Dimensions, Image, StyleSheet, Text, View} from 'react-native';
import UTitleBar from '../components/UTitleBar'
import PageDetailReport from '../pages/PageDetailReport'
import {Actions} from 'react-native-router-flux';
import * as storeSync from "react-native-simple-store";

import Spinner from '../components/Spinner';
import Toast, {DURATION} from 'react-native-easy-toast';

class PageKPI extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
            loading:false,
            type:"bi_sale_values",
            sale:0,
            userCount:0,
            cupCount:0,
            cupAvg:0,
            priceAvg:0,
            buyRate:0,
            detail:false,
            target:{sale:0,
            userCount:0,
            cupCount:0,
            cupAvg:0,
            priceAvg:0,
            buyRate:0}};
  }
    renderPage(pageData, pageId, layout){
      console.log('render page',pageId)
      return (
        <KPIComponent
          data={this.state}
          type= {pageData}/>
      );
    }
    componentDidMount() {
      const {userInfo,tempReportStore} = this.props;
        this.setState({loading:true})
      DataHandler.getStoreTarget(userInfo.email,tempReportStore.store_id)
      .then((o) => {
        var obj =JSON.parse(o)
        console.log(obj)
        if(obj){
            var sale =obj.sale;
            var userCount=obj.userCount;
            var cupCount=obj.cupCount;
            var cupAvg=obj.cupAvg;
            var priceAvg=obj.priceAvg;
            var buyRate=obj. buyRate;
            this.setState(
              {target:{sale,
                      userCount,
                      cupCount,
                      cupAvg,
                      priceAvg,
                      buyRate}
              }
            )
        }
      });
      this.fetchData();
    }
    fetchData(){
      const api = new UshopRestClient();
      const {token,widgetList,tempReportStore} = this.props;
      var list=[];
      var promises = [];
      list.push(widgetList[2]) //銷售
      list.push(widgetList[3]) //交易筆數
      list.push(widgetList[4]) //交易件數
      list.push(widgetList[8]) //平均件數
      list.push(widgetList[5]) //平均單數
      list.push(widgetList[6]) //鎖售率
      for(var k in  list){
            var widget = list[k];
            var req = DataHandler.createSimpleRequest(token,widget.data_source,
              'dd','dd',new Date(),tempReportStore);
            promises.push(api.widgetData(req));
      }
      this.promiseRequests(promises)
    }

    promiseRequests(promises){
      var handle = function(results){
        if(results[0].status == 1) {
          this.handleResults(results)
        } else {
          this.logout();
        }
      }.bind(this)
      var doFail = function(){
         this.setState({loading:false})
      }.bind(this)
      Promise.all(promises)
       .then(function(data){
         handle(data)})
       .catch(function(err){
          doFail()
       });
     }

    logout() {
      this.refs.toast.show(I18n.t("bi_login_expired"),DURATION.LENGTH_SHORT);
      setTimeout(function() {
        let loginInfo = this.props.store.userSelector.loginInfo;
        //loginInfo.password = '';
        storeSync.save('Login',JSON.stringify(loginInfo));
        Actions.reset('loginScreen');
      }.bind(this),DURATION.LENGTH_SHORT+3);
    }

     handleResults(results){
        const {token,widgetList,tempReportStore} = this.props;
        var list=[];
        list.push(widgetList[2]) //銷售
        list.push(widgetList[3]) //交易筆數
        list.push(widgetList[4]) //交易件數
        list.push(widgetList[8]) //平均件數
        list.push(widgetList[5]) //平均單數
        list.push(widgetList[6]) //鎖售率
        //console.log(list)
        var data =[];
        for(var k in results){
            if(results[k].status !=1){
              this.props.selectPage('PageLogin')
              return;
            }
          //  console.log(results[k], list[k].data_source)
            var d = DataHandler.parseDataResponse(results[k], list[k].data_source);
            data.push(d[0].row[0]);
        //    console.log(d)
        }
        console.log(data)
        this.setState({
          loading:false,
          sale:data[0],
          userCount:data[1],
          cupCount:data[2],
          cupAvg:data[3],
          priceAvg:data[4],
          buyRate:data[5],
        })

     }
    changePage(index){
      if(index == 0){
        this.setState({type:"bi_sale_values"})
      }
      else if(index == 1){
        this.setState({type:"bi_shopper_count"})
      }
      else if(index == 2){
        this.setState({type:"bi_sales_count"})
      }
    }
    render() {
      const {styles,type,detail,target,sale,
              userCount,
              cupCount,
              cupAvg,
              priceAvg,
              buyRate
            } = this.state;
      const {smallPhone} = this.props;
      if(detail){
        return <PageDetailReport
         type={this.state.type}
         backPage={()=>this.setState({detail:false})}/>
      }
      var gap
      console.log('Render Type ',type)
      if(smallPhone){
        gap=60;
      }
      else{
          gap=60;
      }
      const screen = Dimensions.get('window')
      var img;
      var info;
      var bottomTitle;
      var bottomValue;
      var bottomUnit;
      var bottomHint;

      if(type =="bi_sale_values"){
          img  = require('../../images/turnover_pic.png');
          info = I18n.t("bi_target_sale_value")  + ' ￥'+ target.sale;
          bottomTitle =I18n.t("bi_current_shop_rate") ;
          bottomValue =parseInt(buyRate*100);
          bottomUnit='%';
          bottomHint= '('+  I18n.t("bi_shopper_rate_explain")+ ')' ;

      }
      else   if(type =="bi_shopper_count"){
            img  = require('../../images/consumptionr_pic.png');
            info = I18n.t("bi_target_shopper_persons") + ' '+target.userCount  +  I18n.t("bi_unit_person")
            bottomTitle =  I18n.t("bi_average_shop_counts");
            bottomValue = cupAvg;

            bottomUnit= I18n.t("bi_unit_item");
            bottomHint='('+   I18n.t("bi_average_shop_counts_explain")+ ')' ;
      }
      else   if(type =="bi_sales_count"){
            img  = require('../../images/turnover_pic.png');
            info =  I18n.t("bi_target_sale_counts") + ' '+target.cupCount  +  I18n.t("bi_unit_item");
            bottomTitle =I18n.t('平均單價') ;
            bottomValue = priceAvg;
            bottomUnit=I18n.t("bi_chinese_dollor");
            bottomHint='('+  I18n.t("bi_average_price_expaine")+ ')' ;
      }
      if(DataHandler.isFloat(bottomValue )){
        bottomValue = bottomValue.toFixed(1)
      }


      return (
        <View style={{backgroundColor:VALUES.COLORMAP.dkk_background,
          height:screen.height,width:screen.width}}>
          <UTitleBar    smallPhone={smallPhone}
            headerText={this.props.tempReportStore.store_name}
             onLeftPress={()=>this.props.selectPage('PageIndex')}
             onRightPress={()=>this.props.selectPage('PageSetting')}
             leftIconType={'home'}
             rightIconType={'setting'}>
           </UTitleBar>
           <View
              style={{paddingTop:15,paddingBottom:15,borderTopWidth:0.5
                ,borderTopColor:'#333333',
                width:screen.width,flexDirection:'row',alignItems:'center'}}>
               <Image style={{marginLeft:22,width:24,height:24}} source={img}/>
               <Text  allowFontScaling={false} style={{marginLeft:18,color:VALUES.COLORMAP.dkk_font_white,fontSize:18 }}>
                 {I18n.t(type)}
               </Text>
               <View style={{flex:1}}/>
               <View
                  style={{backgroundColor:'#585ff5'  ,flexDirection:'row',alignItems:'center',
                  paddingLeft:10,paddingRight:10,paddingTop:5,paddingBottom:5,borderRadius:4,marginRight:3}}>
                 <Text  allowFontScaling={false} style={{color:VALUES.COLORMAP.dkk_font_white,fontSize:12 }}>
                   {I18n.t(info)}
                 </Text>
               </View>
            </View>
            <View style={{marginBottom:40,marginLeft:15}}>
            <Text  allowFontScaling={false} style={{color:VALUES.COLORMAP.dkk_font_white,fontSize:16 }}>
              {I18n.t(bottomTitle)}
            </Text>
            <View
               style={{flexDirection:'row',alignItems:'flex-end'}}>
              <Text  allowFontScaling={false} style={{color:VALUES.COLORMAP.dkk_font_white,fontSize:46 }}>
                {I18n.t(bottomValue)}
              </Text>
              <Text  allowFontScaling={false} style={{color:VALUES.COLORMAP.dkk_font_white,fontSize:12,marginBottom:10 }}>
                {I18n.t(bottomUnit)}
              </Text>

            </View>
            <Text  allowFontScaling={false} style={{color:'#9da0b0',fontSize:12 }}>
              {I18n.t(bottomHint)}
            </Text>
            </View>
            <View style={{marginBottom:25,width:screen.width,backgroundColor:'transparent'}}>
                <LoginButton smallPhone={smallPhone}
                  color={VALUES.COLORMAP.white}
                  loginStyle={false}
                  noborder={false} backgroundColor={VALUES.COLORMAP.dkk_red}
                  onPress={()=>this.setState({detail:true})}>{I18n.t('bi_extend_report')}</LoginButton>
           </View>
           <Spinner visible={this.state.loading} />
           <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
        </View>
      );
    }

}


const smallStyles = StyleSheet.create({
  backgroundImage: {
     flex: 1,
     alignSelf: 'stretch',
     width: null,
   },
  container:{
    paddingTop:44,
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
    paddingTop:44,
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
    storeList:state.storeList,
    accountList:state.accountList,
    loginUserId:state.loginUserId,
    userId:state.userId,
    token:state.token,
    userInfo:state.userInfo,
    lastPage:state.lastPage,
    tempReportStore:state.tempReportStore,
    smallPhone:state.smallPhone,
    serverAddress:state.serverAddress,
    widgetList:state.widgetList,
    currentPage: state.currentPage,
    loginInfo:state.loginInfo};
};
export default connect(mapStateToProps, actions)(PageKPI);
