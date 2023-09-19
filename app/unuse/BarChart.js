import React, {Component} from 'react';

import {
    View,
    Text,
    Dimensions, Image
} from 'react-native';
import I18n from "react-native-i18n";

export default class BarChart extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        let items = [];
        this.props.items.forEach((item,index)=>{
            if (item.count >0){
                items.push({name: item.name, count:item.count});
            }
        });
        let color = this.props.color;
        if(!items || items.length === 0) return (
            <View style={{marginBottom:10,alignItems:'center',justifyContent:'center'}}>
                <Image style={{width:100,height:100}} source={require('../assets/images/img_analysis_no_data.png')} resizeMode='contain'/>
                <Text style={{fontSize: 14, color: '#d5dbe4', textAlign: 'center',marginTop:6}}>{I18n.t('No data')}</Text>
            </View>
        );
        items.sort((a, b) => b.count - a.count);
        let subItem = items.splice(0, items.length>4 ? 5: items.length);
        let max = subItem[0].count >0 ? subItem[0].count : 1;
        let nodes = subItem.map(function(item,index) {
            let width = ((Dimensions.get('screen').width - 32) * item.count) /max;
            return  <View>
                <View style={{flexDirection:'row',alignItems:'center'}}>
                    <Text allowFontScaling={false} numberOfLines={1} style={{color:'#19293b',fontSize:14,width:300}}>{(index+1)+' '+ item.name}</Text>
                    <View style={{flex:1}}></View>
                    <Text allowFontScaling={false} style={{color:color,fontSize:14}}>{item.count}</Text>
                </View>
                <View style={{marginTop:4, marginBottom:12, flexDirection:'row', alignItems:'center'}}>
                    <View style={{height:12,width:width,backgroundColor:color}}></View>
                </View>
            </View>
        }.bind(this));
        return nodes;
    }
}

