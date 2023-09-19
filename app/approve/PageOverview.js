import React, {Component} from 'react';
import {StyleSheet, View, Dimensions, ScrollView} from "react-native";
import {Actions} from "react-native-router-flux";
import PropTypes from "prop-types";
import I18n from "react-native-i18n";
import store from "../../mobx/Store";
import ViewIndicator from "../customization/ViewIndicator";
import ApproveWorkfow from "./common/ApproveWorkfow";
import {getWorkflowTaskInfo,cancelWorkflow, drawbackWorkflow, getWorkflowInfo} from "../common/FetchRequest";
import Navigation from "../element/Navigation";
import ScrollTop from "../element/ScrollTop";
import ModalCenter from "../components/ModalCenter";
import EventBus from "../common/EventBus";

const {width} = Dimensions.get('screen');
export default class PageOverview extends Component {
    state = {
        showScrollTop: false,
        enumSelector: store.enumSelector,
        approveSelector: store.approveSelector,
        viewType: store.enumSelector.viewType.FAILURE,
        data: [],
        withDrawButtonText: ''
    };

    static propTypes = {
        enableRouter: PropTypes.boolean
    };

    static defaultProps = {
        enableRouter: true
    };

    componentDidMount(){
        (async () => {
            await this.fetchData();
        })();
    }

    async fetchData(){
        try {
            let {enumSelector, approveSelector, viewType, data} = this.state;
            this.setState({viewType: enumSelector.viewType.LOADING});

            let collection = approveSelector.collection;
            let result = await getWorkflowTaskInfo(collection.inspectReportId, enumSelector.workflowInfoType.INSPECTREPORT);

            viewType = enumSelector.viewType.FAILURE;
            let approvingNodeId = '';
            if (result.errCode === enumSelector.errorType.SUCCESS){
                data = result.data.taskList;
                let parseData = []; // parentId-1的node開始顯示
                data.forEach(element => {
                    if(element.parentId == -1 && element.state == enumSelector.workflowType.APPROVED) {
                        parseData = [];
                        element.state = enumSelector.workflowType.CREATED;
                        parseData.push(element);
                    } else {
                        parseData.push(element);
                    }

                    if(element.state == enumSelector.workflowType.APPROVING) {
                        approvingNodeId = element.nodeId;
                    }
                });
                data = parseData;

                viewType = (data.length > 0) ? enumSelector.viewType.SUCCESS : enumSelector.viewType.EMPTY;
            }

            let resultWorkflowInfo = await getWorkflowInfo(collection.processDefinitionKey);
            if (resultWorkflowInfo.errCode === enumSelector.errorType.SUCCESS){
                if(approvingNodeId != '' && resultWorkflowInfo.data) {
                    this.getCustomButtonText(approvingNodeId, resultWorkflowInfo.data.nextAuditNode);
                }                
            } 

            this.setState({data,viewType});
        }catch (e) {
        }
    }

    getCustomButtonText(nodeId, node) {
        if(node.id == nodeId) {
            let withDrawButtonText = '';
            if(node.customButton.length > 2) {
                withDrawButtonText = node.customButton[2].text;
            }
            this.setState({withDrawButtonText});
        } else {
            if(node.nextAuditNode != null) {
                this.getCustomButtonText(nodeId, node.nextAuditNode);
            }
        }
    }

    async doWithdraw() {
        let {approveSelector,enumSelector} = this.state;
        let collection = approveSelector.collection;
        let body = {
            inspectReportId: collection.inspectReportId
        }
        let result = await drawbackWorkflow(body);
        if(result.errCode == enumSelector.errorType.SUCCESS) {
            this.onBack()
        }
    }

    async doCancel() {
        let {approveSelector,enumSelector} = this.state;
        let collection = approveSelector.collection;
        let body = {
            inspectReportId: collection.inspectReportId
        }
        let result = await cancelWorkflow(body);
        if(result.errCode == enumSelector.errorType.SUCCESS) {
            this.onBack()
        }
    }

    render() {
        let {enumSelector, viewType, data, showScrollTop, withDrawButtonText} = this.state;
        let {enableRouter} = this.props;

        return (
            <View style={styles.container}>
                <Navigation onLeftButtonPress={() => {this.onBack()}}
                            title={I18n.t('Approve')}/>

                {(viewType !== enumSelector.viewType.SUCCESS) && <ViewIndicator viewType={viewType}
                                                                                containerStyle={{marginTop:100}}
                                                                                refresh={() => this.fetchData()}/>}
                {(viewType === enumSelector.viewType.SUCCESS) && <ScrollView ref={c => this.scroll = c}
                                                                             onScroll={event =>{
                                                                                 let showScrollTop = (event.nativeEvent.contentOffset.y > 200);
                                                                                 this.setState({showScrollTop});
                                                                             }}
                                                                             showsVerticalScrollIndicator={false}>
                    <ApproveWorkfow data={data} enableRouter={enableRouter} withDrawButtonText={withDrawButtonText}
                        doWithdraw={() => this.modalWithdraw && this.modalWithdraw.open()} 
                        doCancel={() => this.modalCancel && this.modalCancel.open()}/>
                </ScrollView>}
                <ScrollTop showOperator={showScrollTop} onScroll={() => {this.scroll && this.scroll.scrollTo({x:0 ,y:0, animated:true})}}/>
                <ModalCenter ref={c => this.modalCancel = c} title={I18n.t('Cancel Approve')} description={I18n.t('Cancel Approve Confirm')}
                             confirm={() => this.doCancel()}/>
                <ModalCenter ref={c => this.modalWithdraw = c} title={I18n.t('Withdraw Approve')} description={I18n.t('Withdraw Approve Confirm')}
                            confirm={() => this.doWithdraw()}/>
            </View>
        )
    }

    // function
    onBack(){
        EventBus.refreshApprovePage();
        Actions.pop();
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
});
