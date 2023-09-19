import React, {Component} from 'react';
import {StyleSheet, View, Dimensions} from "react-native";
import PropTypes from 'prop-types';

const {width} = Dimensions.get('screen');
export default class TriangleShape extends Component {
    static propTypes = {
        color: PropTypes.string
    };

    static defaultProps = {
        color: '#ffffff'
    };

    render() {
        let {color} = this.props;
        return (
            <View style={[styles.container,{backgroundColor: color}]}>
                <View style={[styles.triangle,{borderLeftColor:color,borderBottomColor:color,
                    borderRightColor: color}]} />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container:{
        width:width,
        backgroundColor:'#fff'
    },
    triangle: {
        width:0,
        height:0,
        borderStyle:'solid',
        borderWidth:8,
        borderTopColor:'#E4E4E4',
        borderLeftColor:'#fff',
        borderBottomColor:'#fff',
        borderRightColor:'#fff',
        marginLeft: 60.5
    }
});
