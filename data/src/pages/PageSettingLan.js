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
    Image,
    DeviceEventEmitter,
    AsyncStorage
} from 'react-native';
import UTitleBarText from '../components/UTitleBar'
let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

import {Actions} from "react-native-router-flux";
import {inject, observer} from 'mobx-react'
import PhoneInfo from "../../../app/entities/PhoneInfo";
import {ColorStyles} from "../../../app/common/ColorStyles";
import AccountUtil from '../../../app/utils/AccountUtil';
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import Navigation from "../../../app/element/Navigation";

@inject('store')
@observer
export default class PageSettingLan extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        const smallPhone = this.props.store.phoneSelector.smallPhone;
        var styles
        if(smallPhone){
          styles = smallStyles
        }
        else{
          styles = largeStyles
        }

        this.state = {
          data: [{
            title: '简体中文',
            locale: 'zh-CN'
        },{
            title:'繁體中文',
            locale: 'zh-TW'
        },{
            title:'English',
            locale: 'en'
        },
        {
          title:'日本語',
          locale: 'ja'
        },
        {
          title:'한글',
          locale: 'ko'
        },
        {
          title:'Tiếng Việt',
          locale: 'vn'
        },
        {
          title:'Bahasa Indonesia',
          locale: 'id'
        },
        {
          title:'ภาษาไทย',
          locale: 'th'
        }
      ],
            index: -1,
            initIndex: -1
      }
    }

    componentDidMount(){
        try {
          //DeviceEventEmitter.emit('onStatusBar', '#24293d');
          let index = this.state.data.findIndex(p=> p.locale === PhoneInfo.getLanguage());
          this.setState({index,initIndex:index});
        }catch (e) {
        }
    }

    componentWillUnmount() {
      //DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_BACKGROUND_BLUE);
    }

    doSave(){
      try {
          let index = this.state.index;
          let locale = this.state.data[index].locale;
          this.state.initIndex !== index ? this.setLanguage(locale) : Actions.pop();
      }catch (e) {
      }
    }

    async setLanguage(locale){
       await AsyncStorage.setItem('language',JSON.stringify(locale))
           .then(()=>{
               Actions.reset('loginScreen',{reset:true});
               setTimeout(()=>{
                  AccountUtil.onAccountChange();
                },1000);
           });
    }

    renderRow = ({ item,index}) => {
        let borderColor = this.state.index === index  ? '#2C90D9': '#fff';
        return (
            <TouchableOpacity activeOpacity={0.5} onPress={()=>{this.setState({index})}}>
             <BoxShadow setting={{width:width-32, height:46, color:"#000000",
                    border:1, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:7,marginLeft:16,marginBottom:7}}}>
                    <View style={{borderColor, borderWidth:1,height:46,width:width-32,borderRadius: 10,backgroundColor:'#fff'}}>
                    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',height:46,paddingLeft:12,paddingRight:12}} >
                         <Text style={{color:'#9d9d9d',fontSize:16,textAlignVertical:'center'}}>{item.title}</Text>
                         {
                            this.state.index === index ?  <Image style={{width:15,height:15}} source={require('../../../app/assets/images/btn_check_blue.png')}/>
                            : null
                          }
                     </View>
                    </View>
                </BoxShadow>
            </TouchableOpacity>
        )
    }

      render(){
        const smallPhone = this.props.store.phoneSelector.smallPhone;
        const screen = Dimensions.get('window')
        return (

          <View style={{paddingTop: 0,
            backgroundColor:VALUES.COLORMAP.dkk_background,
            height:screen.height,width:screen.width}}>
              <Navigation
                    onLeftButtonPress={()=>Actions.pop()}
                    title={I18n.t("bi_lan_setting")}
                    rightButtonTitle={I18n.t('Save')}
                    onRightButtonPress={()=>{this.doSave()}}
             />
              <FlatList style={{marginTop:20}}
                  data={this.state.data}
                  extraData={this.state}
                  // refreshing={true}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={this.renderRow}
                  showsVerticalScrollIndicator={false}
              />
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
