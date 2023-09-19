import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, FlatList, ScrollView, TouchableOpacity} from "react-native";
import I18n from 'react-native-i18n';
import store from "../../../mobx/Store";
import BorderShadow from "../../element/BorderShadow";
import ViewIndicator from "../../customization/ViewIndicator";
import EventBus from "../../common/EventBus";
import Divider from "react-native-elements/dist/divider/Divider";
import FilterCore from "../common/FilterCore";
import {getInspectItemOverview} from "../../common/FetchRequest";
import {Actions} from "react-native-router-flux";
import PhoneInfo from '../../entities/PhoneInfo';

const {width} = Dimensions.get('screen');
export default class StorePatrolBlock extends Component {
    state = {
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector,
        filterSelector: store.filterSelector,
        viewType: store.enumSelector.viewType.EMPTY,
        analysisType: store.enumSelector.analysisType.STORE,
        data: []
    };

    fetchData(){
        try {
            let {viewType, enumSelector, analysisSelector, analysisType, filterSelector, data} = this.state;
            this.setState({viewType: enumSelector.viewType.LOADING}, async () => {
                let filter = FilterCore.getFilter(analysisType, filterSelector);
                let body = FilterCore.getRange(analysisSelector.storeRangeType, analysisSelector.storeRanges);
                body.storeIds = filter.storeId;
                (filter.inspect.length === 1) && (body.inspectTagId = filter.inspect[0].id);
                (filter.userId != null) && (body.submitters = filter.userId);

                body.filter = {page:0, size:5};
                body.order = {direction:'desc', property:'numOfUnqualified'};
                body.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;

                viewType = enumSelector.viewType.FAILURE;
                //console.log("getInspectItemOverview body : ", JSON.stringify(body));
                let result = await getInspectItemOverview(body);
                //console.log("getInspectItemOverview result : ", JSON.stringify(result));

                if (result.errCode === enumSelector.errorType.SUCCESS){
                    data = result.data.content;
                    viewType = (data.length > 0) ? enumSelector.viewType.SUCCESS
                        : enumSelector.viewType.EMPTY;
                }

                this.setState({data, viewType});

            });
        }catch (e) {
        }
    }

    onRouter(item){
        let {analysisType, analysisSelector, filterSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        let request = FilterCore.getRange(analysisSelector.storeRangeType, analysisSelector.storeRanges);
        request.clause = {
            storeId: filter.storeId,
            itemId: item.inspectItemId
        };

        (filter.userId != null) && (request.clause.assigner = filter.userId);
        (filter.inspect.length === 1) && (request.clause.inspectTagId = filter.inspect[0].id);

        request.searchMysteryMode = FilterCore.isMysteryMode(analysisType, filterSelector) ? 1 : 0;

        //console.log("onRouter request : ", JSON.stringify(request));

        Actions.push('eventList', {filters: request});
    }

    renderItem = ({ item,index}) => {
        let fontSize = 14;
        PhoneInfo.isTHLanguage() && (fontSize = 8);

        return <View style={styles.viewPanel}>
            <Text style={styles.subject} numberOfLines={1}>{index+1}. {item.inspectItemName}</Text>
            <TouchableOpacity activeOpacity={0.5} onPress={() => {this.onRouter(item)}}>
                <View style={styles.content}>
                    <Text style={[styles.detail, {fontSize: fontSize}]}>{I18n.t('Detail')}</Text>
                </View>
            </TouchableOpacity>
        </View>
    };

    renderData(){
        return <FlatList data={this.state.data}
                         keyExtractor={(item, index) => index.toString()}
                         renderItem={this.renderItem}
                         ItemSeparatorComponent={() => <Divider style={styles.divider}/>}
                         showsVerticalScrollIndicator={false}/>
    }

    render() {
        let {viewType, enumSelector} = this.state;
        let height = (viewType !== enumSelector.viewType.SUCCESS) ? 275 : null;

        return (
            <View style={styles.container}>
                <Text style={styles.header}>{I18n.t('Store patrol event top5')}</Text>
                <View style={[styles.panel, {height}, BorderShadow.div]}>
                    {
                        (viewType === enumSelector.viewType.SUCCESS) ? this.renderData()
                            : <ViewIndicator viewType={viewType}
                                             containerStyle={{justifyContent: 'center'}}
                                             refresh={() => this.fetchData()}/>
                    }
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop:36
    },
    header:{
        fontSize:16,
        color:'rgb(100,104,109)',
        marginLeft:10,
        marginBottom:15
    },
    panel:{
        borderRadius:10,
        paddingLeft: 16,
        paddingRight: 16,
        backgroundColor:'#fff'
    },
    divider:{
        height:2,
        backgroundColor:'rgb(242,242,242)',
        borderBottomWidth:0
    },
    viewPanel:{
        height:55,
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        backgroundColor: '#fff'
    },
    subject:{
        fontSize:14,
        color:'rgb(100,104,109)',
        maxWidth:width-100
    },
    content:{
        width:44,
        height:40
    },
    detail:{
        height:40,
        lineHeight:40,
        textAlign:'center',
        textAlignVertical:'center',
        color:'rgb(0,106,183)',
        fontSize:14
    }
});
