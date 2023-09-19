import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, DeviceEventEmitter, Platform} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import store from "../../mobx/Store";
import {Badge, Divider} from "react-native-elements";
import PropTypes from 'prop-types';
import EventBus from "../common/EventBus";
import {inject, observer} from "mobx-react";
import PatrolCore from "./PatrolCore";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";
import AccessHelper from '../common/AccessHelper';

const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class PatrolCell extends Component {
    state = {
        enumSelector: store.enumSelector,
        paramSelector: store.paramSelector,
        patrolSelector: store.patrolSelector,
        approveSelector: store.approveSelector,
        screenSelector: store.screenSelector
    };

    static propTypes = {
        showIndex: PropTypes.boolean,
        showCamera: PropTypes.boolean,
        showBorder: PropTypes.boolean,
        maximum: PropTypes.number.isRequired
    };

    static defaultProps = {
        showIndex: true,
        showCamera: false,
        showBorder: true
    };

    onSelect(item, index, point, modifyAble){
        let {patrolSelector, approveSelector} = this.state;
        // 簽核流程中編輯報告時，不可取消模式不可編輯不合格項目
        if(modifyAble == false && patrolSelector.isWorkflowReport == true && approveSelector.collection.cancelable == false) {
            return;
        }
        patrolSelector.visible = true;
        patrolSelector.collection = item;
        patrolSelector.sequence = index;
        patrolSelector.interactive = true;
        this.setState({patrolSelector}, ()=>{
            EventBus.updateBasePatrol();
        });
    }

    onVideo(item, index){
        if (!AccessHelper.enableStoreMonitor() || !AccessHelper.enableVideoLicense()){
            DeviceEventEmitter.emit('Toast', I18n.t('Video license'));
            return;
        }

        let {patrolSelector, screenSelector} = this.state;
        patrolSelector.collection = item;
        patrolSelector.sequence = index;
        patrolSelector.screen = screenSelector.patrolType.VIDEO;
        patrolSelector.visible = false;

        this.setState({patrolSelector}, () => {
            EventBus.updateBasePatrol();
            Actions.push('patrolVideo');
        });
    }

    renderCamera(item, index){
        let {patrolSelector} = this.state;
        let source = require('../assets/img_camera_label.png');

        return (
            (patrolSelector.store.device && patrolSelector.store.device.length > 0) ? <TouchableOpacityEx activeOpacity={0.5} onPress={() => {
                this.onVideo(item, index)
            }}>
                <View style={styles.cameraPanel}>
                    <Image source={source} style={styles.camera}/>
                    <Text style={styles.channel}>{I18n.t('Relate channel')}</Text>
                </View>
            </TouchableOpacityEx> : null
        );
    }

    renderMissing(count){
        return (
            (count > 0) ? <View>
                <Text style={styles.missingView}>{I18n.t('Missing record')} ({count})</Text>
            </View> : null
        )
    }

    renderComment(attachment){
       return (attachment.length > 0) ? <Text style={styles.commented}>{I18n.t('Patrol commented')}</Text> : null;
    }

    renderCommentRequire(data) {
        let {enumSelector} = this.state;
        let commentRequire = false;
        let attachment = data.attachment || [];
        if(data.memo_is_advanced && data.memo_config) {
            if(data.memo_config.memo_required_type == enumSelector.memoRequiredType.REQUIRED || 
                (data.memo_config.memo_required_type == enumSelector.memoRequiredType.REQUIRED_UNQUALIFIED && 
                    (data.scoreType == enumSelector.scoreType.UNQUALIFIED || data.scoreType == enumSelector.scoreType.FAIL))) { // 必填或不合格時必填
                if(data.memo_config.memo_check_text && !attachment.find(p => p.mediaType == enumSelector.mediaTypes.TEXT)) {
                    commentRequire = true;
                }
                if(data.memo_config.memo_check_media && !attachment.find(p => (p.mediaType == enumSelector.mediaTypes.VIDEO || p.mediaType == enumSelector.mediaTypes.IMAGE))) {
                    commentRequire = true;
                }
            }
        }
        if(commentRequire) {
            return <Text style={styles.commentedRequire}>{I18n.t('Patrol commented Required')}</Text>;
        } else {
            return null;
        }
    }

    render() {
        let {data, showIndex, maximum, showCamera, showBorder} = this.props;
        let {scoreType, dataType, score, ignore, parentType, lastUnqualifiedNumber, attachment, modifyAble} = data.key;
        let {paramSelector, patrolSelector, enumSelector} = this.state;

        if(scoreType == null) {
            scoreType = enumSelector.scoreType.SCORELESS;
        }

        let backgroundColor = paramSelector.getBadgeMap().find(p => p.type === scoreType).backgroundColor;
        let color = paramSelector.getBadgeMap().find(p => p.type === scoreType).color;

        let point = paramSelector.getBadgeMap().find(p => p.type === scoreType).point;
        if ((scoreType !== enumSelector.scoreType.IGNORE) && (scoreType !== enumSelector.scoreType.SCORELESS)
            && (parentType !== enumSelector.categoryType.SCORE)){
            let options = PatrolCore.getOptionsForType(patrolSelector, parentType);

            if (options.length > 1){
                (scoreType === enumSelector.scoreType.UNQUALIFIED) ? (point = options[0])
                    : (point = options[1]);
            }
        }

        let badge = <Badge badgeStyle={[styles.badgeStyle,{backgroundColor}]} value={point ? point : score}
                       textStyle={{fontSize:14,color}}/>;

        let cellSelect = patrolSelector.visible && (patrolSelector.collection.id === data.key.id);
        let dynamicStyle = (cellSelect && showBorder) ? styles.select : styles.unselect;
        let marginTop = (data.value !== 0) ? -2 : 0;
        let subjectColor = data.key.isImportant ? '#C60957' : 'black';
        return (
            <TouchableOpacity activeOpacity={1} onPress={()=>{this.onSelect(data.key, data.value, point, modifyAble)}}>
                <View style={[styles.container, dynamicStyle,{marginTop}]}>
                    <View style={{paddingBottom: 6}}>
                        <View style={styles.panel}>
                            <View style={styles.subject}>
                                {data.key.required && <Text style={{color:'#C60957', lineHeight: 20}}>{'*'}</Text>}
                                <Text style={{lineHeight: 20,color:subjectColor}}>
                                    {showIndex ? (data.value+1 + '.') : ''}
                                </Text>
                                <Text numberOfLines={2} style={{width:width-170,height:45,lineHeight: 20,color:subjectColor}}>
                                    {data.key.subject}
                                </Text>
                            </View>
                            {badge}
                        </View>

                        <View style={{flexDirection:'row', marginTop: -5}}>
                            {showCamera && this.renderCamera(data.key, data.value)}
                            {this.renderMissing(lastUnqualifiedNumber)}
                            {this.renderComment(attachment)}
                            {this.renderCommentRequire(data.key)}
                        </View>
                        {(data.value === maximum-1) && <View style={{height:10}}></View>}
                    </View>
                    <View style={{flex:1}}/>
                    {
                        (!cellSelect && (data.value !== maximum-1) && showBorder) ?
                            <Divider style={styles.divider}/> : null
                    }
                </View>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    container:{
        minHeight:60,
        maxHeight:90,
        paddingLeft:10,
        paddingRight:6,
        borderRadius:10,
    },
    select: {
        borderWidth:1,
        borderColor:'#2C90D9',
        borderRadius:10,
        paddingLeft: 9,
        paddingRight: 5,
    },
    unselect: {
        // borderWidth:1,
        // borderColor:'#ffffff',
        // borderRadius:10
    },
    panel:{
        marginTop:14,
        paddingBottom:6,
        flexDirection:'row',
        justifyContent:'space-between'
    },
    badgeStyle:{
        width:74,
        height:28,
        borderRadius: 10,
        marginTop: 3
    },
    subject:{
        height:45,
        fontSize:14,
        maxWidth: width-145,
        flexDirection:'row',
        color:'#556679'
    },
    missingView:{
        color:'#556679',
        //color:'#006AB7',
        fontSize:12,
        marginLeft:12,
    },
    missingCount:{
        width:16,
        height:16,
        backgroundColor:'green',
        borderRadius:8,
        marginRight:5
    },
    commented:{
        fontSize:12,
        color:'#85898E',
        marginLeft: 11
    },
    commentedRequire:{
        fontSize:12,
        color:'#C60957',
        marginLeft: 11
    },
    divider:{
        backgroundColor:'#F2F2F2',
        height:2,
        borderBottomWidth:0
    },
    cameraPanel: {
        flexDirection:'row',
        justifyContent: 'flex-start',
        marginLeft:12
    },
    camera:{
        width:18,
        height:18,
        ...Platform.select({
            ios:{
                marginTop:-3
            }
        })
    },
    channel:{
        marginLeft:3,
        color:'rgb(0,106,183)',
        fontSize:12
    }
});
