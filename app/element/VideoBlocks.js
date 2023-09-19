import React, {Component} from 'react';
import {StyleSheet, Image, ImageBackground} from "react-native";
import PropTypes from "prop-types";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";
import {Actions} from "react-native-router-flux";

export default class VideoBlocks extends Component {
    static propTypes =  {
        uri: PropTypes.string.isRequired,
        width: PropTypes.number,
        height: PropTypes.number,
        showDelete: PropTypes.boolean,
        onDelete: PropTypes.function
    };

    static defaultProps = {
        width:80,
        height:60,
        showDelete: true
    };

    constructor(props) {
        super(props);

        this.thumbnailUri = require('../assets/images/image_videoThumbnail.png');
        this.playUri = require('../assets/images/pic_play_icon.png');
        this.deleteUri = require('../assets/images/img_media_delete.png');
    }

    onPlay(uri){
        Actions.push('videoPlayer', {uri});
    }

    render() {
        let {width, height, uri, showDelete} = this.props;

        return (
            <ImageBackground style={[styles.container,{width,height}]}
                             resizeMode='cover' source={this.thumbnailUri}>
                <TouchableOpacityEx activeOpacity={1} onPress={()=>{this.onPlay(uri)}}>
                    <Image style={styles.play} source={this.playUri}/>
                </TouchableOpacityEx>
                {
                    showDelete ? <TouchableOpacityEx activeOpacity={1} style={styles.delete}
                                                      onPress={()=>{this.props.onDelete()}}>
                        <Image style={{width:16,height:16}} source={this.deleteUri} />
                    </TouchableOpacityEx> : null
                }

            </ImageBackground>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        alignItems:'center',
        justifyContent:'center'
    },
    play:{
        width:20,
        height: 20
    },
    delete:{
        position:'absolute',
        right:0,
        top:0,
        width:16,
        height:16
    }
});
