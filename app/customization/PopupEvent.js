import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, DeviceEventEmitter,TouchableOpacity} from "react-native";
import I18n from 'react-native-i18n';
import PropTypes from 'prop-types';
import {Actions} from 'react-native-router-flux';
import {CLOSE_POPUP_EVENT} from "../common/Constant";
import store from "../../mobx/Store";
import {inject, observer} from "mobx-react";
import TouchableInactive from "../touchables/TouchableInactive";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import AccessHelper from "../common/AccessHelper";
import ModalCenter from "../components/ModalCenter";
import EventBus from "../common/EventBus";
import Spinner from "../element/Spinner";
import {batchEventClose} from "../common/FetchRequest";
import moment from "moment";
import PhoneInfo from "../entities/PhoneInfo";

const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class PopupEvent extends Component {
    state = {
        spinner: false,
        enumSelector: store.enumSelector,
        eventSelector: store.eventSelector
    };

    static propTypes = {
        onTrigger: PropTypes.func
    };

    constructor(props,context) {
        super(props, context);

        let {eventSelector} = this.state;
        this.actions = null;

        this.unClosed = [
            {
                label: I18n.t('View pending'),
                router: () => {
                    let params = {storeId: [eventSelector.collection.storeId], status: eventSelector.type == null ? [0,1,3] : eventSelector.type};
                    if ((eventSelector.collection.reportInfo != null) && (eventSelector.collection.reportInfo.length > 0)){
                        let reportInfo = eventSelector.collection.reportInfo;
                        params.reportId = reportInfo.map(p => p.reportId);
                    }

                    Actions.push('eventList', params);
                },
                viewStyle: [styles.viewStyle,{marginRight:8}],
                textStyle: [styles.textStyle, {fontSize: PhoneInfo.isJALanguage() ? 12 : 16}]
            },
            {
                label: I18n.t('All closed'),
                router: () => {
                    let eventStore = null;
                    if(store.storeSelector && store.storeSelector.storeList) {
                        store.storeSelector.storeList.forEach(store => {
                            if(store.storeId == eventSelector.collection.storeId) {
                                eventStore = store;
                            }
                        })
                    }

                    if(eventStore != null && eventStore.status != 20 && eventStore.status != 21 && eventStore.status != 60) {
                        DeviceEventEmitter.emit('Toast', I18n.t('Service overdue'));
                    } else {
                        this.modal && this.modal.open();
                    }
                },
                viewStyle: [styles.viewStyle,{backgroundColor:'#02528B'}],
                textStyle: [styles.textStyle,{color:'#FFFFFF', fontSize: PhoneInfo.isJALanguage() ? 12 : 16}]
            }
        ];

        this.closed = [
            {
                label: I18n.t('View closed'),
                router: () => {
                    Actions.push('eventList', {storeId: [eventSelector.collection.storeId], status: [2]});
                },
                viewStyle: [styles.viewStyle,{marginRight:8}],
                textStyle: styles.textStyle
            },
            {
                label: I18n.t('Store detail'),
                router: () => {
                    Actions.push('storeDetail', {selector: eventSelector});
                },
                viewStyle: [styles.viewStyle,{backgroundColor:'#02528B'}],
                textStyle: [styles.textStyle,{color:'#FFFFFF', fontSize: PhoneInfo.isKOLanguage() ? 10 : 16}]
            }
        ];
    }

    componentDidMount() {
        this.popEmitter = DeviceEventEmitter.addListener(CLOSE_POPUP_EVENT,
            () => {
            let {eventSelector} = this.state;
            eventSelector.visible = false;
            this.setState({eventSelector});
        });
    }

    componentWillUnmount() {
        this.popEmitter && this.popEmitter.remove();
    }

    doActions(item,index){
        this.actions && this.actions[index].router();
    }

    async onClose(){
        this.setState({spinner:true});

        let {eventSelector, enumSelector} = this.state;
        let result = await batchEventClose({
            storeIds:[eventSelector.collection.storeId],
            comment:{
                ts: moment().unix()*1000,
                attachment:[]
            }
        });

        let actionResult = false;
        if (result.errCode === enumSelector.errorType.SUCCESS){
            actionResult = true;

            eventSelector.visible = false;
            eventSelector.collection = null;
            this.setState({eventSelector, spinner: false}, () => {
                EventBus.refreshEventInfo();
            });
        }else {
            this.setState({spinner: false});
        }

        this.props.onTrigger && this.props.onTrigger(enumSelector.actionType.CLOSE, actionResult);
    }

    renderOperators(){
        return (
            <View style={{flexDirection:'row',justifyContent:'flex-end'}}>
                {
                    this.actions.map((item,index) =>{
                        return <TouchableOpacity activeOpacity={0.6} onPress={() => this.doActions(item,index)}>
                            <View style={item.viewStyle}>
                                <Text style={item.textStyle}>{item.label}</Text>
                            </View>
                        </TouchableOpacity>
                    })
                }
            </View>
        )
    }

    reset(){
        this.actions = [];

        let {eventSelector} = this.state;
        let collection = eventSelector.collection;

        if ((collection.numOfInprocess + collection.numOfUnprocessed + collection.numOfRejected) > 0){
            !AccessHelper.enableEventClose() ? this.actions.push(this.unClosed[0])
                : (this.actions = this.unClosed);
        }else {
            this.actions = this.closed;
        }
    }

    render() {
        let {eventSelector, spinner} = this.state;
        let {visible, collection} = eventSelector, component = null;

        if (visible) {
            this.reset();

            component = <TouchableInactive style={styles.container}>
                <BoxShadow setting={{width:width-40, height:64, color:"#000000",
                    border:1, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:0}}}>
                    <View style={styles.card}>
                        <View style={{flex:1,justifyContent: 'center',marginRight:20}}>
                            <Text style={{color:'#006AB7',fontSize:14}} numberOfLines={2}>
                                {collection.name}
                            </Text>
                        </View>

                        {this.renderOperators()}

                        <ModalCenter ref={c => this.modal = c} title={collection.name} description={I18n.t('Close prompt')}
                            confirm={async () => await this.onClose()}/>
                    </View>
                </BoxShadow>
                <Spinner visible={spinner} textContent={I18n.t('Loading')} textStyle={{color:'#ffffff',fontSize:14,marginTop:-50}}/>
            </TouchableInactive>
        }

        return component;
    }
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        left:20,
        alignItems:'center'
    },
    card:{
        width: width-40,
        height: 64,
        padding: 16,
        backgroundColor: '#fff',
        flexDirection:'row',
        justifyContent:'flex-start',
        alignItems:'center',
        borderRadius:10
    },
    viewStyle:{
        borderWidth: 1,
        borderColor: '#02528B',
        borderRadius: 10,
        paddingLeft:12,
        paddingRight:12,
        height:36
    },
    textStyle:{
        fontSize:16,
        color:'#02528B',
        height:36,
        lineHeight: 36,
        textAlign: 'center',
        textAlignVertical: 'center',
        marginTop:-2
    }
});
