import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
  ScrollView,
    KeyboardAvoidingView
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
        OptionContainer,
        SearchInput,
        CheckOption,
        DateInputField,
        Notify,
        DataInput,
        TextInput,
        TouchCard,
        RegionSelection,
        NormalButton} from '../../framework'
import {LangUtil,StorageUtil,FilterUtil,COLORS,DimUtil} from '../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,DEVICE_TYPES,STORAGES,OPTIONS} from  "../define"
import CalendarPicker from 'react-native-calendar-picker';
import moment from "moment"
import CcmAPI from "../api/ccm"
import MainAPI from "../api/main"
import SensorItem from './SensorItem'
import DeviceItem from './DeviceItem'
import { DeviceEventEmitter} from 'react-native';
class BottomNavigation extends Component {
  constructor(props) {
    super(props);
    const {loginInfo,navigation,ccmFilter} = this.props;
    let options=[]
    const {mode} = "event"
    let filterOptions = JSON.parse(JSON.stringify(ccmFilter))

    this.state={
      filterOptions,
      showCalendar:false,
      edit:false,
      inputStartDate:'',
      inputEndDate:'',
      notify:null,
      region1:false,
      isSensor:1,
      region2:false,
      selected:[],options:[],
      selectStore:false,
      list:[],
      deviceType:null,
      deviceName:"",
      deviceNo:"",
      deviceSerial:"",
      store:{},
    }
  }

  componentWillUnmount() {

  }
  async fetchData(ccmFilter){
    this.props.setLoading(true);
    if(!ccmFilter){
      if(this.state.filterOption){
        ccmFilter =  this.state.filterOptions;
      }
      else{
        ccmFilter = this.props.ccmFilter;
      }

    }
    const {loginInfo,storeList} = this.props;
    let  device = ccmFilter.event ;
    this.setState({sensors:[],devices:[],loading:true})
    let sensors=[];
    let devices =[];
    let mms = []
    let stores  = [];
    let r  = await MainAPI.getStoreList();
    if(r.status == ERROR_CODE.SUCCESS){
      console.log(r)
      stores = r.stores;
    }
    let st = stores.find(p=>p.store_id == device.store)
    this.setState({store:st})

    if(loginInfo.hasColdchain){
      let res = await CcmAPI.getMonitorModuleList(device.store);
      if(res.status == ERROR_CODE.SUCCESS){
        mms = res.monitor_modules;
      }
      let result  = await CcmAPI.getSensorList(device.store);
      let bh = storeList.find(p=>p.branch_id == device.store)
      if(result.status == ERROR_CODE.SUCCESS){
        //console.log(result.sensors)
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
      result  = await CcmAPI.getGatewayList(device.store);
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
    let finalSensors=[];
    let finalGateways=[];
    result  = await MainAPI.getStoreList()
    if(result.status == ERROR_CODE.SUCCESS && result.stores){
      let store  = result.stores.find(s=>s.store_id == device.store)
      //console.log(store)
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

              if(f){ // f.status = item.status;
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
  toastError(text){
    this.setState({notify:text})
    setTimeout(function(){
        this.setState({notify:null})
    }.bind(this),1000)
  }
  getDate(){
    var separators = ['\\/'];
    var bits = s.split(new RegExp(separators.join('|'), 'g'));
    console.log(bits[2], bits[1], bits[0])
    var d = new Date(bits[0], bits[1]-1, bits[2]);
    return d;

  }
  isValidDate(s){
  // console.log(s)
   var separators = ['\\/'];
   var bits = s.split(new RegExp(separators.join('|'), 'g'));
  // console.log(bits[2], bits[1], bits[0])
   var d = new Date(bits[0], bits[1]-1, bits[2]);
   //console.log(d.getFullYear(),bits[0], d.getMonth() + 1,bits[1])
   return d.getFullYear() == bits[0] && d.getMonth() + 1 == bits[1];
  }
  async componentDidMount() {
    DeviceEventEmitter.addListener("DEVICE_TYPE_CHANGE", async(event)=>{
      this.setState({deviceType:event.deviceType,deviceSerial:"",deviceNo:""})
    })
    DeviceEventEmitter.addListener("DEVICE_CHANGE_INFO", async(event)=>{
      this.setState(event)
    })
    await this.fetchData()

  }
  onSearch(s){
    this.setState({keyword:s})
  }
  onConfirm(){
    const {tempStartDate,tempEndDate,edit,inputStartDate,inputEndDate} = this.state;
    const {loginInfo,navigation,ccmFilter,onClose} = this.props;

    if(edit){
      console.log("CheckEdit")
      if(!this.isValidDate(inputStartDate) || !this.isValidDate(inputEndDate)){
        console.log("InvalidDate")
        this.toastError(LangUtil.getStringByKey("error_date_invalid"))
        return ;
      }
      let sday = new Date(inputStartDate);
      let eday = new Date(inputEndDate)
      if(sday>eday){
        this.toastError(LangUtil.getStringByKey("error_date_order"))
        return ;
      }
      let dif = (eday - sday)/86400000;
      console.log("Dif days"+dif)
      if(dif >=3){
        this.toastError(LangUtil.getStringByKey("error_date_wrongrange"))
        return ;
      }
      let startTime = moment(sday).format("YYYY/MM/DD 00:00:00" )
      let endTime = moment(eday).format("YYYY/MM/DD 23:59:59" )
      if(onClose)onClose({startTime,endTime})
      return
    }
    else{
      let startTime = moment(new Date(tempStartDate)).format("YYYY/MM/DD 00:00:00" )
      let endTime = moment(new Date(tempEndDate?tempEndDate:tempStartDate)).format("YYYY/MM/DD 23:59:59" )
        if(onClose)onClose({startTime,endTime})
    }


  }
  onCancel(){
    const {loginInfo,navigation,ccmFilter,onClose} = this.props;
    if(onClose)onClose()
  }
  onReset(){
    const {loginInfo,ccmFilter,storeList} = this.props;
    let mode = "event"

    let nf = JSON.parse(JSON.stringify(this.props.ccmFilter))

    let options = FilterUtil.getStoreOptions(storeList,null,null);
    //console.log(JSON.stringify(options))
    let d = new Date();
    let end  =moment(d).format("YYYY/MM/DD 23:59:59");
    let d1 = new Date();
    //d1.setDate(d1.getDate()-6);
    let startSameDate  =moment(d1).format("YYYY/MM/DD 00:00:00");
    d.setDate(d.getDate()-2);
    let start = moment(d).format("YYYY/MM/DD 00:00:00");
    let firstStore = storeList.length>0?storeList[0].branch_id: null;
    let firstName = storeList.length>0?storeList[0].branch_name: null;

    let filter={
        event:{
          options,
          sort:OPTIONS.EVENT[0],
          region1:null,
          region2:null,
          store: firstStore,
          storeName:firstName,
          startTime:start,
          endTime:end,
        },
        data:{
          options,
          sort:OPTIONS.DATA[0],
          region1:null,
          region2:null,
          store: firstStore,
          storeName:firstName,
          startTime:startSameDate,
          endTime:end,
          dataMode:1,
        },
        device:{
          options,
          sort:OPTIONS.DEVICE[0],
          region1:null,
          region2:null,
          store: firstStore,
          storeName:firstName,
        },
        notification:{
          options,
          sort:OPTIONS.NOTIFICATION[0],
          region1:null,
          region2:null,
          store: null,
          startTime:start,
          endTime:end,
        },
        cache:{
          event:null,
          data:null,
          device:null,
          notification:null
        }

    }
    this.setState({filterOptions:nf})
  }
  onRemove(id){
    let selected = this.state.selected;
    selected  = selected.filter((value)=>value!=id);
    this.setState({selected})
  }
  onSelect(id){
    let selected = this.state.selected;
    if(selected.indexOf(id)<0){
      selected.push(id)
    }
    else{
      selected  = selected.filter((value)=>value!=id);
    }
    this.setState({selected})
  }

  getStatus(){
      const {selected,options} = this.state;
      if(selected.length==0){
        return 0;
      }
      else if(selected.length == options.length){
        return 2;
      }
      else{
        return 1;
      }

  }
  onSelectAll(){
    const {options,keyword} = this.state;
    let selected = [];
    for(var k in options){
      if(keyword&&keyword.length>0){
        if(options[k].label.indexOf(keyword)>=0){
            selected.push(options[k].id)
        }
      }
      else{
          selected.push(options[k].id)
      }
    }
    this.setState({selected})
  }
  onClearAll(){
    this.setState({selected:[]})
  }
  async onSetRegion2(){
    this.setState({region2:false})
     await this.fetchData(this.state.filterOptions)


  }
  getCount(list){
      let count = 0;
      if(list){
        for(var k in list){
          count += list[k].length;
        }
      }
      return count;
  }
  async onSetRegion2Detail(){
     console.log("onSetRegion2Detail")
     console.log(this.state.selected)
     const {storeList} =this.props;
     const {region2Detail} = this.state;
     let selected = this.state.selected
     let filterOptions = this.state.filterOptions;
     if(!filterOptions.event.region2){
       filterOptions.event.region2 = {}
     }
     filterOptions.event.region2[region2Detail] = selected;
     let rg2Select = [];
     if(this.getCount(filterOptions.event.region2) !=0){
       for(var k in filterOptions.event.region2){
         rg2Select = rg2Select.concat(filterOptions.event.region2[k])
       }
     }
     else{
       filterOptions.event.region2= null
       rg2Select = null;
     }


     let newOptions = FilterUtil.getStoreOptions(storeList,filterOptions.event.region1,rg2Select);
     filterOptions.event.options = newOptions;
     filterOptions.event.store = null
     filterOptions.event.storeName = null;
     for(var k in newOptions.stores){
       //console.log(newOptions.stores[k])
       for(var m in newOptions.stores[k]){
         //console.log(newOptions.stores[k][m])]
         for(var l in newOptions.stores[k][m]){
           //console.log(newOptions.stores[k][m][l])
           filterOptions.event.store = newOptions.stores[k][m][l].id;
           filterOptions.event.storeName = newOptions.stores[k][m][l].label;
         }
         break;
       }
       break;
     }

     this.setState({region2Detail:false,filterOptions})
  }
  async onSetRegion1(){
    const {loginInfo,storeList} = this.props;
    const {filterOptions} = this.state;
    let mode = "event"
    const {options} =this.state;
    let selected = this.state.selected;
    if(selected.length==0){
      selected = null;
    }
    let nf = this.state.filterOptions
    filterOptions.event.region1 = selected;
    filterOptions.event.region2 = null;

    let newOptions = FilterUtil.getStoreOptions(storeList,selected,null);

    console.log("New Options")
    console.log(storeList)
    console.log(selected)
    console.log(newOptions)
    filterOptions.event.options = newOptions
    filterOptions.event.store = null
    filterOptions.event.storeName = null;
    if(mode != "notification"){
      for(var k in newOptions.stores){
        //console.log(newOptions.stores[k])
        for(var m in newOptions.stores[k]){
          //console.log(newOptions.stores[k][m])]
          for(var l in newOptions.stores[k][m]){
            //console.log(newOptions.stores[k][m][l])
            filterOptions.event.store = newOptions.stores[k][m][l].id;
            filterOptions.event.storeName = newOptions.stores[k][m][l].label;
          }
          break;
        }
        break;
      }

    }
    this.setState({region1:false,filterOptions})
    await this.fetchData(filterOptions)

  }
  renderRegion2(){
    if(this.state.region2Detail){
      return this.renderRegion2Detail()
    }
    const {loginInfo,navigation} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait");
    let mode = "event"
    const {showCalendar,tempStartDate,tempEndDate,edit,region1,region2} =this.state;
    const {options,selected,keyword,filterMode,filterOptions} =this.state;
    let count = selected.length>99?"N":selected.length;
    let filterOption = options;
    let selectedOptions = [];
    if(keyword && keyword.length>0){
      filterOption = [];
      for(var k in options){
        if(options[k].label.indexOf(keyword)>=0){
          filterOption.push(options[k])
        }
      }
    }
    for(var k in options){
      if(selected.indexOf(options[k].label)>=0){
        selectedOptions.push(options[k])
      }
    }
    let regionOptions = filterOptions.event.region1?filterOptions.event.region1:filterOptions.event.options.region1;
    return <Container
      　　　justifyContent="flex-start"
           fullwidth style={{position:'absolute',bottom:0,backgroundColor:"#000000BB",height}}>
           <Container 　justifyContent="flex-start"
                  fullwidth style={{height:height-47, position:'absolute', bottom:0,
                  borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",padding:16}}>
                 <Container
                   fullwidth
                   style={{height:20,marginBottom:20}}
                   flexDirection="row">
                   <IconButton
                     text={"text03"}
                     style={{position:'absolute',left:0}}
                     mode="static"
                     type="back"
                     iconStyle={{width:24,height:24}}
                     onPress={()=>this.onSetRegion2()}
                     text={""}/>
                  <Typography
                   　color={"text"}
                     font="text02"
                　   text={LangUtil.getStringByKey("filter_region2")}/>
                 </Container>
                 <Container
                   scrollable
                   fullwidth>
                   {regionOptions.map(function(item,i){
                      return <RegionSelection
                              style={[{marginBottom:2,borderRadius:0, width:width-32,
                                    borderRadius:0},i==0?{borderTopLeftRadius:8,borderTopRightRadius:8}:null,
                                      i==regionOptions.length-1?{borderBottomLeftRadius:8,borderBottomRightRadius:8}:null]}
                              text={item}
                              value={filterOptions.event.region2?filterOptions.event.region2[item]?filterOptions.event.region2[item]:[]:null}
                              onPress={async()=>{
                                    let selected  =filterOptions.event.region2&&filterOptions.event.region2[item]?filterOptions.event.region2[item]:[];
                                    let options   = filterOptions.event.options.region2[item];
                                    console.log({selected,region2Detail:item,options})
                                    this.setState({selected,region2Detail:item,options})

                                }
                              }
                              hint={""}/>
                   }.bind(this))}
               </Container>
           </Container>
           </Container>

  }
  renderRegion2Detail(){
    const {loginInfo,navigation} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait");
    let mode = "event"
    const {showCalendar,tempStartDate,tempEndDate,edit,region1,region2} =this.state;
    const {options,selected,keyword,filterMode,filterOptions} =this.state;
    let count = selected.length>99?"N":selected.length;
    let filterOption = options;
    let selectedOptions = [];
    if(keyword && keyword.length>0){
      filterOption = [];
      for(var k in options){
        if(options[k].label.indexOf(keyword)>=0){
          filterOption.push(options[k])
        }
      }
    }
    for(var k in options){
      if(selected.indexOf(options[k].label)>=0){
        selectedOptions.push(options[k])
      }
    }

    return <Container
      　　　justifyContent="flex-start"
           fullwidth style={{position:'absolute',bottom:0,backgroundColor:"#000000BB",height}}>
           <Container 　justifyContent="flex-start"
                  fullwidth style={{height:height-47, position:'absolute', bottom:0,
                  borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",padding:16}}>
                 <Container
                   fullwidth
                   style={{height:20,marginBottom:20}}
                   flexDirection="row">
                   <IconButton
                     text={"text03"}
                     style={{position:'absolute',left:0}}
                     mode="static"
                     type="back"
                     iconStyle={{width:24,height:24}}
                     onPress={()=>this.onSetRegion2Detail()}
                     text={""}/>
                  <Typography
                   　color={"text"}
                     font="text02"
                　   text={this.state.region2Detail}/>
                 </Container>
                 <Container
                     fullwidth
                     flexDirection={"row"}
                     justifyContent={"flex-start"}>
                     <SearchInput
                        onClear={()=>this.setState({keyword:""})}
                        placeholder={LangUtil.getStringByKey("filter_keyword_search")}
                        value={this.state.keyword}
                        onChangeText={(t)=>this.onSearch(t)}
                      />
                 </Container>
                 <Container
                   scrollable
                   fullwidth>
                 {selectedOptions.length>0?<Container
                   fullwidth>
                   <Container
                     fullwidth
                     style={{height:20,marginTop:20,marginBottom:4}}
                     flexDirection="row">
                     <Typography
                        style={{position:'absolute',left:0}}
                      　color={"grayText"}
                       font="text01"
                      text={LangUtil.getStringByKey("common_selected")}/>
                     <IconButton
                       text={"text03"}
                       style={{position:'absolute',right:0}}
                       onPress={()=>this.onClearAll()}
                       text={LangUtil.getStringByKey("filter_clear_all")}/>
                   </Container>
                   <Container
                       fullwidth
                       justifyContent={"flex-start"}
                       alignItems={"flex-start"}
                       style={{flex:1}}>
                       <OptionContainer
                         style={{marginBottom:20}}
                         selected={selected}
                         multiSelect
                         onSelect={(id)=>this.onSelect(id)}
                         options={
                           selectedOptions
                         }/>
                   </Container>
                 </Container>:null}
                 <Container
                   fullwidth
                   style={{height:20,marginTop:20,marginBottom:4}}
                   flexDirection="row">
                   <Typography
                      style={{position:'absolute',left:0}}
                    　color={"grayText"}
                     font="text01"
                    text={LangUtil.getStringByKey("common_all")}/>
                   <IconButton
                     text={"text03"}
                     style={{position:'absolute',right:0}}
                     onPress={()=>this.onSelectAll()}
                     text={LangUtil.getStringByKey("filter_select_all")}/>
                 </Container>
                 <Container
                     fullwidth
                     justifyContent={"flex-start"}
                     alignItems={"flex-start"}>
                     <OptionContainer
                       style={{marginBottom:20}}
                       selected={selected}
                       multiSelect
                       onSelect={(id)=>this.onSelect(id)}
                       options={
                         filterOption
                       }/>
                 </Container>
               </Container>
           </Container>
           </Container>
  }
  renderRegion1(){
    const {loginInfo,navigation} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait");
    let mode = "event"
    const {showCalendar,tempStartDate,tempEndDate,edit,region1,region2} =this.state;
    const {options,selected,keyword,filterMode,filterOptions} =this.state;
    let count = selected.length>99?"N":selected.length;
    let filterOption = options;
    let selectedOptions = [];
    if(keyword && keyword.length>0){
      filterOption = [];
      for(var k in options){
        if(options[k].label.indexOf(keyword)>=0){
          filterOption.push(options[k])
        }
      }
    }
    for(var k in options){
      if(selected.indexOf(options[k].label)>=0){
        selectedOptions.push(options[k])
      }
    }

    return <Container
      　　　justifyContent="flex-start"
           fullwidth style={{position:'absolute',bottom:0,backgroundColor:"#000000BB",height}}>
           <Container 　justifyContent="flex-start"
                  fullwidth style={{height:height-47, position:'absolute', bottom:0,
                  borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",padding:16}}>
                 <Container
                   fullwidth
                   style={{height:20,marginBottom:20}}
                   flexDirection="row">
                   <IconButton
                     text={"text03"}
                     style={{position:'absolute',left:0}}
                     mode="static"
                     type="back"
                     iconStyle={{width:24,height:24}}
                     onPress={()=>this.onSetRegion1()}
                     text={""}/>
                  <Typography
                   　color={"text"}
                     font="text02"
                　   text={LangUtil.getStringByKey("filter_region1")}/>
                 </Container>
                 <Container
                     fullwidth
                     flexDirection={"row"}
                     justifyContent={"flex-start"}>
                     <SearchInput
                        placeholder={LangUtil.getStringByKey("filter_keyword_search")}
                        onClear={()=>this.setState({keyword:""})}
                        value={this.state.keyword}
                        onChangeText={(t)=>this.onSearch(t)}
                      />
                 </Container>
                 <Container
                   scrollable
                   fullwidth>
                 {selectedOptions.length>0?<Container
                   fullwidth>
                   <Container
                     fullwidth
                     style={{height:20,marginTop:20,marginBottom:4}}
                     flexDirection="row">
                     <Typography
                        style={{position:'absolute',left:0}}
                      　color={"grayText"}
                       font="text01"
                      text={LangUtil.getStringByKey("common_selected")}/>
                     <IconButton
                       text={"text03"}
                       style={{position:'absolute',right:0}}
                       onPress={()=>this.onClearAll()}
                       text={LangUtil.getStringByKey("filter_clear_all")}/>
                   </Container>
                   <Container
                       fullwidth
                       justifyContent={"flex-start"}
                       alignItems={"flex-start"}
                       style={{flex:1}}>
                       <OptionContainer
                         style={{marginBottom:20}}
                         selected={selected}
                         multiSelect
                         onSelect={(id)=>this.onSelect(id)}
                         options={
                           selectedOptions
                         }/>
                   </Container>
                 </Container>:null}
                 {filterOption.length>0?<Container
                   fullwidth
                   style={{height:20,marginTop:20,marginBottom:4}}
                   flexDirection="row">
                   <Typography
                      style={{position:'absolute',left:0}}
                    　color={"grayText"}
                     font="text01"
                    text={LangUtil.getStringByKey("common_all")}/>
                   <IconButton
                     text={"text03"}
                     style={{position:'absolute',right:0}}
                     onPress={()=>this.onSelectAll()}
                     text={LangUtil.getStringByKey("filter_select_all")}/>
                 </Container>:null}
                 <Container
                     fullwidth
                     justifyContent={"flex-start"}
                     alignItems={"flex-start"}>
                     <OptionContainer
                       style={{marginBottom:20}}
                       selected={selected}
                       multiSelect
                       onSelect={(id)=>this.onSelect(id)}
                       options={
                         filterOption
                       }/>
                 </Container>
               </Container>
           </Container>
           </Container>
  }
  getRegion2Merge(r){
    console.log("getRegion2Merge")
    console.log(r)
    if(r){
        let list = [];
        for(var k in r){
          list = list.concat(r[k])
        }
        return list
    }
    else{
      return null;
    }
  }
  onSelectStore(id){
      this.setState({storeSelected:id})
      /*
    let selected = this.state.storeSelected;
    if(selected == id){
      this.setState({storeSelected:null})
    }
    else{
      this.setState({storeSelected:id})
    }
    */
  }

  renderSelectStore(){
    const {loginInfo,navigation,multi} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait");
    let mode = "event"
    const {showCalendar,tempStartDate,tempEndDate,edit,region1,region2,keyword,
      filterOptions,storeOptions,storeSelected} =this.state;
    let options = storeOptions;
    let filterOption = storeOptions
    if(keyword && keyword.length>0){
      filterOption = [];
      for(var k in options){
        if(options[k].name.indexOf(keyword)>=0){
          filterOption.push(options[k])
        }
        else{
          let item = {name:options[k].name,list:[]}
          for(var m in options[k].list){
            if(options[k].list[m].label.indexOf(keyword)>=0){
              item.list.push(options[k].list[m])
            }
          }
          if(item.list.length>0){
              filterOption.push(item)
          }
        }
      }
    }
    return <Container
      　　　justifyContent="flex-start"
           fullwidth style={{position:'absolute',bottom:0,backgroundColor:"#000000BB",height}}>
           <View
              keyboardVerticalOffset={-150}
               behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width:'100%', position:'absolute', bottom:0}}>
           <Container 　justifyContent="flex-start"
                  fullwidth style={{height:height-47,
                  borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",padding:16}}>
                 <Container
                   fullwidth
                   style={{height:20,marginBottom:20}}
                   flexDirection="row">
                   <IconButton
                     text={"text03"}
                     style={{position:'absolute',left:0}}
                     onPress={()=>this.setState({selectStore:false})}
                     text={LangUtil.getStringByKey("common_cancel")}/>
                  <Typography
                   　color={"text"}
                    font="text02"
                   text={LangUtil.getStringByKey("filter_change_location")}/>
                   <IconButton
                     text={"text03"}
                     style={{position:'absolute',right:0}}
                       onPress={async()=>{
                         let filterOptions = this.state.filterOptions;
                         let s=  this.props.storeList.find(p=>p.branch_id == this.state.storeSelected);
                         let names = s.branch_name;
                         filterOptions.event.store = this.state.storeSelected
                         filterOptions.event.storeName = names

                         this.setState({selectStore:false,filterOptions})
                         await this.fetchData(filterOptions)
                       }
                     }
                     text={LangUtil.getStringByKey("common_confirm")}/>
                 </Container>
                 <Container fullwidth scrollable style={{width,flex:1,padding:16,paddingTop:0,marginBottom:30}}>
                 <Container
                     fullwidth
                     flexDirection={"row"}
                     justifyContent={"flex-start"}>
                     <SearchInput
                        placeholder={LangUtil.getStringByKey("filter_keyword_search")}
                        value={this.state.keyword}
                        onClear={()=>this.setState({keyword:""})}
                        onChangeText={(t)=>this.onSearch(t)}
                      />
                    </Container>
                   {filterOption.map(function(item,i){
                       return <OptionContainer
                         group={item.name}
                         style={{marginBottom:0}}
                         onSelectAll={(ids)=>{}}
                         selected={storeSelected}
                         multiSelect={false}
                         onSelect={(id)=>this.onSelectStore(id)}
                         options={
                           item.list
                         }/>
                     }.bind(this))
                    }
                </Container>
           </Container>
           </View>
           </Container>
  }
  onSelectType(id){
    let deviceType = DEVICE_TYPES.find(p=>p.model == id);
       this.setState({selected:id,deviceType})
  }
  doNameChange(e){
    this.setState({deviceName:e})
  }
  onlyAlphabets(t){
    var regexp = new RegExp(/^[a-zA-Z0-9 ]*$/);
    return regexp.test(t);
  }
  doSerialChange(text){
    const {deviceType,deviceName,deviceSerial,deviceNo} = this.state;
    var limitSN =  deviceType.limitSN;
    if(this.onlyAlphabets(text) &&  text.length<=limitSN){
      this.setState({deviceSerial:text.trim().toUpperCase()})
    }
  //(text)=>{if(this.onlyAlphabets(text))this.setState({snInputError:text.length<limitSN?true:false,productSN:text.trim().toUpperCase()})}

  }
  canSend(){
    const {deviceType,deviceName,deviceSerial,deviceNo} = this.state;
    if(!deviceType){
      return false;
    }
    var limitSN =  deviceType.limitSN;
    var limitID =  deviceType.limitID
    //console.log(deviceName)

    if(deviceName.length==0){
      //console.log("Fail Device Name="+ deviceName)
      return false;
    }
    //console.log("SN="+deviceSerial.length + "/" + limitSN)
    if(deviceSerial.length!=limitSN){
        return false;
    }

    console.log("ID="+deviceNo.length+ "/" + limitID)
    if(deviceNo.length !=limitID){
      return false;
    }
    return true;
  }
  doIDChange(text){
    const {deviceType,deviceName,deviceSerial,deviceNo} = this.state;
    var limitID =  deviceType.sepScan?deviceType.category=='s'?16:12:16;
    if(this.onlyAlphabets(text) &&  text.length<=limitID){
      this.setState({deviceNo:text.trim().toUpperCase()})
    }
  }
  renderDeviceTypeList(){
    const {width,height} = DimUtil.getDimensions("portrait");
    const {deviceType,deviceName,deviceSerial,deviceNo,dialog} =this.state;
    let options = [];
    DEVICE_TYPES.forEach((item, i) => {
      options.push({label:item.displayName,id:item.model})
    });
    let selected = deviceType?deviceType.model:null
    return <Container
      　　　justifyContent="flex-start"
           fullwidth style={{position:'absolute',bottom:0,backgroundColor:"#000000BB",height}}>
             <Container 　justifyContent="flex-start"
                    fullwidth style={{height:height-47,position:'absolute',bottom:0,
                    borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",padding:16}}>
                    <Container
                      fullwidth
                      style={{height:20,marginBottom:20}}
                      flexDirection="row">
                      <Typography
                       　color={"text"}
                        font="text02"
                       text={LangUtil.getStringByKey("device_type")}/>
                      <IconButton
                        text={"text03"}
                        style={{position:'absolute',left:0}}
                        mode="static"
                        type="back"
                        iconStyle={{width:24,height:24}}
                        onPress={()=>this.setState({typeList:false})}
                        text={""}/>
                    </Container>
                    <Container
                        fullwidth
                        scrollable
                        justifyContent={"flex-start"}
                        alignItems={"flex-start"}
                        style={{flex:1}}>
                        <OptionContainer
                          style={{marginTop:20,marginBottom:20}}
                          selected={selected}
                          onSelect={(id)=>this.onSelectType(id)}
                          options={
                            options
                          }/>
                    </Container>
             </Container>

           </Container>

  }
  async doAddDevice(){
    if(!this.canSend()){
      console.log("Can't send data")
      return;
    }
    console.log("doAddDevice")
    this.props.setLoading(true);
    const {loginInfo,navigation,route,ccmFilter,onClose} = this.props;
    const {deviceType,deviceName,deviceSerial,deviceNo} = this.state;
    let device = this.state.filterOptions.event;
    let stores  = [];
    let r  = await MainAPI.getStoreList();
    if(r.status == ERROR_CODE.SUCCESS){
      console.log(r)
      stores = r.stores;
    }
    let store = stores.find(p=>p.store_id == device.store)
    console.log(store)
    var data ={
       product_sn:deviceSerial ,device_id:deviceNo,register_key:store.register_key,
       model_name:deviceType.model,device_name:deviceName ,name:deviceName}
    let result = await MainAPI.addDeviceTo(data);
    console.log(result)
    this.props.setLoading(false);
    if(result.status == ERROR_CODE.SUCCESS){
      DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_adddev_success"),type:'success'})
      if(onClose)onClose(this.state.filterOptions);
    }
    else{
      DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_adddev_fail"),type:'error'})
    }



  }
  renderAddDevice(){
    const {width,height} = DimUtil.getDimensions("portrait");
    const {filterOptions,deviceType,typeList,deviceName,deviceSerial,deviceNo,dialog} =this.state;
    const {navigation} = this.props;
    var limitSN =  deviceType? deviceType.limitSN :0;
    var limitID =  deviceType? deviceType.limitID : 0;
    var isLeoSensor = deviceType?deviceType.isLeoSensor:false
    if(typeList){
      return this.renderDeviceTypeList();
    }
    return  <Container
      　　　justifyContent="flex-start"
           fullwidth style={{backgroundColor:"#000000BB",position:'absolute',bottom:0,width:'100%',height:height}}>
             <Container 　justifyContent="flex-start"
                    fullwidth style={{height:height-47,marginTop:47,
                    borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",padding:16}}>
                    <Container
                      fullwidth
                      style={{height:20,marginBottom:20}}
                      flexDirection="row">
                      <IconButton
                        text={"text03"}
                        style={{position:'absolute',left:0}}
                        onPress={()=>this.onCancel()}
                        text={LangUtil.getStringByKey("common_cancel")}/>
                     <Typography
                      　color={"text"}
                       font="text02"
                      text={LangUtil.getStringByKey("device_add")}/>
                      <IconButton
                        text={"text03"}
                        style={{position:'absolute',right:0}}
                        onPress={async()=>{await this.doAddDevice()}}
                        font={this.canSend()?"primary":"#CECECE"}
                        text={LangUtil.getStringByKey("common_add_in")}/>
                    </Container>
                    <KeyboardAvoidingView keyboardVerticalOffset={50}
                                  behavior={'padding'} style={{width:'100%',flex:1,backgroundColor:"transparent"}}>

                                  <ScrollView   ref={(ele) => {
                                      this.sc = ele;
                                    }}>
                                   <Container fullwidt style={{width:'100%',paddingTop:20}}>
                                  <RegionSelection
                                    style={{marginBottom:2,borderRadius:0,marginTop:10,
                                          borderTopLeftRadius:8,borderTopRightRadius:8}}
                                    text={LangUtil.getStringByKey("device_type")}
                                    value={deviceType?deviceType.displayName:LangUtil.getStringByKey("common_please_select")}
                                    type="string"
                                    onPress={async()=>{
                                        this.setState({typeList:true})
                                    }
                                    }
                                    hint={""}/>
                                    <Container fullwidth>
                                    <TextInput
                                      placeholder={LangUtil.getStringByKey("device_custom_name")}
                                      onChangeText={this.doNameChange.bind(this)}
                                      style={{width:width-32,
                                        borderBottomLeftRadius:8,borderBottomRightRadius:8}}
                                      limit={20}
                                      invalidText={false}
                                      onPress={()=>this.setState({deviceName:""})}
                                      value={deviceName}/>
                                  </Container>
                                  <Container
                                    fullwidth
                                    style={{height:20,marginTop:6,marginBottom:20}}
                                    flexDirection="row">
                                    <Typography
                                       style={{position:'absolute',left:10}}
                                     　color={"#7d7d7d"}
                                      font="text00"
                                     text={LangUtil.getStringByKey("device_name_limit")}/>
                                  </Container>
                                  {deviceType&&!deviceType.sepScan?<TouchCard
                                       onPress={async()=>{navigation.push(PAGES.DEVICE_SCAN,{deviceType,mode:1,limitSN:limitSN, limitID:limitID  })}}
                                        fullwidth
                                          flexDirection="row"
                                          justifyContent={"flex-start"}
                                          alignItems={"center"}
                                          style={{marginTop:24,height:44,width:'100%',backgroundColor:'white',
                                          borderBottomLeftRadius:8,borderBottomRightRadius:8,marginBottom:30}}>
                                          <Typography
                                                  style={{position:'absolute',left:12}}
                                                color={"text"}
                                                text={"text01"}
                                                text={LangUtil.getStringByKey("device_scan_code")}
                                                font={"text01"}/>
                                          <IconButton
                                                  onPress={async()=>{navigation.push(PAGES.DEVICE_SCAN,{deviceType,mode:1,limitSN:limitSN, limitID:limitID  })}}
                                                  type={"scan"}
                                                  iconStyle={{width:24,height:24}}
                                                  text={""}
                                                  style={{position:'absolute',right:10}}/>
                                  </TouchCard>:null}
                                  <TextInput
                                    placeholder={LangUtil.getStringByKey("device_product_serial")}
                                    onChangeText={this.doSerialChange.bind(this)}
                                    style={{width:width-32,marginTop:0,
                                      borderRadius:8}}
                                    disabled={!deviceType}
                                    invalidText={deviceSerial.length>0 && deviceSerial.length<limitSN}
                                    mode={deviceType&&deviceType.sepScan?"scan":"default"}
                                    onPress={()=>this.setState({deviceSerial:""})}
                                    onScan={async()=>{navigation.push(PAGES.DEVICE_SCAN,{deviceType,mode:2,limit:limitSN})}}
                                    value={deviceSerial}/>
                                    <Container
                                      fullwidth
                                      style={{height:20,marginTop:6,marginBottom:20}}
                                      flexDirection="row">
                                      <Typography
                                          numberOfLines={2}
                                         style={{position:'absolute',width:width-40,left:10}}
                                       　color={"#7d7d7d"}
                                        font="text00"
                                        text={!deviceType?"":(LangUtil.getStringByKey("device_input_desc_sn").replace("{1}",limitSN))}/>
                                    </Container>
                                    <TextInput
                                      placeholder={LangUtil.getStringByKey("event_device_id")}
                                      style={{width:width-32,
                                        borderRadius:8}}
                                      disabled={!deviceType}
                                      onFocus={()=>{console.log("OnFocus");
                                      if(this.sc){
                                        console.log("Scroll")
                                        setTimeout(function(){
                                          this.sc.scrollToEnd({ animated:true})
                                        }.bind(this),200)

                                      }}}
                                      invalidText={deviceNo.length>0&& deviceNo.length<limitID}
                                      onChangeText={this.doIDChange.bind(this)}
                                      mode={deviceType&&deviceType.sepScan?"scan":"default"}
                                      onPress={()=>this.setState({deviceNo:""})}
                                      onScan={async()=>{navigation.push(PAGES.DEVICE_SCAN,{deviceType,mode:3,limit:limitID})}}
                                      value={deviceNo}/>

                                      <Container
                                        fullwidth
                                        style={{height:30,marginTop:6,marginBottom:20}}
                                        flexDirection="row">
                                        <Typography
                                           style={{position:'absolute',width:width-40,left:10}}
                                         　color={"#7d7d7d"}
                                          font="text00"
                                          numberOfLines={2}
                                         text={!deviceType?"":(LangUtil.getStringByKey("device_input_desc_id").replace("{1}",limitID))}/>
                                      </Container>
                                  </Container>
                                </ScrollView>
                             </KeyboardAvoidingView>
             </Container>
           </Container>


  }
  render(){
    const {loginInfo,navigation} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait");
    let mode = "event"
    const {selectStore,showCalendar,tempStartDate,tempEndDate,edit,region1,region2,filterOptions,
      isSensor,sensors,devices,addDevice} =this.state;
    if(region1){
      return this.renderRegion1()
    }
    if(region2){
      return this.renderRegion2()
    }
    if(selectStore){
      return  this.renderSelectStore()
    }
    if(addDevice){
      return this.renderAddDevice();
    }
    let count = 0;
    for(var k in filterOptions.event.options.stores){
      let item = filterOptions.event.options.stores[k]
      for(var i  in item){
        let subitem = item[i];
        count += subitem.length
      }
    }
    let filterData = isSensor?sensors:devices;
    console.log("Filter Data")
    console.log(sensors)
    console.log(devices)
    if(!filterData)filterData=[]
    let types = [LangUtil.getStringByKey("device_type_sensor"),LangUtil.getStringByKey("device_type_other")]
    return <Container
      　　　justifyContent="flex-start"
           fullwidth style={{position:'absolute',bottom:0,backgroundColor:"#000000BB",height}}>
           <KeyboardAvoidingView
              keyboardVerticalOffset={-150}
               behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width:'100%', position:'absolute', bottom:0}}>
           <Container 　justifyContent="flex-start"
                  fullwidth style={{height:height-47,
                  borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",padding:16}}>
                 <Container
                   fullwidth
                   style={{height:20,marginBottom:20}}
                   flexDirection="row">
                   <IconButton
                     text={"text03"}
                     style={{position:'absolute',left:0}}
                     onPress={()=>this.onCancel()}
                     text={LangUtil.getStringByKey("common_cancel")}/>
                  <Typography
                   　color={"text"}
                    font="text02"
                   text={LangUtil.getStringByKey("device_add")}/>
                   <IconButton
                     text={"text03"}
                     style={{position:'absolute',right:0}}
                     onPress={()=>{
                       //DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_adddev_success"),type:'success'})
                       //if(this.props.onClose)this.props.onClose(this.props.ccmFilter);
                       this.setState({addDevice:true})}}
                     text={LangUtil.getStringByKey("common_next_step")}/>
                 </Container>
                 <Container fullwidth style={{width,flex:1,padding:16,paddingTop:0}}>
                    <Container fullwidth  style={{paddingTop:0,height:130}}>
                            <RegionSelection
                                    style={{marginBottom:2,borderRadius:0,
                                          borderTopLeftRadius:8,borderTopRightRadius:8}}
                                    text={LangUtil.getStringByKey("filter_region1")}
                                    value={filterOptions.event.region1}
                                    onPress={async()=>{
                                      let mode="event"
                                      let options =[]
                                        filterOptions.event.options.region1.forEach((item, i) => {
                                        options.push({label:item,id:item})
                                      });
                                        let  selected= filterOptions.event.region1?filterOptions.event.region1:[];
                                        this.setState({options,selected,region1:true})
                                      }
                                    }
                                    hint={""}/>
                            <RegionSelection
                                    style={{marginBottom:3,borderRadius:0,
                                       borderBottomLeftRadius:8,borderBottomRightRadius:8}}
                                        text={LangUtil.getStringByKey("filter_region2")}
                                        onPress={async()=>{
                                               this.setState({region2:true})
                                            }
                                        }
                                        value={this.getRegion2Merge(filterOptions.event.region2)}
                                    hint={""}/>
                     </Container>
                     <RegionSelection
                             style={{marginBottom:3,borderRadius:0,
                                borderBottomLeftRadius:8,borderRadius:8}}
                                 text={LangUtil.getStringByKey("filter_location")}
                                 onPress={async()=>{
                                       let storeOptions=[]
                                       let storeSelected=this.state.filterOptions.event.store?this.state.filterOptions.event.store:{}
                                       console.log("Get Store Options")
                                       console.log(this.state.filterOptions.event.options.stores)
                                       for(var k in this.state.filterOptions.event.options.stores){
                                         let l1 = this.state.filterOptions.event.options.stores[k];
                                         for(var m in l1){
                                           let l2 = l1[m]
                                           storeOptions.push({name:k+' - '+m,list:l2})
                                         }
                                       }
                                       this.setState({selectStore:true,storeOptions,storeSelected})
                                     }
                                 }
                                 type="string"
                                 value={filterOptions.event.storeName}
                             hint={""}/>
                             <Container
                               fullwidth
                               style={{height:20,marginTop:20,marginBottom:4}}
                               flexDirection="row">
                               <Typography
                                  style={{position:'absolute',left:0}}
                                　color={"grayText"}
                                 font="text01"
                                text={LangUtil.getStringByKey("device_location_total")+"("+filterData.length+")"}/>
                             </Container>
                             <Container flexDirection="row" fullwidth
                             style={{height:40,width:'100%',backgroundColor:"white",borderTopLeftRadius:8,borderTopRightRadius:8,marginTop:0}}>
                                 {types.map(function(c,i){
                                     return   <Container key={i}style={{flex:1}}>
                                               <NormalButton style={{height:34,backgroundColor:'transparent'}}
                                               color={isSensor==(1-i)?COLORS.PRIMARY_BLUE:"#AFC5DF"}
                                              onPress={()=>{console.log("ONpress"+i);this.setState({isSensor:(1-i)})}}
                                              text={c}/>
                                               <Container style={{width:70,height:3,backgroundColor:isSensor==(1-i)?COLORS.PRIMARY_BLUE:"transparent"}}/>
                                             </Container>
                                 }.bind(this))}
                             </Container >
                             <Container
                                 fullwidth
                                 scrollable={true}
                                 justifyContent={"flex-start"}
                                 alignItems={"flex-start"}
                                 style={{flex:1,height:filterData.length==0?180:null,width:'100%',paddingBottom:160}}>
                                 {
                                   filterData.length>0?filterData.map(function(item,i){
                                     if(isSensor){
                                       return <SensorItem  style={{marginTop:2,borderRadius:0,width:'100%',
                                      borderBottomLeftRadius:i==filterData.length-1?8:0,
                                      borderBottomRightRadius:i==filterData.length-1?8:0}} data={item}/>
                                     }
                                     else{
                                       return  <DeviceItem    style={{marginTop:2,borderRadius:0,width:'100%',
                                      borderBottomLeftRadius:i==filterData.length-1?8:0,
                                      borderBottomRightRadius:i==filterData.length-1?8:0}}
                                      data={item}/>
                                     }

                                   }):!this.state.loading?<Container
                                       fullwidth
                                       style={{marginTop:2,flex:1,minHeight:200,backgroundColor:"white",
                                       borderBottomLeftRadius:8,borderBottomRightRadius:8}}>
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

           </Container>
           </KeyboardAvoidingView>
           </Container>
  }


}
export default BottomNavigation;
