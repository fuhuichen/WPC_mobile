import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image} from "react-native";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import store from "../../../mobx/Store";
import * as BorderShadow from "../../element/BorderShadow";
import BadgeCard from "./BadgeCard";

const {width} = Dimensions.get('screen');
export default class ClosureRate extends Component {
    state = {
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector
    };

    static propTypes = {
        viewType: PropTypes.number,
        average: PropTypes.number,
        highest: PropTypes.object,
        lowest: PropTypes.object,
        onHigh: PropTypes.func,
        onLow: PropTypes.func
    };

    render() {
        let {enumSelector, analysisSelector} = this.state;
        let {viewType, average, highest, lowest} = this.props;
        let score = analysisSelector.placeHolder;

        if (viewType === enumSelector.viewType.SUCCESS){
            score = average;
        }

        return (
            <View style={[styles.container, BorderShadow.div]}>
                <View style={styles.panel}>
                    <Text style={styles.title}>{I18n.t('Average closure rate')}</Text>
                    <View style={styles.scorePanel}>
                        <Text style={styles.score}>{score}</Text>
                        <Text style={styles.unit}>%</Text>
                    </View>
                    <Image source={require('../../assets/img_slot_curve.png')} style={styles.carve}/>
                </View>
                <View style={styles.divider}/>
                <BadgeCard viewType={viewType}
                           highest={highest}
                           lowest={lowest}
                           unitType={enumSelector.unitType.PERCENT}
                           onHigh={() => this.props.onHigh && this.props.onHigh()}
                           onLow={() => this.props.onLow && this.props.onLow()}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection:'row',
        justifyContent: 'space-between',
        width:width-20,
        height:125,
        paddingLeft:10,
        paddingRight:10,
        paddingTop:16,
        marginTop:15,
        borderRadius:10,
        backgroundColor:'#fff'
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
    scorePanel:{
        marginTop: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    score:{
        fontSize: 36,
        color:'rgb(100,104,109)'
    },
    unit:{
        fontSize:10,
        color:'rgb(134,136,138)',
        marginTop:20,
        marginLeft:2
    },
    carve:{
        width:140,
        height:43.5,
        position:'absolute',
        left:0,
        bottom:0,
        opacity:0.5
    }
});
