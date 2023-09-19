import React, {Component} from 'react';

import {
    ScrollView, Dimensions, FlatList,
    Image, Platform,
    StyleSheet, Text, TextInput,
    TouchableOpacity,
    View, DeviceEventEmitter
} from 'react-native';
import {Actions} from "react-native-router-flux";
import I18n from "react-native-i18n";
import HttpUtil from "../utils/HttpUtil";
import SlideModalEx from "../components/SlideModal";
import PicBase64Util from "../utils/PicBase64Util";
import GroupInfo from "./GroupInfo";
import NavBarPanel from "../components/NavBarPanel";
import {EMITTER_MODAL_CLOSE} from "../common/Constant";
import {launchCamera, launchImageLibrary} from "react-native-image-picker";
import FaceUtil from "../utils/FaceUtil";
import BusyIndicator from "../components/BusyIndicator";
import dismissKeyboard from "react-native-dismiss-keyboard";
import * as lib from '../common/PositionLib';
import AlertUtil from "../utils/AlertUtil";
import ModalBox from 'react-native-modalbox';
import {request,PERMISSIONS,RESULTS} from 'react-native-permissions';
import RNFS, {DocumentDirectoryPath} from 'react-native-fs';
const {width} = Dimensions.get('screen');

export default class Register extends Component {

    constructor(props) {
        super(props);
        this.state = {
             groupIndex:0,
             name:'',
             card:'',
             phone:'',
             description:'',
             number: '',
             job: '',
             email:'',
             store:'',
             faceImage: this.props.data ? this.props.data.image : null,
             error: -1
        };
        this.faceFlag = false;
    }

    componentDidMount() {
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_MODAL_CLOSE,
            ()=>{
                this.modalDownList && this.modalDownList.close();
                this.modalBox && this.modalBox.close();
            });
        this.freshEmitter = DeviceEventEmitter.addListener('onFaceModified', this.onModified.bind(this));
        if (this.props.registered){
            HttpUtil.get(`customer/face/info?customerId=${this.props.data.customerId}`)
                .then(result => {
                    let data = result.data;
                    let extraInfo = null;
                    if (result.data != null && result.data.extraInfo != null && result.data.extraInfo !== ''){
                        extraInfo = JSON.parse(data.extraInfo);
                    }
                    this.setState({
                        groupIndex: data.group,
                        name :data.name,
                        description: data.description,
                        phone: extraInfo? extraInfo.phoneNumber : '',
                        card: extraInfo? extraInfo.memberCardId: '',
                        number: extraInfo? extraInfo.employeeId: '',
                        email: extraInfo? extraInfo.employeeEmail: '',
                        job: extraInfo? extraInfo.employeeJob:'',
                        store: extraInfo? extraInfo.employeeStore:''
                    });
                })
                .catch(error=>{
                })
        }
    }

    componentWillUnmount(){
        this.notifyEmitter && this.notifyEmitter.remove();
        this.freshEmitter && this.freshEmitter.remove();
    }

    onModified(base64){
        this.setState({faceImage:base64});
        this.faceFlag = true;
    }

    onCancel(){
        this.modalDownList && this.modalDownList.close();
        Actions.pop();
    }

    async confirm(){
        dismissKeyboard();

        if (this.state.groupIndex === 3){
            (this.state.email.trim() === '') && (await this.setState({error:4}));
            (this.state.phone.trim() === '') && (await this.setState({error:2}));
            (this.state.number.trim() === '') && (await this.setState({error:3}));
        }else if(this.state.groupIndex === 0 || this.state.groupIndex === 1){
            (this.state.phone.trim() === '') && (await this.setState({error:2}));
            (this.state.card.trim() === '') && (await this.setState({error:1}));
        }

        (this.state.name.trim() === '') && (await this.setState({error:0}));
        if(this.state.error !== -1){
            return;
        }

        if (this.props.registered){
            let request = {};
            request.customerId = this.props.data.customerId;
            request.group = this.state.groupIndex;
            request.name = this.state.name;
            request.description = this.state.description;
            if (this.faceFlag){
                request.image =  this.state.faceImage;
            }
            if (this.state.groupIndex === 0 || this.state.groupIndex === 1){
                let extraInfo = {};
                extraInfo.memberCardId = this.state.card;
                extraInfo.phoneNumber = this.state.phone;
                request.extraInfo = JSON.stringify(extraInfo);
            }else if(this.state.groupIndex === 3){
                let extraInfo = {};
                extraInfo.phoneNumber = this.state.phone;
                extraInfo.employeeId = this.state.number;
                extraInfo.employeeEmail = this.state.email;
                extraInfo.employeeJob = this.state.job;
                extraInfo.employeeStore = this.state.store;
                request.extraInfo = JSON.stringify(extraInfo);
            }

            HttpUtil.post('customer/face/update',request)
                .then(result => {
                    Actions.push('registerResult',{result:true,title:I18n.t('Save')+I18n.t('Success')});
                })
                .catch(error=>{
                    Actions.push('registerResult',{result:false,title:I18n.t('Save')+I18n.t('Error')});
                })
        }
        else {
            let request = {};
            request.group = this.state.groupIndex;
            request.name = this.state.name;
            request.description = this.state.description;
            request.image = this.state.faceImage;
            request.scope = 0;
            //request.storeId = this.props.storeId;
            (this.props.data) && (this.props.data.faceId) && (request.faceId = this.props.data.faceId);

            if (this.state.groupIndex === 0 || this.state.groupIndex === 1){
                let extraInfo = {};
                extraInfo.memberCardId = this.state.card;
                extraInfo.phoneNumber = this.state.phone;
                request.extraInfo = JSON.stringify(extraInfo);
            }
            else if(this.state.groupIndex === 3){
                let extraInfo = {};
                extraInfo.phoneNumber = this.state.phone;
                extraInfo.employeeId = this.state.number;
                extraInfo.employeeEmail = this.state.email;
                extraInfo.employeeJob = this.state.job;
                extraInfo.employeeStore = this.state.store;
                request.extraInfo = JSON.stringify(extraInfo);
            }
            HttpUtil.post('customer/face/register',request)
                .then(result => {
                    Actions.push('registerResult',{result:true,title:I18n.t('Register')+I18n.t('Success')});
                })
                .catch(error=>{
                    Actions.push('registerResult',{result:false,title:I18n.t('Register')+I18n.t('Error')});
                })
        }
    }

    clickRow(item,index){
        this.setState({groupIndex:index,error:-1});
        setTimeout(() => {
            this.modalDownList.close();
        }, 200);
    }

    openImagePicker(){
        request(Platform.select({
            android: PERMISSIONS.ANDROID.CAMERA,
            ios: PERMISSIONS.IOS.CAMERA,
        }),
        ).then(result => {
        if (result ===  RESULTS.GRANTED){
            this.modalBox && this.modalBox.open();
        }else {
            AlertUtil.alert(I18n.t('Camera'));
        }
        });
    }

    onCamera(){
        this.modalBox && this.modalBox.close();
        setTimeout(()=>{
            (async ()=>{
                launchCamera({
                    mediaType:'photo',
                    quality:0.8,
                    maxWidth:1080,
                    maxHeight:1080,
                    noData:true,
                    includeExtra:true,
                    includeBase64: true,
                    includeExtra:true,
                    storageOptions: {skipBackup:true, path:'images',cameraRoll:false}
                }, async (response) => {
                    if (response.didCancel || response.error) {}
                    else {
                        await this.onHandle(response);
                    }
                });
            })();
        },500)
    }

    onAlbum(){
        this.modalBox && this.modalBox.close();
        const options = {
            title: null,
            takePhotoButtonTitle:I18n.t('Take photo'),
            chooseFromLibraryButtonTitle:I18n.t('Choose from library'),
            cancelButtonTitle:I18n.t('Cancel'),
            mediaType:'photo',
            quality:0.5,
            maxWidth:1080,
            maxHeight:1080,
            includeBase64: true,
            includeExtra:true,
            storageOptions: {skipBackup: true, path: 'images',cameraRoll:false,allowsEditing:true}
        };

        setTimeout(()=>{
            (async ()=>{
                launchImageLibrary(options, async (response) => {
                    if (response.didCancel || response.error) {}
                    else {
                        await this.onHandle(response);
                    }
                });
            })();
        },500);
    }

    cancel(){
        this.modalBox && this.modalBox.close();
    }

    async onHandle(response){
        if(lib.isAndroid()){
            this.filePath = `file://${DocumentDirectoryPath}/${response.fileName}`;
            await RNFS.writeFile(this.filePath, response.base64, 'base64')
                .then(async ()=>{
                    FaceUtil.setParam('MXwzkrES1et4uqSRSY73DYoa9bCtXosX','oJq5GC3d_isqEUYRHxTTx4_1Uytn6X3B');
                    this.refs.indicator.open();
                    let result = await FaceUtil.getFace(this.filePath,response.base64,response.height,response.width);
                    this.refs.indicator.close();
                    Actions.push('faceAnalyse',{uri:this.filePath,faces:FaceUtil.getApiResult(),result:result});
                })
                .catch(()=>{
                    Actions.push('faceAnalyse',{uri:response.uri, faces:[], result:false});
                });
        }
        else{
            FaceUtil.setParam('MXwzkrES1et4uqSRSY73DYoa9bCtXosX','oJq5GC3d_isqEUYRHxTTx4_1Uytn6X3B');
            this.refs.indicator.open();
            let result = await FaceUtil.getFace(response.uri,response.base64,response.height,response.width);
            this.refs.indicator.close();
            Actions.push('faceAnalyse',{uri:response.uri,faces:FaceUtil.getApiResult(),result:result});
        }
    }

    renderRow = ({ item,index}) => {
        let groupName = GroupInfo.get(index).name;
        let color = index === this.state.groupIndex ? '#0D0000': '#989BA3';
        return (
            <TouchableOpacity activeOpacity={1} onPress={this.clickRow.bind(this,item,index)} >
                <View style={styles.brandItemSelected}>
                    <Text style={[styles.brandName,{color:color}]} numberOfLines={1}>{groupName}</Text>
                    <View style={{height: 1, width:202, backgroundColor: '#DCDCDC'}}/>
                </View>
            </TouchableOpacity>
        )
    };

    render() {
        let registered = this.props.registered;
        let middleTitle = registered ? I18n.t('Edit') : I18n.t('Register');
        let rightTitle = registered ? I18n.t('Save') :I18n.t('Submit');
        let groupName = GroupInfo.get(this.state.groupIndex).name;

        let employee = null;
        if(this.state.groupIndex === 3){
            employee = (<View>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <Text style={{fontSize:14,color:'#ff2400',marginTop:8}}>{'* '}</Text>
                        <Text style={styles.textTitle}>{I18n.t('Employee id')}</Text>
                    </View>
                    <TextInput style={(this.state.error === 3) ? styles.textError : styles.textInput}
                               onFocus={()=>this.setState({error:-1})}
                               onChangeText={(text) =>{this.setState({number:text})}}
                        value={this.state.number}/>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <Text style={{fontSize:14,color:'#ff2400',marginTop:8}}>{'* '}</Text>
                        <Text style={styles.textTitle}>{I18n.t('Phone number')}</Text>
                    </View>
                    <TextInput style={(this.state.error === 2) ? styles.textError : styles.textInput}
                               onFocus={()=>this.setState({error:-1})}
                               onChangeText={(text) =>{this.setState({phone:text})}}
                               value={this.state.phone} keyboardType={'numeric'}/>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                        <Text style={{fontSize:14,color:'#ff2400',marginTop:8}}>{'* '}</Text>
                        <Text style={styles.textTitle}>{I18n.t('Employee email')}</Text>
                    </View>
                    <TextInput style={(this.state.error === 4) ? styles.textError : styles.textInput}
                               onFocus={()=>this.setState({error:-1})}
                               onChangeText={(text) =>{this.setState({email:text})}}
                               value={this.state.email}/>
                    <Text style={styles.textTitle}>{I18n.t('Employee job')}</Text>
                    <TextInput style={styles.textInput} onChangeText={(text) =>{this.setState({job:text})}}
                               value={this.state.job}/>
                    <Text style={styles.textTitle}>{I18n.t('Employee store')}</Text>
                    <TextInput style={styles.textInput} onChangeText={(text) =>{this.setState({store:text})}}
                               value={this.state.store}/>
                </View>
            )
        }

        return (
            <View style={styles.container}>
                <NavBarPanel title={middleTitle} confirmText={rightTitle} onConfirm={this.confirm.bind(this)} onCancel={this.onCancel.bind(this)}/>
                <View style={{backgroundColor:'#F7F8FC',height:204,alignItems:'center',flexDirection: 'row'}}>
                    <TouchableOpacity onPress={() =>{this.openImagePicker()}}>
                        <View style={{marginLeft:20,alignItems:'center'}}>
                            <Image style={this.state.faceImage ? [styles.defaultImage,{backgroundColor:'#000000'}] :
                                [styles.defaultImage,{backgroundColor:'#ffffff'}]} resizeMode={'contain'} source={this.state.faceImage ?
                                    PicBase64Util.getJPGSource(this.state.faceImage): require('../assets/images/img_customer_default.png')}/>
                            <Text style={{fontSize:12,color:'#989BA3',marginTop:10}}>{I18n.t('Change photo')}</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{marginLeft:20}} >
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                            <Text style={{fontSize:14,color:'#ff2400'}}>{'* '}</Text>
                            <Text style={{fontSize:14}}>{I18n.t('Customer Group')}</Text>
                        </View>
                        <TouchableOpacity onPress={() => {this.modalDownList.open();}}>
                            <View style={{height:46,width:202,alignItems:'center',borderWidth:1,borderColor:'#DCDCDC',
                                backgroundColor:'#FFFFFF', flexDirection:'row',justifyContent:'center',marginTop:10}}>
                                <Text style={{fontSize:14,color:'#0D0000',marginLeft:10}}>{groupName}</Text>
                                <View style={{flex:1}}/>
                                <Image style={{height:37,width:48}} resizeMode={'contain'} source={require('../assets/images/home_pulldown_icon_mormal.png')}/>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <SlideModalEx ref={(c) => { this.modalDownList = c; }} offsetY={200} opacity={0.1}>
                    <FlatList
                        data={[0,1,2,3]}
                        extraData={this.state}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderRow}
                    />
                </SlideModalEx>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={{marginLeft:20,marginRight:20}}>
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                            <Text style={{fontSize:14,color:'#ff2400',marginTop:8}}>{'* '}</Text>
                            <Text style={styles.textTitle}>{I18n.t('CustomerName')}</Text>
                        </View>
                        <TextInput style={(this.state.error === 0) ? styles.textError : styles.textInput}
                                   onFocus={()=>this.setState({error:-1})}
                                   onChangeText={(text) =>{this.setState({name:text})}} value={this.state.name} />

                        {this.state.groupIndex === 0 || this.state.groupIndex === 1 ?
                            <View>
                                <View style={{flexDirection:'row',alignItems:'center'}}>
                                    <Text style={{fontSize:14,color:'#ff2400',marginTop:8}}>{'* '}</Text>
                                    <Text style={styles.textTitle}>{I18n.t('CustomerCard')}</Text>
                                </View>
                                <TextInput style={(this.state.error === 1) ? styles.textError : styles.textInput}
                                           onFocus={()=>this.setState({error:-1})}
                                           onChangeText={(text) =>{this.setState({card:text})}}
                                           value={this.state.card} />
                                <View style={{flexDirection:'row',alignItems:'center'}}>
                                    <Text style={{fontSize:14,color:'#ff2400',marginTop:8}}>{'* '}</Text>
                                    <Text style={styles.textTitle}>{I18n.t('Phone number')}</Text>
                                </View>
                                <TextInput style={(this.state.error === 2) ? styles.textError : styles.textInput}
                                           onFocus={()=>this.setState({error:-1})}
                                           onChangeText={(text) =>{this.setState({phone:text})}}
                                           value={this.state.phone} keyboardType={'numeric'}/>
                            </View>:null
                        }
                        {employee}

                        <Text style={styles.textTitle}>{I18n.t('Description')}</Text>
                        <TextInput style={[styles.textInput,{height:70,marginBottom: 30}]} multiline onChangeText={(text) =>{this.setState({description:text})}}
                                   value={this.state.description} />
                    </View>
                </ScrollView>
                <BusyIndicator ref={"indicator"} title={I18n.t('Loading')}/>

                <ModalBox style={styles.modalBox} ref={(c) => { this.modalBox = c}} position={"bottom"}
                          isDisabled={false}
                          swipeToClose={false}
                          backdropPressToClose={true}
                          backButtonClose={false}
                          coverScreen={true}>
                    <View>
                        <TouchableOpacity activeOpacity={0.5} onPress={this.onCamera.bind(this)}>
                            <View style={styles.itemPanel}>
                                <Text style={styles.itemText}>{I18n.t('Take photo')}</Text>
                            </View>
                        </TouchableOpacity>
                        <View style={{width:width,height:1,backgroundColor:'#D8D8D8'}}/>
                        <TouchableOpacity activeOpacity={0.5} onPress={this.onAlbum.bind(this)}>
                            <View style={styles.itemPanel}>
                                <Text style={styles.itemText}>{I18n.t('Choose from library')}</Text>
                            </View>
                        </TouchableOpacity>
                        <View style={{width:width,height:10,backgroundColor:'#E1E1E1'}}/>
                        <TouchableOpacity activeOpacity={0.5} onPress={this.cancel.bind(this)}>
                            <View style={styles.itemPanel}>
                                <Text style={styles.itemText}>{I18n.t('Cancel')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </ModalBox>
            </View>
        );
    }
}

var styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    brandItemSelected:{
        width: 202,
        marginLeft:140,
        backgroundColor: '#F7F8FC',
    },
    brandName:{
        fontSize: 14,
        marginLeft: 20,
        height:45,
        textAlignVertical: 'center',
        ...Platform.select({
            ios:{
                lineHeight:45
            }
        })
    },
    textTitle:{
        fontSize:14,
        color:'#19293D',
        marginTop:10
    },
    textInput:{
        marginTop:10,
        width: width-40,
        height: 46,
        borderWidth: 1,
        borderColor: '#dcdcdc',
        paddingVertical: 0,
        borderRadius: 2,
        paddingLeft: 10,
        alignItems:'center'
    },
    defaultImage:{
        width:100,
        height:100,
        borderRadius:2
    },
    textError:{
        marginTop:10,
        width: width-40,
        height: 46,
        borderWidth: 1,
        borderColor: '#f31d65',
        paddingVertical: 0,
        borderRadius: 2,
        paddingLeft: 10,
        alignItems:'center'
    },
    modalBox: {
        width: width,
        height:156 + lib.defaultBottomSpace(),
    },
    itemPanel:{
        width: width,
        height: 50,
        backgroundColor: 'white',
        justifyContent:'center',
        alignItems:'center'
    },
    itemText:{
        fontSize: 14,
        color: '#232324',
        alignContent:'center'
    }
});
