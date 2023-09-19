import React, {Component} from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
    TextInput,
    DeviceEventEmitter,
    NativeModules
} from 'react-native';

import ModalBox from 'react-native-modalbox';
import {ColorStyles} from '../../../common/ColorStyles';
import I18n from 'react-native-i18n';
import dismissKeyboard from 'react-native-dismiss-keyboard';
import EzvizCache from "./EzvizCache";
import {EMITTER_MODAL_CLOSE} from "../../../common/Constant";
const MyViewManager = NativeModules.MyViewManager;


export default class EzvizModal extends Component {
    constructor(props){
        super(props);

        this.state = {
            password: '',
            open: false,
            cancel: true,
            device: null
        }
    }

    componentWillMount(){
        this.ezvizEmitter = DeviceEventEmitter.addListener('EzvizModal',
            (device) => {
                setTimeout(()=>{
                    this.setState({open:true,device});
                },100);
            });

        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_MODAL_CLOSE,
            ()=>{
                this.cancel();
            });
    }

    componentWillUnmount(){
        this.ezvizEmitter && this.ezvizEmitter.remove();
        this.notifyEmitter && this.notifyEmitter.remove();
    }

    cancel(){
        this.setState({cancel: true,open:false,password:''});
        dismissKeyboard();
    }

    confirm(){
        this.setState({cancel:false,open:false});
        dismissKeyboard();
    }

    onClose(){
        if(!this.state.cancel){
            let verifyCode = this.state.password;
            this.state.device && EzvizCache.save(this.state.device.serialId,
                this.state.device.channelId,verifyCode);
            if (Platform.OS === 'android'){
                DeviceEventEmitter.emit('onSetVerifyCode',null);
            }
            else{
                MyViewManager.setVerifyCode(verifyCode);
                DeviceEventEmitter.emit('onSetVerifyCode',null);
            }
            this.setState({password:''});
        }
    }

    onChanged(text){
        this.setState({password:text});
    }

    render() {
        return (
            <ModalBox style={styles.modalBox} ref={"modalBox"} position={"center"}
                      isDisabled={false}
                      swipeToClose={false}
                      backdropPressToClose={false}
                      animationDuration={0}
                      backButtonClose={true}
                      coverScreen={true}
                      isOpen={this.state.open}
                      onClosed={()=>this.onClose()}>
                <View style={{height:56,alignItems:'center'}}>
                    <Text style={styles.modalTitle}>{I18n.t('Ezviz dialog head')}</Text>
                </View>
                <View style={{width:310,height:1,backgroundColor:'#dcdcdc'}}/>
                <Text style={{fontSize:14,color:'#19293b',marginLeft:24,marginRight:24,marginTop:28,numberOfLines:2}}>
                    {I18n.t('Ezviz dialog body')}
                </Text>
                <TextInput
                    style={styles.input}
                    placeholder={''}
                    autoCorrect={false}
                    autoCapitalize={'none'}
                    returnKeyType={'done'}
                    placeholderTextColor=""
                    underlineColorAndroid="transparent"
                    secureTextEntry={true}
                    value={this.state.password}
                    onChangeText={this.onChanged.bind(this)}
                />
                <Text style={{fontSize:12,color:'#989ba3',marginLeft:24,marginRight:24,marginTop:10,numberOfLines:1}}>
                    {I18n.t('Ezviz dialog tail')}
                </Text>
                <View style={styles.modalButtonPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.cancel.bind(this)}>
                        <View style={styles.cancelPanel}>
                            <Text style={styles.cancelText}>{I18n.t('Cancel')}</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.confirm.bind(this)}>
                        <View style={styles.confirmPanel}>
                            <Text style={styles.confirmText}>{I18n.t('Confirm')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ModalBox>
        )
    }
}

const styles = StyleSheet.create({
    modalBox: {
        width: 310,
        height: 283,
        borderRadius:2
    },
    modalTitle:{
        textAlign: 'center',
        fontSize: 18,
        color: '#19293b',
        textAlignVertical:'center',
        height:56,
        ...Platform.select({
            ios:{
                lineHeight:56
            }
        })
    },
    modalButtonPanel:{
        flexDirection: 'row'
    },
    cancelPanel:{
        width: 122,
        height: 34,
        backgroundColor: '#eaedf2',
        marginLeft: 24,
        marginTop: 20,
        alignItems:'center',
        borderRadius:3
    },
    cancelText:{
        fontSize: 14,
        height:34,
        color: '#989ba3',
        textAlignVertical:'center',
        lineHeight:34
    },
    confirmPanel:{
        width: 122,
        height: 34,
        backgroundColor: ColorStyles.COLOR_MAIN_RED,
        marginLeft: 18,
        marginTop: 20,
        alignItems:'center',
        borderRadius:3
    },
    confirmText:{
        fontSize: 14,
        height:34,
        color: '#ffffff',
        textAlignVertical:'center',
        lineHeight: 34
    },
    input: {
        backgroundColor: 'transparent',
        width: 310-24*2,
        height: 40,
        marginHorizontal: 24,
        marginTop:20,
        borderWidth:1,
        borderRadius:3,
        color:'#19293b',
        fontSize: 14,
        borderColor:'#dcdcdc',
    }
});