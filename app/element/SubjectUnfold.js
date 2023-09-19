import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, DeviceEventEmitter} from "react-native";
import PropTypes from 'prop-types';
import rnTextSize from "react-native-text-size";
import {UPDATE_BASE_PATROL} from "../common/Constant";

const {width} = Dimensions.get('screen');
export default class SubjectUnfold extends Component {
    state = {
        lineCount: 1
    };

    static propTypes = {
        measureWidth: PropTypes.number,
        data: PropTypes.object,
        unfold: PropTypes.func
    };

    static defaultProps = {
        measureWidth: width-105
    };

    async componentDidMount(){
        await this.measure();
    }

    async measure(){
        let data = this.props.data;
        let measureWidth = this.props.measureWidth;

        const size = await rnTextSize.measure({
            text: data.subject,
            width: measureWidth
        });
        this.setState({lineCount: size.lineCount});
    }

    unfold(){
        let data = this.props.data;
        this.props.unfold && this.props.unfold(data);
    }

    render() {
        let data = this.props.data;
        let maxWidth = this.props.measureWidth;

        let {lineCount} = this.state;
        let numberOfLines = data.subjectUnfold ? lineCount : 1;
        let activeOpacity = (lineCount > 1) ? 0.6 : 1;
        let source = !data.subjectUnfold ? require('../assets/img_chart_down.png') : require('../assets/img_chart_up.png');

        return (
            <TouchableOpacity activeOpacity={activeOpacity} onPress={() => {(lineCount > 1) ? this.unfold() : {}}}>
                <View style={styles.container}>
                    <Text style={[styles.subject,{maxWidth}]} numberOfLines={numberOfLines}>{data.subject}</Text>
                    <View style={{flex:1}}/>
                    {
                        (lineCount > 1) ? <Image style={styles.arrow} source={source}/> : null
                    }
                </View>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    subject:{
        color: '#86888A',
        lineHeight:19
    },
    arrow:{
        width:18,
        height:10,
        marginTop:4
    }
});
