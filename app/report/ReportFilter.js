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
import SlideModalEx from "../components/SlideModal";
import {getInspectTagList} from "../common/FetchRequest";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import AndroidBacker from "../components/AndroidBacker";
import BorderShadow from '../element/BorderShadow';
import PhoneInfo from "../entities/PhoneInfo";
import * as lib from '../common/PositionLib';
import order_0 from "../assets/img_desc_unselect.png";
import press_order_0 from "../assets/img_desc_select.png";
import order_1 from "../assets/img_asc_unselect.png";
import press_order_1 from "../assets/img_asc_select.png";

const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class ReportFilter extends Component {
    state = {
        filterSelector: store.filterSelector,
        enumSelector: store.enumSelector,
        tipVisible: false,
        dropDown: false,
        inspectList:[],
        data: [
            {
                mode: 1,
                type: I18n.t('Onsite patrol'),
                uri: mode_1,
                pressUri:press_mode_1
            },
            {
                mode: 0,
                type: I18n.t('Remote patrol'),
                uri:mode_0,
                pressUri:press_mode_0
            }
        ],
        orders: [
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
        params:{
            beginTs: moment().subtract(30, 'days').startOf('day').unix()*1000,
            endTs: moment().endOf('day').unix()*1000,
            modes: [],
            tableName: I18n.t('All'),
            tableMode:-1,
            tableId:-1,
            order: 1
        }
    };

    componentDidMount(){
        let {filterSelector,params} = this.state;
        if(filterSelector.report !== params){
            this.setState({params: JSON.parse(JSON.stringify(filterSelector.report))});
        }
        this.getTagList();
    }

    onConfirm(){
        let {filterSelector,params} = this.state;

        const threeMonthAgo = TimeUtil.getThreeMonths(params.endTs);
        if ((params.beginTs > params.endTs) ||
            (params.endTs - params.beginTs > params.endTs - threeMonthAgo)) {
            this.setState({tipVisible: true});
            return;
        }

        filterSelector.report = params;
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
        let {params, tipVisible} = this.state;
        let color = tipVisible ? '#f21c65' : '#989ba3';

        return <View>
            <Text style={styles.label}>{I18n.t('Create date')}</Text>
            <View style={styles.calendar}>
                <Calendar date={params.beginTs} width={(width-48-23)/2}
                        onClick={() => {
                            this.setState({tipVisible: false});
                            this.modalDownList && this.modalDownList.close();
                        }}
                        onSelect={(date) =>this.onDateChange(0,date)}/>
                <Text style={styles.range}>{I18n.t('To')}</Text>
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
        let {orders, params} = this.state, width = 106;
        (PhoneInfo.isTHLanguage() || PhoneInfo.isVNLanguage() || PhoneInfo.isJALanguage()) && (width = 130);
        PhoneInfo.isIDLanguage() && (width = 150);

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

    onMode(modeKey, item){
        let {params} = this.state;
        (modeKey !== -1) ? (params.modes.splice(modeKey, 1))
            : (params.modes.push(item.mode));

        if(params.modes.findIndex(p=> p === params.tableMode) === -1){
            params.tableName = I18n.t('All');
        }
        this.setState({params});
        this.getTagList();
    }

    renderMode(){
        let {data, params} = this.state;
        return (
            <View>
                <Text style={styles.label}>{I18n.t('Select mode')}</Text>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    <View style={styles.modePanel}>
                        {
                            data.map((item, index) => {
                                let modeKey = params.modes.findIndex(p => p === item.mode);
                                let backgroundColor = (modeKey !== -1) ?  '#006AB7' : '#ffffff';
                                let color = (modeKey != -1) ? '#ffffff' : '#69727C';
                                let uri = (modeKey != -1) ? item.pressUri : item.uri;
                                return <TouchableOpacity activeOpacity={1} onPress={() => this.onMode(modeKey, item)}>
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

    renderTable(){
        let {params, inspectList, dropDown} = this.state;
        let borderColor = dropDown ? '#2C90D9' : '#fff';
        return (
            <View>
                <Text style={styles.label}>{I18n.t('Select table')}</Text>
                <BoxShadow setting={{width:width-48, height:46, color:"#000000",
                    border:1, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:8,marginLeft:14}}}>
                    <View style={[styles.tablePanel,{borderColor, borderWidth:1}]}>
                        <TouchableOpacity activeOpacity={0.5} style={styles.btnCard} onPress={() => {
                            this.setState({dropDown: true});
                            this.modalDownList.open();
                        }}>
                            <Text style={styles.tableName}>{params.tableName}</Text>
                            <Image source={require('../assets/images/drop_down.png')} style={styles.arrow}/>
                        </TouchableOpacity>
                    </View>
                </BoxShadow>
            </View>
        )
    }

    async getTagList(){
        let {enumSelector,params} = this.state;
        let mode = params.modes.length === 1 ? params.modes[0] : null;

        let result = await getInspectTagList(mode);
        if (result.errCode !== enumSelector.errorType.SUCCESS){
            DeviceEventEmitter.emit('Toast', I18n.t('Inspection failed'));
            return;
        }

        result.data.unshift({name: I18n.t('All')});
        this.setState({inspectList: result.data});
    }

    async clickRow(item,index){
        let {params,inspectList} = this.state;
        setTimeout(() => {
            this.modalDownList.close();
        }, 200);

        params.tableName = inspectList[index].name;
        params.tableMode = inspectList[index].mode;
        params.tableId = inspectList[index].id;
        this.setState({params, dropDown:false});
    }

    renderRow = ({ item,index}) => {
        let {params} = this.state;
        let selected = ((item.id === params.tableId) || ((params.tableId === -1) && (index === 0)));

        let backgroundColor = selected ? '#ECF7FF' : '#fff';
        let color = selected ? '#404554': '#707070';
        let borderColor = selected ? '#2C90D9' : null;
        let borderWidth = selected ? 1 : 0;

        return (
            <TouchableOpacity activeOpacity={1} onPress={this.clickRow.bind(this,item,index)} >
                <View style={[styles.outBox,{backgroundColor, width: width-48, marginLeft:14,borderColor,borderWidth}]}>
                    <Text style={[styles.brandName,{backgroundColor,color}]} numberOfLines={1}>{item.name}</Text>
                </View>
            </TouchableOpacity>
        )
    };

    render() {
        let {params,inspectList} = this.state;
        let offset = inspectList.findIndex(p => p.id === params.tableId);
        offset = ((offset -2) > 0) ? (offset-2) : 0;

        let offsetY = Platform.select({
            android: PhoneInfo.isEnLanguage() ? 347 : 332,
            ios: PhoneInfo.isEnLanguage() ? 334 : 319
        });

        offsetY = offsetY + lib.statusBarHeight() + 76;

        return (
            <View style={styles.container}>
                <Navigation
                    onLeftButtonPress={()=>{
                        this.modalDownList && this.modalDownList.close();
                        Actions.pop();
                    }}
                    title={I18n.t('Filter')}
                    rightButtonTitle={I18n.t('Confirm')}
                    onRightButtonPress={()=> {this.onConfirm()}}
                />
                <NetInfoIndicator/>
                <View style={styles.panel}>
                    {this.renderCalendar()}
                    {this.renderOrder()}
                    {this.renderMode()}
                    {this.renderTable()}
                </View>

                <SlideModalEx ref={(c) => { this.modalDownList = c; }} offsetY={offsetY} opacity={0} width={width-10}
                              onClosed={() => {this.setState({dropDown:false})}}>
                    <FlatList ref={c => this.inspect = c}
                              showsVerticalScrollIndicator={false}
                              style={styles.list}
                              data={inspectList}
                              extraData={this.state}
                              keyExtractor={(item, index) => index.toString()}
                              renderItem={this.renderRow}
                              getItemLayout={(param, index) => ({length:inspectList.length, offset:46*index, index})}
                              onLayout={() => {this.inspect && this.inspect.scrollToOffset({offset:offset*46, animated:true})}}
                    />
                    <View style={[styles.borderShadow,BorderShadow.div,
                        {height: ((inspectList.length < 5) ? inspectList.length : 5)*46+20}]}/>
                </SlideModalEx>

                <AndroidBacker onPress={() => {
                    this.modalDownList && this.modalDownList.close();
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
    inspect:{
        fontSize:14,
        height:40,
        lineHeight: 40,
        marginLeft:3,
        textAlign: 'center',
        textAlignVertical:'center'
    },
    tablePanel:{
        height:46,
        width:width-48,
        borderRadius: 10,
        backgroundColor:'#fff'
    },
    btnCard:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems: 'center',
        paddingLeft: 12,
        paddingRight: 12
    },
    tableName: {
        fontSize: 14,
        color:'#9D9D9D',
        height: 46,
        lineHeight:46,
        textAlignVertical: 'center'
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
