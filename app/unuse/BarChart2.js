import React, {Component} from 'react';

import {
    View,
    Text,
    Dimensions, Image
} from 'react-native';
import I18n from "react-native-i18n";

export default class BarChart2 extends Component {

    constructor(props) {
        super(props);
    }

    compare(a,b){
        if (b.count1 > a.count1){
            return 1
        }
        else if (b.count1 === a.count1){
            return b.count2 - a.count2
        }
        else {
            return -1;
        }
    }

    findMax(items){
        let max = 1 ;
        items.map(function(item,index) {
            if (item.count1 > max){
                max = item.count1
            }
            if (item.count2 > max){
                max = item.count2
            }
        })
        return max ;
    }

    render() {
        let items = [];
        this.props.items.forEach((item,index)=>{
            if (item.count1 >0 || item.count2 > 0){
                items.push({name: item.name, count1:item.count1 ,count2:item.count2});
            }
        });
        let color1 = this.props.color[0];
        let color2 = this.props.color[1];
        if(!items || items.length === 0) return (
            <View style={{marginBottom:10,alignItems:'center',justifyContent:'center'}}>
                <Image style={{width:100,height:100}} source={require('../assets/images/img_analysis_no_data.png')} resizeMode='contain'/>
                <Text style={{fontSize: 14, color: '#d5dbe4', textAlign: 'center',marginTop:6}}>{I18n.t('No data')}</Text>
            </View>
        );
        items.sort(this.compare);
        let subItem = items.splice(0, items.length>4 ? 5: items.length);
        let screenWidth = Dimensions.get('screen').width;
        let max = this.findMax(subItem);
        let nodes = subItem.map(function(item,index) {
            let width1 = ((screenWidth - 70) * item.count1) /max;
            let width2 = ((screenWidth - 70) * item.count2) /max;
            return  <View>
                <View style={{flexDirection:'row',alignItems:'center'}}>
                    <Text allowFontScaling={false} style={{color:'#19293b',fontSize:14}}>{(index+1)+' '+ item.name}</Text>
                </View>
                <View style={{marginTop:4, flexDirection:'row', alignItems:'center'}}>
                    <View style={{height:12,width:width1,backgroundColor:color1}}></View>
                    <View style={{flex:1}}></View>
                    <Text allowFontScaling={false} style={{marginLeft:8,color:color1,fontSize:14}}>{item.count1}</Text>
                </View>
                <View style={{marginTop:-5,marginBottom:12, flexDirection:'row', alignItems:'center'}}>
                    <View style={{height:12,width:width2,backgroundColor:color2}}></View>
                    <View style={{flex:1}}></View>
                    <Text allowFontScaling={false} style={{marginLeft:8,color:color2,fontSize:14}}>{item.count2}</Text>
                </View>
            </View>
        }.bind(this));
        return nodes;
    }
}

