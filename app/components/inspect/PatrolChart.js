import React, {Component} from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Text
} from 'react-native';
import PropTypes from 'prop-types';
import RadarChart from './RadarChart';
import PieChartCircleMulti from './PieChartCircleMulti';
import StringUtil from "../../utils/StringUtil";
import {Divider} from "react-native-elements";
import I18n from 'react-native-i18n';
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import store from "../../../mobx/Store";
import ViewIndicator from "../../customization/ViewIndicator";

let {width} =  Dimensions.get('screen');

export default class PatrolChart extends Component {
    static state = {
        enumSelector: store.enumSelector,
        viewType: store.enumSelector.viewType.LOADING
    };

    static propTypes = {
        statistics: PropTypes.object
    };

    getRadarData(){
        let radarData = [], radarLabels = [];
        let {data, qualified} = this.props.statistics;

        let categories = data.filter(p => p.parentId === -1);
        categories.forEach((item) => {
            let items = data.filter(p => (p.parentId !== -1) ? (p.parentId === item.groupId)
                : (p.groupName === item.groupName));

            let numerator = items.reduce((p,e) => p + ((qualified === 1) ? e.numOfUnqualifiedItems : e.numOfQualifiedItems), 0);
            let denominator = items.reduce((p,e) => p + e.numOfQualifiedItems + e.numOfUnqualifiedItems, 0);
            let score = (denominator !== 0) ? (numerator/denominator) : 0;

            let totalCount = items.reduce((p,e) => p + e.numOfTotalItems, 0);
            let commentCount = items.reduce((p,e) => p + e.numOfCommentItems, 0);

            if (totalCount !== commentCount){
                radarData.push(score);
                radarLabels.push(item.groupName);
            }
        });

        return {radarData, radarLabels};
    }

    getPieData(){
        let {data, qualified} = this.props.statistics, pieData = [];

        let qualifiedItems = data.reduce((p,e) => p + e.numOfQualifiedItems, 0);
        let unQualifiedItems = data.reduce((p,e) => p + e.numOfUnqualifiedItems, 0);
        let categories = data.filter(p => p.parentId === -1);
        categories.forEach((item) => {
            let items = data.filter(p => (p.parentId !== -1) ? (p.parentId === item.groupId)
                : (p.groupName === item.groupName));

            let numerator = items.reduce((p,e) => p + ((qualified === 1) ? e.numOfUnqualifiedItems : e.numOfQualifiedItems), 0);
            let denominator = (qualified === 1) ? unQualifiedItems : qualifiedItems;
            let count = (denominator !== 0) ? (numerator/denominator) : 0;

            let totalCount = items.reduce((p,e) => p + e.numOfTotalItems, 0);
            let commentCount = items.reduce((p,e) => p + e.numOfCommentItems, 0);

            if (totalCount !== commentCount){
                pieData.push({name:item.groupName,count: Math.round(count*100)})
            }
        });

        return pieData;
    }

    render() {

        let {chart} = this.props.statistics, component = null;
        let data = (chart === 0) ? this.getRadarData() : this.getPieData();

        if (chart === 0){
            if ((data.radarData != null) && data.radarData.length > 0){
                component = <RadarChart width={width-32}
                                        height={178}
                                        radius={60}
                                        data={data.radarData}
                                        labels ={data.radarLabels}/>;
            }else {
                component = <ViewIndicator viewType={store.enumSelector.viewType.EMPTY}
                                            containerStyle={{justifyContent:'center'}}
                                            indicatorStyle={{width:60,height:60}}/>
            }
        }else {
            component = <PieChartCircleMulti data={data}/>;
        }

        return (
            <View>
                <Divider style={styles.divider}/>
                <Text style={styles.label}>{(chart === 0) ? I18n.t('Radar chart') : I18n.t('Pie chart')}</Text>

                <BoxShadow setting={{width:width-60, height:178, color:"#000000",
                    border:2, radius:16, opacity:0.1, x:0, y:1, style:{marginRight:4,marginLeft:20,marginBottom:10}}}>
                    <View style={[styles.radarPanel]}>
                        {component}
                    </View>
                </BoxShadow>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    radarPanel:{
        marginBottom:10,
        width:width-60,
        height:178,
        borderRadius:16,
        alignItems:'center',
        justifyContent:'center',
        backgroundColor:'#fff',
    },
    divider:{
        backgroundColor:'#fff',
        width:width-60,
        marginLeft:20,
        marginTop:10,
        marginBottom:16,
        height:2,
        borderBottomWidth:0
    },
    label:{
        fontSize:14,
        color:'#86888A',
        marginLeft:24,
        marginBottom:16
    }
});
