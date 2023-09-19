import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity,DeviceEventEmitter} from "react-native";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import store from "../../mobx/Store";
import {Divider} from "react-native-elements";
import {inject, observer} from "mobx-react";
import Attachment from "../element/Attachment";
import PatrolCore from "./PatrolCore";
import EventBus from "../common/EventBus";
import BorderShadow from '../element/BorderShadow';
import SubjectUnfold from "../element/SubjectUnfold";
import DetailUnfold from "../element/DetailUnfold";
import AccessHelper from '../common/AccessHelper';


const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class PatrolEditor extends Component {
    state = {
        paramSelector: store.paramSelector,
        patrolSelector: store.patrolSelector,
        reportSelector: store.reportSelector,
        enumSelector: store.enumSelector,
        screenSelector: store.screenSelector
    };

    static propTypes = {
        data: PropTypes.array.isRequired,
        isPatrol: PropTypes.boolean,
        showEdit: PropTypes.boolean,
        dataType: PropTypes.number,
        onSubject: PropTypes.func,
        onDetail: PropTypes.func,
        onAttach: PropTypes.func
    };

    static defaultProps = {
        data: [],
        isPatrol: true,
        showEdit: true,
        dataType: store.enumSelector.dataType.INT
    };


    renderLabels(){
        let {data, showEdit, isPatrol} = this.props;
        let {paramSelector, enumSelector, patrolSelector, reportSelector} = this.state;

        let badge = paramSelector.getBadgeMap().find(p => p.type === data.key.scoreType);
        let point = (badge.point != null) ? badge.point : `${data.key.score}/${data.key.itemScore}`;

        if ((data.key.scoreType !== enumSelector.scoreType.IGNORE) &&
            (data.key.parentType !== enumSelector.categoryType.SCORE)){
            let options = PatrolCore.getOptionsForType(
                isPatrol ? patrolSelector : reportSelector, data.key.parentType
            );

            if (options.length > 1){
                if (data.key.scoreType === enumSelector.scoreType.UNQUALIFIED) {
                    point = options[0];
                }

                if (data.key.scoreType === enumSelector.scoreType.QUALIFIED) {
                    point = options[1];
                }
            }
        }

        if (data.key.type !== 0){
            point = I18n.t('Switch remark');
        }

        return (
            <View style={[styles.gradePanel,{width: showEdit ? (width-150) : (width-80),
                backgroundColor:badge.backgroundColor}]}>
                <Text style={[styles.grade,{color:badge.color}]}>{point}</Text>
            </View>
        )
    }

    onEditor(){
        let {data} = this.props;
        let {patrolSelector, screenSelector} = this.state, router = false;
        patrolSelector.visible = true;
        patrolSelector.collection = data.key;
        patrolSelector.sequence = data.value;

        if (PatrolCore.isRemote(patrolSelector) && (patrolSelector.store.device.length > 0)){
            patrolSelector.screen = screenSelector.patrolType.VIDEO;
            patrolSelector.router = screenSelector.patrolType.SUMMARY;

            patrolSelector.visible = false;
            router = true;
        }

        if (!AccessHelper.enableStoreMonitor() || !AccessHelper.enableVideoLicense()){
            DeviceEventEmitter.emit('Toast', I18n.t('Video license'));
            return;
        }

        this.setState({patrolSelector}, () => {
            EventBus.updateBasePatrol();
            router && Actions.push('patrolVideo');
        });
    }

    unfold(data){
        let {isPatrol} = this.props;
        if (isPatrol){
            let {patrolSelector} = this.state;

            let collection = PatrolCore.queryItem(patrolSelector, data);
            collection.attachUnfold = !collection.attachUnfold;
            patrolSelector.collection = collection;
            this.setState({patrolSelector}, () => {
                EventBus.updateBasePatrol();
            });
        }else {
            this.props.onAttach && this.props.onAttach(data);
        }
    }

    subjectUnfold(data){
        let {isPatrol} = this.props;
        if (isPatrol){
            let {patrolSelector} = this.state;

            let collection = PatrolCore.queryItem(patrolSelector, data);
            collection.subjectUnfold = !collection.subjectUnfold;
            patrolSelector.collection = collection;
            this.setState({patrolSelector}, () => {
                EventBus.updateBasePatrol();
            });
        }else {
            this.props.onSubject && this.props.onSubject(data);
        }
    }

    detailUnfold(data){
        let {isPatrol} = this.props;
        if (isPatrol){
            let {patrolSelector} = this.state;

            let collection = PatrolCore.queryItem(patrolSelector, data);
            collection.detailUnfold = !collection.detailUnfold;
            patrolSelector.collection = collection;
            this.setState({patrolSelector}, () => {
                EventBus.updateBasePatrol();
            });
        }else {
            this.props.onDetail && this.props.onDetail(data);
        }
    }

    renderEditor(){
        let {showEdit} = this.props;
        return (
            showEdit ? <TouchableOpacity activeOpacity={0.6}
                                         onPress={() => {this.onEditor()}}>
                <View style={styles.modifyView}>
                    <Text style={styles.modify}>{I18n.t('Modify')}</Text>
                </View>
            </TouchableOpacity>: null
        )
    }

    renderContent(){
        let {data} = this.props;
        let numberOfLines = !data.key.subjectUnfold ? 1 : 10;
        let detail = ((data.key.description != null) && (data.key.description !== '')) ? data.key.description : '--';
        let content = !data.key.subjectUnfold ? I18n.t('Inspection details') : I18n.t('Collapse details');

        let subjectColor = data.key.isImportant ? '#C60957' : '#86888A';
        return (
            <TouchableOpacity activeOpacity={0.5} onPress={() => {this.subjectUnfold(data.key)}}>
                <View>
                    <Text style={[styles.subject,{color:subjectColor}]} numberOfLines={numberOfLines}>{data.key.subject}</Text>
                    {data.key.subjectUnfold ? <Text style={styles.detail}>{detail}</Text> : null}
                    <Text style={styles.content}>{content}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    render() {
        let {data} = this.props;
        return (
            <View style={[styles.container, BorderShadow.div]}>
                {this.renderContent()}
                {
                    (data.key.attachment.length > 0) ? <Divider style={styles.divider}/>: null
                }
                <Attachment data={data.key} unfold={(data) => this.unfold(data)}/>
                <Divider style={[styles.divider,{backgroundColor:'#006AB7'}]}/>
                <View style={styles.panel}>
                    {this.renderLabels()}
                    <View style={{flex:1}}/>
                    {this.renderEditor()}
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        paddingLeft:14,
        paddingRight:14,
        paddingTop:10,
        paddingBottom: 10,
        borderRadius:10,
        marginTop:10,
        width:width-50,
        backgroundColor:'#FFFFFF'
    },
    subject:{
        color: '#86888A',
        fontSize:14,
        lineHeight:19
    },
    panel:{
        flexDirection:'row',
        justifyContent:'space-between',
        marginTop: 10
    },
    unitPanel:{
        flexDirection:'row',
        alignItems: 'center'
    },
    modifyView:{
        width: 60,
        height: 24,
        borderRadius: 20,
        alignItems:'center',
        marginTop:4
    },
    modify:{
        color:'#006AB7',
        fontSize:16
    },
    score:{
        fontSize: 12,
        color: '#1E272E',
        marginLeft: 6
    },
    divider:{
        backgroundColor:'#F2F2F2',
        height:2,
        marginTop:12,
        borderBottomWidth:0
    },
    gradePanel:{
        height:30,
        borderRadius:10
    },
    grade:{
        height:30,
        lineHeight:30,
        textAlign:'center',
        textAlignVertical:'center',
        fontSize:14
    },
    detail:{
        color: '#86888A',
        fontSize:12,
        lineHeight:16,
        marginTop:12
    },
    content:{
        color:'#006ab7',
        fontSize:12,
        marginTop:12,
        textDecorationLine:'underline'
    }
});
