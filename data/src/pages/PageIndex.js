import React, {Component} from 'react';
import VALUES from '../utils/values';
import UshopRestClient from '../utils/webclient'
import DialogHandler from '../utils/DialogHandler'
import DataHandler from '../utils/DataHandler'
import SettingItem from '../components/SettingItem'
import PosRestClient from '../utils/posclient'
import UTitleBar from '../components/UTitleBar'
import CircleItem from '../components/CircleItem'
import Spinner from '../components/Spinner';
// import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import ImageButton from '../components/ImageButton';
import DropDownSelect from '../components/DropDownSelect';
import moment from 'moment'
import {
    BackHandler,
    Dimensions,
    Image,
    ImageBackground,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableHighlight,
    TouchableOpacity,
    View,
    DeviceEventEmitter
} from 'react-native';
import {Actions} from 'react-native-router-flux';
import * as storeSync from "react-native-simple-store";
import {inject, observer} from 'mobx-react'
import DatePicker from "../../../app/thirds/datepicker/DatePicker";
import Toast, {DURATION} from 'react-native-easy-toast';
import GlobalParam from "../../../app/common/GlobalParam";
import {ASYNC_STORE_DATA} from "../../../app/common/Constant";
import I18n from "react-native-i18n";
import store from "../../../mobx/Store";
import StoreSelector from "../stores/StoreSelector";
import Drawer from 'react-native-drawer';
import ServiceDrawer from '../../../app/login/ServiceDrawer';
import {ColorStyles} from "../../../app/common/ColorStyles";
import RNStatusBar from "../../../app/components/RNStatusBar";

function sortNumberbyTime(item1, item2, attr, order) {
  var val1 = item1.date[0],
      val2 = item2.date[0];
  if (val1 == val2) return 0;
  if (val1 > val2) return 1*order;
  if (val1 < val2) return -1*order;
}

function sortNumber(item1, item2, attr, order) {
  var val1 = item1[attr],
      val2 = item2[attr];
  if (val1 == val2) return 0;
  if (val1 > val2) return 1*order;
  if (val1 < val2) return -1*order;
}

@inject('store')
@observer
export default class PageIndex extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.backHandler = null;
    const loginInfo = store.userSelector.loginInfo;
    console.log("loginInfo:",loginInfo)
    var email = '';
    var password = '';
    if(loginInfo) {
       email = loginInfo.email;//'rainney.chen@advantech.com.tw';
       password = loginInfo.password;
    }
    const screen = Dimensions.get('window')
    //console.log(screen.width + ' x '+ screen.height)
    if(screen.width <= 320){
      //console.log("Small Phone")
      store.phoneSelector.smallPhone = true;
    } else {
      store.phoneSelector.smallPhone = false;
    }
    const smallPhone = store.phoneSelector.smallPhone;
    var styles;
    if(smallPhone) {
      styles = smallStyles
    } else {
      styles = largeStyles
    }
    //console.log("Lan=" + I18n.locale);
    var stores = [];
    var storeIndex = -1;
    var accName = '';

    let accountList = store.userSelector.accountList.slice();
    if(accountList) {
      for (var k in accountList) {
        // console.log(this.props.accountList[k])
        if (store.userSelector.accountId == accountList[k].accountId) {
            accName = accountList[k].name;
        }
      }
    }

    /*let storeList = store.storeSelector.storeListBI;
    console.log("storeList in index:",storeList)
    console.log("tempReportStore in index:",store.storeSelector.tempReportStoreBI)
    if(storeList){
      storeList = storeList.slice();
      for(var k in storeList){
        //console.log(this.props.storeList[k])
        var item = {
          name:storeList[k].store_name,
          country:storeList[k].country,
          province:storeList[k].province,
          city:storeList[k].city,
          index:k,
        }
        stores.push(item);
        //stores.push(this.props.storeList[k].store_name);
        let tempReportStore = store.storeSelector.tempReportStoreBI;

        if(tempReportStore && storeList[k].store_id == tempReportStore.store_id){
          storeIndex = k;
        }else{
          storeIndex = 0;
        }
      }
    }*/
    var d = new Date();
    var date = moment(d).format('YYYY/MM/DD');
    this.state = {
      range:'dd',
      unit:'hh',
      date,
      nowDate: date,
      lastDate: true,
      loading:false,
      item:'',
      accName,
      showMenu:false,
      sale:-1,
      userCount:-1,
      buyRate:-1,
      buyCount:-1,
      indoorCount:-1,
      turninRate:-1,
      touchType:null,
      target:{
        sale:0,
        userCount:0,
        cupCount:0,
        cupAvg:0,
        priceAvg:0,
        buyRate:0
      },
      stores,
      storeIndex,
      styles:styles,
      email,
      password,
      error:false,
      weather: {
        condition: -1,
        temp_high: 999,
        temp_low: 999
      }
    };
  }

  getTarget(tempReportStore) {
    const token = store.userSelector.token;
    const api = new UshopRestClient();
    var d = new Date();
    var dateContent = moment(d).format('YYYY/MM/DD');
    var req = api.createListPropertyReq('sales_target',token,
    tempReportStore.store_id,'mm' ,dateContent );
    console.log(JSON.stringify(req));
    api.listProperty(req)
      .then(response => this.OnListPropertySuccess(response))    // Remember your credentials
      .catch(err => this.OnListPropertyFail(err.message));  // Catch any error
  }

  OnListPropertyFail(msg){
    console.log("Get BusinessInfo Fail " + msg );
    this.setState({loading: false});
  }

  OnListPropertySuccess(response){
    this.setState({loading: false});
    if(response.propertys.length>0){
      response.propertys =  response.propertys.sort((a,b)=>sortNumberbyTime(a,b,'date[0]',1));
      if( response.propertys[response.propertys.length-1].type  == 'sales_target'){
        //console.log(response.propertys[response.propertys.length-1])
        //console.log(parseInt(response.propertys[response.propertys.length-1].data.workday))
        var saleTarget = 0;
        if(this.state.range == 'ww') {
          saleTarget = parseInt(response.propertys[response.propertys.length-1].data.weekend);
        } else {
          saleTarget = parseInt(response.propertys[response.propertys.length-1].data.workday);
        }
        this.setState({target:{
                        sale:saleTarget,
                        userCount:1,
                        cupCount:1,
                        cupAvg:1,
                        priceAvg:1,
                        buyRate:1} })
      }
    }
  }

  componentDidMount() {
    DeviceEventEmitter.emit('onStatusBar', '#006AB7');
    DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
    this.setState({loading:true});
    this.fetchAllData_init();
    this.backHandler = BackHandler.addEventListener("pageIndexBackPress", () => {
      if(this.state.showMenu) {
        this.setState({showMenu: false});
        return true;
      }
      if(this.state.loading) {
         return true;
      }
    });
  }

  componentWillUnmount() {
    this.backHandler.remove();
  }

  fetchAllData_init(){
    var req ={
      user_id : this.props.store.userSelector.userId,
      token : this.props.store.userSelector.token,
    };
    console.log(req);
    const api = new UshopRestClient();
    api.getStoreList(req).then(response => response)   // Successfully logged in
        .then(response=> this.onStoreListSuccess(response))    // Remember your credentials
        .catch(err => this.onStoreListFail(err.message));  // Catch any error
  }

  onStoreListFail(msg){
      this.refreshStore = false;
      this.refs.toast.show(I18n.t('Get store error'),DURATION.LENGTH_SHORT);
      this.setState({loading:false})
  }

  onStoreListSuccess(response){
    // console.log('onStoreListSuccess ',response)
    if(response.status == 1) {
      // const { storeListetting,groupList} = this.props;
      var stores =[];
      var storeList = response.stores;
      for(var k in storeList){
        storeList[k].sensors =[];
        //console.log(storeList[k])
        var item = {
          name:storeList[k].store_name,
          country:storeList[k].country,
          province:storeList[k].province,
          city:storeList[k].city,
          index:k,
        }
        stores.push(item);
      }
      if(stores.length>0){
        this.setState({stores,storeIndex:0})
        this.props.store.storeSelector.setStoreListBI(storeList)
        this.props.store.storeSelector.setTempReportStoreBI(storeList[0]);
        this.refreshStore && this.onStoreSetting();

      }else {
          this.refs.toast.show(I18n.t('Get store empty'),DURATION.LENGTH_SHORT)
      }
      this.setState({loading:false});
    } else {
      this.logout();
    }

    this.refreshStore = false;
  }
  fetchAllData() {
    console.log("*****in fetchAllData() > store.storeSelector.tempReportStoreBI",store.storeSelector.tempReportStoreBI);
    const tempReportStore = store.storeSelector.tempReportStoreBI;
    console.log("tempReportStore:",tempReportStore);
    this.setState({
      loading:true,
      sale:-1,
      userCount:-1,
      buyRate:-1,
      buyCount:-1,
      indoorCount:-1,
      turninRate:-1}, function() {
        if(tempReportStore) {
          this.getTarget(tempReportStore);
          this.fetchData(tempReportStore);
        } else {
           this.getStoreList();
        }
      })
  }

  changePage(page){
    const {userInfo,tempReportStore,target} = this.state;
    this.setState({showMenu:false})
    if(target.sale>0){
      Actions.push(page);
    } else {
      Actions.push('pageSettingTarget');
    }
  }

  onLoginFail(){

  }

  setInputMode(mode){
    console.log("TextInpuMode=" + mode)
    this.setState({textInputMode:mode});
  }

  getStoreList(){
    var req ={
      user_id: store.userSelector.userId,
      token  : store.userSelector.token,
    };
    console.log("getStoreList:",req)
    const api = new UshopRestClient();
    api.getStoreList(req).then(response => response)   // Successfully logged in
      .then(response=> this.onStoreListSuccess(response))    // Remember your credentials
      .catch(err => this.onStoreListFail(err.message));  // Catch any error
  }

  onStoreListFail(msg){
    console.log("Get Stores Fail " + msg );
    this.setState({loading:false})
  }

  async onStoreListSuccess(response){
    //console.log('onStoreListSuccess ',response)
    this.setState({loading: false});
    // const { storeListetting,groupList} = this.props;
    var stores =[];
    var storeList = response.stores;
    for(var k in storeList){
      if(storeList[k].sensors){
        delete storeList[k].sensors;
      }
      //storeList[k].sensors =[];
      //console.log(storeList[k])
      var item = {
        name:storeList[k].store_name,
        country:storeList[k].country,
        province:storeList[k].province,
        city:storeList[k].city,
        index:k,
      }
      stores.push(item);
    }
    if(stores.length>0){
      let storeIndex = 0;
      let asyncStore = await GlobalParam.getDefaultStore(ASYNC_STORE_DATA);
      console.log("asyncStore:",asyncStore);
      if(asyncStore != null && asyncStore !== ''){
          storeIndex = storeList.findIndex(p=> p.store_id == asyncStore.id);
          (storeIndex == -1) ? (storeIndex = 0) : null;
      }

      await GlobalParam.setAsyncStore(ASYNC_STORE_DATA, storeList[storeIndex].store_id);

      this.setState({stores,storeIndex})
      //this.props.setStoreList(storeList);
      //StoreSelector.setStoreListBI(storeList)
      store.storeSelector.setStoreListBI(storeList)
      //StoreSelector.setTempReportStoreBI(storeList[storeIndex])
      store.storeSelector.setTempReportStoreBI(storeList[storeIndex])
      this.setState({sale:-1,
            userCount:-1,
            buyRate:-1,
            buyCount:-1,
            indoorCount:-1,
            turninRate:-1,
            target:{sale:0,
            userCount:0,
            cupCount:0,
            cupAvg:0,
            priceAvg:0,
            buyRate:0}
          })
      this.getTarget(storeList[storeIndex]);
      this.fetchData(storeList[storeIndex]);
    }
  }

  renderLogo(){
    const {styles} = this.state;
    const smallPhone = store.phoneSelector.smallPhone;
    var gap;
    if(smallPhone){
      gap=60;
    } else {
      gap=60;
    }
    const screen = Dimensions.get('window')
    var logoImage = require('../../images/logo_white.png')
    var lWidth = screen.width -gap;
    var lHeight = lWidth * 0.8;
    var logoStyle={width:lWidth,height:lHeight }
    if(!this.state.textInputMode){
      return <View><Image style={logoStyle} source={logoImage}/></View>
    }
  }

  toSetting(){

  }

  onChangeStore(){
    var stores ={ index:this.state.storeIndex,list:this.state.stores}
    const screen = Dimensions.get('window')
    if(this.state.stores && this.state.stores.length>0){
          DialogHandler.openStoresDialog(screen.width-60,I18n.t('Select Store'),stores ,this,{type:'store'});
    }
  }

  async onNextPressed(param){
    if(param.type=='store' ){
      this.setState({storeIndex:param.index})
      let storeList = store.storeSelector.storeListBI.slice()//store.storeSelector.storeList.slice();
      const loginInfo = store.userSelector.loginInfo;
      store.storeSelector.setTempReportStoreBI(storeList[param.index])//store.storeSelector.setTempReportStore(storeList[param.index])

      await GlobalParam.setAsyncStore(ASYNC_STORE_DATA,storeList[param.index].store_id);

      DataHandler.getStoreTarget(loginInfo.email,storeList[param.index].store_id)
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
      this.setState({ sale:-1,
                      userCount:-1,
                      buyRate:-1,
                      buyCount:-1,
                      indoorCount:-1,
                      turninRate:-1,
                      target:{sale:0,
                      userCount:0,
                      cupCount:0,
                      cupAvg:0,
                      priceAvg:0,
                      buyRate:0}
                      ,loading:true})
      this.getTarget(storeList[param.index]);
      this.fetchData(storeList[param.index]);
    }
  }

  fetchData(tempReportStore){
    const {range,unit} = this.state;
    const api = new UshopRestClient();
    const token = store.userSelector.token;
    const widgetList = store.widgetSelector.list.slice();

    var list=[];
    var promises = [];
    //list.push(widgetList[2]) //銷售
    //list.push(widgetList[3]) //交易筆數
    //list.push(widgetList[6]) //鎖售率
    list.push(widgetList[1]) //進店率
    list.push(widgetList[0]) //客流量
    list.push(widgetList[16]) //天氣
    for(var k in  list){
      var widget = list[k];
      var req = DataHandler.createSimpleRequest(token,widget.data_source,
        range,range,this.state.date,tempReportStore);
      promises.push(api.widgetData(req));
    }
    this.getItemData(tempReportStore, function() {
      //console.log("promises, ", promises);
      this.promiseRequests(promises);
    }.bind(this));
  }

  getItemData(tempReportStore, callbackFunc){
    //console.log('getItemData')
    const {range,unit} = this.state;
    const api = new PosRestClient();
    const token = store.userSelector.token;
    const accountId = store.userSelector.accountId;

    var promises = [];
    this.setState({item:''});
    api.getItemData(accountId, token, [tempReportStore.register_key],
      DataHandler.ceateDatePeriod(this.state.date,range),range).then(response => response)   // Successfully logged in
       .then(res=>{
          console.log(res);
          this.setState({loading: false});
          this.handleItemData(res);
          callbackFunc();
        })    // Remember your credentials
       .catch(err =>{
           console.log(err);
           this.setState({loading: false});
           callbackFunc();
        });  // Catch any error
  }

  getItemDataDay(){
    //console.log('getItemData');
    const {range,unit} = this.state;
    const api = new PosRestClient();
    const token = store.userSelector.token;
    const accountId = store.userSelector.accountId;
    const tempReportStore = store.storeSelector.tempReportStoreBI;

    var promises = [];
    this.setState({item:''})
    api.getItemData(accountId,token,[tempReportStore.register_key]
    ,DataHandler.ceateDatePeriod(null,range),unit).then(response => response)   // Successfully logged in
     .then(res=>{
       console.log(res)
       this.handleItemData(res);
      })    // Remember your credentials
     .catch(err =>{
       console.log(err)
       this.setState({loading: false});
      });  // Catch any error
  }

  handleItemData(data){
    console.log(data);
    if( data && data.datas && data.datas[0] && data.datas[0].retrived &&
      data.datas[0].retrived.length > 0) {
      var items = data.datas[0].retrived[data.datas[0].retrived.length-1].statistic.item_statics;
      //cosnole.log(items)
      if(items.length>0) {
        items = items.sort((a,b)=>sortNumber(a,b,'qty',-1));
        this.setState({ item: items[0].item_name });
      }
      this.setState({
        userCount: data.datas[0].retrived[0].transaction_count,
        sale: data.datas[0].retrived[0].total_amount
      });
    }
  }

  promiseRequests(promises){
    var handle = function(results) {
      //console.log("promiseRequests > handle results:",results)
      if(results[0].status == 1) {
        this.handleResults(results);
        this.setState({loading:false});
      } else {
        this.logout();
      }
    }.bind(this);
    var doFail = function() {
      this.setState({loading:false});
    }.bind(this);
    Promise.all(promises)
    .then(function(data) {
      //console.log("promiseRequests > data:",data)
      handle(data);
    })
    .catch(function(err) {
      doFail();
    });
  }

  logout() {
    this.refs.toast.show(I18n.t("bi_login_expired"),DURATION.LENGTH_SHORT);
    setTimeout(function() {
      let loginInfo = store.userSelector.loginInfo;
      //loginInfo.password = '';
      storeSync.save('Login',JSON.stringify(loginInfo));
      Actions.reset('loginScreen');
    }.bind(this),DURATION.LENGTH_SHORT+3);
  }

  handleResults(results){
    const widgetList = store.widgetSelector.list.slice();
    var list=[];
    list.push(widgetList[1]) //進店率
    list.push(widgetList[0]) //客流量
    list.push(widgetList[16]) //天氣
    var data =[];
    for(var k in results) {
      if(list[k].title == "天氣") {
        var weather = this.state.weather;
        weather.condition = results[k].retrived[0].data[0].conditions.row[0] || 0;
        weather.temp_high = results[k].retrived[0].data[0].high_temp_c.row[0] || 999;
        weather.temp_low = results[k].retrived[0].data[0].low_temp_c.row[0] || 999;
        this.setState(weather);
      } else {
        if(results[k].status !=1) {
          return;
        }
        var d = DataHandler.parseDataResponse(results[k], list[k].data_source);
        data.push(d[0].row[0]);
      }
    }
    var turninRate = parseFloat((data[0]*100).toFixed(1));
    if(turninRate>100)turninRate=100;
    if(turninRate<0)turninRate=0;
    var indoorCount= data[1];
    if(indoorCount<0)indoorCount=0;
    this.setState({
      loading:false,
      turninRate,
      indoorCount,
    })
  }

  renderSales(){
    const screen = Dimensions.get('window')
    const {sale,target} = this.state;
    var height = screen.height *0.08;
    var imgWidth =height*6;
    var bgImgYellow = require('../../images/1_pic.png')
    var bgImgRed = require('../../images/2_pic.png')
    var text = '￥'+sale;
    var bgImg =bgImgRed;
    console.log(sale,target)
    if(target.sale>0 && sale > (target.sale*0.8)){
      bgImg =bgImgYellow ;
    }
    return (<View style={{width:screen.width,height,marginTop:25}}>
              <ImageBackground
                  style={{width:imgWidth,height,
                    flexDirection:'row',
                    paddingRight:imgWidth*0.22,
                    justifyContent:'flex-start',
                    alignItems:'center'}}
                  source={bgImg}>
                <Text allowFontScaling={false} style={{marginLeft:14,marginRight:imgWidth*0.10, color:'#ffffff',fontSize:14}}>
                  {I18n.t("bi_simple_total")+I18n.t("bi_sale_values")}
                </Text>
                <Text allowFontScaling={false} style={{color:'#ffffff',fontSize:22}}>
                  {text}
                </Text>
              </ImageBackground>
            </View>)
  }

  renderPic2(){
    const screen = Dimensions.get('window')
    const {sale,buyRate,buyCount,indoorCount,turninRate,target,userCount,weather,range} = this.state;
    var height = screen.width*1.35 ;
    var width =screen.width*0.9 ;
    var bgImg = require('../../images/4_pic.png')
    var flagBuyGoold = false;
    var flagTrafficGood = false;
    var perBuyRate = -1;
    if(indoorCount>0 && userCount >0 ){
      perBuyRate = (userCount*100)/indoorCount;
      perBuyRate = parseFloat(perBuyRate.toFixed(1));
      if(perBuyRate>100)perBuyRate=100;
    }
   //console.log('perBuyRate ',perBuyRate)
    if(target.buyRate>0 && buyRate >target.buyRate*0.8 ){
      flagBuyGoold= true;
    }
    //console.log("turninRate:",turninRate);
    if(turninRate>10 ){
      flagTrafficGood = true;
    }
    var salePer = 0;
    if(target.sale>0){
        var salePer=parseInt((sale*100)/target.sale);
        if(salePer>100) salePer=100;
    }
    var weatherIcon = null;
    var weatherTemp = "";
    if(range == 'dd') {
      weatherIcon = VALUES.getWeatherIcon(weather.condition);
      if(weather.temp_high != 999 && weather.temp_low != 999) {
        weatherTemp = parseInt((weather.temp_high+weather.temp_low)/2) + '°C';
      }
    }
    return (<View style={{
              backgroundColor:"#FFFFFF",
              borderRadius:10,
              marginTop:10,
              marginBottom:30,
              marginLeft:screen.width*0.05,
              width:width,height,
              flexDirection:'column',
              justifyContent:'flex-start',
              alignItems:'center',
              shadowColor: "rgba(0,0,0,0.16)",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.50,
              shadowRadius: 1.41,
              elevation: 2,
              }}>

              <View style={{
                padding:10,
                flexDirection:'column',
                justifyContent:'space-between',
                alignItems:'center',
                width:screen.width*0.9,
                height:height*0.3,
              }}>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center'}}>
                  <View style={{flex:1, justifyContent:'flex-start'}}/>
                  <View style={{flex:1,justifyContent:'center',alignItems:'center',paddingTop:14}}>
                    <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.dkk_font_grey,fontSize:22}}>
                      {I18n.t("bi_sale_values")}
                    </Text>
                  </View>
                  <View style={{flex:1,flexDirection:'row',justifyContent:'flex-end',alignItems:'flex-end'}}>
                    <Image style={{marginRight:5,width:20,height:20}} source={weatherIcon}/>
                    <Text allowFontScaling={false} style={{color:'#B1B2B4',fontSize:14}}>
                      {weatherTemp}
                    </Text>
                  </View>
                </View>
                <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.dkk_font_grey,fontSize:30}}>
                  {DataHandler.numberFormat(sale)}
                </Text>
                <View style={{
                  paddingLeft:10,
                  paddingRight:10,
                  flexDirection:'row',
                  justifyContent:'space-between',
                  alignItems:'center',
                  width:screen.width*0.9,
                  height:5,
                  }}>
                  <View style={{flex:salePer, height:5, backgroundColor:'#5091D9'}}/>
                  <View style={{flex:(100-salePer), height:5, backgroundColor:'#D3D4D6'}}/>
                </View>
                <View style={{
                  paddingLeft:10,
                  paddingRight:10,
                  marginTop:8,
                  marginBottom:10,
                  flexDirection:'row',
                  width:screen.width*0.9,
                  }}>
                  <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.dkk_blue,fontSize:16}}>
                    {I18n.t("bi_hit_rate")}
                  </Text>
                  <View style={{flex:1 }}/>
                  <Text allowFontScaling={false} style={{color:VALUES.COLORMAP.dkk_blue,fontSize:16}}>
                    {salePer+'%'}
                  </Text>
                </View>
              </View>

              <View style={{
                width:screen.width*0.9,
                height:height*0.24,
                paddingRight:10,
                paddingLeft:10,
                flexDirection:'row',
                justifyContent:'flex-start',
                alignItems:'center',
                }}>
                <View style={{flex:1}}>
                  <View style={{
                    paddingTop:height*0.04,
                    width:screen.width*0.9-20,
                    height:height*0.24,
                    flexDirection:'row',
                    justifyContent:'flex-start',
                    alignItems:'flex-start',
                    borderColor:'#D3D4D6',
                    borderTopStyle:'dotted',
                    borderTopWidth:1
                    }}>
                    <View>
                      <View style={{flexDirection:'row',
                        justifyContent:'flex-start',
                        alignItems:'center'}}>
                        <Image style={{marginRight:5,width:30,height:30}} source={require('../../images/1_pic.png')}/>
                        <Text allowFontScaling={false}
                          style={{width:(width-height*0.15-100),color:'#64686D', fontSize: (I18n.locale == "en" ? 14 : 16)}}>
                          {I18n.t("bi_people_in")}
                        </Text>
                      </View>
                      <View style={{flexDirection:'row',
                        justifyContent:'flex-start',
                        marginTop:5,
                        alignItems:'flex-end',paddingLeft:35}}>
                        <Text allowFontScaling={false}
                          style={{color:'#64686D',fontSize:30}}>
                            {DataHandler.numberFormat(indoorCount)}
                        </Text>
                        <Text allowFontScaling={false}
                          style={{marginBottom:5,color:'#64686D',fontSize:14}}>
                            {I18n.t("bi_unit_person")}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{flexDirection:'row', justifyContent:'flex-start', alignItems:'center'}}>
                  </View>
                </View>
                <CircleItem value={turninRate<0?' - ':(turninRate>0?turninRate:0)}
                        text={I18n.t("bi_turnin_rate")}
                        color={'#3584DB'}
                        radius={height*0.15}/>
              </View>

              <View style={{
                width:screen.width*0.9,
                height:height*0.24,
                paddingRight:10,
                paddingLeft:10,
                flexDirection:'row',
                justifyContent:'flex-start',
                alignItems:'center',
                }}>
                <View style={{flex:1}}>
                  <View style={{
                    paddingTop:height*0.04,
                    width:screen.width*0.9-20,
                    height:height*0.24,
                    flexDirection:'row',
                    justifyContent:'flex-start',
                    alignItems:'flex-start',
                    borderColor:'#D3D4D6',
                    borderTopStyle:'dotted',
                    borderTopWidth:1
                    }}>
                    <View>
                      <View style={{flexDirection:'row', justifyContent:'flex-start', alignItems:'center'}}>
                        <Image style={{marginRight:5,width:30,height:30}} source={require('../../images/2_pic.png')}/>
                        <Text allowFontScaling={false} style={{width:(width-height*0.15-100),color:'#64686D',fontSize:16}}>
                          {I18n.t("bi_shopper_count")}
                        </Text>
                      </View>
                      <View style={{flexDirection:'row',
                        justifyContent:'flex-start',
                        marginTop:5,
                        alignItems:'flex-end',paddingLeft:35}}>
                        <Text allowFontScaling={false} style={{color:'#64686D',fontSize:30}}>
                          {DataHandler.numberFormat(userCount)}
                        </Text>
                        <Text allowFontScaling={false} style={{marginBottom:5,color:'#64686D',fontSize:14}}>
                          {I18n.t("bi_unit_person")}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{flexDirection:'row', justifyContent:'flex-start', alignItems:'center'}}>
                  </View>
                </View>
                <CircleItem value={perBuyRate<0?' - ': (perBuyRate>0?perBuyRate:0)}
                      text={I18n.t("bi_shop_rate")}
                      color={'#3584DB'}
                      radius={height*0.15}/>
              </View>

              <View style={{
                width:screen.width*0.9,
                height:height*0.24,
                paddingRight:10,
                paddingLeft:10,
                flexDirection:'row',
                justifyContent:'flex-start',
                alignItems:'center',
                }}>
                <View style={{flex:1 }}>
                  <View style={{
                    paddingTop:height*0.04,
                    width:screen.width*0.9-20,
                    height:height*0.24,
                    flexDirection:'row',
                    justifyContent:'flex-start',
                    alignItems:'flex-start',
                    borderColor:'#D3D4D6',
                    borderTopStyle:'dotted',
                    borderTopWidth:1
                    }}>
                    <View>
                      <View style={{flexDirection:'row',
                        justifyContent:'flex-start',
                        alignItems:'center'}}>
                        <Image style={{marginRight:5,width:30,height:30}} source={require('../../images/3_pic.png')}/>
                        <Text allowFontScaling={false} style={{color:'#64686D',fontSize:16}}>
                          {I18n.t('bi_top_sell_item')}
                        </Text>
                      </View>
                      <View style={{flexDirection:'row',
                        justifyContent:'flex-start',
                        marginTop:5,
                        alignItems:'flex-end',paddingLeft:35}}>
                        <Text allowFontScaling={false} style={{color:'#64686D',fontSize:18}}>
                          {this.state.item}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{flexDirection:'row', justifyContent:'flex-start', alignItems:'center'}}>
                  </View>
                </View>
              </View>
            </View>)
  }

  doAFterClick() {
    const {touchType} = this.state;
    if(touchType) {
      var img;
      this.setState({touchType:null})
      console.log("*doAFterClick > store.storeSelector.tempReportStoreBI:",JSON.stringify(store.storeSelector.tempReportStoreBI));
      if (store.storeSelector.tempReportStoreBI == null || store.storeSelector.tempReportStoreBI.length==0) {
         this.refs.toast.show(I18n.t('Get store empty'), DURATION.LENGTH_SHORT);
         return
      }

      if(touchType=='sale'){
        this.changePage('pageDetailReport');
      } else if(touchType=='traffic'){
        this.changePage('pageCustom');
      } else if(touchType=='item'){
        this.changePage('pageItem');
      } else if(touchType=='return'){
        this.changePage('pageReturn');
      } else if(touchType=='report'){
        this.changePage('pageAbstract');
      } else if(touchType=='compare'){
        console.log("touchType:compare");
        this.changePage('pageStoresCompare');
      }
    }
  }

  renderMenu(){
    const {touchType} = this.state;
    const screen = Dimensions.get('window');
    var left = (screen.width-(106*3))/2;
    var btn1 = touchType == 'sale' ? require('../../images/menu_btn1_pressed.png') : require('../../images/menu_btn1.png');
    var btn2 = touchType == 'traffic' ? require('../../images/menu_btn2_pressed.png') : require('../../images/menu_btn2.png');
    var btn3 = touchType == 'item' ? require('../../images/menu_btn3_pressed.png') : require('../../images/menu_btn3.png');
    var btn4 = touchType == 'report' ? require('../../images/menu_btn4_pressed.png') : require('../../images/menu_btn4.png');
    var btn5 = touchType == 'compare' ? require('../../images/menu_btn5_pressed.png') : require('../../images/menu_btn5.png');
    var btn6 = touchType == 'return' ? require('../../images/menu_pressed7_pic.png') : require('../../images/menu_normal7_pic.png');
    if(this.state.showMenu){
      return (
        <View style={{position:'absolute',top:0,left:0,width:screen.width,height:screen.height,backgroundColor:"rgba(0, 0, 0, 1)",opacity:.8}}>
          <TouchableHighlight onPressIn={()=>{this.setState({touchType: 'sale'})}} onPressOut={()=>{this.doAFterClick()}} underlayColor={'transparent'}
            style={{zIndex:2, position:'absolute',left:left,top:182, justifyContent:'center',alignItems:'center'}}>
            <View style={{justifyContent:'center',alignItems:'center'}}>
              <ImageBackground style={{width:56,height:56}} source={btn1}/>
              <Text style={{textAlign: 'center',width:106,color:"#fff"}}>{I18n.t("bi_sells_datas").replace(" ","\n")}</Text>
            </View>
          </TouchableHighlight>
          <TouchableHighlight onPressIn={()=>{this.setState({touchType: 'traffic'})}} onPressOut={()=>{this.doAFterClick()}} underlayColor={'transparent'}
            style={{zIndex:2, position:'absolute',left:left+106,top:182, justifyContent:'center',alignItems:'center'}}>
            <View style={{justifyContent:'center',alignItems:'center'}}>
              <ImageBackground style={{width:56,height:56}} source={btn2}/>
              <Text style={{textAlign: 'center',width:106,color:"#fff"}}>{I18n.t("bi_customer_datas").replace(" ","\n")}</Text>
            </View>
          </TouchableHighlight>
          <TouchableHighlight onPressIn={()=>{this.setState({touchType: 'return'})}} onPressOut={()=>{this.doAFterClick()}} underlayColor={'transparent'}
            style={{zIndex:2, position:'absolute',left:left+212,top:182, justifyContent:'center',alignItems:'center'}}>
                <View style={{justifyContent:'center',alignItems:'center'}}>
                    <ImageBackground style={{width:56,height:56}} source={btn6}/>
                    <Text style={{textAlign: 'center',width:106,color:"#fff"}}>{I18n.t("bi_oldcustom_data").replace(" ","\n")}</Text>
                </View>
            </TouchableHighlight>
          <TouchableHighlight onPressIn={()=>{this.setState({touchType: 'item'})}} onPressOut={()=>{this.doAFterClick()}} underlayColor={'transparent'}
            style={{zIndex:2, position:'absolute',left:left,top:296, justifyContent:'center',alignItems:'center'}}>
            <View style={{justifyContent:'center',alignItems:'center'}}>
              <ImageBackground style={{width:56,height:56}} source={btn3}/>
              <Text style={{textAlign: 'center',width:106,color:"#fff"}}>{I18n.t("bi_item_datas").replace(" ","\n")}</Text>
            </View>
          </TouchableHighlight>
          <TouchableHighlight onPressIn={()=>{this.setState({touchType: 'report'})}} onPressOut={()=>{this.doAFterClick()}} underlayColor={'transparent'}
            style={{zIndex:2, position:'absolute',left:left+106,top:296, justifyContent:'center',alignItems:'center'}}>
            <View style={{justifyContent:'center',alignItems:'center'}}>
              <ImageBackground style={{width:56,height:56}} source={btn4}/>
              <Text style={{textAlign: 'center',width:106,color:"#fff"}}>{I18n.t("bi_abstract_reports").replace(" ","\n")}</Text>
            </View>
          </TouchableHighlight>
          <TouchableHighlight onPressIn={()=>{this.setState({touchType: 'compare'})}} onPressOut={()=>{this.doAFterClick()}} underlayColor={'transparent'}
            style={{zIndex:2, position:'absolute',left:left+212,top:296, justifyContent:'center',alignItems:'center'}}>
            <View style={{justifyContent:'center',alignItems:'center'}}>
              <ImageBackground style={{width:56,height:56}} source={btn5}/>
              <Text style={{textAlign: 'center',width:106,color:"#fff"}}>{I18n.t("bi_multistore_analytics").replace(" ","\n")}</Text>
            </View>
          </TouchableHighlight>
        </View>
      )
    }
  }

  renderMenuButton(){
    var img = this.state.showMenu ? require('../../images/menu_icon_close.png') : require('../../images/menu_icon.png');
    return (
      <TouchableOpacity onPress={()=>{ this.setState({showMenu:!this.state.showMenu})}}
        style={{zIndex:2, position:'absolute',right:16,bottom:20, justifyContent:'center',alignItems:'center'}}>
        <ImageBackground style={{width:50,height:50, justifyContent:'center',alignItems:'center'}} source={img}>
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  renderTouchType(){
    const {touchType} = this.state;
    if(touchType) {
      var img;
      if(touchType=='sale') {
        img= require('../../images/2menu_selected_pic.png');
      } else if(touchType=='traffic') {
        img= require('../../images/2menu_selected_pic2.png');
      } else if(touchType=='item') {
        img= require('../../images/2menu_selected_pic3.png');
      } else if(touchType=='report') {
        img= require('../../images/2menu_selected_pic4.png');
      }
      return   (<View style={{zIndex:3, position:'absolute',left:0,right:0, justifyContent:'center',alignItems:'center'}}>
                  <ImageBackground style={{width:180,height:180, justifyContent:'center',alignItems:'center'}}
                    source={img}>
                  </ImageBackground>
                </View>)
    }
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
       this.fetchAllData();
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
      this.fetchAllData();
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
          this.fetchAllData();
      }.bind(this),20)
  }

  renderRangeSelect(){
    const screen = Dimensions.get('window');
    var list = [];

    list.push(DataHandler.unitToString('dd'));
    list.push(DataHandler.unitToString('ww'));
    var width = screen.width < 340 ? 65 : 75;

    return (  <View style={{flex:1,alignSelf:'center',alignItems:'flex-end'}}>
                  <DropDownSelect changeType={(id)=>this.changeRange(id)}
                      defaultIndex={0}
                      width={width}
                      list={list}
                      content={DataHandler.unitToString(this.state.range)}/>
              </View>)
  }

  changeRange(id){
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
    }
    lastDate = (nowDate <= date);

    this.setState({range: list[id], unit: units[id], lastDate}, function() {
      this.fetchAllData();
    })
  }

  onDrawer(open){
    if(open){
      DeviceEventEmitter.emit('onStatusBarTrans', true);
      DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
    }
    store.userSelector.openDrawer = open;
  }

  render() {
      const {date,range,styles,stores,storeIndex,lastDate} = this.state;
      const smallPhone = store.phoneSelector.smallPhone;
      var gap
      if(smallPhone){
        gap=60;
      }
      else{
          gap=60;
      }
      const screen = Dimensions.get('window');
      var bgImg = require('../../images/login_bg.jpg');
      var logoImage = require('../../images/login_logo_pic.png');
      var loginImage = require('../../images/login_pic.png');
      var name='';
      // if(this.props.userInfo){
      //
      //   name = this.props.userInfo.fullname;
      //   //console.log(name)
      // }
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
        <Drawer
          type='overlay'
          content={<ServiceDrawer ref={'serviceDrawer'} onDrawer={(open)=>{this.onDrawer(open)}}/>}
          open={store.userSelector.openDrawer}
          tapToClose={true}
          openDrawerOffset={0}
          onCloseStart={()=>{this.refs.serviceDrawer.backClick()}}
          tweenHandler={(ratio) => ({mainOverlay: {opacity:store.userSelector.openDrawer ? 0.6 : 0,backgroundColor:'black'}})}>
          <View>
            {Platform.OS === 'android'?<RNStatusBar/>:null}
            <View style={{paddingTop:0,
                          width:screen.width,height:"100%", backgroundColor:VALUES.COLORMAP.dkk_background}}>
              <UTitleBar smallPhone={smallPhone}
                        headerText={this.state.accName}
                        onLeftPress={()=>{this.state.loading ? {} : this.onDrawer(true)}}
                        onRightPress={()=>{}}
                        rightIconType={'none'}
                        leftIconType={'switch'}/>
              <View style={{marginTop:Platform.OS === 'ios'?40:16,marginLeft:16,marginRight:16,backgroundColor:VALUES.COLORMAP.dkk_background}}>
              <SettingItem index={true}
                          title ={I18n.t('Select Store')}
                          data={stores[storeIndex]?stores[storeIndex].name:''}
                          type={'edit'}
                          onPress={()=>this.onChangeStore()}/>
              </View>
              <View style={{width:screen.width-32, flexDirection:'row',height:40,alignItems:'center',alignContent:'center',justifyContent:'space-between',marginLeft:16,marginRight:16}}>
                <View style={{justifyContent:'flex-start',alignItems:'flex-start',marginLeft:0}}>
                  {this.renderDatePicker()}
                </View>
                <TouchableOpacity onPress={()=>{this.previousDate()}} style={{alignSelf:'flex-start',justifyContent:'center',height:40,width:20}}>
                  <ImageButton height={16} width={16} type={'left'} onPress={()=>{this.previousDate()}}/>
                </TouchableOpacity>
                <View style={{flexDirection:'row',height:40,width:screen.width-200,alignContent:'center'}}>
                  <Text allowFontScaling={false} style={{flex:3,alignSelf:'center',textAlign:'center',color:VALUES.COLORMAP.gray_font,fontSize:dateFontSize}}>
                  {DataHandler.getDateTitle(date,range)}
                  </Text>
                </View>
                <TouchableOpacity onPress={()=>{this.nextDate()}} style={{flexDirection:'row',height:40,width:20,alignContent:'center'}}>
                  <View style={{alignSelf:'center',opacity: lastDate ? 0.3 : 1}}>
                    <ImageButton height={16} width={16} type={'right'} onPress={()=>{this.nextDate()}}/>
                  </View>
                </TouchableOpacity>
                <View style={{flexDirection:'row',height:40,width:80, alignContent:'center',alignSelf:'flex-end'}}>
                  {this.renderRangeSelect()}
                </View>
              </View>
              <View style={{flex:1,marginBottom:80}} >
                <ScrollView>
                  {this.renderPic2()}
                </ScrollView>
              </View>
              {this.renderMenu()}
              {this.renderMenuButton()}
            </View>

            <Spinner visible={this.state.loading} />
            <DatePicker ref={"datePicker"} mode={true} initDate={new Date(this.state.date)} onSelected={(date)=>this.onDateSelected(date)}/>
            <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
          </View>
        </Drawer>
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
