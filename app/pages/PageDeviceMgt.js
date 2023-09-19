import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {AppContainer,
        PageContainer,
        Header,Container,
        Selection,
        Typography,
        Tab,
        Icon,
        BottomNav,
        IconButton,
        TouchCard,
        SearchInput,
        Toast,
        NormalDialog,
        NormalButton} from '../../framework'
import {LangUtil,StoreUtil,StorageUtil,COLORS,DimUtil,StringUtil} from '../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,DEVICE_TYPES,STORAGES} from  "../define"
import CcmAPI from "../api/ccm"
import MainAPI from "../api/main"
import DataMonitorItem from "../components/DataMonitorItem"
import { DeviceEventEmitter} from 'react-native';
import SensorItem from '../components/SensorItem'
import DeviceItem from '../components/DeviceItem'
import DatePicker from "../components/DatePicker"
import RegionPicker from "../components/RegionPicker"
import StorePicker from "../components/StorePicker"
import SortPicker from "../components/SortPicker"
import AddDevicePanel from "../components/AddDevicePanel"
import moment from 'moment'
class PageDeviceMgt extends Component {
  constructor(props) {
    super(props);
    let unread =  StoreUtil.getSize(props.loginInfo.accountId)
    let dialog
    if(this.props.storeList.length==0){
      dialog = {title:LangUtil.getStringByKey("service_need_add_title")
      ,msg1:"",msg2: LangUtil.getStringByKey("service_need_add_store")}
    }
    else if(!this.props.loginInfo.hasColdchain){
        dialog = {title:LangUtil.getStringByKey("service_need_add_title")
        ,msg1:"",msg2: LangUtil.getStringByKey("service_need_add_device2")}
    }
    this.state={
      unread,
      events:[],
      probers:[],
      sensors:[],
      devices:[],
      isSensor:1,
      toast:null,
      loading:true,
      dialog,
      addDevice:false,
      deleteMode:false,
      confirmDelete:false,
      targetItem:null,
      searchMode:false,
      stores:[],
      timezone:''
    }
  }
  async fetchSettings(){
    const {loginInfo,navigation} = this.props;
    this.props.setLoading(true);
    let result;
    let alertRules = [];
    let monitorRules = [];
    let userPositions = [];
    let userDepartments = [];
    if(loginInfo.hasColdchain){
      result  = await CcmAPI.getUserPositionDefineList();
      if(result.status == ERROR_CODE.SUCCESS){
          userPositions = result.defines;
      }
      result  = await CcmAPI.getUserDepartmentDefineList();
      if(result.status == ERROR_CODE.SUCCESS){
          userDepartments = result.defines;
      }
      result  = await CcmAPI.getAlertRuleList();
      if(result.status == ERROR_CODE.SUCCESS){
          alertRules = result.alert_rules;
      }
      result  = await CcmAPI.getMonitorRuleList();
      if(result.status == ERROR_CODE.SUCCESS){
          monitorRules = result.monitor_rules;
      }

    }

    this.props.setLoading(false);
    this.setState({alertRules,monitorRules,userPositions,userDepartments})
  }
  componentWillUnmount() {

  }

  async componentDidMount() {
    //await this.fetchSettings();
    await this.fetchData()
    this.listener  = DeviceEventEmitter.addListener("FILTER_CHANGE", async(event)=>{
      console.log("FILTER_CHANGE fetch data")
      await this.fetchData(event.ccmFilter);
    })
    //DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_adddev_success"),type:'success'})
    //DeviceEventEmitter.addListener("FILTER_STORE_CHANGE", async(event)=>{
    //  await this.fetchData(event.ccmFilter);
    //})


  }
  componentWillUnmount(){
    if(this.listener){
      DeviceEventEmitter.removeSubscription(this.listener)
    }
  }
  async checkLoginStatus(){
      const {token} = this.props;
      let result = await MainAPI.isLogin(token)
      if((result.status != 1 && result.status != 9999 )){

        const {loginInfo,navigation} = this.props;
        let info  = JSON.parse(JSON.stringify(loginInfo))
        let res = await MainAPI.logoutRequest();
        info.token = null;
        info.lastNotificaton = null;
        await StoreUtil.init();
        await StoreUtil.clear()
        StorageUtil.setObj( STORAGES.LOGIN_INFO,{account:info.account})
        this.props.setLoginInfo(info)
        navigation.replace(PAGES.LOGIN,{force:true})
      }
  }
  async fetchData(ccmFilter){
    this.props.setLoading(true);
    await this.checkLoginStatus()
    if(!ccmFilter){
      ccmFilter = this.props.ccmFilter;
    }
    const {loginInfo,storeList} = this.props;
    const {event} = ccmFilter ;
    this.setState({sensors:[],devices:[],loading:true})
    let sensors=[];
    let devices =[];
    let mms = []
    if(loginInfo.hasColdchain){
      console.log("event.store="+event.store)
      let res = await CcmAPI.getMonitorModuleList(event.store);
      if(res.status == ERROR_CODE.SUCCESS){
        mms = res.monitor_modules;
      }
      let result  = await CcmAPI.getSensorList(event.store);
      let bh = storeList.find(p=>p.branch_id == event.store)
      this.setState({timezone:bh.contact.time_zone})
      if(result.status == ERROR_CODE.SUCCESS){
        sensors= result.sensors;
        sensors.forEach((sensor, i) => {
          sensor.mm_name = ""
          sensor.time_zone = bh.contact.time_zone
          sensor.model_name = sensor.value_type
          sensor.ts = "2024"
          sensor.battery = 0;
          sensor.signal = 0;
          sensor.device_id = sensor.sensor_id;
          if(sensor.last_data ){
            if(sensor.last_data.timestamp)
              sensor.ts = moment ( new Date(sensor.last_data.timestamp*1000)).utc().format("YYYY/MM/DD HH:mm")
            if(sensor.last_data.battery){
              sensor.battery = parseInt(sensor.last_data.battery.estimated_Capacity);
            }
            if(sensor.last_data.value){
              sensor.signal = sensor.last_data.value.rssi;
            }
          }
          //console.log(sensor)
          sensor.probers = ""
          mms.forEach((mm, i) => {

              mm.probers.forEach((pb, i) => {
                if(sensor.prober_ids.find(p=>p==pb.prober_id)){
                  sensor.mm_name = mm.mm_name
                  if(sensor.probers==""){
                    sensor.probers = pb.name;
                  }
                  else{
                    sensor.probers = sensor.probers + ","+ pb.name
                  }
                }
              });

          });
          //console.log(sensor.probers)

        });


      }
      result  = await CcmAPI.getGatewayList(event.store);
      if(result.status == ERROR_CODE.SUCCESS){
      //  console.log(result.gateways)
        devices= result.gateways;
        devices.forEach((sensor, i) => {
          sensor.ts = "2024"
          sensor.battery = 0;
          sensor.signal = 0;
          sensor.mm_name = ""
          sensor.time_zone = bh.contact.time_zone
          sensor.probers = ""
          sensor.sensor_id =""
          sensor.device_id = sensor.gateway_id
        });
      }
    }
    console.log("Get Store")
    result  = await MainAPI.getStoreList()
    console.log("Get Store result "+result.status)
    let finalSensors=[];
    let finalGateways=[];
    if(result.status == ERROR_CODE.SUCCESS && result.stores){
      let store  = result.stores.find(s=>s.store_id == event.store)
      console.log("Get Store=")
      console.log(store)
      this.setState({stores:result.stores})
      if(store ){
        store.devices.forEach((item, i) => {
          let sensor = item;
          //console.log(item)
          sensor.ts = "2024"
          sensor.battery = null;
          sensor.signal = null;
          sensor.mm_name = "-"
          sensor.time_zone = store.time_zone
          sensor.probers = "-"
          sensor.sensor_id = item.id
          sensor.gateway_id = item.id
          let t = DEVICE_TYPES.find(p=>p.model == sensor.type);
          if(t){
          //  console.log(t)
            if( t.category == 's'){
              let f = sensors.find(s=>s.sensor_id == sensor.sensor_id)

              if(f){  //f.status = item.status;
                  finalSensors.push(f)}
              else{finalSensors.push(item)}
            }
            else{
              let f= devices.find(s=>s.gateway_id == sensor.gateway_id)

              if(f){
              //  f.status = item.status;
                finalGateways.push(f)
              }
              else{
                finalGateways.push(item)
              }
            }


          }


        });

      }


    }
    sensors =  finalSensors;
    devices= finalGateways;
    let order = ccmFilter.device.order?ccmFilter.device.order:-1;
    //device_name","device_id",,"ccm_module_name","ccm_unit_name","device_status","device_battery_status","device_battery_status
    switch(ccmFilter.device.sort ){
      case "device_name":
        sensors = sensors.sort(function(a,b){
            return order*a.name.localeCompare(b.name)
        })
        devices = devices.sort(function(a,b){
            return order*a.name.localeCompare(b.name)
        })
        break;
      case "device_id":
          sensors = sensors.sort(function(a,b){
            return order*a.sensor_id.localeCompare(b.sensor_id)

          })
          devices = devices.sort(function(a,b){
            return order*a.gateway_id.localeCompare(b.gateway_id)
          })
          break;
      case "ccm_module_name":
        sensors = sensors.sort(function(a,b){
          return order*a.mm_name.localeCompare(b.mm_name)
        })
        devices = devices.sort(function(a,b){
          return order*a.mm_name.localeCompare(b.mm_name)
        })
        break;
      case "ccm_unit_name":
        sensors = sensors.sort(function(a,b){
          return order*a.probers.localeCompare(b.probers)
        })
        devices = devices.sort(function(a,b){
          return order*a.probers.localeCompare(b.probers)
        })
        break;
        case "device_status":
          sensors = sensors.sort(function(a,b){
            return order*(a.status -b.status);
          })
          devices = devices.sort(function(a,b){
            return order*(b.status -a.status);
          })
          break;
          case "device_battery_status":
            sensors = sensors.sort(function(a,b){
              return order*(a.battery -b.battery);
            })
            devices = devices.sort(function(a,b){
              return order*(b.battery -a.battery);
            })
            break;
          case "device_signal_status":
              sensors = sensors.sort(function(a,b){
                return order*(a.signal -b.signal);
              })
              devices = devices.sort(function(a,b){
                return order*(a.signal -b.signal);
              })
              break;
      default:
        sensors = sensors.sort(function(a,b){
          return order*(a.ts -b.ts);
        })

    }
    this.setState({sensors,devices,loading:false})
    this.props.setLoading(false);

  }
  openFilter(){

     const {ccmFilter,navigation} = this.props;

     if(!this.open){
          this.open = true;
          let newFilter = JSON.parse(JSON.stringify(ccmFilter));
         // newFilter.cache.event = JSON.parse(JSON.stringify(ccmFilter.event));
          newFilter.cache.device = JSON.parse(JSON.stringify(ccmFilter.device));
          this.props.setCcmFilter(newFilter)
          navigation.push(PAGES.FILTER_MAIN,{mode:'device'})
          setTimeout(function(){
              this.open = false;
          }.bind(this),1000)

     }

  }
  addDevice(){
     const {ccmFilter,navigation} = this.props;
     let newFilter = JSON.parse(JSON.stringify(ccmFilter));
     newFilter.cache.event = JSON.parse(JSON.stringify(ccmFilter.event));
     this.props.setCcmFilter(newFilter)
     this.setState({menu:false,addDevice:true})
     //let newFilter = JSON.parse(JSON.stringify(ccmFilter));
    // DeviceEventEmitter.emit("TOAST",{text:"TESET",type:'error'})
    // newFilter.cache.event = JSON.parse(JSON.stringify(ccmFilter.event));
    //DeviceEventEmitter.emit("TOAST",{text:"TESET",type:'success'})
    //return;
     //newFilter.cache.device = JSON.parse(JSON.stringify(ccmFilter.device));
     //this.props.setCcmFilter(newFilter)
     //navigation.push(PAGES.DEVICE_ADD,{mode:'device'})
  }
  onRegionChanged(data){
     if(data){
       this.props.setCcmFilter(data)
       DeviceEventEmitter.emit("FILTER_CHANGE",{ccmFilter:data})
     }

     this.setState({region:false})
  }
  onStoreChanged(data){
    if(data){
      this.props.setCcmFilter(data)
      DeviceEventEmitter.emit("FILTER_CHANGE",{ccmFilter:data})
    }
     this.setState({store:false})
  }
  onSortChanged(data){
      if(data){
        this.props.setCcmFilter(data)
        DeviceEventEmitter.emit("FILTER_CHANGE",{ccmFilter:data})
      }
     this.setState({sort:false})
  }
  onSearch(t){
    console.log("On Search "+t)
    this.setState({keyword:t})
  }
  renderSensors(){
    const {sensors} = this.state;

  }
  onFinishAddDevice(data){
    if(data){
      this.props.setCcmFilter(data)
      DeviceEventEmitter.emit("FILTER_CHANGE",{ccmFilter:data})
    }
    this.setState({addDevice:false})
  }
  doDeleteDevice(item){
     this.setState({targetItem:item,confirmDelete:true})
  }
  async deleteDeviceActual(){
    const {loginInfo} = this.props;
    const {targetItem} = this.state;
    this.props.setLoading(true);
    let id = targetItem.id?targetItem.id:targetItem.sensor_id?targetItem.sensor_id:targetItem.gateway_id
    let result = await MainAPI.deleteDevice({device_id:id});
    console.log(result)
      this.setState({targetItem:null,confirmDelete:false})
    if(result.status == ERROR_CODE.SUCCESS){
      DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_deldev_success"),type:'success'})
      await this.fetchData();
    }
    else{
      DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_deldev_fail"),type:'error'})
      this.props.setLoading(false);
    }



  }
  /*
  let {info} = this.props;
  console.log(info)
  let result = await deleteDevice({device_id:info.id});
  console.log(result)
  if(result.status == 1 ||result.error_code == "7032"){
     if(this.props.onBack)this.props.onBack();
  }
  else{
      this.toast.show(I18n.t("DeviceDeleteFail"),"fail");
  }
  */
  renderDeleteMode(){
    const {loginInfo,navigation,ccmFilter} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait");
    const {events,keyword,alertRules,monitorRules,dialog,menu,addDevice,targetItem,searchMode,
      userPositions,userDepartments,isSensor,sensors,devices,region,sort,store,timezone} = this.state;
    let state = navigation.getState();
    let routeName = state.routes[state.index].name
    let probers  = isSensor?sensors:devices;
    let filterData = probers;
    if(keyword && keyword.length>0){
        filterData  =[];
        for(var k in probers){
          if( probers[k].mm_name.indexOf(keyword)>=0
              ||probers[k].device_id.indexOf(keyword)>=0
              ||probers[k].model_name.indexOf(keyword)>=0
              || probers[k].probers.indexOf(keyword)>=0
              || probers[k].name.indexOf(keyword)>=0 ){
                  filterData.push(probers[k])
              }
        }

    }
    let types = [LangUtil.getStringByKey("device_type_sensor"),LangUtil.getStringByKey("device_type_other")]
    return ( <View>
              <PageContainer
                hasStore={true}
                routeName={PAGES.DEVICE_MANAGE}
                navigation={this.props.navigation}
                                isEvent={true}
                introduction={this.state.introduction}
                hasColdchain={loginInfo.hasColdchain&&this.props.storeList.length>0}
                dialog={dialog}
                style={{paddingLeft:0,paddingRight:0}}
                onCloseDialog={()=>this.setState({dialog:null})}
                onCloseIntroduction={()=>this.setState({introduction:null})}
                isHeader={true}>
                <Header
                  leftIcon={"cancel"}
                  onLeftPressed={()=>{this.setState({deleteMode:false})}}
                  rightIcon={searchMode?"":(ccmFilter.event.region1||ccmFilter.event.region2)?"header-filteractive":"header-filter" }
                  onRightPressed={()=>{
                    if(searchMode)return
                    let newFilter = JSON.parse(JSON.stringify(ccmFilter));
                    newFilter.cache.event = JSON.parse(JSON.stringify(ccmFilter.event));
                    this.props.setCcmFilter(newFilter)
                    this.setState({region:true})}}
                  text={LangUtil.getStringByKey("device_delete_mode")}
                />
                <Container flexDirection="row" justifyContent="center"
                    fullwidth style={{paddingTop:6,paddingBottom:6,width:'100%',backgroundColor:"#AFC5DF"}}>
                      <Icon style={{width:24,height:24}} mode="static" type="tips"/>
                      <Typography
                               color="text"
                               font={"textxs"}
                               style={{width:width-50}}
                               numberOfLines={3}
                               text={LangUtil.getStringByKey("device_delete_tips")}
                      />
                </Container >
                <Container flexDirection="row" fullwidth style={{height:40,width:'100%',backgroundColor:COLORS.PRIMARY_BLUE}}>
                    {types.map(function(c,i){
                        return   <Container key={i}style={{flex:1}}>
                                  <NormalButton style={{backgroundColor:COLORS.PRIMARY_BLUE,height:34}}
                                  color={isSensor==(1-i)?"white":"#AFC5DF"}
                                 onPress={()=>{this.setState({focusIndex:-1,isSensor:(1-i)})}}
                                 text={c}/>
                                  <Container style={{width:70,height:3,backgroundColor:isSensor==(1-i)?"white":"transparent"}}/>
                                </Container>
                    }.bind(this))}
                </Container >
                {searchMode?<Container
                    fullwidth
                    alignItems={"center"}
                    style={{height:50,marginTop:6,paddingRight:16}}
                    flexDirection={"row"}>
                    <IconButton
                       onPress={()=>{this.setState({keyword:null,searchMode:false})}}
                        text={""}
                        type={"back"}
                        mode="static"
                        iconStyle={{width:24,height:24}}
                        style={{marginRight:5,marginLeft:5}}/>
                    <SearchInput
                       value={this.state.tempkeyword}
                       placeholder={LangUtil.getStringByKey("filter_keyword_search")}
                       onChangeText={(t)=>{
                           this.setState({tempkeyword:t})
                       }}
                       onEnter={(t)=>{
                        this.setState({keyword:this.state.tempkeyword})
                        let nf = JSON.parse(JSON.stringify(this.props.ccmFilter));
                        if(!nf.event.searchRecord){
                          nf.event.searchRecord = [];
                        }

                        if(this.state.tempkeyword&&this.state.tempkeyword.length>0){
                            if(nf.event.searchRecord.length==15){
                               nf.event.searchRecord.splice(-1)
                            }
                            nf.event.searchRecord.unshift(this.state.tempkeyword)
                        }
                        this.props.setCcmFilter(nf)
                       }}
                       onClear={(t)=>{
                        this.setState({keyword:"",tempkeyword:''})
                       }}
                     />
                  </Container>:<Container
                    fullwidth
                    alignItems={"center"}
                    style={{height:40,marginTop:6,paddingLeft:16,paddingRight:16}}
                    flexDirection={"row"}>
                  <TouchCard
                        flexDirection={"row"}
                        onPress={()=>this.setState({store:true})}>
                  <Typography
                           color="primary"
                           font={"subtitle02"}
                           text={StringUtil.getFixedLenName(this.props.ccmFilter.event.storeName,16)+"("+filterData.length+ ")"}
                  />
                  <IconButton
                      onPress={()=>{}}
                      text={""}
                      type={"dropdown-blue"}
                      mode={"static"}
                      iconStyle={{width:24,height:24}}/>
                  </TouchCard>
                  <View style={{flex:1}}/>
                  <IconButton
                      onPress={()=>{this.setState({searchMode:true})}}
                      text={""}
                      type={"action-search"}
                      mode={"static"}
                      iconStyle={{width:24,height:24}}
                      style={{marginRight:8}}/>
                  <IconButton
                      onPress={()=>{this.setState({sort:true})}}
                      text={""}
                      type={"action-sort"}
                      mode={"static"}
                      iconStyle={{width:24,height:24}}
                      style={{marginRight:8}}/>
                      <IconButton
                        onPress={()=>this.setState({introduction:{
                          title:LangUtil.getStringByKey("common_figure"),
                          mode:'detail',
                          info:[
                            { type:LangUtil.getStringByKey("hint_status_desc"),
                              mode:'detail',
                              list:[
                                {title:LangUtil.getStringByKey("device_status"),
                                  list:[
                                  {title:LangUtil.getStringByKey("monitor_status_running"),icon:"illustration-device-status-normal"},
                                   {title:LangUtil.getStringByKey("device_status_sleep"),icon:"illustration-device-status-rest"},
                                   {title:LangUtil.getStringByKey("monitor_status_nodata"),icon:"illustration-device-status-no-data"},
                                   {title:LangUtil.getStringByKey("monitor_status_unbound"),icon:"illustration-device-status-unbind"},
                                   {title:LangUtil.getStringByKey("device_status_expire"),icon:"illustration-device-status-expired"},
                                   {title:LangUtil.getStringByKey("device_status_init"),icon:"illustration-device-status-unactivated"},
                                   {title:LangUtil.getStringByKey("device_status_termiaate"),icon:"illustration-device-status-termination"},
                                   {title:LangUtil.getStringByKey("monitor_status_delete"),icon:"illustration-device-status-delete"},
                                   {title:LangUtil.getStringByKey("monitor_status_offline"),icon:"illustration-device-status-offline"},
                                  ]
                                },{
                                    title:LangUtil.getStringByKey("device_signal_status"),
                                     list:[
                                       {title:LangUtil.getStringByKey("device_signal_good"),icon:"illustration-in-card-signal-good"},
                                       {title:LangUtil.getStringByKey("device_signal_normal"),icon:"illustration-in-card-signal-normal"},
                                       {title:LangUtil.getStringByKey("device_signal_bad"),icon:"illustration-in-card-signal-bad"},
                                       {title:LangUtil.getStringByKey("device_signal_none"),icon:"illustration-in-card-signal-none"},
                                      ]
                                    }
                                  ,
                                  {title:LangUtil.getStringByKey("device_battery_status"),
                                   list:[
                                     {title:LangUtil.getStringByKey("device_battery_good"),icon:"illustration-in-card-battery-good"},
                                     {title:LangUtil.getStringByKey("device_battery_normal"),icon:"illustration-in-card-battery-normal"},
                                     {title:LangUtil.getStringByKey("device_battery_bad"),icon:"illustration-in-card-battery-bad"},
                                     {title:LangUtil.getStringByKey("device_battery_none"),icon:"illustration-in-card-battery-none"},
                                    ]
                                  }
                                ]
                              }
                            ]}
                          })}
                          text={""}
                          type={"action-info"}
                          mode={"static"}
                          iconStyle={{width:24,height:24}}
                          style={{marginRight:0}}/>
                </Container>}
                {searchMode?(keyword&&keyword.length>0)?<Container
                            fullwidth
                            justifyContent="flex-start"
                            alignItems={"center"}
                            style={{marginTop:12,paddingLeft:16,paddingRight:16,width:'100%',marginBottom:5}}
                            flexDirection={"row"}>
                            <Typography
                             　color={"text"}
                              font="text02"
                             text={LangUtil.getStringByKey("filter_search_result")}/>
                   </Container>:<Container
                             fullwidth
                             justifyContent="flex-start"
                             alignItems={"center"}
                             style={{marginTop:12,paddingLeft:16,paddingRight:16,width:'100%',marginBottom:5}}
                             flexDirection={"row"}>
                              <Typography
                               　color={"text"}
                                font="text02"
                               text={LangUtil.getStringByKey("filter_search_record")}/>
                               <IconButton
                                 text={"text03"}
                                 style={{position:'absolute',right:16}}
                                 onPress={()=>{
                                     let nf = JSON.parse(JSON.stringify(this.props.ccmFilter));
                                     nf.event.searchRecord=[];
                                     this.props.setCcmFilter(nf)
                                 }}
                                 text={LangUtil.getStringByKey("filter_clear_all")}/>
                    </Container>:null}
                    {searchMode?null:<Container
                            fullwidth
                            justifyContent="flex-start"
                            alignItems={"center"}
                            style={{paddingLeft:16,paddingRight:16,width:'100%',marginBottom:5}}
                            flexDirection={"row"}>
                            <Typography
                                color="#A5A5A5"
                                font={"textxs"}
                                text={LangUtil.getStringByKey("common_timezone")+timezone}
                            />
                  </Container>}
                {!searchMode||(keyword&&keyword.length>0)?<Container
                    fullwidth
                    scrollable={filterData.length!=0}
                    onRefresh={()=>this.fetchData()}
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1,paddingBottom:160,paddingLeft:16,paddingRight:16,paddingTop:0}}>
                    {
                      filterData.length>0?filterData.map(function(item,i){
                        if(isSensor){
                          return <Container flexDirection="row"
                                      alignItems="center"
                                      key={i} style={{marginBottom:i==filterData.length-1?50:10,marginTop:0}}>
                                      <IconButton
                                          onPress={()=>{
                                            if(item.status==1){
                                              this.doDeleteDevice(item);
                                            }
                                          }}
                                          text={""}
                                          type={item.status==1?"delete-active":"delete-disable"}
                                          mode={"static"}
                                          iconStyle={{width:24,height:24}}
                                          style={{marginRight:8}}/>
                                    <SensorItem
                                     data={item}
                                     style={{width:width-60,marginTop:0}}/>
                                </Container>
                        }
                        else{
                          return <Container flexDirection="row"
                                      alignItems="center"
                                      key={i} style={{marginBottom:i==filterData.length-1?50:10}}>
                                      <IconButton
                                          onPress={()=>{
                                            if(item.status==1){
                                              this.doDeleteDevice(item);
                                            }
                                          }}
                                          text={""}
                                          type={item.status==1?"delete-active":"delete-disable"}
                                          mode={"static"}
                                          iconStyle={{width:24,height:24}}
                                          style={{marginRight:8,marginTop:0}}/>
                                    <DeviceItem
                                     data={item} style={{width:width-60}}/>
                                </Container>
                        }

                      }.bind(this)):!this.state.loading?<Container
                          fullwidth
                          border
                          style={{flex:1,marginTop:20,minHeight:220}}>
                            <Icon style={{width:65,height:65}} mode="static" type="illustration-no-data"/>
                            <Typography
                                     style={{marginBottom:7,marginTop:5}}
                                     color="lightgray"
                                     font={"subtitle03"}
                            text={LangUtil.getStringByKey("common_nodata")}/>
                            <Typography
                                     color="lightgray"
                                     font={"content03"}
                                     text={LangUtil.getStringByKey("device_please_setup")}/>
                      </Container>:null
                    }
                </Container>:
                <Container
                    fullwidth
                    scrollable={true}
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1,paddingLeft:16,paddingRight:16,marginTop:10}}
                    >
                    {ccmFilter.event.searchRecord?
                      ccmFilter.event.searchRecord.map(function(item,i){
                      return <TouchCard
                              fullwidth
                              justifyContent="flex-start"
                              alignItems={"center"}
                              onPress={()=>this.setState({keyword:item,tempkeyword:item})}
                              style={{width:'100%',height:44}}
                              flexDirection={"row"}>
                              <Icon style={{width:24,height:24,marginRight:6}} mode="static" type="search-item"/>
                              <Typography
                                  color="text"
                                  font={"text01"}
                                  text={item}
                              />
                              <IconButton style={{position:'absolute',right:0}}
                               onPress={()=>{
                                 let nf = JSON.parse(JSON.stringify(this.props.ccmFilter));
                                 if(nf.event.searchRecord){
                                    nf.event.searchRecord.splice(i,1)
                                 }
                                 this.props.setCcmFilter(nf)
                               }}
                               iconStyle={{width:24,height:24}}
                               mode="static" type="clear"/>
                    </TouchCard>
                  }.bind(this)):null
                    }
                </Container>}
                <Container style={{paddingRight:16,paddingLeft:16}}>
                  <NormalButton
                    onPress={async()=>{await this.setState({deleteMode:false})}}
                    text={LangUtil.getStringByKey("common_complete")}/>
                </Container>
                {this.state.confirmDelete?<NormalDialog
                    onCloseDialog={()=>this.setState({confirmDelete:false})}
                    onCancel={()=>this.setState({confirmDelete:false})}
                    onConfirm={async()=>{this.setState({confirmDelete:false});await this.deleteDeviceActual()}}
                    cancelText={LangUtil.getStringByKey("common_cancel")}
                    confirmText={LangUtil.getStringByKey("common_delete")}
                    data={{msg:(targetItem?LangUtil.getStringByKey("device_delete_confirm_msg").replace("{1}",targetItem.name):"")}}/>:null}
             </PageContainer>
             {region?<RegionPicker
                onClose={(date)=>this.onRegionChanged(date)}
                ccmFilter={ccmFilter}
                loginInfo={this.props.loginInfo}
                storeList={this.props.storeList}
             />:null}
             {store?<StorePicker
                onClose={(date)=>this.onStoreChanged(date)}
                ccmFilter={ccmFilter}
                loginInfo={this.props.loginInfo}
                storeList={this.props.storeList}
             />:null}
             {sort?<SortPicker
                onClose={(date)=>this.onSortChanged(date)}
                mode={"device"}
                ccmFilter={ccmFilter}
             />:null}
             {addDevice?<AddDevicePanel
               onClose={(date)=>this.onFinishAddDevice(date)}
               ccmFilter={ccmFilter}
               setLoading={this.props.setLoading}
               navigation={this.props.navigation}
               loginInfo={this.props.loginInfo}
               storeList={this.props.storeList}/>:null}
            </View>);
  }
  /*

  if(isSensor){
    return <Container flexDirection="row"
                alignItems="center"
                key={i} style={{marginBottom:i==filterData.length-1?50:10,marginTop:0}}>
                <IconButton
                    onPress={()=>{
                      if(item.status==1){
                        this.doDeleteDevice(item);
                      }
                    }}
                    text={""}
                    type={item.status==1?"delete-active":"delete-disable"}
                    mode={"static"}
                    iconStyle={{width:24,height:24}}
                    style={{marginRight:8}}/>
              <SensorItem
               data={item}
               style={{width:width-60,marginTop:0}}/>
          </Container>
  }
  else{
    return <Container flexDirection="row"
                alignItems="center"
                key={i} style={{marginBottom:i==filterData.length-1?50:10}}>
                <IconButton
                    onPress={()=>{
                      if(item.status==1){
                        this.doDeleteDevice(item);
                      }
                    }}
                    text={""}
                    type={item.status==1?"delete-active":"delete-disable"}
                    mode={"static"}
                    iconStyle={{width:24,height:24}}
                    style={{marginRight:8,marginTop:0}}/>
              <DeviceItem
               data={item} style={{width:width-60}}/>
          </Container>
  }

*/
  handleLongPress(item,i){
    this.setState({targetItem:item,focusIndex:i})
  }

  async changeDeviceName(item,name){
    const {sensors,devices,stores} = this.state;
    console.log("changeDeviceName")
    this.props.setLoading(true);
    let bh = stores.find(p=>p.store_id == this.props.ccmFilter.event.store)
    let id  = item.sensor_id?item.sensor_id:item.gateway_id;

    let device = JSON.parse(JSON.stringify(item))
    console.log(bh)
    bh.devices.forEach((dev, i) => {
      if(dev.id == id){
        console.log("FInd devices")
        device = JSON.parse(JSON.stringify(dev))
      }
    });
    device.name = name;
    if(sensors.find(p=>p.name == name) || devices.find(p=>p.name == name)  ){
      DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_moddev_fail"),type:'error'})
      this.props.setLoading(false);
      return;
    }
    let result = await MainAPI.updateDevice({device,
    device_id:device.id,id:device.id,name});
    console.log(result)
    if(result.status == ERROR_CODE.SUCCESS){
      DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_moddev_success"),type:'success'})
      item.name = name;
      this.setState({targetItem:null})
      this.props.setLoading(false);
      /*
      setTimeout(async function(){
              await this.fetchData();
      }.bind(this),1500)
      */
    }
    else{
      DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_moddev_fail"),type:'error'})
      this.props.setLoading(false);
    }
  }
  render(){
    const {width,height} = DimUtil.getDimensions("portrait");
    const {loginInfo,navigation,ccmFilter} = this.props;
    const {events,keyword,alertRules,monitorRules,dialog,menu,addDevice,deleteMode,targetItem,
      userPositions,userDepartments,isSensor,sensors,devices,region,sort,store,searchMode,tempkeyword,timezone} = this.state;
    if(deleteMode){
      return this.renderDeleteMode()
    }
    let state = navigation.getState();
    let routeName = state.routes[state.index].name
    let probers  = isSensor?sensors:devices;
    let filterData = probers;
    if(keyword && keyword.length>0){
        filterData  =[];
        for(var k in probers){
          if( probers[k].mm_name.indexOf(keyword)>=0
              ||probers[k].device_id.indexOf(keyword)>=0
              ||probers[k].model_name.indexOf(keyword)>=0
              || probers[k].probers.indexOf(keyword)>=0
              || probers[k].name.indexOf(keyword)>=0 ){
                  filterData.push(probers[k])
              }
        }

    }
    let types = [LangUtil.getStringByKey("device_type_sensor"),LangUtil.getStringByKey("device_type_other")]
    return ( <View>
              <PageContainer
                bottom={CCMFUNCTIONS}
                hasStore={true}
                isEvent={true}
                routeName={PAGES.DEVICE_MANAGE}
                navigation={this.props.navigation}
                introduction={this.state.introduction}
                hasColdchain={loginInfo.hasColdchain&&this.props.storeList.length>0}
                dialog={dialog}
                style={{paddingLeft:0,paddingRight:0}}
                onCloseDialog={()=>this.setState({dialog:null})}
                onCloseIntroduction={()=>this.setState({introduction:null})}
                isHeader={true}>
                <Header
                  leftIcon={this.state.unread?"header-event-alert":"header-event"}
                  onLeftPressed={()=>{
                    if(!this.open){
                         this.open = true;
                         navigation.push(PAGES.NOTIFICATION,{})
                         setTimeout(function(){
                             this.open = false;
                         }.bind(this),2000)
                    }

                  }}
                  text={LangUtil.getStringByKey("function_device_manage")}
                  rightIcon={searchMode?"":(ccmFilter.event.region1||ccmFilter.event.region2)?"header-filteractive":"header-filter" }
                  onRightPressed={()=>{
                    if(searchMode)return
                    let newFilter = JSON.parse(JSON.stringify(ccmFilter));
                    newFilter.cache.event = JSON.parse(JSON.stringify(ccmFilter.event));
                    this.props.setCcmFilter(newFilter)
                    this.setState({region:true})}}
                />
                <Container flexDirection="row" fullwidth style={{height:40,width:'100%',backgroundColor:COLORS.PRIMARY_BLUE}}>
                    {types.map(function(c,i){
                        return   <Container key={i}style={{flex:1}}>
                                  <NormalButton style={{backgroundColor:COLORS.PRIMARY_BLUE,height:34}}
                                  color={isSensor==(1-i)?"white":"#AFC5DF"}
                                 onPress={()=>{console.log("ONpress"+i);this.setState({focusIndex:-1,isSensor:(1-i)})}}
                                 text={c}/>
                                  <Container style={{width:70,height:3,backgroundColor:isSensor==(1-i)?"white":"transparent"}}/>
                                </Container>
                    }.bind(this))}
                </Container >
                {searchMode?<Container
                    fullwidth
                    alignItems={"center"}
                    style={{height:50,marginTop:6,paddingRight:16}}
                    flexDirection={"row"}>
                    <IconButton
                       onPress={()=>{this.setState({keyword:null,searchMode:false})}}
                        text={""}
                        type={"back"}
                        mode="static"
                        iconStyle={{width:24,height:24}}
                        style={{marginRight:5,marginLeft:5}}/>
                    <SearchInput
                       value={this.state.tempkeyword}
                       placeholder={LangUtil.getStringByKey("filter_keyword_search")}
                       onChangeText={(t)=>{
                           this.setState({tempkeyword:t})
                       }}
                       onEnter={(t)=>{
                        this.setState({keyword:this.state.tempkeyword})
                        let nf = JSON.parse(JSON.stringify(this.props.ccmFilter));
                        if(!nf.event.searchRecord){
                          nf.event.searchRecord = [];
                        }

                        if(this.state.tempkeyword&&this.state.tempkeyword.length>0){
                            if(nf.event.searchRecord.length==15){
                               nf.event.searchRecord.splice(-1)
                            }
                            nf.event.searchRecord.unshift(this.state.tempkeyword)
                        }
                        this.props.setCcmFilter(nf)
                       }}
                       onClear={(t)=>{
                        this.setState({keyword:"",tempkeyword:''})
                       }}
                     />
                  </Container>:<Container
                    fullwidth
                    alignItems={"center"}
                    style={{height:44,paddingLeft:16,paddingRight:16}}
                    flexDirection={"row"}>
                  <TouchCard
                        flexDirection={"row"}
                        onPress={()=>this.setState({store:true})}>
                  <Typography
                           color="primary"
                           font={"subtitle02"}
                           text={StringUtil.getFixedLenName(this.props.ccmFilter.event.storeName,16)+"("+filterData.length+ ")"}
                  />
                  <IconButton
                      onPress={()=>{}}
                      text={""}
                      type={"dropdown-blue"}
                      mode={"static"}
                      iconStyle={{width:24,height:24}}/>
                  </TouchCard>
                  <View style={{flex:1}}/>
                  <IconButton
                      onPress={()=>{this.setState({searchMode:true,keyword:null,tempkeyword:null})}}
                      text={""}
                      type={"action-search"}
                      mode={"static"}
                      iconStyle={{width:24,height:24}}
                      style={{marginRight:8}}/>
                  <IconButton
                      onPress={()=>{this.setState({sort:true})}}
                      text={""}
                      type={"action-sort"}
                      mode={"static"}
                      iconStyle={{width:24,height:24}}
                      style={{marginRight:8}}/>
                  <IconButton
                    onPress={()=>this.setState({introduction:{
                      title:LangUtil.getStringByKey("common_figure"),
                      mode:'detail',
                      info:[
                        { type:LangUtil.getStringByKey("hint_status_desc"),
                          mode:'detail',
                          list:[
                            {title:LangUtil.getStringByKey("device_status"),
                              list:[
                              {title:LangUtil.getStringByKey("monitor_status_running"),icon:"illustration-device-status-normal"},
                               {title:LangUtil.getStringByKey("device_status_sleep"),icon:"illustration-device-status-rest"},
                               {title:LangUtil.getStringByKey("monitor_status_nodata"),icon:"illustration-device-status-no-data"},
                               {title:LangUtil.getStringByKey("monitor_status_unbound"),icon:"illustration-device-status-unbind"},
                               {title:LangUtil.getStringByKey("device_status_expire"),icon:"illustration-device-status-expired"},
                               {title:LangUtil.getStringByKey("device_status_init"),icon:"illustration-device-status-unactivated"},
                               {title:LangUtil.getStringByKey("device_status_termiaate"),icon:"illustration-device-status-termination"},
                               {title:LangUtil.getStringByKey("monitor_status_delete"),icon:"illustration-device-status-delete"},
                               {title:LangUtil.getStringByKey("monitor_status_offline"),icon:"illustration-device-status-offline"},
                              ]
                            },{
                                title:LangUtil.getStringByKey("device_signal_status"),
                                 list:[
                                   {title:LangUtil.getStringByKey("device_signal_good"),icon:"illustration-in-card-signal-good"},
                                   {title:LangUtil.getStringByKey("device_signal_normal"),icon:"illustration-in-card-signal-normal"},
                                   {title:LangUtil.getStringByKey("device_signal_bad"),icon:"illustration-in-card-signal-bad"},
                                   {title:LangUtil.getStringByKey("device_signal_none"),icon:"illustration-in-card-signal-none"},
                                  ]
                                }
                              ,
                              {title:LangUtil.getStringByKey("device_battery_status"),
                               list:[
                                 {title:LangUtil.getStringByKey("device_battery_good"),icon:"illustration-in-card-battery-good"},
                                 {title:LangUtil.getStringByKey("device_battery_normal"),icon:"illustration-in-card-battery-normal"},
                                 {title:LangUtil.getStringByKey("device_battery_bad"),icon:"illustration-in-card-battery-bad"},
                                 {title:LangUtil.getStringByKey("device_battery_none"),icon:"illustration-in-card-battery-none"},
                                ]
                              }
                            ]
                          }
                        ]}
                      })}
                      text={""}
                      type={"action-info"}
                      mode={"static"}
                      iconStyle={{width:24,height:24}}
                      style={{marginRight:0}}/>
                </Container>}
                {searchMode?(keyword&&keyword.length>0)?<Container
                            fullwidth
                            justifyContent="flex-start"
                            alignItems={"center"}
                            style={{marginTop:12,paddingLeft:16,paddingRight:16,width:'100%',marginBottom:5}}
                            flexDirection={"row"}>
                            <Typography
                             　color={"text"}
                              font="text02"
                             text={LangUtil.getStringByKey("filter_search_result")}/>
                   </Container>:<Container
                             fullwidth
                             justifyContent="flex-start"
                             alignItems={"center"}
                             style={{marginTop:12,paddingLeft:16,paddingRight:16,width:'100%',marginBottom:5}}
                             flexDirection={"row"}>
                              <Typography
                               　color={"text"}
                                font="text02"
                               text={LangUtil.getStringByKey("filter_search_record")}/>
                               <IconButton
                                 text={"text03"}
                                 style={{position:'absolute',right:16}}
                                 onPress={()=>{
                                     let nf = JSON.parse(JSON.stringify(this.props.ccmFilter));
                                     nf.event.searchRecord=[];
                                     this.props.setCcmFilter(nf)
                                 }}
                                 text={LangUtil.getStringByKey("filter_clear_all")}/>
                    </Container>:null}
                    {searchMode?null:<Container
                            fullwidth
                            justifyContent="flex-start"
                            alignItems={"center"}
                            style={{paddingLeft:16,paddingRight:16,width:'100%',marginBottom:5}}
                            flexDirection={"row"}>
                            <Typography
                                color="#A5A5A5"
                                font={"textxs"}
                                text={LangUtil.getStringByKey("common_timezone")+timezone}
                            />
                  </Container>}
                {!searchMode||(keyword&&keyword.length>0)?<Container
                    fullwidth
                    scrollable={filterData.length!=0}
                    onRefresh={()=>this.fetchData()}
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1,paddingBottom:160,paddingLeft:16,paddingRight:16,paddingTop:0}}>
                    {
                      filterData.length>0?filterData.map(function(item,i){
                        if(isSensor){
                          return <View key={i} style={{
                          marginBottom:i==filterData.length-1?50:10}}><SensorItem
                          onPress={()=>this.setState({focusIndex:i})}
                          onLongPress={()=>this.handleLongPress(item,i)}
                          style={{marginTop:0}}
                          focus={this.state.focusIndex==i}
                          keyword={this.state.keyword}
                          data={item}/></View>
                        }
                        else{
                          return <View key={i} style={{marginBottom:i==filterData.length-1?50:10}}><DeviceItem
                            onPress={()=>this.setState({focusIndex:i})}
                            onLongPress={()=>this.handleLongPress(item,i)}
                                style={{marginTop:0}}
                            focus={this.state.focusIndex==i}
                           keyword={this.state.keyword}
                           data={item}/></View>
                        }

                      }.bind(this)):!this.state.loading?<Container
                          fullwidth
                          border
                          style={{flex:1,marginTop:20,minHeight:220}}>
                            <Icon style={{width:65,height:65}} mode="static" type="illustration-no-data"/>
                            <Typography
                                     style={{marginBottom:7,marginTop:5}}
                                     color="lightgray"
                                     font={"subtitle03"}
                            text={LangUtil.getStringByKey("common_nodata")}/>
                            <Typography
                                     color="lightgray"
                                     font={"content03"}
                                     text={LangUtil.getStringByKey("device_please_setup")}/>
                      </Container>:null
                    }
                </Container>:
                <Container
                    fullwidth
                    scrollable={true}
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1,paddingLeft:16,paddingRight:16,marginTop:10}}
                    >
                    {ccmFilter.event.searchRecord?
                      ccmFilter.event.searchRecord.map(function(item,i){
                      return <TouchCard
                              fullwidth
                              justifyContent="flex-start"
                              alignItems={"center"}
                              onPress={()=>this.setState({keyword:item,tempkeyword:item})}
                              style={{width:'100%',height:44}}
                              flexDirection={"row"}>
                              <Icon style={{width:24,height:24,marginRight:6}} mode="static" type="search-item"/>
                              <Typography
                                  color="text"
                                  font={"text01"}
                                  text={item}
                              />
                              <IconButton style={{position:'absolute',right:0}}
                               onPress={()=>{
                                 let nf = JSON.parse(JSON.stringify(this.props.ccmFilter));
                                 if(nf.event.searchRecord){
                                    nf.event.searchRecord.splice(i,1)
                                 }
                                 this.props.setCcmFilter(nf)
                               }}
                               iconStyle={{width:24,height:24}}
                               mode="static" type="clear"/>
                    </TouchCard>
                  }.bind(this)):null
                    }
                </Container>}
                {(loginInfo.userInfo.roleid==1 || loginInfo.userInfo.role_id==1)&&!searchMode?<TouchCard
                onPress={()=>this.setState({menu:!menu})}
                flexDirection="row"
                justifyContent="center"
                style={{height:44,width:44,backgroundColor:menu?"#003B65":"#006AB7",position:'absolute',borderRadius:11,
                right:16,bottom:16+DimUtil.getBottomPadding()}}>
                  <Icon style={{width:17,height:17}} type="edit-white" mode="static"/>
                </TouchCard>:null}
                {menu&&!searchMode?<Container style={
                  {shadowColor:"#111",width:200,height:81,
                   position:'absolute',bottom:70+DimUtil.getBottomPadding(),right:16,
                   borderRadius:8,
                   backgroundColor:'white',
                   shadowOffset: { width: 1, height: 1},
                   shadowOpacity: 0.2,
                   shadowRadius: 2,
                   elevation: 3
                }}>
                <TouchCard  flexDirection="row"
                    onPress={()=>this.addDevice()}
                    style={{width:200,height:40,borderBottomWidth:1,borderColor:'#ccc',paddingLeft:16,paddingRight:16}}>
                    <Typography
                             color="text"
                             font={"text01"}
                    text={LangUtil.getStringByKey("common_add_new")}/>
                    <View style={{flex:1}}/>
                    <Icon style={{width:24,height:24}} mode="static" type="add-new"/>
                </TouchCard>
                <TouchCard flexDirection="row"
                    onPress={()=>this.setState({focusIndex:-1,deleteMode:true,menu:false})}
                    style={{width:200,height:40,paddingLeft:16,paddingRight:16}}>
                <Typography
                         color="text"
                         font={"text01"}
                text={LangUtil.getStringByKey("common_delete")}/>
                <View style={{flex:1}}/>
                <Icon style={{width:24,height:24}} mode="static" type="delete"/>
                </TouchCard>
                </Container>:null}
            </PageContainer>
             { this.state.targetItem&&!this.state.confirmDelete?<TouchCard
                  onPress={()=>this.setState({targetItem:null})}
                  style={{width,height,position:'absolute',top:0,backgroundColor:'#999999BB',padding:16}}>
                  {isSensor?<View  style={{position:'absolute',top:200,width:'100%',width:width-32}}><SensorItem
                         onPress={()=>{}}
                         focus={false}
                         disabled={true}
                         onSave={
                           async(name)=>this.changeDeviceName(this.state.targetItem,name)
                         }
                         edit={true}
                         data={ this.state.targetItem}/></View>:
                         <View
                          style={{position:'absolute',top:200,width:width-32}}><DeviceItem
                          onPress={()=>{}}
                          focus={false}
                          disabled={true}
                          edit={true}
                          onSave={
                            async(name)=>this.changeDeviceName(this.state.targetItem,name)
                          }
                          data={ this.state.targetItem}/></View>
                      }
                      <TouchCard
                          flexDirection="row"
                          onPress={()=>{
                            if(this.state.targetItem.status==1){
                              this.doDeleteDevice(this.state.targetItem)
                            }
                          }}
                          style={{position:'absolute',top:157,height:40,width:200,right:16,
                          borderRadius:8,paddingLeft:16,paddingRight:16,
                          backgroundColor:"white"}}>
                          <Typography
                                   color={this.state.targetItem.status==1?"text":"#CECECE"}
                                   font={"text01"}
                          text={LangUtil.getStringByKey("common_delete")}/>
                          <View style={{flex:1}}/>
                          <Icon style={{width:24,height:24}} mode="static" type={this.state.targetItem.status==1?"delete":"delete-gray"}/>
                      </TouchCard>
                 </TouchCard>:null
             }
             {this.state.confirmDelete?<NormalDialog
                 onCloseDialog={()=>this.setState({confirmDelete:false})}
                 onCancel={()=>this.setState({confirmDelete:false})}
                 onConfirm={async()=>{this.setState({confirmDelete:false});await this.deleteDeviceActual()}}
                 cancelText={LangUtil.getStringByKey("common_cancel")}
                 confirmText={LangUtil.getStringByKey("common_delete")}
                 data={{msg:(targetItem?LangUtil.getStringByKey("device_delete_confirm_msg").replace("{1}",targetItem.name):"")}}/>:null}
             {region?<RegionPicker
                onClose={(date)=>this.onRegionChanged(date)}
                ccmFilter={ccmFilter}
                loginInfo={this.props.loginInfo}
                storeList={this.props.storeList}
             />:null}
             {store?<StorePicker
                onClose={(date)=>this.onStoreChanged(date)}
                ccmFilter={ccmFilter}
                loginInfo={this.props.loginInfo}
                storeList={this.props.storeList}
             />:null}
             {sort?<SortPicker
                onClose={(date)=>this.onSortChanged(date)}
                mode={"device"}
                ccmFilter={ccmFilter}
             />:null}
             {addDevice?<AddDevicePanel
               onClose={(date)=>this.onFinishAddDevice(date)}
               ccmFilter={ccmFilter}
               setLoading={this.props.setLoading}
               navigation={this.props.navigation}
               loginInfo={this.props.loginInfo}
               storeList={this.props.storeList}/>:null}
            </View>);
  }
}
const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageDeviceMgt);
