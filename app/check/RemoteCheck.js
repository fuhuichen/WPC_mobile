import React, {Component} from 'react';
import {
    ActivityIndicator,
    BackHandler,
    DeviceEventEmitter,
    Dimensions,
    FlatList,
    Image,
    ImageBackground,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Keyboard
} from 'react-native';
import {Actions} from "react-native-router-flux";
import Icon from 'react-native-vector-icons/FontAwesome'
import HttpUtil from "../utils/HttpUtil";
import RecordAudio from '../components/RecordAudio';
import {EMITTER_INSPECT_REMOTE, INSPECT_REMOTE_IMAGE} from "../common/Constant";
import RNStatusBar from '../components/RNStatusBar';
import Toast, {DURATION} from "react-native-easy-toast";
import ScorePicker from '../thirds/scorepicker/ScorePicker';
import ModalCenter from '../components/ModalCenter';
import * as lib from '../common/PositionLib';
import SoundPlayer from "../components/SoundPlayer";
import {ColorStyles} from '../common/ColorStyles';
import InspectDetail from "./InspectDetail";
import I18n from "react-native-i18n";
import StringFilter from "../common/StringFilter";
import RouteMgr from "../notification/RouteMgr";
import GlobalParam from "../common/GlobalParam";
import ScorePickerEx from "../thirds/scorepicker/ScorePickerEx";
import _ from "lodash";
import uuid from 'react-native-uuid';
import SoundUtil from "../utils/SoundUtil";
import dismissKeyboard from "react-native-dismiss-keyboard";
import PatrolParser from "../components/inspect/PatrolParser";
import PatrolStorage from "../components/inspect/PatrolStorage";
import PatrolGrade from "../components/inspect/PatrolGrade";
import PhoneInfo from "../entities/PhoneInfo";
import VideoSwitch from '../video/VideoSwitch';

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
const sessionWidth = 85;
export default class RemoteCheck extends Component {
    constructor(props){
        super(props);

        this.inspectId = (this.props.inspect != null) ? this.props.inspect.id : '';
        this.inspectName = this.props.inspect ? this.props.inspect.name : '';

        this.thumbnailUrl = require('../assets/images/image_videoThumbnail.png');
        this.scrollUrl = this.getDefault();
        this.attachmentId = GlobalParam.getScreenId();

        this.categories = [];
        this.categoryMap = [
            I18n.t('Rate evaluation'),
            I18n.t('Score evaluation'),
            I18n.t('Score append')
        ];
        this.categoryIds = [];
        this.score = PatrolParser.getScore();
        this.cache = {
            advise: '',
            sign: 0,
            signPhoto: false,
            signUri: '',
            signOrientation: 0
        };
        this.inspectSettings = [];

        this.state = {
            isLoading: false,
            noData: null,

            selectedScoreItem: null,
            selectedScoreIndex: null,

            sessionIndex: 0,
            store: this.props.data,

            data:[],
            items:[],
            events:[],
            isCheck: true,
            dashReady:false,
            cameraSession:null,
            cameraItem:null,
            cameraIndex:null,
            enableTouch:false,
            deviceId:-1,
            device:this.props.data.device ? this.props.data.device : [],
            noDataTip: I18n.t('No data'),
            ezvizFullScreen: false,
            videoGuide: true,

            keyboardActive: false,
            showBinds: false,
            bindId: -1,
            binds: [],

            promptContext: '',
            promptEnable: false,
            collection: [],
            unEvaluated: false,
            groups: [],
            groupName: '',
            maxScore: 10,
            showBindsEx:false,
            vendorIndex:0,
            playerMode:0
        };
        this.uuid = uuid.v4();
    }

    getDefault(){
        let pic = null;
        switch(PhoneInfo.getLanguage()) {
            case 'en':
               pic = require('../assets/images/img_patrol_up_en.png');
               break;
            case 'zh-TW':
               pic = require('../assets/images/img_patrol_up_tw.png');
               break;
            case 'zh-CN':
               pic = require('../assets/images/img_patrol_up.png');
               break;
            case 'ja':
               //pic = require('../assets/images/img_patrol_up_ja.png');
               break;
            case 'ko':
               //pic = require('../assets/images/img_patrol_up_ko.png');
               break;
            default:
               pic = require('../assets/images/img_patrol_up_en.png'); 
               break;
       } 
       return pic;
    }

    componentDidMount(){
        this.props.uuid ? this.keepData() : this.fetchData();
    }

    componentWillMount(){
        if (Platform.OS === 'android') {
            this.backEmitter = BackHandler.addEventListener(`remoteInspectBack${this.attachmentId}`,
                this.onBackAndroid);
        }
        this.eventEmitter = DeviceEventEmitter.addListener('onCheckRefresh', (param)=>{
            (GlobalParam.isValidScreen(this.attachmentId)) && this.onRefresh(param);
        });
        this.imageEmitter = DeviceEventEmitter.addListener(INSPECT_REMOTE_IMAGE,(param)=> {
            (GlobalParam.isValidScreen(this.attachmentId)) && this.onImageRefresh(param);
        });
        this.guideEmitter = DeviceEventEmitter.addListener('onGuideClose',()=>{
            this.state.videoGuide && this.setState({videoGuide:false},()=>{this.onPersist()});
        });
        this.attachmentEmitter = DeviceEventEmitter.addListener(`onAttachment${this.attachmentId}`,()=>{
            this.refs.toast.show(I18n.t('Up to 5 attachments'),DURATION.LENGTH_SHORT);
        });

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow',()=>{
            this.setState({keyboardActive: true});
        });
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide',()=>{
            this.setState({keyboardActive: false});
        });

        this.cacheEmitter = DeviceEventEmitter.addListener('onCacheRefresh',(cache, autoState)=>{
            if(GlobalParam.isValidScreen(this.attachmentId)){
                this.cache = cache;
                this.onPersist(autoState);
            }
        });
    }

    componentWillUnmount() {
        lib.isAndroid() && this.backEmitter && this.backEmitter.remove();
        this.eventEmitter && this.eventEmitter.remove();
        this.imageEmitter && this.imageEmitter.remove();
        this.guideEmitter && this.guideEmitter.remove();
        this.attachmentEmitter && this.attachmentEmitter.remove();
        this.cacheEmitter && this.cacheEmitter.remove();

        GlobalParam.clearAttachment(this.attachmentId);
        this.keyboardDidShowListener && this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener && this.keyboardDidHideListener.remove();
    }

    onBackAndroid = () => {
        this.backClick();
        return true;
    };

    onRefresh(addEvent){
        if (addEvent != null){
            let events = this.state.events;
            if(addEvent.index == -1){
                events.push(addEvent.data);
            }
            else{
                events[addEvent.index] = addEvent.data;
            }
            this.setState({events:events},()=>{
                this.onPersist();
            });
        }
    }

    onImageRefresh(path){
        if(path != null){
            let item = this.state.cameraItem;
            let index = this.state.cameraIndex;
            this.showPicture(path,item,index);
        }else{
            Actions.pop();
        }
    }

    keepData(){
        try{
            this.uuid = this.props.uuid;
            let data = PatrolStorage.get(this.uuid);
            let state = data ? PatrolStorage.parseState(data) : null;

            state && this.setState({
                isLoading: true,
                noData: null,
                events: state.events,
                sessionIndex: state.sessionIndex,
                store: state.store,
                videoGuide: state.videoGuide,
                device: state.store.device,
                groupName: state.groupName,
                cameraSession: state.camera.session,
                cameraIndex: state.camera.index,
                binds: state.camera.binds,
                bindId: state.camera.bindId,
                showBinds: state.camera.showBinds
            },()=>{
                let deviceIndex = state.store.device.map(key=>key.id===state.camera.bindId).indexOf(true);
                this.compute(state.data,false,deviceIndex);

                let session = this.state.cameraSession;
                let index = this.state.cameraIndex;
                (session != null && index != null) && this.setState({
                    cameraItem: this.categories[session].items[index]
                });
                this.inspectSettings = state ? state.inspectSettings : [];
                this.inspectName = state ? state.inspectName : '';
            });

            this.cache = state ? state.cache : this.cache;
        }catch (e) {
        }
    }

    fetchData(){
        try {
            GlobalParam.setAttachment(this.attachmentId,0);

            this.initState(true,null);
            HttpUtil.get("${v3.0}"+`/inspect/checkout?storeId=${this.state.store.storeId}&mode=0&inspectId=${this.inspectId}`)
                .then(result => {
                    this.inspectSettings = result.data.inspectSettings;
                    this.compute(result.data.groups, true,0);
                })
                .catch(error=>{
                    this.initState(false,true);
                })
        }catch (e) {
            this.initState(false,true);
            console.log("RemoteCheck-fetchData:" + e);
        }
    }

    initState(isLoading,noData){
        this.setState({isLoading,noData});
    }

    compute(data, flush,deviceIndex){
        this.categoryMap.forEach((item,index)=>{
            this.getCategories(data,item,index);
        });

        if (this.categories.length > 0){
            this.categories.push({
                items: [],
                category: I18n.t('Other'),
                groups: [I18n.t('Feedbacks')]
            });
        }

        this.formatPrompt();

        let items = [], groups = [], groupName = '';
        let session = this.state.sessionIndex;
        if (this.categories.length > 0 && (session !== this.categories.length-1)){
            groups = this.categories[session].groups;
            groupName = (this.state.groupName !== '') ? this.state.groupName
                : (groups.length > 0 ? groups[0] : '');
            items = this.categories[session].items.filter(p => p.groupName === groupName);
        }

        this.setState({
            isLoading: false,
            srcData: data,
            data: this.categories,
            items: items,
            groups: groups,
            groupName: groupName,
            noData: this.categories.length !== 0 ? null : true,
            noDataTip: this.categories.length === 0 ? I18n.t('No Items') : this.state.noDataTip,
            isCheck: (session === this.categories.length-1) ? false : true
        },()=>{
            this.refs.VideoSwitch.initPlayer(deviceIndex);
            flush && this.onPersist();
        });
    }

    onPersist(autoState = true){
        let cache = JSON.stringify({
            data: PatrolParser.deCycle(this.state.srcData),
            store: this.state.store,
            sessionIndex: this.state.sessionIndex,
            events: this.state.events,
            cache: this.cache,
            groupName: this.state.groupName,
            videoGuide: this.state.videoGuide,
            camera:{
                session: this.state.cameraSession,
                index: this.state.cameraIndex,
                binds: this.state.binds,
                bindId: this.state.bindId,
                showBinds: this.state.showBinds
            },
            inspectSettings: this.inspectSettings,
            inspectName: this.inspectName
        });

        PatrolStorage.save({
            uuid: this.uuid,
            mode: 0,
            storeName: this.state.store.name,
            tagName: this.inspectName,
            autoState: autoState ? cache : '',
            manualState: !autoState ? cache : ''
        });
    }

    getCategories(data, category,index) {
        let groups = [], items = [], patrolRate = [], subIndex = -1;
        let categories = data.filter(p => p.type === index);
        categories.forEach((item) => {
            groups.push(item.groupName);
            item.items.forEach((key) => {
                key.mode = (key.mode != null) ? key.mode : item.mode;
                key.groupName = item.groupName;
                key.parentId = index;
                key.subIndex = ++subIndex;
                key.attachment = key.attachment ? key.attachment : [];
                key.score = (key.score != null) ? (((typeof key.score) === 'string') ? Number(key.score)
                    : key.score) : this.score[0].label;
                key.maxScore = (key.itemScore != null) ? key.itemScore : 10;
                key.audioPath = key.audioPath ? key.audioPath : '';
                key.comment = key.comment ? key.comment : '';
                key.mark = (key.mark != null) ? key.mark : true;
                key.availableScores = (key.availableScores != null) ? key.availableScores : [];

                items.push(key);
            });

            patrolRate.push({
                numerator: item.items.filter(p => p.score !== this.score[0].label || !p.mark).length,
                denominator: item.items.length,
            });
        });

        (items.length > 0) && this.categories.push({
            category: category,
            groups: groups,
            majorKey: index,
            items: items,
            patrolRate: patrolRate
        });

        (items.length > 0) && this.categoryIds.push({
            key: this.categories.length -1,
            value: index
        });
    }

    formatPrompt(){
        let promptContext = '';
        let promptEnable = true;

        let categories = (this.state.data.length > 0) ? this.state.data : this.categories;
        const handleCount = categories.reduce((p,e) => p + ((e.majorKey < 3) ?
            e.items.filter(v => v.score !== this.score[0].label).length : 0), 0);
        if (handleCount === 0){
            promptContext = I18n.t('Prompt all');
            promptEnable = false;
        }

        const autoIgnored = categories.reduce((p,e) => p + ((e.majorKey < 3) ?
            e.items.filter(v => (v.score === this.score[0].label) && v.mark).length : 0), 0);
        if (promptContext === '' && autoIgnored !== 0){
            promptContext = I18n.t('Unevaluated view');
        }

        (this.state.sessionIndex === this.state.data.length-1) ? (promptContext = '') : null;
        this.setState({promptContext,promptEnable});
    }

    submitClick() {
        try {
            let data = this.state.data, ignoredCount = 0;
            data.forEach((item)=>{
                ignoredCount += item.items.reduce((p,e) => p + (((e.score === this.score[0].label) && e.mark) ? 1 : 0), 0);
            });

            (ignoredCount === 0) ? this.onSummary()
                : this.refs.incomplete.open();
        }catch (e) {
        }
    }

    onSummary(){
        this.refs.VideoSwitch.onPauseStatus(1);
        Actions.push('inspectSummary',
            {
                data: JSON.parse(JSON.stringify(this.state.srcData)),
                events: this.state.events,
                store: this.state.store,
                cache: this.cache,
                score: this.score,
                inspectSettings: this.inspectSettings,
                inspectId: this.inspectId,
                inspectName: this.inspectName,
                inspectType: 0,
                uuid: this.uuid
            }
        );
    }

    storeChanged(){
        if (this.state.noData == null){
            this.refs.switch.open();
        }else{
            this.switchConfirm();
        }
    }

    sessionClick (item,index) {
        if (this.state.sessionIndex === index){
            return;
        }

        let data = this.state.data;
        let isCheck = (index == data.length - 1) ? false : true;
        let groupName = '', items = [];
        (isCheck && data[index].groups.length > 0) ? (groupName = data[index].groups[0])
            : (groupName = '');
        items = data[index].items.filter(p => p.groupName === groupName);

        this.setState({
                sessionIndex: index,
                items: items,
                groups: isCheck ? data[index].groups : [],
                groupName: groupName,
                isCheck:isCheck,
                showBinds: (this.state.cameraSession === index) ? true : false,
                videoGuide: false
        },()=>{
            this.onPersist();
            this.formatPrompt();
        });

        if(isCheck) {
            setTimeout(() => {
                this.scroll && this.scroll.scrollTo({x: 0, y: 0, animated: true});
            }, 200);

            if(this.state.cameraIndex != null){
                let cameraIndex = this.state.cameraIndex;
                let items = this.state.data[index].items[cameraIndex];
                let count = (items != null) ? items.attachment.length : 0;
                GlobalParam.setAttachment(this.attachmentId, count);
            }
        }

        !isCheck && GlobalParam.setAttachment(this.attachmentId,0);
    }

    pushEvent(item,index){
        let pic = item.attachment.find(p => p.mediaType == 2);
        if (pic != null){
            Actions.push('createCheckEvent',{uri:pic.mediaPath,data:item,index:index,camera:false,deviceId:this.state.deviceId});
        }
        let video = item.attachment.find(p => p.mediaType == 1);
        if (video != null){
            Actions.push('createCheckEvent',{videoUri:video.mediaPath,data:item,index:index,camera:false,deviceId:this.state.deviceId});
        };
        if(pic == null && video == null){
            Actions.push('createCheckEvent',{camera:false,deviceId:-1,data:item,index:index});
        }    
    }

    removeEvent(item,index){
        let events = this.state.events;
        events.splice(index,1);
        this.setState({events:events},()=>{
            this.onPersist();
        });
    }

    scoreChange(item,index,score){
        let data = this.state.data;
        if (!this.state.unEvaluated){
            let session = this.state.sessionIndex;
            let oldScore = item.score;

            item.score = score;
            data[session].items[index] = item;

            if(score === this.score[0].label){
                data[session].numerator--;
            }else if(oldScore === this.score[0].label){
                data[session].numerator++;
            }
        }else {
            let categories = data.filter(p => p.majorKey === item.parentId);
            (categories.length > 0) && categories.forEach((_item)=>{
                let original = _item.items.findIndex(p => p.id === item.id);
                if (original !== -1) {
                    let oldScore = _item.items[original].score;
                    _item.items[original].score = score;

                    if(score === this.score[0].label){
                        _item.numerator--;
                    }else if(oldScore === this.score[0].label){
                        _item.numerator++;
                    }
                }
            })
        }

        // Display patrol rate
        data = this.onPatrolRate(data,item);
        this.setState({data},()=>{
            this.onPersist();
            this.formatPrompt();
        });
    }

    onPatrolRate(data,item){
        let categories = data.filter(p => p.majorKey === item.parentId);
        let rateKey = categories[0].groups.findIndex(p => p === item.groupName);
        let groups = categories[0].items.filter(p => p.groupName === item.groupName);
        let numerator = groups.reduce((p,e) => p + (((e.score !== this.score[0].label) || !e.mark) ? 1 : 0), 0);
        categories[0].patrolRate[rateKey].numerator = numerator;

        return data;
    }

    renderGroups(category,groups,patrolRate,sessionSelect){
        const isCheck = (category !== this.state.data.length-1) ? true : false;
        const margin = lib.isAndroid() ? {marginTop: isCheck ? 8 : 16} : {marginTop: isCheck ? 12 : 19};
        const padding = lib.isAndroid() ? 6 : 3;
        return <View>
            {
                groups.map((item,index) => {
                    const groupSelect = (sessionSelect && (this.state.groupName === item || !isCheck)) ? true : false;
                    const groupStyles = {height:50,alignItems:'center',backgroundColor: groupSelect ? '#ffffff' : null,
                        paddingLeft:padding,paddingRight: padding};
                    return <TouchableOpacity activeOpacity={1} onPress={()=>{this.onGroup(category,item)}}>
                        <View style={groupStyles}>
                            <Text numberOfLines={1} style={!groupSelect ? [styles.sessionNameNormal,margin]
                                : [styles.sessionNameSelected,margin]}>
                                {item}
                            </Text>
                            {
                                isCheck ? <Text numberOfLines={1} style={!groupSelect ? styles.sessionNumberNormal :
                                    styles.sessionNumberSelected}>
                                    ({patrolRate[index].numerator}/{patrolRate[index].denominator})
                                </Text> : null
                            }
                        </View>
                    </TouchableOpacity>
                })
            }
        </View>
    }

    renderRow = ({ item,index}) => {
        const padding = lib.isAndroid() ? 6 : 3;
        const sessionSelect = (this.state.sessionIndex === index) ? true : false;
        const panelStyles = {height: 25, backgroundColor: sessionSelect ? '#fef3f7' : '#e5e8ef',
            paddingLeft:padding,paddingRight:padding};
        const contentColor = {color: sessionSelect ?  ColorStyles.COLOR_MAIN_RED : '#989ba3'};
        const contentStyles = {height: 25, lineHeight: 25, textAlignVertical:'center', fontSize:12,...contentColor};

        return (<View>
                <View style={panelStyles}>
                    <Text style={contentStyles}>{item.category}</Text>
                </View>
                {this.renderGroups(index,item.groups,item.patrolRate,sessionSelect)}
            </View>
        )
    };

    scoreClick(item,index){
        this.setState({
            selectedScoreItem:item,
            selectedScoreIndex:index
        },()=>{
            let availableScores = (item.availableScores.length > 0) ? item.availableScores
                :  (_.range(0,item.maxScore+1).reverse());
            this.setState({maxScore: availableScores},()=>{
                this.refs.scorePickerEx.open(item.score);
            });
            this.onPersist();
        });
    }

    scoreSelected(score){
        let item = this.state.selectedScoreItem;
        let index = this.state.selectedScoreIndex;

        if(item !== null && index !== null){
            this.scoreChange(item,item.subIndex,score);
        }
    }

    groupSelected(name){
        if (this.state.groupName !== name){
            this.setState({groupName: name});

            let data = this.state.data;
            let index = this.state.sessionIndex;
            let items = data[index].items.filter(p => p.groupName === name);

            this.setState({items});
        }
    }

    audioClick(audioPath,item,index){
        try {
            let data = this.state.data;
            if (!this.state.unEvaluated){
                let session = this.state.sessionIndex;
                item.audioPath = audioPath;
                data[session].items[index] = item;
            }else {
                let categories = data.filter(p => p.majorKey === item.parentId);
                (categories.length > 0) && categories.forEach((_item)=>{
                    let original = _item.items.findIndex(p => p.id === item.id);

                    (original !== -1) && (_item.items[original].audioPath = audioPath);
                })
            }

            this.setState({data},()=>{
                this.onPersist();
            });
        }catch (e) {
            console.log("RemoteCheck-audioClick:" + e);
        }
    }

    showPicture(path,item){
        try {
            if (this.state.isCheck){
                Actions.pop();
                let data = this.state.data, category = -1;

                if (!this.state.unEvaluated){
                    category = this.state.cameraSession;
                    item.attachment.unshift({
                        mediaPath: path,
                        mediaType: 1,
                        id: item.id,
                        subIndex: item.subIndex,
                        parentId: item.parentId,
                        deviceId: this.state.bindId
                    });
                    data[category].items[item.subIndex] = item;
                }else {
                    category = this.getSession(item.parentId);
                    let categories = data.filter(p => p.majorKey === item.parentId);
                    (categories.length > 0) && categories.forEach((_item)=>{
                        let original = _item.items.findIndex(p => p.id === item.id);
                        let size = (original !== -1) ?_item.items[original].attachment.length-1 : 0;
                        (original !== -1) && _item.items[original].attachment.unshift({
                            id: item.id,
                            parentId: item.parentId,
                            mediaPath: path,
                            mediaType: 1,
                            subIndex: item.subIndex,
                            deviceId: this.state.bindId
                        });
                    });
                }

                this.setState({data},()=>{
                    (category !== -1) && this.setAttachment(category,item.subIndex);
                    this.onPersist();
                });
            }
            else {
                this.refs.VideoSwitch.onPauseStatus(1);
                Actions.replace('createCheckEvent',{uri:path,camera:false,deviceId:this.state.deviceId});
            }
        } catch (e) {
            console.log("RemoteCheck-showPicture:" + e);
        }
    }

    showVideo(path,item){
        try {
            if (this.state.isCheck){
                let data = this.state.data, category = -1;

                if (!this.state.unEvaluated){
                    category = this.state.cameraSession;
                    let videos = item.attachment.filter(p => p.mediaType == 2);
                    if (videos.length >= GlobalParam.MAX_VIDEO){
                        this.refs.toast.show(I18n.t('Video limit'), 3000);
                        return;
                    }
                    item.attachment.unshift({
                        mediaPath: path,
                        mediaType: 2,
                        id: item.id,
                        parentId: item.parentId,
                        subIndex: item.subIndex,
                        deviceId: this.state.bindId
                    });

                    data[category].items[item.subIndex] = item;
                }else {
                    category = this.getSession(item.parentId);
                    let categories = data.filter(p => p.majorKey === item.parentId);
                    (categories.length > 0) && categories.forEach((_item)=>{
                        let original = _item.items.findIndex(p => p.id === item.id);
                        let size = (original !== -1) ?_item.items[original].attachment.length-1 : 0;
                        if(original !== -1){
                            let videos = _item.items[original].attachment.filter(p => p.mediaType == 2);
                            if (videos.length >= GlobalParam.MAX_VIDEO){
                                this.refs.toast.show(I18n.t('Video limit'), 3000);
                                return;
                            }
                            else{
                                _item.items[original].attachment.unshift({
                                    id: item.id,
                                    parentId: item.parentId,
                                    mediaPath: path,
                                    mediaType: 2,
                                    subIndex: item.subIndex,
                                    deviceId: this.state.bindId
                                });
                            }
                        }
                    })
                }

                this.setState({data},()=>{
                    (category !== -1) && this.setAttachment(category,item.subIndex);
                    this.onPersist();
                });
            }
            else {
                this.refs.VideoSwitch.onPauseStatus(1);
                Actions.push('createCheckEvent',{videoUri:path,camera:false,deviceId:this.state.deviceId});
            }
        }catch (e) {
            console.log("RemoteCheck-showVideo:" + e);
        }
    }

    audioDelete(item,index){
        this.audioClick('', item, index);
    }

    mediaDelete(item,index){
        try {
            let data = this.state.data, category = -1, count = 0;
            if (!this.state.unEvaluated){
                category = this.state.sessionIndex;
                data[category].items[item.subIndex].attachment.splice(index,1);

                count = data[category].items[item.subIndex].attachment.length;
            }else {
                category = this.getSession(item.parentId);
                let categories = data.filter(p => p.majorKey === item.parentId);
                (categories.length > 0) && categories.forEach((_item)=>{
                    let original = _item.items.findIndex(p => p.id === item.id);
                    (original !== -1) && _item.items[original].attachment.splice(index, 1);
                });

                count = data[category].items[item.subIndex].attachment.length;
            }

            this.setState({data},()=>{
                (category !== -1) && GlobalParam.setAttachment(this.attachmentId,count);
                this.onPersist();
            });
        }catch (e) {
            console.log("RemoteCheck-mediaDelete:" + e);
        }
    }

    onDescriptionChange(text,item){
        let data = this.state.data;
        let comment = StringFilter.all(text,200);

        if (!this.state.unEvaluated){
            let session = this.state.sessionIndex;
            item.comment = comment;
            data[session].items[item.subIndex] = item;
        }else {
            let categories = data.filter(p => p.majorKey === item.parentId);
            (categories.length > 0) && categories.forEach((_item)=>{
                let original = _item.items.findIndex(p => p.id === item.id);
                (original !== -1) && (_item.items[original].comment = comment);
            })
        }

        this.setState({data},()=>{
            this.onPersist();
        });
    }

    onGoRecord(item){
        let data = this.state.data;
        if (!this.state.unEvaluated){
            let session = this.state.sessionIndex;
            item.isTextDescription = false;
            data[session].items[item.subIndex] = item;
        }else {
            let categories = data.filter(p => p.majorKey === item.parentId);
            (categories.length > 0) && categories.forEach((_item)=>{
                let original = _item.items.findIndex(p => p.id === item.id);
                (original !== -1) && (_item.items[original].isTextDescription = false);
            })
        }

        this.setState({data},()=>{
            this.onPersist();
        });
    }

    onGoText(item){
        let data = this.state.data;
        if (!this.state.unEvaluated){
            let session = this.state.sessionIndex;
            item.isTextDescription = true;
            data[session].items[item.subIndex] = item;
        }else {
            let categories = data.filter(p => p.majorKey === item.parentId);
            (categories.length > 0) && categories.forEach((_item)=>{
                let original = _item.items.findIndex(p => p.id === item.id);
                (original !== -1) && (_item.items[original].isTextDescription = true);
            })
        }

        this.setState({data},()=>{
            this.onPersist();
        });
    }

    onGroup(category,name){
        if (this.state.sessionIndex !== category || this.state.groupName !== name){
            let data = this.state.data;
            let items = data[category].items.filter(p => p.groupName === name);
            let isCheck = (category !== data.length-1) ? true : false;

            const cameraItem = this.state.cameraItem;
            const index = this.state.cameraSession;
            this.setState({
                sessionIndex: category,
                groupName: isCheck ? name : '',
                items: items,
                isCheck: isCheck,
                showBinds: ((index === category) && cameraItem != null && cameraItem.check) ? true : false,
                videoGuide: false
            },()=>{
                this.onPersist();
                this.formatPrompt();
            });

            if(isCheck) {
                setTimeout(() => {
                    this.scroll && this.scroll.scrollTo({x: 0, y: 0, animated: true});
                }, 200);

                if(this.state.cameraIndex != null){
                    let cameraIndex = this.state.cameraIndex;
                    let items = data[category].items[cameraIndex];
                    let count = (items != null) ? items.attachment.length : 0;
                    GlobalParam.setAttachment(this.attachmentId, count);
                }
            }

            !isCheck && GlobalParam.setAttachment(this.attachmentId,0);
        }
    }

    onEvent(category){
        this.setState({
            sessionIndex: category,
            groupName: '',
            items: [],
            isCheck: false
        },()=>{
            this.onPersist();
            this.formatPrompt();
        });
    }

    renderLoadingView() {
        return (
            <View style={{justifyContent:'center',alignSelf:'center'}}>
                <ActivityIndicator
                    animating={true}
                    color='#dcdcdc'
                    size="large"
                />
                <Text style={{textAlign:'center'}}>{I18n.t('Loading')}</Text>
            </View>
        );
    }

    playVideo(item,unEvaluated){
        try {
            let data = this.state.data;
            let category = !this.state.unEvaluated ? this.state.sessionIndex : this.getSession(item.parentId);
            (category !== -1) && data.forEach((itemData, indexData) => {
                itemData.items.forEach((itemChild, indexChild) => {
                    itemChild.check = (indexData == category && indexChild == item.subIndex) ? true: false;
                });
            });

            let device = this.state.device;
            let deviceId = (item.deviceIds.length > 0) ? item.deviceIds[0] : -1;
            let channelIndex = device.findIndex((key)=>key.id === deviceId);
            if(channelIndex !== -1){
                let thisDevice = device[channelIndex];
                this.state.dashReady && this.refs.VideoSwitch.startPlay(thisDevice.ivsId,thisDevice.channelId);

                device.forEach((itemChild, indexChild) => {
                    itemChild.check = indexChild == channelIndex? true: false;
                });
                deviceId = device[channelIndex].id;
            }
            else {
                deviceId = this.state.deviceId;
                this.refs.toast.show(I18n.t('Na cameras inspect'), 3000);
            }

            this.setState({
                cameraSession: !unEvaluated ? this.state.sessionIndex
                    : this.getSession(item.parentId),
                cameraItem:item,
                cameraIndex:item.subIndex,
                data,
                device,
                deviceId
            },()=>{
                this.onPersist();
            });
        }catch (e) {
        }
    }

    viewPicture(uri){
        this.refs.VideoSwitch.onPauseStatus(1);
        Actions.push('pictureViewer',{uri: uri});
    }

    playRecord(uri){
        this.refs.VideoSwitch.onPauseStatus(1);
        Actions.push('videoPlayer',{uri: uri});
    }

    onSubject(item,index){
        let unEvaluated = this.state.unEvaluated;
        let sessionIndex = !unEvaluated ? this.state.sessionIndex : this.getSession(item.parentId);
        this.state.videoGuide && this.setState({videoGuide:false});
        this.parseBinds(item, unEvaluated);
        this.setAttachment(sessionIndex,item.subIndex);
        this.playVideo(item,unEvaluated);
    }

    getSession(value){
        return (this.categoryIds.filter(p => p.value === value))[0].key;
    }

    parseBinds(item,unEvaluated){
        let binds = [];
        let bindId = -1;
        let devices = this.state.store.device;
        let ids = [];
        item.deviceIds.forEach((value,index)=>{
            let id = devices.findIndex((key,index)=>key.id === value);
            (index == 0) ? (devices[id].check = true) : (devices[id].check = false);
            (index == 0) ? (bindId = value) : null;
            binds.push(devices[id]);
            ids.push(id);
        });
        if(ids.length !== 0 && devices[ids[0]].vendor !== this.state.playerMode){
            this.refs.VideoSwitch.initPlayer(ids[0]);
            this.setState({vendorIndex:ids[0]})
        }

        this.setState({
            showBinds: !unEvaluated ? true : this.state.showBinds,
            showBindsEx: !unEvaluated ? this.state.showBindsEx : ((binds.length > 0) ? true : false),
            binds,
            bindId
        });
    }

    setAttachment(item,index){
        let data = this.state.data;
        let items = data[item].items[index];
        GlobalParam.setAttachment(this.attachmentId, items.attachment.length);
    }

    onGrade(item,index,grade){
        this.scoreChange(item,item.subIndex,grade);
    }

    renderItem = ({ item,index}) => {
        let audio = null;
        let audioDelete = null;
        if (item.audioPath != ''){ audioDelete = (
            <TouchableOpacity activeOpcity={0.5} onPress={()=>this.audioDelete(item,index)}>
                <Image style={{width:24,height:24,marginLeft:8}} source={require('../assets/images/img_audio_delete.png')}></Image>
            </TouchableOpacity>
        )}

        if (item.isTextDescription == true){ audio = (
            <View style={{flexDirection: 'row',alignItems:'center',justifyContent:'space-between',marginTop:10}}>
                <TextInput onFocus={()=>{this.setState({videoGuide:false},()=>{this.onPersist()})}}
                           style={styles.issueDescription} multiline={true} value={item.comment}
                           onChangeText={(text)=>this.onDescriptionChange(text,item,index)} placeholder={I18n.t('Enter info')}/>
                <TouchableOpacity onPress={()=>this.onGoRecord(item,index)}>
                    <Image  style={styles.audioIcon} source={require('../assets/images/text_icon_normal.png')}/>
                </TouchableOpacity>
            </View>
        )}
        else { audio = (
            <View style={{flexDirection: 'row',alignItems:'center',justifyContent:'space-between',marginTop:10}}>
                <View style={styles.audioPanel}>
                    <SoundPlayer path={item.audioPath} maxLength={140} input={true}/>
                    {audioDelete}
                </View>
                <View style={styles.audioIcon}>
                    <RecordAudio audioPressOut={(audioPath)=>{this.audioClick(audioPath,item,index)}} onPress={()=>this.onGoText(item,index)} size={40}/>
                </View>
            </View>
        )}

        let scoreValue = ((item.parentId === 1) && (item.score === this.score[0].label)) ? this.score[0].score : item.score;
        let margin = ((item.parentId === 1) && (item.score !== this.score[0].label)) ? -2 : 0;

        let grade = null;
        if (item.parentId === 1){
            grade = item.check ? <View style={styles.scorePanel}>
                <Text style={styles.scoreLabel}>{I18n.t('Score')}</Text>
                <TouchableOpacity activeOpacity={0.5} onPress={this.scoreClick.bind(this,item,index)}>
                    <View style={styles.scoreItem}>
                        <Text style={[styles.scoreData,{width:40,margin:margin}]}>{scoreValue}</Text>
                        <Icon style={[styles.scoreIcon,{width:6}]} name="angle-right" size={16} color="#ffffff"/>
                    </View>
                </TouchableOpacity>
            </View> : <View style={styles.scorePanel}>
                <Text style={styles.scoreLabel}>{I18n.t('Score')}</Text>
                <View style={styles.scoreItem}>
                    <Text style={[styles.scoreData,{width:40,margin:margin}]}>{scoreValue}</Text>
                    <Icon style={[styles.scoreIcon,{width:6}]} name="angle-right" size={16} color="#ffffff"/>
                </View>
            </View>
        }else {
            grade = <PatrolGrade onGrade={(grade)=>{this.onGrade(item,index,grade)}} score={scoreValue} enable={item.check}/>
        }

        const dynamic = {opacity: item.mark ? 1 : 0.45, fontWeight: item.check ? 'bold' : 'normal'};
        const paddingRight = (item.parentId === 1) ? 0 : 7;
        return (
            <View style={styles.itemPanel}>
                <View style={[styles.rowPanel,{paddingRight:5}]}>
                    <TouchableOpacity activeOpacity={item.mark ? 0.5 : 1} onPress={()=>{item.mark ? this.onSubject(item,index) : null}}>
                        <Text style={[styles.itemSubject,{width:width-sessionWidth-32-40,marginRight:10,fontWeight:dynamic.fontWeight,
                            opacity: dynamic.opacity}]} numberOfLines={1}>
                            {index+1}.{item.subject}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.onMark.bind(this,item,index)}>
                        <Image style={styles.itemIgnore} source={item.mark ? require('../assets/images/img_patrol_ignore.png')
                            : require('../assets/images/img_patrol_recover.png')}/>
                    </TouchableOpacity>
                </View>


                <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:3,opacity:dynamic.opacity,paddingRight}}>
                    <TouchableOpacity activeOpacity={(item.mark && item.check) ? 0.5 : 1}
                                      onPress={()=>{(item.mark && item.check) ? this.inspectDetail.open(`${index+1}.${item.subject}`,item.description) : null}}>
                        <Text style={{fontSize:12,color:'#6097f4',textDecorationLine:'underline'}}>
                            {I18n.t('Inspection details')}
                        </Text>
                    </TouchableOpacity>
                    {grade}
                </View>

                <View style={[styles.rowPanel,{marginTop:12,height:60}]}>
                    {
                        (item.attachment.length === 0) ? <Image style={{width:80,height:60,opacity:item.mark ? 0.6 : 0.45}}
                                source={require('../assets/images/img_media_default.png')}/>
                            :  <FlatList style={{height:60}}
                                         data={item.attachment}
                                         extraData={this.state}
                                         keyExtractor={(item, index) => item.toString()}
                                         renderItem={this.renderAttachment}
                                         horizontal={true}
                                         showsHorizontalScrollIndicator={false}
                            />
                    }
                </View>
                {
                    (!item.mark || !item.check) ? <View style={{flexDirection: 'row',alignItems:'center',justifyContent:'space-between',marginTop:10,
                        opacity: dynamic.opacity}}>
                        <View style={styles.audioPanel}>
                            <SoundPlayer path={item.audioPath} maxLength={140} input={true}/>
                            {audioDelete}
                        </View>
                        <View style={styles.audioIcon}>
                            <RecordAudio disable={true} size={40}/>
                        </View>
                    </View> : audio
                }
            </View>
        )
    };

    onFullPictureEvent(subIndex,path){
        let picList = [];
        this.state.events[subIndex].attachment.forEach(item => {
            if (item.mediaType === 2){
                picList.push(item.mediaPath);
            }
        });
        let index = picList.findIndex(p => p == path);
        Actions.push('pictureViewer',{uri: picList, index:index});
    }

    renderEventAttach(item,subIndex) {
        let attachment = item.attachment;
        if (attachment != null && attachment.length > 0){
            return attachment.map((item,index) => {
                if(item.mediaType === 1){
                    return (
                        <View style={[styles.rowPanel,{marginTop:12,marginRight:10}]}>
                        <ImageBackground style={{width:80,height:60,alignItems:'center'}} source={this.thumbnailUrl} resizeMode='cover'>
                            <TouchableOpacity onPress={() => Actions.push('videoPlayer',{uri: item.mediaPath})}>
                                <Image style={{width:20,height:20,marginTop:22}} source={require('../assets/images/pic_play_icon.png')} resizeMode='contain'/>
                            </TouchableOpacity>
                        </ImageBackground>
                        </View>
                    );
                }
                else if (item.mediaType === 2){
                    return (
                        <View style={[styles.rowPanel,{marginTop:12,marginRight:10}]}>
                        <TouchableOpacity onPress={() => this.onFullPictureEvent(subIndex,item.mediaPath)}>
                           <Image style={{width:80,height:60}} source={{uri: item.mediaPath}} resizeMode='stretch'/>
                        </TouchableOpacity>
                    </View>
                    );
                }
            });
        }
    }

    renderEvent = ({ item,index}) => {
        let description = null;
        if (item.description != null && item.description != ''){ description  = (
            <View style={[styles.rowPanel,{marginTop:10}]}>
                <Text style={styles.scoreLabel}>{item.description}</Text>
            </View>
        )
        }

        let audio = null;
        if (item.audioPath != null){ audio  = (
            <View style={[styles.rowPanel,{marginTop:10}]}>
                <View style={styles.audioPanel}>
                    <SoundPlayer path={item.audioPath} maxLength={140}/>
                </View>
            </View>
        )
        }
        return (
            <View style={[styles.itemPanel,{marginBottom:5}]}>
                <View style={styles.rowPanel}>
                     <TouchableOpacity activeOpacity={0.5} onPress={this.pushEvent.bind(this,item,index)}>
                        <Text style={styles.itemSubject} numberOfLines={1}>{index+1}.{item.subject}</Text>
                    </TouchableOpacity>   
                    <TouchableOpacity activeOpacity={0.5} onPress={this.removeEvent.bind(this,item,index)}>
                        <Image style={styles.itemIgnore} source={require('../assets/images/img_audio_delete.png')}/>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    {this.renderEventAttach(item,index)}
                 </ScrollView>
                {description}
                {audio}
            </View>
        )
    };

    renderChannel = ({ item,index }) => {
        let source = item.check ? require('../assets/images/img_channel_check.png'):require('../assets/images/img_channel_normal.png');
        let color =  item.check ? '#57E78F':'#989ba3';
        return (
            <TouchableOpacity style={{marginRight:10}} onPress={()=>this.channelClick(item,index,true)}>
                <Image source={source} style={styles.itemImage}/>
                <Text style={[styles.itemName,{color: color}]} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
        )
    };

    renderItemEx = ({ item,index}) => {
        let audio = null;
        let audioDelete = null;
        if (item.audioPath != ''){ audioDelete = (
            <TouchableOpacity activeOpcity={0.5} onPress={()=>this.audioDelete(item,index)}>
                <Image style={{width:24,height:24,marginLeft:8}} source={require('../assets/images/img_audio_delete.png')}></Image>
            </TouchableOpacity>
        )}

        if (item.isTextDescription == true){ audio = (
            <View style={{flexDirection: 'row',alignItems:'center',justifyContent:'space-between',marginTop:10}}>
                <TextInput onFocus={()=>{this.setState({videoGuide:false},()=>{this.onPersist()})}}
                    style={styles.issueDescription} multiline={true} value={item.comment}
                    onChangeText={(text)=>this.onDescriptionChange(text,item,index)} placeholder={I18n.t('Enter info')}/>
                <TouchableOpacity onPress={()=>this.onGoRecord(item,index)}>
                    <Image  style={styles.audioIcon} source={require('../assets/images/text_icon_normal.png')}/>
                </TouchableOpacity>
            </View>
        )}
        else { audio = (
            <View style={{flexDirection: 'row',alignItems:'center',justifyContent:'space-between',marginTop:10}}>
                <View style={styles.audioPanel}>
                    <SoundPlayer path={item.audioPath} maxLength={140} input={true}/>
                    {audioDelete}
                </View>
                <View style={styles.audioIcon}>
                    <RecordAudio audioPressOut={(audioPath)=>{this.audioClick(audioPath,item,index)}} onPress={()=>this.onGoText(item,index)} size={40}/>
                </View>
            </View>
        )}

        let scoreValue = ((item.parentId === 1) && (item.score === this.score[0].label)) ? this.score[0].score : item.score;
        let margin = ((item.parentId === 1) && (item.score !== this.score[0].label)) ? -2 : 0;

        let grade = null;
        if (item.parentId === 1){
            grade = item.check ? <View style={styles.scorePanel}>
                <Text style={styles.scoreLabel}>{I18n.t('Score')}</Text>
                <TouchableOpacity activeOpacity={0.5} onPress={this.scoreClick.bind(this,item,index)}>
                    <View style={styles.scoreItem}>
                        <Text style={[styles.scoreData,{width:40,margin:margin}]}>{scoreValue}</Text>
                        <Icon style={[styles.scoreIcon,{width:6}]} name="angle-right" size={16} color="#ffffff"/>
                    </View>
                </TouchableOpacity>
            </View> : <View style={styles.scorePanel}>
                <Text style={styles.scoreLabel}>{I18n.t('Score')}</Text>
                <View style={styles.scoreItem}>
                    <Text style={[styles.scoreData,{width:40,margin:margin}]}>{scoreValue}</Text>
                    <Icon style={[styles.scoreIcon,{width:6}]} name="angle-right" size={16} color="#ffffff"/>
                </View>
            </View>
        }else {
            grade = <PatrolGrade onGrade={(grade)=>{this.onGrade(item,index,grade)}} score={scoreValue} enable={item.check}/>
        }

        const dynamic = {opacity: item.mark ? 1 : 0.45, fontWeight: item.check ? 'bold' : 'normal'};
        const paddingRight = (item.parentId === 1) ? 0 : 8;
        const marginBottom = (index === this.state.collection.length-1) ? 67 : 8;
        return (
            <View style={[styles.itemPanel,{marginBottom}]}>
                <View style={[styles.rowPanel,{paddingRight:6}]}>
                    <TouchableOpacity activeOpacity={item.mark ? 0.5 : 1} onPress={item.mark ? this.onSubject.bind(this,item,index) : null}>
                        <Text style={[styles.itemSubject,{width:width-32-45,fontWeight:dynamic.fontWeight,opacity:dynamic.opacity}]}
                              numberOfLines={1}>
                            {index+1}.{item.subject}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.onMark.bind(this,item,index)}>
                        <Image style={styles.itemIgnore} source={item.mark ? require('../assets/images/img_patrol_ignore.png')
                            : require('../assets/images/img_patrol_recover.png')}/>
                    </TouchableOpacity>
                </View>

                <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:3,paddingRight:paddingRight,opacity:dynamic.opacity}}>
                    <TouchableOpacity activeOpacity={(item.mark && item.check) ? 0.5 : 1}
                                      onPress={()=>{(item.mark && item.check) ? this.inspectDetail.open(`${index+1}.${item.subject}`,item.description) : null}}>
                        <Text style={{fontSize:12,color:'#6097f4',textDecorationLine:'underline'}}>{I18n.t('Inspection details')}</Text>
                    </TouchableOpacity>
                    {grade}
                </View>

                <View style={[styles.rowPanel,{marginTop:12,height:60}]}>
                    {
                        (item.attachment.length === 0) ? <Image style={{width:80,height:60,opacity:item.mark ? 0.6 : 0.45}}
                                  source={require('../assets/images/img_media_default.png')}/>
                            :  <FlatList style={{height:60}}
                                         data={item.attachment}
                                         extraData={this.state}
                                         keyExtractor={(item, index) => item.toString()}
                                         renderItem={this.renderAttachmentEx}
                                         horizontal={true}
                                         showsHorizontalScrollIndicator={false}
                            />
                    }
                </View>
                {
                    (!item.mark || !item.check) ? <View style={{flexDirection: 'row',alignItems:'center',justifyContent:'space-between',marginTop:10,
                        opacity: dynamic.opacity}}>
                        <View style={styles.audioPanel}>
                            <SoundPlayer path={item.audioPath} maxLength={140} input={true}/>
                            {audioDelete}
                        </View>
                        <View style={styles.audioIcon}>
                            <RecordAudio disable={true} size={40}/>
                        </View>
                    </View> : audio
                }
            </View>
        )
    };

    renderAttachmentEx = ({ item,index }) => {
        let picture = null;
        if(item.mediaType === 1){
            picture = <TouchableOpacity onPress={() => this.viewPicture(item.mediaPath)}>
                <Image style={{width:80,height:60}} source={{uri: item.mediaPath}} resizeMode='stretch'/>
            </TouchableOpacity>
        }

        let video = null;
        if(item.mediaType === 2){
            video = <ImageBackground style={{width:80,height:60,alignItems:'center'}} source={this.thumbnailUrl} resizeMode='stretch'>
                <TouchableOpacity onPress={() => this.playRecord(item.mediaPath)}>
                    <Image style={{width:20,height:20,marginTop:22}} source={require('../assets/images/pic_play_icon.png')}
                           resizeMode='contain'/>
                </TouchableOpacity>
            </ImageBackground>
        }

        let splice = <TouchableOpacity style={{position:'absolute',width:15,height:15,left:65}} activeOpacity={0.5}
                                       onPress={() => {this.mediaDelete(item,index)}}>
            <Image style={{width:15,height:15}} source={require('../assets/images/img_media_delete.png')}></Image>
        </TouchableOpacity>

        return (
            <View style={{marginRight:10}}>
                {picture}
                {video}
                {splice}
            </View>
        )};

    backClick() {
        let {width,height} =  Dimensions.get('screen');
        if ( width > height ){
            if (Platform.OS === 'android'){
                this.refs.VideoSwitch.onPauseStatus(0);
            }
        }
        else {
            if (this.state.noData == null && RouteMgr.isScreen('remoteCheck')) {
                this.refs.back.open();
            } else {
                this.backConfirm();
            }
        }
    }

    renderBindsEx = ({ item,index }) => {
        let source = item.check ? require('../assets/images/img_channel_check.png'):require('../assets/images/img_channel_normal.png');
        let color =  item.check ? '#57E78F':'#989ba3';
        return (
            <TouchableOpacity style={{marginRight:10}} onPress={()=>this.channelClick(item,index,false)}>
                <Image source={source} style={styles.itemImage}/>
                <Text style={[styles.itemName,{color: color}]} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
        )
    };

/*     startPlay(ivsId,channelId){
        if(this.playerMode === 0 ||this.playerMode === 1){
            this.refs.reactVideo.startVideo(ivsId,channelId);
        }else if(this.playerMode === 2){
            this.refs.ezvizPlayer && this.refs.ezvizPlayer.startVideo(ivsId,channelId);
        }else if(this.playerMode === 3){
            this.refs.ezvizPlayerIOS && this.refs.ezvizPlayerIOS.startVideo(ivsId,channelId);
        }
    }

    stopPlay(){
        if(this.playerMode === 0 ||this.playerMode === 1){
            this.refs.reactVideo.stopVideo();
        }else if(this.playerMode === 2){
            this.refs.ezvizPlayer.stopPreview();
        }else if(this.playerMode === 3){
            this.refs.ezvizPlayerIOS.stop();
        }
    } */

    backConfirm(){
        Actions.pop();
        PatrolStorage.abandon(this.uuid);
    }

    switchConfirm(){
        this.refs.VideoSwitch.onPauseStatus(1);
        Actions.push('storeCenter',{data:{emitter:EMITTER_INSPECT_REMOTE}});
        PatrolStorage.abandon(this.uuid);
    }

    eventCreate(){
        this.refs.VideoSwitch.onPauseStatus(1);
        Actions.push('createCheckEvent',{camera:false,deviceId:-1});
    }

    addEvent(isSnapshot,uri){
        let item = this.state.cameraItem;
        let index = this.state.cameraIndex;

        if(isSnapshot){
            Actions.push('imageCanvas',{type:INSPECT_REMOTE_IMAGE,uri:uri});
        }else {
            this.showVideo(uri,item,index);
        }
    }

    channelClick(item,index,clear) {
        let data = this.state.data;
        clear ? data.forEach((itemData, indexData) => {
            itemData.items.forEach((itemChild, indexChild) => {
                itemChild.check = false;
            });
        }) : null;

        let device = this.state.device;
        let deviceId = this.state.deviceId;
        if (item.ivsId != null && item.channelId != null) {
            if(item.vendor !== this.state.playerMode){
                let channelIndex = device.findIndex((key)=>key.id === item.id);
                this.refs.VideoSwitch.initPlayer(channelIndex);
            }else{
                this.refs.VideoSwitch.startPlay(item.ivsId,item.channelId);
            }
            this.setState({vendorIndex:index});
            

            clear && device.forEach((itemChild, indexChild) => {
                itemChild.check = indexChild == index ? true: false;
            });
            clear && (deviceId = item.id);
        }

        let binds = clear ? [] : this.state.binds;
        binds.forEach((key,value)=>{
            (key.id === item.id) ? (key.check = true) : (key.check = false);
        });

        this.setState({
            cameraSession: clear ? null : this.state.cameraSession,
            cameraItem: clear ? null : this.state.cameraItem,
            cameraIndex: clear ? null : this.state.cameraIndex,
            bindId: clear ? -1 : item.id,
            data,
            binds,
            device,
            deviceId
        },()=>{
            this.onPersist();
        });
    }

    onItemScroll = (event)=>{
        this.state.videoGuide && this.setState({videoGuide:false},()=>{this.onPersist()});
    };

    renderBinds = ({ item,index }) => {
        let source = item.check ? require('../assets/images/img_channel_check.png'):require('../assets/images/img_channel_normal.png');
        let color =  item.check ? '#57E78F':'#989ba3';
        return (
            <TouchableOpacity style={{marginRight:10}} onPress={()=>this.channelClick(item,index,false)}>
                <Image source={source} style={styles.itemImage}/>
                <Text style={[styles.itemName,{color: color}]} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
        )
    };

    renderAttachment = ({ item,index }) => {
        let picture = null;
        if(item.mediaType === 1){
            picture = <TouchableOpacity onPress={() => this.viewPicture(item.mediaPath)}>
                <Image style={{width:80,height:60}} source={{uri: item.mediaPath}} resizeMode='stretch'/>
            </TouchableOpacity>
        }

        let video = null;
        if(item.mediaType === 2){
            video = <ImageBackground style={{width:80,height:60,alignItems:'center'}} source={this.thumbnailUrl} resizeMode='stretch'>
                <TouchableOpacity onPress={() => this.playRecord(item.mediaPath)}>
                    <Image style={{width:20,height:20,marginTop:22}} source={require('../assets/images/pic_play_icon.png')}
                           resizeMode='contain'/>
                </TouchableOpacity>
            </ImageBackground>
        }

        let splice = <TouchableOpacity style={{position:'absolute',width:15,height:15,left:65}} activeOpacity={0.5}
                                       onPress={() => {this.mediaDelete(item,index)}}>
            <Image style={{width:15,height:15}} source={require('../assets/images/img_media_delete.png')}></Image>
        </TouchableOpacity>

        return (
            <View style={{marginRight:10}}>
                {picture}
                {video}
                {splice}
         </View>
    )};

    onCollect(){
        let collection = [];
        let categories = this.state.data;
        this.categoryMap.forEach((item,index)=>{
            let data = categories.filter(p => p.majorKey === index);
            (data.length > 0) && (data.forEach((item)=>{
                let items = item.items.filter(p => (p.score === this.score[0].label) && p.mark);
                (items.length > 0) && collection.push(...items);
            }));
        });

        let checkIndex = collection.findIndex( p => p.check);
        (collection.length > 0) && this.setState({
            collection,
            unEvaluated: true,
            showBindsEx: (checkIndex !== -1)
        },()=>{
            SoundUtil.stop();
            dismissKeyboard();
        });
    }

    renderPrompt(){
        let content = null;
        if(this.state.promptEnable){
            content = <TouchableOpacity activeOpacity={0.5} onPress={()=>{this.onCollect()}}>
                <View style={{flexDirection:'row',height:30,backgroundColor: 'rgba(251,185,62,0.10)'}}>
                    <Image source={require('../assets/images/img_patrol_prompt.png')} style={{width:20,height:20,marginLeft:14,alignSelf:'center'}}/>
                    <Text style={{marginLeft:6,color:'#f5a623',height:30,lineHeight:30, textAlignVertical:'center'}}>
                        {this.state.promptContext}
                    </Text>
                </View>
            </TouchableOpacity>
        }else{
            content = <View style={{height:30,backgroundColor: 'rgba(251,185,62,0.10)'}}>
                <Text style={{marginLeft:14,color:'#f5a623',height:30,lineHeight:30, textAlignVertical:'center'}}>
                    {this.state.promptContext}
                </Text>
            </View>
        }

        (this.state.promptContext === '') ? (content = null) : null;
        return (<View>{content}</View>)
    }

    onMark(item,index){
        try {
            let data = this.state.data;
            let categories = data.filter(p => p.majorKey === item.parentId);
            let category = categories[0].items[item.subIndex];

            if (category.mark){
                categories[0].items[item.subIndex].check = false;
                categories[0].items[item.subIndex].score = this.score[0].label;
         /*        categories[0].items[item.subIndex].isTextDescription = false;
                categories[0].items[item.subIndex].comment = '';
                categories[0].items[item.subIndex].audioPath = '';
                categories[0].items[item.subIndex].attachment = []; */
            }
            categories[0].items[item.subIndex].mark = !category.mark;

            let stopVideo = false;
            let {cameraItem, cameraIndex, device, showBinds, showBindsEx} = this.state;
            if (!category.mark && (cameraItem != null) && cameraItem.id === item.id){
                stopVideo = true;
                cameraItem = null;
                cameraIndex = -1;

                device.map(function (value) {
                    value.check = false;
                    return value;
                });
                !this.state.unEvaluated && (showBinds = false);
                this.state.unEvaluated && (showBindsEx = false);
            }

            data = this.onPatrolRate(data,item);
            this.setState({data,showBinds,showBindsEx,cameraItem,
                    cameraIndex,device,videoGuide: false},
                ()=>{
                this.onPersist();
                this.formatPrompt();
                stopVideo && this.refs.VideoSwitch.disablePlay();
                !stopVideo && this.refs.VideoSwitch.enablePlay();
            });
        }catch (e) {
        }
    }

    onSession(){
        let item = this.state.cameraItem;
        let showBinds = (item && this.getSession(item.parentId) === this.state.sessionIndex) ?
            this.state.showBinds : false;
        this.setState(
            {
                unEvaluated: false,
                showBinds: showBinds
            },()=>{
                SoundUtil.stop();
                dismissKeyboard();
                this.onPersist();
            }
        );
    }

    onScrollTop(){
        try {
            if (!this.state.unEvaluated){
                let isCheck = (this.state.sessionIndex !== this.state.data.length - 1) ? true : false;
                (isCheck && this.state.items.length > 0 && this.scroll) ?
                    this.scroll.scrollTo({x:0 ,y: 0, animated: true}) : null;
                (!isCheck && this.state.events.length > 0 && this.scrollEvent) ?
                    this.scrollEvent.scrollTo({x:0 ,y: 0, animated: true}) : null;
            }else {
                (this.state.collection.length > 0 && this.collection) ?
                    this.collection.scrollTo({x:0 ,y: 0, animated: true}) : null
            }

        }catch (e) {
        }
    }

    renderCollection(){
        let absWidth = this.state.unEvaluated ? width : 0;
        let absHeight = this.state.unEvaluated ? null : 0;
        let viewHeight = this.state.unEvaluated ? 30 : 0;
        let iconHeight = this.state.unEvaluated ? 12 : 0;

        let header = null;
        if (!this.state.keyboardActive){
            header = <View style={{width:width,height:viewHeight,backgroundColor:'#f7f8fc',flexDirection:'row',
                justifyContent:'space-between'}}>
                <Text style={{color:'#19293b',fontSize:13,marginLeft:16,textAlignVertical:'center',
                    height:viewHeight,lineHeight:viewHeight}}>
                    {I18n.t('Unevaluated item')}
                </Text>

                <TouchableOpacity activeOpacity={0.5} onPress={()=>{this.onSession()}}
                                  style={{flexDirection:'row'}}>
                    <Image source={require('../assets/images/img_patrol_previous.png')}
                           style={{width:12,height:iconHeight,alignSelf:'center'}}/>
                    <Text style={{color:'#6097f4',fontSize:12,marginRight:16,textAlignVertical:'center',
                        height:viewHeight,lineHeight:viewHeight,marginLeft:3}}>
                        {I18n.t('Return patrol')}
                    </Text>
                </TouchableOpacity>
            </View>
        }

        return (
                <View style={{width:absWidth,height: absHeight}}>
                    {header}
                    {
                        (!this.state.keyboardActive && this.state.showBindsEx && this.state.binds.length > 0) ?
                            <View style={{marginTop:15,marginLeft:12}}>
                                <FlatList data={this.state.binds}
                                          extraData={this.state}
                                          keyExtractor={(item, index) => item.id.toString()}
                                          renderItem={this.renderBindsEx}
                                          horizontal={true}
                                          showsHorizontalScrollIndicator={false}
                                />
                            </View> : null
                    }

                    <ScrollView showsVerticalScrollIndicator={false}
                                ref={(ref => this.collection = ref)}>
                        <FlatList data={this.state.collection}
                                  extraData={this.state}
                                  keyExtractor={(item, index) => item.id.toString()}
                                  renderItem={this.renderItemEx}
                                  showsVerticalScrollIndicator={false}
                                  ItemSeparatorComponent={() => <View style={{
                                      height: 1,
                                      width: width,
                                      backgroundColor: '#dcdcdc'
                                  }}/>}
                        />
                    </ScrollView>
                </View>
        )
    }
    render() {
        let absHeight = this.state.unEvaluated ? 0 : null;
        let items = null;
        if (!this.state.isLoading){
            if (this.state.isCheck) { items = (
                <View style={{width:width-sessionWidth,height:absHeight}}>
                    {
                        (!this.state.keyboardActive && this.state.showBinds && this.state.binds.length > 0) ?
                            <View style={{marginTop:15,marginLeft:12}}>
                                <FlatList data={this.state.binds}
                                          extraData={this.state}
                                          keyExtractor={(item, index) => item.id.toString()}
                                          renderItem={this.renderBinds}
                                          horizontal={true}
                                          showsHorizontalScrollIndicator={false}
                                />
                        </View> : null
                    }

                    <ScrollView showsVerticalScrollIndicator={false}
                                ref={(c) => {this.scroll = c}}
                                onScroll={this.onItemScroll.bind(this)}>
                        {
                            (!this.state.keyboardActive && this.state.items.length > 0) ? <Text numberOfLines={1}
                                 style={{fontSize: 12, color: '#888c95',marginLeft:20,marginTop:10,marginBottom:-10,marginRight:20,maxWidth: 200}}>
                                {this.state.groupName}
                            </Text> : null
                        }

                        <FlatList ref={(ref => this.dataList = ref)}
                                  style={{paddingBottom: 67}}
                                  data={this.state.items}
                                  extraData={this.state}
                                  keyExtractor={(item, index) => item.id.toString()}
                                  renderItem={this.renderItem}
                                  showsVerticalScrollIndicator={false}
                                  ItemSeparatorComponent={() => <View style={{
                                      height: 1,
                                      width: width-sessionWidth,
                                      backgroundColor: '#dcdcdc'
                                  }}/>}
                        />
                    </ScrollView>
                </View>
            )
            }
            else { items = (
                <View style={{width:width-sessionWidth,height:absHeight}}>
                    <ScrollView showsVerticalScrollIndicator={false}
                                ref={(c) => {this.scrollEvent = c}}>
                        <FlatList style={styles.areasList}
                                  data={this.state.device}
                                  extraData={this.state}
                                  keyExtractor={(item, index) => index.toString()}
                                  renderItem={this.renderChannel}
                                  horizontal={true}
                                  showsHorizontalScrollIndicator={false}
                        />
                        {
                            this.state.device.length > 0 ? <View style={{width: width-sessionWidth,height:1,backgroundColor:'#dcdcdc'}}></View>
                                : null
                        }
                        <FlatList data={this.state.events}
                                  extraData={this.state}
                                  keyExtractor={(item, index) => index.toString()}
                                  renderItem={this.renderEvent}
                                  style={{paddingBottom: 70}}
                                  showsVerticalScrollIndicator={false}
                                  ItemSeparatorComponent={() => <View style={{
                                      height: 1,
                                      width: width-sessionWidth,
                                      backgroundColor: '#dcdcdc'
                                  }}/>}
                        />
                    </ScrollView>
                    {
                        (this.state.events.length !== 0 || this.state.ezvizFullScreen) ? null: <View>
                            <Text style={styles.eventTipA}>{I18n.t('By taking screenshot')}</Text>
                            <Text style={styles.eventTipB}>{I18n.t('By clicking button')}</Text>
                            <Image source={require('../assets/images/img_check_arrow.png')} style={styles.eventArrow}/>
                        </View>
                    }

                    {
                        !this.state.ezvizFullScreen ? <TouchableOpacity activeOpacity={0.5} onPress={this.eventCreate.bind(this)} style={{position:'absolute',bottom:10,right:10}}>
                            <Image source={require('../assets/images/img_check_add.png')} style={{width:86,height:86,opacity:0.75}}/>
                        </TouchableOpacity> : null
                    }
                </View>
            )
            }
        }

        let videoComponent = null;
        if (this.state.isLoading === false && this.state.noData === null){
            videoComponent = <VideoSwitch ref={'VideoSwitch'}
                                          VideoType={'RemoteCheck'}
                                          data={this.state.store}
                                          isCheck={this.state.isCheck}
                                          cameraItem={this.state.cameraItem}
                                          cameraIndex={this.state.cameraIndex}
                                          vendorIndex={this.state.vendorIndex}
                                          ezvizFullScreen={this.state.ezvizFullScreen}
                                          PlayerMode={(mode)=>this.setState({playerMode:mode})}
                                          dashReady={(ready)=>this.setState({dashReady:ready})}
                                          FullScreen={(screen)=>this.setState({ezvizFullScreen: screen})}
                                          createEvent={(isSnapshot,uri)=>{this.addEvent(isSnapshot,uri)}}/>
        }

        const marginTop = (this.state.playerMode == 1) ? 43 : 53;
        let videoGuide = null;
        if(this.state.noData == null && this.state.isLoading === false && this.state.videoGuide){
            videoGuide = <View style={{position:'absolute',top:lib.statusBarHeight()+215,zIndex:999}}>
                <View style={{width:width}}>
                    <Text style={{color:'#f31d65',fontSize:16,textAlign:'center'}}>{I18n.t('Remote video guide')}</Text>
                </View>
                <Image source={require('../assets/images/img_inspect_guide.png')}
                       style={{width:30,height:60,marginTop:marginTop,marginLeft:sessionWidth-4 }}/>
            </View>
        }

        let prompt = null;
        if (this.state.noData == null && !this.state.isLoading && !this.state.keyboardActive &&
            !this.state.unEvaluated && this.state.promptContext !== ''){
            prompt = this.renderPrompt();
        }

        let style = {
            flexDirection: !this.state.unEvaluated ? 'row' : 'column',
            justifyContent: !this.state.unEvaluated ? 'center' : 'flex-start',
            paddingBottom: !this.state.unEvaluated ? 0 : this.state.showBindsEx ? 110 : 28
        };

        return (
            <View style={styles.container}>
                <RNStatusBar/>
                {
                    !this.state.ezvizFullScreen ?  <View style={styles.NavBarPanel}>
                        <TouchableOpacity activeOpacity={0.5} onPress={this.backClick.bind(this)} style={{width:50}}>
                            <Image source={RouteMgr.getRenderIcon()} style={{width:48,height:48}}/>
                        </TouchableOpacity>
                        <View style={{width:10}}/>
                        <View style={{width:width-140,height:48,justifyContent: 'center',flexDirection:'row', paddingLeft:20,paddingRight:20}}>
                            <Text style={[styles.NavBarTitle,{fontSize:18,textAlign:'center',maxWidth: 175,marginLeft:45}]} numberOfLines={1}>
                                {this.state.store.name}
                            </Text>
                            {
                                !RouteMgr.getActive() ? <TouchableOpacity activeOpacity={0.5} onPress={this.storeChanged.bind(this)}>
                                    <Image style={{width:26,height:26,marginRight:15,marginTop:10}} source={require('../assets/images/img_check_pulldown.png')}/>
                                </TouchableOpacity> : <View style={{width:36,height:26}}/>
                            }
                        </View>
                        {
                            (this.state.promptEnable && this.state.data.length > 0) ? <TouchableOpacity activeOpacity={0.5}
                                                                                                        onPress={this.submitClick.bind(this)}  style={{width:80,justifyContent:'flex-end',flexDirection:'row'}}>
                                <Text style={[styles.NavBarTitle,{marginRight:16}]}>{I18n.t('Confirm summary')}</Text>
                            </TouchableOpacity> : <View style={{width:80,justifyContent:'flex-end',flexDirection:'row'}}>
                                <Text style={[styles.NavBarTitle,{color:'rgba(255,255,255,0.5)',marginRight:16}]}>{I18n.t('Confirm summary')}</Text>
                            </View>
                        }
                    </View> : null
                }

                {videoComponent}
                {videoGuide}

                {
                    this.state.noData !== null  ? <View style={{flex:1,alignItems: 'center', justifyContent: 'flex-start'}}>
                        <View style={styles.imagePanel}>
                            <Image style={styles.imageIcon} source={require('../assets/images/img_nodata.png')}></Image>
                        </View>
                        <Text style={styles.submitText}>{this.state.noDataTip}</Text>
                    </View> : null
                }

                {prompt}

                <View style={{flex:1,...style}}>
                    {
                        this.state.isLoading ? this.renderLoadingView()
                            :  (this.state.data.length !== 0 && !this.state.unEvaluated) ? <FlatList
                                style={[styles.sessionPanel,{height:absHeight}]}
                                    data={this.state.data}
                                    extraData={this.state}
                                    // refreshing={true}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={this.renderRow}
                                    showsVerticalScrollIndicator={false}
                                /> : <View style={styles.sessionNull}></View>
                    }
                    {items}
                    {this.renderCollection()}
                </View>

                {
                    (!this.state.keyboardActive && !this.state.isLoading && this.state.data.length > 0 &&
                        this.state.isCheck && !this.state.ezvizFullScreen && (this.state.items.length > 0 || this.state.events.length > 0)) ?
                        <View style={{position:'absolute',right:12,bottom:18}}>
                            <TouchableOpacity style={{zIndex:999}} activeOpacity={0.5} onPress={()=>this.onScrollTop()}>
                                <Image style={{width:56,height:56}}
                                        source={this.scrollUrl} />
                            </TouchableOpacity>
                        </View>: null
                }

                <ModalCenter ref={"back"} title={I18n.t('Quitting confirm')} confirm={()=>this.backConfirm()}/>
                <ModalCenter ref={"switch"} title={I18n.t('Switching confirm')} confirm={()=>this.switchConfirm()}/>
                <ModalCenter ref={"incomplete"} title={I18n.t('Incomplete items')} confirm={()=>this.onSummary()}/>

                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}} position='bottom'/>
                <ScorePickerEx ref={"scorePickerEx"} data={this.state.maxScore} onSelected={(score)=>this.scoreSelected(score)} />
                <InspectDetail ref={ref => this.inspectDetail = ref}/>
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
        alignItems: 'center'
    },
    NavBarBack: {
        marginLeft: 12,
        width: 48,
        height: 48
    },
    NavBarTitle: {
        fontSize: 14,
        height: 48,
        color: '#ffffff',
        marginRight:0,
        textAlignVertical:'center',
        lineHeight: 48
    },
    storeName:{
        position:'absolute',
        top:32+lib.statusBarHeight(),
        color:'#ffffff',
        fontSize:11,
        width:width,
        textAlign:'center'
    },
    sessionPanel:{
        width: sessionWidth,
        backgroundColor:'#f6f8fa'
    },
    sessionNull:{
        width: sessionWidth,
        backgroundColor:'#ffffff'
    },
    sessionNormal:{
        height:60,
        backgroundColor:'#f6f8fa',
    },
    sessionSelected:{
        height:60,
        width:sessionWidth,
        backgroundColor:'#ffffff'
    },
    sessionNameNormal:{
        fontSize: 12,
        marginTop: 14,
        textAlign:'center',
        color: '#19293b'
    },
    sessionNameSelected:{
        fontSize: 12,
        marginTop: 14,
        textAlign:'center',
        color: ColorStyles.COLOR_MAIN_RED
    },
    sessionNameOneNormal:{
        fontSize: 12,
        marginTop: 21,
        textAlign:'center',
        color: '#19293b'
    },
    sessionNameOneSelected:{
        fontSize: 12,
        marginTop: 21,
        textAlign:'center',
        color: ColorStyles.COLOR_MAIN_RED
    },
    sessionNumberNormal:{
        fontSize: 10,
        textAlign:'center',
        marginTop:4,
        color:'#989ba3'
    },
    sessionNumberSelected:{
        fontSize: 10,
        textAlign:'center',
        marginTop:4,
        color: ColorStyles.COLOR_MAIN_RED
    },
    itemPanel:{
        paddingLeft:20,
        paddingRight:14,
        paddingBottom:8
    },
    rowPanel:{
        flexDirection:'row',
        justifyContent:'space-between'
    },
    itemSubject:{
        fontSize: 14,
        color:'#19293b',
        width:180,
        marginTop:20,
        height:25
    },
    itemIgnore:{
        width:22,
        height:22,
        marginTop:19,
        marginRight: 2
    },
    scorePanel:{
        flexDirection:'row',
        justifyContent:'space-between',
        width:90,
        height:16,
        marginRight:8
    },
    scoreLabel:{
        fontSize:12,
        color:'#989ba3',
        textAlignVertical:'center'
    },
    scoreItem:{
        flexDirection:'row',
        justifyContent:'flex-end',
        width:58,
        height:15,
        borderRadius:10,
        backgroundColor:'#fcba3f',
        marginLeft:6,
        marginTop:1
    },
    scoreData:{
        color:'#ffffff',
        fontSize:12,
        textAlignVertical:'center',
        textAlign:'center',
        marginTop:-2,
        lineHeight:17,
        ...Platform.select({
            ios:{
                lineHeight:19
            }
        })
    },
    scoreIcon:{
        marginRight:6,
        marginTop:-1
    },
    audioIcon:{
        width: 40,
        height: 40,
        marginRight:2,
        marginTop:10
    },
    audioPanel:{
        marginTop: 10,
        width: 200,
        height: 46,
        borderColor: '#dcdcdc',
        paddingTop:0,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        overflow: 'hidden',
    },
    issueDescription:{
        marginTop:10,
        width: 200,
        height: 46,
        borderWidth: 1,
        borderColor: '#dcdcdc',
        paddingVertical: 0,
        borderRadius: 2,
        alignItems:'center',
        paddingLeft:10
    },
    cameraPanel:{
        width:90,
        height:70,
        backgroundColor:'#f8fcff'
    },
    imagePanel:{
        height: 140,
        backgroundColor: '#ffffff',
        alignItems: 'center'
    },
    imageIcon: {
        width: 100,
        height: 100,
        marginTop: 40
    },
    submitText: {
        fontSize: 18,
        color: '#d5dbe4',
        textAlign: 'center'
    },
    image: {
        width: 90,
        height: 70
    },
    eventTipA:{
        fontSize:16,
        color:'#d5dbe4',
        position:'absolute',
        bottom:110,
        right:20
    },
    eventTipB:{
        fontSize:16,
        color:'#d5dbe4',
        position:'absolute',
        bottom:90,
        right:20
    },
    eventArrow:{
        width:48,
        height:48,
        position:'absolute',
        bottom:40,
        right:100,
    },
    areasList: {
        flex:1,
        backgroundColor: '#ffffff',
        //height: 56,
        marginLeft: 12,
        marginRight: 12,
        marginBottom:10,
        marginTop:15
    },
    channelPanel:{
        marginRight: 10
    },
    itemImage:{
        width: 40,
        height: 40,
        alignSelf: 'center'
    },
    itemName: {
        color: '#ffffff',
        fontSize: 11,
        textAlign: 'center',
        textAlignVertical:'center',
        marginTop: 2,
        lineHeight: 18,
        width:70,
        height: 20
    },
});
