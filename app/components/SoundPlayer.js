import React, {Component} from 'react';

import {
    StyleSheet,
    View,
    TouchableOpacity,
    Image,
    Text,
    TextInput,
    DeviceEventEmitter
} from 'react-native';

import Sound from 'react-native-sound';
import SoundUtil from "../utils/SoundUtil";
import I18n from 'react-native-i18n';
import EzvizPlayer from './ezvizPlayer/EzvizPlayer';
import {EMITTER_SOUND_STOP} from "../common/Constant";

export default class SoundPlayer extends Component {

    constructor(props) {
        super(props);
        this.state = {
            picLength: 0,
            audioDuration:0,
            path:null
        };
    }

    componentDidMount() {
        let path = this.props.path;
        if (path != null){
            this.setAudioPath(path);
        }
    }

    componentWillMount(){
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_SOUND_STOP,
            ()=>{
                SoundUtil.stop();
            });
    }

    componentWillUnmount(){
        SoundUtil.stop();
        this.notifyEmitter && this.notifyEmitter.remove();
    }

    componentWillReceiveProps (nextProps){
        let path = nextProps.path;
        if (path != null){
            this.setAudioPath(path);
        }
    }

    setAudioPath(path){
        try {
            if(SoundUtil.checkPath(path)){
                let sound = new Sound(path, null, (error) => {
                    if (error) {
                        console.log(error);
                        this.setState({audioDuration:0});
                    }
                    else {
                        let maxLength = 180;
                        if (this.props.maxLength != null){
                            maxLength = this.props.maxLength;
                        }
                        let duration = Math.floor(sound.getDuration());
                        if (duration === 0)
                            duration = 1;
                        let radio =  maxLength/5.5;
                        let length = Math.sqrt(duration)*radio;
                        if (length < 50)
                            length = 50;
                        if (length > maxLength)
                            length = maxLength;
                        this.setState({audioDuration:duration,picLength:length,path:path});
                    }
                    sound.release();
                });
            }
            else {
                this.setState({audioDuration:0});
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    async onPlay(){
        EzvizPlayer.pausePlayer();
        SoundUtil.play(this.state.path);
    }

    render() {
        let content = null;
        if (this.state.audioDuration <= 0){
            if (this.props.input == true){ content =(
                    <TextInput placeholder={I18n.t('Press record')} editable ={false}/>
            )
            }
        }
        else {content =(
            <View style={styles.voiceContainer}>
                <TouchableOpacity  onPress={()=>this.onPlay()}>
                    <View style={styles.voiceBtn} width={this.state.picLength}>
                        <Image  style={styles.voiceImage} source={require('../assets/images/voice_pic.png')}/>
                    </View>
                </TouchableOpacity>
                <Text style={styles.voiceText}>{this.state.audioDuration}''</Text>
            </View>
        )
        }
        return (
            <View style={styles.container} >
              {content}
            </View>
        );
    }
}

var styles = StyleSheet.create({
    container: {
        // flex: 1,
    },
    voiceContainer:{
        flexDirection: 'row',
        alignItems:'center',
    },
    voiceBtn:{
        height:40,
        backgroundColor:'#ffedee',
        justifyContent:'space-between',
        alignItems:'center',
        borderRadius:25,
        flexDirection: 'row',
        borderWidth:1,
        borderColor:'#faa5c1'
    },
    voiceImage: {
        width: 20,
        height: 20,
    },
    voiceText: {
        marginLeft:5,
        fontSize: 14,
        color: '#7a8fae',
    }
});
