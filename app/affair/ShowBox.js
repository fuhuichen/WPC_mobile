import React, { Component } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    Platform,
    ScrollView,
    Dimensions,
    DeviceEventEmitter
} from 'react-native';

import ModalBox from 'react-native-modalbox';
import I18n from 'react-native-i18n';
import {EMITTER_MODAL_CLOSE} from "../common/Constant";
let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class ShowBox extends Component {
    constructor(props){
        super(props);
        this.state = {
            content: []
        }
    }

    componentWillMount(){
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_MODAL_CLOSE,
            ()=>{
                this.close();
            });
    }

    componentWillUnmount(){
        this.notifyEmitter && this.notifyEmitter.remove();
    }

    open(content){
        this.setState({content:content});
        this.refs.modalBox && this.refs.modalBox.open();
    }

    close(){
        this.refs.modalBox && this.refs.modalBox.close();
    }

    render() {
        return (
            <ModalBox style={styles.modalBox} ref={"modalBox"} position={"center"}
                      isDisabled={false}
                      swipeToClose={false}
                      backdropPressToClose={false}
                      backButtonClose={true}
                      coverScreen={true}>

                <View style={styles.headerPanel}>
                    <Text style={styles.headerTitle}>{I18n.t('Transaction detail')}</Text>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.close.bind(this)}>
                        <Image style={styles.closeIcon} source={require('../assets/images/img_detail_close.png')}/>
                    </TouchableOpacity>
                </View>
                <View style={{height:1,backgroundColor:'#dcdcdc'}}/>
                <ScrollView showsVerticalScrollIndicator={true} keyboardShouldPersistTaps={'handled'}>
                    <View style={styles.contentPanel}>
                        {this.state.content}
                    </View>
                </ScrollView>
            </ModalBox>
        )
    }
}

const styles = StyleSheet.create({
    modalBox: {
        width: width-24,
        height: height*0.618,
        borderRadius:2
    },
    headerPanel:{
        flexDirection:'row',
        justifyContent: 'center',
        height:56
    },
    headerTitle:{
        textAlign: 'center',
        textAlignVertical:'center',
        alignItems:'center',
        justifyContent:'center',
        fontSize: 18,
        color: '#19293b',
        height:56,
        width: width-24-56,
        alignSelf: 'center',
        marginLeft: 28
    },
    closeIcon:{
        width: 16,
        height: 16,
        marginRight: 12,
        marginTop: 12
    },
    contentPanel:{
        paddingLeft:8,
        paddingRight:8,
        marginTop:5,
        marginBottom: 10
    }
});
