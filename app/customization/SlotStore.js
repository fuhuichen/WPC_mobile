import React, {Component} from 'react';
import PropTypes from 'prop-types';
import SlotView from "./SlotView";
import store from "../../mobx/Store";

export default class SlotStore extends Component {
    state = {
        storeSelector: store.storeSelector
    };

    static propTypes = {
        offset: PropTypes.number
    };

    static defaultProps = {
        offset: 0
    };

    render() {
        let {storeSelector} = this.state, {offset} = this.props, height = 60-offset;
        if (storeSelector.visible){
            height = 140 - offset;
        }

        return <SlotView containerStyle={{height:height}}/>
    }
}
