import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
// import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import {BackHandler, Dimensions, Platform, ScrollView, StyleSheet, View} from 'react-native';
import UTitleBar from '../components/UTitleBar'
import Tab from '../components/Tab';


import CustomHeatmap from '../components/CustomHeatmap'
import CustomTurnin from '../components/CustomTurnin'
import CustomShoprate from '../components/CustomShoprate'
import CustomReturn from '../components/CustomReturn'
import {Actions} from "react-native-router-flux";
import {getBottomSpace} from 'react-native-iphone-x-helper'

import {inject, observer} from 'mobx-react'
@inject('store')
@observer
export default class PageCustom extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.backHandler = null;
    this.state = {tab:'heatmap',loading:true};
  }

  componentDidMount() {
    this.backHandler = BackHandler.addEventListener("pageCustomBackPress", () => {
      if(this.state.loading){
        return true;
      }
    });
  }

  componentWillUnmount() {
    this.backHandler.remove();
  }

  renderContent(){
    const {styles,tab} = this.state;
    if( tab =='heatmap' ){
      return <CustomHeatmap onLoading={(loading)=>this.setState({loading})}/>
    } else if( tab =='turnin' ){
      return <CustomTurnin onLoading={(loading)=>this.setState({loading})}/>
    } else if( tab =='shoprate' ){
      return <CustomShoprate onLoading={(loading)=>this.setState({loading})}/>
    } else if( tab =='return' ){
      return <CustomReturn onLoading={(loading)=>this.setState({loading})}/>
    }
  }

  render() {
    const {styles,tab} = this.state;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    const screen = Dimensions.get('window')
    const {clear_gray,light_gray, bright_blue,white,black} = VALUES.COLORMAP;
    let contentHeight = (Platform.OS === 'ios') ? ((VALUES.isIPhoneX) ? screen.height-214 : screen.height-160-getBottomSpace()) : screen.height-140;
    return (
      <View style={{paddingTop:0,
       backgroundColor:VALUES.COLORMAP.dkk_background,
        flex:1,width:screen.width}}>
         <UTitleBar    smallPhone={smallPhone}
           headerText={I18n.t('bi_customer_datas')}
           onLeftPress={()=>{this.state.loading ? {} : Actions.pop()}}
           onRightPress={()=>{}}
           leftText={this.props.type}
           rightIconType={'none'}
           leftIconType={'return'}>
         </UTitleBar>
          <View style={{width:screen.width,height:contentHeight,marginTop:(Platform.OS === 'ios')?34:10}}>
           <View style={{flex:1,width:screen.width,height:contentHeight}}>
            {this.renderContent()}
           </View>
         </View>
         <View style={{
           flexDirection:'row',width: screen.width ,
           justifyContent:'flex-start',
           borderTopWidth:0.3,borderTopColor:'#ffffff44',
           paddingLeft:13,paddingRight:13,
           width:screen.width,height:60}}>
            <Tab id={'heatmap'}   smallPhone={smallPhone}
                fontColor={bright_blue} color={bright_blue} text={I18n.t('bi_heatmap')}
                selected={tab} onPress={()=>{  this.setState({tab:'heatmap',isStoreSetting:false,subpage:null,event:null,overview:null})}}></Tab>
            <Tab id={'turnin'}
                smallPhone={smallPhone} fontColor={white} text={I18n.t("bi_turnin_rate") }
                color={bright_blue} selected={tab} onPress={()=>{this.setState({tab:'turnin',isStoreSetting:false,subpage:null,event:null,overview:null})}}></Tab>
            <Tab id={'shoprate'}   smallPhone={smallPhone} text={I18n.t("bi_shop_rate").replace(" ","\n") }
                fontColor={white}  color={bright_blue} selected={tab} onPress={()=>{this.setState({tab:'shoprate',isStoreSetting:false,subpage:null,event:null,overview:null})}}></Tab>
        </View>
      </View>
    );
  }
}


const smallStyles = StyleSheet.create({
  backgroundImage: {
     flex: 1,
     alignSelf: 'stretch',
     width: null,
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
  backgroundImage: {
     flex: 1,
     alignSelf: 'stretch',
     width: null,
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
