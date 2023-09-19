import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, DeviceEventEmitter, Platform} from "react-native";
import PropTypes from 'prop-types';
import I18n from "react-native-i18n";
import * as lib from '../common/PositionLib';
import store from "../../mobx/Store";
import {EventCore} from "./EventCore";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import PhoneInfo from "../entities/PhoneInfo";

const {width} = Dimensions.get('screen');
export default class ProcessResult extends Component {
    state = {
        enumSelector: store.enumSelector
    };

    static propTypes = {
        actionType: PropTypes.number,
        actionResult: PropTypes.any,
        margin: PropTypes.number,
        reset: PropTypes.func
    };

    static defaultProps = {
        actionType: store.enumSelector.actionType.ADD,
        actionResult: null,
        margin: 0
    };

    constructor(props){
        super(props);

        this.map = [EventCore.add(),EventCore.handle(),EventCore.close(),EventCore.reject()];
    }

    render() {
        let {actionResult, actionType, margin} = this.props, title = '', source = '', contentWidth = 218;
        PhoneInfo.isJAKOLanguage() && (contentWidth = 268);

        if (actionResult != null){
            if (this.props.title != null){
                title = this.props.title
            }
            else{
                title = actionResult ? I18n.t('Event handle success') : I18n.t('Event handle failure');
                title = this.map.find(p => p.type === actionType).name +title;
    
                if (!actionResult && PhoneInfo.isEnLanguage()){
                    title = title + this.map.find(p => p.type === actionType).name;
                }
            }
            source = actionResult ? require('../assets/img_submit_success.png') : require('../assets/img_submit_failure.png');

            setTimeout(() => {
                this.props.reset && this.props.reset();
            }, 3000);
        }

        return (
            (actionResult != null) ? <BoxShadow setting={{width:contentWidth, height:40, color:"#000000",
                border:1, radius:16, opacity:0.1, x:0, y:1, style:{position:'absolute', left: (width-contentWidth)/2,
                    top:lib.defaultStatusHeight() + Platform.select({android:16, ios:38})+margin}}}>
                <View style={[styles.container,{width: contentWidth}]}>
                    <Text style={styles.content}>{title}</Text>
                    <Image style={styles.icon} source={source} />
                </View>
            </BoxShadow>: null
        )
    }
}

const styles = StyleSheet.create({
    container: {
        position:'absolute',
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
