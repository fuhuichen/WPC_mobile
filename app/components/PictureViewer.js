import React, { Component } from 'react';
import {
    BackHandler,
    Image,
    Platform,
    StyleSheet,
    View,
    TouchableOpacity,
    PermissionsAndroid,
    Text,
    DeviceEventEmitter,
    Dimensions
} from 'react-native';
import { Actions } from 'react-native-router-flux';
import Orientation from 'react-native-orientation';
import PhoneInfo from "../entities/PhoneInfo";
import CameraRoll from "@react-native-community/cameraroll";
import RNFetchBlob from "rn-fetch-blob";
import BusyIndicator from "../components/BusyIndicator";
import Toast from "react-native-easy-toast";
import I18n from 'react-native-i18n';
import ImageViewer from 'react-native-image-zoom-viewer';
import {isIphoneX} from "react-native-iphone-x-helper";
import {ColorStyles} from "../common/ColorStyles";

const {width} = Dimensions.get('screen');
export default class PictureViewer extends Component {

    constructor(props) {
        super(props);
        this.state = {
            index: (this.props.index && this.props.index != -1) ? this.props.index : 0
        };
        this.uri = [];
    }

    componentDidMount() {
        DeviceEventEmitter.emit('onStatusBar', 'white');
        Orientation.unlockAllOrientations();
    }

    componentWillMount(){
        let uri = [];
        if (this.props.uri instanceof Array){
            this.props.uri.forEach((item) => {
                let add ={};
                add.url = item;
                uri.push(add);
            })
        }
        else{
            let add ={};
            add.url = this.props.uri;
            uri.push(add);
        }
        this.uri = uri;
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('pictureViewerBack', this.onBackAndroid);
        }
    }

    componentWillUnmount() {
        DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
        Orientation.lockToPortrait();
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('pictureViewerBack', this.onBackAndroid);
        }
    }

    onBackAndroid = () => {
        DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
        DeviceEventEmitter.emit('onPictureClose', false);
        Actions.pop();
        return true;
    }

    async onPictureSave(){
        try{
            let tgUrl = this.uri[this.state.index].url;
            if (Platform.OS === 'android' ) {
                const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
                let hasPermission = await PermissionsAndroid.check(permission);
                if (!hasPermission) {
                     let status = await PermissionsAndroid.request(permission);
                     if (status !== 'granted'){
                         return;
                     }
                }
                let local = tgUrl.indexOf('http') === -1 ? true: false;
                if(!local){
                    this.refs.indicator.open();
                    RNFetchBlob
                    .config({fileCache: true, appendExt: 'jpg', timeout:10000})
                    .fetch('GET', tgUrl)
                    .then((res) => {
                        let url =   'file://' + res.path();
                        CameraRoll.save(url,{type:'photo'});
                        this.refs.indicator.close();
                        this.refs.toast.show(I18n.t('Save success'), 3000);
                    })
                    .catch((err) =>{
                        this.refs.indicator.close();
                        this.refs.toast.show(I18n.t('Save error'), 3000);
                    })
                }
                else{
                    CameraRoll.save(tgUrl,{type:'photo'});
                    this.refs.toast.show(I18n.t('Save success'), 3000);
                }
             }
             else{
                CameraRoll.save(tgUrl,{type:'photo'});
                this.refs.toast.show(I18n.t('Save success'), 3000);
             }
        }
        catch(err){
            this.refs.indicator.close();
            this.refs.toast.show(I18n.t('Save error'), 3000);
        }
    }

    render() {
        let top = isIphoneX() ? 40: 18;
        let saveBtn = null;
        if ( this.props.enableSave !== false ){ saveBtn =(
            <TouchableOpacity activeOpacity={0.5} onPress={()=>this.onPictureSave()}>
                <View style={{borderRadius:10,paddingLeft:12,paddingRight:12,height:30,backgroundColor:ColorStyles.COLOR_MAIN_RED,alignItems:'center',justifyContent:'center'}}>
                    <Text style={{color:'white',fontSize:14}}>{I18n.t('Download')}</Text>
                </View>   
            </TouchableOpacity>
        )
        }

        let indicatorNum = (this.state.index+1) + '/'+ this.uri.length;
        let indicator = null;
        if (this.uri.length >1){ indicator = (
            <View style={{position:'absolute',left:width/2-14,top:top+4}}>
                <Text  style={{fontSize:16,color:'#9b9aa2',zIndex:999}}>{indicatorNum}</Text>
            </View>
        )
        }

        return (
            <View style={styles.container}>
                <View style={{paddingTop:top+45,paddingBottom:30,flex:1}}>
                <ImageViewer imageUrls={this.uri} backgroundColor={'white'} index={this.state.index}   
                         renderIndicator={() => null} saveToLocalByLongPress={false}
                         onChange={(index)=> {this.setState({index})}} />
                </View>
    
            <View style={{position:'absolute',left:12,top:top,width:width-24}}>
                 <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
                 <TouchableOpacity style={{zIndex:999}} activeOpacity={0.5} onPress={() => {
                     DeviceEventEmitter.emit('onVideoSound', false);
                     DeviceEventEmitter.emit('onStatusBar', ColorStyles.STATUS_RGB_BLUE);
                     Actions.pop();
                 }}>
                      <Image style={{width:20,height:20}}
                             source={require('../assets/images/img_detail_close2.png')} />
                </TouchableOpacity>
                 {saveBtn}
                </View>  
            </View>
            {indicator}
            <BusyIndicator ref={"indicator"} title={I18n.t('Waiting')} />
            <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
            </View>
        );
    }

}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor:'white'
    },
    image:{
        width : '100%',
        height: '100%'
    }
});
