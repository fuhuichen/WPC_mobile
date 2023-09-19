import React, {Component} from 'react';
import {Dimensions, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Actions} from "react-native-router-flux";
import {EMITTER_INDEX_CUSTOMER, EMITTER_INDEX_LOCAL, EMITTER_INDEX_REMOTE} from "../common/Constant";
import RNStatusBar from '../components/RNStatusBar';
import I18n from 'react-native-i18n';
import AccessHelper from "../common/AccessHelper";
import PatrolPrompt from "../components/inspect/PatrolPrompt";
import PatrolParser from "../components/inspect/PatrolParser";
import PatrolStorage from "../components/inspect/PatrolStorage";
import TouchableHighlightEx from "../touchables/TouchableHighlightEx";

let {width} =  Dimensions.get('screen');

export default class Check extends Component {
    constructor(props){
        super(props);

        this.data = [];
        this.item = null;
        this.initData();
    }

    initData(){
        AccessHelper.enablePatrolTask() && this.data.push({
            icon: require('../assets/images/img_check_task.png'),
            title: I18n.t('Patrol task'),
            router: 'patrolList',
            params: '',
            lineHeight:10,
            lineColor:'#f7f8fa',
            prompt: true
        });

        AccessHelper.enableLocalInspect() && this.data.push({
            icon: require('../assets/images/img_check_locale.png'),
            title: I18n.t('Onsite patrol'),
            router: 'storeCenter',
            params: {data:{emitter:EMITTER_INDEX_LOCAL}},
            lineHeight:1,
            lineColor:'#f5f5f5',
            prompt: true
        });

        AccessHelper.enableRemoteInspect() && this.data.push({
            icon: require('../assets/images/img_check_remote.png'),
            title: I18n.t('Remote patrol'),
            router: 'storeCenter',
            params: {data:{emitter:EMITTER_INDEX_REMOTE}},
            lineHeight:1,
            lineColor:'#f5f5f5',
            prompt: true
        });

        AccessHelper.enableTransactionPatrol() && this.data.push({
            icon: require('../assets/images/img_check_deal.png'),
            title: I18n.t('Transaction monitoring'),
            router: 'affairSearch',
            params: '',
            lineHeight:1,
            lineColor:'#f5f5f5',
            prompt: false
        });

        this.data.push({
            icon: require('../assets/images/img_check_report.png'),
            title: I18n.t('Reports'),
            router: 'inspectList',
            params: '',
            lineHeight:10,
            lineColor:'#f7f8fa',
            prompt: false
        });

        let length = this.data.length;
        if(length > 0){
            this.data[length-1].lineHeight = 1;
            this.data[length-1].lineColor = '#f5f5f5';
        }
    }

    onConfirm(category){
        Actions.push((category === 1) ? 'localCheck' : 'remoteCheck',{data:{name:''}});
    }

    onCancel(){
        PatrolStorage.delete();
        Actions.push(this.item.router, this.item.params);
    }

    itemClick(index){
        this.item = this.data[index];
        if (this.item.prompt && PatrolParser.isExist()){
            this.refs.prompt.open();
        }else {
            Actions.push(this.item.router, this.item.params);
        }
    }

    renderItem = ({item,index}) =>{
        return (
            <View>
                <TouchableHighlightEx activeOpactity={0.5} onPress={this.itemClick.bind(this,index)}>
                    <View style={styles.itemPanel}>
                        <Image style={styles.itemIcon} source={item.icon}/>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                    </View>
                </TouchableHighlightEx>
                <View style={{width:width,height:item.lineHeight,backgroundColor:item.lineColor}}></View>
            </View>
        )
    };

    render() {
        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={()=>Actions.push('serviceList')}>
                        <View style={{width:width/3,height:48}}>
                            <Image source={require('../assets/images/img_navbar_switch.png')} style={{width:48,height:48}}/>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.NavBarTitle}>
                        <Text style={styles.NavBarText}>{I18n.t('Patrol')}</Text>
                    </View>
                </View>
                <FlatList
                    data={this.data}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={this.renderItem}
                    showsVerticalScrollIndicator={false}
                />

                <PatrolPrompt ref={"prompt"} title={I18n.t('Quitting confirm')}
                              confirm={(category)=>this.onConfirm(category)} cancel={()=>{this.onCancel()}}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    NavBarPanel:{
        flexDirection:'row',
        height: 48,
        backgroundColor: '#24293d'
    },
    NavBarTitle: {
        height: 48,
        width: width/3
    },
    NavBarText:{
        fontSize: 18,
        height: 48,
        color: '#ffffff',
        textAlign:'center',
        textAlignVertical:'center',
        ...Platform.select({
            ios:{
                lineHeight: 48
            }
        })
    },
    itemPanel:{
        flexDirection: 'row',
        justifyContent:'flex-start',
        height:80
    },
    itemIcon:{
        width: 48,
        height: 48,
        marginLeft:28,
        alignSelf:'center'
    },
    itemTitle:{
        fontSize: 14,
        height:80,
        textAlignVertical:'center',
        marginLeft: 30,
        lineHeight: 80
    }
});
