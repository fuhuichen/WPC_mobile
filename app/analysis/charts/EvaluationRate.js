import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image} from "react-native";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import store from "../../../mobx/Store";
import * as BorderShadow from "../../element/BorderShadow";
import BadgeCard from "./BadgeCard";

const {width} = Dimensions.get('screen');
export default class EvaluationRate extends Component {
    state = {
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector
    };

    static propTypes = {
        viewType: PropTypes.number,
        average: PropTypes.number,
        standardScore: PropTypes.number,
        highest: PropTypes.object,
        lowest: PropTypes.object
    };

    render() {
        let {enumSelector, analysisSelector} = this.state;
        let {viewType, average, highest, lowest, standardScore} = this.props;
        let averageValue = analysisSelector.placeHolder;
        let scoreValue = analysisSelector.placeHolder;

        if (viewType === enumSelector.viewType.SUCCESS){
            averageValue = average;
            scoreValue = standardScore;
        }

        return (
            <View style={[styles.container, BorderShadow.div]}>
                <View style={styles.headerPanel}>
                    <Text style={styles.scoreLabel}>{I18n.t('Compliance score')}</Text>
                    <Text style={styles.score}>{scoreValue}</Text>
                </View>
                <View style={styles.content}>
                    <View style={styles.panel}>
                        <Text style={styles.title}>{I18n.t('All compliance rate')}</Text>
                        <View style={styles.averagePanel}>
                            <Text style={styles.average}>{averageValue}</Text>
                            <Text style={styles.unit}>%</Text>
                        </View>
                        <Image source={require('../../assets/img_slot_percent.png')} style={styles.percent}/>
                    </View>
                    <View style={styles.divider}/>
                    <BadgeCard viewType={viewType}
                               highest={highest}
                               lowest={lowest}
                               unitType={enumSelector.unitType.PERCENT}
                               onHigh={() => this.props.onHigh && this.props.onHigh()}
                               onLow={() => this.props.onLow && this.props.onLow()}/>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        width:width-20,
        height:152,
        marginTop:15,
        borderRadius:10,
        backgroundColor:'#fff'
    },
    headerPanel:{
        height:27,
        marginLeft: 10,
        flexDirection:'row',
        justifyContent:'flex-start',
        alignItems:'center'
    },
    scoreLabel:{
        fontSize:12,
        color:'rgb(100,104,109)',
        marginTop:10
    },
    score:{
        fontSize:12,
        color:'#E22472',
        marginTop:10
    },
    content:{
        width:width-20,
        paddingTop:16,
        paddingLeft:10,
        paddingRight:10,
        flexDirection:'row',
        justifyContent:'space-between'
    },
    panel:{
        width:140,
        height:99,
        alignItems:'center'
    },
    divider:{
        width:15
    },
    title:{
        fontSize:12,
        color:'rgb(100,104,109)'
    },
    averagePanel:{
        marginTop: 18,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    average:{
        fontSize: 36,
        color:'rgb(100,104,109)'
    },
    unit:{
        fontSize:10,
        color:'rgb(134,136,138)',
        marginTop:20,
        marginLeft:2
    },
    percent:{
        width:125,
        height:63,
        position:'absolute',
        left:8,
        bottom:13,
        opacity:0.7
    }
});
