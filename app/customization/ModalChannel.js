import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    TouchableOpacity,
    Platform,
} from "react-native";
import I18n from "react-native-i18n";
import ModalBox from "react-native-modalbox";
import {Divider} from "react-native-elements";
import PhoneInfo from "../entities/PhoneInfo";
import VideoChannelFull from './VideoChannelFull';

const MODAL_WIDTH = 438;
export default class ModalChannel extends Component {
    state = {
        selectIndex: 0,
        data: [],
        onCancel: false,
        onConfirm: false,
        devices: [],
        deviceId: -1,
    };
 
    open(devices,deviceId){
        this.setState({devices,deviceId}, () => {
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
            let {selectIndex} = this.state;
            this.props.onSelect(selectIndex);
        }
    } 

    render() {
        let {onCancel, onConfirm,devices,deviceId} = this.state, width = 76;
        PhoneInfo.isJALanguage() && (width = 90);

        return (
            <ModalBox style={styles.modalBox} ref={(c)=> this.modalBox = c} position={"center"}
                      isDisabled={false}
                      swipeToClose={false}
                      backdropPressToClose={false}
                      backButtonClose={true}
                      onClosed={() => {this.onClosed()}}
                      coverScreen={true}>
                <View/>

                <View style={styles.headerPanel}>
                    <View style={styles.innerHead}>
                        <Text style={{fontSize: 19, color: '#86888A'}}>{I18n.t('Switch channel')}</Text>
                    </View>
                </View>

                <Divider style={styles.divider}/>    
                <View style={{width:MODAL_WIDTH,height:178,backgroundColor:'#F7F9FA'}}>
                    <VideoChannelFull width={MODAL_WIDTH} data={devices} deviceId={deviceId} onChannel={(index) => {
                        this.setState({selectIndex:index});
                    }}/>
                </View>

                <View style={styles.bottomPanel}>
                    <View style={styles.innerBottom}>
                        <TouchableOpacity onPressOut={() => {this.close()}} onPressIn={() => this.setState({onCancel: true})}>
                            <View style={{width:width,height:36,marginRight:8,borderColor: onCancel ? '#006AB7' : '#FFFFFF',borderWidth:1,
                                marginTop:8,borderRadius:10}}>
                                <Text style={styles.button}>{I18n.t('Cancel')}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPressOut={() => {this.confirm()}} onPressIn={() => this.setState({onConfirm: true})}>
                            <View style={{width:76,height:36,marginRight:8,borderColor: onConfirm ? '#006AB7' : '#FFFFFF',borderWidth:1,
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
        width: MODAL_WIDTH,
        height: 289,
        borderRadius:10,
        backgroundColor:'transparent',    
    },
    headerPanel:{
        height:51,
        justifyContent: 'center',
        alignItems:'center',
    },
    innerHead:{
        width:MODAL_WIDTH,
        height:51,
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
        width:MODAL_WIDTH,
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
        width:MODAL_WIDTH,
        marginLeft:20
    },
    divider:{
        backgroundColor:'#EBF1F5',
        width:MODAL_WIDTH,
        height:1,
        borderBottomWidth:0
    }
});
