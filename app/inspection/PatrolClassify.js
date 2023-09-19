import React, {Component} from 'react';
import {StyleSheet, View, Text, FlatList, Dimensions} from "react-native";
import SegmentedControlTab from "react-native-segmented-control-tab";
import I18n from 'react-native-i18n';
import PropTypes from 'prop-types';
import PatrolEditor from "./PatrolEditor";
import store from "../../mobx/Store";
import EventBus from "../common/EventBus";
import PatrolFragment from "./PatrolFragment";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import TouchableActive from "../touchables/TouchableActive";

const {width} = Dimensions.get('screen');
export default class PatrolClassify extends Component {
    static propTypes = {
        data: PropTypes.array,
        categoryData: PropTypes.array
    };

    state = {
        enumSelector: store.enumSelector,
        patrolSelector: store.patrolSelector,
        selectedIndex: 0,
        tabTitles: [
            I18n.t('Patrol all'),
            I18n.t('Patrol missing'),
            I18n.t('Patrol ignore')
        ]
    };

    getData(){
        let data = JSON.parse(JSON.stringify(this.props.data));
        let {selectedIndex, enumSelector, tabTitles} = this.state;

        let unGradeSet = [], ignoreSet = [];
        data.forEach((category) => {
            let unGrades = [], ignores = [];
            category.groups.map((item) => {
                (item.groupId === category.id) ? (item.groupName = '') : null;

                let unGrade = item.items.filter(p => (p.scoreType === enumSelector.scoreType.FAIL) ||
                    (p.scoreType === enumSelector.scoreType.UNQUALIFIED));
                if (unGrade.length > 0){
                    let itemClone = JSON.parse(JSON.stringify(item));
                    itemClone.items = unGrade;
                    unGrades.push(itemClone);
                }

                let ignore = item.items.filter(p => (p.scoreType === enumSelector.scoreType.IGNORE)
                    || ((p.type === 0) && (p.scoreType === enumSelector.scoreType.SCORELESS)));
                if (ignore.length > 0){
                    let itemClone = JSON.parse(JSON.stringify(item));
                    itemClone.items = ignore;
                    ignores.push(itemClone);
                }
            });

            (unGrades.length > 0) && unGradeSet.push({
                id: category.id,
                name: category.name,
                type: category.type,
                unfold: category.unfold,
                groups: unGrades
            });

            (ignores.length > 0) && ignoreSet.push({
                id: category.id,
                name: category.name,
                type: category.type,
                unfold: category.unfold,
                groups: ignores
            });
        });

        tabTitles[0] = I18n.t('Patrol all',{key: data.reduce((p,e) => p+ e.groups.reduce((k,v) => k + v.items.length, 0), 0)});
        tabTitles[1] = I18n.t('Patrol missing',{key: unGradeSet.reduce((p,e) => p+ e.groups.reduce((k,v) => k + v.items.length, 0), 0)});
        tabTitles[2] = I18n.t('Patrol ignore',{key: ignoreSet.reduce((p,e) => p+ e.groups.reduce((k,v) => k + v.items.length, 0), 0)});
        (selectedIndex === 1) && (data = unGradeSet);
        (selectedIndex === 2) && (data = ignoreSet);

        // sort by type
        data.sort((a,b) => a.type - b.type);

        return {tabTitles,data};
    }

    onCategory(id){
        let {patrolSelector} = this.state;
        let category = patrolSelector.data.find(p => p.id === id);
        category.unfold = !category.unfold;
        this.setState({patrolSelector}, () =>{
            EventBus.updateBasePatrol();
        });
    }

    onGroup(item){
        let {patrolSelector} = this.state;
        let category = patrolSelector.data.find(p => p.id === item.parentId);
        let group = category.groups.find(p => p.groupId === item.groupId);
        group.unfold = !group.unfold;

        this.setState({patrolSelector}, () =>{
            EventBus.updateBasePatrol();
        });
    }

    render() {
        let {selectedIndex, patrolSelector} =  this.state;

        return (
            <View style={styles.container}>
                <Text style={styles.title}>{I18n.t('Patrol project')}</Text>

                <BoxShadow setting={{width:width-52, height:32, color:"#000000",
                    border:2, radius:10, opacity:0.1, x:0, y:1,style:{marginLeft:16}}}>
                    <View style={styles.segment}>
                        <SegmentedControlTab
                            values={this.getData().tabTitles}
                            selectedIndex={selectedIndex}
                            onTabPress={(selectedIndex)=>{
                                EventBus.closePopupPatrol();
                                this.setState({selectedIndex})
                            }}
                            borderRadius={10}
                            firstTabStyle={{borderRightWidth:1}}
                            tabsContainerStyle={{height:32}}
                            tabStyle={styles.tabInactive}
                            tabTextStyle={styles.textInactive}
                            activeTabBadgeStyle={{width:100}}
                            activeTabStyle={[styles.tabActive]}/>
                    </View>
                </BoxShadow>

                <PatrolFragment data={this.getData().data} dataType={patrolSelector.dataType}
                                onCategory={(id) => this.onCategory(id)}
                                onGroup={(item) => this.onGroup(item)}
                                categoryData={this.props.categoryData}
                                inspectSettings={this.props.inspectSettings}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        marginTop:16,
        marginBottom: 10
    },
    title:{
        fontSize: 16,
        marginBottom: 16,
        marginLeft:10,
        color:'#64686D'
    },
    segment:{
        width:width-52,
        height: 32,
        borderRadius:10,
        backgroundColor:'#fff'
    },
    tabInactive:{
        backgroundColor:'#fff',
        borderColor: '#fff',
        borderRadius:10,
        width:(width-60)/3,
    },
    textInactive:{
        color:'#85898E'
    },
    tabActive:{
        backgroundColor:'#006AB7',
        borderRadius: 10,
        borderWidth:0,
        height:33,
        width:(width-60)/3,
    }
});
