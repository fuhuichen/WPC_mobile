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
import CashCheckParser from "./CashCheckParser";
import PhoneInfo from "../../entities/PhoneInfo";
import * as lib from "../../common/PositionLib";
import ModalCenter from "../../components/ModalCenter";
import CashCheckStorage from "./CashCheckStorage";

const {width} = Dimensions.get('screen');
const paddingHorizontal = lib.paddingHorizontal();
export default class CashCheckPrompt extends Component {
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
            title: CashCheckParser.getStoreName(),
            context: I18n.t('Unfinished CashCheck')
        },()=>{
            this.modal && this.modal.open();
        });
    }

    cancel(){
        CashCheckStorage.delete(CashCheckParser.getUUID());
        this.props.cancel && this.props.cancel();
    }

    confirm(){
        console.log("CashCheckParser.getUUID() : ", CashCheckParser.getUUID());
        Actions.push('cashchecking', {uuid: CashCheckParser.getUUID()});
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
});
