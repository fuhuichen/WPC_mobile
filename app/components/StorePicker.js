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
    const {loginInfo,navigation,ccmFilter,multi} = this.props;
    let mode = multi?"notification":"event"
    let filterOptions = JSON.parse(JSON.stringify(ccmFilter))
    let options=[]
    for(var k in this.props.ccmFilter.event.options.stores){
      let l1 = this.props.ccmFilter.event.options.stores[k];
      for(var m in l1){
        let l2 = l1[m]
        options.push({name:k+' - '+m,list:l2})
      }
      //console.log(k)

    }
    let selected
    if(multi && !this.props.ccmFilter[mode].store){
      selected = {};
      options.forEach((item, i) => {
          selected[item.name] = []
          item.list.forEach((subitem, i) => {
              selected[item.name].push(subitem.id)
          });

      });


    }
    else{
       selected = this.props.ccmFilter[mode].store?this.props.ccmFilter[mode].store:{}
    }
    console.log("Default Selected")
    console.log(selected)
    this.state={
      filterOptions,
      showCalendar:false,
      edit:false,
      inputStartDate:'',
      inputEndDate:'',
      notify:null,
      region1:false,
      region2:false,
      selected,
      options,
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
    if(this.props.multi){
      let selected = this.state.selected;
      selected[group]= ids;
      console.log(selected)
      this.setState({selected})
    }

  }
  onSelect(group,id){
    const {loginInfo,ccmFilter,storeList,multi} = this.props;
    if(!multi){
        let selected = this.state.selected;
        if(selected == id){
          this.setState({selected:null})
        }
        else{
          this.setState({selected:id})
        }
    }
    else{
      let selected = this.state.selected;
      if(!selected[group]){
        selected[group] = [];
      }
      if(selected[group].indexOf(id)<0){
        selected[group].push(id)
      }
      else{
        selected[group] = selected[group].filter((value)=>value!=id);
      }
      console.log(selected)
      this.setState({selected})
    }

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
    if(this.props.multi)
        this.setState({selected:{}})
    else
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
    const {loginInfoccmFilter,storeList,multi,onClose} = this.props;
    let mode = "event"
    const {options,} =this.state;
    let selected = this.state.selected;
    let list = [];
    let names = [];
    if(!multi){
      if(!selected)return;
      let s=  storeList.find(p=>p.branch_id == selected);
      names = s.branch_name;
      let filterOptions = this.state.filterOptions;
      filterOptions.event.store = selected
      filterOptions.event.storeName = names
      if(onClose)onClose(filterOptions)

    }
    else{
      if(this.getCount(selected) !=0){
        for(var i in selected){
          for(var j in selected[i]){
            list.push(selected[i][j])
            //console.log(selected[i][j])
          }
        }

        for(var k in list){
         let s=  storeList.find(p=>p.branch_id == list[k]);
         if(s){
           names.push(s.branch_name)
         }
        }

      }
      else{
        selected = null
        list = null;
        names =null;
      }
      let filterOptions = this.state.filterOptions;
      filterOptions.notification.store = selected
      filterOptions.notification.storeName = names.length==0?names[0]: names.length+"Selected"
      if(onClose)onClose(filterOptions)

    }

  }
  unselect(group,id){
    let selected =this.state.selected;
    console.log("Unselect " + group + "/" +id)
    if(selected && selected[group]){
      let index = selected[group].indexOf(id)
      if(index>=0){
        selected[group].splice(index,1);
      }
    }
    this.setState({selected})
  }
  onSelectAllMulti(  filterOption){
    if(this.props.multi){
      if(filterOption){
        let selected = this.state.selected;
        filterOption.forEach((item, i) => {
            if(!selected[item.name]){
              selected[item.name] = [];
            }
            item.list.forEach((subitem, i) => {
                if(selected[item.name].indexOf(subitem.id)<0)
                  selected[item.name].push(subitem.id)
            });

        });
        this.setState({selected})

      }
      else{
        let selected = {};
        this.state.options.forEach((item, i) => {
            selected[item.name] = []
            item.list.forEach((subitem, i) => {
                selected[item.name].push(subitem.id)
            });

        });
        this.setState({selected})
      }


    }

  }

  render(){
    const {loginInfo,navigation,multi} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait");
    let mode = "event"
    const {showCalendar,tempStartDate,tempEndDate,edit,region1,region2,filterOptions,options,selected,keyword} =this.state;
    let filterOption = options
    if(keyword && keyword.length>0){
      filterOption = [];
      for(var k in options){
        if(options[k].name.indexOf(keyword)>=0){
          filterOption.push(options[k])
        }
        else{
          let item = {name:options[k].name,list:[]}
          for(var m in options[k].list){
            if(options[k].list[m].label.indexOf(keyword)>=0){
              item.list.push(options[k].list[m])
            }
          }
          if(item.list.length>0){
              filterOption.push(item)
          }
        }
      }
    }
    let selectedOptions = [];
    let list=[]
    if(multi){
      if(selected){

        for(var k in  selected){
           console.log(k)
           console.log(selected[k])
           list = list.concat(selected[k])
        }
        console.log(list)
        for(var k in options){
          for(var m in options[k].list){
            if(list.indexOf(options[k].list[m].id)>=0){
              options[k].list[m].subtitle = options[k].name;
              selectedOptions.push(options[k].list[m])
            }
          }
        }
      }
    }
    let canNext = multi && list.length==0?false:true;
    console.log("CanNext="+canNext)

    return <Container
      　　　justifyContent="flex-start"
           fullwidth style={{position:'absolute',top:0,backgroundColor:"#000000BB",height}}>
           <View
              keyboardVerticalOffset={-150}
               behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width:'100%',  position:'absolute',top:47}}>
           <Container 　justifyContent="flex-start"
                  fullwidth style={{height:height-47,
                  borderTopLeftRadius:8,borderTopRightRadius:8,backgroundColor:"#F0F0F0",padding:16}}>
                 <Container
                   fullwidth
                   style={{height:20,marginBottom:20}}
                   flexDirection="row">
                   <IconButton
                     textStyle={"text02"}
                     style={{position:'absolute',left:0}}
                     onPress={()=>this.onCancel()}
                     text={LangUtil.getStringByKey("common_cancel")}/>
                  <Typography
                    text={"text"}
                    font="text02"
                   text={LangUtil.getStringByKey("filter_change_location")}/>
                   <IconButton
                     textStyle={"text02"}
                     style={{position:'absolute',right:0}}
                       onPress={()=>{
                         if(canNext)this.next()
                       }
                     }
                      font={canNext?"primary":"lightText"}
                     text={LangUtil.getStringByKey("common_confirm")}/>
                 </Container>
                 <Container fullwidth scrollable
                  style={{width,flex:1,padding:16,marginBottom:30}}>
                 <Container
                     fullwidth
                     flexDirection={"row"}
                     justifyContent={"flex-start"}>
                     <SearchInput
                        onClear={()=>this.setState({keyword:null})}
                        placeholder={LangUtil.getStringByKey("filter_keyword_search")}
                        value={this.state.keyword}
                        onChangeText={(t)=>this.setState({keyword:t})}
                      />
                    </Container>
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
                            selected={list}
                            multiSelect
                            subtext={true}
                            keyword={null}
                            onSelect={(id,group)=>this.unselect(group,id)}
                            options={
                              selectedOptions
                            }/>
                      </Container>
                      <Container style={{height:2,backgroundColor:'#E3E3E3'}}
                          fullwidth　/>

                    </Container>:null}
                    {multi?<Container
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
                        onPress={()=>this.onSelectAllMulti(filterOption)}
                        text={LangUtil.getStringByKey("filter_select_all")}/>
                    </Container>:null}
                    <Container
                      fullwidth style={{marginBottom:30}}>
                   {filterOption.map(function(item,i){
                       return <OptionContainer
                         group={item.name}
                         keyword={this.state.keyword}
                         style={{marginBottom:0}}
                         onSelectAll={(ids)=>this.onSelectAll(item.name,ids)}
                         selected={!multi?selected:selected[item.name]?selected[item.name]:[]}
                         multiSelect={multi}
                         onSelect={(id)=>this.onSelect(item.name,id)}
                         options={
                           item.list
                         }/>
                     }.bind(this))
                    }
                      </Container>
                </Container>
           </Container>
           </View>
           </Container>
  }


}
export default BottomNavigation;
