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
        DataInput,
        LineChart,
        DimUtil,
        Icon,
        TouchCard,
        NormalButton} from '../../../framework'
import {LangUtil,StorageUtil,FilterUtil} from '../../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES,UNITS} from  "../../define"
import BottomNavigation from "../../components/BottomNavigation"
import { DeviceEventEmitter} from 'react-native';
import BottomDrawer from 'rn-bottom-drawer';
import CcmAPI from '../../api/ccm'
import moment from 'moment'

class PageDataMonitor extends Component {
  constructor(props) {
    super(props);
    this.state={
      alert:false,
      group:[],
      comment:"",
      alert_records:[],
      block:false,
      data:[],
      label:[],
      status:[],
      list:[],

    }
  }

  componentWillUnmount() {

  }
  openFilter(){
     const {ccmFilter,navigation} = this.props;
     let newFilter = JSON.parse(JSON.stringify(ccmFilter));
    // newFilter.cache.event = JSON.parse(JSON.stringify(ccmFilter.event));
     newFilter.cache.data = JSON.parse(JSON.stringify(ccmFilter.data));
     this.props.setCcmFilter(newFilter)
     navigation.push(PAGES.FILTER_DATE,{mode:'data',page:PAGES.DATA_MONITOR})
  }
  async fetchData(ccmFilter){

    const {loginInfo,navigation,route,storeList} = this.props;
    const {prober,event,monitorRules,alertRules,userPositions,userDepartments} = route.params;

    if(!ccmFilter){

      ccmFilter = this.props.ccmFilter;
    }

    //monitor_rule_ids
    let group="";
    let alert =false;
    this.props.setLoading(true)
    prober.alert_ids.forEach((item, i) => {

        let mr = alertRules.find(p=>p.alert_rule_id == item);
        if(mr){
          if(mr){
            alert = true;
            mr.recv_pairs.forEach((pair, i) => {
              //  console.log(pair)
                let p = pair.position_id? userPositions.find(p=>p.id ==pair.position_id ) :null;
                let pStr = p?p.name:"-"
                let d = pair.department_id? userDepartments.find(p=>p.id ==pair.department_id ) :null;
                let dStr = d?d.name:"-"
                if(group.length>0)group=group+","
                group = group + pStr+"("+dStr + ")"
              //  console.log(group)
            });

          }

        }
    });
    let list =[];
    //console.log(prober)
    let startDate = moment ( new Date()).utc().format("YYYY/MM/DD 00:00");
    let endDate =   moment ( new Date()).utc().format("YYYY/MM/DD 23:59");

    if(prober.maxts){
      endDate = moment ( new Date(prober.maxts*1000)).utc().format("YYYY/MM/DD 23:59")
    }
    if(prober.mints){
      startDate = moment ( new Date((prober.mints - 3600*2)*1000)).utc().format("YYYY/MM/DD HH:mm")
    }
  //  console.log(startDate,endDate)
    if(startDate && endDate){
      let result = await CcmAPI.getDataRetrive(prober.mm_id,startDate,endDate);
      //console.log("#######################")
       console.log(JSON.stringify(result))
      if(result.status == ERROR_CODE.SUCCESS){
      result.monitor_module.probers.forEach((pr, i) => {
          //  console.log("Find PR")
            //console.log(pr)
            let ev ={id:pr.prober_id,prober_name:pr.name,alert_status:pr.alert_status[0]?pr.alert_status[0].status:100,
              prober_status:pr.prober_status,monitor_rule_ids:pr.monitor_rule_ids}
            ev.data =[];
            ev.status=[];
            ev.label=[];
            ev.order = pr.order
            ev.monitor_rule_id = pr.monitor_rule_ids[0]?pr.monitor_rule_ids[0]:""
            monitorRules.forEach((mrr, i) => {
              if(mrr.monitor_rule_id == ev.monitor_rule_id){
                ev.monitor_rule = mrr;
              }
            });
          //  if(!ev.monitor_rule){
             pr.mm_monitor_rule_ids.forEach((rule, i) => {
               if(rule.enable){
                 monitorRules.forEach((mrr, i) => {
                   if(mrr.monitor_rule_id == rule.id && pr.value_types[0]== mrr.item){
                     ev.monitor_rule = mrr;
                   }
                 });

               }
             });

          //  }
            ev.mm_id = result.monitor_module.mm_id;
            ev.time_zone = prober.time_zone;
            ev.value_types = pr.value_types


            result.probers.forEach((item, i) => {
            //  console.log(item)
              if(pr.prober_id == item.id){
                  //  console.log("Find prober")
                    let init = false
                    let index = -1;
                    ev.sensor_id = item.sensor_id;
                    item.sensor_datas.forEach((d, i) => {
                        if(i> (item.sensor_datas.length-8)){
                          let type = ev.value_types?ev.value_types:"temperature";
                          console.log("To Get Datas Type="+ev.value_types)
                          let timestamp = d.timestamp - parseInt(prober.time_zone.replace("+",""))*3600
                          console.log("Check Value***************")
                          console.log(d.value)
                          console.log(d.value_status)
                          ev.data.push(d.value[type]);

                          ev.status.push(d.value_status[type]);
                          ev.label.push(moment(d.timestamp*1000).utc().format("YYYY/MM/DD HH:mm"))
                        }
                    });
              }


              //let output = FilterUtil.getDataRetrieve(item.sensor_datas,ccmFilter.data.startTime,
              //ccmFilter.data.dataMode,ev.monitor_rule?ev.monitor_rule.item:"temperature",prober.time_zone);
              //console.log(output)
              //ev.data = output.data
              //ev.status = output.status
              //ev.label = output.label
              //console.log(ev)


            });
            //console.log(ev)
            if(ev.prober_status<70){
              list.push(ev)
            }

          });
      }

    }
    //console.log("Sort Data")
    list = list.sort(function(a,b){
  //    console.log("Compare"+b.order, a.order)
      return a.order - b.order
    })
    if(group==""){
      group ="-"
    }
    this.setState({group,alert,list})

    //console.log(group)
    this.props.setLoading(false)
  }
  async componentDidMount() {
    await this.fetchData();
    DeviceEventEmitter.addListener("FILTER_CHANGE_MONITOR", async(event)=>{
      //console.log("DATA MONITOR FILTER CHANGE")
      //console.log(event.ccmFilter)
      await this.fetchData(event.ccmFilter);
    })
  }

  async showBrandSelect(){
    const {navigation} = this.props;
    navigation.push(PAGES.BRAND_SELECT)
  }
  async next(){
    const {loginInfo,navigation,route} = this.props;
    const {event,monitorRules,alertRules,} = route.params;
    navigation.replace(PAGES.EVENT_RELATED,{event})
  }
  doChangeComment(t){
    //console.log("Change Comment "+t.length + " /  " + this.state.comment.length)
    if(!this.state.block){
      this.setState({comment:t})
    }
    else{
      this.setState({block:false})
    }


  }
  onEventDetail(prober){
      const {loginInfo,navigation,route} = this.props;
      const {event,monitorRules,alertRules} = route.params;
      let dt = moment(new Date()).format("YYYY-MM-DD 00:00:00");
      navigation.push(PAGES.DATA_DETAIL,
        {event:prober,prober:prober,monitorRules,alertRules,target:prober.id,eventTime:dt})
  }
  getMonitorRule(monitor_rule){
    //監測條件：溫度_冷凍 (-25°C ~ -8°C, 立即)
    //console.log(monitor_rule)
    if(!monitor_rule) return "-"
    let unit = monitor_rule && monitor_rule.item?UNITS(monitor_rule.item):""
    let duration  = monitor_rule.duration_to_triggers[0] == 0 ? LangUtil.getStringByKey("time_unit_instant"):(monitor_rule.duration_to_triggers[0] + LangUtil.getStringByKey("time_unit_min"))
    if(monitor_rule.item == 'switch'){
      return  monitor_rule.name + " (" + (monitor_rule.upper_limit==1?LangUtil.getStringByKey("rule_switch_on"):LangUtil.getStringByKey("rule_switch_off")) + ","+ duration+ ")"
    }
    return  monitor_rule.name + " (" + (monitor_rule.upper_limit!=undefined? monitor_rule.lower_limit+unit:"-")+ " ~ "+  (monitor_rule.upper_limit!=undefined? monitor_rule.upper_limit+unit:"-") + ","+ duration+ ")"
  }
  async onCommentEnter(){
    const {loginInfo,navigation,route} = this.props;
    const {event,monitorRules,alertRules,} = route.params;
    //console.log("OnCommentEnter")
    if(this.state.comment.length>0){
      //console.log("Send Comment "+this.state.comment)
      await CcmAPI.addAlertCause(prober.alert_id,"cause",this.state.comment)
      let result  = await CcmAPI.getAlertInfo(prober.alert_id);
      if(result.status == ERROR_CODE.SUCCESS){
          this.setState({alert_records:result.alert_records})
      }

    }
    this.setState({comment:"",block:true})
  }
  getProberStatueImage(status,alert_status){
    //console.log("Status="+status,alert_status)
    switch(status){
      case 26:
          return "illustration-unit-status-defrost"
      case 21:
          if(alert_status>100)return "illustration-unit-status-error"
          return "illustration-unit-status-normal"
      case 25:
          return "illustration-unit-status-normal"
      case 20:
          return "illustration-unit-status-no-data"
      case 23:
          return "illustration-unit-status-offline"
      case 1:
          return "illustration-unit-status-unbind"
      case 24:
          return "illustration-unit-status-pause"
      case 70:
          return "illustration-unit-status-delete"
      case 29:
          return "illustration-unit-status-stop"
      default:
          return "illustration-unit-status-error"

    }
  }
  renderChart(prober,i){
    //console.log("Venter chart value types="+prober.value_types)
    let date="";
    const {width,height} = DimUtil.getDimensions("portrait")
    let unit = prober.value_types && prober.value_types[0] ?UNITS(prober.value_types[0]):""
    let data = prober.data[prober.data.length-1]!=undefined?prober.data[prober.data.length-1]:"-";
    if(prober.value_types ){
       if(prober.value_types[0]=='switch'){
         data = data==0?LangUtil.getStringByKey("switch_off"):LangUtil.getStringByKey("switch_on")
       }
       else if(data!='-'){
         data = data.toFixed(2)
       }

    }
    return <Container
      key={i}
      style={{marginBottom:16,backgroundColor:'white',borderRadius:8,padding:16,width:width-32}}
      onPress={()=>this.onEventDetail(prober)}
    >
      <Container
              alignItems="flex-start"
              fullwidth
      >
      <Container alignItems="flex-end" style={{position:'absolute',right:0,top:0}}>
          <Container flexDirection='row' justifyContent="flex-start" >
             <Typography text={LangUtil.getStringByKey("event_last_data")} color="#A5A5A5" font="text00"/>
          </Container>
          <Container flexDirection='row' justifyContent="flex-start" alignItems="flex-end" style={{marginBottom:0}}>
             <Typography text={data} color="text" font="title05"/>
             <Typography text={unit} style={{marginBottom:4}} color="text" font="text02"/>
          </Container>
      </Container>
      <Container flexDirection="row"
             alignItems="center"
             style={{marginTop:0,padding:0,marginBottom:8}}
            justifyContent="flex-start">
        <Icon
              style={{width:24,height:24}}
              mode={"static"}
              type={this.getProberStatueImage(prober.prober_status,prober.alert_status)}/>
        <Typography
             font={"subtitle02"}
             style={{width:width-180}}
             text={prober.prober_name}
             color='text'/>
        <View style={{flex:1}}/>
      </Container>
      <Typography
          font={"textxs"}
          style={{marginTop:0,marginLeft:6}}
          text={LangUtil.getStringByKey("event_device_id")+" : "+(prober.sensor_id&&prober.sensor_id!=""&&prober.prober_status!=1?prober.sensor_id:"-")}
          color='#A5A5A5'/>
      <Container flexDirection="row"  alignItems="center"  style={{marginTop:12,marginTop:16,marginBottom:10}}>
       <Icon style={{width:20,height:20}} mode={'static'}
            type={prober.monitor_rule&&prober.monitor_rule.item?"monitor_type_"+prober.monitor_rule.item:""}/>
        <Typography
                      font={"text01"}
                          text={this.getMonitorRule(prober.monitor_rule)}
                          color='text'/>
      </Container>
      {prober.data.length>0?<LineChart
              status={prober.status}
              index={prober.data.length-1}
              unit={unit}
              binary={prober.value_types && prober.value_types[0]=='switch'?true:false}
              height={140}
              width={width-60}
                data={{
              labels: prober.label,
              datasets: [{data:prober.data}]
          }}/>:<View style={{width:"100%",height:0}}/>}
        </Container>
    </Container>
  }
  getStatusImage(status,alert,defrost){
    switch(status){
      case 26:
      case 20:
      case 21:
      case 23:
      case 25:
          return "illustration-dot-status-normal"
      case 24:
          return "illustration-dot-status-pause"
      case 70:
          return "illustration-dot-status-delete"
      default:
        return "illustration-dot-status-stop"

    }

  }
  render(){
    const {loginInfo,navigation,route} = this.props;
    const {event,monitorRules,alertRules,prober} = route.params;
    const {alert,group,alert_records,comment,data,label,index,status,list,expand} = this.state;
    const {width,height} = DimUtil.getDimensions("portrait")
    const std=[0,100];
  //  console.log(prober)
    let date = "-"
    if(prober.maxts){
      //console.log(prober.last_data)
      date = moment ( new Date(prober.maxts*1000)).utc().format("YYYY/MM/DD HH:mm")
    }
    let last = alert_records&&alert_records.length>0?alert_records[alert_records.length-1].record.content: "-"
    return ( <PageContainer
                navigation={this.props.navigation}
                introduction={this.state.introduction}
                style={{paddingLeft:0,paddingRight:0}}
                onCloseIntroduction={()=>this.setState({introduction:null})}
                isHeader={true}>
                <Header
                  leftIcon={"header-back"}
                  onLeftPressed={()=>{navigation.pop(1)}}
                  text={LangUtil.getStringByKey("data_inspection")}
                />
                <Container
                    fullwidth
                    onRefresh={async()=> await this.fetchData()}
                    scrollable={list.length!=0}
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1}}>
                {false?<Container
                        fullwidth
                        style={{marginTop:8}}
                        justifyContent={"flex-start"}
                        alignItems={"flex-start"}
                        border
                        >
                  <Typography
                      font={"content03"}
                      text={LangUtil.getStringByKey("filter_location")+" : "+prober.branch_name}
                      color='text'/>
                  <Typography
                      font={"content03"}
                      style={{marginTop:8}}
                      text={LangUtil.getStringByKey("monitor_unit_count")+" : "+prober.sensors.length}
                      color='text'/>
                  <Typography
                          font={"content03"}
                          style={{marginTop:8}}
                          text={date+" ("+ prober.time_zone+")"}
                          color='text'/>
                  <Typography
                          font={"content03"}
                          style={{marginTop:8}}
                          text={LangUtil.getStringByKey("ccm_notify")+" : "+(alert?LangUtil.getStringByKey("common_on"):LangUtil.getStringByKey("common_off"))}
                          color='text'/>
                  <Typography
                          font={"content03"}
                          style={{marginTop:8}}
                          text={LangUtil.getStringByKey("ccm_notify_group")+" : "+group}
                          color='text'/>
                </Container>:null}
                 <Container flexDirection="row"
                             alignItems="center"
                             style={{height:48,paddingLeft:16,paddingRight:16}}
                            justifyContent="flex-start">
                    <Typography
                             font={"text01"}
                             text={LangUtil.getStringByKey("data_trend_graph")+"("+list.length +")"}
                             color='text'/>
                    <View style={{flex:1}}/>
                    <IconButton
                    onPress={()=>this.setState({introduction:{
                      title:LangUtil.getStringByKey("common_figure"),
                      info:[
                        {type:LangUtil.getStringByKey("hint_status_desc"),
                          mode:'detail',
                          title:LangUtil.getStringByKey("event_info_montiror_status"),
                         list:[
                           {type:'detail',
                            color:'#8EA473',
                            subtitle:LangUtil.getStringByKey( "hint_unit_subtitle"),
                          　title:LangUtil.getStringByKey("monitor_status_running"),
                          　titleColor:'white',
                            subtitleColor:'#E3E3E3',
                            icon:"illustration-in-card-activation-control-activate",
                            list:[
                              {
                                 　color:'#8EA473',
                                　title:LangUtil.getStringByKey("monitor_status_normal"),
                                  icon:"illustration-station-status-normal",
                                  desc:'hint_desc_module_normal',
                                  list:[
                                    {title:LangUtil.getStringByKey("monitor_status_normal"),
                                    desc:'hint_desc_unit_normal',
                                      icon:"illustration-unit-status-normal"},
                                  // {title:LangUtil.getStringByKey("data_trend_sample_stop_running"),
                                  //     desc:'hint_desc_unit_stoprunning',
                                  //    icon:"illustration-unit-status-stop-running"},
                                  ]
                              },
                              {
                                 color:'#CA4940',
                                 title:LangUtil.getStringByKey("monitor_status_abnormal"),
                                   icon:"illustration-station-status-error",
                                   desc:'hint_desc_module_abnormal',
                                  list:[
                                    {title:LangUtil.getStringByKey("monitor_status_abnormal"),
                                        desc:'hint_desc_unit_abnormal',
                                      icon:"illustration-unit-status-error"},
                                   {title:LangUtil.getStringByKey("monitor_status_unbound"),
                                       desc:'hint_desc_unit_unbind',
                                      icon:"illustration-unit-status-unbind"},
                                  　{title:LangUtil.getStringByKey("monitor_status_nodata"),
                                   desc:'hint_desc_unit_nodata',
                                         icon:"illustration-unit-status-no-data"},
                                    {title:LangUtil.getStringByKey("monitor_status_offline"),
                                     desc:'hint_desc_unit_offline',
                                        icon:"illustration-unit-status-offline"},
                                  ]
                              },
                              {
                                  color:'#2FA8FF',
                                  title:LangUtil.getStringByKey("monitor_status_defrosting"),
                                   icon:"illustration-station-status-defrost",
                                   desc:'hint_desc_module_defrost',
                                  list:[
                                    {title:LangUtil.getStringByKey("monitor_status_defrosting"),
                                     desc:'hint_desc_unit_defrost',
                                      icon:"illustration-unit-status-defrost"},
                                  ]
                              },
                            ]
                          　},
                           {type:'detail',
                            color:'#D5B142',
                            titleColor:'white',
                            subtitleColor:'#E3E3E3',
                            title:LangUtil.getStringByKey("monitor_status_pause"),
                            subtitle:LangUtil.getStringByKey( "hint_unit_subtitle"),
                            icon:"illustration-in-card-activation-control-pause",
                           list:[
                             {
                                　color:'#D5B142',
                               　title:LangUtil.getStringByKey("monitor_status_pause"),
                                 icon:"illustration-station-status-pause",
                                 desc:'hint_desc_module_pause',
                                 list:[
                                   {title:LangUtil.getStringByKey("monitor_status_pause"),
                                    desc:'hint_desc_unit_pause',
                                     icon:"illustration-unit-status-pause"},
                                 ]
                             }
                              ]

                            },
                           {type:'detail',
                           color:'#6E6E6E',
                           titleColor:'white',
                           subtitleColor:'#E3E3E3',
                           title:LangUtil.getStringByKey("monitor_status_stop"),
                           subtitle:LangUtil.getStringByKey( "hint_unit_subtitle"),
                           icon:"illustration-in-card-activation-control-stop",
                           list:[
                             {
                                　color:'#6E6E6E',
                               　title:LangUtil.getStringByKey("monitor_status_stop"),
                                 icon:"illustration-station-status-stop",
                                 desc:'hint_desc_module_stop',
                                 list:[
                                   {title:LangUtil.getStringByKey("monitor_status_stop"),
                                    desc:'hint_desc_unit_stop',
                                     icon:"illustration-unit-status-stop"},
                                 ]
                             }
                              ]
                           },
                           {type:'detail',
                            color:'#CECECE',
                            titleColor:'#2B2B2B',
                             subtitleColor:'#7D7D7D',
                             title:LangUtil.getStringByKey("monitor_status_delete"),
                             subtitle:LangUtil.getStringByKey ("hint_unit_subtitle"),
                             icon:"illustration-in-card-activation-control-delete",
                             list:[
                               {
                                  　color:'#6E6E6E',
                                 　title:LangUtil.getStringByKey("monitor_status_delete"),
                                   icon:"illustration-station-status-delete",
                                   desc:'hint_desc_module_delete',
                                   list:[
                                     {title:LangUtil.getStringByKey("monitor_status_delete"),
                                      desc:'hint_desc_unit_delete',
                                       icon:"illustration-unit-status-delete"},
                                   ]
                               }
                                ]
                            },
                            ]
                        },
                        {type:LangUtil.getStringByKey("hint_graphic_desc"),
                          title:LangUtil.getStringByKey("common_trend_sample"),
                         list:[
                           {title:LangUtil.getStringByKey("monitor_status_normal"),icon:"illustration-dashboard-legend-normal"},
                           {title:LangUtil.getStringByKey("monitor_status_abnormal"),icon:"illustration-dashboard-legend-error"},
                           {title:LangUtil.getStringByKey("data_trend_sample_pause_running"),icon:"illustration-dashboard-legend-pause"},
                           {title:LangUtil.getStringByKey("data_trend_sample_frozen"),icon:"illustration-dashboard-legend-smart"},
                           {title:LangUtil.getStringByKey("data_trend_sample_stop_running"),icon:"illustration-dashboard-legend-stop"},
                          ]
                        }
                      ]
                    }})}
                    type="info"/>
                </Container>
                <Container
                    fullwidth
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1,marginBottom:expand?230:100,paddingLeft:16,paddingRight:16}}>
                    {
                      list.map(function(item,i){
                        return this.renderChart(item,i);
                      }.bind(this))
                    }
                   {list.length==0?<Container
                      fullwidth
                      border
                      style={{flex:1,marginTop:10}}>
                        <Icon style={{width:65,height:65}} mode="static" type="illustration-no-data"/>
                        <Typography
                                 style={{marginBottom:7,marginTop:5}}
                                 color="lightgray"
                                 font={"subtitle03"}
                        text={LangUtil.getStringByKey("common_nodata")}/>
                  </Container>:null}

                </Container>
                </Container>
                <BottomDrawer
                    ref={(ele) => {
                      this.bottomDrawer = ele;
                    }}
                     startUp={false}
                     containerHeight={180}
                     offset={70}
                     backgroundColor={'#FAFCFF'}
                     shadow={false}
                     onExpanded = {() => {console.log("OnExpand");this.setState({expand:true})}}
                     onCollapsed = {() => {console.log("Collapse");this.setState({expand:false})}}
                >
                <Container
                       alignItems="center"
                       fullwidth
                       style={{height:'auto',backgroundColor:'#FAFCFF',width:'100%',
                        borderTopLeftRadius:25,  borderTopRightRadius:25,paddingLeft:24,paddingRight:24,
                         shadowColor:"#BBB",
                         shadowOffset: { width:2 , height: -3},
                         shadowOpacity: 0.2,
                         shadowRadius: 2,
                         elevation:5,}}
                      justifyContent="flex-start">
                        <TouchCard　
                        onPress={()=>{if(expand){
                          this.bottomDrawer.setDown()
                        }
                        else{
                          this.bottomDrawer.setUp()
                        }
                        this.setState({expand:!expand})}}
                        style={{width:35,height:5,backgroundColor:'#3C3C4344',
                        borderRadius:2,marginTop:3,marginBottom:6}}/>
                        <Container
                        onPress={()=>{if(expand){
                          this.bottomDrawer.setDown()
                        }
                        else{
                          this.bottomDrawer.setUp()
                        }
                        this.setState({expand:!expand})}}
                        fullwidth justifyContent="flex-start"  flexDirection='row'
                           style={{borderBottomWidth:0,borderColor:'#F0F0F0',marginBottom:8}} >
                           <Icon style={{width:20,height:20}} mode={'static'}
                            type={this.getStatusImage(prober.mm_status,prober.alert,prober.defrost)}/>
                          <Typography
                          text={prober.mm_name} color="text" font="text02" style={{marginRight:4,width:width-180}}/>
                          <View style={{flex:1}}/>
                          <IconButton
                            text={"text00"}
                            onPress={()=>{if(expand){
                              this.bottomDrawer.setDown()
                            }
                            else{
                              this.bottomDrawer.setUp()
                            }
                            this.setState({expand:!expand})}}
                            text={LangUtil.getStringByKey(expand?"common_hide":"common_expand")}/>
                        </Container>
                        <Container fullwidth alignItems="flex-start" >
                          <Container flexDirection="row" alignItems="center" style={{marginBottom:8}}>
                            <Typography
                                  font={"text00"}
                                  style={{width:100}}
                                  text={LangUtil.getStringByKey("filter_location")}
                                  color='#A5A5A5'/>
                                  <Typography
                                        style={{width:width-150}}
                                        font={"text01"}
                                        text={this.props.ccmFilter.event.storeName}
                                  color='text'/>
                           </Container>
                           <Container flexDirection="row" alignItems="center" style={{marginBottom:8}}>
                             <Typography
                                   font={"text00"}
                                   style={{width:100}}
                                   text={LangUtil.getStringByKey("monitor_unit_count")}
                                   color='#A5A5A5'/>
                                   <Typography
                                         font={"text01"}
                                         text={list.length}
                                   color='text'/>
                            </Container>
                        </Container>
                        {expand?<Container fullwidth alignItems="flex-start" >
                          <Container flexDirection="row" alignItems="center" style={{marginBottom:8}}>
                            <Typography
                                  font={"text00"}
                                  style={{width:100}}
                                  text={LangUtil.getStringByKey("ccm_data_time")}
                                  color='#A5A5A5'/>
                                  <Typography
                                        font={"text01"}
                                        text={date+" ("+ prober.time_zone+")"}
                                  color='text'/>
                           </Container>
                           <Container flexDirection="row" alignItems="center" style={{marginBottom:8}}>
                             <Typography
                                   font={"text00"}
                                   style={{width:100}}
                                   text={LangUtil.getStringByKey("ccm_notify")}
                                   color='#A5A5A5'/>
                                   <Typography
                                         font={"text01"}
                                         text={alert?LangUtil.getStringByKey("common_on"):LangUtil.getStringByKey("common_off")}
                                   color='text'/>
                            </Container>
                            <Container flexDirection="row" alignItems="center" style={{marginBottom:8}}>
                              <Typography
                                    font={"text00"}
                                    style={{width:100}}
                                    text={LangUtil.getStringByKey("ccm_notify_group")}
                                    color='#A5A5A5'/>
                                    <Typography
                                          font={"text01"}
                                          style={{width:width-170}}
                                          numberOfLines={3}
                                          text={group}
                                    color='text'/>
                             </Container>
                        </Container>:null}
                </Container>
                </BottomDrawer>
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageDataMonitor);
