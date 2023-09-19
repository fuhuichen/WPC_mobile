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
        Icon,
        BottomNav,
        IconButton,
        SearchInput,
        TouchCard,
        NormalButton} from '../../framework'
import {LangUtil,StorageUtil,StoreUtil,StringUtil} from '../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES} from  "../define"
import CcmAPI from "../api/ccm"
import MainAPI from "../api/main"
import EventItem from "../components/eventItem"
import DatePicker from "../components/DatePicker"
import RegionPicker from "../components/RegionPicker"
import StorePicker from "../components/StorePicker"
import SortPicker from "../components/SortPicker"
import { DeviceEventEmitter} from 'react-native';
import moment from "moment"
class PageEventMgt extends Component {
  constructor(props) {
    super(props);
    let unread =  StoreUtil.getSize(props.loginInfo.accountId)
    this.state={
      events:[],unread,loading:true,
      searchMode:false,
    }
  }
  async fetchSettings(){
    this.props.setLoading(true);
    let result;
    let alertRules = [];
    let monitorRules = [];
    let userPositions = [];
    let userDepartments = [];
    result  = await CcmAPI.getUserPositionDefineList();
    if(result.status == ERROR_CODE.SUCCESS){
        userPositions = result.defines;
    }
    result  = await CcmAPI.getUserDepartmentDefineList();
    if(result.status == ERROR_CODE.SUCCESS){
        userDepartments = result.defines;
    }
    result  = await CcmAPI.getAlertRuleList();
    if(result.status == ERROR_CODE.SUCCESS){
        alertRules = result.alert_rules;
    }
    result  = await CcmAPI.getMonitorRuleList();
    if(result.status == ERROR_CODE.SUCCESS){
        monitorRules = result.monitor_rules;
    }
    let ccmFilter = this.props.ccmFilter;
    ccmFilter.userPositions = userPositions;
    ccmFilter.userDepartments = userDepartments;
    ccmFilter.alertRules = alertRules;
    ccmFilter.monitorRules = monitorRules;
    this.props.setCcmFilter(ccmFilter)
  //  this.props.setLoading(false);
    this.setState({alertRules,monitorRules,userPositions,userDepartments})
  }
  async componentDidMount() {
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {notify} = route.params;


    await this.fetchSettings()
    await this.fetchData()
    this.listener = DeviceEventEmitter.addListener("FILTER_CHANGE", async(event)=>{
      console.log("Event filter change")
      await this.fetchData(event?event.ccmFilter:null);
    })
    if(notify){
      navigation.push(PAGES.NOTIFICATION,{notify})
    }
  }
  componentWillUnmount(){
    if(this.listener){
      DeviceEventEmitter.removeSubscription(this.listener)
    }
  }
  async checkLoginStatus(){
      const {token} = this.props;
      let result = await MainAPI.isLogin(token)
      console.log(result)
      if(result.status!=1 || !result.isLogin){
        const {loginInfo,navigation} = this.props;
        let info  = JSON.parse(JSON.stringify(loginInfo))
        let res = await MainAPI.logoutRequest();
        info.token = null;
        info.lastNotificaton = null;
        await StoreUtil.init();
        await StoreUtil.clear()
        StorageUtil.setObj( STORAGES.LOGIN_INFO,{account:info.account})
        this.props.setLoginInfo(info)
        navigation.replace(PAGES.LOGIN,{force:true})
      }
  }
  async fetchData(ccmFilter){
    this.props.setLoading(true);
    this.setState({events:[],loading:true})
    //await this.checkLoginStatus()
    if(!ccmFilter){
      ccmFilter = this.props.ccmFilter;
    }

    const {loginInfo,storeList} = this.props;
    const {event} = ccmFilter ;
    let ids =[];
    if(ccmFilter.event.store){
      ids = [ccmFilter.event.store]
    }
    else{
      for(var k in storeList){
      //  console.log(storeList[k])
        ids.push(storeList[k].branch_id)
      }
    }

    let request={
        branch_ids:ids,
        monitor_item:"",
        period:[event.startTime,event.endTime]
    }

    let result;
    console.log("FetchStart")
    result = await CcmAPI.getBriefAlertRecords(request);
  //  console.log("getBriefAlertRecord")
  //  console.log(JSON.stringify(result))
    let branchList=[];
    if(result.status == ERROR_CODE.SUCCESS){
      let list =[];
      for(var i in result.branch_alerts){
          let branch = result.branch_alerts[i]
          let bh = storeList.find(p=>p.branch_id == branch.branch_id)
          for(var j in branch.mm_alerts){
            let mod = branch.mm_alerts[j];
            //console.log(mod)
            for(var k in mod.alert_briefs){
                let data =  mod.alert_briefs[k]
                if(branchList.indexOf(branch.branch_id)<0){
                   branchList.push(branch.branch_id)
                }
                data.branch_id = branch.branch_id;
                data.branch_code = branch.branch_code;
                data.branch_name = branch.branch_name;
                data.mm_id = mod.mm_id;
                data.mm_code = mod.mm_code;
                data.mm_name = mod.mm_name;
                data.mm_status = mod.status;
                data.prober_name =""
              //  console.log("EVENT mm_status="+data.mm_status)
                data.alert_ids  = mod.alert_ids;
                data.time_zone = bh&&bh.contact?bh.contact.time_zone:""
                list.push(data)
            }
          }

      }
      let probersList={};
      let mods = [];
      for(var k in branchList){
        let bh = storeList.find(p=>p.branch_id == branchList[k])
      //  console.log("Find bh event  "+bh)
        //console.log("Find BH="+bh.contact.time_zone)
        let res = await CcmAPI.getMonitorModuleList(branchList[k]);
        //console.log("getMonitorModuleList")
        //console.log(JSON.stringify(res))
        if(res.status == ERROR_CODE.SUCCESS){
          mods = res.monitor_modules;
          for(var i in res.monitor_modules){

            let mm = res.monitor_modules[i];
            //console.log("mm")
            for(var j in mm.probers){

              let prober = mm.probers[j]
            //  console.log("FInd prober "+prober.prober_id)
              prober.mm_status = mm.status;
              prober.mm_name   = mm.mm_name
              prober.mm_id   = mm.mm_id

              //prober.time_zone = bh.contact.time_zone
              //prober.alert_ids  = mm.alert_ids;
              probersList[prober.prober_id] = prober;


            }
          }
        }
      }

      for(var k in list){
         //console.log("Find target =" +list[k].target_id)
         list[k].ts = "";
         if(list[k].timestamp && list[k].timestamp.event){
            list[k].ts = list[k].timestamp.event
         }
         mods.forEach((item, i) => {
            if(item.mm_id == list[k].mm_id){
              list[k].alert_ids  = item.alert_ids ;
            }
         });

         if(probersList[list[k].target_id]){
          // list[k].alert_ids = probersList[list[k].target_id].alert_ids;
           list[k].prober_name = probersList[list[k].target_id].name;
           list[k].prober_id = probersList[list[k].target_id].prober_id;
           //list[k].mm_status= probersList[list[k].target_id].mm_status;
           //list[k].time_zone= probersList[list[k].target_id].time_zone;
           list[k].monitor_rule_ids = probersList[list[k].target_id].monitor_rule_ids;
           //console.log("Alert Status="+list[k].status)
         }
      }
      console.log("Fetch End")
      let order = ccmFilter.event.order?ccmFilter.event.order:-1;
      //filter_sort_option_alert_time","ccm_module_name","ccm_unit_name","event_info_handle_status","event_info_montiror_status
      switch(ccmFilter.event.sort ){
        case "ccm_module_name":
          list = list.sort(function(a,b){
            return order* a.mm_name.localeCompare(b.mm_name)
          })
          break;
        case "ccm_unit_name":
            list = list.sort(function(a,b){
              return order* a.prober_name.localeCompare(b.prober_name)
            })
            break;
        case "event_info_handle_status":
            list = list.sort(function(a,b){
                  return order* (a.has_cause -b.has_cause);
            })
            break;
        case "event_info_montiror_status":
                list = list.sort(function(a,b){
                      return order* (a.mm_status -b.mm_status);
                })
            break;
        default:
          list = list.sort(function(a,b){
            return order* a.ts.localeCompare(b.ts)
          })

      }
      // getMonitorModuleList
      console.log("Sort End")
      this.setState({events:list,loading:false})
    }
    this.props.setLoading(false);

  }

  openFilter(){

     const {ccmFilter,navigation} = this.props;

     if(!this.open){
          this.open = true;
          let newFilter = JSON.parse(JSON.stringify(ccmFilter));
          newFilter.cache.event = JSON.parse(JSON.stringify(ccmFilter.event));
          this.props.setCcmFilter(newFilter)
          navigation.push(PAGES.FILTER_MAIN,{mode:'event'})
          setTimeout(function(){
              this.open = false;
          }.bind(this),2000)

     }

  }
  onDateChanged(data){
     //console.log(data)
     if(data){
       const {ccmFilter } = this.props;
       let newFilter = JSON.parse(JSON.stringify(ccmFilter));
       newFilter.event.startTime = data.startTime;
       newFilter.event.endTime = data.endTime;
       this.props.setCcmFilter(newFilter)
       DeviceEventEmitter.emit("FILTER_CHANGE",{ccmFilter:newFilter})
     }
     this.setState({calendar:false})
  }
  onRegionChanged(data){
     if(data){
       this.props.setCcmFilter(data)
       DeviceEventEmitter.emit("FILTER_CHANGE",{ccmFilter:data})
     }

     this.setState({region:false})
  }
  onStoreChanged(data){
    if(data){
      this.props.setCcmFilter(data)
      DeviceEventEmitter.emit("FILTER_CHANGE",{ccmFilter:data})
    }
     this.setState({store:false})
  }
  onSortChanged(data){
      if(data){
        this.props.setCcmFilter(data)
        DeviceEventEmitter.emit("FILTER_CHANGE",{ccmFilter:data})
      }
     this.setState({sort:false})
  }
  onSearch(t){
    console.log("On Search "+t)
    this.setState({keyword:t})
  }
  render(){
    const {loginInfo,navigation,storeList,ccmFilter} = this.props;
    const {event} = ccmFilter ;
    const {events,keyword,alertRules,monitorRules,userPositions,userDepartments
      ,calendar,region,store,sort,searchMode,tempkeyword} = this.state;
    let filterData = events;
    if(keyword && keyword.length>0){
        filterData  =[];
        for(var k in events){
          if( events[k].branch_name.indexOf(keyword)>=0
              || events[k].mm_name.indexOf(keyword)>=0
              || events[k].prober_name.indexOf(keyword)>=0 ){
                  filterData.push(events[k])
              }
        }

    }
    let startTime = moment(new Date(event.startTime)).format("YYYY/MM/DD" )
    let endTime = moment(new Date(event.endTime)).format("YYYY/MM/DD" )
    let timezone =""
    if(events[0]){
      timezone=events[0].time_zone
    }
    return ( <View>
                <PageContainer
                bottom={CCMFUNCTIONS}
                hasStore={true}
                isEvent={true}
                routeName={PAGES.EVENT_MANAGE}
                navigation={this.props.navigation}
                introduction={this.state.introduction}
                style={{paddingLeft:0,paddingRight:0}}
                hasColdchain={loginInfo.hasColdchain&&storeList.length>0}
                onCloseIntroduction={()=>this.setState({introduction:null})}
                isHeader={true}>
                <Header
                  leftIcon={this.state.unread?"header-event-alert":"header-event"}
                  onLeftPressed={()=>{
                        if(!this.open){
                             this.open = true;
                             navigation.push(PAGES.NOTIFICATION,{})
                             setTimeout(function(){
                                 this.open = false;
                             }.bind(this),2000)

                        }

                    }

                  }
                  rightIcon={searchMode?"":(ccmFilter.event.region1||ccmFilter.event.region2)?"header-filteractive":"header-filter" }
                  onRightPressed={()=>{
                    if(searchMode)return
                    let newFilter = JSON.parse(JSON.stringify(ccmFilter));
                    newFilter.cache.event = JSON.parse(JSON.stringify(ccmFilter.event));
                    this.props.setCcmFilter(newFilter)
                    this.setState({region:true})}}
                  text={LangUtil.getStringByKey("function_event_manage")}
                />
                {searchMode?<Container
                    fullwidth
                    alignItems={"center"}
                    style={{height:50,marginTop:6,paddingRight:16}}
                    flexDirection={"row"}>
                    <IconButton
                       onPress={()=>{this.setState({keyword:null,searchMode:false})}}
                        text={""}
                        type={"back"}
                        mode="static"
                        iconStyle={{width:24,height:24}}
                        style={{marginRight:5,marginLeft:5}}/>
                    <SearchInput
                       value={this.state.tempkeyword}
                       placeholder={LangUtil.getStringByKey("filter_keyword_search")}
                       onChangeText={(t)=>{
                           this.setState({tempkeyword:t})
                       }}
                       onEnter={(t)=>{
                        this.setState({keyword:this.state.tempkeyword})
                        let nf = JSON.parse(JSON.stringify(this.props.ccmFilter));
                        if(!nf.event.searchRecord){
                          nf.event.searchRecord = [];
                        }

                        if(this.state.tempkeyword&&this.state.tempkeyword.length>0){
                            if(nf.event.searchRecord.length==15){
                               nf.event.searchRecord.splice(-1)
                            }
                            nf.event.searchRecord.unshift(this.state.tempkeyword)
                        }
                        this.props.setCcmFilter(nf)
                       }}
                       onClear={(t)=>{
                        this.setState({keyword:"",tempkeyword:''})
                       }}
                     />
                  </Container>:<Container
                    fullwidth
                    alignItems={"center"}
                    style={{height:44,paddingLeft:16,paddingRight:16}}
                    flexDirection={"row"}>
                  <TouchCard
                        flexDirection={"row"}
                        onPress={()=>this.setState({store:true})}>
                  <Typography
                           color="primary"
                           font={"subtitle02"}
                           text={StringUtil.getFixedLenName(this.props.ccmFilter.event.storeName,16)+"("+filterData.length+ ")"}
                  />
                  <IconButton
                      onPress={()=>{}}
                      text={""}
                      type={"dropdown-blue"}
                      mode={"static"}
                      iconStyle={{width:24,height:24}}/>
                  </TouchCard>
                  <View style={{flex:1}}/>
                  <IconButton
                      onPress={()=>{this.setState({searchMode:true,keyword:null,tempkeyword:null})}}
                      text={""}
                      type={"action-search"}
                      mode={"static"}
                      iconStyle={{width:24,height:24}}
                      style={{marginRight:8}}/>
                  <IconButton
                      onPress={()=>{this.setState({sort:true})}}
                      text={""}
                      type={"action-sort"}
                      mode={"static"}
                      iconStyle={{width:24,height:24}}
                      style={{marginRight:8}}/>
                  <IconButton
                      onPress={()=>this.setState({introduction:{
                        title:LangUtil.getStringByKey("common_figure"),
                        info:[
                          { type:LangUtil.getStringByKey("hint_status_desc"),
                            title:LangUtil.getStringByKey("event_handle_status"),
                           list:[
                             {title:LangUtil.getStringByKey("event_handle_yes"),icon:"illustration-event-checked"},
                              {title:LangUtil.getStringByKey("event_handle_no"),icon:"illustration-event-unchecked"},
                            ]
                          },
                        ]
                      }})}
                      text={""}
                      type={"action-info"}
                      mode={"static"}
                      iconStyle={{width:24,height:24}}
                      style={{marginRight:0}}/>
                </Container>}
                {searchMode?null:<TouchCard
                          fullwidth
                          onPress={async()=>{
                            this.setState({calendar:true})}}
                          justifyContent="flex-start"
                          alignItems={"center"}
                          style={{height:40,paddingLeft:16,paddingRight:16,
                              backgroundColor:"#E3E3E3",width:'100%'}}
                          flexDirection={"row"}>
                          <Typography
                                   color="text"
                                   font={"text01"}
                                   text={startTime+ " - "+endTime}
                          />
                          <View style={{flex:1}}/>
                          <IconButton
                              iconStyle={{width:24,height:24}}
                              onPress={async()=>{
                                this.setState({calendar:true})}}
                              text={""}
                              mode="static"
                              type={"calendar"}
                              style={{marginRight:0}}/>
                </TouchCard>}
                {searchMode?(keyword&&keyword.length>0)?<Container
                            fullwidth
                            justifyContent="flex-start"
                            alignItems={"center"}
                            style={{marginTop:12,paddingLeft:16,paddingRight:16,width:'100%',marginBottom:5}}
                            flexDirection={"row"}>
                            <Typography
                             　color={"text"}
                              font="text02"
                             text={LangUtil.getStringByKey("filter_search_result")}/>
                   </Container>:<Container
                             fullwidth
                             justifyContent="flex-start"
                             alignItems={"center"}
                             style={{marginTop:12,paddingLeft:16,paddingRight:16,width:'100%',marginBottom:5}}
                             flexDirection={"row"}>
                              <Typography
                               　color={"text"}
                                font="text02"
                               text={LangUtil.getStringByKey("filter_search_record")}/>
                               <IconButton
                                 text={"text03"}
                                 style={{position:'absolute',right:16}}
                                 onPress={()=>{
                                     let nf = JSON.parse(JSON.stringify(this.props.ccmFilter));
                                     nf.event.searchRecord=[];
                                     this.props.setCcmFilter(nf)
                                 }}
                                 text={LangUtil.getStringByKey("filter_clear_all")}/>
                    </Container>:
                  <Container
                          fullwidth
                          justifyContent="flex-start"
                          alignItems={"center"}
                          style={{marginTop:12,paddingLeft:16,paddingRight:16,width:'100%',marginBottom:5}}
                          flexDirection={"row"}>
                          <Typography
                              color="#A5A5A5"
                              font={"textxs"}
                              text={LangUtil.getStringByKey("common_timezone")+timezone}
                          />
                </Container>}
                {!searchMode||(keyword&&keyword.length>0)?<Container
                    fullwidth
                    onRefresh={async()=> await this.fetchData()}
                    scrollable={filterData.length!=0}
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    onRefresh={()=>this.fetchData()}
                    style={{flex:1,paddingLeft:16,paddingRight:16}}
                    >
                    {filterData.map(function(item,i){
                        return <EventItem
                                 key={i}
                                 keyword={this.state.keyword}
                                 onPress={()=>{
                                   if(!this.open){
                                        this.open = true;
                                        navigation.push(PAGES.EVENT_INSPECT,{event:item,alertRules,monitorRules,userPositions,userDepartments})

                                        setTimeout(function(){
                                            this.open = false;
                                        }.bind(this),2000)

                                   }
                                          }}
                                 data={item}
                                / >
                      }.bind(this))
                    }
                    {filterData.length==0&&!this.state.loading?<Container
                          fullwidth
                          border
                          style={{width:'100%',flex:1,marginTop:20}}>
                            <Icon style={{width:65,height:65}} mode="static" type="illustration-no-data"/>
                            <Typography
                                     style={{marginBottom:7,marginTop:5}}
                                     color="lightgray"
                                     font={"subtitle03"}
                            text={LangUtil.getStringByKey("common_nodata")}/>
                      </Container>:null}
                </Container>:
                <Container
                    fullwidth
                    scrollable={true}
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1,paddingLeft:16,paddingRight:16,marginTop:10}}
                    >
                    {ccmFilter.event.searchRecord?
                      ccmFilter.event.searchRecord.map(function(item,i){
                      return <TouchCard
                              fullwidth
                              justifyContent="flex-start"
                              alignItems={"center"}
                              onPress={()=>this.setState({keyword:item,tempkeyword:item})}
                              style={{width:'100%',height:44}}
                              flexDirection={"row"}>
                              <Icon style={{width:24,height:24,marginRight:6}} mode="static" type="search-item"/>
                              <Typography
                                  color="text"
                                  font={"text01"}
                                  text={item}
                              />
                              <IconButton style={{position:'absolute',right:0}}
                               onPress={()=>{
                                 let nf = JSON.parse(JSON.stringify(this.props.ccmFilter));
                                 if(nf.event.searchRecord){
                                    nf.event.searchRecord.splice(i,1)
                                 }
                                 this.props.setCcmFilter(nf)
                               }}
                               iconStyle={{width:24,height:24}}
                               mode="static" type="clear"/>
                    </TouchCard>
                  }.bind(this)):null
                    }
                </Container>}
             </PageContainer>
              {calendar?<DatePicker
                 onClose={(date)=>this.onDateChanged(date)}
                 ccmFilter={ccmFilter}
              />:null}
              {region?<RegionPicker
                 onClose={(date)=>this.onRegionChanged(date)}
                 ccmFilter={ccmFilter}
                 loginInfo={this.props.loginInfo}
                 storeList={this.props.storeList}
              />:null}
              {store?<StorePicker
                 onClose={(date)=>this.onStoreChanged(date)}
                 ccmFilter={ccmFilter}
                 loginInfo={this.props.loginInfo}
                 storeList={this.props.storeList}
              />:null}
              {sort?<SortPicker
                 onClose={(date)=>this.onSortChanged(date)}
                 mode={"event"}
                 ccmFilter={ccmFilter}
              />:null}
             </View>);
  }
}
const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageEventMgt);
