import React, {Component} from 'react';

import {
    StyleSheet,
    View,
    TouchableOpacity,
    Image,
    Text
} from 'react-native';

import SoundUtil from "../utils/SoundUtil";

export default class SoundTouch extends Component {

    constructor(props) {
        super(props);
        this.state = {
        };
    }

    componentDidMount() {
    }

    componentWillUnmount(){
        SoundUtil.stop();
    }

    onPressAudio(){
        SoundUtil.play(this.props.path);
    }

    render() {
        let sound = null;
        if ( SoundUtil.checkPath(this.props.path) ){ sound = (
            <TouchableOpacity  onPress={()=>this.onPressAudio()}>
                <Image  style={{width:34,height:34}} source={require('../assets/images/event_voice.png')}/>
            </TouchableOpacity>
        )
        }
        return (
            <View style={styles.container}>
                {sound}
            </View>
        )
    }
}

var styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});