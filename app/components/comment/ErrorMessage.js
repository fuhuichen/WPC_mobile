import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image,TouchableWithoutFeedback,
  TextInput,InputAccessoryView,Button,KeyboardAvoidingView,ScrollView,ImageBackground,
   DeviceEventEmitter, TouchableOpacity,FlatList} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import Toast, {DURATION} from 'react-native-easy-toast'
import { Dialog } from 'react-native-simple-dialogs';
const WIDTH = Dimensions.get('screen').width;
const HEIGHT = Dimensions.get('window').height;
import * as lib from '../../common/PositionLib';
import NavigationBar from 'react-native-navbar-color'
import PropTypes from 'prop-types';
const inputAccessoryViewID = 'uniqueID';
import { Keyboard, KeyboardEvent } from 'react-native';
import addInmage from '../../assets/images/comment/btn_add.png';
import microphoneImage from '../../assets/images/comment/btn_microphone.png';
import cancelImage from '../../assets/images/comment/btn_cancel.png';

import imgMicrophoneGreen  from '../../assets/images/comment/btn_microphone_green.png';
import imgTakePicture from '../../assets/images/comment/icon_take_picture.png';
import imgTakeVideo from '../../assets/images/comment/icon_take_video.png';
import imgSelectPicture from '../../assets/images/comment/icon_select_picture.png';
import imgSelectVideo from '../../assets/images/comment/icon_select_video.png';

import imgViceSmall from '../../assets/images/comment/icon_voice_small.png';
import imgPlaySmall from '../../assets/images/comment/icon_edit_small.png';
import imgCloseSmall from '../../assets/images/comment/icon_close_small.png';
import imgAlert from '../../assets/images/comment/alert.png';
import TouchableOpacityEx from "../../touchables/TouchableOpacityEx";
import moment from 'moment'
export default class CommentTextItem extends Component {
    static propTypes = {
        style: PropTypes.style
    };

    static defaultProps = {
        style: {}
    };

    show(text) {
      if(!this.state.show){
        this.setState({text,show:true});
        setTimeout(function(){
            this.setState({show:false})
        }.bind(this),3000)
      }
    }

    state = {
        show:false,text:''
    };
    constructor(props) {
        super(props);
        this.show = this.show.bind(this);
    }
    render() {
        const {data,showDelete,showEdit, style} =this.props;
        const {text} =this.state;
        if(this.state.show){
          if(this.props.mode == 'saving'){
            return (
              <View style={{backgroundColor:'#FFF2EF',position:'absolute',
                   top:0,width:WIDTH,height:40,left:0,justifyContent:'center',flexDirection:'row',
                  alignItems:'center'}}>
                  <Image source={imgAlert} resizeMode={'stretch'}  style={[{width:20,height:20,marginRight:2}]}/>
                  <Text style={{color:'#F57848'}}>{text}</Text>
              </View>
            )
          }
          return (
            <View style={{backgroundColor:'#FFECA4',position:'absolute',
                 top:0,width:WIDTH,height:40,left:0,justifyContent:'center',
                alignItems:'center'}}>
                <Text style={{color:'#484848'}}>{text}</Text>
            </View>
          )
        }
        else{
          return null
        }
    }
}

const styles = StyleSheet.create({
  container: {
    width:'100%',
    borderRadius:5,
    flexDirection:'column',
    justifyContent:'center',
    alignItems:'flex-start',marginTop:10,
    padding:5,
    backgroundColor:'#F9F9F9'},
    topZone:{
        flexDirection:"row",
        justifyContent:'flex-start',
        alignItems:'flex-start',
        width:"100%",
        paddingLeft:5,
    },
   bottomZone:{
     flexDirection:"row",
     justifyContent:'flex-start',
     alignItems:'center',
     height:15,
     paddingLeft:5,
     width:"100%",
   },
});
