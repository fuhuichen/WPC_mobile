import React from 'react';
import {
    ActivityIndicator,
    BackHandler,
    DeviceEventEmitter,
    Dimensions,
    FlatList,
    Image,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ListView from 'deprecated-react-native-listview';
import LocationServicesDialogBox from "react-native-android-location-services-dialog-box";
import {
    EMITTER_INDEX_CUSTOMER,
    EMITTER_INDEX_LOCAL,
    EMITTER_INDEX_REMOTE,
    EMITTER_INDEX_VISITOR,
    EMITTER_INSPECT_LOCAL,
    EMITTER_INSPECT_REMOTE,
    EMITTER_MONITOR,
    EMITTER_MODAL_CLOSE
} from "../common/Constant";

import _ from 'lodash';
import {Actions} from 'react-native-router-flux';
import HttpUtil from "../utils/HttpUtil";
import AndroidBack from "../common/AndroidBack";
import RNStatusBar from '../components/RNStatusBar';
import Toast, {DURATION} from 'react-native-easy-toast'
import ToastEx from "react-native-simple-toast"

import * as lib from '../common/PositionLib';
import {request,PERMISSIONS,RESULTS} from 'react-native-permissions';
import AlertUtil from "../utils/AlertUtil";

import RNLocation from 'react-native-location';
import I18n from 'react-native-i18n';
import GlobalParam from "../common/GlobalParam";
import AccessHelper from "../common/AccessHelper";
import NetInfoIndicator from "../components/NetInfoIndicator";
import SearchBar from "../thirds/searchbar/SearchBar";
import dismissKeyboard from "react-native-dismiss-keyboard";
import UserPojo from "../entities/UserPojo";
import store from "react-native-simple-store";
import {ColorStyles} from "../common/ColorStyles";
import ModalBox from "react-native-modalbox";
import StoreFilter from "../components/StoreFilter";
import PatrolStorage from "../components/inspect/PatrolStorage";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
const StatusBarHeight = lib.defaultStatusHeight();
const SECTIONHEIGHT = 30, ROWHEIGHT = 36;
var totalheight = [];
var lettersItemheight = [];
var myLetters = [];
var myDataBlob = {};
var mySectionIDs = [];
var myRowIDs = [];
var cityData = [];
var totalNumber = 10;
var searchHeight = 120;
var that;

let inspectTables = [];
RNLocation.configure({ allowsBackgroundLocationUpdates: true });

var dict = require('../thirds/pingyinlite/dict_full.js');
var pinyinlite = require('../thirds/pingyinlite/pinyin.js')(dict);
const product = require('cartesian-product');
require('string_score');

export default class StoreCenter extends AndroidBack {
    constructor(props){
        super(props);

        var getSectionData = (myDataBlob, mySectionIDs) => {
            return myDataBlob[mySectionIDs];
        };

        var getRowData = (myDataBlob, mySectionIDs, myRowIDs) => {
            return myDataBlob[myRowIDs];
        };

        this.emitter = this.props.data.emitter;
        this.location = false;

        this.state = {
            channelIndex:0,
            dataSource: new ListView.DataSource({
                getSectionHeaderData: getSectionData,
                getRowData: getRowData,
                rowHasChanged: (row1, row2) => row1 !== row2,
                sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
            }),
            srcData:[],
            isLoading: true,
            lettersShow: false,
            keyShow: false,
            tips: '',
            locationState:0,
            locationStore:null,

            storeNames:[],
            content:'',
            searchContent:[],
            storeList:[],
            ariStoreList:[]
        }
        that = this;
        this.inspectContent = [],
        this.lastItem = {};

        this.locationEnable = true;
        this.longitude = null;
        this.latitude = null;
    }

    componentDidMount(){
        this.fetchStore();
        //this.fetchData();
        if(this.emitter === EMITTER_INDEX_LOCAL){
            this.locationEnable && this.doGpsLocation();
        }
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_MODAL_CLOSE,
            ()=>{
                this.refs.modalBox && this.refs.modalBox.close();
            });
    }

    componentWillUnmount(){
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('storeCenterBack', this.onBackAndroid);
        }

        if(this.emitter === EMITTER_MONITOR || this.emitter === EMITTER_INDEX_LOCAL){
            this.stopUpdatingLocation();
        }

        this.notifyEmitter && this.notifyEmitter.remove();
    }

    onBackAndroid =() =>{
        Actions.pop();
        return true
    }

    fetchStore(){
        HttpUtil.get('store/brief/list')
        .then(result => {
              this.setState({ariStoreList:result.data,lettersShow: true, isLoading: false})
        })
        .catch(error => {
            this.setState({isLoading:false});
        })
    }

    fetchData(){
        this.unInit();

        myLetters = _
            .range('A'.charCodeAt(0), 'Z'.charCodeAt(0) + 1)
            .map(n => String.fromCharCode(n).substr(0));
        myLetters.splice(8,1);
        myLetters.splice(13,1);
        myLetters.splice(18,1);
        myLetters.splice(18,1);
        totalheight = Array.apply(null, Array(22)).map(() => 0);

        this.setState({
            isLoading: true,
            lettersShow: false
        })

        try {
            HttpUtil.get('store/alphabetic/brief/list')
                .then(result => {
                    this.setData(result.data);

                    let storeNames = [];
                    let data = [];
                    result.data.map((item)=>{
                        item.store.map((keyStore)=>{
                            data.push(keyStore);
                            storeNames.push(keyStore.name);
                        })
                    });

                    this.setState({
                        srcData: data,
                        storeNames
                    })
                })
                .catch(error => {
                    this.setState({isLoading:false});
                })
        }catch (e) {
            console.log("StoreCenter-fetchData:" + e);
        }
    }

    setData = (cityData) => {
        let letterShow = false;

        for (let i = 0; i < cityData.length; i++) {
            //var mysectionName = 'Section_' + i;
            let zimu = cityData[i].initial;
            let tableHeight = 0;

            var mysectionName = i;
            let storeArray = [];
            cityData[i].store.map((item,index)=>{
                storeArray.push(item.name);

                let content = [];
                (item.authorizedInspect != null) && item.authorizedInspect.forEach((_item,_index)=>{
                    if((this.emitter === EMITTER_INDEX_LOCAL) && (_item.mode == 1) ||
                        (this.emitter === EMITTER_INDEX_REMOTE) && (_item.mode == 0)){
                        content.push(_item.name);
                    }
                });

                inspectTables.push({
                    parentName: item.name,
                    content: content
                });

                let rowCount = Math.floor(content.length/2) + ((content.length%2 != 0) ? 1 : 0);
                tableHeight = rowCount*34 + ((rowCount > 1 ) ? (rowCount-1)*10 : 0) + ((rowCount > 0) ? 28 : 0);
            });

            if(storeArray.length == 0){
                continue;
            }

            letterShow = true;
            let cityMode =storeArray;
            mySectionIDs.push(mysectionName)
            myRowIDs[i] = [];
            var innerLoop = storeArray;
            myDataBlob[mysectionName] = zimu;

            for (let jj = 0; jj < innerLoop.length; jj++) {
                let rowName = i + '_' + jj;
                myRowIDs[i].push(rowName);
                myDataBlob[rowName] = innerLoop[jj];
            }

            let keyIndex = myLetters.indexOf(zimu);
            if(keyIndex !== -1){
                let eachHeight = SECTIONHEIGHT + ROWHEIGHT * cityMode.length + tableHeight;
                totalheight[keyIndex] = eachHeight;
            }
        }

        this.setState({
            dataSource: this.state.dataSource.cloneWithRowsAndSections(myDataBlob, mySectionIDs, myRowIDs),
            isLoading: false,
            lettersShow: letterShow
        })
    };

    renderRow(rowData: string, sectionID: number, rowID: number, highlightRow: (sectionID: number, rowID: number) => void) {
        let index = rowID.toString().lastIndexOf('_');
        let id = parseInt(rowID.toString().substring(index+1)) ;

        let borderBottomWidth = 0.5;
        (myRowIDs != null) && (sectionID >= 0 && sectionID < myRowIDs.length)
            && (myRowIDs[sectionID].length == id+1) && (borderBottomWidth = 0);

        return (
            <TouchableOpacity
                key={rowID}
                style={{height: ROWHEIGHT, justifyContent: 'center', paddingLeft: 20, paddingRight: 20}}
                onPress={() => {
                    that.changedata(rowData, '')
                }}>
                <View style={{borderBottomWidth,borderBottomColor:'#dcdcdc',height:36}}>
                    <Text style={[styles.rowData,{borderBottomWidth}]} numberOfLines={1}>{rowData}</Text>
                </View>
            </TouchableOpacity>
        );
    }

    renderTable(rowData: string, sectionID: number, rowID: number, highlightRow: (sectionID: number, rowID: number) => void) {
        let index = rowID.toString().lastIndexOf('_');
        let id = parseInt(rowID.toString().substring(index+1)) ;

        let key = inspectTables.findIndex(p => p.parentName === rowData);
        let tables = (key != -1) ? inspectTables[key] : [];

        let borderBottomWidth = 0.5;
        (myRowIDs != null) && (sectionID >= 0 && sectionID < myRowIDs.length)
            && (myRowIDs[sectionID].length == id+1) && (tables.content.length == 0) && (borderBottomWidth = 0);

        return (
                <View style={{justifyContent: 'center', paddingLeft: 20, paddingRight: 20}}>
                    {
                        <TouchableOpacity onPress={() => {that.changedata(rowData, '')}} >
                            <View style={{borderBottomWidth,borderBottomColor:'#dcdcdc',height:36}}>
                               <Text style={[styles.tableData,{borderBottomWidth}]} numberOfLines={1}>{rowData}</Text>
                           </View>
                        </TouchableOpacity>
                    }
                    {
                        (tables.content.length > 0) && <View style={styles.tablePanel}>
                            {
                                tables.content.map((_item,_index)=>{
                                    return <TouchableOpacity key={_index} onPress={()=>that.changedata(rowData, _item)}>
                                        <View style={styles.tableItem}>
                                            <Text style={styles.tableContent} numberOfLines={1}>{_item}</Text>
                                        </View>
                                    </TouchableOpacity>
                                })
                            }
                        </View>
                    }
                </View>
        );
    }

    renderSectionHeader = (sectionData, sectionID) => {
        return (
            <View style={{height: SECTIONHEIGHT, justifyContent: 'center', paddingLeft: 5, backgroundColor: '#dcdcdc',opacity:0.6}}>
                <Text style={{color: 'rgb(253,98,104)', fontWeight: 'bold', marginLeft: 10,lineHeight:SECTIONHEIGHT}}>
                    {sectionData}
                </Text>
            </View>
        )
    }

    renderLetters(letter, index) {
        return (
            <TouchableOpacity
                onLayout={({nativeEvent: e}) => this.oneLetterLayout(e)}
                key={index} activeOpacity={0.7}
                onPressIn={() => {
                    this.scrollTo(index)
                }}>
                <View
                    style={styles.letter}>
                    <Text style={styles.letterText}>{letter}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    changedata = (cityname, inspect) => {
        try {
            let itemfind = this.state.ariStoreList.find((item)=>item.name === cityname);
            let storeId = (inspect !== '') ? inspect : itemfind.storeId;
            HttpUtil.get(`store/info?storeId=${storeId}`)
                .then(result => {
                    let item = result.data;
                    if(this.emitter === EMITTER_INDEX_REMOTE || this.emitter === EMITTER_INDEX_LOCAL
                        || this.emitter === EMITTER_INSPECT_REMOTE || this.emitter === EMITTER_INSPECT_LOCAL){
                        if (item.authorizedInspect != null){
                            this.inspectContent = [];
                            item.authorizedInspect.forEach((_item,_index)=>{
                                if((this.emitter === EMITTER_INDEX_LOCAL) && (_item.mode == 1) ||
                                   (this.emitter === EMITTER_INSPECT_LOCAL) && (_item.mode == 1) ||
                                   (this.emitter === EMITTER_INDEX_REMOTE) && (_item.mode == 0) ||
                                   (this.emitter === EMITTER_INSPECT_REMOTE) && (_item.mode == 0)){
                                    this.inspectContent.push(_item);
                                }
                            });
                            if (this.inspectContent.length > 0){
                                this.lastItem = item;
                                this.setState({channelIndex:0});
                                this.refs.modalBox.open();
                            }
                            else{
                                this.refs.toast.show(I18n.t('No inspection'),DURATION.LENGTH_SHORT);
                            }
                            }
                        return;
                    }

                    if(item.device.length === 0 && (this.emitter === EMITTER_INDEX_REMOTE || this.emitter === EMITTER_MONITOR)){
                        this.refs.toast.show(I18n.t('No cameras'),DURATION.LENGTH_SHORT);
                        return;
                    }

                    this.popAndPush(item, inspect);
                })
                .catch(error=>{
                })

        }catch (e) {

        }
    }

    popAndPush(item, inspect){
        switch(this.emitter){
            case EMITTER_MONITOR: {
                if (!AccessHelper.enableStoreMonitor() || !AccessHelper.enableVideoLicense()){
                    ToastEx.show(I18n.t('Video license'), ToastEx.LONG);
                    return;
                }

                Actions.replace('videoMonitor',
                    {
                        data: item,
                        channelId: 0,
                        isCollect:item.favorite,
                        emitter: EMITTER_MONITOR
                    });
                break;
            }
            case EMITTER_INDEX_LOCAL: {
                {
                    GlobalParam.setInspectStatus(0);
                    Actions.pop();
                    Actions.push('localCheck',{data:item, inspect});
                }
                break;
            }
            case EMITTER_INSPECT_LOCAL:{
                {
                    PatrolStorage.delete();
                    Actions.pop();
                    Actions.pop();
                    Actions.push('localCheck',{data:item,inspect});
                }
                break;
            }
            case EMITTER_INDEX_REMOTE: {
                {                    
                    if (!AccessHelper.enableStoreMonitor() || !AccessHelper.enableVideoLicense()){
                        ToastEx.show(I18n.t('Video license'), ToastEx.LONG);
                        return;
                    }

                    GlobalParam.setInspectStatus(0);
                    Actions.pop();
                    Actions.push('remoteCheck',{data:item, inspect});
                }
                break;
            }
            case EMITTER_INSPECT_REMOTE:{
                {
                    PatrolStorage.delete();
                    Actions.pop();
                    Actions.pop();
                    Actions.push('remoteCheck',{data:item,inspect});
                }
                break;
            }
            case EMITTER_INDEX_CUSTOMER:{
                {
                    Actions.pop();
                    Actions.push('customerList',{storeId:item.storeId});
                }
                break;
            }
            case EMITTER_INDEX_VISITOR:{
                {
                    Actions.pop();
                    GlobalParam.setStores(this.state.srcData);
                    DeviceEventEmitter.emit('onRefreshCustomer',
                        {storeId: item.storeId,storeName:item.name});
                }
                break;
            }
        }
    }

    //touch right indexLetters, scroll the left
    scrollTo = (index) => {
        this.setState({
            keyShow:true,
            tips: myLetters[index]
        })

        let position = 0;
        for (let i = 0; i < index; i++) {
            position += totalheight[i]
        }

        this._listView.scrollTo({
            y: position, animated: true
        })
    }

    oneLetterLayout = (e) => {
        if (lettersItemheight.length != myLetters.length) {
            lettersItemheight.push(e.layout.y);
        }

        if(Platform.OS === 'ios' && lettersItemheight.length === myLetters.length){
            lettersItemheight.sort((a,b)=>a>b);
        }
    }

    hiddenTip(){
        this.setState({
            keyShow:false
        })
    }

    componentWillMount() {
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('storeCenterBack', this.onBackAndroid);
        }

        this._panGesture = PanResponder.create({
            onStartShouldSetPanResponder: (evt, gestureState) => true,
            onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
            onPanResponderTerminationRequest: (evt, gestureState) => true,

            onPanResponderGrant: (evt, gestureState) => {
                let value = gestureState.y0 - StatusBarHeight - searchHeight - lib.statusBarHeight()+lib.defaultBottomSpace();

                for (let i = 0; i < lettersItemheight.length; i++) {
                    if (value < 0) {
                        this.scrollTo(0);
                    } else if (value > lettersItemheight[i]) {
                        this.scrollTo(i);
                    }
                }
            },
            onPanResponderMove: (evt, gestureState) => {
                let value = gestureState.moveY - StatusBarHeight - searchHeight - lib.statusBarHeight()+lib.defaultBottomSpace();

                for (let i = 0; i < lettersItemheight.length; i++) {
                    if (value < 0) {
                        this.scrollTo(0);
                    } else if (value > lettersItemheight[i]) {
                        this.scrollTo(i);
                    }
                }

            },
            onResponderTerminationRequest: (evt, gestureState) => true,
            onPanResponderRelease: (evt, gestureState) => {
                this.hiddenTip()
                // console.log('down x:' + gestureState.moveX + ',y:' + gestureState.moveY);
            },
            onPanResponderTerminate: (evt, gestureState) => {
                // console.log(`up = evt.identifier = ${evt.identifier} gestureState = ${gestureState}`);
            },
        });

    }

    unInit(){
        myLetters = [];
        myDataBlob = {};
        mySectionIDs = [];
        myRowIDs = [];
        cityData = [];
        lettersItemheight = [];
        inspectTables = [];
    }

    backClick(){
        Actions.pop();
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

    /**
     * GPS location functions.
     */
    refreshLocation(){
        request(Platform.select({
                android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
                ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
            }),
        ).then(result => {
            if (result ===  RESULTS.GRANTED){
                this.locationEnable && this.doGpsLocation();
            }
            else {
                AlertUtil.alert(I18n.t('Your location'))
            }
        });
    }

    doGpsLocation(){
        this.stopUpdatingLocation();

        this.setState({ locationState:0 },()=>{
            RNLocation.configure({distanceFilter: 5.0});

            RNLocation.getCurrentPermission()
                .then(currentPermission => {
                    if(currentPermission === 'authorizedFine' || currentPermission === 'authorizedWhenInUse'){
                        if(lib.isAndroid()){
                            LocationServicesDialogBox.checkLocationServicesIsEnabled({
                                message: "Use location",
                                ok: "Yes",
                                cancel: "No",
                                showDialog: false,
                                openLocationServices:false
                            })
                                .then((success)=>{
                                   this.startUpdatingLocation();
                                })
                                .catch((error)=>{
                                    this.setState({locationState:2});
                                })
                        }else {
                            this.startUpdatingLocation();
                        }
                    }else{
                        this.setState({locationState:2});
                    }
                }).catch((err)=>{
                    this.setState({locationState:2});
            });
        });
    }

    startUpdatingLocation = () => {
        try {
            this.locationEnable = false;
            this.locationSubscription = RNLocation.subscribeToLocationUpdates(
                locations => {
                    if (this.longitude == null && this.latitude == null){
                        this.longitude = locations[0].longitude;
                        this.latitude = locations[0].latitude;

                        HttpUtil.get(`store/adjacent/list?longitude=${this.longitude}&latitude=${this.latitude}`)
                            .then(result => {
                                if (result.data.length > 0) {
                                    (result.data[0].distance <= 1000) ? this.setState({
                                        locationStore: result.data[0].store,
                                        locationState: 1
                                    }) : this.setState({locationState:3});
                                } else {
                                    this.setState({locationState: 2});
                                }

                                this.stopUpdatingLocation();
                            })
                            .catch(error => {
                                this.stopUpdatingLocation();
                                this.setState({locationState: 2});
                            })
                    }
                });
        }catch (e) {
            console.log("StoreCenter-startUpdatingLocation:" + e);
        }
    };

    stopUpdatingLocation = () => {
        this.locationSubscription && this.locationSubscription();
        this.locationSubscription = null;

        this.locationEnable = true;
        this.longitude = null;
        this.latitude = null;
    };

    switchToLocation(){
        try {
            this.changedata(this.state.locationStore.name, this.state.locationStore.storeId);
        }catch (e) {
            console.log("StoreCenter-switchToLocation:" + e);
        }
    }

    /**
     * Search bar.
     */
    searchStore(text){
        try {
/*             const searchItems = this.state.storeNames.map(name => {
                return {
                    name: name,
                    search: [name, ..._.uniq(
                        product(pinyinlite(name).filter(p => p.length > 0))
                            .map(item => item.join(' '))
                    )],
                };
            });

            const input = text;
            const scores = searchItems.map(item => {
                return {
                    name: item.name,
                    score: _.max(item.search.map(pinyin => pinyin.score(input))),
                };
            })

            let result = [];
            result = scores.filter(i => i.score > 0.5 && i.score !== 0.5277777777777778)
                .sort((a, b) => b.score - a.score)
                .map(item => item.name); */

            let result  = this.state.ariStoreList.filter( p => p.name.indexOf(text) != -1 );
            this.setState({
                content: text,
                searchContent: result,
            })
        }catch (e) {
        }
    }

    itemStoreClick(item){
        this.changedata(item.name, '');
    }

    itemSearchClick(content){
        try {
            if (this.emitter === EMITTER_MONITOR){
                let itemfind = this.state.ariStoreList.find((item)=>item.storeId == content.storeId);
                HttpUtil.get(`store/info?storeId=${itemfind.storeId}`)
                    .then(result => {
                        let item = result.data;
                        if(item != null && item.device.length === 0){
                            dismissKeyboard();
                            this.refs.toast.show(I18n.t('No cameras'),DURATION.LENGTH_SHORT)
                            return;
                        }

                        if (!AccessHelper.enableStoreMonitor() || !AccessHelper.enableVideoLicense()){
                            ToastEx.show(I18n.t('Video license'), ToastEx.LONG);
                            return;
                        }

                        Actions.replace('videoMonitor',
                            {data: item,
                                channelId: 0,
                                isCollect:item.favorite,
                                emitter: EMITTER_MONITOR});

                        this.disableTouch = false;
                        let key = UserPojo.getUserId()+ UserPojo.getAccountId()+'-history';
                        store.get(key).then((res)=> {
                            let exist = null;
                            if (res != null) {
                                res.forEach(function (v) {
                                    if(v == item.storeId){
                                        exist = true;
                                    }
                                })
                            }

                            if(exist == null){
                                store.push(key,item.storeId)
                            }
                        })

                    })
                    .catch(error=>{
                    })
            }else{
                this.changedata(content.name, '');
            }
        }catch (e) {
            console.log("StoreSearch-itemSearchClick:" + e);
        }
    }

    onStoreChange(storeId){
        let newStore = [];
        this.state.ariStoreList.forEach((item,index)=>{
            if (storeId.findIndex(p => p == item.storeId) != -1){
                newStore.push(item);
            }
        })
        this.setState({
            storeList: [],
        },()=>{
            this.setState({storeList:newStore});
        });
    }

    renderItem = ({ item,index}) => {
        return (
            <TouchableOpacity activeOpacity={0.5} onPress={this.itemSearchClick.bind(this,item)} >
                <View style={styles.itemPanel}>
                    <Text style={styles.itemContent} numberOfLines={1}>{item.name}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    renderStore = ({ item,index}) => {
        return (
            <TouchableOpacity activeOpacity={0.5} onPress={this.itemStoreClick.bind(this,item)} >
                <View style={styles.itemPanel}>
                    <Text style={styles.itemContent} numberOfLines={1}>{item.name}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    renderModal = ({ item,index}) => {
        let color = index === this.state.channelIndex ? '#F31C65': '#888C95';
        let backColor = index === this.state.channelIndex ? 'rgba(243,28,101,0.1)': 'white';
        return (
            <TouchableOpacity activeOpacity={1} onPress={() => {
                this.setState({channelIndex:index});
            }}>
                <View style={{width:width-36,height:50,backgroundColor: backColor,flexDirection: 'row',alignItems: 'center',justifyContent:'center'}}>
                    <Text style={{fontSize:12,color:color}} numberOfLines={1}>{item.name}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    render() {
        let locationState = this.state.locationState;
        let locationContent = null;

        if(locationState === 1){
            locationContent = <TouchableOpacity activeOpacity={0.5} onPress={()=>this.switchToLocation()}>
                <Text style={styles.locationSuccess} numberOfLines={1}>
                        {this.state.locationStore.name}
                </Text>
            </TouchableOpacity>
        }else if(locationState === 3){
            locationContent = <Text style={styles.locationInit} numberOfLines={1}>{I18n.t('Location no store')}</Text>
        }
        else if(locationState === 0){
            locationContent = <Text style={styles.locationInit} numberOfLines={1}>{I18n.t('Store Locating')}</Text>
        }else {
            locationContent = <Text style={styles.locationSuccess} numberOfLines={1}>{I18n.t('Locate error')}</Text>
        }

        let locationRetry = <TouchableOpacity activeOpactity={0.5} onPress={this.refreshLocation.bind(this)}>
            <View style={styles.refreshPanel}>
                <Image source={require('../assets/images/img_location_refresh.png')} style={styles.refreshIcon}/>
                <Text style={styles.refreshText}>{I18n.t('Retry')}</Text>
            </View>
        </TouchableOpacity>

        let location = null;
        if(this.emitter === EMITTER_INDEX_LOCAL) {
            location = (
                <View style={styles.locationPanel}>
                    {/* <Text style={styles.totalStore}>{I18n.t('Account all stores')}</Text> */}
                    <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                        <View style={styles.location}>
                            <Image source={require('../assets/images/img_location_icon.png')}
                                   style={styles.locationIcon}/>
                            {locationContent}
                            <Text style={styles.gpsLabel}>{I18n.t('GPS locate')}</Text>
                        </View>
                        {locationRetry}
                    </View>
                </View>

            )
        }

        let TitleBar = <View style={[styles.NavBarPanel,{justifyContent:'flex-start'}]}>
            <TouchableOpacity activeOpacity={0.5} onPress={this.backClick.bind(this)}>
                <Image style={styles.NavBarImage} source={require('../assets/images/img_navbar_close.png')}/>
            </TouchableOpacity>
            <View style={{marginLeft:16}}>
                <SearchBar placeholder={I18n.t('Alphabet list')} onSearchChange={(text)=>this.searchStore(text)}/>
            </View>
        </View>;

        let storeList = null;
        if(this.state.content === ''){
            storeList =  (
                this.state.lettersShow ?
                <FlatList data={this.state.storeList}
                         keyExtractor={(item, index) => index.toString()}
                         renderItem={this.renderStore}
                         showsVerticalScrollIndicator={false}
                         getItemLayout={(data, index) => (
                            {length:60, offset:61 * index, index}
                          )}
                         ItemSeparatorComponent={() => <View style={{
                            height: 1,
                            marginLeft:16,
                            width: width-32,
                            backgroundColor: '#dcdcdc'
                         }}/>}
                         ListEmptyComponent={() => <View
                         style={{
                             height: height / 2,
                             width: '100%',
                             alignItems: 'center',
                             justifyContent: 'center',
                         }}><Text>{I18n.t('No data')}</Text></View>}
                         keyboardShouldPersistTaps={'handled'}
                        /> : null
            )
        }

        let storeLetters = null;
        if(this.state.content === ''){
            storeLetters = (
                this.state.lettersShow == false ? null :
                    (<View
                            ref="ref_letters"
                            {...this._panGesture.panHandlers}
                            style={this.state.keyShow ? styles.lettersDown : styles.letters}>
                            {myLetters.map((letter, index) => this.renderLetters(letter, index))}
                        </View>
                    )
            )
        }

        let storeTips = null;
        if(this.state.content === ''){
            storeTips = (
                this.state.keyShow == true ? <View style={styles.tipsPanel}>
                    <Text style={styles.tips}>{this.state.tips}</Text>
                </View> : null
            )
        }

        /**
         * Search view.
         */
        let searchSeparator = null;
        if(this.state.content !== ''){
            searchSeparator = (
                <View style={{height:20,backgroundColor:'#f7f8fa',marginTop:8}}></View>
            )
        }

        let searchList = null;
        if(this.state.content !== ''){
            searchList = (
                    <FlatList data={this.state.searchContent}
                              keyExtractor={(item, index) => index.toString()}
                              renderItem={this.renderItem}
                              showsVerticalScrollIndicator={false}
                              ItemSeparatorComponent={() => <View style={{
                                  height: 1,
                                  marginLeft:16,
                                  width: width-32,
                                  backgroundColor: '#dcdcdc'
                              }}/>}
                              getItemLayout={(data, index) => (
                                {length:60, offset:61 * index, index}
                              )}
                              ListEmptyComponent={() => <View
                                  style={{
                                      height: height / 2,
                                      width: '100%',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                  }}><Text>{I18n.t('No data')}</Text></View>}
                              keyboardShouldPersistTaps={'handled'}
                    />
            )
        }

        let modalMox =  (
        <ModalBox style={styles.modalBox} ref={"modalBox"} position={"center"}
                          isDisabled={false}
                          swipeToClose={false}
                          backdropPressToClose={false}
                          backButtonClose={true}
                          coverScreen={true}>

                    <View style={styles.headerPanel}>
                        <Text style={{fontSize: 14, color: '#19293b'}}>{I18n.t('Select inspect')}</Text>
                    </View>
                    <View style={{height:1,backgroundColor:'#f5f5f5'}}/>
                    <ScrollView showsVerticalScrollIndicator={true} keyboardShouldPersistTaps={'handled'}>
                        <FlatList
                            data={this.inspectContent}
                            extraData={this.state}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={this.renderModal}
                        />
                    </ScrollView>
                    <View style={{height:1,backgroundColor:'#f5f5f5'}}/>
                    <View style={styles.confirmPanel}>
                        <View style={{width:(width-36-1)/2}}>
                            <TouchableOpacity onPress={() => {
                                this.refs.modalBox.close();
                            }}>
                                <Text style={styles.cancel}>{I18n.t('Cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.verticalLine}></View>
                        <View style={{width:(width-36-1)/2}}>
                            <TouchableOpacity onPress={() => {
                                this.refs.modalBox.close();
                                if (this.state.channelIndex !== -1){
                                    let inspect = this.inspectContent[this.state.channelIndex];
                                    this.popAndPush(this.lastItem,inspect);
                                }
                            }}>
                                <Text style={[styles.confirm,{color:ColorStyles.COLOR_MAIN_RED}]}>
                                    {I18n.t('Confirm')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ModalBox>
        )

        let filter = null;
        if(this.state.content === ''){
            filter  = (
                <StoreFilter onChange={(storeId) => this.onStoreChange(storeId)} store={this.state.ariStoreList}/>
            )
        }

        let content = null;
        if (this.state.isLoading){ content = (
            <View style={{flex:1, justifyContent:'center'}}>
              <ActivityIndicator animating={true} color='#dcdcdc' size="large"/>
              <Text style={{textAlign:'center'}}>{I18n.t('Loading')}</Text>
            </View>
        )
        }
        else{ content = (
            <View style={{flex:1}}>
            {location}
            {filter}
            <ScrollView>
                {storeList}
                {storeTips}
                {searchSeparator}
                {searchList}
            </ScrollView>
            </View>
        )
        }

        return (
            <View style={styles.container}>
                <RNStatusBar/>
                {TitleBar}
                <NetInfoIndicator/>
                {content}
                {modalMox}
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
        backgroundColor: '#24293d'
    },
    NavBarImage: {
        width: 48,
        height: 48
    },
    NarBarTitle: {
        fontSize: 18,
        color: '#ffffff',
        height: 48,
        textAlignVertical: 'center',
        textAlign: 'center',
        marginRight: 40,
        lineHeight: 48
    },
    letters: {
        flexDirection: 'column',
        position: 'absolute',
        height: (height-StatusBarHeight-searchHeight*2),
        bottom: 0,
        right: 0,
        backgroundColor: 'transparent',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...Platform.select({
            ios:{
                top:searchHeight+StatusBarHeight*2-lib.defaultBottomSpace()
            },
            android:{
                top:searchHeight+StatusBarHeight
            }
        })
    },
    lettersDown: {
        flexDirection: 'column',
        position: 'absolute',
        height: (height-StatusBarHeight-searchHeight*2),
        bottom: 0,
        right: 0,
        backgroundColor:'rgba(0,0,0,0.3)',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...Platform.select({
            ios:{
                top:searchHeight+StatusBarHeight*2-lib.defaultBottomSpace()
            },
            android:{
                top:searchHeight+StatusBarHeight
            }
        })
    },
    letter: {
        height: (height-StatusBarHeight-searchHeight*2)/22,
        width: width * 3 / 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    letterText: {
        textAlign: 'center',
        fontSize: (height-StatusBarHeight-searchHeight*2)*0.6/22,
        color:'rgb(253,98,104)'
    },
    tableData: {
        fontSize: 12,
        color: '#19293b',
        height: 36,
        textAlignVertical:'center',
        lineHeight: 36,
        borderBottomWidth: 0.5,
        borderBottomColor:'#dcdcdc'
    },
    tipsPanel:{
        position:'absolute',
        width: 60,
        height: 60,
        top: height/2-48,
        alignSelf:'center',
        alignItems:'center',
        backgroundColor:'rgba(0,0,0,0.5)',
        borderRadius: 3
    },
    tips:{
        height:60,
        textAlignVertical:'center',
        color: 'white',
        fontSize: 26,
        fontWeight: 'bold',
        opacity: 1,
        lineHeight:60
    },
    locationPanel:{
        width:width,
        height:70,
        backgroundColor:'#ffffff',
        paddingTop:20,
        paddingLeft:16,
        paddingRight:16,
    },
    totalStore:{
        fontSize: 14,
        color:'#19293b',
        marginBottom:10
    },
    location:{
        flexDirection:'row',
        // justifyContent:'flex-start',
        height:20,
        width: 160
    },
    locationIcon:{
        width:22,
        height:22,
        alignSelf:'center'
    },
    locationInit:{
        fontSize:16,
        marginLeft:6,
        textAlignVertical:'center',
        lineHeight:20,
    },
    locationSuccess:{
        fontSize: 16,
        marginLeft:6,
        color:'#f31d65',
        textAlignVertical:'center',
        lineHeight:20
    },
    gpsLabel:{
        fontSize: 12,
        color: '#7a8fae',
        marginLeft:16,
        textAlignVertical:'center',
        lineHeight:20
    },
    refreshPanel:{
        width:50,
        height:18,
        lineHeight:20,
        flexDirection:'row',
        justifyContent:'center',
        backgroundColor: '#fdbc3f',
        borderRadius:8,
        marginTop:2,
        marginRight: 12,
        alignSelf:'flex-end'
    },
    refreshIcon:{
        width:18,
        height:18
    },
    refreshText:{
        fontSize:12,
        color:'#ffffff',
        height:18,
        textAlignVertical:'center',
        ...Platform.select({
            ios:{
                lineHeight:18
            }
        })
    },
    itemPanel:{
        height: 60,
        paddingLeft:16,
    },
    itemContent: {
        fontSize: 13,
        color: '#19293b',
        height: 60,
        textAlignVertical: 'center',
        lineHeight: 60,
        width:width-32
    },
    tablePanel:{
        width: width,
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#ffffff',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        paddingBottom: 14,
        paddingTop:4
    },
    tableItem:{
        width: (width-68)/2,
        height: 34,
        borderRadius:2,
        flexWrap: 'wrap',
        display:'flex',
        flexDirection: 'row',
        justifyContent:'center',
        marginTop:10,
        marginRight:18,
        borderWidth: 0.5,
        borderColor: '#dcdcdc'
    },
    tableContent:{
        height: 34,
        fontSize:12,
        color: "#19293b",
        textAlignVertical:'center',
        textAlign:'center',
        lineHeight: 34
    },
    rowData: {
        fontSize: 12,
        color: '#19293b',
        height: ROWHEIGHT,
        textAlignVertical:'center',
        lineHeight: ROWHEIGHT,
        borderBottomWidth: 0.5,
        borderBottomColor: '#dcdcdc'
    },
    modalBox: {
        width: width-36,
        ...Platform.select({
            android:{
                height: 300
            },
            ios:{
                height: 294
            }
        }),
        borderRadius:3
    },
    headerPanel:{
        flexDirection:'row',
        justifyContent: 'center',
        alignItems:'center',
        height:56
    },
    bottomPanel:{
        marginTop:10,
        flexDirection:'row',
        alignItems:'center',
        height:46
    },
    confirmPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        height: 48
    },
    cancel:{
        color: '#888c9e',
        height: 48,
        textAlignVertical: 'center',
        textAlign:'center',
        marginBottom: 16,
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    },
    verticalLine:{
        width: 1,
        height: 48,
        backgroundColor:'#f5f5f5'
    },
    confirm: {
        height: 48,
        textAlignVertical: 'center',
        textAlign:'center',
        marginBottom: 16,
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    },
})
