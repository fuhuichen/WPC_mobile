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
import {} from "../common/FetchRequest";
import store from "../../mobx/Store";
import {Divider} from "react-native-elements";
import PhoneInfo from "../entities/PhoneInfo";
import moment from "moment";

const {width} = Dimensions.get('screen');
export default class ModalSchedule extends Component {
    state = {
        enumSelector: store.enumSelector,
        selectIndex: 0,
        onCancel: false,
        onConfirm: false
    };

    static propTypes = {
        mode: PropTypes.number,
        onSelect: PropTypes.function
    };

    static defaultProps = {
        mode: store.enumSelector.patrolType.ONSITE
    };

    async open(){
        this.setState({selectIndex: 0}, () => {
            this.action = false;
            this.modalBox && this.modalBox.open();
        });
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
            let {data} = this.props;
            let {selectIndex} = this.state;
            this.props.onSelect(data[selectIndex]);
        }
    }

    renderModal = ({ item, index}) => {
        let color = this.checkSelect(item, index) ? '#404554': '#707070';
        let backColor = this.checkSelect(item, index) ? '#ECF7FF': null;
        let borderRadius = this.checkSelect(item, index) ? 4 : 0;
        let borderColor = this.checkSelect(item, index) ? '#2C90D9' : null;
        let borderWidth = this.checkSelect(item, index) ? 1 : 0;
        let remindTime = I18n.t('Start') + " : " + moment(item.remindTime).format("YYYY/MM/DD");
        return (
            <TouchableOpacity activeOpacity={1} onPress={() => this.selectSchedule(item, index)}>
                <View style={{height:70,backgroundColor: backColor, borderRadius,borderColor,borderWidth,
                    justifyContent:'center'}}>
                    <Text style={{fontSize:16,color:color,marginLeft:26}} numberOfLines={1}>{item.taskName}</Text>
                    <Text style={{fontSize:12,color:color,marginLeft:26}} numberOfLines={1}>{remindTime}</Text>
                </View>
            </TouchableOpacity>
        )
    };

    checkSelect(item, index) {
        let {selectIndex} = this.state
        return index === selectIndex;
    }

    selectSchedule(item, index) {
        this.setState({selectIndex:index});
    }

    render() {
        let {data} = this.props;
        let {onCancel, onConfirm} = this.state;
        let width = 76, confirmWidth = 76;
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
                        <Text style={{fontSize: 19, color: '#86888A'}}>{I18n.t('Select schedule')}</Text>
                    </View>
                </View>
                <FlatList style={styles.dataPanel}
                          showsVerticalScrollIndicator={false}
                          data={data}
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
