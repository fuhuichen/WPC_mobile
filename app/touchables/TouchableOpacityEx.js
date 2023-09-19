import React,{ Component } from "react";
import {TouchableOpacity, View} from "react-native";

class TouchableOpacityEx extends Component {
    constructor(props) {
        super(props);

        this.lastClickTime = 0;
        this.interval = this.props.interval ? this.props.interval*1000 : 1000;
    }

    onPress () {
        const clickTime = Date.now();
        if (!this.lastClickTime || Math.abs(this.lastClickTime - clickTime) > this.interval) {
            this.lastClickTime = clickTime;
            this.props.onPress ? this.props.onPress() : null;
        }
    }

    render() {
        return (
            <TouchableOpacity
                onPress={this.onPress.bind(this)}
                activeOpacity={this.props.activeOpacity || 0}
                style={this.props.style ? this.props.style : {}}
                disabled={this.props.disabled ? this.props.disabled : false}
            >
                {this.props.children}
            </TouchableOpacity>)
    }
}

export default TouchableOpacityEx;
