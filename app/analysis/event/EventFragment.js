import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, ScrollView, DeviceEventEmitter} from "react-native";
import store from "../../../mobx/Store";
import FilterCore from "../common/FilterCore";
import FilterHeader from "../common/FilterHeader";
import FilterRange from "../common/FilterRange";
import EventRateBlock from "./EventRateBlock";
import EventOverviewBlock from "./EventOverviewBlock";
import EventPatrolBlock from "./EventPatrolBlock";
import EventBus from "../../common/EventBus";
import TouchableActive from "../../touchables/TouchableActive";
import TouchableInactive from "../../touchables/TouchableInactive";
import SlotView from "../../customization/SlotView";
import {Actions} from "react-native-router-flux";

const {width} = Dimensions.get('screen');
export default class EventFragment extends Component {
    state = {
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector,
        filterSelector: store.filterSelector,
        analysisType: store.enumSelector.analysisType.EVENT,
        content: ''
    };

    componentDidMount(){
        let {analysisSelector, analysisType, filterSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);
        analysisSelector.eventRanges = FilterCore.initRange(analysisSelector.eventRanges);

        this.setState({analysisSelector, content: filter.text}, () => {
            this.fetchData();
        });

        this.emitter = DeviceEventEmitter.addListener('OnAnalysisFilter', () => {
            this.setState({content: FilterCore.getFilter(analysisType, filterSelector).text});

            this.fetchData();
        });
    }

    componentWillUnmount(){
        this.emitter && this.emitter.remove();
    }

    fetchData(){
        let {analysisType, filterSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        if (((filter.storeId != null) && (filter.storeId.length > 0) ||
            ((filter.userId != null) && (filter.userId.length > 0)))){
            this.overviewBlock && this.overviewBlock.fetchData();
            this.rateBlock && this.rateBlock.fetchData();
            this.patrolBlock && this.patrolBlock.fetchData();
        }
    }

    onFilter(){
        let {analysisType} = this.state;
        Actions.push('analysisFilter', {type: analysisType+1});
    }

    onDate(ranges){
        let {analysisSelector} = this.state;
        analysisSelector.eventRanges = ranges;
        this.setState({analysisSelector}, () => {
            this.fetchData();
        });
    }

    onRange(type){
        let {analysisSelector} = this.state;
        analysisSelector.eventRangeType = type;
        this.setState({analysisSelector}, () => {
            this.fetchData();
        });
    }

    render() {
        let {analysisSelector, content} = this.state;

        return (
            <View style={styles.container}>
                <FilterHeader content={content}
                              onFilter={() => this.onFilter()}/>
                <FilterRange rangeType={analysisSelector.eventRangeType}
                             ranges={analysisSelector.eventRanges}
                             onBackward={(ranges) => {this.onDate(ranges)}}
                             onForward={(ranges) => {this.onDate(ranges)}}
                             onRange={(type) => {this.onRange(type)}}/>

                <TouchableInactive>
                    <ScrollView showsVerticalScrollIndicator={false} style={{marginTop:10}}
                                onScroll={(evt) => {EventBus.closeOptionSelector()}}>
                        <TouchableActive>
                            <EventOverviewBlock ref={c => this.overviewBlock = c} />
                            <EventRateBlock ref={c => this.rateBlock = c} />
                            <EventPatrolBlock ref={c => this.patrolBlock = c} />
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
