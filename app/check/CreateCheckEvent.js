import React, { Component } from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    TextInput,
    ScrollView, DeviceEventEmitter,Platform, BackHandler
} from 'react-native';

let {width} =  Dimensions.get('screen');
import { Actions } from 'react-native-router-flux';
import RecordAudio from "../components/RecordAudio";
import SoundPlayer from "../components/SoundPlayer";
import RNStatusBar from '../components/RNStatusBar';
import * as lib from '../common/PositionLib';
import Toast, {DURATION} from "react-native-easy-toast"
import I18n from 'react-native-i18n';
import Video from '../components/af-video-player/Video';
import dismissKeyboard from 'react-native-dismiss-keyboard';
import StringFilter from "../common/StringFilter";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";

let height = lib.dashVideoHeight();

export default class CreateCheckEvent extends Component {
    constructor(props){
        super(props);

        this.state = {
            data:{
                isTextDescription:false,
                audioPath:null,
                description:'',
                deviceId: this.props.deviceId,
                attachment:[
                    {
                        mediaType:0
                    }
                ]
            },
            showTipSubject:false,
            showTipOther:false
        }
        this.createClick = this.createClick.bind(this);
        this.issueNameChanged = this.issueNameChanged.bind(this);
        this.issueDescriptionChanged = this.issueDescriptionChanged.bind(this);
        this.audioDeleteClick = this.audioDeleteClick.bind(this);
    }

    componentDidMount() {
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('creatCheckEventBack', this.onBackAndroid);
        }
    }

    componentWillUnmount() {
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('creatCheckEventBack', this.onBackAndroid);
        }
    }

    onBackAndroid = () => {
        Actions.pop();
        return true;
    }

    createClick(){
        if (this.props.subject != false){
            if (this.state.data.subject == null || this.state.data.subject == ''){
                dismissKeyboard();
                this.setState({showTipSubject:true});
                return;
            }
        }

        if( (this.state.data.description == null || this.state.data.description == '') && this.state.data.attachment.length === 1
        && this.state.data.audioPath == null){
           dismissKeyboard();
           this.setState({showTipOther:true});
           return;
       }

       if (this.props.uri != null){
           this.showPicture(this.props.uri,0);
       }
       if (this.props.videoUri != null){
           this.showVideo(this.props.videoUri,0);
       }

       let data = this.state.data;
       data.attachment.pop();
       DeviceEventEmitter.emit('onCheckRefresh',data);
       Actions.pop();
    }

    issueNameChanged(text){
        let data = this.state.data;
        data.subject  = StringFilter.standard(text,50);
        this.setState({data: data,showTipSubject:false});
    }

    issueDescriptionChanged(text){
        let data = this.state.data;
        data.description = StringFilter.all(text,200);
        this.setState({data: data,showTipOther:false});
    }

    showPicture(path,index){
        let data = this.state.data;
        data.attachment.splice(index,0, {
            mediaPath: path,
            mediaType: 2
        });
        this.setState({data: data,showTipOther:false});
    }

    showVideo(path,index){
        let data = this.state.data;
        data.attachment.splice(index,0, {
            mediaPath: path,
            mediaType: 1
        });
        this.setState({data: data,showTipOther:false});
    }

    onAudio(audioPath){
        let data = this.state.data;
        data.audioPath = audioPath;
        this.setState({data: data,showTipOther:false});
        let audioPlay = this.refs.audioPlay;
        audioPlay.setAudioPath(audioPath);
    }

    audioDeleteClick(){
        this.onAudio(null);
    }

    onGoRecord(){
        let data = this.state.data;
        data.isTextDescription = false;
        this.setState({data: data});
    }

    onGoText(){
        let data = this.state.data;
        data.isTextDescription = true;
        this.setState({data: data});
    }

    render() {
        let pic = null;
        if (this.props.uri){ pic = (
                <View style={styles.showPanel}>
                    <TouchableOpacity onPress={() => Actions.push('pictureViewer',{uri: this.props.uri})}>
                        <Image style={{width:width,height:height}} source={{uri: this.props.uri}} resizeMode='stretch'/>
                    </TouchableOpacity>
                </View>
        )
        }
        if (this.props.videoUri){ pic = (
            <View style={styles.showPanel}>
                <Video url={this.props.videoUri} title={' '} logo={' '}/>
            </View>
        )
        }

        let audio = null;
        let audioDelele = null;
        if (this.state.data.audioPath != null){ audioDelele = (
            <TouchableOpacity activeOpcity={0.5} onPress={()=>this.audioDeleteClick()}>
                <Image style={{width:24,height:24,marginLeft:12}} source={require('../assets/images/img_audio_delete.png')}></Image>
            </TouchableOpacity>
        )
        }
        if (this.state.data.isTextDescription == true){ audio = (
            <View style={{flexDirection: 'row',justifyContent:'flex-end',alignItems:'center'}}>
                <TextInput style={styles.issueDescription} multiline onChangeText={this.issueDescriptionChanged}
                          value={this.state.data.description} placeholder={I18n.t('Enter info')}/>
                <TouchableOpacity onPress={()=>this.onGoRecord()}>
                    <Image  style={styles.audioRecordIcon} source={require('../assets/images/text_icon_normal.png')}/>
                </TouchableOpacity>
            </View>
        )
        }
        else { audio = (
            <View style={{flexDirection: 'row',justifyContent:'flex-end',alignItems:'center'}}>
               <View style={styles.audioPanel}>
                   <SoundPlayer ref={'audioPlay'} input={true} path={this.state.data.audioPath}/>
                   {audioDelele}
               </View>
               <View style={styles.audioRecordIcon}>
                   <RecordAudio audioPressOut={this.onAudio.bind(this)} onPress={this.onGoText.bind(this)}/>
               </View>
            </View>
        )
        }

        let name = I18n.t('Feedbacks');
        if (this.props.title != null){
            name = this.props.title
        }

        let subject = null;
        let borderColor = this.state.showTipSubject ? '#ff2400':'#dcdcdc';
        if (this.props.subject != false){ subject = (
            <View>
                <View style={styles.createLabelPanel}>
                    <View style={{flexDirection:'row',alignItems:'center',marginTop:16}}>
                        <Text style={{marginLeft:16,fontSize: 14,color:'#ff2400'}}>{'* '}</Text>
                        <Text style={{fontSize:14}}>{I18n.t('Title')}</Text>
                    </View>
                </View>
                <TextInput style={[styles.issueName,{borderColor: borderColor}]} value={this.state.data.subject} onChangeText={this.issueNameChanged} />
                {
                    this.state.showTipSubject ? <Text style={{fontSize:10,marginTop:4, marginLeft:16,color:'#ff2400'}}>{I18n.t('Provide titles')}</Text> :null
                }
            </View>
        )
        }

        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={Actions.pop}>
                        <View style={{width:width/3,height:48}}>
                            <Text style={[styles.NavBarTitle,{fontSize:14,marginLeft:12}]}>{I18n.t('Cancel')}</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{width:width/3,height:48,alignItems: 'center'}}>
                        <Text style={[styles.NavBarTitle,{fontSize:18}]}>{name}</Text>
                    </View>
                    <TouchableOpacityEx onPress={this.createClick}>
                        <View style={{width:width/3,height:48,flexDirection: 'row',justifyContent:'flex-end'}}>
                            <Text style={[styles.NavBarTitle,{fontSize:14,marginRight:12}]}>{I18n.t('Confirm')}</Text>
                        </View>
                    </TouchableOpacityEx>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'handled'}>
                    {pic}
                    {subject}
                    <View style={styles.createLabelPanel}>
                        <Text style={styles.createLabelText}>{I18n.t('Description')}</Text>
                    </View>
                    {audio}
                    {
                        this.state.showTipOther ? <Text style={{fontSize:10,marginTop:4, marginLeft:16,color:'#ff2400'}}>{I18n.t('Enter info')}</Text> :null
                    }
                </ScrollView>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    NavBarPanel:{
        flexDirection: 'row',
        height: 48,
        backgroundColor: '#24293d'
    },
    NavBarTitle: {
        fontSize: 18,
        height: 48,
        color: '#ffffff',
        textAlignVertical:'center',
        lineHeight: 48
    },
    showPanel: {
        width: width,
        //height: height,
        backgroundColor: 'gray',
        overflow:'hidden'
    },
    imageBottomPanel: {
        position:'absolute',
        flexDirection: 'row',
        width: width,
        height: 30,
        backgroundColor: 'rgba(0,0,0,0.6)',
        bottom: 0,
        left:0
    },
    editCancelPanel:{
        marginLeft: width/4-40 ,
        flexDirection: 'row',
        width: 80,
        height: 30
    },
    editIcon: {
        width: 14,
        height: 14,
        marginTop: 8
    },
    editCancelText: {
        fontSize: 12,
        color: '#ffffff',
        marginTop: 7,
        marginLeft: 20,
        lineHeight: 16
    },
    imageLine: {
        width: 1,
        height: 30,
        marginLeft: width/4-40,
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        opacity: 0.6
    },
    editConfirmPanel: {
        marginLeft: width/4-40 ,
        flexDirection: 'row',
        width: 80,
        height: 30
    },
    editConfirmText:{
        fontSize: 12,
        color: '#ffffff',
        marginTop: 7,
        marginLeft: 20,
        lineHeight: 16
    },
    colorPanel:{
        position: 'absolute',
        right: 20,
        top: 20
    },
    actionButtonIcon: {
        fontSize: 20,
        height: 0,
        color: 'white'
    },
    createLabelPanel:{
        height: 44,
        backgroundColor: '#ffffff',
    },
    createLabelText: {
        fontSize: 14,
        marginTop: 16,
        marginLeft: 16
    },
    issueName:{
        width: width-32,
        height: 44,
        borderWidth: 1,
        paddingLeft:10,
        marginLeft: 16,
        paddingVertical: 0,
        borderRadius: 2,
        color:'black',
        alignItems:'center'
    },
    issueDescription:{
        width: width-100,
        height: 46,
        borderWidth: 1,
        borderColor: '#dcdcdc',
        marginRight: 23,
        paddingVertical: 0,
        borderRadius: 2,
        paddingLeft: 10,
        alignItems:'center',
        ...Platform.select({
            ios:{paddingTop:13}
        })
    },
    audioRecordIcon:{
        width: 48,
        height: 48,
        marginRight: 12
    },
    audioPanel:{
        width: width-100,
        height: 46,
        borderColor: '#dcdcdc',
        marginRight: 23,
        paddingVertical: 0,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        overflow: 'hidden'
    },
    canvasPage: {
        flex: 1,
        elevation: 2,
        marginTop: 0,
        marginBottom: 0,
        backgroundColor: 'transparent',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.75,
        shadowRadius: 2
    }
});
