import React, {Component} from 'react';
import {Dimensions, FlatList, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import I18n from "react-native-i18n";
import SoundPlayer from "../SoundPlayer";
import {Actions} from "react-native-router-flux";

let {width} =  Dimensions.get('screen');
export default class PatrolShow extends Component {
    constructor(props) {
        super(props);

        this.type = this.props.type;
        this.feedback = this.props.feedback;
    }

    viewPicture(uri){
        Actions.push('pictureViewer',{uri: uri});
    }

    playRecord(uri){
        Actions.push('videoPlayer',{uri: uri});
    }

    soundRender(item,index){
        if(item.soundInspect != null){
            item.soundInspect.setAudioPath(item.audioPath);
        }
    }

    getSubject(item,index){
        return `${index+1}.` + ((this.type || this.feedback) ? item.subject : item.name);
    }

    getDescription(item){
        return this.type ? item.descriptionShow : item.description;
    }

    getScore(item){
        let score = 0;
        if (this.type){
            (item.parentId === 1) ? (score = `${I18n.t('Score get')}: ${item.score}`) : (score = item.score);
        }else{
            (item.type !== 1) ? (score = I18n.t('Failed')) : (score = `${I18n.t('Score get')}:${item.grade}`);
        }

        return score;
    }

    renderItem = ({ item,index}) => {
        let audio = null;
        if (this.feedback && ((this.type && item.audioPath != null) ||
            (!this.type && item.attachment && (item.attachment.findIndex(p => p.mediaType === 0) !== -1)))){
            let url = this.type ? item.audioPath : item.attachment.filter(p => p.mediaType === 0)[0].url;
            audio = <View style={{paddingLeft:16,marginBottom:15,marginTop:-5}}>
                <SoundPlayer path={url}/>
            </View>
        }

        let picture = null;
        if(this.feedback && ((this.type && item.imagePath != null) ||
            (!this.type && item.attachment && (item.attachment.findIndex(p => p.mediaType === 2) !== -1)))){
            let url = this.type ? item.imagePath : item.attachment.filter(p => p .mediaType === 2)[0].url;
            picture = <TouchableOpacity style={{marginBottom: 15,height: 75,width:93}}
                                        onPress={() => this.viewPicture(url)}>
                <Image style={{width:93,height:75}} source={{uri: url}} resizeMode='stretch'/>
            </TouchableOpacity>
        }

        let video = null;
        if(this.feedback && ((this.type && item.videoPath != null) ||
            (!this.type && item.attachment && (item.attachment.findIndex(p => p.mediaType === 1) !== -1)))){
            let url = this.type ? item.videoPath : item.attachment.filter(p => p.mediaType === 1)[0].url;
            video = <ImageBackground style={{width:93,height:75,alignItems:'center',marginBottom:15}}
                                     source={require('../../assets/images/image_videoThumbnail.png')} resizeMode='stretch'>
                <TouchableOpacity onPress={() => this.playRecord(url)}>
                    <Image style={{width:20,height:20,marginTop:26}} source={require('../../assets/images/pic_play_icon.png')}
                           resizeMode='contain'/>
                </TouchableOpacity>
            </ImageBackground>
        }

        let description = null;
        if (this.feedback && item.description != null && item.description !== ''){
            description = <Text style={{marginTop:-5,marginBottom:15,marginLeft:16,fontSize:12,color:'#888c95'}}>
                    {item.description}
                </Text>
        }

        return (
            <View>
                <View style={styles.rowPanel}>
                    <Text style={styles.itemSubject}>
                        {this.getSubject(item,index)}
                    </Text>
                </View>

                {description}
                {
                    (picture != null || video != null) ? <View style={{marginLeft: 16,marginTop:-5}}>
                        {picture}
                        {video}
                    </View> : null
                }
                {audio}
            </View>
        )
    };

    render(){
        return (
            <View style={styles.container}>
                <FlatList ref={(ref => this.data = ref)}
                          data={this.props.data}
                          keyExtractor={(item, index) => index.toString()}
                          renderItem={this.renderItem}
                          showsVerticalScrollIndicator={false}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width:width-32,
        backgroundColor: '#ffffff',
        marginTop:10,
        marginLeft:16
    },
    rowPanel:{
        backgroundColor:'#f7f8fa',
        marginBottom: 15
    },
    itemSubject:{
        fontSize: 14,
        color:'#19293b',
        marginTop:6,
        marginBottom:6,
        marginLeft: 16,
        width:width-48,
        fontWeight: 'bold'
    },
    scoreItem:{
        width:65,
        borderRadius:10,
        backgroundColor:'#fcba3f',
        marginLeft:15,
        marginTop:8,
        marginRight:5,
        height:17
    },
    scoreData:{
        color:'#ffffff',
        fontSize:12,
        height:17,
        lineHeight:17,
        textAlign: 'center',
        textAlignVertical: 'center'
    }
});
