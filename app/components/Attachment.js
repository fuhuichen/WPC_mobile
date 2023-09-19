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
import {launchImageLibrary, launchCamera} from "react-native-image-picker";
import AlertUtil from "../utils/AlertUtil";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";
import * as lib from "../common/PositionLib";
import EventBus from "../common/EventBus";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import TouchableActive from "../touchables/TouchableActive";
import BottomSheet from "../element/BottomSheet";
import RNFS, {DocumentDirectoryPath} from "react-native-fs";
import DocumentPicker from 'react-native-document-picker';
import store from "../../mobx/Store";

const {height} = Dimensions.get('window');const {width} = Dimensions.get('screen');
const paddingHorizontal = lib.paddingHorizontal();

const IMAGE_PDF_LIMIT = 10;

const PDF_SIZE_LIMIT = 4*1024*1024; // 4MB

export default class Attachment extends Component {
    state = {
        enumSelector: store.enumSelector,
        delIndex:-1,
        active: false
    };

    static propTypes =  {
        showOperator: PropTypes.boolean,
        editable: PropTypes.boolean,
        onSign: PropTypes.function,
        onDelete: PropTypes.function,
        onAdd: PropTypes.function
    };

    static defaultProps = {
        showOperator: true,
        editable: true
    };

    constructor(props){
        super(props);

        this.actions = [
            {
                name: I18n.t('Comment Pick photo'),
                router: () => {
                    setTimeout(() => {
                    this.pickerPicture()
                }, Platform.select({android:0, ios: 200}))}
            },
            {
                name: I18n.t('Pick PDF'),
                router: async ()  => {await this.pickerPDF()}
            }
        ];
    }

    componentDidMount() {
        this.emitter = DeviceEventEmitter.addListener('isPhoto',(sign) => {
            (sign.uri !== '') && this.props.onSign && this.props.onSign({
                content: sign.uri,
                orientation: sign.orientation,
                isPhoto: sign.photo,
            });
        });
    }

    componentWillUnmount() {
        this.emitter && this.emitter.remove();
    }

    onSign(type){
        EventBus.closePopupPatrol();
        let {data} = this.props;

        if(data.length >= 4){
            DeviceEventEmitter.emit('Toast', I18n.t('MaxSign tips'));
        }else {
            (type > 0) ? this.isPhoto() : this.signCanvas();
        }
    }

    signCanvas(){
        Actions.push('signCanvas');
    }

    async isPhoto() {
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
                this.props.onSign && this.props.onSign({
                    content: asset.uri,
                    orientation: asset.height > asset.width,
                    isPhoto: true
                });
               }
               else{
                let path = RNFS.DocumentDirectoryPath + '/'+ asset.fileName;
                RNFS.moveFile(asset.uri, path)
                .then((success) => {
                 this.props.onSign && this.props.onSign({
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

    removeAttachment(index) {
        this.setState({delIndex:index});
        this.refs.confirmDel.open();
    }

    confirmDelete() {
        let {delIndex} = this.state;
        this.props.onDelete && this.props.onDelete(delIndex);
    }

    imageView(item) {
        let picList = [];
        this.props.data.forEach(p => {
            picList.push(p.content);
        });

        EventBus.closePopupPatrol();
        let index = picList.findIndex(p => p == item.content);
        Actions.push('pictureViewer',{uri: picList, index:index,enableSave:false});
    }

    onSignature(){
        this.setState({active:true});
        this.bottomSheet && this.bottomSheet.open();
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
                if(asset.fileSize == 0) {
                    DeviceEventEmitter.emit('Toast', I18n.t('File Error'));
                } else {
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
            }
        });
    }

    async pickerPDF() {
        try {
            const res = await DocumentPicker.pick({
              type: [DocumentPicker.types.pdf]
            });
            if(res.size > PDF_SIZE_LIMIT) {
                DeviceEventEmitter.emit('Toast', I18n.t('OverSize_4MB'));
                return;
            } else if (res.size == 0) {
                DeviceEventEmitter.emit('Toast', I18n.t('File Error'));
                return;
            }
            if(Platform.OS == 'android'){
                this.props.onAttach && this.props.onAttach({
                    content: res.uri,
                    orientation: false,
                    isPhoto: false,
                    fileName: res.name
                });
            } else {

                let path = RNFS.DocumentDirectoryPath + '/'+ res.name;
                RNFS.moveFile(decodeURIComponent(res.uri), path)
                .then((success) => {
                    this.props.onAttach && this.props.onAttach({
                        content: path,
                        orientation: false,
                        isPhoto: false,
                        fileName: res.name
                    });
                })
                .catch((err) => {
                    console.log(err)
                });
            }
          } catch (err) {
            //Handling any exception (If any)
            if (DocumentPicker.isCancel(err)) {
              //If user canceled the document selection
              //alert('Canceled from single doc picker');
            } else {
              //For Unknown Error
              //alert('Unknown Error: ' + JSON.stringify(err));
              throw err;
            }
          }
    }

    renderAttachment(){
        let {data} = this.props;
        let {enumSelector} = this.state;

        return (
            data.map((item, index) => {
                let signText = '', resizeMode = 'contain', borderRadius = 0;

                resizeMode = (item.isPhoto && !item.orientation) ? 'cover' : 'contain';
                borderRadius = (item.isPhoto && !item.orientation) ? 10 : 0;

                if(item.content == null && item.url) {
                    item.content = item.url;
                }

                return <BoxShadow setting={{width:(width-53)/2, height:100, color:"#000000",
                    border:2, radius:10, opacity:0.1, x:0, y:1,style:{marginLeft:(index%2 === 0) ? 0 : 13, marginTop:10}}}>
                    <View style={styles.imagePanel}>
                        <View style={styles.titlePanel}>
                            <Text style={styles.signText}>{signText}</Text>
                            <TouchableOpacity activeOpacity={0.5} onPress={()=>this.removeAttachment(index)} style={styles.delImage}>
                                <Image style={{width:16,height:16}} source={require('../assets/images/Group_185.png')}/>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity activeOpacity={0.5} style={{alignItems:'center'}}>
                            {
                                (item.isPhoto || item.mediaType == enumSelector.mediaTypes.IMAGE) ?
                                <Image source={{uri:item.content}} style={[styles.image]}/> :
                                <View style={[styles.image]}>
                                    <Image source={require('../assets/pdf_icon.jpg')} style={[styles.image, {height: 80}]}/>
                                    <Text numberOfLines={1} style={{width:"100%",paddingLeft:5, paddingRight:5}}>{item.fileName}</Text>
                                </View>
                            }
                        </TouchableOpacity>
                    </View>
                </BoxShadow>
            })
        )
    }

    renderOperator(){
        let {showOperator, data} = this.props;
        let {active} = this.state;

        return (
            (showOperator && (data.length < IMAGE_PDF_LIMIT)) ?  <BoxShadow setting={{width:(width-53)/2, height:100, color:active ? '#006AB7' : "#000000",
                border:2, radius:10, opacity:active ? 0.3 : 0.1, x:0, y:1, style:{marginLeft: (data.length%2 === 0) ? 0 : 13, marginTop:10}}}>
                <TouchableOpacity activeOpacity={0.6} onPress={() => {this.onSignature()}}>
                    <View style={styles.signPanel}>
                        <Image source={require('../assets/img_add_signature.png')} style={styles.addIcon}/>
                        <Text style={styles.addLabel}>{I18n.t('Attachment')}</Text>
                    </View>
                </TouchableOpacity>
            </BoxShadow>: null
        )
    }

    render() {
        return (
            <View>
                <View style={styles.container}>
                    {this.renderAttachment()}
                    {this.renderOperator()}
                </View>
                <BottomSheet ref={c => this.bottomSheet = c} data={this.actions.map((p) => p.name)}
                             onSelect={(index) => {
                                 this.actions[index].router();
                                 this.setState({active:false});
                             }}
                             onCancel={() => {this.setState({active: false})}}/>
                <ModalCenter ref={"confirmDel"} title={I18n.t('Delete attachment title')}
                             description={I18n.t('Delete attachment description')}
                             confirm={()=>this.confirmDelete()}/>
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
        height:100,
        backgroundColor:'#ffffff',
        borderRadius: 10,
        alignItems:'center'
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
        height:100,
        backgroundColor:'#ffffff',
        borderRadius: 10
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


    outSideView:{
        width:width-paddingHorizontal*2,
        flexDirection: 'row',
    },
    panel:{
       position: 'relative',
    },


    signContent:{
        marginLeft:6,
        color:'#1E272E'
    }
});
