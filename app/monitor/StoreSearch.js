import React, {Component} from 'react';
import {Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import _ from 'lodash';
import {Actions} from 'react-native-router-flux';
import SearchBar from '../thirds/searchbar/SearchBar';
import HttpUtil from "../utils/HttpUtil";
import {EMITTER_MONITOR} from "../common/Constant";
import store from 'react-native-simple-store'
import UserPojo from "../entities/UserPojo";
import RNStatusBar from '../components/RNStatusBar';
import I18n from 'react-native-i18n';
import Toast, {DURATION} from "react-native-easy-toast";
import AccessHelper from "../common/AccessHelper";
import ToastEx from "react-native-simple-toast";
import dismissKeyboard from 'react-native-dismiss-keyboard';
import NetInfoIndicator from "../components/NetInfoIndicator";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

var dict = require('../thirds/pingyinlite/dict_full.js');
var pinyinlite = require('../thirds/pingyinlite/pinyin.js')(dict);
const product = require('cartesian-product');
require('string_score');

export default class StoreSearch extends Component {
    constructor(props){
        super(props);

        this.state = {
            data:[],
            srcData:[],
            content:'',
            searchContent:[],
            history:[]
        }
    }

    componentDidMount(){
        this.fetchData();
    }

    fetchData(){
        try {
            this.setState({
                data: []
            })

            let request = {};
            let filter = {};
            filter.page = 0;
            filter.size = 1000;
            request.filter = filter;
            HttpUtil.post('store/list',request)
                .then(result => {
                    let content = [];
                    result.data.content.map((item,index)=>{
                        content.push(item.name);
                    })

                    this.setState({
                        data:content,
                        srcData: result.data.content
                    })

                    let key = UserPojo.getUserId()+ UserPojo.getAccountId()+'-history';
                    store.get(key).then((res)=> {
                        let data = this.state.srcData;
                        let history = [];

                        if (res != null) {
                            res.forEach(function (v) {
                                let item = data.find((item)=>item.storeId == v);

                                if(item != null){
                                    history.push(item);
                                }
                            })
                        }

                        this.setState({history})
                    })
                })
                .catch(error=>{
                })
        }catch (e) {
            console.log("StoreSearch-fetchData:" + e);
        }
    }

    searchStore(text){
        try {
            const searchItems = this.state.data.map(name => {
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
                .map(item => item.name);

            this.setState({
                content: text,
                searchContent: result,

            })
        }catch (e) {
            console.log("StoreSearch-searchStore:" + e);
        }
    }

    itemSearchClick(content){
        try {
            let data = this.state.srcData;
            let item = data.find((item)=>item.name == content);
            if(item != null && item.device.length === 0){
                dismissKeyboard();
                this.refs.toast.show(I18n.t('No cameras'),DURATION.LENGTH_SHORT)
                return;
            }

            if (!AccessHelper.enableStoreMonitor() || !AccessHelper.enableVideoLicense()){
                ToastEx.show(I18n.t('Video license'), ToastEx.LONG);
                return;
            }

            Actions.pop();
            Actions.push('videoMonitor',
                {data: item,
                    channelId: 0,
                    isCollect:item.favorite,
                    emitter: EMITTER_MONITOR});

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
        }catch (e) {
            console.log("StoreSearch-itemSearchClick:" + e);
        }
    }

    historyItemClick(item){
        if(item != null && item.device.length === 0){
            dismissKeyboard();
            this.refs.toast.show(I18n.t('No cameras'),DURATION.LENGTH_SHORT)
            return;
        }

        if (!AccessHelper.enableStoreMonitor() || !AccessHelper.enableVideoLicense()){
            ToastEx.show(I18n.t('Video license'), ToastEx.LONG);
            return;
        }

        Actions.pop();
        Actions.push('videoMonitor',
            {data: item,
                channelId: 0,
                isCollect:item.favorite,
                emitter: EMITTER_MONITOR});
    }

    backClick(){
        Actions.pop();
    }

    renderItem = ({ item,index}) => {
        return (
            <TouchableOpacity activeOpacity={0.5} onPress={this.itemSearchClick.bind(this,item)}>
                <View style={styles.itemPanel}>
                   <Text style={styles.itemContent} numberOfLines={1}>{item}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    render() {
        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.backClick.bind(this)}>
                        <Image style={styles.NavBarImage} source={require('../assets/images/img_navbar_close.png')}/>
                    </TouchableOpacity>
                    <View style={{marginLeft:16}}>
                        <SearchBar placeholder={I18n.t('Alphabet list')} onSearchChange={(text)=>this.searchStore(text)}/>
                    </View>
                </View>
                <NetInfoIndicator/>
                {
                    this.state.content !== ''?
                        <View style={{height:20,backgroundColor:'#f7f8fa',marginTop:8}}></View>
                        :null
                }

                {
                    this.state.content !== ''?
                        <FlatList data={this.state.searchContent}
                                  keyExtractor={(item, index) => index.toString()}
                                  renderItem={this.renderItem}
                                  showsVerticalScrollIndicator={false}
                                  ItemSeparatorComponent={() => <View style={{
                                      height: 1,
                                      width: width,
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
                        />
                        : <ScrollView>
                            {
                                this.state.history.length > 0
                                    ? <View style={styles.historyLabelPanel}>
                                            <Text style={styles.historyLabel}>{I18n.t('History')}</Text>
                                        </View>
                                    : null
                            }
                            <View style={styles.historyPanel}>
                                {
                                    this.state.history.map((item,index)=>{
                                        return <TouchableOpacity key={index} onPress={this.historyItemClick.bind(this,item)}>
                                            <View style={styles.historyItem}>
                                                <Text style={styles.historyContent} numberOfLines={1}>{item.name}</Text>
                                            </View>
                                        </TouchableOpacity>
                                        })
                                }
                            </View>
                        </ScrollView>
                }
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
        flexDirection:'row',
        justifyContent:'flex-start',
        height: 48,
        backgroundColor: '#24293d'
    },
    NavBarImage: {
        width: 48,
        height: 48
    },
    itemPanel:{
        height: 60,
        paddingLeft:16,
    },
    itemContent: {
        fontSize: 14,
        color: '#19293b',
        height: 60,
        textAlignVertical: 'center',
        lineHeight: 60,
        width:width-32
    },
    historyPanel:{
        width: width,
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#ffffff',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        paddingLeft:6,
        paddingRight:16
    },
    historyItem:{
        width: 100,
        height: 34,
        backgroundColor:'#f7f8fa',
        borderRadius:2,
        flexWrap: 'wrap',
        display:'flex',
        flexDirection: 'row',
        justifyContent:'center',
        marginTop:10,
        marginLeft:10
    },
    historyContent:{
        height: 34,
        fontSize:12,
        textAlignVertical:'center',
        textAlign:'center',
        lineHeight: 34
    },
    historyLabelPanel:{
        marginTop:20,
        marginLeft:16
    },
    historyLabel:{
        fontSize: 12,
        color:'#888c95'
    }
})
