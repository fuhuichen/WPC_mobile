import React, {Component} from 'react';
import {StyleSheet, Image, ImageBackground,Platform, View, DeviceEventEmitter,Text} from "react-native";
import PropTypes from "prop-types";
import TouchableOpacityEx from "../../touchables/TouchableOpacityEx";
import {Actions} from "react-native-router-flux";
import * as RNFS from 'react-native-fs';
import { createThumbnail } from "react-native-create-thumbnail";
import moment from "moment";
import {EMITTER_SOUND_STOP} from "../../common/Constant";
import TouchableInactive from "../../touchables/TouchableInactive"
import {Card} from 'react-native-shadow-cards';
import BoxShadow from "react-native-shadow/lib/BoxShadow";
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
      thumb:null
    };
    constructor(props) {
        super(props);

        this.thumbnailUri = require('../../assets/images/image_videoThumbnail.png');
        this.playUri = require('../../assets/images/comment/icon_play_small.png');
        this.deleteUri = require('../../assets/images/comment/icon_text_delete.png');
    }
    async componentDidMount(){
        if(this.props.data.thumb &&this.props.data.thumb!=this.state.thumb ){
           let checkIfExists = await RNFS.exists(this.props.data.thumb);
           if(checkIfExists){
              this.setState({thumb:this.props.data.thumb});
              return;
           }  
        }
        this.createThumb(this.props);
    }

    async componentWillReceiveProps(nextProp){
        if(nextProp.data.thumb &&nextProp.data.thumb!=this.state.thumb ){
          let checkIfExists = await RNFS.exists(nextProp.data.thumb);
          if(checkIfExists){
            this.setState({thumb:nextProp.data.thumb});
            return;
         }
        }
        this.createThumb(nextProp);
    }

    async componentWillUnmount(){
    }

    async createThumb(props){
        if(props.data && !props.data.thumb){
            this.setState({thumb:null});
            var url = props.data.url;
            if(Platform.OS === 'android' && url.substring(0,5) != 'https'){
                var rand = Math.random().toString(32).substring(2, 30);
                const checkIfExists = await RNFS.exists(`${RNFS.CachesDirectoryPath}/${rand}`);
                if (!checkIfExists) {
                    await RNFS.copyFile(props.data.url, `${RNFS.CachesDirectoryPath}/${rand}`);
                }
                url =`file:///${RNFS.CachesDirectoryPath}/${rand}`;
            }

            createThumbnail({
                url,
                type: "local",
                timeStamp: 1000
            }).then(async (response) => {
                props.data.thumb = response.path
                this.setState({thumb:response.path})
            }).catch(err => console.log({ err }));
        }
    }

    onPlay(uri){
        DeviceEventEmitter.emit(EMITTER_SOUND_STOP);
        Actions.push('videoPlayer', {uri});
        if(this.props.onPlay)this.props.onPlay(this.props.data)
    }

    render() {
        let {width, height, data, showDelete, style, showDate} = this.props;
        return (
            <TouchableInactive style={{marginRight:6}}>
                <ImageBackground style={[styles.container,{width,height}, style]} imageStyle={{ borderRadius: 5}}
                                 resizeMode='stretch' source={this.state.thumb ? {uri: this.state.thumb } : this.thumbnailUri}>
                    <TouchableOpacityEx style={{backgroundColor:'transparent'}}
                        activeOpacity={1} onPress={()=>{this.onPlay(data.url)}}>
                        <Image style={styles.play} source={this.playUri}/>
                    </TouchableOpacityEx>
                    {
                        showDelete ? <TouchableOpacityEx activeOpacity={1} style={styles.delete}
                                                          onPress={()=>{this.props.onDelete(data)}}>
                            <Image style={{width:16,height:16}} source={this.deleteUri} />
                        </TouchableOpacityEx> : null
                    }

                </ImageBackground>
                {
                    showDate ? <View style={{width:120, marginLeft:6}}>
                        <Text style={{fontSize:11,color:'#777777'}}>{moment(new Date(data.ts)).format('YYYY/MM/DD HH:mm')}</Text>
                    </View> : null
                }
            </TouchableInactive>
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
        right:4,
        top:4,
        width:16,
        height:16
    }
});
