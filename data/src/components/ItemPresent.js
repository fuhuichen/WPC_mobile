import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import KPIComponent from '../components/KPIComponent'
import {PieChart} from 'react-native-svg-charts'
import UpperButton from '../components/UpperButton'
import Tab from '../components/Tab';
// import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import {Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LineChart from '../components/chart-kit/LineChart';
import DataHandler from '../utils/DataHandler'
import DropDownSelect from '../components/DropDownSelect';
import ImageButton from '../components/ImageButton';
import PieChartWithCenteredLabels from '../components/chart-kit/PieChartWithCenteredLabels';

import moment from 'moment';
import PosRestClient from '../utils/posclient'
import Spinner from '../components/Spinner';
import {inject, observer} from 'mobx-react'
import DatePicker from "../../../app/thirds/datepicker/DatePicker";
import Svg,{ Circle} from 'react-native-svg'
import {getBottomSpace} from 'react-native-iphone-x-helper'

function sortNumber(item1, item2, attr, order) {
  var val1 = item1[attr],
      val2 = item2[attr];
  if (val1 == val2) return 0;
  if (val1 > val2) return 1*order;
  if (val1 < val2) return -1*order;
}

const Labels=({slices,height,width })=>{
  return slices.map((slice, index) => {
    const { labelCentroid, pieCentroid, data } = slice;
    return (
      <Text
        key={index}
        x={pieCentroid[ 0 ]}
        y={pieCentroid[ 1 ]}
        fill={'white'}
        textAnchor={'middle'}
        alignmentBaseline={'middle'}
        fontSize={24}
        stroke={'black'}
        strokeWidth={0.2}
      >
        {data.amount}
      </Text>
    )
  })
}

type Props = {
    onLoading: boolean
}

@inject('store')
@observer
export default class ItemPresent extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    var d = new Date();
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
      data:null,
      type:"bi_sale_values",
      date,
      nowDate: date,
      lastDate: true,
      types:['日','周','月','季'],
      range:'dd',
      unit:'hh',
      typeIndex:0,
      compares:[I18n.t("bi_counts_stat"),I18n.t('比例統計')],
      items:null,
      itemIndex:0,
      compareIndex:0,
      tab:'rank',
      loading:false,
      loading_err:false,
      loading_nodata:false,
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData(){
    //console.log('fetchdata')
    const api = new PosRestClient();
    const {date,range,unit} = this.state;
    const token = this.props.store.userSelector.token;
    const accountId = this.props.store.userSelector.accountId;
    const tempReportStore = this.props.store.storeSelector.tempReportStoreBI;

    var promises = [];
    this.props.onLoading(true);
    //let items = [{item_name:'a',qty:100,total:200,amount:300},{item_name:'b',qty:40,total:50,amount:150},{item_name:'c',qty:80,total:200,amount:300}]
    this.setState({loading:true,items:null,data:null,loading:true, loading_err:false, loading_nodata:false, })
    //console.log(userInfo)
    // console.log(tempReportStore);
    api.getItemData(accountId,token,[tempReportStore.register_key]
      ,DataHandler.ceateDatePeriod(date,range),range).then(response => response)   // Successfully logged in
      .then(res=>{
        //console.log("getItemData, ", res);
        this.handleItemData(res)
        this.props.onLoading(false);
        this.setState({loading:false});
    })    // Remember your credentials
    .catch(err =>{
      console.log(err)
      this.props.onLoading(false);
      this.setState({loading: false, loading_err:true});
    });  // Catch any error
    api.getItemData(accountId,token,[tempReportStore.register_key]
      ,DataHandler.ceateDatePeriod(date,range),unit).then(response => response)   // Successfully logged in
      .then(res=>{
        //console.log(res )
        if(res&& res.datas && res.datas[0] && res.datas[0].retrived){
          var retrived = res.datas[0].retrived;
           // combine by item_name
           for(var n in retrived) {
             if(retrived[n].statistic && retrived[n].statistic.item_statics) {
               var data_tmp = retrived[n].statistic.item_statics;
               var data = [];
               for(var k in data_tmp) {
                 var isNew = true;
                 for(var j in data) {
                   if(data_tmp[k].item_name == data[j].item_name) {
                     isNew = false;
                     data[j].qty += data_tmp[k].qty;
                     data[j].amount += data_tmp[k].amount ? data_tmp[k].amount : data_tmp[k].qty * data_tmp[k].unit_price;
                   }
                 }
                 if(isNew) {
                   data.push(data_tmp[k]);
                 }
               }
               retrived[n].statistic.item_statics = data;
             }
           }
           
           this.setState({data: retrived});
        }
    })    // Remember your credentials
    .catch(err =>{
      console.log(err);
      this.props.onLoading(false);
      this.setState({loading: false, loading_err:true});
    });  // Catch any error
  }

  promiseRequests(promises){
    var handle = function(results){
      this.handleResults(results)
    }.bind(this)
    var doFail = function(){
      this.props.onLoading(false);
      this.setState({loading:false})
    }.bind(this)
    Promise.all(promises)
    .then(function(data){
      handle(data);
    })
    .catch(function(err){
      doFail();
    });
  }

  handleResults(results){
    console.log('handleResults');
  }

  renderPage(pageData, pageId, layout) {
    console.log('render page',pageId);
    return (
      <KPIComponent type= {pageData}/>
    );
  }

  renderData(){
    const screen = Dimensions.get('window')
    if(this.state.compareIndex == 0) {
      return (
        <View style={{marginLeft:16,width:screen.width-32,marginTop:16}}>
          {this.renderColorBar()}
        </View>
      );
    } else {
      return this.renderPie();
    }
  }

  handleItemData(data){
    if( data && data.datas && data.datas[0] && data.datas[0].retrived &&
        data.datas[0].retrived[0] && data.datas[0].retrived[0].statistic &&
        data.datas[0].retrived[0].statistic.item_statics) {
      var items_tmp = data.datas[0].retrived[0].statistic.item_statics;
       var items = [];
      // combine by item_name
      for(var k in items_tmp) {
        var isNew = true;
        for(var j in items) {
          if(items_tmp[k].item_name == items[j].item_name) {
            isNew = false;
            items[j].qty += parseInt(items_tmp[k].qty);
            items[j].total += items_tmp[k].amount ? items_tmp[k].amount : items_tmp[k].qty * items_tmp[k].unit_price;
            items[j].amount += items_tmp[k].amount ? items_tmp[k].amount : items_tmp[k].qty * items_tmp[k].unit_price;
          }
        }
        if(isNew) {
          items_tmp[k].qty = parseInt(items_tmp[k].qty);
          items_tmp[k].unit_price = parseInt(items_tmp[k].unit_price);
          items_tmp[k].total = items_tmp[k].amount ? items_tmp[k].amount : items_tmp[k].qty * items_tmp[k].unit_price;
          items.push(items_tmp[k]);
        }
      }
      this.setState({itemIndex:0,items:items.sort((a,b)=>sortNumber(a,b,(this.state.tab == 'rank')?'qty':'total',-1))});
    }
  }

  renderPie() {
    const {typeIndex,items}=this.state;
    const screen = Dimensions.get('window')
    if(!items || items.length<1){
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
    };
    //if(!items || items.length<1)return null;
    //console.log(items)
    
    var tempItems =JSON.parse(JSON.stringify(items))
    var subItem = tempItems.splice(0, items.length>4?5:items.length);
    var prop = (this.state.tab== 'rank')?'qty':'total';
    var circleRadius =screen.width/2 -20
    var data = [ ]
    var sum = 0;
    for(var k in items){
       sum = sum + items[k][prop];
    }
    //console.log('Totalmount-',sum);
    var allPer =0;
    for(var k in subItem){
       var v = (subItem[k][prop] *100 ) /sum;
       v =Math.round(v);
       data.push( v );
       subItem[k].per =v;
       allPer =allPer + v;
    }
    if(100-allPer>0&& subItem.length>5){
        data.push(100-allPer );
        subItem.push({item_name:'其他'})
    }

    const randomColor = () => ('#' + (Math.random() * 0xFFFFFF << 0).toString(16) + '000000').slice(0, 7)
    const pieData = data
        .filter(value => value >= 0)
        .map((value, index) => ({
          value,
          svg: {
            fill: VALUES.COLORMAP.rank_bar[index],
            onPress: () =>{console.log('test');this.setState({itemIndex:index})},
            
          },
          key: `pie-${index}`,
        }))
      const pieData2 = data
        .filter(value => value >= 0)
        .map((value, index) => ({
          value,
          svg: {
            fill: 'white',
            onPress: () => console.log('press', index),
            stroke:"#C3C4C5",
            strokeWidth:"1",
            strokeDasharray:[5]
          },
          key: `pie-${index}`,
        }))
    const label =['手作黃金珍珠鮮奶茶','手作白玉珍珠鮮奶茶','翠玉茶','珍珠拿鐵','烏龍茶','其他'];
    var nodes = data.map(function(c,i){
    return (<TouchableOpacity
              onPress={()=>{this.setState({itemIndex:i})}}
              style={{height:30,flexDirection:'row',paddingRight:16}} >
              <View style={{width:10,height:10,borderRadius:10,
                marginTop:3,marginRight:5,
                backgroundColor:VALUES.COLORMAP.rank_bar[i]}}></View>
              <View style={{flex:1,marginRight:10}}>
                <ScrollView  horizontal={true}>
                  <Text  allowFontScaling={false}  style={{color:VALUES.COLORMAP.dkk_gray,fontSize:12}}>{subItem[i].item_name}</Text>
                </ScrollView>
              </View>
              <Text  allowFontScaling={false} style={{color:VALUES.COLORMAP.dkk_gray,fontSize:12}}>{data[i]+'%'}</Text>
            </TouchableOpacity>)
    }.bind(this));
    let Width = screen.width-32;
    
    return (
      <View style={{flexDirection:'row',width:Width,height:200-44,marginTop:22,marginLeft:16}}>
          <View style={{flex:1}}>
            <View style={{width:156,height:156,position:'absolute',top:0,left:0}}>
              <PieChart
                width={140 }
                style={ { height: 156 } }
                data={ pieData }
                outerRadius={'90%'}
                innerRadius={'80%'}></PieChart>
            </View>
            <View style={{width:156,height:156,position:'absolute',top:0,left:0}}>
            <Svg width={Width} height={156}>
                <Circle
                     key={Math.random()}
                     //ref={x => (this.circle = x)}
                     cx={78}
                     cy={78}
                     r={78}
                     stroke="#C3C4C5"
                     strokeWidth={1}
                     fill="transparent"
                     strokeDasharray={[5, 4]}
                     strokeLinecap="round"
                />
                <Circle
                     key={Math.random()}
                     //ref={x => (this.circle = x)}
                     cx={78}
                     cy={78}
                     r={55}
                     stroke="#C3C4C5"
                     strokeWidth={1}
                     fill="transparent"
                     strokeDasharray={[5, 4]}
                     strokeLinecap="round"
                />
            </Svg>
            </View>
          </View>
          <View style={{flex:1,justifyContent:'center',marginLeft:32,alignSelf:'center'}}>
            {nodes}
          </View>
        </View>
    )
    
  }

  renderCircle(){
    var data = [ ]
    var sum = 0;
    for(var k in this.state.data){
      sum = sum +this.state.data[k]
    }
    for(var k in this.state.data){
      var v = (this.state.data[k] *100 ) /sum;
      v =Math.floor(v);
      data.push( v )
    }

    var pieData = data.map(function(value,index) {
      var color = VALUES.COLORMAP.rank_bar[index];
      console.log(color);
      return {
        value,
        svg: {
          fill: color,
          onPress: () => console.log('press', index),
        },
        key: `pie-${index}`,
      }
    }.bind(this))
    // console.log(pieData)
    const label =['手作黃金珍珠鮮奶茶','手作白玉珍珠鮮奶茶','翠玉茶','珍珠拿鐵','烏龍茶','其他'];
    const screen = Dimensions.get('window')
    var nodes = data.map(function(c,i){
      return (
        <View style={{height:30}} >
          <Text  allowFontScaling={false}  style={{color:VALUES.COLORMAP.white,fontSize:16}}>{label[i]}</Text>
          <View style={{flex:1}}></View>
          <Text  allowFontScaling={false} style={{color,fontSize:16}}>{data[5-i]+'%'}</Text>
        </View>)
    });

    return (
      <View style={{flexDirection:'row',width:screen.width,height:screen.width/2}}>
        <View style={{width:screen.width/2,height:screen.width/2}}>
          <PieChart
            innerRadius={'84%'}
            style={ { height:screen.width} }
            data={ pieData }/>
        </View>
        <View style={{width:screen.width/2,height:screen.width/2}}>
        </View>
      </View>)
  }

  renderColorBar(){
    const {data,items}= this.state;
    const screen = Dimensions.get('window');
    if(!items || items.length<1){
      return (
        <View style={{flex:3,width:screen.width,alignSelf:'center',flexDirection:'row'}}>
          <View style={{flex:1,justifyContent:'center',alignItems:'center',flexDirection:'column', marginTop:100}}>
            <Image source={require('../../images/loading_nodata.png')} style={{width:90,height:80}}/>
            <Text allowFontScaling={false} style={{textAlign:'center',color:'#9DA0AF',fontSize:18,paddingTop:20}}>
              {I18n.t("bi_nodata")}
            </Text>
          </View>
        </View>
      )
    };
    //console.log(items)
    
    var tempItems =JSON.parse(JSON.stringify(items));
    var subItem = tempItems.splice(0, items.length>4?5:items.length);
    var prop = (this.state.tab== 'rank')?'qty':'total';
    var nodes = subItem.map(function(c,i) {
      var color = VALUES.COLORMAP.rank_bar[i];
      var width = ((screen.width-32)  *c[prop] ) /subItem[0][prop];
      return  <TouchableOpacity style={{width:screen.width-32}} onPress={()=>{this.setState({itemIndex:i})}}>
                <View style={{flexDirection:'row',alignItems:'center'}}>
                  <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font,fontSize:16}}>{(i+1)+' '+ c.item_name}</Text>
                  <View style={{flex:1}}></View>
                  <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font,fontSize:16}}>{parseFloat(c[prop]).toFixed(2).toString().replace(/\.00$/,'')}</Text>
                </View>
                <View style={{width:screen.width-32,marginTop:6, marginBottom:12, flexDirection:'row', alignItems:'center'}}>
                  <View style={{height:10,width,backgroundColor:color}}></View>
                </View>
              </TouchableOpacity>
    }.bind(this));
    return nodes;
  }

  changePage(index) {
    if(index == 0) {
      this.setState({type:"bi_sale_values"})
    } else if(index == 1) {
      this.setState({type:"bi_shopper_count"})
    } else if(index == 2) {
      this.setState({type:"bi_sales_count"})
    }
  }

  renderTypes(){
    const {compares,compareIndex,range} = this.state;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    const {clear_gray,light_gray, bright_blue,white,black,green} = VALUES.COLORMAP;
    const screen = Dimensions.get('window')
    var nodes  = compares.map(function callback(c,index){
      return  <UpperButton id={index}   smallPhone={smallPhone}
                selected={compareIndex}
                onPress={()=>{  this.setState({compareIndex:index});}}>
                {I18n.t(c)}</UpperButton>
     }.bind(this));
    return  <View style={{marginBottom:5,flexDirection:'row',width: screen.width ,justifyContent:'flex-start',height:50}}>
              {nodes}
            </View>
  }

  rendercompareIndex(){
    const {compares,compareIndex} = this.state;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    const {clear_gray,light_gray, bright_blue,white,black,green} = VALUES.COLORMAP;
    const screen = Dimensions.get('window')
    var nodes  =compares.map(function callback(c,index){
      var extraStyle = {};
      if(index == 0){
        extraStyle = {borderBottomLeftRadius:15,borderTopLeftRadius:15};
      }
      if( index == compares.length-1){
        extraStyle = {borderBottomRightRadius:15,borderTopRightRadius:15};
      }
      if(compareIndex == index){
        return  <TouchableOpacity onPress={()=>{  this.setState({compareIndex:index})}}
                  style={[extraStyle,{width:70, backgroundColor:VALUES.COLORMAP.deadline_red,
                  flexDirection:'row',justifyContent:'center',alignItems:'center'}]}>
                  <Text  allowFontScaling={false} style={{color:VALUES.COLORMAP.white}}> {c}</Text>
                </TouchableOpacity >
      } else{
        return  <TouchableOpacity onPress={()=>{  this.setState({compareIndex:index})}}
                  style={[extraStyle,{width:70,borderWidth:1,borderColor:VALUES.COLORMAP.deadline_red,
                  flexDirection:'row',justifyContent:'center',alignItems:'center'}]}>
                  <Text  allowFontScaling={false} style={{color:VALUES.COLORMAP.deadline_red}}> {c}</Text>
                </TouchableOpacity >
      }
     }.bind(this));
    return  <View style={{marginBottom:20,flexDirection:'row',width: screen.width ,justifyContent:'center',height:30}}>
              {nodes}
            </View>
  }

  changeType(index){
    this.setState({typeIndex:index});
    this.state.typeIndex=index;
    //this.fetchData();
  }

  changeRange(id){
    var list = ['dd','ww','mm'];
    var units= ['hh','dd','dd'];
    this.setState({range:list[id],unit:units[id]})
    this.state.range=list[id]
    this.state.unit=units[id]
    this.fetchData();
  }

  previousDate() {
    const {date,range} =this.state;
    var d = new Date();
    if(date){
      d = new Date(date);
    }
    if(range=='dd' ){
      d.setDate(d.getDate() - 1);
    } else if(range=='ww' ){
      d.setDate(d.getDate() - 7);
    } else if(range=='mm' ){
      d.setMonth(d.getMonth() - 1);
    } else if(range=='yyyy' ){
      d.setYear(1900+d.getYear() - 1);
    }
    this.setState({date:moment(d).format('YYYY/MM/DD'), lastDate: false}, function() {
      this.fetchData();
    });
  }

  nextDate() {
    const {date,range,lastDate} =this.state;
    if(lastDate) {
      return;
    }
    var d = new Date();
    if(date) {
      d = new Date(date);
    }
    if(range=='dd'){
      d.setDate(d.getDate() + 1);
    } else if(range=='ww') {
      d.setDate(d.getDate() + 7);
    } else if(range=='mm') {
      d.setMonth(d.getMonth() + 1);
    } else if(range=='yyyy') {
      d.setYear(1900 + d.getYear() + 1);
    }
    if(d > new Date(this.state.nowDate)) {
      d = new Date(this.state.nowDate);
    }
    this.setState({date:moment(d).format('YYYY/MM/DD'), lastDate: (new Date(this.state.nowDate) <= d)}, function() {
      this.fetchData();
    });
  }

  changeRange(id){
    var list = ['dd','ww','mm'];
    var units= ['hh','dd','dd'];
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

    this.setState({range: list[id], unit: units[id], lastDate}, function() {
      this.fetchData();
    })
  }

  renderRangeSelect(){
    const screen = Dimensions.get('window');
    var width = screen.width < 340 ? 70 : 80;
    var list = [];
    list.push(DataHandler.unitToString('dd'));
    list.push(DataHandler.unitToString('ww'));
    list.push(DataHandler.unitToString('mm'));

    return (
      <View style={{flex:1,alignSelf:'center',alignItems:'flex-end' }}>
        <DropDownSelect changeType={(id)=>this.changeRange(id)}
                        defaultIndex={0}
                        width={width}
                        list={list}
                        content={DataHandler.unitToString(this.state.range)}/>
      </View>)
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
      }.bind(this),20);
  }

  renderChart(){
    const {typeIndex,items,loading,range,unit,itemIndex,date,data}=this.state;
    const screen = Dimensions.get('window')
    if(loading) return (
      <View style={{height:300, flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
      </View>
    );
    //let data = [{date_time:'11:00',statistic:{item_statics:[{item_name:'a',amount:10,qty:5,unit_price:5},{item_name:'b',amount:20,qty:10,unit_price:10},{item_name:'c',amount:20,qty:15,unit_price:20}]}},
    //{date_time:'12:00',statistic:{item_statics:[{item_name:'a',amount:1,qty:5,unit_price:5},{item_name:'b',amount:50,qty:10,unit_price:10},{item_name:'c',amount:4,qty:15,unit_price:20}]}}]
    
    if(!data || !items || items.length<1 ) return (
      <View style={{height:300, flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
        <Text allowFontScaling={false} style={{color:'#64686D',fontSize:26}}>
          {I18n.t("bi_no_data")}
        </Text>
      </View>);
    var width = screen.width;
    var height = (screen.width * 9 )/16 +12;
    var input={
      labels: [''],
      labels2: [''],
      datasets: [{
        data: [0]}]
    }

    var item = items[itemIndex].item_name;
    //console.log('REnderchart',data)
    var prop = (this.state.tab== 'rank')?'qty':'total';
    var yUnit = (this.state.tab== 'rank')?I18n.t("bi_items"):I18n.t("bi_prices");
    console.log('render chart',prop)
    
    for(var k in data) {
      input.labels.push(DataHandler.getDateLabel(data[k].date_time,unit));
      input.labels2.push('')
      var v =0;
      for(var n in data[k].statistic.item_statics) {
        if(data[k].statistic.item_statics[n].item_name==item) {
          data[k].statistic.item_statics[n].total = data[k].statistic.item_statics[n].amount ?
            data[k].statistic.item_statics[n].amount : data[k].statistic.item_statics[n].qty * data[k].statistic.item_statics[n].unit_price;
          if(data[k].statistic.item_statics[n][prop])
            v = data[k].statistic.item_statics[n][prop]
        }
      }
      input.datasets[0].data.push(v)
    }
    var title ='';
    if(itemIndex==0) {
      if(range=='dd' ) {
        title ='('+ I18n.t("bi_day_top") +')';
      } else if(range=='ww' ){
        title ='('+ I18n.t("bi_month_top") +')';
      } else if(range=='mm' ){
        title ='('+ I18n.t("bi_month_top") +')';
      }
    }
    var isWeekend = [];
    if(range=='mm') {
      for(var i=0 ; i<input.labels.length ; ++i) {
        var day = new Date(date.split('/')[0] + "/" + date.split('/')[1] + "/" + input.labels[i]);
        if(day.getDay() == 6 || day.getDay() == 0) { isWeekend.push(1); }
        else { isWeekend.push(0); }
      }
      input.isWeekend = isWeekend;
    }
    return (
      <View style={{marginBottom:10}} horizontal={true}>
        <View style={{marginLeft:16,marginTop:16,marginBottom:10, flexDirection:'row',alignItems:'center'}}>
          <Image style={{width:32,height:32}} source={require('../../images/3_pic.png')}/>
          <Text allowFontScaling={false} style={{marginLeft:5,color:'#64686D',fontSize:20}}>{item}</Text>
          <Text allowFontScaling={false} style={{marginLeft:5,color:'#64686D',fontSize:14}}>{title}</Text>
        </View>
      <View style={{flexDirection:'row',marginLeft:5}}>
        <Text allowFontScaling={false} style={{marginLeft:10,color:'#64686D',fontSize:12}}>{yUnit}</Text>
        <View style={{flex:1}}/>
        <Text allowFontScaling={false} style={{marginRight:5,color:'#64686D',fontSize:12}}>{''}</Text>
      </View>
      <LineChart
        viewNumber={true}
        data={input}
        width={Dimensions.get('screen').width} // from react-native
        height={150}
        showLine={true}
        uniqueUnit={true}
        renderEndlabel ={true}
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
          marginLeft:3,
          marginVertical: 8,
          borderRadius: 0
        }}
        textFloat={true}
      />
      </View>);
  }

  changeOrder(tab) {
    console.log('change order',tab);
    if(this.state.items && this.state.items.length>0) {
      var items =this.state.items.sort((a,b)=>
        sortNumber(a,b,(tab == 'rank')?'qty':'total',-1));
      console.log(items);
      this.props.onLoading(true);
      this.setState({loading:true});
      setTimeout(function(){
        this.props.onLoading(false);
        this.setState({loading:false,itemIndex:0,tab,items})
      }.bind(this),100)
    } else {
      this.setState({tab});
    }
  }

  render() {
    const {styles,type,date,range,typeIndex,tab,itemIndex,lastDate,compareIndex} = this.state;
    const {clear_gray,light_gray, bright_blue,white,black} = VALUES.COLORMAP;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    var gap
    console.log('Render Type ',type)
    if(smallPhone){
      gap=60;
    }
    else{
        gap=60;
    }
    const screen = Dimensions.get('window');
    var dateFontSize = 18;
    if(screen.width < 340) {
          dateFontSize = 14;
    }
    else if(screen.width < 380) {
         dateFontSize = 16;
    }
    let Height = (Platform.OS === 'ios') ? ((VALUES.isIPhoneX) ? screen.height-150 : screen.height-104-getBottomSpace()):screen.height-70;
    if(this.state.hiding){
      return    <View style={{flex:1,backgroundColor:VALUES.COLORMAP.dkk_background,
        width:screen.width}}/>;
    }
    return (
      <View style={{backgroundColor:VALUES.COLORMAP.dkk_background,height:Height,width:screen.width}}>
        <View style={{flexDirection:'row',height:68,alignContent:'center', paddingLeft:16,marginTop:0}}>
          {this.renderTypes()}
        </View>
        <ScrollView style={[{height:screen.height-104-68-83-10,marginTop:10}]}>
        <View style={{height:569}}>
            <View style = {[styles.shadowStyle,styles.container,{height:(compareIndex==1)?234:296}]}>
                {this.renderDatePickArea()}
                {this.renderData()}
            </View>
            <View style = {[styles.shadowStyle,styles.container,{height:241,marginTop:16}]}>
              {this.renderChart()}
            </View>
        </View>
        </ScrollView>
        <View style={{
           flexDirection:'row',width: screen.width ,
           justifyContent:'flex-start',
           borderTopWidth:1,borderTopColor:'#989DB0',
           paddingLeft:13,paddingRight:13,
           width:screen.width,height:83}}>
          <Tab id={'rank'} smallPhone={smallPhone}
                           fontColor={'#D3D4D6'}
                           color={bright_blue}
                           text={I18n.t("bi_rank_sell_count")}
                           selected={tab} onPress={()=>{this.changeOrder('rank')}}></Tab>
          <Tab id={'sale'} smallPhone={smallPhone}
                           fontColor={'#D3D4D6'}
                           text={I18n.t("bi_rank_sell_value")}
                           color={bright_blue} selected={tab} onPress={()=>{this.changeOrder('sale')}}></Tab>
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
        }
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
          }

});
