import React from 'react';
import store from "../../../mobx/Store";
import moment from 'moment';

export default class FilterCore {
    static initRange(ranges) {
        return (ranges.length === 0) ? [
            {
                type: store.enumSelector.rangeType.WEEK,
                beginTs: moment().startOf('week').unix()*1000,
                endTs: moment().endOf('week').unix()*1000,
                maxTs: moment().endOf('week').unix()*1000,
                unitOfTime: 'weeks',
                format: 'MM/DD'
            },
            {
                type: store.enumSelector.rangeType.MONTH,
                beginTs: moment().startOf('month').unix()*1000,
                endTs: moment().endOf('month').unix()*1000,
                maxTs: moment().endOf('month').unix()*1000,
                unitOfTime: 'months',
                format: 'YYYY/MM'
            },
            {
                type: store.enumSelector.rangeType.QUARTERLY,
                beginTs: moment().startOf('quarter').unix()*1000,
                endTs: moment().endOf('quarter').unix()*1000,
                maxTs: moment().endOf('quarter').unix()*1000,
                unitOfTime: 'quarters',
                format: 'YYYY/MM'
            },
            {
                type: store.enumSelector.rangeType.YEAR,
                beginTs: moment().startOf('year').unix()*1000,
                endTs: moment().endOf('year').unix()*1000,
                maxTs: moment().endOf('year').unix()*1000,
                unitOfTime: 'years',
                format: 'YYYY'
            }
        ] : ranges;
    }

    static onBackward(type, ranges){
        let range = ranges.find(p => p.type === type);
        range.beginTs = moment(range.beginTs).subtract(1, range.unitOfTime).unix()*1000;
        range.endTs = moment(range.endTs).subtract(1, range.unitOfTime).unix()*1000;

        return ranges;
    }

    static onForward(type, ranges){
        let range = ranges.find(p => p.type === type);
        range.beginTs = moment(range.beginTs).add(1, range.unitOfTime).unix()*1000;
        range.endTs = moment(range.endTs).add(1, range.unitOfTime).endOf(range.unitOfTime).unix()*1000;
        return ranges;
    }

    static getRange(type, ranges){
        let range = ranges.find(p => p.type === type);
        return {beginTs: range.beginTs, endTs: range.endTs};
    }

    static getFilter(type, selector){
        return selector.analysis.find(p => p.type === (type+1)).data.result;
    }

    static isMysteryMode(type, selector){
        return selector.analysis.find(p => p.type === (type+1)).data.mysteryMode;
    }
}

