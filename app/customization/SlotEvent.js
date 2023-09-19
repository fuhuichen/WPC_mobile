import React, {Component} from 'react';
import PropTypes from 'prop-types';
import SlotView from "./SlotView";
import store from "../../mobx/Store";

export default class SlotEvent extends Component {
    state = {
        eventSelector: store.eventSelector
    };

    static propTypes = {
        offset: PropTypes.number
    };

    static defaultProps = {
        offset: 0
    };

    render() {
        let {eventSelector} = this.state, {offset} = this.props, height = 60-offset;
        if (eventSelector.visible){
            height = 140 - offset;
        }

        return <SlotView containerStyle={{height:height}}/>
    }
}
