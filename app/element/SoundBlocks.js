import React, {Component} from 'react';
import {StyleSheet, Image, View, Dimensions, TouchableOpacity} from "react-native";
import PropTypes from "prop-types";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";
import {Actions} from "react-native-router-flux";
import SoundPlayer from "../components/SoundPlayer";

let {width} =  Dimensions.get('screen');
export default class SoundBlocks extends Component {
    static propTypes =  {
        uri: PropTypes.string.isRequired,
        showDelete: PropTypes.boolean,
        onDelete: PropTypes.function
    };

    static defaultProps = {
        showDelete: true
    };

    constructor(props) {
        super(props);

        this.deleteUri = require('../assets/images/img_audio_delete.png');
    }

    render() {
        let {uri,showDelete} = this.props;
        return (
            <View style={styles.container}>
                <SoundPlayer path={uri} maxLength={250} input={false}/>
                {
                    showDelete ? <TouchableOpacity activeOpacity={1} onPress={()=>{this.props.onDelete()}}>
                        <Image source={this.deleteUri} style={styles.delete} />
                    </TouchableOpacity> : null
                }
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        width: width-32,
        height: 46,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'flex-start'
    },
    delete:{
        width:24,
        height: 24,
        marginLeft:8
    }
});
