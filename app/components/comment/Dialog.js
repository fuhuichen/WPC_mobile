/**
* MIT License
*
* Copyright (c) 2017 Douglas Nassif Roma Junior
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

import React, { Component } from 'react'
import {
    Modal,
    View,
    ViewPropTypes,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Text,
    Platform,
    ScrollView,
    Dimensions,
    NativeModules,
    StatusBar
} from 'react-native'
const { OS } = Platform;
//import ExtraDimensions from 'react-native-extra-dimensions-android';
//const MARGIN = platform.OS === 'android' ?
//import {isIphoneX,getStatusBarHeight} from "react-native-iphone-x-helper";
//const DIF  =Dimensions.get('screen').height - Dimensions.get('window').height;
//const MARGIN =  ExtraDimensions.getSoftMenuBarHeight() ;
//const  HEIGHT =  Platform.OS === 'android'?Dimensions.get('window').height: Dimensions.get('window').height;
import {HEIGHT,STATUS_BAR} from './Constant'
import PropTypes from 'prop-types';

class Dialog extends Component {
    state={
      height:this.props.height
    }
    _renderOutsideTouchable(onTouch) {
        const view = <View style={{ flex: 1, width: '100%' }} />

        if (!onTouch) return view;

        return (
            <TouchableWithoutFeedback onPress={onTouch} style={{ flex: 1, width: '100%' }}>
                {view}
            </TouchableWithoutFeedback>
        )
    }
    componentWillReceiveProps(nextProp){
    }
    render() {
        const {
            dialogStyle, visible, animationType, onRequestClose, onShow,children,
            mainStyle,onOrientationChange, onTouchOutside, overlayStyle, supportedOrientations,
            keyboardDismissMode, keyboardShouldPersistTaps, contentInsetAdjustmentBehavior,height,
        } = this.props;
        if(visible){
          if(OS === 'ios'){
            return (
                <Modal  transparent={true}>
                <ScrollView
                   style={{height:'100%'}}
                   bounces={false}
                   bouncesZoom={false}
                   keyboardShouldPersistTaps='handled'
                   showsVerticalScrllIndicator={false}
                  >
                <KeyboardAvoidingView  style={[{position:'absolute', top:0,
                zIndex:9999,left:0,flex:1,height:HEIGHT,width: '100%',marginTop:0,
                backgroundColor:this.props.backgroundColor?this.props.backgroundColor:'#00000066'}]}  >
                            <View style={{position:'absolute',top:0,
                            height:STATUS_BAR,width:'100%',backgroundColor:this.props.editText?"#006AB7":this.props.photo?"#000":'transparent'}}/>
                            <View style={[{
                                marginTop:STATUS_BAR,
                                height:HEIGHT-STATUS_BAR,
                                width: '100%',
                                borderRadius: 0,
                            }, dialogStyle]}>
                                {children}
                    </View>
                </KeyboardAvoidingView>
                </ScrollView>
                </Modal>
            )

          }
          else{
            return (
                <Modal
                transparent={true} style={{margin:0}}>
                <KeyboardAvoidingView
                 style={[{position:'absolute',paddingTop:STATUS_BAR,
                zIndex:9999,left:0,height:"100%",top:0,right:0,width: '100%',
                backgroundColor:'#00000066'}]}  >
                <View style={{position:'absolute',top:0,height:STATUS_BAR,width:'100%',backgroundColor:this.props.editText?"#006AB7":this.props.photo?"#000":'transparent'}}/>
                <StatusBar backgroundColor={this.props.editText?"#006AB7":this.props.photo?"#000":"#00406E"} />
                            <View style={[{
                                width: '100%',
                                borderRadius: 0,
                            }, dialogStyle]}>
                                {children}
                    </View>
                </KeyboardAvoidingView>
                </Modal>
            )
          }
        }
        else{
          return null;
        }
    }
}

Dialog.propTypes = {
    dialogStyle: ViewPropTypes.style,
    contentStyle: ViewPropTypes.style,
    buttonsStyle: ViewPropTypes.style,
    overlayStyle: ViewPropTypes.style,
    buttons: PropTypes.element,
    visible: PropTypes.bool,
    onRequestClose: PropTypes.func,
    onShow: PropTypes.func,
    onTouchOutside: PropTypes.func,
    title: PropTypes.string,
    titleStyle: Text.propTypes.style,
    keyboardDismissMode: PropTypes.string,
    keyboardShouldPersistTaps: PropTypes.string,
    contentInsetAdjustmentBehavior: PropTypes.string,
}

Dialog.defaultProps = {
    visible: false,
    onRequestClose: () => null,
    contentInsetAdjustmentBehavior: 'never',
};

export default Dialog;
