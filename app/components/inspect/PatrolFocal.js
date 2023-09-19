import React, {Component} from 'react';
import {
    View,
    Dimensions,
    StyleSheet,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    ImageBackground
} from 'react-native';
import I18n from "react-native-i18n";
import SoundPlayer from "../SoundPlayer";
import InspectDetail from "../../check/InspectDetail";
import {Actions} from "react-native-router-flux";

let {width} =  Dimensions.get('screen');
export default class PatrolFocal extends Component {
    constructor(props) {
        super(props);

        this.type = this.props.type;
    }

    viewPicture(uri){
        Actions.push('pictureViewer',{uri: uri});
    }

    playRecord(uri){
        Actions.push('videoPlayer',{uri: uri});
    }

    renderAttachment = ({ item,index,filter}) => {
        if (item.mediaType === 0){
            return null;
        }

        let picture = null;
        if(this.type && item.mediaType === 1 || !this.type && item.mediaType === 2){
            let url = this.type ? item.mediaPath : item.url;
            picture = <TouchableOpacity style={{marginBottom: 15,height: 70,width:90}}
                    onPress={() => this.viewPicture(url)}>
                <Image style={{width:90,height:70}} source={{uri: url}} resizeMode='stretch'/>
            </TouchableOpacity>
        }

        let video = null;
        if(this.type && item.mediaType === 2 || !this.type && item.mediaType === 1){
            let url = this.type ? item.mediaPath : item.url;
            video = <ImageBackground style={{width:90,height:70,alignItems:'center',marginBottom:15}}
                                     source={require('../../assets/images/image_videoThumbnail.png')} resizeMode='stretch'>
                <TouchableOpacity onPress={() => this.playRecord(url)}>
                    <Image style={{width:20,height:20,marginTop:26}} source={require('../../assets/images/pic_play_icon.png')}
                           resizeMode='contain'/>
                </TouchableOpacity>
            </ImageBackground>
        }

     return (
            <View style={{marginLeft: (index === 0 || index === filter) ? 0 : 10}}>
                {picture}
                {video}
            </View>
     )};

    getSubject(item,index){
        return `${index+1}.` + (this.type ? item.subject : item.name);
    }

    getScore(item){
        let score = 0;
        if (this.type){
            (item.parentId === 1) ? (score = `${I18n.t('Score get')}: ${item.score}`) : (score = I18n.t('Failed'));
        }else{
            (item.type !== 1) ? (score = I18n.t('Failed')) : (score = `${I18n.t('Score get')}:${item.grade}`);
        }

        return score;
    }

    renderItem = ({ item,index}) => {
        let audio = null, audioUrl = null, description = null;
        let filter = item.attachment.findIndex(p => p.mediaType === 0);
        (!this.type && filter !== -1) && (audioUrl = item.attachment[filter].url);
        (!this.type && filter !== -1) && (item.attachment.splice(filter,1));

        if ((this.type && item.audioPath) || (!this.type && audioUrl != null)){
            let url = this.type ? item.audioPath : audioUrl;
            audio = <View style={{paddingLeft:16,marginBottom:15,marginTop:-5}}>
                <SoundPlayer path={url}/>
             </View>
        }

        if (item.comment !== ''){
            description = <Text style={{marginTop:-5,marginBottom:15,marginLeft:16,fontSize:12,color:'#888c95'}}>
                    {item.comment}
                </Text>
        }

        return (
            <View>
                <View style={styles.rowPanel}>
                    <View style={{flexDirection:'row',justifyContent:'space-between',marginLeft:16}}>
                        <Text style={styles.itemSubject} numberOfLines={1}>
                            {this.getSubject(item,index)}
                        </Text>
                        <View style={styles.scoreItem}>
                            <Text style={styles.scoreData}>{this.getScore(item)}</Text>
                        </View>
                    </View>

                    <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                        <TouchableOpacity activeOpacity={0.5} style={{marginLeft:16,marginTop:3}}
                                          onPress={()=>this.detail.open(this.getSubject(item,index), item.description)}>

                            <Text style={{fontSize:12,color:'#6097f4',textDecorationLine:'underline'}}>{I18n.t('Inspection details')}</Text>
                        </TouchableOpacity>
                        <View style={{flex:1}}></View>
                    </View>
                </View>

                {description}
                {
                    ((this.type && item.mode === 1 && item.attachment.length > 1) || (this.type && item.mode === 0 && item.attachment.length > 0) ||
                        (!this.type && item.attachment.length > 0)) ?
                        <FlatList data={item.attachment} style={{marginLeft:16,marginTop:-5}}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={(item,index,filter)=>this.renderAttachment(item,index,filter)}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                    /> : null
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

                <InspectDetail ref={ref => this.detail = ref}/>
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
        height:48,
        backgroundColor:'#f7f8fa',
        marginBottom: 15
    },
    itemSubject:{
        fontSize: 14,
        color:'#19293b',
        marginTop:6,
        width:width-131,
        fontWeight:'bold'
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
