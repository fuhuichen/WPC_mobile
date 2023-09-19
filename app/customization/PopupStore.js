import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, DeviceEventEmitter,TouchableOpacity} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import {CLOSE_POPUP_STORE} from "../common/Constant";
import AccessHelper from "../common/AccessHelper";
import store from "../../mobx/Store";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import ModalPatrol from "./ModalPatrol";
import TouchableInactive from "../touchables/TouchableInactive";
import PatrolPrompt from "../components/inspect/PatrolPrompt";
import PatrolParser from "../components/inspect/PatrolParser";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import SignIn from "../signin/Index";

const {width} = Dimensions.get('screen');
@inject('store')
@observer
export default class PopupStore extends Component {
    state = {
        storeSelector: store.storeSelector
    };

    constructor(props,context) {
        super(props, context);

        let {storeSelector} = this.state;
        
        if(!store.userSelector.isMysteryModeOn && AccessHelper.enableLocalInspect() == false) {
            this.actions = [
                {
                    label: I18n.t('Detail'),
                    router: () => {
                        Actions.push('storeDetail', {selector: storeSelector});
                    },
                    viewStyle: [styles.viewStyle,{marginRight:8}],
                    textStyle: styles.textStyle
                }
            ];    
        } else {
            this.actions = [
                {
                    label: I18n.t('Detail'),
                    router: () => {
                        Actions.push('storeDetail', {selector: storeSelector});
                    },
                    viewStyle: [styles.viewStyle,{marginRight:8}],
                    textStyle: styles.textStyle
                },
                {
                    label: I18n.t('Onsite shortening'),
                    router: () => {this.onPatrol()},
                    viewStyle: [styles.viewStyle,{backgroundColor:'#02528B'}],
                    textStyle: [styles.textStyle,{color:'#FFFFFF'}]
                }
            ];
        }
    }

    componentDidMount() {
        this.popEmitter = DeviceEventEmitter.addListener(CLOSE_POPUP_STORE,
            () => {
            let {storeSelector} = this.state;
            storeSelector.visible = false;
            this.setState({storeSelector});
        });
    }

    componentWillUnmount() {
        this.popEmitter && this.popEmitter.remove();
    }

    doActions(item,index){
        this.actions && this.actions[index].router();
    }

    onPatrol(){
        if(!store.userSelector.isMysteryModeOn && !AccessHelper.enableLocalInspect()) {
            DeviceEventEmitter.emit('Toast', I18n.t('Service permission'));
            return;
        }

        if(store.storeSelector.collection && store.storeSelector.collection.status != 20 
            && store.storeSelector.collection.status != 21 && store.storeSelector.collection.status != 60) {
            DeviceEventEmitter.emit('Toast', I18n.t('Service overdue'));
            return;
        }

        if ((this.prompt == null) || (this.modalPatrol == null)){
            return;
        }

        PatrolParser.isExist() ? this.prompt.open() : this.modalPatrol.open();
    }

    renderOperators(){
        return (
            <View style={{flexDirection:'row',justifyContent:'flex-end'}}>
                {
                    this.actions.map((item,index) =>{
                        return <TouchableOpacity activeOpacity={0.6} onPress={() => this.doActions(item,index)}>
                            <View style={item.viewStyle}>
                                <Text style={item.textStyle}>{item.label}</Text>
                            </View>
                        </TouchableOpacity>
                    })
                }
            </View>
        )
    }

    render() {
        let {storeSelector} = this.state;
        let {visible, collection} = storeSelector;

        let component = null;
        if (visible) {
            component = <TouchableInactive style={styles.container}>
                <BoxShadow setting={{width:width-40, height:64, color:"#000000",
                    border:1, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:0}}}>
                    <View style={styles.card}>
                        <View style={{flex:1,justifyContent: 'center',marginRight:20}}>
                            <Text style={{color:'#006AB7',fontSize:14}} numberOfLines={2}>
                                {collection.name}
                            </Text>
                        </View>

                        {this.renderOperators()}

                        <ModalPatrol ref={c => this.modalPatrol = c} storeId={collection.storeId} mode={1}
                                     onSign={(data) => {this.modalSign && this.modalSign.open(data)}}/>
                        <SignIn ref={c => this.modalSign = c}/>
                        <PatrolPrompt ref={c => this.prompt = c} title={I18n.t('Quitting confirm')}
                                       cancel={() => {this.modalPatrol && this.modalPatrol.open()}}/>
                    </View>
                </BoxShadow>
            </TouchableInactive>
        }

        return component;
    }
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        left:20,
        alignItems:'center'
    },
    card:{
        width: width-40,
        height: 64,
        padding: 16,
        backgroundColor: '#fff',
        flexDirection:'row',
        justifyContent:'flex-start',
        alignItems:'center',
        borderRadius:10
    },
    viewStyle:{
        borderWidth: 1,
        borderColor: '#02528B',
        borderRadius: 10,
        paddingLeft:12,
        paddingRight:12,
        height:36
    },
    textStyle:{
        fontSize:16,
        color:'#02528B',
        height:36,
        lineHeight: 36,
        textAlign: 'center',
        textAlignVertical: 'center',
        marginTop:-2
    }
});
