import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, Platform} from "react-native";
import {Actions} from "react-native-router-flux";
import PropTypes from "prop-types";
import I18n from 'react-native-i18n';
import store from "../../mobx/Store";
import TimeUtil from "../utils/TimeUtil";
import PhoneInfo from "../entities/PhoneInfo";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";

const {width} = Dimensions.get('screen');
export default class ReportCell extends Component {
    state = {
        paramSelector: store.paramSelector
    };

    static propTypes =  {
        data: PropTypes.array,
        index: PropTypes.number,
        showMode: PropTypes.boolean,
        onSelect: PropTypes.function,
        length: PropTypes.number
    };

    static defaultProps = {
        data: [],
        showMode: false
    };

    render() {
        let {paramSelector} = this.state;
        let {data,length,index} = this.props;
        let summary = paramSelector.getSummaries().find(p => p.id === data.status);
        const date = TimeUtil.getDetailTime(data.ts);
        let modeText = data.mode === 0 ? I18n.t('Remote patrol') : I18n.t('Onsite patrol');

        let label = (data.standard !== -1) ? ((data.standard === 1) ? I18n.t('Compliance label') :
                I18n.t('Not-compliance label')) : '';
        let color = (data.standard === 0) ? 'rgb(245,120,72)' : 'rgb(89,171,34)';
        return (
            <TouchableOpacityEx style={[styles.container,{borderBottomWidth:index === length-1 ? 0 : 2}]} activeOpacity={0.5} onPress={()=> {
                Actions.push('reportDetail', {data});
            }}>
                <View style={{flexDirection:'row'}}>
                    <View style={styles.panel}>
                        <Text style={styles.storeName} numberOfLines={1}>{data.storeName}</Text>
                        <View style={styles.content}>
                            <Text style={styles.contentText}>{date[3]}  {date[1]}</Text>
                            <Text style={styles.contentText}>{(label !== '') ? ' | ' : ''}</Text>
                            <Text style={[styles.contentText, {color, marginTop: 2}]}>{label}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusPanel,{backgroundColor: summary.backgroundColor}]}>
                        <Text style={[styles.points,{color: summary.color,fontSize:PhoneInfo.isLongLanguage()?14:16}]}>{data.type == 1 ? '--' : data.totalScore}</Text>
                        <Text style={[styles.status,{fontSize:PhoneInfo.isLongLanguage()?11:14}]}>{summary.name}</Text>
                    </View>
                </View>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Text style={styles.information}>{modeText}</Text>
                    {data.isCheckInIgnore && <Text style={styles.ignore}>{I18n.t('Checkin Ignore')}</Text>}
                    <Text style={styles.information}> | {data.submitterName}</Text>
                </View>
                <Text style={styles.information}>{data.tagName}</Text>
            </TouchableOpacityEx>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor:'#fff',
        height: 84,
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
        flexDirection:'row',
        justifyContent: 'flex-start'
    },
    contentText:{
        fontSize:10,
        color:'#85898E',
        marginTop:2
    },
    points:{
        fontSize:16,
    },
    statusPanel:{
        paddingLeft:5,
        paddingRight:5,
        width:125,
        height:35,
        borderRadius:10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:'center'
    },
    status:{
        fontSize:14,
        color:'#6E6E6E',
        marginLeft:8
    },
    information:{
        color:'#85898E',
        fontSize:10,
        marginTop:2
    },
    ignore:{
        fontSize:10,
        color:'rgba(133, 137, 142, 0.5)',
        backgroundColor:'#EFEFEF',
        borderRadius:4,
        marginTop:2,
        marginLeft:2,
        paddingRight:4,
        paddingLeft:4
    }
});
