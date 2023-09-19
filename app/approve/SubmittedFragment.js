import React, {Component} from 'react';
import {StyleSheet, View, Dimensions, DeviceEventEmitter} from "react-native";
import StorePicker from "../components/StorePicker";
import store from "../../mobx/Store";
import ApproveGroup from "./common/ApproveGroup";
import {ApproveCore} from "./common/ApproveCore";
import {getWorkflowTaskList} from "../common/FetchRequest";
import ViewIndicator from "../customization/ViewIndicator";
import I18n from 'react-native-i18n';
import {REFRESH_APPROVE_PAGE} from "../common/Constant";
import * as simpleStore from "react-native-simple-store";

const {width} = Dimensions.get('screen');
export default class SubmittedFragment extends Component {
    state = {
        storeSelector: store.storeSelector,
        enumSelector: store.enumSelector,
        userSelector: store.userSelector,
        viewType: store.enumSelector.viewType.FAILURE,
        data: [],
        approveSubmitStatus: I18n.t('All')
    };

    componentDidMount(){
        this.loadData();

        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_APPROVE_PAGE, () => {
            this.loadData();
        });
    }

    componentWillUnmount() {
        this.refreshEmitter && this.refreshEmitter.remove();
    }

    loadData(){
        let {enumSelector} = this.state;
        this.setState({data: [], viewType: enumSelector.viewType.LOADING}, async () => {
            await this.fetchData(0);
        });
    }

    async fetchData(page){
        let {enumSelector, data, userSelector} = this.state
        
        const catchStore = await simpleStore.get('ApproveStorePicker');
        if(catchStore != null) {
            let approveSubmitStatus = catchStore.approveSubmitStatus;
            this.setState({approveSubmitStatus});
        }

        let storeIds = await ApproveCore.getStores();
        if(storeIds == -1) {
            this.setState({data, viewType:enumSelector.viewType.EMPTY});
        } else {
            let body = ApproveCore.formatRequest();
            body.storeId = storeIds;
            body.type = enumSelector.workflowTaskType.ICREATE;
            body.filter.page = page;
            body.isMysteryMode = userSelector.isMysteryModeOn;
    
            let viewType = enumSelector.viewType.FAILURE;
            let result = await getWorkflowTaskList(body);
    
            if (result.errCode === enumSelector.errorType.SUCCESS){
                data = data.concat(result.data.content);
                viewType = (data.length > 0) ? enumSelector.viewType.SUCCESS : enumSelector.viewType.EMPTY;
            }
    
            (page !== 0) && (viewType = this.state.viewType);
            this.setState({data, viewType}, () => {
                let lastPage = (result.errCode === enumSelector.errorType.SUCCESS) ? result.data.last : false;
                this.group && this.group.setProperty({lastPage});
            })
        }
    }

    render() {
        const {viewType, enumSelector, data, storeSelector, approveSubmitStatus} = this.state;

        let filterData = [];
        if(approveSubmitStatus == I18n.t('All')) {
            filterData = data;
        } else if (approveSubmitStatus == I18n.t('Approve Finish')) {    // 已完成
            filterData = data.filter( element => element.auditState == enumSelector.auditState.SUCCESS || 
                                               element.auditState == enumSelector.auditState.CANCEL);
        } else {    // 進行中            
            filterData = data.filter( element => element.auditState == enumSelector.auditState.PROCESSING || 
                                               element.auditState == enumSelector.auditState.REJECT || 
                                               element.auditState == enumSelector.auditState.WITHDRAW);
        }
        let viewTypeTemp = viewType;
        if(viewType == enumSelector.viewType.SUCCESS && filterData.length == 0) {
            viewTypeTemp = enumSelector.viewType.EMPTY;
        }

        return <View style={styles.container}>
            <StorePicker
                type='approve_submit'
                data={storeSelector.storeList}
                onChange={(p) => this.loadData()}/>
            {
                (viewTypeTemp !== enumSelector.viewType.SUCCESS) && <ViewIndicator viewType={viewTypeTemp}
                                                                                containerStyle={{marginTop:100}}
                                                                                refresh={() => {this.loadData()}}
                />
            }
            {(viewTypeTemp === enumSelector.viewType.SUCCESS) && <View>
                <ApproveGroup ref={c => this.group = c}
                              data={filterData}
                              onFetch={(page) => this.fetchData(page)}/>
            </View>}
        </View>
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft:10,
        paddingRight:10
    }
});
