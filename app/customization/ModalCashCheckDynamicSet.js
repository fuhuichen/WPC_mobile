import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    Dimensions,
    Image,
    ScrollView,
    FlatList,
    TouchableOpacity,
    Platform, DeviceEventEmitter
} from "react-native";
import I18n from "react-native-i18n";
import ModalBox from "react-native-modalbox";
import {Actions} from "react-native-router-flux";
import PropTypes from 'prop-types';
import * as lib from '../common/PositionLib';
import {getStoreInfo} from "../common/FetchRequest";
import store from "../../mobx/Store";
import {Divider} from "react-native-elements";
import PhoneInfo from "../entities/PhoneInfo";
import * as BorderShadow from "../element/BorderShadow";
import CashCheckCore from "../cashcheck/checking/CashCheckCore";
import EventBus from "../common/EventBus";

const {width} = Dimensions.get('screen');
export default class ModalCashCheckDynamicSet extends Component {
    state = {
        enumSelector: store.enumSelector,
        cashcheckSelector: store.cashcheckSelector,
        categories: [],
        onCancel: false,
        onConfirm: false
    };

    static propTypes = {
        onConfirm: PropTypes.func
    };

    static defaultProps = {
    };

    async open(){
        let {cashcheckSelector} = this.state;

        this.setState({categories: JSON.parse(JSON.stringify(cashcheckSelector.categories))});
        
        this.action = false;
        this.modalBox && this.modalBox.open();
    }

    close(){
        this.setState({onCancel: false});
        this.modalBox && this.modalBox.close();
    }

    confirm(){
        this.action = true;
        this.setState({onConfirm: false});
        this.modalBox && this.modalBox.close();
    }

    onClosed(){
        if (this.action){
            let {cashcheckSelector, categories} = this.state;
            CashCheckCore.categoryDynamicSet(cashcheckSelector, categories);
            this.setState({cashcheckSelector}, ()=>{
                EventBus.updateBaseCashCheck();
            });
    
        }
    }

    dynamicSub(item) {
        let {categories} = this.state;
        categories.forEach(category => {
            if(category.id == item.id) {
                if(category.copyCount > 1) {
                    category.copyCount --;
                }
            }
        })
        this.setState({categories});
    }

    dynamicAdd(item) {
        let {categories} = this.state;
        categories.forEach(category => {
            if(category.id == item.id) {
                if(category.copyCount < category.copyMax) {
                    category.copyCount ++;
                }
            }
        })
        this.setState({categories});
    }

    renderItem = ({ item, index}) => {

        let subDisable = (item.copyCount == 1);
        let addDisable = (item.copyCount == item.copyMax);
        let subImg = subDisable ? require('../assets/img_calc_sub_disable.png') : require('../assets/img_calc_sub.png');
        let addImg = addDisable ? require('../assets/img_calc_add_disable.png') : require('../assets/img_calc_add.png');
        if(item.isDynamic == true && item.isCopy != true) {
            return (
                <View style={styles.content}>
                    <Text style={styles.contentText}>{item.name}</Text>
                    <View style={{flexDirection: 'row'}}>
                        <TouchableOpacity disabled={subDisable} onPress={()=>this.dynamicSub(item)}>
                            <Image source={subImg} style={styles.calcIcon}/>
                        </TouchableOpacity>
                        <Text style={[styles.contentInput, BorderShadow.div]}>{item.copyCount}</Text>
                        <TouchableOpacity disabled={addDisable} onPress={()=>this.dynamicAdd(item)}>
                            <Image source={addImg} style={styles.calcIcon}/>
                        </TouchableOpacity>
                    </View>
                </View>
            )
        } else {
            return null;
        }
    };

    render() {
        let {onCancel, onConfirm, categories} = this.state, width = 76, confirmWidth = 76;
        PhoneInfo.isJALanguage() && (width = 90);
        PhoneInfo.isIDLanguage() && (confirmWidth = 86);

        return (
            <ModalBox style={styles.modalBox} ref={(c)=> this.modalBox = c} position={"center"}
                      isDisabled={false}
                      swipeToClose={false}
                      backdropPressToClose={false}
                      backButtonClose={true}
                      onClosed={() => {this.onClosed()}}
                      coverScreen={true}>
                <View style={styles.headerPanel}>
                    <View style={styles.innerHead}>
                        <Text style={{fontSize: 19, color: '#86888A'}}>{I18n.t('CashCheck Dynamic Set')}</Text>
                    </View>
                </View>
                <FlatList style={styles.dataPanel}
                          showsVerticalScrollIndicator={false}
                          data={categories}
                          extraData={this.state}
                          keyExtractor={(item, index) => index.toString()}
                          renderItem={this.renderItem}/>
                <Divider style={styles.divider}/>
                <View style={styles.bottomPanel}>
                    <View style={styles.innerBottom}>
                        <TouchableOpacity onPressOut={() => {this.close()}} onPressIn={() => this.setState({onCancel: true})}>
                            <View style={{width:width,height:36,marginRight:8,borderColor: onCancel ? '#006AB7' : '#FFFFFF',borderWidth:1,
                                marginTop:8,borderRadius:10}}>
                                <Text style={styles.button}>{I18n.t('Cancel')}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPressOut={() => {this.confirm()}} onPressIn={() => this.setState({onConfirm: true})}>
                            <View style={{width:confirmWidth,height:36,marginRight:8,borderColor: onConfirm ? '#006AB7' : '#FFFFFF',borderWidth:1,
                                marginTop:8,borderRadius:10}}>
                                <Text style={[styles.button]}>
                                    {I18n.t('Confirm')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ModalBox>
        )
    }
}

const styles = StyleSheet.create({
    modalBox: {
        width: width-20,
        ...Platform.select({
            android:{
                height: 368
            },
            ios:{
                height: 386
            }
        }),
        borderRadius:10,
        backgroundColor:'transparent'
    },
    headerPanel:{
        height:71,
        justifyContent: 'center',
        alignItems:'center',
    },
    innerHead:{
        width:width-60,
        height:71,
        justifyContent: 'center',
        alignItems:'center',
        borderTopLeftRadius:10,
        borderTopRightRadius:10,
        backgroundColor:'#F7F9FA'
    },
    content:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems:'center',
        paddingRight: 20,
        paddingLeft: 20
    },
    contentText:{
        fontSize: 14, 
        color: '#86888A',
        maxWidth: 100
    },
    contentInput: {
        width:60,
        paddingTop:5,
        paddingBottom:5,
        paddingRight:10,       
        paddingLeft:10,
        borderRadius:5, 
        lineHeight:25,
        color:'#1E272E',
        textAlign:'center',
        backgroundColor:'#ffffff'
    },
    calcIcon: {
        width:25,
        height:25,
        margin:5
    },
    bottomPanel:{
        height: 52,
        backgroundColor:'transparent',
        alignItems:'center'
    },
    innerBottom:{
        height: 52,
        width:width-60,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        backgroundColor:'#FFFFFF',
        borderBottomLeftRadius:10,
        borderBottomRightRadius:10
    },
    button:{
        color: '#006AB7',
        height: 36,
        lineHeight:36,
        textAlignVertical: 'center',
        textAlign:'center',
        fontSize:16
    },
    dataPanel:{
        backgroundColor:'#F7F9FA',
        width:width-60,
        marginLeft:20
    },
    divider:{
        backgroundColor:'#EBF1F5',
        width:width-60,
        marginLeft:20,
        height:1,
        borderBottomWidth:0
    }
});
