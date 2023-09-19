import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, Platform} from "react-native";
import I18n from 'react-native-i18n';
import store from "../../../mobx/Store";
import * as BorderShadow from "../../element/BorderShadow";
import ViewIndicator from "../../customization/ViewIndicator";
import PieChartCircle from "../charts/PieChartCircle";
import {Badge, Divider} from "react-native-elements";
import SlotView from "../../customization/SlotView";
import FilterCore from "../common/FilterCore";
import {getStatisticsInspectItemGroup} from "../../common/FetchRequest";

const {width} = Dimensions.get('screen');
export default class EventPatrolBlock extends Component {
    state = {
        viewType: store.enumSelector.viewType.EMPTY,
        analysisType: store.enumSelector.analysisType.EVENT,
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector,
        filterSelector: store.filterSelector,
        data: []
    };

    constructor(props){
        super(props);

        this.colors = [
            '#FCC2A3', '#FF986E', '#EC5F55', '#FA4B3F', '#BA3329',
            '#A156C5', '#5274BB', '#779AE3', '#7BD8EB', '#B9F2FD',
            '#A1F8C6', '#72F7B4', '#70BF58', '#48D91C', '#ACF757',
            '#D8FF6E', '#F7F157', '#F7D057', '#FCBC45', '#FC9741'
        ];
    }

    fetchData(){
        try {
            let {viewType, enumSelector, analysisSelector, analysisType, filterSelector} = this.state, data = [];
            this.setState({data: [], viewType: enumSelector.viewType.LOADING}, async () => {
                let filter = FilterCore.getFilter(analysisType, filterSelector);
                let body = FilterCore.getRange(analysisSelector.eventRangeType, analysisSelector.eventRanges);
                body.storeIds = filter.storeId;
                body.inspectTagId = filter.inspect[0].id;
                body.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;
                (filter.userId != null) && (body.submitters = filter.userId);

                viewType = enumSelector.viewType.FAILURE;
                let result = await getStatisticsInspectItemGroup(body);

                if (result.errCode === enumSelector.errorType.SUCCESS) {
                    let categories = result.data.filter(p => p.parentId === -1);

                    categories.forEach((category) => {
                        let groups = result.data.filter(p => p.parentId === category.groupId);
                        data.push({category: category, items: groups, unfold: false})
                    });

                    viewType = (data.length > 0) ? enumSelector.viewType.SUCCESS : enumSelector.viewType.EMPTY;
                }

                this.setState({data, viewType});
            });
        }catch (e) {
        }
    }

    renderChart(){
        let {viewType, enumSelector, data} = this.state;
        let charts = [{name: '', count:100}];

        if (viewType === enumSelector.viewType.SUCCESS){
            charts = [];
            data.forEach((item) => {
                charts.push({name:'', count: item.category.percentage});
            })
        }

        return <View style={styles.chart}>
            <PieChartCircle data={charts} colors={this.colors}/>
        </View>
    }

    renderGroups(category, items){
        return <View>
            <Divider style={styles.divider}/>
            <Text style={styles.title}>{category}</Text>
            <View style={{marginBottom:16}}>
            {
                items.map((item, index) => {
                    return <View style={styles.listPanel}>
                        <View style={styles.groupPanel}>
                            <View style={styles.circle}/>
                            <Text style={styles.groupName}>{item.groupName}</Text>
                        </View>
                        <View style={styles.contextPanel}>
                            <Text style={styles.context}>{item.numOfUnqualified}{I18n.t('Times')}  |  {item.percentage}%</Text>
                        </View>
                    </View>
                })
            }
            </View>
        </View>
    }

    onUnfold(item, index){
        let {data} = this.state;
        data[index].unfold = !data[index].unfold ;

        this.setState({data});
    }

    renderCategories(){
        let {data} = this.state;

        return <View style={styles.dataPanel}>
            {
                data.map((item, index) => {
                    let source = !item.unfold ? require('../../assets/img_unfold_down.png')
                        : require('../../assets/img_chart_up.png');
                    let color = (index < 20) ? this.colors[index] : '#ACABAB';

                    return <View>
                        <Divider style={styles.divider}/>
                        <TouchableOpacity activeOpacity={0.5} onPress={() => {this.onUnfold(item, index)}}>
                            <View style={styles.rowPanel}>
                                <View style={styles.categoryPanel}>
                                    <Badge value={''} badgeStyle={[styles.rectangle, {backgroundColor: color}]}/>
                                    <Text style={styles.categoryName} numberOfLines={1}>{item.category.groupName}</Text>
                                </View>
                                <View style={styles.arrowPanel}>
                                    <Text style={styles.content}>{item.category.numOfUnqualified} {I18n.t('Times')}  |  {item.category.percentage}%</Text>
                                    <Image source={source} style={styles.arrow}/>
                                </View>
                            </View>
                        </TouchableOpacity>
                        {item.unfold ? this.renderGroups(item.category.groupName, item.items) : null}
                    </View>
                })
            }
        </View>
    }

    renderContent(){
        return <View>
            {this.renderChart()}
            {this.renderCategories()}
            <SlotView containerStyle={{height:20}}/>
        </View>
    }

    render() {
        let {viewType, enumSelector} = this.state;
        let height = (viewType !== enumSelector.viewType.SUCCESS) ? 200 : null;

        return (
            <View style={styles.container}>
                <Text style={styles.header}>{I18n.t('Inspection item event')}</Text>
                <View style={[styles.panel, {height}, BorderShadow.div]}>
                    {
                        height ? <ViewIndicator viewType={viewType} containerStyle={{justifyContent:'center'}}/>
                            : this.renderContent()
                    }
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop:36
    },
    header:{
        marginLeft:10,
        fontSize:16,
        color:'rgb(100,104,109)'
    },
    panel:{
        width:width-20,
        borderRadius:10,
        paddingLeft:16,
        paddingRight:16,
        marginTop: 15,
        backgroundColor:'#fff'
    },
    chart:{
        width:width-52,
        alignItems:'center',
        marginTop:10
    },
    dataPanel:{
        marginTop:10
    },
    divider:{
        borderBottomWidth:0,
        color:'rgb(242,242,242)',
        height:2,
        width:width-52
    },
    rowPanel:{
        flexDirection:'row',
        justifyContent:'space-between',
        height:54,
        alignItems: 'center'
    },
    categoryPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    arrowPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    rectangle:{
        width:8,
        height:8,
        borderRadius: 0,
        borderWidth:0,
        ...Platform.select({
            android:{
                marginTop:6
            },
            ios:{
                marginTop:3
            }
        })
    },
    categoryName:{
        fontSize: 14,
        color:'rgb(100,104,109)',
        marginLeft:10,
        maxWidth:168
    },
    content:{
        fontSize:14,
        color:'rgb(100,104,109)',
        marginRight:17
    },
    arrow:{
        width:16,
        height: 16,
        marginTop:3
    },
    title:{
        fontSize:12,
        color:'rgb(100,104,109)',
        marginTop:8,
        marginBottom:2
    },
    listPanel:{
        flexDirection:'row',
        justifyContent:'space-between',
        marginTop:8
    },
    groupPanel:{
        flexDirection:'row',
        justifyContent:'flex-start'
    },
    contextPanel:{
        flexDirection:'row',
        justifyContent:'flex-end'
    },
    circle:{
        width:4,
        height:4,
        borderRadius:2,
        backgroundColor: 'rgb(133,137,142)',
        marginTop:6
    },
    groupName:{
        fontSize:12,
        color:'rgb(134,136,138)',
        marginLeft:12,
        maxWidth: 180
    },
    context:{
        fontSize:12,
        color:'rgb(134,136,138)',
        marginRight: 10
    }
});
