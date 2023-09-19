import React, {Component} from 'react';
import {StyleSheet, Dimensions, FlatList, View} from "react-native";
import PropTypes from 'prop-types';
import store from "../../mobx/Store";
import ImageBlocks from "./ImageBlocks";
import VideoBlocks from "./VideoBlocks";

const {width} = Dimensions.get('screen');
export default class FlatMedia extends Component {
    static propsTypes = {
        data: PropTypes.array.isRequired,
        showDelete: PropTypes.boolean
    };

    static defaultProps = {
        data: [],
        showDelete: true
    };

    renderItem(item){
        let mediaTypes = store.enumSelector.mediaTypes;
        let {showDelete} = this.props;
        return (
            <View style={{marginLeft: (item.index !== 0) ? 10 : 0}}>
                {
                    (item.type === mediaTypes.IMAGE) ? <ImageBlocks uri={item.uri} showDelete={showDelete}/>
                        : <VideoBlocks uri={item.uri} showDelete={showDelete}/>

                }
            </View>
        )
    }

    render() {
        let {data} = this.props;
        return (
            <FlatList data={data}
                      keyExtractor={(item, index) => index.toString()}
                      renderItem={this.renderItem.bind(this)}
                      horizontal={true}
                      showsHorizontalScrollIndicator={false}
            />
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
});
