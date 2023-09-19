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
        TouchCard,
        DataInput,
        Icon,
        LineChart,
        NormalButton} from '../../../framework'
import {LangUtil,StorageUtil} from '../../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES} from  "../../define"
import CcmAPI from '../../api/ccm'
import moment from 'moment'
class PageEventRelated extends Component {
  constructor(props) {
    super(props);
    this.state={
      introduction:null,
      events:[],
    }
  }

  componentWillUnmount() {

  }
  async fetchData(){
    console.log("Fetch Data")
    const {loginInfo,navigation,route} = this.props;
    const {event} = route.params;
    let events= [];
    this.props.setLoading(true)
    let ids =[event.branch_id];
    let d = moment(event.timestamp.event, '').toDate();
    let timezoneShift = parseInt(event.time_zone.replace("+",""))*60
    console.log("TimezoneOffset"+ timezoneShift +d.getTimezoneOffset())
    console.log( event.timestamp.event)
    console.log(d)
    let et = Math.round((d.getTime())/1000 ) - ( timezoneShift +d.getTimezoneOffset())*60;
    let start = moment(d).format("YYYY-MM-DD 00:00:00");
    let end= moment(d).format("YYYY-MM-DD 23:59:59");
    let request={
        branch_ids:ids,
        monitor_item:"",
        period:[start,end]
    }
    console.log(request)

    let result;
    result = await CcmAPI.getBriefAlertRecords(request);
    let branchList=[];
    if(result.status == ERROR_CODE.SUCCESS){
      result.branch_alerts.forEach((item, i) => {
          item.mm_alerts.forEach((item2, i) => {
              if(item2.mm_id == event.mm_id){
                item2.alert_briefs.forEach((e, i) => {
                    events.push(e)
                });

              }
          });

      });
      let d = moment( event.timestamp.event, 'YYYY-MM-DD HH:mm:ss').toDate();
      let et = Math.round((d.getTime())/1000 )-1;
      d.setDate(d.getDate()-1)
      let start = moment(d).format("YYYY-MM-DD 23:30:00");
      d.setDate(d.getDate()+2)
      let end= moment(d).format("YYYY-MM-DD 01:00:00");
      console.log("Find Events")
      console.log(event.mm_id,start,end)
      result = await CcmAPI.getDataRetrive(event.mm_id,start,end);
      let retrieves = [];
      if(result.status == ERROR_CODE.SUCCESS){
      //  retrieves = result.
      events.forEach((ev, i) => {

          ev.data =[];
          ev.status=[];
          ev.label=[];
          ev.mm_id = event.mm_id;
          ev.time_zone = event.time_zone;
          let init = false
          let index = -1;
          let d = moment(ev.timestamp.event, '').toDate();
          let evtt =  Math.round((d.getTime())/1000 ) - ( timezoneShift +d.getTimezoneOffset())*60-1;
          result.monitor_module.probers.forEach((prober, i) => {
              if(prober.prober_id == ev.target_id){
                ev.prober_name = prober.name;
              }
          });
          result.probers.forEach((item, i) => {
              //console.log(item.id)

              if(item.id == ev.target_id){
                //console.log("DataLen="+item.sensor_datas.length)
                //console.log("DataType="+ev.item)
                item.sensor_datas.forEach((d, i) => {
                    //console.log(d.timestamp)
                    //console.log(d.value[ev.monitor_rule.item])
                    let timestamp = d.timestamp - parseInt(event.time_zone.replace("+",""))*3600
                    ev.data.push(d.value[ev.monitor_rule.item]);
                    ev.status.push(d.value_status[ev.monitor_rule.item]);
                //    console.log(item.timestamp+ " vs " + et + " vs " )
                    ev.label.push(moment(d.timestamp*1000).utc().format("HH:mm"))
                    //  console.log(i+ " " +timestamp +"/"+et)
                    if(!init && timestamp >evtt){
                       init = true;
                       index = i;
                    }
                });
                //console.log("Index is"+index)
                let start_index = (index-2>=0)?index-2:0;
                index  = index - start_index;
                ev.data = ev.data.splice(start_index,5);
                ev.status = ev.status.splice(start_index,5);
                ev.label = ev.label.splice(start_index,5);
              }
          });
      });



      }

    }
    this.setState({events})
    this.props.setLoading(false);

  }
  async componentDidMount() {
     this.fetchData();
  }
  async showBrandSelect(){
    const {navigation} = this.props;
    navigation.push(PAGES.BRAND_SELECT)
  }
  onEventDetail(ev){
    const {loginInfo,navigation,route} = this.props;
    const {event,monitorRules,alertRules} = route.params;
    navigation.push(PAGES.EVENT_DETAIL,
      {event:ev,target:ev.target_id,eventTime:ev.timestamp.event})
  }
  renderEvents(){
    const {loginInfo,navigation,route} = this.props;
    const {event} = route.params;
    const {events} = this.state;
    if(events)
    return this.state.events.map(function(ev,index){
        const {label,data,status} = ev;
        let date = moment ( new Date(ev.timestamp.event)).format("YYYY/MM/DD HH:mm")
        return   <TouchCard
            key={index}
            style={{marginBottom:16}}
            onPress={()=>this.onEventDetail(ev)}
          >
          <Container
                  alignItems="flex-start"
                  fullwidth
                  border
                  style={{paddingTop:0}}
          >
          <Container flexDirection="row"
                 alignItems="center"
                 style={{marginTop:0,padding:0,marginTop:8,marginBottom:8}}
                justifyContent="flex-start">
            <Typography
                 font={"subtitle02"}
                 text={date+" ("+ event.time_zone+")"}
                 color='primaray'/>
            <View style={{flex:1}}/>
            <Icon
              style={{width:16,height:16}}
              mode={"static"}
              type={!ev.has_cause?"illustration-process-status-pending":"illustration-process-status-done"}/>

          </Container>
          <Typography
              font={"content03"}
              style={{marginTop:0}}
              text={LangUtil.getStringByKey("ccm_monitor_unit")+" : "+ev.prober_name}
              color='text'/>
          <Typography
              font={"content03"}
              style={{marginTop:8}}
              text={LangUtil.getStringByKey("monitor_type")+" : "+LangUtil.getStringByKey("monitor_type_"+ev.monitor_rule.item)}
              color='text'/>
                  {data.length>0?<LineChart
                  status={ev.status}
                  index={-1}
                  height={90}
                    data={{
                  labels: ev.label,
                  datasets: [{data:ev.data}]
              }}/>:<View style={{width:"100%",height:80}}/>}
            </Container>
          </TouchCard>
    }.bind(this))
    return null;

  }
  render(){
    const {loginInfo,navigation,route} = this.props;
    const {event} = route.params;
    return ( <PageContainer
                navigation={this.props.navigation}
                introduction={this.state.introduction}
                onCloseIntroduction={()=>this.setState({introduction:null})}
                isHeader={true}>
                <Header
                  leftIcon={"header-back"}
                  onLeftPressed={()=>{navigation.pop(1)}}
                  text={LangUtil.getStringByKey("不使用event_related_inspection")}
                />
                <Container
                    fullwidth
                    scrollable
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1}}>
                    <Container flexDirection="row"
                                alignItems="center"
                                style={{marginTop:8}}
                               justifyContent="flex-start">
                       <Typography
                                font={"subtitle02"}
                                text={event.mm_name}
                                color='primaray'/>
                       <View style={{flex:1}}/>
                       <IconButton
                       onPress={()=>this.setState({introduction:{
                         title:LangUtil.getStringByKey("common_figure"),
                         info:[
                           {title:LangUtil.getStringByKey("event_info_handle_status"),
                            list:[
                              {title:LangUtil.getStringByKey("event_handle_no"),icon:"illustration-process-status-pending"},
                              {title:LangUtil.getStringByKey("event_handle_yes"),icon:"illustration-process-status-done"},
                             ]
                           },
                           {
                             title:LangUtil.getStringByKey("common_trend_sample"),
                            list:[
                              {title:LangUtil.getStringByKey("monitor_status_normal"),icon:"illustration-dashboard-legend-normal"},
                              {title:LangUtil.getStringByKey("data_trend_sample_pause_running"),icon:"illustration-dashboard-legend-pause"},
                              {title:LangUtil.getStringByKey("monitor_status_abnormal"),icon:"illustration-dashboard-legend-error"},
                              {title:LangUtil.getStringByKey("data_trend_sample_frozen"),icon:"illustration-dashboard-legend-smart"},
                              //{title:LangUtil.getStringByKey("data_trend_sample_stop_running"),icon:"illustration-dashboard-legend-stop"},
                             ]
                           }

                         ]
                       }})}
                       type="info"/>
                   </Container>
                   {this.renderEvents()}
                </Container>
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageEventRelated);
