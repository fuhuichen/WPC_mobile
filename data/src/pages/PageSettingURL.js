import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import {
    Dimensions,
    FlatList,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
    Text,
    DeviceEventEmitter,
    Image,
    AsyncStorage
} from 'react-native';
import UTitleBarText from '../components/UTitleBarText'
let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

import {inject, observer} from 'mobx-react'
import moment from 'moment';
import {Environment} from '../../../environments/Environment';
import {ColorStyles} from "../../../app/common/ColorStyles";

@inject('store')
@observer
export default class PageSettingURL extends Component {
    constructor(props) {
      super(props);
      this.props = props;

      this.state = {
        baseURL_time: "",
        ushopURL_time: "",
        postURL_time: "",
      }
    }

    componentDidMount(){
      DeviceEventEmitter.emit('onStatusBar', '#24293d');
      this.getFetchURLTime('BASE');
      this.getFetchURLTime('USHOP');
      this.getFetchURLTime('POST');
    }

    componentWillUnmount() {
      DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_BACKGROUND_BLUE);
    }

    getFetchURLTime(type) {
      var url = "";
      switch(type) {
        case 'BASE': url = Environment.onWebSite(); break;
        case 'USHOP': url = Environment.USHOP_URL; break;
        case 'POST': url = Environment.POST_URL; break;
      }
      var startTime = moment();
      //console.log("PageSetting fetch startTime, ", startTime.format("YYYY/MM/DD HH:mm:ss.SSS"));
      //fetch("http://portals.storeviu.com.cn:8081", {
      fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type' : 'application/json',
        }
      })
      .then(response => {
        response.json();
        var endTime = moment();
        //console.log("type, ", type);
        //console.log("PageSetting fetch endTime, ", endTime.format("YYYY/MM/DD HH:mm:ss.SSS"));
        //console.log("PageSetting fetch time diff, ", moment(moment.duration(endTime.diff(startTime))._data).format("HH:mm:ss.SSS"));
        switch(type) {
          case 'BASE': this.setState({baseURL_time: moment.duration(endTime.diff(startTime)).asMilliseconds()}); break;
          case 'USHOP': this.setState({ushopURL_time: moment.duration(endTime.diff(startTime)).asMilliseconds()}); break;
          case 'POST': this.setState({postURL_time: moment.duration(endTime.diff(startTime)).asMilliseconds()}); break;
        }
      });
    }

    render(){
      var styles;
      const smallPhone = this.props.store.phoneSelector.smallPhone;
      if(smallPhone){
        styles = smallStyles;
      } else {
        styles = largeStyles;
      }
      const screen = Dimensions.get('window');
      const {baseURL_time,ushopURL_time,postURL_time} = this.state;
      return (
        <View style={{paddingTop:(Platform.OS === 'ios') ? 25 : 0,
          backgroundColor:VALUES.COLORMAP.dkk_background,
          height:screen.height,width:screen.width}}>
          <Text allowFontScaling={false} style={styles.dataValue}>{"Base URL fetch time : (" + Environment.onWebSite() + ")"}</Text>
          <Text allowFontScaling={false} style={styles.dataValue}>{baseURL_time + " " + I18n.t("bi_unit_ms")}</Text>
          <Text allowFontScaling={false} style={styles.dataValue}>{"UShop URL fetch time : (" + Environment.USHOP_URL + ")"}</Text>
          <Text allowFontScaling={false} style={styles.dataValue}>{ushopURL_time + " " + I18n.t("bi_unit_ms")}</Text>
          <Text allowFontScaling={false} style={styles.dataValue}>{"Post URL fetch time : (" + Environment.POST_URL + ")"}</Text>
          <Text allowFontScaling={false} style={styles.dataValue}>{postURL_time + " " + I18n.t("bi_unit_ms")}</Text>
        </View>
      )
    }
}
const smallStyles = StyleSheet.create({
  dataValue: {
    backgroundColor:'transparent',
    fontSize:14,
    marginTop:3,
    justifyContent:'center',
    alignItems:'center',
    color:VALUES.COLORMAP.white},
  backgroundImage: {
     flex: 1,
     alignSelf: 'stretch',
     width: null,
   },
   triangle: {
     width: 0,
     height: 0,
     backgroundColor: 'transparent',
     borderStyle: 'solid',
     borderTopWidth: 0,
     borderRightWidth: 45,
     borderBottomWidth: 90,
     borderLeftWidth: 45,
     borderTopColor: 'transparent',
     borderRightColor: 'transparent',
     borderBottomColor: 'red',
     borderLeftColor: 'transparent',
   },
  container:{
    paddingTop:44,
    paddingRight:30,
    paddingLeft:30,
    paddingBottom:25,
    alignItems:'center',
    justifyContent:'flex-start',
  },
  logoImage: {
    width:0
  },
  inputTitle: {
     paddingTop:2,
     paddingBottom:4,
     marginLeft:10,
     fontSize:14,
     justifyContent:'flex-start',
     alignItems:'center',
     backgroundColor:'transparent',
     color:VALUES.COLORMAP.white},
   forgetPwdText: {
        textDecorationLine:'underline',
        paddingTop:2,
        paddingBottom:4,
        marginLeft:20,
        fontSize:12,
        alignItems:'center',
        color:VALUES.COLORMAP.white},
});

const largeStyles = StyleSheet.create({
  dataValue: {
    backgroundColor:'transparent',
    fontSize:14,
    marginTop:3,
    justifyContent:'center',
    alignItems:'center',
    color:VALUES.COLORMAP.white},
  backgroundImage: {
     flex: 1,
     alignSelf: 'stretch',
     width: null,
   },
   triangle: {
     width: 0,
     height: 0,
     backgroundColor: 'transparent',
     borderStyle: 'solid',
     borderTopWidth: 0,
     borderRightWidth: 45,
     borderBottomWidth: 90,
     borderLeftWidth: 45,
     borderTopColor: 'transparent',
     borderRightColor: 'transparent',
     borderBottomColor: 'red',
     borderLeftColor: 'transparent',
   },
  container:{
    paddingTop:44,
    paddingRight:30,
    paddingLeft:30,
    paddingBottom:25,
    alignItems:'center',
  },
   logoImage: {
     width:0
   },
   inputTitle: {
      paddingTop:2,
      paddingBottom:4,
      marginLeft:10,
      fontSize:12,
      justifyContent:'flex-start',
      alignItems:'center',
      backgroundColor:'transparent',
      color:VALUES.COLORMAP.white},
   forgetPwdText: {
           textDecorationLine:'underline',
           paddingTop:2,
           paddingBottom:4,
           marginLeft:20,
           fontSize:10,
           alignItems:'center',
           justifyContent:'flex-end',
           color:VALUES.COLORMAP.white},

});
