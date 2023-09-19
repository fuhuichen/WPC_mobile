import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, FlatList, ScrollView, TouchableOpacity, DeviceEventEmitter} from "react-native";
import I18n from 'react-native-i18n';
import StorePicker from "../components/StorePicker";
import store from "../../mobx/Store";
import ApproveGroup from "./common/ApproveGroup";
import {ApproveCore} from "./common/ApproveCore";
import {getWorkflowTaskList} from "../common/FetchRequest";
import ViewIndicator from "../customization/ViewIndicator";
import {REFRESH_APPROVE_PAGE} from "../common/Constant";

const {width} = Dimensions.get('screen');
export default class CCMineFragment extends Component {
    state = {
        storeSelector: store.storeSelector,
        enumSelector: store.enumSelector,
        userSelector: store.userSelector,
        viewType: store.enumSelector.viewType.FAILURE,
        approveType: store.enumSelector.approveType.CC_MINE,
        data: []
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
        let {enumSelector, data, userSelector} = this.state;

        let storeIds = await ApproveCore.getStores();
        if(storeIds == -1) {
            this.setState({data, viewType:enumSelector.viewType.EMPTY});
        } else {
            let body = ApproveCore.formatRequest();
            body.storeId = storeIds;
            body.type = enumSelector.workflowTaskType.CC_MINE;
            body.filter.page = page;
            body.auditState = [enumSelector.auditState.SUCCESS];
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
        const {viewType, enumSelector, data, storeSelector} = this.state;

        return <View style={styles.container}>
            <StorePicker
                type='approve'
                data={storeSelector.storeList}
                onChange={(p) => this.loadData()}/>
            {
                (viewType !== enumSelector.viewType.SUCCESS) && <ViewIndicator viewType={viewType}
                                                                                containerStyle={{marginTop:100}}
                                                                                refresh={() => {this.loadData()}}
                />
            }
            {(viewType === enumSelector.viewType.SUCCESS) && <View>
                <ApproveGroup ref={c => this.group = c}
                              data={data}
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
