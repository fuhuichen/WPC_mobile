import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, DeviceEventEmitter, Platform, ScrollView} from "react-native";
import I18n from "react-native-i18n";
import {Actions} from "react-native-router-flux";
import EventBus from "../common/EventBus";
import Navigation from "../element/Navigation";
import PatrolGroup from "./PatrolGroup";
import store from "../../mobx/Store";
import TouchableActive from "../touchables/TouchableActive";
import {inject, observer} from "mobx-react";
import BasePatrol from "../customization/BasePatrol";
import {ColorStyles} from "../common/ColorStyles";
import AndroidBacker from "../components/AndroidBacker";
import ViewIndicator from "../customization/ViewIndicator";

@inject('store')
@observer
export default class PatrolUnfinished extends BasePatrol {
    state = {
        viewType: store.enumSelector.viewType.LOADING,
        patrolSelector: store.patrolSelector,
        enumSelector: store.enumSelector,
        screenSelector: store.screenSelector,
        data: []
    };

    componentDidMount() {
        setTimeout(async () => {
            let {data, patrolSelector, enumSelector} = this.state;
            patrolSelector.data.forEach((item) => {
                let items = [];
                item.groups.map(p => items.push(...p.items));
                items = items.filter(p => (p.type === 0) && (p.scoreType === store.enumSelector.scoreType.SCORELESS));

                (items.length > 0) && data.push({id: item.id, groupName: item.name, items, expansion: true});
            });

            patrolSelector.unfinished = data;
            this.setState({data, patrolSelector, viewType: enumSelector.viewType.SUCCESS});
        }, 100);
    }

    onBack(){
        let {patrolSelector, screenSelector} = this.state;
        patrolSelector.router = screenSelector.patrolType.PATROL;

        this.setState({patrolSelector}, () => {
            EventBus.updatePatrolData();
            EventBus.closePopupPatrol();
            Actions.pop();
        });
    }

    onGroup(item){
        let {data, patrolSelector} = this.state;
        let group = data.find(p => p.id === item.id);
        group.expansion = !item.expansion;

        if (patrolSelector.visible && (patrolSelector.collection != null)
            && (patrolSelector.collection.rootId === item.id)){
            patrolSelector.visible = false;
        }

        this.setState({data, patrolSelector}, () => {
            EventBus.updateBasePatrol();
        });
    }

    render() {
        let {data, viewType, enumSelector} = this.state;
        return (
            <TouchableActive style={styles.container}>
                <Navigation
                    onLeftButtonPress={()=>{this.onBack()}}
                    title={I18n.t('Patrol unhandled')}
                    onRightButtonPress={()=>{EventBus.closePopupPatrol()}}
                />
                {(viewType !== enumSelector.viewType.SUCCESS) && <ViewIndicator viewType={viewType}
                                                                                containerStyle={{justifyContent:'center'}}/>}
                {(viewType === enumSelector.viewType.SUCCESS) && <PatrolGroup data={data} onGroup={(item) => this.onGroup(item)}/>}
                <AndroidBacker onPress={() => {
                    this.onBack();
                    return true
                }}/>
            </TouchableActive>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:ColorStyles.STATUS_BACKGROUND_COLOR
    }
});
