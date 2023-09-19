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
import {launchCamera} from "react-native-image-picker";
import AlertUtil from "../utils/AlertUtil";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";
import * as lib from "../common/PositionLib";
import EventBus from "../common/EventBus";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import TouchableActive from "../touchables/TouchableActive";
import BottomSheet from "../element/BottomSheet";
import RNFS, {DocumentDirectoryPath} from "react-native-fs";

const {height} = Dimensions.get('window');
const {width} = Dimensions.get('screen');
const paddingHorizontal = lib.paddingHorizontal();

export default class Signature extends Component {
    state = {
        delIndex:-1,
        signIndex:-1,
        active: false,
        selectSign: null,
        itemMoveDown: false
    };

    static propTypes =  {
        showOperator: PropTypes.boolean,
        editable: PropTypes.boolean,
        onSign: PropTypes.function,
        onDelete: PropTypes.function,
        maxCount: PropTypes.number,
        onlySign: PropTypes.boolean,
        extra: PropTypes.array
    };

    static defaultProps = {
        showOperator: true,
        editable: true,
        onlySign: false,
        extra: []
    };

    constructor(props){
        super(props);

        this.actions = [
            {
                name: I18n.t('Signature'),
                router: () => {
                    setTimeout(() => {
                    this.signCanvas()
                }, Platform.select({android:0, ios: 200}))}
            },
            {
                name: I18n.t('Sign photo'),
                router: async ()  => {await this.signPhoto()}
            }
        ];
    }

    componentDidMount() {
        this.emitter = DeviceEventEmitter.addListener('signPhoto',(sign) => {
            (sign.uri !== '') && this.props.onSign && this.props.onSign({
                content: sign.uri,
                signOrientation: sign.orientation,
                signPhoto: sign.photo,
                header: this.state.selectSign ? this.state.selectSign.header : null,
                optional: this.state.selectSign ? this.state.selectSign.optional : null
            }, this.state.signIndex);
            this.setState({selectSign: null, signIndex: -1});
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
            (type > 0) ? this.signPhoto() : this.signCanvas();
        }
    }

    signCanvas(){
        Actions.push('signCanvas');
    }

    async signPhoto() {
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
            let {signIndex, selectSign} = this.state;
            if (response.didCancel || response.errorCode) {
            } else {
                let asset = response.assets[0];
                if(Platform.OS == 'android') {
                    this.props.onSign && this.props.onSign({
                        content: asset.uri,
                        signOrientation: asset.height > asset.width,
                        signPhoto: true,
                        header: selectSign ? selectSign.header : null,
                        optional: selectSign ? selectSign.optional : null
                    }, signIndex);
                } else {
                    let path = RNFS.DocumentDirectoryPath + '/'+ asset.fileName;
                    RNFS.moveFile(asset.uri, path)
                    .then((success) => {
                        this.props.onSign && this.props.onSign({
                            content: path,
                            signOrientation: asset.height > asset.width,
                            signPhoto: true,
                            header: selectSign ? selectSign.header : null,
                            optional: selectSign ? selectSign.optional : null
                        }, signIndex);
                    })
                    .catch((err) => {});
                }
                this.setState({selectSign: null, signIndex: -1});
            }
        });
    }

    removeSign(index) {
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

    renderItem = ({ item,index}) => {
        const {editable} = this.props;
        let radiusStyle = editable ? 4 : 0;
        let signText = !item.signPhoto ? I18n.t('Signature') : '';
        return (
            <View style={[styles.panel,{backgroundColor:'#F7F9FB',borderRadius:radiusStyle,flex:1,
                marginLeft: (index%2 === 0) ? 0 : 9,marginBottom:6}]}>
                {
                   editable ? <View style={styles.titlePanel}>
                        <Text style={styles.signText}>{signText}</Text>
                       <TouchableOpacity activeOpacity={0.5} onPress={()=>this.removeSign(index)} style={styles.delImage}>
                               <Image source={require('../assets/images/Group_185.png')}/>
                           </TouchableOpacity>
                    </View> : null
                }
                <TouchableOpacity activeOpacity={0.5} onPress={()=>{this.imageView(item)}} style={{alignItems:'center'}}>
                    <Image source={{uri:item.content}} style={styles.image} resizeMode='contain'/>
                </TouchableOpacity>
            </View>
        )
    };

    onSignature(item, index){
        let {onlySign} = this.props;
        this.setState({selectSign: item, signIndex: index == null ? -1 : index});
        if(onlySign) {
            setTimeout(() => {
                this.signCanvas()
            }, Platform.select({android:0, ios: 200}));
        } else {
            this.setState({active:true});
            this.bottomSheet && this.bottomSheet.open();
        }
    }

    renderSignature(){
        let {data, editable, showOperator, onlySign} = this.props;
        let {itemMoveDown} = this.state;

        return (
            data.map((item, index) => {
                if(index == 0 && item.header != null && itemMoveDown == false) {
                    itemMoveDown = true;
                    this.setState({itemMoveDown : true});
                }
                if(item.content != null) {
                    let signText = '', resizeMode = 'contain', borderRadius = 0;
                    if (editable){
                        resizeMode = (item.signPhoto && !item.signOrientation) ? 'cover' : 'contain';
                        borderRadius = (item.signPhoto && !item.signOrientation) ? 10 : 0;
                    } else {
                        resizeMode = (item.type && (item.orientation != null) && !item.orientation) ? 'cover' : 'contain';
                        borderRadius = (item.type && (item.orientation != null) && !item.orientation) ? 10 : 0;
                    }

                    return <View>
                        {item.header != null ? <View style={{flexDirection:'row', justifyContent:'flex-start', marginLeft:(index%2 === 0) ? 0 : 13, marginTop: 10}}>
                            <Text style={[styles.starLabel,{marginLeft:0}]}>{item.optional ? '*' : ''}</Text>
                            <Text style={[styles.label,{marginLeft:3}]}>{item.header}</Text>
                        </View> :
                        <View style={itemMoveDown ? {marginTop: 29} : {marginTop: 10}}></View>}
                        <BoxShadow setting={{width:(width-53)/2, height:100, color:"#000000",
                            border:2, radius:10, opacity:0.1, x:0, y:1,style:{marginLeft:(index%2 === 0) ? 0 : 13}}}>
                            <View style={styles.imagePanel}>
                                {
                                    editable ? <View style={styles.titlePanel}>
                                        <Text style={styles.signText}>{signText}</Text>
                                        <TouchableOpacity activeOpacity={0.5} onPress={()=>this.removeSign(index)} style={styles.delImage}>
                                            <Image style={{width:16,height:16}} source={require('../assets/images/Group_185.png')}/>
                                        </TouchableOpacity>
                                    </View> : null
                                }
                                <TouchableOpacity activeOpacity={0.5} onPress={()=>{this.imageView(item)}} style={{alignItems:'center'}}>
                                    <Image source={{uri:item.content}} style={[styles.image,{borderRadius}]} resizeMode={resizeMode}/>
                                </TouchableOpacity>
                            </View>
                        </BoxShadow>
                    </View>
                } else {
                    return (
                        (showOperator ?
                        <View>
                            <View style={{flexDirection:'row', justifyContent:'flex-start', marginLeft:(index%2 === 0) ? 0 : 13, marginTop: 10}}>
                                <Text style={[styles.starLabel,{marginLeft:0}]}>{item.optional ? '*' : ''}</Text>
                                <Text style={[styles.label,{marginLeft:3}]}>{item.header}</Text>
                            </View>
                            <BoxShadow setting={{width:(width-53)/2, height:100, color:"#000000",
                                border:2, radius:10, opacity:0.1, x:0, y:1,style:{marginLeft:(index%2 === 0) ? 0 : 13}}}>
                                <TouchableOpacity activeOpacity={0.6} onPress={() => {this.onSignature(item, index);}}>
                                    <View style={styles.signPanel}>
                                        <Image source={require('../assets/img_add_signature.png')} style={styles.addIcon}/>
                                        <Text style={styles.addLabel}>{onlySign ? I18n.t('Signature') : I18n.t('Add Signature or photo')}</Text>
                                    </View>
                                </TouchableOpacity>
                            </BoxShadow>
                        </View>: null)
                    )
                }
            })
        )
    }

    renderOperator(){
        let {showOperator, data, maxCount, onlySign, extra} = this.props;
        let {active, itemMoveDown} = this.state;

        let signMaxCount = maxCount ? maxCount : 4;

        return (
            (showOperator && (data.length < signMaxCount)) ? <View>
                {itemMoveDown == true && <View style={{marginTop: 19}}></View>}
                <BoxShadow setting={{width:(width-53)/2, height:100, color:active ? '#006AB7' : "#000000",
                    border:2, radius:10, opacity:active ? 0.3 : 0.1, x:0, y:1, style:{marginLeft: (data.length%2 === 0) ? 0 : 13, marginTop:10}}}>
                    <TouchableOpacity activeOpacity={0.6} onPress={() => {this.onSignature()}}>
                        <View style={styles.signPanel}>
                            <Image source={require('../assets/img_add_signature.png')} style={styles.addIcon}/>
                            <Text style={styles.addLabel}>{onlySign ? I18n.t('Signature') : I18n.t('Add Signature or photo')}</Text>
                        </View>
                    </TouchableOpacity>
                </BoxShadow>
            </View>: null)
    }

    render() {
        return (
            <View>
                <View style={styles.container}>
                    {this.renderSignature()}
                    {this.renderOperator()}
                </View>
                <BottomSheet ref={c => this.bottomSheet = c} data={this.actions.map((p) => p.name)}
                             onSelect={(index) => {
                                 this.actions[index].router();
                                 this.setState({active:false});
                             }}
                             onCancel={() => {this.setState({active: false})}}/>
                <ModalCenter ref={"confirmDel"} title={I18n.t('Delete signature title')}
                             description={I18n.t('Delete signature description')}
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
    label:{
        fontSize:12,
        color:'#006AB7',
        marginLeft:2
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
    },
    starLabel:{
        color:'#ff2400',
        marginLeft:10
    },
});
