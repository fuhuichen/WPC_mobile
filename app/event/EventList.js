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
    TouchableOpacity, Platform, TextInput
} from "react-native";
import I18n from "react-native-i18n";
import moment from "moment";
import {Actions} from "react-native-router-flux";
import dismissKeyboard from 'react-native-dismiss-keyboard';
import PropTypes from "prop-types";
import Navigation from "../element/Navigation";
import store from '../../mobx/Store';
import {addEventComment, getEventList, getStoreContent} from "../common/FetchRequest";
import ScrollTop from "../element/ScrollTop";
import NetInfoIndicator from "../components/NetInfoIndicator";
import SearchBar from "react-native-elements/dist/searchbar/SearchBar";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import ViewIndicator from "../customization/ViewIndicator";
import EventEditor from "./EventEditor";
import {Badge} from "react-native-elements";
import AccessHelper from "../common/AccessHelper";
import ModalCenter from "../components/ModalCenter";
import Spinner from "../element/Spinner";
import ProcessResult from "./ProcessResult";
import EventBus from "../common/EventBus";
import AndroidBacker from "../components/AndroidBacker";
import SlotView from "../customization/SlotView";
import * as lib from '../common/PositionLib';
import StringFilter from "../common/StringFilter";
import PhoneInfo from "../entities/PhoneInfo";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
export default class EventList extends Component {
    state = {
        showBottom: false,
        showScrollTop: false,
        contentOffset: 0,
        data: [],
        viewType:store.enumSelector.viewType.FAILURE,
        enumSelector:store.enumSelector,
        filterSelector: store.filterSelector,
        videoSelector: store.videoSelector,
        showFooter: 0, // 0: hidden, 1: no more data, 2: loading
        currentPage: 0,
        lastPage: true,
        onEndReached: false,
        isRefresh: false,
        onPull:false,
        search: '',
        spinner: false,
        actionType: store.enumSelector.actionType.ADD,
        actionResult: null,
        eventId: this.props.eventId ? this.props.eventId : []
    };

    static propTypes =  {
        storeId: PropTypes.object,
        eventId: PropTypes.object,
        status: PropTypes.array,
        reportId: PropTypes.array,
        filters: PropTypes.object
    };

    static defaultProps = {
        storeId: [],
        status: [0,1,2,3],
        source: [],
        filters: null,
        reportId: null
    };

    componentDidMount(){
        let {filterSelector} = this.state;
        filterSelector.event.beginTs = filterSelector.getBeginTs();
        filterSelector.event.endTs = filterSelector.getEndTs();
        filterSelector.event.storeId = this.props.storeId;
        filterSelector.event.status = this.props.status;
        filterSelector.event.source = this.props.source;
        filterSelector.event.order = 1;
        filterSelector.event.keyword = false;
        filterSelector.event.selectInspects = [];
        filterSelector.event.selectInspectsName = '';

        this.filters = this.props.filters;

        this.setState({filterSelector}, async () => {
            await this.fetchData(0,true);
        });

        this.emitter = DeviceEventEmitter.addListener('OnReport', () => {
            filterSelector.event.keyword = false;

            if (this.filters != null){
                this.filters.beginTs = filterSelector.event.beginTs;
                this.filters.endTs = filterSelector.event.endTs;
                this.filters.clause.status = filterSelector.event.status;
                this.filters.order = {direction: (filterSelector.event.order === 1) ? 'desc' : 'asc', property:'ts'};
            }

            this.setState({data:[], search: '', filterSelector, eventId: []}, async () => {
                await this.fetchData(0,true);
            });
        });
    }

    componentWillUnmount(){
        this.emitter && this.emitter.remove();
    }

    async fetchData(page,load){
        let {enumSelector, filterSelector, viewType, search, videoSelector} = this.state, lastPage = true;
        let data = load ? [] : this.state.data;
        load && this.setState({data:[], viewType:enumSelector.viewType.LOADING, contentOffset: 0,currentPage:page});

        let body = (this.filters != null) ? this.formatFilters() : this.formatBody();
        body.filter = {page: page, size:20};
        body.inspectTagIds = filterSelector.event.selectInspects;

        viewType = enumSelector.viewType.FAILURE;
        let result = await getEventList(body);
        if (result.errCode === enumSelector.errorType.SUCCESS){
            result.data.content.forEach((item) => {
                item.subjectUnfold = false;
                item.isMark = data.every(p => (p.isMark === true));
                item.comment = item.comment.map(v => Object.assign({...v, attachUnfold: false}))
            });

            data = data.concat(result.data.content);

            viewType = (result.data.content.length > 0) ? enumSelector.viewType.SUCCESS
                : enumSelector.viewType.EMPTY;
            lastPage = result.data.last;
        }

        // store list
        if (load && (viewType === enumSelector.viewType.SUCCESS)){
            let body = {clause: {storeId: filterSelector.event.storeId}};
            (this.filters != null) && (body.clause.storeId = this.filters.clause.storeId);
            result = await getStoreContent(body);

            videoSelector.storeId = (body.clause.storeId instanceof Array) ? body.clause.storeId[0]
                : body.clause.storeId;
            videoSelector.content = [];
            if (result.errCode === enumSelector.errorType.SUCCESS){
                videoSelector.content = result.data.content;
            }
        }

        viewType = load ? viewType : this.state.viewType;

        this.setState({
            viewType,
            data,
            lastPage,
            onEndReached: false,
            onPull: false,
            showFooter: 0,
            videoSelector
        });
    }

    formatBody(){
        let {filterSelector, eventId, search} = this.state;
        let {reportId} = this.props;

        let status = JSON.parse(JSON.stringify(filterSelector.event.status));
        (status.findIndex(p => p === 2) !== -1) ? status.push(4) : null;

        let params = {
            beginTs: filterSelector.event.beginTs,
            endTs: filterSelector.event.endTs,
            clause: {
                storeId: filterSelector.event.storeId,
                id: eventId,
                status: status,
                sourceType: filterSelector.event.source
            },
            filter: {},
            like:{},
            order: {direction: (filterSelector.event.order === 1) ? 'desc' : 'asc', property:'ts'}
        };

        (reportId != null) && (params.clause.reportId = reportId);

        if (filterSelector.event.keyword){
            params.like.subject = search;
            params.like.assignerName = search;
        }

        return params;
    }

    formatFilters(){
        let {filterSelector, search} = this.state;

        let status = this.filters.clause.status;
        if (status != null){
            if ((status.findIndex(p => p === 2) !== -1) && (status.findIndex(p => p === 4) === -1)) {
                this.filters.clause.status.push(4);
            }
        }

        let like = {};
        if (filterSelector.event.keyword){
            like.subject = search;
            like.assignerName = search;
        }

        this.filters.clause.sourceType = filterSelector.event.source;

        this.filters.like = like;
        if (this.filters.order == null) {
            this.filters.order = {direction: 'desc', property:'ts'};
        }

        return this.filters;
    }

    onRefresh(){
        let {showBottom} = this.state;
        try {
            !showBottom ? this.setState({
                data: [],
                currentPage: 0,
                showFooter: 0,
                lastPage: false,
                onEndReached: false,
                onPull:true
            },async ()=>{
                await this.fetchData(0,true);
            }) : null;
        }catch (e) {
        }
    }

    onEndReached(){
        try {
            if(this.state.lastPage) {
                {
                    (this.state.contentOffset  >= (height-Platform.select({android:56, ios:78})))
                        ? this.setState({showFooter: 1}) : this.setState({showFooter: 0});
                    return;
                }
            }

            if(!this.state.onEndReached){
                let page = ++this.state.currentPage;
                //console.log("Change page="+page)
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
                <SlotView containerStyle={{height: showBottom ? 100 : 65}}/>
            </View>
        )
    }

    renderItem({item, index}){
        let {showBottom, data} = this.state;
        return (
            <View>
                <EventEditor data={item} showMark={showBottom}
                             measureWidth={width-96} onData={(response) => {
                    data[index] = response;
                    this.setState({data});
                }} onRefresh={(actionType) => {
                    this.setState({actionType, actionResult:true});
                }}/>
            </View>
        )
    }

    updateSearch = (text) => {
        this.setState({search: StringFilter.all(text.trim(),30)});
    };

    onSearch(){
        let {filterSelector} = this.state;
        filterSelector.event.keyword = true;
        this.setState({data:[], filterSelector, eventId: []}, async () => {
            await this.fetchData(0, true);
        });
    }

    onSelect(){
        let {data} = this.state;
        let filters = data.filter(p => p.isMark);

        data.forEach(p => p.isMark = (filters.length !== data.length));
        this.setState({data});
    }

    onClose(){
        this.modal && this.modal.open();
    }

    renderBottom(){
        let {showBottom,data} = this.state;
        let filters = data.filter(p => p.isMark);
        let title = (filters.length !== data.length) ? I18n.t('All select') : I18n.t('None select');

        return (
            showBottom ? <View style={styles.bottomPanel}>
                <TouchableOpacity activeOpacity={0.5} onPress={() => this.onSelect()}>
                    <Badge value={title} badgeStyle={styles.badgeStyle} textStyle={styles.textStyle}/>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.5} onPress={() => {
                    (filters.length > 0) ? this.onClose() : {}
                }}>
                    <Badge value={I18n.t('Closing')} badgeStyle={styles.badgeStyle}
                           textStyle={[styles.textStyle, (filters.length === 0) && {color: '#C2C6CC'}]}/>
                </TouchableOpacity>
            </View> : null
        )
    }

    renderOperator(){
        let {search, showBottom} = this.state, searchWidth = width-80, marginLeft = 0;

        PhoneInfo.isJALanguage() && (searchWidth = searchWidth-20);
        PhoneInfo.isJALanguage() && (marginLeft = 10);

        let placeholderStyle = styles.input;
        (PhoneInfo.isIDLanguage()) && (placeholderStyle = {
            fontSize: 11,
            paddingRight: 2
        });

        let opacity = showBottom ? 0.3 : 1;
        let activeOpacity = showBottom ? 1 : 0.6;
        let color = showBottom ? '#C2C6CC' : '#006AB7';

        return (<View style={styles.operator}>
            <BoxShadow setting={{width:searchWidth, height:38, color:"#000000",
                border:1, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:0}}}>
                <SearchBar placeholder={I18n.t('Events placeholder')}
                           underlineColorAndroid={'#006AB7'}
                           containerStyle={[styles.searchBar,{width:searchWidth}]}
                           inputContainerStyle={[styles.inputView,{opacity, width:searchWidth-20}]}
                           inputStyle={search ? styles.input : placeholderStyle}
                           rightIconContainerStyle={{marginRight:-6}}
                           editable={!showBottom}
                           onChangeText={this.updateSearch}
                           value={search}
                           searchIcon={false}
                           returnKeyType={'search'}
                           onClear={() => this.onSearch()}
                           onSubmitEditing={() => this.onSearch()}/>
            </BoxShadow>
            <TouchableOpacity activeOpacity={activeOpacity} onPress={() => {!showBottom ? Actions.push('eventFilter') : {}}}>
                <Text style={[styles.filter, {color, marginLeft}]}>{I18n.t('Filter')}</Text>
            </TouchableOpacity>
        </View>)
    }

    getTitle(){
        let {data, showBottom} = this.state;
        let filters = data.filter(p => p.isMark);
        return !showBottom ? I18n.t('Event header') : I18n.t('Select count', {key: filters.length});
    }

    getRightTitle(){
        let {data, showBottom} = this.state;
        let title = !showBottom ? I18n.t('Head select') : '';
        let filters = data.filter(p => (p.status === 0) || (p.status === 1) || (p.status === 3));

        return (AccessHelper.enableEventClose() && filters.length > 0) ? title : '';
    }

    onClick(){
        dismissKeyboard();
        let {data} = this.state;
        data.forEach(p => p.isMark = false);
        this.setState({showBottom: true, data});
    }

    onBack(){
        let {showBottom, data} = this.state;
        if (showBottom){
            data.forEach(p => p.isMark = false);
            this.setState({showBottom: false, data});
        }else {
            EventBus.refreshEventInfo();
            EventBus.refreshAnalysisInfo();

            Actions.pop();
        }
    }

    async onAll(){
        let {data, enumSelector} = this.state;
        this.setState({spinner: true});

        let eventIds = data.filter(p => p.isMark && (p.status !== 2) && (p.status !== 4)).map(v => v.id);

        let result = await addEventComment({
            eventIds: eventIds,
            comment: {
                ts: moment().unix()*1000,
                attachment:[],
                status: enumSelector.actionType.CLOSE
            }
        });

        let success = (result.errCode === enumSelector.errorType.SUCCESS);

        this.setState({
            spinner: false,
            actionType: enumSelector.actionType.CLOSE,
            actionResult: success,
            showBottom: !success
        }, () => {
            success && this.onRefresh();
        });
    }

    render() {
        let {data,viewType,enumSelector, showScrollTop, spinner, actionType, actionResult,
            isRefresh, showBottom} = this.state;
        return (
            <View style={styles.container}>
                <Navigation
                    onLeftButtonPress={() => this.onBack()}
                    title={this.getTitle()}
                    rightButtonTitle={this.getRightTitle()}
                    onRightButtonPress={() => this.onClick()}
                />
                <NetInfoIndicator/>
                {this.renderOperator()}
                {
                    (viewType !== enumSelector.viewType.SUCCESS) &&
                        <ViewIndicator viewType={viewType} containerStyle={{marginTop:100}}
                                       prompt={I18n.t('Empty event')}
                                       refresh={()=> {(async ()=> this.onRefresh())()}}/>
                }


                {(viewType === enumSelector.viewType.SUCCESS) &&
                    <FlatList ref={c => this.scroll = c}
                              style={styles.listView}
                              onScroll={event => {
                                  let showScrollTop = (event.nativeEvent.contentOffset.y > 200);
                                  this.setState({showScrollTop, contentOffset: event.nativeEvent.contentOffset.y});
                              }}
                              data={data}
                              keyExtractor={(item, index) => index.toString()}
                              renderItem={this.renderItem.bind(this)}
                              showsVerticalScrollIndicator={false}
                              refreshing={isRefresh}
                              onRefresh={() => this.onRefresh()}
                              onEndReached={() => this.onEndReached()}
                              onEndReachedThreshold={0.1}
                              keyboardShouldPersistTaps={'handled'}
                              ListFooterComponent={()=>this.renderFooter()}
                    />}
                {this.renderBottom()}
                <ScrollTop showOperator={!showBottom && showScrollTop} onScroll={() => {
                    this.scroll && this.scroll.scrollToOffset({animated:true, viewPosition:0, index:0});
                }}/>
                <ModalCenter ref={c => this.modal = c} title={I18n.t('Closing')} description={I18n.t('Close description')}
                    confirm={async () => await this.onAll()}/>
                <ProcessResult actionType={actionType} actionResult={actionResult} reset={() => this.setState({actionResult: null})}/>
                <Spinner visible={spinner} textContent={I18n.t('Loading')} textStyle={{color:'#ffffff',fontSize:14,marginTop:-50}}/>
                <AndroidBacker onPress={() => {
                    this.onBack();
                    return true;
                }} />
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
        paddingBottom:12,
        paddingLeft:10,
        paddingRight: 10
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
        justifyContent:'center',
    },
    inputView:{
        height:36,
        backgroundColor:'#fff',
    },
    input:{
        fontSize:12,
        paddingRight:6
    },
    filter:{
        fontSize:17,
        color:'#006AB7'
    },
    bottomPanel:{
        position:'absolute',
        left:0,
        bottom:0,
        height:83,
        width:width,
        paddingLeft:10,
        paddingRight:10,
        flexDirection:'row',
        justifyContent:'space-between',
        backgroundColor:'#fff',
        borderTopColor: '#F2F2F2',
        borderTopWidth:2
    },
    badgeStyle:{
        padding:6,
        marginTop:24,
        backgroundColor:'transparent',
        height:30
    },
    textStyle:{
        color:'#006AB7',
        fontSize:17
    }
});
