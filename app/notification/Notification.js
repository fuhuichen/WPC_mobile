import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    DeviceEventEmitter,
    FlatList,
    ScrollView,
    RefreshControl,
    ActivityIndicator
} from "react-native";
import {Actions} from 'react-native-router-flux';
import I18n from 'react-native-i18n';
import Navigation from "../element/Navigation";
import AndroidBacker from "../components/AndroidBacker";
import EventBus from "../common/EventBus";
import NotifyTypes from "./NotifyTypes";
import store from "../../mobx/Store";
import BorderShadow from "../element/BorderShadow";
import ViewIndicator from "../customization/ViewIndicator";
import StoreUtil from "../utils/StoreUtil";
import SlotView from "../customization/SlotView";
import NotifyCell from "./NotifyCell";
import ModalCenter from "../components/ModalCenter";
import ScrollTop from "../element/ScrollTop";
import AccountUtil from "../utils/AccountUtil";
import UserPojo from "../entities/UserPojo";
import {getNotificationMessageList, readNotificationMessageList, clearNotificationMessageList, clearAllNotificationMessageList} from "../common/FetchRequest";

const {width, height} = Dimensions.get('window');
export default class Notification extends Component {
    state = {
        showFooter: 0, // 0: hidden, 1: no more data, 2: loading
        showScrollTop: false,
        enumSelector: store.enumSelector,
        notifySelector: store.notifySelector,
        userSelector: store.userSelector,
        approveSelector: store.approveSelector,
        viewType: store.enumSelector.viewType.LOADING,        
        onPull: false,
        deleteItem: null,
        deleteIndex: 0,
        data: [],
        currentPage: 0,
        lastPage: true,
        onEndReached: false
    };

    componentDidMount() {
        StoreUtil.refresh();
        store.notifySelector.active = true;

        this.loadData();
    }

    componentWillUnmount(){
       store.notifySelector.active = false;
    }

    loadData(){
        let {enumSelector, notifySelector, viewType} = this.state;
        
        this.setState({data: [], viewType: enumSelector.viewType.LOADING, showScrollTop: false},
            async () => {
                let data = [];

                let body = {
                    messageTypeList: [notifySelector.type],
                    filter: {
                        page: 0,
                        size: 10
                    }
                };
                let originalType = notifySelector.type;
                let result = await getNotificationMessageList(body);
                if(notifySelector.type == originalType) {
                    if(result.errCode == enumSelector.errorType.SUCCESS) {
                        if(result.data.content.length > 0) {
                            viewType = enumSelector.viewType.SUCCESS;
                            data = result.data.content;
                            data.forEach(item => {
                                item.read = item.isRead;
                                item.subject = item.alertContent;
                                item.extContent = item.extContent || "";
                            })
                            this.setState({data, viewType, currentPage: 0, lastPage: result.data.totalPages == 1, onPull:false});
                        } else {
                            viewType = enumSelector.viewType.EMPTY;
                            this.setState({data, viewType, onPull:false});
                        }
                    } else {
                        viewType = enumSelector.viewType.FAILURE;
                        this.setState({viewType, onPull:false});
                    }
                }
        });
    }

    async onFetch(page) {
        let {enumSelector, notifySelector, viewType} = this.state;
        let body = {
            messageTypeList: [notifySelector.type],
            filter: {
                page: page,
                size: 10
            }
        };

        let result = await getNotificationMessageList(body);
        if(result.errCode == enumSelector.errorType.SUCCESS) {
            if(result.data.content.length > 0) {
                let tmpData = result.data.content;
                tmpData.forEach(item => {
                    item.read = item.isRead;
                    item.subject = item.alertContent;
                    item.extContent = item.extContent || "";
                })
                let data = this.state.data.concat(tmpData);
                this.setState({data, currentPage: page, lastPage: result.data.totalPages <= page+1, onEndReached: false});
            } else {
                this.setState({lastPage: true});
            }
        }
    }


    onBack(){
        EventBus.refreshNotification();
        Actions.pop();
    }

    async onClear(){
        try {
            let {enumSelector} = this.state;
            this.setState({data: [], viewType:enumSelector.viewType.EMPTY});
            //StoreUtil.deleteAll();
            let body = {};
            let result = await clearAllNotificationMessageList(body);
        }catch (e) {
        }
    }

    async onDelete(){
        try {
            let {data, viewType, enumSelector, deleteItem, deleteIndex} = this.state;
            
            let body = {
                ids:[deleteItem.id]
            }
            let result = await clearNotificationMessageList(body);

            data.splice(deleteIndex, 1);
            (data.length === 0) ? (viewType = enumSelector.viewType.EMPTY) : null;
            this.setState({data, viewType});

            /*(() =>{
                StoreUtil.deleteMessage(deleteItem.messageId);
            })();*/
        }catch (e) {
        }
    }

    async onClick(item, index){
        try {
            let {data, enumSelector, userSelector, approveSelector} = this.state;

            // Account permission
            let account = userSelector.accountList.find(p => p.accountId === item.accountId);
            let accountSrp = ((account != null) && (account.srp != null)) ? account.srp : [];
            let viuMOService = accountSrp.find(p => p.type === 'Custom_Inspection');
            if ((viuMOService == null) || !viuMOService.enable){
                DeviceEventEmitter.emit('Toast', I18n.t('Account permission'));
                return;
            }

            if(await AccountUtil.changeAccount(item.accountId,true,true)){
                DeviceEventEmitter.emit('onAccount', item.accountId);
                // Service permission
                let serviceEnable = userSelector.services.find(p => p === 'Custom_Inspection');
                if (serviceEnable == null){
                    DeviceEventEmitter.emit('Toast', I18n.t('Service permission'));
                    return;
                }
                
            }else {
                DeviceEventEmitter.emit('Toast', I18n.t('Switch brand error'));
                return;
            }

            // router
            if (item.messageType === enumSelector.notifyType.EVENT){
                let content = JSON.parse(item.content);
                Actions.push('eventList',{
                    storeId: [content[0].storeId],
                    eventId: [item.eventId]
                });
            }

            if (item.messageType === enumSelector.notifyType.REPORT){
                Actions.push('reportDetail', {data: {id: item.eventId}});
            }

            if (item.messageType === enumSelector.notifyType.APPROVE) {
                store.userSelector.openDrawer = false;
                store.userSelector.launcherSelectTab = 'Approve';
                if(JSON.parse(item.content)[0].auditState == enumSelector.auditState.PROCESSING) {
                    store.userSelector.approveType = enumSelector.approveType.PENDING;
                } else {
                    store.userSelector.approveType = enumSelector.approveType.SUBMITTED;
                }
                Actions.reset('homePage');
            }

            if (item.messageType === enumSelector.notifyType.SCHEDULE){
                store.userSelector.launcherSelectTab = 'Schedule';
                store.userSelector.openDrawer = false;
                store.userSelector.scheduleType = enumSelector.scheduleType.ALL;
                Actions.reset('homePage');
            }

            // status
            item.read = true;
            data[index] = item;

            let body = {
                ids:[item.id]
            }
            let result = await readNotificationMessageList(body);

            this.setState({data});
            //StoreUtil.save([item]);
        }catch (e) {
            console.log("onClick e : ", JSON.stringify(e))
        }
    }

    onRefresh(){
        this.setState({onPull:true}, () => {
            this.loadData();
        })
    }

    onEndReached() {
        if(this.state.lastPage) {
            {
                this.setState({showFooter: 1});
                return;
            }
        }
        if(!this.state.onEndReached){
            let page = ++this.state.currentPage;
            this.setState({onEndReached: true, showFooter: 2, currentPage:page});
            this.onFetch(page);
        }
    }

    renderItem(item, index){
        return <View style={styles.notify}>
            <NotifyCell data={item} onDelete={() => {
                this.setState({deleteItem: item, deleteIndex:index});
                this.modalDelete && this.modalDelete.open();
            }} onClick={() => {this.onClick(item, index)}}/>
        </View>
    }

    sortByTime(a, b) {
        if(a.ts > b.ts) {
            return -1;
        } else if (a.ts < b.ts) {
            return 1;
        } else {
            return 0;
        }
    }

    renderFooter(){
        let {showFooter} = this.state, component = null;
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
                <SlotView containerStyle={{height:20}}/>
            </View>
        )
    }

    render() {
        let {data, viewType, enumSelector, showScrollTop} = this.state;

        //let dataSort = data.sort(this.sortByTime);

        return (
            <View style={styles.container}>
                <Navigation
                    onLeftButtonPress={() => this.onBack()}
                    title={I18n.t('Notifications')}
                    rightButtonTitle={(data.length > 0) ? I18n.t('Clear') : ''}
                    onRightButtonPress={() => {this.modalClear && this.modalClear.open()}}/>

                <NotifyTypes onCategory={() => {this.loadData()}}/>
                {
                    (viewType !== enumSelector.viewType.SUCCESS) && <ViewIndicator viewType={viewType}
                        containerStyle={{marginTop: 100}} prompt={I18n.t('No notice')}/>
                }
                {
                    (viewType === enumSelector.viewType.SUCCESS) && 
                        <View style={{flex:1}}>
                            <ScrollView onScroll={event => {
                                        let showScrollTop = (event.nativeEvent.contentOffset.y > 200);
                                        this.setState({showScrollTop});
                                    }}
                                    refreshControl = {
                                        <RefreshControl
                                        refreshing={this.state.onPull}
                                        onRefresh = {() => this.onRefresh()}/>
                                    }>
                            <FlatList
                                style={styles.listView}
                                showsVerticalScrollIndicator={false}
                                ref={c => this.scroll = c}
                                data={data}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({item,index}) => this.renderItem(item,index)}
                                refreshing={false}
                                onEndReached={() => this.onEndReached()}
                                ListFooterComponent={() => this.renderFooter()}
                                onEndReachedThreshold={0.5}
                                    />
                            </ScrollView>
                        </View>
                }

                <ModalCenter ref={c => this.modalDelete = c} title={I18n.t('Delete notify')} description={I18n.t('Delete notify prompt')}
                             confirm={() => this.onDelete()}/>
                <ModalCenter ref={c => this.modalClear = c} title={I18n.t('Clear notify')} description={I18n.t('Clear notify prompt')}
                             confirm={() => this.onClear()}/>
                <ScrollTop showOperator={showScrollTop} onScroll={() => {this.scroll && this.scroll.scrollTo({x:0,y:0,animated:true})}} />
                <AndroidBacker onPress={() => {
                    this.onBack();
                    return true;
                }}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        backgroundColor:'rgb(247,249,250)'
    },
    listView:{
        width:width-20,
        marginLeft:10,
        marginTop:24,
        //marginBottom:80,
        //paddingBottom:180,
        paddingTop:16,
        paddingLeft:14,
        paddingRight:14,
        borderRadius:10,
        backgroundColor:'rgba(232,239,244,0.72)'
    },
    notify:{
        marginBottom:12
    },
    footer:{
        flexDirection:'row',
        height:24,
        justifyContent:'center',
        alignItems:'center',
        marginBottom:10,
    }
});
