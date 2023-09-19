import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, ScrollView} from "react-native";
import I18n from 'react-native-i18n';
import store from "../../../mobx/Store";
import * as BorderShadow from "../../element/BorderShadow";
import {Divider} from "react-native-elements";
import PropTypes from 'prop-types';
import PatrolEvents from "../charts/PatrolEvents";
import {getEventLastInspectGroup, getStoreContent} from "../../common/FetchRequest";
import TimeUtil from "../../utils/TimeUtil";
import PhoneInfo from "../../entities/PhoneInfo";
import FilterCore from "../common/FilterCore";

const {width} = Dimensions.get('screen');
export default class StoreEventBlock extends Component {
    state = {
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector,
        filterSelector: store.filterSelector,
        videoSelector: store.videoSelector,
        viewType: store.enumSelector.viewType.EMPTY,
        analysisType: store.enumSelector.analysisType.STORE,
        data: {},
        eventItems: [],
        reportId: 0,
        weatherInfo: null,
        standard: -1,
        type: 0
    };

    static propTypes = {
        onRefresh: PropTypes.func
    };

    fetchData(){
        try {
            let {viewType, enumSelector, analysisType, filterSelector, data, eventItems, reportId,
                analysisSelector, weatherInfo, standard, type, videoSelector} = this.state;
            this.setState({eventViewType: enumSelector.viewType.LOADING}, async () => {
                let filter = FilterCore.getFilter(analysisType, filterSelector);
                let body = FilterCore.getRange(analysisSelector.storeRangeType, analysisSelector.storeRanges);
                body.storeId = filter.storeId[0];
                body.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;
                (filter.inspect.length === 1) && (body.inspectTagId = filter.inspect[0].id);
                (filter.userId != null) && (body.submitters = filter.userId);

                viewType = enumSelector.viewType.FAILURE;
                let result = await getEventLastInspectGroup(body);

                eventItems = [];
                weatherInfo = null;
                standard = -1;
                type = 0;
                data = {};

                if (result.errCode === enumSelector.errorType.SUCCESS){
                    if (result.data.length > 0){
                        reportId = result.data[0].id;
                        weatherInfo = result.data[0].weatherInfo;
                        standard = result.data[0].standard;
                        type = result.data[0].type;

                        data = {ts: result.data[0].ts, tagName: result.data[0].tagName, score: result.data[0].score};

                        eventItems = result.data[0].eventItems.filter((item, index) => {return index < 5});
                        eventItems.forEach((item) => {
                            item.subjectUnfold = false;
                            item.comment = item.comment.map(v => Object.assign({...v, attachUnfold: false}))
                        });

                        viewType = enumSelector.viewType.SUCCESS;
                    }else {
                        viewType = enumSelector.viewType.EMPTY;
                    }
                }

                // store list
                if (viewType === enumSelector.viewType.SUCCESS){
                    body = {clause: {storeId: filter.storeId[0]}};
                    result = await getStoreContent(body);

                    videoSelector.storeId = filter.storeId[0];
                    videoSelector.content = [];
                    if (result.errCode === enumSelector.errorType.SUCCESS){
                        videoSelector.content = result.data.content;
                    }
                }

                this.setState({viewType, data, eventItems, reportId, weatherInfo, standard, type, videoSelector});
            })
        }catch (e) {
        }
    }

    renderLeft(){
        let {enumSelector, viewType, analysisSelector, data, weatherInfo} = this.state;
        let patrolTime = analysisSelector.placeHolder, marginTop = 26, weatherComponent = null;

        if (viewType === enumSelector.viewType.SUCCESS){
            const date = TimeUtil.getDetailTime(data.ts)[0];
            let time = TimeUtil.getDetailTime(data.ts)[6];
            patrolTime = `${date}(${time})`;
        }

        if (weatherInfo != null){
            marginTop = 16;
            weatherComponent = <Image source={{uri: weatherInfo.icon}} style={styles.weather}/>
        }

        return <View style={[styles.card, BorderShadow.div]}>
            <Text style={styles.title}>{I18n.t('Patrol time')}</Text>
            <Text style={[styles.content, {marginTop}]}>{patrolTime}</Text>
            {weatherComponent}
        </View>
    }

    renderRight(){
        let {enumSelector, viewType, analysisSelector, data, standard} = this.state;
        let patrolScore = analysisSelector.placeHolder, fontSize = 12, marginTop = 6;

        if (viewType === enumSelector.viewType.SUCCESS){
            patrolScore = data.score;
        }

        let label = (standard !== -1) ? ((standard === 1) ? I18n.t('Compliance label') :
            I18n.t('Not-compliance label')) : '';
        let color = (standard === 0) ? 'rgb(245,120,72)' : 'rgb(89,171,34)';
        PhoneInfo.isJALanguage() && (fontSize = 10);
        (label !== '') && (marginTop = 0);

        return <View style={[styles.card, BorderShadow.div]}>
            <Text style={styles.title}>{I18n.t('Score show')}</Text>
            <Text style={[styles.score,{marginTop}]}>{patrolScore}</Text>
            <Text style={[styles.standard, {color, fontSize}]}>{label}</Text>
        </View>
    }

    renderSingle(){
        let {enumSelector, viewType, analysisSelector, data, weatherInfo} = this.state;
        let patrolTime = analysisSelector.placeHolder, marginTop = 26, weatherComponent = null;

        if (viewType === enumSelector.viewType.SUCCESS){
            const date = TimeUtil.getDetailTime(data.ts)[0];
            let time = TimeUtil.getDetailTime(data.ts)[6];
            patrolTime = `${date}(${time})`;
        }

        if (weatherInfo != null){
            marginTop = 16;
            weatherComponent = <Image source={{uri: weatherInfo.icon}} style={styles.weather}/>
        }

        return (
            <View style={styles.cardPanel}>
                <View style={[styles.card, BorderShadow.div,{width:width-60}]}>
                    <Text style={styles.title}>{I18n.t('Patrol time')}</Text>
                    <Text style={[styles.content, {marginTop}]}>{patrolTime}</Text>
                    {weatherComponent}
                </View>
            </View>
        )
    }

    renderMultiple(){
        return (
            <View style={styles.cardPanel}>
                {this.renderLeft()}
                {this.renderRight()}
            </View>
        )
    }

    renderHeader(){
        let {enumSelector, viewType, analysisSelector, data, type} = this.state;
        let patrolTable = analysisSelector.placeHolder;

        if (viewType === enumSelector.viewType.SUCCESS){
            patrolTable = data.tagName;
        }

        return <View>
            <Text style={styles.tableName}>{patrolTable}</Text>
            {(type === 1) ? this.renderSingle() : this.renderMultiple()}
        </View>
    }

    render() {
        let {viewType, eventItems, analysisType, filterSelector, reportId, data} = this.state;

        return (
            <View style={styles.container}>
                <Text style={styles.label}>{I18n.t('Store previous patrol')}</Text>
                <View style={styles.panel}>
                    {this.renderHeader()}
                    <Divider style={styles.divider}/>
                    <PatrolEvents viewType={viewType}
                                  data={eventItems}
                                  reportId={reportId}
                                  requestTime={(data.ts != null) ? data.ts : 0}
                                  onRefresh={(actionType) => {
                                      this.fetchData();
                                      this.props.onRefresh(actionType);
                                  }}/>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        marginTop:36
    },
    label:{
        fontSize:16,
        color:'rgb(100,104,109)',
        marginLeft:10
    },
    panel:{
        marginTop:15,
        backgroundColor:'rgb(235,241,244)',
        borderRadius: 10
    },
    tableName:{
        marginTop:14,
        marginLeft: 10,
        fontSize:16,
        color:'rgb(100,104,109)'
    },
    cardPanel:{
        flexDirection:'row',
        justifyContent:'space-between',
        paddingLeft:20,
        paddingRight:20,
        paddingTop:17,
        paddingBottom:20
    },
    card:{
        width:(width-71)/2,
        height:110,
        borderRadius:10,
        backgroundColor: '#fff',
        alignItems:'center'
    },
    title:{
        marginTop:10,
        fontSize:12,
        color:'rgb(100,104,109)'
    },
    content:{
        fontSize:18,
        color:'rgb(100,104,109)'
    },
    score:{
        fontSize:40,
        color:'rgb(100,104,109)'
    },
    divider:{
        width:width-48,
        marginLeft:14,
        height:2,
        marginTop:20,
        backgroundColor:'rgb(247,249,250)',
        borderBottomWidth:0,
        marginBottom: -14
    },
    weather:{
        width:24,
        height:24,
        alignSelf:'center',
        marginTop:8
    },
    standard:{
        alignSelf: 'center'
    }
});
