import React, {Component} from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    ImageBackground, Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import TimeUtil from "../utils/TimeUtil";
import HttpUtil from "../utils/HttpUtil";
import {Actions} from 'react-native-router-flux';
import AccessHelper from "../common/AccessHelper";
import ToastEx from "react-native-simple-toast";
import I18n from "react-native-i18n";
import SoundPlayer from "../components/SoundPlayer";
import {ColorStyles} from "../common/ColorStyles";
import ModalBox from "../../library/react-native-modalbox";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";

let {width} =  Dimensions.get('screen');

export default class EventTemplateMulti extends Component {
    constructor(props) {
        super(props);
        this.state={
            channelIndex:0,
            attachment:this.props.data.attachment
        }
        this.store = {};
        this.deviceList = [];
        this.relateChannel = []
    }

    componentDidMount() {
        this.fresh(this.props.data);
    }

    componentWillReceiveProps (nextProps){
        this.fresh(nextProps.data);
    }

    fresh(source){
        let request = {};
        let filter = {};
        filter.page = 0;
        filter.size = 1000;
        request.filter = filter;
        HttpUtil.post('store/list',request)
            .then(result => {
                let data = result.data.content.find(element => element.storeId === source.storeId);
                if (data != null){
                    this.store = data;
                    this.deviceList = data.device;
                    this.setState({attachment: source.attachment});
                }
            })
            .catch(error=>{
            })
    }

    onMonitor(item){
        if (!AccessHelper.enableStoreMonitor() || !AccessHelper.enableVideoLicense()){
            ToastEx.show(I18n.t('Video license'), ToastEx.LONG);
            return;
        }
        let deviceIndex = this.deviceList.findIndex(element => element.id === item.deviceId);
        if (deviceIndex !== -1){
            Actions.push('videoMonitor', {data:this.store,channelId:deviceIndex, isCollect:this.store.favorite, emitter: null});
        }
    }

    onFullVideo(uri){
        Actions.push('videoPlayer',{uri: uri});
    }

    onFullPicture(uri){
        Actions.push('pictureViewer',{uri: uri});
    }

    renderBlocks() {
        let attachment = this.state.attachment;
        if (attachment != null){
            return attachment.map((item,index) => {
                let monitorItem = null;
                if (item.deviceId != null){
                    let itemDevice = this.deviceList.find(element => element.id === item.deviceId);
                    if (itemDevice != null){
                        monitorItem = (
                            <TouchableOpacityEx activeOpacity={0.5} onPress={() => this.onMonitor(item)} style={{flexDirection: 'row',marginTop:4}}>
                                <Image style={{width:12, height:12,marginTop:2}} source={require('../assets/images/event_play_icon.png')} resizeMode='contain'/>
                                <Text numberOfLines={1} style={styles.channelName}>{itemDevice.name}</Text>
                            </TouchableOpacityEx>
                        )
                    }
                }

                if(item.mediaType === 1){
                    return (
                        <View>
                            <ImageBackground style={styles.thumbnail} source={require('../assets/images/image_videoThumbnail.png')} resizeMode='contain'>
                                <TouchableOpacity onPress={() => this.onFullVideo(item.url)}>
                                    <Image style={styles.thumbIcon} source={require('../assets/images/pic_play_icon.png')} resizeMode='contain'/>
                                </TouchableOpacity>
                            </ImageBackground>
                            {monitorItem}
                        </View>
                    );
                }
                else if (item.mediaType === 2){
                    return (
                        <View>
                            <TouchableOpacity onPress={() => this.onFullPicture(item.url)}>
                                <Image style={styles.thumbnail} source={{uri:item.url}} resizeMode='cover'/>
                            </TouchableOpacity>
                            {monitorItem}
                        </View>
                    );
                }
            });
        }
    }

    renderRow = ({ item,index}) => {
        let color = index === this.state.channelIndex ? '#F31C65': '#888C95';
        let backColor = index === this.state.channelIndex ? 'rgba(243,28,101,0.1)': 'white';
        return (
            <TouchableOpacity activeOpacity={1} onPress={() => {
                this.setState({channelIndex:index});
            }}>
                <View style={{width:320,height:50,backgroundColor: backColor,flexDirection: 'row',alignItems: 'center'}}>
                    <Image style={{width:28, height:28,marginLeft:20,marginTop:2,marginBottom:2}} source={require('../assets/images/attach_channel_big.png')} resizeMode='contain'/>
                    <Text style={{fontSize:12,marginLeft:20,color:color}} numberOfLines={1}>{item.name}</Text>
                </View>
            </TouchableOpacity>
        )
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

        this.relateChannel = [];
        if (this.props.data.relatedDeviceIds != null){
            this.props.data.relatedDeviceIds.forEach((item,index)=>{
                let itemDevice = this.deviceList.find(element => element.id === item);
                if (itemDevice != null){
                    let device = {};
                    device.name = itemDevice.name;
                    device.deviceId = item;
                    this.relateChannel.push(device);
                }
            });
        }

        let relatedBtn = null;
        if ( this.relateChannel.length > 0 ){ relatedBtn = (
            <TouchableOpacity onPress={() => {
                this.setState({channelIndex:0});
                this.refs.modalBox.open();
            }}>
                <View style={styles.basicBtn}>
                    <Image style={{width: 16, height: 14,marginLeft:3,marginTop:2,marginBottom:2}} source={require('../assets/images/attach_channel.png')} resizeMode='contain'/>
                    <Text numberOfLines={1} style={styles.channelText}>{I18n.t('Relate channel')}</Text>
                </View>
            </TouchableOpacity>
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
                <View style={{flexDirection: 'row',marginTop:10}}>
                    <Text style={{color: '#989ba3', fontSize:12, textAlignVertical: 'center',textAlign: 'left'}}>{TimeUtil.getTime(this.props.data.ts)}</Text>
                    {relatedBtn}
                </View>

                <ModalBox style={styles.modalBox} ref={"modalBox"} position={"center"}
                          isDisabled={false}
                          swipeToClose={false}
                          backdropPressToClose={false}
                          backButtonClose={true}
                          coverScreen={true}>

                    <View style={styles.headerPanel}>
                        <Text style={{fontSize: 14, color: '#19293b'}}>{I18n.t('Relate channel')}</Text>
                    </View>
                    <View style={{height:1,backgroundColor:'#dcdcdc'}}/>
                    <ScrollView showsVerticalScrollIndicator={true} keyboardShouldPersistTaps={'handled'}>
                        <FlatList
                            data={this.relateChannel}
                            extraData={this.state}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={this.renderRow}
                        />
                    </ScrollView>
                    <View style={{height:1,backgroundColor:'#dcdcdc'}}/>
                    <View style={styles.confirmPanel}>
                        <View style={{width:159.5}}>
                            <TouchableOpacity onPress={() => {
                                this.refs.modalBox.close();
                            }}>
                                <Text style={styles.cancel}>{I18n.t('Cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.verticalLine}></View>
                        <View style={{width:159.5}}>
                            <TouchableOpacity onPress={() => {
                                this.refs.modalBox.close();
                                if (this.state.channelIndex !== -1){
                                    this.onMonitor(this.relateChannel[this.state.channelIndex]);
                                }
                            }}>
                                <Text style={[styles.confirm,{color:ColorStyles.COLOR_MAIN_RED}]}>
                                    {I18n.t('Confirm')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ModalBox>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    channelText: {
        color: '#6097F4',
        fontSize: 10,
        textAlignVertical: 'center',
        alignItems:'center',
        marginLeft: 4,
        marginRight:6,
    },
    basicBtn:{
        marginLeft:10,
        flexDirection: 'row',
        borderRadius: 6,
        alignItems:'center',
        justifyContent: 'center',
        padding:3,
        backgroundColor: 'rgba(96,151,244,0.15)',
    },
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
    },
    channelName: {
        color: ColorStyles.COLOR_MAIN_RED,
        fontSize: 12,
        textAlignVertical: 'center',
        textAlign: 'left',
        marginLeft: 4,
        maxWidth:180,
        textDecorationLine: 'underline',
        ...Platform.select({
            android:{
                marginTop:-2
            }
        })
    },
    modalBox: {
        width: 320,
        height: 300,
        borderRadius:2
    },
    headerPanel:{
        flexDirection:'row',
        justifyContent: 'center',
        alignItems:'center',
        height:56
    },
    bottomPanel:{
        marginTop:10,
        flexDirection:'row',
        alignItems:'center',
        height:46
    },
    confirmPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        height: 48
    },
    cancel:{
        color: '#888c9e',
        height: 48,
        textAlignVertical: 'center',
        textAlign:'center',
        marginBottom: 16,
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    },
    verticalLine:{
        width: 1,
        height: 48,
        backgroundColor:'#dcdcdc'
    },
    confirm: {
        height: 48,
        textAlignVertical: 'center',
        textAlign:'center',
        marginBottom: 16,
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    },
})

