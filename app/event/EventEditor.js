import React, {Component} from 'react';
import {Platform,StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, DeviceEventEmitter} from "react-native";
import PropTypes from 'prop-types';
import * as BorderShadow from "../element/BorderShadow";
import SubjectUnfold from "../element/SubjectUnfold";
import {Badge, Divider} from "react-native-elements";
import Attachment from "../element/Attachment";
import store from "../../mobx/Store";
import I18n from "react-native-i18n";
import AccessHelper from "../common/AccessHelper";
import {EventCore} from "./EventCore";
import {addCommentWithFeedback} from "../common/FetchRequest";
import moment from "moment";
import TimeUtil from "../utils/TimeUtil";
import CommentDialog from "../components/comment/CommentDialog";
import OSSUtil from "../utils/OSSUtil";
import {MODULE_EVENT} from "../common/Constant";

const {width} = Dimensions.get('screen');
export default class EventEditor extends Component {
    state = {
        showComment: false,
        showItem: null,
        paramSelector: store.paramSelector,
        enumSelector: store.enumSelector
    };

    static propTypes = {
        data: PropTypes.object.isRequired,
        measureWidth: PropTypes.number,
        showMark: PropTypes.boolean,
        onData: PropTypes.func,
        onRefresh: PropTypes.func
    };

    static defaultProps = {
        showMark: false,
        measureWidth: width-123
    };

    constructor(props){
        super(props);

        let {enumSelector} = this.state;
        this.operator = [
            {
                id: enumSelector.statusType.PENDING,
                actions: [EventCore.add(), EventCore.handle(), EventCore.close()]
            },
            {
                id: enumSelector.statusType.DONE,
                actions: [EventCore.add(), EventCore.reject(), EventCore.close()]
            },
            {
                id: enumSelector.statusType.REJECT,
                actions: [EventCore.add(), EventCore.handle(), EventCore.close()]
            },
            {
                id: enumSelector.statusType.CLOSED,
                actions: []
            },
            {
                id: enumSelector.statusType.OVERDUE,
                actions: []
            }
        ];

        this.source = [
            {
                type: store.enumSelector.sourceType.VIDEO,
                uri: require('../assets/img_video_nomal.png')
            },
            {
                type: store.enumSelector.sourceType.REMOTE,
                uri: require('../assets/images/mode_0.png')
            },
            {
                type: store.enumSelector.sourceType.ONSITE,
                uri: require('../assets/images/mode_1.png')
            }
        ];
    }

    subjectUnfold(){
        let {data} = this.props;
        data.subjectUnfold = !data.subjectUnfold;
        this.props.onData && this.props.onData(data);
    }


    attachUnfold(item, index){
        let {data} = this.props;
        data.comment[index].attachUnfold = !item.attachUnfold;
        this.props.onData && this.props.onData(data);
    }

    onShow(item){
        let eventStore = null;
        if(store.storeSelector && store.storeSelector.storeList) {
            store.storeSelector.storeList.forEach(element => {
                if(store.eventSelector.collection) {
                    if(element.storeId == store.eventSelector.collection.storeId) {
                        eventStore = element;
                    }                    
                } else if (store.storeSelector.collection) {   
                    if(element.storeId == store.storeSelector.collection.storeId) {
                        eventStore = element;
                    }                    
                }
            })
        }

        if(eventStore != null && eventStore.status != 20 && eventStore.status != 21 && eventStore.status != 60) {
            DeviceEventEmitter.emit('Toast', I18n.t('Service overdue'));
        } else {
            this.setState({
                showItem: item,
                showComment:true
            });
        }        
    }

    async onComment(attachment){
        let {enumSelector, showItem} = this.state;
        let {data} = this.props;

        let uploads = JSON.parse(JSON.stringify(attachment));

        OSSUtil.init(data.storeId).then(() => {
            let pArray = [];

            uploads.forEach((item, index) => {
                if (item.mediaType !== enumSelector.mediaTypes.TEXT){
                    let ossKey = OSSUtil.formatOssUrl(MODULE_EVENT, item.mediaType,
                        data.storeId,item.deviceId + index.toString());
                    item.url = (Platform.OS === 'android' && item.mediaType === enumSelector.mediaTypes.AUDIO) ? `file://${item.url}` : item.url;

                    pArray.push(OSSUtil.upload(ossKey, item.url));
                    item.url = OSSUtil.formatRemoteUrl(ossKey);
                }
            });

            Promise.all(pArray).then(async (res) => {
                let body = {
                    eventId: data.id,
                    comment: {
                        ts: moment().unix()*1000,
                        attachment: uploads,
                        status: (showItem.status != null) ? showItem.status : data.status
                    }
                };

                let result = await addCommentWithFeedback(body);
                if (result.errCode !== enumSelector.errorType.SUCCESS){
                    this.comment && this.comment.showErrorMsg(I18n.t('Save failure'));
                    return;
                }

                let response = result.data;
                response.subjectUnfold = data.subjectUnfold;
                response.comment.forEach((item) => {
                    let comment = data.comment.find(p => p.ts === item.ts);
                    comment ? (item.attachUnfold = comment.attachUnfold) : (item.attachUnfold = false);
                });

                this.setState({showItem: null, showComment: false});
                this.props.onData && this.props.onData(response);
                this.props.onRefresh && this.props.onRefresh(showItem.type);

            }).catch(error => {
                this.comment && this.comment.showErrorMsg(I18n.t('Save failure'));
            })

        }).catch(error => {
            this.comment && this.comment.showErrorMsg(I18n.t('Save failure'));
        });
    }

    renderEditor(){
        let {data} = this.props;
        let actions = [];
        if(this.props.relate != null){
            actions = [EventCore.append()];
        }
        else{
            actions = this.operator.find(p => p.id === data.status).actions;
        }

        return (
            actions.map((item, index) => {
                return item.enable() ? <TouchableOpacity activeOpacity={0.5} onPress={() => this.onShow(item)}>
                    <View style={styles.actionPanel}>
                        <Text style={styles.actionText}>{item.name}</Text>
                    </View>
                </TouchableOpacity> : null
            })
        )
    }

    renderOverdue(){
        let {enumSelector} = this.state;
        let {data} = this.props;

        let overDue = (data.status === enumSelector.statusType.OVERDUE);
        let date = overDue ? TimeUtil.getDetailTime(data.updateTs) : '';
        return (
            overDue ? <Text style={styles.overdue}>
                {I18n.t('Overdue closed')} ({I18n.t('Overdue time')} {date[0]} {date[1]})
            </Text> : null
        )
    }

    onMark(){
        let {data} = this.props;
        data.isMark = !data.isMark;
        this.props.onData && this.props.onData(data);
    }

    renderMark(){
        let {data} = this.props;
        let source = data.isMark ? require('../assets/img_mark_select.png') :
            require('../assets/img_mark_unselect.png');
        return (
            <View style={styles.markPanel}>
                <TouchableOpacity activeOpacity={1} onPress={() => this.onMark()}>
                    <Image source={source} style={styles.mark}/>
                </TouchableOpacity>
                <View style={{flex:1}}/>
            </View>
        )
    }

    render() {
        let {showMark, data, measureWidth} = this.props, operator = null;
        let {paramSelector, enumSelector, showComment, showItem} = this.state;

        let uri = this.source.find(p => p.type === data.sourceType).uri;
        let badge = paramSelector.getStatusMap().find(p => p.id === data.status);
        if ((data.status !== enumSelector.statusType.CLOSED) && (data.status !== enumSelector.statusType.OVERDUE)){
            operator = <View style={styles.panel}>
                {!showMark && this.renderEditor()}
                {showMark && this.renderMark()}
            </View>;
        }

        return (
            <View style={[styles.container, BorderShadow.div]}>
                <View style={{flexDirection:'row',justifyContent:'flex-start'}}>
                    <Badge value={badge.name} badgeStyle={[styles.badgeStyle, {backgroundColor: badge.backgroundColor}]}
                           textStyle={[styles.textStyle, {color: badge.color}]}/>
                    {this.renderOverdue()}
                </View>
                <View style={styles.subjectPanel}>
                    <Image source={uri} style={styles.source}/>
                    <SubjectUnfold data={data} unfold={(item) => this.subjectUnfold()} measureWidth={measureWidth}/>
                </View>
                <Divider style={styles.divider}/>
                {
                    data.comment.map((item, index) => {
                        return <Attachment data={item}
                                           showAccount={true}
                                           showDivider={true}
                                           showChannel={true}
                                           enableChannel={!showMark}
                                           unfold={(item) => this.attachUnfold(item, index)} />
                    })
                }
                {operator}
                {
                    showComment ? <CommentDialog ref={c => this.comment = c}
                                                needContent={true}
                                                questionMode={false}
                                                contentMode={true}
                                                dissmissWhenClose={false}
                                                visible={true}
                                                showEdit={true}
                                                showDelete={true}
                                                enableCapture={this.props.relate != null ? false : true}
                                                enableImageLibrary={this.props.relate != null ? false : true}
                                                defaultData={this.props.relate != null ? this.props.attachment : []}
                                                title={showItem.name}
                                                onCancel={() => {
                                                    this.setState({showItem: null, showComment: false})
                                                }}
                                                onNotClose={async (data, question) => await this.onComment(data)}/> : null
                }
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:'#fff',
        paddingLeft:16,
        paddingRight:16,
        paddingTop:10,
        paddingBottom:12,
        borderRadius:10,
        marginTop:12
    },
    divider:{
        height:2,
        marginTop:12,
        backgroundColor:'#F2F2F2',
        borderBottomWidth:0
    },
    panel:{
        flexDirection:'row',
        justifyContent:'flex-end',
        marginTop:12
    },
    badgeStyle:{
        alignSelf:'flex-start',
        marginLeft:-16,
        marginBottom:10,
        width: 80,
        height:30,
        borderRadius:0,
        borderTopEndRadius:10,
        borderBottomEndRadius:10
    },
    textStyle:{
        fontSize:14
    },
    actionPanel:{
        height:30,
        paddingLeft: 2,
        paddingRight: 2,
        marginLeft:16
    },
    actionText:{
        color:'#006AB7',
        height:30,
        lineHeight:30,
        textAlignVertical:'center'
    },
    overdue:{
        fontSize: 12,
        color:'#86888A',
        marginLeft: 10,
        height:30,
        lineHeight:30,
        marginTop:2,
        textAlignVertical: 'center'
    },
    markPanel:{
        flex:1,
        flexDirection: 'row',
        alignItems:'center',
        height:30
    },
    mark:{
        width:20,
        height:20
    },
    subjectPanel:{
        flexDirection:'row'
    },
    source:{
        width: 20,
        height: 20,
        marginRight:2
    }
});
