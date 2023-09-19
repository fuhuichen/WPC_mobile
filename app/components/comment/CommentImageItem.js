import React, {Component} from 'react';
import {StyleSheet, Image, View, Text, DeviceEventEmitter, TouchableOpacity} from "react-native";
import PropTypes from "prop-types";
import TouchableOpacityEx from "../../touchables/TouchableOpacityEx";
import {Actions} from "react-native-router-flux";
import moment from "moment";
import TouchableInactive from "../../touchables/TouchableInactive";
import {EMITTER_SOUND_STOP} from "../../common/Constant";
import store from "../../../mobx/Store";
import I18n from "react-native-i18n";
import AccessHelper from '../../common/AccessHelper';

export default class CommentImageItem extends Component {
    state = {
        videoSelector: store.videoSelector,
        patrolSelector: store.patrolSelector,
        screenSelector: store.screenSelector,
    };

    static propTypes =  {
        uri: PropTypes.string.isRequired,
        width: PropTypes.number,
        height: PropTypes.number,
        showDelete: PropTypes.boolean,
        onDelete: PropTypes.function,
        style: PropTypes.style,
        showDate: PropTypes.boolean,
        showChannel: PropTypes.boolean,
        enableChannel: PropTypes.boolean
    };

    static defaultProps = {
        width:90,
        height:60,
        showDelete: true,
        style:{},
        showDate: false,
        showChannel: false,
        enableChannel: false
    };

    constructor(props) {
        super(props);

        this.deleteUri = require('../../assets/images/comment/icon_text_delete.png');
    }

    onView(uri){
        if (this.props.urls){
            let picList = this.props.urls;
            let index = picList.findIndex(p => p == uri);
            Actions.push('pictureViewer',{uri: picList, index:index});
        }
        else{
            Actions.push('pictureViewer', {uri});
        }
        DeviceEventEmitter.emit(EMITTER_SOUND_STOP);
        if(this.props.onPlay)this.props.onPlay(this.props.data)
    }

    onVideo(data){
        let {patrolSelector,screenSelector,videoSelector} = this.state;
        if (videoSelector.getData().device.length == 0){
            DeviceEventEmitter.emit('Toast', I18n.t('No cameras'));
            return;
        }
        patrolSelector.router = screenSelector.patrolType.MONITOR;
        patrolSelector.store =  videoSelector.getData();
        patrolSelector.deviceId = data.deviceId;
        if (!AccessHelper.enableStoreMonitor() || !AccessHelper.enableVideoLicense()){
            DeviceEventEmitter.emit('Toast', I18n.t('Video license'));
            return;
        }
        this.setState({patrolSelector,videoSelector}, () =>  {       
           Actions.push('patrolVideo');
       });
    }

    render() {
        let {videoSelector} = this.state;
        let {width, height, data, showDelete, style, showDate, showChannel, enableChannel} = this.props;

        let activeOpacity = 1, opacity = 0.5, deviceName = '', viewHeight = height, router = () => {};
        if (showChannel){
            deviceName = videoSelector.getDeviceName(data.deviceId);
            (deviceName !== '') && (viewHeight += 26);

            if (enableChannel){
                activeOpacity = 0.5;
                opacity = 1;
                router = () => this.onVideo(data);
            }
        }

        return (
            <TouchableInactive style={{marginRight:6}}>
                <View style={[{width,height: viewHeight}, style]}>
                    <TouchableOpacityEx activeOpacity={1} onPress={()=>{this.onView(data.url)}}>
                        <Image style={{width,height,borderRadius:5}} source={{uri:data.url}} resizeMode='cover'/>
                    </TouchableOpacityEx>
                    {
                        showDelete ? <TouchableOpacityEx activeOpacity={1} style={styles.delete}
                                                          onPress={()=>{this.props.onDelete(data)}}>
                            <Image style={{width:16,height:16}} source={this.deleteUri} />
                        </TouchableOpacityEx> : null
                    }
                    {
                        showDate ? <View style={{width:120}}>
                            <Text style={{fontSize:11,color:'#777777'}}>{moment(new Date(data.ts)).format('YYYY/MM/DD HH:mm')}</Text>
                        </View> : null
                    }

                    {
                        showChannel ? <TouchableOpacity activeOpacity={activeOpacity} onPress={() => router()}>
                            <View style={[styles.device,{opacity}]}>
                                <Image source={require('../../assets/img_camera_device.png')} style={styles.camera}/>
                                <Text style={styles.name}>{deviceName}</Text>
                            </View>
                        </TouchableOpacity>: null
                    }
                </View>
            </TouchableInactive>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        alignItems:'center',
        justifyContent:'center',
        borderRadius:0,
    },
    play:{
        width:20,
        height: 20
    },
    delete:{
        position:'absolute',
        right:4,
        top:4,
        width:16,
        height:16
    },
    device:{
        flexDirection:'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: 4
    },
    camera:{
        width: 14,
        height: 14
    },
    name:{
        fontSize: 10,
        marginLeft: 4,
        color: 'rgb(44,144,217)'
    }
});
