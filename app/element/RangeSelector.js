import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, FlatList, DeviceEventEmitter} from "react-native";
import PropTypes from "prop-types";
import {CLOSE_OPTION_SELECTOR} from "../common/Constant";
import TouchableInactive from "../touchables/TouchableInactive";
import dropdown from '../assets/img_range_down.png';
import BoxShadow from "react-native-shadow/lib/BoxShadow";

const {width} = Dimensions.get('screen');
export default class RangeSelector extends Component {
    static propTypes = {
        majorKey: PropTypes.string.isRequired,
        containerStyle: PropTypes.object,
        selectContainerStyle: PropTypes.object,
        selectTextStyle: PropTypes.object,
        optionContainerStyle: PropTypes.object,
        options: PropTypes.array,
        defaultValue: PropTypes.string,
        onClick: PropTypes.function,
        onSelect: PropTypes.function,
        optionEnable: PropTypes.boolean,
        widthOffset: PropTypes.number
    };

    static defaultProps = {
        defaultValue: '',
        optionEnable: true,
        widthOffset: 0
    };

    state = {
        visible: false
    };

    constructor(props){
        super(props);
    }

    componentDidMount(){
        this.optionEmitter = DeviceEventEmitter.addListener(CLOSE_OPTION_SELECTOR,()=>{
           this.onHide();
        });

        this.switchEmitter = DeviceEventEmitter.addListener('OptionSelector', (param)=>{
            (param !== this.props.majorKey) && this.onHide();
        });
    }

    componentWillMount() {
        this.optionEmitter && this.optionEmitter.remove();
        this.switchEmitter && this.switchEmitter.remove();
    }

    onShow(){
        let {optionEnable} = this.props;
        if (optionEnable){
            let {visible} = this.state;
            this.setState({visible: !visible});

            DeviceEventEmitter.emit('OptionSelector', this.props.majorKey);
            this.props.onClick && this.props.onClick(!visible);
        }
    }

    onHide(){
        this.setState({visible: false})
    }

    onSelect(item){
        this.onHide();
        this.props.onSelect && this.props.onSelect(item);
    }

    renderItem({item}){
        let {defaultValue} = this.props;
        let backgroundColor = (defaultValue === item) ? '#ECF7FF' : '#fff';
        let color = (defaultValue === item) ? '#404554' : '#707070';
        let borderRadius = (defaultValue === item) ? 4 : 0;
        let borderColor = (defaultValue === item) ? '#2C90D9' : null;
        let borderWidth = (defaultValue === item) ? 1 : 0;
        let marginRight = (defaultValue === item) ? 10 : 11;
        return (
            <TouchableInactive onPress={()=>{this.onSelect(item)}}>
                <View style={[styles.options, {backgroundColor,borderRadius,borderColor,borderWidth,marginRight}]}>
                    <Text style={[styles.optionText,{color}]} numberOfLines={1}>
                        {item}
                    </Text>
                </View>
            </TouchableInactive>
        )
    }

    renderOptions(){
        let {options, optionContainerStyle, defaultValue, widthOffset} = this.props;
        let height = ((options.length <= 5) ? options.length : 5)*30+20;
        let index = options.findIndex(p => p === defaultValue);
        let offset = ((index -2) > 0) ? (index-2) : 0;
        let marginLeft = (index !== -1) ? -10 : 0;

        return (<View style={[styles.optionContainer,optionContainerStyle,{marginLeft, width: 100+widthOffset}]}>
            <FlatList style={{flex:1,maxHeight:230,marginTop:20,zIndex:999}}
                      ref={c => this.flatList = c}
                data={options}
                keyExtractor={(item, index) => index.toString()}
                renderItem={this.renderItem.bind(this)}
                getItemLayout={(param, index) => ({length:options.length, offset:30*index, index})}
                onLayout={() => {this.flatList && this.flatList.scrollToOffset({offset:offset*30, animated:true})}}
                showsVerticalScrollIndicator={false}/>
            <BoxShadow setting={{width:80+widthOffset, height:height, color:"#000000",
                border:2, radius:4, opacity:0.1, x:0, y:1, style:{marginTop:10-height,marginLeft:9}}}>
                <View style={{
                    width:80+widthOffset,
                    height:height,
                    borderRadius:4,
                    backgroundColor:'#fff',
                    position:'absolute',
                    top:1,
                    left:0
                }}/>
            </BoxShadow>
        </View>)
    }

    render() {
        let {containerStyle, selectContainerStyle, selectTextStyle, defaultValue} = this.props;

        let options = null;
        if (this.state.visible){
            options = this.renderOptions();
        }
        return (
            <View style={[{marginTop:-7}, containerStyle]}>
                <TouchableOpacity activeOpacity={0.6} onPress={()=>{this.onShow()}}>
                    <View style={[styles.container,selectContainerStyle]}>
                        <Text numberOfLines={1} style={selectTextStyle}>{defaultValue}</Text>
                        <Image source={dropdown} style={styles.dropdown}/>
                    </View>
                </TouchableOpacity>
                {options}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection:'row',
        justifyContent:'space-between',
        height:24
    },
    optionContainer:{
        position: 'absolute',
        top:25,
        flex:1,
        zIndex:999,
        backgroundColor:'transparent',
        borderColor:'#dcdcdc',
        borderWidth:0,
        borderRadius:6,
        paddingTop:2,
        paddingBottom:2
    },
    options:{
        paddingTop: 8,
        paddingBottom:8,
        height:30,
        marginLeft:9,
        marginRight:10
    },
    optionText:{
        fontSize:12,
        marginLeft:0,
        height:30,
        lineHeight:30,
        marginTop:-8,
        textAlign: 'center'
    },
    separator:{
        marginLeft: 6,
        marginRight:8
    },
    dropdown:{
        width:9,
        height:5,
        marginTop:10,
        marginRight:10
    }
});
