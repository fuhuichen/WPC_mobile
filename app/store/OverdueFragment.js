import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, FlatList, TouchableOpacity,ScrollView} from "react-native";
import I18n from "react-native-i18n";
import store from "../../mobx/Store";
import StoreCell from "./StoreCell";
import {getLastInspectList} from "../common/FetchRequest";
import TouchableActive from "../touchables/TouchableActive";
import ViewIndicator from "../customization/ViewIndicator";
import SlotStore from "../customization/SlotStore";
import BaseStore from "../customization/BaseStore";
import StoreIndicator from "../customization/StoreIndicator";

const {width} = Dimensions.get('screen');
export default class OverdueFragment extends BaseStore {
    state = {
        storeSelector: store.storeSelector,
        enumSelector: store.enumSelector,
        viewType: store.enumSelector.viewType.FAILURE,
        storeData: [],
        lastStore:[],
        withinThreeStore:[]
    };

    constructor(props) {
        super(props);

        this.duration = 30;
    }

    componentDidMount() {
        (async ()=> {
            await this.fetchData();
        })();
    }

    async fetchData(){
        let params = {};
        let {enumSelector,lastStore,withinThreeStore} = this.state;
        this.setState({viewType:enumSelector.viewType.LOADING});
        let result = await getLastInspectList(params);
        if(result.errCode !== enumSelector.errorType.SUCCESS){
            this.setState({viewType:enumSelector.viewType.FAILURE});
            return false;
        }
        if(result.data.length === 0){
            this.setState({viewType:enumSelector.viewType.EMPTY});
            return false;
        }
        lastStore = result.data[0];
        withinThreeStore = result.data.length === 1 ? [] : JSON.parse(JSON.stringify(result.data)).splice(1);
        this.setState({lastStore,withinThreeStore,viewType:store.enumSelector.viewType.SUCCESS});
    }

    renderLastStore(){
        let {lastStore,withinThreeStore} = this.state;
        let borderRadius = withinThreeStore.length>0 ? null : 10;
        let borderBottomWidth = withinThreeStore.length>0 ? 2 : 0;
        return (
            <View style={[styles.storePanel,{borderRadius}]}>
                <Text style={styles.locate}>{I18n.t('Overdue store')}</Text>
                <View style={[styles.storeGroup,{borderBottomWidth}]}>
                    <StoreCell showDate={true} data={{key:lastStore,value:0}} />
                </View>
            </View>
        )
    }

    renderWithinThreeStores(){
        let {withinThreeStore} = this.state;

        return (
            <View style={styles.nearPanel}>
                <Text style={styles.locate}>{I18n.t('Duration inspect',{key:this.duration})}</Text>
                <View style={[styles.group,styles.storeGroup]}>
                    {
                        withinThreeStore.map((item,index) => {
                            return <StoreCell showDate={true} data={{key:item,value:index}}/>
                        })
                    }
                </View>
            </View>
        )
    }

    render() {
        const {viewType, enumSelector,withinThreeStore} = this.state;

        const last = this.renderLastStore();
        const withinThree = (withinThreeStore.length > 0) && this.renderWithinThreeStores()

        return <View style={{flex:1}}>
            {
                (viewType !== enumSelector.viewType.SUCCESS) && <StoreIndicator viewType={viewType} prompt={I18n.t('Empty overdue')}
                                                                               containerStyle={{marginTop:100}}
                                                                               refresh={() => {
                                                                                   (async ()=> this.fetchData())();
                                                                               }}/>
            }
            {(viewType === enumSelector.viewType.SUCCESS) && <ScrollView
                    style={styles.container} showsVerticalScrollIndicator={false}>
                {<TouchableActive>
                    {last}
                    {withinThree}
                </TouchableActive>}
                <SlotStore offset={40}/>
            </ScrollView>}
        </View>
    }
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        marginLeft:10,
        marginRight:10,
        marginTop:24,
    },
    storePanel:{
       backgroundColor:'#EDF0F2',
       borderTopLeftRadius:10,
       borderTopRightRadius:10,
       paddingLeft:10,
       paddingRight:10,
       paddingTop:15,
    },
    nearPanel:{
       backgroundColor:'#EDF0F2',
       borderBottomLeftRadius:10,
       borderBottomRightRadius:10,
       paddingTop:24,
       paddingLeft:10,
       paddingRight:10
    },
    storeGroup:{
        marginTop:5,
        paddingBottom:30,
        borderColor:'#fff',
    },
    group:{
        flexDirection:'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems:'center'
    },
    locate:{
        color:'#85898E',
        fontSize:14,
        marginTop:5,
        marginLeft:5,
    }
});
