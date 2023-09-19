import React, {Component} from 'react';
import {Image, StyleSheet,DeviceEventEmitter} from 'react-native';
import TabNavigator from 'react-native-tab-navigator';
import NetInfo from '@react-native-community/netinfo';
import Drawer from 'react-native-drawer';
import Customer from './Customer';
import {ColorStyles} from '../common/ColorStyles';
import I18n from 'react-native-i18n';
import store from "../../mobx/Store";
import CustomerAnalysis from "../unuse/CustomerAnalysis";
import ServiceDrawer from '../login/ServiceDrawer';

export default class VisitorPage extends Component {
    componentDidMount() {
        DeviceEventEmitter.emit('onStatusBar', '#24293d');
    }

    onNetChange(isConnected){
        store.netInfoSelector.offline = !isConnected;
    }

    componentWillMount(){
        this.unsubscribe = NetInfo.addEventListener(state=>{
            this.onNetChange(state.isConnected);
        });
    }

    componentWillUnmount() {
        this.unsubscribe && this.unsubscribe();
    }

    notification(){
        this.tabItemSelected('Analysis');
    }

    state = {
        selectedTab: 'Customer',
        userSelector: store.userSelector
    };

    tabItemSelected = (text) =>{
        this.setState({
            selectedTab: text
        });
    };

    onDrawer(open){
        if(open){
            DeviceEventEmitter.emit('onStatusBarTrans', true);
            DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGBA_BLACK);
        }
        let {userSelector} = this.state;
        userSelector.openDrawer = open;
        this.setState({userSelector});
    }

    render() {
        return (
            <Drawer
                type='overlay'
                content={<ServiceDrawer ref={'serviceDrawer'} onDrawer={(open)=>{this.onDrawer(open)}}/>}
                open={store.userSelector.openDrawer}
                tapToClose={true}
                openDrawerOffset={0.3}
                onCloseStart={()=>{this.refs.serviceDrawer.backClick()}}
                tweenHandler={(ratio) => ({main: { opacity:(2-ratio)/2,backgroundColor:'#000000' }})}>
                <TabNavigator style={styles.container} hidesTabTouch={true} tabBarStyle={{backgroundColor:'#ffffff'}}>
                    <TabNavigator.Item
                        selected={this.state.selectedTab === 'Customer'}
                        title={I18n.t('Customer')}
                        titleStyle={{color: "#5f6268"}}
                        selectedTitleStyle={{color: ColorStyles.COLOR_MAIN_RED}}
                        renderIcon={() => <Image style={styles.image} source={require('../assets/images/img_customer_normal.png')}/>}
                        renderSelectedIcon={() => <Image style={styles.image} source={require('../assets/images/img_customer_selected.png')}/>}
                        onPress={()=>this.tabItemSelected('Customer')}>
                        <Customer onMenu={(open)=>{this.onDrawer(open)}}/>
                    </TabNavigator.Item>
                    <TabNavigator.Item
                        selected={this.state.selectedTab === 'Analysis'}
                        title={I18n.t('Statistics')}
                        titleStyle={{color: "#5f6268"}}
                        selectedTitleStyle={{color: ColorStyles.COLOR_MAIN_RED}}
                        renderIcon={() => <Image style={styles.image} source={require('../assets/images/img_analyze_normal.png')}/>}
                        renderSelectedIcon={() => <Image style={styles.image} source={require('../assets/images/img_analyze_selected.png')}/>}
                        onPress={()=>this.tabItemSelected('Analysis')} >
                        <CustomerAnalysis/>
                    </TabNavigator.Item>
                </TabNavigator>
            </Drawer>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    image:{
        width: 32,
        height: 32,
        marginBottom: -5
    }
});
