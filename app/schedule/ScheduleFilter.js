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
import mode_1 from "../assets/images/mode_1.png";
import press_mode_1 from "../assets/images/press_mode_1.png";
import mode_0 from "../assets/images/mode_0.png";
import press_mode_0 from "../assets/images/press_mode_0.png";
import {} from "../common/FetchRequest";
import AndroidBacker from "../components/AndroidBacker";
import BorderShadow from '../element/BorderShadow';
import PhoneInfo from "../entities/PhoneInfo";
import * as lib from '../common/PositionLib';
import order_0 from "../assets/img_desc_unselect.png";
import press_order_0 from "../assets/img_desc_select.png";
import order_1 from "../assets/img_asc_unselect.png";
import press_order_1 from "../assets/img_asc_select.png";
import PropTypes from 'prop-types';

const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class ScheduleFilter extends Component {
    state = {
        filterSelector: store.filterSelector,
        enumSelector: store.enumSelector,
        tipVisible: false,
        dropDown: false,
        params:{
            beginTs: moment().subtract(30, 'days').startOf('day').unix()*1000,
            endTs: moment().add(60, 'days').endOf('day').unix()*1000,
            //modes: [],
            //states: [],
            //order: 1
            isExecute: null,
            tagMode	: null,
            order: 'asc'
        }
    };

    static propTypes =  {
        type: PropTypes.number
    };

    static defaultProps = {
        type: store.enumSelector.scheduleType.ALL
    };

    componentDidMount(){
        let {filterSelector,params} = this.state;
        if(filterSelector.schedule !== params){
            this.setState({params: JSON.parse(JSON.stringify(filterSelector.schedule))});
        }
    }

    onConfirm(){
        let {filterSelector,params} = this.state;

        const threeMonthAgo = TimeUtil.getThreeMonths(params.endTs);
        if ((params.beginTs > params.endTs) ||
            (params.endTs - params.beginTs > params.endTs - threeMonthAgo)) {
            this.setState({tipVisible: true});
            return;
        }

        if(params.isExecute == 'none') {
            params.isExecute = null;
        }

        if(params.tagMode == 'none') {
            params.tagMode = null;
        }

        filterSelector.schedule = params;
        this.setState({filterSelector}, () => {
            DeviceEventEmitter.emit('OnSchedule');
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
        let {params, tipVisible} = this.state;
        let color = tipVisible ? '#f21c65' : '#989ba3';

        return <View>
            <Text style={styles.label}>{I18n.t('Execution date')}</Text>
            <View style={styles.calendar}>
                <Calendar date={params.beginTs} width={(width-48-23)/2}
                        onClick={() => {
                            this.setState({tipVisible: false});
                        }}
                        onSelect={(date) =>this.onDateChange(0,date)}/>
                <Text style={styles.range}>{I18n.t('To')}</Text>
                <Calendar date={params.endTs} width={(width-48-23)/2}
                        onClick={() => {
                            this.setState({tipVisible: false});
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
        let {params} = this.state, width = 106;
        (PhoneInfo.isTHLanguage() || PhoneInfo.isVNLanguage() || PhoneInfo.isJALanguage()) && (width = 130);
        PhoneInfo.isIDLanguage() && (width = 150);

        let orders = [
            {
                order: 'asc',
                type: I18n.t('Time Asc'),
                uri: order_0,
                pressUri:press_order_0
            },
            {
                order: 'desc',
                type: I18n.t('Time Desc'),
                uri:order_1,
                pressUri:press_order_1
            }
        ];

        return (
            <View>
                <Text style={styles.label}>{I18n.t('Sort type')}</Text>
                <View style={styles.flexPanel}>
                    {
                        orders.map((item, index) => {
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

    onMode(mode){
        let {params, enumSelector} = this.state;
        if(params.tagMode == null) {
            params.tagMode = (mode == enumSelector.patrolType.ONSITE) ? enumSelector.patrolType.REMOTE : enumSelector.patrolType.ONSITE;
        } else if (params.tagMode == mode) {
            params.tagMode = 'none';
        } else if (params.tagMode == 'none') {
            params.tagMode = mode;
        } else {
            params.tagMode = null;
        }
        this.setState({params});
    }

    renderMode(){
        let {params, enumSelector} = this.state;
        let data = [
            {
                mode: enumSelector.patrolType.ONSITE,
                type: I18n.t('Onsite patrol'),
                uri: mode_1,
                pressUri:press_mode_1
            },
            {
                mode: enumSelector.patrolType.REMOTE,
                type: I18n.t('Remote patrol'),
                uri:mode_0,
                pressUri:press_mode_0
            }
        ];
        return (
            <View>
                <Text style={styles.label}>{I18n.t('Select mode')}</Text>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    <View style={styles.modePanel}>
                        {
                            data.map((item, index) => {
                                let isSelect = (params.tagMode == null || params.tagMode == item.mode) ? true : false;
                                let backgroundColor = isSelect ?  '#006AB7' : '#ffffff';
                                let color = isSelect ? '#ffffff' : '#69727C';
                                let uri = isSelect ? item.pressUri : item.uri;
                                return <TouchableOpacity activeOpacity={1} onPress={() => this.onMode(item.mode)}>
                                    <View style={[styles.mode,{backgroundColor}, BorderShadow.div]}>
                                        <Image source={uri} style={{width:20,height:20}}/>
                                        <Text style={[styles.inspect,{color}]}>{item.type}</Text>
                                    </View>
                                </TouchableOpacity>
                            })
                        }
                    </View>
                </ScrollView>
            </View>
        )
    }

    onState(state){
        let {params, enumSelector} = this.state;
        if(params.isExecute == null) {
            params.isExecute = (state == enumSelector.scheduleState.PENDING) ? enumSelector.scheduleState.DONE : enumSelector.scheduleState.PENDING;
        } else if (params.isExecute == state) {
            params.isExecute = 'none';
        } else if (params.isExecute == 'none') {
            params.isExecute = state;
        } else {
            params.isExecute = null;
        }
        this.setState({params});
    }

    renderState(){
        let {params, enumSelector} = this.state;
        let data = [
            {
                state: enumSelector.scheduleState.PENDING,
                type: I18n.t('Pending')
            },
            {
                state: enumSelector.scheduleState.DONE,
                type: I18n.t('Done')
            }
        ];
        return (
            <View>
                <Text style={styles.label}>{I18n.t('Execution state')}</Text>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    <View style={styles.modePanel}>
                        {
                            data.map((item, index) => {
                                let isSelect = (params.isExecute == null || params.isExecute == item.state) ? true : false;
                                let backgroundColor = isSelect ?  '#006AB7' : '#ffffff';
                                let color = isSelect ? '#ffffff' : '#69727C';
                                return <TouchableOpacity activeOpacity={1} onPress={() => this.onState(item.state)}>
                                    <View style={[styles.state,{backgroundColor}, BorderShadow.div]}>
                                        <Text style={[styles.inspect,{color}]}>{item.type}</Text>
                                    </View>
                                </TouchableOpacity>
                            })
                        }
                    </View>
                </ScrollView>
            </View>
        )
    }

    render() {
        return (
            <View style={styles.container}>
                <Navigation
                    onLeftButtonPress={()=>{
                        Actions.pop();
                    }}
                    title={I18n.t('Filter')}
                    rightButtonTitle={I18n.t('Confirm')}
                    onRightButtonPress={()=> {this.onConfirm()}}
                />
                <NetInfoIndicator/>
                <View style={styles.panel}>
                    {(this.props.type == store.enumSelector.scheduleType.ALL) && this.renderCalendar()}
                    {this.renderOrder()}
                    {this.renderMode()}
                    {this.renderState()}
                </View>

                <AndroidBacker onPress={() => {
                    Actions.pop();
                    return true;
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
    brandName:{
        fontSize: 14,
        textAlignVertical: 'center',
        height:44,
        lineHeight:44
    },
    outBox:{
        alignItems:'center',
        borderRadius:4,
        height:46
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
        fontSize: 16,
        color:'#9D9D9D',
        alignSelf:'center'
    },
    modePanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 8,
        marginLeft:14
    },
    mode:{
        height:36,
        borderRadius: 10,
        marginRight:10,
        backgroundColor: '#ffffff',
        alignItems:'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingLeft:6,
        paddingRight:6
    },
    state:{
        height:36,
        borderRadius: 10,
        marginRight:10,
        backgroundColor: '#ffffff',
        alignItems:'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingLeft:16,
        paddingRight:16
    },
    inspect:{
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
    list:{
        marginLeft:10,
        maxHeight:230,
        marginTop:10,
        marginBottom:10,
        borderRadius:10
    },
    borderShadow:{
        position:'absolute',
        top:0,
        left:0,
        zIndex:-99,
        width:width-46,
        marginLeft:23,
        borderRadius:10,
        backgroundColor:'#fff'
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
    flexPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 8,
        marginLeft:14
    }
});
