import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    TouchableOpacity,
    FlatList,
    DeviceEventEmitter,
    Platform,
    ScrollView
} from "react-native";
import {SearchBar} from "react-native-elements";
import I18n from 'react-native-i18n';
import {Actions} from "react-native-router-flux";
import * as simpleStore from "react-native-simple-store";
import store from "../../mobx/Store";
import StoreCell from "./StoreCell";
import EventBus from "../common/EventBus";
import PopupStore from "../customization/PopupStore";
import TouchableActive from "../touchables/TouchableActive";
import TimeUtil from "../utils/TimeUtil";
import {getStatusList} from "../common/FetchRequest";
import NetInfoIndicator from "../components/NetInfoIndicator";
import {REFRESH_STORE_INFO} from "../common/Constant";
import StoreIndicator from "../customization/StoreIndicator";
import StringFilter from "../common/StringFilter";

const {width} = Dimensions.get('screen');
export default class StoreSearch extends Component {
    state = {
        search: '',
        result: [],
        provinces:[],
        stores:[],
        storeList:[],
        catchSearch:[],
        viewType: store.enumSelector.viewType.SUCCESS,
        enumSelector: store.enumSelector,
        userSelector: store.userSelector,
        storeSelector: store.storeSelector,
        resetSearch: false
    };

    componentDidMount(){
        this.dataParser();

        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_STORE_INFO, () => {
            this.updateSearch(this.state.search);
        });
    }

    componentWillUnmount() {
        this.refreshEmitter && this.refreshEmitter.remove();
    }

    async dataParser(){
        let {provinces,stores,catchSearch,userSelector,storeSelector} = this.state;
        let res = await simpleStore.get('StoreSearch');
        if(res != null){
            res.forEach(item=>{
                if(item.userId === userSelector.userId){
                    catchSearch = item.search;
                }
            })
            this.setState({catchSearch});
        }
        provinces = storeSelector.storeList.map(item => item.province);
        stores = storeSelector.storeList.map(item => item.name);

        this.setState({provinces: [...new Set(provinces)],stores: [...new Set(stores)]});
    }

    updateSearch = (text) => {
        let {enumSelector} = this.state;
        this.setState({
            search: text.trim(),//StringFilter.all(text.trim(), 30),
            result:[],
            viewType: enumSelector.viewType.SUCCESS
        });
        this.searchBar && this.searchBar.focus();
    };

    async getStoreList(searchData) {
        let {enumSelector} = this.state;

        let result = await getStatusList({
            beginTs:TimeUtil.getNowDay()[0],
            endTs:TimeUtil.getNowDay()[1],
            storeIds:searchData.map(p => p.storeId)
        });

        if(result.errCode !== enumSelector.errorType.SUCCESS){
            this.setState({viewType:enumSelector.viewType.FAILURE});
            return false;
        }

        let data = [];
        result.data.forEach(r_item=>{
            let resData = {};
            searchData.forEach(t_item=>{
                if (r_item.storeId === t_item.storeId){
                    resData.storeId = r_item.storeId;
                    resData.inspectTask = r_item.inspectTask;
                    resData.lastInspect = r_item.lastInspect;
                    resData.city = t_item.city;
                    resData.country = t_item.country;
                    resData.province = t_item.province;
                    resData.name = t_item.name;
                    resData.address = t_item.address;
                    resData.status = t_item.status;
                    data.push(resData);
                }
            })
        })
        this.setState({result: data, viewType:enumSelector.viewType.SUCCESS, resetSearch: false});
    }

    onBack(){
        EventBus.closePopupStore();
        Actions.pop();
    }

    async onSearch() {
        await this.storage();

        try {
            const {stores,enumSelector, storeSelector, search} = this.state;
            this.setState({viewType:enumSelector.viewType.LOADING});

            let content = storeSelector.storeList.filter(p => p.name.includes(search));
            if(content.length > 0){
                await this.getStoreList(content);
            }else{
                this.setState({result: [],viewType:enumSelector.viewType.EMPTY, resetSearch: false});
            }
        }catch (e) {
            console.log("StoreSearch-searchStore:" + e);
        }
    }

    async storage(){
        let {search,catchSearch,userSelector} = this.state;
        let storeSearch = [];
        let records = {userId:'',search:[]};
        let res = await simpleStore.get('StoreSearch');
        if(res !== null){
            storeSearch = res;
        }
        if(storeSearch !== null && storeSearch.findIndex(p=>p.userId===userSelector.userId) !== -1){
            storeSearch.forEach((item,index)=>{
                if(item.userId === userSelector.userId){
                    item.search.unshift(search);
                    item.search = [...new Set(item.search)];
                    item.search = item.search.slice(0,5);
                    catchSearch = item.search;
                    storeSearch[index] = item;
                }
            })
        }else{
            records.userId = userSelector.userId;
            records.search.unshift(search);
            records.search = records.search.slice(0,5);
            storeSearch.push(records);
            catchSearch = records.search;
        }
        simpleStore.save('StoreSearch',storeSearch);
        this.setState({catchSearch});
    }

    renderSearchBar(){
        const { search } = this.state;

        return (
            <View style={{backgroundColor:'#F7F9FA'}}>
                <View style={styles.panel}>
                    <TouchableOpacity activeOpacity={1} onPress={()=>{this.onBack()}}>
                        <Image style={styles.close} source={require('../assets/img_head_close.png')}/>
                    </TouchableOpacity>
                    <SearchBar ref={c => this.searchBar = c}
                               placeholder={I18n.t('Enter store name')}
                               underlineColorAndroid={'#006AB7'}
                               containerStyle={styles.container}
                               inputContainerStyle={styles.inputView}
                               inputStyle={styles.input}
                               onChangeText={this.updateSearch}
                               value={search}
                               searchIcon={false}
                               returnKeyType={'search'}
                               onSubmitEditing={()=>this.onSearch()}
                               onFocus={()=>{EventBus.closePopupStore()}}
                    />
                </View>
            </View>
        )
    }

    renderTitle(){
        const {search, result, catchSearch, resetSearch} = this.state;

        if(search === '' && resetSearch === false) {
            this.setState({resetSearch: true});
        }

        let title = '';
        (search === '') && (catchSearch.length > 0) && (title = I18n.t('Search least'));
        (search !== '') && (resetSearch === false) && (result.length >= 0) && (title = I18n.t('Search result',{key: result.length}));

        return (<Text style={styles.title}>{title}</Text>)
    }

    renderRecord() {
        const {catchSearch} = this.state;

        return (
            <View style={styles.content}>
                <View style={{flexDirection: 'row',flexWrap: 'wrap'}}>
                {
                   catchSearch.map((item)=> {
                       return <TouchableOpacity activeOpacity={0.5} onPress={()=>{this.updateSearch(item)}}>
                                    <View style={styles.record}>
                                        <Text style={{fontSize:12,color:'#006AB7'}} numberOfLines={1}>{item}</Text>
                                    </View>
                              </TouchableOpacity>
                   })
                }
                </View>
            </View>
        )
    }

    renderStore(province, city){
        let {result} = this.state;
        let cells = [...new Set(result.filter(p => ((p.province === province) && (p.city === city))))];

        return (
            <View style={styles.group}>
                {
                    cells.map((item, index) => {
                        return <StoreCell data={{key:item,value:index}}/>
                    })
                }
            </View>
        )
    }

    renderItem({item}){
        const {result} = this.state;
        const city = [...new Set(result.filter(p => p.province === item)
            .map(v => v.city))];

        return (
            <TouchableActive clearCollection={true}>
                {city.length > 0 ? <View style={{paddingBottom:10}}>
                    <Text style={styles.province}>{item}</Text>
                    {
                        city.map((name) => {
                            return (
                                <View>
                                    <Text style={styles.city}>{name}</Text>
                                    {this.renderStore(item,name)}
                                </View>
                            )
                        })
                    }
                </View> : null}
            </TouchableActive>
        )
    }

    render() {
        const {provinces,result,catchSearch,search,enumSelector,viewType} = this.state;

        return (
            <TouchableActive>
                {this.renderSearchBar()}
                <NetInfoIndicator/>
                <View style={styles.main}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {this.renderTitle()}
                        {search === '' && catchSearch.length > 0 ? this.renderRecord() : null}

                        {search !== '' && result.length > 0 ? <FlatList style={styles.data}
                                data={provinces}
                                initialNumToRender={100}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={this.renderItem.bind(this)}
                                showsVerticalScrollIndicator={false}/>
                        : null}
                        {(search !== '' && viewType !== enumSelector.viewType.SUCCESS) &&
                            <StoreIndicator viewType={viewType} containerStyle={{marginTop:100}} prompt={I18n.t('Empty store')}/>}
                    </ScrollView>
                    <PopupStore />
                </View>
            </TouchableActive>
        )
    }
}

const styles = StyleSheet.create({
    main:{
        paddingLeft:16,
        paddingRight:16,
        backgroundColor:'#F7F9FA',
        flex:1
    },
    close:{
        marginLeft:16,
        marginRight:4,
        width:20,
        height:20
    },
    province:{
        color:'#3B3737',
        fontSize:15,
        marginTop:15,
        marginLeft:8
    },
    city:{
        color:'#3B3737',
        fontSize:13,
        marginTop:11,
        marginLeft:8
    },
    record:{
        borderWidth:1,
        borderColor:'#006AB7',
        borderRadius:10,
        marginRight:8,
        height:30,
        paddingLeft:12,
        paddingRight:12,
        justifyContent:'center',
        marginTop:12,
        backgroundColor:'#fff',
        maxWidth:width-34
    },
    panel:{
        flexDirection:'row',
        alignItems: 'center',
        height:Platform.select({android:56, ios:78}),
        backgroundColor:'#006AB7',
        borderBottomStartRadius:10,
        borderBottomEndRadius:10
    },
    container:{
        height:28,
        marginRight:16,
        backgroundColor:'#006AB7',
        borderTopColor:'#006AB7',
        borderBottomColor:'#006AB7',
        justifyContent:'center'
    },
    inputView:{
        width:width-64,
        height:38,
        borderRadius:10,
        backgroundColor:'#fff',
    },
    input:{
        fontSize:12
    },
    title:{
        fontSize: 19,
        marginTop:20,
        marginLeft:8,
        color:'#3B3737'
    },
    group:{
        flexDirection:'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems:'center',
    },
    data:{
        flex:1
    }
});
