import React, {Component} from 'react';
import {StyleSheet,
        RefreshControl, 
        View, 
        Text, 
        Dimensions, 
        FlatList, 
        ScrollView, 
        ActivityIndicator,
        TouchableOpacity, 
        DeviceEventEmitter} from "react-native";
import I18n from 'react-native-i18n';
import store from "../../../mobx/Store";
import RecordCell from "./RecordCell";
import TimeUtil from "../../utils/TimeUtil";
import {getStoreList_Cashcheck, getCashCheckReportList} from "../FetchRequest";
import ViewIndicator from "../../customization/ViewIndicator";
import {REFRESH_CASHCHECK_RECORD_LIST} from "../../common/Constant";
import SearchBar from "react-native-elements/dist/searchbar/SearchBar";
import PhoneInfo from "../../entities/PhoneInfo";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import {Actions} from "react-native-router-flux";
import ScrollTop from "../../element/ScrollTop";
import BorderShadow from "../../element/BorderShadow";
import StringFilter from "../../common/StringFilter";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
export default class RecordFragment extends Component {
    state = {
        storeSelector: store.storeSelector,
        enumSelector: store.enumSelector,
        filterSelector: store.filterSelector,
        viewType: store.enumSelector.viewType.FAILURE,
        search: '',
        showScrollTop: false,
        lastPage: true,
        onEndReached: false,
        isRefresh: false,
        onPull:false,
        showFooter: 0, // 0: hidden, 1: no more data, 2: loading
        currentPage: 0,
        data:[]
    };

    componentDidMount(){
        this.fetchData(0, true);

        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_CASHCHECK_RECORD_LIST, () => {
            this.fetchData(0, true);
        });
    }

    componentWillUnmount() {
        this.refreshEmitter && this.refreshEmitter.remove();
    }

    async fetchData(page, load) {
        let {storeSelector, enumSelector} = this.state;

        load && this.setState({viewType:enumSelector.viewType.LOADING, showScrollTop: false});

        if ((storeSelector.storeList != null) && (storeSelector.storeList.length !== 0)){
            await this.parseData(page);
        }else {
            let result = await getStoreList_Cashcheck();
            if (result.errCode === enumSelector.errorType.SUCCESS){
                storeSelector.storeList = result.data;

                this.setState({storeSelector}, async () => {
                    await this.parseData(page);
                })
            } else {
                await this.parseData(page);
            }
        }
    }

    async parseData(page) {
        let {storeSelector} = this.state;

        if(storeSelector.storeList == null || storeSelector.storeList.length === 0){
            this.setState({viewType:store.enumSelector.viewType.EMPTY, onEndReached:false, onPull:false});
            return false;
        }

        let storeTemp = storeSelector.storeList;

        const catchStore = storeSelector.catchRecordStore;
        if(catchStore != null){
            if (catchStore.country !== ''){
                storeTemp = storeTemp.filter(p => p.country === catchStore.country);
            }
            if (catchStore.province !== ''){
                storeTemp = storeTemp.filter(p => p.province === catchStore.province);
            }
            if (catchStore.city !== ''){
                storeTemp = storeTemp.filter(p => p.city === catchStore.city);
            }

            storeTemp = [...Array.from(new Set(storeTemp))];
        }

        await this.getRecordList(storeTemp, page);
    }

    async getRecordList(storeTemp, page) {
        let {data, search} = this.state;
        let storeIds = [];
        let {enumSelector, filterSelector} = this.state;
        storeTemp.forEach(item=>{
            storeIds.push(item.storeId);
        })
        let body = {
            storeIds: storeIds,
            status: filterSelector.cashcheckRecord.status,
            filter: {
                page: page,
                size: 10
            },
            order: {
                direction: filterSelector.cashcheckRecord.order,
                property: "reportTs"
            },
            beginTs: filterSelector.cashcheckRecord.beginTs,
            endTs: filterSelector.cashcheckRecord.endTs,
        }
        if(search != '') {
            body.keyword = search;
        }
        let result = await getCashCheckReportList(body);
        if (result.errCode === enumSelector.errorType.SUCCESS){
            if(page == 0) {
                data = result.data.content;
            } else {
                data = data.concat(result.data.content);
            }
            this.setState({                
                lastPage: result.data.last,
                viewType: data.length > 0 ? enumSelector.viewType.SUCCESS : enumSelector.viewType.EMPTY, 
                onPull: false,
                onEndReached: false,
                currentPage: page,
                showFooter: result.data.last ? (page > 0 ? 1 : 0) : 2,
                data
            });
        } else {
            this.setState({viewType:enumSelector.viewType.FAILURE, onEndReached:false, onPull:false});
        }
    }

    updateSearch = (text) => {
        this.setState({search: StringFilter.all(text.trim(),30)});
    };

    onClear(){
        this.setState({search: ''}, function() {
            this.fetchData(0, true);
        });        
    }

    onSearch(){
        this.fetchData(0, true);
    }

    onEndReached(){        
        const {data} = this.state;

        try {
            if(this.state.lastPage) {
                {
                    (data.length*80 >= (height-48)) ? this.setState({showFooter: 1})
                        : this.setState({showFooter: 0});
                    return;
                }
            }

            if(!this.state.onEndReached){
                let page = ++this.state.currentPage;
                this.setState({onEndReached:true, showFooter:2}, function() {
                    this.fetchData(page,false);
                });
            }
        }catch(e){
        }
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

    renderOperator(){
        let {search, enumSelector} = this.state, searchWidth = width-80, marginLeft = 0;
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
                <SearchBar placeholder={I18n.t('Enter search record')}
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
            <TouchableOpacity activeOpacity={0.6} onPress={() => {Actions.push('cashcheckRecordfilter')}}>
                <Text style={[styles.filter,{marginLeft}]}>{I18n.t('Filter')}</Text>
            </TouchableOpacity>
        </View>)
    }

    renderItem({item, index}){
        let {data} = this.state;
        return (
            <RecordCell data={item} length={data.length} index={index}/>
        )
    }

    render() {
        const {viewType, enumSelector, data, showScrollTop} = this.state;        

        return <View style={styles.container}>
            {this.renderOperator()}
            {
                (viewType !== enumSelector.viewType.SUCCESS) && 
                <ViewIndicator viewType={viewType}
                                containerStyle={{marginTop:100}}
                                refresh={() => {(async ()=> this.fetchData(0, true))()}}
                />
            }
            
            {
                (viewType === enumSelector.viewType.SUCCESS) && <View>
                    <ScrollView style={{marginTop:10}}
                                showsVerticalScrollIndicator={false}
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
                    </ScrollView>
                    <View style={{marginTop:-50}}>
                        <ScrollTop showOperator={showScrollTop} onScroll={() => {this.scroll && this.scroll.scrollTo({x:0,y:0,animated:true})}} />
                    </View>
                </View>
            }
        </View>
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft:10,
        paddingRight:10
    },
    cityGroup:{
        paddingBottom:30,
        borderBottomColor:'#fff'
    },
    list:{
        marginTop:24,
        backgroundColor:'#EDF0F2',
        borderRadius:10,
        paddingLeft:10,
        paddingRight:10
    },
    listView:{
        backgroundColor:'#fff',
        borderRadius:10,
        paddingBottom:12,
        paddingLeft:16,
        paddingRight: 16,
        //marginTop:10,
        //marginLeft:10,
        //marginRight:10,
        marginBottom: 60
    },
    group:{
        flexDirection:'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems:'center'
    },
    cityText:{
        fontSize:14,
        color:'#85898E',
        marginTop:14,
        marginLeft:5,
        marginBottom:5
    },
    divider:{
        marginLeft:3,
        marginRight:3,
        height:2,
        backgroundColor:'#F7F9FA',
        borderBottomWidth:0
    },
    operator:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        marginTop:10,
        paddingRight:10
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
    },
    cellView:{
        backgroundColor:'#fff',
        borderRadius:10,
        width:width-22,
        marginLeft:1,
        paddingLeft:16,
        paddingRight: 16
    }
});
