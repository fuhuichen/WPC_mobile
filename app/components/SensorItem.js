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
        TextInput,
        IconButton,
        NormalButton} from '../../framework'
import {LangUtil,DimUtil} from '../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,DEVICE_TYPES} from  "../define"
import moment from 'moment'
class SensorItem extends Component {
  constructor(props) {
    super(props);
    this.state={
      name:this.props.data.name
    }
  }

  componentWillUnmount() {

  }
  async componentDidMount() {

  }
  getStatusImage(status){
    console.log("SensorStatu="+status)
    switch(status){
      case 1:
        return "illustration-device-status-unactivated"
      case 21:
          return "illustration-device-status-normal"
      case 24:
      case 25:
      case 29:
          return "illustration-device-status-rest"
      case 60:
          return "illustration-device-status-expired"
      case 20:
          return "illustration-device-status-no-data"
      case 61:
          return "illustration-device-status-termination"
      case 70:
          return "illustration-device-status-delete"
      case 101:
          return "illustration-device-status-unbind"
      default:
          return "illustration-device-status-offline"

    }

  }
  getSignal(signal){
      if(signal!=null){

        if(signal >= -90){
          return <Container flexDirection='row' justifyContent="flex-start" style={{marginRight:5}}>
                  <Icon style={{marginRight:3}} mode={'static'}
                        iconStyle={{width:20,height:20}}
                        type={"illustration-in-card-signal-good"}/>
                   <Typography text={"("+signal+ ")"} color="#8EA473" font="content04"/>
                </Container>

        }
        else if(signal >= -100){
          return <Container flexDirection='row' justifyContent="flex-start" style={{marginRight:5}}>
                  <Icon style={{marginRight:3}} mode={'static'}
                        iconStyle={{width:20,height:20}}
                        type={"illustration-in-card-signal-normal"}/>
                   <Typography text={"("+signal+ ")"} color="primary" font="content04"/>
                </Container>

        }
        else{
          return <Container flexDirection='row' justifyContent="flex-start" style={{marginRight:5}}>
                  <Icon style={{marginRight:3}} mode={'static'}
                        iconStyle={{width:20,height:20}}
                        type={"illustration-in-card-signal-bad"}/>
                   <Typography text={"("+signal+ ")"} color="#CA4940" font="content04"/>
                </Container>

        }

      }
      else{
          return <Container flexDirection='row' justifyContent="flex-start" style={{marginRight:5}}>
                  <Icon style={{marginRight:3}} mode={'static'}
                    iconStyle={{width:20,height:20}}
                        type={"illustration-in-card-signal-none"}/>
                   <Typography text={"(-)"} color="#C4C4C4" font="content04"/>
                </Container>

      }


  }

  getBat(battery){
      if(battery!=null){

        if(battery >=70){
          return <Container flexDirection='row' justifyContent="flex-start" style={{marginTop:0}}>
                  <Icon style={{marginRight:3}} mode={'static'}
                        iconStyle={{width:20,height:20}}
                        type={"illustration-in-card-battery-good"}/>
                   <Typography text={battery+ "%"} color="#8EA473" font="content04"/>
                </Container>

        }
        else if(battery >=30){
          return <Container flexDirection='row' justifyContent="flex-start" style={{marginTop:0}}>
                  <Icon style={{marginRight:3}} mode={'static'}
                        iconStyle={{width:20,height:20}}
                        type={"illustration-in-card-battery-normal"}/>
                   <Typography text={battery+ "%"} color="primary" font="content04"/>
                </Container>

        }
        else{
          return <Container flexDirection='row' justifyContent="flex-start" style={{marginTop:0}}>
                  <Icon style={{marginRight:3}} mode={'static'}
                        iconStyle={{width:20,height:20}}
                        type={"illustration-in-card-battery-bad"}/>
                   <Typography text={battery+ "%"} color="#CA4940" font="content04"/>
                </Container>

        }

      }
      else{
          return <Container flexDirection='row' justifyContent="flex-start" style={{marginTop:0}}>
                  <Icon style={{marginRight:3}} mode={'static'}
                        iconStyle={{width:20,height:20}}
                        type={"illustration-in-card-battery-none"}/>
                   <Typography text={"-"} color="#C4C4C4" font="content04"/>
                </Container>

      }


  }
  render(){
    const {data,onPress,keyword,focus,onLongPress,disabled,edit,onSave} = this.props;
    const {name} = this.state
    const {width,height} = DimUtil.getDimensions("portrait")

    //let date = moment ( new Date(data.timestamp.event)).format("YYYY/MM/DD HH:mm")
    let date = "-"
    let battery =null;
    let signal = null;
    if(data.last_data ){
      if(data.last_data.timestamp)
        date = moment ( new Date(data.last_data.timestamp*1000)).utc().format("YYYY/MM/DD HH:mm")
      if(data.last_data.battery){
        battery = parseInt(data.last_data.battery.estimated_Capacity);
        if(battery>100){
          battery=100;
        }
      }
      if(data.last_data.value){
        signal = data.last_data.value.rssi;
        if(signal>0){
          signal = 0;
        }
      }
    }
    let type = "";
    let devType = DEVICE_TYPES.find(p=>p.model == data.value_type)
    if(devType){
      type = devType.displayName;
    }
    else{
      devType = DEVICE_TYPES.find(p=>p.model == data.type)
      if(devType){
        type = devType.displayName;
      }
    }
    return <TouchCard
            justifyContent="flex-start"
            alignItems="flex-start"
            onPress={onPress}
            disabled={disabled}
            onLongPress={onLongPress}
          //  "device_type"
            style={[{backgroundColor:focus?"#F2F7FD":"#fff",borderColor:"#ccc",padding:12,borderColor:'#006AB7',
              borderWidth:focus?1:0,width:'100%',height:'auto',marginTop:10,borderRadius:8},this.props.style]}>
              {edit?<Container flexDirection='row' justifyContent="flex-start" alignItems="center" style={{marginBottom:9}}>
               <Icon style={{marginRight:7}} mode={'static'}
               type={this.getStatusImage(data.status)}/>
                 <Container alignItems="flex-start" style={{flex:1}}>
                    <Container alignItems="flex-start" flexDirection="row" style={{width:'100%'}}>
                     <TextInput
                       placeholder={""}
                       onChangeText={(t)=>this.setState({name:t})}
                       style={{flex:1,backgroundColor:'#F0F0F0',width:'100%'}}
                       invalidText={false}
                       onPress={()=>this.setState({name:""})}
                       value={this.state.name}/>
                       {name&&name.length>0&&name!=data.name?<IconButton
                         onPress={()=>{if(onSave)onSave(name)}}
                         mode="static"
                         iconStyle={{width:24,height:24,marginLeft:5}}
                         type={"save"}/>:null}
                       </Container>
                   <Typography keyword={keyword} text={data.sensor_id} color="#919191" font="text00"/>
                 </Container>
              </Container>:<Container flexDirection='row' justifyContent="flex-start" alignItems="center" style={{marginBottom:9}}>
               <Icon style={{marginRight:7}} mode={'static'}
               type={this.getStatusImage(data.status)}/>
                 <Container alignItems="flex-start">
                 <Typography keyword={keyword} text={data.name} color="text" font="text01" style={{width:width-100}}/>
                 <Typography keyword={keyword} text={data.sensor_id} color="#919191" font="text00"/>
                 </Container>
                 <View style={{flex:1}}/>
              </Container>}
              <Container  fullwidth  style={{padding:8,borderRadius:8,backgroundColor:focus?"#E2EFFD":'#F5F5F5'}}>
                 <Container      justifyContent="flex-start" flexDirection='row' fullwidth>
                   <Typography text={LangUtil.getStringByKey("device_type")} color="#A5A5A5" font="text00" style={{marginRight:6}}/>
                   <Typography keyword={keyword} text={type} color="text" font="text01"   style={{flex:1}}/>
                 </Container>
                 <Container      justifyContent="flex-start" flexDirection='row' fullwidth style={{marginTop:6}}>
                   <Typography text={LangUtil.getStringByKey("ccm_monitor_module")} color="#A5A5A5" font="text00" style={{marginRight:6}}/>
                   <Typography keyword={keyword} text={data.mm_name} color="text" font="text01"  style={{flex:1}}/>
                 </Container>
                 <Container      justifyContent="flex-start" flexDirection='row' fullwidth style={{marginTop:6}}>
                   <Typography text={LangUtil.getStringByKey("ccm_monitor_unit")} color="#A5A5A5" font="text00" style={{marginRight:6}}/>
                   <Typography keyword={keyword} text={data.probers} color="text" font="text01" style={{flex:1}}/>
                 </Container>
              </Container>
               <Container flexDirection='row' justifyContent="flex-start" style={{marginTop:10}}>
                  <Typography text={date+" ("+ data.time_zone+")"} color="#7D7D7D" font="text00"/>
                  <View style={{flex:1}}/>
                  {this.getSignal(signal)}
                  {this.getBat(battery)}
               </Container>
           </TouchCard>

  }


}
export default SensorItem;
