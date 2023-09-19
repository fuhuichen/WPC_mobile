import React, { Component } from 'react'

import {
  LinearGradient,
  Line,
  Text,
  Defs,
  Stop
} from 'react-native-svg'

class AbstractChart extends Component {
  //calcScaler = data => (Math.max(...data) - Math.min(...data)) || 1

  calcScaler = data =>{
    if (this.props.fromZero) {
        return Math.max.apply(Math, __spreadArrays(data, [0])) - Math.min.apply(Math, __spreadArrays(data, [0])) || 1;
    }
    else if (this.props.fromNumber) {
        return (Math.max.apply(Math, __spreadArrays(data, [this.props.fromNumber])) - Math.min.apply(Math, __spreadArrays(data, [this.props.fromNumber])) || 1);
    }
    else {
        return Math.max.apply(Math, data) - Math.min.apply(Math, data) || 1;
    }
};
  /*calcScaler = (val, data, height) => {
    console.log("2.calcScaler data:",data);
    var max = Math.max.apply(Math, data);
    var min = Math.min.apply(Math, data);
    if (min < 0 && max > 0) {
        return height * (val / this.calcScaler(data));
    }
    else if (min >= 0 && max >= 0) {
        return height * ((val - min) / this.calcScaler(data));
    }
    else if (min < 0 && max <= 0) {
        return height * ((val - max) / this.calcScaler(data));
    }
  };*/

  calcHeight = (val, data, height) =>{
    var max = Math.max.apply(Math, data);
    var min = Math.min.apply(Math, data);
    if (min < 0 && max > 0) {
        return height * (val / this.calcScaler(data));
    }
    else if (min >= 0 && max >= 0) {
        return this.props.fromZero
            ? height * (val / this.calcScaler(data))
            : height * ((val - min) / this.calcScaler(data));
    }
    else if (min < 0 && max <= 0) {
        return this.props.fromZero
            ? height * (val / this.calcScaler(data))
            : height * ((val - max) / this.calcScaler(data));
    }
};
  calcBaseHeight =  (data, height) => {
    var min = Math.min.apply(Math, data);
    var max = Math.max.apply(Math, data);
    //console.log('calcScaler:',this.calcScaler(data));
    if (min >= 0 && max >= 0) {
        return height;
    }
    else if (min < 0 && max <= 0) {
        return 0;
    }
    else if (min < 0 && max > 0) {
        return (height * max) / this.calcScaler(data);
    }
  };
  renderHorizontalLines = config => {
    const { count, width, height, paddingTop, paddingRight } = config
    return [...new Array(count)].map((_, i) => {
      return (
        <Line
          key={Math.random()}
          x1={paddingRight}
          y1={((height -12)/ 5 * i) + paddingTop}
          x2={width}
          y2={((height -12) / 5 * i) + paddingTop}
          stroke={this.props.chartConfig.color(0.2)}
        />
      )
    })
  }

  renderHorizontalLabels = config => {
    const { count, data, height, paddingTop, paddingRight, yLabelsOffset = 10,max,min } = config
  	var decimalPlaces = (this.props.chartConfig.decimalPlaces !== undefined) ? this.props.chartConfig.decimalPlaces : 2;
    return [...new Array(count)].map((_, i) => {
       var t = count === 1 ? data[0].toFixed(decimalPlaces) :
       (( (max-min) / (count - 1)) * i + min).toFixed(decimalPlaces);
       t = parseInt(t);
       if(max>50000){
         t = parseInt(t/1000) + 'k';
       }
      return (
        <Text
          key={Math.random()}
          x={paddingRight - yLabelsOffset}
          textAnchor="end"
          y={(height * 3 / 4) - ((height - paddingTop) / count * i) + 12}
          fontSize={12}
          fill={this.props.chartConfig.color(0.5)}
        >{t}
        </Text>
      )
    })
  }

  renderHorizontalEndLabels = config => {
    const {  data, width,height, paddingTop, paddingRight, yLabelsOffset = 10,renderEndlabel } = config
  var   count= 5
    if(!renderEndlabel )return;
  var decimalPlaces = (this.props.chartConfig.decimalPlaces !== undefined) ? this.props.chartConfig.decimalPlaces : 2;
    return [...new Array(count)].map((_, i) => {
    //  var t = 1;
      var t =  (  (100 / (count - 1)) * i  ).toFixed(1);
      var max =  100;


      return (
        <Text
          key={Math.random()}
          x={30}
          textAnchor="end"
          y={(height * 3 / 4) - ((height - paddingTop) / count * i) + 12}
          fontSize={12}
          fill={this.props.chartConfig.color(0.5)}
        >
        {t}
        </Text>
      )
    })
  }


  renderVerticalLabels = config => {
    const { labels = [], width, height, paddingRight, paddingTop, horizontalOffset = 20 } = config
    const fontSize = 11
    console.log('lablelen',labels.length)
    console.log('lable width',width)
    var gap = ((width-horizontalOffset) / (labels.length))/2
    return labels.map((label, i) => {
      return (
        <Text
          key={Math.random()}
          x={((width -horizontalOffset) / labels.length * (i) + horizontalOffset)+gap }
          y={(height * 3 / 4) + paddingTop + (fontSize+5 )}
          fontSize={fontSize}
          fill={this.props.chartConfig.color(0.5)}
          textAnchor="middle"
        >{label}
        </Text>
      )
    })
  }
  renderVerticalLabels2 = config => {
    const { labels2 = [], width, height, paddingRight, paddingTop, horizontalOffset = 20 } = config
    const fontSize = 11
    var gap = ((width-horizontalOffset) / (labels2.length))/2
    return labels2.map((label, i) => {
      return (
        <Text
          key={Math.random()}
          x={((width -horizontalOffset) / labels2.length * (i) + horizontalOffset)+gap }
          y={(height * 3 / 4) + paddingTop + (fontSize*2+10 )}
          fontSize={fontSize}
          fill={this.props.chartConfig.color(0.5)}
          textAnchor="middle"
        >{label}
        </Text>
      )
    })
  }

  renderVerticalLines = config => {
    const { data, width, height, paddingTop, paddingRight } = config
    return [...new Array(data.length)].map((_, i) => {
      return (
        <Line
          key={Math.random()}
          x1={Math.floor((width - paddingRight) / data.length * (i) + paddingRight)}
          y1={0}
          x2={Math.floor((width - paddingRight) / data.length * (i) + paddingRight)}
          y2={height - (height / 4) + paddingTop}
          stroke={this.props.chartConfig.color(0.2)}
        />
      )
    })
  }

  renderDefs = config => {
    const { width, height, backgroundGradientFrom, backgroundGradientTo } = config
    return (
      <Defs>
        <LinearGradient id="backgroundGradient" x1="0" y1={height} x2={width} y2={0}>
          <Stop offset="0" stopColor={backgroundGradientFrom}/>
          <Stop offset="1" stopColor={backgroundGradientTo}/>
        </LinearGradient>
        <LinearGradient id="fillShadowGradient" x1={0} y1={0} x2={0} y2={height}>
          <Stop offset="0" stopColor={this.props.chartConfig.color()} stopOpacity="0.1"/>
          <Stop offset="1" stopColor={this.props.chartConfig.color()} stopOpacity="0"/>
        </LinearGradient>

      </Defs>
    )
  }
}

export default AbstractChart
