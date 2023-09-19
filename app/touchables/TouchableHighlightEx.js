import React,{ Component } from "react";
import {TouchableHighlight, View} from "react-native";

class TouchableHighlightEx extends Component {
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
            <TouchableHighlight
                onPress={this.onPress.bind(this)}
                underlayColor={this.props.underlayColor ? this.props.underlayColor : '#ffffff'}
                style={this.props.style ? this.props.style : {}}
                disabled={this.props.disabled ? this.props.disabled : false}
            >
                {this.props.children}
            </TouchableHighlight>)
    }
}

export default TouchableHighlightEx;
