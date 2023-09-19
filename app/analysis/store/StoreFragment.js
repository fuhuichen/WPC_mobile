import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, ScrollView, DeviceEventEmitter} from "react-native";
import PropTypes from 'prop-types';
import {Actions} from "react-native-router-flux";
import FilterHeader from "../common/FilterHeader";
import store from "../../../mobx/Store";
import FilterRange from "../common/FilterRange";
import FilterCore from "../common/FilterCore";
import StorePatrolBlock from "./StorePatrolBlock";
import StoreEventBlock from "./StoreEventBlock";
import SlotView from "../../customization/SlotView";
import EventBus from "../../common/EventBus";
import TouchableInactive from "../../touchables/TouchableInactive";
import TouchableActive from "../../touchables/TouchableActive";
import StoreOverviewBlock from "./StoreOverviewBlock";

const {width} = Dimensions.get('screen');
export default class StoreFragment extends Component {
    state = {
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector,
        filterSelector: store.filterSelector,
        analysisType: store.enumSelector.analysisType.STORE,
        content: ''
    };

    static propTypes = {
        onRefresh: PropTypes.func
    };

    componentDidMount() {
        let {analysisSelector, analysisType, filterSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);
        analysisSelector.storeRanges = FilterCore.initRange(analysisSelector.storeRanges);

        this.setState({analysisSelector, content: filter.text}, () => {
            this.fetchData();
        });

        this.emitter = DeviceEventEmitter.addListener('OnAnalysisFilter', () => {
            this.setState({content: FilterCore.getFilter(analysisType, filterSelector).text});

            this.overviewBlock && this.overviewBlock.setProperty();
            this.fetchData();
        });
    }

    componentWillUnmount() {
        this.emitter && this.emitter.remove();
    }

    fetchData(){
        let {analysisType, filterSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);
        if (filter.storeId.length > 0) {
            this.overviewBlock && this.overviewBlock.fetchData();
            this.patrolBlock && this.patrolBlock.fetchData();
            this.eventBlock && this.eventBlock.fetchData();
        }
    }

    onFilter(){
        let {analysisType} = this.state;
        Actions.push('analysisFilter', {type:analysisType+1});
    }

    onDate(ranges){
        let {analysisSelector} = this.state;
        analysisSelector.storeRanges = ranges;
        this.setState({analysisSelector}, () => {
            this.fetchData();
        });
    }

    onRange(type){
        let {analysisSelector} = this.state;
        analysisSelector.storeRangeType = type;
        this.setState({analysisSelector}, () => {
            this.fetchData();
        });
    }

    render() {
        let {analysisSelector, content} = this.state;

        return (
            <View style={styles.container}>
                <FilterHeader content={content}
                             onFilter={() => this.onFilter()} />
                <FilterRange rangeType={analysisSelector.storeRangeType}
                             ranges={analysisSelector.storeRanges}
                             onBackward={(ranges) => {this.onDate(ranges)}}
                             onForward={(ranges) => {this.onDate(ranges)}}
                             onRange={(type) => {this.onRange(type)}}/>

                <TouchableInactive>
                    <ScrollView showsVerticalScrollIndicator={false} style={{marginTop:10}}
                                keyboardShouldPersistTaps={'handled'}
                                onScroll={(evt) => {EventBus.closeOptionSelector()}}>
                        <TouchableActive>
                            <StoreOverviewBlock ref={c => this.overviewBlock = c} />
                            <StorePatrolBlock ref={c => this.patrolBlock = c} />
                            <StoreEventBlock ref={c => this.eventBlock = c}
                                onRefresh={(actionType) => this.props.onRefresh(actionType)}/>
                            <SlotView containerStyle={{height:20}}/>
                        </TouchableActive>
                    </ScrollView>
                </TouchableInactive>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 16
    }
});
