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
        TouchCard,
        Icon,
        NormalButton} from '../../framework'
import {LangUtil,DimUtil,StringUtil} from '../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,UNITS,TYPE_COLOR} from  "../define"
import moment from 'moment'
class EventItem extends Component {
  constructor(props) {
    super(props);
  }

  componentWillUnmount() {

  }
  async componentDidMount() {

  }
  getStatusImage(status){
    switch(status){
      case 21:
      case 25:
          return "illustration-module-status-outline-normal"
      case 24:
          return "illustration-module-status-outline-pause"
      case 29:
          return "illustration-module-status-outline-stop"
      default:
          return "illustration-module-status-outline-error"

    }

  }
  render(){
    const {data,onPress,keyword} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait")
    let date = moment (moment(data.timestamp.event, 'YYYY-MM-DD  HH:mm:ss')).format("YYYY/MM/DD")
    let time = moment (moment(data.timestamp.event, 'YYYY-MM-DD  HH:mm:ss')).format("HH:mm")
    let value = "-";
    if(data.trigger_value){
      value = data.trigger_value
      value = parseFloat(value);
      if( data.monitor_rule&& data.monitor_rule.item&&  data.monitor_rule.item == 'switch'){
        value  = value ==0?LangUtil.getStringByKey("switch_off"):LangUtil.getStringByKey("switch_on")
      }
      else{
        value = value.toFixed(2)
      }
      //value = value.toFixed(2)
    }
  //  console.log("Value="+value)
  //  console.log(data)
  //  console.log("Data MMSTATUS="+data.mm_status)
    let unit = data.monitor_rule && data.monitor_rule.item?UNITS(data.monitor_rule.item):""
    let color = data.monitor_rule && data.monitor_rule.item?TYPE_COLOR(data.monitor_rule.item):"#006AB7"
    let startTs = moment.utc(data.timestamp.event, 'YYYY-MM-DD  HH:mm:ss').toDate().getTime()
    let endTs  = 0;
    let finish = false;

    if(data.timestamp.finish){
      moment(data.timestamp.event, 'YYYY-MM-DD  HH:mm:ss')
      endTs = moment.utc(data.timestamp.finish, 'YYYY-MM-DD  HH:mm:ss').toDate().getTime()
      finish  = true;
    }
    else{
      endTs =  new Date().getTime()+ data.time_zone*3600000
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
    //console.log("Width"+width)
    let isSmall = width <360;
    return <TouchCard
            justifyContent="flex-start"
            alignItems="flex-start"
            onPress={onPress}
            style={{backgroundColor:"#fff",borderColor:"#ccc",padding:10,
              borderWidth:0,width:'100%',height:'auto',marginBottom:16,borderRadius:8}}>
               <Container >
                 <Container flexDirection='row' justifyContent="flex-start" alignItems="center"
                  style={{marginBottom:6,paddingLeft:6,paddingRight:6}}>
                    <Container>
                      <Container fullwidth justifyContent="flex-start"  flexDirection='row' >
                        <Typography text={date } color="text" font="text01" style={{marginRight:4}}/>
                        <Typography text={time } color="#919191" font="text00"/>
                      </Container>
                      <Container fullwidth flexDirection='row' alignItems="center" justifyContent="flex-start" style={{height:30}}>
                         {!finish?<Icon style={{width:25,height:25,marginRight:3}} mode={'static'}
                           type={"illustration-event-alarm"}/>:null}
                        <Typography text={ finish?LangUtil.getStringByKey("event_status_finish"):LangUtil.getStringByKey("event_status_continue")} color="text" font="text00" style={{marginRight:4}}/>
                        <Typography text={(d>0?d+LangUtil.getStringByKey("last_time_day")+" ":"")+min+":"+sec } color="#919191" font="text00"/>
                      </Container>
                    </Container>
                    <View style={{flex:1}}/>
                    <Icon style={{width:25,height:25}} mode={'static'}
                     type={data.has_cause?"illustration-event-checked":"illustration-event-unchecked"}/>
                 </Container>
                 </Container >
               <Container style={{backgroundColor:'#F5F5F5',padding:12,borderRadius:8}} flexDirection='row' justifyContent="flex-start">
                <Container style={{flex:1}}  alignItems="flex-start">
                   <Container flexDirection='row' justifyContent="flex-start" style={{marginBottom:9}}>
                      <Typography style={{marginRight:10}} text={LangUtil.getStringByKey("ccm_monitor_module")} color="#A5A5A5" font="text00"/>
                      <Typography style={{flex:1}}
                      text={data.mm_name} keyword={keyword} color="text" font="text01"/>
                   </Container>
                   <Container flexDirection='row' justifyContent="flex-start"
                       style={{marginBottom:0}}>
                     <Typography style={{marginRight:10}} text={LangUtil.getStringByKey("ccm_monitor_unit")} color="#A5A5A5" font="text00"/>
                     <Icon style={{width:20,height:20}} mode={'static'}
                      type={"monitor_type_"+data.monitor_rule.item}/>
                     <Typography  style={{flex:1}}
                     text={(data.prober_name&&data.prober_name.length>0?data.prober_name:LangUtil.getStringByKey("monitor_status_delete"))} color="text" font="text01"/>
                  </Container>
                 </Container>
                <Container justifyContent="flex-start" alignItems={"flex-end"}
                style={{width:isSmall?80:120,height:'100%'}}>
                  <Container flexDirection='row' justifyContent="flex-start" style={{marginBottom:9}}>
                     <Typography text={LangUtil.getStringByKey("event_alert_data")} color="#A5A5A5" font="text00"/>
                  </Container>
                  <Container flexDirection='row' justifyContent="flex-end" alignItems="flex-end" style={{marginBottom:0}}>
                     <Typography text={value} color={"text"} font={isSmall?"title05":"title04"}/>
                     <Typography text={unit} style={{marginBottom:5}} color={"text"} font="content03"/>
                  </Container>
                </Container>
              </Container>
           </TouchCard>

  }


}
export default EventItem;
