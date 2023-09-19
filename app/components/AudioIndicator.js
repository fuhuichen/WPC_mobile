import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
    StyleSheet,
    View,
    Text,
    DeviceEventEmitter,
} from 'react-native';

import { Dialog } from 'react-native-simple-dialogs';
import Spinner from "react-native-spinkit";
import dismissKeyboard from 'react-native-dismiss-keyboard';
import {EMITTER_MODAL_CLOSE} from "../common/Constant";

export default class AudioIndicator extends Component {
    static propTypes = {
        title:PropTypes.string,
    }

    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            currentCount:0,
        };
    }

    componentWillMount(){
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_MODAL_CLOSE,
            ()=>{
                this.close();
            });
    }

    componentWillUnmount(){
        this.close();
        this.notifyEmitter && this.notifyEmitter.remove();
    }

    open(){
        dismissKeyboard();
        this.setState({visible:true,currentCount:0})
        this.timer = setInterval(() => {
            let currentCount = this.state.currentCount;
            currentCount += 1;
            this.setState({currentCount: currentCount});
        }, 1000);
    }

    close(){
        this.timer && clearInterval(this.timer);
        this.setState({visible:false})
    }

    render() {
        let remainTime =  parseInt(31 - this.state.currentCount);
        if  (remainTime <= 0 ) {
            remainTime = 0;
        }
        let Visible = remainTime > 10 ? true: false;
        let titleCount = null;
        if ( remainTime <= 10 ){ titleCount =(
            <Text style={styles.titleCount} nub>{remainTime}</Text>
        )
        }
        return (
            <Dialog visible={this.state.visible}
                    overlayStyle={styles.overlay}
                    dialogStyle={styles.dialog}>
                <View style={styles.content}>
                    <Spinner style={{marginTop:-30}} isVisible={Visible} size={80} type={'Wave'} color={'#FFFFFF'}/>
                    {titleCount}
                    <Text style={styles.title} nub>{this.props.title}</Text>
                </View>
            </Dialog>
        );
    }
}

var styles = StyleSheet.create({
    overlay:{
        backgroundColor:'transparent'
    },
    dialog: {
        backgroundColor:'#24293d',
        opacity:0.75,
        width:130,
        height:130,
        alignSelf:'center',
        borderRadius:8
    },
    content:{
        width:130,
        height:130,
        alignSelf:'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title:{
        fontSize:14,
        marginTop:8,
        alignSelf:'center',
        color:'#ffffff'
    },
    titleCount:{
        marginTop:-40,
        fontSize:45,
        alignSelf:'center',
        color:'#ffffff'
    }
});