/**
 * Reference: react-native-status-bar-color
 */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
    View,
    StatusBar,
    Platform
} from 'react-native';
import NavigationBar from 'react-native-navbar-color';
import * as lib from '../common/PositionLib';

export default class StatusBar extends Component{
    static propTypes = {
        color: PropTypes.string,
        theme: PropTypes.string,
        translucent: PropTypes.boolean,
        indicator: PropTypes.boolean,
        hidden: PropTypes.boolean
    };

    static defaultProps = {
        color: 'rgba(0,106,183,1)',
        theme: 'light',
        translucent: true,
        indicator: false,
        hidden: false
    };

    componentDidMount(){
        let {color, theme} = this.props;

        let component = Platform.select({
            android: () => {
                NavigationBar.setStatusBarColor(color,false);
                NavigationBar.setStatusBarTheme(theme,false);
            },
            ios: () => {}
        });

        component();
    }

    render(){
        let {color, theme, translucent, indicator, hidden} = this.props;

        return (
            <View style={{height: lib.statusBarHeight(), backgroundColor: color}}>
                <StatusBar
                    hidden={hidden}
                    showHideTransition={'fade'}
                    androidTranslucent={translucent}
                    backgroundColor={color}
                    barStyle={`${theme}-content`}
                    networkActivityIndicatorVisible={indicator}/>
            </View>
        )
    }
}
