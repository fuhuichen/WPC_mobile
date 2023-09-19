import React, {Component} from 'react';
import {
    BackHandler,
    DeviceEventEmitter,
    Dimensions,
    FlatList,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {Actions} from 'react-native-router-flux';
import Icon from 'react-native-vector-icons/FontAwesome';
import RNStatusBar from '../components/RNStatusBar';
import {ColorStyles} from '../common/ColorStyles';
import Toast, {DURATION} from 'react-native-easy-toast'
import ProgressIndicator from '../components/ProgressIndicator';
import moment from "moment";
import {MEDIA_AUDIO, MEDIA_IMAGE, MEDIA_VIDEO, MODULE_INSPECT} from "../common/Constant";
import OSSUtil from "../utils/OSSUtil";
import HttpUtil from "../utils/HttpUtil";
import I18n from 'react-native-i18n';
import {request,PERMISSIONS,RESULTS} from 'react-native-permissions';
import AlertUtil from "../utils/AlertUtil";
import dismissKeyboard from "react-native-dismiss-keyboard";
import StringFilter from "../common/StringFilter";
import RouteMgr from "../notification/RouteMgr";
import PatrolTable from "../components/inspect/PatrolTable";
import PatrolStorage from "../components/inspect/PatrolStorage";
import PatrolFocal from "../components/inspect/PatrolFocal";
import SoundUtil from "../utils/SoundUtil";
import PatrolShow from "../components/inspect/PatrolShow";
import PatrolFeedback from "../components/inspect/PatrolFeedback";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";
import {launchCamera} from "react-native-image-picker";
import * as lib from '../common/PositionLib';
import UserPojo from "../entities/UserPojo";
import NP from 'number-precision';
import PatrolAsset from "../components/inspect/PatrolAsset";
import Signature from "../components/Signature";
import Orientation from 'react-native-orientation-locker';
const INPUT_TEXT_LEN_MAX = 1000;

let {width} =  Dimensions.get('screen');
export default class InspectSummary extends Component {
    constructor(props){
        super(props);

        this.store = this.props.store;
        this.data = this.props.data;
        this.events = this.props.events;
        this.signature = this.props.signature;
        this.score = this.props.score;
        this.enableSubmit = true;
        this.result = PatrolAsset.getStatus();

        this.state = {
            index: -1,
            ignores:[],
            focuses: [],
            advise: this.props.cache.advise,
            sign: this.props.cache.sign,
            signUriArray: this.props.cache.signUriArray,

            totalPoints : 0,
            summary: [],
            rateTable: [],
            scoreTable: [],
            appendTable: [],
            activeOpacity: 0.5
        };

        this.initScoreRules();
    }

    componentDidMount(){
        try {
            let rateGroup = null, scoreGroup = null, appendGroup = null;
            let rateData = this.data.filter(p => p.type === 0);
            let scoreData = this.data.filter(p => p.type === 1);
            let appendData = this.data.filter(p => p.type === 2);

            (rateData.length > 0) && (rateGroup = this.onRateTable(rateData));
            (scoreData.length > 0) && (scoreGroup = this.onScoreTable(scoreData));
            (appendData.length > 0) && (appendGroup = this.onAppendTable(appendData));

            this.onSummary(rateGroup, scoreGroup, appendGroup);
        }catch (e) {
        }
    }

    componentWillMount(){
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('inspectSummaryBack', this.onBackAndroid);
        }
        this.signPhotoEmitter = DeviceEventEmitter.addListener('signPhoto',
        (photo) =>{
            this.onFullScreen();
            const photos = {
                signUri:photo.uri,
                signOrientation:photo.orientation,
                signPhoto:photo.photo,
            }
            photo.uri !== '' && this.setState({
                signUriArray:[...this.state.signUriArray,photos]
            },()=>{
                this.refreshCache();
            });
        });
    }

    onFullScreen(){
        Orientation.getOrientation((err, orientation) => {
            if(orientation !== 'LANDSCAPE'){
                if (Platform.OS === 'android'){
                    Orientation.lockToLandscapeLeft();
                }
                else {
                    Orientation.lockToLandscapeRight();
                }
            }
            Orientation.lockToPortrait();
        });
    }

    componentWillUnmount() {
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('inspectSummaryBack', this.onBackAndroid);
        }
        this.signPhotoEmitter && this.signPhotoEmitter.remove();
    }

    onBackAndroid = () => {
        this.setCache();
        Actions.pop();
        return true;
    };

    backClick(){
        this.setCache();
        Actions.pop();
    }

    initScoreRules(){
        this.includedInTotalScoreWithType1 = false;
        this.qualifiedForIgnoredWithType1 = true;
        this.qualifiedForIgnoredWithType2 = true;
        this.hundredMarkType = -1;
        this.minScore = 0;
        this.maxScore = 100;
        this.dangerousOnFailedItem = false;

        let inspectSettings = this.props.inspectSettings;
        let keyIndex = inspectSettings.findIndex(p => p.name === 'includedInTotalScoreWithType1');
        (keyIndex !== -1) ? (this.includedInTotalScoreWithType1 = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'qualifiedForIgnoredWithType1');
        (keyIndex !== -1) ? (this.qualifiedForIgnoredWithType1 = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'qualifiedForIgnoredWithType2');
        (keyIndex !== -1) ? (this.qualifiedForIgnoredWithType2 = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'hundredMarkType');
        (keyIndex !== -1) ? (this.hundredMarkType = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'minScore');
        (keyIndex !== -1) ? (this.minScore = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'maxScore');
        (keyIndex !== -1) ? (this.maxScore = inspectSettings[keyIndex].value) : null;

        keyIndex = inspectSettings.findIndex(p => p.name === 'dangerousOnFailedItem');
        (keyIndex !== -1) ? (this.dangerousOnFailedItem = inspectSettings[keyIndex].value) : null;
    }

    onSummary(rateGroup, scoreGroup, appendGroup){
        let summary = [0,1,2],index = -1, points = 0, totalPoints = 0;
        let rateTable = [], scoreTable = [], appendTable = [];
        let focuses = [], ignores = [];

        if (rateGroup != null){
            if (this.dangerousOnFailedItem){
                (rateGroup.unqualified !== 0) ? (summary = [0]) : null;
                (rateGroup.unqualified !== 0) ? (index = 0) : null;
            }

            points = NP.plus(points, rateGroup.points);
            totalPoints = NP.plus(totalPoints, rateGroup.totalPoints);
            rateTable = rateGroup.items;

            (rateGroup.focuses.length > 0) && focuses.push(...rateGroup.focuses);
            (rateGroup.ignores.length > 0) && ignores.push(...rateGroup.ignores);
        }

        if (scoreGroup != null){
            if (!this.includedInTotalScoreWithType1){
                points = 0;
                totalPoints = 0;
            }
            points = NP.plus(points, scoreGroup.points);
            totalPoints = NP.plus(totalPoints, scoreGroup.totalPoints);
            scoreTable = scoreGroup.items;

            (scoreGroup.focuses.length > 0) && focuses.push(...scoreGroup.focuses);
            (scoreGroup.ignores.length > 0) && ignores.push(...scoreGroup.ignores);
        }

        if (this.hundredMarkType !== -1){
            totalPoints = (totalPoints === 0) ? totalPoints : NP.round(points/totalPoints*100, 1);
        }else {
            totalPoints = points;
        }

        if (appendGroup != null){
            if (scoreGroup == null && !this.includedInTotalScoreWithType1){
                totalPoints = 0;
            }
            totalPoints = NP.plus(totalPoints, appendGroup.totalPoints);

            appendTable = appendGroup.items;
            (appendGroup.focuses.length > 0) && focuses.push(...appendGroup.focuses);
            (appendGroup.ignores.length > 0) && ignores.push(...appendGroup.ignores);
        }

        (totalPoints > this.maxScore) ? (totalPoints = this.maxScore)
            : (totalPoints < this.minScore) ? (totalPoints = this.minScore): null;

        this.setState({
            summary,
            index,
            totalPoints,
            rateTable,
            scoreTable,
            appendTable,
            focuses,
            ignores
        });
    }

    onRateTable(categories){
        let group = {points:0, totalPoints: 0, qualified: 0, unqualified: 0, items: [], focuses: [], ignores: [], count: 0};
        group.count = categories.reduce((p,e) => p + e.items.length, 0);

        categories.forEach((item)=>{
            let qualified = item.items.filter(p => p.score === this.score[2].label);
            let unqualified = item.items.filter(p => p.score === this.score[1].label);
            let autoItems = item.items.filter(p => p.score === this.score[0].label);

            let pointItems = this.qualifiedForIgnoredWithType1 ? [...qualified, ...autoItems] : qualified;
            let totalItems = this.qualifiedForIgnoredWithType1 ? item.items : [...qualified, ...unqualified];

            group.points = NP.plus(group.points, pointItems.reduce((p,e) => NP.plus(p, e.maxScore), 0));
            group.totalPoints = NP.plus(group.totalPoints, totalItems.reduce((p,e) => NP.plus(p, e.maxScore), 0));

            group.qualified += qualified.length;
            group.unqualified += unqualified.length;

            group.focuses.push(...unqualified);
            group.ignores.push(...autoItems);

            group.items.push({
                name: item.groupName,
                size: item.items.length,
                qualified: qualified.length,
                unqualified: unqualified.length,
                inapplicable: autoItems.length
                });
        });

        return group;
    }

    onScoreTable(categories){
        let group = {points:0, totalPoints: 0, items:[], focuses: [], ignores: [], count: 0};
        group.count = categories.reduce((p,e) => p + e.items.length, 0);

        categories.forEach((item,index)=>{
            let scoreItems = item.items.filter(p => p.score !== this.score[0].label);
            let autoItems = item.items.filter(p => p.score === this.score[0].label);
            let focusItems = item.items.filter(p => (p.score !== this.score[0].label) && (p.score < p.qualifiedScore));

            let pointItems = this.qualifiedForIgnoredWithType2 ? item.items : scoreItems;
            let points = pointItems.reduce((p,e) => NP.plus(p, ((e.score !== this.score[0].label) ? e.score : e.maxScore)), 0);
            let totalPoints = pointItems.reduce((p,e) => NP.plus(p, e.maxScore), 0);

            group.points = NP.plus(group.points, points);
            group.totalPoints = NP.plus(group.totalPoints, totalPoints);

            group.focuses.push(...focusItems);
            group.ignores.push(...autoItems);

            group.items.push({
                name: item.groupName,
                size: item.items.length,
                totalPoints: totalPoints,
                inapplicable: autoItems.length,
                points: points,
            });
        });

        return group;
    }

    onAppendTable(categories){
        let group = {totalPoints:0, items: [], focuses: [], ignores: [], count: 0};
        group.count = categories.reduce((p,e) => p + e.items.length, 0);

        categories.forEach((item)=>{
            let qualified = item.items.filter(p => p.score === this.score[2].label);
            let unqualified = item.items.filter(p => p.score === this.score[1].label);
            let autoItems = item.items.filter(p => p.score === this.score[0].label);

            let points = qualified.reduce((p,e) => NP.plus(p, ((e.maxScore > 0) ? e.maxScore : 0)), 0);
            points = NP.plus(points, unqualified.reduce((p,e) => NP.plus(p, ((e.maxScore < 0) ? e.maxScore : 0)), 0));

            group.totalPoints = NP.plus(group.totalPoints, points);
            group.focuses.push(...unqualified);
            group.ignores.push(...autoItems);

            group.items.push({
                name: item.groupName,
                size: item.items.length,
                qualified: qualified.length,
                unqualified: unqualified.length,
                inapplicable: autoItems.length,
                points: points,
            });
        });

        return group;
    }

    setCache(){
        this.props.cache.advise = this.state.advise;
        this.props.cache.sign = this.state.sign;
        this.props.cache.signUriArray = this.state.signUriArray;
    }

    refreshCache(){
        this.setCache();
        DeviceEventEmitter.emit("onCacheRefresh", this.props.cache);
    }

    submitClick(){
        try {
            if(this.state.index === -1){
                dismissKeyboard();
                this.refs.toast.show(I18n.t('Select overall'),DURATION.LENGTH_SHORT);
                return;
            }

            if(this.state.advise.trim() === ''){
                dismissKeyboard();
                this.refs.toast.show(I18n.t('Give advices'),DURATION.LENGTH_SHORT);
                return;
            }

            if((this.signature != null && this.signature === 1 && this.state.signUriArray.length === 0)){
                dismissKeyboard();
                this.refs.toast.show(I18n.t('Give sign'),DURATION.LENGTH_SHORT);
                return;
            }

            if(!this.enableSubmit){
                return;
            }
            this.enableSubmit = false;
            this.setState({activeOpacity:1});

            SoundUtil.stop();

            OSSUtil.init(this.store.storeId).then(()=>{
                let pArray = [];
                let items = this.formatData();
                let events = this.formatEvent();

                let keyIndex = 0;
                items.forEach((item,index)=>{
                    item.attachment.forEach((key,value)=>{
                        var type = (key.mediaType === 0) ? MEDIA_AUDIO : (key.mediaType === 1) ? MEDIA_VIDEO : MEDIA_IMAGE;
                        var ossKey = OSSUtil.formatOssUrl(MODULE_INSPECT,type,this.store.storeId,item.inspectItemId+'_'+keyIndex++);
                        pArray.push(OSSUtil.upload(ossKey,key.url));
                        key.url = OSSUtil.formatRemoteUrl(ossKey);
                    });
                });

                events.forEach((item,index)=>{
                    item.attachment.forEach((key,value)=>{
                        var type = (key.mediaType === 0) ? MEDIA_AUDIO : (key.mediaType === 1) ? MEDIA_VIDEO : MEDIA_IMAGE;
                        var ossKey = OSSUtil.formatOssUrl(MODULE_INSPECT,type,this.store.storeId,item.deviceId+'_'+keyIndex++);
                        pArray.push(OSSUtil.upload(ossKey,key.url));
                        key.url = OSSUtil.formatRemoteUrl(ossKey);
                    });
                });

                let data = {
                    status:this.state.index,
                    comment:this.state.advise.trim(),
                    items:items,
                    feedback:events
                };

                let signature = [];
                this.state.signUriArray.forEach(item=>{
                    let ossImageKey = OSSUtil.formatOssUrl(MODULE_INSPECT,MEDIA_IMAGE,
                        this.store.storeId,+'-1'+keyIndex++);
                    pArray.push(OSSUtil.upload(ossImageKey,item.signUri));
                    signature.push({
                        type: item.signPhoto ? 2 : 1,
                        content: OSSUtil.formatRemoteUrl(ossImageKey)
                    })

                    data.signatures = signature;
                })

                this.refs.indicator.open();

                Promise.all(pArray).then((result) => {
                    HttpUtil.post('${v3.0}/inspect/submit', data)
                        .then(res => {
                            this.refs.indicator.close();
                            PatrolStorage.delete();

                            Actions.push('inspectSuccess',
                                {
                                    data: res.data.notifiedTo,
                                    report:{
                                        id: res.data.inspectId,
                                        date: this.reportTime,
                                        name: this.store.name,
                                        list: this.props.inspectName,
                                        inspector: UserPojo.getUserName(),
                                        type: this.props.inspectType,
                                        result: this.state.index,
                                        points: this.state.totalPoints
                                    }
                                }
                            );
                        })
                        .catch(error => {
                            if(error === 'Inspect item does not exist'){
                                this.enableSubmit = true;
                                this.setState({activeOpacity:0.5});

                                this.refs.indicator.close();
                                Actions.push('submitFailture',{tips:true});
                            }else{
                                this.failPage();
                            }
                        })
                }).catch((error) => {
                    this.failPage();
                })
            }).catch((error)=>{
                this.failPage();
            });
        }catch (e) {
            this.failPage();
        }
    }

    formatData(){
        let items = [];
        try{
            this.reportTime = moment();
            this.data.forEach((item,index)=>{
                    item.items.forEach((key,value)=>{
                        let inspect = {};
                        inspect.ts = this.reportTime.valueOf();
                        inspect.inspectItemId = key.id;
                        inspect.storeId = this.store.storeId;
                        inspect.description = key.comment.trim();
                        inspect.attachment = [];
                        inspect.grade = key.score;

                        if(inspect.grade !== this.score[0].label){
                            (key.audioPath !== '') && (inspect.attachment.push({mediaType:0,url: `file://${key.audioPath}`}));
                            key.attachment.forEach((info)=>{
                                if (info.mediaType !== 0){
                                    let mediaType = (info.mediaType === 1) ? 2 : 1;
                                    (info.mediaPath != null) && inspect.attachment.push({
                                        mediaType: mediaType,
                                        url: info.mediaPath,
                                        deviceId: info.deviceId,
                                    });
                                }
                            })
                        }

                        items.push(inspect);
                    });
                }
            )
        }catch (e) {
        }

        return items;
    }

    formatEvent() {
        let items = [];
        let time = new Date().getTime();
        this.events.forEach((item, index) => {
                let event = {};
                event.ts = time;
                event.subject = item.subject;
                if (item.description != null && item.description != ''){
                    event.description = item.description.trim();
                }
                event.storeId = this.store.storeId;
                event.deviceId = item.deviceId != null ? item.deviceId : -1;
                let attachment = [];
                if (item.audioPath !== null) {
                    attachment.push({mediaType: 0, url: `file://${item.audioPath}`});
                }
                item.attachment.forEach((attach,index)=>{
                    attachment.push({mediaType: attach.mediaType, url: attach.mediaPath});
                });
                event.attachment = attachment;
                items.push(event);
            }
        )
        return items;
    }

    failPage(){
        this.enableSubmit = true;
        this.setState({activeOpacity:0.5});

        this.refs.indicator.close();
        Actions.push('submitFailture');
    }

    renderFocuses = ({ item,index}) => {
        return (
            <View style={styles.itemPanel}>
                <Icon name="circle" style={{color: '#d4dbd5',fontSize: 10,marginTop:3}}/>
                <Text style={styles.itemSubject} numberOfLines={1}>{item.subject}</Text>
            </View>
        )
    };

    renderIgnores = ({ item,index}) => {
        return (
            <View style={styles.itemPanel}>
                <Icon name="circle" style={{color: '#d4dbd5',fontSize: 10,marginTop:3}}/>
                <Text style={styles.itemSubject} numberOfLines={1}>{item.subject}</Text>
            </View>
        )
    };

    renderFeedback = ({ item,index}) => {
        return (
            <View style={{marginBottom: 10}}>
                <View style={styles.itemPanel}>
                    <Icon name="circle" style={{color: '#d4dbd5',fontSize: 10,marginTop:3}}/>
                    <Text style={styles.itemSubject} numberOfLines={1}>{item.subject}</Text>
                </View>
                {/*{*/}
                    {/*item.description !== '' ? <Text style={styles.description}>{item.description}</Text> : null*/}
                {/*}*/}
            </View>
        )
    }

    adviseChanged(text){
        text = StringFilter.all(text,INPUT_TEXT_LEN_MAX);
        this.setState({advise:text},()=>{
            this.refreshCache();
        });
    }

    signCanvas(){
        this.setState({sign:0});
        if(this.state.signUriArray.length >= 4){
            this.refs.toast.show(I18n.t('MaxSign tips'),DURATION.LENGTH_SHORT);
            return false;
        }
        Actions.push('signCanvas');
    }

    signPhoto(){
        this.setState({sign:0});
        if(this.state.signUriArray.length >= 4){
            this.refs.toast.show(I18n.t('MaxSign tips'),DURATION.LENGTH_SHORT);
            return false;
        }
        request(Platform.select({
                android: PERMISSIONS.ANDROID.CAMERA,
                ios: PERMISSIONS.IOS.CAMERA,
            }),
        ).then(result => {
            if (result ===  RESULTS.GRANTED){
                request(Platform.select({
                        android: PERMISSIONS.ANDROID.RECORD_AUDIO,
                        ios: PERMISSIONS.IOS.MICROPHONE,
                    }),
                ).then(result => {
                    if (result ===  RESULTS.GRANTED){
                        const options = {
                            mediaType:'photo',
                            quality:0.8,
                            maxWidth:1080,
                            maxHeight:1080,
                            noData:true,
                            includeExtra:true,
                            storageOptions: {skipBackup:true, path:'images',cameraRoll:false}
                        };
                        launchCamera(options,(response) => {
                            if (response.didCancel || response.error) {}
                            else {
                                const photos = {
                                    signUri:response.uri,
                                    signOrientation:response.height > response.width,
                                    signPhoto:true
                                }
                                this.setState({
                                    signUriArray:[...this.state.signUriArray,photos]
                                },()=>{
                                    this.refreshCache();
                                });
                            }
                        });
                    }
                    else {
                        AlertUtil.alert(I18n.t('Microphone'));
                    }
                });
            }
            else{
                AlertUtil.alert(I18n.t('Camera'));
            }
        });
    }

    render() {
        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.backClick.bind(this)} style={{width:40}}>
                        <Image source={RouteMgr.getRenderIcon()} style={{width:48,height:48}}/>
                    </TouchableOpacity>
                    <View style={{width:width-110,alignItems:'center',justifyContent:'center'}}>
                        <Text style={[styles.NavBarTitle,{marginLeft:25}]}>{I18n.t('Confirm summary')}</Text>
                    </View>
                    <TouchableOpacityEx activeOpacity={this.state.activeOpacity} onPress={this.submitClick.bind(this)}  style={{width:65}}>
                        <Text style={[styles.NavBarTitle,{fontSize:14,marginRight:10,alignSelf:'flex-end',
                            color: (this.state.activeOpacity === 1 ? 'rgba(255,255,255,0.5)' : '#ffffff')}]}>{I18n.t('Submit')}</Text>
                    </TouchableOpacityEx>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                     <Text style={styles.inspectGeneral}>{I18n.t('Overall summary')}</Text>
                     <View style={styles.generalPanel}>
                         {
                             (this.state.summary.findIndex(p => p === 2) !== -1) ? <TouchableOpacity activeOpacity={1} onPress={()=>this.setState({index:2})}>
                                 <View style={this.state.index === 2 ? styles.viewSelected: styles.viewNormal}>
                                     <Text style={this.state.index === 2 ? styles.textSelected : styles.textNormal}>{this.result[2]}</Text>
                                 </View>
                             </TouchableOpacity> : null
                         }
                         {
                             (this.state.summary.findIndex(p => p === 1) !== -1) ? <TouchableOpacity activeOpacity={1} onPress={()=>this.setState({index:1})}>
                                 <View style={this.state.index === 1 ? styles.viewSelected: styles.viewNormal}>
                                     <Text style={this.state.index === 1 ? styles.textSelected : styles.textNormal}>{this.result[1]}</Text>
                                 </View>
                             </TouchableOpacity> : null
                         }
                         {
                             (this.state.summary.findIndex(p => p === 0) !== -1) ? <TouchableOpacity activeOpacity={1} onPress={()=>this.setState({index:0})}>
                                 <View style={this.state.index === 0 ? styles.viewSelected: styles.viewNormal}>
                                     <Text style={this.state.index === 0 ? styles.textSelected : styles.textNormal}>{this.result[0]}</Text>
                                 </View>
                             </TouchableOpacity> : null
                         }
                     </View>

                    <View style={styles.advisePanel}>
                        <Text style={{color:'#ff2400',marginTop:-1}}>*</Text>
                        <Text style={styles.textAdvise}>{I18n.t('Improvement advices')}</Text>
                    </View>
                    <TextInput style={styles.userAdvise}
                               multiline={true}
                               placeholder={I18n.t('Give advices')}
                               autoCorrect={false}
                               autoCapitalize={'none'}
                               returnKeyType={'done'}
                               placeholderTextColor="#dcdcdc"
                               value={this.state.advise}
                               onChangeText={this.adviseChanged.bind(this)}
                        />

                    {
                        (this.signature != null && this.signature === 1) ? <View>
                        <View style={styles.advisePanel}>
                            <Text style={{color:'#ff2400',marginTop:-1}}>*</Text>
                            <Text style={styles.textAdvise}>{I18n.t('Sign manager')}</Text>
                        </View>

                        <View style={{flexDirection:'row',marginLeft:16,marginRight:16,paddingRight:12,marginTop:16,marginBottom:6}}>
                            <TouchableOpacity opacity={0.5} onPressIn={()=>{this.setState({sign:1})}} onPressOut={()=>{this.signCanvas()}}>
                                <View style={this.state.sign == 1 ? {flexDirection:'row',paddingLeft:8,paddingRight:8,width:(width-40)/2,justifyContent:'center',
                                        height:34,borderRadius:4,backgroundColor:ColorStyles.COLOR_MAIN_RED} : {
                                    flexDirection:'row',paddingLeft:8,paddingRight:8,width:(width-40)/2,justifyContent:'center',
                                    height:34,borderRadius:4,borderWidth:1,borderColor:'#dcdcdc'
                                }}>
                                    {
                                        this.state.sign == 1 ? <Image source={require('../assets/images/img_sign_selected.png')} style={{width:16,height:16,alignSelf:'center'}}/>
                                            : <Image source={require('../assets/images/img_sign_normal.png')} style={{width:16,height:16,alignSelf:'center'}}/>
                                    }
                                    <View style={{justifyContent: 'center'}}>
                                        <Text style={this.state.sign == 1 ? {color:'#ffffff',fontSize:12,marginLeft:10,
                                            ...Platform.select({ios:{lineHeight:34}})} : {
                                            color:'#dcdcdc',fontSize:12,marginLeft:10,
                                            ...Platform.select({ios:{lineHeight:34}})
                                        }}>
                                            {I18n.t('Sign writing')}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity opacity={0.5} onPressIn={()=>{this.setState({sign:2})}} onPressOut={()=>{this.signPhoto()}}>
                                <View style={this.state.sign == 2 ? {flexDirection:'row',paddingLeft:8,paddingRight:8,width:(width-40)/2,justifyContent:'center',
                                    height:34,borderRadius:4,backgroundColor:ColorStyles.COLOR_MAIN_RED,marginLeft:7} : {
                                    flexDirection:'row',paddingLeft:8,paddingRight:8,width:(width-40)/2,justifyContent:'center',
                                    height:34,borderRadius:4,borderWidth:1,borderColor:'#dcdcdc',marginLeft:7
                                }}>
                                    {
                                        this.state.sign == 2 ? <Image source={require('../assets/images/img_signcamera_select.png')} style={{width:16,height:16,alignSelf:'center'}}/>
                                            : <Image source={require('../assets/images/img_signcamera_normal.png')} style={{width:16,height:16,alignSelf:'center'}}/>
                                    }
                                    <View style={{justifyContent: 'center'}}>
                                        <Text style={this.state.sign == 2 ? {color:'#ffffff',fontSize:12,marginLeft:10,
                                            ...Platform.select({ios:{lineHeight:34}})} : {
                                            color:'#dcdcdc',fontSize:12,marginLeft:10,
                                            ...Platform.select({ios:{lineHeight:34}})
                                        }}>
                                            {I18n.t('Sign photo')}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <Signature
                            ref={'signature'}
                            data={this.state.signUriArray}
                            editable={true}
                            signUriArray={(sign)=>this.setState({signUriArray: sign})}
                        />
                     </View> : null
                    }
                    <View style={{width:width-32,height:12,backgroundColor:'#f5f5f5',marginTop:16,marginLeft:16,marginBottom: 16}}/>

                    <View style={{height:20,alignItems:'center',justifyContent:'center',flexDirection:'row'}}>
                        <View style={{width:(width-102)/2,height:1,backgroundColor:'#dcdcdc'}}></View>
                        <Text style={{color:'#888c85',fontSize:12,marginLeft:10}}>{I18n.t('Preview')}</Text>
                        <View style={{width:(width-102)/2,height:1,backgroundColor:'#dcdcdc',marginLeft:10}}></View>
                    </View>

                    <View style={styles.storePanel}>
                        <Text style={styles.storeLabel}>{I18n.t('Store')}:</Text>
                        <Text style={styles.storeName} numberOfLines={1}>{this.store.name}</Text>
                    </View>

                    <View style={styles.scorePanel}>
                        <Text style={styles.scoreLabel}>{I18n.t('Inspection score')}</Text>
                        <Text style={styles.scoreSummary}>{this.state.totalPoints}{I18n.t('Points')}</Text>
                    </View>

                    {
                        (this.state.rateTable.length > 0) ? <PatrolTable type={0} data={this.state.rateTable}/> : null
                    }
                    {
                        (this.state.scoreTable.length > 0) ? <PatrolTable type={1} data={this.state.scoreTable}/> : null
                    }
                    {
                        (this.state.appendTable.length > 0) ? <PatrolTable type={2} data={this.state.appendTable}/> : null
                    }

                    <View style={[styles.listPanel,{flexDirection:'row',justifyContent:'space-between'}]}>
                        <Text style={styles.storeLabel} numberOfLines={1}>{I18n.t('Notable items')}</Text>
                        <Text style={styles.storeLabel} numberOfLines={1}>{this.state.focuses.length}{I18n.t('Count')}</Text>
                    </View>
                    <PatrolFocal data={this.state.focuses} type={true}/>

                    <View style={{width:width-32, height:1,backgroundColor:'#dcdcdc',alignSelf:'center'}}/>
                    <View style={[styles.listPanel,{flexDirection:'row',justifyContent:'space-between'}]}>
                        <Text style={styles.storeLabel} numberOfLines={1}>{I18n.t('Feedbacks')}</Text>
                        <Text style={styles.storeLabel} numberOfLines={1}>{this.events.length}{I18n.t('Count')}</Text>
                    </View>
                    <PatrolFeedback data={this.events} />


                    <View style={{width:width-32, height:1,backgroundColor:'#dcdcdc',alignSelf:'center'}}/>
                    <View style={[styles.listPanel,{flexDirection:'row',justifyContent:'space-between'}]}>
                        <Text style={styles.storeLabel} numberOfLines={1}>{I18n.t('Inapplicable items')}</Text>
                        <Text style={styles.storeLabel} numberOfLines={1}>{this.state.ignores.length}{I18n.t('Count')}</Text>
                    </View>
                    <PatrolShow data={this.state.ignores} type={true} feedback={false}/>
                </ScrollView>

                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
                <ProgressIndicator ref={"indicator"} />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    NavBarPanel:{
        flexDirection: 'row',
        height: 48,
        backgroundColor: '#24293d',
    },
    NavBarTitle: {
        fontSize: 18,
        color: '#ffffff',
        height: 48,
        textAlignVertical:'center',
        textAlign: 'center',
        lineHeight: 48
    },
    inspectGeneral:{
        fontSize: 14,
        marginLeft: 16,
        marginTop: 20,
        color: ColorStyles.COLOR_TEXT_BLACK
    },
    generalPanel:{
        width: width-32,
        height: 46,
        marginTop:16,
        flexDirection:'row',
        justifyContent:'flex-start'
    },
    viewNormal:{
        width: (width-64)/3,
        height:46,
        borderRadius:10,
        borderColor:ColorStyles.COLOR_TEXT_DISABLE,
        borderWidth:1,
        backgroundColor: ColorStyles.COLOR_MAIN_WHITE,
        marginLeft:16
    },
    viewSelected:{
        width: (width-64)/3,
        height:46,
        borderRadius:10,
        borderColor:ColorStyles.COLOR_MAIN_RED,
        borderWidth:1,
        backgroundColor: ColorStyles.COLOR_MAIN_RED,
        marginLeft:16
    },
    textNormal:{
        height:46,
        textAlign:'center',
        textAlignVertical:'center',
        fontSize:14,
        color:ColorStyles.COLOR_TEXT_DISABLE,
        ...Platform.select({
            ios:{
                lineHeight:46
            }
        })
    },
    textSelected:{
        height:46,
        textAlign:'center',
        textAlignVertical:'center',
        fontSize:14,
        color:ColorStyles.COLOR_MAIN_WHITE,
        ...Platform.select({
            ios:{
                lineHeight:46
            }
        })
    },
    advisePanel:{
        flexDirection:'row',
        justifyContent:'flex-start',
        marginTop:16,
        marginLeft:16
    },
    textAdvise:{
        fontSize:12,
        color:'#888c95'
    },
    userAdvise:{
        width:width-32,
        height:70,
        borderWidth:1,
        borderRadius:3,
        marginLeft:16,
        marginTop:16,
        paddingLeft:10,
        fontSize:14,
        borderColor:ColorStyles.COLOR_TEXT_DISABLE
    },
    storePanel:{
        flexDirection:'row',
        justifyContent:'flex-start',
        paddingLeft: 16,
        marginTop:20,
        width: width-32,
        paddingRight:16
    },
    storeLabel:{
        fontSize: 14,
        color:'#19293b'
    },
    storeName:{
        fontSize: 14,
        color:'#19293b',
        marginLeft:14
    },
    listPanel:{
        marginTop:14,
        paddingLeft:30,
        paddingRight:26,
        backgroundColor:'#ffffff'
    },
    listDataPanel:{
        marginTop:16,
        backgroundColor:'#ffffff'
    },
    itemPanel:{
        flexDirection:'row',
        justifyContent:'flex-start',
        height:26
    },
    itemSubject:{
        marginLeft:18,
        fontSize:12,
        color:'#888c95',
        marginRight:26
    },
    description:{
        fontSize:12,
        color:'#888c95',
        marginLeft:26
    },
    scorePanel:{
        width: width-32,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 14,
        marginLeft: 16
    },
    scoreLabel:{
        fontSize: 14,
        color: '#232324',
        textAlignVertical:'center'
    },
    scoreSummary:{
        fontSize: 16,
        color: '#f31d65',
        marginLeft: 14,
        textAlignVertical:'center',
        ...Platform.select({
            ios:{
                marginTop:-2
            }
        })
    },
    scoreNote:{
        fontSize: 14,
        color:'#888c95',
        textAlignVertical: 'center',
        marginLeft: 6
    }
});
