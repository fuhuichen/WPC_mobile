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
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
    Keyboard
} from 'react-native';
import {Actions} from "react-native-router-flux";
import Icon from 'react-native-vector-icons/FontAwesome'
import HttpUtil from "../utils/HttpUtil";
import RNStatusBar from '../components/RNStatusBar';
import {EMITTER_INSPECT_LOCAL} from "../common/Constant";
import Toast, {DURATION} from 'react-native-easy-toast'
import ModalCenter from '../components/ModalCenter';
import * as lib from '../common/PositionLib';
import SoundPlayer from "../components/SoundPlayer";
import {ColorStyles} from '../common/ColorStyles';
import InspectDetail from './InspectDetail';
import I18n from 'react-native-i18n';
import StringFilter from "../common/StringFilter";
import RouteMgr from "../notification/RouteMgr";
import GlobalParam from "../common/GlobalParam";
import dismissKeyboard from "react-native-dismiss-keyboard";
import ScorePickerEx from "../thirds/scorepicker/ScorePickerEx";
import _ from 'lodash';
import SoundUtil from "../utils/SoundUtil";
import PatrolStorage from "../components/inspect/PatrolStorage";
import PatrolParser from "../components/inspect/PatrolParser";
import PatrolGrade from "../components/inspect/PatrolGrade";
import PhoneInfo from "../entities/PhoneInfo";
import SourceInput from "../components/SourceInput";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
const sessionWidth = 85;
export default class LocalCheck extends Component {
    constructor(props){
        super(props);

        this.inspectId = (this.props.inspect != null) ? this.props.inspect.id : '';
        this.inspectName = this.props.inspect ? this.props.inspect.name : '';

        this.thumbnailUrl = require('../assets/images/image_videoThumbnail.png');
        this.scrollUrl = PhoneInfo.isEnLanguage() ? require('../assets/images/img_patrol_up_en.png')
            : PhoneInfo.isCNLanguage() ? require('../assets/images/img_patrol_up.png')
            : require('../assets/images/img_patrol_up_tw.png');

        this.attachmentId = GlobalParam.getScreenId();

        this.categories = [];
        this.categoryMap = [
            I18n.t('Rate evaluation'),
            I18n.t('Score evaluation'),
            I18n.t('Score append')
        ];
        this.score = PatrolParser.getScore();
        this.inspectSettings = [];

        this.cache = {
            advise: '',
            sign: 0,
            signUriArray: [],
        };

        this.state = {
            isLoading: false,
            noData: null,

            selectedScoreItem: null,
            selectedScoreIndex: null,

            sessionIndex: 0,

            srcData: [],
            data: [],
            items: [],
            events: [],
            isCheck: true,
            noDataTip: I18n.t('No data'),
            signature: 0,

            bindId: -1,

            promptContext: '',
            promptEnable: false,
            collection: [],
            unEvaluated: false,
            groups: [],
            groupName: '',
            maxScore: 10,
            store: this.props.data
        };

        this.allowPicker = false;
    }

    componentDidMount(){
        PatrolParser.isExist() ? this.keepData() : this.fetchData();
    }

    componentWillMount(){
        if (Platform.OS === 'android') {
            this.backEmitter = BackHandler.addEventListener(`localInspectBack${this.attachmentId}`,
                this.onBackAndroid);
        }
        this.eventEmitter = DeviceEventEmitter.addListener('onCheckRefresh',(param)=>{
            GlobalParam.isValidScreen(this.attachmentId) && this.onRefresh(param);
        });

        this.cacheEmitter = DeviceEventEmitter.addListener('onCacheRefresh',(cache)=> {
            if (GlobalParam.isValidScreen(this.attachmentId)) {
                this.cache = cache;
                this.onPersist();
            }
        });

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow',()=>{
            this.setState({keyboardActive: true});
        });
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide',()=>{
            this.setState({keyboardActive: false});
        });
    }

    componentWillUnmount() {
        lib.isAndroid() && this.backEmitter && this.backEmitter.remove();
        this.eventEmitter && this.eventEmitter.remove();
        this.cacheEmitter && this.cacheEmitter.remove();
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
            events.push(addEvent);
            this.setState({events:events},()=>{
                this.onPersist();
            });
        }
    }

    fetchData(){
        try {
            this.initState(true,null);
            HttpUtil.get("${v3.0}"+`/inspect/checkout?storeId=${this.state.store.storeId}&mode=1&inspectId=${this.inspectId}`)
                .then(result => {
                    this.inspectSettings = result.data.inspectSettings;
                    let pickerSetting = this.inspectSettings.find(p => p.name == 'onSitePhotoOnly');;
                    if (pickerSetting != null){
                        if (pickerSetting.value == false){
                            this.allowPicker = true;
                        }
                    }
                    this.compute(result.data,true);
                })
                .catch(error=>{
                    this.initState(false,true);
                })
        }catch (e) {
            this.initState(false,true);
            console.log("LocalCheck-fetchData:" + e);
        }
    }

    initState(isLoading,noData){
        this.setState({isLoading,noData});
    }

    setData(data){
        this.setState({data},()=>{
            this.onPersist();
        });
    }

    keepData(){
        try{
            let state = PatrolParser.getState();
            state && this.setState({
                isLoading: true,
                noData: null,
                events: state.events,
                sessionIndex: state.sessionIndex,
                signature: state.signature,
                groupName: state.groupName,
                store: state.store
            },()=>{
                this.compute(state.data,false);
            });

            this.cache = state ? state.cache : this.cache;
            this.inspectSettings = state ? state.inspectSettings : [];
            this.inspectName = state ? state.inspectName : '';
        }catch (e) {
        }
    }

    compute(dataSet,flush){
        let data = dataSet.groups ? dataSet.groups : dataSet;
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
        if ((this.categories.length > 0) && (session !== this.categories.length-1)){
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
            signature: dataSet.signature ? dataSet.signature : this.state.signature,
            isCheck: (session === this.categories.length-1) ? false : true
        },()=>{
           flush && this.onPersist();
        });
    }

    onPersist(){
        PatrolStorage.save({
            mode: 1,
            state: JSON.stringify({
                data: PatrolParser.deCycle(this.state.srcData),
                store: this.state.store,
                sessionIndex: this.state.sessionIndex,
                events: this.state.events,
                signature: this.state.signature,
                groupName: this.state.groupName,
                cache: this.cache,
                inspectSettings: this.inspectSettings,
                inspectName: this.inspectName
            })
        });
    }

    getCategories(data, category,index) {
        let groups = [], items = [], patrolRate = [], subIndex = -1;
        let categories = data.filter(p => p.type === index);
        categories.forEach((item) => {
            groups.push(item.groupName);
            item.items.forEach((key) => {
                subIndex += 1;
                key.mode = (key.mode != null) ? key.mode : item.mode;
                key.groupName = item.groupName;
                key.parentId = index;
                key.subIndex = subIndex;
                key.attachment = key.attachment ? key.attachment : [{
                    mediaType: 0,
                    id: key.id,
                    subIndex: subIndex,
                    mediaPath: null,
                    parentId: index
                }];
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
            e.items.filter(v => (v.score === this.score[0].label && v.mark)).length : 0), 0);
        if (promptContext === '' && autoIgnored !== 0){
            promptContext = I18n.t('Unevaluated view');
        }

        this.setState({promptContext,promptEnable});
    }

    submitClick(){
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
        Actions.push('inspectSummary',
            {
                data: this.state.srcData,
                events: this.state.events,
                store: this.state.store,
                signature:this.state.signature,
                cache: this.cache,
                score: this.score,
                inspectSettings: this.inspectSettings,
                inspectName: this.inspectName,
                inspectType: 1
            }
        );
    }

    storeChanged(){
        if(this.state.noData == null){
            this.refs.switch.open();
        }else{
            this.switchConfirm();
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
            data[session].items[item.subIndex] = item;
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
        let numerator = groups.reduce((p,e) => p + ((e.score !== this.score[0].label || !e.mark) ? 1 : 0), 0);
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
        });

        let availableScores = (item.availableScores.length > 0) ? item.availableScores
            :  (_.range(0,item.maxScore+1).reverse());
        this.setState({maxScore: availableScores},()=>{
            this.refs.scorePickerEx.open(item.score);
        });
    }

    scoreSelected(score){
        let item = this.state.selectedScoreItem;
        let index = this.state.selectedScoreIndex;

        if(item !== null && index !== null){
            this.scoreChange(item,index,score);
        }
    }

    onGrade(item,index,grade){
        if(item !== null && index !== null){
            this.scoreChange(item,index,grade);
        }
    }

    onGroup(category,name){
        if (this.state.sessionIndex !== category || this.state.groupName !== name){
            let data = this.state.data;
            let items = data[category].items.filter(p => p.groupName === name);
            let isCheck = (category !== data.length-1) ? true : false;

            this.setState({
                sessionIndex: category,
                groupName: isCheck ? name : '',
                items: items,
                isCheck: isCheck
            },()=>{
                this.onPersist();
            });

            isCheck && setTimeout(() => {
                this.scroll && this.scroll.scrollTo({x: 0, y: 0, animated: true});
            }, 200);
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
        });
    }

    audioClick(audioPath,item,index){
        try {
            let data = this.state.data;
            if (!this.state.unEvaluated){
                let session = this.state.sessionIndex;
                item.audioPath = audioPath;

                data[session].items[item.subIndex] = item;
            }else {
                let categories = data.filter(p => p.majorKey === item.parentId);
                (categories.length > 0) && categories.forEach((_item)=>{
                    let original = _item.items.findIndex(p => p.id === item.id);

                    (original !== -1) && (_item.items[original].audioPath = audioPath);
                })
            }

            this.setData(data);
        }catch (e) {
            console.log("LocalCheck-audioClick:" + e);
        }
    }

    showPicture(path,item,index){
        try {
            let data = this.state.data;
            if (!this.state.unEvaluated){
                let session = this.state.sessionIndex;
                let subIndex = item.subIndex;
                let items =  data[session].items[subIndex];
                if (items.attachment.length > GlobalParam.MAX_ATTACHMENT){
                    this.refs.toast.show(I18n.t('Up to 5 attachments'), 3000);
                    return;
                }
                items.attachment.unshift({
                    mediaPath: path,
                    mediaType: 1,
                    id: item.id,
                    parentId: item.parentId,
                    subIndex: item.subIndex,
                    deviceId: this.state.bindId
                });
                data[session].items[subIndex] = items;
            }else {
                    let categories = data.filter(p => p.majorKey === item.parentId);
                    (categories.length > 0) && categories.forEach((_item)=>{
                        let original = _item.items.findIndex(p => p.id === item.id);
                        let size = (original !== -1) ?_item.items[original].attachment.length-1 : 0;
                        if(size < GlobalParam.MAX_ATTACHMENT){
                            (original !== -1) && _item.items[original].attachment.unshift({
                                id: item.id,
                                parentId: item.parentId,
                                mediaPath: path,
                                mediaType: 1,
                                subIndex: item.subIndex,
                                deviceId: this.state.bindId
                            });
                        }
                        else{
                            this.refs.toast.show(I18n.t('Up to 5 attachments'), 3000);
                        }
                    });
                }
           this.setData(data);
        } catch (e) {
            console.log("LocalCheck-showPicture:" + e);
        }
    }

    showVideo(path,item,index){
        try {
            let data = this.state.data;
            if (!this.state.unEvaluated){
                let session = this.state.sessionIndex;
                let subIndex = item.subIndex;
                let items =  data[session].items[subIndex];
                if (items.attachment.length > GlobalParam.MAX_ATTACHMENT){
                    this.refs.toast.show(I18n.t('Up to 5 attachments'), 3000);
                    return;
                }
                let videos = items.attachment.filter(p => p.mediaType == 2);
                if (videos.length >= GlobalParam.MAX_VIDEO){
                    this.refs.toast.show(I18n.t('Video limit'), 3000);
                    return;
                }
                items.attachment.unshift({
                    mediaPath: path,
                    mediaType: 2,
                    id: item.id,
                    parentId: item.parentId,
                    subIndex: item.subIndex,
                    deviceId: this.state.bindId
                });

                data[session].items[subIndex] = items;
            }else {
                let categories = data.filter(p => p.majorKey === item.parentId);
                (categories.length > 0) && categories.forEach((_item)=>{
                    let original = _item.items.findIndex(p => p.id === item.id);
                    let size = (original !== -1) ?_item.items[original].attachment.length-1 : 0;
                    if(size < GlobalParam.MAX_ATTACHMENT){
                        let videos = _item.items[original].attachment.filter(p => p.mediaType == 2);
                        if (videos.length >= GlobalParam.MAX_VIDEO){
                            this.refs.toast.show(I18n.t('Video limit'), 3000);
                            return;
                        }
                        (original !== -1) && _item.items[original].attachment.unshift({
                            id: item.id,
                            parentId: item.parentId,
                            mediaPath: path,
                            mediaType: 2,
                            subIndex: item.subIndex,
                            deviceId: this.state.bindId
                        });
                    }
                    else{
                        this.refs.toast.show(I18n.t('Up to 5 attachments'), 3000);
                    }
                })
            }

            this.setData(data);
        }catch (e) {
            console.log("LocalCheck-showVideo:" + e);
        }
    }

    onLocalPictures(path,item,index){
        try {
            let data = this.state.data;
            if (!this.state.unEvaluated){
                let session = this.state.sessionIndex;
                let subIndex = item.subIndex;
                let items =  data[session].items[subIndex];
                if (items.attachment.length + path.length > GlobalParam.MAX_ATTACHMENT + 1){
                    this.refs.toast.show(I18n.t('Up to 5 attachments'), 3000);
                    return;
                }
                path.forEach((child,index)=>{
                    items.attachment.unshift({
                        mediaPath: child,
                        mediaType: 1,
                        id: item.id,
                        parentId: item.parentId,
                        subIndex: item.subIndex,
                        deviceId: this.state.bindId
                    });
                });
                data[session].items[subIndex] = items;
            }else {
                    let categories = data.filter(p => p.majorKey === item.parentId);
                    (categories.length > 0) && categories.forEach((_item)=>{
                        let original = _item.items.findIndex(p => p.id === item.id);
                        let size = (original !== -1) ?_item.items[original].attachment.length-1 : 0;
                        if(size + path.length <= GlobalParam.MAX_ATTACHMENT && original !== -1){
                            path.forEach((child,index)=>{
                                _item.items[original].attachment.unshift({
                                    id: item.id,
                                    parentId: item.parentId,
                                    mediaPath: child,
                                    mediaType: 1,
                                    subIndex: item.subIndex,
                                    deviceId: this.state.bindId
                                });
                            });
                        }
                        else{
                            this.refs.toast.show(I18n.t('Up to 5 attachments'), 3000);
                        }
                    });
                }
           this.setData(data);
        } catch (e) {
            console.log("LocalCheck-showPicture:" + e);
        }
    }

    audioDelete(item,index) {
        this.audioClick('', item, index);
    }

    mediaDelete(item,index){
        try {
            let data = this.state.data;
            if (!this.state.unEvaluated){
                let session = this.state.sessionIndex;
                let subIndex = item.subIndex;

                data[session].items[subIndex].attachment.splice(index,1);
            }else {
                let categories = data.filter(p => p.majorKey === item.parentId);
                (categories.length > 0) && categories.forEach((_item)=>{
                    let original = _item.items.findIndex(p => p.id === item.id);
                    (original !== -1) && _item.items[original].attachment.splice(index, 1);
                })
            }

           this.setData(data);
        }catch (e) {
            console.log("LocalCheck-mediaDelete:" + e);
        }
    }

    onDescriptionChange(text,item,index){
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

        this.setData(data);
    }

    onGoRecord(item,index){
        let data = this.state.data;
        if (!this.state.unEvaluated){
            let session = this.state.sessionIndex;
            item.uiType = 'audio';
            data[session].items[item.subIndex] = item;
        }else {
            let categories = data.filter(p => p.majorKey === item.parentId);
            (categories.length > 0) && categories.forEach((_item)=>{
                let original = _item.items.findIndex(p => p.id === item.id);
                (original !== -1) && (_item.items[original].uiType = 'audio');
            })
        }

        this.setData(data);
    }

    onGoText(item,index){
        let data = this.state.data;
        if (!this.state.unEvaluated){
            let session = this.state.sessionIndex;
            item.uiType = 'text';
            data[session].items[item.subIndex] = item;
        }else {
            let categories = data.filter(p => p.majorKey === item.parentId);
            (categories.length > 0) && categories.forEach((_item)=>{
                let original = _item.items.findIndex(p => p.id === item.id);
                (original !== -1) && (_item.items[original].uiType = 'text');
            })
        }

        this.setData(data);
    }

    onGoCamera(item,index){
        let data = this.state.data;
        if (!this.state.unEvaluated){
            let session = this.state.sessionIndex;
            item.uiType = 'picture';
            data[session].items[item.subIndex] = item;
        }else {
            let categories = data.filter(p => p.majorKey === item.parentId);
            (categories.length > 0) && categories.forEach((_item)=>{
                let original = _item.items.findIndex(p => p.id === item.id);
                (original !== -1) && (_item.items[original].uiType = 'picture');
            })
        }

        this.setData(data);
    }

    renderLoadingView() {
        return (
            <View style={{flex:1, justifyContent:'center'}}>
                <ActivityIndicator
                    animating={true}
                    color='#dcdcdc'
                    size="large"
                />
                <Text style={{textAlign:'center'}}>{I18n.t('Loading')}</Text>
            </View>
        );
    }

    renderAttachment = ({ item,index }) => {
        let picture = null;
        if(item.mediaType === 1){
            picture = <TouchableOpacity onPress={() => Actions.push('pictureViewer',{uri: item.mediaPath})}>
                <Image style={{width:80,height:60}} source={{uri: item.mediaPath}} resizeMode='stretch'/>
            </TouchableOpacity>
        }

        let video = null;
        if(item.mediaType === 2){
            video = <ImageBackground style={{width:80,height:60,alignItems:'center'}} source={this.thumbnailUrl} resizeMode='cover'>
                <TouchableOpacity onPress={() => Actions.push('videoPlayer',{uri: item.mediaPath})}>
                    <Image style={{width:20,height:20,marginTop:22}} source={require('../assets/images/pic_play_icon.png')}
                           resizeMode='contain'/>
                </TouchableOpacity>
            </ImageBackground>
        }

        let splice = null;
        if(item.mediaType !== 0){
            splice = <TouchableOpacity style={{position:'absolute',width:15,height:15,left:65}}
                  activeOpacity={0.5} onPress={() => {this.mediaDelete(item,index)}}>
                <Image style={{width:15,height:15}} source={require('../assets/images/img_media_delete.png')}></Image>
            </TouchableOpacity>
        }

        return (
            <View style={{marginRight:10}}>
                {picture}
                {video}
                {splice}
            </View>
     )};

     renderEventAttach(item) {
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
                        <TouchableOpacity onPress={() => Actions.push('pictureViewer',{uri: item.mediaPath})}>
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
                    <Text style={styles.itemSubject} numberOfLines={1}>{index+1}.{item.subject}</Text>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.removeEvent.bind(this,item,index)}>
                        <Image style={styles.itemIgnore} source={require('../assets/images/img_audio_delete.png')}/>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    {this.renderEventAttach(item)}
                 </ScrollView>
                 {description}
                 {audio}
            </View>
        )
    };

    backClick(){
        if(this.state.noData == null && RouteMgr.isScreen('localCheck')){
            this.refs.back.open();
        }else{
            this.backConfirm();
        }
    }

    backConfirm(){
        Actions.pop();
        PatrolStorage.delete();
    }

    switchConfirm(){
        if(!RouteMgr.getActive()){
            Actions.push('storeCenter',{
                data:{emitter:EMITTER_INSPECT_LOCAL}});
        }else{
            Actions.pop();
            PatrolStorage.delete();
        }
    }

    eventCreate(){
        Actions.push('createCameraEvent',{allowPicker:this.allowPicker});
    }

    onCollect(){
        let collection = [];
        let categories = this.state.data;
        this.categoryMap.forEach((item,index)=>{
            let data = categories.filter(p => p.majorKey === index);
            (data.length > 0) && (data.forEach((item,index)=>{
                let items = item.items.filter(p => (p.score === this.score[0].label) && p.mark);
                (items.length > 0) && collection.push(...items);
            }));
        });

        (collection.length > 0) && this.setState({
            collection,
            unEvaluated:true
        },()=>{
            SoundUtil.stop();
            dismissKeyboard();

        });
    }

    onSession(){
        this.setState(
            {
                unEvaluated: false
            },()=>{
                SoundUtil.stop();
                dismissKeyboard();
            }
        );
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
            content = <View style={{flexDirection:'row',height:30,backgroundColor: 'rgba(251,185,62,0.10)'}}>
                <Text style={{marginLeft:14,color:'#f5a623',height:30,lineHeight:30, textAlignVertical:'center'}}>
                    {this.state.promptContext}
                </Text>
            </View>
        }
        return (<View>{content}</View>)
    }

    onMark(item,index){
        try {
            let data = this.state.data;
            let categories = data.filter(p => p.majorKey === item.parentId);
            let category = categories[0].items[item.subIndex];

            if (category.mark){
                categories[0].items[item.subIndex].score = this.score[0].label;
                categories[0].items[item.subIndex].isTextDescription = false;
                categories[0].items[item.subIndex].comment = '';
                categories[0].items[item.subIndex].audioPath = '';
                categories[0].items[item.subIndex].attachment = [{
                    mediaType: 0,
                    id: item.id,
                    subIndex: item.subIndex,
                    mediaPath: null,
                    parentId: item.parentId
                }]
            }
            categories[0].items[item.subIndex].mark = !category.mark;

            data = this.onPatrolRate(data,item);
            this.setState({data},()=>{
                this.onPersist();
                this.formatPrompt();
            });
        }catch (e) {
        }
    }

    renderItem = ({ item,index}) => {
        let audio = null;
        let audioDelete = null;
        if (item.audioPath != ''){ audioDelete = (
            <TouchableOpacity activeOpcity={0.5} onPress={()=>this.audioDelete(item,index)}>
                <Image style={{width:24,height:24,marginLeft:8}} source={require('../assets/images/img_audio_delete.png')}></Image>
            </TouchableOpacity>
        )}

        if (item.uiType == 'text' || item.uiType == null ){ audio = (
            <TextInput style={styles.issueDescription} multiline={true} value={item.comment} onChangeText={(text)=>this.onDescriptionChange(text,item,index)} placeholder={I18n.t('Enter info')}/>
        )}
        else if (item.uiType == 'audio'){ audio = (
            <View style={styles.audioPanel}>
               <SoundPlayer path={item.audioPath} maxLength={180} input={true}/>
               {audioDelete}
            </View>
        )}
        else if (item.uiType == 'picture'){ audio = (
            <View style={styles.audioPanel}/>
        )}

        let scoreValue = ((item.parentId === 1) && (item.score === this.score[0].label)) ? this.score[0].score : item.score;
        let margin = ((item.parentId === 1) && (item.score !== this.score[0].label)) ? -2 : 0;
        let paddingRight = (item.parentId === 1) ? 0 : 7;
        return (
            <View style={styles.itemPanel}>
                <View style={[styles.rowPanel,{paddingRight:26}]}>
                    <Text style={[styles.itemSubject,{width:width-sessionWidth-32-40,marginRight:10,
                        opacity: item.mark ? 1 : 0.45}]} numberOfLines={1}>
                        {index+1}.{item.subject}
                    </Text>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.onMark.bind(this,item,index)}>
                        <Image style={styles.itemIgnore} source={item.mark ? require('../assets/images/img_patrol_ignore.png')
                            : require('../assets/images/img_patrol_recover.png')}/>
                    </TouchableOpacity>
                </View>

                <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:3, paddingRight,opacity:item.mark ? 1 : 0.45}}>
                    {
                        item.mark ?  <TouchableOpacity activeOpacity={0.5} onPress={()=>this.inspectDetail.open(`${index+1}.${item.subject}`,item.description)}>
                            <Text style={{fontSize:12,color:'#6097f4',textDecorationLine:'underline'}}>{I18n.t('Inspection details')}</Text>
                        </TouchableOpacity> : <Text style={{fontSize:12,color:'#6097f4',textDecorationLine:'underline'}}>
                            {I18n.t('Inspection details')}
                            </Text>
                    }

                    {
                        (item.parentId !== 1) ? <PatrolGrade onGrade={(grade)=>{this.onGrade(item,index,grade)}} score={scoreValue} enable={item.mark}/>
                            : (item.mark ? <TouchableOpacity activeOpacity={0.5} onPress={this.scoreClick.bind(this,item,index)}>
                            <View style={styles.scorePanel}>
                                <Text style={styles.scoreLabel}>{I18n.t('Score')}</Text>
                                <View style={styles.scoreItem}>
                                    <Text style={[styles.scoreData,{width:40,margin:margin}]}>{scoreValue}</Text>
                                    <Icon style={[styles.scoreIcon,{width:6}]} name="angle-right" size={16} color="#ffffff"/>
                                </View>
                            </View>
                        </TouchableOpacity> :  <View style={styles.scorePanel}>
                                <Text style={styles.scoreLabel}>{I18n.t('Score')}</Text>
                                <View style={styles.scoreItem}>
                                    <Text style={[styles.scoreData,{width:40,margin:margin}]}>{scoreValue}</Text>
                                    <Icon style={[styles.scoreIcon,{width:6}]} name="angle-right" size={16} color="#ffffff"/>
                                </View>
                            </View>)
                    }
                </View>
                {
                        item.mark && item.attachment.length > 1 ?
                        <FlatList style={{marginTop:12}}
                                               data={item.attachment}
                                               extraData={this.state}
                                               keyExtractor={(item, index) => item.toString()}
                                               renderItem={this.renderAttachment}
                                               horizontal={true}
                                               showsHorizontalScrollIndicator={false}
                            />
                        : null
                 }
                {
                    item.mark ? audio: <View style={styles.audioPanel}/>
                }
                {
                    item.mark ?
                    <View style={{marginTop:10}}>
                        <SourceInput
                             width={width-sessionWidth-35}
                             initType={item.uiType}
                             picker ={this.allowPicker}
                             onPicture={(path)=>{this.showPicture(path,item,index)}}
                             onVideo={(path)=>{this.showVideo(path,item,index)}}
                             onAudio={(path)=>{this.audioClick(path,item,index)}}
                             onPressCamera= {()=>this.onGoCamera(item,index)}
                             onPressAudio={()=>this.onGoRecord(item,index)}
                             onPressText={()=>this.onGoText(item,index)}
                             onLocalPictures={(path)=>{this.onLocalPictures(path,item,index)}}
                         />
                    </View> :
                    <View style={{marginTop:10,opacity:0.45}}>
                        <SourceInput
                             width={width-sessionWidth-35}
                             picker ={this.allowPicker}
                             initType={item.uiType}
                             disable={true}
                          />
                     </View>
                }
            </View>
        )
    };

    renderAttachmentEx = ({ item,index }) => {
        let picture = null;
        if(item.mediaType === 1){
            picture = <TouchableOpacity onPress={() => Actions.push('pictureViewer',{uri: item.mediaPath})}>
                <Image style={{width:80,height:60}} source={{uri: item.mediaPath}} resizeMode='stretch'/>
            </TouchableOpacity>
        }

        let video = null;
        if(item.mediaType === 2){
            video = <ImageBackground style={{width:80,height:60,alignItems:'center'}} source={this.thumbnailUrl} resizeMode='cover'>
                <TouchableOpacity onPress={() => Actions.push('videoPlayer',{uri: item.mediaPath})}>
                    <Image style={{width:20,height:20,marginTop:22}} source={require('../assets/images/pic_play_icon.png')}
                           resizeMode='contain'/>
                </TouchableOpacity>
            </ImageBackground>
        }

        let splice = null;
        if(item.mediaType !== 0){
            splice = <TouchableOpacity style={{position:'absolute',width:15,height:15,left:65}}
                  activeOpacity={0.5} onPress={() => {this.mediaDelete(item,index)}}>
                <Image style={{width:15,height:15}} source={require('../assets/images/img_media_delete.png')}></Image>
            </TouchableOpacity>
        }

        return (
            <View style={{marginRight:10}}>
                {picture}
                {video}
                {splice}
            </View>
        )};

    renderItemEx = ({ item,index}) => {
        let audio = null;
        let audioDelete = null;
        if (item.audioPath != ''){ audioDelete = (
            <TouchableOpacity activeOpcity={0.5} onPress={()=>this.audioDelete(item,index)}>
                <Image style={{width:24,height:24,marginLeft:8}} source={require('../assets/images/img_audio_delete.png')}></Image>
            </TouchableOpacity>
        )}

        if (item.uiType == 'text' || item.uiType == null ){ audio = (
            <TextInput style={styles.issueDescriptionEx} multiline={true} value={item.comment} onChangeText={(text)=>this.onDescriptionChange(text,item,index)} placeholder={I18n.t('Enter info')}/>
        )}
        else if (item.uiType == 'audio' ){ audio = (
            <View style={styles.audioPanelEx}>
                 <SoundPlayer path={item.audioPath} maxLength={250} input={true}/>
                 {audioDelete}
            </View>
        )}
        else if (item.uiType == 'picture' ){ audio = (
            <View style={styles.audioPanelEx}/>
        )}

        let scoreValue = ((item.parentId === 1) && (item.score === this.score[0].label)) ? this.score[0].score : item.score;
        let margin = ((item.parentId === 1) && (item.score !== this.score[0].label)) ? -2 : 0;
        let marginBottom = (index === this.state.collection.length-1) ? 67 : 8;
        let paddingRight = (item.parentId === 1) ? 0 : 7;
        return (
            <View style={[styles.itemPanel,{marginBottom}]}>
                <View style={[styles.rowPanel,{paddingRight:12}]}>
                    <Text style={[styles.itemSubject,{width:width-32-40,marginRight:10,
                        opacity: item.mark ? 1 : 0.45}]} numberOfLines={1}>
                        {index+1}.{item.subject}
                    </Text>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.onMark.bind(this,item,index)}>
                        <Image style={styles.itemIgnore} source={item.mark ? require('../assets/images/img_patrol_ignore.png')
                            : require('../assets/images/img_patrol_recover.png')}/>
                    </TouchableOpacity>
                </View>

                <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:3,paddingRight,opacity:item.mark ? 1 : 0.45}}>
                    {
                        item.mark ?  <TouchableOpacity activeOpacity={0.5} onPress={()=>this.inspectDetail.open(`${index+1}.${item.subject}`,item.description)}>
                            <Text style={{fontSize:12,color:'#6097f4',textDecorationLine:'underline'}}>{I18n.t('Inspection details')}</Text>
                        </TouchableOpacity> : <Text style={{fontSize:12,color:'#6097f4',textDecorationLine:'underline'}}>
                            {I18n.t('Inspection details')}
                            </Text>
                    }

                    {
                        (item.parentId !== 1) ? <PatrolGrade onGrade={(grade)=>{this.onGrade(item,index,grade)}}
                                                             score={scoreValue} enable={item.mark}/>
                            : (item.mark ? <TouchableOpacity activeOpacity={0.5} onPress={this.scoreClick.bind(this,item,index)}>
                            <View style={styles.scorePanel}>
                                <Text style={styles.scoreLabel}>{I18n.t('Score')}</Text>
                                <View style={styles.scoreItem}>
                                    <Text style={[styles.scoreData,{width:40,margin:margin}]}>{scoreValue}</Text>
                                    <Icon style={[styles.scoreIcon,{width:6}]} name="angle-right" size={16} color="#ffffff"/>
                                </View>
                            </View>
                        </TouchableOpacity> : <View style={styles.scorePanel}>
                                <Text style={styles.scoreLabel}>{I18n.t('Score')}</Text>
                                <View style={styles.scoreItem}>
                                    <Text style={[styles.scoreData,{width:40,margin:margin}]}>{scoreValue}</Text>
                                    <Icon style={[styles.scoreIcon,{width:6}]} name="angle-right" size={16} color="#ffffff"/>
                                </View>
                            </View>)
                    }
                </View>
                {
                    item.mark && item.attachment.length > 1 ?
                    <FlatList style={{marginTop:12,marginLeft:0}}
                                               data={item.attachment}
                                               extraData={this.state}
                                               keyExtractor={(item, index) => item.toString()}
                                               renderItem={this.renderAttachmentEx}
                                               horizontal={true}
                                               showsHorizontalScrollIndicator={false}
                    />
                    : null
                 }
                {
                    item.mark ? audio: <View style={styles.audioPanel}/>
                }
                {
                    item.mark ?
                    <View style={{marginTop:10}}>
                        <SourceInput
                             initType={item.uiType}
                             picker ={this.allowPicker}
                             onPicture={(path)=>{this.showPicture(path,item,index)}}
                             onVideo={(path)=>{this.showVideo(path,item,index)}}
                             onAudio={(path)=>{this.audioClick(path,item,index)}}
                             onPressCamera= {()=>this.onGoCamera(item,index)}
                             onPressAudio={()=>this.onGoRecord(item,index)}
                             onPressText={()=>this.onGoText(item,index)}
                             onLocalPictures={(path)=>{this.onLocalPictures(path,item,index)}}
                         />
                    </View> :
                    <View style={{marginTop:10,opacity:0.45}}>
                        <SourceInput
                             initType={item.uiType}
                             picker ={this.allowPicker}
                             disable={true}
                          />
                     </View>
                }
            </View>
        )
    };

    renderCollection(){
        let absHeight = this.state.unEvaluated ? (lib.isAndroid() ? height-48
                : (height - 48 - lib.defaultStatusHeight())) : 0;
        let viewHeight = this.state.unEvaluated ? 30 : 0;
        let iconHeight = this.state.unEvaluated ? 12 : 0;
        let absTop = lib.isAndroid() ? 48 : (lib.defaultStatusHeight()+48);

        return (<View style={{position:'absolute',top:absTop,left:0,backgroundColor:'#ffffff',height:absHeight}}>
                <View style={{width:width,height:viewHeight,backgroundColor:'#f7f8fc',flexDirection:'row',
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

                <FlatList ref={(ref => this.collection = ref)}
                      data={this.state.collection}
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
        </View>)
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
                    this.collection.scrollToOffset({animated: true, offset: 0}) : null
            }

        }catch (e) {
        }
    }

    render() {
        let absTop = 48+lib.statusBarHeight();
        let absHeight = height-48-lib.defaultStatusHeight();
        (this.state.promptContext !== '') ? (absTop = absTop+30) : absTop;
        (this.state.promptContext !== '') ? (absHeight = absHeight-30) : absHeight;

        let items = null, keyIndex = 0;
        if (!this.state.isLoading){
            if (this.state.isCheck) { items = (
                <View style={styles.dataPanel}>
                    <ScrollView showsVerticalScrollIndicator={false} ref={(c) => {this.scroll = c}}>
                        <Text numberOfLines={1} style={{fontSize: 12, color: '#888c95',marginLeft:20,
                            marginTop:10,marginBottom:-10,marginRight:20,maxWidth: 200}}>
                            {this.state.groupName}
                        </Text>
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
                <View style={styles.dataPanel}>
                    <ScrollView ref={(ref)=>{this.scrollEvent=ref}}>
                        <FlatList data={this.state.events}
                                  extraData={this.state}
                                  keyExtractor={(item, index) => index.toString()}
                                  renderItem={this.renderEvent}
                                  showsVerticalScrollIndicator={false}
                                  ItemSeparatorComponent={() => <View style={{
                                      height: 1,
                                      width: width-sessionWidth,
                                      backgroundColor: '#dcdcdc'
                                  }}/>}
                        />
                    </ScrollView>

                    {
                        this.state.events.length !== 0 ? null: <View>
                            <Text style={styles.eventTip}>{I18n.t('Create feedbacks')}</Text>
                            <Image source={require('../assets/images/img_check_arrow.png')} style={styles.eventArrow}/>
                        </View>
                    }
                    <View style={{position:'absolute',bottom:10,right:10}}>
                        <TouchableOpacity activeOpacity={0.5} onPress={this.eventCreate.bind(this)}>
                            <Image source={require('../assets/images/img_check_add.png')} style={{width:86,height:86,opacity:0.75}}/>
                        </TouchableOpacity>
                    </View>
                </View>
            )
            }
        }

        let prompt = null;
        if (this.state.noData == null && !this.state.isLoading && this.state.promptContext !== ''){
            prompt = this.renderPrompt();
        }

        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={this.backClick.bind(this)} style={{width:50}}>
                        <Image source={RouteMgr.getRenderIcon()} style={{width:48,height:48}}/>
                    </TouchableOpacity>
                    <View style={{width:20}}/>
                    <View style={{width:width-140,height:48,justifyContent: 'center',flexDirection:'row', paddingLeft:20,paddingRight:20}}>
                        <Text style={[styles.NavBarTitle,{fontSize:18,textAlign:'center',maxWidth: 175,marginLeft:30}]} numberOfLines={1}>
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
                                 onPress={this.submitClick.bind(this)}  style={{width:70,alignSelf:'center'}}>
                            <Text style={styles.NavBarTitle}>{I18n.t('Confirm summary')}</Text>
                        </TouchableOpacity> : <View style={{width:70,alignSelf:'center'}}>
                            <Text style={[styles.NavBarTitle,{color:'rgba(255,255,255,0.5)'}]}>{I18n.t('Confirm summary')}</Text>
                        </View>
                    }

                </View>

                {
                    this.state.noData !== null  ? <View style={{flex:1,alignItems: 'center', justifyContent: 'flex-start'}}>
                        <View style={styles.imagePanel}>
                            <Image style={styles.imageIcon} source={require('../assets/images/img_nodata.png')}></Image>
                        </View>
                        <Text style={styles.submitText}>{this.state.noDataTip}</Text>
                    </View> : null
                }

                {
                    this.state.isLoading ? this.renderLoadingView()
                        : (this.state.data.length !== 0) ?
                        <ScrollView style={[styles.sessionPanel,{top:absTop,paddingBottom:30}]}
                            showsVerticalScrollIndicator={false}>
                            <FlatList
                                 data={this.state.data}
                                 extraData={this.state}
                                 keyExtractor={(item, index) => index.toString()}
                                 renderItem={this.renderRow}
                                 showsVerticalScrollIndicator={false}
                            />
                            <View style={{height: (this.state.promptContext !== '') ? 110 : 82}}/>
                        </ScrollView>: null
                }

                {prompt}
                {items}
                {
                    this.renderCollection()
                }

                {
                    (!this.state.keyboardActive && !this.state.isLoading && this.state.data.length > 0 &&
                        this.state.isCheck && (this.state.items.length > 0 || this.state.events.length > 0)) ?
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

                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}}/>
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
        textAlignVertical:'center',
        lineHeight:48
    },
    sessionPanel:{
        position:'absolute',
        left: 0,
        top: 48+lib.statusBarHeight(),
        width: sessionWidth,
        height:height-lib.defaultStatusHeight(),
        backgroundColor:'#f6f8fa'
    },
    sessionNull:{
        position:'absolute',
        left: 0,
        top: 48+lib.statusBarHeight(),
        width: sessionWidth,
        height:height,
        backgroundColor:'#ffffff'
    },
    dataPanel:{
        flex:1,
        width:width-sessionWidth,
        marginLeft:sessionWidth,
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
        marginTop: 8,
        textAlign:'center',
        color: '#19293b'
    },
    sessionNameSelected:{
        fontSize: 12,
        marginTop: 8,
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
        marginRight:2
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
        lineHeight: 17,
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
        marginTop:10,
        width: 250,
        height: 46,
        borderColor: '#dcdcdc',
        paddingTop:0,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        overflow: 'hidden',
    },
    audioPanelEx:{
        marginTop:10,
        width: width-40,
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
        marginRight:6,
        height: 46,
        borderWidth: 1,
        borderColor: '#dcdcdc',
        paddingVertical: 0,
        borderRadius: 2,
        alignItems:'center',
        paddingLeft:10,
        ...Platform.select({
            ios:{paddingTop:12}
        })
    },
    issueDescriptionEx:{
        marginTop:10,
        width: width-40,
        height: 46,
        borderWidth: 1,
        borderColor: '#dcdcdc',
        paddingVertical: 0,
        borderRadius: 2,
        alignItems:'center',
        paddingLeft:10,
        ...Platform.select({
            ios:{paddingTop:12}
        })
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
    evtSessionNormal:{
        fontSize: 12,
        textAlign:'center',
        color: '#19293b',
        height:40,
        alignSelf:'center',
        textAlignVertical:'center'
    },
    evtSessionSelected:{
        fontSize: 12,
        textAlign:'center',
        color: ColorStyles.COLOR_MAIN_RED,
        height:40,
        alignSelf:'center',
        textAlignVertical:'center'
    },
     eventTip:{
        fontSize:16,
         color:'#d5dbe4',
         position:'absolute',
         bottom:90,
         right:20,
         marginLeft:30
    },
    eventArrow:{
        width:48,
        height:48,
        position:'absolute',
        bottom:40,
        right:100,
    }
});
