import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, Platform} from "react-native";
import PropTypes from 'prop-types';
import I18n from 'react-native-i18n';
import store from "../../../mobx/Store";
import moment from "moment";
import TouchableInactive from "../../touchables/TouchableInactive";
import FilterCore from "./FilterCore";
import RangeSelector from "../../element/RangeSelector";
import EventBus from "../../common/EventBus";
import PhoneInfo from "../../entities/PhoneInfo";

const {width} = Dimensions.get('screen');
export default class FilterRange extends Component {
    state = {
        enumSelector: store.enumSelector
    };

    constructor(props){
        super(props);

        let {enumSelector} = this.state;
        this.options = [
            {
                type: enumSelector.rangeType.WEEK,
                name: I18n.t('Week')
            },
            {
                type: enumSelector.rangeType.MONTH,
                name: I18n.t('Month')
            },
            {
                type: enumSelector.rangeType.QUARTERLY,
                name: I18n.t('Quarterly')
            },
            {
                type: enumSelector.rangeType.YEAR,
                name: I18n.t('Year')
            }
        ]
    }

    static propTypes = {
        rangeType: PropTypes.number,
        ranges: PropTypes.array,
        onBackward: PropTypes.func,
        onForward: PropTypes.func,
        onRange: PropTypes.func
    };

    onBackward(){
        let {rangeType, ranges} = this.props;
        let newRanges = FilterCore.onBackward(rangeType, ranges);
        this.props.onBackward && this.props.onBackward(newRanges);

        EventBus.closeModalAll();
    }

    onForward(){
        let {rangeType, ranges} = this.props;
        let newRanges = FilterCore.onForward(rangeType, ranges);
        this.props.onForward && this.props.onForward(newRanges);

        EventBus.closeModalAll();
    }

    onSelect(item){
        let type = this.options.find(p => p.name === item).type;
        this.props.onRange && this.props.onRange(type);
    }

    renderTime(){
        let {rangeType, ranges} = this.props;
        let {enumSelector} = this.state, beginTime = '', endTime = '';

        let activeOpacity = 0.5, opacity = 1, forwardRouter = () => {this.onForward()};

        let range = ranges.find(p => p.type === rangeType);
        if (range != null){
            beginTime = moment(range.beginTs).format(range.format);

            if ((rangeType === enumSelector.rangeType.QUARTERLY) || (rangeType === enumSelector.rangeType.WEEK)){
                endTime = ` - ${moment(range.endTs).format(range.format)}`;
            }

            if (range.endTs === range.maxTs){
                activeOpacity = 1;
                opacity = 0.2;
                forwardRouter = () => {};
            }
        }

        return <View style={styles.timePanel}>
            <TouchableOpacity onPress={() => this.onBackward()}>
                <View style={styles.arrowPanel}>
                    <Image source={require('../../assets/img_range_left.png')} style={styles.arrow}/>
                </View>
            </TouchableOpacity>
            <View style={styles.timeArea}>
                <Text style={styles.time}>
                    {beginTime}{endTime}
                </Text>
            </View>
            <TouchableOpacity activeOpacity={activeOpacity} onPress={() => forwardRouter()}>
                <View style={styles.arrowPanel}>
                    <Image source={require('../../assets/img_range_right.png')} style={[styles.arrow,{marginLeft: 10, opacity}]}/>
                </View>
            </TouchableOpacity>
        </View>
    }

    renderRange(){
        let {rangeType} = this.props;
        let options = this.options.map(p => p.name);
        let defaultValue = this.options.find(p => p.type === rangeType).name;
        let containerStyle = styles.selectContainerStyle, widthOffset =  0;

        if (PhoneInfo.isEnLanguage() || PhoneInfo.isJALanguage()){
            containerStyle = styles.selectContainerStyleEx;
            widthOffset = 25;
        }

        return <RangeSelector options={options} majorKey={'range'}
                              defaultValue={defaultValue}
                              selectContainerStyle={containerStyle}
                              selectTextStyle={styles.selectTextStyle}
                              containerStyle={styles.containerStyle}
                              optionContainerStyle={{maxWidth:140}}
                              widthOffset={widthOffset}
                              onSelect={(item) => this.onSelect(item)}/>
    }

    render() {
        return (
            <View style={styles.container}>
                {this.renderTime()}
                {this.renderRange()}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        marginTop:20,
        height:26,
        paddingLeft: 10,
        paddingRight: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        ...Platform.select({
            ios:{
                zIndex:999
            }
        })
    },
    timePanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems:'center'
    },
    arrowPanel:{
        width:20,
        height:20,
        marginTop:5
    },
    arrow:{
        width: 8,
        height: 14
    },
    timeArea:{
        width:156,
        alignItems: 'center'
    },
    time:{
        fontSize:16,
        color:'rgb(134,136,138)',
        marginTop: -1
    },
    selectContainerStyle:{
        width:80,
        height:26,
        backgroundColor:'rgb(0,104,180)',
        marginTop:5,
        borderRadius:12
    },
    selectContainerStyleEx:{
        width:105,
        height:26,
        backgroundColor:'rgb(0,104,180)',
        marginTop:5,
        borderRadius:12
    },
    selectTextStyle:{
        fontSize: 14,
        color:'#fff',
        marginLeft: 17,
        height:26,
        lineHeight:26,
        textAlignVertical:'center'
    },
    containerStyle:{
        maxWidth:120,
        marginLeft:-20
    }
});
