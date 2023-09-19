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
import {LangUtil,DimUtil} from '../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,UNITS} from  "../define"
import moment from 'moment'
class EventItem extends Component {
  constructor(props) {
    super(props);
  }

  componentWillUnmount() {

  }
  async componentDidMount() {

  }
  getStatusImage(status,alert,defrost){
    console.log("Is Defrost?"+defrost);
    switch(status){
      case 20:
        if(alert){
          return "illustration-module-status-error"
        }
        else if(defrost){
          return "illustration-module-status-defrost"
        }
        return "illustration-module-status-normal"
      case 21:
      case 25:
          return "illustration-module-status-normal"
      case 24:
          return "illustration-module-status-pause"
      case 1:
      case 29:
          return "illustration-module-status-stop"
      default:
          return "illustration-module-status-error"

    }

  }
  getSensorStatusImage(status){
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
    const {data,onPress,keyword} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait")
    let date = "-"
    if(data.last_data && data.last_data.timestamp){
      console.log(data.last_data)
      date = moment ( new Date(data.last_data.timestamp*1000)).utc().format("YYYY/MM/DD HH:mm")
    }
  //  let date =

    let type ="temperature";
    let unit = "°C"
    if(data.value_types[0]){
      type = data.value_types[0]
      unit = UNITS(type)

    }
    let value = "-";
    console.log("Last Data====" + data.name + " type="+type)
    console.log(data.last_data)

    if(data.last_data && data.last_data.value!=undefined && data.last_data.value[type]!=undefined){
      value = data.last_data.value[type];
      if(type == 'switch'){
        value = value==0?LangUtil.getStringByKey("switch_off"):LangUtil.getStringByKey("switch_on")
      }
      else{
        value = value.toFixed(2)
      }
      console.log("Get Velue = "+value)
    }
    console.log("data.mm_status="+data.mm_status + " " + data.mm_alert_status)
    return <TouchCard
            justifyContent="flex-start"
            alignItems="flex-start"
            onPress={onPress}
            style={{backgroundColor:"#fff",borderColor:"#ccc",padding:12,
              borderWidth:0,width:'100%',height:166,marginBottom:10,borderRadius:8}}>
               <Container flexDirection='row' justifyContent="flex-start">
                <Container  style={{height:'100%',flex:1}}  justifyContent="flex-end" alignItems="flex-start">
                  <Container flexDirection='row' justifyContent="flex-start" alignItems="center" style={{marginBottom:22}}>
                    <Icon style={{width:20,height:20}} mode={'static'}
                     type={this.getSensorStatusImage(data.mm_status,data.alert,data.defrost)}/>
                     <Typography
                       keyword={keyword}  style={{flex:1,marginRight:150}} text={data.mm_name} color="text" font="subtitle02"/>
                  </Container>
                  <View style={{flex:1}}/>
                   <Container flexDirection='row' justifyContent="flex-start" style={{marginBottom:9}}>
                      <Typography style={{marginRight:10}} text={LangUtil.getStringByKey("monitor_device_count")}
                          color="grayText" font="text00"/>
                      <Typography text={data.sensors.length} color="text" font="text01"/>
                   </Container>
                   <Container flexDirection='row' justifyContent="flex-start" style={{marginBottom:9}}>
                       <Typography style={{marginRight:10}} text={LangUtil.getStringByKey("monitor_unit_count")}
                           color="grayText" font="text00"/>
                       <Typography text={data.prober_count} color="text" font="text01"/>
                   </Container>
                   <Container flexDirection='row' justifyContent="flex-start" style={{marginBottom:10,width:width-210}}>
                       <Typography style={{marginRight:10}} text={LangUtil.getStringByKey("monitor_main_unit")}
                           color="grayText" font="text00"/>
                      <Icon style={{width:20,height:20}} mode={'static'}
                            type={"monitor_type_"+type}/>
                       <Typography text={data.name}   style={{flex:1}} color="text" font="text01"/>
                   </Container>
                 </Container>
                 <Container justifyContent="center" alignItems={"flex-start"}
                 style={{position:'absolute',right:0,top:0,paddingLeft:10,width:140,borderLeftWidth:0,backgroundColor:"#F5F5F5",padding:10,
                   borderColor:"#E3E3E3",height:'auto',borderRadius:8}}>
                   <Icon style={{width:24,height:24,position:'absolute',top:10,right:10}} mode={'static'}
                       type={this.getStatusImage(data.mm_status,data.alert,data.defrost)}/>
                   <Container flexDirection='row' justifyContent="flex-start" style={{marginBottom:9,marginTop:30}}>
                      <Typography text={LangUtil.getStringByKey("event_last_data")} color="#A5A5A5" font="text00"/>
                   </Container>
                   <Container flexDirection='row' justifyContent="flex-start" alignItems="flex-end" style={{marginBottom:0}}>
                      <Typography text={value} color="text" font="title04"/>
                      <Typography text={unit} style={{marginBottom:4}} color="text" font="text02"/>
                   </Container>
                   <Container flexDirection='row' justifyContent="flex-start" style={{marginTop:12}}>
                      <Typography text={date} color="text" font="content04"/>
                      <View style={{flex:1}}/>
                   </Container>
                 </Container>
               </Container>

           </TouchCard>

  }


}
export default EventItem;
