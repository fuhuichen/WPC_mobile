import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity} from "react-native";
import PropTypes from 'prop-types';
import {Card} from 'react-native-shadow-cards';
import moment from "moment";
import DatePicker from "../thirds/datepicker/DatePicker";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import TouchableActive from "../touchables/TouchableActive";

const {width} = Dimensions.get('screen');
export default class Calendar extends Component {
    static propTypes = {
        date: PropTypes.number.isRequired,
        width: PropTypes.number,
        onClick: PropTypes.function,
        onSelect: PropTypes.function
    };

    static defaultProps = {
        width: 152
    };

    state = {
        visible: false
    };

    onSelect(date){
        this.props.onSelect && this.props.onSelect(date);
        this.setState({visible:false})
    }

    onCalendar(){
        let {date} = this.props;
        this.setState({visible: true});
        this.props.onClick && this.props.onClick();
        this.picker && this.picker.open(new Date(date));
    }

    render() {
        let {date, width} = this.props;
        let {visible} = this.state;
        let borderStyle = {borderWidth: 1,borderColor: '#2C90D9'};

        return (
            <View>
                <TouchableOpacity activeOpacity={1} onPress={() => {this.onCalendar()}}>
                    <BoxShadow setting={{width:width, height:46, color:"#000000",
                        border:1, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:0}}}>
                        <View style={[styles.container,{width}, visible && borderStyle]}>
                            <Text style={[styles.date, visible && {color:'#404554'}]}>{moment(date).format('YYYY/MM/DD')}</Text>
                            <Image source={require('../assets/images/drop_down.png')} style={styles.image}/>
                        </View>
                    </BoxShadow>
                </TouchableOpacity>
                <DatePicker
                    ref={c => this.picker = c}
                    mode={true}
                    initDate={new Date()}
                    onCancel={() => {this.setState({visible:false})}}
                    onClose={() => {this.setState({visible:false})}}
                    onSelected={(date)=>{this.onSelect(date)}}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection:'row',
        justifyContent:'space-between',
        borderRadius: 10,
        height: 46,
        paddingLeft:12,
        paddingRight:12,
        backgroundColor:'#ffffff'
    },
    date:{
        alignSelf: 'center',
        color:'#9D9D9D',
        fontSize:15
    },
    image:{
        width:24,
        height:24,
        alignSelf:'center'
    }
});
