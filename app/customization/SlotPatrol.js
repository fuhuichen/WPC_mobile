import React, {Component} from 'react';
import SlotView from "./SlotView";
import store from "../../mobx/Store";

export default class SlotPatrol extends Component {
    state = {
        patrolSelector: store.patrolSelector,
        enumSelector: store.enumSelector
    };

    render() {
        let {patrolSelector, enumSelector} = this.state, height = 10;

        let collection = patrolSelector.collection;
        let categoryType = enumSelector.categoryType;
        let scoreType = enumSelector.scoreType;

        if ((collection != null) &&  patrolSelector.visible){
            if (collection.parentType !== categoryType.SCORE){
                height = 280;
            }else {
                (collection.availableScores.length > 5) ? (height = 330)
                    : (height = 280);
            }
        }

        return <SlotView containerStyle={{height:height}}/>
    }
}
