import React, {Component} from 'react';
import { Context } from '../../FrameworkProvider';
import  {
  StyleSheet,
  View,
  Text,
  ScrollView
} from 'react-native';
import {TouchCard} from "../container"
import {DimUtil} from "../../utils"
import LineChart from "./kits/LineChart"
class Chart extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const {data,index,statusBarHeight,status,unit,binary} = this.props;
    console.log("Binary =" +binary)
    const {width,height} = DimUtil.getDimensions("portrait")
    return (
        <Context.Consumer>
          {({ theme}) => (
              <LineChart data={data}
              status={status}
              width={this.props.width?this.props.width:width-40}
              height={this.props.height}
              std={[0,10]}
              yAxisLabel="$"
              yAxisSuffix="k"
              index={index}
              unit={unit}
              binary={binary}
              withVerticalLines
              chartConfig={{
                  withVerticalLines:true,
                  yAxisSuffix:"abc",
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  fillShadowGradient:'rgba(0, 106, 183, 1)',
                  fillShadowGradientOpacity:0.4,
                  decimalPlaces: 1,
                  strokeWidth:2,
                  color: (opacity = 1) => `rgba(0, 106, 183, 1)`,
                  labelColor: (opacity = 1) => `rgba(134, 136, 138, 1)`,
                  propsForDots: {
                      r: "4",
                      strokeWidth: "2",
                      stroke: "rgba(229, 241, 251, 1)"
                  },
                  propsForVerticalLabels:{
                      fontSize:10
                  }
              }}
              style={{
                  paddingRight:0,paddingLeft:10,paddingTop:20,borderRadius:10,
              }}
              hidePointsAtIndex={[]}
              withVerticalLabels={true}
              withHorizontalLabels={false}
              withHorizontalLines={true}
              withVerticalLines={false}/>
            )}
        </Context.Consumer>
      );
  }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,alignItems:'center'
    }
});

export default Chart;
