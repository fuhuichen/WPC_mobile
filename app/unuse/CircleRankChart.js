import React, {Component} from 'react';

import {
    View,
    Text,
    Dimensions, StyleSheet, Image
} from 'react-native';

import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { FlatGrid } from 'react-native-super-grid';
import I18n from "react-native-i18n";

export default class CircleRankChart extends Component {

    constructor(props) {
        super(props);
    }

    renderGrid(item,index){
        let width = Dimensions.get('screen').width - 122;
        return (
            <View style={{alignItems:'center',justifyContent: 'center',}}>
                <AnimatedCircularProgress
                    size={width/3}
                    width={8}
                    backgroundWidth={8}
                    fill={item.count}
                    tintColor="#6097f4"
                    backgroundColor="#e3eaf4"
                    arcSweepAngle={240}
                    rotation={240}
                    lineCap="round">
                    {fill =>
                        <View style={{flexDirection:'row', alignItems:'center'}}>
                            <Text style={styles.points}>{item.count}</Text>
                            <Text style={styles.points2}>{'%'}</Text>
                        </View>
                    }
                </AnimatedCircularProgress>
                <Text style={styles.points3}>{item.name}</Text>
            </View>
        );
    }

    render() {
        let width = Dimensions.get('screen').width - 122;
        if(!this.props.items || this.props.items.length === 0) return (
            <View style={{marginBottom:10,alignItems:'center',justifyContent:'center'}}>
                <Image style={{width:100,height:100}} source={require('../assets/images/img_analysis_no_data.png')} resizeMode='contain'/>
                <Text style={{fontSize: 14, color: '#d5dbe4', textAlign: 'center',marginTop:6}}>{I18n.t('No data')}</Text>
            </View>
        );
        return (
            <FlatGrid
                itemDimension={width/3}
                spacing={15}
                items={this.props.items}
                renderItem={({item,index}) => this.renderGrid(item,index)}
            />
        )
    }
}

const styles = StyleSheet.create({
    points: {
        textAlign: 'center',
        marginTop:-10,
        color: '#292e36',
        fontSize: 18,
        fontWeight: '100',
    },
    points2: {
        textAlign: 'center',
        marginTop:-5,
        color: '#292e36',
        fontSize: 13,
        fontWeight: '100',
    },
    points3: {
        textAlign: 'center',
        marginTop:-25,
        color: '#7d8cad',
        fontSize: 12,
        fontWeight: '100',
    }
});

