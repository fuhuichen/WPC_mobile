import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, DeviceEventEmitter} from "react-native";
import store from "../../../mobx/Store";
import FilterCore from "../common/FilterCore";
import FilterHeader from "../common/FilterHeader";
import FilterRange from "../common/FilterRange";
import RecordPageBlock from "./RecordPageBlock";
import {Actions} from "react-native-router-flux";

const {width} = Dimensions.get('screen');
export default class RecordFragment extends Component {
    state = {
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector,
        filterSelector: store.filterSelector,
        analysisType: store.enumSelector.analysisType.RECORD,
        content: ''
    };

    componentDidMount(){
        let {analysisSelector, analysisType, filterSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);

        analysisSelector.recordRanges = FilterCore.initRange(analysisSelector.recordRanges);
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

        if (filter.userId.length > 0){
            this.recordBlock && this.recordBlock.fetchData(0, true);
        }
    }

    onFilter(){
        let {analysisType} = this.state;
        Actions.push('analysisFilter', {type: analysisType+1});
    }

    onDate(ranges){
        let {analysisSelector} = this.state;
        analysisSelector.recordRanges = ranges;
        this.setState({analysisSelector}, () => {
            this.fetchData();
        });
    }

    onRange(type){
        let {analysisSelector} = this.state;
        analysisSelector.recordRangeType = type;
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
                <FilterRange rangeType={analysisSelector.recordRangeType}
                             ranges={analysisSelector.recordRanges}
                             onBackward={(ranges) => {this.onDate(ranges)}}
                             onForward={(ranges) => {this.onDate(ranges)}}
                             onRange={(type) => {this.onRange(type)}}/>

                <RecordPageBlock ref={c => this.recordBlock = c} />
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
