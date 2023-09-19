import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, Platform} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import store from "../../../mobx/Store";
import ClosureRate from "../charts/ClosureRate";
import DataSheet from "../charts/DataSheet";
import Badge from "react-native-elements/dist/badge/Badge";
import FilterCore from "../common/FilterCore";
import {
    getStatisticsEventGroup,
    getStatisticsEventOverview
} from "../../common/FetchRequest";
import EventBus from "../../common/EventBus";
import PhoneInfo from "../../entities/PhoneInfo";

const {width} = Dimensions.get('screen');
export default class EventRateBlock extends Component {
    state = {
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector,
        filterSelector: store.filterSelector,
        viewType: store.enumSelector.viewType.EMPTY,
        analysisType: store.enumSelector.analysisType.EVENT,
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
            let {viewType, enumSelector, analysisSelector, analysisType, filterSelector,
                    average, bestGroup, worstGroup} = this.state;
            this.setState({viewType: enumSelector.viewType.LOADING}, async () => {
                let filter = FilterCore.getFilter(analysisType, filterSelector);
                let body = FilterCore.getRange(analysisSelector.eventRangeType, analysisSelector.eventRanges);
                body.groupMode = filter.type;
                body.storeIds = filter.storeId;
                body.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;
                (filter.userId != null) && (body.submitters = filter.userId);

                viewType = enumSelector.viewType.FAILURE;
                let result = await getStatisticsEventOverview(body);

                if (result.errCode === enumSelector.errorType.SUCCESS){
                    average = result.data.averageProcessedRate;
                    bestGroup = result.data.bestGroup;
                    worstGroup = result.data.worstGroup;

                    viewType = enumSelector.viewType.SUCCESS;
                }

                this.setState({average, bestGroup, worstGroup, viewType});
            });
        }catch (e) {
        }
    }

    getTableData(){
        try {
            let {tableViewType, enumSelector, analysisSelector, data, analysisType, filterSelector} = this.state;
            this.setState({tableViewType: enumSelector.viewType.LOADING}, async () => {
                let body = this.formatRequest();
                body.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;

                tableViewType = enumSelector.viewType.FAILURE;
                let result = await getStatisticsEventGroup(body);

                if (result.errCode === enumSelector.errorType.SUCCESS){
                    data = result.data.content;
                    data.forEach(p => {
                        p.title = p.groupName;
                        p.times = p.numOfTotal;
                        p.score = p.processedRate;
                    });

                    tableViewType = (data.length > 0) ? enumSelector.viewType.SUCCESS : enumSelector.viewType.EMPTY;
                }

                this.setState({data, tableViewType});
            });
        }catch (e) {
        }
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

    onAll(){
        EventBus.closeOptionSelector();
        Actions.push('eventRate', {request: this.formatRequest()});
    }

    onRouter(item, index){
        let {analysisType, filterSelector, enumSelector, analysisSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        if (filter.type !== enumSelector.groupType.STORE){
            let request = this.formatRequest();
            request.groupMode = enumSelector.groupType.STORE;

            let content = (filter.content != null) ? filter.content.find(p => p.name === item.groupName) : null;
            (content != null) && (request.storeIds = content.id);
            request.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;

            Actions.push('storeEventTimes',{request});
        } else {
            let request = FilterCore.getRange(analysisSelector.eventRangeType, analysisSelector.eventRanges);
            request.clause = {storeId: item.innerId};

            (filter.userId != null) && (request.clause.assigner = filter.userId);
            request.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;

            Actions.push('eventList', {filters: request});
        }
    }

    formatRequest(){
        let {analysisSelector, analysisType, filterSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);
        let request = FilterCore.getRange(analysisSelector.eventRangeType, analysisSelector.eventRanges);
        request.groupMode = filter.type;
        (filter.storeId != null) && (request.storeIds = filter.storeId);
        (filter.userId != null) && (request.submitters = filter.userId);
        request.filter = {page:0, size:5};
        request.order = this.formatSort();

        return request;
    }

    formatSort(){
        let {columnType, enumSelector, column1SortType, column2SortType} = this.state;
        let direction = 'desc', property = 'processedRate';

        if (columnType === enumSelector.columnType.COLUMN1){
            property = 'numOfTotal';

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
                data, average, bestGroup, worstGroup} = this.state;
        
        let fontSize = 16;        
        (PhoneInfo.isTHLanguage() || PhoneInfo.isVNLanguage()) && (fontSize = 14);
        let titlefontSize = 12, marginLeft = 16, nameWidth = 155;
        PhoneInfo.isTHLanguage() && (titlefontSize = 10);
        PhoneInfo.isTHLanguage() && (marginLeft = 10);
        PhoneInfo.isTHLanguage() && (nameWidth = 100);
        PhoneInfo.isVNLanguage() && (marginLeft = 10);
        PhoneInfo.isVNLanguage() && (nameWidth = 130);
        PhoneInfo.isIDLanguage() && (titlefontSize = 10);
        PhoneInfo.isIDLanguage() && (marginLeft = 12);
        PhoneInfo.isIDLanguage() && (nameWidth = 110);
        
        return (
            <View style={styles.container}>
                <View style={styles.headerPanel}>
                    <Text style={[styles.header, {fontSize: fontSize}]}>{I18n.t('Store event closure rate')}</Text>
                    <TouchableOpacity activeOpacity={0.5} onPress={() => {this.onAll()}}>
                        <Badge value={I18n.t('View all')} badgeStyle={styles.badge} textStyle={styles.text}/>
                    </TouchableOpacity>
                </View>
                <ClosureRate viewType={viewType}
                             average={average}
                             highest={bestGroup}
                             lowest={worstGroup}
                             onHigh={() => this.onRouter(bestGroup,0)}
                             onLow={() => this.onRouter(worstGroup,0)}/>

                <DataSheet columns={[I18n.t('Column name'), I18n.t('Event counts'), I18n.t('Event closure rate')]}
                           viewType={tableViewType}
                           column1SortType={column1SortType}
                           column2SortType={column2SortType}
                           columnType={columnType}
                           data={data}
                           showPercent={true}
                           onSort={(columnType, column1SortType, column2SortType) => {
                               this.onSort(columnType, column1SortType, column2SortType);
                           }}
                           onRow={(item, index) => {this.onRouter(item, index)}}
                           titleStyle={{
                                marginLeft:marginLeft,
                                fontSize:titlefontSize,
                                color:'rgb(102,102,102)'
                           }}
                           nameWidth={nameWidth}/>
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
    },
});
