import React, { Component } from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    Platform,
    BackHandler,
    DeviceEventEmitter
} from 'react-native';

import { SketchCanvas } from '@terrylinla/react-native-sketch-canvas';
import * as lib from '../common/PositionLib';
import Toast, {DURATION} from 'react-native-easy-toast'
import moment from "moment";
import I18n from 'react-native-i18n';
import { Actions } from 'react-native-router-flux';
import RNFS, {DocumentDirectoryPath} from "react-native-fs";
import Orientation from "react-native-orientation";
import {ColorStyles} from "../common/ColorStyles";

const fileFolder = 'canvas';
let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
export default class SignCanvas extends Component {
    state = {
        pathSize: -1
    };

    componentWillMount() {
        this.reset = false;
        let orientation = Platform.select({
            android: () => {
                Orientation.lockToLandscapeLeft();
                this.emitter = BackHandler.addEventListener('signCanvasBack', this.onBackAndroid);
            },
            ios: () =>{
                Orientation.lockToLandscapeRight();
            }
        });
        orientation();
    }

    componentWillUnmount() {
        let component = Platform.select({
            android: () => {
               this.emitter && this.emitter.remove();
            },
            ios: () => {}
        });
        component();
    }

    onBackAndroid = () => {
        this.onCancel();
        return true;
    };

    canvasDone(){
        try {
            let path = moment().format('x')+'-sign';
            let component = Platform.select({
                android: ()=>{
                    this.canvas.save('jpg',true,fileFolder,path,true,false,true);
                },
                ios: ()=>{
                    this.canvas.save('jpg',false,RNFS.DocumentDirectoryPath+'/',path,true,false,true);
                }
            });
            component();
        }catch (e) {
        }
    }

    onCancel(){
        Orientation.lockToPortrait();
        Actions.pop();
        DeviceEventEmitter.emit("signPhoto",{uri:'',orientation:1});
    }

    sketchSaved(path){
        Orientation.lockToPortrait();
        Actions.pop();
        let destPath = 'file://' + path;
        if(Platform.OS == 'ios'){
            let date = new Date();
            let time = date.getTime();
            let path = RNFS.DocumentDirectoryPath + `/${time}.jpg`;
            RNFS.moveFile(destPath, path)
            .then((success) => {
                DeviceEventEmitter.emit("signPhoto",{uri:path,orientation:1,photo:false});
           })
           .catch((err) => {});
        }
        else{
            DeviceEventEmitter.emit("signPhoto",{uri:destPath,orientation:1,photo:false});
        }
    }

    clear(){
        this.reset = true;
        this.canvas && this.canvas.clear();
        this.setState({pathSize: -1});
    }

    render() {
        let {pathSize} = this.state;

        let backgroundColor = (pathSize >= 0) ? 'rgb(198,9,87)' : 'rgb(220,223,229)';
        let color = (pathSize >= 0) ? 'rgb(255,255,255)' : 'rgb(133,137,142)';
        let activeOpacity = (pathSize >= 0) ? 0.5 : 1;

        return (
            <View style={styles.container}>
                <View style={styles.topPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={() => this.onCancel()}>
                        <View style={styles.arrowPanel}>
                            <Image style={styles.arrow} source={require('../assets/img_header_back.png')}/>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.header}>{I18n.t('Sign writing')}</Text>
                    <TouchableOpacity activeOpacity={activeOpacity} onPress={() => {(pathSize >= 0) ? this.canvasDone() : {}}}>
                        <View style={[styles.confirmPanel,{backgroundColor}]}>
                            <Text style={[styles.confirm,{color}]}>{I18n.t('Confirm')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <SketchCanvas style={[styles.vertical,{height:width-lib.defaultStatusHeight()-lib.defaultBottomSpace()-44}]}
                    ref={ref => this.canvas = ref}
                    onSketchSaved={(success,path) => this.sketchSaved(path)}
                    onPathsChange={() => {
                        !this.reset ? this.setState({pathSize: this.canvas.getPaths().length})
                            : (this.reset = false);
                    }}
                    strokeColor={"#19293b"}
                    strokeWidth={3}
                    touchEnabled={true}/>

                <View style={styles.clearPanel}>
                    <TouchableOpacity activeOpacity={1} onPress={() => this.clear()}>
                        <Image source={require('../assets/images/img_canvas_clear.png')} style={styles.canvasClear}/>
                    </TouchableOpacity>
                </View>
                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    vertical:{
        width: '100%',
        height: 220,
        backgroundColor: 'rgb(247,249,250)',
    },
    topPanel:{
        flexDirection:'row',
        justifyContent:'space-between',
        height:44,
        backgroundColor:'rgb(0,106,183)',
        paddingLeft: 16,
        paddingRight: 16
    },
    bottomPanel:{
        flexDirection:'row',
        height:60,
        backgroundColor:'rgb(72,72,72)',
        alignItems:'center',
        justifyContent:'center'
    },
    header:{
        fontSize: 18,
        color:'rgb(251,251,251)',
        height: 44,
        lineHeight: 44,
        textAlignVertical: 'center'
    },
    confirmPanel:{
        width: 60,
        height: 28,
        borderRadius:10,
        marginTop:8
    },
    confirm:{
        height:28,
        textAlign:'center',
        textAlignVertical: 'center',
        lineHeight:28
    },
    clearPanel:{
        position:'absolute',
        top:(width-lib.defaultStatusHeight()-lib.defaultBottomSpace()-44)/2+15,
        right:30,
        width:30,
        height:30,
        borderRadius: 15
    },
    canvasClear:{
        width:30,
        height:30
    },
    arrowPanel:{
        width:60,
        height:44,
        paddingLeft: 8,
        justifyContent:'center'
    },
    arrow:{
        width:36,
        height:36
    }
});
