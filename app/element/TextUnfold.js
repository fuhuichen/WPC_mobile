import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, DeviceEventEmitter} from "react-native";
import PropTypes from 'prop-types';
import rnTextSize from "react-native-text-size";
import {UPDATE_BASE_PATROL} from "../common/Constant";

const {width} = Dimensions.get('screen');
export default class TextUnfold extends Component {
    state = {
        lineCount: 1
    };

    static propTypes = {
        data: PropTypes.object,
        sequence: PropTypes.number,
        unfold: PropTypes.func
    };

    async componentDidMount(){
        await this.measure();
    }

    componentWillMount() {
        this.emitter = DeviceEventEmitter.addListener(UPDATE_BASE_PATROL,()=>{
            (async () => {
                await this.measure();
            })();
        });
    }

    componentWillUnmount(){
        this.emitter && this.emitter.remove();
    }

    async measure(){
        let {data} = this.props;
        const size = await rnTextSize.measure({
            text: data.subject,
            width: width-120
        });
        this.setState({lineCount: size.lineCount});
    }

    unfold(){
        let {data} = this.props;
        this.props.unfold && this.props.unfold(data);
    }

    render() {
        let {data, sequence} = this.props;
        let {lineCount} = this.state;
        let numberOfLines = data.headUnfold ? lineCount : 1;
        let activeOpacity = (lineCount > 1) ? 0.6 : 1;
        let source = !data.headUnfold ? require('../assets/img_chart_down.png') : require('../assets/img_chart_up.png');

        return (
            <TouchableOpacity activeOpacity={activeOpacity} onPress={() => {(lineCount > 1) ? this.unfold() : {}}}>
                <View style={styles.container}>
                    <Text style={styles.subject} numberOfLines={numberOfLines}>{sequence+1}.{data.subject}</Text>
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
        maxWidth:width-104
    },
    arrow:{
        width:18,
        height:10,
        marginTop:4
    }
});
