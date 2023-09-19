import React, { Component } from "react"
import {Platform, BackHandler} from "react-native"
import PropTypes from 'prop-types'

export default class AndroidBacker extends Component {
    static propTypes = {
        onPress: PropTypes.func
    };

    componentDidMount() {
        if (Platform.OS === "android") {
            this.listener = BackHandler.addEventListener("hardwareBackPress", () => {
                return this.props.onPress()
            })
        }
    }

    componentWillUnmount(){
        if (Platform.OS === "android"){
            this.listener && this.listener.remove();
        }
    }

    render() {
        return null;
    }
}
