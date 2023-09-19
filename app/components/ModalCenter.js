import React, { Component } from 'react';
import PropTypes from 'prop-types'
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    DeviceEventEmitter, Dimensions, Platform
} from 'react-native';

import ModalBox from 'react-native-modalbox';
import I18n from 'react-native-i18n';
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet'
import {Divider} from "react-native-elements";
import {EMITTER_MODAL_CLOSE} from "../common/Constant";
import PhoneInfo from "../entities/PhoneInfo";

type Props = {
    modalStyle: ViewStyleProp,
}

const {width} = Dimensions.get('screen');
export default class ModalCenter extends Component {
    state = {
        onCancel:false,
        onConfirm:false,
        onPatrol: false
    };

    static propTypes = {
        title: PropTypes.string,
        description:PropTypes.string,
        height: PropTypes.number,
        enableDraw: PropTypes.boolean,
        enablePatrol: PropTypes.boolean,
        showCancel: PropTypes.boolean,
        cancel: PropTypes.func,
        confirm: PropTypes.func,
        patrol: PropTypes.func,
        numberOfLines: PropTypes.number
    };

    static defaultProps = {
        height: 200,
        enableDraw: false,
        enablePatrol: false,
        showCancel: true,
        numberOfLines: 5
    };

    componentWillMount(){
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_MODAL_CLOSE,
            ()=>{
                this.cancel();
            });
    }

    componentWillUnmount(){
        this.notifyEmitter && this.notifyEmitter.remove();
    }

    open(){
        this.refs.modalBox.open();
    }

    openEx(title){
        this.setState({cancel:I18n.t('Cancel'),confirm:I18n.t('Confirm'),title},()=>{
           this.open();
        })
    }

    close(){
        this.cancel();
    }

    patrol(){
        this.setState({onPatrol:false});
        this.refs.modalBox && this.refs.modalBox.close();

        this.props.patrol && this.props.patrol();
    }

    cancel(){
        this.props.enableDraw && DeviceEventEmitter.emit('drawerOffset', true);

        this.setState({onCancel:false});
        this.refs.modalBox && this.refs.modalBox.close();

        setTimeout(() => {
            this.props.cancel && this.props.cancel();
        }, Platform.select({android:0, ios: 500}));
    }

    confirm(){
        this.props.enableDraw && DeviceEventEmitter.emit('drawerOffset', true);

        this.setState({onConfirm:false});
        this.refs.modalBox && this.refs.modalBox.close();

        setTimeout(() => {
            this.props.confirm && this.props.confirm();
        },500);
    }

    render() {
        let {height, title, description, showCancel, enablePatrol, numberOfLines} = this.props;
        let {onCancel,onConfirm, onPatrol} = this.state, width = 76, confirmWidth = 76, marginRight = 8;
        PhoneInfo.isJALanguage() && (width = 90);
        PhoneInfo.isJALanguage() && (marginRight = 20);
        PhoneInfo.isIDLanguage() && (confirmWidth = 86);
        PhoneInfo.isIDLanguage() && (width = 66);

        return (
            <ModalBox style={[styles.modalBox, this.props.modalStyle,{height}]} ref={"modalBox"} position={"center"}
                      isDisabled={false}
                      swipeToClose={false}
                      backdropPressToClose={false}
                      backButtonClose={true}
                      coverScreen={true}>
                <View style={[styles.modalContent,{height: height-53}]}>
                    <View style={styles.modalText}>
                        <View style={styles.titlePanel}>
                            <Text style={styles.modalTitle} numberOfLines={numberOfLines}>{title}</Text>
                        </View>
                        <Text style={styles.modalDescription}>{description}</Text>
                    </View>
                    <Image style={styles.warning} source={require('../assets/images/warning_icon_model.png')}/>
                </View>
                <Divider style={styles.divider}/>
                <View style={styles.modalButtonPanel}>
                    {
                        enablePatrol ? <TouchableOpacity activeOpacity={1} onPressIn={()=>this.setState({onPatrol:true})} onPressOut={()=>this.patrol()}>
                            <View style={[styles.patrol,{borderWidth:onPatrol ? 1 : 0}]}>
                                <Text style={[styles.content,{color:'#F57848'}]}>{I18n.t('Patrol unhandled')}</Text>
                            </View>
                        </TouchableOpacity> : null
                    }
                    {
                        showCancel ? <TouchableOpacity activeOpacity={1} onPressIn={()=>this.setState({onCancel:true})} onPressOut={()=>this.cancel()}>
                            <View style={[styles.operator,{borderWidth:onCancel ? 1 : 0, width, marginRight}]}>
                                <Text style={styles.content}>{I18n.t('Cancel')}</Text>
                            </View>
                        </TouchableOpacity> : null
                    }

                    <TouchableOpacity activeOpacity={1} onPressIn={()=>this.setState({onConfirm:true})} onPressOut={()=>this.confirm()}>
                        <View style={[styles.operator,{borderWidth:onConfirm ? 1 : 0, width:confirmWidth}]}>
                            <Text style={styles.content}>{I18n.t('Confirm')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ModalBox>
        )
    }
}

const styles = StyleSheet.create({
    modalBox: {
        width: 315,
        borderRadius: 10
    },
    modalContent:{
        backgroundColor:'#F7F9FA',
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    modalText:{
        paddingTop:24,
        paddingLeft:24,
        paddingRight:24
    },
    titlePanel:{
        paddingRight: 30
    },
    modalTitle:{
        marginBottom: 19,
        fontSize: 19,
        color: '#86888A'
    },
    modalDescription:{
        fontSize: 16,
        color: '#86888A'
    },
    modalButtonPanel:{
        flexDirection: 'row',
        justifyContent:'flex-end',
        height:52,
        alignItems: 'center'
    },
    operator:{
        width:76,
        height:36,
        borderRadius:10,
        borderColor:'#006AB7',
        marginRight:8
    },
    content:{
        fontSize: 16,
        height: 36,
        color: '#006AB7',
        textAlign:'center',
        textAlignVertical:'center',
        lineHeight: 36
    },
    patrol:{
        width:110,
        height:36,
        borderRadius:10,
        borderColor:'#F57848',
        marginRight:21,
    },
    warning:{
        position: 'absolute',
        top: 18,
        right: 18,
        width:30,
        height:30
    },
    divider:{
        backgroundColor:'#EBF1F5',
        height:1,
        borderBottomWidth:0
    }
});
