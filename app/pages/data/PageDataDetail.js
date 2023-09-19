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
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES} from  "../../define"
import BottomNavigation from "../../components/BottomNavigation"
import { DeviceEventEmitter,ScrollView} from 'react-native';
import CcmAPI from '../../api/ccm'
import moment from 'moment'
import DataTable from '../../components/DataTable'

class PageEventDetail extends Component {
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
      tableData:[],
      sensorId:"",
    }
  }

  componentWillUnmount() {

  }
  async componentDidMount() {
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {event,monitorRules,alertRules,userPositions,userDepartments,eventTime,target} = route.params;
    console.log(event)
  //  console.log(monitorRules)
    let group="";
    let alert =false;
    let sensorId;
    this.props.setLoading(true)


    let alert_records = []
    let result  = await CcmAPI.getAlertInfo(event.alert_id);
    if(result.status == ERROR_CODE.SUCCESS){
        alert_records = result.alert_records;
    }
    console.log("Event data=")
    console.log(event)
    let d = moment( eventTime, 'YYYY-MM-DD HH:mm:ss').toDate();
    let et = Math.round((d.getTime())/1000 );
    result = await CcmAPI.getDataRetrive(event.mm_id,ccmFilter.data.startTime,ccmFilter.data.endTime);

    //console.log("REtrieve")
    //console.log(result)
    //console.log(JSON.stringify(result))
    //console.log("TargetID="+event.target_id)

    if(result.status == ERROR_CODE.SUCCESS){
      let data = [];
      let label=[];
      let status=[];
      let tableData=[];
      let index = -1
      let init = false;
      result.probers.forEach((item, i) => {
          //console.log(item.id)
          if(item.id == target){
            //console.log("DataLen="+item.sensor_datas.length)
            //console.log("DataType="+event.item)
            console.log("Get Item sensor ID "+item.sensor_id)
            sensorId = item.sensor_id;

            item.sensor_datas.forEach((d, i) => {
                //console.log(d.timestamp)
                //console.log(d.value[event.monitor_rule.item])
                /*
                let timestamp = d.timestamp - parseInt(event.time_zone.replace("+",""))*3600
                data.push(d.value[event.monitor_rule.item]);
                status.push(d.value_status[event.monitor_rule.item]);
            //    console.log(item.timestamp+ " vs " + et + " vs " )
                label.push(moment(d.timestamp*1000).utc().format("HH:mm"))
                //  console.log(i+ " " +timestamp +"/"+et)
                if(!init && timestamp == et){
                   init = true;
                   index = i;
                   console.log("Get Index="+index)
                }
                let v = d.value[event.monitor_rule.item]+ (event.monitor_rule.item=="temperature"?"°C":"%")
                */
                let v = d.value[event.monitor_rule.item]+ (event.monitor_rule.item=="temperature"?"°C":"%")
                tableData.push([moment(d.timestamp*1000).utc().format("MM/DD HH:mm"),v,d.value_status[event.monitor_rule.item]])
            });
            let output = FilterUtil.getDataRetrieve(item.sensor_datas,
            ccmFilter.data.startTime,
            ccmFilter.data.dataMode,
            event.monitor_rule?event.monitor_rule.item:"temperature",
            event.time_zone);
            data = output.data
            status = output.status
            label = output.label


            tableData = tableData.reverse()
            this.setState({status,data,label,index,tableData})
            setTimeout(function(){
              if(this.graph){
                const {width,height} = DimUtil.getDimensions("portrait")
                console.log("Scroll To ")
                let gap = (width-40)/5;

                this.graph.scrollTo({x: gap*(index-2),anamate:false})
              }
            }.bind(this),10)
          }
      });

    }
    this.setState({sensorId,alert,group,alert_records})
    this.props.setLoading(false)

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
  onEventDetail(){
      const {loginInfo,navigation,route} = this.props;
      const {event,monitorRules,alertRules} = route.params;
      navigation.push(PAGES.EVENT_DETAIL,{event,monitorRules,alertRules})
  }
  getMonitorRule(monitor_rule){
    //監測條件：溫度_冷凍 (-25°C ~ -8°C, 立即)
    return  monitor_rule.name + " (" + (monitor_rule.upper_limit? monitor_rule.lower_limit+"°C":"-")+ " ~ "+  (monitor_rule.upper_limit? monitor_rule.upper_limit+"°C":"-") + ")"
  }
  render(){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {event,monitorRules,alertRules,eventTime} = route.params;
    const {alert,group,alert_records,comment,data,label,index,status,sensorId,tableData} = this.state;
    const {width,height} = DimUtil.getDimensions("portrait")
    const std=[0,100];
  //  console.log(event)
    let date = moment ( new Date(eventTime)).format("YYYY/MM/DD HH:mm")
    let day = moment ( new Date(eventTime)).format("YYYY/MM/DD")
    let last = alert_records&&alert_records.length>0?alert_records[alert_records.length-1].record.content: "-"
    return ( <PageContainer
                navigation={this.props.navigation}
                introduction={this.state.introduction}
                onCloseIntroduction={()=>this.setState({introduction:null})}
                isHeader={true}>
                <Header
                  leftIcon={"header-back"}
                  onLeftPressed={()=>{ DeviceEventEmitter.emit("FILTER_CHANGE");navigation.pop(1)}}
                  text={LangUtil.getStringByKey("不使用event_data_detail")}
                />
                <Container
                    fullwidth
                    scrollable
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1}}>
               <Typography
                    style={{marginBottom:2,marginTop:20}}
                    font={"subtitle02"}
                    text={event.prober_name}
                    color='primaray'/>
                 <Container
                        fullwidth
                        style={{marginTop:8}}
                        justifyContent={"flex-start"}
                        alignItems={"flex-start"}
                        border
                        >
                  <Typography
                          font={"content03"}
                          style={{marginTop:8}}
                          text={LangUtil.getStringByKey("device_id")+ " : " + sensorId }
                          color='text'/>
                  <Typography
                          font={"content03"}
                          style={{marginTop:8}}
                          text={LangUtil.getStringByKey("event_monitor_condition")+" : "+ this.getMonitorRule(event.monitor_rule)}
                          color='text'/>
                </Container>
                 <Container flexDirection="row"
                             alignItems="center"
                             style={{marginTop:8}}
                            justifyContent="flex-start">
                    <Typography
                             font={"subtitle02"}
                             text={LangUtil.getStringByKey("data_trend_graph")}
                             color='primaray'/>
                    <View style={{flex:1}}/>
                    <IconButton
                    onPress={()=>this.setState({introduction:{
                      title:LangUtil.getStringByKey("common_figure"),
                      info:[
                        {
                          title:LangUtil.getStringByKey("common_trend_sample"),
                         list:[
                           {title:LangUtil.getStringByKey("monitor_status_normal"),icon:"illustration-dashboard-legend-normal"},
                           {title:LangUtil.getStringByKey("data_trend_sample_pause_running"),icon:"illustration-dashboard-legend-pause"},
                           {title:LangUtil.getStringByKey("monitor_status_abnormal"),icon:"illustration-dashboard-legend-error"},
                           {title:LangUtil.getStringByKey("data_trend_sample_frozen"),icon:"illustration-dashboard-legend-smart"},
                        //   {title:LangUtil.getStringByKey("data_trend_sample_stop_running"),icon:"illustration-dashboard-legend-stop"},
                          ]
                        }

                      ]
                    }})}
                    type="info"/>
                </Container>
                <Typography
                      style={{marginBottom:2,marginTop:0}}
                      font={"subtitle04"}
                      text={LangUtil.getStringByKey("common_data_date")}
                      color='black'/>
                <Selection  icon="text-fields-date"
                            color="text"
                            text={FilterUtil.getDateRange(  ccmFilter.data.startTime,ccmFilter.data.endTime,
                            ccmFilter.data.dataMode,)}
                            onPress={()=>{}}
                            style={{backgroundColor:"#E3E3E3"}}
                            hint={""}/>
                <Container
                        alignItems="flex-start"
                        fullwidth
                        border
                        style={{marginTop:20,height:160}}
                >
                <ScrollView
                    ref={ref => this.graph = ref}
                    horizontal={true}>
                {data.length>0?<LineChart
                        status={status}
                        index={index}
                        height={130}
                        width={width-40}
                          data={{
                        labels: label,
                        datasets: [{data:data}]
                    }}/>:<View style={{width:"100%",height:80}}/>}
                  </ScrollView>
                  </Container>
                  <Typography
                       style={{marginBottom:12,marginTop:12}}
                       font={"subtitle02"}
                       text={LangUtil.getStringByKey("data_raw_list")}
                       color='primaray'/>
                  <Typography
                           color="text"
                           style={{marginBottom:8}}
                           font={"subtitle03"}
                           text={LangUtil.getStringByKey("common_total")+" : "+tableData.length}
                  />
                  <DataTable data={tableData}/>
                </Container>
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageEventDetail);
