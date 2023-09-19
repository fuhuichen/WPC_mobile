import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image,TouchableWithoutFeedback,
  TextInput,InputAccessoryView,Button,KeyboardAvoidingView,ScrollView,ImageBackground,
   DeviceEventEmitter, TouchableOpacity,FlatList,NativeModules} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import Toast, {DURATION} from 'react-native-easy-toast'
import { Dialog } from 'react-native-simple-dialogs';
const WIDTH = Dimensions.get('screen').width;
//const HEIGHT = Dimensions.get('window').height;
const HEIGHT =  Dimensions.get('window').height/Dimensions.get('screen').width > 1.8 ? Dimensions.get('window').height+ NativeModules.StatusBarManager.HEIGHT :  Dimensions.get('window').height;
import * as lib from '../../common/PositionLib';
import NavigationBar from 'react-native-navbar-color'
import PropTypes from 'prop-types';
const inputAccessoryViewID = 'uniqueID';
import { Keyboard, KeyboardEvent } from 'react-native';
import {Card} from 'react-native-shadow-cards';
import addInmage from '../../assets/images/comment/btn_add.png';
import microphoneImage from '../../assets/images/comment/btn_microphone.png';
import cancelImage from '../../assets/images/comment/btn_cancel.png';

import imgViceSmall from '../../assets/images/comment/icon_voice_small.png';
import imgPlaySmall from '../../assets/images/comment/icon_text_edit.png';
import imgCloseSmall from '../../assets/images/comment/icon_text_delete.png';

import moment from 'moment'
export default class CommentTextItem extends Component {
    static propTypes = {
        style: PropTypes.style
    };

    static defaultProps = {
        style: {}
    };

    function() {

    }

    state = {

    };
    constructor(props) {
        super(props);

    }
    render() {
        const {data,showDelete,showEdit, style} =this.props;

        return (
          <View style={[styles.container,style]}>
              <View style={styles.topZone}>
                  {
                      showDelete ? <TouchableOpacity activeOpacity={1}
                                  onPress={()=>{this.props.onDelete(data)}}>
                            <Image     style={{height:16,width:16,marginTop:12,marginRight:8}} resizeMode={"stretch"} source={imgCloseSmall}/>
                      </TouchableOpacity> : null
                  }

                  <Card elevation={1} opacity={0.1} style={{flex:1,padding:4,minHeight:40,
                    alignItems:'center',borderRadius:8,flexDirection:'row',flex:1}}>
                      <Text style={{fontSize:13,lineHeight: 22,color:'#6E6E6E',flex:1,marginRight:5,padding:5,paddingRight:showEdit?29:5}}>{data.url}</Text>
                      {
                          showEdit ? <TouchableOpacity activeOpacity={1}
                                                    style={{width:38,position:'absolute',right:0,top:5,bottom:5,justifyContent:'center',alignItems:'center',
                                                  borderLeftWidth:2,borderLeftColor:'#F2F2F2'}}
                                                            onPress={()=>{this.props.onEdit(data)}}>
                                                  <Image  style={{height:16,width:16,marginLeft:4,marginRight:4}} resizeMode={"stretch"} source={imgPlaySmall}/>
                          </TouchableOpacity> : null
                      }
                  </Card>
              </View>
          </View>

        )
    }
}

const styles = StyleSheet.create({
  container: {
    width:'100%',
    borderRadius:5,
    flexDirection:'column',
    justifyContent:'center',
    alignItems:'flex-start',marginTop:3,
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
