import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity} from "react-native";
import I18n from 'react-native-i18n';
import * as BorderShadow from "../../element/BorderShadow";
import store from "../../../mobx/Store";
import PieChartCircle from "../charts/PieChartCircle";
import FilterCore from "../common/FilterCore";
import {getStatisticsEventOverview} from "../../common/FetchRequest";
import NP from "number-precision/src/index";
import {Actions} from "react-native-router-flux";
import PhoneInfo from "../../entities/PhoneInfo";

const {width} = Dimensions.get('screen');
export default class EventOverviewBlock extends Component {
    state = {
        viewType: store.enumSelector.viewType.EMPTY,
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector,
        filterSelector: store.filterSelector,
        analysisType: store.enumSelector.analysisType.EVENT,
        totalCount: 0,
        doneCount: 0,
        unHandledCount: 0,
        closedCount: 0,
        average: 0
    };

    constructor(props){
        super(props);

        this.defaultColor = ['rgb(220,223,229)'];
        this.colors = ['rgb(143,217,46)', 'rgb(245,120,72)', 'rgb(123,159,235)'];
    }

    fetchData(){
        try {
            let {viewType, enumSelector, analysisSelector, analysisType, filterSelector,
                    average, totalCount, doneCount, unHandledCount, closedCount} = this.state;
            this.setState({viewType: enumSelector.viewType.LOADING}, async () => {
                let body = this.formatRequest();
                body.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;

                viewType = enumSelector.viewType.FAILURE;
                body.groupMode = null;
                let result = await getStatisticsEventOverview(body);

                if (result.errCode === enumSelector.errorType.SUCCESS){
                    average = result.data.averageProcessedRate;
                    let events = result.data.eventByStatus;

                    totalCount = events.reduce((p, e) => p + e.numOfEvent, 0);
                    doneCount = events.reduce((p,e) => p + ((e.status === enumSelector.statusType.DONE) ? e.numOfEvent : 0), 0);
                    unHandledCount = events.reduce((p,e) =>
                        p + (((e.status === enumSelector.statusType.PENDING) || e.status === enumSelector.statusType.REJECT) ? e.numOfEvent : 0), 0);
                    closedCount = events.reduce((p,e) =>
                        p + (((e.status === enumSelector.statusType.CLOSED) || e.status === enumSelector.statusType.OVERDUE) ? e.numOfEvent : 0), 0);

                    viewType = enumSelector.viewType.SUCCESS;
                }

                this.setState({viewType, average, totalCount, doneCount, unHandledCount, closedCount});
            });
        }catch (e) {
        }
    }

    onRouter(status){
        let {enumSelector, analysisType, filterSelector, analysisSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        if ((filter.type !== enumSelector.analysisType.STORE) || (filter.storeId.length > 1)){
            let request = this.formatRequest();
            request.groupMode = enumSelector.groupType.STORE;
            request.status = status;
            request.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;

            Actions.push('storeEventTimes',{request});
        } else {
            let request = FilterCore.getRange(analysisSelector.eventRangeType, analysisSelector.eventRanges);
            request.clause = {storeId: filter.storeId};
            (status != null) && (request.clause.status = status);
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
        request.storeIds = filter.storeId;
        (filter.userId != null) && (request.submitters = filter.userId);

        return request
    }

    renderChart(){
        let {viewType, enumSelector, doneCount, unHandledCount, closedCount, totalCount} = this.state;
        let data = [{name: '', count: 100}], colors = this.defaultColor;

        if (viewType === enumSelector.viewType.SUCCESS){
            colors = this.colors;
            data = [
                    {name:'done', count:NP.round(doneCount/totalCount*100, 2)},
                    {name:'unHandled', count:NP.round(unHandledCount/totalCount*100, 2)},
                    {name:'closed', count:NP.round(closedCount/totalCount*100, 2)}
                ];
        }

        return <PieChartCircle data={data} colors={colors} />
    }

    renderDone(){
        let {enumSelector, analysisSelector, viewType, doneCount} = this.state;
        let content = analysisSelector.placeHolder;
        let activeOpacity = 1, router = () => {};

        if (viewType === enumSelector.viewType.SUCCESS){
            content = doneCount;
            activeOpacity = 0.5;

            router = () => {this.onRouter([enumSelector.statusType.DONE])};
        }

        let fontSize = 12;
        PhoneInfo.isTHLanguage() && (fontSize = 9);

        return <TouchableOpacity activeOpacity={activeOpacity} onPress={() => router()}>
            <View style={[styles.panel, {backgroundColor: 'rgb(237,246,232)'}]}>
                <Text style={[styles.label, {fontSize: fontSize}]}>{I18n.t('Event done count')}</Text>
                <View style={styles.view}>
                    <Text style={[styles.value, {color:'rgb(89,171,34)'}]}>{content}</Text>
                    <Text style={styles.unit}>{I18n.t('Count')}</Text>
                </View>
            </View>
        </TouchableOpacity>
    }

    renderPending(){
        let {enumSelector, analysisSelector, viewType, unHandledCount} = this.state;
        let content = analysisSelector.placeHolder;
        let activeOpacity = 1, router = () => {};

        if (viewType === enumSelector.viewType.SUCCESS){
            content = unHandledCount;
            activeOpacity = 0.5;
            router = () => {this.onRouter([enumSelector.statusType.PENDING, enumSelector.statusType.REJECT])};
        }

        let fontSize = 12;
        PhoneInfo.isVNLanguage() && (fontSize = 9);

        return <TouchableOpacity activeOpacity={activeOpacity} onPress={() => router()}>
            <View style={[styles.panel, {backgroundColor:'rgb(255,242,239)', marginTop:10}]}>
                <Text style={[styles.label, {fontSize: fontSize}]}>{I18n.t('Event pending count')}</Text>
                <View style={styles.view}>
                    <Text style={[styles.value, {color:'rgb(245,120,72)'}]}>{content}</Text>
                    <Text style={styles.unit}>{I18n.t('Count')}</Text>
                </View>
            </View>
        </TouchableOpacity>
    }

    renderClosure(){
        let {enumSelector, analysisSelector, viewType, closedCount} = this.state;
        let content = analysisSelector.placeHolder;
        let activeOpacity = 1, router = () => {};

        if (viewType === enumSelector.viewType.SUCCESS){
            content = closedCount;
            activeOpacity = 0.5;
            router = () => {this.onRouter([enumSelector.statusType.CLOSED, enumSelector.statusType.OVERDUE])};
        }

        let fontSize = 12;
        PhoneInfo.isTHLanguage() && (fontSize = 10);

        return <TouchableOpacity activeOpacity={activeOpacity} onPress={() => router()}>
            <View style={[styles.panel, {backgroundColor:'rgb(237,242,252)', marginTop:10}]}>
                <Text style={[styles.label, {fontSize: fontSize}]}>{I18n.t('Event closure rate')}</Text>
                <View style={styles.view}>
                    <Text style={[styles.value, {color:'rgb(100,104,109)'}]}>{content}</Text>
                    <Text style={styles.unit}>{I18n.t('Count')}</Text>
                </View>
            </View>
        </TouchableOpacity>
    }

    renderContent(){
        return <View style={styles.content}>
            {this.renderDone()}
            {this.renderPending()}
            {this.renderClosure()}
        </View>
    }

    render() {
        let {viewType, enumSelector, analysisSelector, totalCount} = this.state;
        let content = analysisSelector.placeHolder, summaryFontSize = 12;
        let activeOpacity = 1, fontSize = 36, router = () => {};

        PhoneInfo.isJALanguage() && (summaryFontSize = 10);

        if (viewType === enumSelector.viewType.SUCCESS){
            content = totalCount;
            activeOpacity = 0.5;

            fontSize = (content.toString().length > 6) ? 18
                : ((content.toString().length > 4) ? 23 : fontSize);
            router = () => this.onRouter(null);
        }

        return (
            <View style={[styles.container, BorderShadow.div]}>
                <TouchableOpacity activeOpacity={activeOpacity} onPress={() => router()}>
                    {this.renderChart()}

                    <View style={styles.overview}>
                        <Text style={[styles.summary, {fontSize: summaryFontSize}]}>{I18n.t('Total event count')}</Text>
                        <Text style={[styles.totalCount, {fontSize}]}>{content}</Text>
                    </View>
                </TouchableOpacity>
                {this.renderContent()}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection:'row',
        justifyContent:'flex-start',
        width: width-20,
        height: 177,
        marginTop:16,
        backgroundColor:'#fff',
        borderRadius:10,
        paddingLeft:10,
        paddingRight:10,
        paddingTop:18,
        paddingBottom:19
    },
    content:{
        flex:1,
        marginLeft: 25
    },
    panel:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        height:40,
        borderRadius: 10,
        paddingLeft: 9,
        paddingRight: 9,
        alignItems:'center'
    },
    label:{
        fontSize:12,
        color:'rgb(110,110,110)',
        maxWidth:80,
        textAlign:'center'
    },
    view:{
        flexDirection:'row',
        justifyContent:'flex-end'
    },
    value:{
        fontSize:20,
        marginRight:2
    },
    unit:{
        fontSize:10,
        color:'rgb(134,136,138)',
        marginTop:11
    },
    overview:{
        width:96,
        height:96,
        position:'absolute',
        left: 16,
        top: 18,
        alignItems: 'center',
        justifyContent:'center'
    },
    summary:{
        fontSize:12,
        color:'rgb(100,104,109)'
    },
    totalCount:{
        color:'rgb(100,104,109)'
    }
});
