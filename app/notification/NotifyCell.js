import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, Platform} from "react-native";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import UserPojo from "../entities/UserPojo";
import * as BorderShadow from "../element/BorderShadow";
import store from "../../mobx/Store";
import {Divider} from "react-native-elements";
import TimeUtil from "../utils/TimeUtil";
import {Actions} from 'react-native-router-flux';

const {width} = Dimensions.get('screen');
export default class NotifyCell extends Component {
    state = {
        enumSelector: store.enumSelector
    };

    static propTypes = {
        data: PropTypes.object,
        onClick: PropTypes.func,
        onDelete: PropTypes.func
    };

    onClick(){
        this.props.onClick && this.props.onClick();
    }

    onDelete(){
        this.props.onDelete && this.props.onDelete();
    }

    onDetail(extContent){
        if(extContent.length > 0) {
            extContent = extContent.sort((a,b)=> { return a.timestamp < b.timestamp; });
            Actions.push('ApproveRejectDetail', { data: extContent });
        }
    }

    render() {
        let {data} = this.props;
        let {notifyType} = this.state.enumSelector;

        let content = JSON.parse(data.content);
        let extContent = "", actionType = null;
        let header = null, subject = null, submitter = null;

        if(data.extContent != "") {
            actionType = JSON.parse(data.extContent).actionType;
            if(actionType == 0) {
                extContent = JSON.parse(JSON.parse(data.extContent).content);
            }
        }

        if (data.messageType === notifyType.EVENT || data.messageType === notifyType.REPORT){
            header = content[0].storeName;
            subject = <Text style={styles.subject}>{data.subject}</Text>;
            submitter = <Text style={styles.submitter}>{content[0].submitter}</Text>;
        } else if (data.messageType === notifyType.APPROVE) {
            header = content[0].storeName;
            subject = <Text style={styles.subject}>{data.subject}</Text>;
            submitter = <Text style={styles.submitter}>{content[0].submitterName}</Text>;
        } else if (data.messageType === notifyType.SCHEDULE) {
            header = content[0].storeName;
            let subjectText = '【' + content[0].storeName + '】[' + content[0].tagMode + '] ' + 
                                content[0].tagName + ' ' + I18n.t('Schedule reminder', {date: content[0].remindTime})
            subject = <Text style={styles.subject}>{subjectText}</Text>;
        }

        let date = TimeUtil.getDetailTime(data.ts);
        let label = data.read ? I18n.t('Read') : I18n.t('Unread');
        let color = data.read ? 'rgb(89,171,34)' : 'rgb(245,120,72)';
        return (
            <TouchableOpacity activeOpacity={0.5} onPress={() => this.onClick()}>
                <View style={[styles.container, BorderShadow.div]}>
                    <Text style={styles.header} numberOfLines={2}>
                        [{UserPojo.getAccountName(data.accountId)}]  {header}
                    </Text>
                    <Divider style={styles.divider}/>
                    {subject}
                    {submitter}
                    <View style={styles.operator}>
                        <Text style={styles.date}>{date[3]} {date[1]}</Text>
                        <Text style={[styles.label,{color}]}>{label}</Text>
                        <View style={{flex:1}}/>
                        {(data.extContent != "" && actionType == 0) && <TouchableOpacity activeOpacity={0.5} onPress={() => this.onDetail(extContent)}>
                            <Text style={styles.detail}>{I18n.t('Detail')}</Text>
                        </TouchableOpacity>}
                        <TouchableOpacity activeOpacity={0.5} onPress={() => this.onDelete()}>
                            <Text style={styles.delete}>{I18n.t('Delete')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 10,
        backgroundColor:'#fff',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 16,
        paddingBottom: 11
    },
    header:{
        color:'rgb(1,106,183)',
        lineHeight: 19
    },
    divider:{
        height:2,
        marginTop:11,
        backgroundColor: 'rgb(242,242,242)',
        borderBottomWidth:0
    },
    operator:{
        flexDirection:'row',
        justifyContent:'flex-start',
        marginTop: 5
    },
    subject:{
        fontSize:12,
        color:'rgb(134,136,138)',
        marginTop:12,
        lineHeight: 16
    },
    submitter:{
        fontSize:12,
        color:'rgb(134,136,138)',
        marginTop:7,
        lineHeight:16
    },
    date:{
        fontSize:12,
        marginTop:2,
        color:'rgb(134,136,138)'
    },
    label:{
        fontSize:12,
        marginLeft:20,
        ...Platform.select({
            android:{
                marginTop:2,
            },
            ios:{
                marginTop:3,
            }
        })
    },
    delete:{
        fontSize:14,
        color:'rgb(0,106,183)'
    },
    detail:{
        fontSize:14,
        color:'rgb(0,106,183)',
        marginRight: 15
    }
});
