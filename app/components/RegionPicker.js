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
    const {loginInfo,navigation,ccmFilter} = this.props;
    let options=[]
    const {mode} = "event"
    let filterOptions = JSON.parse(JSON.stringify(ccmFilter))

    this.state={
      filterOptions,
      showCalendar:false,
      edit:false,
      inputStartDate:'',
      inputEndDate:'',
      notify:null,
      region1:false,
      region2:false,
      selected:[],options:[],
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
    this.setState({keyword:s})
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
    this.setState({filterOptions:filter})
  }
  onRemove(id){
    let selected = this.state.selected;
    selected  = selected.filter((value)=>value!=id);
    this.setState({selected})
  }
  onSelect(id){
    let selected = this.state.selected;
    if(selected.indexOf(id)<0){
      selected.push(id)
    }
    else{
      selected  = selected.filter((value)=>value!=id);
    }
    this.setState({selected})
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
  onSelectAll(){
    const {options,keyword} = this.state;
    let selected = [];
    for(var k in options){
      if(keyword&&keyword.length>0){
        if(options[k].label.indexOf(keyword)>=0){
            selected.push(options[k].id)
        }
      }
      else{
          selected.push(options[k].id)
      }

    }
    this.setState({selected})
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
  async onSetRegion1(){
    const {loginInfo,storeList} = this.props;
    const {filterOptions} = this.state;
    let mode = "event"
    const {options} =this.state;
    let selected = this.state.selected;
    if(selected.length==0){
      selected = null;
    }
    let nf = this.state.filterOptions
    filterOptions.event.region1 = selected;
    filterOptions.event.region2 = null;
    console.log(storeList)
    let newOptions = FilterUtil.getStoreOptions(storeList,selected,null);
    console.log(newOptions)
    filterOptions.event.options = newOptions
    filterOptions.event.store = null
    filterOptions.event.storeName = null;
    if(mode != "notification"){
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

    }
    this.setState({region1:false,filterOptions})

  }
  renderRegion2(){
    if(this.state.region2Detail){
      return this.renderRegion2Detail()
    }
    const {loginInfo,navigation} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait");
    let mode = "event"
    const {showCalendar,tempStartDate,tempEndDate,edit,region1,region2} =this.state;
    const {options,selected,keyword,filterMode,filterOptions} =this.state;
    let count = selected.length>99?"N":selected.length;
    let filterOption = options;
    let selectedOptions = [];
    if(keyword && keyword.length>0){
      filterOption = [];
      for(var k in options){
        if(options[k].label.indexOf(keyword)>=0){
          filterOption.push(options[k])
        }
      }
    }
    for(var k in options){
      if(selected.indexOf(options[k].label)>=0){
        selectedOptions.push(options[k])
      }
    }
    let regionOptions = filterOptions.event.region1?filterOptions.event.region1:filterOptions.event.options.region1;
    return <Container
      　　　justifyContent="flex-start"
           fullwidth style={{position:'absolute',top:0,backgroundColor:"#000000BB",paddingBottom:20,height}}>
           <Container 　justifyContent="flex-start"
                  fullwidth style={{height:height-47, position:'absolute', top:47,
                  borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",padding:16}}>
                 <Container
                   fullwidth
                   style={{height:20,marginBottom:20}}
                   flexDirection="row">
                   <IconButton
                     text={"text03"}
                     style={{position:'absolute',left:0}}
                     mode="static"
                     type="back"
                     iconStyle={{width:24,height:24}}
                     onPress={()=>this.onSetRegion2()}
                     text={""}/>
                  <Typography
                   　color={"text"}
                     font="text02"
                　   text={LangUtil.getStringByKey("filter_region2")}/>
                 </Container>
                 <Container
                   scrollable
                   fullwidth>
                   {regionOptions.map(function(item,i){
                      return <RegionSelection
                              style={[{marginBottom:2,borderRadius:0, width:width-32,
                                    borderRadius:0},i==0?{borderTopLeftRadius:8,borderTopRightRadius:8}:null,
                                      i==regionOptions.length-1?{borderBottomLeftRadius:8,borderBottomRightRadius:8}:null]}
                              text={item}
                              value={filterOptions.event.region2?filterOptions.event.region2[item]?filterOptions.event.region2[item]:[]:null}
                              onPress={async()=>{
                                    let selected  =filterOptions.event.region2&&filterOptions.event.region2[item]?filterOptions.event.region2[item]:[];
                                    let options   = filterOptions.event.options.region2[item];
                                    console.log({selected,region2Detail:item,options})
                                    this.setState({selected,region2Detail:item,options})

                                }
                              }
                              hint={""}/>
                   }.bind(this))}
               </Container>
           </Container>
           </Container>

  }
  renderRegion2Detail(){
    const {loginInfo,navigation} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait");
    let mode = "event"
    const {showCalendar,tempStartDate,tempEndDate,edit,region1,region2} =this.state;
    const {options,selected,keyword,filterMode,filterOptions} =this.state;
    let count = selected.length>99?"N":selected.length;
    let filterOption = options;
    let selectedOptions = [];
    if(keyword && keyword.length>0){
      filterOption = [];
      for(var k in options){
        if(options[k].label.indexOf(keyword)>=0){
          filterOption.push(options[k])
        }
      }
    }
    for(var k in options){
      if(selected.indexOf(options[k].label)>=0){
        selectedOptions.push(options[k])
      }
    }

    return <Container
      　　　justifyContent="flex-start"
           fullwidth style={{position:'absolute',top:0,paddingBottom:20,backgroundColor:"#000000BB",height}}>
           <Container 　justifyContent="flex-start"
                  fullwidth style={{height:height-47, position:'absolute',top:47,
                  borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",padding:16}}>
                 <Container
                   fullwidth
                   style={{height:20,marginBottom:20}}
                   flexDirection="row">
                   <IconButton
                     text={"text03"}
                     style={{position:'absolute',left:0}}
                     mode="static"
                     type="back"
                     iconStyle={{width:24,height:24}}
                     onPress={()=>this.onSetRegion2Detail()}
                     text={""}/>
                  <Typography
                   　color={"text"}
                     font="text02"
                　   text={this.state.region2Detail}/>
                 </Container>
                 <Container
                     fullwidth
                     flexDirection={"row"}
                     justifyContent={"flex-start"}>
                     <SearchInput
                        placeholder={LangUtil.getStringByKey("filter_keyword_search")}
                        value={this.state.keyword}
                        onClear={()=>this.setState({keyword:""})}
                        onChangeText={(t)=>this.onSearch(t)}
                      />
                 </Container>
                 <Container
                   scrollable
                   style={{width:'100%'}}
                   fullwidth>
                 {selectedOptions.length>0?<Container
                   fullwidth>
                   <Container
                     fullwidth
                     style={{height:20,marginTop:20,marginBottom:4}}
                     flexDirection="row">
                     <Typography
                        style={{position:'absolute',left:16}}
                      　color={"lightText"}
                       font="text00"
                      text={LangUtil.getStringByKey("common_selected")}/>
                     <IconButton
                       text={"text03"}
                       style={{position:'absolute',right:16}}
                       onPress={()=>this.onClearAll()}
                       text={LangUtil.getStringByKey("filter_clear_all")}/>
                   </Container>
                   <Container
                       fullwidth
                       justifyContent={"flex-start"}
                       alignItems={"flex-start"}
                       style={{flex:1}}>
                       <OptionContainer
                         style={{marginBottom:20}}
                         selected={selected}
                         multiSelect
                         keyword={this.state.keyword}
                         onSelect={(id)=>this.onSelect(id)}
                         options={
                           selectedOptions
                         }/>
                   </Container>
                 </Container>:null}
                 <Container
                   fullwidth
                   style={{height:20,marginTop:20,marginBottom:4}}
                   flexDirection="row">
                   <Typography
                      style={{position:'absolute',left:16}}
                    　color={"lightText"}
                     font="text00"
                    text={LangUtil.getStringByKey("common_all")}/>
                   <IconButton
                     text={"text03"}
                     style={{position:'absolute',right:16}}
                     onPress={()=>this.onSelectAll()}
                     text={LangUtil.getStringByKey("filter_select_all")}/>
                 </Container>
                 <Container
                     fullwidth
                     justifyContent={"flex-start"}
                     alignItems={"flex-start"}>
                     <OptionContainer
                       style={{marginBottom:20}}
                       selected={selected}
                       multiSelect
                       keyword={this.state.keyword}
                       onSelect={(id)=>this.onSelect(id)}
                       options={
                         filterOption
                       }/>
                 </Container>
               </Container>
           </Container>
           </Container>
  }
  renderRegion1(){
    const {loginInfo,navigation} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait");
    let mode = "event"
    const {showCalendar,tempStartDate,tempEndDate,edit,region1,region2} =this.state;
    const {options,selected,keyword,filterMode,filterOptions} =this.state;
    let count = selected.length>99?"N":selected.length;
    let filterOption = options;
    let selectedOptions = [];
    if(keyword && keyword.length>0){
      filterOption = [];
      for(var k in options){
        if(options[k].label.indexOf(keyword)>=0){
          filterOption.push(options[k])
        }
      }
    }
    for(var k in options){
      if(selected.indexOf(options[k].label)>=0){
        selectedOptions.push(options[k])
      }
    }

    return <Container
      　　　justifyContent="flex-start"
           fullwidth style={{position:'absolute',top:0,paddingBottom:20,backgroundColor:"#000000BB",height}}>
           <Container 　justifyContent="flex-start"
                  fullwidth style={{height:height-47, position:'absolute', top:47,
                  borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",padding:16}}>
                 <Container
                   fullwidth
                   style={{height:20,marginBottom:20}}
                   flexDirection="row">
                   <IconButton
                     text={"text03"}
                     style={{position:'absolute',left:0}}
                     mode="static"
                     type="back"
                     iconStyle={{width:24,height:24}}
                     onPress={()=>this.onSetRegion1()}
                     text={""}/>
                  <Typography
                   　color={"text"}
                     font="text02"
                　   text={LangUtil.getStringByKey("filter_region1")}/>
                 </Container>
                 <Container
                     fullwidth
                     flexDirection={"row"}
                     justifyContent={"flex-start"}>
                     <SearchInput
                        placeholder={LangUtil.getStringByKey("filter_keyword_search")}
                        value={this.state.keyword}
                        onClear={()=>this.setState({keyword:""})}
                        onChangeText={(t)=>this.onSearch(t)}
                      />
                 </Container>
                 <Container
                   style={{width:'100%'}}
                   scrollable
                   fullwidth>
                 {selectedOptions.length>0?<Container
                   fullwidth>
                   <Container
                     fullwidth
                     style={{height:20,marginTop:20,marginBottom:4}}
                     flexDirection="row">
                     <Typography
                        style={{position:'absolute',left:16}}
                      　color={"lightText"}
                        font="text00"
                        text={LangUtil.getStringByKey("common_selected")}/>
                     <IconButton
                       text={"text03"}
                       style={{position:'absolute',right:16}}
                       onPress={()=>this.onClearAll()}
                       text={LangUtil.getStringByKey("filter_clear_all")}/>
                   </Container>
                   <Container
                       fullwidth
                       justifyContent={"flex-start"}
                       alignItems={"flex-start"}
                       style={{flex:1}}>
                       <OptionContainer
                         style={{marginBottom:20}}
                         selected={selected}
                         multiSelect
                         keyword={this.state.keyword}
                         onSelect={(id)=>this.onSelect(id)}
                         options={
                           selectedOptions
                         }/>
                   </Container>
                 </Container>:null}
                 <Container
                   fullwidth
                   style={{width:'100%',height:20,marginTop:20,marginBottom:4}}
                   flexDirection="row">
                   <Typography
                      style={{position:'absolute',left:16}}
                    　color={"lightText"}
                     font="text00"
                    text={LangUtil.getStringByKey("common_all")}/>
                   <IconButton
                     style={{position:'absolute',right:16}}
                     onPress={()=>this.onSelectAll()}
                     text={LangUtil.getStringByKey("filter_select_all")}/>
                 </Container>
                 <Container
                     fullwidth
                     justifyContent={"flex-start"}
                     alignItems={"flex-start"}>
                     <OptionContainer
                       style={{marginBottom:20}}
                       selected={selected}
                       multiSelect
                       keyword={this.state.keyword}
                       onSelect={(id)=>this.onSelect(id)}
                       options={
                         filterOption
                       }/>
                 </Container>
               </Container>
           </Container>
           </Container>
  }
  getRegion2Merge(r){
    console.log("getRegion2Merge")
    console.log(r)
    if(r){
        let list = [];
        for(var k in r){
          list = list.concat(r[k])
        }
        return list
    }
    else{
      return null;
    }
  }
  render(){
    const {loginInfo,navigation} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait");
    let mode = "event"
    const {showCalendar,tempStartDate,tempEndDate,edit,region1,region2,filterOptions} =this.state;
    if(region1){
      return this.renderRegion1()
    }
    if(region2){
      return this.renderRegion2()
    }
    let count = 0;
    for(var k in filterOptions.event.options.stores){
      let item = filterOptions.event.options.stores[k]
      for(var i  in item){
        let subitem = item[i];
        count += subitem.length
      }
    }

    console.log(JSON.stringify(filterOptions.event))
    return <Container
      　　　justifyContent="flex-start"
           fullwidth style={{position:'absolute',top:0,paddingBottom:20,backgroundColor:"#000000BB",height}}>
           <KeyboardAvoidingView
              keyboardVerticalOffset={-150}
               behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width:'100%', position:'absolute',top:47}}>
           <Container 　justifyContent="flex-start"
                  fullwidth style={{height:height-47,
                  borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",padding:16}}>
                 <Container
                   fullwidth
                   style={{height:20,marginBottom:20}}
                   flexDirection="row">
                   <IconButton
                     style={{position:'absolute',left:0}}
                     onPress={()=>this.onCancel()}
                     text={LangUtil.getStringByKey("common_cancel")}/>
                  <Typography
                   　color={"text"}
                    font="text02"
                   text={LangUtil.getStringByKey("filter_title")}/>
                   <IconButton
                     style={{position:'absolute',right:0}}
                     onPress={()=>this.onReset()}
                     text={LangUtil.getStringByKey("common_reset")}/>
                 </Container>
                 <Container fullwidth scrollable style={{width,flex:1,padding:16,paddingTop:0}}>
                    <Container fullwidth scrollable style={{flex:1,paddingTop:0,height:200}}>
                            <RegionSelection
                                    style={{marginBottom:1,borderRadius:0,
                                          borderTopLeftRadius:8,borderTopRightRadius:8}}
                                    text={LangUtil.getStringByKey("filter_region1")}
                                    value={filterOptions.event.region1}
                                    onPress={async()=>{
                                      let mode="event"
                                      let options =[]
                                        filterOptions[mode].options.region1.forEach((item, i) => {
                                        options.push({label:item,id:item})
                                      });
                                      let  selected= filterOptions[mode].region1?filterOptions[mode].region1:[];
                                      this.setState({options,selected,region1:true,keyword:null})
                                      }
                                    }
                                    hint={""}/>
                            <RegionSelection
                                    style={{marginBottom:1,borderRadius:0,
                                       borderBottomLeftRadius:8,borderBottomRightRadius:8}}
                                        text={LangUtil.getStringByKey("filter_region2")}
                                        onPress={async()=>{
                                               this.setState({region2:true,keyword:null})
                                            }
                                        }
                                        value={this.getRegion2Merge(filterOptions.event.region2)}
                                    hint={""}/>
                     </Container>

                </Container>
           </Container>
           </KeyboardAvoidingView>
           <NormalButton
             style={{position:'absolute',bottom:30,width:width-48}}
             onPress={async()=>{this.props.onClose(this.state.filterOptions)}}
             text={LangUtil.getStringByKey("common_show_result")+"("+ count+")" }/>
           </Container>
  }


}
export default BottomNavigation;
