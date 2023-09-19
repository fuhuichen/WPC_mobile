import React, {Component} from 'react';
import {
    ActivityIndicator, BackHandler,
    DeviceEventEmitter,
    Dimensions,
    FlatList,
    Image, Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {Actions} from 'react-native-router-flux';
import RNStatusBar from "../components/RNStatusBar";
import HttpUtil from "../utils/HttpUtil";
import I18n from 'react-native-i18n';
import {DURATION} from "react-native-easy-toast";
import moment from "moment";
import PhoneInfo from "../entities/PhoneInfo";
import * as lib from '../common/PositionLib';
import GlobalParam from "../common/GlobalParam";
import NetInfoIndicator from "../components/NetInfoIndicator";
import RouteMgr from "../notification/RouteMgr";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class PatrolList extends Component {
    constructor(props) {
        super(props);

        this.images = {
            EN: {
                expired : require('../assets/images/img_expired_en.png'),
                today: require('../assets/images/img_due_today_en.png'),
                coming: require('../assets/images/img_coming_en.png'),
                onGoing: require('../assets/images/img_ongoing_en.png')
            },
            CN: {
                expired : require('../assets/images/img_expired.png'),
                today: require('../assets/images/img_due_today.png'),
                coming: require('../assets/images/img_coming.png'),
                onGoing: require('../assets/images/img_ongoing.png')
            },
            TW: {
                expired : require('../assets/images/img_expired_tw.png'),
                today: require('../assets/images/img_due_today_tw.png'),
                coming: require('../assets/images/img_coming_tw.png'),
                onGoing: require('../assets/images/img_ongoing_tw.png')
            }
        }

        this.default = PhoneInfo.isEnLanguage() ? this.images.EN :
            PhoneInfo.isTwLanguage() ? this.images.TW : this.images.CN;

        this.state = {
            data: [],
            isLoading:false,
            showTip:true,
            isRefresh:false,
            onPull:false,
        };
        this.storeList = []
    }

    componentDidMount() {
        this.setState({isLoading:true})
        this.fetchData();
    }

    componentWillMount() {
        this.freshEmitter = DeviceEventEmitter.addListener('onPatrolList', () => {
            this.fetchData();
        });

        if (Platform.OS === 'android') {
            BackHandler.addEventListener('onPatrolBack', this.onBackAndroid);
        }
    }

    componentWillUnmount(){
        //DeviceEventEmitter.emit('onAffairRead',{type:3});
        this.freshEmitter && this.freshEmitter.remove();
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('onPatrolBack', this.onBackAndroid);
        }
    }

    onBackAndroid(){
        Actions.pop();
        return true;
    }

    fetchData(){
        try {
            this.storeList = [];
            HttpUtil.get('store/alphabetic/list')
                .then(result => {
                    result.data.forEach((item,index)=>{
                        item.store.forEach((item,index)=>{
                            this.storeList.push(item);
                        });
                    });
                    let body = {};
                    body.beginTs = moment().startOf('day').subtract(7,'days').unix()*1000;
                    body.endTs = moment().endOf('day').add(7,'days').unix()*1000;
                    body.clause = {status: [0,2]};
                    HttpUtil.post('inspect/task/list',body)
                        .then(result => {
                            this.setState({data: result.data,isLoading:false});
                        })
                        .catch(error=>{
                            this.setState({isLoading:false})
                        })
                })
                .catch(error => {
                    this.setState({isLoading:false})
                })
        }catch (e) {
            this.setState({isLoading:false})
        }
    }

    renderLoadingView() {
        return (
            <View style={{flex:1, justifyContent:'center',alignItems:'center',
                height:height-lib.defaultStatusHeight()-70-48-120}}>
                <ActivityIndicator
                    animating={true}
                    color='#dcdcdc'
                    size="large"
                />
                <Text style={{textAlign:'center'}}>{I18n.t('Loading')}</Text>
            </View>
        );
    }

    onPressItem(item,index){
        GlobalParam.setInspectStatus(1);
        let data = this.storeList.find(element => element.storeId === item.storeId);
        let appKey = "";
        if (data != null){
            appKey = data.ezvizAppKey;
        }

        item.id = item.inspectTagId;
        item.name = item.storeName;
        item.mode === 1 ? Actions.push('localCheck',{data:item,inspect:item}) :
            Actions.push('remoteCheck',{data:{
                storeId: item.storeId,
                name: item.storeName,
                device: item.storeDevice,
                ezvizAppKey: appKey
                },
                inspect: item
            });
    }

    renderItem(item,index) {
        let mode =  moment(item.dueTime).unix() < moment().unix() ? 0 :
            moment(item.scheduleTime).unix() > moment().unix() ? 3 :
            moment(item.dueTime).startOf('day').unix() === moment().startOf('day').unix() ? 2 : 1;
        return (
            (mode === 1 || mode === 2) ? <TouchableOpacityEx activeOpacity={0.5} onPress={()=>this.onPressItem(item,index)}>
                <View style={styles.itemPanel}>
                    <View style={styles.iconPanel}>
                        {
                            item.mode !== 0 ? <Image source={require('../assets/images/event_site_pic.png')} style={styles.iconPanel}/>
                                : <Image source={require('../assets/images/event_telnet_pic.png')} style={styles.iconPanel}/>
                        }
                    </View>
                    <View style={styles.inspectPanel}>
                        <Text style={styles.inspectTyle} numberOfLines={1}>{item.storeName}</Text>
                        <Text style={styles.inspectStore} numberOfLines={1}>
                        {item.mode !== 0 ? I18n.t('Onsite patrol') : I18n.t('Remote patrol')}({item.tagName})
                    </Text>
                        <View style={styles.datePanel}>
                            <Text style={styles.dateText} numberOfLines={1}>
                                {I18n.t('Inspection time')}
                                {moment(item.scheduleTime).format('YYYY/MM/DD')}
                                —
                                {moment(item.dueTime).format('YYYY/MM/DD')}
                                </Text>
                        </View>
                    </View>

                    {
                        mode === 0 ? <Image source={this.default.expired} style={styles.inspectLabel}/>
                            : mode === 2 ? <Image source={this.default.today} style={styles.inspectLabel}/>
                            : mode === 3 ? <Image source={this.default.coming} style={styles.inspectLabel}/>
                            : <Image source={this.default.onGoing} style={styles.inspectLabel}/>
                    }
                </View>
                {
                    (this.state.data.length-1) === index ? <View style={{
                        height: 1,
                        width: width,
                        backgroundColor: '#dcdcdc'
                    }}/> : null
                }
            </TouchableOpacityEx> : <View>
                <View style={[styles.itemPanel,{opacity: 0.6}]}>
                    <View style={styles.iconPanel}>
                        {
                            item.mode !== 0 ? <Image source={require('../assets/images/event_site_pic.png')} style={styles.iconPanel}/>
                                : <Image source={require('../assets/images/event_telnet_pic.png')} style={styles.iconPanel}/>
                        }
                    </View>
                    <View style={styles.inspectPanel}>
                        <Text style={styles.inspectTyle} numberOfLines={1}>{item.storeName}</Text>
                        <Text style={styles.inspectStore} numberOfLines={1}>
                            {item.mode !== 0 ? I18n.t('Onsite patrol') : I18n.t('Remote patrol')}({item.tagName})
                        </Text>
                        <View style={styles.datePanel}>
                            <Text style={styles.dateText} numberOfLines={1}>
                                {I18n.t('Inspection time')}
                                {moment(item.scheduleTime).format('YYYY/MM/DD')}
                                —
                                {moment(item.dueTime).format('YYYY/MM/DD')}
                            </Text>
                        </View>
                    </View>

                    {
                        mode === 0 ? <Image source={this.default.expired} style={styles.inspectLabel}/>
                        : mode === 2 ? <Image source={this.default.today} style={styles.inspectLabel}/>
                        : mode === 3 ? <Image source={this.default.coming} style={styles.inspectLabel}/>
                        : <Image source={this.default.onGoing} style={styles.inspectLabel}/>
                    }
                </View>
                {
                    (this.state.data.length-1) === index ? <View style={{
                        height: 1,
                        width: width,
                        backgroundColor: '#dcdcdc'
                    }}/> : null
                }
            </View>
        )
    }

    render() {
        let tip = null;
        if (this.state.showTip){ tip =(
            <View style={{flexDirection:'row',backgroundColor:'#f1f6fe',height:50,alignItems:'center',justifyContent:'flex-start',
                marginTop:20,marginLeft:16,marginRight:16,borderWidth:1,borderColor:'#a0c1f8'}}>
                <View style={{marginLeft:12,marginTop: 10,marginRight: 12,marginBottom: 10,flexDirection:'row',alignItems:'center',justifyContent:'flex-start'}} >
                    <Image source={require('../assets/images/message_pic.png')} style={{width:18,height:18}}/>
                    <View style={{marginLeft:10}}>
                        <Text numberOfLines={2} style = {{fontSize:12,color:'#6097f4',width:width-72-32}}>{I18n.t('Patrol tips')}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => this.setState({showTip:false})} style={{position:'absolute',top:8,right: 3}}>
                    <View style={{width:16,height:16}}>
                        <Image source={require('../assets/images/affair_close.png')} style={{width:10,height:10}}/>
                    </View>
                </TouchableOpacity>
            </View>
        )}

        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={Actions.pop}>
                        <View style={{width:60,height:48}}>
                            <Image source={RouteMgr.getRenderIcon()} style={styles.NavBarImage}/>
                        </View>
                    </TouchableOpacity>
                    <View style={{width:width-120,height:48,alignItems: 'center'}}>
                        <Text style={[styles.NavBarTitle,{fontSize:18}]}>{I18n.t('To patrolled')}</Text>
                    </View>
                    <View style={{width:60,height:48,alignItems: 'center'}}>
                    </View>
                </View>
                <NetInfoIndicator/>
                {tip}
                <View style={{flex: 1}}>
                    {
                        this.state.data.length > 0 ? <View style={{
                            height: 1,
                            width: width,
                            backgroundColor: '#dcdcdc',
                            marginTop:10
                        }}/> : null
                    }
                    <FlatList data={this.state.data} keyExtractor={(item, index) => index.toString()} extraData={this.state}
                              renderItem={({item,index}) => this.renderItem(item,index)}
                              showsVerticalScrollIndicator={false}
                              onRefresh={() => this.fetchData()}
                              refreshing={this.state.isRefresh}
                              ItemSeparatorComponent={() => <View style={{
                                  height: 1,
                                  width: width,
                                  backgroundColor: '#dcdcdc'
                              }}/>}
                              ListEmptyComponent={() =>
                                  this.state.isLoading ? this.renderLoadingView() : <View
                                          style={{
                                              width: '100%',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                          }}>
                                          {
                                              this.state.onPull ? null : <View>
                                                  <View style={styles.imagePanel}>
                                                      <Image style={styles.imageIcon} source={require('../assets/images/img_patrol_null.png')}></Image>
                                                  </View>
                                                  <Text style={styles.imageTip}>{I18n.t('No patrolled')}</Text>
                                              </View>
                                          }
                                      </View>
                              }
                    />
                </View>
            </View>
        );
    }

}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
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
    footer:{
        flexDirection:'row',
        height:24,
        justifyContent:'center',
        alignItems:'center',
        marginBottom:10,
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
    imageTip: {
        fontSize: 18,
        color: '#d5dbe4',
        textAlign: 'center'
    },
    itemPanel:{
        flexDirection: 'row',
        justifyContent:'flex-start',
        height:100,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 22,
        paddingBottom: 20
    },
    iconPanel:{
        width: 25,
        height: 25
    },
    inspectPanel:{
        width: width-32-100-25,
        marginLeft: 6
    },
    inspectTyle:{
        fontSize: 14,
        color: '#19293b',
        fontWeight: 'bold'
    },
    inspectStore:{
        fontSize: 12,
        color: '#19293b',
        marginTop: 4
    },
    datePanel:{
        flexDirection:'row',
        marginTop: 4
    },
    dateText:{
        fontSize: 10,
        color: '#989ba3'
    },
    inspectLabel:{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 76,
        height: 76
    }
});
