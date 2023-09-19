import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity} from "react-native";
import PropTypes from 'prop-types';
import {Divider} from "react-native-elements";
import I18n from 'react-native-i18n';
import * as BorderShadow from "../../element/BorderShadow";
import CommentResourcesBlock from "../../components/comment/CommentResourcesBlock";
import moment from "moment";
import store from "../../../mobx/Store";

const {width} = Dimensions.get('screen');
export default class ApprovingCard extends Component {
    static propTypes = {
        data: PropTypes.object
    };

    constructor(props){
        super(props);

        this.styles = [
            {
                type: 0,    // 同意
                color: 'rgb(89,171,34)',
                backgroundColor:'rgb(237,246,232)',
                text: I18n.t('Agree')
            },
            {
                type: 1,    // 駁回
                color: 'rgb(245,120,72)',
                backgroundColor:'rgb(255,242,239)',
                text: I18n.t('Approve Reject')
            },
            {
                type: -1,   // 取消
                color: 'rgb(245,120,72)',
                backgroundColor:'rgb(255,242,239)',
                text: I18n.t('Cancel')
            },
            {
                type: -2,   // 撤回
                color: 'rgb(245,120,72)',
                backgroundColor:'rgb(255,242,239)',
                text: I18n.t('Approve Withdraw')
            }
        ];
    }

    renderGroup(item, index){
        let marginBottom = (index === 0) ? 12 : 19;
        let auditByUsers = item.assignee, comment = item.comment, attachment = [];
        let styleInfo = this.styles.find(p => p.type === comment.result) || this.styles[0];

        if(comment.signature) {
            // 簽名的type沒用到，永遠當成IMAGE
            comment.signature.map(p => attachment.push({mediaType: store.enumSelector.mediaTypes.IMAGE, url: p.content}));
        }

        if(comment.attachment) {
            attachment = attachment.concat(comment.attachment);
        }

        return (
            <View style={[styles.viewPanel, BorderShadow.div, {marginBottom}]}>
                <View style={styles.infoPanel}>
                    {auditByUsers && <Text style={[styles.info,{maxWidth: width-220}]} numberOfLines={1}>
                        {auditByUsers.titleName} {auditByUsers.userName}
                    </Text>}
                    <Text style={[styles.info,{marginLeft:3}]}>
                        ({moment(item.endTs).format('YYYY/MM/DD HH:mm')})
                    </Text>
                </View>
                {(comment.description !== '') && <Text style={styles.advise}>{comment.description}</Text>}
                {
                    (attachment.length > 0) && <CommentResourcesBlock data={attachment}
                                                                      showDelete={false}
                                                                      blockStyle={{marginTop:10,marginRight:10}}/>
                }
                <View>
                    <Divider style={[styles.separator,(attachment.length > 0) && {marginTop:6}]}/>
                    <View style={[styles.commentPanel, {backgroundColor: styleInfo.backgroundColor}]}>
                        <Text style={[styles.comment, {color: styleInfo.color}]}>{styleInfo.text}</Text>
                    </View>
                </View>
            </View>
        )
    }

    render() {
        let {data} = this.props, content = '', users = [], auditByUsers = [], approvedTasks = [];
        data.forEach((item) => {
            (item.tasks != null) && item.tasks.map(p => (p.auditByUsers != null) && auditByUsers.push(...p.auditByUsers));
            (item.tasks != null) && item.tasks.map(p => (p.comment != null) && approvedTasks.push(p));
        });

        auditByUsers.map(p => users.push(`${p.titleName} ${p.userName}`));
        (users.length > 0) && (content = I18n.t('Approve Processing') + ": " + users.join('、'));
        return (
            <View style={styles.container}>
                <View style={styles.dotted}/>
                <View style={styles.header}>
                    <View style={styles.mask}/>
                    <Image source={require('../../assets/img_status_processing.png')} style={styles.nodeIcon}/>
                    <View style={styles.content}>
                        <Text style={styles.nodeName} numberOfLines={1}>{data[0].nodeName}</Text>
                        <Divider style={styles.divider}/>

                        <View style={[styles.viewPanel, BorderShadow.div]}>
                            <Text style={styles.statusInfo}>{content}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.header}>
                    <View style={styles.mask}/>
                    <Image source={null} style={styles.nodeIcon}/>
                    <View style={styles.content}>
                        {
                            (approvedTasks.length > 0) && approvedTasks.map((item, index) => {
                                return this.renderGroup(item, index);
                            })
                        }
                    </View>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header:{
        flexDirection:'row',
        justifyContent:'flex-start'
    },
    nodeIcon:{
        width:19,
        height:19,
        zIndex:999
    },
    nodeName:{
        fontSize:14,
        color:'rgb(133,137,142)',
        maxWidth:width-90,
        marginTop:-1
    },
    card:{
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    dotted:{
        position:'absolute',
        height: '100%',
        left: 9,
        borderWidth: 2,
        borderRadius: 1,
        borderColor:'rgb(205,208,215)',
        borderStyle: 'dotted'
    },
    mask:{
        position:'absolute',
        height: '100%',
        width: 4,
        left: 11,
        backgroundColor: "rgb(235,241,244)"
    },
    content:{
        marginLeft:10,
        flex:1
    },
    divider:{
        height:2,
        backgroundColor:'rgb(247,249,250)',
        borderBottomWidth:0,
        marginTop:16,
        marginBottom:11
    },
    viewPanel:{
        borderRadius:10,
        backgroundColor:'#fff',
        marginBottom:23,
        paddingLeft:16,
        paddingRight:16,
        paddingTop:14,
        paddingBottom:14
    },
    statusInfo:{
        fontSize:12,
        color:'rgb(100,104,109)'
    },
    infoPanel:{
        flexDirection:'row',
        justifyContent:'flex-start'
    },
    info:{
        fontSize:12,
        color:'rgb(134,136,138)'
    },
    separator:{
        height:2,
        borderBottomWidth: 0,
        backgroundColor:'rgb(242,242,242)',
        marginTop:11
    },
    advise:{
        marginTop:7,
        fontSize:14,
        color:'rgb(100,104,109)'
    },
    commentPanel:{
        borderRadius:10,
        height:30,
        backgroundColor:'#fff',
        marginTop:11
    },
    comment:{
        fontSize:14,
        height:30,
        lineHeight:30,
        textAlign:'center',
        textAlignVertical:'center',
        marginTop:-1
    }
});
