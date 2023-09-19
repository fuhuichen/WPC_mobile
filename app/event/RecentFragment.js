import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, FlatList, ScrollView, TouchableOpacity} from "react-native";
import I18n from 'react-native-i18n';
import store from "../../mobx/Store";
import EventBus from "../common/EventBus";
import Divider from "react-native-elements/dist/divider/Divider";
import BaseStore from "../customization/BaseStore";
import StoreIndicator from "../customization/StoreIndicator";
import {getEventStatusByLastInspect} from "../common/FetchRequest";
import EventCell from "./EventCell";
import SlotEvent from "../customization/SlotEvent";
import StorePicker from "../components/StorePicker";
import {EventCore} from "./EventCore";

const {width} = Dimensions.get('screen');
export default class RecentFragment extends BaseStore {
    state = {
        storeData: [],
        enumSelector: store.enumSelector,
        eventSelector: store.eventSelector,
        filterSelector: store.filterSelector,
        viewType: store.enumSelector.viewType.FAILURE,
        data: []
    };

    componentDidMount(){
        (async ()=> {
            await this.fetchData();
        })();
    }

    async fetchData(){
        let {enumSelector, filterSelector, viewType} = this.state, data = [];
        this.setState({viewType: enumSelector.viewType.LOADING});

        let body = {
            beginTs: filterSelector.getBeginTs(),
            endTs: filterSelector.getEndTs()
        };

        let result = await getEventStatusByLastInspect(body);
        if (result.errCode !== enumSelector.errorType.SUCCESS){
            this.setState({viewType: enumSelector.viewType.FAILURE});
            return;
        }

        let eventDone = result.data.filter(p => p.numOfInprocess > 0);
        let eventUnhandled = result.data.filter(p => (p.numOfInprocess === 0) && ((p.numOfUnprocessed + p.numOfRejected) > 0));

        (eventUnhandled.length > 0) && data.push({title: I18n.t('Event unhandled store'), stores: eventUnhandled});
        (eventDone.length > 0) && data.push({title: I18n.t('Event done store'), stores: eventDone});

        viewType = (data.length > 0) ? enumSelector.viewType.SUCCESS : enumSelector.viewType.EMPTY;
        this.setState({data, viewType});
    }

    onChange(data) {
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
        const {viewType, enumSelector, data} = this.state;

        return <View style={styles.container}>
            {
                (viewType !== enumSelector.viewType.SUCCESS) && <StoreIndicator viewType={viewType}
                                                                                containerStyle={{marginTop:100}} prompt={I18n.t('Empty store')}
                                                                                refresh={() => {(async ()=> this.fetchData())()}}/>
            }
            {
                (viewType === enumSelector.viewType.SUCCESS) && <ScrollView showsVerticalScrollIndicator={false}>
                    <FlatList style={styles.list}
                              data={data}
                              keyExtractor={(item, index) => index.toString()}
                              renderItem={this.renderItem}
                              ItemSeparatorComponent={() => <Divider style={styles.divider}/>}
                              showsVerticalScrollIndicator={false}/>
                    <SlotEvent offset={40}/>
                </ScrollView>
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
        paddingRight:10
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
        backgroundColor:'#F7F9FA',
        borderBottomWidth:0
    }
});
