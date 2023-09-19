import React, {Component} from 'react';
import { DeviceEventEmitter, StyleSheet, View, Text, Dimensions, Image, TouchableOpacity} from "react-native";
import PropTypes from 'prop-types';
import {Divider} from "react-native-elements";
import I18n from 'react-native-i18n';
import {Actions} from "react-native-router-flux";
import store from "../../mobx/Store";
import * as BorderShadow from "../element/BorderShadow";
import moment from "moment";
import {getStoreInfo} from "../common/FetchRequest";

const {width} = Dimensions.get('screen');
export default class ScheduleCell extends Component {
    state = {
        enumSelector: store.enumSelector,
        paramSelector: store.paramSelector,
        approveSelector: store.approveSelector
    };

    static propTypes = {
        data: PropTypes.object.isRequired
    };

    static defaultProps = {
    };

    constructor(props){
        super(props);
    }

    onRouter(){
    }

    async onExecuteInspection() {
        let {data} = this.props;
        let {enumSelector} = this.state;

        if(data.tagExecutable == false) {            
            DeviceEventEmitter.emit('Toast', I18n.t('Service permission'));
            return;
        }

        let store = {
            storeId: data.storeId,
            name: data.storeName
        }
        let inspect = {
            id: data.inspectTagId,
            name: data.inspectTagName,
            mode: data.inspectTagMode
        }

        let resultStoreInfo = await getStoreInfo(store.storeId, false);
        if (resultStoreInfo.errCode == enumSelector.errorType.SUCCESS){
            store = resultStoreInfo.data;
        }

        Actions.push('patrol',{store, inspect, scheduleId: data.taskId});
    }

    render() {
        let {data} = this.props;
        let {paramSelector, enumSelector} = this.state, status = '', color = null;
        let scheduleState = data.isExecute ? enumSelector.scheduleState.DONE : enumSelector.scheduleState.PENDING;
        let statusMap = paramSelector.getScheduleStateMap().find(p => p.type === scheduleState);

        if (statusMap != null){
            status = statusMap.name;
            color = statusMap.color;

            if (data.isExecute){
                status = status + " " + moment(data.executeTs).format("YYYY/MM/DD HH:mm");
            }
        }

        let waitExecute = false;
        if(data.isExecute == false && moment().utc().endOf('day').unix()*1000 >= data.remindTime) {
            waitExecute = true;
        }

        return (
            <TouchableOpacity activeOpacity={1} onPress={() => {this.onRouter()}}>
                <View style={[styles.container, BorderShadow.div]}>
                    <Text style={styles.storeName} numberOfLines={1}>{data.storeName + '(' + data.taskName + ')'}</Text>
                    <Divider style={styles.divider}/>
                    <Text style={[styles.content,{marginTop:12}]} numberOfLines={1}>{I18n.t('Inspection table') + ' : ' + data.inspectTagName}</Text>
                    <Text style={[styles.content,{marginTop:7}]} numberOfLines={1}>{I18n.t('Start') + ' : ' + moment(data.remindTime).utc().format("YYYY/MM/DD")}</Text>
                    <View style={styles.panel}>
                        <Text style={[styles.status,{color:color}]}>{status}</Text>
                        {data.isExecute == false && 
                            (waitExecute == true ? <Text style={styles.execute} onPress={async () => {await this.onExecuteInspection()}}>{I18n.t('Execute inspection')}</Text> : 
                                                   <Text style={styles.notYetStart}>{I18n.t('Not yet start')}</Text>)}
                    </View>
                </View>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        width: width-48,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 16,
        paddingBottom: 11,
        borderRadius: 10,
        backgroundColor: '#fff',
        marginTop: 12
    },
    storeName:{
        fontSize: 14,
        color: 'rgb(0,106,183)',
        maxWidth: width-80
    },
    divider:{
        width: width-80,
        height: 2,
        borderBottomWidth: 0,
        marginTop: 11,
        backgroundColor:'#F2F2F2',
    },
    content:{
        fontSize: 12,
        color: 'rgb(134,136,138)'
    },
    panel:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 7,
        alignItems: 'center'
    },
    date:{
        fontSize: 12,
        color: 'rgb(134,136,138)'
    },
    status:{
        fontSize: 12,
        color: 'rgb(0,106,183)'
    },
    execute:{
        fontSize: 14,
        color: 'rgb(0,106,183)'
    },
    notYetStart:{
        fontSize: 14,
        color: 'rgb(134,136,138)'
    }
});
