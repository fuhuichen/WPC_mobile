import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity} from "react-native";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import store from "../../../mobx/Store";
import CreatedCard from "./CreatedCard";
import ApprovedCard from "./ApprovedCard";
import SlotView from "../../customization/SlotView";
import ApprovingCard from "./ApprovingCard";
import PendingCard from "./PendingCard";
import {cancelWorkflow, drawbackWorkflow} from "../../common/FetchRequest";

const {width} = Dimensions.get('screen');
export default class ApproveWorkflow extends Component {
    state = {
        userSelector: store.userSelector,
        enumSelector: store.enumSelector,
        approveSelector: store.approveSelector
    };

    static propTypes = {
        data: PropTypes.array,
        enableRouter: PropTypes.boolean,
        doWithdraw: PropTypes.func,
        doCancel: PropTypes.func,
        approveAble: PropTypes.boolean,
        withDrawButtonText: PropTypes.string
    };

    static defaultProps = {
        data: [],
        enableRouter: true,
        approveAble: false
    };

    /*async doWithdraw() {
        let {approveSelector} = this.state;
        let collection = approveSelector.collection;
        let body = {
            inspectReportId: collection.inspectReportId
        }
        let result = await drawbackWorkflow(body);
    }

    async doCancel() {
        let {approveSelector} = this.state;
        let collection = approveSelector.collection;
        let body = {
            inspectReportId: collection.inspectReportId
        }
        let result = await cancelWorkflow(body);
    }*/

    renderCreated(){
        let {enumSelector, approveSelector, userSelector} = this.state;
        let {data, enableRouter, approveAble} = this.props;
        let collection = approveSelector.collection;
        let source = {};

        let node = data.find(p => p.state === enumSelector.workflowType.CREATED);
        if (node != null) {
            source.formId = collection.inspectReportId;
            source.formName = collection.reportName;
            source.nodeName = node.nodeName;

            if ((node.tasks != null) && (node.tasks.length > 0)){
                source.ts = node.tasks[0].startTs;
                source.submitterName = node.tasks[0].assignee ? node.tasks[0].assignee.userName : '';
                source.titleName = node.tasks[0].assignee ? node.tasks[0].assignee.titleName : '';
                source.comment = node.tasks[0].comment;
            }
        }

        let showCancel = false, showDrawback = false, showCancelAtReportDetail = false;
        // 自己送出的 & 在送出簽核頁籤 才可撤回/取消
        if( collection.submitter == userSelector.userId &&
            (approveSelector.type == enumSelector.approveType.SUBMITTED ||
            (approveSelector.type == enumSelector.approveType.PENDING && approveAble == false))) {
            if(collection.auditState == enumSelector.auditState.PROCESSING) {
                showDrawback = true;
            }
            if(collection.cancelable) {
                if ( collection.auditState == enumSelector.auditState.REJECT ||
                     collection.auditState == enumSelector.auditState.WITHDRAW ||
                     collection.auditState == enumSelector.auditState.SYSTEMWITHDRAW ) {  // 駁回、撤回、系統撤回的取消按鈕顯示在報告詳情
                    showCancelAtReportDetail = true;
                } else if (collection.auditState == enumSelector.auditState.PROCESSING) {
                    showCancel = true;
                }
            }
        }

        return (node != null) ? <CreatedCard data={source} enableRouter={enableRouter} showCancel={showCancel} 
                                             showCancelAtReportDetail={showCancelAtReportDetail}
                                             showDrawback={showDrawback} withDrawButtonText={this.props.withDrawButtonText}
                                             doWithdraw={()=>this.props.doWithdraw()} doCancel={()=>this.props.doCancel()}/> : null
    }

    renderApproved(){
        let {enumSelector} = this.state;
        let {data} = this.props;

        let node = data.filter(p => ( p.state === enumSelector.workflowType.APPROVED ||
                                      p.state === enumSelector.workflowType.REJECT ||
                                      p.state === enumSelector.workflowType.CANCEL ||
                                      p.state === enumSelector.workflowType.DRAWBACK ||
                                      p.state === enumSelector.workflowType.SYSTEMREJECT ||
                                      p.state === enumSelector.workflowType.SYSTEMINGORE));
        return (node.length > 0) ? node.map(p => <ApprovedCard data={p}/>) : null
    }

    renderApproving(){
        let {enumSelector, approveSelector} = this.state;
        let {data} = this.props;
        let collection = approveSelector.collection;

        let node = data.filter(p => p.state === enumSelector.workflowType.APPROVING);
        return (node.length > 0) ? <ApprovingCard data={node}/> : null
    }

    renderPending(){
        let {enumSelector, approveSelector} = this.state;
        let {data} = this.props;
        let collection = approveSelector.collection;

        let node = data.filter(p => p.state === enumSelector.workflowType.PENDING);
        return (node.length > 0) ? <PendingCard data={node}/> : null
    }

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.header}>{I18n.t('Process')}</Text>
                <View style={styles.panel}>
                    {this.renderCreated()}
                    {this.renderApproved()}
                    {this.renderApproving()}
                    {this.renderPending()}
                </View>
                <SlotView containerStyle={{height:30}}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop:16,
        paddingLeft:10,
        paddingRight: 10
    },
    header:{
        marginLeft:10,
        fontSize:16,
        color:'rgb(100,104,109)'
    },
    panel:{
        marginTop:16,
        borderRadius:10,
        backgroundColor:'rgb(235,241,244)',
        paddingLeft:14,
        paddingRight:14,
        paddingTop:16
    }
});
