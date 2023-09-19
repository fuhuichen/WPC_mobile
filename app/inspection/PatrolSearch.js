import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    TouchableOpacity,
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
import NetInfoIndicator from "../components/NetInfoIndicator";
import StringFilter from "../common/StringFilter";
import PatrolGroup from "./PatrolGroup";
import AndroidBacker from "../components/AndroidBacker";
import ViewIndicator from "../customization/ViewIndicator";
import BasePatrol from "../customization/BasePatrol";

const {width} = Dimensions.get('screen');
export default class PatrolSearch extends BasePatrol {
    state = {
        search: '',
        result: [],
        catchSearch:[],
        viewType: store.enumSelector.viewType.EMPTY,
        enumSelector: store.enumSelector,
        userSelector: store.userSelector,
        patrolSelector: store.patrolSelector,
        screenSelector: store.screenSelector
    };

    componentDidMount(){
        (async () => {
            await this.dataParser();
        })();
    }

    async dataParser(){
        let {catchSearch,userSelector,storeSelector} = this.state;
        let res = await simpleStore.get('PatrolSearch');
        if(res != null){
            res.forEach(item=>{
                if(item.userId === userSelector.userId){
                    catchSearch = item.search;
                }
            })
            this.setState({catchSearch});
        }
    }

    updateSearch = (text) => {
        let {enumSelector} = this.state;
        this.setState({
            search: StringFilter.all(text.trim(), 30),
            result:[],
            viewType: enumSelector.viewType.SUCCESS
        });
        this.searchBar && this.searchBar.focus();
    };


    onBack(){
        let {patrolSelector, screenSelector} = this.state;
        patrolSelector.router = screenSelector.patrolType.PATROL;

        this.setState({patrolSelector}, () => {
           EventBus.updatePatrolData();
            Actions.pop();
        });
    }

    async onSearch() {
        try {
            await this.storage();

            let {enumSelector, patrolSelector, viewType, search} = this.state, result = [];
            this.setState({result: [], viewType: enumSelector.viewType.LOADING},() => {

                patrolSelector.data.forEach((item) => {
                    let items = [];
                    item.groups.map(p => items.push(...p.items));
                    items = items.filter(p => p.subject.includes(search));

                    (items.length > 0) && result.push({id: item.id, groupName: item.name, items, expansion: true});
                });

                viewType = (result.length > 0) ? enumSelector.viewType.SUCCESS : enumSelector.viewType.EMPTY;
                patrolSelector.search = result;

                this.setState({patrolSelector, result, viewType});
            });
        }catch (e) {
        }
    }

    async storage(){
        let {search,catchSearch,userSelector} = this.state;
        let storeSearch = [];
        let records = {userId:'',search:[]};
        let res = await simpleStore.get('PatrolSearch');
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
        simpleStore.save('PatrolSearch',storeSearch);
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
                               placeholder={I18n.t('Enter inspection name')}
                               underlineColorAndroid={'#006AB7'}
                               containerStyle={styles.container}
                               inputContainerStyle={styles.inputView}
                               inputStyle={styles.input}
                               onChangeText={this.updateSearch}
                               value={search}
                               searchIcon={false}
                               returnKeyType={'search'}
                               onSubmitEditing={() => this.onSearch()}
                               onFocus={() => {EventBus.closePopupPatrol()}}
                    />
                </View>
            </View>
        )
    }

    renderTitle(){
        const {search, result,catchSearch} = this.state;
        let title = '';
        (search === '') && (catchSearch.length > 0) && (title = I18n.t('Search least'));
        (search !== '') && (result.length > 0) && (title = I18n.t('Search result',
            {key: result.reduce((p,e) => p + e.items.length, 0)}));

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

    onGroup(item){
        let {result, patrolSelector} = this.state;
        let group = result.find(p => p.id === item.id);
        group.expansion = !item.expansion;

        if (patrolSelector.visible && (patrolSelector.collection != null)
            && (patrolSelector.collection.rootId === item.id)){
            patrolSelector.visible = false;
        }

        this.setState({result, patrolSelector}, () => {
            EventBus.updateBasePatrol();
        });
    }

    render() {
        const {result,catchSearch,search,enumSelector,viewType} = this.state;

        return (
            <TouchableActive>
                {this.renderSearchBar()}
                <NetInfoIndicator/>
                <View style={styles.main}>
                    {this.renderTitle()}
                    {search === '' && catchSearch.length > 0 ? this.renderRecord() : null}

                    {search !== '' && result.length > 0 ? <View style={styles.data}>
                        <PatrolGroup data={result} onGroup={(item) => this.onGroup(item)}/>
                    </View> : null}
                    {(search !== '' && viewType !== enumSelector.viewType.SUCCESS) &&
                    <ViewIndicator viewType={viewType} containerStyle={{marginTop:100}} />}
                </View>
                <AndroidBacker onPress={() => {
                    this.onBack();
                    return true;
                }}/>
            </TouchableActive>
        )
    }
}

const styles = StyleSheet.create({
    main:{
        backgroundColor:'#F7F9FA',
        flex:1
    },
    content:{
        paddingLeft: 16,
        paddingRight: 16
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
        marginLeft:24,
        color:'#3B3737'
    },
    group:{
        flexDirection:'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems:'center',
    },
    data:{
        marginTop:16,
        flex:1
    }
});
