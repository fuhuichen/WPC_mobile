import React, {Component} from 'react';
import * as lib from '../common/PositionLib';
import {
    BackHandler,
    Platform,
    DeviceEventEmitter
} from 'react-native';
import {SlideModal} from "beeshell";

export default class SlideModalEx extends Component {

    constructor(props) {
        super(props);
        this.state = {
            offsetX:this.props.offsetX == null ? 0: this.props.offsetX,
            offsetY:this.props.offsetY == null ? 0: this.props.offsetY,
        }
        this.modalFlag = false;
    }

    componentWillUnmount(){
        this.modal && this.modal.close();
    }

    open() {
        if (!this.modalFlag){
            this.modal && this.modal.open();

        }
        else {
            this.modal && this.modal.close();
        }
    };

    openEx(height) {
        this.setState({
            offsetY:height
        },()=>{
            this.open();
        });
    };
   
    openExc(width,height) {
        this.setState({
            offsetY:height,
            offsetX:width,
        },()=>{
            this.open();
        });
    };

    close() {
        this.modal && this.modal.close();
    }

    onBackAndroid = () => {
        this.close();
        return true;
    }

    render() {
        let opacity =  this.props.opacity == null ? 0.3: this.props.opacity;
        let widthStyle = this.props.width !== undefined ? this.props.width : 100;
        let direction = this.props.direction == null ? 'down': this.props.direction;

        return (
            <SlideModal ref={(c) => { this.modal = c; }}
                        onOpened={() => {
                            this.modalFlag = true;
                            DeviceEventEmitter.emit('modalStatus',true)
                            if (Platform.OS === 'android') {
                                BackHandler.addEventListener('hardwareBackPress', this.onBackAndroid);
                            }
                        }}
                        onClosed={() =>{
                            this.props.onClosed && this.props.onClosed();

                            this.modalFlag = false;
                            DeviceEventEmitter.emit('modalStatus',false)
                            if (Platform.OS === 'android') {
                                BackHandler.removeEventListener('hardwareBackPress', this.onBackAndroid);
                            }
                        }}
                        width={widthStyle}
                        cancelable={true}
                        children={this.props.children}
                        offsetX={this.state.offsetX}
                        offsetY={this.state.offsetY+lib.statusBarHeight()}
                        opacity={opacity}
                        direction={direction} >
            </SlideModal>
        )
    }
}

