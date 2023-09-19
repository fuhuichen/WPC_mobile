import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity} from "react-native";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import store from "../../../mobx/Store";

const {width} = Dimensions.get('screen');
export default class BadgeCard extends Component {
    state = {
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector
    };

    static propTypes = {
        viewType: PropTypes.number,
        unitType: PropTypes.number,
        highest: PropTypes.object,
        lowest: PropTypes.object,
        onHigh: PropTypes.func,
        onLow: PropTypes.func
    };

    renderHighest(){
        let {enumSelector, analysisSelector} = this.state;
        let {viewType, unitType, highest} = this.props;

        let highKey = analysisSelector.placeHolder;
        let highValue = analysisSelector.placeHolder;
        let unit = (unitType === enumSelector.unitType.POINT) ? I18n.t('Points') : '%';
        let activeOpacity = 1, router = () => {};

        if ((viewType === enumSelector.viewType.SUCCESS) && (highest != null)){
            highKey = highest.groupName;
            highValue = highest.quota;

            activeOpacity = 0.5;
            router = () => {this.props.onHigh && this.props.onHigh()};
        }

        return <TouchableOpacity activeOpacity={activeOpacity} onPress={() => router()}>
            <View style={styles.highPanel}>
                <View style={styles.topPanel}>
                    <View style={styles.keyPanel}>
                        <Text style={styles.highLabel}>{I18n.t('Highest')}</Text>
                    </View>
                    <View style={{width:12}}/>
                    <View style={styles.valuePanel}>
                        <Text style={styles.highValue}>{highValue}</Text>
                        <Text style={styles.unit}>{unit}</Text>
                    </View>
                </View>
                <Text style={styles.title} numberOfLines={1}>{highKey}</Text>
            </View>
        </TouchableOpacity>
    }

    renderLowest(){
        let {enumSelector, analysisSelector} = this.state;
        let {viewType, unitType, lowest} = this.props;

        let lowKey = analysisSelector.placeHolder;
        let lowValue = analysisSelector.placeHolder;
        let unit = (unitType === enumSelector.unitType.POINT) ? I18n.t('Points') : '%';
        let activeOpacity = 1, router = () => {};

        if ((viewType === enumSelector.viewType.SUCCESS) && (lowest != null)){
            lowKey = lowest.groupName;
            lowValue = lowest.quota;

            activeOpacity = 0.5;
            router = () => {this.props.onLow && this.props.onLow()};
        }

        return <TouchableOpacity activeOpacity={activeOpacity} onPress={() => router()}>
            <View style={styles.lowPanel}>
                <View style={styles.topPanel}>
                    <View style={styles.keyPanel}>
                        <Text style={styles.lowLabel}>{I18n.t('Lowest')}</Text>
                    </View>
                    <View style={{width:12}}/>
                    <View style={styles.valuePanel}>
                        <Text style={styles.lowValue}>{lowValue}</Text>
                        <Text style={styles.unit}>{unit}</Text>
                    </View>
                </View>
                <Text style={styles.title} numberOfLines={1}>{lowKey}</Text>
            </View>
        </TouchableOpacity>
    }

    render() {
        return (
            <View style={styles.container}>
                {this.renderHighest()}
                {this.renderLowest()}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    highPanel:{
        height:48,
        borderRadius:10,
        backgroundColor:'rgb(238,246,232)',
        paddingLeft:9,
        paddingRight:9,
        paddingTop:3,
        paddingBottom:4
    },
    topPanel:{
        borderRadius:10,
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center'
    },
    lowPanel:{
        height:48,
        borderRadius:10,
        backgroundColor:'rgb(255,239,245)',
        paddingLeft:9,
        paddingRight:9,
        marginTop:5,
        paddingTop:3,
        paddingBottom:4
    },
    keyPanel:{
        flex:1,
        flexDirection:'row',
        justifyContent:'flex-start'
    },
    valuePanel:{
        width:51,
        flexDirection:'row',
        justifyContent:'flex-end'
    },
    highLabel:{
        fontSize:12,
        color:'rgb(89,171,34)'
    },
    lowLabel:{
        fontSize:12,
        color:'rgb(226,36,114)'
    },
    title:{
        fontSize:12,
        color:'rgb(110,110,110)'
    },
    highValue:{
        fontSize:16,
        color:'rgb(89,171,34)'
    },
    lowValue:{
        fontSize:16,
        color:'rgb(226,36,114)'
    },
    unit:{
        fontSize:10,
        color:'rgb(134,136,138)',
        marginTop: 6,
        marginLeft:2
    }
});
