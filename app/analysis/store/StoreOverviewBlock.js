import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, ScrollView, TouchableOpacity} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from "react-native-router-flux";
import store from "../../../mobx/Store";
import OverviewCard from "../charts/OverviewCard";
import * as BorderShadow from "../../element/BorderShadow";
import LineChart from "../../components/charts/LineChart";
import TouchableInactive from "../../touchables/TouchableInactive";
import ViewIndicator from "../../customization/ViewIndicator";
import ModalPatrol from "../../customization/ModalPatrol";
import {getInspectReportOverview, getInspectStoreHistory} from "../../common/FetchRequest";
import FilterCore from "../common/FilterCore";
import TimeUtil from "../../utils/TimeUtil";
import NP from "number-precision/src/index";

const {width} = Dimensions.get('screen');
export default class StoreOverviewBlock extends Component {
    state = {
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector,
        filterSelector: store.filterSelector,
        viewType: store.enumSelector.viewType.EMPTY,
        chartViewType: store.enumSelector.viewType.EMPTY,
        analysisType: store.enumSelector.analysisType.STORE,
        data: {},
        inspects: [],
        inspectTagId: 0,
        inspectTagName: '',
        inspectAverage: 0,
        points:[],
        labels: []
    };

    constructor(props){
        super(props);

        this.resetParams = true;
    }

    fetchData(){
        this.geOverview();

        let {analysisType, filterSelector, inspectTagId, inspectTagName} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        if (this.resetParams){
            inspectTagId = filter.inspect[0].id;
            inspectTagName = filter.inspect[0].name;

            this.resetParams = false;
        }

        this.setState({inspects: filter.inspect, inspectTagId, inspectTagName},
            () => {
                this.getChart();
        });
    }

    setProperty(){
        this.resetParams = true;
    }

    onReport(){
        let {analysisType, analysisSelector, filterSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        let request = FilterCore.getRange(analysisSelector.storeRangeType, analysisSelector.storeRanges);
        request.clause = {storeId: filter.storeId[0]};
        (filter.inspect.length === 1) && (request.inspectTagId = filter.inspect[0].id);
        (filter.userId != null) && (request.clause.submitter = filter.userId);

        request.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;

        Actions.push('reportList', {filters: request});
    }

    onEvent(){
        let {analysisType, analysisSelector, filterSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        let request = FilterCore.getRange(analysisSelector.storeRangeType, analysisSelector.storeRanges);
        request.clause = {storeId: filter.storeId};

        (filter.userId != null) && (request.clause.assigner = filter.userId);
        (filter.inspect.length === 1) && (request.clause.inspectTagId = filter.inspect[0].id);

        request.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;

        Actions.push('eventList', {filters: request});
    }

    geOverview(){
        try {
            let {enumSelector, analysisSelector, viewType, analysisType, filterSelector, data} = this.state;
            this.setState({viewType: enumSelector.viewType.LOADING}, async () => {
                let filter = FilterCore.getFilter(analysisType, filterSelector);
                let body = FilterCore.getRange(analysisSelector.storeRangeType, analysisSelector.storeRanges);
                body.groupMode = filter.type;
                body.storeIds = filter.storeId;
                body.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;
                (filter.inspect.length === 1) && (body.inspectTagId = filter.inspect[0].id);
                (filter.userId != null) && (body.submitters = filter.userId);

                viewType = enumSelector.viewType.FAILURE;
                //console.log("getInspectReportOverview body : ", JSON.stringify(body));
                let result = await getInspectReportOverview(body);
                //console.log("getInspectReportOverview result : ", JSON.stringify(result));
                if (result.errCode === enumSelector.errorType.SUCCESS){
                    viewType = enumSelector.viewType.SUCCESS;
                    data = result.data;
                }

                this.setState({viewType, data})
            });
        }catch (e) {
        }
    }

    getChart(){
        try {
            let {chartViewType, enumSelector, analysisSelector, analysisType, filterSelector,
                inspectTagId, labels, points, inspectAverage} = this.state;
            this.setState({chartViewType: enumSelector.viewType.LOADING}, async () => {
                let filter = FilterCore.getFilter(analysisType, filterSelector);
                let body = FilterCore.getRange(analysisSelector.storeRangeType, analysisSelector.storeRanges);
                body.storeId = filter.storeId[0];
                body.inspectTagId = inspectTagId;
                body.isMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector);
                body.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;
                (filter.userId != null) && (body.submitters = filter.userId);

                chartViewType = enumSelector.viewType.FAILURE;
                //console.log("getInspectStoreHistory body : ", JSON.stringify(body));
                let result = await getInspectStoreHistory(body);
                //console.log("getInspectStoreHistory result : ", JSON.stringify(result));

                if (result.errCode === enumSelector.errorType.SUCCESS){
                    chartViewType = enumSelector.viewType.EMPTY;

                    if (result.data.length > 0){
                        let xAxis = result.data.map(p => p.ts).reverse();
                        labels = xAxis.map(p => TimeUtil.getDetailTime(p)[2]);
                        points = result.data.map(p => p.score).reverse();

                        let totalScore = result.data.reduce((p,e) => NP.plus(p, e.score), 0);
                        inspectAverage = NP.round(totalScore/result.data.length, 1);

                        if (result.data.length > 1){
                            chartViewType = enumSelector.viewType.SUCCESS;
                        }
                    }
                }

                this.setState({chartViewType, labels, points, inspectAverage});
            })
        }catch (e) {
        }
    }

    renderCard(){
        let {enumSelector, viewType, data} = this.state;

        return <View style={styles.cardPanel}>
            <OverviewCard viewType={viewType}
                          unitType={enumSelector.unitType.TIMES}
                          title={I18n.t('Total patrol count')}
                          content={data.numOfInspects}
                          onClick={() => {this.onReport()}}/>
            <OverviewCard viewType={viewType}
                          unitType={enumSelector.unitType.NUMBER}
                          title={I18n.t('Store event items')}
                          content={data.numOfEvents}
                          onClick={() => {this.onEvent()}}/>
        </View>
    }

    renderSwitch(){
        let {inspects, inspectTagName} = this.state;
        let tableName = (inspects.length === 0) ? I18n.t('Inspection table') : inspectTagName;
        let color = (inspects.length === 0) ? 'rgb(100,104,109)' : 'rgb(0,104,180)';
        let activeOpacity = (inspects.length > 1) ? 0.5 : 1;
        let switchIcon = null, router = () => {};

        if (inspects.length > 1){
            router = () => {this.modalPatrol && this.modalPatrol.openExWithData(inspectTagName, inspects)};
            switchIcon = <Image source={require('../../assets/img_table_switch.png')} style={styles.switch}/>;
        }

        return (
            <TouchableOpacity activeOpacity={activeOpacity} onPress={() => router()}>
                <View style={styles.tablePanel}>
                    <Text style={[styles.tableName, {color}]} numberOfLines={1}>{tableName}</Text>
                    {switchIcon}
                </View>
            </TouchableOpacity>
        )
    }

    onSelect(inspect){
        this.setState({inspectTagName: inspect.name, inspectTagId: inspect.id}, () => {
            this.getChart();
        })
    }

    renderChart(){
        let {chartViewType, enumSelector, analysisSelector, inspectAverage, labels, points} = this.state;
        let score = analysisSelector.placeHolder, data = {};

        if (chartViewType === enumSelector.viewType.SUCCESS){
            score = inspectAverage;

            data = {datasets: [{data: points}], labels};
        }

        if ((chartViewType === enumSelector.viewType.EMPTY) && (points.length === 1) ){
            score = inspectAverage;
        }

        return <View style={[styles.chartPanel, BorderShadow.div]}>
            {this.renderSwitch()}
            <View style={styles.scorePanel}>
                <Text style={styles.scoreLabel}>{I18n.t('Average patrol score')}</Text>
                <Text style={styles.average}>{score}</Text>
            </View>
            {
                (chartViewType === enumSelector.viewType.SUCCESS) ? <ScrollView horizontal={true}
                                                                                showsHorizontalScrollIndicator={false}>
                    <TouchableInactive>
                        <LineChart viewNumber={true}
                                   data={data}
                                   width={(labels.length+1)*40+60}
                                   height={110}
                                   showLine={false}
                                   uniqueUnit={true}
                                   renderEndlabel ={true}
                                   chartConfig={{
                                       backgroundColor: "#fff",
                                       backgroundGradientFrom: "#fff",
                                       backgroundGradientTo: "#fff",
                                       fillShadowGradient:'rgba(0, 106, 183, 1)',
                                       fillShadowGradientOpacity:0.4,
                                       decimalPlaces: 1,
                                       strokeWidth:2,
                                       color: (opacity = 1) => `rgba(0, 106, 183, 1)`,
                                       labelColor: (opacity = 1) => `rgba(134, 136, 138, 1)`,
                                       propsForDots: {
                                           r: "4",
                                           strokeWidth: "2",
                                           stroke: "rgba(229, 241, 251, 1)"
                                       },
                                       propsForVerticalLabels:{
                                           fontSize:10
                                       }
                                   }}
                                   bezier
                                   style={{
                                       marginLeft:-44,
                                       marginVertical: 8,
                                       borderRadius: 0
                                   }}
                                   textFloat={true}
                                   withVerticalLabels={true}
                                   withHorizontalLabels={false}
                                   withHorizontalLines={false}
                                   withVerticalLines={false} />
                    </TouchableInactive>
                </ScrollView> : <ViewIndicator viewType={chartViewType}
                                               containerStyle={{justifyContent:'center'}}
                                               refresh={() => {}}/>
            }
        </View>
    }

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.header}>{I18n.t('Store overview evaluation')}</Text>
                <View style={styles.panel}>
                    {this.renderCard()}
                    {this.renderChart()}
                </View>

                <ModalPatrol ref={c => this.modalPatrol = c} report={true}
                             onSelect={(inspect) => {this.onSelect(inspect)}}/>
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
        borderRadius:10,
        width:width-20,
        height:356,
        marginTop:15,
        backgroundColor:'rgb(235,241,244)'
    },
    cardPanel:{
        flexDirection:'row',
        justifyContent:'space-between',
        paddingLeft:20,
        paddingRight:20,
        marginTop:16
    },
    chartPanel:{
        marginTop:16,
        marginLeft:20,
        borderRadius:10,
        width:width-60,
        height:195,
        backgroundColor: '#fff'
    },
    scorePanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginLeft:10,
        marginTop:12
    },
    scoreLabel:{
        fontSize: 12,
        color:'#64686D'
    },
    average:{
        fontSize: 12,
        color:'#E22472'
    },
    tablePanel:{
        flexDirection:'row',
        justifyContent:'flex-start',
        alignItems:'center',
        marginTop:10,
        alignSelf:'center'
    },
    tableName:{
        fontSize:12,
        color:'rgb(0,104,180)',
        maxWidth:220
    },
    switch:{
        width:16,
        height:16,
        marginLeft:4,
        marginTop:3
    }
});
