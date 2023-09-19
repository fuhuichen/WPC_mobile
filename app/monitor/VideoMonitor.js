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
    TouchableOpacity,
    View
} from 'react-native';
import {Calendar} from 'react-native-calendars'
import {CalendarIOS} from '../thirds/calendars/index';
import Icon from 'react-native-vector-icons/FontAwesome'
import ModalBox from 'react-native-modalbox';
import TimePicker from '../thirds/timepicker/TimePicker';
import TimePickerIOS from '../thirds/timepicker/TimePickerIOS';
import {Actions} from 'react-native-router-flux';
import HttpUtil from "../utils/HttpUtil";
import RNStatusBar from '../components/RNStatusBar';
import TimeUtil from "../utils/TimeUtil";
import Toast from "react-native-easy-toast";
import moment from 'moment';
import {ColorStyles} from '../common/ColorStyles';
import I18n from 'react-native-i18n';
import RecentStore from "./RecentStore";
import {EMITTER_MODAL_CLOSE} from "../common/Constant";
import RouteMgr from "../notification/RouteMgr";
import VideoSwitch from '../video/VideoSwitch';

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class VideoMonitor extends Component {
    constructor(props) {
        super(props);

        this.connect = true;
        this.data = this.props.data;
        this.emitter = this.props.emitter;

        let now = new Date();
        this.state = {
            markedDates: {},
            selectedDate: "",
            selectedTime: now,
            selectedHours: now.getHours(),
            selectedMinutes: now.getMinutes(),
            selectedSeconds: now.getSeconds(),
            channelIndex: this.props.channelId,
            isCollect: this.props.isCollect,
            navbarTitle: '',
            enableTouch: true ,
            enableChannel:true,
            device:this.data.device,
            ezvizFullScreen: false,
            playerMode:0
        }

        this.setMarkedDates = this.setMarkedDates.bind(this);
        this.timeBackClick = this.timeBackClick.bind(this);
        this.selectHmsClick = this.selectHmsClick.bind(this);
        this.onTimeSelected = this.onTimeSelected.bind(this);

        this.modalBoxCancel = this.modalBoxCancel.bind(this);
        this.modalBoxConfirm = this.modalBoxConfirm.bind(this);

        this.collectClick = this.collectClick.bind(this);
        this.realPreview = true;
    }

    componentDidMount(){
        this.refs.VideoSwitch.initPlayer(this.state.channelIndex);
        RecentStore.update(this.data.storeId);
        let date = TimeUtil.getCurrentDate();
        this.setMarkedDates(date,true);
        this.imageEmitter = DeviceEventEmitter.addListener('onImageRefresh', this.onImageRefresh.bind(this));
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_MODAL_CLOSE,
            ()=>{
                this.modalBoxCancel();
            });
    }

    componentWillUnmount() {
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('videoMonitorBack', this.refs.VideoSwitch.onBackAndroid);
       }
        this.imageEmitter && this.imageEmitter.remove();
        this.notifyEmitter && this.notifyEmitter.remove();
    }

    timeBackClick(){
        this.realPreview = true;

        let device = this.data.device;
        let index = this.state.channelIndex;
        let thisDevice = device[index];

        this.refs.VideoSwitch.startPlay(thisDevice.ivsId,thisDevice.channelId,null);

        let date = TimeUtil.getCurrentDate();
        let time = new Date();
        this.setState({
            selectedHours: time.getHours(),
            selectedMinutes: time.getMinutes(),
            selectedSeconds: time.getSeconds()
        })
        this.setMarkedDates(date,false);
    }

    setMarkedDates(key,refresh) {
        let markedDates = {};
        if (typeof this.state.markedDates[key] !== 'undefined' && refresh) {
            markedDates = {[key]: {selected: !this.state.markedDates[key].selected}};
        } else {
            markedDates = {[key]: {selected: true}};
        }

        this.setState((prevState) => {
            return {...prevState, markedDates,selectedDate:key};
        })
    }

    selectHmsClick(){
        this.refs.modalBox.open();
    }

    onTimeSelected(date){
       this.setState({
           selectedTime: date
       })
    }

    modalBoxCancel(){
        this.refs.modalBox.close();
    }

    padZero(number){
         return number.toString().length <2 ? '0'+ number: number;
    }

    modalBoxConfirm(){
        this.realPreview = false;

        let {selectedTime} = this.state;
        this.setState({
            selectedHours: selectedTime.getHours(),
            selectedMinutes: selectedTime.getMinutes(),
            selectedSeconds: selectedTime.getSeconds()
        })
        let time = this.state.selectedDate.replace(new RegExp('-',"gm"),'/') +
            ' ' + selectedTime.getHours() + ':'+ selectedTime.getMinutes()+ ':'+selectedTime.getSeconds();
        let timex = new Date(time).getTime()/1000;
        this.modalBoxCancel();
        let device = this.data.device;
        let index = this.state.channelIndex;
        if (device.length >= 1){
            let thisDevice = device[index];
            this.refs.VideoSwitch.startPlay(thisDevice.ivsId,thisDevice.channelId,timex);
        }
    }

    channelClick(item,index){
        this.setState({
            navbarTitle: item.name,
            channelIndex: index,
            enableChannel: item.vendor > 0 ? true : false
        });
        let device = this.state.device;
        device.forEach((itemChild, indexChild) => {
            itemChild.check = indexChild == index ? true: false;
        });
        this.setState({device:device});
        if(item.vendor !== this.state.playerMode){
            this.refs.VideoSwitch.initPlayer(index);
        }

        if(this.realPreview){
            if(item.vendor !== this.state.playerMode){
                this.refs.VideoSwitch.setTime(null);
            }
            else{
                this.refs.VideoSwitch.startPlay(item.ivsId,item.channelId,null);
            }        
        }else{
            let {selectedTime} = this.state;
            let time = this.state.selectedDate.replace(new RegExp('-',"gm"),'/') +
                ' ' + selectedTime.getHours() + ':'+ selectedTime.getMinutes()+ ':'+selectedTime.getSeconds();
            let timex = new Date(time).getTime()/1000;
            if(item.vendor !== this.state.playerMode){
                this.refs.VideoSwitch.setTime(timex);
            }
            else{
                this.refs.VideoSwitch.startPlay(item.ivsId,item.channelId,timex);
            }     
        }

        setTimeout(()=>{
            this.setState({enableChannel: true});
        },3000);
    }

    collectClick(){
        try {
            let body = {storeIds:[]};
            body.storeIds.push(this.data.storeId);

            let isCollect = this.state.isCollect;
            let url = isCollect ? 'favorite/delete' : 'favorite/add';
            HttpUtil.post(url, body)
                .then(result => {
                    this.setState({
                        isCollect: !isCollect
                    })
                })
                .catch(error => {
                })

        }catch (e) {
            console.log("VideoMonitor-collectClick:" + e);
        }
    }

    backClick(){
        DeviceEventEmitter.emit(this.emitter,0);
        Actions.pop();
    }

    onImageRefresh(path) {
        if(path != null){
            let channelIndex = this.state.channelIndex;
            Actions.replace('createEvent',{
                evtType: 'Image',
                uri:path,
                storeId: this.data.storeId,
                storeName: this.data.name,
                channelId: this.data.device[channelIndex].id
            });
        }else{
            Actions.pop();
        }
    }

    addEvent(isSnapshot,uri){
        if(this.playerMode  === 1 && Platform.OS === 'ios'){
            this.refs.VideoSwitch.onPauseStatus(1);
        }
        if (isSnapshot){
            Actions.push('imageCanvas',{type:'onImageRefresh',uri});
        }
        else {
            let channelIndex = this.state.channelIndex;
            Actions.push('createEvent',{
                evtType: 'Video',
                uri:uri,
                storeId: this.data.storeId,
                storeName: this.data.name,
                channelId: this.data.device[channelIndex].id
            });
        }
    }

    renderItem = ({ item,index }) => {
        let source = item.check ? require('../assets/images/img_channel_check.png'):require('../assets/images/img_channel_normal.png');
        let color =  item.check ? '#57E78F':'#989ba3';
        return (
            <TouchableOpacity style={styles.itemPanel} onPress={()=>this.channelClick(item,index)}>
                <Image source={source} style={styles.itemImage}/>
                <Text style={[styles.itemName,{color: color}]} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
        )
    }

    renderLeftArrow(){
        return (
            <Icon style={{marginLeft:30}}
                  name="angle-left"
                  size={20}
                  color="#7a8fae"
            />
        )
    }

    renderRightArrow(){
        return (
            <Icon style={{marginRight:30}}
                  name="angle-right"
                  size={20}
                  color="#7a8fae"
            />
        )
    }

    render() {
        let pointerEvents = this.state.enableTouch === true ? 'auto':'none';
        let pointerChannel = this.state.enableChannel === true ? 'auto':'none';

        return (
            <View style={styles.container}>
                <RNStatusBar/>
                {
                    !this.state.ezvizFullScreen ? <View style={styles.NavBarPanel} pointerEvents={pointerEvents}>
                        <TouchableOpacity activeOpacity={0.5} onPress={this.backClick.bind(this)} style={{width:40}}>
                            <Image source={RouteMgr.getRenderIcon()} style={{width:48,height:48}}/>
                        </TouchableOpacity>
                        <View style={{width:width-80,height:48,alignItems: 'center'}}>
                            <Text style={[styles.NavBarTitle,{fontSize:18}]} numberOfLines={1}>{this.state.navbarTitle}</Text>
                        </View>
                        <TouchableOpacity activeOpacity={1} onPress={this.collectClick}  style={{width:40,alignItems:'center'}}>
                            {
                                this.state.isCollect ? <Image source={require('../assets/images/img_star_collect.png')} style={{width:48,height:48}}/>
                                    :<Image source={require('../assets/images/img_star_uncollect.png')} style={{width:48,height:48}}/>
                            }
                        </TouchableOpacity>
                    </View> : null
                }
                
                <VideoSwitch ref={'VideoSwitch'}
                             VideoType={'VideoMonitor'}
                             data={this.data}
                             vendorIndex={this.state.channelIndex}
                             ezvizFullScreen={this.state.ezvizFullScreen}
                             NavTitle={(title)=>this.setState({navbarTitle: title})}
                             FullScreen={(screen)=>this.setState({ezvizFullScreen: screen})}
                             PlayerMode={(mode)=>this.setState({playerMode:mode})}
                             EnableTouch={(able)=>this.setState({enableTouch:able})}
                             Device={(device)=>this.setState({device:device})}
                             createEvent={(isSnapshot,uri)=>{this.addEvent(isSnapshot,uri)}}/>

                <View pointerEvents={pointerChannel} style={{marginTop:10}}>
                     <Text style={styles.areasText}>{I18n.t('Regions')}</Text>
                            <FlatList style={styles.areasList}
                                      data={this.state.device}
                                      extraData={this.state}
                                      keyExtractor={(item, index) => index.toString()}
                                      renderItem={this.renderItem}
                                      horizontal={true}
                                      showsHorizontalScrollIndicator={false}
                            />
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <View pointerEvents={pointerEvents} >
                        <View style={styles.splitLine}></View>
                        <View style={styles.dateLabelPanel}>
                            <Text style={styles.dateLabel}>{I18n.t('Select datetime')}</Text>
                            <TouchableOpacity onPress={this.timeBackClick}>
                                <Text style={styles.currentTimeBack}>{I18n.t('Back present')}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={this.selectHmsClick}>
                            <View style={styles.selectTimePanel}>
                                <Text style={styles.hmsLabel}>
                                    {this.padZero(this.state.selectedHours)}:
                                    {this.padZero(this.state.selectedMinutes)}:
                                    {this.padZero(this.state.selectedSeconds)}</Text>
                                <Image  style={{width:30,height:30,marginRight:12}} source={require('../assets/images/time.png')}/>
                            </View>
                        </TouchableOpacity>
                        <View style={{width:width-32,height:1,marginLeft:16,backgroundColor:'#e0e0e0'}}/>
                        {
                            Platform.OS !== 'ios' ?  <Calendar
                                    style={styles.calendar}
                                    minDate={'2010-01-01'}
                                    maxDate={moment().format('YYYY-MM-DD')}
                                    onDayPress={(day) => this.setMarkedDates(day.dateString)}
                                    markedDates={this.state.markedDates}
                                    monthFormat={I18n.t('Month format')}
                                    theme={{
                                        todayTextColor: '#00adf5',
                                        dayTextColor: '#7a8fae',
                                        selectedDayBackgroundColor: ColorStyles.COLOR_MAIN_RED
                                    }}
                                    renderArrow ={(direction) => ((direction === 'left' ? this.renderLeftArrow(): this.renderRightArrow()))}
                                />
                                :  <CalendarIOS
                                    style={styles.calendar}
                                    minDate={'2010-01-01'}
                                    maxDate={moment().format('YYYY-MM-DD')}
                                    onDayPress={(day) => this.setMarkedDates(day.dateString,true)}
                                    markedDates={this.state.markedDates}
                                    monthFormat={I18n.t('Month format')}
                                    theme={{
                                        todayTextColor: '#00adf5',
                                        dayTextColor: '#7a8fae',
                                        selectedDayBackgroundColor: ColorStyles.COLOR_MAIN_RED
                                    }}
                                    renderArrow ={(direction) => ((direction === 'left' ? this.renderLeftArrow(): this.renderRightArrow()))}
                                />
                        }

                        <View style={styles.endBlack}></View>
                    </View>
                </ScrollView>
                <ModalBox style={styles.modalBox} ref={"modalBox"}  position={"center"}
                          isDisabled={false}
                          swipeToClose={false}
                          backdropPressToClose={false}
                          backButtonClose={true}
                          coverScreen={true}>
                    <Text style={styles.timeLabel}>{I18n.t('Time selection')}</Text>
                    <View style={styles.horizontalLine}></View>

                    {
                        Platform.OS !== 'ios' ? <TimePicker
                            format24={true}
                            onTimeSelected={(date)=>this.onTimeSelected(date)}
                            initDate={ new Date(new Date().getFullYear(),
                                new Date().getMonth(),
                                new Date().getDay(),
                                this.state.selectedHours,
                                this.state.selectedMinutes,
                                this.state.selectedSeconds).toISOString()}
                        /> : <TimePickerIOS onTimeSelected={(date)=>this.onTimeSelected(date)}
                            initDate={ new Date(new Date().getFullYear(),
                            new Date().getMonth(),
                            new Date().getDay(),
                            this.state.selectedHours,
                            this.state.selectedMinutes,
                            this.state.selectedSeconds).toISOString()}/>
                    }

                    <View style={[styles.horizontalLine,{marginTop:30}]}></View>
                    <View style={styles.confirmPanel}>
                        <View style={{width:(width-50-1)/2}}>
                            <TouchableOpacity onPress={this.modalBoxCancel}>
                                <Text style={styles.cancel}>{I18n.t('Cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.verticalLine}></View>
                        <View style={{width:(width-50-1)/2}}>
                            <TouchableOpacity onPress={this.modalBoxConfirm}>
                                <Text style={styles.confirm}>{I18n.t('Confirm')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ModalBox>

                <Toast ref="toast" style={{backgroundColor:'#888c95'}} textStyle={{color:'#ffffff'}} position='top' positionValue={140}/>
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
        lineHeight: 48
    },
    areasText:{
        fontSize: 14,
        textAlignVertical: 'center',
        marginLeft: 16
    },
    areasList: {
        width:width,
        height:60,
        backgroundColor: '#ffffff',
        //height: 56,
        marginLeft: 16,
        marginRight: 16,
        marginBottom:10,
        marginTop:10,
    },
    itemPanel:{
        marginRight: 10
    },
    itemImage:{
        width: 40,
        height: 40,
        alignSelf: 'center',
    },
    itemName: {
        fontSize: 11,
        textAlign: 'center',
        textAlignVertical:'center',
        marginTop: 2,
        lineHeight: 18,
        width:70,
        height: 20
    },
    splitLine: {
        height: 14,
        backgroundColor: '#f7f6fb'
    },
    dateLabelPanel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 28,
        backgroundColor: '#ffffff'
    },
    dateLabel: {
        fontSize: 14,
        textAlignVertical: 'center',
        marginLeft: 16,
        lineHeight: 28,
    },
    currentTimeBack: {
        alignSelf: 'center',
        fontSize: 12,
        color: ColorStyles.COLOR_MAIN_RED,
        height: 28,
        textAlignVertical: 'center',
        marginRight: 16,
        ...Platform.select({
            ios:{
                lineHeight:28
            }
        })
    },
    calendar: {
        paddingTop: 0,
        height: 350,
        marginBottom:5
    },
    selectTimePanel:{
        height: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems:'center',
        backgroundColor: '#ffffff',
        borderWidth: 0.5,
        borderTopColor: '#ffffff',
        borderBottomColor:'#ffffff',
        borderLeftColor: '#ffffff',
        borderRightColor: '#ffffff'
    },
    selectTimeLabel: {
        fontSize: 14,
        textAlignVertical: 'center',
        marginLeft: 12,
        lineHeight: 50
    },
    modalboxPanel: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginRight: 2
    },
    hmsLabel: {
        fontSize: 13,
        color: '#7a8fae',
        marginRight: 5,
        textAlignVertical: 'center',
        lineHeight: 50,
        marginLeft:16
    },
    hmsIcon: {
        marginRight: 10,
        textAlignVertical: 'center',
        lineHeight:     50
    },
    endBlack: {
        height:12,
        backgroundColor: '#ffffff'
    },
    modalBox: {
        width: width-50,
        ...Platform.select({
            ios:{
                height:320
            },
            android:{
                height: 290
            }
        }),
        borderRadius:6
    },
    timeLabel:{
        fontSize: 18,
        color: '#19293b',
        alignSelf: 'center',
        marginTop: 16
    },
    horizontalLine:{
        height: 1,
        backgroundColor: '#f5f5f5',
        marginTop: 16
    },
    confirmPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        height: 48
    },
    cancel:{
        color: '#888c9e',
        height: 48,
        textAlignVertical: 'center',
        textAlign:'center',
        marginBottom: 16,
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    },
    verticalLine:{
        width: 1,
        height: 48,
        backgroundColor: '#f5f5f5'
    },
    confirm: {
        color: ColorStyles.COLOR_MAIN_RED,
        height: 48,
        textAlignVertical: 'center',
        textAlign:'center',
        marginBottom: 16,
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    }
});
