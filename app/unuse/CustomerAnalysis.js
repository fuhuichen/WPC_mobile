import React, { Component } from 'react';
import {
    Dimensions,
    StyleSheet,
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    DeviceEventEmitter,
    FlatList
} from 'react-native';
import RNStatusBar from "../components/RNStatusBar";
import PieChartCircle from "./PieChartCircle";
import I18n from 'react-native-i18n';
import HttpUtil from "../utils/HttpUtil";
import {ColorStyles} from "../common/ColorStyles";
import Toast from "react-native-easy-toast";
import NetInfoIndicator from "../components/NetInfoIndicator";
import SlideModalEx from "../components/SlideModal";
import LineChart from './LineChart';
import moment from "moment";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

import store from "../../data/src/stores/Index";
import {inject, observer} from "mobx-react";
@inject('store')
@observer
export default class CustomerAnalysis extends Component {
    constructor(props){
        super(props)

        this.state = {
            selectTab: 1,
            dropIndex1: 0,
            dropIndex2: 0,
            dataPieChartCircle1:[],
            dataPieChartNumber1:[],
            dataPieChartCircle2:[],
            lineChart:{
                labels: [],
                labels2: [],
                datasets: []
            },
            barChart:{
                labels: [I18n.t('Visit once'),I18n.t('Visit twice'),I18n.t('Visit three to five'),I18n.t('Visit five more')],
                labels2:[],
                datasets: [],
                barMax:0,
                barDataset:[],
                barDataset2:[],
                barDataset3:[],
                barDatasetVisible:true,
                barDataset2Visible:true,
                barDataset3Visible:true,
            },
            showReportData:false,
        }
        this.dropList1 = [I18n.t('Today'),I18n.t('This week'),I18n.t('This month')];
        this.dropList2= [I18n.t('This week'),I18n.t('This month'),I18n.t('This season')];
        this.yOffset = 0;
        this.dayType = {
            0:I18n.t('Sun'),
            1:I18n.t('Mon'),
            2:I18n.t('Tue'),
            3:I18n.t('Wed'),
            4:I18n.t('Thur'),
            5:I18n.t('Fri'),
            6:I18n.t('Sat')
        } 
    }

    componentDidMount(){
        this.eventEmitter = DeviceEventEmitter.addListener('onRefreshCustomer', this.onRefresh.bind(this));
        this.onRefresh();
    }

    componentWillUnmount() {
        this.eventEmitter && this.eventEmitter.remove();
    }

    onRefresh(){
        setTimeout(() => {
            this.fetchData1();
            this.fetchData2();
        }, 500);
    }

    getNumFix2(num){
        return num.toString().indexOf(".") === -1 ? num : num.toFixed(2);
    }

    fetchData1(){
        let beginTs = 0;
        if(this.state.dropIndex1 === 0){
            beginTs = moment().startOf('day').format('X');
        }
        else if(this.state.dropIndex1 === 1){
            beginTs = moment().startOf('week').format('X');
        }
        else if(this.state.dropIndex1 === 2){
            beginTs = moment().startOf('month').format('X');
        }
        let request = {};
        request.beginTs = beginTs*1000;
        request.endTs = moment().format('X')*1000;
        let storeIds = [];
        storeIds.push(store.visitSelector.storeId);
        request.storeIds = storeIds;
        let dataPieChartCircle1 = [];
        let dataPieChartNumber1 = [];
        HttpUtil.post('statistics/customer/overview',request)
        .then(result => {
            let total = 0;
            result.data.sort((a, b) => a.category - b.category);
            result.data.forEach((item,index)=>{
                if(item.category !== -1){
                    dataPieChartNumber1.push(item.numOfVisits);
                    total += item.numOfVisits;
                }
            })
            if(total == 0){
                total = 1;
            }
            dataPieChartNumber1.forEach((item,index)=>{
                dataPieChartCircle1.push(this.getNumFix2(item*100/total))
            })
            this.setState({showReportData:true,dataPieChartCircle1:dataPieChartCircle1,dataPieChartNumber1:dataPieChartNumber1});
        })
        .catch(error=>{
        })
    }

    fetchData2(){
        let beginTs = 0;
        let endTs = moment().format('X')*1000;
        let timeMode = 0;
        if(this.state.dropIndex2 === 0){
            beginTs = moment().startOf('week').format('X')*1000;
        }
        else if(this.state.dropIndex2 === 1){
            beginTs = moment().startOf('month').format('X')*1000;
        }
        else if(this.state.dropIndex2 === 2){
            beginTs = moment().startOf('quarter').format('X')*1000;
            timeMode = 1;
        }
        let storeIds = [];
        storeIds.push(store.visitSelector.storeId);

        let request = {};
        request.beginTs = beginTs;
        request.endTs = endTs;
        request.timeMode = timeMode;
        request.storeIds = storeIds;
        HttpUtil.post('statistics/customer/visits',request)
        .then(result => {
            let labels = [];
            let labels2 = [];
            let dataset = {};
            dataset.data = [];
            result.data.forEach((item,index)=>{
                let label = '';
                if(this.state.dropIndex2 === 0){
                    let dayIndex = moment.unix(item.ts/1000).format('d');
                    label = this.dayType[dayIndex];
                }
                else if (this.state.dropIndex2 === 1){
                    label = moment.unix(item.ts/1000).format('DD');
                }
                else if (this.state.dropIndex2 === 2){
                    label = moment.unix(item.ts/1000).format('MM/DD');
                    let weekDay = moment.unix(item.ts/1000).format('d');
                    let label2 = moment.unix(item.ts/1000).add(7-weekDay,'days').format('MM/DD');
                    labels2.push(label2);
                }
                labels.push(label);
                let num = 0;
                item.info.forEach((itemInfo,indexInfo)=>{
                   if(itemInfo.category !== -1){
                      num += itemInfo.numOfVisits;
                   }   
                })
                dataset.data.push(num);
            });

            if(labels2.length >0){
                labels2[labels2.length-1]= moment().format('MM/DD');
            }
            let lineChart = this.state.lineChart;
            lineChart.labels = labels;
            lineChart.labels2 = labels2;
            lineChart.datasets = [];
            lineChart.datasets.push(dataset);
            this.setState({lineChart:lineChart});
        })
        .catch(error=>{
        })


        let request2 = {};
        request2.beginTs = beginTs;
        request2.endTs = endTs;
        request2.intervals = [1,2,5];
        request2.storeIds = storeIds;

        HttpUtil.post('statistics/customer/frequency',request2)
        .then(result => {
            let barChart = this.state.barChart;
            barChart.barDataset = [];
            barChart.barDataset2 = [];
            barChart.barDataset3 = [];
            result.data.forEach((item,index)=>{
                item.info.forEach((itemInfo,indexInfo)=>{
                    if(itemInfo.category === 0){
                       barChart.barDataset.push(itemInfo.numOfVisits);
                    }
                    else if(itemInfo.category === 1){
                       barChart.barDataset2.push(itemInfo.numOfVisits);
                    }
                    else if(itemInfo.category === 2){
                       barChart.barDataset3.push(itemInfo.numOfVisits);
                    }
               })
            });
            barChart.barMax = this.findMax(barChart.barDataset,barChart.barDataset2,barChart.barDataset3);
            this.setState({barChart:barChart});
        })
        .catch(error=>{
        })

        let request3 = {};
        request3.intervals = [3,7,15,30];
        request3.storeIds = storeIds;
        HttpUtil.post('statistics/customer/last/visit',request3)
        .then(result => {
            let dataPieChartCircle2 = [];
            let dataPieChartNumber2 = [];
            let total = 0;
            result.data.forEach((item,index)=>{
                let num = 0;
                item.info.forEach((itemInfo,indexInfo)=>{
                    if(itemInfo.category !== -1){
                        num += itemInfo.numOfVisits;
                    } 
               })
               dataPieChartNumber2.push(num);
               total += num;
            });
            if(total == 0){
                total = 1;
            }
            dataPieChartNumber2.forEach((item,index)=>{
                dataPieChartCircle2.push(this.getNumFix2(item*100/total))
            })
            this.setState({dataPieChartCircle2:dataPieChartCircle2});
        })
        .catch(error=>{
        })
    }

    findMax(barDataset,barDataset2,barDataset3){
        let newSet = barDataset.concat(barDataset2,barDataset3);
        return Math.max(...newSet);
    }

    renderBtn1 = ({item,index}) => {
        return (
            <TouchableOpacity onPress={() => {
                this.modalDownList1.close();
                this.setState({dropIndex1:index});
                setTimeout(() => {
                    this.fetchData1();
                }, 500);
            }}>
                <View style={{height:30,minWidth:95,alignItems:'center',borderWidth:1,borderColor:'#DCDCDC',paddingLeft:10,paddingRight:10,
                    backgroundColor:'#F7F8FA', flexDirection:'row',justifyContent:'center'}}>
                    <Text style={{fontSize:14,color:'#0D0000'}}>{item}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    renderBtn2 = ({item,index}) => {
        return (
            <TouchableOpacity onPress={() => {
                this.modalDownList2.close();
                this.setState({dropIndex2:index});
                setTimeout(() => {
                    this.fetchData2();
                }, 500);
            }}>
                <View style={{height:30,minWidth:95,alignItems:'center',borderWidth:1,borderColor:'#DCDCDC',paddingLeft:10,paddingRight:10,
                    backgroundColor:'#F7F8FA', flexDirection:'row',justifyContent:'center'}}>
                    <Text style={{fontSize:14,color:'#0D0000'}}>{item}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    renderReportData(){
        let selectColor1 = this.state.selectTab === 1 ? '#f31d65':'#888c95';
        let selectColor2 = this.state.selectTab === 1 ? '#888c95':'#f31d65';
        let tabContent = null;
        if (this.state.selectTab === 2 ){ tabContent = (
            <PieChartCircle type={3} data={this.state.dataPieChartCircle2}/>
        )}
        else{
            if(this.state.barChart.barDataset.length === 0 || Math.max(...this.state.barChart.barDataset) == 0) {tabContent = (
                <View style={{marginBottom:10,alignItems:'center',justifyContent:'center'}}>
                    <Image style={{width:100,height:100}} source={require('../assets/images/img_analysis_no_data.png')} resizeMode='contain'/>
                    <Text style={{fontSize: 14, color: '#d5dbe4', textAlign: 'center',marginTop:6}}>{I18n.t('No data')}</Text>
                </View>
            )
            }
            else {tabContent = (
                <LineChart viewNumber={true} data={this.state.barChart} width={Dimensions.get('screen').width-32}
                            height={160} showLine={true} uniqueUnit={true} enderEndlabel ={true} textFloat={true}
                            chartConfig={{
                                backgroundGradientFrom: 'white',
                                backgroundGradientTo: 'white',
                                decimalPlaces: 2,
                                color: (opacity = 1) => `rgba(152, 155, 163, ${opacity})`,
                                style: {borderRadius: 0}}}
                            style={{marginVertical: 8,borderRadius: 0}}/>
            )
            }
        }

        return (
            <View style={{marginLeft:16,marginRight:16,marginTop:12,marginBottom:10}} >
                <View style={{flexDirection: 'row',justifyContent: 'space-between',alignItems:'center'}}>
                    <Text style={styles.textBold}>{I18n.t('Customer compose')}</Text>
                    <TouchableOpacity onPress={() => {this.modalDownList1.open();}}>
                        <View style={{height:30,alignItems:'center',borderWidth:1,borderColor:'#DCDCDC',borderRadius:20,
                                backgroundColor:'#F7F8FA', flexDirection:'row',justifyContent:'center'}}>
                                <Text style={{fontSize:14,color:'#0D0000',marginLeft:20}}>{this.dropList1[this.state.dropIndex1]}</Text>
                                <View style={{flex:1}}/>
                                <Image style={{height:37,width:48}} resizeMode={'contain'} source={require('../assets/images/home_pulldown_icon_mormal.png')}/>
                        </View>
                    </TouchableOpacity>
                </View>

                <PieChartCircle type={2} data={this.state.dataPieChartCircle1} number={this.state.dataPieChartNumber1}/>
                <View style={{width:width,height:10,backgroundColor:'#f6f8fa',marginLeft:-16,marginRight:-16,marginBottom:10}}></View>
                <View style={{marginBottom:5,flexDirection: 'row',justifyContent: 'space-between',alignItems:'center'}}>
                    <Text style={styles.textBold}>{I18n.t('Customer visit trend')}</Text>
                    <TouchableOpacity onPress={() => {this.modalDownList2.openEx(335-this.yOffset);}}>
                        <View style={{height:30,alignItems:'center',borderWidth:1,borderColor:'#DCDCDC',borderRadius:20,
                                backgroundColor:'#F7F8FA', flexDirection:'row',justifyContent:'center'}}>
                                <Text style={{fontSize:14,color:'#0D0000',marginLeft:20}}>{this.dropList2[this.state.dropIndex2]}</Text>
                                <View style={{flex:1}}/>
                                <Image style={{height:37,width:48}} resizeMode={'contain'} source={require('../assets/images/home_pulldown_icon_mormal.png')}/>
                        </View>
                    </TouchableOpacity>
                </View>

                {this.state.lineChart.datasets.length > 0 ?
                     <LineChart viewNumber={true} data={this.state.lineChart} width={Dimensions.get('screen').width-32}
                     height={160} showLine={true} uniqueUnit={true} enderEndlabel ={true} textFloat={true}
                     chartConfig={{
                         backgroundGradientFrom: 'white',
                         backgroundGradientTo: 'white',
                         decimalPlaces: 2,
                         color: (opacity = 1) => `rgba(152, 155, 163, ${opacity})`,
                         style: {borderRadius: 0}}}
                     style={{marginVertical: 8,borderRadius: 0}}/>:
                     <View style={{marginBottom:10,alignItems:'center',justifyContent:'center'}}>
                        <Image style={{width:100,height:100}} source={require('../assets/images/img_analysis_no_data.png')} resizeMode='contain'/>
                        <Text style={{fontSize: 14, color: '#d5dbe4', textAlign: 'center',marginTop:6}}>{I18n.t('No data')}</Text>
                    </View>
                }

                <View style={styles.SelectBarPanel}>
                    <TouchableOpacity onPress={()=>this.setState({selectTab:1})}>
                        <Text style={{fontSize:14,height: 38, textAlignVertical:'center',lineHeight: 38,color: selectColor1}}>{I18n.t('Customer visit total')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>this.setState({selectTab:2})}>
                        <Text style={{fontSize:14,height: 38, textAlignVertical:'center',lineHeight: 38,color:selectColor2}}>{I18n.t('Customer visit frequency')}</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.tabLinePanel}>
                    <View style={this.state.selectTab === 1 ? styles.tabSelected : styles.tabNormal}></View>
                    <View style={this.state.selectTab === 2 ? styles.tabSelected : styles.tabNormal}></View>
                </View>
                {tabContent}             
                <SlideModalEx ref={(c) => { this.modalDownList1 = c; }}  offsetY={95} offsetX={260} opacity={0.1}>
                    <FlatList
                        data={this.dropList1}
                        extraData={this.state}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderBtn1}
                    />
                </SlideModalEx>
                <SlideModalEx ref={(c) => { this.modalDownList2 = c; }}  offsetY={335} offsetX={260} opacity={0.1}>
                    <FlatList
                        data={this.dropList2}
                        extraData={this.state}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderBtn2}
                    />
                </SlideModalEx>
            </View>
        )
    }

    render() {
        let noData = (
            <View style={{marginTop:100,alignItems:'center',justifyContent:'center'}}>
                <Image style={{width:100,height:100}} source={require('../assets/images/img_analysis_no_data.png')} resizeMode='contain'/>
                <Text style={{fontSize: 18, color: '#d5dbe4', textAlign: 'center',marginTop:10}}>{I18n.t('No data')}</Text>
            </View>
        )
        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <View style={{flexDirection:'row',justifyContent: 'center',alignItems: 'center',width:width}}>
                       <Text style={[styles.NavBarTitle,{fontSize:18,marginRight:5,marginLeft:26}]}>{I18n.t('Customer analysis')}</Text>
                   </View>
                </View>
                <NetInfoIndicator/>   
                <ScrollView onScroll={event =>{
                    this.yOffset = event.nativeEvent.contentOffset.y;
                }}>
                <View>
                    {this.state.showReportData? this.renderReportData(): noData}
                </View>
                </ScrollView>        
                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    NavBarPanel:{
        flexDirection: 'row',
        height: 48,
        backgroundColor: '#24293d',
        alignItems: 'center'
    },
    NavBarTitle: {
        fontSize: 14,
        height: 48,
        color: '#ffffff',
        textAlignVertical:'center',
        lineHeight:48
    },
    menuItemTextBlack:{
        fontSize:16,
        marginLeft:12,
        color: '#19293b',
        textAlignVertical: 'center',
    },
    textNormal:{
        fontSize:14,
        color: '#19293b',
        textAlignVertical: 'center'
    },
    textBold:{
        fontSize:14,
        color: '#19293b',
        fontWeight:'bold',
        textAlignVertical: 'center'
    },
    SelectBarPanel:{
        //backgroundColor: '#eff2f5',
        height: 40,
        textAlignVertical:'center',
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    tabLinePanel:{
        flexDirection:'row',
        justifyContent:'space-between',
        marginBottom:10
    },
    tabSelected:{
        width:width/2-16,
        height:1,
        backgroundColor:ColorStyles.COLOR_MAIN_RED
    },
    tabNormal:{
        width:width/2-16,
        height:1,
        backgroundColor:'#cbcbcb'
    }
});
