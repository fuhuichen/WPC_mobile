import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {AppContainer,
        PageContainer,
        Header,Container,
        Selection,
        Typography,
        Tab,
        BottomNav,
        IconButton,
        Icon,
        DataInput,
        NormalButton} from '../../../framework'
import {LangUtil,StorageUtil,FilterUtil} from '../../../framework'
import { DeviceEventEmitter} from 'react-native';
import CcmAPI from "../../api/ccm"
import MainAPI from "../../api/main"
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES,DEVICE_TYPES} from  "../../define"
import BottomNavigation from "../../components/BottomNavigation"
import SensorItem from '../../components/SensorItem'
import DeviceItem from '../../components/DeviceItem'
class PageDeviceAdd extends Component {
  constructor(props) {
    super(props);
    this.state={
      events:[],
      probers:[],
      sensors:[],
      devices:[],
      store:{},
      loading:true,
      isSensor:true
    }
  }
  async componentDidMount() {
    await this.fetchData()
    this.listener = DeviceEventEmitter.addListener("FILTER_STORE_CHANGE", async(event)=>{
      await this.fetchData(event.ccmFilter);
    })
  }
  componentWillUnmount(){
    if(this.listener){
      DeviceEventEmitter.removeSubscription(this.listener)
    }
  }
  async fetchData(ccmFilter){
    if(!ccmFilter){
      ccmFilter = this.props.ccmFilter;
    }
    const {loginInfo,storeList} = this.props;
    const {device} = ccmFilter.cache ;
    this.props.setLoading(true);
    this.setState({sensors:[],devices:[],loading:true})
    let sensors=[];
    let devices =[];
    let mms = []
    let  res;
    let result;
    let bh = storeList.find(p=>p.branch_id == device.store)
    if(loginInfo.hasColdchain){
      res = await CcmAPI.getMonitorModuleList(device.store);
      if(res.status == ERROR_CODE.SUCCESS){
        mms = res.monitor_modules;
      }

      result  = await CcmAPI.getSensorList(device.store);
      console.log("Ask fo bh" +bh)
      if(result.status == ERROR_CODE.SUCCESS){
        console.log(result.sensors)
        sensors= result.sensors;
        sensors.forEach((sensor, i) => {
          sensor.time_zone = bh.contact.time_zone
          //console.log(sensor)
          sensor.probers = ""
          mms.forEach((mm, i) => {

              mm.probers.forEach((pb, i) => {
                if(sensor.prober_ids.find(p=>p==pb.prober_id)){
                  sensor.mm_name = mm.mm_name
                  //console.log("Find prober")
                  //console.log(mm)
                  //console.log(pb)

                  if(sensor.probers==""){
                    sensor.probers = pb.name;
                  }
                  else{
                    sensor.probers = sensor.probers + ","+ pb.name
                  }
                }
              });

          });
          console.log(sensor.probers)

        });


      }
      result  = await CcmAPI.getGatewayList(device.store);
      if(result.status == ERROR_CODE.SUCCESS){
        console.log(result.gateways)
        devices= result.gateways;
        devices.forEach((sensor, i) => {
          console.log("DEvice")
          console.log(sensor)
          sensor.time_zone = bh.contact.time_zone
          sensor.probers = ""

        });
      }
    }

    result  = await MainAPI.getStoreList()
    if(result.status == ERROR_CODE.SUCCESS){
      let store  = result.stores.find(s=>s.store_id == device.store)
      console.log(store)
      store.devices.forEach((item, i) => {
        let sensor = item;
        console.log(item)
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
            if(!f)sensors.push(item)
          }
          else{
            let f= devices.find(s=>s.gateway_id == sensor.gateway_id)
            if(!f)devices.push(item)
          }
        }
      });
    }
    this.setState({sensors,devices,store:bh,loading:false})
    this.props.setLoading(false);

  }
  async showBrandSelect(){
    const {navigation} = this.props;
    navigation.push(PAGES.BRAND_SELECT)
  }
  async next(){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {mode} = route.params;
    navigation.push(PAGES.DEVICE_ADD2,{mode,deviceType:this.state.deviceType,store:this.state.store})
  }
  getRegion2Name(list ){
    if(!list)return null;
    let names = [];
    for(var k in list){
      names = names.concat(list[k])
    }

    return names;
  }
  render(){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {mode} = route.params;
    const {events,keyword,alertRules,monitorRules,
      userPositions,userDepartments,isSensor,sensors,devices} = this.state;
    let probers  = isSensor?sensors:devices;
    let filterData = probers;
    return ( <PageContainer
                introduction={this.state.introduction}
                onCloseIntroduction={()=>this.setState({introduction:null})}
                navigation={this.props.navigation}
                isHeader={true}>
                <Header
                  leftIcon={"header-back"}
                  onLeftPressed={()=>{navigation.pop(1)}}
                  text={LangUtil.getStringByKey("device_add")}
                />
                <Container
                    fullwidth
                    scrollable
                    style={{marginBottom:30}}
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}>
                    <Typography
                          style={{marginBottom:2,marginTop:20}}
                          font={"subtitle04"}
                          text={LangUtil.getStringByKey("filter_region1")}
                          color='black'/>
                    <Selection
                          multiSelect
                          style={{marginBottom:20}}
                          text={ccmFilter.cache[mode].region1}
                          onPress={async()=>{navigation.push(PAGES.FILTER_REGION1,{mode})}}
                          hint={LangUtil.getStringByKey("common_please_select")}/>
                    <Typography
                          style={{marginBottom:2}}
                          font={"subtitle04"}
                          text={LangUtil.getStringByKey("filter_region2")}
                          color='black'/>
                    <Selection
                          multiSelect
                          style={{marginBottom:20}}
                          text={this.getRegion2Name(ccmFilter.cache[mode].region2,{mode})}
                          onPress={async()=>{navigation.push(PAGES.FILTER_REGION2,{mode})}}
                          hint={LangUtil.getStringByKey("common_please_select")}/>
                    <Typography
                          style={{marginBottom:2}}
                          font={"subtitle04"}
                          text={LangUtil.getStringByKey("filter_location")}
                          color='black'/>
                    <Selection
                          multiSelect={mode!="device"}
                          text={ccmFilter.cache[mode].storeName}
                          onPress={async()=>{navigation.push(PAGES.FILTER_STORE,{mode})}}
                          hint={LangUtil.getStringByKey("common_please_select")}/>
                          <Container
                          border
                          tabContainer
                          flexDirection="row" fullwidth style={{height:52,padding:4,marginBottom:12,marginTop:20}}>
                                {isSensor?<NormalButton
                                  style={{flex:1,height:44,marginRight:2}}
                                  onPress={async()=>{}}
                                  text={LangUtil.getStringByKey("device_type_sensor")}/>:
                                  <IconButton
                                      style={{flex:1,height:44,marginRight:2}}
                                      onPress={async()=>{await this.setState({isSensor:true})}}
                                  text={LangUtil.getStringByKey("device_type_sensor")}/>
                                }
                                {!isSensor?<NormalButton
                                  style={{flex:1,height:44,marginLeft:4}}
                                  onPress={async()=>{}}
                                  text={LangUtil.getStringByKey("device_type_other")}/>:
                                  <IconButton
                                      style={{flex:1,height:44,marginLeft:4}}
                                        onPress={async()=>{await this.setState({isSensor:false})}}
                                  text={LangUtil.getStringByKey("device_type_other")}/>
                                }
                          </Container>
                          <Container
                              fullwidth
                              flexDirection={"row"}
                              style={{marginTop:0}}
                              justifyContent={"flex-start"}>
                              <Typography
                                       color="primary"
                                       font={"subtitle03"}
                                       text={LangUtil.getStringByKey("device_location_total")}
                              />
                              <View style={{flex:1}}/>
                              <IconButton
                                  onPress={()=>this.setState({introduction:isSensor?{
                                    title:LangUtil.getStringByKey("common_figure"),
                                    info:[
                                      {
                                        title:LangUtil.getStringByKey("device_status"),
                                       list:[
                                         {title:LangUtil.getStringByKey("monitor_status_running"),icon:"illustration-device-status-normal"},
                                         {title:LangUtil.getStringByKey("device_status_sleep"),icon:"illustration-device-status-rest"},
                                         {title:LangUtil.getStringByKey("monitor_status_nodata"),icon:"illustration-device-status-no-data"},
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
                                      ,{
                                      title:LangUtil.getStringByKey("device_battery_status"),
                                       list:[
                                         {title:LangUtil.getStringByKey("device_battery_good"),icon:"illustration-in-card-battery-good"},
                                         {title:LangUtil.getStringByKey("device_battery_normal"),icon:"illustration-in-card-battery-normal"},
                                         {title:LangUtil.getStringByKey("device_battery_bad"),icon:"illustration-in-card-battery-bad"},
                                         {title:LangUtil.getStringByKey("device_battery_none"),icon:"illustration-in-card-battery-none"},
                                        ]
                                      }
                                    ]
                                  }:{
                                    title:LangUtil.getStringByKey("common_figure"),
                                    info:[
                                      {
                                      title:LangUtil.getStringByKey("device_status"),
                                       list:[
                                         {title:LangUtil.getStringByKey("monitor_status_running"),icon:"illustration-device-status-normal"},
                                         {title:LangUtil.getStringByKey("device_status_sleep"),icon:"illustration-device-status-rest"},
                                         {title:LangUtil.getStringByKey("monitor_status_nodata"),icon:"illustration-device-status-no-data"},
                                         {title:LangUtil.getStringByKey("device_status_expire"),icon:"illustration-device-status-expired"},
                                         {title:LangUtil.getStringByKey("device_status_init"),icon:"illustration-device-status-unactivated"},
                                         {title:LangUtil.getStringByKey("device_status_termiaate"),icon:"illustration-device-status-termination"},
                                         {title:LangUtil.getStringByKey("monitor_status_delete"),icon:"illustration-device-status-delete"},
                                         {title:LangUtil.getStringByKey("monitor_status_offline"),icon:"illustration-device-status-offline"},
                                        ]
                                      }
                                    ]
                                  }})
                                   }
                                  text={""}
                                  type={"info"}
                                  style={{marginRight:0}}/>
                          </Container>
                          <Typography
                                   color="text"
                                   font={"subtitle03"}
                                   text={LangUtil.getStringByKey("common_total")+" : "+filterData.length}
                          />
                          <Container
                              fullwidth
                              scrollable={filterData.length!=0}
                              justifyContent={"flex-start"}
                              alignItems={"flex-start"}
                              style={{flex:1}}>
                              {
                                filterData.length>0?filterData.map(function(item,i){
                                  if(isSensor){
                                    return <SensorItem key={i} data={item}/>
                                  }
                                  else{
                                    return <DeviceItem key={i}  data={item}/>
                                  }

                                }):!this.state.loading?<Container
                                    fullwidth
                                    border
                                    style={{flex:1,marginTop:20}}>
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
                          </Container>
                </Container>
                <NormalButton
                  style={{marginBottom:1}}
                  onPress={async()=>{await this.next()}}
                  text={LangUtil.getStringByKey("common_next_step")}/>
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageDeviceAdd);
