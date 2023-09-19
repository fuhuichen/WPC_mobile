import React, {Component} from 'react';
import {StyleSheet, View} from "react-native";
import PropTypes from 'prop-types';

export default class SlotView extends Component {
    static propTypes = {
        containerStyle: PropTypes.style
    };

    static defaultProps = {
        containerStyle: {}
    };

    render() {
        let {containerStyle} = this.props;
        return (
            <View style={[styles.container,{...containerStyle}]} />
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
});
