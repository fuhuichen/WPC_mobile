import React, {Component} from 'react';
import {StyleSheet, TextInput, View, Text, Dimensions, Image, TouchableOpacity, DeviceEventEmitter, Platform} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import store from "../../../mobx/Store";
import {Badge, Divider} from "react-native-elements";
import PropTypes from 'prop-types';
import EventBus from "../../common/EventBus";
import {inject, observer} from "mobx-react";
import CashCheckCore from "./CashCheckCore";
import TouchableOpacityEx from "../../touchables/TouchableOpacityEx";
import AccessHelper from '../../common/AccessHelper';
import * as BorderShadow from "../../element/BorderShadow";

const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class CashCheckCell extends Component {
    state = {
        cashcheckSelector: store.cashcheckSelector,
        enumSelector: store.enumSelector,
        value: null
    };

    constructor(props){
        super(props);
    }

    static propTypes = {
        showIndex: PropTypes.boolean,
        maximum: PropTypes.number.isRequired
    };

    static defaultProps = {
        showIndex: true
    };
    
    onChange(value) {
        let {cashcheckSelector} = this.state;
        let {data} = this.props;
        //let items = CashCheckCore.getItems(cashcheckSelector);

        CashCheckCore.setItemValue(cashcheckSelector, data.value.id, value);
        this.setState({cashcheckSelector, value}, function() {
            EventBus.updateBaseCashCheck();
        });
    }

    render() {
        let {enumSelector, cashcheckSelector} = this.state;
        let {data, showIndex, maximum} = this.props;
        let marginTop = (data.index !== 0) ? -2 : 0;
        let value = data.value.value;
        if(data.value.inputType == enumSelector.cashcheckInputType.SYSTEMCALC) {
            value = CashCheckCore.getSystemCalculateValue(cashcheckSelector, data.value.id);
            if(value == null) {
                value = 0;
            }
        }
        return (
            <TouchableOpacity activeOpacity={1}>
                <View style={[styles.container, {marginTop}]}>
                    <View style={{paddingBottom: 6}}>
                        <View style={styles.panel}>
                            <View style={styles.subject}>
                                {data.value.isRequired && <Text style={{color:'#C60957', lineHeight: 20}}>{'*'}</Text>}
                                <Text>
                                    {showIndex ? (data.index+1 + '.') : ''}
                                </Text>
                                <Text numberOfLines={2} style={{width:width-80}}>
                                    {data.value.subject}
                                </Text>
                            </View>
                        </View>
                        {data.value.inputType == enumSelector.cashcheckInputType.NUMBER && <TextInput
                            style={[styles.input, BorderShadow.div]}
                            value={(value != null) ? value.toString() : ''}
                            autoCorrect={true}
                            keyboardType={'numeric'}
                            onChangeText={this.onChange.bind(this)}
                        />}
                        {data.value.inputType == enumSelector.cashcheckInputType.STRING && <TextInput
                            style={[styles.input, BorderShadow.div]}
                            value={value}
                            autoCorrect={true}
                            onChangeText={this.onChange.bind(this)}
                        />}
                        {data.value.inputType == enumSelector.cashcheckInputType.SYSTEMCALC && <TextInput
                            style={styles.inputSystemCalc}
                            value={(value != null) ? value.toString() : ''}
                            editable={false}
                        />}
                        {(data.index === maximum-1) && <View style={{height:10}}></View>}
                    </View>
                    <View style={{flex:1}}/>
                    {
                        (data.index !== maximum-1) ?
                            <Divider style={styles.divider}/> : null
                    }
                </View>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    container:{
        paddingLeft:10,
        paddingRight:6,
        borderRadius:10,
    },
    select: {
        borderWidth:1,
        borderColor:'#2C90D9',
        borderRadius:10,
        paddingLeft: 9,
        paddingRight: 5,
    },
    panel:{
        marginTop:14
    },
    subject:{
        fontSize:14,
        maxWidth: width-60,
        flexDirection:'row',
        color:'#556679',
        paddingBottom: 5
    },
    missingView:{
        color:'#556679',
        //color:'#006AB7',
        fontSize:12,
        marginLeft:12,
    },
    missingCount:{
        width:16,
        height:16,
        backgroundColor:'green',
        borderRadius:8,
        marginRight:5
    },
    commented:{
        fontSize:12,
        color:'#85898E',
        marginLeft: 11
    },
    commentedRequire:{
        fontSize:12,
        color:'#C60957',
        marginLeft: 11
    },
    divider:{
        backgroundColor:'#F2F2F2',
        height:2,
        borderBottomWidth:0,
        marginTop:5
    },
    input: {
        width:width-60,
        maxHeight:120,
        paddingTop:5,
        paddingBottom:5,
        paddingRight:10,       
        paddingLeft:10,
        borderRadius:5, 
        color:'#1E272E',
        backgroundColor:'#ffffff'
    },
    inputSystemCalc: {
        width:width-60,
        maxHeight:120,
        paddingTop:5,
        paddingBottom:5,
        paddingRight:10,       
        paddingLeft:10,
        borderRadius:5, 
        color:'#1E272E',
        backgroundColor:'rgb(227,228,229)'
    }
});
