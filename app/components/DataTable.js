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
class DataTable extends Component {
  constructor(props) {
    super(props);
  }

  componentWillUnmount() {

  }
  async componentDidMount() {

  }
  getStatusImage(status){
    switch(status){
      case 20:
      case 21:
          return "illustration-module-status-outline-normal"
      case 24:
          return "illustration-module-status-outline-pause"
      case 23:
          return "illustration-module-status-outline-error"
      default:
        return "illustration-module-status-outline-stop"

    }

  }
  getStatusIcon(status){
    if(status==151){
      return {title:LangUtil.getStringByKey("monitor_status_abnormal"),icon:"illustration-dashboard-legend-error"}
    }
    else if(status==152){
      return {title:LangUtil.getStringByKey("monitor_status_normal"),icon:"illustration-dashboard-legend-normal"}
    }
    else if(status==160){
        return {title:LangUtil.getStringByKey("data_trend_sample_pause_running"),icon:"illustration-dashboard-legend-pause"}
    }
    else if(status==162){
      return {title:LangUtil.getStringByKey("data_trend_sample_frozen"),icon:"illustration-dashboard-legend-smart"}
    }
    else {
    return {title:LangUtil.getStringByKey("data_trend_sample_stop_running"),icon:"illustration-dashboard-legend-stop"}
    }
  }
  render(){
    const {data,header} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait")
    //console.log(data)
    return <Container
            border
            fullwidth
            style={{padding:0,paddingTop:0}}
            justifyContent="flex-start"
            alignItems="flex-start">
              <Container
                flexDirection="row"
                justifyContent="flex-start"
                alignItems="center">
              <Container alignItems="flex-start"
               style={{paddingLeft:16,height:60,flex:5}}>
                <Typography
                    font={"subtitle03"}
                    color="text"
                    text={LangUtil.getStringByKey("common_date")}
                />
              </Container>
              <Container alignItems="flex-start"
               style={{paddingLeft:16,height:60,flex:4}}>
                <Typography
                    font={"subtitle03"}
                    color="text"
                    text={LangUtil.getStringByKey("data_raw_value")}
                />
              </Container>
              <Container   alignItems="flex-start"
                style={{paddingLeft:16,height:60,flex:4}}>
                <Typography
                    font={"subtitle03"}
                    color="text"
                    text={LangUtil.getStringByKey("common_total")}
                />
              </Container>
             </Container>
             {data.map(function(item,index){
               let statusInfo = this.getStatusIcon(item[2])
               return  <Container  key={index}
                              style={{borderTopWidth:1,borderColor:"#E2E2E2"}}
                               flexDirection="row"
                               justifyContent="flex-start"
                               alignItems="center">
                             <Container alignItems="flex-start"
                              style={{paddingLeft:16,height:60,
                                  flex:5}}>
                               <Typography
                                   font={"content03"}
                                   color="text"
                                   text={item[0]}
                               />
                             </Container>
                             <Container alignItems="flex-start"
                              style={{paddingLeft:16,height:60,flex:4}}>
                               <Typography
                                   font={"content03"}
                                   color="text"
                                   text={item[1]}
                               />
                             </Container>
                             <Container
                               justifyContent="flex-start"
                               flexDirection='row'
                               style={{paddingLeft:16,height:60,flex:4}}>
                               <Icon mode=    "static"
                                style={{height:20,width:20,marginRight:6}}
                                type={statusInfo.icon}/>
                               <Typography
                                   font={"content03"}
                                   color="text"
                                   text={statusInfo.title}
                               />
                            </Container>
                    </Container>
             }.bind(this))}
           </Container>

  }


}
export default DataTable;
