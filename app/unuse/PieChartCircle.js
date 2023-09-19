import React, { Component } from 'react';
import {StyleSheet, Dimensions, View, Text, Image} from "react-native";
import PieChartLabel from "./PieChartLabel";
import I18n from 'react-native-i18n';
import PieChart from "react-native-svg-charts/src/pie-chart";

let {width} =  Dimensions.get('screen');
const OUTER_WIDTH = width-32;
const HALF_WIDTH = OUTER_WIDTH/2;

type Props = {
    type: string,
    data: Array<number>,
    number:Array<number>
}

export default class PieChartCircle extends Component {
    constructor(props){
        super(props);

        this.itemType = {
            0:[{
                name: I18n.t('Dangerous'),
                color: '#ff5252'
            },
            {
                name: I18n.t('Improve'),
                color: '#ffd035'
            },
            {
                name: I18n.t('Good'),
                color: '#72a1f3'
            }],
            1:[{
                name: I18n.t('Pending'),
                color: '#fcba3f'
            },
            {
                name: I18n.t('Done'),
                color: '#434c5e'
            },
            {
                name: I18n.t('Closed'),
                color: '#6097f4'
            }],
            2:[{
                name: I18n.t('Member'),
                color: '#F8BC1C'
            },
            {
                name: I18n.t('VIP'),
                color: '#F58323'
            },
            {
                name: I18n.t('Black list'),
                color: '#444C5F'
            }],
            3:[{
                name: I18n.t('1 to 3 days'),
                color: '#F58323'
            },
            {
                name: I18n.t('4 to 7 days'),
                color: '#F8BC1C'
            },
            {
                name: I18n.t('8 to 15 days'),
                color: '#6097F4'
            },
            {
                name: I18n.t('16 to 30 days'),
                color: '#3463AA'
            },
            {
                name: I18n.t('30 days more'),
                color: '#444B5F'
            }]
        }
        this.items = this.itemType[this.props.type];
    }

    render(){
        if(this.props.data == null || this.props.data.length == 0 ) return (
            <View style={{marginBottom:10,alignItems:'center',justifyContent:'center'}}>
                <Image style={{width:100,height:100}} source={require('../assets/images/img_analysis_no_data.png')} resizeMode='contain'/>
                <Text style={{fontSize: 14, color: '#d5dbe4', textAlign: 'center',marginTop:6}}>{I18n.t('No data')}</Text>
            </View>
        );

        const outerData = [];
        this.props.data.forEach((value,index)=>{
                if(value > 0){
                    outerData.push({
                        value,
                        svg: {
                            fill: this.items[index].color,
                            onPress: () =>{},
                        },
                        key: `pie-${index}`,
                    })
                }
            });
        const innerData = this.props.data
            .filter(value => value > 0)
            .map((value, index) => ({
                value,
                svg: {
                    fill: '#1f233434',
                    onPress: () => {},
                },
                key: `pie-${index}`,
            }));

        var nodes = this.props.data.map(function(c,i){
            let showText = null;
            if(this.props.number != null && this.props.number.length > 0){ showText = (
                <View style={{flexDirection:'row'}} >
                    <Text  allowFontScaling={false}  style={{fontSize:12}}>{this.props.number[i]+I18n.t('People unit')}</Text>
                    <Text  allowFontScaling={false}  style={{fontSize:12}}>{'  |  '}</Text>
                </View>
            )}

            return (<View style={{height:30,flexDirection:'row'}} >
                <View style={{width:10,height:10,marginTop:3,marginRight:8,
                    backgroundColor:this.items[i].color}}></View>
                <View style={{flex:1,marginRight:3,flexDirection:'row'}}>
                    <Text  allowFontScaling={false}  style={{fontSize:12}}>{this.items[i].name}</Text>
                </View>
                {showText}
                <Text  allowFontScaling={false} style={{fontSize:12}}>{this.props.data[i]+'%'}</Text>
            </View>)
        }.bind(this));

        let marginTop = 0;
        if (this.props.type == 0){
            marginTop = 55;
        }
        else if (this.props.type === 3){
            marginTop = 30;
        }
        else {
            marginTop = 55;
        }

        return(
            <View style={styles.container}>
                <View style={styles.outerCircle}>
                    <View style={[styles.outerCircle,{position:'absolute',top:0,left:-3,width:HALF_WIDTH+20}]}>
                        <PieChart
                            width={HALF_WIDTH+20 }
                            style={ { height: HALF_WIDTH+20} }
                            data={ [{
                                value:1,
                                svg: {
                                    fill: '#f6f8fa',
                                    onPress: () => {},
                                },
                                key: 'pie-0'
                            }] }
                            outerRadius={'95%'}
                            innerRadius={'89%'}
                            sort={null}
                            padAngle={Math.PI/36}></PieChart>
                    </View>
                    <View style={[styles.outerCircle,{position:'absolute',top:10,left:7}]}>
                        <PieChartLabel
                            width={HALF_WIDTH-20}
                            style={{height:HALF_WIDTH}}
                            outerRadius={'95%'}
                            innerRadius={'75%'}
                            data={outerData}
                        />
                    </View>
                    <View style={[styles.outerCircle,{position:'absolute',top:10,left:7}]}>
                        <PieChart
                            width={HALF_WIDTH-20 }
                            style={ { height: HALF_WIDTH} }
                            data={ innerData }
                            outerRadius={'62%'}
                            innerRadius={'50%'}
                            sort={null}
                            padAngle={Math.PI/36}></PieChart>
                    </View>
                </View>
                <View style={{width:HALF_WIDTH-30,height:HALF_WIDTH-50,marginLeft:30,
                    marginTop:marginTop}}>
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
        height: HALF_WIDTH+20,
        backgroundColor: '#ffffff'
    },
    outerCircle:{
        width: HALF_WIDTH,
        height: HALF_WIDTH
    }
});
