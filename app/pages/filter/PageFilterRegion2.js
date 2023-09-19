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
        Icon,
        DataInput,
        OptionContainer,
        SearchInput,
        FilterButton,
        CheckOption,
        NormalButton} from '../../../framework'
import {LangUtil,StorageUtil,FilterUtil} from '../../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES,OPTIONS} from  "../../define"
import { DeviceEventEmitter} from 'react-native';
import BottomNavigation from "../../components/BottomNavigation"
class PageFilterRegion2 extends Component {
  constructor(props) {
    super(props);
    let options=[]
    const {mode} = props.route.params;
    console.log(this.props.ccmFilter.cache[mode].options)
    if(this.props.ccmFilter.cache[mode].options.region2){
      for(var k in this.props.ccmFilter.cache[mode].options.region2){
        options.push({name:k,list:this.props.ccmFilter.cache[mode].options.region2[k]})
      }

    }
    console.log("Selected")
    console.log(this.props.ccmFilter.cache[mode].region2)
    this.state={
      keyword:null,
      selected:this.props.ccmFilter.cache[mode].region2?this.props.ccmFilter.cache[mode].region2:{},options
    }
  }

  componentWillUnmount() {

  }
  async componentDidMount() {

  }
  onSearch(t){
    this.setState({keyword:t})
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
  getStatus(){
      const {selected,options} = this.state;
      const {mode} = this.props.route.params;
      let selCount = this.getCount(selected)
      let opCount = this.getCount(this.props.ccmFilter.cache[mode].options.region2)
      if(selCount ==0){
        return 0;
      }
      else if(selCount == opCount){
        return 2;
      }
      else{
        return 1;
      }

  }
  onSelectCheckAll(){
    if(this.getStatus()==2){
      this.setState({selected:[]})
    }
    else{
      const {options} = this.state;
      let selected = {};
      for(var k in options){
        let name = options[k].name;
        selected[name] = [];
        for(var m in options[k].list){
          selected[name].push(options[k].list[m].id)
        }
      }
      console.log(selected)
      this.setState({selected})

    }
  }
  async next(){
    const {loginInfo,navigation,route,ccmFilter,storeList} = this.props;
    const {mode} = route.params;
    const {options} =this.state;
    let selected = this.state.selected;
    let nf = JSON.parse(JSON.stringify(this.props.ccmFilter))

    let rg2Select = [];
    if(this.getCount(selected) !=0){
      for(var k in selected ){
        rg2Select = rg2Select.concat(selected[k])
      }

    }
    else{
      selected = null
      rg2Select = null;
    }
    nf.cache[mode].region2 = selected;
    let newOptions = FilterUtil.getStoreOptions(storeList,nf.cache[mode].region1,rg2Select);
    console.log(newOptions)
    nf.cache[mode].options = newOptions;
    nf.cache[mode].store = null
    nf.cache[mode].storeName = null;
    if(mode != "notification"){
      for(var k in newOptions.stores){
        //console.log(newOptions.stores[k])
        for(var m in newOptions.stores[k]){
          //console.log(newOptions.stores[k][m])]
          for(var l in newOptions.stores[k][m]){
            //console.log(newOptions.stores[k][m][l])
            nf.cache[mode].store = newOptions.stores[k][m][l].id;
            nf.cache[mode].storeName = newOptions.stores[k][m][l].label;
          }
          break;
        }
        break;
      }

    }
   this.props.setCcmFilter(nf)
    DeviceEventEmitter.emit("FILTER_STORE_CHANGE",{ccmFilter:nf})
    navigation.pop(1)
  }
  onSelectAll(group,ids){
    console.log("onSelectAll",ids)
    let selected = this.state.selected;
    selected[group]= ids;
    this.setState({selected})
  }
  onSelect(group,id){
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
    this.setState({selected})
  }
  getSelectedOptions(){
    const {selected} = this.state;
    let output = [];


  }

  render(){
    const {loginInfo,navigation,route,ccmFilter,storeList} = this.props;
    const {mode} = route.params;
    const {options,selected,keyword,filterMode} =this.state;
    let count = this.getCount(selected);

    let filterOption = options;
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
    if(filterMode){
      let rg2Select = [];
      if(selected!=null){
        for(var k in selected ){
          rg2Select = rg2Select.concat(selected[k])
        }
      }
      let finalOptions =[];
      console.log("FilterMode")
      for(var k in filterOption){
          let item = {name:filterOption[k].name,list:[]}
          for(var m in filterOption[k].list){
            if(selected[filterOption[k].name] && selected[filterOption[k].name].indexOf(filterOption[k].list[m].id)>=0){
              item.list.push(filterOption[k].list[m])
            }
          }
          if(item.list.length>0){
              finalOptions.push(item)
          }
      }
      console.log(finalOptions)


      return ( <PageContainer
                  navigation={this.props.navigation}
                  isHeader={true}>
                  <Header
                    leftIcon={"header-back"}
                    rightText={LangUtil.getStringByKey("filter_clear_all")}
                    onLeftPressed={()=>{this.setState({filterMode:false})}}
                    onRightPressed={()=>this.setState({selected:{}})}
                    text={LangUtil.getStringByKey("filter_select_item")}
                  />
                  <Container
                      fullwidth
                      flexDirection={"row"}
                      style={{marginTop:20,marginLeft:8,marginRight:8}}
                      justifyContent={"flex-start"}>
                      <SearchInput
                         placeholder={LangUtil.getStringByKey("filter_keyword_search")}
                         value={this.state.keyword}
                         onChangeText={(t)=>this.onSearch(t)}
                       />
                  </Container>
                  <Container
                      fullwidth
                      scrollable
                      justifyContent={"flex-start"}
                      alignItems={"flex-start"}
                      style={{flex:1}}>
                      <Typography
                          style={{marginLeft:8,marginTop:12,marginBottom:8}}
                          font={"subtitle03"}
                          text={LangUtil.getStringByKey("filter_select_count")+":"+rg2Select.length}
                      />
                      {finalOptions.map(function(item,i){
                          return <OptionContainer
                            clear
                            group={item.name}
                            style={{marginBottom:0}}
                            onSelectAll={(ids)=>{}}
                            selected={selected[item.name]?selected[item.name]:[]}
                            multiSelect
                            onSelect={(id)=>this.onSelect(item.name,id)}
                            options={
                              item.list
                            }/>
                        }.bind(this))
                       }
                  </Container>

               </PageContainer>);



    }


    return ( <PageContainer
                navigation={this.props.navigation}
                isHeader={true}>
                <Header
                  leftIcon={"header-back"}
                  onLeftPressed={()=>{navigation.pop(1)}}
                  text={LangUtil.getStringByKey("filter_region2")}
                />
                <Container
                      fullwidth
                      flexDirection={"row"}
                      style={{marginTop:20,marginLeft:8,marginRight:8}}
                      justifyContent={"flex-start"}>
                    <SearchInput
                       placeholder={LangUtil.getStringByKey("filter_keyword_search")}
                       onChangeText={(t)=>this.onSearch(t)}
                       value={this.state.keyword}
                     />
                    <FilterButton
                        onPress={()=>this.setState({filterMode:true,keyword:""})}
                        text={count}
                        style={{marginRight:5}}/>
                </Container>
                <Container
                    fullwidth
                    scrollable
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1}}>
                      <CheckOption
                              checked={true}
                              status={this.getStatus()}
                              onPress={()=>this.onSelectCheckAll()}
                              text={LangUtil.getStringByKey("filter_select_all")}/>
                    {filterOption.map(function(item,i){
                        return <OptionContainer
                          group={item.name}
                          style={{marginBottom:0}}
                          onSelectAll={(ids)=>this.onSelectAll(item.name,ids)}
                          selected={selected[item.name]?selected[item.name]:[]}
                          multiSelect
                          onSelect={(id)=>this.onSelect(item.name,id)}
                          options={
                            item.list
                          }/>
                      }.bind(this))
                     }
                </Container>
                <NormalButton
                  style={{marginTop:20}}
                  onPress={async()=>{await this.next()}}
                  text={LangUtil.getStringByKey("common_send")}/>
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageFilterRegion2);
