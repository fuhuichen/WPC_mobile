import React, { Component } from 'react';
import {
    Dimensions,
    StyleSheet,
    View,
    TouchableOpacity,
    DeviceEventEmitter,
    Text,
    Platform
} from 'react-native';

let {width} =  Dimensions.get('screen');
import { Actions } from 'react-native-router-flux';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import DefaultTabBar from '../thirds/scrolltabar/DefaultTabBar';
import FavoriteStore from './FavoriteStore'
import LatestStore from './LatestStore'
import {EMITTER_MONITOR} from "../common/Constant";
import RNStatusBar from '../components/RNStatusBar'
import * as lib from '../common/PositionLib';
import I18n from 'react-native-i18n';

const StatusBarHeight = lib.statusBarHeight();
export default class Monitor extends Component {
    constructor(props){
        super(props)

        this.state = {
            tabIndex: 0
        }

        this.onTabChange = this.onTabChange.bind(this);
    }

    onTabChange(tab){
        this.setState({
            tabIndex: tab.i
        })

        let tabRefs =  tab.i === 0 ? this.refs.favrate : this.refs.latest;
        tabRefs.fetchData()
    }

    componentDidMount(){
        this.listener = DeviceEventEmitter.addListener(EMITTER_MONITOR,
            (param)=>{
               this.fetchData();
            });
    }

    componentWillUnmount(){
        this.listener.remove();
    }

    fetchData(){
        let tabRefs =  this.state.tabIndex === 0 ? this.refs.favrate : this.refs.latest;
        tabRefs.fetchData()
    }

    centerLink(){
       Actions.push('storeCenter',{data:{emitter:EMITTER_MONITOR}});
    }

    render() {
        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <ScrollableTabView
                    initialPage={0}
                    renderTabBar={() => <DefaultTabBar
                    />}
                    onChangeTab={(tab)=>this.onTabChange(tab)}>
                    <FavoriteStore ref={'favrate'} tabLabel={I18n.t('Concern')}></FavoriteStore>
                    <LatestStore ref={'latest'} tabLabel={I18n.t('Recent')}></LatestStore>
                </ScrollableTabView>
                <View style={styles.searchPanel}>
                    <View style={styles.headerImagePanel}>
                        <TouchableOpacity opacity={0.5} onPress={this.centerLink.bind(this)}>
                            <Text style={styles.headerText}>{I18n.t('All stores')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    searchPanel:{
        position: 'absolute',
        width: width-160,
        height: 48,
        marginLeft: 160,
        marginTop:StatusBarHeight,
        backgroundColor: '#24293d',
    },
    headerImagePanel:{
        flexDirection: 'row',
        justifyContent: 'flex-end',
        height:48,
        paddingRight:12
    },
    headerText: {
        fontSize:14,
        color:'#ffffff',
        height:48,
        textAlignVertical: 'center',
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    }
});