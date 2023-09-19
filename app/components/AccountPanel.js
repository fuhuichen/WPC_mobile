import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, DeviceEventEmitter, TouchableOpacity,FlatList,Platform} from "react-native";
import I18n from 'react-native-i18n';
import Toast, {DURATION} from 'react-native-easy-toast'
import store from "../../mobx/Store";
import SlideModalEx from "./SlideModal";
import AccountUtil from "../utils/AccountUtil";
import usernameImg from '../assets/images/group_19.png';
import iconDown from '../assets/images/icon_down.png';
import iconUp from '../assets/img_chart_up.png';
import Spinner from "../element/Spinner";
import SlotView from "../customization/SlotView";
import BorderShadow from '../element/BorderShadow';
import * as lib from '../common/PositionLib';

const {width} = Dimensions.get('screen');
export default class AccountPanel extends Component {
    state = {
        accountIndex:store.userSelector.accountIndex,
        accountList:store.userSelector.accountList,
        accountId:store.userSelector.accountId,
        visible:false,
        modalClose:false
    };

    componentWillMount(){
        this.accountEmitter = DeviceEventEmitter.addListener('changeAccount',
            (msg) =>{
                this.setState({visible:msg});
            });

        this.modalEmitter = DeviceEventEmitter.addListener('modalStatus',
            (status) =>{
            this.setState({modalClose:status});
            this.props.onModal && this.props.onModal(status);
        });
    }

    componentWillUnmount(){
        this.accountEmitter && this.accountEmitter.remove();
        this.modalEmitter && this.modalEmitter.remove();
    }

    close() {
        this.modalDownList && this.modalDownList.close();
    }

    changeAccount(){
        if(store.userSelector.isMysteryModeOn == false) {
            this.modalDownList && this.modalDownList.open();
        }        
    }

    update(accountIndex){
        this.setState({
            accountIndex,
            accountId: store.userSelector.accountId
        });
    }

    async clickRow(item,index){
        setTimeout(() => {
            this.modalDownList && this.modalDownList.close();
        }, 200);

        if(store.userSelector.isMysteryModeOn == true) {
            return;
        }

        let accountSrp = (this.state.accountList[index].srp != null) ? this.state.accountList[index].srp : [];
        let viuBIService = accountSrp.find(p => p.type === 'Custom_UShopService');
        let viuMOService = accountSrp.find(p => p.type === 'Custom_Inspection');
        if (((viuBIService == null) || !viuBIService.enable) && ((viuMOService == null) || !viuMOService.enable)){
            this.props.toast && this.props.toast(I18n.t('Account permission'));
            return;
        }

        let accountId = this.state.accountList[index].accountId;
        if (! await AccountUtil.changeAccount(accountId,true,true)){
            this.props.toast && this.props.toast(I18n.t('Switch brand error'));
            return;
        }
        store.userSelector.accountIndex = index;
        if(index !== this.state.accountIndex){
            this.props.changeAccount(true);
        }

        this.setState({accountIndex:index, accountId});
    }

    renderRow = ({ item,index}) => {
        let {accountId} = this.state;
        let backgroundColor = (item.accountId === accountId) ? '#ECF7FF' : '#fff';
        let color = (item.accountId === accountId) ? '#404554': '#707070';
        let borderColor = (item.accountId === accountId) ? '#2C90D9': null;
        let borderWidth = (item.accountId === accountId) ? 1 : 0;

        let paddingLeft = this.props.drawer ? 22 : 40;
        let panelWidth = this.props.drawer ? 196 : width-50;
        let height = this.props.drawer ? 30 : 46;

        return (
            <TouchableOpacity activeOpacity={1} onPress={this.clickRow.bind(this,item,index)} >
                <View style={{backgroundColor,height,width:panelWidth,borderColor, borderWidth, borderRadius:4}}>
                    <Text style={[styles.brandName,{color,height,lineHeight:height,paddingLeft}]} numberOfLines={1}>
                        {item.name}
                    </Text>
                </View>
            </TouchableOpacity>
        )
    }

    render() {
        const {accountList,visible,modalClose,accountId} = this.state;
        let accountName = accountList.find(p => p.accountId === accountId).name;
        let accountPanel = null;
        const panelStyle = this.props.drawer ? {width:195} : {width:width-48,borderRadius:8,paddingLeft:10,paddingRight:16,marginTop:29};
        const offsetY = this.props.drawer ? Platform.select({android:240, ios:215+lib.defaultStatusHeight()})
            : Platform.select({android:228, ios:238+lib.defaultStatusHeight()});
        const modalWidth = this.props.drawer ? 243-15 : width-12;
        const color = modalClose ? '#006AB7' : '#484848';
        const rightIcon = modalClose ? iconUp : iconDown;
        const marginLeft = this.props.drawer ? 15 : 12;

        let rowHeight =  this.props.drawer ? 30 : 46;
        let borderWidth = this.props.drawer ? 198 : width-48;
        let borderLeft = this.props.drawer ? 23 : 24;
        let rowCount = (accountList.length < 5) ? accountList.length : 5;

        if (accountList.length > 1){accountPanel = (
                <TouchableOpacity onPress={this.changeAccount.bind(this)} style={styles.inputPanel}>
                    <Text style={[styles.actName,{marginLeft:this.props.drawer ? 0 : 10,color}]}>{accountName}</Text>
                    <Image style={{width:16,height:16,marginTop:5}} source={rightIcon}/>
                </TouchableOpacity>
        )
        }
        else {accountPanel = (
                <View style={styles.inputPanel}>
                    <Text allowFontScaling={false}  style={[styles.actName,{color}]}>{accountName}</Text>
                </View>
        )
        }
        return (
            <View style={styles.container}>
                {
                    this.props.drawer ? <View style={[styles.actPanel,panelStyle]}>{accountPanel}</View> :
                        <View style={[styles.actPanel,panelStyle, !modalClose ? BorderShadow.div: {borderColor:'#2C90D9',borderWidth:1},
                            {backgroundColor:'#fff'}]}>
                            {accountPanel}
                        </View>
                }

                <SlideModalEx ref={(c) => { this.modalDownList = c; }} offsetY={offsetY} opacity={0} width={modalWidth}>
                    <View style={[styles.borderShadow,BorderShadow.div,
                            {width:borderWidth,height:rowCount*rowHeight+20, marginLeft:borderLeft}]}>
                        <FlatList
                            showsVerticalScrollIndicator={false}
                            style={[styles.list, {maxHeight:rowCount*rowHeight}]}
                            data={accountList}
                            extraData={this.state}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={this.renderRow}
                        />
                    </View>
                </SlideModalEx>

                <Spinner visible={visible} textContent={I18n.t('Loading')} textStyle={{color:'#ffffff',fontSize:14,marginTop:-50}}/>
                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container:{

    },
    brandName:{
        fontSize: 14,
        textAlignVertical: 'center'
    },
    actPanel:{
        height:46
    },
    inputPanel:{
        height:46,
        flexDirection:'row',
        alignItems: 'center',
    },
    actName:{
        fontSize:14,
        flex:1
    },
    list:{
        marginTop:10
    },
    borderShadow:{
        borderRadius:10,
        backgroundColor:'#fff'
    }
});
