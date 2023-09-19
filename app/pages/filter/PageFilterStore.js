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
import BottomNavigation from "../../components/BottomNavigation"
import { DeviceEventEmitter} from 'react-native';
class PageFilterRegion2 extends Component {
  constructor(props) {
    super(props);
    let options=[]
    const {mode} = props.route.params;
    console.log(this.props.ccmFilter.cache[mode].options)
    for(var k in this.props.ccmFilter.cache[mode].options.stores){
      let l1 = this.props.ccmFilter.cache[mode].options.stores[k];
      for(var m in l1){
        let l2 = l1[m]
        options.push({name:k+' - '+m,list:l2})
      }
      //console.log(k)

    }
    console.log(options)
    this.state={
      keyword:null,
      selected:this.props.ccmFilter.cache[mode].store?this.props.ccmFilter.cache[mode].store:{},options
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
      const {selected,options} = this.state;
      const {loginInfo,navigation,route,ccmFilter,storeList} = this.props;
      const {mode} = route.params;
      if(mode !='notification'){
          if(selected)return 1;
          return 0;
      }
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
      const {loginInfo,navigation,route,ccmFilter,storeList} = this.props;
      const {mode} = route.params;

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
  async next(){
    const {loginInfo,navigation,route,ccmFilter,storeList} = this.props;
    const {mode} = route.params;
    const {options,} =this.state;
    let selected = this.state.selected;
    let list = [];
    let names = [];
    let nf = JSON.parse(JSON.stringify(this.props.ccmFilter))
    console.log("CHANGE STORE")
    console.log(selected)
    if(mode !="notification"){
      if(!selected)return;
      let s=  storeList.find(p=>p.branch_id == selected);
      names = s.branch_name;

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

    }

    console.log(selected)
    nf.cache[mode].store = selected
    nf.cache[mode].storeName = names
    this.props.setCcmFilter(nf)
    DeviceEventEmitter.emit("FILTER_STORE_CHANGE",{ccmFilter:nf})
    navigation.pop(1)
  }
  onSelectAll(group,ids){
    console.log("onSelectAll",group,ids)
    let selected = this.state.selected;
    selected[group]= ids;
    console.log(selected)
    this.setState({selected})
  }
  onSelect(group,id){
    const {loginInfo,navigation,route,ccmFilter,storeList} = this.props;
    const {mode} = route.params;
    if(mode!="notification"){
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
  onSelectCheckAll(){
    if(this.getStatus()==2){
      this.setState({selected:{}})
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
                         value={this.state.keyword}
                         placeholder={LangUtil.getStringByKey("filter_keyword_search")}
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
                            selected={mode!="notification"?selected:selected[item.name]?selected[item.name]:[]}
                            multiSelect={mode=='notification'}
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
                  text={LangUtil.getStringByKey("filter_location")}
                />
                <Container
                    fullwidth
                    scrollable
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1}}>
                    <Container
                        fullwidth
                        flexDirection={"row"}
                        style={{marginTop:20,marginLeft:8,marginRight:8}}
                        justifyContent={"flex-start"}>
                        <SearchInput
                           value={this.state.keyword}
                           placeholder={LangUtil.getStringByKey("filter_keyword_search")}
                           onChangeText={(t)=>this.onSearch(t)}
                         />
                        <FilterButton
                            onPress={()=>{if(mode=="notification")this.setState({filterMode:true,keyword:""})}}
                            text={count}
                            style={{marginRight:5}}/>
                    </Container>
                    {mode=="notification"?<CheckOption
                            checked={true}
                            status={this.getStatus()}
                            onPress={()=>this.onSelectCheckAll()}
                            text={LangUtil.getStringByKey("filter_select_all")}/>:null}
                    {filterOption.map(function(item,i){
                        return <OptionContainer
                          group={item.name}
                          style={{marginBottom:0}}
                          onSelectAll={(ids)=>this.onSelectAll(item.name,ids)}
                          selected={mode!="notification"?selected:selected[item.name]?selected[item.name]:[]}
                          multiSelect={mode=="notification"}
                          onSelect={(id)=>this.onSelect(item.name,id)}
                          options={
                            item.list
                          }/>
                      }.bind(this))
                     }
                </Container>
                <NormalButton
                  style={{marginTop:20}}
                  disabled={mode!="notification"&&selected==null}
                  onPress={async()=>{await this.next()}}
                  text={LangUtil.getStringByKey("common_send")}/>
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageFilterRegion2);
