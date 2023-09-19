import React, {Component} from 'react';
import { Actions } from 'react-native-router-flux';

import {
    Dimensions,
    Image,
    TextInput,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    DeviceEventEmitter,
    TouchableHighlight,
    Platform, BackHandler
} from 'react-native';

import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
import Timeline from "react-native-timeline-listview";
import HttpUtil from "../utils/HttpUtil";
import RNStatusBar from '../components/RNStatusBar';
import SoundUtil from "../utils/SoundUtil";
import * as lib from '../common/PositionLib';
import {defaultMarginTop} from "../common/PositionLib";
import I18n from "react-native-i18n";
import AccessHelper from "../common/AccessHelper";
import NetInfoIndicator from "../components/NetInfoIndicator";
import RouteMgr from "../notification/RouteMgr";
import {EMITTER_MODAL_CLOSE} from "../common/Constant";
import EventTemplateMulti from "./EventTemplateMulti";
import EventTemplateComment from "./EventTemplateComment";
import {isIphoneX} from "react-native-iphone-x-helper";

export default class EventDetail extends Component {

    constructor(props) {
        super(props);

        this.state = {
             data:[],
             status:0,
             lastStatus:0,
             nowState:this.props.data.status,
             footerData:this.props.data
        };
        this.renderDetail = this.renderDetail.bind(this);
    }

    componentDidMount() {
        SoundUtil.stop();
        this.eventEmitter = DeviceEventEmitter.addListener('onRefresh', this.onRefresh.bind(this));
        setTimeout(()=>{
            this.fetchCommentList();
        },500);

        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_MODAL_CLOSE,
            ()=>{
                this.refs.menu && this.refs.menu.close();
            });
    }

    componentWillUnmount() {
        this.eventEmitter && this.eventEmitter.remove();
        this.notifyEmitter && this.notifyEmitter.remove();
    }

    onRefresh(){
        this.setState({nowState:this.state.lastStatus});
        this.fetchCommentList();
    }

    formatNotification(comment){
        try {
            if(this.props.data.notify && comment.length > 0){
                let footerData = this.state.footerData;
                let attachment = comment[comment.length-1].attachment;
                if (attachment != null){
                    footerData.attachment = [];
                    footerData.storeId = this.props.data.storeId;
                    attachment.forEach((item,index)=>{
                        if(item.mediaType === 0){
                            footerData.audioPath = item.url;
                        }
                        else{
                            footerData.attachment.push(item);
                        }
                    });
                }

                this.setState({footerData});
            }
        }catch (e) {
        }
    }

    fetchCommentList(){
        this.setState({data: []});
        let request = {};
        let eventIds = [];
        eventIds.push(this.props.data.id);
        request.eventIds = eventIds;
        HttpUtil.post('event/comment/list',request)
            .then(result => {
                let comments  = result.data;
                let comment = comments[0].comment;
                // Add for notification details.
                this.formatNotification(comment);

                comment.pop();
                let data = [];
                comment.forEach((item,index)=>{
                    let add = {};
                    if (item.status === 0){
                        add.time = I18n.t('Pending');
                        add.icon = require('../assets/images/img_dot_first.png')
                    }
                    else if (item.status === 1) {
                        add.time = I18n.t('Done');
                        add.icon = require('../assets/images/img_dot_second.png')
                    }
                    else if (item.status === 2){
                        add.time = I18n.t('Closed');
                        add.icon = require('../assets/images/img_dot_over.png')
                    }else if (item.status === 3){
                        add.time = I18n.t('Reject');
                        add.icon = require('../assets/images/img_dot_first.png')
                    }
                    add.ts = item.ts;
                    add.accountName = item.accountName;
                    add.description = item.description;
                    add.attachment = [];
                    let attachment = item.attachment;
                    if (attachment != null){
                        attachment.forEach((item,index)=>{
                            if(item.mediaType === 0){
                                add.audioPath = item.url;
                            }
                            else{
                                add.attachment.push(item);
                            }
                        });
                    }
                    data.push(add);
                    if (index == 0){
                        this.setState({status: item.status});
                    }
                });
                this.setState({data: data});
            })
            .catch(error=>{
            })
    }

    endEvent(status,title){
        SoundUtil.stop();
        this.setState({lastStatus:status});
        Actions.push('eventEnd',{data: this.props.data,status:status,title:title});
    }

    renderDetail(rowData, sectionID, rowID) {
        let splitLine = null;
        if (this.state.data.length === 1) { splitLine = (
            <View style={{position:'absolute',left:-22,top:8,flexDirection:'row',zIndex:50}}>
                <View style={{height:120, width:2,backgroundColor: '#dcdcdc'}}/>
            </View>
        )
        }
        let account = null;
        if (rowData.accountName){ account = (
            <Text style={{color: '#19293b', fontSize:14, textAlignVertical: 'center',textAlign: 'left',
                ...Platform.select({
                    ios:{
                      marginTop:-8
                    },
                    android:{
                        marginTop:-10
                    }
                })
                ,marginBottom:5}}>
                {rowData.accountName}
            </Text>
        )
        }
        return (
            <View style={{flex:1}}>
                {account}
                <EventTemplateComment data={rowData} style={{marginBottom:10}} />
                {splitLine}
            </View>
        )
    }

    render() {
        let MenuDo = null;
        let assigneeName = '--';
        if (this.props.data.assigneeName != null && this.props.data.assigneeName != ''){
            assigneeName = this.props.data.assigneeName;
        }
        let offsetY = isIphoneX() ? 10:40;
        if (this.state.nowState != 2){ MenuDo = (
            <Menu ref={"menu"}>
                <MenuTrigger customStyles={{
                    TriggerTouchableComponent:TouchableOpacity,
                    triggerTouchable: {activeOpacity: 0.6},
                }}>
                    <Text style={[styles.NavBarTitle,{fontSize:14,marginRight:6}]}>{I18n.t('Operation')}</Text>
                </MenuTrigger>
                <MenuOptions optionsContainerStyle={{width:100,marginTop: lib.statusBarHeight()+offsetY}}  >
                    {
                        AccessHelper.enableEventHandle() && this.state.nowState != 1  ? <MenuOption onSelect={() => this.endEvent(1,I18n.t('Handling'))} customStyles={{
                            OptionTouchableComponent: TouchableHighlight,
                            optionTouchable: touchableHighlightProps,
                        }}>
                            <View style={{flexDirection:'row',flex:1,alignItems:'center',height:30}}>
                                <Image source={require('../assets/images/event_icon5_normal.png')} style={styles.menuItemImage}/>
                                <Text style={styles.menuItemTextBlack}>{I18n.t('Handling')}</Text>
                            </View>
                        </MenuOption> : null
                    }
                    {
                        AccessHelper.enableEventAdd() ? <MenuOption onSelect={() => this.endEvent(this.state.status,I18n.t('Adding'))}  customStyles={{
                            OptionTouchableComponent: TouchableHighlight,
                            optionTouchable: touchableHighlightProps,
                        }}>
                            <View style={{flexDirection:'row',flex:1,alignItems:'center',height:30}}>
                                <Image source={require('../assets/images/event_icon7_normal.png')} style={styles.menuItemImage}/>
                                <Text style={styles.menuItemTextBlack}>{I18n.t('Adding')}</Text>
                            </View>
                        </MenuOption> : null
                    }
                    {
                        AccessHelper.enableEventReject() && this.state.nowState === 1 ? <MenuOption onSelect={() => this.endEvent(3,I18n.t('Rejects'))}  customStyles={{
                            OptionTouchableComponent: TouchableHighlight,
                            optionTouchable: touchableHighlightProps,
                        }}>
                            <View style={{flexDirection:'row',flex:1,alignItems:'center',height:30}}>
                                <Image source={require('../assets/images/event_icon8_normal.png')} style={styles.menuItemImage}/>
                                <Text style={styles.menuItemTextBlack}>{I18n.t('Rejects')}</Text>
                            </View>
                        </MenuOption> : null
                    }
                    {
                        AccessHelper.enableEventClose() ? <MenuOption onSelect={() => this.endEvent(2,I18n.t('Closing'))} customStyles={{
                            OptionTouchableComponent: TouchableHighlight,
                            optionTouchable: touchableHighlightProps,
                        }}>
                            <View style={{flexDirection:'row',flex:1,alignItems:'center',height:30}}>
                                <Image source={require('../assets/images/event_icon6_normal.png')} style={styles.menuItemImage}/>
                                <Text style={styles.menuItemTextBlack}>{I18n.t('Closing')}</Text>
                            </View>
                        </MenuOption> : null
                    }
                </MenuOptions>
            </Menu>
        )
        }
        let grade = null;
        if (this.props.data.score != -(2**31)){ grade = (
            <View style={styles.itemRight}>
                <View style={{flexDirection: 'row', justifyContent: 'flex-end',alignItems: 'center'}}>
                    <View style={{paddingLeft:3, paddingRight:3,height: 22,backgroundColor: '#fcba3f',borderRadius:2}}>
                        <Text style={{ color:'#fff',textAlignVertical: 'center',textAlign:'center',...Platform.select({ios:{marginTop:2}})}}>{I18n.t('Score get')}:{this.props.data.score}</Text>
                    </View>
                </View>
            </View>
        )
        }

        let eventSource = null;
        if (this.props.data.sourceType === 0){
            eventSource = require('../assets/images/event_monitor_pic.png')
        }
        else if (this.props.data.sourceType === 1){
            eventSource = require('../assets/images/event_telnet_pic.png')
        }
        else if (this.props.data.sourceType === 2){
            eventSource = require('../assets/images/event_site_pic.png')
        }

        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <View style={{width:width/3,height:48}}>
                        <TouchableOpacity activeOpacity={0.5} onPress={()=>{RouteMgr.popRouter()}} style={{width:48}}>
                            <Image source={RouteMgr.getRenderIcon()} style={styles.NavBarImage} />
                        </TouchableOpacity>
                    </View>
                    <View style={{width:width/3,height:48,alignItems: 'center'}}>
                        <Text style={[styles.NavBarTitle,{fontSize:18}]}>{I18n.t('Event details')}</Text>
                    </View>
                    <View style={{width:width/3-6,height:48,flexDirection: 'row',justifyContent:'flex-end'}}>
                        {MenuDo}
                    </View>
                </View>
                <NetInfoIndicator/>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'handled'} ref={'scrollView'} >
                  <View style={{backgroundColor:'white'}}>
                      <View style={styles.itemContainer}>
                          <View style={styles.itemLeft}>
                              <Image  style={{width:25,height:25,marginTop:8}} source={eventSource}/>
                              <View style={{marginLeft:35,marginTop:-33}}>
                                  <Text ellipsizeMode={'tail'} numberOfLines={6} style={{color: 'black', fontSize:14, textAlignVertical: 'center',
                                      textAlign: 'left',  marginBottom: 5,marginTop:5,width:this.props.data.score != -1 ? width-150 : width-80}}>{this.props.data.subject}</Text>
                                  <Text style={{color: 'black', fontSize:12, textAlignVertical: 'center',textAlign: 'left',  marginTop:3}}>{this.props.data.storeName}</Text>
                                  <View style={{flexDirection:'row'}}>
                                      <Text numberOfLines={1} style={styles.submitter}>{I18n.t('Submitter')}：{this.props.data.assignerName}</Text>
                                      <Text numberOfLines={1} style={styles.assigner}>{I18n.t('Solver')}：{assigneeName}</Text>
                                  </View>
                              </View>
                          </View>
                          {grade}
                      </View>
                      <View style={styles.videoItem}>
                          <EventTemplateMulti data={this.state.footerData}/>
                      </View>
                  </View>

                  <View style={{backgroundColor:'#eff2f5'}}>
                      <Text style={{color: '19293b', fontSize:12, textAlignVertical: 'center',textAlign: 'left', marginLeft:12,marginTop:5}}>{I18n.t('Problem solving')}</Text>
                      <Timeline
                          style={{flex:1,marginLeft:12,marginRight:12,paddingTop:5}}
                          data={this.state.data}
                          circleSize={20}
                          circleColor='rgba(0,0,0,0)'
                          innerCircle={'icon'}
                          lineColor='#dcdcdc'
                          timeContainerStyle={{minWidth:52}}
                          timeStyle={{fontSize:12,textAlign: 'center',textAlignVertical: 'center',
                              backgroundColor:'#434c5e', color:'white', borderRadius:0, height:22,
                              ...Platform.select({
                                  ios:{
                                      lineHeight: 22
                                  }
                              })
                          }}
                          descriptionStyle={{color:'gray'}}
                          options={{style:{paddingTop:5}}}
                          renderDetail={this.renderDetail}
                      />
                  </View>
                </ScrollView>
            </View>
        );
    }
}

const touchableHighlightProps = {
    activeOpacity: 0.9,
    underlayColor: '#ffedee',
};


var styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#eff2f5',
        //flexDirection:'column',
        justifyContent:'center',
    },
    NavBarPanel:{
        flexDirection: 'row',
        height: 48,
        backgroundColor: '#24293d',
    },
    NavBarImage: {
        width: 48,
        height: 48
    },
    NavBarTitle: {
        fontSize: 18,
        height: 48,
        color: '#ffffff',
        textAlignVertical:'center',
        lineHeight: 48
    },
    NavBarTitle2: {
        fontSize: 18,
        height: 48,
        color: '#ffffff',
        textAlignVertical:'center',
        justifyContent:'flex-end'
    },
    itemContainer:{
        flex:1,
        flexDirection:'row',
        justifyContent: 'center',
        marginTop:5,
        marginBottom:5
    },
    itemLeft:{
        flex:2.7,
        flexDirection:'column',
        marginLeft:12
    },
    itemRight:{
        flex:1,
        flexDirection:'column',
        marginRight:12,
        marginTop:8
    },
    videoItem:{
        marginLeft:47,
        marginRight:12,
        marginBottom:10
    },
    menuItemImage:{
        width: 20,
        height: 20,
        marginLeft:5,
    },
    menuItemTextBlack:{
        fontSize:12,
        marginLeft:14,
        color: '#989ba3',
        textAlignVertical: 'center',
    },
    submitter:{
        color: '#989ba3',
        fontSize:12,
        textAlignVertical: 'center',
        textAlign: 'left',
        marginBottom: 6,
        maxWidth:120,
        ...Platform.select({
            ios:{
                marginTop:12
            },
            android:{
                marginTop:7
            }
        })
    },
    assigner: {
        color: '#989ba3',
        fontSize: 12,
        textAlignVertical: 'center',
        textAlign: 'right',
        marginBottom: 6,
        marginLeft: 10,
        maxWidth:120,
        ...Platform.select({
            ios:{
                marginTop:12
            },
            android:{
                marginTop:7
            }
        })
    }
});
