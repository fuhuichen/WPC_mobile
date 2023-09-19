import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image,TouchableWithoutFeedback,
  TextInput,InputAccessoryView,Button,KeyboardAvoidingView,ScrollView,ImageBackground,
   DeviceEventEmitter, TouchableOpacity,FlatList} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import PropTypes from 'prop-types';
import Toast, {DURATION} from 'react-native-easy-toast'
import {HEIGHT,WIDTH,STATUS_BAR} from './Constant'
import * as lib from '../../common/PositionLib';
import moment from 'moment'
import Dialog from './Dialog'
import PhotoEditor from './PhotoEditor'


export default class DialogPhotoEditor extends Component {
    state = {
        height:0,
    };

    componentWillReceiveProps(nextProp){

    }
    render() {
      const {height}  = this.state;
      //console.log("SHow dialog"+height)

      console.log("height : ", height)

      return <Dialog visible={this.props.visible}
          backgroundColor={'#000'}
          photo={true}
          dialogStyle={null}>
          <View style={{width:'100%',height:'100%'}}
            onLayout={(event) => {
              var {x, y, width, height} = event.nativeEvent.layout;

              if(height> HEIGHT-100){
                //console.log("<DialogPhotoEditor>Onlayout",x,y,height)
                this.setState({width,height:height})
              }

            }}>
          {height>0?<PhotoEditor
            SourceImage={this.props.SourceImage}
            imgWidth={this.props.imgWidth}
            imgHeight={this.props.imgHeight}
            height={height}
            onConfrim = {(p)=>{this.props.onConfrim(p)}}
            onCancel = {()=>{this.props.onCancel()}}
          />:null}
          </View>
      </Dialog>
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
});
