import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    FlatList,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    Platform,
    DeviceEventEmitter
} from "react-native";
import I18n from "react-native-i18n";
import {Actions} from "react-native-router-flux";
import PropTypes from "prop-types";
import Navigation from "../element/Navigation";
import store from '../../mobx/Store';
import {getEventList} from "../common/FetchRequest";
import ScrollTop from "../element/ScrollTop";
import NetInfoIndicator from "../components/NetInfoIndicator";
import ViewIndicator from "../customization/ViewIndicator";
import EventEditor from "./EventEditor";
import Spinner from "../element/Spinner";
import ProcessResult from "./ProcessResult";
import EventBus from "../common/EventBus";
import AndroidBacker from "../components/AndroidBacker";
import SlotView from "../customization/SlotView";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import {ColorStyles} from "../common/ColorStyles";
import CommentDialog from "../components/comment/CommentDialog";
import {addEvent} from "../common/FetchRequest";
import OSSUtil from "../utils/OSSUtil";
import {MODULE_EVENT} from "../common/Constant";
import moment from "moment";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');
export default class EventAdd extends Component {
    state = {
        showBottom: false,
        showScrollTop: false,
        contentOffset: 0,
        data: [],
        viewType:store.enumSelector.viewType.FAILURE,
        enumSelector:store.enumSelector,
        filterSelector: store.filterSelector,
        showFooter: 0, // 0: hidden, 1: no more data, 2: loading
        currentPage: 0,
        lastPage: true,
        onEndReached: false,
        isRefresh: false,
        onPull:false,
        search: '',
        spinner: false,
        actionType: store.enumSelector.actionType.ADD,
        actionResult: null,
        eventId: this.props.eventId ? this.props.eventId : [],
        showMode:0,
        visible: false,
        title:''
    };

    static propTypes =  {
        storeId: PropTypes.object,
        eventId: PropTypes.object,
        status: PropTypes.array,
        reportId: PropTypes.array,
        filters: PropTypes.object
    };

    static defaultProps = {
        storeId: [],
        status: [0,1,2,3],
        source: [],
        filters: null,
        reportId: null
    };

    componentDidMount(){
        let {filterSelector} = this.state;
        filterSelector.event.beginTs = filterSelector.getBeginTs();
        filterSelector.event.endTs = filterSelector.getEndTs();
        filterSelector.event.storeId = this.props.storeId;
        filterSelector.event.status = this.props.status;
        filterSelector.event.source = this.props.source;
        filterSelector.event.order = 1;
        filterSelector.event.keyword = false;

        this.setState({filterSelector}, async () => {
            await this.fetchData(0,true);
        });
    }

    async fetchData(page,load){
        let {enumSelector, viewType,} = this.state, lastPage = true;
        let data = load ? [] : this.state.data;
        load && this.setState({data:[], viewType:enumSelector.viewType.LOADING, contentOffset: 0});

        let body = this.formatBody();
        body.filter = {page: page, size:100};

        viewType = enumSelector.viewType.FAILURE;

        let result = await getEventList(body);

        if (result.errCode === enumSelector.errorType.SUCCESS){
            result.data.content.forEach((item) => {
                item.subjectUnfold = false;
                item.isMark = data.every(p => (p.isMark === true));
                item.comment = item.comment.map(v => Object.assign({...v, attachUnfold: false}))
            });

            data = data.concat(result.data.content);

            viewType = (result.data.content.length > 0) ? enumSelector.viewType.SUCCESS
                : enumSelector.viewType.EMPTY;
            lastPage = result.data.last;
            lastPage = true;
        }

        viewType = load ? viewType : this.state.viewType;

        this.setState({
            viewType,
            data,
            lastPage,
            onEndReached: false,
            onPull: false,
            showFooter: 0
        });
    }

    formatBody(){
        let {filterSelector, eventId, search} = this.state;
        let status = JSON.parse(JSON.stringify(filterSelector.event.status));

        let params = {
            beginTs: moment().subtract(30, 'days').startOf('day').unix()*1000,
            endTs: moment().endOf('day').unix()*1000,
            clause: {
                storeId: filterSelector.event.storeId,
                status: status,
                sourceType: 0
            },
            filter: {},
            like:{},
            order: {direction: (filterSelector.event.order === 1) ? 'desc' : 'asc', property:'ts'}
        };

        if (filterSelector.event.keyword){
            params.like.subject = search;
            params.like.assignerName = search;
        }

        return params;
    }

    onRefresh(){
        let {showBottom} = this.state;
        try {
            !showBottom ? this.setState({
                data: [],
                currentPage: 0,
                showFooter: 0,
                lastPage: false,
                onEndReached: false,
                onPull:true
            },async ()=>{
                await this.fetchData(0,true);
            }) : null;
        }catch (e) {
        }
    }

    onEndReached(){
        try {
            if(this.state.lastPage) {
                {
                    (this.state.contentOffset  >= (height-Platform.select({android:56, ios:78})))
                        ? this.setState({showFooter: 1}) : this.setState({showFooter: 0});
                    return;
                }
            }

            if(!this.state.onEndReached){
                let page = ++this.state.currentPage;
                this.setState({onEndReached: true,showFooter: 2,currentPage:page});
                (async () => {
                    await this.fetchData(page,false);
                })();
            }
        }catch(e){
        }
    }

    renderFooter(){
        let {showBottom, showFooter} = this.state, component = null;
        if (showFooter === 1) {
            component = <View style={{height:40,alignItems:'center',justifyContent:'center',flexDirection:'row'}}>
                <View style={{width:50,height:1,backgroundColor:'#dcdcdc'}} />
                <Text style={{color:'#989ba3',fontSize:10,marginLeft:10}}>
                    {I18n.t('No further')}
                </Text>
                <View style={{width:50,height:1,backgroundColor:'#dcdcdc',marginLeft:10}} />
            </View>;
        }

        if(showFooter === 2) {
            component = <View style={styles.footer}>
                <ActivityIndicator color={'#989ba3'}/>
                <Text style={{fontSize: 10, color: '#989ba3'}}>{I18n.t('Loading data')}</Text>
            </View>;
        }

        return (
            <View>
                {component}
                <SlotView containerStyle={{height: showBottom ? 100 : 65}}/>
            </View>
        )
    }

    renderItem({item, index}){
        let {showBottom, data} = this.state;
        return (
            <View>
                <EventEditor data={item} showMark={showBottom} relate={true}
                             attachment = {this.props.attachment}
                             measureWidth={width-96} onData={(response) => {
                    data[index] = response;
                    this.setState({data});
                }} onRefresh={(actionType) => {
                    this.setState({actionType, actionResult:true});
                    setTimeout(() => {
                        Actions.pop();
                    }, 1800);
                }}/>
            </View>
        )
    }

    onBack(){
        EventBus.refreshEventInfo();
        EventBus.refreshAnalysisInfo();

        Actions.pop();
    }

    onComment(attachment,question){
        let {enumSelector} = this.state;
        let storeId = this.props.storeId[0];
        let uploads = JSON.parse(JSON.stringify(attachment));
        this.setState({spinner: true});

        OSSUtil.init(storeId).then(() => {
            let pArray = [];

            uploads.forEach((item, index) => {
                if (item.mediaType !== enumSelector.mediaTypes.TEXT){
                    let ossKey = OSSUtil.formatOssUrl(MODULE_EVENT, item.mediaType,
                        storeId,item.deviceId + index.toString());
                    item.url = (Platform.OS === 'android' && item.mediaType === enumSelector.mediaTypes.AUDIO) ? `file://${item.url}` : item.url;

                    pArray.push(OSSUtil.upload(ossKey, item.url));
                    item.url = OSSUtil.formatRemoteUrl(ossKey);
                }
            });

            Promise.all(pArray).then(async (res) => {
                let body = {
                    ts: moment().unix()*1000,
                    subject:question,
                    storeId: storeId,
                    deviceId:this.props.deviceId,
                    sourceType:0,
                    comment: {
                        ts: moment().unix()*1000,
                        attachment: uploads,
                        status:0,
                    }
                };

                let result = await addEvent(body);
                if (result.errCode !== enumSelector.errorType.SUCCESS){
                    this.setState({spinner:false});
                    this.comment && this.comment.showErrorMsg(I18n.t('Save failure'));
                    return;
                }
                this.setState({spinner:false,visible:false,actionType:enumSelector.actionType.ADD,actionResult:true});
                setTimeout(() => {
                    Actions.pop();
                }, 1800);
            }).catch(error => {
                this.setState({spinner:false});
                this.comment && this.comment.showErrorMsg(I18n.t('Save failure'));
            })

        }).catch(error => {
            this.setState({spinner:false});
            this.comment && this.comment.showErrorMsg(I18n.t('Save failure'));
        });
    }

    onClickCreateIssue() {
        if(store.storeSelector && store.storeSelector.collection && store.storeSelector.collection.status != 20 
            && store.storeSelector.collection.status != 21 && store.storeSelector.collection.status != 60) {
            DeviceEventEmitter.emit('Toast', I18n.t('Service overdue'));
        } else {
            this.setState({showMode:1,visible:true,title:I18n.t('Create issue')+ I18n.t('Event handle success')});
        }
    }

    onClickRelateProblem() {
        if(store.storeSelector && store.storeSelector.collection && store.storeSelector.collection.status != 20 
            && store.storeSelector.collection.status != 21 && store.storeSelector.collection.status != 60) {
            DeviceEventEmitter.emit('Toast', I18n.t('Service overdue'));
        } else {
            this.setState({showMode:2,title:I18n.t('Adding')+ I18n.t('Event handle success')});
        }
    }

    render() {

        let {data,viewType,enumSelector, showScrollTop, spinner, actionType, actionResult,
            isRefresh, showBottom,showMode,visible} = this.state;
            console.log("EventAdd action="+actionType)
            console.log("EventAdd showMode="+showMode)
            console.log("EventAdd Type="+viewType)
        return (
            <View style={styles.container}>
                <Navigation
                    onLeftButtonPress={() => this.onBack()}
                    title={I18n.t('Create problem')}
                    rightButtonTitle={''}
                    borderBottomRadius={0}
                    onRightButtonPress={() => {}}
                />
                <NetInfoIndicator/>
                <Image style={{height:209}} source={{uri: this.props.attachment[0].url}} resizeMode='stretch'/>
                <View style={{flexDirection:'row',alignItems:'center',marginTop:15,marginBottom:5}}>
                   <BoxShadow setting={{width:120, height:36, color:"#000000",
                    border:1, radius:10, opacity:0.1, x:0, y:1, style:{marginLeft:12}}}>
                    <View style={{borderColor:'#fff', borderWidth:0,height:36,width:120,borderRadius: 10,backgroundColor:(showMode == 1) ? ColorStyles.STATUS_BACKGROUND_BLUE:'#ffffff',alignItems:'center'}}>
                    <TouchableOpacity onPress={()=>{this.onClickCreateIssue()}}>
                        <Text style={{color:(showMode == 1) ? '#FFFFFF' : '#69727C',textAlignVertical:'center',lineHeight:36}}>{I18n.t('Create issue')}</Text>
                    </TouchableOpacity>
                    </View>
                   </BoxShadow>

                   <BoxShadow setting={{width:120, height:36, color:"#000000",
                    border:1, radius:10, opacity:0.1, x:0, y:1, style:{marginLeft:12}}}>
                    <View style={{borderColor:'#fff', borderWidth:0,height:36,width:120,borderRadius: 10,backgroundColor:(showMode == 2) ? ColorStyles.STATUS_BACKGROUND_BLUE:'#ffffff',alignItems:'center'}}>
                    <TouchableOpacity onPress={()=>{this.onClickRelateProblem()}} >
                       <Text style={{color:(showMode == 2) ? '#FFFFFF' : '#69727C',textAlignVertical:'center',lineHeight:36}}>{I18n.t('Relate problem')}</Text>
                    </TouchableOpacity>
                    </View>
                   </BoxShadow>
                </View>

                {
                   (viewType !== enumSelector.viewType.SUCCESS && showMode == 2) &&
                            <ViewIndicator viewType={viewType} containerStyle={{marginTop:100}}
                                           prompt={I18n.t('Empty event')}
                                           refresh={()=> {(async ()=> this.onRefresh())()}}/>
                }
                {
                   (viewType === enumSelector.viewType.SUCCESS && showMode == 2) &&
                        <FlatList ref={c => this.scroll = c}
                                  style={styles.listView}
                                  onScroll={event => {
                                      let showScrollTop = (event.nativeEvent.contentOffset.y > 200);
                                      this.setState({showScrollTop, contentOffset: event.nativeEvent.contentOffset.y});
                                  }}
                                  data={data}
                                  keyExtractor={(item, index) => index.toString()}
                                  renderItem={this.renderItem.bind(this)}
                                  showsVerticalScrollIndicator={false}
                                  refreshing={isRefresh}
                                  onRefresh={() => this.onRefresh()}
                                  onEndReached={() => this.onEndReached()}
                                  onEndReachedThreshold={0.1}
                                  keyboardShouldPersistTaps={'handled'}
                                  ListFooterComponent={()=>this.renderFooter()}
                        />
                }

                <CommentDialog
                    ref={c => this.comment = c}
                    title={I18n.t('Event Description')}
                    questionMode={true}
                    contentMode={true}
                    visible={visible}
                    showEdit={true}
                    showDelete={true}
                    enableCapture={false}
                    enableImageLibrary={false}
                    defaultQuestion={''}
                    needImage={true}
                    defaultData={this.props.attachment}
                    onCancel={() => {
                        this.setState({visible:false});
                    }}
                    onClose={(data, question) => this.onComment(data,question)}/>

                <ScrollTop showOperator={!showBottom && showScrollTop && showMode == 2} onScroll={() => {
                    this.scroll && this.scroll.scrollToOffset({animated:true, viewPosition:0, index:0});
                }}/>
                <ProcessResult title={this.state.title} actionType={actionType} actionResult={actionResult} reset={() => this.setState({actionResult: null})}/>
                <Spinner visible={spinner} textContent={I18n.t('Loading')} textStyle={{color:'#ffffff',fontSize:14,marginTop:-50}}/>
                <AndroidBacker onPress={() => {
                    this.onBack();
                    return true;
                }} />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:'#F7F9FA'
    },
    listView:{
        paddingBottom:12,
        paddingLeft:10,
        paddingRight: 10
    },
    footer:{
        flexDirection:'row',
        height:24,
        justifyContent:'center',
        alignItems:'center',
        marginBottom:10,
    },
    operator:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        marginTop:10,
        paddingLeft:10,
        paddingRight:20,
        marginBottom:10
    },
    searchBar:{
        height:38,
        marginRight:16,
        borderRadius:10,
        marginTop:0.5,
        backgroundColor:'#FFFFFF',
        borderTopColor:'#fff',
        borderBottomColor:'#fff',
        borderRightWidth:1,
        borderRightColor:'#fff',
        borderLeftWidth:1,
        borderLeftColor:'#fff',
        justifyContent:'center',
    },
    inputView:{
        height:36,
        backgroundColor:'#fff',
    },
    input:{
        fontSize:12,
        paddingRight:6
    },
    filter:{
        fontSize:17,
        color:'#006AB7'
    },
    bottomPanel:{
        position:'absolute',
        left:0,
        bottom:0,
        height:83,
        width:width,
        paddingLeft:10,
        paddingRight:10,
        flexDirection:'row',
        justifyContent:'space-between',
        backgroundColor:'#fff',
        borderTopColor: '#F2F2F2',
        borderTopWidth:2
    },
    badgeStyle:{
        padding:6,
        marginTop:24,
        backgroundColor:'transparent',
        height:30
    },
    textStyle:{
        color:'#006AB7',
        fontSize:17
    }
});
