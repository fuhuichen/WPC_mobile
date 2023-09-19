import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import UshopRestClient from '../utils/webclient'
import DataHandler from '../utils/DataHandler'
import UpperTab from '../components/UpperTab'
import ImageButton from '../components/ImageButton';
import DropDownSelect from '../components/DropDownSelect';
import DropDownSelect0 from '../components/DropDownSelect0';
import PosRestClient from '../utils/posclient';
import Tab from '../components/Tab';
import moment from 'moment';
import SettingItem from '../components/SettingItem';
import DialogHandler from '../utils/DialogHandler';
import ToggleSwitch from 'toggle-switch-react-native'


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
import UTitleBar from '../components/UTitleBar'
import LineChart from '../components/chart-kit/LineChart';
//
import Spinner from '../components/Spinner';

import {Actions} from "react-native-router-flux";
import * as storeSync from "react-native-simple-store";
import {inject, observer} from 'mobx-react'
import DatePicker from "../../../app/thirds/datepicker/DatePicker";
import Toast, {DURATION} from 'react-native-easy-toast';
//import StoreSelector from "../stores/StoreSelector";
@inject('store')
@observer
export default class PageStoresCompare extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.backHandler = null;
    var date = moment(new Date()).format('YYYY/MM/DD');
    var stores = [];
    var storeIndex = -1;
    var storeIndexs = [];
    let storeList = this.props.store.storeSelector.storeListBI;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    var styles;
    if(smallPhone) {
      styles = smallStyles
    } else {
      styles = largeStyles
    }
    if(storeList){
      storeList = storeList.slice();
      for(var k in storeList){
        let tag_ids = [];
        for(var i=0 ; i<storeList[k].tag_ids.length ; ++i) {
          tag_ids.push(storeList[k].tag_ids[i]);
        }
        var item = {
          name:storeList[k].store_name,
          country:storeList[k].country,
          province:storeList[k].province,
          city:storeList[k].city,
          register_key:storeList[k].register_key,
          tag_ids: tag_ids,
          index:k,
        }
        stores.push(item);
        let tempReportStore = this.props.store.storeSelector.tempReportStoreBI;
        if(tempReportStore && storeList[k].store_id == tempReportStore.store_id){
          storeIndexs.push(k);
          storeIndex = k;
        }
      }
    }
    this.state = {
      styles,
      viewNumber:true,
      range:'dd',
      unit:'hh',
      isAnalyticOpen:false,
      data:null,
      date,
      nowDate: date,
      lastDate: true,
      loading: false,
      visible1: true,
      visible2: true,
      visible3: true,

      stores,
      storeIndex,
      storeIndexs,
      tags: [],
      bestStore: "",
      worstStore: "",

      compareType: I18n.t("bi_sale_values"),
      compareTypeList: [I18n.t("bi_sale_values"),
                        I18n.t("bi_shopper_count"),
                        I18n.t("bi_shop_rate"),
                        I18n.t("bi_peoplecount_pass"),
                        I18n.t("bi_people_in"),
                        I18n.t("bi_turnin_rate"),
                        I18n.t("bi_people_single_buy"),
                        I18n.t("bi_average_shop_counts"),
                        I18n.t("bi_average_item_salevalue")],
      loading_nodata:true
    };
  }

  componentDidMount() {
    console.log('Is IphoneX?',VALUES.isIPhoneX);
    this.getTagList();
    this.fetchData();
    this.backHandler = BackHandler.addEventListener("pageStoresCompareBackPress", () => {
      if(this.state.loading) { return; }
    });
  }

  componentWillUnmount() {
    this.backHandler.remove();
  }

  getTagList(){
    var req ={
      owner_id: this.props.store.userSelector.accountId,
      token  : this.props.store.userSelector.token,
    };
    console.log(req)
    const api = new UshopRestClient();
    api.getTagList(req).then(response => response)   // Successfully logged in
      .then(response=> this.onTagListSuccess(response))    // Remember your credentials
      .catch(err => this.onTagListFail(err.message));  // Catch any error
  }

  onTagListFail(msg){
    console.log("Get Tags Fail " + msg );
  }

  onTagListSuccess(response){
    console.log('onTagListSuccess ',response);
    if(response.status == 1) {
      var stores = this.state.stores;
      for(var i in stores) {
        for(var j in stores[i].tag_ids) {
          for(var k in response.tags) {
            if(stores[i].tag_ids[j] == response.tags[k].tag_id) {
              stores[i].tag_ids[j] = response.tags[k].tag_name;
              break;
            }
          }
        }
      }
      this.setState({stores, tags: response.tags});
    }
  }

  onChangeStore() {
    var stores = { index:this.state.storeIndex, indexs:this.state.storeIndexs, list:this.state.stores };
    const screen = Dimensions.get('window');
    DialogHandler.openStoresCompareDialog(screen.width-40, I18n.t('Select Store'), stores, this,{type:'stores'});
  }

  changeCompareType(id) {
    console.log("changeCompareType id, ", id);
    this.setState({compareType: this.state.compareTypeList[id]}, function() {
      this.fetchData();
    });
  }

  onNextPressed(param){
    console.log("PageStoresCompare onNextPressed param, ", param);
    if(param.type=='stores'){
      this.setState({storeIndexs:param.stores.indexs}, function() {
        this.fetchData();
      });
    }
  }

  fetchData(){
    console.log('fetchdata compareType, ', this.state.compareType);
    const api = new UshopRestClient();
    const {date,range,unit,compareType,stores,storeIndexs} = this.state;
    const token = this.props.store.userSelector.token;
    const accountId = this.props.store.userSelector.accountId;
    const widgetList = this.props.store.widgetSelector.list;
    var stores_regKey = [];
    var stores_select = [];
    let storeList = this.props.store.storeSelector.storeListBI;

    for(var i=0 ; i<storeIndexs.length ; ++i) {
      if(stores[storeIndexs[i]]) {
        stores_regKey.push(stores[storeIndexs[i]].register_key);
        for(var j=0 ; j<storeList.length ; ++j) {
          if(stores[storeIndexs[i]].register_key == storeList[j].register_key) {
            stores_select.push(storeList[j]);
            break;
          }
        }
      }
    }

    var promises = [];
    this.setState({ loading: true,
                    data: null,
                    visible1: storeIndexs.length > 0,
                    visible2: storeIndexs.length > 1,
                    visible3: storeIndexs.length > 2})
    const posapi = new PosRestClient();
    switch(compareType) {
      case I18n.t("bi_sale_values"):
      case I18n.t("bi_shopper_count"):
      case I18n.t("bi_people_single_buy"):
      case I18n.t("bi_average_shop_counts"):
      case I18n.t("bi_average_item_salevalue"):
        //var tmpUnit = unit;
        //if(range == "yyyy") {tmpUnit = "mm";}
        promises.push(posapi.getItemData(accountId, token, stores_regKey, DataHandler.ceateDatePeriod(date,range), unit));
      break;
      case I18n.t("bi_shop_rate"):
        //var tmpUnit = unit;
        //if(range == "yyyy") {tmpUnit = "mm";}
        promises.push(posapi.getItemData(accountId, token, stores_regKey, DataHandler.ceateDatePeriod(date,range), unit));
        for(var i=0 ; i<stores_select.length ; ++i) {
          var req = DataHandler.createSimpleRequest(token, widgetList[0].data_source,
            range, unit, new Date(date), stores_select[i], false);
          promises.push(api.widgetData(req));
        }
      break;
      case I18n.t('bi_peoplecount_pass'):
        //var tmpUnit = unit;
        //if(range == "yyyy") {tmpUnit = "mm";}
        for(var i=0 ; i<stores_select.length ; ++i) {
          var req1 = DataHandler.createSimpleRequest(token, widgetList[0].data_source,
            range, unit, new Date(date), stores_select[i], false);
          promises.push(api.widgetData(req1));
          var req2 = DataHandler.createSimpleRequest(token, widgetList[1].data_source,
            range, unit, new Date(date), stores_select[i], false);
          promises.push(api.widgetData(req2));
        }
      break;
      case I18n.t("bi_people_in"):
        //var tmpUnit = unit;
        //if(range == "yyyy") {tmpUnit = "mm";}
        for(var i=0 ; i<stores_select.length ; ++i) {
          var req = DataHandler.createSimpleRequest(token, widgetList[0].data_source,
            range, unit, new Date(date), stores_select[i], false);
          promises.push(api.widgetData(req));
        }
      break;
      case I18n.t("bi_turnin_rate"):
        //var tmpUnit = unit;
        //if(range == "yyyy") {tmpUnit = "mm";}
        for(var i=0 ; i<stores_select.length ; ++i) {
          var req = DataHandler.createSimpleRequest(token, widgetList[1].data_source,
            range, unit, new Date(date), stores_select[i], false);
          promises.push(api.widgetData(req));
        }
      break;
    }
    this.promiseRequests(promises);
  }

  promiseRequests(promises) {
    var handle = function(results) {
      /*var index = results.length - 1;
      if(results[index].status == 1) {*/
        this.handleResults(results);
      /*} else {
        this.logout();
      }*/
    }.bind(this)
    var doFail = function(){
       this.setState({loading:false});
    }.bind(this)
    Promise.all(promises)
    .then(function(data) {
      handle(data)
    })
    .catch(function(err) {
      doFail();
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

  handleResults(results) {
    console.log("PageStoresCompare handleResults results, ", results);
    const {date,range,unit,storeIndexs,compareType} = this.state;
    const widgetList = this.props.store.widgetSelector.list;
    var data = {
      labels: [],
      labels2: [],
      datasets: []
    };
    var compareValue = [];
    switch(compareType) {
      case I18n.t("bi_sale_values"):
        var output = {};
        if(results[0] && results[0].datas) {
          for(var i=0 ; i<results[0].datas.length && i<storeIndexs.length ; ++i) {
            output = DataHandler.parsePosData(results[0].datas[i].retrived, date, range, unit);
            data.datasets.push({data: output.total_amount});
          }
        }
        data.labels = output.labels;
        data.labels2 = output.labels2;
      break;
      case I18n.t("bi_shop_rate"):
        var output = {};
        if(results[0] && results[0].datas) {
          for(var i=0 ; i<results[0].datas.length && i<storeIndexs.length ; ++i) {
            var tmpCompareValue1 = 0, tmpCompareValue2 = 0;
            output = DataHandler.parsePosData(results[0].datas[i].retrived, date, range, unit);
            for(var n in output.transaction_count) {
              if(results.length > i+1) {
                var dataParse = DataHandler.parseDataResponse(results[i+1], widgetList[0].data_source);
                if( dataParse[0] && dataParse[0].row && dataParse[0].row[n] && output.transaction_count[n] >0) {
                  tmpCompareValue1 += 100*parseInt(output.transaction_count[n]);
                  tmpCompareValue2 += parseInt(dataParse[0].row[n]);
                  output.transaction_count[n]= (100*parseInt(output.transaction_count[n]) / parseInt(dataParse[0].row[n])).toFixed(0);
                  if(output.transaction_count[n]>100) {
                    output.transaction_count[n] = 100;
                  }
                } else if(output.transaction_count[n] < 0) {
                  output.transaction_count[n] = -1;
                } else {
                  output.transaction_count[n] = 0;
                }
              }
            }
            data.datasets.push({data:output.transaction_count,max:100});
            if(tmpCompareValue1 == 0 || tmpCompareValue2 == 0) {
              compareValue.push(0);
            } else {
              compareValue.push((tmpCompareValue1/tmpCompareValue2).toFixed(0));
            }
          }
        }
        data.labels = output.labels;
        data.labels2 = output.labels2;
      break;
      case I18n.t("bi_shopper_count"):
        var output = {};
        if(results[0] && results[0].datas) {
          for(var i=0 ; i<results[0].datas.length && i<storeIndexs.length ; ++i) {
            output = DataHandler.parsePosData(results[0].datas[i].retrived, date, range, unit);
            data.datasets.push({data:output.transaction_count});
          }
        }
        data.labels = output.labels;
        data.labels2 = output.labels2;
      break;
      case I18n.t("bi_people_single_buy"):
        var output = {};
        if(results[0] && results[0].datas) {
          for(var i=0 ; i<results[0].datas.length && i<storeIndexs.length ; ++i) {
            var tmpCompareValue1 = 0, tmpCompareValue2 = 0;
            output = DataHandler.parsePosData(results[0].datas[i].retrived, date, range, unit);
            for(var n in output.total_amount) {
              if( output.total_amount[n] > 0 && output.transaction_count[n] > 0) {
                tmpCompareValue1 += parseInt(output.total_amount[n]);
                tmpCompareValue2 += parseInt(output.transaction_count[n]);
                output.total_amount[n] = (parseInt(output.total_amount[n]) / parseInt(output.transaction_count[n])).toFixed(1);
              } else if(output.total_amount[n] < 0) {
                output.total_amount[n] = -1;
              } else {
                output.total_amount[n] = 0;
              }
            }
            data.datasets.push({data:output.total_amount});
            if(tmpCompareValue1 == 0 || tmpCompareValue2 == 0) {
              compareValue.push(0);
            } else {
              compareValue.push((tmpCompareValue1/tmpCompareValue2).toFixed(1));
            }
          }
        }
        data.labels = output.labels;
        data.labels2 = output.labels2;
      break;
      case I18n.t('bi_peoplecount_pass'):
        var enterCount = [], walkbyCount = [], turninRate = [];
        for(var i=0 ; i<results.length ; ++i) {
          var index = i % 2;
          var dataParse = DataHandler.parseDataResponse(results[i], widgetList[index].data_source);
          if(index == 0) {
            enterCount = dataParse[0].row;
          } else {
            turninRate = dataParse[0].row;
            var datas = results[i].retrived[1].data;
            for(var k in datas) {
              var out = datas[k]['walkby'];
              if(out) {
                walkbyCount = out.row;
              }
            }
            var tmpData = enterCount;
            for(var j in tmpData) {
              if(tmpData[j] > 0) {
                if(turninRate[j] > 0) {
                  tmpData[j] = parseInt(tmpData[j] / turninRate[j]);
                }
              } else if(tmpData[j] == 0) {
                if(walkbyCount[j]) {
                  tmpData[j] = walkbyCount[j];
                }
              }
            }
            data.datasets.push({data:tmpData});
          }
        }
        var labeldata = DataHandler.parsePosData(null, date, range, unit);
        data.labels = labeldata.labels;
        data.labels2 = labeldata.labels2;
      break;
      case I18n.t("bi_people_in"):
        for(var i=0 ; i<storeIndexs.length ; ++i) {
          var dataParse = DataHandler.parseDataResponse(results[i], widgetList[0].data_source);
          data.datasets.push({data:dataParse[0].row});
        }
        var labeldata = DataHandler.parsePosData(null, date, range, unit);
        data.labels = labeldata.labels;
        data.labels2 = labeldata.labels2;
      break;
      case I18n.t("bi_turnin_rate"):
        for(var i=0 ; i<storeIndexs.length ; ++i) {
          var dataParse = DataHandler.parseDataResponse(results[i], widgetList[1].data_source);
          for(var x in dataParse){
              for(var y in dataParse[x].row) {
                  if(dataParse[x].row[y] > 0) {
                      dataParse[x].row[y]= dataParse[x].row[y]*100;
                      dataParse[x].row[y] = parseFloat(dataParse[x].row[y].toFixed(1));
                      if(dataParse[x].row[y]>100) dataParse[x].row[y]=100;
                  }
              }
          }
          data.datasets.push({data:dataParse[0].row,max:100});
        }
        var labeldata = DataHandler.parsePosData(null, date, range, unit);
        data.labels = labeldata.labels;
        data.labels2 = labeldata.labels2;
      break;
      case I18n.t("bi_average_shop_counts"): // 商品數/交易次數
        var output = {};
        if(results[0] && results[0].datas) {
          for(var i=0 ; i<results[0].datas.length && i<storeIndexs.length ; ++i) {
            var tmpCompareValue1 = 0, tmpCompareValue2 = 0;
            output = DataHandler.parsePosData(results[0].datas[i].retrived, date, range, unit);
            var tmpCount = [];
            for(var j=0 ; j<output.item_count.length ; ++j) {
              if(output.transaction_count[j]) {
                if(output.item_count[j] == -1) {
                  tmpCount.push(output.item_count[j]);
                } else {
                  console.log("tmpCompareValue1, ", output.item_count[j]);
                  console.log("tmpCompareValue2, ", output.transaction_count[j]);
                  tmpCompareValue1 += parseInt(output.item_count[j]);
                  tmpCompareValue2 += parseInt(output.transaction_count[j]);
                  if(parseInt(output.item_count[j]) == 0 || parseInt(output.transaction_count[j]) == 0) {
                    tmpCount.push(0);
                  } else {
                    tmpCount.push((parseInt(output.item_count[j]) / parseInt(output.transaction_count[j])).toFixed(1));
                  }
                }
              }
            }
            data.datasets.push({data: tmpCount});
            if(tmpCompareValue1 == 0 || tmpCompareValue2 == 0) {
              compareValue.push(0);
            } else {
              compareValue.push((tmpCompareValue1/tmpCompareValue2).toFixed(1));
            }
          }
        }
        data.labels = output.labels;
        data.labels2 = output.labels2;
      break;
      case I18n.t("bi_average_item_salevalue"): // 銷售額 / 商品數
        var output = {};
        if(results[0] && results[0].datas) {
          for(var i=0 ; i<results[0].datas.length && i<storeIndexs.length ; ++i) {
            var tmpCompareValue1 = 0, tmpCompareValue2 = 0;
            output = DataHandler.parsePosData(results[0].datas[i].retrived, date, range, unit);
            var tmpCount = [];
            for(var j=0 ; j<output.item_count.length ; ++j) {
              if(output.transaction_count[j]) {
                if(output.item_count[j] == -1) {
                  tmpCount.push(output.item_count[j]);
                } else {
                  tmpCompareValue1 += parseInt(output.total_amount[j]);
                  tmpCompareValue2 += parseInt(output.item_count[j]);
                  if(parseInt(output.total_amount[j]) == 0 || parseInt(output.item_count[j]) == 0) {
                    tmpCount.push(0);
                  } else {
                    tmpCount.push((parseInt(output.total_amount[j]) / parseInt(output.item_count[j])).toFixed(1));
                  }
                }
              }
            }
            data.datasets.push({data: tmpCount});
            if(tmpCompareValue1 == 0 || tmpCompareValue2 == 0) {
              compareValue.push(0);
            } else {
              compareValue.push((tmpCompareValue1/tmpCompareValue2).toFixed(1));
            }
          }
        }
        data.labels = output.labels;
        data.labels2 = output.labels2;
      break;
    }
    if( range == 'dd'){
      data = DataHandler.fixNegtiveData(data);
    }
    var checkNoData = true;
    for(var i=0 ; i<data.datasets.length ; ++i) {
      for(var j=0 ; j<data.datasets[i].data.length ; ++j) {
        if(data.datasets[i].data[j] > 0) {
          checkNoData = false;
          break;
        }
      }
    }
    //if(storeIndexs.length > 1) {
      console.log("PageStoresCompare handleResults compareValue, ", compareValue);
      this.checkStorePerformance(data.datasets,compareValue);
    //}
    this.setState({loading:false, data,loading_nodata:checkNoData});
  }

  checkStorePerformance(datasets, compareValue) {
    console.log("checkStorePerformance datasets, ", datasets);
    const {date,range,unit,stores,storeIndexs,compareType} = this.state;
    var bestStoreValue = -1, bestStore = "",
        worstStoreValue = -1, worstStore = "";
    if( compareType == I18n.t("bi_shop_rate") ||
        compareType == I18n.t("bi_people_single_buy") ||
        compareType == I18n.t("bi_average_shop_counts") ||
        compareType == I18n.t("bi_average_item_salevalue") ) {
        for(var i=0 ; i<compareValue.length ; ++i) {
          if(storeIndexs[i] && stores[storeIndexs[i]]) {
            if(compareValue[i] > bestStoreValue) {
              bestStore = stores[storeIndexs[i]].name;
              bestStoreValue = compareValue[i];
            }
            if(worstStoreValue == -1 || compareValue[i] < worstStoreValue)  {
              worstStore = stores[storeIndexs[i]].name;
              worstStoreValue = compareValue[i];
            }
          }
        }
    } else {
      for(var i=0 ; i<datasets.length ; ++i) {
        if(datasets[i].data && storeIndexs[i] && stores[storeIndexs[i]]) {
          var tmpValue = 0;
          for(var j=0 ; j<datasets[i].data.length ; ++j) {
            if(datasets[i].data[j] > 0) {
              tmpValue += parseInt(datasets[i].data[j]);
            }
          }
          console.log("checkStorePerformance tmpValue, ", tmpValue);
          if(tmpValue > bestStoreValue) {
            bestStore = stores[storeIndexs[i]].name;
            bestStoreValue = tmpValue;
          }
          if(worstStoreValue == -1 || tmpValue < worstStoreValue) {
            worstStore = stores[storeIndexs[i]].name;
            worstStoreValue = tmpValue;
          }
        }
      }
    }
    this.setState({bestStore,worstStore});
  }

  previousDate() {
    const {date,range} =this.state;
    var d = new Date();
    if(date){
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

  renderChart() {
    const {data,range,date,viewNumber,visible1,visible2,visible3,stores,storeIndexs,compareType}=this.state;
    const screen = Dimensions.get('window')
    var width = screen.width;
    var height = (screen.width * 8.5 )/16 + 1;
    if(!data){
      console.log("PageStoresCompare line chart data null");
      return <View style={{marginBottom:10,width,height}}/>
    }
    var store1 = (storeIndexs.length > 0 && stores[storeIndexs[0]]) ? stores[storeIndexs[0]].name : "";
    var store2 = (storeIndexs.length > 1 && stores[storeIndexs[1]]) ? stores[storeIndexs[1]].name : "";
    var store3 = (storeIndexs.length > 2 && stores[storeIndexs[2]]) ? stores[storeIndexs[2]].name : "";

    //console.log(data)
    var showLine = true;
    var renderEndlabel = true;
    var uniqueUnit = false;
    /*if(range!='mm' && range!='yyyy') {
      showLine = false;
    } else {
      uniqueUnit = true;
    }*/

    var colorbar = (
      <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
        {storeIndexs.length > 0 ? <TouchableOpacity onPress={()=>this.setState({visible1: !visible1})} style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
          <View style={{marginLeft:5,width:12,height:12,backgroundColor:'#2C90D9',opacity: (visible1 ? 1 : 0.5)}}/>
          <Text allowFontScaling={false} style={{marginLeft:10,color:'#B1B2B4',fontSize:12,opacity: (visible1 ? 1 : 0.5)}}>{store1}</Text>
        </TouchableOpacity> : null}
        {storeIndexs.length > 1 ? <TouchableOpacity onPress={()=>this.setState({visible2: !visible2})} style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
          <View style={{marginLeft:24,width:12,height:12,backgroundColor:'#FFC53D',opacity: (visible2 ? 1 : 0.5)}}/>
          <Text allowFontScaling={false} style={{marginLeft:10,color:'#B1B2B4',fontSize:12,opacity: (visible2 ? 1 : 0.5)}}>{store2}</Text>
        </TouchableOpacity> : null}
        {storeIndexs.length > 2 ? <TouchableOpacity onPress={()=>this.setState({visible3: !visible3})} style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
          <View style={{marginLeft:24,width:12,height:12,backgroundColor:'#CBCBCB',opacity: (visible3 ? 1 : 0.5)}}/>
          <Text allowFontScaling={false} style={{marginLeft:10,color:'#B1B2B4',fontSize:12,opacity: (visible3 ? 1 : 0.5)}}>{store3}</Text>
        </TouchableOpacity> : null}
      </View>
    );
    if(data.datasets[0]) {
      data.datasets[0].visible = visible1;
    }
    if(data.datasets[1]) {
      data.datasets[1].visible = visible2;
    }
    if(data.datasets[2]) {
      data.datasets[2].visible = visible3;
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
    console.log("PageStoresCompare renderChart data, ", data);
    return (
      <View style={{marginBottom:10}}>
         <LineChart
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
              marginLeft:3,
              marginVertical: 8,
              borderRadius: 0
            }}
            textFloat={(compareType == I18n.t("bi_average_shop_counts")) || (compareType == I18n.t("bi_average_item_salevalue"))}
          />
        {colorbar}
       </View>);
  }

  renderChartArea(){
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
        <View>
          {this.renderChart()}
        </View>
      )
    }
  }

  changeRange(id){
    var list = ['dd','ww','mm','yyyy'];
    var units= ['hh','wd','dd','mm'];
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

    this.setState({range: list[id], unit: units[id], lastDate}, function() {
      this.fetchData();
    });
  }

  renderRangeSelect(){
    const screen = Dimensions.get('window');
    var width = screen.width < 340 ? 70 : 80;
    var list = [];

    list.push(DataHandler.unitToString('dd'));
    list.push(DataHandler.unitToString('ww'));
    list.push(DataHandler.unitToString('mm'));
    list.push(DataHandler.unitToString('yyyy'));

    return (
      <View style={{flex:1,alignItems:'flex-end' }}>
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

  render() {
    const {clear_gray,light_gray, bright_blue,white,black,green} = VALUES.COLORMAP;
    const {styles,type,date,range,stores,storeIndexs,compareType,compareTypeList,lastDate,viewNumber,} = this.state;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    const screen = Dimensions.get('window');
    let storesName = "";
    for(var i=0 ; i<storeIndexs.length ; ++i) {
      if(stores[storeIndexs[i]]) {
        if(i>0) { storesName += "、"; }
        storesName += stores[storeIndexs[i]].name;
      }
    }
    var dateFontSize = 18;
    if(screen.width < 340) {
      dateFontSize = 14;
    } else if(screen.width < 380) {
      dateFontSize = 16;
    }
    if(this.state.hiding){
      return        <View style={{paddingTop:0,
              backgroundColor:VALUES.COLORMAP.dkk_background,
              height:screen.height,width:screen.width}}/>;
    }
    return (
      <View style={{paddingTop:0,
        backgroundColor:VALUES.COLORMAP.dkk_background,
        height:screen.height,width:screen.width}}>
        <UTitleBar smallPhone={smallPhone}
          headerText={I18n.t('bi_multistore_analytics')}
          onLeftPress={()=>{this.state.loading ? {} : Actions.pop()}}
          onRightPress={()=>{}}
          leftText={ ''}
          leftIconType={'return'}
          rightIconType={'none'}>
        </UTitleBar>
        <View style={{flexDirection:'row',height:50,alignItems:'center',paddingLeft:16,marginTop:Platform.OS === 'ios'?30:16}}>
          <DropDownSelect0
            defaultIndex={0}
            changeType={(id)=>this.changeCompareType(id)}
            width={screen.width/2-16-12}
            list={compareTypeList}
            content={compareType}
            fontSize={16}
            iconSize={15}
            innerHeight={40}/>
          <View style={{width:(screen.width/2)-16-12,marginLeft:24}}>
            <SettingItem
              index={true}
              head={I18n.t('')}
              data={I18n.t("Select Store")}
              fontsize={16}
              type={'edit'}
              onPress={()=>this.onChangeStore()}/>
          </View>
        </View>
        <View style={[{height:screen.height-104-50,marginTop:17}]}>
          <View style={{height:70}}>
            {this.renderDatePickArea()}
            <View style={{flexDirection:'row-reverse',alignContent:'flex-end',marginRight:16,width:screen.width-32}}>
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
          </View>
          <View style = {[styles.shadowStyle,styles.container,{height:Platform.OS === 'ios'?245:239}]}>
            {this.renderChartArea()}
          </View>
          {(this.state.loading_nodata)?null:
            <ScrollView>
              <View style={{flex:1,width:screen.width}}>
                <View style={{flexDirection:'row', alignItems:'flex-start', marginTop:10, paddingLeft:16, marginBottom:90}}>
                  <View style={{flexDirection:'column',alignItems:'flex-start',flex:2}}>
                    <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.gray_font,fontSize:14}}>
                      {I18n.t("bi_best_store")}
                    </Text>
                    <Text allowFontScaling={false} style={{marginTop:8,marginLeft:4,color:VALUES.COLORMAP.gray_font,fontSize:24}}>
                      {this.state.bestStore}
                    </Text>
                    <Text allowFontScaling={false} style={{marginTop:20,color:VALUES.COLORMAP.gray_font,fontSize:14}}>
                      {I18n.t("bi_worst_store")}
                    </Text>
                    <Text allowFontScaling={false} style={{marginTop:8,marginLeft:4,color:VALUES.COLORMAP.gray_font,fontSize:24}}>
                      {this.state.worstStore}
                    </Text>
                  </View>
                </View>
              </View>
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
