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
        DataInput,
        IconButton,
        NormalButton} from '../../../framework'
import CalendarPicker from 'react-native-calendar-picker';
import {LangUtil,StorageUtil,FilterUtil,COLORS,DimUtil} from '../../../framework'
import { DeviceEventEmitter} from 'react-native';
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES,OPTIONS} from  "../../define"
import BottomNavigation from "../../components/BottomNavigation"
import moment from "moment"
class PageFilterMain extends Component {
  constructor(props) {
    super(props);
    this.state={
      showCalendar:false,
      tempStartDate:"",
      tempEndDate:"",
    }
  }

  componentWillUnmount() {

  }
  async componentDidMount() {

  }
  async showBrandSelect(){
    const {navigation} = this.props;
    navigation.push(PAGES.BRAND_SELECT)
  }
  async next(){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {mode,page} = route.params;
    let nf = JSON.parse(JSON.stringify(this.props.ccmFilter))
    nf[mode] = nf.cache[mode];
    this.props.setCcmFilter(nf)
    if(page == PAGES.DATA_MONITOR){
      DeviceEventEmitter.emit("FILTER_CHANGE_MONITOR",{ccmFilter:nf})
    }
    else if(mode == 'notification'){
      DeviceEventEmitter.emit("FILTER_CHANGE_NOTIFY",{ccmFilter:nf})
    }
    else{
      DeviceEventEmitter.emit("FILTER_CHANGE",{ccmFilter:nf})
    }

    navigation.pop(1)
  }
  componentWillUnmount(){
    if(this.listener){
      DeviceEventEmitter.removeSubscription(this.listener)
    }
  }
  onReset(){
    const {loginInfo,navigation,route,ccmFilter,storeList} = this.props;
    const {mode,page} = route.params;

    let nf = JSON.parse(JSON.stringify(this.props.ccmFilter))

    let options = FilterUtil.getStoreOptions(storeList,null,null);
    //console.log(JSON.stringify(options))
    let d = new Date();
    let end  =moment(d).format("YYYY/MM/DD 23:59:59");
    let d1 = new Date();
    //d1.setDate(d1.getDate()-6);
    let startSameDate  =moment(d1).format("YYYY/MM/DD 00:00:00");
    d.setDate(d.getDate()-2);
    let start = moment(d).format("YYYY/MM/DD 00:00:00");
    let firstStore = storeList.length>0?storeList[0].branch_id: null;
    let firstName = storeList.length>0?storeList[0].branch_name: null;

    let filter={
        event:{
          options,
          sort:OPTIONS.EVENT[0],
          region1:null,
          region2:null,
          store: firstStore,
          storeName:firstName,
          startTime:start,
          endTime:end,
        },
        data:{
          options,
          sort:OPTIONS.DATA[0],
          region1:null,
          region2:null,
          store: firstStore,
          storeName:firstName,
          startTime:startSameDate,
          endTime:end,
          dataMode:1,
        },
        device:{
          options,
          sort:OPTIONS.DEVICE[0],
          region1:null,
          region2:null,
          store: firstStore,
          storeName:firstName,
        },
        notification:{
          options,
          sort:OPTIONS.NOTIFICATION[0],
          region1:null,
          region2:null,
          store: null,
          startTime:start,
          endTime:end,
        },
        cache:{
          event:null,
          data:null,
          device:null,
          notification:null
        }

    }
    nf.cache[mode] = filter[mode];
    this.props.setCcmFilter(nf)


  }
  getRegion2Name(list ){
    if(!list)return null;
    let names = [];
    for(var k in list){
      names = names.concat(list[k])
    }

    return names;
  }
  onDateChange(date,type){
    console.log(date,type)
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {mode,page} = route.params;
    if(type =="START_DATE" && date){
      this.setState({tempStartDate:date})
    }
    if(type =="END_DATE"){
      this.setState({tempEndDate:date})
    }
  }
  onSetDate(){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {mode,page} = route.params;
    let nf = JSON.parse(JSON.stringify(this.props.ccmFilter))
    const {tempStartDate,tempEndDate} = this.state;

    nf.cache[mode].startTime = moment(new Date(tempStartDate)).format("YYYY/MM/DD 00:00:00" )
    nf.cache[mode].endTime = moment(new Date(tempEndDate?tempEndDate:tempStartDate)).format("YYYY/MM/DD 23:59:59" )
    this.props.setCcmFilter(nf)
    this.setState({showCalendar:false})
  }
  render(){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait");
    const {mode} = route.params;
    const {showCalendar,tempStartDate,tempEndDate} =this.state;
    return ( <View>
              <PageContainer
                navigation={this.props.navigation}
                isHeader={true}>
                <Header
                  leftIcon={"header-back"}
                  rightText={LangUtil.getStringByKey("common_reset")}
                  onLeftPressed={()=>{navigation.pop(1)}}
                  onRightPressed={()=>{this.onReset()}}
                  text={LangUtil.getStringByKey("filter_title")}
                />
                <Container
                    fullwidth
                    scrollable
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}>
                    <Typography
                            style={{marginBottom:2,marginTop:20}}
                            font={"subtitle04"}
                            text={LangUtil.getStringByKey("filter_sort_mode")}
                            color='black'/>
                    <Selection
                            style={{marginBottom:20}}
                            text={LangUtil.getStringByKey(ccmFilter.cache[mode].sort)}
                            onPress={async()=>{
                              if(!this.open){
                                this.open = true;
                                navigation.push(PAGES.FILTER_SORT,{mode})}
                                setTimeout(function(){
                                    this.open = false;
                                }.bind(this),1000)
                              }

                            }
                            hint={""}/>
                    <Typography
                          style={{marginBottom:2}}
                          font={"subtitle04"}
                          text={LangUtil.getStringByKey("filter_region1")}
                          color='black'/>
                    <Selection
                          multiSelect
                          style={{marginBottom:20}}
                          text={ccmFilter.cache[mode].region1}
                          onPress={async()=>{
                            if(!this.open){
                              this.open = true;
                              navigation.push(PAGES.FILTER_REGION1,{mode})}
                              setTimeout(function(){
                                  this.open = false;
                              }.bind(this),1000)
                            }

                          }
                          hint={LangUtil.getStringByKey("common_please_select")}/>
                    <Typography
                          style={{marginBottom:2}}
                          font={"subtitle04"}
                          text={LangUtil.getStringByKey("filter_region2")}
                          color='black'/>
                    <Selection
                          multiSelect
                          style={{marginBottom:30}}
                          text={this.getRegion2Name(ccmFilter.cache[mode].region2,{mode})}
                          onPress={async()=>{
                            if(!this.open){
                              this.open = true;
                              navigation.push(PAGES.FILTER_REGION2,{mode})}
                              setTimeout(function(){
                                  this.open = false;
                              }.bind(this),1000)
                            }

                          }
                          hint={LangUtil.getStringByKey("common_please_select")}/>
                    <Typography
                          style={{marginBottom:2}}
                          font={"subtitle04"}
                          text={LangUtil.getStringByKey("filter_location")}
                          color='black'/>
                    <Selection
                          multiSelect={mode=='notification'}
                          style={{marginBottom:30}}
                          text={ccmFilter.cache[mode].storeName}
                          onPress={async()=>{
                            if(!this.open){
                              this.open = true;
                              navigation.push(PAGES.FILTER_STORE,{mode})}
                              setTimeout(function(){
                                  this.open = false;
                              }.bind(this),1000)
                            }

                          }
                          hint={LangUtil.getStringByKey("common_please_select")}/>
              {mode=="event" || mode =="notification"?<Container
                      justifyContent={"flex-start"}
                      alignItems={"flex-start"}
                      flexDirection={'row'}
                    >
                    <Typography
                          style={{marginBottom:2}}
                          font={"subtitle04"}
                          text={mode =="notification"? LangUtil.getStringByKey("filter_event_date"):LangUtil.getStringByKey("filter_alert_date")}
                          color='black'/>
                    <Typography
                          style={{marginBottom:2}}
                          font={"subtitle04"}
                          text={"*"}
                          color='error'/>
                </Container>:null}
                    {mode=="event" || mode =="notification"?<Selection
                          style={{marginBottom:30}}
                          icon="text-fields-date"
                          text={FilterUtil.getDateRange(
                            ccmFilter.cache[mode].startTime,ccmFilter.cache[mode].endTime,
                            ccmFilter.cache[mode].dataMode,)}
                          onPress={async()=>{
                              if(!this.open){
                                this.open = true;
                                mode=="data"?navigation.push(PAGES.FILTER_DATE,{mode}) :
                                this.setState({showCalendar:true, tempStartDate:ccmFilter.cache[mode].startTime,
                                  tempEndDate:ccmFilter.cache[mode].endTime })
                                setTimeout(function(){
                                    this.open = false;
                                }.bind(this),1000)
                              }

                            }
                          }
                          hint={LangUtil.getStringByKey("common_please_select")}/>:null}
                </Container>
                <NormalButton
                  style={{marginBottom:1}}
                  onPress={async()=>{await this.next()}}
                  text={LangUtil.getStringByKey("common_send")}/>
             </PageContainer>
             {showCalendar?<Container
                 style={{position:'absolute',bottom:0,height:'100%',width:'100%',backgroundColor:'#00000033'}}
                 fullwidth
                 justifyContent={"flex-start"}
                 alignItems={"flex-start"}>
                   <View style={{width:'100%',flex:1}}/>
                   <Container
                       border
                       fullwidth
                       style={{height:450,padding:16}}
                       justifyContent={"flex-start"}
                       alignItems={"center"}>
                       <Container flexDirection="row" fullwidth>
                          <Container style={{flex:1}}>
                           </Container >
                           <Typography font={"subtitle03"}
                           color="primary"
                            text={mode =="notification"? LangUtil.getStringByKey("filter_event_date"):LangUtil.getStringByKey("filter_alert_date")}/>
                           <Container style={{flex:1,justifyContent:'flex-end',alignItems:'flex-end'}}>
                              <IconButton
                                  type={"cancel"}
                                  onPress={()=>{this.setState({showCalendar:false})}}/>
                            </Container >
                       </Container >
                      <Typography
                        font={"subtitle03"}
                        color="primary"
                        style={{marginBottom:10}}
                        text={FilterUtil.getDateRange(tempStartDate,
                          tempEndDate?new Date( tempEndDate):null)}/>
                       <CalendarPicker
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
                       />
                       <NormalButton
                         style={{width:'100%',marginTop:12}}
                         onPress={async()=>{await this.onSetDate()}}
                         text={LangUtil.getStringByKey("common_send")}/>
                    </Container>

             </Container>:null}
             </View>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageFilterMain);
