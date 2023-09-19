import React,{Component} from 'react';
import {
    StyleSheet,
    View,
    Platform,
    Dimensions,
    TouchableOpacity,
    Image,
    Text,
    TouchableWithoutFeedback, DeviceEventEmitter
} from "react-native";
import RNStatusBar from "../components/RNStatusBar";
import I18n from "react-native-i18n";
import {Actions} from "react-native-router-flux";
import moment from "moment";
import DatePicker from "../thirds/datepicker/DatePicker";

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class TimeCycle extends Component{
    constructor(props){
        super(props);

        this.state = {
            mode: JSON.parse(JSON.stringify(this.props.mode)),
            data: JSON.parse(JSON.stringify(this.props.data)),
            touch: false,
            tips: false
        };

        this.timeSpan = [7,30,90];
    }

    confirm(){
        if(this.state.data.beginTs > this.state.data.endTs){
            this.setState({tips: true});
            return;
        }

        this.state.data.filter = true;
        DeviceEventEmitter.emit('onCycleCustomer',
            {
                mode: this.state.mode,
                data:this.state.data
            });
        Actions.pop();
    }

    update(key,value){
        let data = this.state.data;
        key && (data.queryType = value);
        !key && (data.timeCycle = value);

        if(!key && data.timeCycle != 3){
            this.setState({tips: false});
            data.beginTs = moment(data.endTs).startOf('day')
                .subtract(this.timeSpan[data.timeCycle]-1,'days').unix()*1000;
        }

        if(!key && data.timeCycle == 3){
            this.setState({tips: false});
            this.refs.beginTimePicker && this.refs.beginTimePicker.open(new Date(data.beginTs));
        }
        this.setState({data});
    }

    setQueryTimes(value){
        let data = this.state.data;
        data.queryTimes = value;
        this.setState({data});
    }

    onCustomerEnd(){
        this.refs.endTimePicker && this.refs.endTimePicker.open(new Date(this.state.data.endTs));
        this.setState({touch:true,tips:false});
    }

    onBeginTimeChanged(date){
        let data = this.state.data;
        data.beginTs = moment(date).startOf('day').unix()*1000;
        this.setState({data});
    }

    onEndTimeChanged(date){
        let data = this.state.data;
        data.endTs = moment(date).endOf('day').unix()*1000;
        if(data.timeCycle != 3){
            data.beginTs = moment(date).startOf('day')
                .subtract(this.timeSpan[data.timeCycle]-1,'days').unix()*1000;
        }

        this.setState({data,touch: false});
    }

    onDateCancel(){
        this.state.touch && this.setState({touch: false})
    }

    customerType(){
        let queryType = this.state.data.queryType;
       return(
           <View style={{flexDirection: 'row',justifyContent: 'flex-start',marginTop: 6}}>
               <TouchableWithoutFeedback onPress={()=>{this.update(true,0)}}>
                   <View style={[styles.viewFilter,{backgroundColor: queryType == 0 ? '#f21c65':'#f8f7f9'}]}>
                       <Text style={[styles.textFilter,{color: queryType == 0 ? '#ffffff' : '#19293d'}]}>
                           {I18n.t('Specific customers')}
                       </Text>
                   </View>
               </TouchableWithoutFeedback>
               <TouchableWithoutFeedback onPress={()=>{this.update(true,1)}}>
                   <View style={[styles.viewFilter,{backgroundColor: queryType == 1 ?'#f21c65':'#f8f7f9',marginLeft: 10}]}>
                       <Text style={[styles.textFilter,{color: queryType == 1 ? '#ffffff' : '#19293d'}]}>
                           {I18n.t('All customers')}
                       </Text>
                   </View>
               </TouchableWithoutFeedback>
           </View>
       )
    }

    customerDate(){
        let bottomColor = this.state.touch ? '#f21c65' : '#dfdfdf';
        return (
            <TouchableWithoutFeedback onPress={()=>{this.onCustomerEnd()}}>
                <View style={{height:28,borderBottomWidth: 0.5,borderBottomColor:bottomColor,marginTop:16}}>
                    <Text style={{height:28,color:'#19293d',...Platform.select({ios:{lineHeight:28  }})}}>
                        {moment(this.state.data.endTs).format("YYYY/MM/DD")}
                    </Text>
                </View>
            </TouchableWithoutFeedback>
        )
    }

    customerCycle(){
        let timeCycle = this.state.data.timeCycle;
        return(
            <View style={{marginTop: 6}}>
                <View style={{flexDirection: 'row',justifyContent: 'space-between'}}>
                    <TouchableWithoutFeedback onPress={()=>{this.update(false,0)}}>
                        <View style={[styles.viewFilter,{width:74,backgroundColor: timeCycle == 0 ? '#f21c65':'#f8f7f9'}]}>
                            <Text style={[styles.textFilter,{color: timeCycle == 0 ? '#ffffff' : '#19293d'}]}>
                                {this.timeSpan[0]}{I18n.t('Days')}
                            </Text>
                        </View>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPress={()=>{this.update(false,1)}}>
                        <View style={[styles.viewFilter,{width:74,backgroundColor: timeCycle == 1 ?'#f21c65':'#f8f7f9'}]}>
                            <Text style={[styles.textFilter,{color: timeCycle == 1 ? '#ffffff' : '#19293d'}]}>
                                {this.timeSpan[1]}{I18n.t('Days')}
                            </Text>
                        </View>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPress={()=>{this.update(false,2)}}>
                        <View style={[styles.viewFilter,{width:74,backgroundColor: timeCycle == 2 ?'#f21c65':'#f8f7f9'}]}>
                            <Text style={[styles.textFilter,{color: timeCycle == 2 ? '#ffffff' : '#19293d'}]}>
                                {this.timeSpan[2]}{I18n.t('Days')}
                            </Text>
                        </View>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPress={()=>{this.update(false,3)}}>
                        <View style={[styles.viewFilter,{width:74,backgroundColor: timeCycle == 3 ?'#f21c65':'#f8f7f9'}]}>
                            <Text style={[styles.textFilter,{color: timeCycle == 3 ? '#ffffff' : '#19293d'}]}>
                                {I18n.t('Custom time')}
                            </Text>
                        </View>
                    </TouchableWithoutFeedback>
                </View>

                <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:38}}>
                    <View style={{width:(width-32-30)/2,height:28,borderBottomWidth: 0.5,borderBottomColor:'#dfdfdf'}}>
                        <Text style={{height:28,textAlign:'center',color:'#dfdfdf',...Platform.select({ios:{lineHeight:28}})}}>
                            {moment(this.state.data.beginTs).format("YYYY/MM/DD")}
                        </Text>
                    </View>
                    <View style={{width:30,height:28}}>
                        <Text style={{height:28,textAlign:'center',color:'#19293d', ...Platform.select({ios:{lineHeight:28}})}}>
                            {I18n.t('To')}
                        </Text>
                    </View>
                    <View style={{width:(width-32-30)/2,height:28,borderBottomWidth: 0.5,borderBottomColor:'#dfdfdf'}}>
                        <Text style={{height:28,textAlign:'center',color:'#dfdfdf', ...Platform.select({ios:{lineHeight:28}})}}>
                            {moment(this.state.data.endTs).format("YYYY/MM/DD")}
                        </Text>
                    </View>
                </View>
                {
                    this.state.tips ? <Text style={{marginTop:13,fontSize:12,color:'#f21c65'}}>{I18n.t('Invalid query time')}</Text>
                        : null
                }
            </View>
        )
    }

    customerTimes(){
        let queryTimes = this.state.data.queryTimes;
        return(
            <View style={{marginTop: 6}}>
                <View style={{flexDirection: 'row',justifyContent: 'space-between'}}>
                    <TouchableWithoutFeedback onPress={()=>{this.setQueryTimes(0)}}>
                        <View style={[styles.viewFilter,{width:74,backgroundColor: queryTimes == 0 ? '#f21c65':'#f8f7f9'}]}>
                            <Text style={[styles.textFilter,{color: queryTimes == 0 ? '#ffffff' : '#19293d'}]}>
                                1{I18n.t('Times')}
                            </Text>
                        </View>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPress={()=>{this.setQueryTimes(1)}}>
                        <View style={[styles.viewFilter,{width:74,backgroundColor: queryTimes == 1 ?'#f21c65':'#f8f7f9'}]}>
                            <Text style={[styles.textFilter,{color: queryTimes == 1 ? '#ffffff' : '#19293d'}]}>
                                2{I18n.t('Times')}
                            </Text>
                        </View>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPress={()=>{this.setQueryTimes(2)}}>
                        <View style={[styles.viewFilter,{width:74,backgroundColor: queryTimes == 2 ?'#f21c65':'#f8f7f9'}]}>
                            <Text style={[styles.textFilter,{color: queryTimes == 2 ? '#ffffff' : '#19293d'}]}>
                                3{I18n.t('Times')}
                            </Text>
                        </View>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPress={()=>{this.setQueryTimes(3)}}>
                        <View style={[styles.viewFilter,{width:74,backgroundColor: queryTimes == 3 ?'#f21c65':'#f8f7f9'}]}>
                            <Text style={[styles.textFilter,{color: queryTimes == 3 ? '#ffffff' : '#19293d'}]}>
                                4{I18n.t('Times')}
                            </Text>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
                <TouchableWithoutFeedback onPress={()=>{this.setQueryTimes(4)}}>
                    <View style={[styles.viewFilter,{width:74,marginTop:10,backgroundColor: queryTimes == 4 ?'#f21c65':'#f8f7f9'}]}>
                        <Text style={[styles.textFilter,{color: queryTimes == 4 ? '#ffffff' : '#19293d'}]}>
                            5+{I18n.t('Times')}
                        </Text>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        )
    }

    render(){
        let title = this.state.mode ? I18n.t('Registered') : I18n.t('Unregistered');
        return (
            <View style={styles.container}>
                <RNStatusBar/>
                <View style={styles.navBarPanel}>
                    <TouchableOpacity activeOpacity={0.5} onPress={()=>{Actions.pop()}} style={{width:40,alignItems:'center'}}>
                        <Image source={require('../assets/images/img_navbar_close.png')} style={{width:48,height:48}}/>
                    </TouchableOpacity>
                    <View style={{width:width-130,height:48}}>
                        <Text style={styles.navBarText}>{title}{I18n.t('Filter')}</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.5} onPress={()=>{this.confirm()}}>
                        <View style={{width:80,height:48,alignItems:'flex-end'}}>
                            <Text style={{fontSize:14,color:'#ffffff',marginRight:10,textAlignVertical:'center',height:48,
                                ...Platform.select({ios:{lineHeight:48}})}}>{I18n.t('Confirm')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{paddingLeft: 16,paddingRight: 16,paddingTop: 12}}>
                    <Text style={{fontSize:12,color:'#989ba3'}}>{I18n.t('Customer type')}</Text>
                    {this.customerType()}
                    <Text style={{fontSize:12,color:'#989ba3',marginTop: 10}}>{I18n.t('Customer visit date')}</Text>
                    {this.customerDate()}
                    <Text style={{fontSize:12,color:'#989ba3',marginTop: 10}}>{I18n.t('Visit cycle')}</Text>
                    {this.customerCycle()}
                </View>

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
                    onCancel={()=>{this.onDateCancel()}}
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
    viewFilter:{
        borderRadius:2,
        height:34,
        width:100
    },
    textFilter:{
        textAlign:'center',
        textAlignVertical:'center',
        height:34,
        lineHeight:34,
        fontSize:12
    }
})
