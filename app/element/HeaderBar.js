import React, {Component} from 'react';
import {StyleSheet, View, Text, Image, Platform} from "react-native";
import PropTypes from 'prop-types';
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";
import EventBus from "../common/EventBus";
import menuIcon from '../assets/images/home_bar_0.png';
import searchIcon from '../assets/images/home_bar_1.png';
import notifyIcon from '../assets/images/home_bar_2.png';

export default class HeaderBar extends Component{
    static propTypes =  {
        onMenu: PropTypes.function,
        onSearch: PropTypes.function,
        onNotify: PropTypes.function,
        showSearch: PropTypes.boolean
    };

    static defaultProps = {
        showSearch: true
    };

    constructor(props){
        super(props);

        this.actions = [
            {
                type: 'onMenu',
                func: () => this.props.onMenu()
            },
            {
                type: 'onSearch',
                func: () => this.props.onSearch()
            },
            {
                type: 'onNotify',
                func: () => this.props.onNotify()
            }
        ]
    }

    doAction(type){
        EventBus.closePopupStore();
        this.actions.find(p => p.type === type).func();
    }

    render() {
        let {showSearch} = this.props;

        return <View style={styles.container}>
            <TouchableOpacityEx activeOpacity={0.5} onPress={()=>{this.doAction('onMenu')}}>
                <Image source={menuIcon}/>
            </TouchableOpacityEx>
            <View style={{flex:1}}/>

            {
                showSearch ? <TouchableOpacityEx activeOpacity={0.5} onPress={()=>{this.doAction('onSearch')}}>
                    <Image style={{width:20,height:20}} source={searchIcon}/>
                </TouchableOpacityEx> : null
            }

            {/*<TouchableOpacityEx onPress={()=>{this.doAction('onNotify')}}>*/}
                {/*<Image source={notifyIcon}/>*/}
            {/*</TouchableOpacityEx>*/}
        </View>
    }
}

const styles = StyleSheet.create({
    container: {
        height: 40,
        lineHeight:40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft:16,
        paddingRight:16,
        backgroundColor:'transparent',
        ...Platform.select({
            ios:{
                marginTop:20
            }
        })
    }
});
