import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, TouchableOpacity, FlatList, DeviceEventEmitter} from "react-native";
import PropTypes from "prop-types";
import {Divider} from "react-native-elements";
import {CLOSE_OPTION_SELECTOR} from "../common/Constant";
import TouchableInactive from "../touchables/TouchableInactive";
import dropdown from '../assets/images/icon_dropdown.png';
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import TouchableActive from "../touchables/TouchableActive";
import I18n from "react-native-i18n";

const {width} = Dimensions.get('screen');
export default class OptionSelector extends Component {
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
        marginLeft:PropTypes.string,
        multiselect: PropTypes.boolean,
        multiselectValue: PropTypes.array
    };

    static defaultProps = {
        defaultValue: '',
        optionEnable: true,
        multiselect: false,
        multiselectValue: []
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

    onMultiSelect(item){
        //this.onHide();
        this.props.onSelect && this.props.onSelect(item);
    }

    renderMultiSelectItem({item}) {
        let {options, multiselectValue} = this.props;
        let isSelect = false;
        if(multiselectValue.length > 0) {            
            if(multiselectValue.length == (options.length)) {
                isSelect = true;
            } else {
                let selectIds = [];
                multiselectValue.forEach(select => {
                    selectIds.push(select.id);
                })
                if(item.id && selectIds.indexOf(item.id) != -1) {
                    isSelect = true;
                }
            }
        }
        let backgroundColor = isSelect ? '#ECF7FF' : '#fff';
        let color = isSelect ? '#404554' : '#707070';
        let borderRadius = isSelect ? 4 : 0;
        let borderColor = isSelect ? '#2C90D9' : null;
        let borderWidth = isSelect ? 1 : 0;
        let marginRight = isSelect ? 10 : 11;
        let name = (item == I18n.t('All')) ? item : item.name;
        return (
            <TouchableInactive onPress={()=>{this.onMultiSelect(item)}}>
                <View style={[styles.options, {backgroundColor,borderRadius,borderColor,borderWidth,marginRight}]}>
                    <Text style={[styles.optionText,{color}]} numberOfLines={1}>
                        {name}
                    </Text>
                </View>
            </TouchableInactive>
        )
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

    renderMultiselectOptions() {
        let {options, optionContainerStyle, multiselectValue} = this.props;
        let height = ((options.length <= 5) ? options.length : 5)*46+20;

        return (<View style={[styles.optionContainer,optionContainerStyle,{marginLeft: -10}]}>
            <FlatList style={{flex:1,maxHeight:230,marginTop:10,zIndex:999}}
                      ref={c => this.flatList = c}
                data={options}
                keyExtractor={(item, index) => index.toString()}
                renderItem={this.renderMultiSelectItem.bind(this)}
                //getItemLayout={(param, index) => ({length:options.length, offset:46*index, index})}
                //onLayout={() => {this.flatList && this.flatList.scrollToOffset({offset:offset*46, animated:true})}}
                showsVerticalScrollIndicator={false}/>
            <BoxShadow setting={{width:120, height:height, color:"#000000",
                border:2, radius:4, opacity:0.1, x:0, y:1, style:{marginTop:10-height,marginLeft:9}}}>
                <View style={{
                    width:120,
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

    renderOptions(){
        let {options, optionContainerStyle, defaultValue} = this.props;
        let height = ((options.length <= 5) ? options.length : 5)*46+20;
        let index = options.findIndex(p => p === defaultValue);
        let offset = ((index -2) > 0) ? (index-2) : 0;
        let marginLeft = (index !== -1) ? -10 : 0;
        if (this.props.marginLeft){
            marginLeft = this.props.marginLeft
        }

        return (<View style={[styles.optionContainer,optionContainerStyle,{marginLeft}]}>
            <FlatList style={{flex:1,maxHeight:230,marginTop:10,zIndex:999}}
                      ref={c => this.flatList = c}
                data={options}
                keyExtractor={(item, index) => index.toString()}
                renderItem={this.renderItem.bind(this)}
                getItemLayout={(param, index) => ({length:options.length, offset:46*index, index})}
                onLayout={() => {this.flatList && this.flatList.scrollToOffset({offset:offset*46, animated:true})}}
                showsVerticalScrollIndicator={false}/>
            <BoxShadow setting={{width:120, height:height, color:"#000000",
                border:2, radius:4, opacity:0.1, x:0, y:1, style:{marginTop:10-height,marginLeft:9}}}>
                <View style={{
                    width:120,
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
        let {containerStyle, selectContainerStyle, selectTextStyle, defaultValue, multiselect, multiselectValue, options} = this.props;

        let optionsModule = null;
        if (this.state.visible){
            optionsModule = multiselect ? this.renderMultiselectOptions() : this.renderOptions();
        }
        let value = (multiselect == true) ? 'N/A' : defaultValue;
        if(multiselect == true && multiselectValue.length > 0) {
            if(multiselectValue.length == options.length) {
                value = I18n.t('All');
            } else {
                value = '';
                let firstItem = true;
                multiselectValue.forEach(item => {
                    if(firstItem == true) {
                        firstItem = false;
                    } else {
                        value += ',';
                    }
                    value += item.name;                
                })
            }
        }
        return (
            <View style={[{marginTop:-7}, containerStyle]}>
                <TouchableOpacity activeOpacity={0.6} onPress={()=>{this.onShow()}}>
                    <View style={[styles.container,selectContainerStyle]}>
                        <Text numberOfLines={1} style={selectTextStyle}>{value}</Text>
                        <Image source={dropdown} style={styles.dropdown}/>
                    </View>
                </TouchableOpacity>
                {optionsModule}
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
        width:'100%',
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
        height:46,
        marginLeft:9,
        marginRight:10,
        paddingLeft:20,
    },
    optionText:{
        fontSize:14,
        marginLeft:8,
        height:46,
        lineHeight:46,
        marginTop:-7
    },
    separator:{
        marginLeft: 6,
        marginRight:8
    },
    dropdown:{
        width:16,
        height:16,
        marginTop:3
    }
});
