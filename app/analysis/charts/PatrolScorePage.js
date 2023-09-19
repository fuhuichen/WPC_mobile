import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, FlatList, Platform, ActivityIndicator} from "react-native";
import I18n from "react-native-i18n";
import PropTypes from 'prop-types';
import {Actions} from "react-native-router-flux";
import Navigation from "../../element/Navigation";
import EventBus from "../../common/EventBus";
import Divider from "react-native-elements/dist/divider/Divider";
import store from "../../../mobx/Store";
import DataCell from "./DataCell";
import ViewIndicator from "../../customization/ViewIndicator";
import * as BorderShadow from "../../element/BorderShadow";
import {getInspectReportGroupOverview} from "../../common/FetchRequest";
import FilterCore from "../common/FilterCore";

const {width, height} = Dimensions.get('window');
export default class PatrolScorePage extends Component {
    state = {
        viewType: store.enumSelector.viewType.EMPTY,
        analysisType: store.enumSelector.analysisType.PATROL,
        enumSelector: store.enumSelector,
        filterSelector: store.filterSelector,
        analysisSelector: store.analysisSelector,
        contentOffset: 0,
        showFooter: 0, // 0: hidden, 1: no more data, 2: loading
        currentPage: 0,
        lastPage: true,
        onEndReached: false,
        onPull:false,
        data: []
    };

    static propTypes = {
        request: PropTypes.object
    };

    componentDidMount(){

        let {request} = this.props;
        console.log(request);
        (request.storeIds.length > 0 || request.submitters.length>0) && (this.fetchData(0, true));
    }

    fetchData(page, load){
        try {
            let {viewType, enumSelector} = this.state;
            let data = load ? [] : this.state.data;

            load && this.setState({viewType: enumSelector.viewType.LOADING});


            setTimeout(async () => {
                let {request} = this.props, lastPage = true;
                request.filter.page = page;
                request.filter.size = 100;

                viewType = enumSelector.viewType.FAILURE;
                let result = await getInspectReportGroupOverview(request);

                let content = [];
                if (result.errCode === enumSelector.errorType.SUCCESS){
                    content = result.data.content;
                    content.forEach(p => {
                        p.title = p.groupName;
                        p.times = p.numOfReport;
                        p.score = p.averageScore;
                    });

                    lastPage = result.data.last;
                    viewType = (content.length > 0) ? enumSelector.viewType.SUCCESS : enumSelector.viewType.EMPTY;
                }

                data = data.concat(content);
                viewType = load ? viewType : this.state.viewType;
                this.setState({
                    data,
                    viewType,
                    lastPage,
                    onEndReached: false,
                    onPull: false,
                    showFooter: 0
                });
            },200);
        }catch (e) {
        }
    }

    onBack(){
        Actions.pop();
    }

    onRow(item, index){
        let {enumSelector, analysisType, filterSelector, analysisSelector} = this.state;
        let request = JSON.parse(JSON.stringify(this.props.request));
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        if (request.groupMode !== enumSelector.groupType.STORE){
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

    renderItem({item, index}){
        return <DataCell data={item} onRow={() => {this.onRow(item, index)}} />
    }

    render() {
        let {data, viewType, enumSelector} = this.state;
        let viewSuccess = (viewType === enumSelector.viewType.SUCCESS);

        return (
            <View style={styles.container}>
                <Navigation
                    onLeftButtonPress={()=>{this.onBack()}}
                    title={I18n.t('Average inspection score')}
                />

                {
                    !viewSuccess ? <ViewIndicator viewType={viewType} containerStyle={{marginTop:100}}
                                                  refresh={() => this.fetchData()}/>
                        : <FlatList style={[styles.list, BorderShadow.div]}
                                    data={data}
                                    onScroll={(evt) => {
                                        this.setState({contentOffset: evt.nativeEvent.contentOffset.y});
                                    }}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={this.renderItem.bind(this)}
                                    showsVerticalScrollIndicator={false}
                                    refreshing={false}
                                    onRefresh={() => this.onRefresh()}
                                    onEndReached={() => this.onEndReached()}
                                    onEndReachedThreshold={0.1}
                                    keyboardShouldPersistTaps={'handled'}
                                    ItemSeparatorComponent={() => <Divider style={styles.divider}/>}
                                    ListFooterComponent={() => this.renderFooter()}/>
                }
            </View>
        )
    }

    // pages
    onRefresh(){
        this.setState({
            data: [],
            currentPage: 0,
            showFooter: 0,
            lastPage: false,
            onEndReached: false,
            onPull:true
        },async ()=>{
            await this.fetchData(0,true);
        })
    }

    onEndReached(){
        try {
            if(this.state.lastPage) {
                {
                    (this.state.contentOffset >= (height-Platform.select({android:56, ios:78})))
                        ? this.setState({showFooter: 1}) : this.setState({showFooter: 0});
                    return;
                }
            }

            if(!this.state.onEndReached){
                let page = ++this.state.currentPage;
                this.setState({onEndReached: true,showFooter: 2,currentPage:page});
                (async () => {
                    await this.fetchData(page,false);
                })();
            }
        }catch(e){
        }
    }

    renderFooter(){
        let {showBottom, showFooter} = this.state, component = null;
        if (showFooter === 1) {
            component = <View style={{height:40,alignItems:'center',justifyContent:'center',flexDirection:'row'}}>
                <View style={{width:50,height:1,backgroundColor:'#dcdcdc'}} />
                <Text style={{color:'#989ba3',fontSize:10,marginLeft:10}}>
                    {I18n.t('No further')}
                </Text>
                <View style={{width:50,height:1,backgroundColor:'#dcdcdc',marginLeft:10}} />
            </View>;
        }

        if(showFooter === 2) {
            component = <View style={styles.footer}>
                <ActivityIndicator color={'#989ba3'}/>
                <Text style={{fontSize: 10, color: '#989ba3'}}>{I18n.t('Loading data')}</Text>
            </View>;
        }

        return (
            <View>
                {component}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        backgroundColor:'#F7F9FA'
    },
    list:{
        borderRadius:10,
        backgroundColor:'#fff',
        width:width-20,
        marginLeft:10,
        marginTop: 16,
        flexGrow: 0
    },
    footer:{
        flexDirection:'row',
        height:24,
        justifyContent:'center',
        alignItems:'center',
        marginBottom:10,
    },
    divider:{
        borderBottomWidth:0,
        backgroundColor:'rgb(242,242,242)',
        width:width-52,
        height:2,
        marginLeft:16
    }
});