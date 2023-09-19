import React, {Component} from 'react';
import {DeviceEventEmitter, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Actions} from 'react-native-router-flux';
import RNStatusBar from "../components/RNStatusBar";
import HttpUtil from "../utils/HttpUtil";
import TimeUtil from "../utils/TimeUtil";
import SoundPlayer from "../components/SoundPlayer";
import I18n from 'react-native-i18n';

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class AttachEvent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: []
        };
    }

    componentDidMount() {
        this.fetchEventList();
    }

    fetchEventList(){
        let request = {};
        request.beginTs = new Date().getTime() - 86400*30*1000;
        request.endTs = new Date().getTime();
        let filter = {};
        filter.page = 0;
        filter.size = 5;
        request.filter = filter;
        let clause = {};
        clause.status = 0;
        clause.storeId = this.props.data;
        clause.sourceType = 0;
        request.clause = clause;
        let order = {};
        order.direction = 'desc';
        order.property = 'ts';
        request.order = order;;
        HttpUtil.post('event/list',request)
            .then(result => {
                let content = result.data.content;
                let data = [];
                content.forEach((item,index)=>{
                    let add = {};
                    add.id = item.id;
                    add.ts = item.ts;
                    add.subject = item.subject;
                    add.description = item.initialComment.description;
                    let attachment = item.initialComment.attachment;
                    if (attachment != null){
                        let itemAudio = attachment.find(element => element.mediaType === 0);
                        if (itemAudio != null){
                            add.audioPath = itemAudio.url;
                        }
                        let itemVideo = attachment.find(element => element.mediaType === 1);
                        if (itemVideo != null){
                            add.videoPath = itemVideo.url;
                        }
                        let itemImage = attachment.find(element => element.mediaType === 2);
                        if (itemImage != null){
                            add.imagePath = itemImage.url;
                        }
                    }
                    data.push(add);
                });
                this.setState({data: data});
            })
            .catch(error=>{
            })
    }

    onPressItem(item,index){
        let data = {};
        data.subject = item.subject;
        data.id = item.id;
        DeviceEventEmitter.emit('onAttachEvent',data);
        Actions.pop();
    }

    renderItem(item,index) {
        let timeStr = TimeUtil.getTime(item.ts);
        let desc = null;
        if (item.description){ desc = (
            <Text style={{color: '#989ba3', fontSize:12, textAlignVertical: 'center',textAlign: 'left', marginTop:5,marginBottom:5}}>{item.description}</Text>
        )
        }
        let sound = null;
        if ( item.audioPath ){ sound = (
            <SoundPlayer path={item.audioPath}/>
        )
        }
        return (
            <TouchableOpacity onPress={() => this.onPressItem(item,index)}>
                <View style={{flex:1,marginLeft:16,marginRight:16,marginTop:5,marginBottom:5}} >
                    <View style={{flexDirection:'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5}}>
                        <Text ellipsizeMode={'tail'} numberOfLines={1} style={{color: '#19293b', fontSize:14, textAlignVertical: 'center',textAlign: 'left',maxWidth: width-32-120}}>{item.subject}</Text>
                        <Text style={{color: '#989ba3', fontSize:12, textAlignVertical: 'center',textAlign: 'right'}}>{timeStr}</Text>
                    </View>
                    {desc}
                    {sound}
                </View>
            </TouchableOpacity>
        );
    }

    render() {
        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={Actions.pop}>
                        <View style={{width:60,height:48}}>
                            <Image source={require('../assets/images/titlebar_back_icon_normal.png')} style={styles.NavBarImage}/>
                        </View>
                    </TouchableOpacity>
                    <View style={{width:width-60,height:48,alignItems: 'center'}}>
                        <Text style={[styles.NavBarTitle,{fontSize:18,marginRight:60}]}>{I18n.t('Historical issue')}</Text>
                    </View>
                </View>
                <View style={{flex: 1}}>
                    <FlatList data={this.state.data} keyExtractor={(item, index) => index.toString()} extraData={this.state}
                              renderItem={({item,index}) => this.renderItem(item,index)}
                              showsVerticalScrollIndicator={false}
                              ItemSeparatorComponent={() => <View style={{
                                  height: 1,
                                  width: width - 32,
                                  marginLeft: 16,
                                  backgroundColor: '#dcdcdc'
                              }}/>}
                    />
                </View>
            </View>
        );
    }

}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent:'center',
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
    NavBarTitle: {
        fontSize: 18,
        height: 48,
        color: '#ffffff',
        textAlign:'center',
        textAlignVertical:'center',
        lineHeight: 48
    }
});
