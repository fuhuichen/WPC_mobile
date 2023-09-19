import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    FlatList,
    DeviceEventEmitter,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    TouchableOpacity
} from "react-native";
import I18n from "react-native-i18n";
import moment from "moment";
import {Actions} from "react-native-router-flux";
import PropTypes from "prop-types";
import ReportCell from "./ReportCell";
import Navigation from "../element/Navigation";
import store from '../../mobx/Store';
import {getReportList} from "../common/FetchRequest";
import ScrollTop from "../element/ScrollTop";
import NetInfoIndicator from "../components/NetInfoIndicator";
import SearchBar from "react-native-elements/dist/searchbar/SearchBar";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import ViewIndicator from "../customization/ViewIndicator";
import BorderShadow from "../element/BorderShadow";
import StringFilter from "../common/StringFilter";
import PhoneInfo from "../entities/PhoneInfo";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
export default class ReportList extends Component {
    state = {
        showScrollTop: false,
        data: [],
        storeSelector: store.storeSelector,
        viewType:store.enumSelector.viewType.FAILURE,
        enumSelector:store.enumSelector,
        filterSelector: store.filterSelector,
        patrolSelector: store.patrolSelector,
        showFooter: 0, // 0: hidden, 1: no more data, 2: loading
        currentPage: 0,
        lastPage: true,
        onEndReached: false,
        isRefresh: false,
        onPull:false,
        enable:true,
        search: ''
    };

    static propTypes =  {
        storeId: PropTypes.string,
        filters: PropTypes.object
    };

    static defaultProps = {
        storeId: '',
        filters: null
    };

    componentDidMount(){
        let {enumSelector, patrolSelector, filterSelector} = this.state;
        filterSelector.report.beginTs = filterSelector.getBeginTs();
        filterSelector.report.endTs = filterSelector.getEndTs();
        filterSelector.report.modes = [];
        filterSelector.report.tableName = I18n.t('All');
        filterSelector.report.tableMode = -1;
        filterSelector.report.tableId = -1;
        filterSelector.report.keyword = false;
        filterSelector.report.order = 1;

        this.filters = this.props.filters;
        this.setState({filterSelector, viewType:enumSelector.viewType.LOADING},async () => {
            await this.fetchData(0, true);
        });

        this.emitter = DeviceEventEmitter.addListener('OnReport', () => {
            filterSelector.report.keyword = false;

            if (this.filters != null){
                this.filters.beginTs = filterSelector.report.beginTs;
                this.filters.endTs = filterSelector.report.endTs;
                this.filters.clause.mode = [];

                this.filters.inspectTagId = null;
                if (filterSelector.report.tableName !== I18n.t('All')) {
                    this.filters.inspectTagId = filterSelector.report.tableId;
                }

               if (filterSelector.report.modes.length === 1) {
                   this.filters.clause.mode = filterSelector.report.modes[0];
               }

                this.filters.order = {direction: (filterSelector.report.order === 1) ? 'desc' : 'asc', property:'ts'};
            }

            this.setState({data:[], search: '', filterSelector}, async () => {
                await this.fetchData(0,true);
            });
        });
    }

    componentWillUnmount(){
        let {filterSelector} = this.state;
        filterSelector.report = {
            beginTs: moment().subtract(90, 'days').startOf('day').unix()*1000,
            endTs: moment().endOf('day').unix()*1000,
            modes: [],
            tableName: I18n.t('All'),
            tableMode:-1,
            tableId:-1,
            order: 1
        };
        this.setState({filterSelector});
        this.emitter && this.emitter.remove();
    }

    formatBody(){
        let {filterSelector, search} = this.state;
        const {storeId} = this.props;

        let param = {
            beginTs: filterSelector.report.beginTs,
            endTs: filterSelector.report.endTs
        };

        let clause = {storeId: storeId};
        if (filterSelector.report.tableName !== I18n.t('All')){
            param.inspectTagId = filterSelector.report.tableId;
        }else{
            (filterSelector.report.modes.length === 1) ? clause.mode = filterSelector.report.modes[0] : null;
        }

        let like = {};
        if (filterSelector.report.keyword){
            like.storeName = search;
            like.submitterName = search;
            like.tagName = search;
        }

        param.clause = clause;
        param.like = like;
        param.order = {direction: (filterSelector.report.order === 1) ? 'desc' : 'asc', property:'ts'};

        return param;
    }

    formatFilters(){
        let {filterSelector, search} = this.state;

        let like = {};
        if (filterSelector.report.keyword){
            like.storeName = search;
            like.submitterName = search;
            like.tagName = search;
        }

        this.filters.like = like;
        if (this.filters.order == null) {
            this.filters.order = {direction: 'desc', property:'ts'};
        }

        return this.filters;
    }

    async fetchData(page,load){
        let {enumSelector, data} = this.state;

        load && this.setState({viewType:enumSelector.viewType.LOADING});

        let param = (this.filters != null) ? this.formatFilters() : this.formatBody();
        param.filter = {page: page};

        let result = await getReportList(param);
        if(result.errCode !== enumSelector.errorType.SUCCESS){
            this.setState({
                showFooter: 0,
                onEndReached: false,
                isLoading: false,
                onPull:false,
                viewType:enumSelector.viewType.FAILURE});
            return false;
        }

        this.setState({
            data: data.concat(result.data.content),
            lastPage: result.data.last,
            showFooter: 0,
            onEndReached: false,
            isLoading: false,
            onPull:false
        },()=>{
                if(this.state.data.length !== 0){
                    this.setState({viewType:enumSelector.viewType.SUCCESS});
                }else{
                    this.setState({viewType:enumSelector.viewType.EMPTY});
                }
        });
    }

    onRefresh(){
        try {
            this.setState({
                data: [],
                currentPage: 0,
                showFooter: 0,
                lastPage: false,
                onEndReached: false,
                onPull:true
            },async ()=>{
                await this.fetchData(0,true);
            });
        }catch (e) {
        }
    }

    onEndReached(){
        try {
            if(this.state.lastPage) {
                {
                    (this.state.data.length*80 >= (height-48)) ? this.setState({showFooter: 1})
                        : this.setState({showFooter: 0});
                    return;
                }
            }

            if(!this.state.onEndReached){
                let page = ++this.state.currentPage;
                this.setState({onEndReached: true,showFooter: 2,currentPage:page});
                this.fetchData(page,false);
            }
        }catch(e){
        }
    }

    renderFooter(){
        if (this.state.showFooter === 1) {
            return (
                <View style={{height:40,alignItems:'center',justifyContent:'center',flexDirection:'row'}}>
                    <View style={{width:50,height:1,backgroundColor:'#dcdcdc'}}></View>
                    <Text style={{color:'#989ba3',fontSize:10,marginLeft:10}}>
                        {I18n.t('No further')}
                    </Text>
                    <View style={{width:50,height:1,backgroundColor:'#dcdcdc',marginLeft:10}}></View>
                </View>
            );
        } else if(this.state.showFooter === 2) {
            return (
                <View style={styles.footer}>
                    <ActivityIndicator color={'#989ba3'}/>
                    <Text style={{fontSize:10,color:'#989ba3'}}>{I18n.t('Loading data')}</Text>
                </View>
            );
        } else if(this.state.showFooter === 0){
            return null;
        }
    }

    renderItem({item, index}){
        let {storeId} = this.props;
        let {data} = this.state;
        return (
            <ReportCell showMode={true} data={item} major={item} length={data.length} index={index} storeId={storeId}/>
        )
    }

    updateSearch = (text) => {
        this.setState({search: StringFilter.all(text.trim(),30)});
    };

    onClear(){
        let {filterSelector} = this.state;

        filterSelector.report.keyword = false;

        this.setState({filterSelector}, () => {
            this.onRefresh();
        });
    }

    onSearch(){
        let {filterSelector} = this.state;

        filterSelector.report.keyword = true;

        this.setState({filterSelector}, () => {
            this.onRefresh();
        });
    }

    renderOperator(){
        let {search} = this.state, searchWidth = width-80, marginLeft = 0;
        PhoneInfo.isJALanguage() && (searchWidth = searchWidth-20);
        PhoneInfo.isJALanguage() && (marginLeft = 10);
        let placeholderStyle = styles.input;
        (PhoneInfo.isIDLanguage()) && (placeholderStyle = {
            fontSize: searchWidth > 280 ? 9 : 8,
            paddingRight:0
        });
        (PhoneInfo.isVNLanguage()) && (placeholderStyle = {
            fontSize:searchWidth > 280 ? 10 : 9,
            paddingRight:2
        });

        return (<View style={styles.operator}>
            <BoxShadow setting={{width:searchWidth, height:38, color:"#000000",
                border:1, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:0}}}>
                <SearchBar placeholder={I18n.t('Reports placeholder')}
                           underlineColorAndroid={'#006AB7'}
                           containerStyle={[styles.searchBar,{width: searchWidth}]}
                           inputContainerStyle={[styles.inputView,{width: searchWidth-20}]}
                           inputStyle={search ? styles.input : placeholderStyle}
                           rightIconContainerStyle={{marginRight:-6}}
                           onChangeText={this.updateSearch}
                           value={search}
                           searchIcon={false}
                           returnKeyType={'search'}
                           onClear={() => this.onClear()}
                           onSubmitEditing={() => this.onSearch()}/>
            </BoxShadow>
            <TouchableOpacity activeOpacity={0.6} onPress={() => {Actions.push('reportFilter')}}>
                <Text style={[styles.filter,{marginLeft}]}>{I18n.t('Filter')}</Text>
            </TouchableOpacity>
        </View>)
    }

    render() {
        let {data,viewType,enumSelector, showScrollTop} = this.state;
        return (
            <View style={styles.container}>
                <Navigation
                    onLeftButtonPress={()=>{Actions.pop()}}
                    title={I18n.t('Report all')}
                />
                <NetInfoIndicator/>
                {this.renderOperator()}
                {
                    (viewType !== enumSelector.viewType.SUCCESS) && <ViewIndicator viewType={viewType} containerStyle={{marginTop:100}}
                                                                        prompt={I18n.t('Empty event')}
                                                                        refresh={()=> {(async ()=> this.onRefresh())()}}/>
                }

                {(viewType === enumSelector.viewType.SUCCESS) &&
                    <ScrollView showsVerticalScrollIndicator={false}
                                ref={c => this.scroll = c}
                                onScroll={event => {
                                    let showScrollTop = (event.nativeEvent.contentOffset.y > 200);
                                    this.setState({showScrollTop});
                                }}
                                refreshControl = {
                                    <RefreshControl
                                        refreshing={this.state.onPull}
                                        onRefresh = {() => this.onRefresh()}/>
                                }>
                        <View>
                        <FlatList style={[styles.listView,BorderShadow.div]}
                                  data={data}
                                  keyExtractor={(item, index) => index.toString()}
                                  renderItem={this.renderItem.bind(this)}
                                  showsVerticalScrollIndicator={false}
                                  onEndReached={() => this.onEndReached()}
                                  onEndReachedThreshold={0.1}
                                  onRefresh={() => this.onRefresh()}
                                  refreshing={this.state.isRefresh}
                                  ListFooterComponent={()=>this.renderFooter()}
                        />
                        </View>
                    </ScrollView>}
                <ScrollTop showOperator={showScrollTop} onScroll={() => {this.scroll && this.scroll.scrollTo({x:0,y:0,animated:true})}} />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:'#F7F9FA'
    },
    listView:{
        backgroundColor:'#fff',
        borderRadius:10,
        paddingBottom:12,
        paddingLeft:16,
        paddingRight: 16,
        marginLeft:10,
        marginRight:10,
        marginBottom: 20
    },
    footer:{
        flexDirection:'row',
        height:24,
        justifyContent:'center',
        alignItems:'center',
        marginBottom:10,
    },
    operator:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        marginTop:10,
        paddingLeft:10,
        paddingRight:20,
        marginBottom:10
    },
    searchBar:{
        height:38,
        marginRight:16,
        borderRadius:10,
        marginTop:0.5,
        backgroundColor:'#FFFFFF',
        borderTopColor:'#fff',
        borderBottomColor:'#fff',
        borderRightWidth:1,
        borderRightColor:'#fff',
        borderLeftWidth:1,
        borderLeftColor:'#fff',
        justifyContent:'center'
    },
    inputView:{
        height:36,
        backgroundColor:'#fff'
    },
    input:{
        fontSize:12,
        paddingRight:6
    },
    filter:{
        fontSize:17,
        color:'#006AB7'
    }
});
