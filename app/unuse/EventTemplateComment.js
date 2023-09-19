import React, {Component} from 'react';
import {
    Image,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import TimeUtil from "../utils/TimeUtil";
import {Actions} from 'react-native-router-flux';
import SoundPlayer from "../components/SoundPlayer";

export default class EventTemplateComment extends Component {
    constructor(props) {
        super(props);
    }

    onFullVideo(uri){
        Actions.push('videoPlayer',{uri: uri});
    }

    onFullPicture(uri){
        Actions.push('pictureViewer',{uri: uri});
    }

    renderBlocks() {
        let attachment = this.props.data.attachment;
        if (attachment != null){
            return attachment.map((item,index) => {
                if(item.mediaType === 1){
                    return (
                        <View>
                            <ImageBackground style={styles.thumbnail} source={require('../assets/images/image_videoThumbnail.png')} resizeMode='contain'>
                                <TouchableOpacity onPress={() => this.onFullVideo(item.url)}>
                                    <Image style={styles.thumbIcon} source={require('../assets/images/pic_play_icon.png')} resizeMode='contain'/>
                                </TouchableOpacity>
                            </ImageBackground>
                        </View>
                    );
                }
                else if (item.mediaType === 2){
                    return (
                        <View>
                            <TouchableOpacity onPress={() => this.onFullPicture(item.url)}>
                                <Image style={styles.thumbnail} source={{uri:item.url}} resizeMode='cover'/>
                            </TouchableOpacity>
                        </View>
                    );
                }
            });
        }
    }

    render() {
        let desc = null;
        if (this.props.data.description){ desc = (
            <View style={{flexDirection: 'row',alignItems: 'center'}}>
                <Text style={{color: '#989ba3', fontSize:12, textAlignVertical: 'center',textAlign: 'left', marginTop:5, marginBottom: 10}}>{this.props.data.description}</Text>
            </View>
        )
        }

        let sound = null;
        if ( this.props.data.audioPath ){ sound = (
            <SoundPlayer path={this.props.data.audioPath}/>
        )
        }

        return (
            <View style={{flex: 1}}>
                {desc}
                {sound}
                <View style={styles.picGroup}>
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                        {this.renderBlocks()}
                    </ScrollView>
                </View>
                <Text style={{marginTop:10,color: '#989ba3', fontSize:12, textAlignVertical: 'center',textAlign: 'left'}}>{TimeUtil.getTime(this.props.data.ts)}</Text>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    picGroup:{
        flexDirection: 'row',
        alignItems: 'center',
    },
    thumbnail: {
        marginTop:15,
        marginRight:15,
        width: 150,
        height: 100,
        alignSelf: 'flex-start',
    },
    thumbIcon:{
        width: 40,
        height: 40,
        alignSelf: 'center',
        marginTop:30
    }
})

