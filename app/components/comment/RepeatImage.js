import React, {Component} from 'react';
import {StyleSheet, Image, ImageBackground, View, DeviceEventEmitter,Text} from "react-native";
import PropTypes from "prop-types";
import TouchableOpacityEx from "../../touchables/TouchableOpacityEx";
import {Actions} from "react-native-router-flux";
import * as RNFS from 'react-native-fs';
import { createThumbnail } from "react-native-create-thumbnail";
import moment from "moment";
import {EMITTER_SOUND_STOP} from "../../common/Constant";

export default class VideoBlocks extends Component {
    static propTypes =  {
        uri: PropTypes.string.isRequired,
        width: PropTypes.number,
        height: PropTypes.number,
        showDelete: PropTypes.boolean,
        onDelete: PropTypes.function,
        style: PropTypes.style,
        showDate: PropTypes.boolean
    };

    static defaultProps = {
        width:90,
        height:60,
        showDelete: true,
        style: {},
        showDate: false
    };
    state = {
      index:0,
    };
    constructor(props) {
        super(props);
    }
    componentDidMount(){
       if(this.timer)clearInterval(this.timer)
       this.timer = setInterval(function(){
          this.setState({index: (this.state.index+1)%this.props.imageList.length})
       }.bind(this),this.props.period);
    }
    componentWillUnmount(){
       if(this.timer)clearInterval(this.timer)
    }


    render() {
        let {imageList} = this.props;
        const {index}  = this.state;
        return (
            <View >
                <Image   resizeMode={'contain'}   source={imageList[index]}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        alignItems:'center',
        justifyContent:'center',
        borderRadius:10
    },
    play:{
        width:20,
        height: 20,
        backgroundColor:'transparent',
        borderRadius:10,
    },
    delete:{
        position:'absolute',
        right:0,
        top:0,
        width:16,
        height:16
    }
});
