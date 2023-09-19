import React, {Component} from 'react';
import {TouchableOpacity} from "react-native";
import PropTypes from "prop-types";

export default class TouchableInactive extends Component {
    static propTypes =  {
        onPress: PropTypes.function
    };

    onPress(){
        this.props.onPress && this.props.onPress();
    }

    render() {
        return (
            <TouchableOpacity activeOpacity={1} style={[{flex:1},this.props.style]}
                onPress={()=>{this.onPress()}}>
                {this.props.children}
            </TouchableOpacity>
        )
    }
}
