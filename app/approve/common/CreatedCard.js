import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity} from "react-native";
import PropTypes from 'prop-types';
import {Actions} from "react-native-router-flux";
import {Divider} from "react-native-elements";
import * as BorderShadow from "../../element/BorderShadow";
import moment from "moment";
import store from "../../../mobx/Store";
import CommentResourcesBlock from "../../components/comment/CommentResourcesBlock";
import I18n from 'react-native-i18n';
import { ScrollView } from 'react-native-gesture-handler';

const {width} = Dimensions.get('screen');
export default class CreatedCard extends Component {
    state = {
        userSelector: store.userSelector,
        enumSelector: store.enumSelector,
        approveSelector: store.approveSelector
    };

    static propTypes = {
        data: PropTypes.object,
        enableRouter: PropTypes.boolean,
        doWithdraw: PropTypes.func,
        doCancel: PropTypes.func,
        showCancel: PropTypes.boolean,
        showDrawback: PropTypes.boolean,
        showCancelAtReportDetail: PropTypes.boolean,
        withDrawButtonText: PropTypes.string
    };

    static defaultProps = {
        enableRouter: true,
        showCancel: false,
        showDrawback: false,
        showCancelAtReportDetail: false,
    };

    onRouter(){
        let {collection} = this.state.approveSelector;
        let {userSelector, enumSelector} = this.state;
        let modifyReport = false;
        if( collection.submitter == userSelector.userId && (collection.auditState == enumSelector.auditState.REJECT ||
                                                            collection.auditState == enumSelector.auditState.WITHDRAW ||
                                                            collection.auditState == enumSelector.auditState.SYSTEMWITHDRAW)) {
            modifyReport = true;
        }
        Actions.push('reportDetail',{
            data:{id: collection.inspectReportId},
            modifyReport: modifyReport,
            noShare: (collection.auditState != enumSelector.auditState.SUCCESS),
            showCancel: this.props.showCancelAtReportDetail
        });
    }

    render() {
        let {enableRouter, data, showCancel, showDrawback, withDrawButtonText} = this.props;
        let activeOpacity = 1, router = () => {}, comment = data.comment;

        if (enableRouter){
            activeOpacity = 0.5;
            router = () => this.onRouter();
        }

        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Image source={require('../../assets/img_status_processed.png')} style={styles.nodeIcon}/>

                    <View style={styles.content}>
                        <View style={{flexDirection:'row', justifyContent: 'space-between'}}>
                            <Text style={styles.nodeName} numberOfLines={1}>{data.nodeName}</Text>
                            <View style={{flexDirection:'row'}}>
                                {showDrawback && <TouchableOpacity activeOpacity={0.6} onPress={() => this.props.doWithdraw()}>
                                    <View style={styles.button}>
                                        <Text style={styles.buttonText}>{withDrawButtonText ? withDrawButtonText : I18n.t('Approve Withdraw')}</Text>
                                    </View>
                                </TouchableOpacity>}
                                {showCancel && <TouchableOpacity activeOpacity={0.6} onPress={() => this.props.doCancel()}>
                                    <View style={styles.button}>
                                        <Text style={styles.buttonText}>{I18n.t('Cancel')}</Text>
                                    </View>
                                </TouchableOpacity>}
                            </View>
                        </View>
                        <Divider style={styles.divider}/>

                            <View style={[styles.viewPanel, BorderShadow.div]}>
                                <TouchableOpacity activeOpacity={activeOpacity} onPress={() => router()}>
                                    <View style={styles.inspect}>
                                        <Text style={styles.inspectName} numberOfLines={1}>{data.formName}</Text>
                                        {enableRouter && <Image source={require('../../assets/img_report.png')} style={styles.arrow}/>}
                                    </View>
                                </TouchableOpacity>
                                <Divider style={styles.separator}/>
                                <View style={styles.infoPanel}>
                                    <Text style={[styles.info,{maxWidth:width-220}]} numberOfLines={1}>
                                        {data.titleName} {data.submitterName}
                                    </Text>
                                    <Text style={[styles.info,{marginLeft:3}]}>
                                       ({moment(data.ts).format('YYYY/MM/DD HH:mm')})
                                    </Text>
                                </View>
                                {
                                    (comment != null) && <View>
                                        {
                                            (comment.description !== '') && <ScrollView style={{maxHeight:142, flex:1, flexDirection:'column'}} showsVerticalScrollIndicator={false}>
                                                    <Text style={styles.advise}>{comment.description}</Text>
                                            </ScrollView>
                                        }
                                        {
                                            (comment.attachment && comment.attachment.length > 0) && <CommentResourcesBlock data={comment.attachment}
                                                                                              showDelete={false}
                                                                                              blockStyle={{marginTop:10,marginRight:10}}/>
                                        }
                                    </View>
                                }
                            </View>
                    </View>

                    <View style={styles.dotted}/>
                    <View style={styles.mask}/>
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
        justifyContent:'flex-start',
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
        flex:1,
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
        marginBottom:20,
        padding:16
    },
    inspect:{
        flexDirection:'row',
        justifyContent:'space-between'
    },
    inspectName:{
        maxWidth: width-140,
        fontSize:14,
        color:'rgb(100,104,109)'
    },
    arrow:{
        width:20,
        height:20,
        //marginTop:3
    },
    separator:{
        height:2,
        borderBottomWidth: 0,
        backgroundColor:'rgb(242,242,242)',
        marginTop:11
    },
    infoPanel:{
        marginTop:12,
        flexDirection:'row',
        justifyContent:'flex-start'
    },
    info:{
        fontSize:12,
        color:'rgb(134,136,138)'
    },
    advise:{
        marginTop:7,
        fontSize:14,
        color:'rgb(100,104,109)'
    },
    button:{
        backgroundColor: '#006AB7',
        borderRadius: 10,
        paddingLeft:12,
        paddingRight:12,
        height:30,
        minWidth: 80,
        marginTop: -5,
        marginLeft: 10
    },
    buttonText:{
        fontSize:14,
        color:'#FFFFFF',
        height:30,
        lineHeight: 30,
        textAlign: 'center',
        textAlignVertical: 'center',
        marginTop:-1
    }
});
