import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity} from "react-native";
import PropTypes from 'prop-types';

const {width} = Dimensions.get('screen');
export default class DataCell extends Component {
    static propTypes = {
        showPercent: PropTypes.boolean,
        data: PropTypes.object,
        onRow: PropTypes.func
    };

    static defaultProps: {
        showPercent: false
    };

    onClick(){
        this.props.onRow && this.props.onRow();
    }

    renderTitle(){
        let {data} = this.props;

        return <View style={styles.namePanel}>
            <Text style={styles.title} numberOfLines={1}>{data.title}</Text>
        </View>
    }

    renderTimes(){
        let {data} = this.props;

        return <View style={styles.timesPanel}>
            <Text style={styles.title} numberOfLines={1}>{data.times}</Text>
        </View>
    }

    renderScore(){
        let {data, showPercent} = this.props;
        let unit = showPercent ? '%' : '';

        return <View  style={styles.scorePanel}>
            <Text style={[styles.title, {marginRight:16}]} numberOfLines={1}>{data.score}{unit}</Text>
            <Image source={require('../../assets/img_row_label.png')} style={styles.label}/>
        </View>
    }

    render() {
        return (
            <TouchableOpacity activeOpacity={0.5} onPress={() => this.onClick()}>
                <View style={styles.container}>
                    {this.renderTitle()}
                    {this.renderTimes()}
                    {this.renderScore()}
                </View>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection:'row',
        justifyContent:'flex-start',
        alignItems:'center',
        height:55
    },
    namePanel:{
        width:171,
        paddingLeft: 16
    },
    title:{
        maxWidth:150,
        fontSize:14,
        color:'rgb(100,104,109)'
    },
    timesPanel:{
        flex:1,
        flexDirection: 'row',
        justifyContent:'flex-start',
        paddingLeft:6
    },
    scorePanel:{
        flex:1,
        flexDirection: 'row',
        justifyContent:'flex-end',
        paddingRight:16
    },
    label:{
        width:16,
        height:16,
        marginTop:2
    }
});
