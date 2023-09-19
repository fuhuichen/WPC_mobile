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
import {LangUtil,StoreUtil,StorageUtil,StringUtil} from '../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES} from  "../define"
import CcmAPI from "../api/ccm"
import MainAPI from "../api/main"
import moment from 'moment'
import DataMonitorItem from "../components/DataMonitorItem"
import { DeviceEventEmitter} from 'react-native';
import DatePicker from "../components/DatePicker"
import RegionPicker from "../components/RegionPicker"
import StorePicker from "../components/StorePicker"
import SortPicker from "../components/SortPicker"
class PageEventMgt extends Component {
  constructor(props) {
    super(props);
    let unread =  StoreUtil.getSize(props.loginInfo.accountId)
    this.state={
      unread,
      events:[],
      probers:[],
      loading:true,
      timezone:"",
      searchMode:false,
    }
  }

  componentWillUnmount() {

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
    //this.props.setLoading(false);
    this.setState({alertRules,monitorRules,userPositions,userDepartments})
  }
  async componentDidMount() {
    await this.fetchSettings()
    await this.fetchData()
    this.listener = DeviceEventEmitter.addListener("FILTER_CHANGE", async(event)=>{
      console.log("FILTER_CHANG")
      await this.fetchData(event.ccmFilter);
    })
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
    this.setState({probers:[],loading:true})
  //  await this.checkLoginStatus()
    if(!ccmFilter){
      ccmFilter = this.props.ccmFilter;
    }
    const {loginInfo,storeList} = this.props;
    const {event} = ccmFilter ;
    let ids =[];
    this.props.setLoading(true);
    let branchList=[];
    if(ccmFilter.event.store){
      ids = [ccmFilter.event.store]
    }
    else{
      for(var k in storeList){
      //  console.log(storeList[k])
        ids.push(storeList[k].branch_id)
      }
    }

    let result;

      let list =[];
      let probersList=[];
      for(var k in ids){
        let bh = storeList.find(p=>p.branch_id == ids[k])
        this.setState({timezone:bh.contact.time_zone})
        //console.log("Find BH="+bh.contact.time_zone)
      //  console.log("Get Module List")
        let res = await CcmAPI.getMonitorModuleList(ids[k]);
      //  console.log(JSON.stringify(res))
        if(res.status == ERROR_CODE.SUCCESS){
        //  console.log("Find Module")
          for(var i in res.monitor_modules){
            let mm = res.monitor_modules[i];

          //  console.log(mm)
            let defrost = false;
            let alert = false;
        //    console.log("mm.alert_status="+mm.alert_status)
            //if(mm.alert_status == 102){
            //  alert = true;
          //  }
            if(mm.probers.length>0){
              let index = 0;

              mm.probers.forEach((item, i) => {
                console.log(">>>>>>>>>>"+item.name+"Prober Status="+item.prober_status)
            //    console.log("Prober "+item.name)
                //console.log(item)

                if(item.prober_status==26){
                   defrost = true;
                }
                else{
                //  console.log("Prober status="+item.prober_status)

                  item.alert_status.forEach((st, i) => {
                      console.log("Alert Status="+st.status)
                      if(st.status == 102){
                        alert = true;
                      }
                      else if( item.prober_status==20 || item.prober_status==23 || item.prober_status==1){
                          alert = true
                      }
                      else if(st.status == 110 || st.status == 111 || st.status == 112){
                        if( item.prober_status==21 ){
                            alert = true
                        }
                      }
                  });
                }
                console.log("Alert="+alert)
                if(item.order == 1){
                  index = i;
                }
              });
              if(mm.major_prober_id&&mm.major_prober_id!="" ){
                mm.probers.forEach((item, i) => {
                  if(item.prober_id  == mm.major_prober_id){
                    index = i;
                  }
                });
              }
            //  console.log("Result alert ="+alert)
              let prober = mm.probers[index]
              prober.defrost =  defrost;
              prober.alert =  alert;
              prober.mm_status = mm.status;
              prober.mm_alert_status= mm.alert_status;
              prober.mm_name   = mm.mm_name
              prober.mm_id   = mm.mm_id
              prober.time_zone = bh.contact.time_zone
              prober.alert_ids  = mm.alert_ids;
              prober.branch_id = bh.branch_id;
              prober.prober_count = mm.probers.length;
              prober.branch_name = bh.branch_name;
              prober.alert_ids = mm.alert_ids;
              prober.ts = "9999"
              if(prober.last_data && prober.last_data.timestamp){
                prober.ts = moment ( new Date(prober.last_data.timestamp*1000)).utc().format("YYYY/MM/DD HH:mm")
              }
              let sensors = [];

              mm.probers.forEach((item, i) => {
                item.sensor_ids.forEach((sen, i) => {
                    if(!sensors.find(p=>p==sen)){
                      sensors.push(sen)
                    }
                });

                if(item.last_data && item.last_data.timestamp){
                  if(!prober.maxts || prober.maxts<  item.last_data.timestamp){
                    prober.maxts= item.last_data.timestamp
                  }
                  if(!prober.mints || prober.mints >  item.last_data.timestamp){
                    prober.mints = item.last_data.timestamp
                  }
                }
              });
              prober.sensors = sensors;
              if(prober.mm_status<70){
                probersList.push(prober);
              }

            }



          }
        }

      }
      let order = ccmFilter.data.order?ccmFilter.data.order:-1;
      //["data_last_timestamp","filter_location","ccm_module_name","ccm_unit_name","event_info_montiror_status","event_running_status"],
      switch(ccmFilter.data.sort ){
        case "ccm_module_name":
          probersList = probersList.sort(function(a,b){
            return order*a.mm_name.localeCompare(b.mm_name)
          })
          break;
        case "ccm_unit_name":
            probersList = probersList.sort(function(a,b){
                return order*a.prober_name.localeCompare(b.prober_name)
            })
            break;
        case "filter_location":
            probersList = probersList.sort(function(a,b){
                return order*a.branch_name.localeCompare(b.branch_name)
            })
            break;
        case "event_running_status":
            probersList = probersList.sort(function(a,b){
                  return order*(a.prober_status -b.prober_status);
            })
            break;
        case "event_info_montiror_status":
                probersList = probersList.sort(function(a,b){
                      return order*(a.mm_status -b.mm_status);
                })
            break;
        default:
           probersList = probersList.sort(function(a,b){
            if(b.last_data && b.last_data.timestamp && a.last_data&& a.last_data.timestamp ){
              console.log(b.last_data.timestamp,a.last_data.timestamp)
              console.log("order="+order*(a.last_data.timestamp -b.last_data.timestamp))
              return order*(a.last_data.timestamp -b.last_data.timestamp);
            }
            else if(a.last_data && a.last_data.timestamp){
            //  console.log("Only A exist")
              return -1;
            }
            else{
            //  console.log("B exist")
              return 1
            }

          })

      }
      this.setState({probers:probersList,loading:false})

    this.props.setLoading(false);

  }

  openFilter(){

     const {ccmFilter,navigation} = this.props;

     if(!this.open){
          this.open = true;
          let newFilter = JSON.parse(JSON.stringify(ccmFilter));
         // newFilter.cache.event = JSON.parse(JSON.stringify(ccmFilter.event));
          newFilter.cache.data = JSON.parse(JSON.stringify(ccmFilter.data));
          this.props.setCcmFilter(newFilter)
          navigation.push(PAGES.FILTER_MAIN,{mode:'data'})
          setTimeout(function(){
              this.open = false;
          }.bind(this),1000)

     }

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
  onTempSearch(t){
    console.log("On Search "+t)
    this.setState({tempkeyword:t})
  }
  onSearch(t){
    console.log("On Search "+this.state.tempkeyword)
    this.setState({keyword:this.state.tempkeyword})
  }
  render(){
    const {loginInfo,navigation,storeList,ccmFilter} = this.props;
    const {events,keyword,alertRules,monitorRules,probers,
      userPositions,userDepartments,calendar,region,store,sort,searchMode} = this.state;

    let filterData = probers;
    if(keyword && keyword.length>0){
        filterData  =[];
        for(var k in probers){
          if(probers[k].mm_name.indexOf(keyword)>=0
              || probers[k].name.indexOf(keyword)>=0 ){
                  filterData.push(probers[k])
              }
        }

    }
    console.log(ccmFilter.event.searchRecord)
    return (  <View><PageContainer
                bottom={CCMFUNCTIONS}
                hasStore={true}
                routeName={PAGES.DATA_ANALYSIS}
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
                  }}
                  text={LangUtil.getStringByKey("function_data_analysis")}
                  rightIcon={searchMode?"":(ccmFilter.event.region1||ccmFilter.event.region2)?"header-filteractive":"header-filter" }
                  onRightPressed={()=>{
                    if(searchMode)return
                    let newFilter = JSON.parse(JSON.stringify(ccmFilter));
                    newFilter.cache.event = JSON.parse(JSON.stringify(ccmFilter.event));
                    this.props.setCcmFilter(newFilter)
                    this.setState({region:true})}}
                  text={LangUtil.getStringByKey("function_data_analysis")}
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
                  </Container>
                  :<Container
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
                      {type:LangUtil.getStringByKey("hint_status_desc"),
                        mode:'detail',
                        title:LangUtil.getStringByKey("event_info_montiror_status"),
                       list:[
                         {type:'detail',
                          color:'#8EA473',
                          subtitle:LangUtil.getStringByKey( "hint_unit_subtitle"),
                        　title:LangUtil.getStringByKey("monitor_status_running"),
                        　titleColor:'white',
                          subtitleColor:'#E3E3E3',
                          icon:"illustration-in-card-activation-control-activate",
                          list:[
                            {
                               　color:'#8EA473',
                              　title:LangUtil.getStringByKey("monitor_status_normal"),
                                icon:"illustration-station-status-normal",
                                desc:'hint_desc_module_normal',
                                list:[
                                  {title:LangUtil.getStringByKey("monitor_status_normal"),
                                  desc:'hint_desc_unit_normal',
                                    icon:"illustration-unit-status-normal"},
                                // {title:LangUtil.getStringByKey("data_trend_sample_stop_running"),
                                //     desc:'hint_desc_unit_stoprunning',
                              //      icon:"illustration-unit-status-stop-running"},
                                ]
                            },
                            {
                               color:'#CA4940',
                               title:LangUtil.getStringByKey("monitor_status_abnormal"),
                                 icon:"illustration-station-status-error",
                                 desc:'hint_desc_module_abnormal',
                                list:[
                                  {title:LangUtil.getStringByKey("monitor_status_abnormal"),
                                      desc:'hint_desc_unit_abnormal',
                                    icon:"illustration-unit-status-error"},
                                 {title:LangUtil.getStringByKey("monitor_status_unbound"),
                                     desc:'hint_desc_unit_unbind',
                                    icon:"illustration-unit-status-unbind"},
                                　{title:LangUtil.getStringByKey("monitor_status_nodata"),
                                 desc:'hint_desc_unit_nodata',
                                       icon:"illustration-unit-status-no-data"},
                                  {title:LangUtil.getStringByKey("monitor_status_offline"),
                                   desc:'hint_desc_unit_offline',
                                      icon:"illustration-unit-status-offline"},
                                ]
                            },
                            {
                                color:'#2FA8FF',
                                title:LangUtil.getStringByKey("monitor_status_defrosting"),
                                 icon:"illustration-station-status-defrost",
                                 desc:'hint_desc_module_defrost',
                                list:[
                                  {title:LangUtil.getStringByKey("monitor_status_defrosting"),
                                   desc:'hint_desc_unit_defrost',
                                    icon:"illustration-unit-status-defrost"},
                                ]
                            },
                          ]
                        　},
                         {type:'detail',
                          color:'#D5B142',
                          titleColor:'white',
                          subtitleColor:'#E3E3E3',
                          title:LangUtil.getStringByKey("monitor_status_pause"),
                          subtitle:LangUtil.getStringByKey( "hint_unit_subtitle"),
                          icon:"illustration-in-card-activation-control-pause",
                         list:[
                           {
                              　color:'#D5B142',
                             　title:LangUtil.getStringByKey("monitor_status_pause"),
                               icon:"illustration-station-status-pause",
                               desc:'hint_desc_module_pause',
                               list:[
                                 {title:LangUtil.getStringByKey("monitor_status_pause"),
                                  desc:'hint_desc_unit_pause',
                                   icon:"illustration-unit-status-pause"},
                               ]
                           }
                            ]

                          },
                         {type:'detail',
                         color:'#6E6E6E',
                         titleColor:'white',
                         subtitleColor:'#E3E3E3',
                         title:LangUtil.getStringByKey("monitor_status_stop"),
                         subtitle:LangUtil.getStringByKey( "hint_unit_subtitle"),
                         icon:"illustration-in-card-activation-control-stop",
                         list:[
                           {
                              　color:'#6E6E6E',
                             　title:LangUtil.getStringByKey("monitor_status_stop"),
                               icon:"illustration-station-status-stop",
                               desc:'hint_desc_module_stop',
                               list:[
                                 {title:LangUtil.getStringByKey("monitor_status_stop"),
                                  desc:'hint_desc_unit_stop',
                                   icon:"illustration-unit-status-stop"},
                               ]
                           }
                            ]
                         },
                         {type:'detail',
                          color:'#CECECE',
                          titleColor:'#2B2B2B',
                           subtitleColor:'#7D7D7D',
                           title:LangUtil.getStringByKey("monitor_status_delete"),
                           subtitle:LangUtil.getStringByKey ("hint_unit_subtitle"),
                           icon:"illustration-in-card-activation-control-delete",
                           list:[
                             {
                                　color:'#6E6E6E',
                               　title:LangUtil.getStringByKey("monitor_status_delete"),
                                 icon:"illustration-station-status-delete",
                                 desc:'hint_desc_module_delete',
                                 list:[
                                   {title:LangUtil.getStringByKey("monitor_status_delete"),
                                    desc:'hint_desc_unit_delete',
                                     icon:"illustration-unit-status-delete"},
                                 ]
                             }
                              ]
                          },
                          ]
                      },
                      {type:LangUtil.getStringByKey("hint_graphic_desc"),
                        title:LangUtil.getStringByKey("common_trend_sample"),
                       list:[
                         {title:LangUtil.getStringByKey("monitor_status_normal"),icon:"illustration-dashboard-legend-normal"},
                         {title:LangUtil.getStringByKey("monitor_status_abnormal"),icon:"illustration-dashboard-legend-error"},
                         {title:LangUtil.getStringByKey("data_trend_sample_pause_running"),icon:"illustration-dashboard-legend-pause"},
                         {title:LangUtil.getStringByKey("data_trend_sample_frozen"),icon:"illustration-dashboard-legend-smart"},
                        // {title:LangUtil.getStringByKey("data_trend_sample_stop_running"),icon:"illustration-dashboard-legend-stop"},
                        ]
                      }
                    ]
                  }})}
                      text={""}
                      type={"action-info"}
                      mode={"static"}
                      iconStyle={{width:24,height:24}}
                      style={{marginRight:0}}/>
                </Container>}
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
                          style={{marginTop:1,paddingLeft:16,paddingRight:16,width:'100%',marginBottom:5}}
                          flexDirection={"row"}>
                          <Typography
                              color="#A5A5A5"
                              font={"textxs"}
                              text={LangUtil.getStringByKey("common_timezone")+this.state.timezone}
                          />
                </Container>}
                {!searchMode||(keyword&&keyword.length>0)?<Container
                    fullwidth
                    scrollable={filterData.length!=0}
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    onRefresh={async()=> await this.fetchData()}
                    style={{flex:1,paddingLeft:16,paddingRight:16}}
                    >
                    {filterData.map(function(item,i){
                        return <DataMonitorItem
                                 key={i}
                                 keyword={this.state.keyword}
                                 onPress={()=>{
                                   if(!this.open){
                                        this.open = true;
                                        navigation.push(PAGES.DATA_MONITOR,{prober:item,alertRules,monitorRules,userPositions,userDepartments})
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
                          style={{flex:1,marginTop:20}}>
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
                mode={"data"}
                ccmFilter={ccmFilter}
             />:null}
            </View>);
  }
}
const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageEventMgt);
