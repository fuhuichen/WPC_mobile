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
import ExtraDimensions from 'react-native-extra-dimensions-android';
//const MARGIN = platform.OS === 'android' ?
import {isIphoneX,getStatusBarHeight} from "react-native-iphone-x-helper";
const DIF  =Dimensions.get('screen').height - Dimensions.get('window').height;
exports.STATUS_BAR =  Platform.OS === 'android'?(DIF ==ExtraDimensions.getStatusBarHeight() || DIF==(ExtraDimensions.getStatusBarHeight()+ ExtraDimensions.getSoftMenuBarHeight()))?ExtraDimensions.getStatusBarHeight():25: isIphoneX ? 44 : 20;
exports.MARGIN =  ExtraDimensions.getSoftMenuBarHeight() ;
exports.HEIGHT =  Platform.OS === 'android'?Dimensions.get('window').height: Dimensions.get('window').height;
exports.WIDTH = Dimensions.get('screen').width;
