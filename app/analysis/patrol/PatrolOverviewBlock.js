import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image} from "react-native";
import I18n from 'react-native-i18n';
import store from "../../../mobx/Store";
import OverviewCard from "../charts/OverviewCard";
import {getInspectReportOverview} from "../../common/FetchRequest";
import FilterCore from "../common/FilterCore";
import {Actions} from "react-native-router-flux";

const {width} = Dimensions.get('screen');
export default class AllStore extends Component {
    state = {
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector,
        filterSelector: store.filterSelector,
        viewType: store.enumSelector.viewType.EMPTY,
        analysisType: store.enumSelector.analysisType.PATROL,
        data: {}
    };

    fetchData(){
        try {
            let {viewType, enumSelector, data, analysisType, filterSelector} = this.state;
            this.setState({viewType: store.enumSelector.viewType.LOADING}, async () => {
                let body = this.formatRequest();
                body.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;

                viewType = enumSelector.viewType.FAILURE;
                let result = await getInspectReportOverview(body);

                if (result.errCode === enumSelector.errorType.SUCCESS){
                    viewType = enumSelector.viewType.SUCCESS;
                    data = result.data;
                }

                this.setState({viewType, data});
            });
        }catch (e) {
        }
    }

    onRouter(){
        let {enumSelector, analysisType, filterSelector, analysisSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        if ((filter.type !== enumSelector.analysisType.STORE) || (filter.storeId.length > 1)){
            let request = this.formatRequest();
            request.groupMode = enumSelector.groupType.STORE;
            request.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;

            Actions.push('storeReportTimes',{request});
        } else {
            let request = FilterCore.getRange(analysisSelector.patrolRangeType, analysisSelector.patrolRanges);
            request.inspectTagId = filter.inspect[0].id;
            request.clause = {storeId: filter.storeId};

            if (filter.userId != null){
                request.clause.submitter = filter.userId;
            }
            request.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;

            Actions.push('reportList', {filters: request});
        }
    }

    formatRequest(){
        let {analysisSelector, analysisType, filterSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        let request = FilterCore.getRange(analysisSelector.patrolRangeType, analysisSelector.patrolRanges);
        request.groupMode = filter.type;
        request.storeIds = filter.storeId;
        request.inspectTagId = filter.inspect[0].id;
        (filter.userId != null) && (request.submitters = filter.userId);

        return request;
    }

    render() {
        let {viewType, enumSelector, data} = this.state;

        return (
            <View style={styles.container}>
                <Text style={styles.header}>{I18n.t('Patrol overview evaluation')}</Text>
                <View style={styles.panel}>
                    <OverviewCard viewType={viewType}
                                  unitType={enumSelector.unitType.NUMBER}
                                  title={I18n.t('Total patrol store')}
                                  content={data.numOfStores}
                                  onClick={() => {this.onRouter()}}/>
                    <OverviewCard viewType={viewType}
                                  unitType={enumSelector.unitType.TIMES}
                                  title={I18n.t('Total patrol count')}
                                  content={data.numOfInspects}
                                  onClick={() => {this.onRouter()}}/>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop:16
    },
    header:{
        fontSize:16,
        color:'rgb(100,104,109)',
        marginLeft:10
    },
    panel:{
        width:width-20,
        height:145,
        paddingTop:16,
        paddingLeft:20,
        paddingRight:20,
        marginTop:15,
        flexDirection:'row',
        justifyContent:'space-between',
        borderRadius:10,
        backgroundColor:'rgb(235,241,244)'
    }
});
