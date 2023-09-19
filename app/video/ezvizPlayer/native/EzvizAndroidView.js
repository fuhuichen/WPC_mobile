import React, { Component } from 'react';
import { requireNativeComponent,  } from 'react-native';
import PropTypes from 'prop-types';

export default class EzvizAndroidView extends React.Component {

    static propTypes = {
        sound: PropTypes.bool,
        play: PropTypes.bool,
        fullScreen:PropTypes.bool
    };

    render() {
        return(
            <RCTVideoMgr {...this.props}/>
        );
    }
}

var RCTVideoMgr = requireNativeComponent('RCTVideoMgr', EzvizAndroidView);