import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import UshopRestClient from '../utils/webclient'
import KPIComponent from '../components/KPIComponent'
import UpperTab from '../components/UpperTab'
// import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import {
    Text,
    BackHandler,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import UTitleBar from '../components/UTitleBar'
import RadarChart from '../components/chart-kit/RadarChart';
import Spinner from '../components/Spinner';
import DataHandler from '../utils/DataHandler'
import PosRestClient from '../utils/posclient'
import moment from 'moment'
import ImageButton from '../components/ImageButton';
import DropDownSelect from '../components/DropDownSelect';
import {Actions} from "react-native-router-flux";
import * as storeSync from "react-native-simple-store";
import {inject, observer} from 'mobx-react'
import DatePicker from "../../../app/thirds/datepicker/DatePicker";
import Toast, {DURATION} from 'react-native-easy-toast';

function sortNumberbyTime(item1, item2, attr, order) {
    var val1 = item1.date[0],
        val2 = item2.date[0];
    if (val1 == val2) return 0;
    if (val1 > val2) return 1*order;
    if (val1 < val2) return -1*order;
}

@inject('store')
@observer
export default class PageAbstract extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.backHandler = null;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    var styles;
    if(smallPhone) {
      styles = smallStyles
    } else {
      styles = largeStyles
    }
    this.state = {
      styles,
      type:"bi_sale_values",
      types:['日','周','月','季'],
      typeIndex:0,
      compares:['同比一','同比二','同比三'],
      sale:0,
      userCount:0,
      priceAvg:0,
      indoorCount:0,
      turninRate:0,
      detail:false,
      origin:{
        sale:0,
        userCount:0,
        priceAvg:0,
        indoorCount:0,
        turninRate:0,
      },
      target:{
        sale:0,
        userCount:0,
        priceAvg:0,
        indoorCount:0,
        turninRate:0,
      },
      compare:{
        sale:0,
        userCount:0,
        priceAvg:0,
        indoorCount:0,
        turninRate:0,
      },
      compareIndex:0,
      date: moment(new Date()).format('YYYY/MM/DD'),
      nowDate: moment(new Date()).format('YYYY/MM/DD'),
      lastDate: true,
      range: 'dd',
      unit: 'dd',
      weather: {
        condition: -1,
        temp_high: 999,
        temp_low: 999
      }
    };
  }

  componentDidMount() {
    this.setState({loading:true});
    this.backHandler = BackHandler.addEventListener("pageAbstractBackPress", () => {
       if(this.state.loading){
           return true;
       }
    });
    const tempReportStore = this.props.store.storeSelector.tempReportStoreBI;
    this.getTarget(tempReportStore);
    this.fetchData();
  }

  getTarget(tempReportStore) {
    const token = this.props.store.userSelector.token;
    const api = new UshopRestClient();
    var d = new Date();
    var dateContent = moment(d).format('YYYY/MM/DD');
    var req = api.createListPropertyReq('sales_target',token,
    tempReportStore.store_id,'mm' ,dateContent )
    api.listProperty(req)
      .then(response=> this.OnListPropertySuccess(response))    // Remember your credentials
      .catch(err => this.OnListPropertyFail(err.message));  // Catch any error
  }

  OnListPropertyFail(msg){
    console.log("Get BusinessInfo Fail " + msg );
    this.setState({  loading: false});
  }

  OnListPropertySuccess(response){
    if(response.propertys.length>0){
      response.propertys =  response.propertys.sort((a,b)=>sortNumberbyTime(a,b,'date[0]',1));
      if( response.propertys[response.propertys.length-1].type  == 'sales_target'){
        var target = this.state.target;
        //console.log("***response.propertys:",response.propertys);
        if(this.state.range == 'ww') {
          target.sale = parseInt(response.propertys[response.propertys.length-1].data.weekend);
        } else {
          target.sale = parseInt(response.propertys[response.propertys.length-1].data.workday);
        }
        this.setState({target:target});
      }
    }
  }

  componentWillUnmount() {
    this.backHandler.remove();
  }

  fetchData(){
    this.setState({loading:true});
    const {range} = this.state;
  //  console.log("PageAbstract fetchdata time : ", moment().format("YYYY/MM/DD HH:mm:ss"));
    const api = new UshopRestClient();
    const token = this.props.store.userSelector.token;
    const widgetList = this.props.store.widgetSelector.list;
    const tempReportStore = this.props.store.storeSelector.tempReportStoreBI;

    var list=[];
    var promises = [];
    this.setState({loading:true})
    list.push(widgetList[0]) //客流量
    list.push(widgetList[1]) //進店率
    list.push(widgetList[16]) //天氣

    for(var k in  list){
      var widget = list[k];
      var isYesterday = widget.title=="天氣" ? false : true;
      var req = DataHandler.createSimpleRequest(token,widget.data_source,
        range, range, this.state.date,tempReportStore,false,isYesterday);
      promises.push(api.widgetData(req));
    }
    this.promiseRequests(promises,1);
  }

  fetchAvgData(){
    //console.log("PageAbstract fetchAvgData time : ", moment().format("YYYY/MM/DD HH:mm:ss"));
    const {range} = this.state;
    const api = new UshopRestClient();
    const token = this.props.store.userSelector.token;
    const widgetList = this.props.store.widgetSelector.list;
    const tempReportStore = this.props.store.storeSelector.tempReportStoreBI;

    var list = [];
    var promises = [];
    //list.push(widgetList[2]) //銷售
    list.push(widgetList[0]); //客流量
    //list.push(widgetList[3]) //交易筆數
    //list.push(widgetList[5]) //客單價
    list.push(widgetList[1]); //進店率

    for(var k in list) {
      var sdate = new Date(this.state.date);
      var widget = list[k];
      var req;
      if(range=='ww'){
        var dif = sdate.getDay() || 7 ;
        sdate.setDate(sdate.getDate() - dif + 1);
        sdate.setDate(sdate.getDate() -28);
        req = DataHandler.createMultiDateRequest(token,widget.data_source,
          'ww','ww',sdate,2,tempReportStore);
        req.data_source.data_range = "any";
        req.data_source.time_compare = "";
      }
      else{
        sdate.setDate(sdate.getDate() -29);
        req = DataHandler.createMultiDateRequest(token,widget.data_source,
          'dd','dd',sdate,28,tempReportStore);
        req.data_source.data_range = "any";
        req.data_source.time_compare = "";
      }
    //console.log('Abstract REQ='+JSON.stringify(req))


      var tmpDate = [];
      for(var i=0 ; i<req.data_source.date.length ; ++i) {
        if(i==0 || i==req.data_source.date.length-1) {
          tmpDate.push(req.data_source.date[i]);
        }
      }
      req.data_source.date = tmpDate;
      promises.push(api.widgetData(req));
    }
    this.promiseRequests(promises,2)
  //  console.log("PageAbstract fetchAvgData promises : ", promises);
  }

  promiseRequests(promises,index){

    var handle = function(results) {

      //console.log('Abstract handle'+JSON.stringify(results))
    //  console.log("PageAbstract promiseRequests time : ", moment().format("YYYY/MM/DD HH:mm:ss"));
      var result_index = results.length - 1;
      //console.log("PageAbstract promiseRequests results[index].status, ", results[result_index].status);

      if(results[result_index].status == 1) {
        if(index==1) {
          this.handleResults(results);
        } else {
          this.handleResults2(results);
        }
      } else {

        doFail()
      //  this.logout();
      }
    }.bind(this)
    var doFail = function() {
       this.setState({loading:false});
    }.bind(this)
    Promise.all(promises)
    .then(function(data){
      handle(data)})
    .catch(function(err){
      doFail()
     //console.log(err)
    //this.setState({loading:false})
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
    //console.log("PageAbstract handleResults results : ", results);
    const {target} = this.state;
    const widgetList = this.props.store.widgetSelector.list;

    var list=[];
    list.push(widgetList[0]) //客流量
    list.push(widgetList[1]) //進店率
    list.push(widgetList[16]) //天氣
    var indoorCount = 0, turninRate = 0;
    for(var k in results){
      if(results[k].status == 1){
        if(list[k].title == "天氣") {
          var weather = this.state.weather;
          weather.condition = results[k].retrived[0].data[0].conditions.row[0] || 0;
          weather.temp_high = results[k].retrived[0].data[0].high_temp_c.row[0] || 999;
          weather.temp_low = results[k].retrived[0].data[0].low_temp_c.row[0] || 999;
          this.setState({weather});
        } else if(list[k].title == "客流量") {
          var d = DataHandler.parseDataResponse(results[k], list[k].data_source);
          console.log("PageAbstract 客流量 d : ", d);
          indoorCount = d[d.length-1].row[0] > 0 ? d[d.length-1].row[0] : 0;
        } else if(list[k].title == "bi_turnin_rate") {
          var d = DataHandler.parseDataResponse(results[k], list[k].data_source);
          console.log("PageAbstract 進店率 d : ", d);
          turninRate = d[d.length-1].row[0] > 0 ? d[d.length-1].row[0] : 0;
        }
      } else {
        return;
      }
    }
    var out = {
      indoorCount:indoorCount,
      turninRate:parseFloat((turninRate*100).toFixed(1)),
    }
  //  console.log('Handle Data1',out);
    this.setState(out);
    this.fetchAvgData();
  }

  countLevel(value,target){
    var n = 0;
    //console.log('ConutLevel ', value, ' vs ', target)
    if(value>0 &&target<=0){
        return 100;
    }
    if(target>0) {
      n = parseInt(value*100/target)
    }
    if(n>100) {
      n =100;
    }
    return n;
  }

  handleResults2(results) {
  //  console.log("PageAbstract handleResults2 results : ", results);
    //console.log('handleresults2',results[1].analytic)
    const widgetList = this.props.store.widgetSelector.list;

    var list=[];
    //list.push(widgetList[2]) //銷售
    list.push(widgetList[0]) //客流量
    // list.push(widgetList[3]) //交易筆數
    // list.push(widgetList[5]) //客單價
    list.push(widgetList[1]) //進店率
    //console.log(list)
    var data =[];
    for(var k in results){
      if(results[k].status == 1) {
        var d = DataHandler.parseDataResponse(results[k], list[k].data_source);
      //  console.log("PageAbstract handleResults2 d : ", d);
        var count =0;
        var sum = 0;
        for(var n in d) {
          var avgValue =0;
          if(d[n].avg>=0){
            if(k==1) {
              avgValue =  d[n].avg*100;
            } else {
              avgValue =  d[n].avg;
            }
            if(avgValue>=0){
              sum = sum +avgValue;
              count = count+1;
            }
          }
        }
       //console.log("[Abstract]Sum=" + sum + " count="+count)
        if(count>0)sum =sum/count;

        data.push(sum);
      } else {
        //this.props.selectPage('PageLogin')
        return;
      }
    }
    //console.log('Turnin Rate ',this.state.turninRate)
    var origin = this.state.origin;
    origin.indoorCount = parseFloat(this.state.indoorCount);
    origin.turninRate = parseFloat(this.state.turninRate);
    var target = this.state.target;
    target.indoorCount = parseFloat(data[0]);
    target.turninRate = parseFloat((data[1]).toFixed(1));
    var compare = this.state.compare;
    compare.indoorCount = this.countCompare(this.state.indoorCount,data[0]);
    compare.turninRate= this.countCompare(this.state.turninRate, parseFloat((data[1]).toFixed(1)));
    var out = {
      indoorCount:this.countLevel(this.state.indoorCount,data[0]),
      turninRate:this.countLevel(this.state.turninRate,parseFloat((data[1]).toFixed(1))),
      compare,
      target,
      origin
    }
    //console.log('Handle Result2 finish',out);
    this.fetchPosData();
    this.setState(out)
  }

  fetchPosData(){
  //  console.log("PageAbstract fetchPosData time : ", moment().format("YYYY/MM/DD HH:mm:ss"));
    const api = new UshopRestClient();
    const {date,range,unit,widgetList,typeIndex} = this.state;
    const token = this.props.store.userSelector.token;
    const accountId = this.props.store.userSelector.accountId;
    const tempReportStore = this.props.store.storeSelector.tempReportStoreBI;

    var promises = [];
    var d = new Date(date);

    if(range == "ww") {
    //  console.log("d : ", d);
      var dif = d.getDay() || 7 ;
      //console.log("dif : ", dif);
      d.setDate(d.getDate() - dif + 1);
    //  console.log("d : ", d);
    }
    const posapi = new PosRestClient();
    promises.push(posapi.getItemData(accountId, token, [tempReportStore.register_key],
      DataHandler.ceateDatePeriod(moment(d).format('YYYY/MM/DD'),range),range));

    d.setDate(d.getDate()-1);
    promises.push(posapi.getItemData(accountId, token, [tempReportStore.register_key],
      DataHandler.ceateDatePeriod(moment(d).format('YYYY/MM/DD'),'dd'),range));

    d.setDate(d.getDate()+1);
    promises.push(posapi.getItemData(accountId, token, [tempReportStore.register_key]
     ,DataHandler.ceateDatePeriod(moment(d).format('YYYY/MM/DD'),'mm'),range));

    d.setMonth(d.getMonth()-1);
    promises.push(posapi.getItemData(accountId, token, [tempReportStore.register_key]
     ,DataHandler.ceateDatePeriod(moment(d).format('YYYY/MM/DD'),'mm'),range));
    this.promisePosRequests(promises);
  }

  promisePosRequests(promises){
    var handle = function(results){
      this.handlePosResults(results);
    }.bind(this)
    var doFail = function(){
      this.setState({loading:false});
    }.bind(this)
    Promise.all(promises)
    .then(function(data){
      handle(data)})
    .catch(function(err){
      doFail();
    });
  }

  handlePosResults(results){
    const {range} = this.state;
    var realdate = this.state.date;
    if(range == "ww") {
      var dif = new Date(realdate).getDay() || 7 ;
      var tmpDate = new Date(realdate);
      tmpDate.setDate(tmpDate.getDate() - dif + 1);
      realdate = moment(tmpDate).format('YYYY/MM/DD');
    }
    var posResultList = [];
    var d = new Date(realdate);
    var date = moment(new Date(realdate)).format('YYYY/MM/DD');
    //console.log('Parse 1 ',date)
    if(results[0] && results[0].datas &&
      results[0].datas[0] && results[0].datas[0].retrived){
      posResultList  = results[0].datas[0].retrived
    }
    //console.log("results, ", results);
  //  console.log("posResultList, ", posResultList);
    var output1 = DataHandler.parsePosData(posResultList,date,range,range);
    //console.log("output1, ", output1);

    d.setDate(d.getDate()-1);
    date = moment(new Date(realdate)).format('YYYY/MM/DD');
    //console.log('Parse 2 ',date)
    posResultList=[];
    if(results[1] && results[0].datas &&
      results[1].datas[0] && results[1].datas[0].retrived){
      posResultList  = results[1].datas[0].retrived
    }
    var output2 = DataHandler.parsePosData(posResultList,date,'dd','dd');
    var targetSale=0
    var targetUserCount =0;
    var targerPriceAvg=0;
    var targetSaleCount=0
    var targetUserCountCount =0;
    var targerPriceAvgCount=0;
    var currnetDate=d.getDate();
    d.setDate(d.getDate()+1);
    date = moment(new Date(realdate)).format('YYYY/MM/DD');
    posResultList=[];
    if(results[2] && results[0].datas &&
      results[2].datas[0] && results[2].datas[0].retrived){
      posResultList  = results[2].datas[0].retrived
    }
    var output3 = DataHandler.parsePosData(posResultList,date,'mm','dd');
    for(var i =0; i<currnetDate;i++){
      if(output3.total_amount[i]>0){
        targetSale =targetSale+ parseInt(output3.total_amount[i]);
        targetSaleCount =targetSaleCount +1;
      }
      if(output3.transaction_count[i]>0){
        targetUserCount=targetUserCount +parseInt(output3.transaction_count[i]);
        targetUserCountCount =targetUserCountCount +1;
      }
      if(output3.total_amount[i]>0 && output3.item_count[i]>0){
        targerPriceAvg =targerPriceAvg+parseInt(output3.total_amount[i])/parseInt(output3.item_count[i]);
        targerPriceAvgCount =targetSaleCount +1;
      }
    }
    d.setMonth(d.getMonth()-1);
    date = moment(new Date(realdate)).format('YYYY/MM/DD');
    posResultList=[];
    if(results[3] && results[3].datas &&
      results[3].datas[0] && results[3].datas[0].retrived){
      posResultList  = results[3].datas[0].retrived
    }
    var output4 = DataHandler.parsePosData(posResultList,date,'dd','dd');
    for(var i =(28-currnetDate); i<output4.total_amount.length ;i++){
      if(output4.total_amount[i]>0){
        targetSale =targetSale+parseInt(output4.total_amount[i]);
        targetSaleCount =targetSaleCount +1;
      }
      if(output4.transaction_count[i]>0){
        targetUserCount=targetUserCount +parseInt(output4.transaction_count[i]);
        targetUserCountCount =targetUserCountCount +1;
      }
      if(output4.total_amount[i]>0 && output4.item_count[i]>0){
        targerPriceAvg =targerPriceAvg+parseInt(output4.total_amount[i])/parseInt(output4.item_count[i]);
        targerPriceAvgCount =targetSaleCount +1;
      }
    }
    if(targetSaleCount>0) targetSale = targetSale/targetSaleCount;
    if(targetUserCountCount>0) targetUserCount = targetUserCount/targetUserCountCount;
    if(targerPriceAvgCount>0) targerPriceAvg = targerPriceAvg/targerPriceAvgCount;
    //console.log("*output1.total_amount[0]:",output1.total_amount[0])
    var sale = parseFloat(output1.total_amount[0]);
    var userCount = parseFloat(output1.transaction_count[0]);
    var priceAvg = parseFloat(output1.total_amount[0]);
    if(output1.item_count>0) {
      priceAvg = (priceAvg/output1.item_count[0]).toFixed(1);
    }
    var origin = this.state.origin;
    origin.sale = sale;
    origin.userCount = userCount;
    origin.priceAvg = priceAvg;
    var target = this.state.target;
    target.userCount = parseFloat((targetUserCount).toFixed(1));
    target.priceAvg = parseFloat((targerPriceAvg).toFixed(1));
    var compare = this.state.compare;
    compare.sale = this.countCompare(sale, this.state.target.sale);
    compare.userCount = this.countCompare(userCount, targetUserCount);
    compare.priceAvg = this.countCompare(priceAvg, targerPriceAvg);

    sale=this.countLevel(sale,this.state.target.sale);
    userCount=this.countLevel(userCount,targetUserCount);
    priceAvg=this.countLevel(priceAvg,targerPriceAvg);
    var out = {loading:false,sale,userCount,priceAvg,compare,target,origin};
    this.setState(out);
    //console.log("PageAbstract handlePosResults end time : ", moment().format("YYYY/MM/DD HH:mm:ss"));
  }

  checkPercent(p){
    if(p>100) return 100;
    else return parseInt(p);
  }

  renderPage(pageData, pageId, layout){
   // console.log('render page',pageId)
    return (
      <KPIComponent type= {pageData}/>
    );
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

  renderCompareType(){
    const {compares,compareIndex} = this.state;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    const {clear_gray,light_gray, bright_blue,white,black,green} = VALUES.COLORMAP;
    const screen = Dimensions.get('window');
    var nodes  =compares.map(function callback(c,index) {
      var extraStyle = {};
      if(index == 0){
        extraStyle = {borderBottomLeftRadius:15,borderTopLeftRadius:15};
      }
      if( index == compares.length-1){
        extraStyle = {borderBottomRightRadius:15,borderTopRightRadius:15};
      }
      if(compareIndex == index){
        return <TouchableOpacity onPress={()=>{this.setState({compareIndex:index})}}
                  style={[extraStyle,{width:70,backgroundColor:VALUES.COLORMAP.deadline_red,
                          flexDirection:'row',justifyContent:'center',alignItems:'center'}]}>
                  <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.white}}> {c}</Text>
               </TouchableOpacity>
     } else {
       return <TouchableOpacity onPress={()=>{this.setState({compareIndex:index})}}
                style={[extraStyle,{width:70,borderWidth:1,borderColor:VALUES.COLORMAP.deadline_red,
                        flexDirection:'row',justifyContent:'center',alignItems:'center'}]}>
                <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.deadline_red}}> {c}</Text>
              </TouchableOpacity>
     }
   }.bind(this));
    return <View style={{marginBottom:10,flexDirection:'row',width: screen.width ,justifyContent:'center',height:30}}>
            {nodes}
           </View>
  }

  renderTypes(){
    const {types,typeIndex} = this.state;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    const {clear_gray,light_gray, bright_blue,white,black,green} = VALUES.COLORMAP;
    const screen = Dimensions.get('window')
    var nodes  = types.map(function callback(c,index){
      return <UpperTab id={index} smallPhone={smallPhone} selected={typeIndex}
                onPress={()=>{this.setState({typeIndex:index})}}>{c}</UpperTab>
   }.bind(this));
    return <View style={{flexDirection:'row',width: screen.width ,justifyContent:'flex-start',height:50}}>
            {nodes}
           </View>
  }

  renderHighLow(p, type) {
    var title, image, color, percent;
    if(p>0) {
      if(type == 0) {
        title = I18n.t("bi_higher_than_target");
        percent = (p)+'%';
      } else {
        title = I18n.t("bi_beyond_avg");
        percent = (p)+'%';
      }
      image = require('../../images/uppic.png');
      color = VALUES.COLORMAP.dkk_red;
    } else if(p<0) {
      if(type ==0){
        title = I18n.t("bi_lower_than_target")
        percent = (-1* p)+'%';
      } else{
        title = I18n.t("bi_below_avg");
        percent = (-1* p)+'%';
      }
      image = require('../../images/down_pic.png');
      color = VALUES.COLORMAP.gray_font;
    } else {
      if(type == 0) {
        title = I18n.t("bi_equal_target");
        percent = 0;
      } else {
        title = I18n.t("bi_equal_avg");
        percent = 0;
      }
      image = require('../../images/equal_pic.png');
      color = VALUES.COLORMAP.gray_font;
    }
    return (<View style={{flexDirection:'row', alignItems:'center',width:140}}>
              <Image style={{width:16, height:12}} source={image}/>
              <Text allowFontScaling={false} style={{width:70, marginLeft:11, textAlign:'left'
                    ,color: color, fontSize: 14}}>{title}</Text>
              <Text allowFontScaling={false} style={{width:43, textAlign:'right',color: color, fontSize: 14,paddingRight:3}}>{percent}</Text>
            </View>)
  }

  countCompare(a,b){
    if(b<=0 && a>0)return 100;
    if(b<=0)return 0;
    if(a<0)a=0;
    var s = parseInt(((a-b)*100)/b);
    return s;
  }

  previousDate() {
    const {date,range} =this.state;
    var d = new Date(this.state.date);
    if(date) {
      d = new Date(date);
    }
    if(range=='dd') {
      d.setDate(d.getDate() - 1);
    } else if(range=='ww') {
      d.setDate(d.getDate() - 7);
    } else if(range=='mm' ) {
      d.setMonth(d.getMonth() - 1);
    } else if(range=='yyyy') {
      d.setYear(1900+d.getYear() - 1);
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
    if(date) {
       d = new Date(date);
    }
    if(range=='dd') {
       d.setDate(d.getDate() + 1);
    } else if(range=='ww' ) {
       d.setDate(d.getDate() + 7);
    } else if(range=='mm' ) {
       d.setMonth(d.getMonth() + 1);
    } else if(range=='yyyy' ) {
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

  renderRangeSelect(){
    const screen = Dimensions.get('window');
    var list = [];

    list.push(DataHandler.unitToString('dd'));
    list.push(DataHandler.unitToString('ww'));
    var width = screen.width < 340 ? 70 : 80;

    return (  <View style={{flex:1,alignSelf:'center',alignItems:'flex-end' }}>
                  <DropDownSelect changeType={(id)=>this.changeRange(id)}
                      defaultIndex={0}
                      width={width}
                      list={list}
                      content={DataHandler.unitToString(this.state.range)}/>
              </View>)
  }

  changeRange(id){
    var list = ['dd','ww'];
    var units= ['dd','ww'];
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
      const tempReportStore = this.props.store.storeSelector.tempReportStoreBI;
      this.getTarget(tempReportStore);
      this.fetchData();
    })
  }

  checkData(p) {
    if(p>0) {
      return p;
    } else {
      return 0;
    }
  }

  renderWeather(){
    const {range,weather} = this.state;
    const screen = Dimensions.get('window');
    var weatherIcon = null;
    var weatherTemp = "";
    if(range == 'dd') {
      switch(weather.condition) {
        case 0: weatherIcon = require('../../images/weather/unknow.png'); break;
        case 1: weatherIcon = require('../../images/weather/sun.png'); break;
        case 2: weatherIcon = require('../../images/weather/cloud.png'); break;
        case 3: weatherIcon = require('../../images/weather/rain.png'); break;
        case 4: weatherIcon = require('../../images/weather/snow.png'); break;
        case 5: weatherIcon = require('../../images/weather/danger.png'); break;
      }
      if(weather.temp_high != 999 && weather.temp_low != 999) {
        weatherTemp = parseInt((weather.temp_high+weather.temp_low)/2) + '°C';
      }
    }
    return(
      <View style={{flexDirection:'row',position:'absolute',right:21,top:40,height:20}}>
            <Image style={{marginRight:5,width:20,height:20}} source={weatherIcon}/>
            <Text allowFontScaling={false} style={{color:'#B1B2B4',fontSize:14}}>{weatherTemp}</Text>
      </View>
    );
  }

  renderCompare(){
    const { compare,target,origin,sale,userCount,priceAvg,indoorCount,turninRate} = this.state;
    const screen = Dimensions.get('window');
    let width = screen.width-32;
    return (
    <View style={{width,marginLeft:16}}>
      <View style={{height:60,borderBottomWidth:1, paddingRight:4, justifyContent:'center', borderBottomColor:'#989DB0'}}>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <View style={{flexDirection:'row',width:width-140}}>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14, width:40, paddingLeft:8}}>{'1'}</Text>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14}}>{I18n.t("bi_sale_values")}</Text>
          </View>
          {this.renderHighLow(compare.sale,0)}
        </View>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <View style={{flexDirection:'row',width:width-140}}>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14, width:40, paddingLeft:8}}>{}</Text>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14}}>{this.checkData(origin.sale)}</Text>
          </View>
          <Text allowFontScaling={false} style={{width:140,color:VALUES.COLORMAP.gray_font, fontSize:14, textAlign:'right', paddingRight:3}}>{target.sale}</Text>
        </View>
      </View>
      <View style={{height:60, borderBottomWidth:1, paddingRight:4, justifyContent:'center', borderBottomColor:'#989DB0'}}>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <View style={{flexDirection:'row',width:width-140}}>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14, width:40, paddingLeft:8}}>{'2'}</Text>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14}}>{I18n.t("bi_people_single_buy")}</Text>
          </View>
          {this.renderHighLow(compare.priceAvg,1)}
        </View>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <View style={{flexDirection:'row',width:width-140}}>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14, width:40, paddingLeft:8}}>{}</Text>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14}}>{this.checkData(origin.priceAvg)}</Text>
          </View>
          <Text allowFontScaling={false} style={{width:140,color:VALUES.COLORMAP.gray_font, fontSize:14, textAlign:'right', paddingRight:3}}>{target.priceAvg}</Text>
        </View>
      </View>
      <View style={{height:60, borderBottomWidth:1, paddingRight:4, justifyContent:'center', borderBottomColor:'#989DB0'}}>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <View style={{flexDirection:'row',width:width-140}}>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14, width:40, paddingLeft:8}}>{'3'}</Text>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14}}>{I18n.t("bi_turnin_rate")}</Text>
          </View>
          {this.renderHighLow(compare.turninRate,1)}
        </View>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <View style={{flexDirection:'row',width:width-140}}>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14, width:40, paddingLeft:8}}>{}</Text>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14}}>{this.checkData(origin.turninRate)}</Text>
          </View>
          <Text allowFontScaling={false} style={{width:140,color:VALUES.COLORMAP.gray_font, fontSize:14, textAlign:'right', paddingRight:3}}>{target.turninRate}</Text>
        </View>
      </View>
      <View style={{height:60, borderBottomWidth:1, paddingRight:4, justifyContent:'center', borderBottomColor:'#989DB0'}}>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <View style={{flexDirection:'row',width:width-140}}>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14, width:40, paddingLeft:8}}>{'4'}</Text>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14}}>{I18n.t("bi_people_in")}</Text>
          </View>
          {this.renderHighLow(compare.indoorCount,1)}
        </View>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <View style={{flexDirection:'row',width:width-140}}>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14, width:40, paddingLeft:8}}>{}</Text>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14}}>{this.checkData(origin.indoorCount)}</Text>
          </View>
          <Text allowFontScaling={false} style={{width:140,color:VALUES.COLORMAP.gray_font, fontSize:14, textAlign:'right', paddingRight:3}}>{target.indoorCount}</Text>
        </View>
      </View>
      <View style={{height:60, borderBottomWidth:1, paddingRight:4, justifyContent:'center', borderBottomColor:'#989DB0'}}>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <View style={{flexDirection:'row',width:width-140}}>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14, width:40,paddingLeft:8}}>{'5'}</Text>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14}}>{I18n.t("bi_shopper_count")}</Text>
          </View>
          {this.renderHighLow(compare.userCount,1)}
        </View>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <View style={{flexDirection:'row',width:width-140}}>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14, width:40, paddingLeft:8}}>{}</Text>
            <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font, fontSize:14}}>{this.checkData(origin.userCount)}</Text>
          </View>
          <Text allowFontScaling={false} style={{width:140,color:VALUES.COLORMAP.gray_font, fontSize:14, textAlign:'right', paddingRight:3}}>{target.userCount}</Text>
        </View>
      </View>
    </View>)
  }

  render() {
    const {styles,type,typeIndex,compare,sale,userCount,priceAvg,
            indoorCount,turninRate,date,lastDate} = this.state;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    const screen = Dimensions.get('window');

    const tempReportStore = this.props.store.storeSelector.tempReportStoreBI;
    var revenue = 0.2,
        turninrate = 0.2,
        visitors = 0.2,
        transactions = 0.2,
        revenuepertransaction = 0.2;
    if(tempReportStore.extension && tempReportStore.extension.weight) {
      revenue = (tempReportStore.extension.weight.revenue || 20) / 100,
      turninrate = (tempReportStore.extension.weight.turninrate || 20) / 100,
      visitors = (tempReportStore.extension.weight.visitors || 20) / 100,
      transactions = (tempReportStore.extension.weight.transactions || 20) / 100,
      revenuepertransaction = (tempReportStore.extension.weight.revenuepertransaction || 20) / 100;
    }
    var tRank=parseInt(sale*revenue+
                        userCount*turninrate+
                        priceAvg*visitors+
                        indoorCount*revenuepertransaction+
                        turninRate*revenuepertransaction);
    var dateFontSize = 18;
    if(screen.width < 340) {
      dateFontSize = 14;
    } else if(screen.width < 380) {
      dateFontSize = 16;
    }
    if(this.state.hiding){
      return <View style={{paddingTop:0,
              backgroundColor:VALUES.COLORMAP.dkk_background,
              height:screen.height,width:screen.width}}/>;
    }

    return (
      <View style={{paddingTop:0,
        backgroundColor:VALUES.COLORMAP.dkk_background,
        height:screen.height,width:screen.width}}>
        <UTitleBar smallPhone={smallPhone}
          headerText={I18n.t("bi_abstract_reports")}
           onLeftPress={()=>{this.state.loading ? {} : Actions.pop()}}
           onRightPress={()=>{}}
           leftText={this.props.type}
           leftIconType={'return'}
           rightIconType={'none'}>
        </UTitleBar>
        <View style={[{height:screen.height-104,marginTop:Platform.OS === 'ios'?34:13}]}>
          <View style={{height:70}}>
            {this.renderDatePickArea()}
            {this.renderWeather()}
          </View>
          <View style = {[styles.shadowStyle,styles.container,{flexDirection:'column' ,height:330,alignItem:'center'}]}>
            <View style={{flex:1,alignSelf:'center',alignContent:'center',marginTop:12,marginLeft:10}}>
            <RadarChart
              data={[
                    sale,
                    turninRate,
                    indoorCount,
                    userCount,
                    priceAvg,
                    ]}
              total={tRank >= 0 ? tRank : ''}
              radius={screen.width/2-63}
              width={312}
              height={312}
            />
            </View>
          </View>
          {this.state.loading ? null : <ScrollView>
          {this.renderCompare()}
        </ScrollView>}
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
      color:VALUES.COLORMAP.white},
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
