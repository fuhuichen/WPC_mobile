import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
// import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import {BackHandler, Dimensions, Platform, StyleSheet, View} from 'react-native';
import UTitleBar from '../components/UTitleBar'
import RNStatusBar from "../../../app/components/RNStatusBar";


import ItemPresent from '../components/ItemPresent'
import {Actions} from "react-native-router-flux";
import {inject, observer} from 'mobx-react'

@inject('store')
@observer
export default class PageItem extends Component {
    constructor(props) {
      super(props);
      this.props = props;
      this.backHandler = null;
      this.state = {tab:'rank',loading:false};
    }

    componentDidMount() {
      this.backHandler = BackHandler.addEventListener("pageItemBackPress", () => {
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
      return <ItemPresent mode={tab} onLoading={(loading)=>{this.setState({loading})}}/>
    }

    render() {
      const {styles,tab} = this.state;
      const smallPhone = this.props.store.phoneSelector.smallPhone;
      const screen = Dimensions.get('window')
      const {clear_gray,light_gray, bright_blue,white,black} = VALUES.COLORMAP;
      return (
        <View style={{marginTop:(VALUES.isIPhoneX?0:(Platform.OS === 'ios') ? 0: 0),
          backgroundColor:VALUES.COLORMAP.dkk_background,
          flex:1,width:screen.width,height:screen.height}}>
          <RNStatusBar/>
          <UTitleBar    smallPhone={smallPhone}
             headerText={I18n.t('bi_item_datas')}
             onLeftPress={()=>{this.state.loading ? {} : Actions.pop()}}
             onRightPress={()=>{}}
             rightIconType={'none'}
             leftIconType={'return'}>
           </UTitleBar>
           <View style={{flex:1,width:screen.width,marginTop:15}}>
            {this.renderContent()}
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
