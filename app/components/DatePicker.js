import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
    KeyboardAvoidingView
} from 'react-native';
import {connect} from 'react-redux';
import { Keyboard, KeyboardEvent } from 'react-native';
import * as actions from '../../actions';
import {AppContainer,
        PageContainer,
        Header,Container,
        Selection,
        Typography,
        Tab,
        Icon,
        BottomNav,
        IconButton,
        SearchInput,
        DateInputField,
        Notify,
        NormalButton} from '../../framework'
import {LangUtil,StorageUtil,FilterUtil,COLORS,DimUtil} from '../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES} from  "../define"
import CalendarPicker from 'react-native-calendar-picker';
import moment from "moment"
class BottomNavigation extends Component {
  constructor(props) {
    super(props);
    const {loginInfo,navigation,ccmFilter,mode} = this.props;

    let tempStartDate = ccmFilter[mode?mode:'event'].startTime;
    let tempEndDate = ccmFilter[mode?mode:'event'].endTime ;
    this.state={
      showCalendar:false,
      tempStartDate,
      tempEndDate,
      edit:false,
      inputStartDate:'',
      inputEndDate:'',
      notify:null,
      keyboardHeight:0,
    }
  }

  componentWillUnmount() {

  }
  toastError(text){
    this.setState({notify:text})
    setTimeout(function(){
        this.setState({notify:null})
    }.bind(this),1000)
  }
  getDate(){
    var separators = ['\\/'];
    var bits = s.split(new RegExp(separators.join('|'), 'g'));
    console.log(bits[2], bits[1], bits[0])
    var d = new Date(bits[0], bits[1]-1, bits[2]);
    return d;

  }
  isValidDate(s){
  // console.log(s)
   var separators = ['\\/'];
   var bits = s.split(new RegExp(separators.join('|'), 'g'));
  // console.log(bits[2], bits[1], bits[0])
   var d = new Date(bits[0], bits[1]-1, bits[2]);
   //console.log(d.getFullYear(),bits[0], d.getMonth() + 1,bits[1])
   return d.getFullYear() == bits[0] && d.getMonth() + 1 == bits[1];
  }
  async componentDidMount() {
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow.bind(this));
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide.bind(this));

  }
  onDateChange(date,type){
    console.log(date,type)
    const {ccmFilter} = this.props;
    if(type =="START_DATE" && date){
      this.setState({tempStartDate:date})
    }
    if(type =="END_DATE"){
      this.setState({tempEndDate:date})
    }
  }
  onSetDate(){

  }
  onConfirm(){
    const {tempStartDate,tempEndDate,edit,inputStartDate,inputEndDate} = this.state;
    const {loginInfo,navigation,ccmFilter,onClose} = this.props;

    if(edit){
      console.log("CheckEdit")
      if(!this.isValidDate(inputStartDate) || !this.isValidDate(inputEndDate)){
        console.log("InvalidDate")
        this.toastError(LangUtil.getStringByKey("error_date_invalid"))
        return ;
      }
      let sday = new Date(inputStartDate);
      let eday = new Date(inputEndDate)
      if(sday>eday){
        this.toastError(LangUtil.getStringByKey("error_date_order"))
        return ;
      }
      let dif = (eday - sday)/86400000;
      console.log("Dif days"+dif)
      if(dif >=3){
        this.toastError(LangUtil.getStringByKey("error_date_wrongrange"))
        return ;
      }
      let startTime = moment(sday).format("YYYY/MM/DD 00:00:00" )
      let endTime = moment(eday).format("YYYY/MM/DD 23:59:59" )
      if(onClose)onClose({startTime,endTime})
      return
    }
    else{
      let startTime = moment(new Date(tempStartDate)).format("YYYY/MM/DD 00:00:00" )
      let endTime = moment(new Date(tempEndDate?tempEndDate:tempStartDate)).format("YYYY/MM/DD 23:59:59" )
        if(onClose)onClose({startTime,endTime})
    }


  }
  getWeeks(){
     let lan = LangUtil.getLanguage()
    if(lan == "zh-TW" )
      return ['星期日','星期一','星期二','星期三','星期四','星期五','星期六']
    else if( lan == "zh-CN")
        return ['星期日','星期一','星期二','星期三','星期四','星期五','星期六']
    else if(lan == "ja")
        return ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日']
    return null;
  }
  getMonths(){
     let lan = LangUtil.getLanguage()
    if(lan == "zh-TW" )
      return ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']
    else if( lan == "zh-CN")
        return  ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']
    else if(lan == "ja")
        return  ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']
    return null;
  }
  onCancel(){
    const {loginInfo,navigation,ccmFilter,onClose} = this.props;
    if(onClose)onClose()
  }
  onChangeInputStartTime(t){
      console.log("onChangeInputStartTime="+t)
      this.setState({inputStartDate:t})
  }
  onChangeInputEndTime(t){
    console.log("onChangeInputEndTime="+t)
      this.setState({inputEndDate:t})
  }
  _keyboardDidShow(e) {
    console.log("Event keybaord show height+"+e.endCoordinates.height)
      this.setState({keyboardHeight:e.endCoordinates.height})
  }
  _keyboardDidHide(){
    console.log("Event Keyboard hide")
    this.setState({keyboardHeight:0})
  }
  render(){
    const {loginInfo,navigation,ccmFilter} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait");
    let mode = this.props.mode?this.props.mode:'event'
    const {showCalendar,tempStartDate,tempEndDate,edit,keyboardHeight} =this.state;
    return <Container
      　　　justifyContent="flex-start"
           fullwidth style={{position:'absolute',bottom:0,backgroundColor:"#000000BB",height}}>
           <Container 　justifyContent="flex-start"
                  fullwidth style={{height:450,
                  borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",
                  padding:16, position:'absolute', bottom:keyboardHeight?keyboardHeight-200:0}}>
                 <Container
                   fullwidth
                   style={{height:20,marginBottom:20}}
                   flexDirection="row">
                   <IconButton
                     text={"text03"}
                     style={{position:'absolute',left:0}}
                     onPress={()=>this.onCancel()}
                     text={LangUtil.getStringByKey("common_cancel")}/>
                  <Typography
                   　color={"text"}
                    font="text02"
                   text={LangUtil.getStringByKey("filter_date_duration")}/>
                   <IconButton
                     text={"text03"}
                     style={{position:'absolute',right:0}}
                     onPress={()=>this.onConfirm()}
                     text={LangUtil.getStringByKey("common_confirm")}/>
                 </Container>
                 <Container fullwidth scrollable style={{width,flex:1,padding:16,paddingTop:0}}>
                   <Container fullwidth flexDirection="row" justifyContent="flex-start" style={{marginBottom:10}}>
                     <Typography
                       font={"text03"}
                       color="text"
                       style={{marginBottom:10}}
                       text={FilterUtil. getDateRange(tempStartDate,
                         tempEndDate)}/>
                      <View style={{flex:1}}/>
                      <IconButton
                          iconStyle={{width:24,height:24}}
                          onPress={async()=>{this.setState({edit:!this.state.edit})}}
                          text={""}
                          mode="static"
                          type={edit?"calendar":"edit"}
                          style={{marginRight:0}}/>
                    </Container >
                    {edit? <Container fullwidth scrollable style={{flex:1,paddingTop:0,height:200}}>
                              <DateInputField
                                placeholder={"YYYY/MM/DD"}
                                style={{borderTopLeftRadius:8,borderTopRightRadius:8,marginBottom:3}}
                                value={this.state.inputStartDate}
                                invalidText={this.state.inputStartDate&&this.state.inputStartDate.length>0&&!this.isValidDate(this.state.inputStartDate)}
                                onChangeText={(t)=>this.onChangeInputStartTime(t)}
                                onPress={()=>this.setState({inputStartDate:""})}
                              />
                              <DateInputField
                                placeholder={"YYYY/MM/DD"}
                                style={{borderBottomLeftRadius:8,borderBottomRightRadius:8}}
                                value={this.state.inputEndDate}
                                invalidText={this.state.inputEndDate&&this.state.inputEndDate.length>0&&!this.isValidDate(this.state.inputEndDate)}
                                onChangeText={(t)=>this.onChangeInputEndTime(t)}
                                onPress={()=>this.setState({inputEndDate:""})}
                              />
                     </Container>:
                      <CalendarPicker
                      weekdays={this.getWeeks()}
                      months={this.getMonths()}
                     previousTitle="<"
                      nextTitle=">"
                      width={width-32}
                      dayShape="square"
                      allowRangeSelection={true}
                      maxDate={new Date()}
                      maxRangeDuration={2}
                      selectedDayColor="#E2EFFD"
                      selectedDayTextColor="#003B65"
                      selectedRangeStartStyle={{backgroundColor:"#003B65"}}
                      selectedRangeStartTextStyle={{color:'white'}}
                      selectedRangeEndStyle={{backgroundColor:"#003B65",borderRadius:0}}
                      selectedRangeEndTextStyle={{color:'white'}}
                      selectedStartDate={new Date( tempStartDate)}
                      selectedEndDate={tempEndDate?new Date( tempEndDate):null}
                      onDateChange={(a,b)=>this.onDateChange(a,b)}
                    />}
                    {this.state.notify?<Notify style={{}} text={this.state.notify} style={{position:'absolute',top:120}}/>:null}
                </Container>
           </Container>
           </Container>
  }


}
export default BottomNavigation;
