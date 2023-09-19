import React, {Component} from 'react';
import {
    ActivityIndicator, DeviceEventEmitter,
    Dimensions,
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {Actions} from "react-native-router-flux";
import RNStatusBar from '../components/RNStatusBar';
import HttpUtil from "../utils/HttpUtil";
import TimeUtil from "../utils/TimeUtil";
import I18n from 'react-native-i18n';
import PhoneInfo from "../entities/PhoneInfo";
import NetInfoIndicator from "../components/NetInfoIndicator";
import {EMITTER_REFRESH_REPORT} from "../common/Constant";
import RouteMgr from "../notification/RouteMgr";
import moment from "moment";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class InspectList extends Component {
    constructor(props){
        super(props);

        this.images = {
            EN: {
                supervised : require('../assets/images/img_inspect_supervised_en.png'),
                improved: require('../assets/images/img_inspect_improved_en.png'),
                good: require('../assets/images/img_inspect_good_en.png')
            },
            CN: {
                supervised : require('../assets/images/img_inspect_supervised.png'),
                improved: require('../assets/images/img_inspect_improved.png'),
                good: require('../assets/images/img_inspect_good.png')
            },
            TW: {
                supervised : require('../assets/images/img_inspect_supervised_tw.png'),
                improved: require('../assets/images/img_inspect_improved.png'),
                good: require('../assets/images/img_inspect_good.png')
            }
        };

        this.default = PhoneInfo.isEnLanguage() ? this.images.EN :
            PhoneInfo.isTwLanguage() ? this.images.TW : this.images.CN;
        this.store = [];

        this.state = {
            isLoading: false,
            data: [],
            showFooter: 0, // 0: hidden, 1: no more data, 2: loading
            maxCount: 5,
            currentPage: 0,
            lastPage: false,
            onEndReached: false,
            isRefresh: false,
            onPull:false,
            filter:{
                beginTs: moment().subtract(30, 'days').startOf('day').unix()*1000,
                endTs: moment().endOf('day').unix()*1000,
                orderType: 0,
                modeType: [],
                statusType: [],
                storeId:[]
            }
        }
        this.filter = [
            {
                "category_name": I18n.t('Sort type'),
                "items": [
                    {
                        "label_name": I18n.t('Order by time'),
                        "label_id": 0,
                        "selected": true
                    },
                    {
                        "label_name": I18n.t('Order by status'),
                        "label_id": 1,
                        "selected": false
                    },
                ],
                "category_id": 1,
                "support_muti_choice": 0
            },
            {
                "category_name": I18n.t('Mode type'),
                "items": [
                    {
                        "label_name": I18n.t('Remote patrol'),
                        "label_id": 0,
                        "selected": false
                    },
                    {
                        "label_name": I18n.t('Onsite patrol'),
                        "label_id": 1,
                        "selected": false
                    }
                ],
                "category_id": 2,
                "support_muti_choice": 1
            },
            {
                "category_name": I18n.t('Status type'),
                "items": [
                    {
                        "label_name": I18n.t('Dangerous'),
                        "label_id": 0,
                        "selected": false
                    },
                    {
                        "label_name": I18n.t('Improve'),
                        "label_id": 1,
                        "selected": false
                    },
                    {
                        "label_name": I18n.t('Good'),
                        "label_id": 2,
                        "selected": false
                    }
                ],
                "category_id": 3,
                "support_muti_choice": 1
            }
        ],
        this.lastStore = null,
        this.firstSearch = true
    }

    async componentDidMount(){
        this.setState({isLoading: true});
        this.fetchData(this.state.currentPage);
    }

    componentWillMount() {
        this.refreshEmitter = DeviceEventEmitter.addListener("OnSeachFilter",
            (data)=>{
                this.firstSearch = false;
                let filter = this.state.filter;
                filter.beginTs = data.beginTs;
                filter.endTs = data.endTs;
                filter.storeId = data.storeId;
                filter.orderType = 0;
                filter.modeType = [];
                filter.statusType = [];
                this.lastStore = data.lastStore;
                this.filter = data.filter;

                data.filter.forEach((item,index)=>{
                    if(item.category_id == 1){
                        item.items.forEach((itemChild,indexChild)=>{
                                if (itemChild.selected == true){
                                    if (itemChild.label_id == 1){
                                        filter.orderType = 1;
                                    }
                                }
                            }
                        )
                    }
                    else if (item.category_id == 2){
                        item.items.forEach((itemChild,indexChild)=>{
                                if (itemChild.selected == true){
                                    filter.modeType.push(itemChild.label_id)
                                }
                            }
                        )
                    }
                    else if (item.category_id == 3){
                        item.items.forEach((itemChild,indexChild)=>{
                                if (itemChild.selected == true){
                                    filter.statusType.push(itemChild.label_id)
                                }
                            }
                        )
                    }
                });

                this.setState({
                    data: [],
                    filter:filter,
                    isLoading:true,
                    currentPage:0
                },()=>{
                    this.fetchData(0);
                });
            });
    }

    componentWillUnmount() {
        this.refreshEmitter && this.refreshEmitter.remove();
    }

    formatBody(){
        let filter = this.state.filter;

        let body = {};
        body.beginTs = filter.beginTs;
        body.endTs = filter.endTs;
        body.clause = {};

        (filter.orderType === 1) ? (body.order = {direction: 'asc', property: 'status'})
            : (body.order = {direction: 'desc', property: 'ts'});
        (filter.modeType.length > 0 ) ? (body.clause.mode = filter.modeType): null;
        (filter.statusType.length > 0) ? (body.clause.status = filter.statusType) : null;
        (filter.storeId.length > 0) ? (body.clause.storeId = filter.storeId) : null;

        return body;
    }

    fetchData(page){
        try {
            if (this.state.filter.storeId.length > 0 || this.firstSearch){
                let body = this.formatBody();
                body.filter = {page: page};

                HttpUtil.post('inspect/report/list',body)
                    .then(result => {
                        let data = this.state.data;
                        this.setState({
                            data: data.concat(result.data.content),
                            lastPage: result.data.last,
                            showFooter: 0,
                            onEndReached: false,
                            isLoading: false,
                            onPull:false
                        });
                    })
                    .catch(error=>{
                        this.setState({
                            showFooter: 0,
                            onEndReached: false,
                            isLoading: false,
                            onPull:false
                        });
                    });
            }
            else{
                this.setState({
                    data:[],
                    showFooter: 0,
                    onEndReached: false,
                    isLoading: false,
                    onPull:false
                });
            }
        }catch (e) {
        }
    }

    renderLoadingView() {
        return (
            <View style={{flex:1, justifyContent:'center'}}>
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
                this.fetchData(page);
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

    renderItem = ({ item,index}) => {
        return (
            <TouchableOpacityEx activeOpacity={0.5} onPress={()=>Actions.push('inspectInfo',{item:item})}>
                <View style={styles.itemPanel}>
                    <View style={styles.iconPanel}>
                        {
                            item.mode !== 0 ? <Image source={require('../assets/images/event_site_pic.png')} style={styles.iconPanel}/>
                                : <Image source={require('../assets/images/event_telnet_pic.png')} style={styles.iconPanel}/>
                        }
                    </View>
                    <View style={styles.inspectPanel}>
                        <Text style={styles.inspectTyle} numberOfLines={1}>
                            {item.storeName}
                        </Text>
                        <Text style={styles.inspectStore} numberOfLines={1}>{item.mode !== 0 ? I18n.t('Onsite patrol') : I18n.t('Remote patrol')} | {item.tagName}</Text>
                    </View>
                    <View style={styles.datePanel}>
                        <Text style={styles.dateText} numberOfLines={1}>{TimeUtil.getTime(item.ts)}</Text>
                        <Text style={styles.submitText} numberOfLines={1}>{I18n.t('Submitter')}:{item.submitterName}</Text>
                    </View>
                    {
                        item.status === 0 ? <Image source={this.default.supervised} style={styles.inspectLabel}/>
                            : (item.status === 1) ? <Image source={this.default.improved} style={styles.inspectLabel}/>
                            : <Image source={this.default.good} style={styles.inspectLabel}/>
                    }
                </View>
            </TouchableOpacityEx>
        )
    }

    onChangeOrder(index){
        if (this.state.orderType !== index){
            this.setState({orderType:index});
            setTimeout(() => {
                this.onRefresh();
            }, 200);
        }
    }

    async onFilter(){
        let data = {};
        data.filter = this.filter;
        data.lastStore = this.lastStore;
        data.beginTs = this.state.filter.beginTs;
        data.endTs = this.state.filter.endTs;
        data.title = I18n.t('Patrol report filter');
        Actions.push('searchFilter',{data:data});
    }

    render() {
        let statusCheck = null;
        if ( this.state.orderType === 0 ){ statusCheck =(
            <Image style={{width:30,height:30,marginRight:12}} source={require('../assets/images/camera_check.png')}/>
        )}

        let timeCheck = null;
        if (this.state.orderType === 1) { timeCheck =(
            <Image style={{width:30,height:30,marginRight:12}} source={require('../assets/images/camera_check.png')}/>
        )}

        let filter = null;
        if (!this.state.isLoading){
            filter = <TouchableOpacity activeOpacity={0.5} onPress={()=>{this.onFilter()}}>
                <View style={{width:50,height:48,alignItems:'flex-end'}}>
                    <Text style={{fontSize:14,color:'#ffffff',marginRight:10,textAlignVertical:'center',height:48,
                        ...Platform.select({ios:{lineHeight:48}})}}>{I18n.t('Filter')}</Text>
                </View>
            </TouchableOpacity>;
        }

        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={()=>Actions.pop()} style={{width:40,alignItems:'center'}}>
                        <Image source={RouteMgr.getRenderIcon()} style={{width:48,height:48}}/>
                    </TouchableOpacity>
                    <View style={styles.NavBarTitle}>
                        <Text style={styles.NavBarText}>{I18n.t('Reports')}</Text>
                    </View>
                    {filter}
                </View>

                <NetInfoIndicator/>
                <View style={{height:1, width: width, backgroundColor: '#dcdcdc'}}/>
                {
                    this.state.isLoading ? this.renderLoadingView() : null
                }

                {
                    this.state.isLoading ? null : <FlatList
                        data={this.state.data}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderItem}
                        showsVerticalScrollIndicator={false}
                        onEndReached={() => this.onEndReached()}
                        onEndReachedThreshold={0.1}
                        onRefresh={() => this.onRefresh()}
                        refreshing={this.state.isRefresh}
                        ListFooterComponent={()=>this.renderFooter()}
                        ItemSeparatorComponent={() => <View style={{
                            height: 1,
                            width: width,
                            backgroundColor: '#dcdcdc'
                        }}/>}
                        ListEmptyComponent={() => <View
                            style={{
                                width: '100%',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                            {
                                this.state.onPull ? null : <View>
                                    <View style={styles.imagePanel}>
                                        <Image style={styles.imageIcon} source={require('../assets/images/img_inspect_report.png')}></Image>
                                    </View>
                                    <Text style={styles.imageTip}>{I18n.t('No reports')}</Text>
                                </View>
                            }

                        </View>}
                    />
                }
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
        width:width-90,
        height:48
    },
    NavBarText: {
        fontSize:18,
        height: 48,
        color:'#ffffff',
        textAlign: 'center',
        textAlignVertical: 'center',
        marginRight: -10,
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    },
    topView:{
        width: width,
        height: 10,
        backgroundColor: '#f6f8fa'
    },
    itemPanel:{
        flexDirection: 'row',
        justifyContent:'flex-start',
        height:80,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 22
    },
    iconPanel:{
        width: 25,
        height: 25
    },
    inspectPanel:{
        width: width-32-120-25,
        marginLeft: 6
    },
    inspectTyle:{
        fontSize: 14,
        color: '#19293b',
        fontWeight: 'bold'
    },
    inspectStore:{
        fontSize: 12,
        color: '#19293b',
        marginTop: 4
    },
    datePanel:{
        width: 120,
        alignItems:'flex-end'
    },
    dateText:{
        fontSize: 10,
        color: '#989ba3'
    },
    submitText:{
        fontSize: 10,
        color: '#989ba3',
        marginTop: 10
    },
    inspectLabel:{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 40,
        height: 40
    },
    footer:{
        flexDirection:'row',
        height:24,
        justifyContent:'center',
        alignItems:'center',
        marginBottom:10,
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
    menuItemTextBlack:{
        fontSize:16,
        marginLeft:12,
        color: '#19293b',
        textAlignVertical: 'center',
    },
});
