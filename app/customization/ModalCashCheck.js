import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
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
import {getCashCheckExecuteFormList, getCashCheckAdvancedConfig} from "../cashcheck/FetchRequest";
import store from "../../mobx/Store";
import {Divider} from "react-native-elements";
import PhoneInfo from "../entities/PhoneInfo";

const {width} = Dimensions.get('screen');
export default class ModalCashCheck extends Component {
    state = {
        enumSelector: store.enumSelector,
        selectIndex: 0,
        selectSubmittable: null,
        formId: null,
        data: [],
        onCancel: false,
        onConfirm: false
    };

    static propTypes = {
        storeId: PropTypes.string.isRequired,
        mode: PropTypes.number,
        onSelect: PropTypes.function,
        onSign: PropTypes.func
    };

    static defaultProps = {
        mode: store.enumSelector.patrolType.ONSITE,
    };

    async open(){
        let {mode, storeId} = this.props;
        let {enumSelector} = this.state;

        let body = {
            storeId: storeId
        }
        let result = await getCashCheckExecuteFormList(body);
        if (result.errCode !== enumSelector.errorType.SUCCESS){
            DeviceEventEmitter.emit('Toast', I18n.t('Cashcheck get form list failed'));
            return;
        }
        if (result.data.length === 0){
            DeviceEventEmitter.emit('Toast', I18n.t('No Cashcheck Form'));
            return;
        }

        this.setState({data: result.data, selectIndex: 0, formId: result.data[0].formId, selectSubmittable: result.data[0].submittable}, () => {
            this.action = false;
            this.modalBox && this.modalBox.open();
        });
    }

    close(){
        this.setState({onCancel: false});
        this.modalBox && this.modalBox.close();
    }

    async confirm(){
        let {selectSubmittable, formId, enumSelector} = this.state;
        if(selectSubmittable == false) {
            let interval = '';
            let body = {
                formId: formId
            }
            let result = await getCashCheckAdvancedConfig(body);
            if(result.errCode == enumSelector.errorType.SUCCESS) {
                let advancedConfig = result.data;
                if (advancedConfig.period_restrict_unit == enumSelector.dateUnit.DAY) {
                    interval = I18n.t('Day within', {number: advancedConfig.period_restrict_limited});
                } else if (advancedConfig.period_restrict_unit == enumSelector.dateUnit.MONTH) {
                    interval = I18n.t('Month within', {number: advancedConfig.period_restrict_limited});
                } else if (advancedConfig.period_restrict_unit == enumSelector.dateUnit.YEAR) {
                    interval = I18n.t('Year within', {number: advancedConfig.period_restrict_limited});
                }
            }
            DeviceEventEmitter.emit('Toast', I18n.t('CashCheck Submit Fail', {interval: interval}));
            return;            
        }
        this.action = true;
        this.setState({onConfirm: false});
        this.modalBox && this.modalBox.close();
    }

    onClosed(){
        if (this.action){
            let {formId} = this.state;
            this.props.onSign(formId);
        }
    }

    renderModal = ({ item, index}) => {
        let color = this.checkSelect(index) ? '#404554': '#707070';
        let backColor = this.checkSelect(index) ? '#ECF7FF': null;
        let borderRadius = this.checkSelect(index) ? 4 : 0;
        let borderColor = this.checkSelect(index) ? '#2C90D9' : null;
        let borderWidth = this.checkSelect(index) ? 1 : 0;
        return (
            <TouchableOpacity activeOpacity={1} onPress={() => this.selectForm(item, index)}>
                <View style={{height:52,backgroundColor: backColor, borderRadius,borderColor,borderWidth,
                    justifyContent:'center'}}>
                    <Text style={{fontSize:16,color:color,marginLeft:26}} numberOfLines={1}>{item.formName}</Text>
                </View>
            </TouchableOpacity>
        )
    };

    checkSelect(index) {
        let {selectIndex} = this.state;
        return index === selectIndex;
    }

    selectForm(item, index) {
        this.setState({selectIndex:index, formId: item.formId, selectSubmittable: item.submittable});
    }

    render() {
        let {onCancel, onConfirm} = this.state, width = 76, confirmWidth = 76;
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
                        <Text style={{fontSize: 19, color: '#86888A'}}>{I18n.t('Select CashCheck')}</Text>
                    </View>
                </View>
                <FlatList style={styles.dataPanel}
                          showsVerticalScrollIndicator={false}
                          data={this.state.data}
                          extraData={this.state}
                          keyExtractor={(item, index) => index.toString()}
                          renderItem={this.renderModal}/>
                <Divider style={styles.divider}/>
                <View style={styles.bottomPanel}>
                    <View style={styles.innerBottom}>
                        <TouchableOpacity onPressOut={() => {this.close()}} onPressIn={() => this.setState({onCancel: true})}>
                            <View style={{width:width,height:36,marginRight:8,borderColor: onCancel ? '#006AB7' : '#FFFFFF',borderWidth:1,
                                marginTop:8,borderRadius:10}}>
                                <Text style={styles.button}>{I18n.t('Cancel')}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPressOut={async () => {this.confirm()}} onPressIn={() => this.setState({onConfirm: true})}>
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
