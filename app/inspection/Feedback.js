import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    FlatList,
    TouchableOpacity,
    ScrollView,
    DeviceEventEmitter
} from "react-native";
import PropTypes from 'prop-types';
import I18n from "react-native-i18n";
import {Actions} from 'react-native-router-flux';
import {Badge, Divider} from "react-native-elements";
import Attachment from "../element/Attachment";
import ModalCenter from "../components/ModalCenter";
import CommentDialog from "../components/comment/CommentDialog";
import EventBus from "../common/EventBus";
import store from "../../mobx/Store";
import TouchableActive from "../touchables/TouchableActive";
import TextUnfold from "../element/TextUnfold";
import SlotView from "../customization/SlotView";
import BorderShadow from '../element/BorderShadow';
import AndroidBacker from "../components/AndroidBacker";
import PatrolCore from "./PatrolCore";
import AccessHelper from '../common/AccessHelper';

const {width, height} = Dimensions.get('window');
export default class Feedback extends Component {
    state = {
        patrolSelector: store.patrolSelector,
        screenSelector: store.screenSelector,
        index: 0,
        visible: false,
        subject: '',
        attachment: [],
        onModify: false,
        onDelete: false
    };

    static propTypes = {
        showTitle: PropTypes.boolean,
        isPatrol: PropTypes.boolean,
        data: PropTypes.object,
        showEdit: PropTypes.boolean,
        showOperator: PropTypes.boolean,
        padding: PropTypes.number,
        onBacker: PropTypes.func
    };

    static defaultProps = {
        showTitle: true,
        isPatrol: true,
        data: [],
        showOperator: true,
        showEdit: true,
        padding: 14
    };

    onModify(index){
        let {patrolSelector, subject, attachment, visible, screenSelector} = this.state;
        subject = patrolSelector.feedback[index].subject;
        attachment = patrolSelector.feedback[index].attachment;

        patrolSelector.router = screenSelector.patrolType.FEEDBACK;
        patrolSelector.keyIndex = index;

        if (PatrolCore.isRemote(patrolSelector) && (patrolSelector.store.device.length > 0)){
            this.setState({patrolSelector, onModify: false}, () =>  {
                Actions.push('patrolVideo');
            });
        }else {
            this.setState({subject, attachment, visible: true, onModify: false},() => {
                EventBus.updateBasePatrol();
            });
        }
    }

    onDelete(index){
        let {patrolSelector} = this.state;
        patrolSelector.visible = false;

        this.setState({index, onDelete: false, patrolSelector},
            () =>{
            EventBus.updateBasePatrol();
            this.modal && this.modal.open();
        });
    }

    onConfirm(){
        let {patrolSelector, index} = this.state;
        patrolSelector.feedback.splice(index, 1);
        this.setState({patrolSelector}, () => {
            EventBus.updateBasePatrol();
        })
    }

    attachUnfold(item, index){
        let {isPatrol, data} = this.props;
        if (isPatrol){
            let {patrolSelector} = this.state;

            let key = patrolSelector.feedback.findIndex(p => p === item);
            let unfold = patrolSelector.feedback[key].attachUnfold;
            patrolSelector.feedback[key].attachUnfold = !unfold;
            this.setState({patrolSelector}, () => {
                EventBus.updateBasePatrol();
            })
        }else {
            data[index].attachUnfold = !item.attachUnfold;
            EventBus.updateBasePatrol(false);
        }
    }

    renderEditor(index){
        let {showEdit} = this.props;
        let {onModify, onDelete} = this.state;
        return (
            showEdit ? <View style={styles.editor}>
                <TouchableOpacity activeOpacity={0.5} onPressIn={() => {this.setState({onDelete:true,index})}}
                                  onPressOut={() => {this.onDelete(index)}}>
                    <Badge value={I18n.t('Delete')} badgeStyle={[styles.badge,{marginRight:6},
                        onDelete && (index === this.state.index) && {borderColor:'#006AB7',borderWidth:1}]} textStyle={styles.text}/>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.5} onPressIn={() => {this.setState({onModify:true, index})}}
                                  onPressOut={() => {this.onModify(index)}}>
                    <Badge value={I18n.t('Modify')} badgeStyle={[styles.badge,
                        onModify && (index === this.state.index) && {borderColor:'#006AB7',borderWidth:1}]} textStyle={styles.text}/>
                </TouchableOpacity>
            </View> : null
        )
    }

    headUnfold(item, index){
        let {isPatrol, data} = this.props;
        if (isPatrol){
            let {patrolSelector} = this.state;

            let key = patrolSelector.feedback.findIndex(p => p === item);
            let unfold = patrolSelector.feedback[key].headUnfold;
            patrolSelector.feedback[key].headUnfold = !unfold;
            this.setState({patrolSelector}, () => {
                EventBus.updateBasePatrol();
            })
        }else {
            data[index].headUnfold = !item.headUnfold;
            EventBus.updateBasePatrol(false);
        }
    }

    renderItem({item,index}){
        let {patrolSelector} = this.state;
        let {showOperator, showEdit, data} = this.props;
        let marginBottom = (showOperator && (index === data.length -1)) ? 10 : 10;

        let modifyAble = (patrolSelector.feedback.length > index && patrolSelector.feedback[index] && patrolSelector.feedback[index].modifyAble != null) ? 
                            patrolSelector.feedback[index].modifyAble : true;
        return (
            <TouchableActive>
                <View style={[styles.panel,{marginBottom}, BorderShadow.div]}>
                    <TextUnfold data={item} sequence={index} unfold={(data) => this.headUnfold(data,index)}/>
                    {
                        (item.attachment.length > 0) ? <Divider style={styles.divider}/> : null
                    }
                    <Attachment data={item} unfold={(data) => this.attachUnfold(data, index)}/>
                    {
                        showEdit ? <Divider style={{backgroundColor:'#006AB7', height:2,marginTop:6}}/> : null
                    }
                    {modifyAble && this.renderEditor(index)}
                </View>
            </TouchableActive>
        )
    }

    onFeedback(){
        let {patrolSelector, screenSelector} = this.state;

        if (PatrolCore.isRemote(patrolSelector) && (patrolSelector.store.device.length > 0)){
            patrolSelector.router = screenSelector.patrolType.FEEDBACK;
            patrolSelector.keyIndex = -1;

            this.setState({patrolSelector}, () => {
                Actions.push('patrolVideo');
            });
        }else {
            this.setState({index: -1, subject: '', attachment:[], visible: true});
        }
    }

    onComment(data, question){
        let {patrolSelector, attachment, visible, index} = this.state;
        if (index === -1){
            patrolSelector.feedback.push({
                subject: question,
                attachment: data,
                headUnfold: false,
                attachUnfold: false
            })
        }else {
            patrolSelector.feedback[index].subject = question;
            patrolSelector.feedback[index].attachment = data;
        }
        this.setState({visible: false, patrolSelector}, () => {
            EventBus.updateBasePatrol();
        });
    }

    renderOperator(){
        let {showOperator} = this.props;
        return (
            showOperator ? <TouchableOpacity style={styles.operator} activeOpacity={0.5} onPress={() => this.onFeedback()}>
                <Image source={require('../assets/img_add_feedback.png')} style={styles.feedbackPanel}/>
            </TouchableOpacity> : null
        )
    }

    render() {
        let {data, padding, showOperator, isPatrol, showTitle} = this.props;
        let {visible, subject, attachment, patrolSelector} = this.state;

        let otherAttachmentCount = 0;
        patrolSelector.data.forEach(element => {
            element.groups.forEach(group => {
                group.items.forEach(item => {
                    item.attachment.forEach(attachmentTmp => {
                        if( attachmentTmp.mediaType == store.enumSelector.mediaTypes.IMAGE || 
                            attachmentTmp.mediaType == store.enumSelector.mediaTypes.VIDEO) {
                            otherAttachmentCount++;
                        }
                    })
                })
            })
        })
        patrolSelector.feedback.forEach((element,index) => {
            if(index != patrolSelector.keyIndex) {
                element.attachment.forEach(attachmentTmp => {
                    if( attachmentTmp.mediaType == store.enumSelector.mediaTypes.IMAGE || 
                        attachmentTmp.mediaType == store.enumSelector.mediaTypes.VIDEO) {
                        otherAttachmentCount++;
                    }
                })
            }
        })

        return (<View style={{flex:1,marginTop: showOperator ? 0 : 20}}>
                {
                    (data.length > 0) ? <ScrollView showsVerticalScrollIndicator={false}>
                        {showTitle && <Text style={styles.title}>{I18n.t('Feedback project')}</Text>}
                        <View style={[styles.container,{paddingLeft: padding, paddingRight: padding,paddingBottom: padding,
                            marginLeft: showOperator ? 10 : 0, paddingTop: 16}]}>                            
                            <FlatList data={data}
                                      keyExtractor={(item, index) => index.toString()}
                                      renderItem={this.renderItem.bind(this)}
                                      showsVerticalScrollIndicator={false}/>
                        </View>
                        <SlotView containerStyle={{height:10}}/>
                    </ScrollView> : null
                }
                {this.renderOperator()}
                {
                    isPatrol && <CommentDialog
                            questionMode={true}
                            contentMode={true}
                            visible={visible}
                            showEdit={true}
                            showDelete={true}
                            enableCapture={PatrolCore.enableCapture(patrolSelector)}
                            enableImageLibrary={!PatrolCore.isRemote(patrolSelector) && PatrolCore.enableImageLibrary(patrolSelector)}
                            defaultQuestion={subject}
                            defaultData={attachment}
                            otherAttachmentCount={otherAttachmentCount}
                            onCancel={()=>{this.setState({visible:false})}}
                            onClose={(data,question) => {this.onComment(data,question)}}/>
                }

                <ModalCenter ref={c => this.modal = c} title={I18n.t('Delete feedback')} description={I18n.t('Feedback delete')}
                             confirm={() => this.onConfirm()}/>
                <AndroidBacker onPress={() => {
                    if (showOperator){
                        this.props.onBacker && this.props.onBacker();
                        return true;
                    }
                }}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor:'#E8EFF472',
        borderRadius:10,
        width:width-20,
        marginLeft: 10
    },
    title:{
        fontSize: 16,
        marginTop: 16,
        marginBottom:16,
        marginLeft:10,
        color:'#64686D'
    },
    panel:{
        width:width-50,
        backgroundColor: '#fff',
        marginLeft:1,
        borderRadius: 10,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 20,
        paddingBottom: 10
    },
    editor:{
        flexDirection:'row',
        justifyContent:'flex-end'
    },
    badge:{
        height: 24,
        borderRadius: 14,
        marginTop:10,
        backgroundColor:'#fff',
        paddingLeft:5,
        paddingRight:5
    },
    text:{
        fontSize: 14,
        color:'#006AB7'
    },
    operator:{
        position:'absolute',
        right: 10,
        bottom: 30
    },
    feedbackPanel:{
        width:50,
        height:50
    },
    feedbackPlus:{
        width:18,
        height:18,
        marginTop:-35,
        marginLeft:16
    },
    divider:{
        backgroundColor:'#F2F2F2',
        height:2,
        marginTop:10,
        borderBottomWidth:0
    }
});
