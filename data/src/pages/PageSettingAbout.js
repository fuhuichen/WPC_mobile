import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import {
    Dimensions,
    Platform,
    View,
    Text,
    DeviceEventEmitter,
} from 'react-native';
import Navigation from "../../../app/element/Navigation";
import {Actions} from "react-native-router-flux";
import {ColorStyles} from "../../../app/common/ColorStyles";
let {width} =  Dimensions.get('screen');

export default class PageSettingLan extends Component {
    constructor(props) {
        super(props);
        this.props = props;
    }


    componentWillUnmount() {
      DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
    }


      render(){
        const screen = Dimensions.get('window')
        return (
          <View style={{paddingTop: 0,
            backgroundColor:VALUES.COLORMAP.dkk_background,
            height:screen.height,width:screen.width}}>
           <Navigation title={I18n.t("bi_about_StoreVue")}
            onLeftButtonPress={()=>Actions.pop()}/>
            <Text style={{color:'#484848',fontSize:16,marginLeft:16,marginRight:16,marginTop:20,fontWeight:'bold'}}>{I18n.t("About show")}</Text>
             {/*<Text style={{color:'#484848',fontSize:16,marginLeft:16,marginRight:16,marginTop:20,fontWeight:'bold'}}>{'StoreVue 为研华智城旗下的智慧零售品牌，专注于提供连锁门店智慧解决方案。StoreVue 提供云端软件服务并搭载研华科技之硬件方案，让零售门店业者可以同时享受到弹性的 SaaS 服务以及高效能的硬件规格。'}</Text>
             <View style={{width:width-32,height:1,marginLeft:16, marginRight:16, backgroundColor:'#dcdcdc',marginTop:10}}/>
             <Text style={{color:'#484848',fontSize:16,marginLeft:16,marginRight:16,marginTop:10,fontWeight:'bold'}}>{'StoreVue 為研華智誠旗下的智慧零售品牌，專注於提供連鎖門店智慧解決方案。StoreVue 提供雲端軟體服務並搭載研華科技之硬體方案，讓零售門店業者可以同時享受到彈性的 SaaS 服務以及高效能的硬體規格。'}</Text>
             <View style={{width:width-32,height:1,marginLeft:16, marginRight:16, backgroundColor:'#dcdcdc',marginTop:10}}/>
          <Text style={{color:'#484848',fontSize:16,marginLeft:16,marginRight:16,marginTop:10,fontWeight:'bold'}}>{'StoreVue, an Advantech iCity Services (AiCS) solution package, provides intelligent digital solutions for retail chains and stores. The StoreVue platform offers cloud-based software services that support Advantech hardware. Users can enjoy industrial-grade hardware equipped with flexible SaaS offerings that deliver business insights using big data to optimize operations management.'}</Text>*/}
            </View>
          )
      }
}
