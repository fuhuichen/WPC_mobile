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
import {ERROR_CODE,ENVIRONMENT,PAGES} from  "../define"
import moment from 'moment'
class NotificationItem extends Component {
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
    const {data,onPress} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait")
    //let date = moment ( new Date(data.timestamp.event)).format("YYYY/MM/DD HH:mm")
    let date =data.date;
    let msg = ''
    if(data.notify&&data.notify.msg){
    //  console.log(data.notify)
      msg = data.notify.msg
      if(msg.startsWith("{")){
        msg = JSON.parse(msg)
      }
    }
    let d = date.split(" ")
    //console.log(data)

    return <TouchCard
            justifyContent="flex-start"
            alignItems="flex-start"
            onPress={onPress}
            fullwidth
            style={[{padding:12,backgroundColor:'white',marginBottom:1,
              borderWidth:0,width:'100%',height:'auto'},this.props.style]}>
               <Container flexDirection='row' justifyContent="flex-start" alignItems="center" style={{marginBottom:9}}>
                  <Typography text={d[0]} color="text" font="text01"/>
                  <Typography text={d[1]} color="gray" font="text00" style={{marginLeft:5}}/>
                  <View style={{flex:1}}/>
               </Container>
               <Container flexDirection='row' justifyContent="flex-start" style={{marginTop:0}}>
                  <Typography text={msg.title?msg.title:msg} color="gray" font="text00"/>
                  <View style={{flex:1}}/>
               </Container>
               <Container flexDirection='row' justifyContent="flex-start" style={{marginTop:5}}>
                  <Typography text={msg.body?msg.body:msg} color="gray" font="text00"/>
                  <View style={{flex:1}}/>
               </Container>
               <Container flexDirection='row' justifyContent="flex-start" style={{marginTop:5}}>
                  <Typography text={data.branch_name} color="gray" font="text00"/>
                  <View style={{flex:1}}/>
               </Container>
            {!data.read?<View style={{backgroundColor:'#006AB7',width:4,height:16,
                  borderRadius:8,position:'absolute',top:12,left:0}}/>:null}
           </TouchCard>

  }


}
export default NotificationItem;
