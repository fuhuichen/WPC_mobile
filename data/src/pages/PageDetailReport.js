import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import UshopRestClient from '../utils/webclient'
import DataHandler from '../utils/DataHandler'
import UpperTab from '../components/UpperTab'
import UpperButton from '../components/UpperButton'
import ImageButton from '../components/ImageButton';
import DropDownSelect from '../components/DropDownSelect';
import PosRestClient from '../utils/posclient'
import Tab from '../components/Tab';
import moment from 'moment'
import store from "../../../mobx/Store";
import ToggleSwitch from 'toggle-switch-react-native'
import {getBottomSpace} from 'react-native-iphone-x-helper'
// import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import {
    BackHandler,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import RNStatusBar from "../../../app/components/RNStatusBar";
import UTitleBar from '../components/UTitleBar'
import LineChart from '../components/chart-kit/LineChart';
//
import Spinner from '../components/Spinner';

import {Actions} from "react-native-router-flux";
import * as storeSync from "react-native-simple-store";
import {inject, observer} from 'mobx-react'
import DatePicker from "../../../app/thirds/datepicker/DatePicker";

@inject('store')
@observer
export default class PageDetailReport extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.backHandler = null;
    var d = new Date();
    var widgetList= this.getWidgets(0,"bi_sale_values");
    var date = moment(d).format('YYYY/MM/DD');
    const smallPhone = store.phoneSelector.smallPhone;
    var styles;
    if(smallPhone) {
      styles = smallStyles
    } else {
      styles = largeStyles
    }
    this.state = {
      mode:"bi_sale_values",
      viewNumber:true,
      types:[
        I18n.t("bi_data_analytics"),
        I18n.t("bi_compared_analytics")
      ],
      widgetList,
      typeIndex:0,
      range:'dd',
      unit:'hh',
      isAnalyticOpen:false,
      data:null,
      date,
      nowDate: date,
      lastDate: true,
      loading:false,
      loading_err:false,
      loading_nodata:false,
      visible1: true,
      visible2: true,
      visible3: true,
      weather: {
        condition: -1,
        temp: 999
      },
      weatherConditions: [],
      styles:styles
    };
  }

  componentDidMount() {
    console.log('Is IphoneX?',VALUES.isIPhoneX)
    this.fetchData();
    this.backHandler = BackHandler.addEventListener("pageDetailReportBackPress", () => {
        if(this.state.loading){
            return;
        }
    });
  }

  componentWillUnmount() {
    this.backHandler.remove();
  }

  getWidgets(typeIndex,mode) {
    const widgetList = this.props.store.widgetSelector.list;;
    var list = [];
    if(mode =="bi_sale_values") {
      if(typeIndex==0) {
        list.push(widgetList[0]); //進店人數
      }
    }
    list.push(widgetList[16]); //天氣
    return list;
  }

  fetchData() {
    console.log('fetchdata');
    const api = new UshopRestClient();
    const {date,range,unit,widgetList,typeIndex} = this.state;
    const token = this.props.store.userSelector.token;
    const accountId = this.props.store.userSelector.accountId;
    const tempReportStore = this.props.store.storeSelector.tempReportStoreBI;//store.storeSelector.tempReportStore;//StoreSelector.tempReportStore;

    var promises = [];
    this.setState({isAnalyticOpen:false, loading:true, loading_err:false, loading_nodata:false, data:null, visible1:true, visible2:true, visible3:true});
    const posapi = new PosRestClient();
    if(typeIndex == 0) {
      promises.push(posapi.getItemData(accountId, token, [tempReportStore.register_key],
        DataHandler.ceateDatePeriod(date,range),unit));
    } else {
      var d = new Date();
      if(date) {
        d = moment(date, 'YYYY/MM/DD').toDate();
      }
      if(range == 'dd' || range == 'ww') {
        var tdate = moment(d).format('YYYY/MM/DD');
        promises.push(posapi.getItemData( accountId, token, [tempReportStore.register_key],
                                          DataHandler.ceateDatePeriodRange(tdate,range), range) );
      } else if(range == 'mm' || range == 'yyyy') {
        d.setYear(1900+d.getYear() - 2);
        for(var n=0 ; n<3 ; n++) {
          var tdate  = moment(d).format('YYYY/MM/DD');
          promises.push(posapi.getItemData(accountId, token,[tempReportStore.register_key]
            ,DataHandler.ceateDatePeriod(tdate,range),unit));
          d.setYear(1900+d.getYear() +1);
        }
      }
    }
    for(var k in widgetList) {
      var widget = widgetList[k];
      let tmpUnit = unit;
      if(range == "yyyy") { tmpUnit = "mm"; }
      if(widget.title == '天氣') { tmpUnit = "dd"; }
      var req = DataHandler.createSimpleRequest(token,widget.data_source,
        range, tmpUnit, new Date(date),tempReportStore,typeIndex==0?false:true );
      promises.push(api.widgetData(req));
    }
    this.promiseRequests(promises);
  }

  promiseRequests(promises) {
    const {typeIndex} = this.state;
    var handle = function(results) {
      if(typeIndex == 0) {
        this.handlePosResult1(results);
      } else {
        this.handlePosResult2(results);
      }
    }.bind(this)
    var doFail = function() {
       this.setState({loading:false, loading_err: true});
    }.bind(this)
    Promise.all(promises)
    .then(function(data) {
      handle(data)
    })
    .catch(function(err) {
      doFail();
    });
  }

  handlePosResult1(results) {
    const {date,range,unit,widgetList,mode} = this.state;
    var data = {
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
    if(mode == "bi_sale_values") {
      var d = DataHandler.parseDataResponse(results[1], widgetList[0].data_source);
      data.barDataset=output.total_amount;
      for(var n in output.transaction_count) {
        if( d[0] && d[0].row && d[0].row[n] && output.transaction_count[n] > 0) {
          output.transaction_count[n] = (100*parseInt(output.transaction_count[n])/ parseInt(d[0].row[n])).toFixed(0);
          if(output.transaction_count[n] > 100) {
            output.transaction_count[n] = 100;
          }
        } else if(output.transaction_count[n] < 0) {
          output.transaction_count[n] = -1;
        } else {
          output.transaction_count[n] = 0;
        }
      }
      data.datasets.push({data:output.transaction_count, max:100});
      if(results[2]) {
        this.getWeatherInfo(results[2]);
      }
    } else if(mode =="bi_shopper_count") {
      data.barDataset=output.transaction_count;
      for(var n in output.total_amount) {
        if( output.total_amount[n] > 0 && output.transaction_count[n] > 0) {
          output.total_amount[n] = (output.total_amount[n]/output.transaction_count[n]).toFixed(1);
        } else if(output.total_amount[n] < 0) {
          output.total_amount[n] = -1;
        } else {
          output.total_amount[n] = 0;
        }
      }
      data.datasets.push({data:output.total_amount});
      if(results[1]) {
        this.getWeatherInfo(results[1]);
      }
    }
    if( range == 'dd' ) {
      data = DataHandler.fixNegtiveData(data);
    }
    var checkNoData = true;
    for(var n in output.total_amount) {
      if( output.total_amount[n] >= 0 || output.transaction_count[n] >= 0) {
        checkNoData = false;
        break;
      }
    }

    this.setState({loading:false, loading_nodata: checkNoData, data});
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

  handlePosResult2(results) {
    //console.log('handlePosResult2',results)
    const {date,range,unit,widgetList,mode} = this.state;
    var data={
      labels: [],
      labels2: [],
      datasets: [],
      barDataset:[],
      barDataset2:[],
      barDataset3:[]
    };
    var weeklist = DataHandler.getSimpleWeekList();
    var d =  new Date(date);
    var list = [];
    if(range == 'dd') {
      if(results.length > 0 && results[0].datas.length > 0 && results[0].datas[0].retrived.length > 0) {
        for(var i=7 ; i>=0 ; --i) {
          var posResultList = [];//results[0].datas[0].retrived[i];
          var chartDate = new Date(date);
          chartDate.setDate(d.getDate() - i*7);
          var tdate  = moment(chartDate).format('MM/DD');
          var wd = ( chartDate.getDay() + 6 ) % 7;
          data.labels.push(tdate);
          data.labels2.push(weeklist[wd]);
          for(var j=0 ; j<results[0].datas[0].retrived.length ; j++) {
            if( moment(chartDate).format('YYYY/MM/DD') == moment(results[0].datas[0].retrived[j].date_time).format('YYYY/MM/DD') ) {
              posResultList.push(results[0].datas[0].retrived[j]);
              break;
            }
          }
          var output = DataHandler.parsePosData(posResultList,date,range,range);

          if(mode =="bi_sale_values") {
            list.push(output.total_amount[0]);
          } else {
            list.push(output.transaction_count[0]);
          }
        }
        if(results[1]) {
          console.log("results[1] : ", results[1]);
          this.getWeatherInfo(results[1]);
        }
      }
      data.datasets.push({data:list});
      data.barDataset=list;
    } else if(range == 'ww') {
      if(results.length > 0 && results[0].datas.length > 0 && results[0].datas[0].retrived.length > 0) {
        for(var i=7 ; i>=0 ; --i) {
          var posResultList = [];//results[0].datas[0].retrived[i];
          var chartDate = new Date(date);
          chartDate.setDate(d.getDate() - i*7);
          var wd =( chartDate.getDay() + 6 ) % 7;
          chartDate.setDate(chartDate.getDate() -wd);
          var sdate  = moment(chartDate);
          chartDate.setDate(chartDate.getDate() +6);
          var edate  = moment(chartDate);
          data.labels.push(sdate.format('MM/DD') + ' -');
          data.labels2.push(edate.format('MM/DD') + ' ');
          for(var j=0 ; j<results[0].datas[0].retrived.length ; j++) {
            if( moment(results[0].datas[0].retrived[j].date_time).format('YYYY/MM/DD') >= sdate.format('YYYY/MM/DD') &&
                 moment(results[0].datas[0].retrived[j].date_time).format('YYYY/MM/DD') <= edate.format('YYYY/MM/DD') ) {
              posResultList.push(results[0].datas[0].retrived[j]);
              break;
            }
          }
          var output = DataHandler.parsePosData(posResultList,date,range,range);

          if(mode =="bi_sale_values") {
            list.push(output.total_amount[0]);
          } else {
            list.push(output.transaction_count[0]);
          }
        }
      }
      data.datasets.push({data:list});
      data.barDataset = list;
    } else if(range == 'mm' || range == 'yyyy') {
      for(var n= 0;n<3;n++) {
        var posResultList = [];
        if(results[n] && results[n].datas && results[n].datas[0] && results[n].datas[0].retrived){
          posResultList  = results[n].datas[0].retrived
        }
        var output = DataHandler.parsePosData(posResultList,date,range,unit)
        console.log("handlePosResult2 ouptput:",output);
        var list = [];
        if(mode =="bi_sale_values") {
          list = output.total_amount;
        } else {
          list = output.transaction_count;
        }
        data.datasets.push({data:list});
        if(n==0) data.barDataset=list;
        if(n==1) data.barDataset2=list;
        if(n==2) data.barDataset3=list;
        data.labels = output.labels;
        data.labels2 = output.labels2;
      }
    }
    //console.log(data)
    this.setState({
      loading:false,
      data,
    });
  }

  handleResults2(results){
    console.log('handleResults')
    // const {token,tempReportStore} = this.props;
    const {date,range,unit,widgetList} = this.state;
    var data={
      labels: [],
      labels2: [],
      datasets: []
    };
    var weeklist =  DataHandler.getSimpleWeekList();
    for(var k in results){
      if(results[k].status !=1){
        return;
      }
      var d = DataHandler.parseDataResponse(results[k], widgetList[k].data_source);
      if(widgetList[k].title == '提袋率') {
        for(var x in d) {
          for(var y in d[x].row) {
            if(d[x].row[y]>0) {
              d[x].row[y] =d[x].row[y]*100;
              d[x].row[y] = d[x].row[y].toFixed(1);
            }
          }
        }
      }
      var list =[];
      if(range == 'mm' || range == 'yyyy'){
        for(var n in d){
            data.datasets.push({data:d[n].row});
        }
      } else {
        for(var n in d) {
          if(k==0) {
            var item=n+'';
            var subitem=n+'';
          }
          list.push(d[n].row[0])
        }
        data.datasets.push({data:list});
        data.barDataset=list;
      }
    }
    var d =  new Date(date);
    if(range == 'dd') {
      d.setDate(d.getDate() -49);
      for(var n= 0;n<8;n++){
        var tdate  = moment(d).format('MM/DD');
        var wd =( d.getDay()+6)%7
        data.labels.push(tdate);
        data.labels2.push(weeklist[wd]);
        d.setDate(d.getDate() +7);
      }
    } else if(range == 'ww'){
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
      }
    } else if(range == 'mm' || range == 'yyyy'){
      for(var n in results[k].label){
        var item = results[k].label[n];
        var subitem = '';
        var rr  = item.split("/");
        item = rr[rr.length-1]
        data.labels.push(item);
        data.labels2.push(subitem);
      }
    }
    this.setState({
      loading:false,
      data,
    })
  }

  handleResults(results){
    console.log('handleResults',results)
    // const {token,tempReportStore} = this.props;
    const {date,range,unit,widgetList} = this.state;
    var data={
      labels: [],
      labels2: [],
      datasets: []
    };
    //console.log(results)
    var weeklist = DataHandler.getSimpleWeekList();
    for(var k in results){
      //console.log(results[k])
      var d = DataHandler.parseDataResponse(results[k], widgetList[k].data_source);
      if(widgetList[k].title== '提袋率'){
        for(var x in d){
          for(var y in d[x].row){
            if(d[x].row[y]>0){
              d[x].row[y] =d[x].row[y]*100;
              d[x].row[y] = d[x].row[y].toFixed(1);
            }
          }
        }
      }
      if(k==0){
        //  data.labels=results[k].label;
        for(var n in results[k].label){
          var item = results[k].label[n];
          var subitem = '';
          if( range == 'ww'){
            var  rr  = item.split(" (");
            item = weeklist[n]
            subitem= rr[rr.length-1]
          }
          else if( range == 'mm'){
            var rr  = item.split("/");
            item = rr[rr.length-1]
          }
          else if( range == 'yyyy'){
            var rr  = item.split("/");
            item = rr[rr.length-1]
          }
          data.labels.push(item);
          data.labels2.push(subitem);
        }
      }
      data.datasets.push({data:d[0].row});
    }
    this.setState({
      loading:false,
      data,
    })
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

  previousDate(){
    const {date,range} =this.state;
    var d = new Date();
    if(date){
       d = new Date(date);
    }
    if(range=='dd'){
       d.setDate(d.getDate() -1 );
    }
    else if(range=='ww'){
       d.setDate(d.getDate() -7 );
    }
    else if(range=='mm'){
       d.setMonth(d.getMonth() -1);
    }
    else if(range=='yyyy'){
       d.setYear(1900+d.getYear() -1);
    }
    this.setState({date:moment(d).format('YYYY/MM/DD'), lastDate: false}, function() {
      this.fetchData();
    });
 }

 nextDate(){
   const {date,range,lastDate} = this.state;
   if(lastDate) {
     return;
   }
   var d = new Date();
   if(date){
      d = new Date(date);
   }
   if(range=='dd' ){
      d.setDate(d.getDate() + 1);
   }
   else if(range=='ww' ){
      d.setDate(d.getDate() + 7);
   }
   else if(range=='mm' ){
      d.setMonth(d.getMonth() + 1);
   }
   else if(range=='yyyy' ){
      d.setYear(1900+d.getYear() + 1);
   }
   if(d > new Date(this.state.nowDate)) {
     d = new Date(this.state.nowDate);
   }
   this.setState({date:moment(d).format('YYYY/MM/DD'), lastDate: (new Date(this.state.nowDate) <= d)}, function() {
     this.fetchData();
   });
 }

 renderDatePicker(){
     return (
         <View style={{width:30,alignSelf:'flex-start'}}>
           <TouchableOpacity opacity={0.5} onPress={()=>{this.refs.datePicker.open(new Date(this.state.date))}}>
             <Image source={require('../../images/icon_date.png')} style={{width:20,height:21}}/>
           </TouchableOpacity>
         </View>
     )
 }

 onDateSelected(date){
     date = moment(date).format('YYYY/MM/DD');
     this.setState({date: moment(date).format('YYYY/MM/DD'),hiding:true,loading:true,data:null});
     this.state.data=null;
     this.state.hiding=true;
     this.state.loading=true;
     this.state.date=date;
     setTimeout(function(){
         this.state.hiding=false;
         this.fetchData();
     }.bind(this),20)
 }

 renderRangeSelect(){
   const screen = Dimensions.get('window');
   var list = [];

   list.push(DataHandler.unitToString('dd'));
   list.push(DataHandler.unitToString('ww'));
   var width = screen.width < 340 ? 65 : 75;
   if(this.state.typeIndex==0){
    list.push(DataHandler.unitToString('mm'));
  }
  list.push(DataHandler.unitToString('yyyy'));

   return (  <View style={{flex:1,alignSelf:'center',alignItems:'flex-end'}}>
                 <DropDownSelect changeType={(id)=>this.changeRange(id)}
                     defaultIndex={0}
                     width={width}
                     list={list}
                     content={DataHandler.unitToString(this.state.range)}/>
             </View>)
 }

 changeRange(id){
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
   }
   lastDate = (nowDate <= date);

   this.setState({range: list[id], unit: units[id], lastDate}, function() {
     this.fetchData();
   })
 }

renderChart(){
    const {typeIndex,data,range,date,viewNumber,visible1,visible2,visible3,weather,weatherConditions}=this.state;
    const screen = Dimensions.get('window')
    var width = screen.width;
    var height = (screen.width * 8.5 )/16 +1;
    if(!data){
      return <View style={{marginBottom:10,width,height}}/>
    }
    console.log("data:",data.datasets);
    const {mode} = this.state;
    var compareType ;
    var leftUnit;
    if(mode == "bi_sale_values") {
      compareType = I18n.t("bi_shop_rate") +' (%)';
      leftUnit = I18n.t('bi_values_unit');
    } else if(mode == "bi_shopper_count") {
      compareType = I18n.t("bi_people_single_buy");
      leftUnit = I18n.t('bi_person_unit');
    } else if(mode == "bi_sales_count") {
      compareType = I18n.t("bi_average_sale_price");
      leftUnit = I18n.t('bi_unit_item_unit');
    }

    var showLine = true;
    var renderEndlabel = true;
    var uniqueUnit = false;
    if(typeIndex==1) {
      if(range!='mm'){// && range!='yyyy') {
        showLine = false;
      } else {
        uniqueUnit = true;
      }
      renderEndlabel = false;
    }

    var colorbar ;
    if(typeIndex==0){
      colorbar = (
      <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
        <TouchableOpacity onPress={()=>this.setState({visible1: !visible1})} style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
          <View style={{marginLeft:5,width:12,height:12,backgroundColor:'#2C90D9',opacity: (visible1 ? 1 : 0.5)}}/>
          <Text  allowFontScaling={false} style={{marginLeft:10,color:'#86888A',fontSize:12,opacity: (visible1 ? 1 : 0.5)}}>{compareType}</Text>
        </TouchableOpacity>
          <TouchableOpacity onPress={()=>this.setState({visible2: !visible2})} style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
            <View style={{marginLeft:24,width:12,height:12,backgroundColor:'#FFC53D',opacity: (visible2 ? 1 : 0.5)}}/>
            <Text  allowFontScaling={false} style={{marginLeft:10,color:'#86888A',fontSize:12,opacity: (visible2 ? 1 : 0.5)}}>{I18n.t(mode)}</Text>
          </TouchableOpacity>
      </View>)
    } else if(typeIndex==1 && (range=='mm' || range=='yyyy')) {
      var d = new Date(date)
      d.setYear(1900+d.getYear() -2);
      var tdate1  = moment(d).format('YYYY年');
      d.setYear(1900+d.getYear() +1);
      var tdate2  = moment(d).format('YYYY年');
      d.setYear(1900+d.getYear() +1);
      var tdate3  = moment(d).format('YYYY年');
      colorbar=  (
        <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
          <TouchableOpacity onPress={()=>this.setState({visible1: !visible1})} style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
            <View style={{marginLeft:5,width:12,height:12,backgroundColor:'#2C90D9'}}/>
            <Text  allowFontScaling={false} style={{marginLeft:10,color:'#86888A',fontSize:12,opacity: (visible1 ? 1 : 0.5)}}>{tdate1}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>this.setState({visible2: !visible2})} style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
            <View style={{marginLeft:24,width:12,height:12,backgroundColor:'#FFC53D'}}/>
            <Text  allowFontScaling={false} style={{marginLeft:10,color:'#86888A',fontSize:12,opacity: (visible2 ? 1 : 0.5)}}>{tdate2}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>this.setState({visible3: !visible3})} style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
            <View style={{marginLeft:24,width:12,height:12,backgroundColor:'#CBCBCB'}}/>
            <Text  allowFontScaling={false} style={{marginLeft:10,color:'#86888A',fontSize:12,opacity: (visible3 ? 1 : 0.5)}}>{tdate3}</Text>
          </TouchableOpacity>
        </View>)
    } else {
      colorbar = (<View style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
          <View style={{marginLeft:5,width:12,height:12,backgroundColor:'#2C90D9'}}/>
          <Text  allowFontScaling={false} style={{marginLeft:10,color:'#86888A',fontSize:12}}>{I18n.t(mode)}</Text>
      </View>)
    }

    if(typeIndex==1 && range=='yyyy'){
      if(data.barDataset){
        data.barDatasetVisible = visible1;
        data.barMax = Math.max(...data.barDataset);
      }
      if(data.barDataset2){
        data.barDataset2Visible = visible2;
        data.barMax = Math.max(...data.barDataset2) > data.barMax ? Math.max(...data.barDataset2) : data.barMax;
      }
      if(data.barDataset3){
        data.barDataset3Visible = visible3;
        data.barMax = Math.max(...data.barDataset3) > data.barMax ? Math.max(...data.barDataset3) : data.barMax;
      }
    }else{
      if(data.datasets[0]) {
        data.datasets[0].visible = visible1;
      }
      if(data.datasets[1]) {
        data.datasets[1].visible = visible2;
      } else if (data.barDataset) {
        data.barDatasetVisible = visible2;
        data.barMax = Math.max(...data.barDataset);
      }
      if(data.datasets[2]) {
        data.datasets[2].visible = visible3;
      } else if (data.barDataset2) {
        data.barDataset2Visible = visible3;
        data.barMax = Math.max(...data.barDataset2) > data.barMax ? Math.max(...data.barDataset2) : data.barMax;
      }
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
    console.log("typeIndex:",typeIndex)
    return (
      <View style={{marginBottom:5}}>
        <View style={{flexDirection:'row-reverse',alignContent:'flex-end',width:width-32,marginRight:8,marginTop:5}}>
            <ToggleSwitch
              isOn = {viewNumber}
              onColor={'#3584DB'}
              offColor={'#85898E'}
              label={I18n.t("bi_display_value")}
              labelStyle ={{color:'#85898E',fontSize:14}}
              onToggle={()=>this.setState({viewNumber:!viewNumber})}
              animationSpeed ={100}
              size = {'small'}
            />
        </View>
        <LineChart
          typeIndex = {typeIndex}
          data={data}
          width={Dimensions.get('screen').width} // from react-native
          height={height}
          viewNumber={viewNumber}
          showLine={showLine}
          uniqueUnit={uniqueUnit}
          renderEndlabel ={renderEndlabel}
          chartConfig={{
            paddingRight:33,
            backgroundColor:'white',
            backgroundGradientFrom: 'white',
            backgroundGradientTo:  'white',
            decimalPlaces: 2, // optional, defaults to 2dp
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 0
            }
          }}
          bezier
          style={{
            marginLeft:-16,
            marginVertical: 8,
            borderRadius: 0
          }}
        />
        {data.weather ? <View style={{marginTop:-30,flexDirection:'row',alignItems:'center',justifyContent:'center'}}>
          <Image style={{marginRight:5,width:20,height:20}} source={weatherIcon}/>
          <Text allowFontScaling={false} style={{color:'#85898E',fontSize:14}}>
            {data.weather.temp}
          </Text>
        </View> : null}
        {colorbar}
       </View>);
  }

  renderDatePickArea(){
    const {date,range,lastDate} = this.state;
    const screen = Dimensions.get('window');
    var dateFontSize = 18;
    if(screen.width < 340) {
      dateFontSize = 14;
    } else if(screen.width < 380) {
      dateFontSize = 16;
    }
    return(
      <View style={{width:screen.width-32, flexDirection:'row',height:40,alignItems:'center',alignContent:'center'}}>
        <View style={{justifyContent:'flex-start',alignItems:'flex-start',marginLeft:0}}>
          {this.renderDatePicker()}
        </View>
        <TouchableOpacity onPress={()=>{this.previousDate()}} style={{alignSelf:'flex-start',justifyContent:'center',height:40,width:20}}>
          <ImageButton height={16} width={16} type={'left'} onPress={()=>{this.previousDate()}}/>
        </TouchableOpacity>
        <View style={{flexDirection:'row',height:40,width:130,alignContent:'center'}}>
          <Text allowFontScaling={false} style={{flex:3,alignSelf:'center',textAlign:'center',color:VALUES.COLORMAP.gray_font,fontSize:dateFontSize}}>
          {DataHandler.getDateTitle(date,range)}
          </Text>
        </View>
        <TouchableOpacity onPress={()=>{this.nextDate()}} style={{flexDirection:'row',height:40,width:20,alignContent:'center'}}>
          <View style={{alignSelf:'center',opacity: lastDate ? 0.3 : 1}}>
            <ImageButton height={16} width={16} type={'right'} onPress={()=>{this.nextDate()}}/>
          </View>
        </TouchableOpacity>
        <View style={{flexDirection:'row',height:40,width:screen.width-32-200, alignContent:'center',alignSelf:'flex-end'}}>
          {this.renderRangeSelect()}
        </View>
      </View>
     );
  }
  renderChartArea(){
    //const {styles,type,mode,typeIndex,date,range,loading_err} = this.state;
    const screen = Dimensions.get('window');
    if(this.state.loading_err) {
      return (
        <View style={{flex:3,width:screen.width,alignSelf:'center',flexDirection:'row'}}>
          <View style={{flex:1,justifyContent:'center',alignItems:'center',flexDirection:'column', marginTop:30}}>
            <Image source={require('../../images/loading_err.png')} style={{width:90,height:80}}/>
            <Text allowFontScaling={false} style={{textAlign:'center',color:'#9DA0AF',fontSize:18,paddingTop:20}}>
              {I18n.t("bi_load_fail")}
            </Text>
            <View style={{width:130,height:45,marginTop:20}}>
              <TouchableOpacity activeOpacity={0.5} onPress={()=>this.fetchData()}>
                <View style={{borderRadius:10,backgroundColor:VALUES.COLORMAP.dkk_blue,alignItems:'center'}}>
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
        <View style={{flex:3,width:screen.width,alignSelf:'center',flexDirection:'row'}}>
          <View style={{flex:1,justifyContent:'center',alignItems:'center',flexDirection:'column', marginTop:30}}>
            <Image source={require('../../images/loading_nodata.png')} style={{width:90,height:80}}/>
            <Text allowFontScaling={false} style={{textAlign:'center',color:'#9DA0AF',fontSize:18,paddingTop:20}}>
              {I18n.t("bi_nodata")}
            </Text>
          </View>
        </View>
      )
    } else {
      return (
        <View style={{flex:3,width:screen.width,alignSelf:'center',flexDirection:'row'}}>
          {this.renderChart()}
        </View>
      );
    }
  }


  renderContent() {
    const screen = Dimensions.get('window');
    const {styles} = this.state;
    if(this.state.loading_err) {
      return (
        <View style={{flex:1,width:screen.width}}>
        </View>
      )
    } else if(this.state.loading_nodata) {
      return (
        <View style={{flex:1,width:screen.width}}>
        </View>
      )
    } else {
      const {typeIndex,range} = this.state;
      var t1,t2,t3,t4;
      if(typeIndex==0) {
        if(range =='dd') {
          t1 = I18n.t("bi_best_period_doday")
          t3 = I18n.t("bi_worst_period_doday")
        } else  if(range =='ww') {
          t1 = I18n.t("bi_best_period_week")
          t3 = I18n.t("bi_worst_period_week")
        } else  if(range =='mm'){
          t1 = I18n.t("bi_best_period_month")
          t3 = I18n.t('bi_worst_period_month')
        }
        else  if(range =='yyyy'){
          t1 = I18n.t('bi_best_period_year')
          t3 = I18n.t('bi_worst_period_year')
        }
      } else {
        if(I18n.locale=='en'){
          t1 = I18n.t("bi_do_best") + ' ' + DataHandler.unitToString(this.state.range)
          t3 = I18n.t("bi_do_worst") + ' ' + DataHandler.unitToString(this.state.range)
          if(this.state.range=='mm' || this.state.range=='yyyy'){
            t1 =I18n.t("bi_do_best")  + ' ' + DataHandler.unitToString('yyyy')
            t3 = I18n.t("bi_do_worst") + ' ' + DataHandler.unitToString('yyyy')
          }
        } else{
          t1 = I18n.t("bi_do_best") + DataHandler.unitToString(this.state.range)
          t3 = I18n.t("bi_do_worst") + DataHandler.unitToString(this.state.range)
          if(this.state.range=='mm' || this.state.range=='yyyy'){
            t1 =I18n.t("bi_do_best")  + DataHandler.unitToString('yyyy')
            t3 = I18n.t("bi_do_worst") + DataHandler.unitToString('yyyy')
          }
        }
      }
      var rank = this.getBestTime();
      t2 = rank.best;
      t4 = rank.worst;
      return (
        <View style={{flex:1,width:screen.width,backgroundColor:VALUES.COLORMAP.dkk_background,marginTop:5}}>
          <View style={{flexDirection:'row', alignItems:'flex-start', marginTop:10, paddingLeft:16, marginBottom:90}}>
            <View style={{flexDirection:'column',alignItems:'flex-start',flex:2}}>
              <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font,fontSize:14 }}>
                {t1}
              </Text>
              <Text allowFontScaling={false} style={{marginTop:4,color:VALUES.COLORMAP.gray_font,fontSize:28 }}>
                {t2}
              </Text>
              <Text allowFontScaling={false} style={{marginTop:20,color:VALUES.COLORMAP.gray_font,fontSize:14 }}>
                {t3}
              </Text>
              <Text allowFontScaling={false} style={{marginTop:4,color:VALUES.COLORMAP.gray_font,fontSize:28 }}>
                {t4}
              </Text>
            </View>
            <TouchableOpacity onPress={()=>{this.setState({isAnalyticOpen:!this.state.isAnalyticOpen})}}
              style={{flex:1,height:150,flexDirection:'column',alignItems:'center'}}>
              <Image style={{width:80,height:80,marginTop:10}} source={require('../../images/dataanalysis_pic.png')}/>
              <Text allowFontScaling={false} style={{marginTop:10,color:'#85898E',fontSize:14 }}>
                {I18n.t('bi_data_analytics_tips')}
              </Text>
            </TouchableOpacity>
            {this.state.isAnalyticOpen ?
            <View style={{position:'absolute',left:0,top:-20,flexDirection:'row',alignItems:'center',paddingLeft:10,width:216,marginRight:10,height:180}}>
              <View style={[{flex:1,height:151,width:252,}]}>
                <Image source={require('../../images/isAnalyticBk.png')} style={{position:'absolute',width:252,height:149}} />
                <Text allowFontScaling={false} style={{marginTop:14,
                    marginLeft:4,
                    marginRight:5,
                    paddingLeft:10,
                    color:VALUES.COLORMAP.gray_font,
                    fontSize:16 }}>
                  {rank.comment}
                </Text>
              </View>
            </View>:null}
          </View>
        </View>)
    }
  }


  getBestTime(){
    const {styles,data,typeIndex,date,range} = this.state;
    var maxIndex =-1;
    var minIndex =-1;
    var max=-1,min=-1;
    var count =0;
    var output ={best:'N/A',worst:'N/A',comment:''}
    if(typeIndex==1 && (range=='mm' || range=='yyyy')){
      return this.getMonthAvgComment();
    }
    if(data && data.barDataset){
      var datas = data.barDataset;
      for(var k in datas){
        var v = parseInt(datas[k]);
        if(v>=0){
          if(maxIndex==-1 || v>max){
            max = v;
            maxIndex = parseInt(k);;
          }
          if(minIndex==-1 || v<min){
            min = v;
            minIndex = parseInt(k);;
          }
        }
      }
      if(min >0 || max >0){
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
          } else if(range == 'mm') {
            var m = moment(this.state.date).format('MM/');
            output.best = m+ data.labels[maxIndex];
            output.worst = m+data.labels[minIndex];
          } else if(range == 'yyyy'){
            if(I18n.locale == 'en') {
              output.best =  (parseInt(maxIndex)+1);
              output.worst = (parseInt(minIndex)+1);
            } else {
              output.best =  (parseInt(maxIndex)+1)+I18n.t('bi_du_month');
              output.worst = (parseInt(minIndex)+1)+I18n.t('bi_du_month');
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
        output.comment=  this.getComment(maxIndex,minIndex);
      }
    }
    return output;
  }

  getMonthAvgComment(){
    console.log('getMonthAvgComment')
    const {styles,data,typeIndex,date,range} = this.state;
    const {mode } =this.state;
    var maxIndex =-1;
    var minIndex =-1;
    var max=-1,min=-1;
    var output ={best:'',worst:'',comment:''}
    var years =[];
    var d = new Date(date)
    var total = 0;
    var count = 0;
    var totalCount= 0;
    d.setYear(1900+d.getYear() -2);
    for(var k=0;k<3;k++){
      years.push(DataHandler.getYearTitle(d))
      d.setYear(1900+d.getYear() +1);
    }
    if(data && data.datasets){
      for(var k in data.datasets){
        var sum = 0;
        var count =0;
        for(var n in data.datasets[k].data){
          if(data.datasets[k].data[n]>=0){
            sum =  sum + parseInt(data.datasets[k].data[n]);
            console.log('TEmp sum ',sum)
            count=count +1;
          }
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
        if(sum>0){
          total = total + sum;
          totalCount=totalCount +1;
        }
      }
      if(total>0) {
        var unit ='';
        if(mode =="bi_sale_values"){
          unit = I18n.t("bi_chinese_dollor")
        } else if(mode =="bi_shopper_count") {
          unit = I18n.t("bi_unit_person")
        } else if(mode=="bi_sales_count") {
          unit = I18n.t("bi_unit_item")
        }
        output.best = years[maxIndex];
        output.worst = years[minIndex];
        var avg =0 ;
        var gPer=0 ;
        var lPer=0 ;
        if(totalCount>0)avg = total/totalCount;
        if(avg>0) {
          var gPer=parseInt(((max-avg)*100)/avg) ;
          var lPer= parseInt(((avg-min)*100)/avg);
        }
        output.comment =years[maxIndex] + I18n.t("bi_do_best")+'!\n\n'+
          I18n.t("bi_simple_total") + I18n.t(mode) +
          I18n.t("bi_is_to") +
          '\n'+  max+unit+','+
          '\n'+I18n.t("bi_beyond_avg")+ gPer +'%。' ;
      }
    }
    return output;
  }

  getComment(maxIndex,minIndex){
    const {styles,data,typeIndex,date,range,mode} = this.state;
    var out ='';
    var avg = 0;
    var max = 0;
    var min = 0;
    if(data && data.barDataset){
      max =data.barDataset[maxIndex];
      min =data.barDataset[minIndex];
      var sum =0;
      var count =0
      for(var k in data.barDataset ){
        var value = parseInt(data.barDataset[k])
        if(value && value>=0){
          sum = sum + value;
          count = count+1;
        }
      }
      if(count >0){
        avg = sum/count;
      }
    }
    if(avg ==0){
      return '0';
    }
    var out =''+avg;
    console.log('AVG Value is '+avg)
    var gPer=parseInt(((max-avg)*100)/avg) ;
    var lPer= parseInt(((avg-min)*100)/avg);
    if(typeIndex==0){
      if(mode=="bi_sale_values") {
        out = I18n.t('bi_comment_type_value1')+gPer+I18n.t('bi_comment_type_value2')+lPer+'%。'
      } else if(mode =="bi_shopper_count") {
        out = I18n.t('bi_comment_type_person1')+gPer+I18n.t('bi_comment_type_person2')+lPer+'%。'
      }
    } else {
      var unit ='';
      if(mode =="bi_sale_values") {
        unit = I18n.t("bi_chinese_dollor")
      } else if(mode=="bi_shopper_count") {
        unit = I18n.t("bi_unit_person")
      } else if(mode =="bi_sales_count") {
        unit = I18n.t("bi_unit_item")
      }
      if(range =='dd') {
        var wlist =DataHandler.getFullWeekList();
        var d = new Date(date)
        var wd =( d.getDay()+6)%7
        if(I18n.locale=='en'){
          out = `Average  ${I18n.t(mode)} of ${wlist[wd]} \nis ${parseInt(avg) + ' ' + unit}`;
        } else {
          out = wlist[wd] +I18n.t("bi_avg") + I18n.t(mode)+'\n'+I18n.t("bi_is_to")+ parseInt(avg) +unit+'。';
        }
      } else if(range =='ww'){
        if(I18n.locale=='en'){
          out =`Highest weekly ${I18n.t(mode)} is ${parseInt(max)+' '+unit}, ${gPer}% higher than average.`;
        } else {
          out =I18n.t("bi_best_week")+I18n.t(mode)+I18n.t("bi_is_to")+ max+unit+','+ '\n'+I18n.t("bi_beyond_avg")+ gPer +'%。';
        }
      } else if(range =='mm' || range =='yyyy') {
        if(I18n.locale=='en') {
          out =`${data.labels[maxIndex]} wins the highest yearly revenue, ${parseInt(max)+' '+unit} in total ,  ${gPer}% higher than average`;
        } else {
          out =data.labels[maxIndex] + I18n.t('的') + data.labels2[maxIndex]+ '\n'+
          I18n.t('bi_do_best')+'\n\n'+
            I18n.t("bi_simple_total") +I18n.t(mode)+
            I18n.t("bi_is_to")+
            '\n'+  max+unit+','+
             '\n'+"bi_beyond_avg"+ gPer +'%。' ;
        }
      }
    }
    return out;
  }

  render() {
    const {clear_gray,light_gray, bright_blue,white,black,green} = VALUES.COLORMAP;
    const {styles,type,mode,typeIndex,date,range,loading_err} = this.state;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    var gap
   // console.log('Render Type ',type)
    if(smallPhone) {
      gap=60;
    } else {
      gap=60;
    }
    const screen = Dimensions.get('window');
    const iphoneBottom = getBottomSpace();
    console.log("iphoneBottom:",iphoneBottom);
    let contentHeight = (Platform.OS === 'ios'? screen.height-172-58-iphoneBottom: screen.height-172-30);
    if(this.state.hiding){
      return  <View style={{
                paddingTop:(VALUES.isIPhoneX ? 34 : (Platform.OS === 'ios') ? 25: 0),
                backgroundColor: VALUES.COLORMAP.dkk_background,
                height: screen.height, width: screen.width}}/>;
    }
    return (
      <View style={{paddingTop:0,
        backgroundColor:VALUES.COLORMAP.dkk_background,flex:1,width:screen.width}}>
        <UTitleBar smallPhone={smallPhone}
          headerText={I18n.t('bi_sells_datas')}
          onLeftPress={()=>{this.state.loading ? {} : Actions.pop()}}
          onRightPress={()=>{}}
          leftText={ ''}
          leftIconType={'return'}
          rightIconType={'none'}>
        </UTitleBar>
        <View style={{flexDirection:'row',height:68,alignContent:'center', paddingLeft:16,marginTop:(Platform.OS === 'ios')?34:10}}>
          {this.renderTypes()}
        </View>
        <View style={[{height:contentHeight,borderBottomColor:'#989DB0',borderBottomWidth:2,justifyContent:'space-between'}]}>
            <View style = {[styles.shadowStyle,styles.container,{height:324}]}>
                {this.renderDatePickArea()}
                {this.renderChartArea()}
            </View>
            <ScrollView>
              {this.renderContent()}
            </ScrollView>
        </View>
        <View style={{flexDirection:'row',width:screen.width,justifyContent:'flex-start',
                     borderTopWidth:0.3,borderTopColor:'#ffffff44',paddingLeft:13,paddingRight:13,
                     width:screen.width,height:60}}>
          <Tab id={"bi_sale_values"} smallPhone={smallPhone} fontColor={bright_blue} color={bright_blue} text={I18n.t("bi_sale_values")} selected={mode}
            onPress={()=>{this.setState({mode:"bi_sale_values"});
                        this.state.mode="bi_sale_values";
                        this.state.widgetList = this.getWidgets(this.state.typeIndex,this.state.mode);
                        this.fetchData()}}></Tab>
          <Tab id={"bi_shopper_count"} smallPhone={smallPhone} fontColor={white} text={I18n.t("bi_shopper_count")} color={bright_blue} selected={mode}
            onPress={()=>{this.setState({mode:"bi_shopper_count"});
                        this.state.mode="bi_shopper_count";
                        this.state.widgetList = this.getWidgets(this.state.typeIndex,this.state.mode);
                        this.fetchData();}}></Tab>
        </View>
        <Spinner visible={this.state.loading} />
        <DatePicker ref={"datePicker"} mode={true} initDate={new Date(this.state.date)} onSelected={(date)=>this.onDateSelected(date)}/>
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
    alignContent:'center',
    backgroundColor:'#FFF',
    borderRadius:10
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
  shadowStyle:{
    shadowColor: "rgba(0,0,0,0.16)",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.50,
    shadowRadius: 1.41,
    elevation: 2,
  },
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
    alignContent:'center',
    paddingLeft:16,
    backgroundColor:'#FFF',
    borderRadius:10
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
  shadowStyle:{
      shadowColor: "rgba(0,0,0,0.16)",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.50,
      shadowRadius: 1.41,
      elevation: 2,
    },
});
