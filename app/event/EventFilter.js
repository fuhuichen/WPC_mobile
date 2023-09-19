import React, {Component} from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Image,
    TouchableOpacity,
    DeviceEventEmitter,
    FlatList,
    Platform,
    ScrollView
} from "react-native";
import I18n from "react-native-i18n";
import moment from "moment";
import {Actions} from "react-native-router-flux";
import Navigation from "../element/Navigation";
import Calendar from "../element/Calendar";
import store from "../../mobx/Store";
import {inject, observer} from "mobx-react";
import TimeUtil from "../utils/TimeUtil";
import NetInfoIndicator from "../components/NetInfoIndicator";
import order_0 from "../assets/img_desc_unselect.png";
import press_order_0 from "../assets/img_desc_select.png";
import order_1 from "../assets/img_asc_unselect.png";
import press_order_1 from "../assets/img_asc_select.png";
import BorderShadow from '../element/BorderShadow';
import PhoneInfo from "../entities/PhoneInfo";
import ModalPatrol from "../customization/ModalPatrol";

const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class EventFilter extends Component {
    state = {
        filterSelector: store.filterSelector,
        enumSelector: store.enumSelector,
        paramSelector: store.paramSelector,
        tipVisible: false,
        data: [
            {
                order: 0,
                type: I18n.t('Time Asc'),
                uri: order_0,
                pressUri:press_order_0
            },
            {
                order: 1,
                type: I18n.t('Time Desc'),
                uri:order_1,
                pressUri:press_order_1
            }
        ],
        source: [
            {
                type: store.enumSelector.sourceType.ONSITE,
                name: I18n.t('Onsite patrol'),
                active: require('../assets/images/press_mode_1.png'),
                inactive: require('../assets/images/mode_1.png')
            },
            {
                type: store.enumSelector.sourceType.REMOTE,
                name: I18n.t('Remote patrol'),
                active: require('../assets/images/press_mode_0.png'),
                inactive: require('../assets/images/mode_0.png')
            },
            {
                type: store.enumSelector.sourceType.VIDEO,
                name: I18n.t('Video monitor'),
                active: require('../assets/img_video_select.png'),
                inactive: require('../assets/img_video_nomal.png')
            }
        ],
        params: JSON.parse(JSON.stringify(store.filterSelector.event)),
        selectInspects: store.filterSelector.event.selectInspects,
        selectInspectsName: store.filterSelector.event.selectInspectsName
    };

    onConfirm(){
        let {filterSelector,params,selectInspects,selectInspectsName} = this.state;

        const threeMonthAgo = TimeUtil.getThreeMonths(params.endTs);
        if ((params.beginTs > params.endTs) ||
            (params.endTs - params.beginTs > params.endTs - threeMonthAgo)) {
            this.setState({tipVisible:true});
            return;
        }

        filterSelector.event = params;
        if (filterSelector.event.status != null){
            filterSelector.event.status.remove(4);
        }
        filterSelector.event.selectInspects = selectInspects;
        filterSelector.event.selectInspectsName = selectInspectsName;

        this.setState({filterSelector}, () => {
            DeviceEventEmitter.emit('OnReport');
            Actions.pop();
        });
    }

    onDateChange(type,date){
        let {params} = this.state;
        if(type === 0){
            params.beginTs = moment(date).startOf('day').unix()*1000;
        }else{
            params.endTs = moment(date).endOf('day').unix()*1000;
        }

        this.setState({params});
    }

    renderCalendar(){
        let {params, tipVisible} = this.state, fontSize = 16;
        let color = tipVisible ? '#f21c65' : '#989ba3';

        PhoneInfo.isJAKOLanguage() && (fontSize = 14);

        return <View>
            <Text style={styles.label}>{I18n.t('Create date')}</Text>
            <View style={styles.calendar}>
                <Calendar date={params.beginTs} width={(width-48-23)/2}
                        onClick={() => {
                            this.setState({tipVisible: false});
                            this.modalDownList && this.modalDownList.close();
                        }}
                        onSelect={(date) =>this.onDateChange(0,date)}/>
                <Text style={[styles.range, {fontSize}]}>{I18n.t('To')}</Text>
                <Calendar date={params.endTs} width={(width-48-23)/2}
                        onClick={() => {
                            this.setState({tipVisible: false});
                            this.modalDownList && this.modalDownList.close();
                        }}
                        onSelect={(date) =>this.onDateChange(1,date)}/>
            </View>
            <Text style={[styles.tips,{color}]} numberOfLines={2}>{I18n.t('Max query time')}</Text>
        </View>
    }

    onOrder(item){
        let {params} = this.state;
        params.order = item.order;
        this.setState({params});
    }

    renderOrder(){
        let {data, params} = this.state, width = 106;
        (PhoneInfo.isTHLanguage() || PhoneInfo.isJALanguage()) && (width = 130);
        (PhoneInfo.isVNLanguage() || PhoneInfo.isIDLanguage()) && (width = 150);

        return (
            <View>
                <Text style={styles.label}>{I18n.t('Sort type')}</Text>
                <View style={styles.flexPanel}>
                    {
                        data.map((item, index) => {
                            let backgroundColor = (item.order === params.order) ?  '#006AB7' : '#ffffff';
                            let color = (item.order === params.order) ? '#ffffff' : '#69727C';
                            let uri = (item.order === params.order) ? item.pressUri : item.uri;
                            return <TouchableOpacity activeOpacity={1} onPress={() => this.onOrder(item)}>
                                <View style={[styles.order,{backgroundColor, width}, BorderShadow.div]}>
                                    <Image source={uri} style={{width:20,height:20}}/>
                                    <Text style={[styles.type,{color}]}>{item.type}</Text>
                                </View>
                            </TouchableOpacity>
                        })
                    }
                </View>
            </View>
        )
    }

    onSource(type){
        let {params} = this.state;
        let index = params.source.findIndex(p => p === type);
        (index !== -1) ? (params.source.splice(index, 1)) : (params.source.push(type));
        params.source.sort();
        this.setState({params});
    }

    renderSource(){
        let {source, params} = this.state;
        
        let ElementWidth = 99;
        (PhoneInfo.isVNLanguage() || PhoneInfo.isIDLanguage()) && (ElementWidth = 150);
        (PhoneInfo.isTHLanguage()) && (ElementWidth = 180);

        return (
            <View>
                <Text style={styles.label}>{I18n.t('Event source')}</Text>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    <View style={styles.flexPanel}>
                        {
                            source.map((item, index) => {
                                let exist = params.source.find(p => p === item.type);
                                let uri = (exist != null) ? item.active : item.inactive;
                                let backgroundColor = (exist != null) ? '#006AB7' : '#fff';
                                let color = (exist != null) ? '#fff' : '#85898E';

                                return <TouchableOpacity activeOpacity={1} onPress={() => this.onSource(item.type)}>
                                    <View style={[styles.order,{backgroundColor, width:ElementWidth}, BorderShadow.div]}>
                                        <Image source={uri} style={{width:20,height:20}}/>
                                        <Text style={[styles.type,{color}]}>{item.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            })
                        }
                    </View>
                </ScrollView>
            </View>
        );
    }

    onStatus(id){
        let {params} = this.state;
        let index = params.status.findIndex(p => p === id);
        (index !== -1) ? (params.status.splice(index, 1)) : (params.status.push(id));
        params.status.sort();
        this.setState({params});
    }

    renderStatus(){
        let {paramSelector, enumSelector, params} = this.state;
        let status = paramSelector.getStatusMap().filter(p => p.id !== enumSelector.statusType.OVERDUE);
        
        let ElementWidth = 72;
        PhoneInfo.isVNLanguage() && (ElementWidth = 80);
        (PhoneInfo.isTHLanguage() || PhoneInfo.isIDLanguage()) && (ElementWidth = 120);

        return (
            <View>
                <Text style={styles.label}>{I18n.t('Select status')}</Text>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    <View style={styles.flexPanel}>
                        {
                            status.map((item, index) => {
                                let exist = params.status.find(p => p === item.id);
                                let backgroundColor = (exist != null) ? '#006AB7' : '#fff';
                                let color = (exist != null) ? '#fff' : '#85898E';

                                return <TouchableOpacity activeOpacity={1} onPress={() => this.onStatus(item.id)}>
                                    <View style={[styles.statusPanel, BorderShadow.div, {backgroundColor, width:ElementWidth}]}>
                                        <Text style={[styles.content, {color}]}>{item.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            })
                        }
                    </View>
                </ScrollView>
            </View>
        )
    }

    renderInspectSelect(){
        let {selectInspects, selectInspectsName} = this.state;
        let inspectTable = (
            <TouchableOpacity onPress={() => {
                if (this.modalPatrol){
                    this.modalDownList && this.modalDownList.close();
                    this.modalPatrol.openExMultiple(selectInspects);
                }
            }}>
            <View style={{flexDirection:'row',alignItems:'center'}}>
                <Image source={require('../assets/images/inspect_table.png')} style={{width:13,height:15,marginTop:16}}/>
                <Text numberOfLines={1} style={{color:'#006ab7',fontSize:14,marginTop:16,marginLeft:5,textDecorationLine:'underline',maxWidth:width-80}}>
                    {selectInspectsName == '' ? I18n.t('Select inspect') : selectInspectsName}
                </Text>
            </View>
        </TouchableOpacity>
        )

        return (
            <View>
                <View style={{alignItems: 'flex-end', width:width-35}}>
                    {inspectTable}
                </View>
            </View>
        )
    }

    render() {
        return (
            <View style={styles.container}>
                <Navigation
                    onLeftButtonPress={()=>{Actions.pop()}}
                    title={I18n.t('Filter')}
                    rightButtonTitle={I18n.t('Confirm')}
                    onRightButtonPress={()=> {this.onConfirm()}}
                />
                <NetInfoIndicator/>
                <View style={styles.panel}>
                    {this.renderInspectSelect()}
                    {this.renderCalendar()}
                    {this.renderOrder()}
                    {this.renderSource()}
                    {this.renderStatus()}
                </View>

                <ModalPatrol  mode={null} ref={c => this.modalPatrol = c} report={true} onSelect={data => {
                    this.setState({selectInspects: data.selectInspects, selectInspectsName: data.inspectsName});
                }}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:'#ECF1F5'
    },
    panel:{
        paddingLeft:10,
        paddingRight:10
    },
    calendar:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingLeft:14,
        paddingRight:14
    },
    label:{
        color:'#666666',
        fontSize:12,
        marginTop:16,
        marginLeft:14
    },
    range:{
        color:'#9D9D9D',
        alignSelf:'center'
    },
    flexPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 8,
        marginLeft:14
    },
    order:{
        height:36,
        borderRadius: 10,
        marginRight:10,
        backgroundColor: '#ffffff',
        alignItems:'center',
        justifyContent: 'center',
        flexDirection: 'row'
    },
    type:{
        fontSize:14,
        height:40,
        lineHeight: 40,
        marginLeft:3,
        textAlign: 'center',
        textAlignVertical:'center'
    },
    tips:{
        fontSize:12,
        marginTop:3,
        marginLeft:14
    },
    statusPanel:{
        width: 72,
        height: 36,
        marginRight: 10,
        borderRadius: 10
    },
    content:{
        height:36,
        lineHeight:36,
        textAlign: 'center',
        textAlignVertical: 'center',
        marginTop:-1
    }
});
