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

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
import RNStatusBar from '../components/RNStatusBar';
import { SketchCanvas } from '@terrylinla/react-native-sketch-canvas';
import * as lib from '../common/PositionLib';
import Toast, {DURATION} from 'react-native-easy-toast'
import moment from "moment";
import I18n from 'react-native-i18n';

const fileFolder = 'canvas';
export default class ImageCanvas extends Component {
    constructor(props){
        super(props);

        this.state = {
            strokeColor: '#ff190c',
            imageWidth: 0,
            imageHeight: 0,
            fileName:'',
            colorIndex: 0
        }

        this.orientation = (this.props.orientation != null) ? this.props.orientation : false;
    }

    componentDidMount(){
        try {
            let uri = this.props.uri;
            let startIndex = uri.includes(fileFolder) ? uri.indexOf('-') : uri.lastIndexOf('/');
            let fileName = uri.substring(startIndex+1,uri.length-4);
            this.setState({fileName});
        }catch (e) {
        }
    }

    componentWillMount() {
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('imageCanvasBack', this.onBackAndroid);
        }
    }

    componentWillUnmount() {
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('imageCanvasBack', this.onBackAndroid);
        }
    }

    onBackAndroid = () => {
        this.onCancel();
        return true;
    }

    canvasDone(){
        try {
            let timeout = lib.isAndroid() ? 0 : 100;
            setTimeout(()=>{this.saveCanvas()},timeout);
        }catch (e) {
        }
    }

    saveCanvas(){
        let path = moment().format('x')+'-'+this.state.fileName;
        this.canvas.save('jpg', true, fileFolder, path, true, false, true);
    }

    onCancel(){
        DeviceEventEmitter.emit(this.props.type, null);
    }

    sketchSaved(path){
        DeviceEventEmitter.emit(this.props.type, 'file://'+path);
    }

    clear(){
        this.canvas.clear();
    }

    undo(){
        this.canvas.undo();
    }

    render() {
        return (
            <View style={styles.container}>
                <RNStatusBar color={'#000000'}/>

                <View style={styles.topPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={()=>this.onCancel()}>
                        <Text style={styles.button}>{I18n.t('Cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.5} onPress={()=>this.canvasDone()}>
                        <Text style={styles.button}>{I18n.t('Confirm')}</Text>
                    </TouchableOpacity>
                </View>

                <SketchCanvas style={this.orientation ? styles.vertical : styles.horizontal}
                    ref={ref => this.canvas = ref}
                    localSourceImage={{ filename: this.props.uri.replace('file:///',''),
                    directory: '',
                    mode: 'ScaleToFill' }}
                    onSketchSaved={(success,path)=>this.sketchSaved(path)}
                    strokeColor={this.state.strokeColor}
                    strokeWidth={3}
                    touchEnabled={true}/>

                <View style={styles.bottomPanel}>
                    <View style={styles.colorPanel}>
                        <View style={[styles.colorCommon,{marginLeft:26}]}>
                            <TouchableOpacity style={{width:36,height:36,justifyContent:'center',alignItems:'center'}} activeOpacity={0.5} onPress={()=>this.setState({colorIndex:0,strokeColor:'#ff190c'})}>
                                {
                                    this.state.colorIndex === 0 ? <Image source={require('../assets/images/img_red_selected.png')} style={styles.colorSelected}/>
                                        : <Image source={require('../assets/images/img_red_normal.png')} style={styles.colorNormal}/>
                                }
                            </TouchableOpacity>
                        </View>
                            <View style={[styles.colorCommon,{marginLeft:32}]}>
                            <TouchableOpacity style={{width:36,height:36,justifyContent:'center',alignItems:'center'}} activeOpacity={0.5} onPress={()=>this.setState({colorIndex:1,strokeColor:'#ffff00'})}>
                                {
                                    this.state.colorIndex === 1 ? <Image source={require('../assets/images/img_yellow_normal.png')} style={styles.colorSelected}/>
                                        : <Image source={require('../assets/images/img_yellow_normal.png')} style={styles.colorNormal}/>
                                }
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.colorCommon,{marginLeft:32}]}>
                            <TouchableOpacity style={{width:36,height:36,justifyContent:'center',alignItems:'center'}} activeOpacity={0.5} onPress={()=>this.setState({colorIndex:2,strokeColor:'#f9f9f9'})}>
                                {
                                    this.state.colorIndex === 2 ? <Image source={require('../assets/images/img_white_selected.png')} style={styles.colorSelected}/>
                                        : <Image source={require('../assets/images/img_white_normal.png')} style={styles.colorNormal}/>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.resetPanel}>
                        <TouchableOpacity activeOpacity={0.5} onPress={()=>this.clear()}>
                            <Image source={require('../assets/images/img_canvas_clear.png')} style={styles.canvasClear}/>
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.5} onPress={()=>this.undo()}>
                            <Image source={require('../assets/images/img_canvas_undo.png')} style={styles.canvasUndo}/>
                        </TouchableOpacity>
                    </View>
                </View>

                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000'
    },
    horizontal:{
        height:280,
        width:width,
        elevation: 2,
        marginTop: (height-lib.defaultStatusHeight()-lib.defaultBottomSpace()-44-60)/2-280/2,
        marginBottom: (height-lib.defaultStatusHeight()-lib.defaultBottomSpace()-44-60)/2-280/2,
        backgroundColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.75,
        shadowRadius: 2
    },
    vertical:{
        height:height-lib.defaultStatusHeight()-lib.defaultBottomSpace()-44-60,
        width:width,
        elevation: 2,
        marginTop: 0,
        marginBottom: 0,
        backgroundColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.75,
        shadowRadius: 2
    },
    topPanel:{
        flexDirection:'row',
        justifyContent:'space-between',
        height:44,
        backgroundColor:'#000000',
        paddingLeft: 16,
        paddingRight: 16
    },
    bottomPanel:{
        flexDirection:'row',
        height:60,
        backgroundColor:'#000000',
    },
    button:{
        color:'#ffffff',
        height:44,
        textAlignVertical: 'center',
        ...Platform.select({
            ios:{
                lineHeight:44
            }
        })
    },
    colorPanel:{
        flexDirection:'row',
        justifyContent:'flex-start',
        alignItems:'center',
        width:width/2+50
    },
    resetPanel:{
        flexDirection:'row',
        justifyContent:'flex-end',
        alignItems:'center',
        width:width/2-50
    },
    canvasClear:{
        width:36,
        height:36,
        marginRight: 30
    },
    canvasUndo:{
        width:36,
        height:36,
        marginRight:22
    },
    colorCommon:{
        width:30,
        height:60,
        justifyContent:'center',
        alignItems:'center'
    },
    colorSelected:{
        width:22,
        height:22
    },
    colorNormal:{
        width:16,
        height:16
    }
});
