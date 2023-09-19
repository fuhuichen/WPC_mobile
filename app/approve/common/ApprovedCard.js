import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity} from "react-native";
import PropTypes from 'prop-types';
import {Divider} from "react-native-elements";
import * as BorderShadow from "../../element/BorderShadow";
import store from "../../../mobx/Store";
import moment from "moment";
import Attachment from "../../element/Attachment";
import CommentResourcesBlock from "../../components/comment/CommentResourcesBlock";
import I18n from 'react-native-i18n';
import { ScrollView } from 'react-native-gesture-handler';

const {width} = Dimensions.get('screen');
export default class ApprovedCard extends Component {
    state = {
    };

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
            },
            {
                type: -3,    // 系統撤回
                color: 'rgb(245,120,72)',
                backgroundColor:'rgb(255,242,239)',
                text: I18n.t('System Approve Withdraw')
            },
            {
                type: -999,    // 系統忽略
                color: 'rgb(245,120,72)',
                backgroundColor:'rgb(255,242,239)',
                text: I18n.t('System Approve Ignore')
            }
        ];
    }

    onRouter(){

    }

    renderGroup(item, index){
        let marginBottom = (index === 0) ? 12 : 19;
        let auditByUsers = item.assignee || ((item.auditByUsers && item.auditByUsers.length > 0) ? item.auditByUsers[0] : {}),
            comment = item.comment,
            attachment = [];
        let styleInfo = (comment && this.styles.find(p => p.type === comment.result)) || this.styles[0];

        if(comment && comment.signature) {
            // 簽名的type沒用到，永遠當成IMAGE
            comment.signature.map(p => attachment.push({mediaType: store.enumSelector.mediaTypes.IMAGE/*p.type*/, url: p.content}));
        }

        if(comment && comment.attachment) {
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
                {
                    (comment && comment.description !== '') && <ScrollView style={{maxHeight:142, flex:1, flexDirection:'column'}} showsVerticalScrollIndicator={false}>
                        <Text style={styles.advise}>{comment.description}</Text>
                    </ScrollView>
                }
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
        let {data} = this.props;

        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.dotted}/>
                    <View style={styles.mask}/>
                    <Image source={require('../../assets/img_status_processed.png')} style={styles.nodeIcon}/>

                    <View style={styles.content}>
                        <Text style={styles.nodeName} numberOfLines={1}>{data.nodeName}</Text>
                        <Divider style={styles.divider}/>
                        {
                            (data.tasks != null) && data.tasks.map((item, index) => {
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
        paddingLeft:16,
        paddingTop:16,
        paddingRight:16,
        paddingBottom:12
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
