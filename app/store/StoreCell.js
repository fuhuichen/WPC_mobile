import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, TouchableWithoutFeedback,Image} from "react-native";
import PropTypes from "prop-types";
import {inject, observer} from "mobx-react";
import I18n from 'react-native-i18n';
import store from "../../mobx/Store";
import EventBus from "../common/EventBus";
import TimeUtil from "../utils/TimeUtil";
import finishCheck from "../assets/images/finish_check.png";
import noTask from "../assets/images/no_task.png";
import BorderShadow from '../element/BorderShadow'
import PhoneInfo from "../entities/PhoneInfo";
import PatrolStorage from "../components/inspect/PatrolStorage";
const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class StoreCell extends Component {
    state = {
        storeSelector: store.storeSelector
    };

    static propTypes =  {
        data: PropTypes.object.isRequired,
        showDate: PropTypes.boolean
    };

    static defaultProps = {
        showDate: false
    };

    onSelect(item){
        EventBus.closeOptionSelector();

        let {storeSelector} = this.state;
        storeSelector.visible = true;
        storeSelector.collection = item;
        if(item.inspectTask.length !== 0){
            let text = '';
            if(item.lastInspect !== null && item.inspectTask.findIndex(p=>p.inspectReportId === -1) === -1){
                text = I18n.t('Inspection handled');
            }else{
                text = I18n.t('Inspection unhandled');
            }
            storeSelector.collection.status = text;
        }
        this.setState({storeSelector}, () => {
            EventBus.updateBaseStore();
        });
    }

    render() {
        const {data,showDate} = this.props;
        let {storeSelector} = this.state, fontSize = 11;
        let temporaries = PatrolStorage.getManualCaches();
        let task = data.key.inspectTask.filter(p => p.inspectReportId === -1).length;
        let temporary = temporaries.filter(p => p.storeName === data.key.name);

        let notFinish = data.key.inspectTask.some(p => p.inspectReportId === -1);
        const cellSelect = (storeSelector.visible && (storeSelector.collection != null
            && storeSelector.collection.storeId === data.key.storeId));
        const backgroundColor = (data.key.inspectTask.length !== 0 && !notFinish) ? '#E9E9E9' : '#ECF7FF';
        PhoneInfo.isJAKOLanguage() && (fontSize = 9);

        return (
            <View>
                <TouchableWithoutFeedback onPress={()=>{this.onSelect(data.key)}}>
                    <View style={[styles.container, {marginLeft: (data.value%3 !== 0) ? 10 : 1,marginTop:12}, BorderShadow.div,
                        cellSelect && BorderShadow.focus]}>
                        <View style={[styles.statusImg,{backgroundColor}]}>
                            <Text style={styles.name} numberOfLines={2}>{data.key.name}</Text>
                            {((data.key.inspectTask.length !== 0) && !notFinish) && <Image source={finishCheck} style={styles.statusIcon}/>}
                        </View>
                        {
                            (temporary.length > 0) ? <Text style={[styles.temporary,{marginTop: (temporary.length > 9) ? 6 : 10, fontSize}]}>
                                {I18n.t('Temporary count',{key: temporary.length})}
                                </Text> : null
                        }
                        {!showDate && (data.key.inspectTask.length === 0) && <Image source={noTask} style={styles.noTask}/>}
                        {showDate && (data.key.lastInspect != null) && <Text style={styles.ts}>{TimeUtil.getCurrentDate(data.key.lastInspect.ts)}</Text>}
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
    incomplete:{
        fontSize:13,
        position: 'absolute',
        bottom:12,
        left:10,
        color:'#134BA5'
    },
    finish:{
        fontSize:13,
        position: 'absolute',
        bottom:12,
        left:10,
        color:'#6E6E6E'
    },
    noTask:{
        position: 'absolute',
        right: 5,
        bottom: 0,
        borderRadius:10,
        width:42,
        height:38
    },
    saveReport:{
        fontSize:12,
        color:'#434343',
        marginLeft:5,
        marginTop:10
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
    ts:{
        fontSize:13,
        color:'#6E6E6E',
        position: 'absolute',
        bottom:12,
        left:10,
    },
    handled:{
        width:16,
        height:17,
        lineHeight:17,
        borderRadius:8,
        alignItems:'center',
        backgroundColor:'#484848'
    },
    task:{
        color:'#ffffff',
        fontSize:12
    },
    temporary:{
        fontSize:11,
        color:'#434343',
        marginLeft:6,
        marginTop:6,
        zIndex: 999
    }
});
