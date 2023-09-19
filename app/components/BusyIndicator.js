import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    DeviceEventEmitter
} from 'react-native';

import { Dialog } from 'react-native-simple-dialogs';
import {EMITTER_SUBMIT_WAIT} from "../common/Constant";
import RouteMgr from "../notification/RouteMgr";
import I18n from 'react-native-i18n';

export default class BusyIndicator extends Component {
    static propTypes = {
        title:PropTypes.string,
        mode:PropTypes.boolean,
        width: PropTypes.number,
        fontSize: PropTypes.number
    };

    static defaultProps = {
        width: 100,
        fontSize: 14
    };

    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            title: null
        };
    }

    componentWillMount(){
        this.notifyEmitter = DeviceEventEmitter.addListener(EMITTER_SUBMIT_WAIT,
            ()=>{
                this.setState({title:I18n.t('Jumping')});
            });
    }

    componentWillUnmount(){
        this.notifyEmitter && this.notifyEmitter.remove();
    }

    open(){
        this.setState({visible:true},()=>{
            (this.props.mode == null) && RouteMgr.setIndicator(true);
        })
    }

    openEx(title){
        this.setState({visible:true,title:title},()=>{
            (this.props.mode == null) && RouteMgr.setIndicator(true);
        })
    }

    close(){
        this.setState({visible:false,title:null},()=>{
            (this.props.mode == null) && RouteMgr.setIndicator(false);
        })
    }

    render() {
        let {width, fontSize} = this.props;

        return (
            <Dialog visible={this.state.visible}
                    overlayStyle={styles.overlay}
                    dialogStyle={[styles.dialog,{width}]}>
                <View style={[styles.content,{width}]}>
                    <ActivityIndicator animating={true} color='#ffffff' size="large"/>
                    <Text style={[styles.title, {fontSize}]}>
                        {this.state.title != null ? this.state.title : this.props.title}
                    </Text>
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
        height:90,
        alignSelf:'center',
        borderRadius:8
    },
    content:{
        height:90,
        alignSelf:'center'
    },
    title:{
        fontSize:14,
        marginTop:5,
        alignSelf:'center',
        color:'#ffffff'
    }
});
