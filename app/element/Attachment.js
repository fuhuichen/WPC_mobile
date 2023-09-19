import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity} from "react-native";
import PropTypes from 'prop-types';
import store from "../../mobx/Store";
import CommentItem from "../components/comment/CommentItem";
import CommentResourcesBlock from "../components/comment/CommentResourcesBlock";
import I18n from "react-native-i18n";
import TimeUtil from "../utils/TimeUtil";
import TouchableInactive from "../touchables/TouchableInactive";
import TouchableActive from "../touchables/TouchableActive";
import {Divider} from "react-native-elements";

const {width} = Dimensions.get('screen');
export default class Attachment extends Component {
    state = {
        enumSelector: store.enumSelector,
        paramSelector: store.paramSelector
    };

    static propTypes = {
        data: PropTypes.object.isRequired,
        unfold: PropTypes.function,
        showAccount: PropTypes.boolean,
        showDivider: PropTypes.boolean,
        showChannel: PropTypes.boolean,
        enableChannel: PropTypes.boolean
    };

    static defaultProps = {
        showAccount: false,
        showDivider: false,
        showChannel: false,
        enableChannel: false
    };

    unfold(){
        let {data} = this.props;
        this.props.unfold && this.props.unfold(data);
    }

    renderHeader(){
        let {data, showAccount} = this.props;
        let {enumSelector, paramSelector} = this.state;
        let attachment = data.attachment, media = null, audio = null;

        if (attachment.find(p => ((p.mediaType === enumSelector.mediaTypes.IMAGE) || (p.mediaType === enumSelector.mediaTypes.VIDEO))) != null){
            media = <Image source={require('../assets/img_attach_media.png')} style={styles.icon}/>;
        }

        if (attachment.find(p => p.mediaType === enumSelector.mediaTypes.AUDIO) != null){
            audio = <Image source={require('../assets/img_attach_voice.png')} style={styles.icon}/>;
        }

        let arrow = <Image source={!data.attachUnfold ? require('../assets/img_chart_down.png') :
                                                        require('../assets/img_chart_up.png')} style={styles.arrow}/>;

        let comment = <Text style={styles.description}>{I18n.t('Reference feedback')}</Text>;

        if ((attachment.length === 1) && (attachment[0].mediaType === enumSelector.mediaTypes.TEXT) && (attachment[0].url === "")){
            arrow = null;
            comment = null;
        }

        let account = null;
        if (showAccount){
            let date = TimeUtil.getDetailTime(data.ts);
            let badge = paramSelector.getStatusMap().find(p => p.id === data.status);

            account = <View style={styles.accountPanel}>
                <Text style={styles.account} numberOfLines={1}>
                    {data.accountTitle} {data.accountName} ({date[3]} {date[1]})
                </Text>
                <Text style={{color:badge.color, fontSize:12}}>{badge.name}</Text>
            </View>;
        }

        return (
            <TouchableOpacity activeOpacity={arrow ? 0.6 : 1} onPress={()=>{arrow ? this.unfold() : {}}}>
                <View style={styles.header}>
                    {account}
                    <View style={styles.labels}>
                        <View style={styles.panel}>
                            {comment}
                        </View>
                        <View style={{width: (arrow != null) ? 10 : 0}}/>
                        {media}
                        {audio}
                        {arrow}
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    renderAttachment(){
        let {data, showChannel, enableChannel} = this.props;
        let {enumSelector} = this.state;

        let comments = data.attachment;
        /*let index = data.attachment.length-1;
        if (data.attachment[index].mediaType === enumSelector.mediaTypes.TEXT){
            comments = data.attachment.slice(0,data.attachment.length-1);
        }*/

        let textAndSound = comments.filter(p => (p.mediaType === enumSelector.mediaTypes.TEXT)
            || (p.mediaType === enumSelector.mediaTypes.AUDIO));
        let imageAndVideo = comments.filter(p => (p.mediaType === enumSelector.mediaTypes.IMAGE)
            || (p.mediaType === enumSelector.mediaTypes.VIDEO));
        return (
            (data.attachUnfold && (comments.length > 0)) ?
                    <View style={{marginLeft:-8}}>
                        <CommentResourcesBlock data={textAndSound}
                                               showDelete={false}
                                               textStyle={{backgroundColor:'#fff'}}
                                               audioStyle={{backgroundColor:'#fff'}}
                        />

                        <CommentResourcesBlock data={imageAndVideo}
                                               showDelete={false}
                                               showChannel={showChannel}
                                               enableChannel={enableChannel}
                                               blockStyle={{marginTop:10,marginLeft:10}}
                        />
                    </View> : null
        )
    }

    render() {
        let {data, showDivider} = this.props;
        let {enumSelector} = this.state;

        let attachment = data.attachment;
        let attachmentLength = data.attachment.length;

        //if (attachment.find(p => ((p.mediaType === enumSelector.mediaTypes.TEXT) && (p.url == ""))) != null){
        //    attachmentLength = attachmentLength - 1;
        //}
        return (
            (attachmentLength > 0) ? <View style={styles.container}>
                {this.renderHeader()}
                {this.renderAttachment()}
                {showDivider && <Divider style={styles.divider}/>}
            </View> : null
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 8
    },
    header:{
        marginTop: 5,
        marginBottom: 8
    },
    content:{
        fontSize: 12,
        color:'#484848'
    },
    labels:{
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    icon:{
        width:16,
        height:16,
        marginRight:4,
        marginTop: 3
    },
    arrow:{
        width: 18,
        height: 10,
        marginTop:6
    },
    description:{
        color:'#64686D',
        fontSize:14
    },
    divider:{
        height:2,
        backgroundColor:'#006AB7',
        borderBottomWidth:0
    },
    account:{
        fontSize:12,
        color:'#86888A',
        marginTop:-2,
        marginBottom: 6,
        maxWidth:width-130
    },
    accountPanel:{
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    panel:{
        flex:1,
        marginLeft:6
    }
});
