import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    DeviceEventEmitter
} from 'react-native';

import I18n from 'react-native-i18n';
import ModalBox from 'react-native-modalbox';
import {EMITTER_SUBMIT_WAIT} from "../common/Constant";
import OSSUtil from "../utils/OSSUtil";
import RouteMgr from "../notification/RouteMgr";

export default class ProgressIndicator extends Component {

    constructor(props) {
        super(props);
        this.state = {
            progress:0,
            progressShow:0,
            show:''
        };
    }

    componentWillMount(){
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_SUBMIT_WAIT,
            ()=>{
                this.setState({show:I18n.t('Jumping')});
            });
    }

    componentWillUnmount(){
        this.notifyEmitter && this.notifyEmitter.remove();
    }

    open(){
        this.modalBox.open();
        if(OSSUtil.getTotalcount() > 0){
            this.setState({progress:0},()=>{
                this.timer = setInterval(() => {
                    this.setState({progress: OSSUtil.getProgress(),progressShow:(OSSUtil.getProgress() / OSSUtil.getTotalcount()).toFixed(2, 10)});
                }, 50);
                RouteMgr.setIndicator(true);
            });
        }
    }


    close(){
        this.modalBox.close();
        OSSUtil.reset();
        this.timer && clearInterval(this.timer);
        RouteMgr.setIndicator(false);
    }

    render() {
        let text = I18n.t("Upload report", {total: OSSUtil.getTotalcount(),progress: this.state.progress});
        return (
            <ModalBox style={{width: 315,height: OSSUtil.getTotalcount() > 0 ? 200: 66 , borderRadius:10}} ref={(c)=> this.modalBox = c} position={"center"}
                      isDisabled={false}
                      swipeToClose={false}
                      backdropPressToClose={false}
                      backButtonClose={false}
                      coverScreen={true}>
                <View style={[styles.headPanel,(OSSUtil.getTotalcount() === 0) && {borderBottomStartRadius: 10, borderBottomEndRadius: 10}]}>
                    <Text style={styles.modalTitle}>{I18n.t('Uploading')}</Text>
                </View>
                {OSSUtil.getTotalcount() > 0 ?
                <View>
                <Text style={styles.modalTitle2}>{text}</Text>
                <View style={styles.progressBar}>
                    <View
                        style={{
                            position: 'absolute',
                            left: 24,
                            top: 30,
                            backgroundColor: '#eaedf2',
                            height: 5,
                            width: 265,
                            borderRadius:2
                        }}
                    />
                    <View
                        style={{
                            position: 'absolute',
                            left:24,
                            top: 30,
                            backgroundColor: '#f31d65',
                            height: 5,
                            width: this.state.progressShow * 265,
                            borderRadius:2
                        }}
                    />
                </View>
                <Text style={styles.modalTitle3}>{this.state.show}</Text>
                </View>  : null }
            </ModalBox>
        );
    }
}

var styles = StyleSheet.create({
    modalTitle:{
        marginTop: 24,
        marginLeft:24,
        fontSize: 19,
        color: '#86888A'
    },
    modalTitle2:{
        marginTop: 20,
        marginLeft:24,
        fontSize: 16,
        color: '#86888A'
    },
    progressBar: {
        width: 270,
        height: 20,
        alignItems: "center",
        justifyContent: 'center',
    },
    modalTitle3:{
        marginTop: 10,
        marginLeft:20,
        fontSize: 12,
        color: '#f59f23'
    },
    headPanel:{
        width:315,
        height:66,
        backgroundColor:'#F7F9FA',
        borderTopStartRadius:10,
        borderTopEndRadius:10
    }
});
