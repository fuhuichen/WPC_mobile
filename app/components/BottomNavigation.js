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
        NormalButton} from '../../framework'
import {LangUtil,DimUtil} from '../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES} from  "../define"

class BottomNavigation extends Component {
  constructor(props) {
    super(props);
  }

  componentWillUnmount() {

  }
  async componentDidMount() {

  }
  render(){
    const {width,height} = DimUtil.getDimensions("portrait")
    return <View style={{bottom:0,position:'absolute',left:0,
                    width:width,height:50,backgroundColor:"#f00"}}/>
  }


}
export default BottomNavigation;
