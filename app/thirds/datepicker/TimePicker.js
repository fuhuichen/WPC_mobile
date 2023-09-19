import React,{Component} from 'react'
import {
    View,
    StyleSheet,
    Dimensions,
    Text,
    TouchableOpacity,
    Platform,
    DeviceEventEmitter
} from 'react-native'
import ModalBox from 'react-native-modalbox';
import I18n from 'react-native-i18n';
import {ColorStyles} from "../../common/ColorStyles";
import WheelPicker from "../timepicker/WheelPicker";
import lodash from "lodash";
import {Picker} from "react-native-wheel-datepicker";
import {EMITTER_MODAL_CLOSE} from "../../common/Constant";
let {width} =  Dimensions.get('screen');

export default class TimePicker extends Component{
    constructor(props) {
        super(props);

        let date = this.props.initDate;
        let years = lodash.range(date.getFullYear()-4,date.getFullYear()+2);
        let months = lodash.range(1,13);
        let days = lodash.range(1,this.getDays(date.getFullYear(),date.getMonth())+1);
        let hours = lodash.range(0,24);
        let minutes = lodash.range(0,60);
        let seconds = lodash.range(0,60);
        this.state = {
            years: years,
            months: months,
            days: days,
            hours: hours,
            minutes: minutes,
            seconds: seconds,
            yearIndex:lodash.indexOf(years,date.getFullYear()),
            monthIndex: lodash.indexOf(months,date.getMonth()+1),
            dayIndex: lodash.indexOf(days,date.getDate()),
            hourIndex: lodash.indexOf(hours,date.getHours()),
            minuteIndex: lodash.indexOf(minutes,date.getMinutes()),
            secondIndex: lodash.indexOf(seconds,date.getSeconds()),
            selectedDate: this.props.initDate,
            selectedYear: date.getFullYear(),
            selectedMonth: date.getMonth()+1,
            selectedDay: date.getDate(),
            selectedHour: date.getHours(),
            selectedMinute: date.getMinutes(),
            selectedSecond : date.getSeconds(),
            datePicker: true,
            onCancel: false,
            onConfirm: false
        }
    }

    componentDidMount() {
    }

    componentWillMount(){
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_MODAL_CLOSE,
            ()=>{
                this.onCancel();
            });
    }

    componentWillUnmount(){
        this.notifyEmitter && this.notifyEmitter.remove();
    }

    open(){
        this.setState({datePicker:true});
        this.refs.modalBox && this.refs.modalBox.open();
    }

    onCancel(){
        this.setState({onCancel: false});
        this.refs.modalBox && this.refs.modalBox.close();
    }

    onConfirm(){
        this.setState({onConfirm: false});
        const selectedDate = this.state.selectedDate;
        this.props.onSelected(selectedDate);
        this.refs.modalBox.close();
    }

    /**
     * Android platform
     */
    getDays(year,month){
        return new Date(year,month+1,0).getDate();
    }

    resetDays(year,month,day,hour,minute,second){
        let days = lodash.range(1,this.getDays(year,month)+1);
        let dayIndex = lodash.indexOf(days,day);
        dayIndex = dayIndex > 0 ? dayIndex : 0;

        if(Platform.OS === 'ios'){
            let selectedDay = dayIndex > 0 ? days[dayIndex] : 1;
            (selectedDay !== this.state.selectedDay) && this.setState({selectedDay});
        }

        let selectedDate = new Date(year, month ,days[dayIndex],hour,minute,second);
        this.setState({
            days,
            dayIndex,
            selectedDate
        });
    }

    onYearSelected = (event: Event) => {
        this.resetDays(
            event.data,
            this.state.selectedDate.getMonth(),
            this.state.selectedDate.getDate(),
            this.state.selectedDate.getHours(),
            this.state.selectedDate.getMinutes(),
            this.state.selectedDate.getSeconds()
        );

        this.setState({yearIndex: lodash.indexOf(this.state.years,event.data)});
    }

    onMonthSelected = (event: Event) => {
        this.resetDays(
            this.state.selectedDate.getFullYear(),
            event.data-1,
            this.state.selectedDate.getDate(),
            this.state.selectedDate.getHours(),
            this.state.selectedDate.getMinutes(),
            this.state.selectedDate.getSeconds()
        );

        this.setState({monthIndex: lodash.indexOf(this.state.months,event.data)});
    }

    onDaySelected = (event: Event) => {
        this.resetDays(
            this.state.selectedDate.getFullYear(),
            this.state.selectedDate.getMonth(),
            event.data,
            this.state.selectedDate.getHours(),
            this.state.selectedDate.getMinutes(),
            this.state.selectedDate.getSeconds()
        );
    }

    onHourSelected = (event: Event) => {
        this.resetDays(
            this.state.selectedDate.getFullYear(),
            this.state.selectedDate.getMonth(),
            this.state.selectedDate.getDate(),
            event.data,
            this.state.selectedDate.getMinutes(),
            this.state.selectedDate.getSeconds()
        );
        this.setState({hourIndex: lodash.indexOf(this.state.hours,event.data)});
    }

    onMinuteSelected = (event: Event) => {
        this.resetDays(
            this.state.selectedDate.getFullYear(),
            this.state.selectedDate.getMonth(),
            this.state.selectedDate.getDate(),
            this.state.selectedDate.getHours(),
            event.data,
            this.state.selectedDate.getSeconds()
        );

        this.setState({minuteIndex: lodash.indexOf(this.state.minutes,event.data)});
    }

    onSecondSelected = (event: Event) => {
        this.resetDays(
            this.state.selectedDate.getFullYear(),
            this.state.selectedDate.getMonth(),
            this.state.selectedDate.getDate(),
            this.state.selectedDate.getHours(),
            this.state.selectedDate.getMinutes(),
            event.data
        );

        this.setState({secondIndex: lodash.indexOf(this.state.seconds,event.data)});
    }

    /**
     * iOS platform
     */
    onYearChange(value){
        this.setState({selectedYear:value});
        this.resetDays(
            value,
            this.state.selectedDate.getMonth(),
            this.state.selectedDate.getDate(),
            this.state.selectedDate.getHours(),
            this.state.selectedDate.getMinutes(),
            this.state.selectedDate.getSeconds()
        );
    }

    onMonthChange(value){
        this.setState({selectedMonth:value});
        this.resetDays(
            this.state.selectedDate.getFullYear(),
            value-1,
            this.state.selectedDate.getDate(),
            this.state.selectedDate.getHours(),
            this.state.selectedDate.getMinutes(),
            this.state.selectedDate.getSeconds()
        );
    }

    onDayChange(value){
        this.resetDays(
            this.state.selectedDate.getFullYear(),
            this.state.selectedDate.getMonth(),
            value,
            this.state.selectedDate.getHours(),
            this.state.selectedDate.getMinutes(),
            this.state.selectedDate.getSeconds()
        );
    }

    onHourChange(value){
        this.setState({selectedHour:value});
        this.resetDays(
            this.state.selectedDate.getFullYear(),
            this.state.selectedDate.getMonth(),
            this.state.selectedDate.getDate(),
            value,
            this.state.selectedDate.getMinutes(),
            this.state.selectedDate.getSeconds()
        );
    }

    onMinuteChange(value){
        this.setState({selectedMinute:value});
        this.resetDays(
            this.state.selectedDate.getFullYear(),
            this.state.selectedDate.getMonth(),
            this.state.selectedDate.getDate(),
            this.state.selectedDate.getHours(),
            value,
            this.state.selectedDate.getSeconds()
        );
    }

    onSecondChange(value){
        this.setState({selectedSecond:value});
        this.resetDays(
            this.state.selectedDate.getFullYear(),
            this.state.selectedDate.getMonth(),
            this.state.selectedDate.getDate(),
            this.state.selectedDate.getHours(),
            this.state.selectedDate.getMinutes(),
            value
        );
    }
    
    render(){
        const {mode= true} = this.props;
        let {onCancel, onConfirm} = this.state;
        const {
            itemTextColor = '#7a8fae',
            selectedItemTextColor = mode ? '#19293b' : '#ffeeee',
            bgColor = mode ? '#ffffff': '#3b426e',
            lineColor = mode ?  '#f5f5f5' :  'gray',
            headerColor = mode ? '#19293b' : '#ffffff',
            confirmColor= mode ? ColorStyles.COLOR_MAIN_RED :'#ffffff'
        } = this.props;

        let PickerAndroid = null;
        if(Platform.OS !== 'ios'){
            PickerAndroid = (<View style={[styles.container,this.state.datePicker ? {paddingLeft:12} : {
                            paddingLeft: 30,paddingRight: 30}]}>
                {
                    this.state.datePicker ? <WheelPicker
                        style={[styles.wheelPicker,{marginRight: -12}]}
                        isAtmospheric
                        isCyclic
                        isCurved={false}
                        visibleItemCount={3}
                        data={this.state.years}
                        itemTextSize={60}
                        itemTextColor={itemTextColor}
                        selectedItemTextColor={selectedItemTextColor}
                        onItemSelected={this.onYearSelected}
                        selectedItemPosition={this.state.yearIndex}
                    /> : null
                }
                {
                    this.state.datePicker ? <WheelPicker
                        style={styles.wheelPicker}
                        isAtmospheric
                        isCyclic
                        isCurved={false}
                        visibleItemCount={3}
                        data={this.state.months}
                        itemTextSize={60}
                        itemTextColor={itemTextColor}
                        selectedItemTextColor={selectedItemTextColor}
                        onItemSelected={this.onMonthSelected}
                        selectedItemPosition={this.state.monthIndex}
                    /> : null
                }
                {
                    this.state.datePicker ? <WheelPicker
                        style={styles.wheelPicker}
                        isAtmospheric
                        isCyclic
                        isCurved={false}
                        visibleItemCount={3}
                        data={this.state.days}
                        itemTextSize={60}
                        itemTextColor={itemTextColor}
                        selectedItemTextColor={selectedItemTextColor}
                        onItemSelected={this.onDaySelected}
                        selectedItemPosition={this.state.dayIndex}
                    /> : null
                }
                {
                    !this.state.datePicker ? <WheelPicker
                        style={styles.wheelPicker}
                        isAtmospheric
                        isCyclic
                        isCurved={false}
                        visibleItemCount={3}
                        data={this.state.hours}
                        itemTextSize={60}
                        itemTextColor={itemTextColor}
                        selectedItemTextColor={selectedItemTextColor}
                        onItemSelected={this.onHourSelected}
                        selectedItemPosition={this.state.hourIndex}
                    /> : null
                }
                {
                    !this.state.datePicker ? <WheelPicker
                        style={styles.wheelPicker}
                        isAtmospheric
                        isCyclic
                        isCurved={false}
                        visibleItemCount={3}
                        data={this.state.minutes}
                        itemTextSize={60}
                        itemTextColor={itemTextColor}
                        selectedItemTextColor={selectedItemTextColor}
                        onItemSelected={this.onMinuteSelected}
                        selectedItemPosition={this.state.minuteIndex}
                    /> : null
                }
                {
                    !this.state.datePicker ? <WheelPicker
                        style={styles.wheelPicker}
                        isAtmospheric
                        isCyclic
                        isCurved={false}
                        visibleItemCount={3}
                        data={this.state.seconds}
                        itemTextSize={60}
                        itemTextColor={itemTextColor}
                        selectedItemTextColor={selectedItemTextColor}
                        onItemSelected={this.onSecondSelected}
                        selectedItemPosition={this.state.secondIndex}
                    /> : null
                }
            </View>)
        }

        let PickerIOS = null;
        if(Platform.OS === 'ios'){
            PickerIOS = (<View style={[styles.container,this.state.datePicker ? {paddingLeft:10} : {
                            paddingLeft:30,paddingRight:30}]}>
                {
                    this.state.datePicker ? <Picker
                         style={[styles.picker,{marginRight:-12}]}
                         onValueChange={value=>this.onYearChange(value)}
                         pickerData={this.state.years}
                         selectedValue={this.state.selectedYear}
                    /> : null
                }
                {
                    this.state.datePicker ? <Picker
                         style={styles.picker}
                         onValueChange={value=>this.onMonthChange(value)}
                         pickerData={this.state.months}
                         selectedValue={this.state.selectedMonth}
                    /> : null
                }
                {
                    this.state.datePicker ? <Picker
                         style={styles.picker}
                         onValueChange={value=>this.onDayChange(value)}
                         pickerData={this.state.days}
                         selectedValue={this.state.selectedDay}
                    /> : null
                }
                {
                    !this.state.datePicker ? <Picker
                         style={styles.picker}
                         onValueChange={value=>this.onHourChange(value)}
                         pickerData={this.state.hours}
                         selectedValue={this.state.selectedHour}
                    /> : null
                }
                {
                    !this.state.datePicker ? <Picker
                         style={styles.picker}
                         onValueChange={value=>this.onMinuteChange(value)}
                         pickerData={this.state.minutes}
                         selectedValue={this.state.selectedMinute}
                    /> : null
                }
                {
                    !this.state.datePicker ? <Picker
                         style={styles.picker}
                         onValueChange={value=>this.onSecondChange(value)}
                         pickerData={this.state.seconds}
                         selectedValue={this.state.selectedSecond}
                    /> : null
                }
            </View>)
        }

        return (
            <ModalBox style={[styles.modalBox,{backgroundColor:bgColor}]} ref={"modalBox"}  position={"center"}
                      isDisabled={false}
                      swipeToClose={false}
                      backdropPressToClose={false}
                      backButtonClose={true}
                      coverScreen={true}>
                <View style={{flexDirection:'row',justifyContent: 'flex-start'}}>
                    <TouchableOpacity opacity={0.2} onPress={()=>{this.setState({datePicker:true})}}>
                        <View style={{width:(width-50)/2}}>
                            <Text style={[styles.timeLabel,{color:headerColor,...Platform.select({ios:{marginTop:22}})}]}>
                                {I18n.t('Date selection')}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{width:1,height:30,backgroundColor:lineColor,marginTop:16}}/>
                    <TouchableOpacity opacity={0.2} onPress={()=>{this.setState({datePicker:false})}}>
                        <View style={{width:(width-50)/2}}>
                            <Text style={[styles.timeLabel,{color:headerColor,...Platform.select({ios:{marginTop:22}})}]}>
                                {I18n.t('Time selection')}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                 <View style={{flexDirection:'row'}}>
                    <View style={{width:(width-50)/2,height:1,marginTop:16,
                        backgroundColor:this.state.datePicker ? '#006AB7' : lineColor}}></View>
                    <View style={{width:(width-50)/2,height:1,marginTop:16,
                        backgroundColor:this.state.datePicker ? lineColor : '#006AB7'}}></View>
                </View> 

                {PickerAndroid}
                {PickerIOS}
                {
                    (this.state.datePicker && Platform.OS === 'ios') ? <View style={{position:'absolute',top:120,right:12,
                        backgroundColor:'#ffffff',width:10,height:80}}></View>
                        : null
                }
                <View style={[styles.horizontalLine,{backgroundColor:lineColor,marginTop:30}]}></View>
                <View style={styles.confirmPanel}>
                    <View style={[styles.btn,{borderColor: onCancel ? '#006AB7' : null,
                        borderWidth: onCancel ? 1 : 0, borderRadius: 10}]}>
                        <TouchableOpacity activeOpacity={0.6} onPressIn={() => {this.setState({onCancel: true})}}
                                          onPressOut={() => {this.onCancel()}}>
                            <Text style={styles.cancel}>{I18n.t('Cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.btn,{borderColor: onConfirm ? '#006AB7' : null, borderWidth:
                            onConfirm ? 1 : 0, borderRadius: 10}]}>
                        <TouchableOpacity activeOpacity={0.6} onPressIn={() => {this.setState({onConfirm: true})}}
                                          onPressOut={() => {this.onConfirm()}}>
                            <Text style={[styles.confirm,{color:'#006AB7'}]}>
                                {I18n.t('Confirm')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ModalBox>
        )
    }
}

const styles = StyleSheet.create({
    modalBox: {
        width: width-50,
        ...Platform.select({
            ios:{
                height:301
            },
            android:{
                height: 291
            }
        }),
        borderRadius:10
    },
    timeLabel:{
        fontSize: 18,
        alignSelf: 'center',
        marginTop: 16
    },
    horizontalLine:{
        height: 1,
        marginTop: 16
    },
    confirmPanel:{
        flexDirection: 'row',
        width:'100%',
        justifyContent: 'flex-end',
        alignSelf: 'center',
        height: 53,
        backgroundColor: '#fff',
        borderBottomLeftRadius:10,
        borderBottomRightRadius:10
    },
    btn:{
        width:76,
        height:36,
        marginRight:8,
        marginTop:8.5
    },
    cancel:{
        color: '#006AB7',
        height: 36,
        lineHeight:36,
        textAlignVertical: 'center',
        textAlign:'center',
        marginBottom: 16
    },
    confirm: {
        height: 36,
        lineHeight:36,
        textAlignVertical: 'center',
        textAlign:'center',
        marginBottom: 16
    },
    verticalLine:{
        width: 1,
        height: 48
    },
    container: {
        flex: 1,
        ...Platform.select({
            ios:{
                alignItems: 'flex-start'
            },
            android:{
                alignItems: 'center',
                marginTop:20
            }
        }),
        flexDirection: 'row'
    },
    wheelPicker: {
        height: 150,
        width: null,
        flex: 1,
    },
    picker: {
        width: null,
        height: 130,
        flex:1,
        backgroundColor: '#ffffff'
    }
});