import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, Platform, TouchableOpacity} from "react-native";
import {Actions} from "react-native-router-flux";
import PropTypes from "prop-types";
import I18n from 'react-native-i18n';
import store from "../../../mobx/Store";
import TimeUtil from "../../utils/TimeUtil";
import PhoneInfo from "../../entities/PhoneInfo";
import TouchableOpacityEx from "../../touchables/TouchableOpacityEx";

const {width} = Dimensions.get('screen');
export default class RecordCell extends Component {
    state = {
        paramSelector: store.paramSelector
    };

    static propTypes =  {
        data: PropTypes.array,
        index: PropTypes.number,
        onSelect: PropTypes.function,
        length: PropTypes.number
    };

    static defaultProps = {
        data: []
    };

    render() {
        let {paramSelector} = this.state;
        let {data,length,index} = this.props;
        let summary = paramSelector.getCashCheckSummaries().find(p => p.id === data.advancedStatus);
        const date = TimeUtil.getDetailTime(data.ts);
        return (
            <TouchableOpacityEx style={[styles.container,{borderBottomWidth:index === length-1 ? 0 : 2}]} activeOpacity={0.5} onPress={()=> {
                Actions.push('recordDetail', {reportId: data.id, version: data.lastVersion});
            }}>
                <View style={{flexDirection:'row'}}>
                    <View style={styles.panel}>
                        <Text style={styles.storeName} numberOfLines={1}>{data.storeName}</Text>
                        <Text style={styles.content}>{date[3]}  {date[1]}</Text>
                        <Text style={styles.content}>{data.formName} | {data.submitterName}</Text>
                    </View>
                    {summary != null && <View style={[styles.statusPanel,{backgroundColor: summary.backgroundColor}]}>
                        <Text style={[styles.status,{color:summary.color, fontSize:PhoneInfo.isLongLanguage()?11:14}]}>{summary.name}</Text>
                    </View>}
                </View>
            </TouchableOpacityEx>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor:'#fff',
        height: 79,
        paddingTop:12,
        borderBottomColor:'#F2F2F2'
    },
    panel:{
        flex:45
    },
    storeName:{
        fontSize:14,
        color:'#64686D',
        marginRight:10
    },
    content:{
        fontSize:10,
        color:'#85898E',
        marginTop:2
    },
    statusPanel:{
        paddingLeft:5,
        paddingRight:5,
        width:80,
        height:35,
        borderRadius:10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:'center',
        marginTop: 10
    },
    status:{
        fontSize:14,
        color:'#6E6E6E'
    }
});
