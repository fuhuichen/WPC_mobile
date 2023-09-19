
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {PAGES} from "./define"
const Stack = createNativeStackNavigator();


import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
  Button,
  Appearance
} from 'react-native';
import {connect} from 'react-redux';
import * as actions from '../actions';
import {Toast,LangUtil,Notify,DimUtil} from '../framework'
import en from './locales/en';
import zhCN from './locales/zh-CN';
import zhTW from './locales/zh-TW';
import ja from './locales/ja';
import { Keyboard, KeyboardEvent } from 'react-native';
import { DeviceEventEmitter} from 'react-native';
import {FrameworkProvider,AppContainer,PageContainer,Header,Spinner} from '../framework'
import {PageLogin,PageAccountList,PageBrandSelect,PageNotification,
        PageSettingLang,PageSettingAddress,PageSettingPassword,
        PageFilterDate,PageFilterDateRange,PageFilterMain,PageFilterRegion1,
        PageFilterRegion2,PageFilterSort,PageFilterStore,
        PageMore,PageEventMgt,PageDeviceAdd2,PageDeviceAddList,
        PageDeviceMgt,PageDeviceAdd,PageDeviceScan,
        PageDataAnalysis,PageDataDetail,PageDataMonitor,
        PageEventRelated,PageEventInspect,PageEventHistory,PageEventDetail} from './pages'

class PageRouter extends Component {
  constructor(props) {
    super(props);



    this.state={
      toast:null,
      render:false,
      keyboardHeight:0,
    }
  }

  componentWillUnmount() {

  }
  _keyboardDidShow(e) {
    console.log("keybaord show height+"+e.endCoordinates.height)
    this.setState({keyboardHeight:e.endCoordinates.height})
  }
  _keyboardDidHide(){
    console.log("Keyboard hide")
    this.setState({keyboardHeight:0})
  }
  async componentDidMount() {
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow.bind(this));
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide.bind(this));
    DeviceEventEmitter.addListener("TOAST", async(event)=>{
       console.log("DeviceEventEmitter")
       console.log(event)
       this.setState({toast:event})
       setTimeout(function(){
         this.setState({toast:null})
       }.bind(this),3000)
    })
    await   LangUtil.init({
        en,"zh-CN":zhCN,"zh-TW":zhTW,
        ja
      });
   this.setState({render:true})
  }
  render(){
    const {toast} =this.state;
    const {loading} = this.props;
    const {width,height} = DimUtil.getDimensions("portrait");
    if(this.state.render)
    return ( <FrameworkProvider>
               <AppContainer>
               <NavigationContainer>
                   <Stack.Navigator initialRouteName={PAGES.LOGIN}>
                     <Stack.Screen name={PAGES.LOGIN} component={PageLogin}
                      options={{header:()=><View/>}}/>
                     <Stack.Screen name={PAGES.ACCOUNT_LIST} component={PageAccountList}
                      options={{header:()=><View/>}}/>
                     <Stack.Screen name={PAGES.BRAND_SELECT} component={PageBrandSelect}
                       options={{header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.MORE} component={PageMore}
                       options={{animation: 'none',header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.DEVICE_MANAGE} component={PageDeviceMgt}
                        options={{animation: 'none',header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.DEVICE_ADD} component={PageDeviceAdd}
                        options={{animation: 'none',header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.DEVICE_ADD2} component={PageDeviceAdd2}
                          options={{animation: 'none',header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.DEVICE_ADD_LIST} component={PageDeviceAddList}
                        options={{animation: 'none',header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.DEVICE_SCAN} component={PageDeviceScan}
                          options={{animation: 'none',header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.EVENT_MANAGE} component={PageEventMgt}
                         options={{animation: 'none',header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.EVENT_HISTORY} component={PageEventHistory}
                          options={{animation: 'none',header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.EVENT_RELATED} component={PageEventRelated}
                               options={{animation: 'none',header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.EVENT_INSPECT} component={PageEventInspect}
                                  options={{animation: 'none',header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.EVENT_DETAIL} component={PageEventDetail}
                                   options={{animation: 'none',header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.DATA_ANALYSIS} component={PageDataAnalysis}
                          options={{animation: 'none',header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.DATA_DETAIL} component={PageDataDetail}
                              options={{animation: 'none',header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.DATA_MONITOR} component={PageDataMonitor}
                              options={{animation: 'none',header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.NOTIFICATION} component={PageNotification}
                          options={{ animation: 'none',header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.SETTING_LANG} component={PageSettingLang}
                          options={{header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.SETTING_PASSWORD} component={PageSettingPassword}
                          options={{header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.SETTING_ADDRESS} component={PageSettingAddress}
                          options={{header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.FILTER_DATE} component={PageFilterDate}
                            options={{header:()=><View/>,
                              animation:'slide_from_bottom'}
                          }/>
                      <Stack.Screen name={PAGES.FILTER_DATE_RANGE} component={PageFilterDateRange}
                            options={{header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.FILTER_MAIN} component={PageFilterMain}
                            options={{header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.FILTER_REGION1} component={PageFilterRegion1}
                            options={{header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.FILTER_REGION2} component={PageFilterRegion2}
                            options={{header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.FILTER_SORT} component={PageFilterSort}
                            options={{header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.FILTER_STORE} component={PageFilterStore}
                            options={{header:()=><View/>}}/>
                   </Stack.Navigator>
                 </NavigationContainer>
                 {toast?<Notify
                    style={{position:'absolute',top:this.state.keyboardHeight>0?height-60-this.state.keyboardHeight:height-150}}
                    text={toast.text}
                    type={toast.type}/>:null}
                 <Spinner visible={loading}/>
              </AppContainer>
            </FrameworkProvider>);
       return <View/>
  }



}

const mapStateToProps = state =>{
  return {loading:state.loading};
};
export default connect(mapStateToProps, actions)(PageRouter);
