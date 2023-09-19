import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import UshopRestClient from '../utils/webclient'
import DataHandler from '../utils/DataHandler'
import UpperButton from '../components/UpperButton'
import ImageButton from '../components/ImageButton';
import DropDownSelect from '../components/DropDownSelect';
import moment from 'moment'
import {Platform,Dimensions, Image, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import LineChart from '../components/chart-kit/LineChart';

import Spinner from '../components/Spinner';
import PosRestClient from '../utils/posclient'
import {Actions} from "react-native-router-flux";
import * as storeSync from "react-native-simple-store";
import {inject, observer} from 'mobx-react'
import DatePicker from "../../../app/thirds/datepicker/DatePicker";
import Toast, {DURATION} from 'react-native-easy-toast';

type Props = {
    onLoading: boolean
}
@inject('store')
@observer
export default class CustomShoprate extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    var d = new Date();
    var widgetList= this.getWidgets(0,'dd');
    var date = moment(d).format('YYYY/MM/DD');
    this.state = {
      types:[
        I18n.t("bi_data_analytics"),
        I18n.t("bi_compared_analytics")
      ],
      widgetList,
      viewNumber:true,
      typeIndex:0,
      range:'dd',
      unit:'hh',
      date,
      nowDate: date,
      lastDate: true,
      loading: false,
      loading_err: false,
      loading_nodata: false,
      visible1: true,
      visible2: true,
      visible3: true,
      weather: {
        condition: -1,
        temp: 999
      },
      weatherConditions: []
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  getWidgets(typeIndex,range){
    const widgetList = this.props.store.widgetSelector.list;
    var list=[];
    list.push(widgetList[10])
    if((typeIndex == 0 && range != 'yyyy') || (typeIndex == 1 && range == 'dd')) {
      list.push(widgetList[16]); //天氣
    }
    return list;
  }

  fetchData(){
    const api = new UshopRestClient();
    const {date,range,unit,widgetList,typeIndex} = this.state;
    const token = this.props.store.userSelector.token;
    const accountId = this.props.store.userSelector.accountId;
    const tempReportStore = this.props.store.storeSelector.tempReportStoreBI;

    var promises = [];
    this.props.onLoading(true);
    this.setState({loading:true,loading_err:false,loading_nodata:false,data:null,visible1:true,visible2:true,visible3:true});
    const posapi = new PosRestClient();
    if(typeIndex == 0) {
      promises.push(posapi.getItemData(accountId,
        token,[tempReportStore.register_key]
      ,DataHandler.ceateDatePeriod(date,range),unit))
    } else {
      var d = new Date();
      if(date){
        d = moment(date, 'YYYY/MM/DD').toDate();
      }
      if(range == 'dd' || range == 'ww'){
        d.setDate(d.getDate() -49);
        for(var n= 0;n<8;n++){
            var tdate  = moment(d).format('YYYY/MM/DD');
            promises.push(posapi.getItemData(accountId,
              token,[tempReportStore.register_key]
            ,DataHandler.ceateDatePeriod(tdate,range),range))
            d.setDate(d.getDate() +7);
        }
      } else if(range == 'mm' || range == 'yyyy') {
        d.setYear(1900+d.getYear() -2);
        var tdate  = moment(d).format('YYYY/MM/DD');
      }
    }
    for(var k in widgetList){
      var widget = widgetList[k];
      let tmpUnit = unit;
      if(range == "yyyy") {tmpUnit = "mm";}
      if(widget.title == '天氣') { tmpUnit = "dd"; }
      var req = DataHandler.createSimpleRequest(token,widget.data_source,
        range, tmpUnit, new Date(date),tempReportStore,typeIndex==0?false:true );
      promises.push(api.widgetData(req));
    }
    this.promiseRequests(promises)
  }

  promiseRequests(promises){
    console.log("CustomReturn promiseRequests");
    const {typeIndex} = this.state;
    var handle = function(results) {
      var index = results.length - 1;
      if(results[index].status == 1) {
        if(typeIndex == 0) {
          this.handlePosResult1(results)
        } else {
          this.handlePosResult2(results)
        }
      } else {
        this.logout();
      }
    }.bind(this)
    var doFail = function(){
      this.props.onLoading(false);
       this.setState({loading:false,loading_err:true})
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

  handlePosResult1(results){
    const {date,range,unit,widgetList,mode} = this.state;
    var data={
      labels: [],
      labels2: [],
      datasets: []
    };
    var posResultList = [];
    if(results[0] && results[0].datas && results[0].datas[0] && results[0].datas[0].retrived) {
      posResultList = results[0].datas[0].retrived;
    }
    var output = DataHandler.parsePosData(posResultList,date,range,unit);
    data.labels = output.labels;
    data.labels2 = output.labels2;
    var d = DataHandler.parseDataResponse(results[1], widgetList[0].data_source);
    for(var x in d) {
      for(var y in d[x].row) {
        if(d[x].row[y]>0) {
          d[x].row[y] =100 * d[x].row[y];
          d[x].row[y] =parseFloat(d[x].row[y].toFixed(1));
          if( d[x].row[y]>100) d[x].row[y]=100;
        }
      }
    }
    data.datasets.push({data:d[0].row,max:100})
    data.barDataset = output.transaction_count;
    if( range == 'dd'){
      data = DataHandler.fixNegtiveData(data);
    }
    if(results[2]) {
      this.getWeatherInfo(results[2]);
    }
    var checkNoData = true;
    for(var i=0 ; i<data.datasets.length ; ++i) {
      for(var j=0 ; j<data.datasets[i].data.length ; ++j) {
        if(data.datasets[i].data[j] >= 0) {
          checkNoData = false;
          break;
        }
      }
    }
    if(checkNoData && data.barDataset) {
      for(var i=0 ; i<data.barDataset.length ; ++i) {
        if(data.barDataset[i] >= 0) {
          checkNoData = false;
          break;
        }
      }
    }
    this.props.onLoading(false);
    this.setState({
      loading:false,
      loading_nodata:checkNoData,
      data,
    })
  }

  handlePosResult2(results){
    const {date,range,unit,widgetList,mode} = this.state;
    var data={
      labels: [],
      labels2: [],
      datasets: []
    };
    var weeklist = DataHandler.getSimpleWeekList();
    var d =  new Date(date);
    var list1 = [];
    var list2 = [];
    var list3 = [];
    if(range == 'dd'){
      var indoorData = DataHandler.parseDataResponse(results[results.length-2], widgetList[0].data_source);
      for(var x in indoorData){
        for(var y in indoorData[x].row){
          if(indoorData[x].row[y]>0){
            indoorData[x].row[y] =100* indoorData[x].row[y];
            indoorData[x].row[y] =parseFloat(indoorData[x].row[y].toFixed(1)) ;
            if(indoorData[x].row[y]>100) indoorData[x].row[y]=100;
          }
        }
      }
      d.setDate(d.getDate() -49);
      for(var n=0 ; n<8 ; n++){
        var tdate = moment(d).format('MM/DD');
        var wd = (d.getDay()+6)%7;
        data.labels.push(tdate);
        data.labels2.push(weeklist[wd]);
        d.setDate(d.getDate() +7);
        var posResultList = [];
        if(results[n] && results[n].datas && results[n].datas[0] && results[n].datas[0].retrived){
          posResultList  = results[n].datas[0].retrived
        }
        var output = DataHandler.parsePosData(posResultList,date,range,range);
        list1.push(indoorData[n].row[0]);
        list2.push(output.transaction_count[0]);
      }
      data.datasets.push({data:list1,max:100});
      data.barDataset=list2;
      if(results[results.length-1]) {
        this.getWeatherInfo(results[results.length-1]);
      }
    } else if(range == 'ww') {
      var indoorData = DataHandler.parseDataResponse(results[results.length-1], widgetList[0].data_source);
      for(var x in indoorData) {
        for(var y in indoorData[x].row) {
          if(indoorData[x].row[y]>0) {
            indoorData[x].row[y] =100* indoorData[x].row[y];
            indoorData[x].row[y] =parseFloat(indoorData[x].row[y].toFixed(1));
            if(indoorData[x].row[y]>100)indoorData[x].row[y]=100;
          }
        }
      }
      d.setDate(d.getDate() -49);
      for(var n= 0;n<8;n++){
        var wd =( d.getDay()+6)%7
        d.setDate(d.getDate() -wd);
        var sdate  = moment(d).format('MM/DD');
        d.setDate(d.getDate() +6);
        var edate  = moment(d).format('MM/DD');
        data.labels.push(sdate+' -');
        data.labels2.push(edate+' ');
        d.setDate(d.getDate() +1);
        var posResultList = [];
        if(results[n] && results[n].datas && results[n].datas[0] && results[n].datas[0].retrived){
          posResultList  = results[n].datas[0].retrived
        }
        var output = DataHandler.parsePosData(posResultList,date,range,range);
        list1.push(indoorData[n].row[0]);
        list2.push(output.transaction_count[0]);
      }
      data.datasets.push({data:list1,max:100});
      data.barDataset=list2;
    } else if(range == 'mm' || range == 'yyyy') {
      for(var n in results[0].label) {
        var item = results[0].label[n];
        var subitem = '';
        var rr  = item.split("/");
        item = rr[rr.length-1]
        data.labels.push(item);
        data.labels2.push(subitem);
      }
      var indoorData = DataHandler.parseDataResponse(results[0], widgetList[0].data_source);
        for(var x in indoorData) {
        for(var y in indoorData[x].row) {
          if(indoorData[x].row[y]>0){
            indoorData[x].row[y] =100* indoorData[x].row[y];
            indoorData[x].row[y] =parseFloat(indoorData[x].row[y].toFixed(1)) ;
            if(indoorData[x].row[y]>100) indoorData[x].row[y]=100;
          }
        }
        data.datasets.push({data:indoorData[x].row,max:100});
      }
    }
    var checkNoData = true;
    for(var i=0 ; i<data.datasets.length ; ++i) {
      for(var j=0 ; j<data.datasets[i].data.length ; ++j) {
        if(data.datasets[i].data[j] >= 0) {
          checkNoData = false;
          break;
        }
      }
    }
    if(checkNoData && data.barDataset) {
      for(var i=0 ; i<data.barDataset.length ; ++i) {
        if(data.barDataset[i] >= 0) {
          checkNoData = false;
          break;
        }
      }
    }
    this.props.onLoading(false);
    this.setState({ loading:false, loading_nodata:checkNoData, data })
  }

  getWeatherInfo(result) {
    const {range,typeIndex} = this.state;
    if(typeIndex == 0) {
      if(range == "dd") {
        var weather = this.state.weather;
        weather.condition = result.retrived[0].data[0].conditions.row[0] || 0;
        if(result.retrived[0].data[0].high_temp_c.row[0] && result.retrived[0].data[0].low_temp_c.row[0]) {
          weather.temp = parseInt((result.retrived[0].data[0].high_temp_c.row[0] + result.retrived[0].data[0].low_temp_c.row[0]) / 2) + '°C';
        }
        this.setState(weather);
      } else if(range == "ww" || range == "mm") {
        var weatherConditions = result.retrived[0].data[0].conditions.row || [];
        this.setState({weatherConditions});
      }
    } else if (typeIndex == 1) {
      if(range == "dd") {
        var weatherConditions = [];
        for(var i in result.retrived[0].data) {
          weatherConditions.push(result.retrived[0].data[i].conditions.row[0]);
        }
        this.setState({weatherConditions});
      }
    }
  }

  changeType(index){
    this.setState({typeIndex:index});
    this.state.typeIndex=index;
    this.fetchData();
  }

  renderTypes(){
    const {types,typeIndex,range} = this.state;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    const {clear_gray,light_gray, bright_blue,white,black,green} = VALUES.COLORMAP;
    const screen = Dimensions.get('window')
    var nodes  = types.map(function callback(c,index){
        return   <UpperButton id={index}   smallPhone={smallPhone}
                   selected={typeIndex}
                 onPress={()=>{  this.setState({typeIndex:index});
                 this.state.typeIndex=index;

                 if(index ==1 && range=='mm' ){
                   this.state.range = 'dd';
                   this.state.unit = 'dd';
                 }
                 this.state.widgetList = this.getWidgets(index,this.state.mode);
                 this.fetchData();}}>{c}</UpperButton>
    }.bind(this));
    //console.log('Render Types');
   return <View style={{marginBottom:5,flexDirection:'row',width: screen.width ,justifyContent:'flex-start',height:50}}>
        {nodes}
   </View>
 }
  /*renderTypes(){
    const {types,typeIndex,range} = this.state;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    const {clear_gray,light_gray, bright_blue,white,black,green} = VALUES.COLORMAP;
    const screen = Dimensions.get('window')
    var nodes  = types.map(function callback(c,index){
      return   <UpperButton id={index}   smallPhone={smallPhone}
                    selected={typeIndex}
                  onPress={()=>{  this.setState({typeIndex:index});
                  this.state.typeIndex=index;
                  if(index ==1 && range=='mm' ){
                    this.state.range = 'dd';
                    this.state.unit = 'dd';
                  }
                  this.state.widgetList =  this.getWidgets(index,this.state.range);
                  this.fetchData();}}>{c}</UpperButton>
    }.bind(this));
    console.log('Render Types');
    return  <View style={{marginBottom:5,flexDirection:'row',width: screen.width ,justifyContent:'flex-start',height:50}}>
              {nodes}
            </View>
  }*/

  previousDate(){
    const {date,range} =this.state;
    var d = new Date();
    if(date) {
      d = new Date(date);
    }
    if(range=='dd') {
      d.setDate(d.getDate() - 1);
    } else if(range=='ww') {
      d.setDate(d.getDate() - 7);
    } else if(range=='mm') {
      d.setMonth(d.getMonth() - 1);
    } else if(range=='yyyy') {
      d.setYear(1900+d.getYear() - 1);
    }
    this.setState({date:moment(d).format('YYYY/MM/DD'), lastDate: false}, function() {
      this.fetchData();
    });
  }

  nextDate(){
    const {date,range,lastDate} =this.state;
    if(lastDate) {
      return;
    }
    var d = new Date();
    if(date){
       d = new Date(date);
    }
    if(range=='dd') {
       d.setDate(d.getDate() + 1);
    } else if(range=='ww') {
       d.setDate(d.getDate() + 7);
    } else if(range=='mm') {
       d.setMonth(d.getMonth() + 1);
    } else if(range=='yyyy') {
       d.setYear(1900+d.getYear() + 1);
    }
    if(d > new Date(this.state.nowDate)) {
      d = new Date(this.state.nowDate);
    }
    this.setState({date:moment(d).format('YYYY/MM/DD'), lastDate: (new Date(this.state.nowDate) <= d)}, function() {
      this.fetchData();
    });
  }

  getBestTime(i){
    const {styles,data,typeIndex,date,range} = this.state;
    var maxIndex =-1;
    var minIndex =-1;
    var max=-1,min=-1;
    var sum =0;
    var count =0;
    var avg=0;
    var output ={best:'N/A',worst:'N/A',comment:'',max:'',min:'',maxPer:'',minPer:''}
    if(typeIndex==1 && (range=='mm' || range=='yyyy')){
      return this.getMonthAvgComment();
    }
    if(data && data.datasets.length>0 ){
      var datas ;
      if(typeIndex==0){
        if(data.datasets[i]) {
          datas = data.datasets[i].data
        } else if (i==1) {
          datas = data.barDataset;
        } else {
          datas = data.barDataset2;
        }
      } else {
        datas = data.datasets[0].data
      }
      for(var k in datas){
      var value = parseInt(datas[k]);
        if(value>=0){
          count = count +1;
          sum = sum +value;
          if(maxIndex==-1 || value>max){
            max = value;
            console.log('Max is ',max)
            maxIndex = parseInt(k);;
            console.log('Change Best to ',k)
          }
          if(minIndex==-1 || value<min){
            min = value;
            minIndex = parseInt(k);;
          }
        }
      }
      if(count>0){
        avg = sum/count;
      }
      if( max >0){
        output.best = maxIndex;
        output.worst = minIndex;
        if(this.state.typeIndex==0){
          if(range == 'dd'){
            output.best =  DataHandler.getHourRange(data.labels[maxIndex]);
            output.worst = DataHandler.getHourRange(data.labels[minIndex]);
          }
          if(range == 'ww'){
            var wlist =DataHandler.getFullWeekList();
            output.best =  wlist[maxIndex]
            output.worst = wlist[minIndex]
          } else if(range == 'mm'){
            var m = moment(this.state.date).format('MM/')
            output.best =  m+ data.labels[maxIndex]
            output.worst = m+data.labels[minIndex]
          } else if(range == 'yyyy'){
            if(I18n.locale=='en'){
              output.best =  (data.labels[maxIndex])
              output.worst = (data.labels[minIndex])
            } else {
              output.best =  (parseInt(maxIndex)+1)+I18n.t('月');
              output.worst = (parseInt(minIndex)+1)+I18n.t('月');
            }
          }
        } else {
          if(I18n.locale=='en'){
            if(range == 'dd'){
              output.best = data.labels[maxIndex]+' '+data.labels2[maxIndex]+''
              output.worst = data.labels[minIndex]+' '+data.labels2[minIndex]+''
            } else {
              output.best = data.labels[maxIndex]+data.labels2[maxIndex]
              output.worst = data.labels[minIndex]+data.labels2[minIndex]
            }
          } else {
            output.best = data.labels[maxIndex]+data.labels2[maxIndex]
            output.worst = data.labels[minIndex]+data.labels2[minIndex]
          }
        }
        output.max = max
        output.maxPer = parseInt(((max-avg)*100)/avg) ;
        output.min = min;
        output.minPer = parseInt(((avg-min)*100)/avg) ;
      }
    }
    return output;
  }

  getMonthAvgComment(){
    console.log('getMonthAvgComment')
    const {styles,data,typeIndex,date,range} = this.state;
    const {type } =this.props;
    var maxIndex =-1;
    var minIndex =-1;
    var max=-1,min=-1;

    var output ={best:'N/A',worst:'N/A',comment:'',max:'',min:'',maxPer:'',minPer:''}
    var years =[];
    var d = new Date(date)
    var total = 0;
    var totalCount= 0;
    var textM = moment(d).format('MM月')
    d.setYear(1900+d.getYear() -2);
    for(var k=0;k<3;k++) {
      years.push(DataHandler.getYearTitle(d))
      d.setYear(1900+d.getYear() +1);
    }
    if(data && data.datasets.length>0 ){
      for(var k in data.datasets){
        var sum = -1;
        var count =0;
        for(var n in data.datasets[k].data){
          if(data.datasets[k].data[n]>=0){
            sum =  sum +data.datasets[k].data[n];
            count=count +1;
          }
        }
        if(count>0){
          sum =  parseInt(sum/count);
        }
        console.log("AVG is ",sum)
        if(sum>=0) {
          if(minIndex<0 || sum<min){
            minIndex =parseInt(k);;
            min = sum;
          }
          if( maxIndex<0 || sum>max){
            maxIndex =parseInt(k);;
            max = sum;
          }
        }
        if(sum>0) {
          total = total + sum;
          totalCount=totalCount +1;
        }
      }
      if(totalCount>0){
        var avg =total/totalCount;
        output.best = years[maxIndex];
        output.worst = years[minIndex];
        output.min =min;
        output.max = max;
        output.maxPer=parseInt(((max-avg)*100)/avg) ;
        output.minPer= parseInt(((avg-min)*100)/avg);
      }
    }
    return output;
  }

  renderComment() {
    const {typeIndex,data,range,date}=this.state;
    const screen = Dimensions.get('window')
    if(typeIndex==0) {
      return(
        <View>
          <View style={{flexDirection:'row',
            alignItems:'center',
            width:screen.width,
            height:50,
            borderTopWidth:0.3,
            borderTopColor:'#ffffff44'}}>
            <Image style={{width:19,height:25,marginLeft:10}} resizeMode={'contain'} source={require('../../images/passengerflow_Visitor_pic.png')} />
            <Text allowFontScaling={false} style={{marginLeft:10,fontSize:14,color:VALUES.COLORMAP.white}}>{I18n.t("bi_most_returncustom_time")}</Text>
            <View style={{flex:1}}/>
            <Text allowFontScaling={false} style={{fontSize:14,color:VALUES.COLORMAP.white,marginRight:15}}>{this.getBestTime(0).best}</Text>
          </View>
          <View style={{flexDirection:'row',
            width:screen.width,
            alignItems:'center',
            height:50,
            borderTopWidth:0.3,
            borderTopColor:'#ffffff44'}}>
            <Image style={{width:25,height:25,marginLeft:10}} resizeMode={'contain'} source={require('../../images/icon_fire_yellow.png')} />
            <Text allowFontScaling={false}  style={{marginLeft:10,fontSize:14,color:VALUES.COLORMAP.white}}>
              {I18n.t("bi_most_buy_time")}
            </Text>
            <View style={{flex:1}}/>
            <Text allowFontScaling={false}  style={{fontSize:14,color:VALUES.COLORMAP.white,marginRight:15}}>{this.getBestTime(1).best}</Text>
          </View>
        </View>)
    } else {
      var comment =this.getBestTime(0);
      if(I18n.locale=='en'){

        if(this.state.range=='dd' ){
            t1 ='Highest Daily Returning Customer Rate'
            t3 ='Lowest Daily Returning Customer Rate'
        }
        else if(this.state.range=='ww' ){
            t1 ='Highest Weekly Returning Customer Rate'
            t3 ='Lowest  Weekly Returning Customer Rate'
        }
        else if(this.state.range=='mm' ){
            t1 ='Highest Monthly Returning Customer Rate'
            t3 ='Lowest Monthly Returning Customer Rate'
        }
        else if(this.state.range=='yyyy'){
            t1 ='Highest Yearly Returning Customer Rate'
            t3 ='Lowest Yearly Returning Customer Rate'
        }
    }
    else{
        var t1 = I18n.t("bi_teturncustom_rate") + I18n.t("bi_do_best") + DataHandler.unitToString(this.state.range)
        var t3 = I18n.t("bi_teturncustom_rate") + I18n.t("bi_do_worst") + DataHandler.unitToString(this.state.range)
        if(this.state.range=='mm' || this.state.range=='yyyy') {
          t1 =I18n.t("bi_teturncustom_rate") +I18n.t("bi_do_best")  + DataHandler.unitToString('yyyy')
          t3 = I18n.t("bi_teturncustom_rate") +I18n.t("bi_do_worst") + DataHandler.unitToString('yyyy')
        }
    }
    var t5,t6;
    if(I18n.locale=='en'){
        t5 =comment.maxPer +'% '+ I18n.t("bi_beyond_avg") ;
        t6 =comment.minPer +'% '+I18n.t("bi_below_avg") ;
    }
    else{
        t5 =I18n.t("bi_beyond_avg")+ comment.maxPer +'%';
        t6 =I18n.t("bi_below_avg")+ comment.minPer +'%'
    }

    return(
      <View>
        <View style={{flexDirection:'row',
              alignItems:'center',
              width:screen.width,
              borderTopWidth:0.3,
              borderTopColor:'#ffffff44',
              paddingTop:16,
              height:40}}>
          <Text  allowFontScaling={false}  style={{marginLeft:10,fontSize:14,color:VALUES.COLORMAP.white}}>{t1}</Text>
          <View style={{flex:1}}/>
          <Text  allowFontScaling={false}  style={{fontSize:16,color:VALUES.COLORMAP.white,marginRight:15}}>{comment.max+'%'}</Text>
        </View>
        <View style={{flexDirection:'row',
              alignItems:'center',
              width:screen.width,
              paddingBottom:16,
              height:40,}}>
          <Text  allowFontScaling={false}  style={{marginLeft:10,fontSize:14,color:VALUES.COLORMAP.white}}>{comment.best}</Text>
          <View style={{flex:1}}/>
          <Text  allowFontScaling={false}  style={{fontSize:10,color:VALUES.COLORMAP.dkk_red,marginRight:15}}>{t5}</Text>
        </View>
        <View style={{flexDirection:'row',
              alignItems:'center',
              width:screen.width,
              borderTopWidth:0.3,
              borderTopColor:'#ffffff44',
              paddingTop:16,
              height:40}}>
          <Text  allowFontScaling={false}  style={{marginLeft:10,fontSize:14,color:VALUES.COLORMAP.white}}>{t3}</Text>
          <View style={{flex:1}}/>
          <Text  allowFontScaling={false}  style={{fontSize:16,color:VALUES.COLORMAP.white,marginRight:15}}>{comment.min+'%'}</Text>
        </View>
        <View style={{flexDirection:'row',
              alignItems:'center',
              width:screen.width,
              paddingBottom:16,
              height:40,}}>
          <Text  allowFontScaling={false}  style={{marginLeft:10,fontSize:14,color:VALUES.COLORMAP.white}}>{comment.worst}</Text>
          <View style={{flex:1}}/>
          <Text  allowFontScaling={false}  style={{fontSize:10,color:VALUES.COLORMAP.dkk_blue,marginRight:15}}>{t6}</Text>
        </View>
      </View>)
    }
  }

  renderChart(){
    const {typeIndex,data,range,date,viewNumber,visible1,visible2,visible3,weather,weatherConditions}=this.state;
    const screen = Dimensions.get('window')
    var width = screen.width;
    var height = (screen.width * 9 )/16 + 30;
    if(!data  ){
      return <View style={{marginBottom:10,width,height}}/>
    }
    const {type} = this.props;
    var compareType ;
    var leftUnit='  %';

    //console.log(data)
    var showLine = true;
    var renderEndlabel = true;
    var uniqueUnit = false;
    if(typeIndex==1 && (range=='mm' || range=='yyyy')){
       uniqueUnit  = true;
       renderEndlabel  = false;
    }

    var colorbar ;
    if(typeIndex==1 && (range=='mm' || range=='yyyy')){
      var d = new Date(date)
      d.setYear(1900+d.getYear() -2);
      var tdate1  = DataHandler.getYearTitle(d);
      d.setYear(1900+d.getYear() +1);
      var tdate2  = DataHandler.getYearTitle(d);
      d.setYear(1900+d.getYear() +1);
      var tdate3  = DataHandler.getYearTitle(d);
      colorbar=  (<View style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
          <TouchableOpacity onPress={()=>this.setState({visible1: !visible1})} style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
            <View style={{marginLeft:5,width:12,height:12,backgroundColor:'#f31d65'}}/>
            <Text  allowFontScaling={false} style={{marginLeft:10,color:'#ffffff99',fontSize:12,opacity: (visible1 ? 1 : 0.5)}}>{tdate1}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>this.setState({visible2: !visible2})} style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
            <View style={{marginLeft:24,width:12,height:12,backgroundColor:'#6096f4'}}/>
            <Text  allowFontScaling={false} style={{marginLeft:10,color:'#ffffff99',fontSize:12,opacity: (visible2 ? 1 : 0.5)}}>{tdate2}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>this.setState({visible3: !visible3})} style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
            <View style={{marginLeft:24,width:12,height:12,backgroundColor:'#fdcf52'}}/>
            <Text  allowFontScaling={false} style={{marginLeft:10,color:'#ffffff99',fontSize:12,opacity: (visible3 ? 1 : 0.5)}}>{tdate3}</Text>
          </TouchableOpacity>
      </View>)
    }
    else{
      colorbar = (
        <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
          <TouchableOpacity onPress={()=>this.setState({visible1: !visible1})} style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
            <View style={{marginLeft:5,width:12,height:12,backgroundColor:'#f31d65',opacity: (visible1 ? 1 : 0.5)}}/>
            <Text  allowFontScaling={false} style={{marginLeft:10,color:'#ffffff99',fontSize:12,opacity: (visible1 ? 1 : 0.5)}}>{I18n.t("bi_teturncustom_rate")+' (%)'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>this.setState({visible2: !visible2})} style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
            <View style={{marginLeft:24,width:12,height:12,backgroundColor:'#6096f4',opacity: (visible2 ? 1 : 0.5)}}/>
            <Text  allowFontScaling={false} style={{marginLeft:10,color:'#ffffff99',fontSize:12,opacity: (visible2 ? 1 : 0.5)}}>{I18n.t("bi_shopper_count")}</Text>
          </TouchableOpacity>
        </View>
      )
    }
    if(data.datasets[0]) {
      data.datasets[0].visible = visible1;
    }
    if(data.datasets[1]) {
      data.datasets[1].visible = visible2;
    } else if (data.barDataset) {
      data.barDatasetVisible = visible2;
      data.barMax = Math.max(...data.barDataset)
    }
    if(data.datasets[2]) {
      data.datasets[2].visible = visible3;
    } else if (data.barDataset2) {
      data.barMax = Math.max(...data.barDataset2) > data.barMax ? Math.max(...data.barDataset2) : data.barMax;
      data.barDataset2Visible = visible3;
    }
    var isWeekend = [];
    if(range=='mm') {
      for(var i=0 ; i<data.labels.length ; ++i) {
        var day = new Date(date.split('/')[0] + "/" + date.split('/')[1] + "/" + data.labels[i]);
        if(day.getDay() == 6 || day.getDay() == 0) { isWeekend.push(1); }
        else { isWeekend.push(0); }
      }
      data.isWeekend = isWeekend;
    }
    var weatherIcon = null;
    if(typeIndex == 0) {
      if(range == "dd") {
        data.weather = weather;
        weatherIcon = VALUES.getWeatherIcon(weather.condition);
      } else if(range == "ww" || range == "mm") {
        data.weatherConditions = weatherConditions;
      }
    } else if(typeIndex == 1) {
      if(range == "dd") {
        data.weatherConditions = weatherConditions;
      }
    }
    return (
      <View style={{marginBottom:15}} horizontal={true}>
        <View style={{flexDirection:'row',alignItems:'center',
                        justifyContent:'flex-end'}}>
          <Text  allowFontScaling={false} style={{color:'#ffffff99',fontSize:14}}>
            {I18n.t("bi_display_value")}
          </Text>
          <Switch
             style={{ transform: [{ scaleX:(Platform.OS === 'ios') ? .8:1 }, { scaleY: (Platform.OS === 'ios') ? .5:1  }] }}
            onValueChange={()=>this.setState({viewNumber:!viewNumber})}
            value={viewNumber}
            thumbColor={'#FFFFFF'}
            trackColor={{false:'#BBBBBB', true:VALUES.COLORMAP.switch_red}}/>
        </View>
        <LineChart
          viewNumber={viewNumber}
          data={data}
          width={Dimensions.get('screen').width} // from react-native
          height={height}
          showLine={showLine}
          uniqueUnit={uniqueUnit}
          renderEndlabel ={renderEndlabel}
          chartConfig={{
            paddingRight:33,
            backgroundColor:VALUES.COLORMAP.dkk_background,
            backgroundGradientFrom: VALUES.COLORMAP.dkk_background,
            backgroundGradientTo:  VALUES.COLORMAP.dkk_background,
            decimalPlaces: 2, // optional, defaults to 2dp
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 0
            }
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 0
          }}
        />
        {data.weather ? <View style={{marginTop:-30,flexDirection:'row',alignItems:'center',justifyContent:'center'}}>
          <Image style={{marginRight:5,width:20,height:20}} source={weatherIcon}/>
          <Text allowFontScaling={false} style={{color:'#ffffff99',fontSize:14}}>
            {data.weather.temp}
          </Text>
        </View> : null}
        {colorbar}
      </View>);
  }

  changeRange(id) {
    var list = ['dd','ww','mm','yyyy'];
    var units= ['hh','wd','dd','dd'];
    if(this.state.typeIndex==1) {
      list = ['dd','ww','yyyy'];
      units= ['hh','wd','dd'];
    }
    var lastDate = false,
        nowDate = new Date(this.state.nowDate),
        date = new Date(this.state.date);
    if(list[id] == 'ww') {
      var dif = nowDate.getDay() || 7 ;
      nowDate.setDate(nowDate.getDate() - dif + 1);
      dif = date.getDay() || 7 ;
      date.setDate(date.getDate() - dif + 1);
    } else if (list[id] == 'mm') {
      nowDate.setDate(1);
      date.setDate(1);
    } else if (list[id] == 'yyyy') {
      nowDate.setDate(1);
      nowDate.setMonth(0);
      date.setDate(1);
      date.setMonth(0);
    }
    lastDate = (nowDate <= date);

    this.setState({
      range: list[id],
      unit: units[id],
      lastDate,
      widgetList: this.getWidgets(this.state.typeIndex,list[id])}, function() {
      this.fetchData();
    })
  }

  renderRangeSelect() {
    const screen = Dimensions.get('window');
    var width = screen.width < 340 ? 70 : 80;
    var list = [];
    list.push(DataHandler.unitToString('dd'));
    list.push(DataHandler.unitToString('ww'));
    //list.push(DataHandler.unitToString('mm'))
    if(this.state.typeIndex==0){
      list.push(DataHandler.unitToString('mm'));
      //list.push(DataHandler.unitToString('yyyy'))
    }
    list.push(DataHandler.unitToString('yyyy'));
    return (  <View style={{flex:1,alignItems:'flex-end' }}>
                  <DropDownSelect changeType={(id)=>this.changeRange(id)}
                      defaultIndex={0}
                      width={width}
                      list={list}
                      content={DataHandler.unitToString(this.state.range)}/>
              </View>)
  }

  renderDatePicker(){
      return (
        <View style={{flex:1,alignItems:'flex-start'}}>
            <View style={{width:30}}>
                <TouchableOpacity opacity={0.5} onPress={()=>{this.refs.datePicker.open(new Date(this.state.date))}}>
                    <Image source={require('../../images/icon_date.png')} style={{width:32,height:32}}/>
                </TouchableOpacity>
            </View>
        </View>
      )
  }

  onDateSelected(date){
      date = moment(date).format('YYYY/MM/DD');
      this.setState({date: date,hiding:true,loading:true,data:null});
      this.state.data=null;
      this.state.hiding=true;
      this.state.loading=true;
      this.state.date=date;
      setTimeout(function(){
          this.state.hiding=false;
          this.fetchData();
      }.bind(this),20);
  }

  renderContent() {
    const screen = Dimensions.get('window');
    if(this.state.loading_err) {
      return (
        <View style={{flex:1,width:screen.width}}>
          <View style={{justifyContent:'center',alignItems:'center',flexDirection:'column', marginTop:30}}>
            <Image source={require('../../images/loading_err.png')} style={{width:90,height:80}}/>
            <Text allowFontScaling={false} style={{textAlign:'center',color:'#9DA0AF',fontSize:18,paddingTop:20}}>
              {I18n.t("bi_load_fail")}
            </Text>
            <View style={{width:130,height:45,marginTop:20}}>
              <TouchableOpacity activeOpacity={0.5} onPress={()=>this.fetchData()}>
                <View style={{borderRadius:10,backgroundColor:VALUES.COLORMAP.switch_red,alignItems:'center'}}>
                  <Text style={{color:'#ffffff',height:45,fontSize:14,textAlignVertical:'center',lineHeight:45}}>
                    {I18n.t("bi_retry")}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )
    } else if(this.state.loading_nodata) {
      return (
        <View style={{flex:1,width:screen.width}}>
          <View style={{justifyContent:'center',alignItems:'center',flexDirection:'column', marginTop:30}}>
            <Image source={require('../../images/loading_nodata.png')} style={{width:90,height:80}}/>
            <Text allowFontScaling={false} style={{textAlign:'center',color:'#9DA0AF',fontSize:18,paddingTop:20}}>
              {I18n.t("bi_nodata")}
            </Text>
          </View>
        </View>
      )
    } else {
      return (
        <View>
          {this.renderChart()}
          {this.renderComment()}
        </View>
      )
    }
  }

  render() {
    const {styles,type,typeIndex,date,range,data,lastDate} = this.state;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    var gap;
    //console.log('Render Type ',type)
    if(smallPhone) {
      gap=60;
    } else {
      gap=60;
    }
    const screen = Dimensions.get('window');
    var dateFontSize = 18;
    if(screen.width < 340) {
      dateFontSize = 14;
    } else if(screen.width < 380) {
      dateFontSize = 16;
    }
    if(this.state.hiding){
      return   <View style={{backgroundColor:VALUES.COLORMAP.dkk_background,
                  width:screen.width, marginBottom:20}}/>;
    }
    return (
      <View style={{backgroundColor:VALUES.COLORMAP.dkk_background, height:screen.height,width:screen.width}}>
        {this.renderTypes()}
        <View style={{paddingBottom:5, width:screen.width,flexDirection:'row',height:50,alignItems:'center',justifyContent:'center', paddingLeft:2,paddingRight:10,paddingLeft:10}}>
          {this.renderDatePicker()}
          <TouchableOpacity onPress={()=>{this.previousDate()}} style={{alignItems:'flex-end',justifyContent:'center',height:40,width:50}}>
            <ImageButton height={30} width={30} type={'left'} onPress={()=>{this.previousDate()}}/>
          </TouchableOpacity>
          <Text  allowFontScaling={false} style={{marginLeft:1,marginRight:1,color:VALUES.COLORMAP.dkk_font_white,fontSize:dateFontSize}}>
            {DataHandler.getDateTitle(date,range)}
          </Text>
          <TouchableOpacity onPress={()=>{this.nextDate()}} style={{alignItems:'flex-start',justifyContent:'center',height:40,width:40}}>
            <View style={{opacity: lastDate ? 0.3 : 1}}>
              <ImageButton height={30} width={30}  type={'right'} onPress={()=>{this.nextDate()}}/>
            </View>
          </TouchableOpacity>
          {this.renderRangeSelect()}
        </View>
        {this.renderContent()}
        <Spinner visible={this.state.loading} />
        <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
        <DatePicker ref={"datePicker"} mode={false} initDate={new Date(this.state.date)} onSelected={(date)=>this.onDateSelected(date)}/>
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
   triangle: {
     width: 0,
     height: 0,
     backgroundColor: 'transparent',
     borderStyle: 'solid',
     borderTopWidth: 0,
     borderRightWidth: 45,
     borderBottomWidth: 90,
     borderLeftWidth: 45,
     borderTopColor: 'transparent',
     borderRightColor: 'transparent',
     borderBottomColor: 'red',
     borderLeftColor: 'transparent',
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
   triangle: {
     width: 0,
     height: 0,
     backgroundColor: 'transparent',
     borderStyle: 'solid',
     borderTopWidth: 0,
     borderRightWidth: 45,
     borderBottomWidth: 90,
     borderLeftWidth: 45,
     borderTopColor: 'transparent',
     borderRightColor: 'transparent',
     borderBottomColor: 'red',
     borderLeftColor: 'transparent',
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
