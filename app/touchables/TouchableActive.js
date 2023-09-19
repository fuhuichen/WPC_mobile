import React, {Component} from 'react';
import {StyleSheet, Dimensions, TouchableOpacity, DeviceEventEmitter} from "react-native";
import PropTypes from 'prop-types';
import EventBus from "../common/EventBus";
import store from "../../mobx/Store";

const {width} = Dimensions.get('screen');
export default class TouchableActive extends Component {
    state = {
        storeSelector: store.storeSelector,
        patrolSelector: store.patrolSelector,
        eventSelector: store.eventSelector
    };

    static propTypes = {
        clearCollection: PropTypes.boolean
    };

    static defaultProps = {
        clearCollection: false
    };

    onClose(){
        EventBus.closeModalAll();

        let {clearCollection} = this.props;
        let {storeSelector, patrolSelector, eventSelector} = this.state;

        if (storeSelector != null){
            clearCollection && (storeSelector.collection = null);
            storeSelector.visible = false;
        }

        if (eventSelector != null){
            clearCollection && (eventSelector.collection = null);
            eventSelector.visible = false;
        }

        if (patrolSelector != null){
            patrolSelector.visible = false;
            clearCollection && (patrolSelector.collection = null);
            patrolSelector.interactive = false;
        }

        this.setState({storeSelector, patrolSelector, eventSelector}, ()=>{
            EventBus.updateBasePatrol(false);
            EventBus.updateBaseStore();
        });
    }

    render() {
        return (
            <TouchableOpacity style={[styles.container,{...this.props.style}]}
                              activeOpacity={1}
                              onPress={()=>{this.onClose()}}>
                {this.props.children}
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});
