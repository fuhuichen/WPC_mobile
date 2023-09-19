import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, DeviceEventEmitter, Platform} from "react-native";
import PropTypes from 'prop-types';
import I18n from "react-native-i18n";
import {Actions} from "react-native-router-flux";
import * as lib from '../common/PositionLib';
import Navigation from "../element/Navigation";
import RouteCore from "../common/RouteCore";
import BusyIndicator from "../components/BusyIndicator";
import PatrolReport from "../components/inspect/PatrolReport";
import AndroidBacker from "../components/AndroidBacker";

const {width} = Dimensions.get('screen');
export default class PatrolResult extends Component {
    static propTypes = {
        status: PropTypes.any,
        report: PropTypes.object,
        reset: PropTypes.func
    };

    static defaultProps = {
        status: null
    };

    render() {
        let {status} = this.props, title = '', source = '';

        if (status != null){
            title = status ? I18n.t('Inspection success') : I18n.t('Inspection failure');
            source = status ? require('../assets/img_submit_success.png') : require('../assets/img_submit_failure.png');

            setTimeout(() => {
                this.props.reset && this.props.reset();
            }, 3000);
        }

        return (
            (status != null) ? <View style={styles.container}>
                <Text style={styles.content}>{title}</Text>
                <Image style={styles.icon} source={source} />
            </View> : null
        )
    }
}

const styles = StyleSheet.create({
    container: {
        position:'absolute',
        left: (width-218)/2,
        top: lib.defaultStatusHeight() + Platform.select({
            android:16,
            ios:38
        }),
        width:218,
        height:40,
        borderRadius:16,
        backgroundColor:'#fff',
        alignItems:'center',
        justifyContent:'center'
    },
    content:{
        fontSize:14,
        color:'#64686D'
    },
    icon:{
        position:'absolute',
        right:8,
        bottom:8,
        width:24,
        height:24
    }
});
