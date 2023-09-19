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
import EventBus from "../common/EventBus";
import TouchableActive from "../touchables/TouchableActive";
import {getEventStatisticsByStatus} from "../common/FetchRequest";
import NetInfoIndicator from "../components/NetInfoIndicator";
import {REFRESH_EVENT_INFO} from "../common/Constant";
import StoreIndicator from "../customization/StoreIndicator";
import EventCell from "./EventCell";
import PopupEvent from "../customization/PopupEvent";
import ProcessResult from "./ProcessResult";
import StringFilter from "../common/StringFilter";

const {width} = Dimensions.get('screen');
export default class EventSearch extends Component {
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
        actionType: store.enumSelector.actionType.ADD,
        actionResult: null
    };

    componentDidMount(){
        EventBus.closePopupEvent();

        (async () => {
            let {catchSearch, userSelector} = this.state;
            let res = await simpleStore.get('StoreSearch');
            if(res != null){
                res.forEach(item=>{
                    if(item.userId === userSelector.userId){
                        catchSearch = item.search;
                    }
                });
                this.setState({catchSearch});
            }
        })();

        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_EVENT_INFO, () => {
            (async () => {
                await this.onSearch();
            })();
        });
    }

    componentWillUnmount() {
        this.refreshEmitter && this.refreshEmitter.remove();
    }

    updateSearch = (text) => {
        let {enumSelector} = this.state;
        this.setState({search: text.trim(), result:[], viewType: enumSelector.viewType.SUCCESS});
        this.searchBar && this.searchBar.focus();
    };

    onBack(){
        EventBus.closePopupEvent();
        Actions.pop();
    }

    async onSearch() {
        await this.storage();
        try {
            const {enumSelector, search} = this.state;
            this.setState({viewType:enumSelector.viewType.LOADING});

            let result = await getEventStatisticsByStatus({status: [], order: {direction: 'desc', property: 'ts'}});
            if (result.errCode !== enumSelector.errorType.SUCCESS){
                this.setState({result: [], viewType: enumSelector.viewType.FAILURE});
                return;
            }

            let provinces = [...new Set(result.data.map(item => item.province))];
            let stores = [...new Set(result.data.map(item => item.name))];

            let content = result.data.filter(p => p.name.includes(search));
            if(content.length > 0){
                this.setState({provinces, stores, result:content, viewType: enumSelector.viewType.SUCCESS});
            }else{
                this.setState({result: [],viewType:enumSelector.viewType.EMPTY});
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
                               onChangeText={(text) => this.setState({search: StringFilter.all(text.trim(),30)})}
                               value={search}
                               searchIcon={false}
                               returnKeyType={'search'}
                               onSubmitEditing={()=>this.onSearch()}
                               onFocus={()=>{EventBus.closePopupEvent()}}
                    />
                </View>
            </View>
        )
    }

    renderTitle(){
        const {search, result,catchSearch,viewType, enumSelector} = this.state;
        let title = '';
        (search === '') && (catchSearch.length > 0) && (title = I18n.t('Search least'));
        (search !== '') && (result.length > 0) && (title = I18n.t('Search result',{key: result.length}));

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
        let {result, enumSelector} = this.state;
        let cells = [...new Set(result.filter(p => ((p.province === province) && (p.city === city))))];

        return (
            <View style={styles.group}>
                {
                    cells.map((item, index) => {
                        return <EventCell data={{key:item,value:index}} />
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
        const {provinces,result,catchSearch,search,enumSelector,viewType,
            actionType, actionResult} = this.state;

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
                                showsVerticalScrollIndicator={false}/> : null}

                        {(search !== '' && viewType !== enumSelector.viewType.SUCCESS) &&
                            <StoreIndicator viewType={viewType} containerStyle={{marginTop:100}} prompt={I18n.t('Empty store')}/>}
                    </ScrollView>
                    <PopupEvent onTrigger={(actionType,actionResult) => {this.setState({actionType, actionResult})}}/>
                </View>
                <ProcessResult actionType={actionType} actionResult={actionResult} margin={8}
                               reset={() => this.setState({actionResult: null})}/>
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
        maxWidth:206
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
