import React, {Component} from 'react';

import {
    View,
    TouchableOpacity,
    StyleSheet,
    Image,
    BackHandler,
    Text
} from 'react-native';
import {Actions} from "react-native-router-flux";
import PropType from "prop-types";
import RNStatusBar from "./RNStatusBar";
import NetInfoIndicator from "./NetInfoIndicator";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";

export default class NavBarPanel extends Component {

    static propTypes = {
        onConfirm:PropType.func,
        onCancel:PropType.func
    }

    componentWillMount(){
        if (Platform.OS === 'android') {
            BackHandler.addEventListener('hardwareBackPress', this.onBackAndroid);
        }
    }

    componentWillUnmount() {
        if (Platform.OS === 'android') {
            BackHandler.removeEventListener('hardwareBackPress', this.onBackAndroid);
        }
    }

    onBackAndroid = () => {
        if (this.props.onCancel == null){
            return false;
        }
        else {
            this.props.onCancel();
            return true;
        }
    };

    render() {
        let cancel = null;
        let imageSource = require('../assets/images/titlebar_back_icon_normal.png');
        if (this.props.closeIcon == true){
            imageSource = require('../assets/images/img_navbar_close.png');
        }
        if (this.props.showCancel == null || this.props.showCancel == true){cancel  = (
            <TouchableOpacity onPress={() => {
                if (this.props.onCancel == null){
                    Actions.pop();
                }
                else {
                    this.props.onCancel();
                }
            }}>
                <Image source={imageSource} style={{width:48,height:48}}/>
            </TouchableOpacity>
        )
        }
        else { cancel = (
            <View style={{width:48,height:48}}/>
        )
        }

        return (
            <View>
                <RNStatusBar/>
                <View style={styles.NavBarPanel}>
                    {cancel}
                    <View style={{width:32}}/>
                    <View style={{flex:1,alignItems: 'center'}}>
                        <Text numberOfLines={1} style={{fontSize:18,color: '#ffffff'}}>{this.props.title}</Text>
                    </View>
                    <TouchableOpacityEx style={{width:80,flexDirection: 'row',justifyContent:'flex-end'}} onPress={() =>{
                        if (this.props.onConfirm != null) {
                            this.props.onConfirm();
                        }
                    }}>
                        <Text style={{fontSize:14,color:'#ffffff',marginRight:10}}>{this.props.confirmText}</Text>
                    </TouchableOpacityEx>
                </View>
                <NetInfoIndicator/>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    NavBarPanel: {
        flexDirection: 'row',
        height: 48,
        backgroundColor: '#24293d',
        alignItems: 'center',
    }
});
