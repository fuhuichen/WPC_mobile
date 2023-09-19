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
import {EMITTER_MODAL_CLOSE} from "../../common/Constant";
import {Picker} from "react-native-wheel-datepicker";
import {Divider} from "react-native-elements";
import { backgroundColor } from 'react-native/Libraries/Components/View/ReactNativeStyleAttributes';
let {width} =  Dimensions.get('screen');

export default class DatePicker extends Component{
    state = {
        onCancel: false,
        onConfirm: false
    };

    constructor(props) {
        super(props);

        this.date = this.props.initDate;
        this.years = lodash.range(new Date().getFullYear()-4, new Date().getFullYear()+2);
        this.months = lodash.range(1,13);
        this.days = lodash.range(1,this.getDays(this.date.getFullYear(),this.date.getMonth())+1);
        this.state = {
            years: this.years,
            months: this.months,
            days: this.days,
            yearIndex:lodash.indexOf(this.years,this.date.getFullYear()),
            monthIndex: lodash.indexOf(this.months,this.date.getMonth()+1),
            dayIndex: lodash.indexOf(this.days,this.date.getDate()),
            selectedDate: this.date,
            selectedYear: this.date.getFullYear(),
            selectedMonth: this.date.getMonth(),
            selectedDay: this.date.getDate()
        };
    }

    componentDidMount() {
        this.initDate(this.date);
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

    initDate(date){
        this.setState({
            years: this.years,
            months: this.months,
            days: this.days,
            yearIndex:lodash.indexOf(this.years,date.getFullYear()),
            monthIndex: lodash.indexOf(this.months,date.getMonth()+1),
            dayIndex: lodash.indexOf(this.days,date.getDate()),
            selectedDate: date,
            selectedYear: date.getFullYear(),
            selectedMonth: date.getMonth()+1,
            selectedDay: date.getDate()
        });
    }

    open(date){
        this.initDate(date);
        this.refs.modalBox && this.refs.modalBox.open();
    }

    onCancel(){
        this.setState({onCancel: false});

        this.refs.modalBox && this.refs.modalBox.close();
        (typeof(eval(this.props.onCancel)) == "function") && this.props.onCancel();
    }

    onConfirm(){
        this.setState({onConfirm: false});

        const selectedDate = this.state.selectedDate;
        this.props.onSelected(selectedDate);
        this.refs.modalBox && this.refs.modalBox.close();
    }

    /**
     * Android platform
     */
    getDays(year,month){
        return new Date(year,month+1,0).getDate();
    }

    resetDays(year,month,day){
        let days = lodash.range(1,this.getDays(year,month)+1);
        let dayIndex = lodash.indexOf(days,day);
        dayIndex = dayIndex > 0 ? dayIndex : 0;

        if(Platform.OS === 'ios'){
            let selectedDay = dayIndex > 0 ? days[dayIndex] : 1;
            (selectedDay !== this.state.selectedDay) && this.setState({selectedDay});
        }

        let selectedDate = new Date(year,month,days[dayIndex],0,0,0);
        this.setState({days,dayIndex,selectedDate});
    }

    onYearSelected = (event: Event) => {
        this.resetDays(
            event.data,
            this.state.selectedDate.getMonth(),
            this.state.selectedDate.getDate()
        );
    }

    onMonthSelected = (event: Event) => {
        this.resetDays(
            this.state.selectedDate.getFullYear(),
            event.data-1,
            this.state.selectedDate.getDate()
            );
    }

    onDaySelected = (event: Event) => {
        this.resetDays(
            this.state.selectedDate.getFullYear(),
            this.state.selectedDate.getMonth(),
            event.data
        );
    }

    /**
     * iOS platform
     */
    onYearChange(value){
        this.setState({selectedYear:value});
        this.resetDays(
            value,
            this.state.selectedDate.getMonth(),
            this.state.selectedDate.getDate()
        );
    }

    onMonthChange(value){
        this.setState({selectedMonth:value});
        this.resetDays(
            this.state.selectedDate.getFullYear(),
            value-1,
            this.state.selectedDate.getDate()
        );
    }

    onDayChange(value){
        this.resetDays(
            this.state.selectedDate.getFullYear(),
            this.state.selectedDate.getMonth(),
            value
        );
    }

    render(){
        const {mode= true} = this.props;
        let {onCancel, onConfirm} = this.state;

        const {
            itemTextColor = mode ? '#777777' : '#7a8fae',
            selectedItemTextColor = mode ? '#000000' : '#ffeeee',
            bgColor = mode ? '#F7F9FA' : '#F7F9FA',
            lineColor = mode ? '#f5f5f5' : 'rgba(203,203,203,0.1)',
            headerColor = mode ? '#86888A' : '#ffffff',
            confirmColor = mode ? '#006AB7' : '#ffffff',
            itemColor = mode ? '#ffffff' : '#3b426e',
            textColor = mode ? '#19293b' : '#ffffff'
        } = this.props;

        return (
            <ModalBox style={[styles.modalBox,{backgroundColor:bgColor}]} ref={"modalBox"}  position={"center"}
                      isDisabled={false}
                      swipeToClose={false}
                      backdropPressToClose={false}
                      backButtonClose={true}
                      coverScreen={true}
                      onClosed={() => this.props.onClose && this.props.onClose()}>
                <View style={{height:50}}>
                <Text style={[styles.timeLabel,{color:headerColor}]}>
                    {I18n.t('Select date')}
                </Text>
                </View>

                {
                    Platform.OS !== 'ios' ?  <View style={styles.container}>
                        <WheelPicker
                            style={[styles.wheelPicker,{marginRight:-12}]}
                            isAtmospheric
                            isCyclic
                            isCurved={false}
                            visibleItemCount={5}
                            data={this.state.years}
                            itemTextSize={40}
                            itemTextColor={itemTextColor}
                            selectedItemTextColor={selectedItemTextColor}
                            onItemSelected={this.onYearSelected}
                            selectedItemPosition={this.state.yearIndex}
                        />
                        <WheelPicker
                            style={styles.wheelPicker}
                            isAtmospheric
                            isCyclic
                            isCurved={false}
                            visibleItemCount={5}
                            data={this.state.months}
                            itemTextSize={40}
                            itemTextColor={itemTextColor}
                            selectedItemTextColor={selectedItemTextColor}
                            onItemSelected={this.onMonthSelected}
                            selectedItemPosition={this.state.monthIndex}
                        />
                        <WheelPicker
                            style={styles.wheelPicker}
                            isAtmospheric
                            isCyclic
                            isCurved={false}
                            visibleItemCount={5}
                            data={this.state.days}
                            itemTextSize={40}
                            itemTextColor={itemTextColor}
                            selectedItemTextColor={selectedItemTextColor}
                            onItemSelected={this.onDaySelected}
                            selectedItemPosition={this.state.dayIndex}
                        />
                    </View> : <View style={[styles.container,{backgroundColor:bgColor}]}>
                        <Picker style={[styles.picker,{marginRight:-12}]}
                                itemStyle={{color:textColor,backgroundColor:itemColor}}
                                onValueChange={value=>this.onYearChange(value)}
                                pickerData={this.state.years}
                                selectedValue={this.state.selectedYear}
                        />
                        <Picker style={styles.picker}
                                itemStyle={{color:textColor,backgroundColor:itemColor}}
                                onValueChange={value=>this.onMonthChange(value)}
                                pickerData={this.state.months}
                                selectedValue={this.state.selectedMonth}
                        />
                        <Picker style={styles.picker}
                                itemStyle={{color:textColor,backgroundColor:itemColor}}
                                onValueChange={value=>this.onDayChange(value)}
                                pickerData={this.state.days}
                                selectedValue={this.state.selectedDay}
                        />
                    </View>
                }
                {
                    (Platform.OS !== 'ios') ? <View style={{position:'absolute',top:120,right:12,
                            backgroundColor:bgColor,width:10,height:80}}>
                        </View>
                        : null
                }
                <Divider style={styles.divider}/>
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
                            <Text style={[styles.confirm,{color:confirmColor}]}>
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
    btn:{
        width:76,
        height:36,
        marginRight:8,
        marginTop:8.5
    },
    timeLabel:{
        fontSize: 19,
        alignSelf: 'center',
        marginTop: Platform.select({
            android: 24,
            ios: 12
        }),
        marginBottom: Platform.select({
            android: 0,
            ios: 12
        })
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
    container: {
        flex: 1,
        ...Platform.select({
            ios:{
                alignItems: 'flex-start',
            },
            android:{
                alignItems: 'center',
                marginTop:20,
                paddingLeft:10,
            }
        }),
        
        flexDirection: 'row'
    },
    wheelPicker: {
        height: 150,
        width: null,
        flex:1
    },
    picker: {
        width: null,
        height: 130,
        flex:1
    },
    divider:{
        backgroundColor:'#EBF1F5',
        height:1,
        borderBottomWidth:0
    }
});
