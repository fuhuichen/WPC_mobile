import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView
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
        CommentInput,
        LineChart,
        DimUtil,
        Icon,
        TouchCard,
        NormalButton} from '../../../framework'
import {LangUtil,StorageUtil} from '../../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES,UNITS,TYPE_COLOR} from  "../../define"
import BottomNavigation from "../../components/BottomNavigation"
import { DeviceEventEmitter} from 'react-native';
import BottomDrawer from 'rn-bottom-drawer';
import CcmAPI from '../../api/ccm'
import moment from 'moment'
import { Keyboard, KeyboardEvent } from 'react-native';
class PageEventInspect extends Component {
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
      sensor_id:'-',
      alert_data:'-',
      alertInfo:{},
      expand:true,
      history:false,
      keyboardHeight:0,
    }
  }

  componentWillUnmount() {

  }
  _keyboardDidShow(e) {
    console.log("Event keybaord show height+"+e.endCoordinates.height)
    if(Platform.OS === 'ios')
      this.setState({keyboardHeight:e.endCoordinates.height})
  }
  _keyboardDidHide(){
    console.log("Event Keyboard hide")
    this.setState({keyboardHeight:0})
  }
  async fetchData(){
    const {loginInfo,navigation,route} = this.props;
    const {event,monitorRules,alertRules,userPositions,userDepartments} = route.params;
    let group="";
    let alert =false;
    let alertInfo ={}
    this.props.setLoading(true)
    let alert_records = []
    let result  = await CcmAPI.getAlertInfo(event.alert_id);
    let alert_data = "-"
    if(result.status == ERROR_CODE.SUCCESS){
        alertInfo = result;
        console.log("Trigger Value="+result.alert_trigger.trigger_value)
        if( event.monitor_rule && event.monitor_rule.item &&  event.monitor_rule.item == 'switch'){
          console.log("Find Alert Data-"+alert_data)
          alert_data  = result.alert_trigger.trigger_value ==0?LangUtil.getStringByKey("switch_off"):LangUtil.getStringByKey("switch_on")
        }
        else{
          alert_data = parseInt(result.alert_trigger.trigger_value *100) /100 ;
        }

        alert_records = result.alert_records;
        alert_records = alert_records.sort(function(a,b){
          return  b.record.timestamp.localeCompare(a.record.timestamp)
        })
        //console.log(alert_records)
    }

    if(event.alert_ids){
      event.alert_ids.forEach((item, i) => {

          let mr = alertRules.find(p=>p.alert_rule_id == item);
          if(mr){
            // "recv_pairs": [{"department_id": "HyewREq7vPfj", "position_id": "DEF_DEFINE00"}], "
          //  console.log("Find Pair")
            //console.log(mr)
            if(mr){
              alert = true;
              mr.recv_pairs.forEach((pair, i) => {
                  console.log(pair)
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
    }



    let d = moment( event.timestamp.event, 'YYYY-MM-DD HH:mm:ss').toDate();
    let timezoneShift = parseInt(event.time_zone.replace("+",""))*60
    console.log("TimezoneOffset"+ timezoneShift +d.getTimezoneOffset())
    console.log( event.timestamp.event)
    //  console.log(d)
    let et = Math.round((d.getTime())/1000 ) - ( timezoneShift +d.getTimezoneOffset())*60 -1;
    d.setHours(d.getHours()-1)
    let start = moment(d).format("YYYY-MM-DD HH:mm:ss");
    d.setHours(d.getHours()+2)
    let end= moment(d).format("YYYY-MM-DD HH:mm:ss");
    result = await CcmAPI.getDataRetrive(event.mm_id,start,end);
    console.log("DATA*********************"+event.mm_id,start,end)
    console.log(event.target_id)
    //console.log(result)
    if(result.status == ERROR_CODE.SUCCESS){
      let data = [];
      let label=[];
      let status=[];
      let index = -1
      let init = false;
      //console.log("FInd result")
    //  console.log(result)
      if(result.probers)
      result.probers.forEach((item, i) => {
          //console.log(item)
          console.log("**************Probers"+JSON.stringify(item))
          if(item.id == event.target_id){
            console.log("FInd data")
            //console.log("DataLen="+item.sensor_datas.length)
            //console.log("DataType="+event.item)
            this.setState({sensor_id:item.sensor_id})
            item.sensor_datas.forEach((d, i) => {

              //  console.log(d.timestamp)
                //console.log(d.value[event.monitor_rule.item])

                let timestamp = d.timestamp - parseInt(event.time_zone.replace("+",""))*3600

                data.push(d.value[event.monitor_rule.item]);
                status.push(d.value_status[event.monitor_rule.item]);
            //    console.log(item.timestamp+ " vs " + et + " vs " )
                label.push(moment(d.timestamp*1000).utc().format("YYYY-MM-DD HH:mm:ss"))
                //console.log(moment(d.timestamp*1000).utc().format("HH:mm"))
                //  console.log(i+ " " +timestamp +"/"+et)
                if(timestamp == et+1){
                  //alert_data = d.value[event.monitor_rule.item];

                  //this.setState({alert_data:d.value[event.monitor_rule.item]})
                }
                if(!init && timestamp >et){
                //  console.log("FInd Index="+i)
                   init = true;
                   index = i;
                }
            });
            //console.log("Index is"+index)
            let start_index = (index-3>=0)?index-3:0;
            index  = index - start_index;
            data = data.splice(start_index,7);
            status = status.splice(start_index,7);
            label = label.splice(start_index,7);
            if(status[index]){
              status[index] =999
            }
            //console.log(data)
            //console.log(label)
          //  console.log(index)
            this.setState({status,data,label,index})
          }
      });

    }
    if(group==""){
      group ="-"
    }
    this.setState({alert_data,alertInfo,alert,group,alert_records})
    this.props.setLoading(false)

  }
  async componentDidMount() {
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow.bind(this));
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide.bind(this));
    await this.fetchData()

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
    this.setState({comment:t})
    /*
    if(!this.state.block){
      this.setState({comment:t})
    }
    else{
      this.setState({block:false})
    }
    */


  }
  onEventDetail(){
      const {loginInfo,navigation,route} = this.props;
      const {event,monitorRules,alertRules} = route.params;
      navigation.push(PAGES.EVENT_DETAIL,
        {event,monitorRules,alertRules,target:event.target_id,eventTime:event.timestamp.event})
  }
  async onCommentEnter(){
    const {loginInfo,navigation,route} = this.props;
    const {event,monitorRules,alertRules,} = route.params;
  //  console.log("OnCommentEnter")
    if(this.state.comment.length>0){
      this.props.setLoading(true);
      this.setState({"comment":""})
      console.log("Send Comment "+this.state.comment+ " " + event.alert_id)
      await CcmAPI.addAlertCause(event.alert_id,"cause",this.state.comment)
      setTimeout(async function(){
        let result  = await CcmAPI.getAlertInfo(event.alert_id);
        if(result.status == ERROR_CODE.SUCCESS){
            console.log(result.alert_records)
            let records = result.alert_records;
            records = records.sort(function(a,b){
              return  b.record.timestamp.localeCompare(a.record.timestamp)
            })
            this.setState({alert_records:records,last:this.state.comment})
        }
          this.props.setLoading(false);
      }.bind(this),1000)


    }

  }
  getMonitorRule(monitor_rule){
    //監測條件：溫度_冷凍 (-25°C ~ -8°C, 立即)
    console.log(monitor_rule)
    let unit = monitor_rule && monitor_rule.item?UNITS(monitor_rule.item):""
    let duration  = monitor_rule.duration_to_triggers[0] == 0 ? LangUtil.getStringByKey("time_unit_instant"):(monitor_rule.duration_to_triggers[0] + LangUtil.getStringByKey("time_unit_min"))
    if(monitor_rule.item == 'switch'){
      return  monitor_rule.name + " (" + (monitor_rule.upper_limit==1?LangUtil.getStringByKey("rule_switch_on"):LangUtil.getStringByKey("rule_switch_off")) + ","+ duration+ ")"
    }
    else{
      return  monitor_rule.name + " (" + (monitor_rule.upper_limit!=undefined? monitor_rule.lower_limit+unit:"-")+ " ~ "+  (monitor_rule.upper_limit!=undefined? monitor_rule.upper_limit+unit:"-") + ","+ duration+ ")"
    }

  }
  render(){
    const {loginInfo,navigation,route} = this.props;
    const {event,monitorRules,alertRules,} = route.params;
    const {alert,group,alert_records,comment,data,label,index,status,expand,history} = this.state;
    const {width,height} = DimUtil.getDimensions("portrait")
    let color = event.monitor_rule && event.monitor_rule.item?TYPE_COLOR(event.monitor_rule.item):"#006AB7"
    const std=[0,100];
    let unit = event.monitor_rule && event.monitor_rule.item?UNITS(event.monitor_rule.item):""
    let date ="-"
    let tiem = ""
    if(event.timestamp && event.timestamp.event){
      date = moment (moment(event.timestamp.event, 'YYYY-MM-DD  HH:mm:ss')).format("YYYY/MM/DD")
      time = moment (moment(event.timestamp.event, 'YYYY-MM-DD  HH:mm:ss')).format("HH:mm")
    }
    if(event.event_time){
        date = moment (moment(event.event_time, 'YYYY-MM-DD  HH:mm:ss')).format("YYYY/MM/DD")
        time = moment (moment(event.event_time, 'YYYY-MM-DD  HH:mm:ss')).format("HH:mm")
    }
    let canComment = loginInfo.userInfo.roleid == 1 ||  loginInfo.userInfo.roleid == 2  || loginInfo.userInfo.role_id == 1 ||  loginInfo.userInfo.role_id == 2
    let last =  "-";
    if(alert_records&&alert_records.length>0){
      console.log("Alert record 0")
      console.log( alert_records[0])
      last = alert_records[0].record.content;
    }
    let startTs = moment.utc(event.timestamp.event, 'YYYY-MM-DD  HH:mm:ss').toDate().getTime()
    let endTs  = 0;
    let finish = false;
    if(event.timestamp.finish){
      moment(event.timestamp.event, 'YYYY-MM-DD  HH:mm:ss')
      endTs = moment.utc(event.timestamp.finish, 'YYYY-MM-DD  HH:mm:ss').toDate().getTime()
      finish  = true;
    }
    else{
      endTs =  new Date().getTime()+ event.time_zone*3600000
    }
    let dif = parseInt(( endTs - startTs)/60000)
    let sec = dif %60;
    if(sec<10)sec= "0"+sec
     let min =parseInt(dif/60)
     let d = 0;
     if(min>=24){
       d = parseInt(min/24)
       min = min%24
     }
    if(min<10)min= "0"+min
    let timezoneShift = parseInt(event.time_zone.replace("+",""))*60
    return ( <PageContainer
                navigation={this.props.navigation}
                introduction={this.state.introduction}
                isEvent={true}
                style={{paddingLeft:0,paddingRight:0}}
                onCloseIntroduction={()=>this.setState({introduction:null})}
                isHeader={true}>
                <Header
                  leftIcon={"header-back"}
                  onLeftPressed={()=>{ DeviceEventEmitter.emit("FILTER_CHANGE");navigation.pop(1)}}
                  text={LangUtil.getStringByKey("event_inspection")}
                />
                <Container flexDirection="row"
                            alignItems="center"
                            fullwidth
                            style={{backgroundColor:!finish?'#F8857D':"#CECECE",height:32,paddingLeft:16}}
                           justifyContent="flex-start">
                           {!finish?<Icon style={{width:25,height:25,marginRight:3}} mode={'static'}
                             type={"illustration-event-alarm"}/>:null}
                          <Typography text={ finish?LangUtil.getStringByKey("event_status_finish"):LangUtil.getStringByKey("event_status_continue")} color="text" font="text00" style={{marginRight:4}}/>
                          <Typography text={(d>0?d+LangUtil.getStringByKey("last_time_day")+" ":"")+min+":"+sec } color="#fff" font="text00"/>
                </Container>
                <Container scrollable
                                      onRefresh={async()=> await this.fetchData()}
                                       style={{paddingLeft:16,paddingRight:16}}>
                  <Container flexDirection="row"
                              alignItems="center"
                              style={{height:44}}
                             justifyContent="flex-start">
                     <Typography
                              font={"text01"}
                              text={LangUtil.getStringByKey("data_trend_graph")}
                              color='text'/>
                     <View style={{flex:1}}/>
                     <IconButton
                     style={{marginRight:0}}
                     iconStyle={{width:24,height:24}}
                     onPress={()=>this.setState({introduction:{
                       title:LangUtil.getStringByKey("common_figure"),
                       info:[
                         {type:LangUtil.getStringByKey("hint_status_desc"),
                          title:LangUtil.getStringByKey("event_info_handle_status"),
                          list:[
                            {title:LangUtil.getStringByKey("event_handle_no"),icon:"illustration-event-unchecked"},
                            {title:LangUtil.getStringByKey("event_handle_yes"),icon:"illustration-event-checked"},
                           ]
                         },
                         {type:LangUtil.getStringByKey("hint_graphic_desc"),
                           title:LangUtil.getStringByKey("common_trend_sample"),
                          list:[
                            {title:LangUtil.getStringByKey("monitor_status_normal"),icon:"illustration-dashboard-legend-normal"},
                            {title:LangUtil.getStringByKey("monitor_status_abnormal"),icon:"illustration-dashboard-legend-error"},
                            {title:LangUtil.getStringByKey("data_trend_sample_pause_running"),icon:"illustration-dashboard-legend-pause"},
                            {title:LangUtil.getStringByKey("data_trend_sample_frozen"),icon:"illustration-dashboard-legend-smart"},
                            //{title:LangUtil.getStringByKey("data_trend_sample_stop_running"),icon:"illustration-dashboard-legend-stop"},
                           ]
                         }

                       ]
                     }})}
                     type="info"/>
                 </Container>
                 <Container
                         alignItems="flex-start"
                         fullwidth
                         style={{paddingTop:0,padding:16,backgroundColor:'#fff',borderRadius:8}}
                 >
                 <Container flexDirection="row"
                        alignItems="center"
                        style={{marginTop:8,marginBottom:8}}
                       justifyContent="flex-start">
                   <Container alignItems="flex-start" style={{marginTop:8}}>
                    <Container flexDirection="row" alignItems="center">
                      <Icon style={{width:25,height:25}} mode={'static'}
                        type={event.has_cause?"illustration-event-checked":"illustration-event-unchecked"}/>
                      <Typography
                            font={"text01"}
                            style={{width:width-180}}
                            text={event.prober_name}
                            color='text'/>
                     </Container>
                     <Typography
                         font={"text00"}
                         style={{marginTop:8}}
                         text={LangUtil.getStringByKey("event_device_id")+" : "+this.state.sensor_id}
                         color='#A5A5A5'/>
                   </Container>
                   <View style={{flex:1}}/>
                   <Container alignItems="flex-end" style={{marginTop:8}}>
                        <Typography
                              font={"text00"}
                              style={{marginBottom:4}}
                              text={LangUtil.getStringByKey("event_alert_data")}
                             color='#A5A5A5'/>
                       <Container flexDirection="row" alignItems="flex-end">
                            <Typography
                            font={"title05"}
                            style={{marginRight:2}}
                            text={this.state.alert_data}
                           color='text'/>
                           <Typography
                                font={"text00"}
                                text={unit}
                               color='text'/>
                       </Container>
                   </Container>
                 </Container>
                 <Container flexDirection="row" style={{marginTop:12,marginBottom:6}}>
                   <Icon style={{width:20,height:20}} mode={'static'}
                    type={"monitor_type_"+event.monitor_rule.item}/>
                   <Typography
                       font={"text00"}
                       style={{marginTop:0}}
                       text={this.getMonitorRule(event.monitor_rule)}
                       color="text"/>
                   </Container>
                 {data.length>0?<LineChart
                         status={status}
                         index={index}
                         unit={unit}
                         width={width-64}
                         binary={( event.monitor_rule && event.monitor_rule.item &&  event.monitor_rule.item == 'switch')?true:false}
                         height={140}
                           data={{
                         labels: label,
                         datasets: [{data:data}]
                     }}/>:<View style={{width:width-64,height:140}}/>}
                   </Container>
              </Container>
              <BottomDrawer
                  ref={(ele) => {
                    this.bottomDrawer = ele;
                  }}
                  startUp={true}
                   containerHeight={290}
                   offset={100+this.state.keyboardHeight}
                   backgroundColor={'#FAFCFF'}
                   shadow={false}
                   onExpanded = {() => {console.log("OnExpand");this.setState({expand:true})}}
                   onCollapsed = {() => {console.log("Collapse");Keyboard.dismiss();this.setState({expand:false})}}
                 >
              <Container
                     alignItems="center"
                     fullwidth
                     style={{height:'auto',backgroundColor:'#FAFCFF',
                      borderTopLeftRadius:25,  borderTopRightRadius:25,paddingLeft:16,paddingRight:16,
                       height:400,
                       shadowColor:"#BBB",
                       shadowOffset: { width:2 , height: -3},
                       shadowOpacity: 0.2,
                       shadowRadius: 2,
                       elevation:5,}}
                    justifyContent="flex-start">
                      <TouchCard　
                        onPress={()=>{if(expand){
                          this.bottomDrawer.setDown(this.state.keyboardHeight)
                          //Keyboard.dismiss();
                        }
                        else{
                          this.bottomDrawer.setUp()
                        }
                        this.setState({expand:!expand})}}
                      style={{width:35,height:5,backgroundColor:'#3C3C4344',
                      borderRadius:2,marginTop:3,marginBottom:6}}/>
                      <Container
                      fullwidth justifyContent="flex-start"  flexDirection='row'
                         style={{borderBottomWidth:0,borderColor:'#F0F0F0',marginBottom:8}} >
                        <Typography text={date } color="text" font="text02" style={{marginRight:4}}/>
                        <Typography text={time } color="#919191" font="text01"/>
                        <View style={{flex:1}}/>
                        <IconButton
                          text={"text00"}
                          onPress={()=>{if(expand){
                            this.bottomDrawer.setDown()
                            //Keyboard.dismiss();
                          }
                          else{
                            this.bottomDrawer.setUp()
                          }
                          this.setState({expand:!expand})}}
                          text={LangUtil.getStringByKey(expand?"common_hide":"common_expand")}/>
                      </Container>
                      {expand?
                        <Container
                              fullwidth
                              style={{marginTop:8,backgroundColor:'transparent',paddingLeft:10,
                               borderBottomWidth:1,borderColor:'#F0F0F0',paddingBottom:16,marginBottom:6 }}
                              justifyContent={"flex-start"}
                              alignItems={"flex-start"}
                              >
                              <Container flexDirection="row" alignItems="center" style={{marginBottom:8}}>
                                <Typography
                                      font={"text00"}
                                      style={{width:90}}
                                      text={LangUtil.getStringByKey("ccm_monitor_module")}
                                      color='#A5A5A5'/>
                                      <Typography
                                            font={"text01"}
                                            style={{width:width-150}}
                                            text={(event.mm_name?event.mm_name:"-")}
                                      color='text'/>
                               </Container>
                               <Container flexDirection="row" alignItems="center" style={{marginBottom:8}}>
                                 <Typography
                                       font={"text00"}
                                       style={{width:90}}
                                       text={LangUtil.getStringByKey("ccm_monitor_unit")}
                                       color='#A5A5A5'/>
                                       <Typography
                                             style={{width:width-150}}
                                             font={"text01"}
                                             text={(event.prober_name?event.prober_name:LangUtil.getStringByKey("monitor_status_delete"))}
                                       color='text'/>
                                </Container>
                                <Container flexDirection="row" alignItems="center" style={{marginBottom:8}}>
                                  <Typography
                                        font={"text00"}
                                        style={{width:90}}
                                        text={LangUtil.getStringByKey("filter_location")}
                                        color='#A5A5A5'/>
                                        <Typography
                                              style={{width:width-150}}
                                              font={"text01"}
                                              text={(event.branch_name?event.branch_name:"-")}
                                        color='text'/>
                                 </Container>
                                 <Container flexDirection="row" alignItems="center" style={{marginBottom:8}}>
                                   <Typography
                                         font={"text00"}
                                         style={{width:90}}
                                         text={LangUtil.getStringByKey("ccm_notify")}
                                         color='#A5A5A5'/>
                                         <Typography
                                               font={"text01"}
                                               text={(alert?LangUtil.getStringByKey("common_on"):LangUtil.getStringByKey("common_off"))}
                                         color='text'/>
                                  </Container>
                                  <Container flexDirection="row" alignItems="flex-start" style={{marginBottom:8}}>
                                  <Typography
                                        font={"text00"}
                                        style={{width:90}}
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
                      <Container flexDirection="row"
                             alignItems="center"
                             style={{height:24,paddingLeft:10,paddingRight:10}}
                            justifyContent="flex-start">
                        <Typography
                             font={"text00"}
                             text={LangUtil.getStringByKey("event_comment")}
                             color='#A5A5A5'/>
                        <View style={{flex:1}}/>
                        <IconButton
                          text={"text00"}
                          style={{height:20,marginBottom:4}}
                          onPress={()=>{Keyboard.dismiss();this.setState({history:true})}}
                          text={LangUtil.getStringByKey("common_history")}/>
                      </Container>
                      {canComment? <KeyboardAvoidingView
                                 behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width:'100%'}}>
                      <Container fullwidth flexDirection="row" style={{height:44}}>
                        <CommentInput
                          placeholder={LangUtil.getStringByKey("event_comment_add")}
                          onChangeText={this.doChangeComment.bind(this)}
                          limit={40}
                          style={{flex:1,backgroundColor:"#F0F0F0",height:44}}
                          onEnter={async()=>{this.onCommentEnter()}}
                          onPress={()=>this.doChangeComment("")}
                          disabled={this.state.block}
                          value={comment}/>
                          {comment&&comment.length>0?<IconButton
                                    onPress={async()=>{this.onCommentEnter()}}
                                    type={"send"}
                                    mode="static"
                                    style={{marginLeft:6}}
                                    iconStyle={{width:24,height:24}}
                                    text={""}/>:null}</Container></KeyboardAvoidingView>:null}
                      <Container fullwidth flexDirection="row" justifyContent="flex-start" style={{marginBottom:16 }}>
                        <Typography
                              font={"content04"}
                              style={{marginTop:8,marginLeft:10}}
                              text={LangUtil.getStringByKey("event_comment_last")+" : " + last }
                              color='#7D7D7D'/>
                      </Container>
                </Container>
                </BottomDrawer>
                {this.state.history?<Container
                  　　　justifyContent="flex-start"
                       fullwidth style={{position:'absolute',top:0,backgroundColor:"#000000BB",height}}>
                       <Container 　justifyContent="flex-start"
                              fullwidth style={{position:'absolute',
                              borderTopLeftRadius:8,borderTopRightRadius:8,height:height-47,
                              top:47,backgroundColor:"#F0F0F0",padding:16}}>
                             <Container
                               fullwidth
                               style={{height:20,marginBottom:10}}
                               flexDirection="row">
                              <Typography
                               　color={"text"}
                                font="text02"
                               text={LangUtil.getStringByKey("event_comment_history")}/>
                               <IconButton
                                 text={"text03"}
                                 style={{position:'absolute',right:0}}
                                 onPress={()=>this.setState({history:false})}
                                 text={LangUtil.getStringByKey("common_confirm")}/>
                             </Container>
                             <Container fullwidth scrollable style={{width,flex:1,padding:16,paddingTop:0}}>
                             {alert_records.map(function(item){
                                 console.log("Datae "+item.record.timestamp)
                                 let date = moment (  moment(item.record.timestamp, 'YYYY-MM-DD HH:mm:ss').toDate() ).utcOffset( timezoneShift).format("YYYY/MM/DD HH:mm")
                                 return <Container
                                     fullwidth
                                     border
                                     alignItems={"flex-start"}
                                     justifyContent="flex-start"
                                     style={{height:72,marginBottom:16,padding:12,borderRadius:8}}>
                                    <Container fullwidth flexDirection="row">
                                       <Typography
                                           style={{marginBottom:8}}
                                           font={"text02"}
                                           color='text'
                                           text={item.record.user.user_info.name}
                                       />
                                       <View style={{flex:1}}/>
                                       <Typography
                                           style={{marginBottom:8}}
                                           font={"textxs"}
                                           color="gray"
                                           text={date+" ("+ event.time_zone+")"}
                                       />
                                     </Container>
                                     <Typography
                                         style={{marginBottom:8}}
                                         font={"text01"}
                                         color="gray"
                                         text={item.record.content}
                                     />
                                 </Container>
                             })
                             }
                          </Container>
                       </Container>
             </Container>:null}
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo};
};
export default connect(mapStateToProps, actions)(PageEventInspect);
