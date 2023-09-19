import React, { Component } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    Platform, Dimensions, DeviceEventEmitter
} from 'react-native';

import ModalBox from 'react-native-modalbox';
import DatePicker from "react-native-date-picker";
import * as RNLocalize from "react-native-localize";
let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
import I18n from 'react-native-i18n';
import {ColorStyles} from "../common/ColorStyles";

export default class ShowCalendar extends Component {
    constructor(props){
        super(props);
        this.state = {
            date:new Date()
        }
    }

    open(date){
        this.setState({date:date});
        this.refs.modalBox.open();
    }

    confirm(){
        this.refs.modalBox.close();
        DeviceEventEmitter.emit('onTimeChange',this.state.date);
    }

    cancel(){
        this.refs.modalBox.close();
    }

    render() {
        return (
            <ModalBox style={styles.modalBox} ref={"modalBox"} position={"center"}
                      isDisabled={false}
                      swipeToClose={true}
                      backdropPressToClose={true}
                      backButtonClose={false}
                      coverScreen={true}>
                <View style={styles.headerPanel}>
                    <Text style={styles.headerTitle}>{I18n.t('Select time2')}</Text>
                    {/*<TouchableOpacity activeOpacity={0.5} onPress={this.close.bind(this)}>
                        <Image style={styles.closeIcon} source={require('../assets/images/img_detail_close.png')}/>
                    </TouchableOpacity>*/}
                </View>
                <View style={{height:1,backgroundColor:'#dcdcdc'}}/>
                <DatePicker date={this.state.date} mode='datetime' locale={RNLocalize.getLocales()[0].languageCode}
                    onDateChange={date => this.setState({ date })}
                />
                <View style={{marginLeft:12,marginRight: 12,justifyContent:'space-between',flexDirection:'row'}}>
                    <TouchableOpacity style={styles.buttomPanelCancel} onPress={this.cancel.bind(this)}>
                        <Text style={styles.buttomTextCancel}>{I18n.t('Cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttomPanelConfirm} onPress={this.confirm.bind(this)}>
                        <Text style={styles.buttomTextConfirm}>{I18n.t('Confirm')}</Text>
                    </TouchableOpacity>
                </View>
            </ModalBox>
        )
    }
}

const styles = StyleSheet.create({
    modalBox: {
        width: width-48,
        borderRadius:2,
        ...Platform.select({
            ios:{
                height: 330
            },
            android:{
                height: 300
            }
        })
    },
    headerPanel:{
        flexDirection:'row',
        justifyContent: 'center',
        height:56
    },
    headerTitle:{
        textAlign: 'center',
        textAlignVertical:'center',
        fontSize: 18,
        color: '#19293b',
        height:56,
        alignSelf: 'center',
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    },
    closeIcon:{
        width: 16,
        height: 16,
        marginLeft: 0,
        marginTop: 12
    },
    contentPanel:{
        marginLeft: 10,
        marginRight: 10,
        marginTop: 10,
        marginBottom: 10
    },
    buttomPanelConfirm:{
        width: 100,
        height: 44,
        backgroundColor:ColorStyles.COLOR_MAIN_RED
    },
    buttomTextConfirm:{
        fontSize: 16,
        color: '#ffffff',
        height:44,
        lineHeight:44,
        textAlign: 'center',
        textAlignVertical: 'center'
    },
    buttomPanelCancel:{
        width: 100,
        height: 44,
        borderWidth:1,
        borderColor:'#dcdcdc'
    },
    buttomTextCancel:{
        fontSize: 16,
        height:44,
        lineHeight:44,
        textAlign: 'center',
        textAlignVertical: 'center'
    },
});