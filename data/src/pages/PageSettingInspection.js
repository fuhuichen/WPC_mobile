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
import {Actions} from "react-native-router-flux";
import {inject, observer} from 'mobx-react'
import Toast, {DURATION} from "react-native-easy-toast";
import BusyIndicator from "../../../app/components/BusyIndicator";
import SettingSwitch from "../components/SettingSwitch";
import Navigation from "../../../app/element/Navigation";
import PhoneInfo from '../../../app/entities/PhoneInfo';
import * as simpleStore from "react-native-simple-store";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
@inject('store')
@observer
export default class PageSettingInspection extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.state = {
            isFileSave:true
        };
    }

    componentDidMount(){
        this.getSetting();
    }

    async getSetting(){
        let res = await simpleStore.get('InspectionSetting');
        if (res != null) {
            let setting = JSON.parse(res);
            this.setState({isFileSave: setting.isFileSave});
        }
    }

    doSave(){
        let {isFileSave} = this.state;
        let setting = {};
        setting.isFileSave = isFileSave;
        simpleStore.save('InspectionSetting',JSON.stringify(setting));
        Actions.pop();
    }

    onFileSave(value){
        this.setState({isFileSave:value});
    }

    render(){
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
        return (
            <View style={{paddingTop:0,
                backgroundColor:VALUES.COLORMAP.dkk_background,
                height:height,width:width}}>
                <Navigation
                    onLeftButtonPress={()=>Actions.pop()}
                    title={I18n.t('Inspection Execution')}
                    rightButtonTitle={I18n.t('Save')}
                    onRightButtonPress={()=>{this.doSave()}}
                    titleStyle={titleStyle}
                />
                <SettingSwitch title={I18n.t('Inspection File Save')} value={this.state.isFileSave} onValueChange={(value) => this.onFileSave(value)}/>
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
