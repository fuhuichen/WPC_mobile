import React, { Component } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image, ImageBackground, TouchableOpacity
} from 'react-native';
import SoundPlayer from "../components/SoundPlayer";
import {Actions} from "react-native-router-flux";

export default class EventTemplate extends Component {
    constructor(props) {
        super(props);

        this.state = {
            data:{
            }
        };
    }

    componentDidMount() {
        this.setState({data: this.props.data});
    }

    onFullVideo(uri){
        Actions.push('videoPlayer',{uri: uri});
    }

    onFullPicture(uri){
        Actions.push('pictureViewer',{uri: uri});
    }

    onDeleteSound(){
        let data = this.state.data;
        data.audioPath = null;
        this.setState({data: data});
    }

    onDeleteVideo(){
        let data = this.state.data;
        data.videoPath = null;
        this.setState({data: data});
    }

    onDeletePic(){
        let data = this.state.data;
        data.imagePath = null;
        this.setState({data: data});
    }

    render() {

        let deleteIconSound = null;
        if ( this.state.data.editable ){ deleteIconSound =(
            <TouchableOpacity onPress={() => this.onDeleteSound()}>
                <Image style={styles.deleteIcon} source={require('../assets/images/img_audio_delete.png')} resizeMode='contain'/>
            </TouchableOpacity>
        )
        }

        let deleteIconVideo = null;
        if ( this.state.data.editable ){ deleteIconVideo =(
            <TouchableOpacity onPress={() => this.onDeleteVideo()}>
                <Image style={styles.deleteIcon} source={require('../assets/images/img_audio_delete.png')} resizeMode='contain'/>
            </TouchableOpacity>
        )
        }

        let deleteIconPic = null;
        if ( this.state.data.editable ){ deleteIconPic =(
            <TouchableOpacity onPress={() => this.onDeletePic()}>
                <Image style={styles.deleteIcon} source={require('../assets/images/img_audio_delete.png')} resizeMode='contain'/>
            </TouchableOpacity>
        )
        }

        let desc = null;
        if (this.state.data.description){ desc = (
            <View style={{flexDirection: 'row',alignItems: 'center'}}>
                <Text style={{color: '#989ba3', fontSize:12, textAlignVertical: 'center',textAlign: 'left', marginTop:5, marginBottom: 10}}>{this.state.data.description}</Text>
            </View>
        )
        }

        let sound = null;
        if ( this.state.data.audioPath ){ sound = (
            <View style={{flexDirection: 'row',alignItems: 'center'}}>
                <SoundPlayer path={this.state.data.audioPath}/>
                {deleteIconSound}
            </View>
        )
        }
        let video = null;

        let thumbNailPath = this.state.data.videoThumbnail == null ?
            require('../assets/images/image_videoThumbnail.png'): {uri:this.state.data.videoThumbnail};

        if (this.state.data.videoPath){ video = (
            <View style={{flexDirection: 'row',alignItems: 'center'}}>
                <ImageBackground style={styles.thumbnail} source={thumbNailPath} resizeMode='contain'>
                    <TouchableOpacity onPress={() => this.onFullVideo(this.state.data.videoPath)}>
                        <Image style={styles.thumbIcon} source={require('../assets/images/pic_play_icon.png')} resizeMode='contain'/>
                    </TouchableOpacity>
                </ImageBackground>
                {deleteIconVideo}
            </View>
        )
        }
        let pic = null;
        if (this.state.data.imagePath){ pic = (
            <View style={{flexDirection: 'row',alignItems: 'center'}}>
                <TouchableOpacity onPress={() => this.onFullPicture(this.state.data.imagePath)}>
                    <Image style={styles.thumbnail} source={{uri:this.state.data.imagePath}} resizeMode='cover'/>
                </TouchableOpacity>
                {deleteIconPic}
            </View>
        )
        }
        return (
            <View style={styles.container}>
                {desc}
                {sound}
                {video}
                {pic}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        //backgroundColor:'#ffffff'
    },
    thumbnail: {
        marginTop:15,
        width: 150,
        height: 100,
        alignSelf: 'flex-start',
    },
    thumbIcon:{
        width: 40,
        height: 40,
        alignSelf: 'center',
        marginTop:30
    },
    deleteIcon:{
        width: 20,
        height: 20,
        alignSelf: 'center',
        marginLeft:8
    }
});