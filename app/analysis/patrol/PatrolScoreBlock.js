import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, Platform} from "react-native";
import I18n from 'react-native-i18n';
import store from "../../../mobx/Store";
import AverageScore from "../charts/AverageScore";
import {Badge} from "react-native-elements";
import DataSheet from "../charts/DataSheet";
import {Actions} from "react-native-router-flux";
import FilterCore from "../common/FilterCore";
import {getInspectReportGroupOverview, getInspectReportOverview} from "../../common/FetchRequest";
import EventBus from "../../common/EventBus";
import PhoneInfo from '../../entities/PhoneInfo';

const {width} = Dimensions.get('screen');
export default class PatrolScoreBlock extends Component {
    state = {
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector,
        filterSelector: store.filterSelector,
        analysisType: store.enumSelector.analysisType.PATROL,
        viewType: store.enumSelector.viewType.EMPTY,
        tableViewType: store.enumSelector.viewType.EMPTY,
        column1SortType: store.enumSelector.sortType.DESC,
        column2SortType: store.enumSelector.sortType.DESC,
        columnType: store.enumSelector.columnType.COLUMN2,
        average: 0,
        bestGroup:{},
        worstGroup:{},
        data: []
    };

    fetchData(){
        this.getOverview();
        this.getTableData();
    }

    getOverview(){
        try {
            let {viewType, enumSelector, analysisSelector, filterSelector, analysisType,
                    average, bestGroup, worstGroup} = this.state;
            this.setState({viewType: enumSelector.viewType.LOADING}, async () => {
                let filter = FilterCore.getFilter(analysisType, filterSelector);
                let body = FilterCore.getRange(analysisSelector.patrolRangeType, analysisSelector.patrolRanges);
                body.groupMode = filter.type;
                body.storeIds = filter.storeId;
                body.inspectTagId = filter.inspect[0].id;
                body.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;
                (filter.userId != null) && (body.submitters = filter.userId);

                viewType = enumSelector.viewType.FAILURE;
                let result = await getInspectReportOverview(body);

                if (result.errCode === enumSelector.errorType.SUCCESS){
                    if (result.data.overallByAverageScore != null){
                        viewType = enumSelector.viewType.SUCCESS;

                        average = result.data.overallByAverageScore.average;
                        bestGroup = result.data.overallByAverageScore.bestGroup;
                        worstGroup = result.data.overallByAverageScore.worstGroup;
                    }else {
                        viewType = enumSelector.viewType.EMPTY;
                    }
                }

                this.setState({average, bestGroup, worstGroup, viewType});
            });
        }catch (e) {
        }
    }

    getTableData(){
        try {
            let {tableViewType, enumSelector, data, analysisType, filterSelector} = this.state;
            this.setState({tableViewType: enumSelector.viewType.LOADING}, async () => {
                let body = this.formatRequest();
                body.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;

                tableViewType = enumSelector.viewType.FAILURE;
                let result = await getInspectReportGroupOverview(body);

                if (result.errCode === enumSelector.errorType.SUCCESS){
                    data = result.data.content;
                    data.forEach(p => {
                        p.title = p.groupName;
                        p.times = p.numOfReport;
                        p.score = p.averageScore;
                    });

                    tableViewType = (data.length > 0) ? enumSelector.viewType.SUCCESS : enumSelector.viewType.EMPTY;
                }

                this.setState({data, tableViewType});
            });
        }catch (e) {
        }
    }

    onAll(){
        EventBus.closeOptionSelector();
        Actions.push('patrolScore', {request: this.formatRequest()});
    }

    onSort(columnType, column1SortType, column2SortType){
        this.setState({
            columnType,
            column1SortType,
            column2SortType
        }, () => {
            this.getTableData();
        });
    }

    onRouter(item, index){
        let {analysisType, filterSelector, enumSelector, analysisSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        if (filter.type !== enumSelector.groupType.STORE){
            let request = this.formatRequest();
            request.groupMode = enumSelector.groupType.STORE;

            let content = (filter.content != null) ? filter.content.find(p => p.name === item.groupName) : null;
            (content != null) && (request.storeIds = content.id);

            Actions.push('storeReportTimes',{request});
        }else {
            let request = FilterCore.getRange(analysisSelector.patrolRangeType, analysisSelector.patrolRanges);
            request.inspectTagId = filter.inspect[0].id;
            request.clause = {storeId: item.innerId};

            if (filter.userId != null){
                request.clause.submitter = filter.userId;
            }

            Actions.push('reportList', {filters: request});
        }
    }

    formatRequest(){
        let {analysisSelector, analysisType, filterSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        let request = FilterCore.getRange(analysisSelector.patrolRangeType, analysisSelector.patrolRanges);
        request.groupMode = filter.type;
        (filter.storeId != null) && (request.storeIds = filter.storeId);
        (filter.inspect.length > 0) &&(request.inspectTagId = filter.inspect[0].id);
        (filter.userId != null) && (request.submitters = filter.userId);
        request.filter = {page:0, size:5};
        request.order = this.formatSort();

        return request;
    }

    formatSort(){
        let {columnType, enumSelector, column1SortType, column2SortType} = this.state;
        let direction = 'desc', property = 'averageScore';

        if (columnType === enumSelector.columnType.COLUMN1){
            property = 'numOfReport';

            if (column1SortType !== enumSelector.sortType.DESC){
                direction = enumSelector.sortType.ASC;
            }
        }else {
            if (column2SortType !== enumSelector.sortType.DESC){
                direction = enumSelector.sortType.ASC;
            }
        }

        return {direction, property};
    }

    render() {
        let {viewType, tableViewType, column1SortType, column2SortType, columnType,
                average, bestGroup, worstGroup, data} = this.state;

        let fontSize = 12, marginLeft = 16;
        PhoneInfo.isTHLanguage() && (fontSize = 11);
        PhoneInfo.isTHLanguage() && (marginLeft = 8);
        PhoneInfo.isVNLanguage() && (fontSize = 10);
        PhoneInfo.isVNLanguage() && (marginLeft = 8);

        return (
            <View style={styles.container}>
                <View style={styles.headerPanel}>
                    <Text style={styles.header}>{I18n.t('Average inspection score')}</Text>
                    <TouchableOpacity activeOpacity={0.5} onPress={() => {this.onAll()}}>
                        <Badge value={I18n.t('View all')} badgeStyle={styles.badge} textStyle={styles.text}/>
                    </TouchableOpacity>
                </View>

                <AverageScore viewType={viewType}
                              average={average}
                              highest={bestGroup}
                              lowest={worstGroup}
                              onHigh={() => this.onRouter(bestGroup,0)}
                              onLow={() => this.onRouter(worstGroup, 0)}/>

                <DataSheet columns={[I18n.t('Column name'), I18n.t('Column times'), I18n.t('Column average')]}
                           viewType={tableViewType}
                           column1SortType={column1SortType}
                           column2SortType={column2SortType}
                           columnType={columnType}
                           data={data}
                           onSort={(columnType, column1SortType, column2SortType) => {
                               this.onSort(columnType, column1SortType, column2SortType);
                           }}
                           onRow={(item, index) => {this.onRouter(item, index)}}
                           titleStyle={{
                                marginLeft:marginLeft,
                                fontSize:fontSize,
                                color:'rgb(102,102,102)'
                           }}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop:36
    },
    headerPanel:{
        flexDirection:'row',
        justifyContent:'space-between'
    },
    header:{
        fontSize:16,
        color:'rgb(100,104,109)',
        marginLeft:10,
        ...Platform.select({
            ios:{
                marginTop:6
            }
        })
    },
    badge:{
        backgroundColor:'#fff',
        width:100,
        height:30,
        borderWidth:1,
        borderColor:'rgb(0,106,183)'
    },
    text:{
        fontSize:14,
        color:'rgb(0,106,183)',
        marginTop: -1
    }
});