import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import UshopRestClient from '../utils/webclient'
import KPIComponent from '../components/KPIComponent'
import UpperTab from '../components/UpperTab'
import UpperButton from '../components/UpperButton'
import {Platform,Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import moment from 'moment'
import DataHandler from '../utils/DataHandler'
import DropDownSelect from '../components/DropDownSelect';
import ImageButton from '../components/ImageButton';
import Spinner from '../components/Spinner';
import PosRestClient from '../utils/posclient'
import {Actions} from "react-native-router-flux";
import * as storeSync from "react-native-simple-store";
import {inject, observer} from 'mobx-react'
import DatePicker from "../../../app/thirds/datepicker/DatePicker";
import Toast, {DURATION} from 'react-native-easy-toast';
import {getBottomSpace} from 'react-native-iphone-x-helper'

type Props = {
    onLoading: boolean
}

@inject('store')
@observer
export default class CustomHeatmap extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    var d = new Date();
    var widgetList= this.getWidgets(0);
    var date = moment(d).format('YYYY/MM/DD');
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    var styles;
    if(smallPhone) {
      styles = smallStyles
    } else {
      styles = largeStyles
    }
    this.state = {
      styles,
      types:['bi_peoplecount_pass','bi_peoplecount_in',"bi_shopper_count"],
      typeIndex:0,
      widgetList,
      dateType:'ww',
      range:'dd',
      unit:'hh',
      date,
      nowDate: date,
      lastDate: true,
      loading:false,
      loading_err:false,
      loading_nodata:false,
      max:1,
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  getWidgets(typeIndex){
    const widgetList = this.props.store.widgetSelector.list;
    var list=[];
    if(typeIndex ==0) {
      //list.push(widgetList[1]); //進店率
      //list.push(widgetList[0]); //客流量
      list.push(widgetList[9]); //客流量
    } else if(typeIndex ==1) {
      list.push(widgetList[0]); //客流量
    }
    return list;
  }

  renderPage(pageData, pageId, layout) {
    //console.log('render page',pageId)
    return (
      <KPIComponent type= {pageData}/>
    );
  }

  changeRange(id){
    var options = ['ww','mm'];
    var list = ['dd','ww'];
    var units= ['hh','wd'];
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
    }
    lastDate = (nowDate <= date);
    this.setState({dateType:options[id],range:list[id],unit:units[id],lastDate}, function() {
      this.fetchData();
    })
  }

  previousDate(){
    const {date,range,dateType} = this.state;
    var d = new Date();
    if(date){
      d = new Date(date);
    }
    if(dateType=='ww') {
      d.setDate(d.getDate() - 7);
    } else if(dateType=='mm') {
      d.setMonth(d.getMonth() - 1);
    }
    this.setState({date:moment(d).format('YYYY/MM/DD'), lastDate: false}, function() {
      this.fetchData();
    })
  }

  nextDate(){
    const {date,range,dateType,lastDate} =this.state;
    if(lastDate) {
      return;
    }
    var d = new Date();
    if(date) {
       d = new Date(date);
    }
    if(dateType=='ww') {
       d.setDate(d.getDate() + 7);
    } else if(dateType=='mm') {
       d.setMonth(d.getMonth() + 1);
    }
    if(d > new Date(this.state.nowDate)) {
      d = new Date(this.state.nowDate);
    }
    this.setState({date:moment(d).format('YYYY/MM/DD'), lastDate: (new Date(this.state.nowDate) <= d)}, function() {
      this.fetchData();
    })
  }

  renderRangeSelect(){
    const screen = Dimensions.get('window')
    var width = screen.width < 340 ? 70 : 80;
    var list = [];
    list.push(DataHandler.unitToString('ww'))
    list.push(DataHandler.unitToString('mm'))
    return (  <View style={{flex:1,alignSelf:'center',alignItems:'flex-end' }}>
                <DropDownSelect changeType={(id)=>this.changeRange(id)}
                    defaultIndex={0}
                    width={width}
                    list={list}
                    content={DataHandler.unitToString(this.state.dateType)}/>
              </View>)
  }

  fetchData() {
    //console.log('fetchdataxxx')
    const api = new UshopRestClient();
    const {date,range,unit,widgetList,typeIndex,dateType} = this.state;
    const token = this.props.store.userSelector.token;
    const accountId = this.props.store.userSelector.accountId;
    const tempReportStore = this.props.store.storeSelector.tempReportStoreBI;

    var promises = [];
    this.props.onLoading(true);
    this.setState({loading:true,loading_err:false,loading_nodata:false,data:null});
    if(typeIndex==2) {
      const posapi = new PosRestClient();
      if(dateType == 'ww') {
        var d = new Date();
        if(date) {
          d = moment(date, 'YYYY/MM/DD').toDate();
        }
        var wd =(d.getDay()+6)%7;
        d.setDate(d.getDate() - wd);
        for(var n=0 ; n<7 ; n++) {
          var tdate = moment(d).format('YYYY/MM/DD');
          promises.push(posapi.getItemData(accountId,
            token,[tempReportStore.register_key],
            DataHandler.ceateDatePeriod(tdate,range),unit));
          d.setDate(d.getDate() + 1);
        }
      } else {
        var dd = new Date(date);
        var cm = dd.getMonth();
        dd.setDate(1);
        var wd = (dd.getDay()+6)%7;
        dd.setDate(dd.getDate() - wd);
        for(var n=0 ; n<7 ; n++) {
          var sdate = moment(dd).format('YYYY/MM/DD');
          var edate = moment(dd).format('YYYY/MM/DD');
          promises.push(posapi.getItemData(accountId,
            token, [tempReportStore.register_key],
            DataHandler.ceateDatePeriod(sdate,range),unit))
          dd.setDate(dd.getDate() +7);
          if(cm!= dd.getMonth())break;
        }
      }
    } else {
      for(var k in widgetList) {
        var widget = widgetList[k];
        var req = DataHandler.createHeatmapRequest(token,widget.data_source,
          range, unit, new Date(date),tempReportStore);
        promises.push(api.widgetData(req));
      }
    }
    this.promiseRequests(promises);
  }

  getMostHotTime() {
    const {data,max,range} = this.state;
    var index = -1;
    var mc = 0;
    if(data && data.datasets.length>0 && max>0) {
      for(var k in data.datasets) {
        var sum = 0;
        for(var n in data.datasets[k].data) {
          var l = ((100* data.datasets[k].data[n])/max)/17;
          if(l > 3) {
            sum = sum + 1;
          }
        }
        if(sum>0 && (sum> mc || index<0)) {
          index = k;
          mc = sum;
        }
      }
      if(range=='dd') {
        var wlist =DataHandler.getFullWeekList();
        return wlist[index];
      }
      return data.labels[index]+data.labels2[index];
    }
    return 'N/A';
  }

  getMostTime(){
    const {data,max,range} = this.state;
    var index = -1;
    var mc = 0;
    if(data &&data.datasets.length>0 && max>0){
      for(var k in data.datasets[0].data){
        var sum =0;
        for(var n in data.datasets){
          if(data.datasets[n].data[k]>0) {
            sum = sum + parseInt(data.datasets[n].data[k]);
          }
        }
        //console.log(index,'--',sum);
        if(sum>0 && (sum> mc || index<0)){
          //console.log('Change max-',k)
          index = parseInt(k);
          mc = sum;
        }
      }
      if( index<0 || !data.labels3[index] ) {
        return 'N/A';
      } else {
        if(range=='ww') {
          var wlist = DataHandler.getFullWeekList();
          return wlist[index];
        } else{
          return DataHandler.getHourRange(data.labels3[index]);
        }
      }
    }
    return 'N/A';
  }

  promiseRequests(promises){
    const {typeIndex} = this.state;
    var handle = function(results) {
      var index = results.length - 1;
      if(results[index].status == 1 || typeIndex == 2) {
        if(typeIndex==2) {
          this.handlePosResults(results)
        } else {
          this.handleResults(results)
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

  handlePosResults(results) {
    const {date,range,unit,widgetList,mode} = this.state;
    var max = 7;
    let data={
      labels: [],
      labels2: [],
      labels3: [],
      datasets: []
    };
    var weeklist = DataHandler.getSimpleWeekList();
    var d = new Date(date);
    var list = [];
    if(range == 'dd') {
      var wd =( d.getDay()+6)%7;
      d.setDate(d.getDate() -wd);
      for(var n= 0;n<7;n++) {
        var tdate  = moment(d).format('YYYY/MM/DD');
        var l = moment(d).format('MM/DD');
        data.labels.push(l);
        data.labels2.push(weeklist[n]);
        d.setDate(d.getDate() +1);
        var posResultList = [];
        //console.log("results[n]:",JSON.stringify(results[n]));
        if(results[n] && results[n].datas && results[n].datas[0] && results[n].datas[0].retrived){
          posResultList  = results[n].datas[0].retrived;
        }
        var output = DataHandler.parsePosData(posResultList,tdate,range,unit);
        //console.log("output:",output);
        for(var i in output.transaction_count) {
          if(parseInt(output.transaction_count[i]) > max ) {
            max = parseInt(output.transaction_count[i]);
          }
        }
        data.datasets.push({data:output.transaction_count});
      }
      for(var z =0;z<24;z++){
        data.labels3.push(''+z + ':00');
      }
      //data = DataHandler.fixNegtiveDataHeatmap(data);
    } else if(range == 'ww') {
      data.labels3 =DataHandler.getSimpleWeekList();
      var dd = new Date(date);
      var cm = dd.getMonth();
      dd.setDate(1);
      var wd =( dd.getDay()+6)%7
      dd.setDate(dd.getDate() -wd);
      for(var n= 0;n<7;n++){
        var sdate  = moment(dd).format('MM/DD');
        dd.setDate(dd.getDate() +6);
        var edate  = moment(dd).format('MM/DD');
        data.labels.push(sdate+' -'+edate);
        data.labels2.push(' ');
        dd.setDate(dd.getDate() +1);
        var posResultList = [];

        if(results[n] && results[n].datas && results[n].datas[0] && results[n].datas[0].retrived) {
          posResultList  = results[n].datas[0].retrived;
        }
        var output = DataHandler.parsePosData(posResultList,sdate,range,unit);
        for(var i in output.transaction_count) {
          if(parseInt(output.transaction_count[i])>max) {
            max =parseInt(output.transaction_count[i]);
          }
        }
        data.datasets.push({data:output.transaction_count});
        if(cm!= dd.getMonth()) break;
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
    this.props.onLoading(false);
    this.setState({
      loading:false,
      loading_nodata:checkNoData,
      max,
      data,
    })
  }

  handleResults(results) {
    const {date,range,unit,widgetList,typeIndex} = this.state;
    var data = {
      labels: [],
      labels2: [],
      labels3: [],
      datasets: []
    };
    var max = 1;
    var dataset_turningRate = [],
        dataset_walkin = [],
        dataset_walkby = [];
    for(var k in results) {
      if(results[k].status !=1) {
        return;
      }
      var d = DataHandler.parseDataResponse(results[k], widgetList[k].data_source);
      /*
      if(typeIndex == 0) {
        if(widgetList[k].title == "bi_turnin_rate") {
          for(var n in d) {
            dataset_turningRate.push(d[n].row);
          }
          var datas = results[k].retrived[1].data;
          for(var i in datas) {
            var out = datas[i]['walkby'];
            if(out) {
              dataset_walkby.push(out.row);
            }
          }
        } else if(widgetList[k].title == '客流量') {
          for(var n in d) {
            dataset_walkin.push(d[n].row);
          }
        }
      } else
      */
      {
        for(var n in d) {
          data.datasets.push({data:d[n].row});
          for(var z in d[n].row) {
            if(d[n].row[z]>max) {
              max = d[n].row[z];
            }
          }
        }
      }
    }
    /*
    if(typeIndex == 0) {
      for(var i in dataset_walkin) {
        var tmpData = dataset_walkin[i];
        for(var j in tmpData) {
          if(tmpData[j] > 0) {
            if(dataset_turningRate[i][j] > 0) {
              tmpData[j] = parseInt(tmpData[j] / dataset_turningRate[i][j]);
            }
          } else if(tmpData[j] == 0) {
            if(dataset_walkby[i][j]) {
              tmpData[j] = dataset_walkby[i][j];
            }
          }
        }
        data.datasets.push({data:tmpData});
        for(var n in tmpData) {
          if(tmpData[n]>max) {
            max = tmpData[n];
          }
        }
      }
    }
    */
    if(range == 'dd') {
      var dd =  new Date(date);
      var wd = (dd.getDay()+6)%7
      dd.setDate(dd.getDate() - wd);
      var weeklist = DataHandler.getSimpleWeekList();
      for(var n=0 ; n<7 ; n++) {
        var tdate  = moment(dd).format('MM/DD');
        data.labels.push(tdate);
        data.labels2.push(weeklist[n]);
        dd.setDate(dd.getDate()+1);
      }
      for(var z=0 ; z<24 ; z++) {
        data.labels3.push('' + z + ':00');
      }
      //("1.data.labels3:",data.labels3);
      //data = DataHandler.fixNegtiveDataHeatmap(data);
    } else if(range == 'ww') {
      data.labels3 = DataHandler.getSimpleWeekList();
      var dd = new Date(date);
      var cm = dd.getMonth();
      dd.setDate(1);
      var wd = (dd.getDay()+6)%7;
      dd.setDate(dd.getDate() - wd);
      for(var n=0 ; n<7 ; n++) {
        var sdate = moment(dd).format('MM/DD');
        dd.setDate(dd.getDate() + 6);
        var edate = moment(dd).format('MM/DD');
        data.labels.push(sdate+' -'+edate);
        data.labels2.push(' ');
        dd.setDate(dd.getDate() +1);
        if(cm!= dd.getMonth()) break;
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
    this.props.onLoading(false);
    this.setState({loading:false, loading_nodata:checkNoData, max, data});
  }

  changeType(index) {
    this.setState({typeIndex:index}, function() {
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
      <View style={{width:screen.width-32, flexDirection:'row',height:40,alignItems:'center',alignContent:'center',marginLeft:16}}>
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
      }.bind(this),20)
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
                 this.fetchData();}}>{I18n.t(c)}</UpperButton>
    }.bind(this));
    //console.log('Render Types');
   return <View style={{marginBottom:5,flexDirection:'row',width: screen.width ,justifyContent:'flex-start',height:50}}>
        {nodes}
   </View>
 }

  getColor(level) {
    var div = Math.floor(level/16);
    if(div>5) div = 5;
    return VALUES.COLORMAP.dkk_colorbar[div];
  }

  renderColorBar(){
    var heads=[0,16,32,48,64,80]
    var headNodes = heads.map(function(c,i){
      return  <View style={{backgroundColor:this.getColor(c),
                width:40,height:10,justifyContent:'center',alignItems:'center'}} >
              </View>;
    }.bind(this));
    return  <View style={{flexDirection:'row',marginTop:17,marginBottom:13,justifyContent:'center'}}>
              <Text  allowFontScaling={false}  style={{fontSize:10,color:VALUES.COLORMAP.dkk_gray,marginRight:10}}>{DataHandler.unitToString("bi_simple_lowest")}</Text>
              {headNodes}
              <Text  allowFontScaling={false}  style={{fontSize:10,color:VALUES.COLORMAP.dkk_gray,marginLeft:10}}>{DataHandler.unitToString('最高')}</Text>
            </View>
  }

  renderTable() {
    const {typeIndex,data,range,max}=this.state;
    const screen = Dimensions.get('window');
    var width = screen.width;
    var height = (screen.width * 9 )/16 +1;
    if(!data) {
      return <View style={{marginBottom:10,width,height}}/>
    }
    var headNodes;
    var bodyNodes;
    var heads=data.labels3;
    //console.log("data.labels3:",heads)
    headNodes = heads.map(function(c,i){
      return  <View style={{backgroundColor:(i%2==0)?VALUES.COLORMAP.dkk_background:VALUES.COLORMAP.dkk_background2,
                width:50,height:30,justifyContent:'center',alignItems:'center', paddingTop:5,
                borderBottomWidth:0.3,
                borderBottomColor:'#FFF',
                borderRightWidth:0.5,
                borderRightColor:'#ffffff',}} >
                <Text  allowFontScaling={false}  style={{fontSize:10,color:VALUES.COLORMAP.dkk_gray}}>{c}</Text>
              </View>;
    });

    var frontNodes = data.labels.map(function(c,i) {
      var t1,t2;
      if(range=='dd') {
        t1 = c;
        t2 = data.labels2[i];
      } else {
        var rr  = c.split("-");
        t1 = ""+ rr[0];
        t2 = "-"+rr[1];
      }

      return <View style={{flexDirection:'column',flex:1,
               backgroundColor:VALUES.COLORMAP.dkk_background2,
               borderTopColor:'#F7F9FA',
               borderTopWidth:0.3,
               borderBottomWidth:0.3,
               borderBottomColor:'#FFF',
               borderRightWidth:0.5,
               borderRightColor:'#FFFFFF',}}>
               <View style={{ height:30,justifyContent:'center',alignItems:'center' }} >
                 <Text allowFontScaling={false} style={{fontSize:10,color:VALUES.COLORMAP.dkk_gray}}>{t1}</Text>
                 <Text allowFontScaling={false} style={{fontSize:10,color:VALUES.COLORMAP.dkk_gray}}>{t2}</Text>
               </View>
            </View>
    }.bind(this));
    var front = ( <View style={{width:screen.width,flexDirection:'row', backgroundColor:VALUES.COLORMAP.dkk_background2}}>
                    <View style={{borderBottomWidth:0.3,
                            borderBottomColor:'#FFFFFF',
                            borderRightWidth:0.5,
                            borderRightColor:'#FFFFFF',
                            width:50,height:30,justifyContent:'center',alignItems:'center', paddingTop:5,}} >
                      <Text allowFontScaling={false} style={{fontSize:10,color:VALUES.COLORMAP.dkk_gray}}>{I18n.t("bi_date")}</Text>
                    </View>
                    {frontNodes}
                  </View>
    )

    bodyNodes = data.labels.map(function(c,i) {
      var grids =data.datasets[i].data.map(function(cc,ii) {
        var value = cc;
        if(cc>10000)value = parseInt(cc/1000)+"K";
        if(value<=0)value ='-';
        return  <View style={{backgroundColor:(value=='-')? '#E3EAF2':this.getColor(Math.floor(cc*96/max)),
                  borderBottomWidth:0.3,
                  borderBottomColor:'#FFFFFF',
                  borderRightWidth:0.5,
                  borderRightColor:'#FFFFFF',
                  flex:1,height:30,justifyContent:'center',alignItems:'center'}} >
                  <Text  allowFontScaling={false}  style={{fontSize:12,color:VALUES.COLORMAP.white }}>{value}</Text>
                </View>;
      }.bind(this));
      return <View style={{flexDirection:'column',flex:1,
               backgroundColor:(i%2==0)?VALUES.COLORMAP.dkk_background:VALUES.COLORMAP.dkk_background2,
               borderBottomWidth:0.5,
               borderBottomColor:'#FFFFFF'}}>
               {grids}
             </View>
    }.bind(this));
    return (
      <View style={{flexDirection:'column',height:240}}>
        {front}
        <ScrollView >
          <View style={{flexDirection:'row',borderBottomWidth:0.3,borderColor:'#F7F9FA'}}>
           <View style={{flexDirection:'column',
           backgroundColor:VALUES.COLORMAP.dkk_background2,
           borderBottomWidth:0.3,
           borderBottomColor:'#ffffff',}}>
            {headNodes}
          </View>
          {bodyNodes}
          </View>
        </ScrollView>
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
        <View style={{flexDirection:'column',width:screen.width,height:280,alignSelf:'center',marginTop:14}}>
          {this.renderTable()}
          {this.renderColorBar()}
        </View>
      );
    }
  }

  renderContent() {
    const screen = Dimensions.get('window');
    if(this.state.loading_err || this.state.loading_nodata){
      return(
        <View style={{width:screen.width,height:screen.height-172-58-353-100}}>
        </View>
      )
    }else{
      return (
        <View>
          <View style={{flexDirection:'row',
                        alignItems:'center',
                        width:screen.width,
                        height:50,
                        marginTop:20,
                        borderTopWidth:0.5,
                        borderTopColor:'#989DB0',}}>
            <Image style={{width:21,height:20,marginLeft:18}} resizeMode={'contain'} source={require('../../images/passengerflow_hotspot_pic.png')} />
            <Text  allowFontScaling={false}  style={{marginLeft:13,fontSize:14,color:VALUES.COLORMAP.gray_font}}>
              {I18n.t('bi_most_popluar_time')}
            </Text>
            <View style={{flex:1}}/>
            <Text  allowFontScaling={false}  style={{fontSize:14,color:VALUES.COLORMAP.gray_font,marginRight:16}}>{this.getMostHotTime()}</Text>
          </View>
          <View style={{flexDirection:'row',
                        width:screen.width,
                        alignItems:'center',
                        height:50,
                        borderTopWidth:0.5,
                        borderTopColor:'#989DB0',}}>
            <Image style={{width:24,height:24,marginLeft:18}} resizeMode={'contain'} source={require('../../images/passengerflow_hot_pic.png')} />
            <Text allowFontScaling={false}  style={{marginLeft:10,fontSize:14,color:VALUES.COLORMAP.gray_font}}>
              {I18n.t("bi_most_hot_time")}
            </Text>
            <View style={{flex:1}}/>
            <Text  allowFontScaling={false}  style={{fontSize:14,color:VALUES.COLORMAP.gray_font,marginRight:16}}>{this.getMostTime()}</Text>
          </View>
        </View>
      )
    }
  }

  render() {
    const {styles,type,typeIndex,date,range,dateType,lastDate} = this.state;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    var gap;
    if(smallPhone){
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
    let Height = (Platform.OS === 'ios')?((VALUES.isIPhoneX) ? screen.height-290:screen.height-230-getBottomSpace()-5) : screen.height-230;
    return (
      <View style={{backgroundColor:VALUES.COLORMAP.dkk_background, width:screen.width, marginBottom:20,}}>
        <View style={{flexDirection:'row',height:68,alignContent:'center', paddingLeft:16,marginTop:10}}>
          {this.renderTypes()}
        </View>
        <View style={[{height:Height,borderBottomColor:'#989DB0',borderBottomWidth:2}]}>
            <View style = {[styles.shadowStyle,styles.container,{height:328}]}>
                {this.renderDatePickArea()}
                {this.renderChartArea()}
            </View>
            <ScrollView>
              {this.renderContent()}
            </ScrollView>
        </View>
        <Spinner visible={this.state.loading} />
        <DatePicker ref={"datePicker"} mode={true} initDate={new Date(this.state.date)} onSelected={(date)=>this.onDateSelected(date)}/>
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
    color:VALUES.COLORMAP.white
  },
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
    color:VALUES.COLORMAP.white
  },
  forgetPwdText: {
    textDecorationLine:'underline',
    paddingTop:2,
    paddingBottom:4,
    marginLeft:20,
    fontSize:10,
    alignItems:'center',
    justifyContent:'flex-end',
    color:VALUES.COLORMAP.white
  },
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
