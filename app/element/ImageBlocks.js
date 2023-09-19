import React, {Component} from 'react';
import {StyleSheet, Image, View} from "react-native";
import PropTypes from "prop-types";
import TouchableOpacityEx from "../touchables/TouchableOpacityEx";
import {Actions} from "react-native-router-flux";

export default class ImageBlocks extends Component {
    static propTypes =  {
        uri: PropTypes.string.isRequired,
        width: PropTypes.number,
        height: PropTypes.number,
        showDelete: PropTypes.boolean,
        onDelete: PropTypes.function
    };

    static defaultProps = {
        width:80,
        height:60,
        showDelete: true
    };

    constructor(props) {
        super(props);

        this.deleteUri = require('../assets/images/img_media_delete.png');
    }

    onView(uri){
        Actions.push('pictureViewer', {uri});
    }

    render() {
        let {width, height, uri, showDelete} = this.props;
        return (
            <View style={{width,height}}>
                <TouchableOpacityEx activeOpacity={1} onPress={()=>{this.onView(uri)}}>
                    <Image style={{width,height}} source={{uri: uri}} resizeMode='stretch'/>
                </TouchableOpacityEx>
                {
                    showDelete ? <TouchableOpacityEx activeOpacity={1} style={styles.delete}
                                                      onPress={()=>{this.props.onDelete()}}>
                        <Image style={{width:16,height:16}} source={this.deleteUri} />
                    </TouchableOpacityEx> : null
                }
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        alignItems:'center',
        justifyContent:'center'
    },
    play:{
        width:20,
        height: 20
    },
    delete:{
        position:'absolute',
        right:0,
        top:0,
        width:16,
        height:16
    }
});
