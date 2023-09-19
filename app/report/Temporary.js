import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, FlatList, TouchableOpacity, DeviceEventEmitter} from "react-native";
import I18n from 'react-native-i18n';
import PropTypes from 'prop-types';
import {Actions} from 'react-native-router-flux';
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import {Divider} from "react-native-elements";
import ModalCenter from "../components/ModalCenter";
import PatrolStorage from "../components/inspect/PatrolStorage";
import UserPojo from "../entities/UserPojo";
import TimeUtil from "../utils/TimeUtil";
import {REFRESH_TEMPORARY_REPORT} from "../common/Constant";
import store from "../../mobx/Store";
import EventBus from "../common/EventBus";

const {width} = Dimensions.get('screen');
export default class Temporary extends Component {
    state = {
        reportSelector: store.reportSelector,
        data: [],
        selectItem: null,
        selectIndex: -1
    };

    static propTypes = {
        storeName: PropTypes.string
    };

    componentDidMount() {
        let {storeName} = this.props;
        let data = PatrolStorage.getCacheByName(storeName);
        this.setState({data: (data.length > 0) ? data : []});

        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_TEMPORARY_REPORT, () => {
            let data = PatrolStorage.getCacheByName(storeName);
            this.setState({data: (data.length > 0) ? data : []});
        });
    }

    renderTitle(){
        return (
            <Text style={styles.title}>{I18n.t('Temporary report')}</Text>
        )
    }

    onDelete(item, index){
        this.setState({selectIndex: -1});
        this.modal && this.modal.open();
    }

    onConfirm(){
        let {storeName} = this.props;
        let {reportSelector, selectItem, data} = this.state;
        PatrolStorage.delete(selectItem.uuid);

        data = PatrolStorage.getCacheByName(storeName);
        data = (data.length > 0) ? data : [];

        reportSelector.temporaries = PatrolStorage.getManualCaches();

        this.setState({
            data,
            reportSelector
        }, () => {
            EventBus.refreshStoreInfo();
        });
    }

    renderItem({item,index}) {
        let {selectIndex} = this.state;
        let borderColor = (selectIndex === index) ? '#006AB7' : '#fff';
        let borderWidth = (selectIndex === index) ? 1 : 0;

        let modeName = (item.mode === 0) ? I18n.t('Remote patrol') : I18n.t('Onsite patrol');
        let date = TimeUtil.getDetailTime(item.ts);

        return (
            <TouchableOpacity activeOpacity={0.6} onPress={() => {Actions.push('patrol', {uuid: item.uuid})}}>
                <View style={styles.data}>
                    <View style={styles.topPanel}>
                        <Text style={styles.storeName} numberOfLines={1}>{item.storeName}</Text>
                        <TouchableOpacity activeOpacity={0.6} onPressIn={() => this.setState({selectItem: item, selectIndex:index})}
                            onPressOut={() => this.onDelete(item, index)}>
                            <View style={[styles.deletePanel,{borderColor,borderWidth}]}>
                                <Text style={styles.deleteContent}>{I18n.t('Delete')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.date}>{date[3]} {date[1]}</Text>
                    <Text style={styles.bottomInfo}>{`${modeName} | ${item.tagName} | ${UserPojo.getUserName()}`}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    renderData(){
        let {data} = this.state;

        return (
            <View>
                <BoxShadow setting={{width:width-20, height:data.length*81, color:"#000000",
                    border:2, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:16}}}>
                    <FlatList style={styles.listView}
                              data={data}
                              keyExtractor={(item, index) => index.toString()}
                              renderItem={this.renderItem.bind(this)}
                              showsVerticalScrollIndicator={false}
                              ItemSeparatorComponent={() => <Divider style={styles.divider}/>}
                    />
                </BoxShadow>
                <ModalCenter ref={c => this.modal = c} title={I18n.t('Temporary delete title')}
                             description={I18n.t('Temporary delete detail')}
                             confirm={() => this.onConfirm()}/>
            </View>
        )
    }

    render() {
        let {data} = this.state;

        return (
            (data.length > 0) ? <View style={styles.container}>
                {this.renderTitle()}
                {this.renderData()}
            </View> : null
        )
    }
}

const styles = StyleSheet.create({
    container: {
        width:width-20,
        marginTop:30
    },
    title:{
        fontSize:16,
        color:'#64686D',
        marginLeft:10
    },
    listView:{
        flex:1,
        backgroundColor:'#fff',
        width:width-22,
        marginLeft:1,
        borderRadius:10
    },
    data:{
        paddingLeft:16,
        paddingRight:24,
        height:79
    },
    topPanel:{
        flexDirection:'row',
        justifyContent:'space-between',
        marginTop:5
    },
    storeName:{
        marginTop:7,
        fontSize:14,
        color:'#64686D',
        maxWidth:200
    },
    deletePanel:{
        width:60,
        height:30,
        borderRadius: 10,
        marginTop:3
    },
    deleteContent:{
        height:30,
        lineHeight:30,
        textAlign:'center',
        textAlignVertical:'center',
        fontSize:14,
        color:'#006AB7',
        marginTop:-2
    },
    date:{
        fontSize:10,
        color:'#85898E',
        marginTop:-2
    },
    bottomInfo:{
        fontSize:10,
        color:'#85898E',
        marginTop:1
    },
    divider:{
        height:2,
        backgroundColor:'#F2F2F2',
        borderBottomWidth:0,
        width:width-60,
        marginLeft:16
    }
});
