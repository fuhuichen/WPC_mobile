import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
// import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scrollview'
import {
    BackHandler,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import UTitleBar from '../components/UTitleBar'
import Tab from '../components/Tab';
import CustomHeatmap from '../components/CustomHeatmap2'
import CustomTrend from '../components/CustomTrend'
import CustomProportion from '../components/CustomProportion'
import {Actions} from "react-native-router-flux";
import SettingItem from '../components/SettingItem'
import {inject, observer} from 'mobx-react'
import {getBottomSpace} from 'react-native-iphone-x-helper'

@inject('store')
@observer
export default class PageCustom extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.backHandler = null;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    var styles;
    if(smallPhone) {
      styles = smallStyles
    } else {
      styles = largeStyles
    }
    this.state = {styles,returnMode:'7D',openMode:false,tab:'heatmap',loading:true};
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
      return <CustomHeatmap returnMode={this.state.returnMode} onLoading={(loading)=>this.setState({loading})}/>
    }else if( tab =='trend' ){
      return <CustomTrend returnMode={this.state.returnMode} onLoading={(loading)=>this.setState({loading})}/>
    }else if( tab === 'proportion') {
      return <CustomProportion returnMode={this.state.returnMode} onLoading={(loading)=>this.setState({loading})}/>
    }
  }
  onChangeReturnMode(){
    this.setState({openMode:!this.state.openMode})
  }
  renderModeSelect(){
      const screen = Dimensions.get('window')
      const {styles,tab,returnMode} = this.state;
        var dayText;
        if(returnMode =='7D'){
            dayText =I18n.t("bi_period_7day");
        }
        else if(returnMode =='30D'){
            dayText =I18n.t("bi_period_30day");
        }
        else {
            dayText =I18n.t("bi_period_90day");
        }
        var sep = (I18n.locale=='en')?' ':'';
        var text = I18n.t("bi_periodic")+ sep + dayText
        return (
          <View style={{position: 'absolute',top:((Platform.OS === 'ios') ? 10: 0),left:100
        ,width:screen.width-100,height:40, flexDirection:'row-reverse',alignContent:'flex-end'}}>
            <TouchableOpacity style={{flexDirection:'row',alignContent:'flex-end',alignSelf:'center',width:17,height:22,marginRight:17,marginLeft:7}}
                              onPress={()=>this.onChangeReturnMode()}
            >
                <Image source={require('../../images/icon_box_arrow_down_press.png')} style={{width:17,height:17,alignSelf:'center'}} />
            </TouchableOpacity>
            <View style={{flexDirection:'column',alignContent:'flex-end',alignSelf:'center',width:70,height:22}}>
                <Text  allowFontScaling={false}  style={{fontSize:16, alignSelf:'flex-end',color:'#F7F9FA'}}>{text}</Text>
            </View>

          </View>)
  }
  renderSelect(){
    const screen = Dimensions.get('window')
    const {styles,tab} = this.state;
    var list =['7D','30D','90D'];
    var texts = [I18n.t("bi_period_7day"),I18n.t("bi_period_30day"),I18n.t("bi_period_90day")]
    if(this.state.openMode){
      var nodes =  list.map(function(p,i){
        var img  = require('../../images/languageSelected.png');
        var borderStyle = {borderColor:'#FFF'}
        if(p==this.state.returnMode){
          console.log("p:",p)
          borderStyle = {borderWidth:1,borderColor:'#2C90D9',borderRadius:5}
        }
        else if(i==0){
          borderStyle = {borderTopLeftRadius:5,borderTopRightRadius:10,borderBottomWidth: 1,borderBottomColor: '#CCCCCC44',}
        }else if(i==list.length-1){
          borderStyle = {borderTopLeftRadius:5,borderBottomRightRadius:10,}
        }else{
          borderStyle = {borderBottomWidth: 1,borderBottomColor: '#CCCCCC44',}
        }
        return (
          <TouchableOpacity onPress={()=>{this.setState({returnMode:p,openMode:false})}}
            style={[borderStyle,{paddingRight:5,width:160, backgroundColor:(p==this.state.returnMode)?"#ECF7FF":VALUES.COLORMAP.white, paddingLeft:20,
                    height:30,justifyContent:'flex-start',alignItems:'center',flexDirection:'row',marginTop:(i==0)?10:0,marginBottom:(i==list.length-1)?10:0}]}>
            <Text  allowFontScaling={false} style={{color:'#556679'}}>{texts[i]}</Text>
          </TouchableOpacity >)
        }.bind(this));
      return <View style={[styles.shadowStyle,{position: 'absolute',top: (VALUES.isIPhoneX?79:(Platform.OS === 'ios') ? 70: 45),left:199,width:160,alignItems:'flex-end',height:110,backgroundColor:'#FFF'}]}>
                  {nodes}
             </View>
    }
  }
  render() {
    const {styles,tab} = this.state;
    const smallPhone = this.props.store.phoneSelector.smallPhone;
    const screen = Dimensions.get('window')
    const {clear_gray,light_gray, bright_blue,white,black} = VALUES.COLORMAP;
    let contentHeight = (Platform.OS === 'ios') ? ((VALUES.isIPhoneX) ? screen.height-190:screen.height-149-getBottomSpace()) : screen.height-104-40;
    return (
      <View style={{paddingTop:0,
       backgroundColor:VALUES.COLORMAP.dkk_background,
        flex:1,width:screen.width}}>
         <UTitleBar    smallPhone={smallPhone}
           headerText={I18n.t("bi_oldcustom_data")}
           onLeftPress={()=>{this.state.loading ? {} : Actions.pop()}}
           onRightPress={()=>{}}
           rightIconType={'none'}
           leftIconType={'return'}>
         </UTitleBar>
          <View style={{width:screen.width,height:contentHeight,marginTop:(Platform.OS === 'ios')?34:25}}>
           <View style={{flex:1,width:screen.width,height:contentHeight}}>
            {this.renderContent()}
           </View>
         </View>
         <View style={{
           flexDirection:'row',width: screen.width ,
           justifyContent:'flex-start',
           borderTopWidth:1,borderTopColor:'#ffffff44',
           paddingLeft:13,paddingRight:13,
           width:screen.width,height:33}}>
            <Tab id={'heatmap'}   smallPhone={smallPhone}
                fontColor={bright_blue} color={bright_blue} text={I18n.t('bi_heatmap')}
                selected={tab} onPress={()=>{  this.setState({tab:'heatmap',openMode:false,isStoreSetting:false,subpage:null,event:null,overview:null})}}></Tab>
             <Tab id={'trend'}   smallPhone={smallPhone} text={I18n.t("bi_oldcustom_trend")}
                fontColor={white}  color={bright_blue}
                selected={tab} onPress={()=>{this.setState({tab:'trend',openMode:false,isStoreSetting:false,subpage:null,event:null,overview:null})}}></Tab>
             <Tab id={'proportion'}   smallPhone={smallPhone} text={I18n.t("bi_oldcustom_rate")}
                fontColor={white}  color={bright_blue}
                selected={tab} onPress={()=>{this.setState({tab:'proportion',openMode:false,isStoreSetting:false,subpage:null,event:null,overview:null})}}></Tab>
        </View>
        {this.renderModeSelect()}
        {this.renderSelect()}
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
    shadowStyle:{
          shadowColor: "rgba(0,0,0,0.16)",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.50,
          shadowRadius: 1.41,
          elevation: 2,
        },
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
    shadowStyle:{
    shadowColor: "rgba(0,0,0,0.16)",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.50,
    shadowRadius: 1.41,
    elevation: 2,
  },

});
