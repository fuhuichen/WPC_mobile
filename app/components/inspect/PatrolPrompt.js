import React, { Component } from 'react';
import PropTypes from 'prop-types'
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    DeviceEventEmitter, Dimensions
} from 'react-native';

import ModalBox from 'react-native-modalbox';
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import {EMITTER_MODAL_CLOSE} from "../../common/Constant";
import PatrolParser from "./PatrolParser";
import PhoneInfo from "../../entities/PhoneInfo";
import * as lib from "../../common/PositionLib";
import ModalCenter from "../ModalCenter";
import PatrolStorage from "./PatrolStorage";

const {width} = Dimensions.get('screen');
const paddingHorizontal = lib.paddingHorizontal();
export default class PatrolPrompt extends Component {
    state = {
        title: '',
        context: ''
    };

    static propTypes={
        title: PropTypes.string,
        confirm: PropTypes.func,
        cancel: PropTypes.func
    };

    open(){
        this.setState({
            title: PatrolParser.getStoreName(),
            context: (PatrolParser.getMode() === 1) ? I18n.t('Unfinished onsite') : I18n.t('Unfinished remote')
        },()=>{
            this.modal && this.modal.open();
        });
    }

    cancel(){
        PatrolStorage.delete(PatrolParser.getUUID());
        this.props.cancel && this.props.cancel();
    }

    confirm(){
        Actions.push('patrol', {uuid: PatrolParser.getUUID()});
    }

    render() {
        let {title,context} = this.state;
        return (
            <ModalCenter ref={c => this.modal = c}
                         title={title}
                         description={context}
                         numberOfLines={1}
                         cancel={() => this.cancel()}
                         confirm={() => this.confirm()}/>
        )
    }
}

const styles = StyleSheet.create({
    modalBox: {
        width: 310,
        height: 150,
        borderRadius:3
    },
    modalTitle:{
        fontSize: 14,
        color: '#19293b',
        marginLeft:24
    },
    modalButtonPanel:{
        flexDirection: 'row'
    },
    cancelPanel:{
        width: 122,
        height: 34,
        backgroundColor: '#eaedf2',
        marginLeft: 24,
        marginTop: 30,
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
    confirmText:{
        fontSize: 14,
        height:34,
        color: '#ffffff',
        textAlignVertical:'center',
        lineHeight: 34
    },
    bottomPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        height: 40,
        marginBottom: 0
    },
    verticalLine:{
        width: 1,
        height: 40,
        backgroundColor:'#f5f5f5'
    },
    cancel:{
        color: '#484848',
        height: 40,
        lineHeight:40,
        textAlignVertical: 'center',
        textAlign:'center',
        marginBottom: 16,
        fontSize:16
    },
    confirm: {
        height: 40,
        lineHeight: 40,
        textAlignVertical: 'center',
        textAlign: 'center',
        marginBottom: 16,
        fontSize:16
    }
});
