import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image,TouchableWithoutFeedback,
  TextInput,InputAccessoryView,Button,KeyboardAvoidingView,ScrollView,ImageBackground,
   DeviceEventEmitter, TouchableOpacity,FlatList} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import PropTypes from 'prop-types';
import Toast, {DURATION} from 'react-native-easy-toast'
import { Dialog } from 'react-native-simple-dialogs';
const WIDTH = Dimensions.get('screen').width;
const HEIGHT = Dimensions.get('window').height;
import * as lib from '../../common/PositionLib';
import moment from 'moment'
import CommentAudioItem from './CommentAudioItem'
import CommentTextItem from './CommentTextItem'
import CommentImageItem from './CommentImageItem'
import CommentVideoItem from './CommentVideoItem'
import CommentPDFItem from './CommentPDFItem'
import store from "../../../mobx/Store";

export default class CommentItem extends Component {
    static propTypes = {
        textStyle: PropTypes.style,
        audioStyle: PropTypes.style,
        imageStyle: PropTypes.style,
        videoStyle: PropTypes.style,
        showDate: PropTypes.boolean,
        showChannel: PropTypes.boolean,
        enableChannel: PropTypes.boolean,
        isLast: PropTypes.boolean
    };

    static defaultProps = {
        textStyle: {},
        audioStyle: {},
        imageStyle: {},
        videoStyle: {},
        showDate: false,
        showChannel: false,
        enableChannel: false,
        isLast:false
    };

    state = {

    };

    componentWillReceiveProps(nextProp){

    }
    render() {
        const {data,isLast} =this.props;

        if(data){
          var mediaType = data.mediaType;
          if(mediaType== store.enumSelector.mediaTypes.TEXT){
            return  <CommentTextItem {...this.props} style={[this.props.textStyle,isLast ? styles.lastItem : {}]}/>
          }
          else if(mediaType== store.enumSelector.mediaTypes.AUDIO){
            return  <CommentAudioItem {...this.props} style={[this.props.audioStyle,isLast ? styles.lastItem : {}]}/>
          }
          else if(mediaType== store.enumSelector.mediaTypes.IMAGE){
            return <CommentImageItem {...this.props} style={[this.props.imageStyle,isLast ? styles.lastItem : {}]}/>
          }
          else if(mediaType== store.enumSelector.mediaTypes.VIDEO){
            return <CommentVideoItem {...this.props} style={[this.props.videoStyle,isLast ? styles.lastItem : {}]}/>
          }
          else if(mediaType== store.enumSelector.mediaTypes.PDF){
            return <CommentPDFItem {...this.props} style={[this.props.imageStyle,isLast ? styles.lastItem : {}]}/>
          }

        }
    }
}

const styles = StyleSheet.create({
  container: {
    width:'100%',
    height:35,
    borderRadius:5,
    flexDirection:'column',
    justifyContent:'center',
    alignItems:'flex-start',marginTop:10,
    backgroundColor:'#F9F9F9'},
    topZone:{
        flexDirection:"row",
        justifyContent:'flex-start',
        alignItems:'center',
        height:15,
        width:"100%",
    },
    bottomZone:{
      flexDirection:"row",
      justifyContent:'flex-start',
      alignItems:'center',
      height:15,
      paddingLeft:5,
      width:"100%",
    },
    lastItem:{
      marginRight:20
    }
});
