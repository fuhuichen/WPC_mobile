import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, DeviceEventEmitter} from "react-native";
import PropTypes from 'prop-types';
import rnTextSize from "react-native-text-size";
import {UPDATE_BASE_PATROL} from "../common/Constant";

const {width} = Dimensions.get('screen');
export default class DetailUnfold extends Component {
    state = {
        lineCount: 1
    };

    static propTypes = {
        data: PropTypes.object,
        unfold: PropTypes.func
    };

    async componentDidMount(){
        await this.measure();
    }

    async measure(){
        let data = this.props.data;
        const size = await rnTextSize.measure({
            text: (data.description != null) ? data.description : '',
            width: width-105
        });
        this.setState({lineCount: size.lineCount});
    }

    unfold(){
        let data = this.props.data;
        this.props.unfold && this.props.unfold(data);
    }

    render() {
        let data = this.props.data;
        let {lineCount} = this.state;
        let numberOfLines = data.detailUnfold ? lineCount : 1;
        let activeOpacity = (lineCount > 1) ? 0.6 : 1;
        let source = !data.detailUnfold ? require('../assets/img_chart_down.png') : require('../assets/img_chart_up.png');
        let detail = ((data.description != null) && (data.description !== '')) ? data.description : '--';
        return (
            <TouchableOpacity activeOpacity={activeOpacity} onPress={() => {(lineCount > 1) ? this.unfold() :{}}}>
                <View style={styles.container}>
                    <Text style={styles.subject} numberOfLines={numberOfLines}>{detail}</Text>
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
        justifyContent: 'flex-end',
        marginTop: 12
    },
    subject:{
        color: '#86888A',
        maxWidth:width-105,
        lineHeight:19
    },
    arrow:{
        width:18,
        height:10,
        marginTop:4
    }
});
