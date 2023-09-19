import React, {Component} from 'react';
import {
    BackHandler,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {Actions} from 'react-native-router-flux';
import moment from 'moment';
import SoundPlayer from "../components/SoundPlayer";
import RNStatusBar from '../components/RNStatusBar';
import I18n from 'react-native-i18n';
import PhoneInfo from "../entities/PhoneInfo";
import RouteMgr from "../notification/RouteMgr";

let {width} =  Dimensions.get('screen');

export default class SubmitSuccess extends Component {
    constructor(props){
        super(props);
    }

    componentDidMount(){
        let eventInfo = this.props.data;
        let audioPlay = this.refs.audioPlay;
        if(!eventInfo.isTextDescription && eventInfo.audioPath != null){
            audioPlay.setAudioPath(eventInfo.audioPath);
        }
    }

    componentWillMount(){
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('submitSuccessBack', this.onBackAndroid);
        }
    }

    componentWillUnmount() {
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('submitSuccessBack', this.onBackAndroid);
        }
    }

    onBackAndroid = () => {
        Actions.popTo('videoMonitor');
        return true;
    }

    render() {
        let ItemDetail = null;
        if(this.props.data.isTextDescription && this.props.data.eventDescription !== '' ||
            !this.props.data.isTextDescription && this.props.data.audioPath != null){
            ItemDetail =  <View style={styles.itemPanel}>
                <View style={!this.props.data.isTextDescription ? styles.itemLine : [styles.itemLine,{height:null}]}></View>
                <Image style={styles.itemDotImage} source={require('../assets/images/img_dot_success.png')} />

                <View style={styles.itemContentPanel}>
                    <View style={styles.datePanel}>
                        <Text style={styles.timeShow}>{moment().format('YYYY-MM-DD HH:mm')}</Text>
                    </View>
                    {
                        !this.props.data.isTextDescription ? <View style={[styles.itemDataPanel,{height:60}]}>
                          <View style={{height:60,flexDirection:'column',justifyContent:'center'}}>
                            <SoundPlayer ref={'audioPlay'} onPress={()=>{}}/>
                          </View>
                        </View> : <View style={styles.itemDataPanel}>
                                <Text style={styles.itemDataName} numberOfLines={100}>
                                    {this.props.data.eventDescription}
                                </Text>
                        </View>
                    }

                    {
                        this.props.data.isTextDescription ? <View style={{height:20,backgroundColor:'#ffffff'}}/>
                            : null
                    }
                </View>
            </View>
        }

        let SendTo = null;
        if (this.props.data.sendTo != ''){
            if(!PhoneInfo.isEnLanguage()) {
                SendTo = (
                    <View style={styles.textPanel}>
                        <Text style={styles.textLabel}>{I18n.t('Send')}:</Text>
                        <Text style={[styles.textLabel,{marginLeft:40}]}>{this.props.data.sendTo}</Text>
                    </View>
                )
            }else{
                SendTo = (
                    <View style={styles.textPanel}>
                        <Text style={[styles.textLabel,{width:60}]}>{I18n.t('Send')}:</Text>
                        <Text style={[styles.textLabel,{marginLeft:10}]}>{this.props.data.sendTo}</Text>
                    </View>
                )
            }
        }

        let KeyInfo = null;
        if(!PhoneInfo.isEnLanguage()){
            KeyInfo = (
                <View>
                    <View style={styles.textPanel}>
                        <Text style={styles.textLabel}>{I18n.t('Store')}:</Text>
                        <Text style={[styles.textLabel,{marginLeft:14}]}>{this.props.data.storeName}</Text>
                    </View>
                    <View style={styles.textPanel}>
                        <Text style={styles.textLabel}>{I18n.t('Event title')}:</Text>
                        <Text style={[styles.textLabel,{marginLeft:14}]}>{this.props.data.subject}</Text>
                    </View>
                    <View style={styles.textPanel}>
                        <Text style={styles.textLabel}>{I18n.t('Status')}:</Text>
                        <View style={{width:48, height: 20,backgroundColor: '#feba3f',marginLeft: 14, marginTop: 1,borderRadius:2}}>
                            <Text style={{color: '#ffffff', textAlignVertical: 'center',textAlign: 'center',lineHeight:20}}>未处理</Text>
                        </View>
                    </View>
                    {
                        (this.props.data.isTextDescription && this.props.data.eventDescription !== '' ||
                            !this.props.data.isTextDescription && this.props.data.audioPath != null) ?
                            <View style={styles.textPanel}>
                                <Text style={styles.textLabel}>{I18n.t('Event Description')}</Text>
                            </View> : null
                    }
                </View>
            )
        }else{
            KeyInfo = (
                <View>
                    <View style={styles.textPanel}>
                        <Text style={[styles.textLabel,{width:60}]}>{I18n.t('Store')}:</Text>
                        <Text style={[styles.textLabel,{marginLeft:10}]}>{this.props.data.storeName}</Text>
                    </View>
                    <View style={styles.textPanel}>
                        <Text style={[styles.textLabel,{width:60}]}>{I18n.t('Event title')}:</Text>
                        <Text style={[styles.textLabel,{marginLeft:10}]}>{this.props.data.subject}</Text>
                    </View>
                    <View style={styles.textPanel}>
                        <Text style={[styles.textLabel,{width:60}]}>{I18n.t('Status')}:</Text>
                        <View style={{width:56, height: 20,backgroundColor: '#feba3f',marginLeft: 10, marginTop: 1,borderRadius:2}}>
                            <Text style={{color: '#ffffff', textAlignVertical: 'center',textAlign: 'center',lineHeight:20}}>Pending</Text>
                        </View>
                    </View>
                    {
                        (this.props.data.isTextDescription && this.props.data.eventDescription !== '' ||
                        !this.props.data.isTextDescription && this.props.data.audioPath != null) ?
                            <View style={styles.textPanel}>
                                    <Text style={styles.textLabel}>{I18n.t('Event Description')}</Text>
                            </View> : null
                    }
                </View>
            )
        }

        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={()=>Actions.popTo('videoMonitor')} style={{width:40}}>
                        <Image source={RouteMgr.getRenderIcon()} style={styles.NavBarImage}/>
                    </TouchableOpacity>
                    <View style={{width:width-40}}>
                        <Text style={styles.NarBarTitle}>{I18n.t('Sent success')}</Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} >
                    <View style={styles.imagePanel}>
                        <Image style={styles.imageIcon} source={require('../assets/images/img_submit_success.png')}></Image>
                        <Text style={styles.submitText}>{I18n.t('Submit success')}</Text>
                    </View>

                    <View style={styles.contentPanel}>
                        {KeyInfo}
                        {ItemDetail}
                        {SendTo}
                    </View>
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
        backgroundColor: '#24293d',
    },
    NavBarImage: {
        width: 48,
        height: 48
    },
    NarBarTitle: {
        fontSize: 18,
        color: '#ffffff',
        height: 48,
        textAlignVertical:'center',
        textAlign: 'center',
        marginRight:40,
        lineHeight: 48
    },
    imagePanel:{
        height: 140,
        backgroundColor: '#ffffff',
        alignItems: 'center'
    },
    imageIcon: {
        width: 100,
        height: 100,
        marginTop: 40
    },
    submitText: {
        fontSize: 18,
        color: '#6097f4'
    },
    contentPanel:{
        marginTop: 30,
        paddingLeft: 12,
        paddingTop: 16,
        backgroundColor: '#ffffff',
        marginBottom: 10
    },
    textLabel:{
        fontSize: 14,
        color: '#19293b'
    },
    textPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 14
    },
    itemPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginRight: 12,
        marginTop: 12,
        backgroundColor: '#ffffff'
    },
    itemLine: {
        width: 1,
        height: 120,
        marginLeft: 20,
        backgroundColor: '#dcdcdc'
    },
    itemDotImage:{
        position: 'absolute',
        left: 12,
        top: 44,
        width: 18,
        height: 18,
    },
    itemContentPanel:{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        marginLeft: 18,
        marginRight: 26,
    },
    datePanel: {
        width: 120,
        height: 20,
        backgroundColor: '#d5dbe4',
        borderRadius: 12,
        alignSelf: 'center'
    },
    timeShow: {
        color:'#ffffff',
        fontSize: 12,
        textAlign: 'center',
        textAlignVertical: 'center',
        lineHeight: 20
    },
    itemDataPanel:{
        marginTop: 20,
        backgroundColor: '#f7f8fa',
        alignItems: 'flex-start',
        paddingLeft: 14
    },
    itemDataName: {
        textAlignVertical:'center',
        marginTop:10,
        marginBottom: 10
    }
});
