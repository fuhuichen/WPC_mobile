import React from 'react'
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import lodash from 'lodash';
import {Picker} from 'react-native-wheel-datepicker';

type Props = {
    initDate: string,
    onTimeSelected: PropTypes.func
}

export default class TimePickerIOS extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)

        const selectedDate = new Date(this.props.initDate);
        this.hours = lodash.range(0,24);
        this.minutes = lodash.range(0,60);
        this.state = {
            selectedDate,
            selectedHour: selectedDate.getHours(),
            selectedMinute: selectedDate.getMinutes(),
            selectedSecond: selectedDate.getSeconds()
        }
    }

    onHourSelected(value){
        this.setState({selectedHour:value});
        const selectedDate = this.state.selectedDate;
        selectedDate.setHours(value);
        this.onTimeSelected(selectedDate);
    }

    onMinuteSelected(value){
        this.setState({selectedMinute:value});
        const selectedDate = this.state.selectedDate;
        selectedDate.setMinutes(value);
        this.onTimeSelected(selectedDate);
    }


    onSecondSelected(value){
        this.setState({selectedSecond:value});
        const selectedDate = this.state.selectedDate;
        selectedDate.setSeconds(value);
        this.onTimeSelected(selectedDate);
    }

    onTimeSelected(selectedDate: Date) {
        this.props.onTimeSelected && this.props.onTimeSelected(selectedDate);
    }


    render() {
        return (
            <View style={styles.container}>
                <Picker style={styles.picker}
                        onValueChange={value=>this.onHourSelected(value)}
                        pickerData={this.hours}
                        selectedValue={this.state.selectedHour}
                    />
                <Picker style={styles.picker}
                        onValueChange={value=>this.onMinuteSelected(value)}
                        pickerData={this.minutes}
                        selectedValue={this.state.selectedMinute}
                    />
                <Picker style={styles.picker}
                        onValueChange={value=>this.onSecondSelected(value)}
                        pickerData={this.minutes}
                        selectedValue={this.state.selectedSecond}
                    />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'flex-start',
        flexDirection: 'row'
    },
    picker: {
        width: null,
        height: 130,
        flex:1,
        backgroundColor: '#ffffff'
    }
})
