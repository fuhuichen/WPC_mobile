import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image, ScrollView, TouchableOpacity} from "react-native";
import PropTypes from 'prop-types';
import TouchableInactive from "../touchables/TouchableInactive";

const {width} = Dimensions.get('screen');
export default class VideoChannel extends Component {
    static propTypes = {
        data: PropTypes.array,
        deviceId: PropTypes.number,
        onChannel: PropTypes.func
    };

    onSelect(index) {
        this.props.onChannel && this.props.onChannel(index);
    }

    render() {
        let {data, deviceId} = this.props;

        return (
            <ScrollView horizontal={true}
                        showsHorizontalScrollIndicator={false}>
                <TouchableInactive>
                    <View style={styles.container}>
                        {
                            data.map((item, index) => {
                                let source = (item.id === deviceId) ? require('../assets/img_channel_active.png')
                                    : require('../assets/img_channel_inactive.png');
                                let color = (item.id === deviceId) ? 'rgb(44,144,217)' : 'rgb(166,200,223)';
                                return <TouchableOpacity activeOpacity={0.5} onPress={() => this.onSelect(index)}>
                                    <View style={styles.panel}>
                                        <Image source={source} style={styles.image}/>
                                        <Text style={[styles.name,{color}]} numberOfLines={1}>{item.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            })
                        }
                    </View>
                </TouchableInactive>
            </ScrollView>
        )
    }
}

const styles = StyleSheet.create({
    container:{
        flexDirection:'row',
        justifyContent:'flex-start',
        alignItems:'center',
        paddingLeft:16,
        paddingRight:16
    },
    panel:{
        width:62,
        marginTop: 10,
        paddingLeft: 2,
        paddingRight: 2
    },
    image:{
        width:36,
        height:36,
        alignSelf:'center'
    },
    name:{
        marginTop:1,
        textAlign: 'center',
        fontSize:8
    }
});
