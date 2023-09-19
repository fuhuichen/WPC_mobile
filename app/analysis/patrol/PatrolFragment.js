import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, ScrollView, DeviceEventEmitter} from "react-native";
import store from "../../../mobx/Store";
import FilterCore from "../common/FilterCore";
import FilterHeader from "../common/FilterHeader";
import FilterRange from "../common/FilterRange";
import TouchableInactive from "../../touchables/TouchableInactive";
import EventBus from "../../common/EventBus";
import TouchableActive from "../../touchables/TouchableActive";
import PatrolOverviewBlock from "./PatrolOverviewBlock";
import PatrolScoreBlock from "./PatrolScoreBlock";
import PatrolRateBlock from "./PatrolRateBlock";
import SlotView from "../../customization/SlotView";
import {getInspectRuleSetting} from "../../common/FetchRequest";
import {Actions} from "react-native-router-flux";

const {width} = Dimensions.get('screen');
export default class PatrolFragment extends Component {
    state = {
        enumSelector: store.enumSelector,
        analysisSelector: store.analysisSelector,
        filterSelector: store.filterSelector,
        analysisType: store.enumSelector.analysisType.PATROL,
        showRate: false,
        standardScore: 0,
        content: ''
    };

    componentDidMount(){
        let {analysisSelector, analysisType, filterSelector} = this.state;
        let filter = FilterCore.getFilter(analysisType, filterSelector);
        analysisSelector.patrolRanges = FilterCore.initRange(analysisSelector.patrolRanges);

        this.setState({analysisSelector, content: filter.text}, () => {
            if (((filter.storeId != null) && (filter.storeId.length > 0)) ||
                ((filter.userId != null) && (filter.userId.length > 0))){
                this.fetchData();
                this.getRuleSetting();
            }
        });

        this.emitter = DeviceEventEmitter.addListener('OnAnalysisFilter', () => {
            let filter = FilterCore.getFilter(analysisType, filterSelector);
            this.setState({content: filter.text});

            if (((filter.storeId != null) && (filter.storeId.length > 0)) ||
                ((filter.userId != null) && (filter.userId.length > 0))){
                this.fetchData();
                this.getRuleSetting();
            }
        });
    }

    componentWillUnmount(){
        this.emitter && this.emitter.remove();
    }

    getRuleSetting(){
        try {
            let {enumSelector, analysisType, filterSelector, standardScore} = this.state;
            let filter = FilterCore.getFilter(analysisType, filterSelector);
            this.setState({showRate: false}, async () => {
                let {showRate} = this.state;
                let result = await getInspectRuleSetting(filter.inspect[0].id);

                if (result.errCode === enumSelector.errorType.SUCCESS){
                    let standardItem = result.data.find(p => p.name === 'standardScore');

                    if ((standardItem != null) && (standardItem.value != null)){
                        showRate = true;
                        standardScore = standardItem.value;
                    }
                }

                this.setState({showRate, standardScore}, () => {
                    showRate && (this.rateBlock && this.rateBlock.fetchData());
                })
            });
        }catch (e) {
        }
    }

    fetchData(){
        this.overviewBlock && this.overviewBlock.fetchData();
        this.scoreBlock && this.scoreBlock.fetchData();
    }

    onFilter(){
        let {analysisType} = this.state;
        Actions.push('analysisFilter', {type: analysisType+1});
    }

    onDate(ranges){
        let {analysisSelector, showRate, analysisType, filterSelector} = this.state;
        analysisSelector.patrolRanges = ranges;

        this.setState({analysisSelector}, () => {
            let filter = FilterCore.getFilter(analysisType, filterSelector);
            if (((filter.storeId != null) && (filter.storeId.length > 0)) ||
                ((filter.userId != null) && (filter.userId.length > 0))){
                this.fetchData();
                showRate && (this.rateBlock && this.rateBlock.fetchData());
            }
        });
    }

    onRange(type){
        let {analysisSelector, showRate, analysisType, filterSelector} = this.state;
        analysisSelector.patrolRangeType = type;

        this.setState({analysisSelector}, () => {
            let filter = FilterCore.getFilter(analysisType, filterSelector);
            if (((filter.storeId != null) && (filter.storeId.length > 0)) ||
                ((filter.userId != null) && (filter.userId.length > 0))){
                this.fetchData();
                showRate && (this.rateBlock && this.rateBlock.fetchData());
            }
        });
    }

    render() {
        let {analysisSelector, content, showRate, standardScore} = this.state;

        return (
            <View style={styles.container}>
                <FilterHeader content={content}
                             onFilter={() => this.onFilter()}/>
                <FilterRange rangeType={analysisSelector.patrolRangeType}
                             ranges={analysisSelector.patrolRanges}
                             onBackward={(ranges) => {this.onDate(ranges)}}
                             onForward={(ranges) => {this.onDate(ranges)}}
                             onRange={(type) => {this.onRange(type)}}/>

                <TouchableInactive>
                    <ScrollView showsVerticalScrollIndicator={false} style={{marginTop:10}}
                                onScroll={(evt) => {EventBus.closeOptionSelector()}}>
                        <TouchableActive>
                            <PatrolOverviewBlock ref={c => this.overviewBlock = c} />
                            <PatrolScoreBlock ref={c => this.scoreBlock = c}/>
                            {showRate && <PatrolRateBlock ref={c => this.rateBlock = c} standardScore={standardScore}/>}
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
