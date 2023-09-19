import React, {Component} from 'react';
import {Dimensions, FlatList, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View, ScrollView} from 'react-native';
import I18n from "react-native-i18n";
import SoundPlayer from "../SoundPlayer";
import {Actions} from "react-native-router-flux";

let {width} =  Dimensions.get('screen');
export default class PatrolInspect extends Component {
    constructor(props) {
        super(props);
    }

    viewPicture(uri){
        Actions.push('pictureViewer',{uri: uri});
    }

    playRecord(uri){
        Actions.push('videoPlayer',{uri: uri});
    }

    getSubject(item,index){
        return `${index+1}.` +  item.subject;
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

    renderEventAttach(item){
        let attachment = item.attachment;
        if (attachment != null && attachment.length > 0){
            return attachment.map((item,index) => {
                if(item.mediaType === 1){
                    return (
                        <ImageBackground style={{width:93,height:75,alignItems:'center',marginBottom:15,marginRight:10}}
                                     source={require('../../assets/images/image_videoThumbnail.png')} resizeMode='stretch'>
                           <TouchableOpacity onPress={() => this.playRecord(item.url)}>
                           <Image style={{width:20,height:20,marginTop:26}} source={require('../../assets/images/pic_play_icon.png')}
                                   resizeMode='contain'/>
                           </TouchableOpacity>
                        </ImageBackground>
                    );
                }
                else if (item.mediaType === 2){
                    return (
                        <TouchableOpacity style={{marginBottom: 15,height: 75,width:93,marginRight:10}}
                           onPress={() => this.viewPicture(item.url)}>
                       <Image style={{width:93,height:75}} source={{uri: item.url}} resizeMode='stretch'/>
                      </TouchableOpacity>
                    );
                }
            });
        }
    }

    renderItem = ({ item,index}) => {
        let audioUrl = null;
        let audio = null;
        if (item.attachment != null){
            let filter = item.attachment.findIndex(p => p.mediaType === 0);
            (filter !== -1) && (audioUrl = item.attachment[filter].url);
            (filter !== -1) && (item.attachment.splice(filter,1));
        }    
        if (audioUrl != null){
            audio = <View style={{paddingLeft:16,marginBottom:15,marginTop:-5}}>
                   <SoundPlayer path={audioUrl}/>
             </View>
        }

        let description = null;
        if (item.description != null && item.description !== ''){
            description = <Text style={{marginTop:-5,marginBottom:15,marginLeft:16,fontSize:12,color:'#888c95'}}>
                    {item.description}
                </Text>
        }

        let attachment = null;
        if (item.attachment != null && item.attachment.length > 0){
            attachment = <View style={{marginLeft: 16,marginTop:-5}}>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    {this.renderEventAttach(item)}
                </ScrollView>
            </View>
        }

        return (
            <View>
                <View style={styles.rowPanel}>
                    <Text style={styles.itemSubject}>
                        {this.getSubject(item,index)}
                    </Text>
                </View>

                {description}
                {attachment}
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
