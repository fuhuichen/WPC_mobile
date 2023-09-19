import React, { Component } from 'react';
import { requireNativeComponent,  } from 'react-native';
import PropTypes from 'prop-types';

export default class MyView extends React.Component {

    static propTypes = {
        sound: PropTypes.bool,
        play: PropTypes.bool,
        fullScreen:PropTypes.bool
    };

    onVideoLoad = (event) => {
        if (this.props.onVideoLoad){
            this.props.onVideoLoad(event.nativeEvent);
        }
    }

    onVideoError = (event) => {
        if (this.props.onVideoError){
            this.props.onVideoError(event.nativeEvent);
        }
    }

    render() {
        return(
            <RCTMyView
                {...this.props}
                onVideoLoad = {this.onVideoLoad}
                onVideoError = {this.onVideoError}
            >
            </RCTMyView>
        );
    }
}

var RCTMyView = requireNativeComponent('RCTMyView', MyView);