import React,{Component} from 'react';
import {
    StyleSheet,
    View,
    Platform,
    Dimensions,
    TouchableOpacity,
    Image,
    Text,
    DeviceEventEmitter,
    ScrollView
} from "react-native";
import RNStatusBar from "../components/RNStatusBar";
import I18n from "react-native-i18n";
import {Actions} from "react-native-router-flux";
import moment from "moment";
import DatePicker from "../thirds/datepicker/DatePicker";
import  FilterPanel from '../components/FilterPanel/index';
import {ColorStyles} from '../common/ColorStyles';
import PhoneInfo from "../entities/PhoneInfo";
import StoreFilter from "../components/StoreFilter";
import NavBarPanel from "../components/NavBarPanel";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class SearchFilter extends Component{
    constructor(props){
        super(props);

        this.width = PhoneInfo.isEnLanguage() ? 60 : 50;
        this.state = {
            filterPanelInfo:this.props.data.filter,
            data:{
                beginTs: this.props.data.beginTs,
                endTs: this.props.data.endTs,
            },
            tips: false  
        };
        this.storeId = []
        this.lastStore = {}
    }

    onClose(){ 
        DeviceEventEmitter.emit("OnSeachFilterPop");
        Actions.pop();
    }

    confirm(){
        let monthbefore = moment(this.state.data.endTs).subtract(3, 'months').startOf('day').unix()*1000;
        if(this.state.data.beginTs > this.state.data.endTs || monthbefore > this.state.data.beginTs ){ 
            this.setState({tips: true});
            return;
        }
        DeviceEventEmitter.emit('OnStoreConfirm');
    }

    onBeginTimeChanged(date){
        let data = this.state.data;
        data.beginTs = moment(date).startOf('day').unix()*1000;
        this.setState({data});
    }

    onEndTimeChanged(date){
        let data = this.state.data;
        data.endTs = moment(date).endOf('day').unix()*1000;
        this.setState({data});
    }

    onBeginTime(){
        let beginTs = this.state.data.beginTs;
        this.refs.beginTimePicker && this.refs.beginTimePicker.open(new Date(beginTs));
        this.setState({tips:false});
    }

    onEndTime(){
        let endTs = this.state.data.endTs;
        this.refs.endTimePicker && this.refs.endTimePicker.open(new Date(endTs));
        this.setState({tips:false});
    }

    renderDateTime(){
        return (
            <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:18}}>
                <TouchableOpacity activeOpacity={0.6} onPress={()=>this.onBeginTime()}>
                    <View style={{width:(width-32-30)/2,height:28,borderBottomWidth: 0.5,borderBottomColor:'#dcdcdc'}}>
                        <Text style={{height:28,textAlign:'center',color:'#19293b',...Platform.select({ios:{lineHeight:28}})}}>
                            {moment(this.state.data.beginTs).format("YYYY/MM/DD")}
                        </Text>
                    </View>
                </TouchableOpacity>
                <View style={{width:30,height:28}}>
                    <Text style={{height:28,textAlign:'center',color:'#19293d', ...Platform.select({ios:{lineHeight:28}})}}>
                        {I18n.t('To')}
                    </Text>
                </View>
                <TouchableOpacity activeOpacity={0.6} onPress={()=>this.onEndTime()}>
                    <View style={{width:(width-32-30)/2,height:28,borderBottomWidth: 0.5,borderBottomColor:'#dcdcdc'}}>
                        <Text style={{height:28,textAlign:'center',color:'#19293b', ...Platform.select({ios:{lineHeight:28}})}}>
                            {moment(this.state.data.endTs).format("YYYY/MM/DD")}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    onFilterConfirmData(result, filterPanelInfo){
        let data = {};
        data.storeId = this.storeId;
        data.beginTs = this.state.data.beginTs;
        data.endTs = this.state.data.endTs;
        data.filter = filterPanelInfo; 
        data.lastStore = this.lastStore;
        DeviceEventEmitter.emit("OnSeachFilter", data);
        Actions.pop();
    }

    onStoreConfirm(storeId,lastStore){
        this.storeId = storeId;
        this.lastStore = lastStore;
        DeviceEventEmitter.emit('OnFilterConfirm');    
    }

    render(){
        let common = {fontSize:12,color:'#989ba3'};
        let tipColor = this.state.tips ? '#f21c65' : '#989ba3';

        return (
            <View style={styles.container}>
                <NavBarPanel title={this.props.data.title} confirmText={I18n.t('Confirm')} onCancel={this.onClose.bind(this)}  onConfirm={this.confirm.bind(this)} closeIcon={true} />                                     
                <ScrollView>
                    <View style={{marginTop:10}}>
                       <StoreFilter onConfirm={(storeId,lastStore) => this.onStoreConfirm(storeId,lastStore)} lastStore={this.props.data.lastStore} />
                    </View>          
                    <View style={{paddingLeft: 16,paddingRight: 16,paddingBottom:20}}>                      
                    <Text style={{...common,marginTop: 10}}>{I18n.t('Time filter')}</Text>
                    {this.renderDateTime()}
                    <Text style={{...common,marginTop: 12, marginBottom:5, color:tipColor}} numberOfLines={2}>
                        {I18n.t('Max query time')}
                     </Text>

                    <FilterPanel   filterPanelInfo={this.state.filterPanelInfo}
                                    panelMaxHeight={height*2}
                                    activeExpand={true}
                                    hasConfirmBtns={false}
                                    selectedTextStyle={{ color: 'white'}} selectedBlockStyle={{ backgroundColor: ColorStyles.COLOR_MAIN_RED, borderColor:ColorStyles.COLOR_MAIN_RED}}
                                    onConfirm={(result, filterPanelInfo) => this.onFilterConfirmData(result, filterPanelInfo)}
                                    />
                    </View>
                </ScrollView>
          
                <DatePicker
                    ref={"beginTimePicker"}
                    mode={true}
                    initDate={new Date()}
                    onSelected={(date)=>{this.onBeginTimeChanged(date)}}
                />
                <DatePicker
                    ref={"endTimePicker"}
                    mode={true}
                    initDate={new Date()}
                    onSelected={(date)=>{this.onEndTimeChanged(date)}}
                />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    navBarPanel:{
        flexDirection: 'row',
        height: 48,
        backgroundColor: '#24293d',
        alignItems: 'center'
    },
    navBarText: {
        fontSize:18,
        height: 48,
        color:'#ffffff',
        textAlign: 'center',
        textAlignVertical: 'center',
        marginLeft:50,
        ...Platform.select({
            ios:{
                lineHeight:48
            }
        })
    },
    regionPanel:{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 30
    },
    regionLabel:{
        height: 24
    },
    regionText:{
        fontSize: 12,
        color: '#989ba3',
        height: 24,
        lineHeight: 24,
        textAlignVertical:'center'
    },
    regionView:{
        height:24,
        borderBottomWidth:0.5,
        borderBottomColor:'#dcdcdc',
        flex:1,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    regionName:{
        fontSize: 12,
        color: '#19293b',
        height: 24,
        lineHeight: 24,
        textAlignVertical:'center',
        marginTop: -2,
        marginLeft: 4
    },
    pullDown:{
        height:48,
        width:48,
        marginTop: -12,
        marginRight: -12
    },
    contentView:{
        maxHeight:132,
        borderWidth:1,
        borderColor:'#dcdcdc',
        borderRadius:2,
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor:'#ffffff'
    },
    regionContent:{
        fontSize:12,
        color:'#19293b',
        height:40,
        lineHeight:40,
        textAlignVertical:'center'
    },
});
