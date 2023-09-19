import { observable, action } from 'mobx';
import store from "./Store";

class AnalysisSelector {
    @observable storeRangeType = store.enumSelector.rangeType.QUARTERLY;
    @observable storeRanges = [];

    @observable patrolRangeType = store.enumSelector.rangeType.QUARTERLY;
    @observable patrolRanges = [];

    @observable eventRangeType = store.enumSelector.rangeType.QUARTERLY;
    @observable eventRanges = [];

    @observable recordRangeType = store.enumSelector.rangeType.QUARTERLY;
    @observable recordRanges = [];

    @observable placeHolder = '--';

    @observable unInitRanges(){
        this.storeRangeType = store.enumSelector.rangeType.QUARTERLY;
        this.storeRanges = [];

        this.patrolRangeType = store.enumSelector.rangeType.QUARTERLY;
        this.patrolRanges = [];

        this.eventRangeType = store.enumSelector.rangeType.QUARTERLY;
        this.eventRanges = [];

        this.recordRangeType = store.enumSelector.rangeType.QUARTERLY;
        this.recordRanges = [];
    }
}

export default new AnalysisSelector()
