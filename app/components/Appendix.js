import React, { Component } from 'react';
import {
    StyleSheet,
    View,
    Dimensions,
    Image,
    Text,
    TouchableOpacity,
    FlatList,
    Platform,
    BackHandler,
    Modal,
    DeviceEventEmitter
} from 'react-native';
import ModalCenter from './ModalCenter';
import I18n from 'react-native-i18n';
import PropTypes from "prop-types";
import { Actions } from 'react-native-router-flux';
import {DURATION} from "react-native-easy-toast";
import {PERMISSIONS, request, RESULTS} from "react-native-permissions";
import {launchCamera, launchImageLibrary} from "react-native-image-picker";
import AlertUtil from "../utils/AlertUtil";
import * as lib from "../common/PositionLib";
import EventBus from "../common/EventBus";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import TouchableActive from "../touchables/TouchableActive";
import BottomSheet from "../element/BottomSheet";
import RNFS, {DocumentDirectoryPath} from "react-native-fs";
import store from "../../mobx/Store";
import * as BorderShadow from "../element/BorderShadow";
import moment from "moment";

const {height} = Dimensions.get('window');const {width} = Dimensions.get('screen');
export default class Appendix extends Component {
    state = {
        delIndex:-1,
        active: false,
        enumSelector: store.enumSelector
    };

    static propTypes =  {
        isRequire: PropTypes.boolean,
        content: PropTypes.string,
        maxCount: PropTypes.number,
        showOperator: PropTypes.boolean,
        editable: PropTypes.boolean,
        onData: PropTypes.function,
        onDelete: PropTypes.function
    };

    static defaultProps = {
        isRequire: false,
        content: '',
        maxCount: 10,
        showOperator: true,
        editable: true
    };

    constructor(props){
        super(props);

        this.actions = [
            {
                name: I18n.t('Comment Pick photo'),
                router: () => {
                    setTimeout(() => this.onPicture(),800);
                }
            },
            {
                name: I18n.t('Sign photo'),
                router: async ()  => {await this.onCamera()}
            }
        ];
    }

    pickerPicture(){
        const options = {
            mediaType:'photo',
            quality:0.8,
            maxWidth:1080,
            maxHeight:1080,
            cameraType:'back',
            includeBase64:false,
            saveToPhotos:false,
            includeExtra:true,
            selectionLimit:1
        };
        launchImageLibrary(options,(response) => {
            if (response.didCancel || response.errorCode) {}
            else {
                let asset = response.assets[0];
                if(Platform.OS == 'android'){
                    this.props.onAttach && this.props.onAttach({
                        content: asset.uri,
                        orientation: asset.height > asset.width,
                        isPhoto: true
                    });
                } else {
                    let path = RNFS.DocumentDirectoryPath + '/'+ asset.fileName;
                    RNFS.moveFile(asset.uri, path)
                    .then((success) => {
                        this.props.onAttach && this.props.onAttach({
                            content: path,
                            orientation: asset.height > asset.width,
                            isPhoto: true
                        });
                    })
                    .catch((err) => {});
                }
            }
        });
    }

    onPicture(){
        let {enumSelector} = this.state;
        let {data, maxCount} = this.props;

        let limit = (Platform.OS === 'ios') ? (maxCount - data.length) : 0;
        const options = {
            mediaType:'photo',
            quality:0.8,
            maxWidth:1080,
            maxHeight:1080,
            cameraType:'back',
            includeBase64:false,
            saveToPhotos:false,
            includeExtra:true,
            selectionLimit: limit
        };

        launchImageLibrary(options,(response) => {

            if (response.didCancel || response.errorCode) {}
            else {
                let pictures = [], mediaType = enumSelector.mediaTypes.IMAGE;
                response.assets.forEach((item,index) =>{
                    if(Platform.OS === 'android'){
                        pictures.push({
                            mediaType, 
                            url: item.uri, 
                            ts: moment().unix()*1000,
                            width: item.width,
                            height: item.height
                        });
                    }
                    else{
                        let path = RNFS.DocumentDirectoryPath + '/'+ item.fileName;
                        RNFS.moveFile(item.uri, path);
                        pictures.push({
                            mediaType, 
                            url: path, 
                            ts: moment().unix()*1000,
                            width: item.width,
                            height: item.height
                        });
                    }
                });

                if (pictures.length > (maxCount-data.length)){
                    DeviceEventEmitter.emit('Toast', I18n.t('Attachment limit'))
                }else {
                    this.props.onData && this.props.onData(pictures);
                }
            }
        });
    }

    async onCamera() {
        let {enumSelector} = this.state, mediaType = enumSelector.mediaTypes.IMAGE;

        let cameraPermission = await request(Platform.select({
                android: PERMISSIONS.ANDROID.CAMERA,
                ios: PERMISSIONS.IOS.CAMERA,
            })
        );

        if (RESULTS.GRANTED !== cameraPermission) {
            AlertUtil.alert(I18n.t('Camera'));
            return false;
        }

        let microPhonePermission = await request(Platform.select({
                android: PERMISSIONS.ANDROID.RECORD_AUDIO,
                ios: PERMISSIONS.IOS.MICROPHONE,
            })
        );

        if (RESULTS.GRANTED !== microPhonePermission) {
            AlertUtil.alert(I18n.t('Microphone'));
            return false;
        }

        const options = {
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 1080,
            maxHeight: 1080,
            cameraType:'back',
            includeBase64:false,
            saveToPhotos:false,
            selectionLimit:1,
            includeExtra:true,
        };

        launchCamera(options, (response) => {
            if (response.didCancel || response.errorCode) {
            } else {
                let asset = response.assets[0];
                if(Platform.OS == 'android'){
                    this.props.onData && this.props.onData([{
                        mediaType,
                        url: asset.uri,
                        ts: moment().unix()*1000,
                        width: asset.width,
                        height: asset.height
                    }]);
                } else{
                    let path = RNFS.DocumentDirectoryPath + '/'+ asset.fileName;
                    RNFS.moveFile(asset.uri, path)
                    .then((success) => {
                        this.props.onData && this.props.onData([{
                            mediaType,
                            url: path,
                            ts: moment().unix()*1000,
                            width: asset.width,
                            height: asset.height
                        }]);
                    })
                .catch((err) => {});
                }
            }
        });
    }

    onDelete(index) {
        this.setState({delIndex:index});
        this.refs.confirmDel.open();
    }

    confirmDelete() {
        let {delIndex} = this.state;
        this.props.onDelete && this.props.onDelete(delIndex);
    }

    imageView(item) {
        EventBus.closePopupPatrol();

        let {data} = this.props;
        let index = data.findIndex(p => p.url === item.url);
        Actions.push('pictureViewer',{uri: data.map(p => p.url), index:index,enableSave:false});
    }

    onPress(){
        this.setState({active:true});
        this.bottomSheet && this.bottomSheet.open();
    }

    renderAppendix(){
        let {data, editable} = this.props;

        return (
            data.map((item, index) => {
                let signText = '', resizeMode = 'contain', borderRadius = 10;
                return <View style={[styles.imagePanel,BorderShadow.div, {marginLeft:(index%2 === 0) ? 0 : 13}]}>
                        {
                            editable ? <View style={styles.titlePanel}>
                                <Text style={styles.signText}>{signText}</Text>
                                <TouchableOpacity activeOpacity={0.5} onPress={()=>this.onDelete(index)} style={styles.delImage}>
                                    <Image style={{width:16,height:16}} source={require('../assets/images/Group_185.png')}/>
                                </TouchableOpacity>
                            </View> : null
                        }
                        <TouchableOpacity activeOpacity={0.5} onPress={()=>{this.imageView(item)}} style={{alignItems:'center'}}>
                            <Image source={{uri:item.url}} style={[styles.image,{borderRadius}]} resizeMode={resizeMode}/>
                        </TouchableOpacity>
                    </View>
            })
        )
    }

    renderOperator(){
        let {showOperator, data, maxCount} = this.props;

        return (
            (showOperator && (data.length < maxCount)) ? <TouchableOpacity activeOpacity={0.6} onPress={() => {this.onPress()}}>
                    <View style={[styles.signPanel, BorderShadow.div,{marginLeft:(data.length%2 === 0) ? 0 : 13}]}>
                        <Image source={require('../assets/img_add_signature.png')} style={styles.addIcon}/>
                        <Text style={styles.addLabel}>{I18n.t('Attachment')}</Text>
                    </View>
                </TouchableOpacity> : null
        )
    }

    renderHeader(){
        let {isRequire, content} = this.props;

        return (
            <View style={styles.headerPanel}>
                {
                    isRequire ? <Text style={styles.starLabel}>*</Text> : null
                }
                <Text style={[styles.label,{marginLeft: isRequire ? 3 : 10}]}>{content}</Text>
            </View>
        )
    }

    render() {
        return (
            <View style={{marginTop:30}}>
                {this.renderHeader()}
                <View style={styles.container}>
                    {this.renderAppendix()}
                    {this.renderOperator()}
                </View>
                <BottomSheet ref={c => this.bottomSheet = c} data={this.actions.map((p) => p.name)}
                             onSelect={(index) => {
                                 this.actions[index].router();
                                 this.setState({active:false});
                             }}
                             onCancel={() => {this.setState({active: false})}}/>
                <ModalCenter ref={"confirmDel"}
                             title={I18n.t('Delete attachment title')}
                             description={I18n.t('Delete attachment confirm')}
                             confirm={() => this.confirmDelete()}/>
            </View>
        );
    }

}
const styles = StyleSheet.create({
    container: {
        flexDirection:'row',
        flexWrap:'wrap',
        width:width-40,
        marginTop: 6,
        marginLeft:10
    },
    signPanel:{
        flexDirection:'row',
        justifyContent:'center',
        width:(width-53)/2,
        height:104,
        backgroundColor:'#ffffff',
        borderRadius: 10,
        alignItems:'center',
        marginTop:10,
        paddingTop:1
    },
    addIcon:{
        width:13,
        height:13
    },
    addLabel:{
        fontSize:12,
        color:'#006AB7',
        marginLeft:2
    },
    imagePanel:{
        width:(width-53)/2,
        height:104,
        backgroundColor:'#ffffff',
        borderRadius: 10,
        marginTop:10,
        paddingTop: 1
    },
    image:{
        width:'100%',
        height:100,
        zIndex:10,
    },
    signText:{
        flex:1,
        fontSize:12,
        color:'#A7A6A6'
    },
    delImage:{
        width:32,
        height:32,
        alignItems:'flex-end',
        marginRight:3,
        marginTop:3
    },
    titlePanel:{
        position: 'absolute',
        top:6,
        right:6,
        flexDirection: 'row',
        zIndex:99
    },
    panel:{
       position: 'relative',
    },
    signContent:{
        marginLeft:6,
        color:'#1E272E'
    },
    headerPanel:{
        flexDirection:'row',
        justifyContent:'flex-start',
        marginTop:0
    },
    starLabel:{
        color:'#ff2400',
        marginLeft:10
    },
    label:{
        fontSize:16,
        color:'#64686D'
    }
});
