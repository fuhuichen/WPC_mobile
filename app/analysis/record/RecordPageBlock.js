import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    FlatList,
    Platform,
    TouchableOpacity,
    ActivityIndicator
} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from "react-native-router-flux";
import store from "../../../mobx/Store";
import ViewIndicator from "../../customization/ViewIndicator";
import SlotView from "../../customization/SlotView";
import FilterCore from "../common/FilterCore";
import * as BorderShadow from "../../element/BorderShadow";
import TouchableInactive from "../../touchables/TouchableInactive";
import TouchableActive from "../../touchables/TouchableActive";
import EventBus from "../../common/EventBus";
import {Divider} from "react-native-elements";
import {getStatisticsInspectReportPersion} from "../../common/FetchRequest";

const {width, height} = Dimensions.get('window');
export default class RecordPageBlock extends Component {
    state = {
        viewType: store.enumSelector.viewType.EMPTY,
        analysisType: store.enumSelector.analysisType.RECORD,
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector,
        filterSelector: store.filterSelector,
        contentOffset:0,
        showFooter: 0, // 0: hidden, 1: no more data, 2: loading
        currentPage: 0,
        lastPage: true,
        onEndReached: false,
        onPull:false,
        data: []
    };

    fetchData(page, load){
        try {
            let {enumSelector, analysisSelector, analysisType, filterSelector} = this.state, lastPage = true;
            let data = load ? [] : this.state.data;
            load && this.setState({ viewType:enumSelector.viewType.LOADING});

            (async () => {
                let filter = FilterCore.getFilter(analysisType, filterSelector);
                let body = FilterCore.getRange(analysisSelector.recordRangeType, analysisSelector.recordRanges);
                body.submitters = filter.userId;
                (filter.storeId != null) && (body.storeIds = filter.storeId);
                body.filter = {page: page, size:30};
                body.order = {direction:'desc', property:'numOfTotal'};
                body.isMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;

                let viewType = enumSelector.viewType.FAILURE;
                let result = await getStatisticsInspectReportPersion(body);

                let content = [];
                if (result.errCode === enumSelector.errorType.SUCCESS){
                    content = result.data.content;

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
            })();

        }catch (e) {
        }
    }

    onPatrol(item){
        EventBus.closeOptionSelector();

        let {analysisType, filterSelector, analysisSelector, enumSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        let request = FilterCore.getRange(analysisSelector.recordRangeType, analysisSelector.recordRanges);
        request.groupMode = enumSelector.groupType.STORE;
        request.submitters = [item.supervisorId];
        (filter.storeId != null) && (request.storeIds = filter.storeId);
        request.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;

        Actions.push('storeReportTimes', {request});
    }

    onStore(item){
        EventBus.closeOptionSelector();

        let {analysisType, filterSelector, analysisSelector, enumSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        let request = FilterCore.getRange(analysisSelector.recordRangeType, analysisSelector.recordRanges);
        request.submitters = [item.supervisorId];
        (filter.storeId != null) && (request.storeIds = filter.storeId);
        request.isMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector);

        Actions.push('storeUnPatrol', {request});
    }

    onEvent(item){
        EventBus.closeOptionSelector();

        let {enumSelector, analysisSelector, analysisType, filterSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        let request = FilterCore.getRange(analysisSelector.recordRangeType, analysisSelector.recordRanges);
        request.groupMode = enumSelector.groupType.STORE;
        request.submitters = [item.supervisorId];
        (filter.storeId != null) && (request.storeIds = filter.storeId);
        request.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;

        Actions.push('storeEventTimes', {request});
    }

    renderCard(label, content){
        return <View style={[styles.card, BorderShadow.div]}>
            <View style={styles.labelPanel}>
                <Text style={styles.label}>{label}</Text>
            </View>
            <Text style={styles.content}>{content}</Text>
        </View>
    }

    renderItem({item, index}){
        return <TouchableInactive>
            <View style={styles.panel}>
                <TouchableActive>
                    <Text style={styles.name} numberOfLines={2}>{item.supervisorName}</Text>
                    <View style={styles.stores}>
                        <Text style={styles.manage}>{I18n.t('Managed stores',{key: item.numOfStores})}</Text>
                        <View style={styles.cardPanel}>
                            <TouchableOpacity activeOpacity={0.5} onPress={() => this.onPatrol(item)}>
                                {this.renderCard(I18n.t('Inspection times'), item.numOfTotal)}
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.5} onPress={() => this.onStore(item)}>
                                {this.renderCard(I18n.t('Not inspected stores'), item.numOfStoresNotPatrolled)}
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.5} onPress={() => this.onEvent(item)}>
                                {this.renderCard(I18n.t('Submitted event'), item.processedRate)}
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableActive>
            </View>
        </TouchableInactive>
    }

    render() {
        let {viewType, enumSelector, data} = this.state;

        return (
            <View style={styles.container}>
                {
                    (viewType !== enumSelector.viewType.SUCCESS) ? <ViewIndicator viewType={viewType}
                                containerStyle={{justifyContent:'center'}} refresh={() => this.fetchData()}/>
                        : <FlatList data={data}
                                    onScroll={(evt) => {
                                        EventBus.closeOptionSelector();
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
                    (this.state.contentOffset  >= (height-Platform.select({android:56, ios:78})-124))
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
        let {showFooter} = this.state, component = null;
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
                <SlotView containerStyle={{height:20}}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        marginTop:26
    },
    panel:{
        width:width-20
    },
    name:{
        fontSize:16,
        color:'rgb(100,104,109)',
        marginLeft:10
    },
    stores:{
        height:166,
        backgroundColor:'rgb(235,241,244)',
        borderRadius:10,
        marginTop:15
    },
    manage:{
        fontSize:12,
        color:'rgb(133,137,142)',
        marginTop:10,
        marginLeft: 10
    },
    cardPanel:{
        flexDirection:'row',
        justifyContent: 'space-between',
        paddingLeft:10,
        paddingRight:10,
        marginTop:10
    },
    card:{
        width:(width-60)/3,
        height:109,
        borderRadius: 10,
        backgroundColor: '#fff',
        alignItems:'center'
    },
    labelPanel:{
        marginTop:10,
        height:34,
        alignItems:'center'
    },
    label:{
        color:'rgb(100,104,109)',
        fontSize:12,
        textAlign: 'center'
    },
    content:{
        color:'rgb(100,104,109)',
        fontSize: 40
    },
    divider:{
        height:20,
        borderBottomWidth:0,
        backgroundColor:'#F7F9FA'
    },
    footer:{
        flexDirection:'row',
        height:24,
        justifyContent:'center',
        alignItems:'center',
        marginBottom:10,
    }
});
