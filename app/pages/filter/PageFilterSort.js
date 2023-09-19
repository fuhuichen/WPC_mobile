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
        OptionContainer,
        FilterButton,
        NormalButton} from '../../../framework'
import {LangUtil,StorageUtil} from '../../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES,OPTIONS} from  "../../define"
import BottomNavigation from "../../components/BottomNavigation"
class PageFilterSort extends Component {
  constructor(props) {
    super(props);
    let options=[]
    const {mode} = props.route.params;
    console.log("Mode="+mode)
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

    //console.log(this.props.ccmFilter)
    this.state={
      selected:this.props.ccmFilter.cache[mode].sort,options
    }
  }

  componentWillUnmount() {

  }
  async componentDidMount() {

  }
  async next(){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {mode} = route.params;
    const {options,selected} =this.state;
    let nf = JSON.parse(JSON.stringify(this.props.ccmFilter))
    nf.cache[mode].sort = selected;
    this.props.setCcmFilter(nf)
    navigation.pop(1)
  }
  onSelect(id){
    this.setState({selected:id})
  }
  render(){
    const {loginInfo,navigation,route,ccmFilter} = this.props;
    const {mode} = route.params;
    const {options,selected} =this.state;
    return ( <PageContainer
                navigation={this.props.navigation}
                isHeader={true}>
                <Header
                  leftIcon={"header-back"}
                  onLeftPressed={()=>{navigation.pop(1)}}
                  text={LangUtil.getStringByKey("filter_sort_mode")}
                />
                <Container
                    fullwidth
                    scrollable
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    style={{flex:1}}>
                    <OptionContainer
                      style={{marginTop:20,marginBottom:20}}
                      selected={selected}
                      onSelect={(id)=>this.onSelect(id)}
                      options={
                        options
                      }/>
                </Container>
                <NormalButton
                  style={{marginTop:20,marginBottom:20}}
                  onPress={async()=>{await this.next()}}
                  text={LangUtil.getStringByKey("common_send")}/>
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter};
};
export default connect(mapStateToProps, actions)(PageFilterSort);
