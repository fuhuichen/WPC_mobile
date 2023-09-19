import React, {Component} from 'react';
import {StyleSheet, View, Text, Image, ScrollView, TouchableOpacity} from "react-native";
import PropTypes from 'prop-types';

export default class VideoChannelFull extends Component {
    state = {
        selectIndex: 0,
    };

    static propTypes = {
        data: PropTypes.array,
        onChannel: PropTypes.func
    };

    componentDidMount() {
       let index = this.props.data.findIndex(p => p.id == this.props.deviceId);
       this.setState({selectIndex:index});
       if (index > 9){
         setTimeout(() => {
            this.scroll && this.scroll.scrollTo({x: 0, y: parseInt(index/5)*60, animated: true})
         }, 500); 
       } 
    }

    onSelect(index) {
        this.setState({selectIndex:index});
        this.props.onChannel && this.props.onChannel(index);
    }

    render() {
        let {selectIndex} = this.state;
        return (
            <ScrollView ref={c => this.scroll = c}>
             <View style={{flexDirection: 'row',flexWrap: 'wrap',alignItems: 'center',width:this.props.width,paddingLeft:16,paddingRight:16,paddingTop:10,paddingBottom:10}}>
                {
                   this.props.data.map((item, index) => {
                    let source = (index === selectIndex) ? require('../assets/img_channel_active.png')
                        : require('../assets/img_channel_inactive.png');
                    let color = (index === selectIndex) ? 'rgb(44,144,217)' : 'rgb(166,200,223)';
                    return <TouchableOpacity activeOpacity={0.5} onPress={() => this.onSelect(index)}>
                        <View style={styles.panel}>
                            <Image source={source} style={styles.image}/>
                            <Text style={[styles.name,{color}]} numberOfLines={1}>{item.name}</Text>
                        </View>
                    </TouchableOpacity>
                })         
                } 
            </View>
            </ScrollView>    
        )
    }
}

const styles = StyleSheet.create({
    panel:{
        width:78,
        marginTop: 10,
        paddingLeft: 2,
        paddingRight: 2
    },
    image:{
        width:50,
        height:50,
        alignSelf:'center'
    },
    name:{
        marginTop:1,
        textAlign: 'center',
        fontSize:10
    }
});
