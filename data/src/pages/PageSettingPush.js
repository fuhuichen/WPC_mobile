import React, {Component} from 'react';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';

import {
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    Switch,
    View
} from 'react-native';
import UTitleBarText from '../components/UTitleBar'
import {Actions} from "react-native-router-flux";
import {inject, observer} from 'mobx-react'
import HttpUtil from "../../../app/utils/HttpUtil";
import Toast, {DURATION} from "react-native-easy-toast";
import BusyIndicator from "../../../app/components/BusyIndicator";
import SettingSwitch from "../components/SettingSwitch";
let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
import Navigation from "../../../app/element/Navigation";
import PhoneSelector from '../../../mobx/PhoneSelector';
import PhoneInfo from '../../../app/entities/PhoneInfo';
import {getScheduleWhiteList} from "../../../app/common/FetchRequest";
import store from "../../../mobx/Store";

@inject('store')
@observer
export default class PageSettingPush extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        const smallPhone = this.props.store.phoneSelector.smallPhone;
        var styles
        if(smallPhone){
            styles = smallStyles
        }
        else{
            styles = largeStyles
        }
        this.state = {
            switch8:true,
            switch3:true,
            switch5:true,
            switch9:true,
            switch11:true,
            whiteList: []
        };
    }

    componentDidMount(){
        this.getSetting();

        (async () => {
            let result = await getScheduleWhiteList();
            this.setState({whiteList: result.data});
        })()
    }

    getSetting(){
        this.refs.indicator.open();
        HttpUtil.get('notify/setting')
            .then(result => {
                result.data.forEach((item,index)=>{
                    let flag = item.status !== 0;
                    if (item.messageType === 8){
                        this.setState({switch8:flag});
                    }
                    else if (item.messageType === 3){
                        this.setState({switch3:flag});
                    }
                    else if (item.messageType === 5){
                        this.setState({switch5:flag});
                    }
                    else if (item.messageType === 9){
                        this.setState({switch9:flag});
                    }
                    else if (item.messageType === 11){
                        this.setState({switch11:flag});
                    }
                });
                this.refs.indicator.close();
            })
            .catch(error=>{
                this.refs.indicator.close();
                this.refs.toast.show(I18n.t('Notify config error'),DURATION.LENGTH_SHORT);
            })
    }

    doSave(){
        this.refs.indicator.open();
        let request = {};
        let notifySettings = [];
        let setting1 = {};
        setting1.messageType = 8;
        setting1.status = this.state.switch8 === true ? 1: 0;
        let setting3 = {};
        setting3.messageType = 5;
        setting3.status = this.state.switch5 === true ? 1: 0;
        let setting2 = {};
        setting2.messageType = 3;
        setting2.status = this.state.switch3 === true ? 1: 0;
        let setting9 = {};
        setting9.messageType = 9;
        setting9.status = this.state.switch9 === true ? 1: 0;
        let setting11 = {};
        setting11.messageType = 11;
        setting11.status = this.state.switch11 === true ? 1: 0;
        notifySettings.push(setting1);
        notifySettings.push(setting3);
        //notifySettings.push(setting2);
        notifySettings.push(setting9);
        notifySettings.push(setting11);
        request.notifySettings = notifySettings;
        HttpUtil.post('notify/setting',request)
            .then(result => {
                this.refs.indicator.close();
                Actions.pop();
            })
            .catch(error=>{
                this.refs.indicator.close();
                this.refs.toast.show(I18n.t('Notify config error'),DURATION.LENGTH_SHORT);
            })
    }

    onSwitch(tag,value){
        if (tag == 5){
            this.setState({switch5:value})
        }
        if (tag == 3){
            this.setState({switch3:value})
        }
        if (tag == 8){
            this.setState({switch8:value})
        }
        if (tag == 9){
            this.setState({switch9:value})
        }
        if (tag == 11){
            this.setState({switch11:value})
        }
    }

    render(){
        const smallPhone= this.props.store.phoneSelector.smallPhone;
        const screen = Dimensions.get('window');

        let fontSize = 18;
        let marginTop = 0;
        (PhoneInfo.isTHLanguage() || PhoneInfo.isVNLanguage() || PhoneInfo.isIDLanguage() || PhoneInfo.isJALanguage()) && (fontSize = 14);
        (PhoneInfo.isTHLanguage() || PhoneInfo.isVNLanguage() || PhoneInfo.isIDLanguage() || PhoneInfo.isJALanguage()) && (marginTop = 6);
        let titleStyle = {
            fontSize: fontSize,
            marginTop: Platform.select({
                ios: 3,
                android: marginTop
            })
        };
        let isShowSchedule = false;
        if(this.state.whiteList.length > 0) {
            if(this.state.whiteList.indexOf(store.userSelector.accountId) != -1) {
                isShowSchedule = true;
            }
        }
        return (
            <View style={{paddingTop:0,
                backgroundColor:VALUES.COLORMAP.dkk_background,
                height:screen.height,width:screen.width}}>
                <Navigation
                    onLeftButtonPress={()=>Actions.pop()}
                    title={I18n.t('Notification setting')}
                    rightButtonTitle={I18n.t('Save')}
                    onRightButtonPress={()=>{this.doSave()}}
                    titleStyle={titleStyle}
                />
                <SettingSwitch title={I18n.t('Reports setting')} value={this.state.switch8} onValueChange={(value) => this.onSwitch(8,value)}/>
                <SettingSwitch title={I18n.t('Event setting')} value={this.state.switch5} onValueChange={(value) => this.onSwitch(5,value)}/>
                <SettingSwitch title={I18n.t('Approve setting')} value={this.state.switch9} onValueChange={(value) => this.onSwitch(9,value)}/>
                {isShowSchedule && <SettingSwitch title={I18n.t('Schedule setting')} value={this.state.switch11} onValueChange={(value) => this.onSwitch(11,value)}/>}
                {/* <SettingSwitch title={I18n.t('Patroll setting')} value={this.state.switch3} onValueChange={(value) => this.onSwitch(3,value)}/> */}
                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
                <BusyIndicator ref={"indicator"} title={I18n.t('Loading')}/>
            </View>
        )
    }
}

const smallStyles = StyleSheet.create({
    dataValue: {
        backgroundColor:'transparent',
        fontSize:14,
        marginTop:3,
        justifyContent:'center',
        alignItems:'center',
        color:VALUES.COLORMAP.white},
    backgroundImage: {
        flex: 1,
        alignSelf: 'stretch',
        width: null,
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderTopWidth: 0,
        borderRightWidth: 45,
        borderBottomWidth: 90,
        borderLeftWidth: 45,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'red',
        borderLeftColor: 'transparent',
    },
    container:{
        paddingTop:44,
        paddingRight:30,
        paddingLeft:30,
        paddingBottom:25,
        alignItems:'center',
        justifyContent:'flex-start',
    },
    logoImage: {
        width:0
    },
    inputTitle: {
        paddingTop:2,
        paddingBottom:4,
        marginLeft:10,
        fontSize:14,
        justifyContent:'flex-start',
        alignItems:'center',
        backgroundColor:'transparent',
        color:VALUES.COLORMAP.white},
    forgetPwdText: {
        textDecorationLine:'underline',
        paddingTop:2,
        paddingBottom:4,
        marginLeft:20,
        fontSize:12,
        alignItems:'center',
        color:VALUES.COLORMAP.white},
});

const largeStyles = StyleSheet.create({
    dataValue: {
        backgroundColor:'transparent',
        fontSize:14,
        marginTop:3,
        justifyContent:'center',
        alignItems:'center',
        color:VALUES.COLORMAP.white},
    backgroundImage: {
        flex: 1,
        alignSelf: 'stretch',
        width: null,
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderTopWidth: 0,
        borderRightWidth: 45,
        borderBottomWidth: 90,
        borderLeftWidth: 45,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'red',
        borderLeftColor: 'transparent',
    },
    container:{
        paddingTop:44,
        paddingRight:30,
        paddingLeft:30,
        paddingBottom:25,
        alignItems:'center',
    },
    logoImage: {
        width:0
    },
    inputTitle: {
        paddingTop:2,
        paddingBottom:4,
        marginLeft:10,
        fontSize:12,
        justifyContent:'flex-start',
        alignItems:'center',
        backgroundColor:'transparent',
        color:VALUES.COLORMAP.white},
    forgetPwdText: {
        textDecorationLine:'underline',
        paddingTop:2,
        paddingBottom:4,
        marginLeft:20,
        fontSize:10,
        alignItems:'center',
        justifyContent:'flex-end',
        color:VALUES.COLORMAP.white},

});
