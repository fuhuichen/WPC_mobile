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
        IconButton,
        Icon,
        BottomNav,
        DataInput,
        NormalButton} from '../../../framework'
import {LangUtil,StorageUtil,FilterUtil,DimUtil} from '../../../framework'
import { DeviceEventEmitter} from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES} from  "../../define"
import BottomNavigation from "../../components/BottomNavigation"
import moment from 'moment'
class PageFilterDate extends Component {
  constructor(props) {
    super(props);
    const {loginInfo,navigation,route,ccmFilter} = props;
    const {mode} = route.params;
    this.state={
      dataMode:ccmFilter[mode].dataMode,
      startTime: ccmFilter[mode].startTime,
      endTime: ccmFilter[mode].endTime,
      showCalendar:false,
    }
  }

  componentWillUnmount() {

  }
  async componentDidMount() {
    DeviceEventEmitter.addListener("FILTER_DATE_RANGE_CHANGE", async(event)=>{
      console.log("CHange Event" )
      console.log(event)
      let dataMode = event.selected;
      let startTime  =this.state.startTime;
      let endDate = this.state.endTime;
      console.log(endDate)
      let date = new Date(endDate);
      console.log(date)
      if(dataMode == 1){

      }
      else if(dataMode == 2){
         date.setDate(date.getDate()-2)
      }
      if(dataMode == 3){
        date.setDate(date.getDate()-6)
      }

      startTime = moment(date).format("YYYY/MM/DD 00:00:00")
      this.setState({dataMode,startTime})

    })
  }
  async showBrandSelect(){
    const {navigation} = this.props;
    navigation.push(PAGES.BRAND_SELECT)
  }
  async next(){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {mode} = route.params;
    const {dataMode,startTime,endTime}  =this.state;
    let nf = JSON.parse(JSON.stringify(this.props.ccmFilter))
    nf[mode].startTime = startTime
    nf[mode].endTime = endTime
    nf[mode].dataMode = dataMode;
    this.props.setCcmFilter(nf)
    DeviceEventEmitter.emit("FILTER_CHANGE_MONITOR",{ccmFilter:nf})
    navigation.pop(1)
  }
  getRegion2Name(list ){
    if(!list)return null;
    let names = [];
    for(var k in list){
      names = names.concat(list[k])
    }

    return names;
  }
  getDateModeStr(mode){
    if(mode==1){
      return LangUtil.getStringByKey("不使用common_date_type_day")
    }
    else if(mode==2){
      return LangUtil.getStringByKey("不使用common_date_type_last3")
    }
    else if(mode==3){
      return LangUtil.getStringByKey("不使用common_date_type_last7")
    }
  }
  onDateChange(date,type){
    console.log(date,type)
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {mode,page} = route.params;
    const {dataMode,startTime,endTime,showCalendar}  =this.state;
    if(type =="START_DATE" && date){
      if(dataMode==1){
        this.setState({startTime:date,endTime:date})
      }
      else{
        let ed = new Date(date)
        let endTime= moment(new Date(ed)).format("YYYY/MM/DD 00:00:00" )
        ed = ed.setDate(ed.getDate() -(dataMode==2?2:6))
        let startTime =  endTime= moment(new Date(ed)).format("YYYY/MM/DD 00:00:00" )

        this.setState({startTime:ed,endTime:date})
      }

    }
    if(type =="END_DATE"){

    }
  }
  onSetDate(){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {mode,page} = route.params;
    let nf = JSON.parse(JSON.stringify(this.props.ccmFilter))
    const {startTime,endTime} = this.state;

    nf.cache[mode].startTime = moment(new Date(startTime)).format("YYYY/MM/DD 00:00:00" )
    nf.cache[mode].endTime = moment(new Date(endTime?endTime:startTime)).format("YYYY/MM/DD 23:59:59" )
    this.props.setCcmFilter(nf)
    this.setState({showCalendar:false})
  }
  render(){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {mode} = route.params;
    const {dataMode,startTime,endTime,showCalendar}  =this.state;
    const {width,height} = DimUtil.getDimensions("portrait");
    return ( <View　style={{width,height,backgroundColor:'#00000044'}}>
             </View>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter};
};
export default connect(mapStateToProps, actions)(PageFilterDate);
