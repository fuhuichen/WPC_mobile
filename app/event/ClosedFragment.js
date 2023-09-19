import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, FlatList, ScrollView, TouchableOpacity, DeviceEventEmitter} from "react-native";
import I18n from 'react-native-i18n';
import store from "../../mobx/Store";
import EventBus from "../common/EventBus";
import Divider from "react-native-elements/dist/divider/Divider";
import BaseStore from "../customization/BaseStore";
import StoreIndicator from "../customization/StoreIndicator";
import {getEventStatisticsByStatus} from "../common/FetchRequest";
import EventCell from "./EventCell";
import SlotEvent from "../customization/SlotEvent";
import StorePicker from "../components/StorePicker";
import {EventCore} from "./EventCore";
import {REFRESH_STORE_LIST} from "../common/Constant";

const {width} = Dimensions.get('screen');
export default class ClosedFragment extends BaseStore {
    state = {
        storeData: [],
        enumSelector: store.enumSelector,
        eventSelector: store.eventSelector,
        storeSelector: store.storeSelector,
        viewType: store.enumSelector.viewType.FAILURE,
        data: []
    };

    componentDidMount(){
        (async ()=> {
            await this.fetchData();
        })();

        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_STORE_LIST, () => {
            (async ()=> {
                await this.fetchData();
            })();
        });
    }

    componentWillUnmount() {
        this.refreshEmitter && this.refreshEmitter.remove();
    }

    async fetchData(){
        let {enumSelector, eventSelector, viewType} = this.state, data = [];
        this.setState({viewType: enumSelector.viewType.LOADING});

        let storeIds = await EventCore.getEventStore();
        if(storeIds == -1) {
            this.setState({data, viewType: enumSelector.viewType.EMPTY});
        } else {
            let result = await getEventStatisticsByStatus({storeIds:storeIds,status: [], order: {direction: 'desc', property: 'ts'}});
            if (result.errCode !== enumSelector.errorType.SUCCESS){
                this.setState({viewType: enumSelector.viewType.FAILURE});
                return;
            }

            let eventClosed = result.data.filter(p => (p.numOfInprocess + p.numOfUnprocessed + p.numOfRejected) === 0);
            if (eventClosed.length > 0){
                data.push({title: I18n.t('Event closed store'), stores: eventClosed});
                viewType = enumSelector.viewType.SUCCESS;
            }else {
                viewType = enumSelector.viewType.EMPTY;
            }

            this.setState({data, viewType});
        }
    }

    onChange(data){
        EventBus.closeModalAll();
        this.fetchData();
    }

    renderItem = ({ item,index}) => {
        let {eventSelector} = this.state;
        return (
            <TouchableOpacity activeOpacity={1} onPress={()=>{
                eventSelector.collection = null;
                this.setState({eventSelector});
                EventBus.closeModalAll();
            }}>
                <View style={styles.groupPanel}>
                    <Text style={styles.type}>{item.title}</Text>
                    <View style={styles.group}>
                        {
                            item.stores.map((key,value) =>{
                                return <EventCell data={{key,value}} type={item.type}/>
                            })
                        }
                    </View>
                </View>
            </TouchableOpacity>
        )
    };

    render() {
        const {viewType, enumSelector, data,storeSelector} = this.state;

        return <View style={styles.container}>
             <StorePicker
                    type='event'
                    data={storeSelector.storeList}
                    onChange={(p)=>this.onChange(p)}/>
            {
                (viewType !== enumSelector.viewType.SUCCESS) && <StoreIndicator viewType={viewType}
                                    containerStyle={{marginTop:100}} prompt={I18n.t('Empty store')}
                                    refresh={() => {(async ()=> this.fetchData())()}}/>
            }
            {
                (viewType === enumSelector.viewType.SUCCESS) &&
                <View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <FlatList style={styles.list}
                        data={data}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderItem}
                        ItemSeparatorComponent={() => <Divider style={styles.divider}/>}
                        showsVerticalScrollIndicator={false}/>
                    <SlotEvent offset={40}/>
                </ScrollView>
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
    groupPanel:{
        paddingBottom:30,
        borderBottomColor:'#fff'
    },
    list:{
        marginTop:24,
        backgroundColor:'#EDF0F2',
        borderRadius:10,
        paddingLeft:10,
        paddingRight:10,
        marginBottom:40
    },
    group:{
        flexDirection:'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems:'center'
    },
    type:{
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
        backgroundColor:'#F7F9FA'
    }
});
