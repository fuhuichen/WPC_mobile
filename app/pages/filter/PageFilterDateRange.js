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
import { DeviceEventEmitter} from 'react-native';
import moment from 'moment'
class PageFilterSort extends Component {
  constructor(props) {
    super(props);
    let options=[]
    const {mode} = props.route.params;
    options.push({label:LangUtil.getStringByKey("不使用common_date_type_day"),id:1})
    options.push({label:LangUtil.getStringByKey("不使用common_date_type_last3"),id:2})
    options.push({label:LangUtil.getStringByKey("不使用common_date_type_last7"),id:3})
    console.log(this.props.ccmFilter.cache[mode].dataMode)
    this.state={
      selected:this.props.ccmFilter.cache[mode].dataMode,options
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
    DeviceEventEmitter.emit("FILTER_DATE_RANGE_CHANGE",{selected})
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
                  onLeftPressed={()=>{this.next()}}
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
             </PageContainer>);
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter};
};
export default connect(mapStateToProps, actions)(PageFilterSort);
