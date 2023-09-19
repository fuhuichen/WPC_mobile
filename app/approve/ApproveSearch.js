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
import dismissKeyboard from 'react-native-dismiss-keyboard';
import * as simpleStore from "react-native-simple-store";
import store from "../../mobx/Store";
import TouchableActive from "../touchables/TouchableActive";
import NetInfoIndicator from "../components/NetInfoIndicator";
import {APPROVE_SUCCESS, REFRESH_APPROVE_INFO} from "../common/Constant";
import ProcessResult from "../event/ProcessResult";
import StringFilter from "../common/StringFilter";
import ApproveGroup from "./common/ApproveGroup";
import {getWorkflowForm, getWorkflowTask, getWorkflowTaskList} from "../common/FetchRequest";
import {ApproveCore} from "./common/ApproveCore";
import ViewIndicator from "../customization/ViewIndicator";
import * as lib from '../common/PositionLib';

const {width} = Dimensions.get('screen');
export default class ApproveSearch extends Component {
    state = {
        search: '',
        data: [],
        catchSearch:[],
        viewType: store.enumSelector.viewType.SUCCESS,
        enumSelector: store.enumSelector,
        userSelector: store.userSelector,
        storeSelector: store.storeSelector,
        approveSelector: store.approveSelector,
        actionResult: null,
        actionTitle: ''
    };

    componentDidMount(){
        (async () => {
            let {catchSearch, userSelector} = this.state;
            let res = await simpleStore.get('ApproveSearch');
            if(res != null){
                res.forEach(item=>{
                    if(item.userId === userSelector.userId){
                        catchSearch = item.search;
                    }
                });
                this.setState({catchSearch});
            }
        })();

        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_APPROVE_INFO, () => {
            (async () => {
                await this.onSearch();
            })();
        });

        this.promptEmitter = DeviceEventEmitter.addListener(APPROVE_SUCCESS, (data) => {
            if (data.type === approveSelector.screenType.SEARCH){
                this.setState({actionResult: true, actionTitle: data.prompt});
            }

            (async () => {
                await this.onSearch();
            })();
        });

        let {approveSelector} = this.state;
        approveSelector.screen = approveSelector.screenType.SEARCH;
        this.setState({approveSelector});
    }

    componentWillUnmount() {
        this.refreshEmitter && this.refreshEmitter.remove();
        this.promptEmitter && this.promptEmitter.remove();
    }

    updateSearch = (text) => {
        this.setState({search: text.trim()},() => {
            this.loadData();
        });
    };

    onBack(){
        let {approveSelector} = this.state;
        approveSelector.screen = approveSelector.screenType.MAIN;
        this.setState({approveSelector}, () => {
            DeviceEventEmitter.emit(REFRESH_APPROVE_INFO);
            Actions.pop();
        });
    }

    async onSearch(page) {
        await this.storage();
        this.loadData();
    }

    loadData(){
        let {enumSelector} = this.state;
        this.setState({data: [], viewType: enumSelector.viewType.LOADING}, async () => {
            await this.fetchData(0);
        })
    }

    async fetchData(page){
        try {
            let {enumSelector, approveSelector, data, search, userSelector} = this.state;

            let body = ApproveCore.formatRequest();
            body.storeId = [];
            body.keyword = search;
            body.page = page;
            body.type = approveSelector.type
            body.isMysteryMode = userSelector.isMysteryModeOn;

            let result = await getWorkflowTaskList(body);
            let viewType = enumSelector.viewType.FAILURE;
            if (result.errCode === enumSelector.errorType.SUCCESS){
                data = data.concat(result.data.content);
                viewType = (data.length > 0) ? enumSelector.viewType.SUCCESS : enumSelector.viewType.EMPTY;
            }

            (page !== 0) && (viewType = this.state.viewType);
            this.setState({data, viewType}, () => {
                let lastPage = (result.errCode === enumSelector.errorType.SUCCESS) ? result.data.last : false;
                this.group && this.group.setProperty({lastPage: result.data.last});
            });
        }catch (e) {
        }
    }

    async storage(){
        let {search,catchSearch,userSelector} = this.state;
        if (search.trim() === ''){
            return
        }

        let storeSearch = [];
        let records = {userId:'',search:[]};
        let res = await simpleStore.get('ApproveSearch');
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
        simpleStore.save('ApproveSearch',storeSearch);
        this.setState({catchSearch});
    }

    renderSearchBar(){
        const { search } = this.state;

        return (
            <View style={{backgroundColor:'#F7F9FA'}}>
                <View style={styles.panel}>
                    <TouchableOpacity activeOpacity={1} onPress={() => {this.onBack()}}>
                        <Image style={styles.close} source={require('../assets/img_head_close.png')}/>
                    </TouchableOpacity>
                    <SearchBar ref={c => this.searchBar = c}
                               placeholder={I18n.t('Approves placeholder')}
                               underlineColorAndroid={'#006AB7'}
                               containerStyle={styles.container}
                               inputContainerStyle={styles.inputView}
                               inputStyle={styles.input}
                               onChangeText={(text) => this.setState({search: StringFilter.all(text.trim(),30)})}
                               value={search}
                               searchIcon={false}
                               returnKeyType={'search'}
                               onSubmitEditing={() => this.onSearch()}/>
                </View>
            </View>
        )
    }

    renderTitle(){
        const {search, data,catchSearch} = this.state;
        let title = '';
        (search === '') && (catchSearch.length > 0) && (title = I18n.t('Search least'));
        (search !== '') && (data.length > 0) && (title = I18n.t('Search result',{key: data.length}));

        return (<Text style={styles.title}>{title}</Text>)
    }

    renderRecord() {
        const {catchSearch} = this.state;

        return (
            <View style={styles.content}>
                <View style={{flexDirection: 'row',flexWrap: 'wrap'}}>
                {
                   catchSearch.map((item)=> {
                       return <TouchableOpacity activeOpacity={0.5} onPress={() => {this.updateSearch(item)}}>
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

    render() {
        const {data,catchSearch,search,enumSelector,viewType, actionResult, actionTitle, approveSelector} = this.state;
        let unCommitted = (approveSelector.type === enumSelector.approveType.UNCOMMITTED);

        return (
            <TouchableActive>
                {this.renderSearchBar()}
                <NetInfoIndicator/>
                <View style={styles.main}>
                    <ScrollView showsVerticalScrollIndicator={false}
                                scrollEnabled={false}
                                onScroll={(evt) => {dismissKeyboard()}}>
                        {this.renderTitle()}
                        {search === '' && catchSearch.length > 0 ? this.renderRecord() : null}

                        {search !== '' && data.length > 0 && <ApproveGroup ref={c => this.group = c}
                                                                          data={data}
                                                                          showSubmitter={!unCommitted}
                                                                          onFetch={(page) => this.fetchData(page)}
                                                                          verticalOffset={Platform.select({
                                                                              android:130,
                                                                              ios: lib.defaultStatusHeight()+150
                                                                          })}/>}

                        {(search !== '' && viewType !== enumSelector.viewType.SUCCESS) &&
                            <ViewIndicator viewType={viewType}
                                            containerStyle={{marginTop:100}}
                                            refresh={() => this.loadData()}
                            />}
                    </ScrollView>
                </View>
                <ProcessResult actionResult={actionResult} title={actionTitle} margin={8}
                               reset={() => this.setState({actionResult: null})}/>
            </TouchableActive>
        )
    }
}

const styles = StyleSheet.create({
    main:{
        paddingLeft:10,
        paddingRight:10,
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
    }
});
