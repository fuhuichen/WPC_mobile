import React,{Component} from 'react';
import {
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    TextInput, FlatList, ActivityIndicator, DeviceEventEmitter
} from "react-native";
import RNStatusBar from "../components/RNStatusBar";
import {Actions} from "react-native-router-flux";
import I18n from "react-native-i18n";
import NetInfoIndicator from "../components/NetInfoIndicator";
import GroupInfo from "./GroupInfo";
import dismissKeyboard from "react-native-dismiss-keyboard";
import PicBase64Util from "../utils/PicBase64Util";
import moment from "moment";
import HttpUtil from "../utils/HttpUtil";
const {height} = Dimensions.get('window');const {width} = Dimensions.get('screen');

import store from "../../data/src/stores/Index";
import {inject, observer} from "mobx-react";
@inject('store')
@observer
export default class Visitor extends Component{
    constructor(props){
        super(props);

        this.groups = [
            I18n.t('All'),
            GroupInfo.get(1).name,
            GroupInfo.get(0).name,
            GroupInfo.get(2).name,
            GroupInfo.get(3).name
        ];

        this.state = {
            isLoading: false,
            showFooter: 0,
            currentPage: 0,
            lastPage: true,
            onEndReached: false,
            isRefresh: false,
            onPull: false,
            request: {clause:{}},
            searchContent: '',
            searchIndex: 0,
            data:[]
        };
        store.visitSelector.setPopScreen('visitor');
        this.switch = true;
    }

    componentDidMount(){
        this.fetchData(0);
        this.refreshEmitter = DeviceEventEmitter.addListener('onRefreshVisitor',
            () => {
                this.onRefresh();
            });
    }

    componentWillUnmount(){
        store.visitSelector.setPopScreen(null);
        this.refreshEmitter && this.refreshEmitter.remove();
    }

    fetchData(page) {
        try {
            dismissKeyboard();

            this.switch = false;
            this.setState({isLoading: (page === 0) ? true : false});

            this.state.request.filter = {page:page};
            HttpUtil.post('customer/face/list',this.state.request)
                .then(result => {                
                    result.data.content.forEach((item,index)=>{
                       let newTag = [];
                       item.tags.forEach((itemChild,index)=>{
                            newTag.push(itemChild.content);
                       });
                       item.tags = newTag;
                    });        
                    this.updateStatus(result.data);
                })
                .catch(error=>{
                   this.setFailure();
                });
        }catch (e) {
        }
    }

    updateStatus(data){
        try {
            this.data = data;
            HttpUtil.post('customer/face/register/status',
                {customerIds: data.content.map(item => item.customerId)})
                .then(result=>{
                    this.data.content.forEach((item) =>{
                        let status = 0;
                        let keyItem = result.data.find(p => p.customerId === item.customerId);
                        if (keyItem != null){
                            let keyItemFind = keyItem.registerStatus.find(p => p.storeId == store.visitSelector.storeId)
                            if( keyItemFind != null ){
                                if (keyItemFind.status === 0){
                                    status = 1;
                                }
                            }
                        }
                        else{
                            status = 1;
                        }
                        item.status = status;
                    });

                    this.setState({
                        data: this.state.data.concat(this.data.content),
                        lastPage: this.data.last,
                        showFooter: 0,
                        onEndReached: false,
                        isLoading: false,
                        onPull:false
                    },()=>{
                        this.switch = true;
                    });
                })
                .catch(error=>{
                    this.setFailure();
                })
        }catch (e) {
            this.setFailure();
        }
    }

    setFailure(){
        this.setState({showFooter: 0, onEndReached: false, isLoading: false, onPull:false},
            ()=>{this.switch = true;});
    }

    onChangeText(text){
        this.setState({searchContent:text.trim()});
    }

    onDetail(item,index){
        Actions.push('customerDetail',{
            data: item,
            beginTs: store.visitSelector.beginTs,
            endTs: store.visitSelector.endTs,
            registered: store.visitSelector.mode,
            storeId: store.visitSelector.storeId
        });
    }

    onRetry(item,index){
        Actions.push('register',{
            data: item,
            registered: true,
            storeId: store.visitSelector.storeId
        });
    }

    onRegister(){
        Actions.push('register',{
            registered: false,
            storeId: store.visitSelector.storeId
        });
    }

    async onSearch(){
        let searchReq = this.state.request;

        (this.state.searchContent) !== '' ? (searchReq.clause.name = this.state.searchContent)
            : (await delete searchReq.clause.name);

        if(this.state.searchIndex !== 0){
            searchReq.clause.group = (this.state.searchIndex === 2) ? 0 :
                (this.state.searchIndex !== 1) ? (this.state.searchIndex-1): 1;
        }else{
            (searchReq.clause.group != null) && (await delete searchReq.clause.group);
        }

        this.setState({data:[],request:searchReq},()=>{
            this.fetchData(0);
        });
    }

    onGroup(item,index){
        this.switch && this.setState({searchIndex:index},()=>{
            this.onSearch();
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
                    (this.state.data.length*80 >= height-48-78) ?
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

    renderFooter() {
        if (this.state.showFooter === 1) {
            return (
                <View style={{height: 40, alignItems: 'center', justifyContent: 'center', flexDirection: 'row'}}>
                    <View style={{width: 50, height: 1, backgroundColor: '#dcdcdc'}}></View>
                    <Text style={{color: '#989ba3', fontSize: 10, marginLeft: 10}}>
                        {I18n.t('No further')}
                    </Text>
                    <View style={{width: 50, height: 1, backgroundColor: '#dcdcdc', marginLeft: 10}}></View>
                </View>
            );
        } else if (this.state.showFooter === 2) {
            return (
                <View style={styles.footer}>
                    <ActivityIndicator color={'#989ba3'}/>
                    <Text style={{fontSize: 10, color: '#989ba3'}}>{I18n.t('Loading data')}</Text>
                </View>
            );
        } else if (this.state.showFooter === 0) {
            return null;
        }
    }

    renderLoadingView() {
        return (
            <View style={{flex:1, justifyContent:'center',marginTop:-48-78}}>
                <ActivityIndicator
                    animating={true}
                    color='#dcdcdc'
                    size="large"
                />
                <Text style={{textAlign:'center'}}>{I18n.t('Loading')}</Text>
            </View>
        );
    }

    renderItem(item,index) {
        let success = (item.status === 0) ? false : true;

        let topRow = (<View style={{flexDirection:'row',justifyContent:'space-between'}}>
                <View style={success ? {width:50} : {width:50,opacity:0.6}}>
                    <Text style={{fontSize:14,color:'#19293d'}} numberOfLines={1}>{item.name}</Text>
                </View>
                {
                    !success ? <Text style={{fontSize:12,color:'#f94d49',textAlignVertical:'center',marginLeft:15}}>
                        {I18n.t('Register failed')}
                    </Text> : null
                }
                <View style={{flex:1}}/>
                {
                    !success ? <TouchableOpacity opacity={0.5} onPress={()=>this.onRetry(item,index)}>
                        <View style={{width:74,height:24,backgroundColor:'#f21c65',borderRadius:2}}>
                            <Text style={{fontSize:12,color:'#ffffff',height:24,textAlign:'center',
                                textAlignVertical:'center', ...Platform.select({ios:{lineHeight:24}})}}>
                                {I18n.t('Retry register')}
                            </Text>
                        </View>
                    </TouchableOpacity> : null
                }
            </View>);

        let bottomRow = (<View style={success ? {flexDirection:'row',justifyContent:'flex-start',marginTop:11} : {
            flexDirection:'row',justifyContent:'flex-start',marginTop:6}}>
                <View style={{width:50,height:15,borderRadius:4,backgroundColor:GroupInfo.get(item.group).color,
                    justifyContent:'center'}}>
                    <Text style={success ? styles.visitorName : [styles.visitorName,{opacity: 0.6}]}>
                        {GroupInfo.get(item.group).name}
                    </Text>
                </View>
                {
                    (item.lastVisitingTime != null) ? <Text style={{marginLeft:15,fontSize:12,color:'#989ba3'}}>
                        {I18n.t('Last visiting time')}  {moment(item.lastVisitingTime).format('YYYY/MM/DD HH:mm:ss')}
                    </Text> : <Text style={{marginLeft:15,fontSize:12,color:'#989ba3'}}>
                        {I18n.t('Last visiting time')}  --
                    </Text>
                }
            </View>);

        let registers = (<View style={{flexDirection:'row',alignItems:'center',paddingLeft:16,paddingRight:16}}>
            <Image style={success ? styles.visitorImage : [styles.visitorImage,{opacity:0.6}]}
                   source={PicBase64Util.getJPGSource(item.image)}
                   resizeMode='contain'/>
            <View style={{marginLeft:10,width:width-32-64,height:40,justifyContent:'center'}}>
                {topRow}
                {bottomRow}
            </View>
        </View>);

        return (<View style={{borderBottomWidth:1,borderBottomColor: '#f5f5f5',height:80,justifyContent:'center'}}>
                {
                    success ? <TouchableOpacity opacity={0.5} onPress={()=>this.onDetail(item,index)}>
                        {registers}
                    </TouchableOpacity> : registers
                }
            </View>
        )
    }

    render(){
        let content = (<View style={{flexDirection:'row'}}>
                <TextInput style={styles.searchContent} value={this.state.searchContent}
                           returnKeyType={'search'} onEndEditing={()=>{this.onSearch()}}
                           onChangeText={(text)=>{this.onChangeText(text)}} />
                <Image style={styles.searchIcon} source={require('../assets/images/search_icon.png')}/>
            </View>);

        let groups = (<View style={styles.groups}>
            {
                this.groups.map((item,index)=>{
                    return (
                        <TouchableOpacity opacity={0.5} onPress={()=>this.onGroup(item,index)}>
                            <View style={this.state.searchIndex === index ? [styles.groupPanel,{backgroundColor:'#f21c65'}]
                                : [styles.groupPanel,{backgroundColor:'#f8f7f9'}]}>
                                <Text style={this.state.searchIndex === index ? [styles.groupName,{color:'#ffffff'}]
                                    : [styles.groupName,{color:'#19293b'}]}>{item}</Text>
                            </View>
                        </TouchableOpacity>)})
            }
            </View>);

        let data = (<FlatList
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
        />);

        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.navBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={()=>Actions.pop()} style={{width:40,alignItems:'center'}}>
                        <Image source={require('../assets/images/img_navbar_back.png')} style={{width:48,height:48}}/>
                    </TouchableOpacity>
                    <View style={styles.navBarTitle}>
                        <Text style={styles.navBarText}>{I18n.t('Registered')}</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.5} onPress={()=>this.onRegister()} style={{width:40,alignItems:'center'}}>
                        <Image source={require('../assets/images/img_customer_register.png')} style={{width:48,height:48}}/>
                    </TouchableOpacity>
                </View>
                <NetInfoIndicator/>

                {content}
                {groups}
                {
                    this.state.isLoading ? this.renderLoadingView() : data
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
    navBarPanel: {
        flexDirection: 'row',
        height: 48,
        backgroundColor: '#24293d',
        alignItems: 'center'
    },
    navBarTitle: {
        width:width-80,
        height:48
    },
    navBarText: {
        fontSize: 18,
        height: 48,
        color: '#ffffff',
        textAlign: 'center',
        textAlignVertical: 'center',
        ...Platform.select({
            ios: {
                lineHeight: 48
            }
        })
    },
    searchContent:{
        width:width-32,
        height:34,
        backgroundColor:'#f7f8fc',
        marginLeft:16,
        marginTop:10,
        borderRadius:2,
        textAlignVertical:'center',
        paddingLeft: 30,
        paddingRight: 10,
        ...Platform.select({
            ios:{
                lineHeight: 34
            }
        })
    },
    searchIcon:{
        position:'absolute',
        left: 20,
        top: 17,
        width:20,
        height:20
    },
    searchPanel:{
        width:60,
        height:34,
        backgroundColor:'#f7f8fc',
        marginTop:10,
        justifyContent:'center'
    },
    searchButton:{
        width:50,
        height:24,
        backgroundColor:'#f21c65',
        borderRadius:2
    },
    searchText:{
        fontSize:12,
        height:24,
        textAlign:'center',
        textAlignVertical:'center',
        color:'#ffffff',
        ...Platform.select({
            ios:{
                lineHeight:24
            }
        })
    },
    groups:{
        flexDirection: 'row',
        justifyContent:'space-between',
        paddingLeft: 16,
        paddingRight: 16,
        marginTop: 10
    },
    groupPanel:{
        width:55,
        height:24,
        borderRadius: 2
    },
    groupName:{
        fontSize:12,
        textAlign:'center',
        textAlignVertical:'center',
        height:24,
        ...Platform.select({
            ios:{
                lineHeight:24
            }
        })
    },
    visitorName:{
        fontSize:10,
        color:'#ffffff',
        height:15,
        lineHeight:15,
        textAlign:'center',
        textAlignVertical:'center'
    },
    visitorImage:{
        width:54,
        height:54,
        borderRadius:2,
        backgroundColor:'#000000'
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
    footer:{
        flexDirection:'row',
        height:24,
        justifyContent:'center',
        alignItems:'center',
        marginBottom:10,
        marginTop:10
    }
});
