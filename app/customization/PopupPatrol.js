import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, DeviceEventEmitter, TouchableOpacity} from "react-native";
import I18n from 'react-native-i18n';
import PropTypes from 'prop-types';
import {CLOSE_POPUP_PATROL, EMITTER_POPOVER_CLOSE} from "../common/Constant";
import store from "../../mobx/Store";
import {inject, observer} from "mobx-react";
import WinDetail from "./WinDetail";
import TouchableInactive from "../touchables/TouchableInactive";
import WinGrade from "./WinGrade";
import EventBus from "../common/EventBus";
import WinPoint from "./WinPoint";
import PatrolCore from "../inspection/PatrolCore";
import CommentDialog from "../components/comment/CommentDialog";
import BasePatrol from "./BasePatrol";

const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class PopupPatrol extends BasePatrol {
    state = {
        enumSelector: store.enumSelector,
        paramSelector: store.paramSelector,
        operatorType: store.enumSelector.operatorType.GRADE,
        patrolSelector: store.patrolSelector,
        screenSelector: store.screenSelector
    };

    static propTypes = {
        screen: PropTypes.number,
        onDialogVisible: PropTypes.func
    };

    static defaultProps = {
        screen: store.screenSelector.patrolType.NORMAL
    };

    constructor(props,context) {
        super(props, context);
        this.actions = [
            {
                normal: require('../assets/img_ignore_normal.png'),
                select: require('../assets/img_ignore_select.png'),
                label: I18n.t('Patrol skip'),
                type: store.enumSelector.operatorType.IGNORE
            },
            {
                normal: require('../assets/img_attach_normal.png'),
                select: require('../assets/img_attach_select.png'),
                label: I18n.t('Patrol advise'),
                type: store.enumSelector.operatorType.COMMENT
            },
            {
                normal: require('../assets/img_detail_normal.png'),
                select: require('../assets/img_detail_select.png'),
                label: I18n.t('Patrol detail'),
                type: store.enumSelector.operatorType.DETAIL
            }
        ];
    }

    componentDidMount() {
        this.popEmitter = DeviceEventEmitter.addListener(CLOSE_POPUP_PATROL,
            () => {
            let {operatorType, enumSelector} = this.state;

            if(operatorType !== enumSelector.operatorType.COMMENT){
              let {patrolSelector} = this.state;
              patrolSelector.visible = false;
              this.setState({patrolSelector});
            }
        });
    }

    componentWillUnmount() {
        this.popEmitter && this.popEmitter.remove();
    }

    doActions(type){
        let {patrolSelector, enumSelector, paramSelector} = this.state;

        if (type === enumSelector.operatorType.IGNORE){
            let collection = PatrolCore.findItem(patrolSelector);
            collection.score = paramSelector.unValued;
            collection.scoreType = enumSelector.scoreType.IGNORE;
            patrolSelector.collection = collection;
        }

        this.setState({operatorType:type, patrolSelector}, () => {
            EventBus.updateBasePatrol();
        });
    }

    onGrade(score, scoreType){
        let {patrolSelector} = this.state;
        let collection = PatrolCore.findItem(patrolSelector);

        collection.score = score;
        collection.scoreType = scoreType;

        patrolSelector.collection = collection;
        this.setState({patrolSelector}, () => {
            EventBus.updateBasePatrol();
        });
    }

    onComment(data){
        this.onDialogVisible && this.onDialogVisible(false);

        let {patrolSelector, operatorType, enumSelector} = this.state;
        let collection = PatrolCore.findItem(patrolSelector);
        collection.attachment = [];

        if (collection.scoreType === enumSelector.scoreType.IGNORE){
            collection.scoreType = enumSelector.scoreType.SCORELESS;
        }

        collection.attachment.push(...data);

        patrolSelector.collection = collection;
        this.setState({patrolSelector, operatorType: enumSelector.operatorType.NONE}, () => {
            EventBus.updateBasePatrol();
        });
    }

    onClose(){
        let {patrolSelector, operatorType, enumSelector} = this.state;
        if (operatorType === enumSelector.operatorType.DETAIL){
            operatorType = enumSelector.operatorType.GRADE;
        }else {
            patrolSelector.visible = false;
        }

        this.setState({patrolSelector, operatorType}, () => {
            EventBus.updateBasePatrol();
        });
    }

    renderHeader(){
        let {enumSelector, operatorType, patrolSelector} = this.state;
        let title = (patrolSelector.collection.type !== 0) ? I18n.t('Remark item') : I18n.t('Patrol score');
        title = (operatorType === enumSelector.operatorType.DETAIL) ? I18n.t('Patrol detail') : title;

        let source = (operatorType === enumSelector.operatorType.DETAIL) ? require('../assets/img_detail_back.png')
            : require('../assets/img_arrow_close.png');

        return (
            <View style={styles.header}>
                <TouchableOpacity onPress={() => this.onClose()} >
                    <View style={styles.arrowPanel}>
                        <Image source={source} style={styles.arrow}/>
                    </View>
                </TouchableOpacity>
                <View style={styles.titlePanel}>
                    <Text style={styles.title}>{title}</Text>
                </View>
            </View>
        )
    }

    renderOperators(){
        let {enumSelector,operatorType, patrolSelector} = this.state;
        let collection = patrolSelector.collection;
        let enableIgnore = (collection.type !== 0);
        return (
            this.actions.map((item,index) =>{
                if(collection.required && item.type == enumSelector.operatorType.IGNORE) {   // 必填項目不顯示略過選項
                    return null;
                }
                let source = ((operatorType === item.type) && (operatorType === enumSelector.operatorType.IGNORE)
                    && (collection.scoreType === enumSelector.scoreType.IGNORE)) ? item.select : item.normal;
                let activeOpacity = (enableIgnore && (index === 0)) ? 1 : 0.6;
                let opacity = (enableIgnore && (index === 0)) ? 0.2 : 1;

                let commentRequired = false;
                if(item.type == enumSelector.operatorType.COMMENT) {
                    if(collection && collection.memo_is_advanced && collection.memo_config) {
                        if(collection.memo_config.memo_required_type == enumSelector.memoRequiredType.REQUIRED || 
                            (collection.memo_config.memo_required_type == enumSelector.memoRequiredType.REQUIRED_UNQUALIFIED && 
                                (collection.scoreType == enumSelector.scoreType.UNQUALIFIED || collection.scoreType == enumSelector.scoreType.FAIL))) { // 必填或不合格時必填
                            if(collection.memo_config.memo_check_text && !collection.attachment.find(p => p.mediaType == enumSelector.mediaTypes.TEXT)) {
                                commentRequired = true;
                            }
                            if(collection.memo_config.memo_check_media && !collection.attachment.find(p => (p.mediaType == enumSelector.mediaTypes.VIDEO || p.mediaType == enumSelector.mediaTypes.IMAGE))) {
                                commentRequired = true;
                            }
                        }                        
                    }
                }
                return(
                    <View style={styles.view}>
                        <TouchableOpacity activeOpacity={activeOpacity}
                                          onPress={()=>{(activeOpacity !== 1) ? this.doActions(item.type) : {}}}>
                            <Image source={source} style={[styles.image,{opacity}]}/>
                        </TouchableOpacity>
                        <Text style={[styles.label,{opacity}]}>{item.label}</Text>
                        {commentRequired && <View style={{position:'absolute',height:15,width:15,borderRadius:10,top:-5,right:5,backgroundColor:'red'}}/>}
                    </View>
                )})
        )
    }

    resetOperator() {
        let {patrolSelector, operatorType, enumSelector} = this.state, type = operatorType;
        if (patrolSelector.collection == null){
            return;
        }

        if (((operatorType === enumSelector.operatorType.GRADE) || (operatorType === enumSelector.operatorType.NONE))
                && (patrolSelector.collection.scoreType === enumSelector.scoreType.IGNORE)) {
            type = enumSelector.operatorType.IGNORE;
            this.setState({operatorType: type});
        }

        if (((operatorType === enumSelector.operatorType.IGNORE) || (operatorType === enumSelector.operatorType.NONE))
                && (patrolSelector.collection.scoreType !== enumSelector.scoreType.IGNORE)){
            type = enumSelector.operatorType.GRADE;
            this.setState({operatorType: type});
        }
    }

    render() {
        let {screen} = this.props;
        let {patrolSelector, enumSelector, operatorType, screenSelector} = this.state;

        let {visible, collection, sequence} = patrolSelector;
        let enableCapture = PatrolCore.enableCapture(patrolSelector);
        let enableImageLibrary = !PatrolCore.isRemote(patrolSelector) && PatrolCore.enableImageLibrary(patrolSelector);
        patrolSelector.interactive && this.resetOperator();

        let component = null, score = null, detail = null, comment = null;
        if ((screen === patrolSelector.screen) && visible) {
            if (collection.parentType !== enumSelector.categoryType.SCORE) {
                score = <WinGrade data={collection} onGrade={(score, scoreType) => {this.onGrade(score, scoreType)}}/>;
            }else {
                score = <WinPoint data={collection} onScore={(score, scoreType) => {this.onGrade(score, scoreType)}}/>;
            }

            if (collection.type !== 0){
                score = <Text style={styles.remark}>{I18n.t('Remark prompt')}</Text>
            }

            if (operatorType === enumSelector.operatorType.DETAIL){
                detail = <WinDetail data={collection}  sequence={sequence} onClose={()=>{
                    this.setState({operatorType: enumSelector.operatorType.NONE});
                }}/>;
            }

            let otherAttachmentCount = 0;
            patrolSelector.data.forEach(element => {
                element.groups.forEach(group => {
                    group.items.forEach(item => {
                        if(collection.id != item.id) {
                            item.attachment.forEach(attachmentTmp => {
                                if( attachmentTmp.mediaType == store.enumSelector.mediaTypes.IMAGE || 
                                    attachmentTmp.mediaType == store.enumSelector.mediaTypes.VIDEO) {
                                    otherAttachmentCount++;
                                }
                            })
                        }
                    })
                })
            })
            patrolSelector.feedback.forEach(element => {
                element.attachment.forEach(attachmentTmp => {
                    if( attachmentTmp.mediaType == store.enumSelector.mediaTypes.IMAGE || 
                        attachmentTmp.mediaType == store.enumSelector.mediaTypes.VIDEO) {
                        otherAttachmentCount++;
                    }
                })
            })

            comment = <CommentDialog questionMode={false}
                                     contentMode={true}
                                     visible={operatorType === enumSelector.operatorType.COMMENT}
                                     showEdit={true}
                                     showDelete={true}
                                     enableCapture={enableCapture}
                                     enableImageLibrary={enableImageLibrary}
                                     defaultData={patrolSelector.collection.attachment}
                                     otherAttachmentCount={otherAttachmentCount}
                                     onCancel={() => {
                                        this.setState({operatorType: enumSelector.operatorType.NONE});
                                        this.onDialogVisible && this.onDialogVisible(false);
                                     }}
                                     onClose={(data,question) => this.onComment(data)}/>;

            component = <TouchableInactive style={styles.container}>
                {this.renderHeader()}
                {score}
                <View style={styles.operator}>
                    {this.renderOperators()}
                </View>
                {detail}
            </TouchableInactive>;

            if (operatorType === enumSelector.operatorType.COMMENT){
                this.onDialogVisible && this.onDialogVisible(true);
                component = comment;
            }
        }

        return component;
    }
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: width,
        left: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius:15,
        borderTopRightRadius:15,
        paddingTop:18,
        borderColor:'#00000010',
        borderWidth:1
    },
    header:{
        flexDirection: 'row',
        justifyContent:'flex-start',
        height:21
    },
    operator:{
        flexDirection: 'row',
        justifyContent:'space-between',
        paddingRight:30,
        paddingLeft:30,
        alignItems:'center'
    },
    view:{
        width:82,
        alignItems:'center',
        justifyContent:'center',
        marginBottom:32
    },
    image:{
        width:60,
        height:60
    },
    label:{
        fontSize:14,
        color:'#69727C',
        marginTop:8
    },
    arrowPanel:{
        width:32,
        height:32,
        marginLeft:20,
        marginTop:-8,
        paddingTop:10
    },
    arrow:{
        width:16,
        height:16
    },
    titlePanel:{
        width:width-104,
        alignItems:'center'
    },
    title:{
        fontSize: 16,
        color:'#64686D'
    },
    remark:{
        marginTop:24,
        marginBottom:34,
        marginLeft:40,
        marginRight:40,
        color:'#64686D',
        fontSize:14.5
    }
});
