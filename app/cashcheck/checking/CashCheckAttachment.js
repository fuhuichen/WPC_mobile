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
import ModalCenter from "../../components/ModalCenter";
import EventBus from "../../common/EventBus";
import store from "../../../mobx/Store";
import TouchableActive from "../../touchables/TouchableActive";
import TextUnfold from "../../element/TextUnfold";
import SlotView from "../../customization/SlotView";
import BorderShadow from '../../element/BorderShadow';
import AndroidBacker from "../../components/AndroidBacker";
import ImageVideoPanel from '../../components/comment/ImageVideoPanel';
import CommentResourcesBlock from '../../components/comment/CommentResourcesBlock';
import BoxShadow from "react-native-shadow/lib/BoxShadow";

const IMAGE_VIDEO_LIMIT = 20;
const {width, height} = Dimensions.get('window');
export default class CashCheckAttachment extends Component {
    state = {
        enumSelector: store.enumSelector,
        cashcheckSelector: store.cashcheckSelector,
        screenSelector: store.screenSelector,
        showImageVideoPanel: false
    };

    static propTypes = {
        data: PropTypes.object,
        onBacker: PropTypes.func
    };

    static defaultProps = {
        data: []
    };

    onAttachment(){
        this.setState({showImageVideoPanel:true});
    }

    isImageOverLimit(){
        const {cashcheckSelector} = this.state;
        return cashcheckSelector.attachments.length >= IMAGE_VIDEO_LIMIT;
    }

    imageAvailableCount(){
        const {cashcheckSelector} = this.state;
        return IMAGE_VIDEO_LIMIT - cashcheckSelector.attachments.length;
    }

    isVideoOverLimit() {
        const {cashcheckSelector} = this.state;
        return cashcheckSelector.attachments.length >= IMAGE_VIDEO_LIMIT;
    }

    onError(e){
        console.log("onError : ", JSON.stringify(e));
        DeviceEventEmitter.emit('Toast', e);
    }

    onImage(p,e,imgW,imgH){
        const {cashcheckSelector, enumSelector} = this.state;
        for(var k in p){
            cashcheckSelector.attachments.push({
            mediaType: enumSelector.mediaTypes.IMAGE,
            url:p[k],
            ts:new Date().getTime()
            })
        }
        this.setState({cashcheckSelector}, function() {
            EventBus.updateBaseCashCheck();
        })
    }

    onVideo(p,e){
        if(p){
            const {cashcheckSelector, enumSelector} = this.state;
            cashcheckSelector.attachments.push({
            mediaType: enumSelector.mediaTypes.VIDEO,
            url:p,
            ts:new Date().getTime()
            })
            this.setState({cashcheckSelector}, function() {
                EventBus.updateBaseCashCheck();
            })
        }
    }

    hideDialog(){
        setTimeout(function(){
            this.setState({visible:false,priviewing:true})
        }.bind(this),100)
    }

    onDeleteItem(c){
        const {cashcheckSelector,} = this.state;
        var attachments = cashcheckSelector.attachments;
        var newList =[];
        attachments.forEach(attachment => {
            if(attachment!=c){
                newList.push(attachment)
            }
        })
        cashcheckSelector.attachments = newList;
        this.setState({cashcheckSelector}, function() {
            EventBus.updateBaseCashCheck();
        });
    }

    onEditItem(c){
        if(c && c.mediaType==store.enumSelector.mediaTypes.TEXT){
            if(c.isMemo) {
                this.setState({selectMemo: c.url.split('，')}, function() {
                    this.modalMemo && this.modalMemo.open();
                });
            } else {
                this.setState({editTarget:c, editText:c.url, keyboardHeight:0})
            }
        }
    }

    hideDialog(){
        setTimeout(function(){
            this.setState({visible:false,priviewing:true})
        }.bind(this),100)
    }

    onPlayItem(c){
        this.hideDialog()
    }

    renderAttachment(){
        let {enumSelector, cashcheckSelector} = this.state;
        if(cashcheckSelector.attachments.length > 0){
            return  <View style={{flex:1,paddingRight:10,paddingLeft:10,flexDirection: 'row', flexWrap: 'wrap'}}>
                        <CommentResourcesBlock blockStyle={{backgroundColor:'#EAF1F3',paddingTop:10,marginBottom:120,borderRadius:10}}
                            data={cashcheckSelector.attachments}
                            showDelete={true}
                            showEdit={true}
                            onPlayItem={(c)=>this.onPlayItem(c)}
                            onEditItem={(c)=>this.onEditItem(c)}
                            onDeleteItem={(c)=>this.onDeleteItem(c)}
                            multiLine={true}
                        />
                    </View>
        }
    }

    render() {
        let {} = this.state;

        return (
            <View style={{flex:1}}>
                {this.renderAttachment()}
                <View style={{position:'absolute',bottom:-120}}>
                    <ImageVideoPanel
                        isImageOverLimit={this.isImageOverLimit()}
                        isVideoOverLimit={this.isVideoOverLimit()}
                        imageOverLimitMsg={I18n.t("Attachment Limit", {number:20})}
                        videoOverLimitMsg={I18n.t("Attachment Limit", {number:20})}
                        imageAvailableCount={this.imageAvailableCount()}
                        onError={(e)=>this.onError(e)}
                        onStartRecord={()=>{this.hideDialog()}}
                        onFinishRecord={()=>{this.setState({visible:true,priviewing:false})}}
                        enableImageLibrary={true}
                        enableCapture={true}
                        onImage={(p,e,imgW,imgH)=>this.onImage(p,e,imgW,imgH)}
                        onVideo={(p)=>this.onVideo(p)}
                /></View>
                <AndroidBacker onPress={() => {
                    this.props.onBacker && this.props.onBacker();
                    return true;
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
