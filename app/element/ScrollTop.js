import React, {Component} from 'react';
import {StyleSheet, Image, TouchableOpacity, View} from "react-native";
import PropTypes from 'prop-types';
import * as lib from '../common/PositionLib';

const paddingHorizontal = lib.paddingHorizontal();
export default class ScrollTop extends Component {
    static propTypes = {
        onScroll: PropTypes.function,
        showOperator: PropTypes.boolean
    };

    static defaultProps = {
        showOperator: false
    };

    render() {
        let {showOperator} = this.props;
        return (
            showOperator ? <View style={styles.container}>
                <TouchableOpacity activeOpacity={0.6} onPress={() => {this.props.onScroll && this.props.onScroll()}}  >
                    <Image source={require('../assets/img_scroll_top.png')} style={styles.image}/>
                </TouchableOpacity>
            </View> : null
        )
    }
}

const styles = StyleSheet.create({
    container: {
        position:'absolute',
        right: paddingHorizontal-4,
        bottom: 20
    },
    image:{
        width: 42,
        height: 42
    }
});
