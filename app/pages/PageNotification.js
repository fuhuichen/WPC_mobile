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
        OptionContainer,
        NormalButton} from '../../framework'
import {LangUtil,StoreUtil,StorageUtil,DimUtil,StringUtil} from '../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS} from  "../define"
import CcmAPI from "../api/ccm"
import MainAPI from "../api/main"
import NotificationItem from "../components/NotificationItem"
import { DeviceEventEmitter} from 'react-native';
import moment from 'moment'
import DatePicker from "../components/DatePicker"
import RegionPicker from "../components/RegionPicker"
import StorePicker from "../components/StorePicker"
import SortPicker from "../components/SortPicker"
class PageNotification extends Component {
  constructor(props) {
    super(props);
    this.state={
      events:[],unreads:[],loading:false,probersList:{},
    }
  }

  componentWillUnmount() {

  }
  async fetchSettings(){
    const {ccmFilter} = this.props;
    console.log("PageNotification: Fetch Setting ")
    this.props.setLoading(true);
    let result;
    let alertRules = [];
    let monitorRules = [];
    let userPositions = [];
    let userDepartments = [];
    if(ccmFilter.userPositions){
      alertRules = ccmFilter.alertRules
      userPositions = ccmFilter.userPositions
      userDepartments = ccmFilter.userDepartments
      monitorRules = ccmFilter.monitorRules
    }
    else{
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
    }
    console.log("PageNotification: Fetch Setting Finish")
    await this.setState({alertRules,monitorRules,userPositions,userDepartments})
  }
  async componentDidMount() {
    const {loginInfo,navigation,route,ccmFilter,storeList} = this.props;
    const {notify} = route.params;
    StoreUtil.init();
    await this.fetchSettings()
    let probersList = await this.fetchData()
    /*
    this.listener = DeviceEventEmitter.addListener("FILTER_CHANGE_NOTIFY", async(event)=>{
      console.log("CCM Filter Change")
      if(event&&event.ccmFilter){
        await this.fetchData(event&&event.ccmFilter?event.ccmFilter:null);
      }
    })
    */
    this.listener = DeviceEventEmitter.addListener("FILTER_CHANGE", async(event)=>{
      console.log("Event filter change")
      await this.fetchData(event?event.ccmFilter:null);
    })
    if(notify){
      let item = notify;
      let  ts = parseInt(item.data.ts);
      let  date = moment ( new Date(ts*1000)).format("YYYY-MM-DD HH:mm:ss")
      let stores  = JSON.parse(item.data.stores)
      let bh ;
      if(stores[0] && stores[0].id){
          bh = storeList.find(p=>p.branch_id ==stores[0].id)
      }

      let ev = {
           isNotify:true,
           acc_id:item.data.acc_id,
           event_id:item.data.event_id,
           product_name: "Custom_iQM_ColdChain",
           service_name:item.data.service_name,
           notify: JSON.parse(item.data.notify),
           sources:JSON.parse(item.data.sources),
           stores:stores[0]?stores[0].id:"",
           origin:{read:false},
           date:date,
           time_zone:bh? bh.contact.time_zone:"",
           ts:ts}
           let pbId = ev.sources[0]? ev.sources[0].id:"";
        //   console.log("PBID = " +pbId)
           ev.target_id = pbId;
           if(probersList[pbId]){
             //console.log(probersList[pbId])
           //  console.log(probersList[pbId])
             ev.alert_ids = probersList[pbId].alert_ids;
             ev.prober_name = probersList[pbId].name;
             ev.mm_name = probersList[pbId].mm_name;
             ev.mm_id = probersList[pbId].mm_id;
             ev.branch_name = probersList[pbId].branch_name;
             ev.mm_status= probersList[pbId].mm_status;
             ev.time_zone= probersList[pbId].time_zone;
             ev.monitor_rule_ids = probersList[pbId].monitor_rule_ids;
           }
    //  console.log(ev)
      await this.onItemClick(ev)
      /*
      let find =false;
      console.log("Get Notify")
      console.log(notify)
      console.log("To find event id = "+notify.data.event_id)
      for(var k in events){
        console.log(events[k].event_id)
        if(events[k].event_id == notify.data.event_id){
          console.log("Real find id /code=" +events[k].notify.code )
          await StorageUtil.setObj("OpenNotify","FALSE")
          find =true;
          await this.onItemClick(events[k])
          break;
        }
      }
      */
      await StorageUtil.setObj("OpenNotify","FALSE")
      //if(!find){
      //    DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_event_not_exist"),type:'error'})
    //  }
    }


  }
  componentWillUnmount(){
    if(this.listener){
      DeviceEventEmitter.removeSubscription(this.listener)
    }
  }
  async fetchData(ccmFilter){
    this.props.setLoading(true);
    console.log("PageNotification: Fetch Data")
    if(!ccmFilter){
      ccmFilter = this.props.ccmFilter;
    }

    const {loginInfo,storeList} = this.props;

    let stime;
    let list =[];
    if(loginInfo && loginInfo.lastNotificaton ){
       stime = loginInfo.lastNotificaton;
    }
    else{
      let d = new Date();
      d.setMonth(d.getMonth()-1)
      stime= moment(d).format("YYYY-MM-DD 00:00:00")
    }
    this.setState({events:[],unreads:[],loading:true})
    let evResult = await MainAPI.getEventList({starttime:stime})
    //console.log(evResult)
    if(evResult.status == ERROR_CODE.SUCCESS && evResult.events ){
      let list=[];
      evResult.events.forEach((item, i) => {
         console.log(JSON.stringify(item))
         if(!item.target_info.ways || item.target_info.ways.find(p=>p=="app")){
           list.push({
             acc_id:item.src.acc_id,
             event_id:item.src.event_id,
             product_name: item.sender,
             service_name:item.notify_info.service_name,
             notify: JSON.stringify(item.notify_info.notify),
             sources: JSON.stringify(item.src.sources),
             stores:item.src.store_id&&item.src.store_id.length>0?item.src.store_id: item.src.store_ids[0]? item.src.store_ids[0]:"",
             date:item.status.ts,
             ts:item.notify_info&&item.notify_info.notify?item.notify_info.notify.ts:0,
           })
         }
     });
     //console.log("Get New Notification Length="+list.length + " at time="+stime)
     console.log("Add Event lenth =" +list.length)
     if(list.length>0){
        await StoreUtil.save(list)
     }
   }
   let info  = JSON.parse(JSON.stringify(loginInfo))
    info.lastNotificaton = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    this.props.setLoginInfo(info)

    const {event} = ccmFilter ;
    let ids =[];
    let events = [];

      console.log("Find Probers")
    if(ccmFilter.notification.store){
      for(var k in ccmFilter.notification.store){
        ids = ids.concat(ccmFilter.notification.store[k])
      }
      console.log("Store IDS=",ids)
    }
    else{
      for(var k in storeList){
        //console.log(storeList[k])
        ids.push(storeList[k].branch_id)
      }
    }

    let probersList={};

    for(var k in ids){
      let bh = storeList.find(p=>p.branch_id == ids[k])
      //console.log("Notification ="+bh)
      //console.log("Find BH="+bh.contact.time_zone)
      let res = await CcmAPI.getMonitorModuleList(ids[k]);
      if(res.status == ERROR_CODE.SUCCESS){
        for(var i in res.monitor_modules){
          let mm = res.monitor_modules[i];
          //console.log("mm")
          //console.log("MM_ID="+mm.mm_id);
          for(var j in mm.probers){

            let prober = mm.probers[j]
            //console.log("FInd prober "+prober.prober_id)
            prober.branch_name = bh.branch_name;
            prober.mm_status = mm.status;
            prober.mm_name   = mm.mm_name
            prober.mm_id   = mm.mm_id
            prober.time_zone = bh.contact.time_zone
            prober.alert_ids  = mm.alert_ids;
            probersList[prober.prober_id] = prober;
          }
        }
      }
    }


    console.log("FIlter Data")
    let starttime = moment(new Date(ccmFilter.notification.startTime)).format("YYYY-MM-DD 00:00:00")
    let endtime = moment(new Date(ccmFilter.notification.endTime)).format("YYYY-MM-DD 23:59:59")
    let datas = StoreUtil.getAll(loginInfo.accountId)
  //  datas[0].read = true;
    datas.forEach((item, i) => {
    //  if(item.date.localeCompare(starttime)>=0 && item.date.localeCompare(endtime)<0
      //  && ids.indexOf(item.stores)>=0){
        let ev = {
          origin:JSON.parse(JSON.stringify(item)),
          ts:item.ts,
          date:item.date,
          read:item.read,
          acc_id: item.acc_id,
          event_id : item.event_id,
          store_id : item.stores,
          sources :JSON.parse(item.sources),
          notify: JSON.parse(item.notify)}

        let pbId = ev.sources[0].id;
        ev.target_id = pbId;
        if(probersList[pbId]){
        //  console.log(probersList[pbId])
          ev.alert_ids = probersList[pbId].alert_ids;
          ev.prober_name = probersList[pbId].name;
          ev.mm_name = probersList[pbId].mm_name;
          ev.mm_id = probersList[pbId].mm_id;
          ev.branch_name = probersList[pbId].branch_name;
          ev.mm_status= probersList[pbId].mm_status;
          ev.time_zone= probersList[pbId].time_zone;
          ev.monitor_rule_ids = probersList[pbId].monitor_rule_ids;
          ev.notify.msg =ev.notify.msg .replace("<freezer_name>",ev.mm_name)
        }
        let bh = storeList.find(p=>p.branch_id ==item.stores)
        if(bh){
          ev.branch_name = bh.branch_name;
          ev.time_zone = bh.contact.time_zone;
          ev.branch_id = bh.branch_id;
        }
        if(ev.notify.code >0){
            events.push(ev)
        }



    //  }

    });

    console.log("Sort Type="+ccmFilter.notification.sort + " order="+ccmFilter.notification.order)
    let order = ccmFilter.notification.order?ccmFilter.notification.order:-1;

    switch(ccmFilter.notification.sort ){
      case "filter_sort_date_asc":
        events = events.sort(function(a,b){
          return a.date.localeCompare(b.date)
      })
        break;
      case "filter_location":
          events = events.sort(function(a,b){
            return a.branch_name.localeCompare(b.branch_name)
            //return b.branch_name -a.branch_name;
          })
          break;
      case "filter_sort_unread":
          events = events.sort(function(a,b){
                return a.read -b.read;
          })
          break;
      default:
        events = events.sort(function(a,b){
          return order*a.date.localeCompare(b.date)
        })

    }
    let unreads = [];
    //["filter_sort_date_desc","filter_sort_date_asc","filter_location","filter_sort_unread"]
    this.setState({events:events,unreads,loading:false,probersList})
    this.props.setLoading(false);
    return probersList;

  }

  openFilter(){

     const {ccmFilter,navigation} = this.props;

     if(!this.open){
          this.open = true;
          let newFilter = JSON.parse(JSON.stringify(ccmFilter));
          newFilter.cache.notification = JSON.parse(JSON.stringify(ccmFilter.notification));
          this.props.setCcmFilter(newFilter)
          navigation.push(PAGES.FILTER_MAIN,{mode:'notification'})
          setTimeout(function(){
              this.open = false;
          }.bind(this),1000)

     }

  }
  onRead(item){

  }
  onSearch(t){
    this.setState({keyword:t})
  }
  onRemoveAll(){
    const {loginInfo,navigation} = this.props;
    StoreUtil.clear()
    this.setState({events:[],unreads:[]})
  }
  async onItemClick(item){
    const {loginInfo,navigation,storeList} = this.props;
    const {events,keyword,alertRules,monitorRules,userPositions,userDepartments} = this.state;
    console.log("OnItemClick "+item.notify.code)
    console.log(item)
    if(this.open)return;
    this.open = true;
  //  console.log({alertRules,monitorRules,userPositions,userDepartments})
     if(!item.isNotify){
       item.origin.read = true;
       item.read = true;
       await StoreUtil.save([item.origin])
     }

    if(item.notify.code == 122){
      let nf = JSON.parse(JSON.stringify(this.props.ccmFilter))
       console.log("Item Click Store="+item.stores );
       let storeId = item.store_id?item.store_id: item.stores
       let r = await CcmAPI.getAlertInfo(item.event_id);
       console.log(r)
       let bh = storeList.find(p=>p.branch_id == storeId)

       if(bh){
         nf.event.store = storeId;
         nf.event.storeName = bh.branch_name
        console.log("Find store="+bh.branch_name)
       }
       this.props.setCcmFilter(nf)
       navigation.replace(PAGES.DEVICE_MANAGE,{})
    }
    else if(item.notify.code == 1211){
    //  console.log(item)
      console.log("GEt ALert info")
      let r = await CcmAPI.getAlertInfo(item.event_id);
      let ev ={};
      console.log(r)
      if(r.status == ERROR_CODE.SUCCESS &&  r.alert_trigger &&  r.alert_trigger.alert_id){
        ev = r.alert_trigger;
      }
      else{
        console.log("Not find events info")
        DeviceEventEmitter.emit("TOAST",{text:LangUtil.getStringByKey("toast_event_not_exist"),type:'error'})
        this.open = false
        return;
      }
      item.timestamp ={
        event:ev.event_time
      }
      item.monitor_rule = ev.monitor_rule;
      //console.log(ev)
      item.alert_id = ev.alert_id
      //console.log(alertRules,monitorRules,userPositions,userDepartments)
      //navigation.pop(1)
      navigation.push(PAGES.EVENT_INSPECT,{event:item,alertRules,monitorRules,userPositions,userDepartments})

    }
    setTimeout(function(){
        this.open = false;
    }.bind(this),2500)
  }
  onDateChanged(data){
     //console.log(data)
     if(data){
       const {ccmFilter } = this.props;
       let newFilter = JSON.parse(JSON.stringify(ccmFilter));
       newFilter.notification.startTime = data.startTime;
       newFilter.notification.endTime = data.endTime;
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
  async onReadAll(){
    let unreads = this.state.events;
    let list = [];
    unreads.forEach((item, i) => {
      item.origin.read = true;
      item.read = true;
      list.push(item.origin)
    });
    await StoreUtil.save(list)
    await this.fetchData()
  }
  async editFun(id){
    console.log(id)
    this.setState({openEdit:false})
    if(id == 1){
      await this.onReadAll()
    }
    else{
      await this.onRemoveAll()
    }
  }
  render(){
    const {loginInfo,navigation,ccmFilter,storeList} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait")
    const {events,unreads,keyword,alertRules,monitorRules,userPositions,userDepartments
    ,calendar,region,store,sort,searchMode,tempkeyword,openEdit} = this.state;
    const {event,notification} = ccmFilter ;
    let filterData = events;
    let startTime = moment(new Date(notification.startTime)).format("YYYY/MM/DD" )
    let endTime = moment(new Date(notification.endTime)).format("YYYY/MM/DD" )
    let timezone =""
    if(events[0]){
      timezone=events[0].time_zone
    }

    let sName = ""//StringUtil.getFixedLenName(this.props.ccmFilter.event.storeName,8);
    //console.log("DataLe="+filterData.length)
    let ids = [];
    if(keyword && keyword.length>0){
        filterData  =[];
        for(var k in events){
          if( (events[k].branch_name && events[k].branch_name.indexOf(keyword)>=0)
              || (events[k].notify && events[k].notify.msg && events[k].notify.msg.indexOf(keyword)>=0) ){
                  filterData.push(events[k])
              }
        }

    }
    /*
    if(ccmFilter.notification.store){
      console.log( ccmFilter.notification.store)
      for(var k in ccmFilter.notification.store){
        ids = ids.concat(ccmFilter.notification.store[k])
      }
      console.log("Store IDS=",ids)
      if(ids.length==1){
          let bh = storeList.find(p=>p.branch_id ==ids[0])
          sName = StringUtil.getFixedLenName(bh?bh.branch_name:"",8);
      }
      else if(ids.length>1){
         sName = LangUtil.getStringByKey("location_selected").replace("{1}",ids.length)
      }
    }
    else{
      let len  = this.props.storeList.length;
      sName = LangUtil.getStringByKey("location_selected").replace("{1}",len)
    }
    */
    return (<View><PageContainer
                navigation={this.props.navigation}
                style={{paddingLeft:0,paddingRight:0}}
                isHeader={true}>
                <Header
                  leftIcon={"header-back"}
                  onLeftPressed={()=>{navigation.pop(1)}}
                  text={LangUtil.getStringByKey("common_notification")}
                  rightIcon={"edit-white"}
                  onRightPressed={async()=>{this.setState({openEdit:true})}}
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
               </Container>:null}
              {!searchMode||(keyword&&keyword.length>0)?  <Container
                    fullwidth
                    scrollable={filterData.length>0}
                    onRefresh={async()=>await this.fetchData()}
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1,marginTop:0,width:'100%',marginBottom:20,borderRadius:8,
                    paddingLeft:16,paddingRight:16,marginBottom:30}}>
                    {filterData.map(function(item,i){
                        return <NotificationItem
                                 key={i}
                                 style={[{marginBottom:1},
                                 i==0?{borderTopLeftRadius:8,borderTopRightRadius:8}:i==filterData.length-1?
                                   {borderBottomLeftRadius:8,borderBottomRightRadius:8}:null
                                 ]}
                                 onPress={async()=>{
                                    this.onItemClick(item)
                                  }}
                                 data={item}
                                / >
                      }.bind(this))
                    }
                    {filterData.length==0 && !this.state.loading?<Container
                          fullwidth
                          border
                          style={{flex:1,marginTop:0}}>
                            <Icon style={{width:65,height:65}} mode="static" type="illustration-no-data"/>
                            <Typography
                                     style={{marginBottom:7,marginTop:5}}
                                     color="lightgray"
                                     font={"subtitle03"}
                            text={LangUtil.getStringByKey("common_nodata")}/>
                      </Container>:null}
                </Container>:<Container
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
                  mode={"notification"}
                  ccmFilter={ccmFilter}
               />:null}
               {store?<StorePicker
                  onClose={(date)=>this.onStoreChanged(date)}
                  ccmFilter={ccmFilter}
                  multi={true}
                  loginInfo={this.props.loginInfo}
                  storeList={this.props.storeList}
               />:null}
               {sort?<SortPicker
                  onClose={(date)=>this.onSortChanged(date)}
                  mode={"notification"}
                  ccmFilter={ccmFilter}
               />:null}
              {openEdit? <TouchCard
                      onPress={()=>this.setState({openEdit:false})}
                 　　　justifyContent="flex-start"
                      fullwidth style={{position:'absolute',bottom:0,backgroundColor:"#000000BB",height}}>
                      <Container 　justifyContent="flex-start"
                             fullwidth style={{height:220,position:'absolute',bottom:0,
                             borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",padding:16}}>
                            <Container
                              fullwidth
                              style={{height:20,marginBottom:20}}
                              flexDirection="row">
                             <Typography
                              　color={"text"}
                               font="text02"
                              text={LangUtil.getStringByKey("notification_edit")}/>
                            </Container>
                            <Container fullwidth scrollable style={{width,flex:1,padding:16,paddingTop:0}}>
                            <OptionContainer
                              style={{marginTop:5,marginBottom:20}}
                              selected={null}
                              onSelect={async(id)=>await this.editFun(id)}
                              options={
                                [{id:1,label:LangUtil.getStringByKey("notification_read_all")},
                                 {id:-1,label:LangUtil.getStringByKey("notification_clear_all")}]
                              }/>
                           </Container>
                      </Container>
              </TouchCard>:null}
               </View>);
  }
}
const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter,storeList:state.storeList,loading:state.loading};
};
export default connect(mapStateToProps, actions)(PageNotification);
