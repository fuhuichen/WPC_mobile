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
        FilterButton,
        Tab,
        BottomNav,
        Icon,
        DataInput,
        OptionContainer,
        SearchInput,
        CheckOption,
        NormalButton} from '../../../framework'
import {LangUtil,StorageUtil,FilterUtil} from '../../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,CCMFUNCTIONS,STORAGES,OPTIONS} from  "../../define"
import { DeviceEventEmitter} from 'react-native';
class PageFilterRegion1 extends Component {
  constructor(props) {
    super(props);
    console.log(this.props.ccmFilter)
    this.state={
      keyword:null,filterMode:false,
    }
  }

  componentWillUnmount() {

  }
  async componentDidMount() {

  }
  render(){
    const {loginInfo,navigation,route,ccmFilter,storeList} = this.props;
    const {mode} = route.params;
    return <View>
           </View>
  }


}

const mapStateToProps = state =>{
  return {loginInfo:state.loginInfo,ccmFilter:state.ccmFilter,storeList:state.storeList};
};
export default connect(mapStateToProps, actions)(PageFilterRegion1);
