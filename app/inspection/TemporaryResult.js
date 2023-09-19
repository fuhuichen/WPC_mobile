import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, DeviceEventEmitter, Platform} from "react-native";
import PropTypes from 'prop-types';
import I18n from "react-native-i18n";
import * as lib from '../common/PositionLib';
import BoxShadow from "react-native-shadow/lib/BoxShadow";

const {width} = Dimensions.get('screen');
export default class TemporaryResult extends Component {
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
            title = status ? I18n.t('Temporary success') : I18n.t('Temporary failure');
            source = status ? require('../assets/img_temporary_success.png') : require('../assets/img_submit_failure.png');

            setTimeout(() => {
                this.props.reset && this.props.reset();
            }, 3000);
        }

        return (
            (status != null) ? <BoxShadow setting={{width:218, height:40, color:"#000000",
                border:1, radius:16, opacity:0.04, x:0, y:1, style:{
                    position:'absolute',top:lib.defaultStatusHeight() + Platform.select({android:10, ios:32}),left: (width-218)/2}
                }}>
                <View style={styles.container}>
                    <Text style={styles.content}>{title}</Text>
                    <Image style={styles.icon} source={source} />
                </View>
            </BoxShadow>: null
        )
    }
}

const styles = StyleSheet.create({
    container: {
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
        width: 24,
        height: 24
    }
});
