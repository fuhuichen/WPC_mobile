/**
 * react-native-navigation-bar main
 */

import React, {
    Component,
} from 'react';

import {
    StyleSheet,
    View,
    Image,
    Text,
    TouchableOpacity,
    Dimensions,
    Platform
} from 'react-native';
import PropTypes from "prop-types";
import {Icon} from 'react-native-elements';
import * as lib from '../common/PositionLib';
import {ColorStyles} from "../common/ColorStyles";

const width = Dimensions.get('screen').width;
const paddingHorizontal = lib.paddingHorizontal();
export default class Navigation extends Component{

    static propTypes = {
        title: PropTypes.string,
        //not include the height of statusBar on ios platform
        height: PropTypes.number,
        titleColor: PropTypes.string,
        backgroundColor: PropTypes.string,
        leftIconType:PropTypes.string,
        leftButtonTitle: PropTypes.string,
        leftButtonTitleColor: PropTypes.string,
        leftIconName: PropTypes.string,
        onLeftButtonPress: PropTypes.func,
        rightButtonTitle: PropTypes.string,
        rightButtonTitleColor: PropTypes.string,
        onRightButtonPress: PropTypes.func,
        rightButtonEnable: PropTypes.boolean,
        rightButtonStyle: PropTypes.style,
        titleStyle: PropTypes.style,
        rightButtonMore: PropTypes.boolean,
        borderBottomRadius: PropTypes.number,
        onRightMore: PropTypes.func
    };

    static defaultProps = {
        height: Platform.select({android:56, ios:78}),
        titleColor: '#FFFFFF',
        backgroundColor: ColorStyles.STATUS_BACKGROUND_BLUE,
        leftIconType:'return',
        leftButtonTitle: '',
        leftButtonTitleColor: '#F7F9FA',
        leftIconName: 'chevron-left',
        rightButtonTitle: '',
        rightButtonTitleColor: '#fff',
        rightButtonEnable: true,
        rightButtonStyle:{
            activeColor: ColorStyles.STATUS_BACKGROUND_BLUE,
            inactiveColor: ColorStyles.STATUS_BACKGROUND_BLUE,
            textColor: '#ffffff',
            padding: 0,
            fontSize:17
        },
        titleStyle:{
            fontSize:18,
            marginTop: Platform.select({
                ios: 3
            })
        },
        rightButtonMore:false,
        borderBottomRadius: 8
    };

    componentWillMount(){
        this.state = this._getStateFromProps(this.props);
    }

    componentWillReceiveProps(newProps){
        let newState = this._getStateFromProps(newProps);
        this.setState(newState);
    }

    shouldComponentUpdate(nextProps, nextState, context) {
        return JSON.stringify([nextState, context]) !== JSON.stringify([this.state, context]);
    }

    _getStateFromProps(props){
        return {
            ...props
        };
    }

    _renderLeftIcon() {

        let img = (this.props.leftButtionIcon)? this.props.leftButtionIcon:require('../assets/img_header_back.png');
        //console.log("this.props.leftIconType:",this.props.leftIconType)
        if(this.props.leftIconType == 'switch'){
            return(
            <Image source={img} style={{width:20,height:20,marginLeft:-8,marginTop:5,marginRight:-2}}/>
            );
        }
        else{
            return(
            <Image source={img} style={{width:36,height:36,marginLeft:-16,marginTop:-5,marginRight:-2}}/>
            );
        }
    }

    _renderRightIcon() {
        if(this.state.rightButtonIcon){
            return (
                <Image style={styles.rightButtonIcon} resizeMode={'contain'} source={this.state.rightButtonIcon} />
            );
        }
        return null;
    }

    _onLeftButtonPressHandle(event) {
        let onPress = this.state.onLeftButtonPress;
        typeof onPress === 'function' && onPress(event);
    }

    _onRightButtonPressHandle(event) {
        let onPress = this.state.onRightButtonPress;
        typeof onPress === 'function' && onPress(event);
    }

    render() {
        let {rightButtonEnable, rightButtonMore, borderBottomRadius, rightButtonImg} = this.props;
        let {rightButtonStyle, rightButtonTitle} = this.state;

        return (
            <View style={{backgroundColor: ColorStyles.STATUS_BACKGROUND_COLOR,height:this.state.height}}>
                <View style={[styles.container, {
                    height: this.state.height,
                    backgroundColor: this.state.backgroundColor,
                    borderBottomLeftRadius: borderBottomRadius,
                    borderBottomRightRadius: borderBottomRadius,
                    paddingTop: Platform.select({android:0, ios:10})
                }]}>

                    <TouchableOpacity onPress={this._onLeftButtonPressHandle.bind(this)}>
                        <View style={[styles.leftButton, (rightButtonTitle === '') && {width:40}]}>
                            {this._renderLeftIcon()}
                            <Text style={[styles.leftButtonTitle, {color: this.state.leftButtonTitleColor}]}>
                                {this.state.leftButtonTitle}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <View style={[styles.title, (rightButtonTitle === '') && {width:width-120}]}>
                        <Text style={[styles.titleText, {color: this.state.titleColor},this.state.titleStyle,
                            (rightButtonTitle === '') && {maxWidth:width-120}]} numberOfLines={1}>
                            {this.state.title}
                        </Text>
                    </View>

                    {
                        rightButtonEnable ?
                            <View style={[styles.rightButton,{marginTop: (rightButtonMore ? -20 : -16)-Platform.select({android:0, ios:10})},
                                (rightButtonTitle === '') && {width:47}]}>
                                <TouchableOpacity activeOpacity={0.5} onPress={this._onRightButtonPressHandle.bind(this)}>
                                    {this._renderRightIcon()}
                                    <View style={{backgroundColor: rightButtonStyle.activeColor, paddingLeft: rightButtonStyle.padding,
                                        paddingRight:rightButtonStyle.padding, paddingTop:7, paddingBottom:6, borderRadius:10}}>
                                        <Text style={[styles.rightButtonTitle, {color: rightButtonStyle.textColor,
                                            fontSize: rightButtonStyle.fontSize}]}>
                                            {this.state.rightButtonTitle}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                {
                                    this.state.rightButtonMore ? <TouchableOpacity activeOpacity={0.6}
                                                                                   onPress={() => {this.props.onRightMore && this.props.onRightMore()}}>
                                        <Image style={{width:22,height:22,marginLeft:8,marginTop:4}}
                                                                        source={require('../assets/img_head_more.png')}/>
                                    </TouchableOpacity> : null
                                }
                                {
                                    rightButtonImg ? <TouchableOpacity activeOpacity={0.6} onPress={() => {this.props.onRightButtonPress()}}>
                                        <Image style={{width:15,height:15,marginLeft:8,marginTop:4}} source={rightButtonImg}/>
                                    </TouchableOpacity> : null
                                }
                            </View> : <TouchableOpacity activeOpacity={1}>
                            <View style={[styles.rightButton, (rightButtonTitle === '') && {width:47}]}>
                                {this._renderRightIcon()}
                                <View style={{backgroundColor: rightButtonStyle.inactiveColor, paddingLeft: rightButtonStyle.padding,
                                    paddingRight: rightButtonStyle.padding, paddingTop:7, paddingBottom:6, borderRadius:10}}>
                                    <Text style={[styles.rightButtonTitle, {color: '#85898E', fontSize: rightButtonStyle.fontSize}]}>
                                        {this.state.rightButtonTitle}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    }
                </View>
            </View>
        );
    }
};

let styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        width: width,
        paddingLeft:20,
        paddingRight:13,
    },
    leftButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        width: 80,
        paddingTop: 10,
        paddingLeft: 0
    },
    leftButtonTitle: {
        fontSize: 17,
        marginLeft: -3,
        marginTop: Platform.select({
            ios: 3
        })
    },
    title: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 10,
        fontSize: 20,
        width: width - 200
    },
    titleText: {
        fontSize: 18,
        fontWeight: '400',
        textAlign: 'center',
        maxWidth: width-200
    },
    rightButton: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: 87,
        paddingTop: 8,
        paddingRight: 0,
        marginTop:Platform.select({
            android:0,
            ios:3
        })
    },
    rightButtonIcon: {
        width: 10,
        height: 15
    },
    rightButtonTitle: {
        fontSize: 14
    }
});
