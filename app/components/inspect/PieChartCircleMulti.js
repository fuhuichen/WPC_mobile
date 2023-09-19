import React, { Component } from 'react';
import {StyleSheet, Dimensions, View, Text, Image} from "react-native";
import PieChartLabel from "./PieChartLabel";
import I18n from 'react-native-i18n';
import PieChart from "react-native-svg-charts/src/pie-chart";
import Svg,{Stop, G, Circle,  LinearGradient, Polyline} from 'react-native-svg'
let {width} =  Dimensions.get('screen');
const OUTER_WIDTH = width-70;
const OUTER_HEIGHT = 178;
const HALF_WIDTH = 120;
const MAX_LABEL = 10;


export default class PieChartCircleMulti extends Component {
    constructor(props){
        super(props);
        this.colors = ['#6184CE', '#7B9FEB', '#7BD8EB', '#4DE197', '#ACF757',
        '#F7D057', '#FF986E', '#EC5F55', '#A156C5', '#ACABAB'];
    }
    renderRings(){
        var list = [1,0.7];
        return list.map(function(c,i){
            return    <Circle
                ref={'circle'+i}
                cx={HALF_WIDTH / 2}
                cy={HALF_WIDTH / 2}
                r={HALF_WIDTH*c/2}
                stroke="#AAA"
                strokeWidth={1}
                fill="transparent"
                strokeDasharray={[2, 2]}
                strokeLinecap="round"
            />
        }.bind(this))
    }
    render(){
        let items = [];
        this.props.data.forEach((item,index)=>{
            if (item.count >0){
                items.push({name:item.name, count:item.count});
            }
        });
        // console.log(this.props.data)
        // console.log(items)
        if(this.props.data == null || items.length == 0 ) return (
            <View style={{marginBottom:10,alignItems:'center',justifyContent:'center'}}>
                <Image style={{width:60,height:60}} source={require('../../assets/img_view_empty.png')} resizeMode='contain'/>
                <Text style={{fontSize: 14, color: '#d5dbe4', textAlign: 'center',marginTop:6}}>{I18n.t('No data')}</Text>
            </View>
        );

        items.sort((a, b) => b.count - a.count);
        if(items.length > MAX_LABEL){
           let part1 = items.slice(0, MAX_LABEL-1);
           let other = items.slice(MAX_LABEL-1,items.length);
           let count = 0;
           other.forEach((item,index)=>{
              count += item.count;
           });
           let part2 = {};
           part2.name = I18n.t('Other');
           part2.count = count;
           items = part1.concat(part2);
        }

        items.sort((a, b) => b.count - a.count);
        items.forEach((item,index)=>{
            let i = index % (this.colors.length);
            item.color = this.colors[i];
        });

        const outerData = [];
        items.forEach((item,index)=>{
            outerData.push({
                value:item.count,
                svg: {
                    fill: item.color,
                    onPress: () =>{},
                },
                key: `pie-${index}`,
            })
            });

        const innerData = items.map((item, index) => ({
                value:item.count,
                svg: {
                    fill: '#1f233434',
                    onPress: () => {},
                },
                key: `pie-${index}`,
            }));

        var nodes = items.map((item,index)=>{
            let showText = null;
            if(item.number != null){ showText = (
                <View style={{flexDirection:'row'}} >
                    <Text  allowFontScaling={false}  style={{fontSize:12}}>{item.number+I18n.t('People unit')}</Text>
                    <Text  allowFontScaling={false}  style={{fontSize:12}}>{'  |  '}</Text>
                </View>
            )}

            return (<View style={{height:14,flexDirection:'row'}} >
                <View style={{width:8,height:8,marginTop:3,marginRight:8,
                    backgroundColor:item.color}}></View>
                <View style={{flex:1,marginRight:3,flexDirection:'row'}}>
                    <Text  allowFontScaling={false}  style={{fontSize:9,color:'#86888A'}} numberOfLines={1} ellipsizeMode={'tail'}>{item.name}</Text>
                </View>
                {showText}
                <Text  allowFontScaling={false} style={{fontSize:9,color:'#86888A'}}>{item.count+'%'}</Text>
            </View>)
        });

        return(
            <View style={styles.container}>
                <View style={styles.outerCircle,{position:'absolute',left:16}}>
                    <View style={[styles.outerCircle]}>
                        <PieChartLabel
                            style={{height:HALF_WIDTH,width:HALF_WIDTH}}
                            data={outerData}
                        />
                        </View>
                </View>
                <View style={styles.outerCircle,{position:'absolute',left:16}}>
                        <Svg width={HALF_WIDTH} height={HALF_WIDTH} originX={0} originY={0}>
                            <G >
                              {this.renderRings()}
                            </G>
                        </Svg>
                </View>
                <View style={{width:OUTER_WIDTH/2-20,justifyContent:'center',position:'absolute',left:OUTER_WIDTH/2}}>
                    {nodes}
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        width: OUTER_WIDTH,
        height: OUTER_HEIGHT,
        backgroundColor: '#ffffff',
        alignItems:'center',
        borderRadius:10,
    },
    outerCircle:{
        width: HALF_WIDTH,
        height: HALF_WIDTH
    }
});
