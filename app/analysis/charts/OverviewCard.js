import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, Platform} from "react-native";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import * as BorderShadow from "../../element/BorderShadow";
import store from "../../../mobx/Store";
import PhoneInfo from "../../entities/PhoneInfo";

const {width} = Dimensions.get('screen');
export default class OverviewCard extends Component {
    state = {
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector
    };

    static propTypes = {
        viewType: PropTypes.number,
        unitType: PropTypes.number,
        title: PropTypes.string,
        content: PropTypes.string,
        onClick: PropTypes.func
    };

    static defaultProps = {
        title: '',
        content: '',
        unitType: 0
    };

    render() {
        let {enumSelector, analysisSelector} = this.state;
        let {title, viewType, unitType} = this.props;

        let content = analysisSelector.placeHolder, activeOpacity = 1, fontSize = 36, router = () => {};
        let unit = (unitType === enumSelector.unitType.TIMES) ? I18n.t('Times') : I18n.t('Count');
        if (viewType === enumSelector.viewType.SUCCESS){
            content = this.props.content;
            activeOpacity = 0.5;

            fontSize = (content.toString().length > 6) ? 20
                : ((content.toString().length > 4) ? 26 : fontSize);

            router = () => {this.props.onClick && this.props.onClick()};
        }

        let titlefontSize = 12;
        PhoneInfo.isTHLanguage() && (titlefontSize = 9);

        return (
            <TouchableOpacity activeOpacity={activeOpacity} onPress={() => router()}>
                <View style={[styles.container, BorderShadow.div]}>
                    <Text style={[styles.title, {fontSize: titlefontSize}]}>{title}</Text>
                    <View style={styles.panel}>
                        <Text style={[styles.content, {fontSize}]}>{content}</Text>
                    </View>
                    <Text style={styles.unit}>{unit}</Text>
                </View>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        width:(width-71)/2,
        height:109,
        borderRadius:10,
        backgroundColor:'#fff',
        alignItems:'center'
    },
    title:{
        fontSize:12,
        color:'rgb(100,104,109)',
        marginTop:10
    },
    panel:{
        height: 50
    },
    content:{
        color:'rgb(0,106,183)',
        height:50,
        lineHeight:50,
        textAlignVertical:'center'
    },
    unit:{
        fontSize:12,
        color:'rgb(134,136,138)',
        marginTop: 4
    }
});
