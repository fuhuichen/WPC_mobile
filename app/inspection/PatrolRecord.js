import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, ScrollView} from "react-native";
import PropTypes from "prop-types";
import I18n from 'react-native-i18n';
import EventBus from "../common/EventBus";
import store from '../../mobx/Store';
import TimeUtil from "../utils/TimeUtil";
import {getStoreHistory, getStoreWeather} from "../common/FetchRequest";
import {getWeatherIconUrl} from "../common/WeatherFilter";

import TouchableInactive from "../touchables/TouchableInactive";
import TouchableActive from "../touchables/TouchableActive";
import LineChart from "../components/charts/LineChart";
import SmallChart from "../components/charts/SmallChart";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import PhoneInfo from "../entities/PhoneInfo";
import PatrolChart from "../components/inspect/PatrolChart";
import ViewIndicator from "../customization/ViewIndicator";
import ModalWeather from "../customization/ModalWeather";
import { fonts } from 'react-native-elements/dist/config';

const {width} = Dimensions.get('screen');
export default class PatrolRecord extends Component {
    state = {
        collapsible: false,
        viewType:store.enumSelector.viewType.LOADING,
        enumSelector:store.enumSelector,
        data:[],
        weatherIconUrl: '',
        weatherType: null,
        standard: -1,
        type: 0
    };

    static propTypes = {
        showMode: PropTypes.boolean,
        storeId: PropTypes.string,
        data: PropTypes.object,
        showChart: PropTypes.boolean,
        statistics: PropTypes.object,
        additionalInfo: PropTypes.boolean,
        type: PropTypes.number,
        changeWeather: PropTypes.boolean,
        onSelect: PropTypes.function,
    };

    static defaultProps = {
        showMode: false,
        storeId:'',
        data: null,
        showChart: false,
        statistics: [],
        additionalInfo: true,
        type: 0,
        changeWeather: false,
    };

    constructor(props) {
        super(props);

        this.data = [];
        this.xAxis = [];
    }

    componentDidMount(){
        (async () => {
            await this.fetchData();
        })();
    }

    setWeatherIconUrl(weatherType) {
        let weatherIconUrl = getWeatherIconUrl(weatherType);
        this.props.onSelect && this.props.onSelect(weatherType);
        return weatherIconUrl;
    }

    async fetchData(){
        let {enumSelector, standard, type, weatherIconUrl, weatherType} = this.state;
        const {storeId, data, additionalInfo} = this.props;
        this.setState({viewType: enumSelector.viewType.LOADING});

        let params = `storeId=${storeId}`;
        let resultWeather = await getStoreWeather(params);
        if(resultWeather.errCode === 0) {
            weatherType = resultWeather.data.weatherType;
            weatherIconUrl = this.setWeatherIconUrl(resultWeather.data.weatherType);
        } else {
            weatherType = 100;
            weatherIconUrl = this.setWeatherIconUrl(weatherType);
        }
        (data != null) && (params += `&inspectTagId=${data.inspectTagId}`);
        additionalInfo && (params += '&additionalInfo=true');

        let result = await getStoreHistory(params);
        if(result.errCode !== enumSelector.errorType.SUCCESS){
            this.setState({viewType:enumSelector.viewType.FAILURE});
            return;
        }

        if(result.data.length > 0){
            if (additionalInfo){
                weatherInfo = result.data[0].weatherInfo;
                standard = result.data[0].standard;
                type = result.data[0].type;
                weatherType = result.data[0].weatherInfo ? result.data[0].weatherInfo.code : null;
                weatherIconUrl = result.data[0].weatherInfo ? result.data[0].weatherInfo.icon : null;

                if (data != null){
                    weatherInfo = data.weatherInfo;
                    standard = data.standard;
                    type = data.type;
                    weatherType = data.weatherInfo.code;
                    weatherIconUrl = data.weatherInfo.icon;
                }
            } else {
                type = this.props.type;
            }

            this.setState({
                data:result.data,
                standard,
                type,
                weatherIconUrl,
                weatherType,
                viewType:enumSelector.viewType.SUCCESS
            });
        } else {
            this.setState({
                weatherIconUrl,
                weatherType,
                viewType:enumSelector.viewType.EMPTY
            });
        }
    }

    onChangeWeather() {
        this.modalWeather && this.modalWeather.open()
    }

    renderLeft(){
        const {data, weatherIconUrl} = this.state;
        const {changeWeather} = this.props;
        let inspectData = (this.props.data != null) ? this.props.data : data[0];
        const date = TimeUtil.getDetailTime(inspectData.ts)[0];
        let time = TimeUtil.getDetailTime(inspectData.ts)[6];

        let fontSize = 12;
        PhoneInfo.isVNLanguage() && (fontSize = 10);

        return (
            <BoxShadow setting={{width:(width-80)/3, height:this.getCardHeight(), color:"#000000",
                border:2, radius:10, opacity:0.1, x:0, y:1,style:{marginLeft:4}}}>
                <View style={[styles.left,{height:this.getCardHeight()}]}>
                    <Text style={[styles.label, {fontSize}]}>{I18n.t('Patrol time')}</Text>
                    <Text style={styles.date}>{date}({time})</Text>
                    {
                        (weatherIconUrl != '') ? ((changeWeather == true) ?
                            <TouchableOpacity activeOpacity={0.6} onPress={() => this.onChangeWeather()}>
                                <View style={styles.category}>
                                    <Image source={{uri:weatherIconUrl}} style={styles.weather}/>
                                    <Image style={styles.arrow} source={require('../assets/img_chart_down.png')}/>
                                </View>
                            </TouchableOpacity> :
                            <Image source={{uri:weatherIconUrl}} style={styles.weather}/>) : null
                    }
                </View>
            </BoxShadow>
        )
    }

    renderMiddle(){
        let {data, standard} = this.state, fontSize = 12;
        let isSummary = this.props.data != null;
        let inspectData = isSummary ? this.props.data : data[0];

        let label = (standard !== -1) ? ((standard === 1) ? I18n.t('Compliance label') :
            I18n.t('Not-compliance label')) : '';
        let color = (standard === 0) ? 'rgb(245,120,72)' : 'rgb(89,171,34)';
        (PhoneInfo.isJALanguage() || PhoneInfo.isVNLanguage() || PhoneInfo.isTHLanguage()) && (fontSize = 10);
        (PhoneInfo.isIDLanguage()) && (fontSize = 8);

        return (
            <BoxShadow setting={{width:(width-80)/3, height:this.getCardHeight(), color:"#000000",
                border:2, radius:10, opacity:0.1, x:0, y:1}}>
                <View style={[styles.middle,{height:this.getCardHeight()}]}>
                    <Text style={styles.label}>{I18n.t('Score show')}</Text>
                    <Text style={styles.points}>{inspectData.score}</Text>
                    <Text style={[styles.standard,{color, fontSize}]}>{label}</Text>
                </View>
            </BoxShadow>
        )
    }

    renderRight(){
        const {collapsible,data,enumSelector,viewType} = this.state;
        this.data = data.map(p => p.score).reverse();
        let isSummary = this.props.data != null;

        let viewIndicator = enumSelector.viewType.FAILURE;
        if (viewType !== enumSelector.viewType.FAILURE){
            viewIndicator = (this.data.length > 0) ? enumSelector.viewType.SUCCESS : enumSelector.viewType.EMPTY;
        }

        let fontSize = 12;
        PhoneInfo.isVNLanguage() && (fontSize = 8);

        return (
            <TouchableOpacity activeOpacity={1} onPress={()=>{
                if(viewIndicator === enumSelector.viewType.SUCCESS){
                    EventBus.closePopupPatrol();
                    this.setState({collapsible: !collapsible});
                }
            }}>
                <BoxShadow setting={{width:(width-80)/3, height:this.getCardHeight(), color:"#000000",
                    border:2, radius:10, opacity:0.1, x:0, y:1, style:{marginRight:4}}}>
                    {(viewIndicator === enumSelector.viewType.SUCCESS) ?
                        <View style={[styles.right,{height:this.getCardHeight()}]}>
                            <View style={styles.record}>
                                <Text style={[styles.label,{marginRight:3,color:'#006AB7',fontSize}]}>{I18n.t('Scoring record')}</Text>
                                <Image source={collapsible ? require('../assets/img_chart_up.png') : require('../assets/img_chart_down.png')}
                                    style={styles.image}/>
                            </View>
                        {this.renderChart()}
                    </View> : <View style={[styles.right,{height:this.getCardHeight()}]}>
                        <Text style={[styles.label,{marginRight:3,color:'#006AB7',fontSize:12,marginTop:10}]}>
                            {I18n.t('Scoring record')}
                        </Text>
                        <ViewIndicator viewType={viewIndicator}
                                       containerStyle={{justifyContent:'center'}}
                                       indicatorStyle={{width:20,height:20}}
                                       promptStyle={{fontSize:10}}
                                       smallIndicator={true}
                                       refresh={() => {
                                           (async ()=> this.fetchData())();
                                       }}
                        />
                        </View>}
                </BoxShadow>
            </TouchableOpacity>
        )
    }

    renderMultiple(){
        return (
            <View style={styles.panel}>
                {this.renderLeft()}
                {this.renderMiddle()}
                {this.renderRight()}
            </View>
        )
    }

    renderSingle(){
        let {data, weatherIconUrl} = this.state, marginTop = 10, fontSize = 12;
        let inspectData = (this.props.data != null) ? this.props.data : data[0];
        const date = TimeUtil.getDetailTime(inspectData.ts)[0];
        let time = TimeUtil.getDetailTime(inspectData.ts)[6];

        (weatherIconUrl != '') && (marginTop = 0);

        PhoneInfo.isVNLanguage() && (fontSize = 10);

        return (
            <View style={{paddingBottom:10}}>
                <BoxShadow setting={{width:width-60, height:89, color:"#000000",
                    border:2, radius:10, opacity:0.1, x:0, y:1,style:{marginLeft:4}}}>
                    <View style={styles.single}>
                        <Text style={[styles.label,{marginTop,fontSize}]}>{I18n.t('Patrol time')}</Text>
                        <Text style={[styles.date,{marginTop:9}]}>{date}({time})</Text>
                        {
                            (weatherIconUrl != '') ? <Image source={{uri:weatherIconUrl}}
                                                           style={[styles.weather,{marginTop:6}]}/> : null
                        }
                    </View>
                </BoxShadow>
            </View>
        )
    }

    renderRecord(){
        let {showMode} = this.props, mode = '';
        const {viewType,enumSelector,data,type} = this.state;

        let isSummary = this.props.data != null;
        let inspectData = isSummary ? this.props.data : data[0];
        if(viewType === enumSelector.viewType.SUCCESS){
            mode = (inspectData.mode === 0) ? I18n.t('Remote patrol') : I18n.t('Onsite patrol');
            mode = '('+mode+')';
        }

        return (
            <View>
                {
                    showMode ? <Text style={styles.mode}>{I18n.t('Previous patrol')}{mode}</Text> : null
                }

                {
                    ((viewType !== enumSelector.viewType.SUCCESS) && !isSummary) &&
                        <View style={{height:142}}>
                            <ViewIndicator viewType={viewType}
                                           containerStyle={{justifyContent:'center'}}
                                           indicatorStyle={{width:60,height:60}}
                                           refresh={() =>{
                                               (async ()=> this.fetchData())();
                                           }}
                            />
                        </View>
                }

                {
                    (viewType === enumSelector.viewType.SUCCESS || isSummary) && <View style={styles.recordContent}>
                        <Text style={styles.tableName}>{inspectData.inspectTagName}</Text>
                        {(type === 1) ? this.renderSingle() : this.renderMultiple()}
                    </View>
                }
            </View>
        )
    }

    renderChart(){
        let {data} = this.state;

        let withDots = true;
        if(this.data.length > 1) {
            withDots = false;
        }
        return <View style={{marginTop:16,marginLeft:8}}>
                <SmallChart data={{
                                labels: this.xAxis,
                                datasets: [{data:this.data}]
                            }}
                          width={90}
                          height={45}
                          chartConfig={{
                              backgroundColor: "#fff",
                              backgroundGradientFrom: "#fff",
                              backgroundGradientTo: "#fff",
                              fillShadowGradient:'rgba(0, 106, 183, 1)',
                              fillShadowGradientOpacity:0.6,
                              decimalPlaces: 1,
                              strokeWidth:2,
                              color: (opacity = 1) => `rgba(0, 106, 183, 1)`,
                              labelColor: (opacity = 1) => `rgba(134, 136, 138, 1)`,
                              propsForDots: {
                                  r: "3",
                                  strokeWidth: "2",
                                  stroke: "rgba(229, 241, 251, 1)"
                              },
                          }}
                          withDots={withDots}
                          bezier
                          style={{
                              paddingRight:16,
                              marginLeft:6,
                              paddingTop: 3,
                              marginTop: -5
                              //paddingBottom: -16
                          }}
                          withVerticalLabels={false}
                          withHorizontalLabels={false}
                          withHorizontalLines={false}
                          withVerticalLines={false}/>
        </View>
    }

    renderLineChart(){
        let {collapsible, data, viewType, enumSelector} = this.state;
        this.xAxis = data.map(p => p.ts).reverse();
        this.xAxis = this.xAxis.map(p => TimeUtil.getDetailTime(p)[2]);

        return ((viewType === enumSelector.viewType.SUCCESS) && collapsible) ?
            <TouchableInactive>
                <BoxShadow setting={{width:(width-60), height:125, color:"#000000",
                    border:2, radius:10, opacity:0.1, x:0, y:1,style:{marginLeft:20,marginBottom:20}}}>
                    <View style={styles.outerPanel}>
                        <ScrollView ref={c => this.chart = c}
                                onContentSizeChange={() => {this.chart && this.chart.scrollToEnd({animated:false})}}
                                horizontal={true} showsHorizontalScrollIndicator={false}
                                style={styles.chartPanel}>
                            <TouchableActive>
                                <LineChart data={{
                                        labels: this.xAxis,
                                        datasets: [{data:this.data}]
                                    }}
                                    width={(this.data.length < 8) ? (width-70) : ((width-80+(this.data.length-7)*46))}
                                    height={110}
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
                                        paddingRight:16
                                    }}
                                    hidePointsAtIndex={[]}
                                    withVerticalLabels={true}
                                    withHorizontalLabels={false}
                                    withHorizontalLines={false}
                                    withVerticalLines={false}/>
                                </TouchableActive>
                        </ScrollView>
                    </View>
                </BoxShadow>
            </TouchableInactive> : null
    }

    renderStatistics(){
        let {showChart, statistics} = this.props;
        let {type} = this.state;

        return (showChart && (type !== 1)) ?
            <PatrolChart statistics={statistics}/> : null;
    }

    render() {
        let {showMode} = this.props;
        return (
            <View style={[styles.container, !showMode && {marginTop:0}]}>
                {this.renderRecord()}
                {this.renderLineChart()}
                {this.renderStatistics()}
                <ModalWeather ref={c => this.modalWeather = c}
                    onSelect={(weatherType) => {this.setState({weatherIconUrl: this.setWeatherIconUrl(weatherType), weatherType})}}/>
            </View>
        )
    }

    getCardHeight(){
        let {weatherIconUrl, standard} = this.state;
        return ((weatherIconUrl != '') || (standard !== -1)) ? 90 : 89;
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor:'#EBF1F4',
        borderRadius:10,
        marginTop:40
    },
    mode:{
        color:'#64686D',
        marginTop:-40,
        marginBottom:12,
        marginLeft:6
    },
    recordContent:{
        backgroundColor:'#EBF1F4',
        borderRadius:10,
        paddingLeft:16,
        paddingRight:16
    },
    tableName:{
        marginTop: 16,
        marginBottom:16,
        marginLeft:10,
        color:'#86888A'
    },
    panel:{
        flexDirection:'row',
        justifyContent:'space-between',
        paddingBottom:10
    },
    left:{
        width:(width-80)/3,
        backgroundColor:'#fff',
        paddingTop:10,
        borderRadius:10
    },
    middle:{
        width:(width-80)/3,
        backgroundColor:'#fff',
        borderRadius:10,
        paddingTop:10
    },
    right:{
        width:(width-80)/3,
        backgroundColor:'#fff',
        alignItems:'center',
        borderRadius:10
    },
    label:{
        textAlign:'center',
        color:'#64686D',
        fontSize:12
    },
    date:{
        textAlign: 'center',
        fontSize:12,
        color:'#64686D',
        marginTop:8
    },
    time:{
        textAlign:'center',
        color:'#86888A',
        fontSize: 12,
        marginTop: 8
    },
    points:{
        textAlign:'center',
        marginTop:10,
        fontSize:22,
        color:'#1E272E'
    },
    total:{
        textAlign:'center',
        fontSize:12,
        color:'gray'
    },
    record:{
        flexDirection: 'row',
        justifyContent:'flex-start',
        alignItems:'center',
        marginTop:10,
        marginLeft:6
    },
    outerPanel:{
        borderRadius:10,
        backgroundColor:'#fff',
        marginRight:20,
        marginBottom:20,
        height: 125,
        width:width-60
    },
    chartPanel:{
        borderRadius:10,
        marginTop:10,
        marginLeft:10,
        marginRight:10
    },
    image:{
        width:18,
        height:10
    },
    weather:{
        width:24,
        height:24,
        alignSelf:'center',
        marginTop:8
    },
    standard:{
        alignSelf: 'center',
        marginTop:0
    },
    single:{
        width:width-60,
        height:89,
        backgroundColor:'#fff',
        paddingTop:10,
        borderRadius:10
    },
    category:{
        alignSelf:'center',
        flexDirection:'row'
    },
    arrow:{
        width:18,
        height:10,
        marginTop:14
    }
});
