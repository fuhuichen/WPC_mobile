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
        TextInput,
        Icon,
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
  render(){
    const {data,onPress,keyword,focus,disabled,edit,onSave,onLongPress} = this.props;
    const {name} = this.state
    const {width,height} = DimUtil.getDimensions("portrait")
    //console.log(data)
    //let date = moment ( new Date(data.timestamp.event)).format("YYYY/MM/DD HH:mm")
    let date = "-" ;
    if(data.last_data && data.last_data.timestamp){
      //console.log(data.last_data)
      date = moment ( new Date(data.last_data.timestamp*1000)).utc().format("YYYY/MM/DD HH:mm")
    }
    let type = ""
    let devType = DEVICE_TYPES.find(p=>p.model == data.model_name)
    if(devType){
      type = devType.displayName;
    }
    else{
      devType = DEVICE_TYPES.find(p=>p.model == data.type)
      if(devType){
        type = devType.displayName;
      }
    }
    //console.log(data)
    return <TouchCard
            justifyContent="flex-start"
            alignItems="flex-start"
            onPress={onPress}
            disabled={disabled}
            onLongPress={onLongPress}
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
                  <Typography keyword={keyword} t text={data.gateway_id} color="#919191" font="text00"/>
                  </Container>
               </Container>:<Container flexDirection='row' justifyContent="flex-start" alignItems="center" style={{marginBottom:9}}>
                <Icon style={{marginRight:7}} mode={'static'}
                type={this.getStatusImage(data.status)}/>
                  <Container alignItems="flex-start">
                  <Typography keyword={keyword} text={data.name} color="text" font="text01"  style={{width:width-100}}/>
                  <Typography keyword={keyword} t text={data.gateway_id} color="#919191" font="text00"/>
                  </Container>
                  <View style={{flex:1}}/>
               </Container>}
               <Container flexDirection='row' fullwidth
                  justifyContent="flex-start" style={{padding:8,borderRadius:8,backgroundColor:focus?"#E2EFFD":'#F5F5F5'}}>
                  <Typography text={LangUtil.getStringByKey("device_type")} color="#A5A5A5" font="text00" style={{marginRight:6}}/>
                  <Typography keyword={keyword} t text={type} color="text" font="text01"/>
               </Container>
           </TouchCard>

  }


}
export default SensorItem;
