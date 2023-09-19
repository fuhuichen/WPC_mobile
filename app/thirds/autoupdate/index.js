/**
 * React-native-update-app
 */
import React, {Component} from "react"
import {
    Dimensions,
    Image,
    Modal,
    NativeModules,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Linking
} from "react-native";

import I18n from 'react-native-i18n';
import store from "react-native-simple-store";
import {VERSION_UPDATE} from "../../common/Constant";
import {DURATION} from "react-native-easy-toast";
import * as ApkManager from 'react-native-apk-manager';
import {request,PERMISSIONS,RESULTS} from 'react-native-permissions';
import AlertUtil from "../../utils/AlertUtil";
import GlobalParam from "../../common/GlobalParam";
import PropType from "prop-types";
import Package from "../../entities/Package";
import {Environment} from "../../../environments/Environment";
import PhoneInfo from "../../entities/PhoneInfo";
import ModalBox from 'react-native-modalbox';
import {Divider} from "react-native-elements";

const RNFS = require("react-native-fs");
const {width, height} = Dimensions.get("window");
const isIOS = Platform.OS == "ios";
const MyViewManager = NativeModules.MyViewManager;

class RNUpdate extends Component {

    static propTypes = {
        onCancel:PropType.func
    }
    // Default properties
    static defaultProps = {
        progressBarColor: "#f31d65",
        updateBoxWidth: width-60,
        updateBoxHeight: 390,
        updateBtnHeight: 38,
    }

    constructor(props) {
        super(props)
        this.state = {
            progress: 0,
            status: 0,
            isManual: false,
            optional: true,
            onCancel:false,
            onConfirm:false,
        }

        this.jobId = 0;
        this.filePath = '';
    }

    componentWillUnmount() {
        this.hideModal();
    }

    onShow(data,isManual){
        this.data = data;  
        this.setState({isManual, optional:data.optional});
        this.refs.modalBox.open();
    }

    onReset(){
        this.setState({progress:0});

        this.jobId = 0;
        this.filePath = '';
    }

    hideModal = () => {
        this.onReset();
        this.refs.modalBox && this.refs.modalBox.close();
        this.jobId && RNFS.stopDownload(this.jobId);
    }

    onCancel(){
        try {
            this.setState({onCancel:false});
            !this.state.isManual && store.save(VERSION_UPDATE,{cancel:true});
            this.refs.modalBox && this.refs.modalBox.close();
            if (this.props.onCancel != null){
                this.props.onCancel();
            }
        }catch (e) {
        }
    }

    onUpdate(){
        try {
            this.setState({onConfirm:false});
            if (isIOS){
                if(this.state.optional){
                    this.refs.modalBox && this.refs.modalBox.close();
                }
                MyViewManager.openAppStore(Environment.isGlobal());
            }
            else{
                if (!Environment.isGlobal()){
                    request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE)
                    .then(result => {
                        if (result ===  RESULTS.GRANTED){
                            this.setState({status:1},()=>{
                                (async ()=>{
                                    this.androidUpdate();
                                })();
                            });
                        }
                        else {
                            AlertUtil.alert(I18n.t('Storage'));
                        }
                    });
                }
                else{
                    if(this.state.optional){
                        this.refs.modalBox && this.refs.modalBox.close();
                    }
                    Linking.openURL(`https://play.google.com/store/apps/details?id=${'com.lookstore'}`);
                }
            }
        }catch (e) {
        }
    }

    androidUpdate = async () => {
        let _this = this;
        this.filePath = `${RNFS.ExternalStorageDirectoryPath}/${this.data.version}.apk`;
        // Download and install
        RNFS.downloadFile({
            fromUrl: this.data.link,
            toFile: this.filePath,
            progressDivider: 2,
            begin(res) {
                _this.jobId = res.jobId;
            },
            progress(res) {
                let progress = (res.bytesWritten / res.contentLength).toFixed(2, 10);
                _this.setState({
                    progress
                })
            }
        }).promise.then(response => {
            if (response.statusCode == 200) {
                this.hideModal();
                ApkManager.installApk(`${RNFS.ExternalStorageDirectoryPath}/${this.data.version}.apk`);
            } else {
                this.setState({status:2},()=>{
                    this.onReset();
                });
            }
        }).catch(err => {
            this.setState({status:2},()=>{
                this.onReset();
            });
        })
    }

    renderBottom = () => {
        let {progress} = this.state;
        let {progressBarColor, updateBoxWidth} = this.props;
        return (
                <View style={styles.progressBar}>
                    <View
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 30,
                            backgroundColor: '#eaedf2',
                            height: 5,
                            width: updateBoxWidth-40,
                            borderRadius:2
                        }}
                    />
                    <View
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 30,
                            backgroundColor: progressBarColor,
                            height: 5,
                            width: progress * (updateBoxWidth-40),
                            borderRadius:2
                        }}
                    />
                </View>
            )
    }

    render() {
        let content = null;
        let verson = this.data != null ? this.data.version : '';
        let title = I18n.t('New version') + verson;
        if (this.state.status === 0){ 
            let showCancel = this.state.optional ? true: false;
            let description = Package.getBuildName(I18n.t('Version tips head')) + I18n.t('Version tips tail'); 
            let {onCancel,onConfirm} = this.state, width = 76, marginRight = 8;
            PhoneInfo.isJALanguage() && (width = 90);
            PhoneInfo.isJALanguage() && (marginRight = 20); 
            content =(
            <View>
                <View style={[styles.modalContent,{height:200-53}]}>
                <View style={styles.modalText}>
                    <View style={styles.titlePanel}>
                       <Text style={styles.modalTitle} numberOfLines={1}>{title}</Text>
                    </View>
                    <Text style={styles.modalDescription}>{description}</Text>
                </View>
                <Image style={styles.warning} source={require('../../assets/images/warning_icon_model.png')}/>
            </View>
            <Divider style={styles.divider}/>
            <View style={styles.modalButtonPanel}>
            {
              showCancel ? <TouchableOpacity activeOpacity={1} onPressIn={()=>this.setState({onCancel:true})} onPressOut={()=>this.onCancel()}>
                  <View style={[styles.operator,{borderWidth:onCancel ? 1 : 0, width, marginRight}]}>
                      <Text style={styles.content}>{I18n.t('Dialog cancel')}</Text>
                  </View>
              </TouchableOpacity> : null
            }
            <TouchableOpacity activeOpacity={1} onPressIn={()=>this.setState({onConfirm:true})} onPressOut={()=>this.onUpdate()}>
              <View style={[styles.operator,{borderWidth:onConfirm ? 1 : 0}]}>
                  <Text style={styles.content}>{I18n.t('Dialog update')}</Text>
              </View>
            </TouchableOpacity> 
            </View>
            </View>  
        )
        }
        else if (this.state.status == 1){ content =(
            <View>
                <View style={[styles.modalContent,{height:66}]}>
                <View style={styles.modalText}>
                    <View style={styles.titlePanel}>
                       <Text style={styles.modalTitle} numberOfLines={1}>{I18n.t('Downloading')}</Text>
                    </View>
                </View>
            </View>
            <Divider style={styles.divider}/>
            <View style={{height:134,paddingTop:24,paddingLeft:24,paddingRight:24}}>
                 <Text style={styles.modalDescription}>{title}</Text>
                 <Text style={[styles.modalDescription,{marginTop:3}]}>{I18n.t('Download tail')}{parseInt(this.state.progress * 100, 10)}%...</Text>
                 <View style={{marginTop:-5}}>
                    {this.renderBottom()}
                 </View>   
            </View>
            </View>
        )
        }
        else if (this.state.status == 2){ 
            content =(
            <View>
                <View style={[styles.modalContent,{height:200-53}]}>
                <View style={styles.modalText}>
                    <View style={styles.titlePanel}>
                       <Text style={styles.modalTitle} numberOfLines={1}>{I18n.t('Tip')}</Text>
                    </View>
                    <Text style={styles.modalDescription}>{I18n.t('Download failed')}</Text>
                </View>
                <Image style={styles.warning} source={require('../../assets/images/warning_icon_model.png')}/>
            </View>
            <Divider style={styles.divider}/>
            <View style={styles.modalButtonPanel}>
            <TouchableOpacity activeOpacity={1} onPress={()=>this.onUpdate()}>
              <View style={styles.operator}>
                  <Text style={styles.content}>{I18n.t('Retry')}</Text>
              </View>
            </TouchableOpacity> 
            </View>
            </View>    
        )
        }
        return (
            <ModalBox style={styles.modalBox} ref={"modalBox"} position={"center"}
            isDisabled={false}
            swipeToClose={false}
            backdropPressToClose={false}
            backButtonClose={true}
            coverScreen={true}>
            {content}
         </ModalBox>
        )
    }
}

const styles = StyleSheet.create({
    modalBox: {
        width: 315,
        borderRadius: 10,
        height:200
    },
    modalContent:{
        backgroundColor:'#F7F9FA',
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    modalText:{
        paddingTop:24,
        paddingLeft:24,
        paddingRight:24
    },
    titlePanel:{
        paddingRight: 30
    },
    modalTitle:{
        marginBottom: 19,
        fontSize: 19,
        color: '#86888A'
    },
    modalDescription:{
        fontSize: 16,
        color: '#86888A'
    },
    modalButtonPanel:{
        flexDirection: 'row',
        justifyContent:'flex-end',
        height:52,
        alignItems: 'center'
    },
    operator:{
        width:76,
        height:36,
        borderRadius:10,
        borderColor:'#006AB7',
        marginRight:8
    },
    content:{
        fontSize: 16,
        height: 36,
        color: '#006AB7',
        textAlign:'center',
        textAlignVertical:'center',
        lineHeight: 36
    },
    patrol:{
        width:110,
        height:36,
        borderRadius:10,
        borderColor:'#F57848',
        marginRight:21,
    },
    warning:{
        position: 'absolute',
        top: 18,
        right: 18,
        width:30,
        height:30
    },
    divider:{
        backgroundColor:'#EBF1F5',
        height:1,
        borderBottomWidth:0
    },
    progressBar: {
        width: width-100,
        height: 37,
        alignItems: "center",
        justifyContent: 'center',
    }
})

export default RNUpdate;
