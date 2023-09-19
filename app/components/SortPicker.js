import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
    KeyboardAvoidingView
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
        OptionContainer,
        SearchInput,
        CheckOption,
        DateInputField,
        Notify,
        RegionSelection,
        NormalButton} from '../../framework'
import {LangUtil,StorageUtil,FilterUtil,COLORS,DimUtil} from '../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,OPTIONS} from  "../define"
import CalendarPicker from 'react-native-calendar-picker';
import moment from "moment"
class BottomNavigation extends Component {
  constructor(props) {
    super(props);
    const {loginInfo,navigation,ccmFilter,mode} = this.props;
    let order = ccmFilter[mode].order?ccmFilter[mode].order:-1;
    let sort = ccmFilter[mode].sort
    let options=[]
    if(mode == "event"){
      OPTIONS.EVENT.forEach((item, i) => {
        options.push({label:LangUtil.getStringByKey(item),id:item})
      });
    }
    else if(mode == "data"){
      OPTIONS.DATA.forEach((item, i) => {
        options.push({label:LangUtil.getStringByKey(item),id:item})
      });
    }
    else if(mode == "device"){
      OPTIONS.DEVICE.forEach((item, i) => {
        options.push({label:LangUtil.getStringByKey(item),id:item})
      });
    }
    else if(mode == "notification"){
      OPTIONS.NOTIFICATION.forEach((item, i) => {
        options.push({label:LangUtil.getStringByKey(item),id:item})
      });
    }

    this.state={
      order,sort,options
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


  }
  onSearch(s){

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
  onCancel(){
    const {loginInfo,navigation,ccmFilter,onClose} = this.props;
    if(onClose)onClose()
  }
  onReset(){
    const {loginInfo,ccmFilter,storeList} = this.props;
    let mode = "event"

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
    this.setState({filterOptions:nf})
  }
  onRemove(id){
    let selected = this.state.selected;
    selected  = selected.filter((value)=>value!=id);
    this.setState({selected})
  }
  onSelectAll(group,ids){
    console.log("onSelectAll",group,ids)
    let selected = this.state.selected;
    selected[group]= ids;
    console.log(selected)
    this.setState({selected})
  }
  onSelect(id){

    this.setState({sort:id})
  }
  getStatus(){
      const {selected,options} = this.state;
      if(selected.length==0){
        return 0;
      }
      else if(selected.length == options.length){
        return 2;
      }
      else{
        return 1;
      }

  }
  onClearAll(){
    this.setState({selected:[]})
  }
  async onSetRegion2(){

     this.setState({region2:false})
  }
  getCount(list){
      let count = 0;
      if(list){
        for(var k in list){
          count += list[k].length;
        }
      }
      return count;
  }
  async onSetRegion2Detail(){
     console.log("onSetRegion2Detail")
     console.log(this.state.selected)
     const {storeList} =this.props;
     const {region2Detail} = this.state;
     let selected = this.state.selected
     let filterOptions = this.state.filterOptions;
     if(!filterOptions.event.region2){
       filterOptions.event.region2 = {}
     }
     filterOptions.event.region2[region2Detail] = selected;
     let rg2Select = [];
     if(this.getCount(filterOptions.event.region2) !=0){
       for(var k in filterOptions.event.region2){
         rg2Select = rg2Select.concat(filterOptions.event.region2[k])
       }
     }
     else{
       filterOptions.event.region2= null
       rg2Select = null;
     }


     let newOptions = FilterUtil.getStoreOptions(storeList,filterOptions.event.region1,rg2Select);
     filterOptions.event.options = newOptions;
     filterOptions.event.store = null
     filterOptions.event.storeName = null;
     for(var k in newOptions.stores){
       //console.log(newOptions.stores[k])
       for(var m in newOptions.stores[k]){
         //console.log(newOptions.stores[k][m])]
         for(var l in newOptions.stores[k][m]){
           //console.log(newOptions.stores[k][m][l])
           filterOptions.event.store = newOptions.stores[k][m][l].id;
           filterOptions.event.storeName = newOptions.stores[k][m][l].label;
         }
         break;
       }
       break;
     }

     this.setState({region2Detail:false,filterOptions})
  }
  async next(){
    const {loginInfo,ccmFilter,storeList,multi,onClose,mode} = this.props;
    const {sort,order} = this.state;
    let filterOptions = JSON.parse(JSON.stringify(ccmFilter))
    filterOptions[mode].sort = sort;
    filterOptions[mode].order= order;
    if(onClose)onClose(filterOptions)


  }
  render(){
    const {loginInfo,navigation,multi} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait");
    let mode = "event"
    const {sort,options,order} =this.state;
    return <Container
      　　　justifyContent="flex-start"
           fullwidth style={{position:'absolute',bottom:0,backgroundColor:"#000000BB",height}}>
           <KeyboardAvoidingView
              keyboardVerticalOffset={-150}
               behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width:'100%', position:'absolute', bottom:0}}>
           <Container 　justifyContent="flex-start"
                  fullwidth style={{height:height-140,
                  borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",padding:16}}>
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
                   text={LangUtil.getStringByKey("filter_sort_mode")}/>
                   <IconButton
                     text={"text03"}
                     style={{position:'absolute',right:0}}
                       onPress={()=>{

                         this.next()
                       }
                     }
                     text={LangUtil.getStringByKey("common_confirm")}/>
                 </Container>
                 <Container fullwidth scrollable style={{width,flex:1,padding:16,paddingTop:0}}>
                 <Container
                   fullwidth
                   style={{height:20,marginBottom:4}}
                   flexDirection="row">
                   <Typography
                      style={{position:'absolute',left:0}}
                    　color={"grayText"}
                     font="text00"
                    text={LangUtil.getStringByKey("filter_sort_logic")}/>
                 </Container>
                 <OptionContainer
                   style={{marginTop:5,marginBottom:20}}
                   selected={order}
                   onSelect={(id)=>this.setState({order:id})}
                   options={
                     [{id:1,label:LangUtil.getStringByKey("filter_sort_asc")},
                      {id:-1,label:LangUtil.getStringByKey("filter_sort_dec")}]
                   }/>
                   <Container
                     fullwidth
                     style={{height:20,marginBottom:4}}
                     flexDirection="row">
                     <Typography
                        style={{position:'absolute',left:0}}
                      　color={"grayText"}
                       font="text00"
                      text={LangUtil.getStringByKey("filter_sort_item")}/>
                   </Container>
                   <OptionContainer
                     style={{marginTop:5,marginBottom:20}}
                     selected={sort}
                     onSelect={(id)=>this.onSelect(id)}
                     options={
                       options
                     }/>
                </Container>
           </Container>
           </KeyboardAvoidingView>
           </Container>
  }


}
export default BottomNavigation;
