import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {Typography} from '../../framework'
import {LangUtil,DimUtil} from '../../framework'
import {ERROR_CODE,ENVIRONMENT,PAGES,UNITS,TYPE_COLOR} from  "../define"
import moment from 'moment'
class EventItem extends Component {
  constructor(props) {
    super(props);
  }

  componentWillUnmount() {

  }
  async componentDidMount() {

  }
  render(){
    const {text,style} = this.props;
    return  <View style={[{padding:4},style]}>
            <Typography
         　  color={"#7d7d7d"}
            font="text00"
            text={text}/
            >
            </View>
  }


}
export default EventItem;
