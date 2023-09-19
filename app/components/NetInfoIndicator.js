import React, {Component} from 'react';
import {
    Dimensions,
    Image, Text,
    View
} from 'react-native';
import {inject, observer} from "mobx-react";
import I18n from "react-native-i18n";
import store from "../../mobx/Store";
let {width} =  Dimensions.get('screen');

@inject('store')
@observer
export default class NetInfoIndicator extends Component {

    render(){
        let offline = store.netInfoSelector.offline;
        if (offline){
            return (
                <View style={{width:width,height:38,backgroundColor:'rgba(255,225,106,0.16)',alignItems:'center',justifyContent:'center',flexDirection: 'row'}}>
                    <Image style={{width:16,height:16}} source={require('../assets/images/offline.png')}/>
                    <Text style={{fontSize:12,textAlignVertical:'center',color:'#000',marginLeft:4}}>{I18n.t('Network error')}</Text>
                </View>
            )
        }
        else {
            return (<View/>)
        }
    }
}
