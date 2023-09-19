import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, FlatList, ScrollView, TouchableOpacity, DeviceEventEmitter} from "react-native";
import StorePicker from "../components/StorePicker";
import store from "../../mobx/Store";
import {getScheduleList} from "../common/FetchRequest";
import ViewIndicator from "../customization/ViewIndicator";
import I18n from 'react-native-i18n';
import moment from 'moment';
import ScheduleGroup from "./ScheduleGroup";
import SearchBar from "react-native-elements/dist/searchbar/SearchBar";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import PhoneInfo from "../entities/PhoneInfo";
import {Actions} from "react-native-router-flux";
import StringFilter from "../common/StringFilter";

const {width} = Dimensions.get('screen');
export default class AllScheduleFragment extends Component {
    state = {
        storeSelector: store.storeSelector,
        enumSelector: store.enumSelector,
        userSelector: store.userSelector,
        filterSelector: store.filterSelector,
        viewType: store.enumSelector.viewType.FAILURE,
        data: [],
        search: ''
    };

    componentDidMount(){
        let {filterSelector} = this.state;
        filterSelector.initSchedule();
        this.setState({filterSelector},async () => {
            this.loadData();
        });

        this.emitter = DeviceEventEmitter.addListener('OnSchedule', () => {
            this.loadData();
        });
    }

    componentWillUnmount() {
        this.emitter && this.emitter.remove();
    }


    loadData(){
        let {enumSelector} = this.state;
        this.setState({data: [], viewType: enumSelector.viewType.LOADING}, async () => {
            await this.fetchData(0);
        });
    }

    async fetchData(page){
        let {enumSelector, data, userSelector, search, filterSelector} = this.state;

        let body = {
            filter: {
                page: page,
                size: 100
            },
            order: {
                direction: filterSelector.schedule.order,
                property: 'remindTime'
            },
            userId: userSelector.userId,
            beginTs: filterSelector.schedule.beginTs,
            endTs: filterSelector.schedule.endTs
        };

        // 轉為utc時間
        let beginDay = moment(body.beginTs).format("YYYY/MM/DD");
        let endDay = moment(body.endTs).format("YYYY/MM/DD");
        let newBeginTs = moment.utc(beginDay).startOf('day').unix()*1000;
        let newEndTs = moment.utc(endDay).endOf('day').unix()*1000;
        body.beginTs = newBeginTs;
        body.endTs = newEndTs;

        if(search != '') {
            body.keyword = search;
        }

        if(filterSelector.schedule.isExecute != null) {
            body.isExecute = filterSelector.schedule.isExecute;
        }

        if(filterSelector.schedule.tagMode != null) {
            body.tagMode = filterSelector.schedule.tagMode;
        }

        let viewType = enumSelector.viewType.FAILURE;
        let result = await getScheduleList(body);

        if (result.errCode === enumSelector.errorType.SUCCESS){
            data = data.concat(result.data.content);
            viewType = (data.length > 0) ? enumSelector.viewType.SUCCESS : enumSelector.viewType.EMPTY;
        } else {
            if(result.errCode == enumSelector.errorType.NONETITLE) {                
                DeviceEventEmitter.emit('Toast', I18n.t('Account permission'));
            }
        }

        (page !== 0) && (viewType = this.state.viewType);
        this.setState({data, viewType}, () => {
            let lastPage = (result.errCode === enumSelector.errorType.SUCCESS) ? result.data.last : false;
            this.group && this.group.setProperty({lastPage});
        })
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
                await this.fetchData(0);
            });
        }catch (e) {
        }
    }

    updateSearch = (text) => {
        this.setState({search: StringFilter.all(text.trim(),30)});
    };

    onClear(){
        this.onRefresh();
    }

    onSearch(){
        this.onRefresh();
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
                <SearchBar placeholder={I18n.t('Enter search store')}
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
            <TouchableOpacity activeOpacity={0.6} onPress={() => {Actions.push('scheduleFilter', {type: enumSelector.scheduleType.ALL})}}>
                <Text style={[styles.filter,{marginLeft}]}>{I18n.t('Filter')}</Text>
            </TouchableOpacity>
        </View>)
    }

    render() {
        const {viewType, enumSelector, data, storeSelector} = this.state;

        return <View style={styles.container}>
            {this.renderOperator()}
            {
                (viewType !== enumSelector.viewType.SUCCESS) && <ViewIndicator viewType={viewType}
                                    containerStyle={{marginTop:100}}
                                    refresh={() => this.loadData()}/>
            }
            {(viewType === enumSelector.viewType.SUCCESS) && <View>
                <ScheduleGroup ref={c => this.group = c}
                              data={data}
                              onFetch={(page) => this.fetchData(page)}/>
                              
            </View>}
        </View>
    }
}

const styles = StyleSheet.create({
   container:{
       flex:1,
       paddingLeft:10,
       paddingRight:10
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
   }
});

