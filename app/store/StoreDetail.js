import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    ScrollView,
    DeviceEventEmitter,
    TouchableOpacity
} from "react-native";
import PropTypes from 'prop-types';
import {Actions} from "react-native-router-flux";
import I18n from "react-native-i18n";
import store from "../../mobx/Store";
import Navigation from "../element/Navigation";
import PatrolRecord from "../inspection/PatrolRecord";
import ReportGroup from "../report/ReportGroup";
import ModalPatrol from "../customization/ModalPatrol";
import NetInfoIndicator from "../components/NetInfoIndicator";
import PatrolPrompt from "../components/inspect/PatrolPrompt";
import PatrolParser from "../components/inspect/PatrolParser";
import Temporary from "../report/Temporary";
import {REFRESH_STORE_DETAIL} from "../common/Constant";
import EventGroup from "../event/EventGroup";
import SlotView from "../customization/SlotView";
import ProcessResult from "../event/ProcessResult";
import ScrollTop from "../element/ScrollTop";
import * as BorderShadow from "../element/BorderShadow";
import SignIn from "../signin/Index";
import {getStoreInfo} from "../common/FetchRequest";
import AccessHelper from '../common/AccessHelper';
import Spinner from "../element/Spinner";

const {width} = Dimensions.get('screen');
export default class StoreDetail extends Component {
    state = {
        showScrollTop: false,
        enumSelector: store.enumSelector,
        videoSelector: store.videoSelector,
        screenSelector: store.screenSelector,
        userSelector: store.userSelector,
        storeSelector: store.storeSelector,
        patrolMode: store.enumSelector.patrolType.ONSITE,
        actionType: store.enumSelector.actionType.ADD,
        actionResult: null,
        openVideo: false
    };

    static propTypes = {
        selector: PropTypes.object.isRequired
    };

    componentWillMount(){
        this.refreshEmitter = DeviceEventEmitter.addListener(REFRESH_STORE_DETAIL, () => {
            this.patrolRecord && this.patrolRecord.fetchData();
            this.reportGroup && this.reportGroup.fetchData();

            this.unclosed && this.unclosed.fetchData();
            this.closed && this.closed.fetchData();
        });
    }

    componentWillUnmount(){
        this.refreshEmitter && this.refreshEmitter.remove();
    }

    renderHeader(){
        const {collection} = this.props.selector;

        return (
            <View style={styles.headerPanel}>
                <Text style={styles.headerName}>{collection.name}</Text>
                <Text style={styles.areaText} numberOfLines={1}>{collection.address}</Text>
            </View>
        )
    }

    onPatrol(patrolMode){
        let {enumSelector, userSelector, storeSelector} = this.state;
        let isMysteryModeOn = userSelector.isMysteryModeOn;

        if(patrolMode == enumSelector.patrolType.ONSITE && (!isMysteryModeOn && !AccessHelper.enableLocalInspect())) {
            DeviceEventEmitter.emit('Toast', I18n.t('Service permission'));
            return;
        }
        
        if(patrolMode == enumSelector.patrolType.REMOTE && (!isMysteryModeOn && !AccessHelper.enableRemoteInspect())) {
            DeviceEventEmitter.emit('Toast', I18n.t('Service permission'));
            return;
        }

        if(storeSelector.collection && storeSelector.collection.status != 20 
            && storeSelector.collection.status != 21 && storeSelector.collection.status != 60) {
            DeviceEventEmitter.emit('Toast', I18n.t('Service overdue'));
            return;
        }

        if ((this.prompt == null) || (this.modalPatrol == null)){
            return;
        }

        this.setState({patrolMode}, () => {
            PatrolParser.isExist() ? this.prompt.open() : this.modalPatrol.open();
        });
    }

    renderContent(label, content, callback){
        return (
            <View style={[styles.viewPanel, BorderShadow.div]}>
                <Text style={styles.label}>{label}</Text>
                <TouchableOpacity activeOpacity={0.5} onPress={callback}>
                    <View style={styles.contentPanel}>
                        <Text style={styles.content}>{content}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    async onVideo(){
        let patrolSelector = store.patrolSelector;
        let {enumSelector,screenSelector,openVideo} = this.state;
        if(openVideo == true) {
            return;
        } else {
            this.setState({openVideo: true});
        }        
        let result = await getStoreInfo(this.props.selector.collection.storeId, true);
        if (result.errCode !== enumSelector.errorType.SUCCESS){
            DeviceEventEmitter.emit('Toast', I18n.t('Get store error'));
            this.setState({openVideo: false});
            return;
        }
        if (result.data.device.length == 0){
            DeviceEventEmitter.emit('Toast', I18n.t('No cameras'));
            this.setState({openVideo: false});
            return;
        }
        if (!AccessHelper.enableStoreMonitor() || !AccessHelper.enableVideoLicense()){
            DeviceEventEmitter.emit('Toast', I18n.t('Video license'));
            this.setState({openVideo: false});
            return;
        }
        patrolSelector.router = screenSelector.patrolType.MONITOR;
        patrolSelector.store =  result.data;
        patrolSelector.deviceId = null;
        
        this.setState({patrolSelector}, () =>  {      
           Actions.push('patrolVideo');
           this.setState({openVideo: false});
       }); 
    }

    render() {
        const {collection} = this.props.selector;
        let {actionType, actionResult, showScrollTop, patrolMode, enumSelector, userSelector, openVideo} = this.state;
        let isMysteryModeOn = userSelector.isMysteryModeOn;

        let showEventGroup = true;
        if(!AccessHelper.enableEventHandle() && !AccessHelper.enableEventAdd() 
            && !AccessHelper.enableEventClose() && !AccessHelper.enableEventReject()) {
            showEventGroup = false;
        }

        return (
            <View style={styles.container}>
                <Navigation
                    onLeftButtonPress={()=>{Actions.pop()}}
                    title={I18n.t('Store detail')}
                    rightButtonTitle={(isMysteryModeOn || (AccessHelper.enableLocalInspect() != false)) ? I18n.t('Onsite shortening') : ''}
                    rightButtonEnable={(isMysteryModeOn || (AccessHelper.enableLocalInspect() != false)) ? true : false}
                    rightButtonStyle={(isMysteryModeOn || (AccessHelper.enableLocalInspect() != false)) ? {activeColor:'#C60957', inactiveColor:'#DCDFE5',
                        textColor:'#ffffff', padding: 12, fontSize:14} : {}}
                    onRightButtonPress={() => {
                        this.onPatrol(enumSelector.patrolType.ONSITE);
                    }}/>
                <NetInfoIndicator/>
                <ScrollView ref={c => this.scroll = c}
                            style={styles.panel}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps={'handled'}
                            onScroll={(event) => {
                                this.setState({showScrollTop: event.nativeEvent.contentOffset.y > 200})
                            }}>
                    {this.renderHeader()}
                    <PatrolRecord ref={c => {this.patrolRecord = c}} storeId={collection.storeId} showMode={true}/>
                    <SlotView containerStyle={{height:16}}/>

                    {(isMysteryModeOn || (AccessHelper.enableRemoteInspect() != false)) && this.renderContent(I18n.t('Remote patrol'), I18n.t('Start remote patrol'), () => {
                        this.onPatrol(enumSelector.patrolType.REMOTE);
                    })}

                    {(!isMysteryModeOn && (AccessHelper.enableStoreMonitor() != false)) && this.renderContent(I18n.t('Store monitor'), I18n.t('View video'), async () => {
                        await this.onVideo();
                    })}

                    {(isMysteryModeOn || (AccessHelper.enableInspectReport() != false)) && <ReportGroup ref={c => {this.reportGroup = c}} storeId={collection.storeId}/>}
                    <Temporary storeName={collection.name}/>
                    {(showEventGroup && !isMysteryModeOn) && <EventGroup ref={c => {this.unclosed = c}} status={[0,1,3]} storeId={[collection.storeId]}
                                groupName={I18n.t('Recent events')} headerName={I18n.t('All')}
                                onRefresh={(actionType) => {this.setState({actionType, actionResult: true})}}/>}
                    {(showEventGroup && !isMysteryModeOn) && <EventGroup ref={c => {this.closed = c}} status={[2]} storeId={[collection.storeId]}
                                groupName={I18n.t('Closed items')} headerName={I18n.t('All')}/>}
                    <SlotView containerStyle={{height:20}}/>
                </ScrollView>
                <ModalPatrol ref={c => this.modalPatrol = c} storeId={collection.storeId} mode={patrolMode}
                             onSign={(data) => {this.modalSign && this.modalSign.open(data)}}/>
                <SignIn ref={c => this.modalSign = c}/>
                <PatrolPrompt ref={c => this.prompt = c} title={I18n.t('Quitting confirm')}
                              cancel={() => {this.modalPatrol && this.modalPatrol.open()}}/>
                <ProcessResult actionType={actionType} actionResult={actionResult} reset={() => this.setState({actionResult: null})}/>
                <Spinner visible={openVideo} textContent={I18n.t('Loading')} textStyle={{color:'#ffffff',fontSize:14,marginTop:-50}}/>
                <ScrollTop showOperator={showScrollTop} onScroll={() => {this.scroll && this.scroll.scrollTo({x:0, y:0, animated: true})}}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex:1,
    },
    title:{
        fontSize: 18,
        fontWeight:'bold',
        marginTop:20,
        color:'#1E272E'
    },
    panel:{
        flex:1,
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor:'#F7F9FA'
    },
    headerPanel: {
        marginTop: 24,
        paddingLeft:10
    },
    headerName:{
        fontSize:20,
        color:'#64686D'
    },
    headerPatrol:{
        alignItems:'center',
        width:88,
        height:28,
        borderRadius:16,
        backgroundColor: '#666666'
    },
    headerContent:{
        fontSize: 16,
        color: '#ffffff',
        height:28,
        lineHeight: 28,
        textAlignVertical:'center',
        textAlign: 'center'
    },
    areaPanel:{
        height: 42,
        backgroundColor: '#ffffff',
        marginTop: 6,
        borderRadius: 4
    },
    areaText:{
        color: '#86888A',
        fontSize:12,
        marginTop:6,
        marginBottom:22
    },
    viewPanel:{
        backgroundColor:'#fff',
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        width:width-20,
        height:58,
        marginTop:20,
        borderRadius:10,
        paddingLeft: 16,
        paddingRight: 14
    },
    label:{
        color:'rgb(100,104,109)',
        fontSize:14
    },
    contentPanel:{
        width:110,
        borderRadius:10,
        borderColor:'#006AB7',
        borderWidth:1,
        height:30
    },
    content:{
        height:30,
        lineHeight:30,
        textAlign: 'center',
        textAlignVertical: 'center',
        color:'#006AB7',
        fontSize:14,
        marginTop:-1
    }
});
