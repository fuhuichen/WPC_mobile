import React, { Component } from 'react';
import {StyleSheet, Dimensions, View, Text, Image} from "react-native";
import PieChartLabel from "../../components/inspect/PieChartLabel";
import I18n from 'react-native-i18n';
import PropTypes from 'prop-types';
import Svg,{Stop, G, Circle,  LinearGradient, Polyline} from 'react-native-svg'
let {width} =  Dimensions.get('screen');
const OUTER_WIDTH = 140;
const OUTER_HEIGHT = 140;
const HALF_WIDTH = 130;
const MAX_LABEL = 20;

export default class PieChartCircle extends Component {
    static propTypes = {
        data: PropTypes.array,
        colors: PropTypes.array,
        defaultColor: PropTypes.string
    };

    static defaultProps = {
        defaultColor: '#ACABAB'
    };

    renderRings(){
        var list = [1,0.7];
        return list.map(function(c,i){
            return    <Circle
                ref={'circle'+i}
                cx={HALF_WIDTH / 2+1}
                cy={HALF_WIDTH / 2+1}
                r={HALF_WIDTH*c/2}
                stroke="#C3C4C5"
                strokeWidth={1}
                fill="transparent"
                strokeDasharray={[2, 2]}
                strokeLinecap="round"
            />
        }.bind(this))
    }

    render(){
        let {data, colors, defaultColor} = this.props;

        let outerData = [];
        data.forEach((item,index) => {
            if (item.count > 0){
                outerData.push({
                    value: item.count,
                    svg: {
                        fill: (index < MAX_LABEL) ? colors[index] : defaultColor,
                        onPress: () => {},
                    },
                    key: `pie-${index}`,
                })
            }
        });
        return(
            <View style={styles.container}>
                <View style={{position:'absolute',left:0,width:HALF_WIDTH+1,height:HALF_WIDTH+1}}>
                    <PieChartLabel
                        style={{height:HALF_WIDTH+1,width:HALF_WIDTH+1}}
                        data={outerData}
                    />
                </View>
                <View style={{position:'absolute',left:0}}>
                        <Svg width={HALF_WIDTH+2} height={HALF_WIDTH+2} originX={0} originY={0}>
                            <G>
                              {this.renderRings()}
                            </G>
                        </Svg>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        width: OUTER_WIDTH,
        height: OUTER_HEIGHT,
        borderRadius:10
    }
});
