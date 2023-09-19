import React,{Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    Dimensions,
    Platform,
    TouchableWithoutFeedback,
    FlatList,
    ActivityIndicator,
    DeviceEventEmitter
} from "react-native";
import RNStatusBar from "../components/RNStatusBar";
import I18n from "react-native-i18n";
import {Actions} from "react-native-router-flux";
import NetInfoIndicator from "../components/NetInfoIndicator";
import moment from 'moment';
import HttpUtil from "../utils/HttpUtil";
import LineBlock from "../components/LineBlock";
import GroupInfo from "./GroupInfo";
import RouteMgr from "../notification/RouteMgr";
import PicBase64Util from "../utils/PicBase64Util";
import * as lib from "../common/PositionLib";
import GlobalParam from "../common/GlobalParam";
import ModalCenter from "../components/ModalCenter";
import {ASYNC_STORE_CUSTOMER, EMITTER_INDEX_VISITOR} from "../common/Constant";
import store from "../../data/src/stores/Index";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
export default class CustomerList extends Component{
    constructor(props){
        super(props);

        this.state = {
            mode: true, //true: registered; false: unregistered
            isLoading: false,
            showFooter: 0,
            currentPage: 0,
            lastPage: true,
            onEndReached: false,
            isRefresh: false,
            onPull: false,
            searchType: 0,
            storeId: this.props.storeId,
            storeName: '',
            registerIndex: -1,
            data: [],
            registered:{
                filter: false,
                queryType:0,
                timeCycle: 1,
                queryTimes: 0,
                beginTs: null,
                endTs: null
            },
            unregistered:{
                filter: false,
                queryType:0,
                timeCycle: 1,
                queryTimes: 0,
                beginTs: null,
                endTs: null
            }
        };

        this.switch = true;
    }

    async componentDidMount() {
        let defaultStore = await GlobalParam.getDefaultStore();
        !RouteMgr.getActive() && (await this.setState({
            storeId:defaultStore.id,storeName:defaultStore.name}));
        store.visitSelector.setStoreId(defaultStore.id);

        this.resetTimeRanges();
        this.fetchData(this.state.currentPage);

        this.refreshEmitter = DeviceEventEmitter.addListener('onRefreshCustomer',
            (data) => {
                (async ()=>{
                    await this.notifications(data);
                })();
            });
        this.cycleEmitter = DeviceEventEmitter.addListener('onCycleCustomer',
            (params) => {
                params.mode ? this.setState({registered:params.data,data:[]},
                    ()=>{
                       this.refreshData();
                    }) : this.setState({unregistered:params.data,data:[]},
                    ()=>{
                        this.refreshData();
                    });
            });
    }

    async notifications(data){
        this.setState({
                data: [],
                storeId: data != null ? data.storeId : this.state.storeId,
                storeName: (data != null && data.storeName != null) ? data.storeName : this.state.storeName,
                mode: data != null ? true : this.state.mode
            },
            () => {
                (async ()=>{
                    await GlobalParam.setAsyncStore(ASYNC_STORE_CUSTOMER, this.state.storeId);
                })();
                this.refreshData();
                store.visitSelector.setStoreId(this.state.storeId);
            })
    }

    async componentWillUnmount(){
        //await RouteMgr.deleteCustomerStore();
        this.refreshEmitter && this.refreshEmitter.remove();
        this.cycleEmitter && this.cycleEmitter.remove();
    }

    refreshData(){
        this.resetTimeRanges();
        this.fetchData(0);
    }

    resetTimeRanges(){
        let reference = this.state.mode ? this.state.registered : this.state.unregistered;
        if(reference.filter){
            this.beginTs = reference.beginTs;
            this.endTs = reference.endTs;
            return;
        }

        this.beginTs = this.state.mode ? moment().startOf('day')
            .subtract(29,'days').unix()*1000 : moment().startOf('day')
            .subtract(30,'days').unix()*1000;
        this.endTs =  this.state.mode ? moment().endOf('day').unix()*1000
            : moment().endOf('day').subtract(1,'days').unix()*1000;

        reference.beginTs = this.beginTs;
        reference.endTs = this.endTs;
        this.state.mode ? this.setState({registered: reference})
            : this.setState({unregistered: reference});

        store.visitSelector.setBeginTs(reference.beginTs);
        store.visitSelector.setEndTs(reference.endTs);
    }

    fetchData(page) {
        try {
            let reference = this.state.mode ? this.state.registered : this.state.unregistered;
            this.switch = false;

            let body = {};
            body.beginTs = this.beginTs;
            body.endTs = this.endTs;
            body.storeId = this.state.storeId;
            body.category = this.state.mode ? 0 : 1;
            body.period = reference.queryType;
            body.filter = {page:page,size:100};

            this.setState({
                isLoading: page == 0 ? true : false,
                showLabel: page == 0 ? 0 : this.state.showLabel
            });

            HttpUtil.post('customer/summary/list',body)
                .then(result => {
                    let data = this.state.data;
                    this.setState({
                        data: data.concat(result.data.content),
                        lastPage: result.data.last,
                        showFooter: 0,
                        onEndReached: false,
                        isLoading: false,
                        onPull:false
                    },()=>{
                        this.switch = true;
                    });
                })
                .catch(error=>{
                    this.setState({
                        showFooter: 0,
                        onEndReached: false,
                        isLoading: false,
                        onPull:false
                    },()=>{
                        this.switch = true;
                    });
                });
        }catch (e) {
            this.switch = true;
        }
    }

    registeredCustomer(){
        !this.state.mode && !this.state.isLoading && this.switch &&
        this.setState({data:[],mode:true},
            ()=>{
            this.resetTimeRanges();
            this.fetchData(0);
            store.visitSelector.setMode(true);
        });
    }

    unregisteredCustomer(){
        this.state.mode && !this.state.isLoading && this.switch &&
        this.setState({data:[],mode:false},
            ()=>{
            this.resetTimeRanges();
            this.fetchData(0);
            store.visitSelector.setMode(false);
        });
    }

    onItemPress(item){
        Actions.push('customerDetail',{
            data:item,
            beginTs: this.beginTs,
            endTs: this.endTs,
            registered:this.state.mode,
            storeId:this.state.storeId
        })
    }

    switchStore(){
        this.refs.switch && this.refs.switch.open();
    }

    switchConfirm(){
        Actions.push('storeCenter',{
            data:{emitter:EMITTER_INDEX_VISITOR}});
    }

    renderLoadingView() {
        return (
            <View style={{flex:1, justifyContent:'center',marginTop:-40-34}}>
                <ActivityIndicator
                    animating={true}
                    color='#dcdcdc'
                    size="large"
                />
                <Text style={{textAlign:'center'}}>{I18n.t('Loading')}</Text>
            </View>
        );
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
            },()=>{
                this.fetchData(0);
            });
        }catch (e) {
        }
    }

    onEndReached(){
        try {
            let itemHeight = this.state.mode ? 110 : 80;
            if(this.state.lastPage) {
                {
                    (this.state.data.length*itemHeight >= height-48-80) ?
                        this.setState({showFooter: 1}) : null;
                    return;
                }
            }

            if(!this.state.onEndReached){
                let page = ++this.state.currentPage;
                this.setState({onEndReached: true,showFooter: 2,currentPage:page});
                this.fetchData(page);
            }
        }catch(e){
        }
    }

    onMenu(){
        this.props.onMenu(true);
    }

    renderItem(item,index) {
        let registeredCustomer = null;
        if(this.state.mode){
            registeredCustomer = <View style={{marginTop:0,marginLeft:10}}>
                {
                    item.lastVisitingTime != null ? <Text style={{fontSize:14,color:'#19293d'}}>
                            {I18n.t('Last visiting time')}  {moment(item.lastVisitingTime).format('YYYY/MM/DD HH:mm:ss')}
                        </Text> : <Text style={{fontSize:14,color:'#19293d'}}>
                        {I18n.t('Last visiting time')}  --
                    </Text>
                }
                <View style={{flexDirection:'row',alignItems:'flex-start'}}>
                    <View style={{width:50,height:15,marginTop:7,borderRadius:4,backgroundColor:GroupInfo.get(item.group).color}}>
                        <Text style={{fontSize:10,color:'#ffffff',height:15,lineHeight:15,
                            textAlign:'center',textAlignVertical:'center'}}>
                            {GroupInfo.get(item.group).name}
                        </Text>
                    </View>
                    {
                        item.numOfVisitingStore != null ? <Text style={{fontSize:10,color:'#989ba3',marginLeft:10,marginTop:8}}>
                            {I18n.t('Visiting store')}  {item.numOfVisitingStore}{I18n.t('Times')}
                        </Text> : <Text style={{fontSize:10,color:'#989ba3',marginLeft:10,marginTop:8}}>
                            {I18n.t('Visiting store')}  --
                        </Text>
                    }

                    <Text style={{fontSize:10,color:'#989ba3',marginLeft:10,marginTop:8}}>|</Text>
                    {
                        item.numOfTotalVisiting ? <Text style={{fontSize:10,color:'#989ba3',marginLeft:10,marginTop:8}}>
                            {I18n.t('Visiting brand')}  {item.numOfTotalVisiting}{I18n.t('Times')}
                        </Text> :  <Text style={{fontSize:10,color:'#989ba3',marginLeft:10,marginTop:8}}>
                            {I18n.t('Visiting brand')}  --
                        </Text>
                    }

                </View>
            </View>
        }

        let unregisteredCustomer = null;
        if(!this.state.mode){
            unregisteredCustomer = <View style={{marginTop:0,marginLeft:10}}>
                {
                    item.numOfVisitingStore != null ?  <Text style={{fontSize:14,color:'#19293d'}}>
                        {I18n.t('Visiting store')}  {item.numOfVisitingStore}{I18n.t('Times')}
                    </Text> : <Text style={{fontSize:14,color:'#19293d'}}>
                        {I18n.t('Visiting store')}  --
                    </Text>
                }

                {
                    item.lastVisitingTime != null ?  <Text style={{fontSize:10,color:'#989ba3',marginTop:10}}>
                        {I18n.t('Last visiting time')}  {moment(item.lastVisitingTime).format('YYYY/MM/DD HH:mm:ss')}
                    </Text> : <Text style={{fontSize:10,color:'#989ba3',marginTop:10}}>
                        {I18n.t('Last visiting time')}  --
                    </Text>
                }
            </View>
        }

        let customerLabel = null;
        if(this.state.mode){
            customerLabel = <View style={{flexDirection:'row',height:44,paddingLeft:16,paddingRight:16}}>
                <View style={{height:44,width:54,paddingRight:10,alignItems:'flex-end',marginTop:3}}>
                    <Text style={{height:44,fontSize:10,color:'#989ba3',lineHeight:44,textAlignVertical:'center'}}>
                        {I18n.t('Label')}
                    </Text>
                </View>
                <View style={{alignItems:'center',height:44,justifyContent:'center',marginTop:3}}>
                    <LineBlock  tags={item.tags} customerId={item.customerId} width={width-76}
                                onTipChange={(tags) =>{
                                    let data = this.state.data;
                                    data[index].tags = tags;
                                    this.setState({data:data})
                                }}/>
                </View>
            </View>
        }

        return (
                <View style={{paddingTop:12,borderBottomWidth:1,borderBottomColor: '#f5f5f5',
                    paddingBottom: this.state.mode ? 0 : 12}}>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.onItemPress.bind(this,item)}>
                        <View style={{flexDirection:'row',alignItems:'center',paddingLeft:16,paddingRight:16}}>
                            <Image style={{width:54,height:54,borderRadius:2,backgroundColor:'#000000'}}
                                   source={PicBase64Util.getJPGSource(item.image)}
                                   resizeMode='contain'/>
                            {registeredCustomer}
                            {unregisteredCustomer}
                        </View>
                    </TouchableOpacity>
                    {customerLabel}
                </View>
        )
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

    render(){
        let currentTs = moment().endOf('days').unix()*1000;
        let reference = this.state.mode ? this.state.registered : this.state.unregistered;
        let headerLeft = (reference.queryType == 0) ? I18n.t('Specific customers') : I18n.t('All customers');
        let headerRight = (reference.queryType == 1) ? I18n.t('Visit history')
            : (reference.endTs == currentTs) ? I18n.t('Visit today') : I18n.t('Visit day');

        return (
            <View style={styles.container}>
                <View style={styles.navBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={()=>{this.onMenu()}}>
                        <Image source={require('../assets/images/img_navbar_switch.png')} style={{width:48,height:48}}/>
                    </TouchableOpacity>
                    <View style={{width:32}}/>
                    <View style={{width:width-146-32,height:48,flexDirection:'row',justifyContent:'center'}}>
                        <Text style={styles.navBarText}>{I18n.t('Customer')}</Text>
                        <TouchableOpacity activeOpacity={0.5} onPress={this.switchStore.bind(this)}>
                            <Image style={{width:26,height:26,marginLeft:6,marginTop:10}}
                                   source={require('../assets/images/img_check_pulldown.png')}/>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity activeOpacity={0.5} onPress={()=>Actions.push('visitor')}>
                        <Image source={require('../assets/images/img_customer_add.png')} style={{width:48,height:48}}/>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.5} onPress={()=>{Actions.push('timeCycle',{mode:this.state.mode,
                        data: this.state.mode ? this.state.registered : this.state.unregistered})}}>
                        <View style={{width:50,height:48,alignItems:'flex-end'}}>
                            <Text style={{fontSize:14,color:'#ffffff',marginRight:10,textAlignVertical:'center',height:48,
                                ...Platform.select({ios:{lineHeight:48}})}}>{I18n.t('Filter')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <Text style={styles.storeName}>{this.state.storeName}</Text>

                <NetInfoIndicator/>

                <View style={styles.tabPanel}>
                    <TouchableWithoutFeedback onPress={()=>{this.registeredCustomer()}}>
                        <View style={this.state.mode ? styles.tabSelected : styles.tabUnselected}>
                            <Text style={[styles.tabContent,{color:this.state.mode ? '#f31d65' : '#989ba3'}]}>
                                {I18n.t('Registered')}
                            </Text>
                        </View>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPress={()=>{this.unregisteredCustomer()}}>
                        <View style={this.state.mode ? styles.tabUnselected : styles.tabSelected}>
                            <Text style={[styles.tabContent,{color: !this.state.mode ? '#f31d65' : '#989ba3'}]}>
                                {I18n.t('Unregistered')}
                            </Text>
                        </View>
                    </TouchableWithoutFeedback>
                </View>

                <View style={styles.filterPanel}>
                    <Text style={styles.filterContent}>{headerLeft}</Text>
                    <View style={{flex:1}}/>
                    <Text style={{textAlignVertical:'center',lineHeight:34,fontSize:12,
                        color:'#19293d',marginRight:10}}>
                        {headerRight}
                    </Text>
                    <Image source={require('../assets/images/img_customer_time.png')}
                           style={{height:16,width:16,marginTop:9}}/>
                </View>

                {
                    this.state.isLoading ? this.renderLoadingView() : null
                }

                {
                    this.state.isLoading ? null : <FlatList
                        data={this.state.data}
                        keyExtractor={(item, index) => index.toString()}
                        extraData={this.state}
                        renderItem={({item,index}) => this.renderItem(item,index)}
                        onEndReached={() => this.onEndReached()}
                        onEndReachedThreshold={0.1}
                        onRefresh={() => this.onRefresh()}
                        refreshing={this.state.isRefresh}
                        showsVerticalScrollIndicator={false}
                        ListFooterComponent={()=>this.renderFooter()}
                        ListEmptyComponent={() => <View
                            style={{
                                width: '100%',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                            {
                                this.state.onPull ? null : <View>
                                    <View style={styles.imagePanel}>
                                        <Image style={styles.imageIcon}
                                               source={require('../assets/images/img_inspect_report.png')}/>
                                    </View>
                                    <Text style={styles.imageTip}>{I18n.t('No data')}</Text>
                                </View>
                            }
                        </View>}
                    />
                }
                <ModalCenter ref={"switch"} title={I18n.t('Switch store')} confirm={()=>this.switchConfirm()}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    navBarPanel:{
        flexDirection: 'row',
        height: 48,
        backgroundColor: '#24293d',
        alignItems: 'center'
    },
    navBarText: {
        fontSize:18,
        height: 48,
        color:'#ffffff',
        textAlign: 'center',
        textAlignVertical: 'center',
        marginLeft: 50,
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    },
    tabPanel: {
        flexDirection: 'row',
        height: 40,
        marginLeft:16,
        marginRight: 16
    },
    tabContent: {
        height:40,
        fontSize:14,
        textAlign: 'center',
        textAlignVertical: 'center',
        ...Platform.select({
            ios:{
                lineHeight: 40
            }
        })
    },
    tabSelected: {
        flex:1,
        alignItems:'center',
        borderBottomWidth:2,
        borderBottomColor:'#f31d65'
    },
    tabUnselected: {
        flex:1,
        alignItems:'center'
    },
    filterPanel:{
        width:width,
        height:34,
        backgroundColor:'#f7f8fc',
        flexDirection:'row',
        justifyContent: 'space-between',
        paddingLeft:16,
        paddingRight:16
    },
    filterContent:{
        fontSize:12,
        color:'#989ba3',
        height:34,
        lineHeight:34,
        textAlign:'center',
        textAlignVertical:'center'
    },
    imagePanel:{
        height: 140,
        backgroundColor: '#ffffff',
        alignItems: 'center'
    },
    imageIcon: {
        width: 100,
        height: 100,
        marginTop: 40
    },
    imageTip: {
        fontSize: 18,
        color: '#d5dbe4',
        textAlign: 'center'
    },
    viewFilter:{
        borderRadius:2,
        height:34,
        width:100
    },
    timeFilter:{
        textAlign:'center',
        textAlignVertical:'center',
        height:34,
        lineHeight:34,
        fontSize:12
    },
    footer:{
        flexDirection:'row',
        height:24,
        justifyContent:'center',
        alignItems:'center',
        marginBottom:10,
        marginTop:10
    },
    storeName:{
        position:'absolute',
        top:32+lib.statusBarHeight(),
        color:'#ffffff',
        fontSize:11,
        width:width,
        textAlign:'center'
    }
});
