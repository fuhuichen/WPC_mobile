import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, TouchableWithoutFeedback,Image} from "react-native";
import PropTypes from "prop-types";
import {inject, observer} from "mobx-react";
import I18n from 'react-native-i18n';
import store from "../../mobx/Store";
import EventBus from "../common/EventBus";
import TimeUtil from "../utils/TimeUtil";
import finishCheck from "../assets/images/finish_check.png";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import * as BorderShadow from "../element/BorderShadow";
import {Phone} from "react-native-camera";
import PhoneInfo from "../entities/PhoneInfo";

const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class EventCell extends Component {
    state = {
        enumSelector: store.enumSelector,
        eventSelector: store.eventSelector
    };

    static propTypes =  {
        data: PropTypes.object.isRequired,
        showDoneLabel: PropTypes.boolean
    };

    static defaultProps = {
        showDoneLabel: true
    };

    onSelect(item){
        let {type} = this.props;
        let {eventSelector} = this.state;
        eventSelector.visible = true;
        eventSelector.collection = item;
        eventSelector.type = type;

        this.setState({eventSelector});
    }

    render() {
        const {data, type, showDoneLabel} = this.props;
        const {eventSelector, enumSelector} = this.state;

        const cellSelect = (eventSelector.visible && (eventSelector.collection != null
            && eventSelector.collection.storeId === data.key.storeId));
        const backgroundColor = (type === enumSelector.statusType.CLOSED) ? '#E9E9E9' : '#ECF7FF';

        let topContent = '', bottomContent = '', bottomStyle = styles.bottomLabel, marginTop = 10;
        if (data.key.numOfInprocess > 0){
            topContent = showDoneLabel ? I18n.t('Event cell done',{key: data.key.numOfInprocess}) :
                ((data.key.numOfRejected > 0) ? I18n.t('Event cell reject',{key: data.key.numOfRejected}) : '');
            bottomContent = ((data.key.numOfUnprocessed + data.key.numOfRejected) === 0) ? '' :
                I18n.t('Event cell unhandled',{key: (data.key.numOfUnprocessed + data.key.numOfRejected)});

            if (PhoneInfo.isEnLanguage()){
                bottomStyle = styles.bottomLabelEx;
                marginTop = 6;
            }
        }

        if ((data.key.numOfInprocess === 0) && ((data.key.numOfUnprocessed + data.key.numOfRejected) > 0)){
            topContent = (data.key.numOfRejected > 0) ? I18n.t('Event cell reject',{key: data.key.numOfRejected}) : '';
            bottomContent = I18n.t('Event cell unhandled',{key: (data.key.numOfUnprocessed + data.key.numOfRejected)});

            if (PhoneInfo.isEnLanguage()){
                bottomStyle = styles.bottomLabelEx;
                marginTop = 6;
            }
        }

        if ((data.key.numOfInprocess + data.key.numOfUnprocessed + data.key.numOfRejected) === 0){
            bottomContent = I18n.t('Closed');
        }

        let height = 124;
        (PhoneInfo.isTHLanguage() || PhoneInfo.isIDLanguage() || PhoneInfo.isVNLanguage()) && (height = 145);

        return (
            <View>
                <TouchableWithoutFeedback onPress={()=>{this.onSelect(data.key)}}>
                    <View style={[styles.container,{marginLeft: (data.value%3 !== 0) ? 10 : 1,marginTop:12,height}, BorderShadow.div,
                        cellSelect && BorderShadow.focus]}>
                        <View style={[styles.statusImg,{backgroundColor}]}>
                            <Text style={styles.name} numberOfLines={2}>{data.key.name}</Text>
                            {(type === enumSelector.statusType.CLOSED) && <Image source={finishCheck} style={styles.statusIcon}/>}
                        </View>
                        <Text style={[styles.topLabel, {marginTop}]}>{topContent}</Text>
                        <Text style={bottomStyle}>{bottomContent}</Text>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        width: (width-62)/3,
        height: 124,
        borderRadius: 10,
        padding:5,
        backgroundColor:'#ffffff',
        alignItems:'flex-start',
        borderColor:'#2C90D9',
    },
    bottomLabel:{
        fontSize:12,
        position: 'absolute',
        bottom:12,
        left:10,
        color:'#134BA5'
    },
    bottomLabelEx:{
        fontSize:12,
        position: 'absolute',
        bottom:8,
        left:10,
        color:'#134BA5'
    },
    name:{
        color:'#556679',
        padding:5,
        fontSize:16
    },
    statusIcon:{
        position: 'absolute',
        bottom:0,
        right:0,
        width:32,
        height:28
    },
    statusImg:{
        height:54,
        borderRadius:5,
        position:'relative',
        width:(width-62)/3-10
    },
    topLabel:{
        fontSize:12,
        color:'#434343',
        marginLeft:6,
        marginTop:10
    }
});
