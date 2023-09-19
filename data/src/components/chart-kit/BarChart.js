import React from 'react'
import { View,ScrollView } from 'react-native'
import {
  Text,
  Svg,
  Circle,
  Polygon,
  Polyline,
  Path,
  Rect,
  Line,
  G
} from 'react-native-svg'
import AbstractChart from './AbstractChart'
class BarChart extends AbstractChart {

  renderDots = config => {
    const { data, width, height, paddingTop, paddingRight } = config
    let output = [];
    data.map((dataset,index)=>{
      dataset.data.map((x, i) => {
        output.push (
          <Circle
            key={Math.random()}
            cx={paddingRight + (i * (width - paddingRight) / dataset.data.length)}
            cy={((height / 4 * 3 * (1 - ((x - Math.min(...dataset.data)) / this.calcScaler(dataset.data)))) + paddingTop)}
            r="4"
            fill={this.getColor(index,0.0)}
          />)
      })
    })
    return (
      output
    )


  }

  renderShadow = config => {
    if (this.props.bezier) {
      return this.renderBezierShadow(config)
    }
    const { data, width, height, paddingRight, paddingTop } = config
    let output = [];
    config.data.map((dataset,index)=>{
      output.push (
        <Polygon
          key={index}
          points={dataset.data.map((x, i) =>
            (paddingRight + (i * (width - paddingRight) / dataset.data.length)) +
          ',' +
           (((height / 4 * 3 * (1 - ((x - Math.min(...dataset.data)) / this.calcScaler(dataset.data)))) + paddingTop))
          ).join(' ') + ` ${paddingRight + ((width - paddingRight) / dataset.data.length * (dataset.data.length - 1))},${(height / 4 * 3) + paddingTop} ${paddingRight},${(height / 4 * 3) + paddingTop}`}
          fill={this.getColor(index,0.05)}
          strokeWidth={0}
        />)
    })
    return (
      output
    )


  }

  renderLine = config => {
    if (this.props.bezier) {
      return this.renderBezierLine(config)
    }
    const { width, height, paddingRight, paddingTop, data } = config
    let output = [];
    //console.log(paddingRight,width)
    data.map((dataset,index) => {
       console.log(dataset);
      const points = dataset.data.map((x, i) =>
      (paddingRight + (i * (width - paddingRight) / dataset.data.length)) +
      ',' +
       (((height / 4 * 3 * (1 - ((x - Math.min(...dataset.data)) / this.calcScaler(dataset.data))))) + paddingTop))
  //   console.log(points);
      output.push (
        <Polyline
          key = {index}
          points={points.join(' ')}
          fill="none"
          stroke={this.getColor(index,0.6 )}
          strokeWidth={2}
        />
      )

    })

    return (
      output
    )


  }

  getBezierLinePoints = (dataset, config) => {

    const { width, height, paddingRight, paddingTop, data } = config
    let output = [];
    if (dataset.data.length === 0) {
      return 'M0,0'
    }
    const x = i => Math.floor(paddingRight + i * (width - paddingRight) / dataset.data.length)
    const y = i => Math.floor(((height / 4 * 3 * (1 - ((dataset.data[i] - Math.min(...dataset.data)) / this.calcScaler(dataset.data)))) + paddingTop))

    return [`M${x(0)},${y(0)}`].concat(dataset.data.slice(0, -1).map((_, i) => {
      const x_mid = (x(i) + x(i + 1)) / 2
      const y_mid = (y(i) + y(i + 1)) / 2
      const cp_x1 = (x_mid + x(i)) / 2
      const cp_x2 = (x_mid + x(i + 1)) / 2
      return `Q ${cp_x1}, ${y(i)}, ${x_mid}, ${y_mid}` +
      ` Q ${cp_x2}, ${y(i + 1)}, ${x(i + 1)}, ${y(i + 1)}`
    })).join(' ')


  }
  getColor(index,opacity){
    if(index == 1){
      return `rgba(72, 96, 230, ${opacity})`;
    }
    else if(index == 0){
      return `rgba(252, 76, 90, ${opacity})`;
    }
    else{
      return `rgba(25, 75,150, ${opacity})`;
    }
  }
  renderBezierLine = config => {
    let output = [];
    config.data.map((dataset,index)=>{
      let result = this.getBezierLinePoints(dataset,config);
      output.push (
          <Path
            key = {index}
            d={result}
            fill="none"
            stroke={this.getColor(index,0.2)}
            strokeWidth={3}
          />
        )
      });
    return (
      output
    )


  }

  renderBezierShadow = config => {
    const { width, height, paddingRight, paddingTop, data } = config
    let output = [];
    data.map((dataset,index)=>{
      let d = this.getBezierLinePoints(dataset,config) +
      ` L${paddingRight + ((width - paddingRight) / dataset.data.length * (dataset.data.length - 1))},${(height / 4 * 3) + paddingTop} L${paddingRight},${(height / 4 * 3) + paddingTop} Z`
      output.push (
        <Path
          key={index}
          d={d}
          fill={this.getColor(index,0.05)}
          strokeWidth={0}
        />)
    })
    return (
      output
    )

  }

  renderBars = config => {

    const { data, width, height, paddingTop, paddingRight } = config
    if(data == undefined)return;
    return data.map((x, i) => {
      const barHeight = height / 4 * 3 * ((x - Math.min(...data)) / this.calcScaler(data))
      var barWidth =  ((width - paddingRight) / data.length ) * 0.6
      return (
        <Rect
          key={Math.random()}
          x={(paddingRight + (i * (width - paddingRight) / data.length) + (barWidth / 2))}
          y={(((height / 4 * 3) - barHeight) + paddingTop)}
          width={barWidth}
          height={barHeight}
          fill={this.getColor(1,0.9)}
        />)
    })
  }

  renderBarTops = config => {
    const { data, width, height, paddingTop, paddingRight } = config
    return data.map((x, i) => {
      const barHeight = height / 4 * 3 * ((x - Math.min(...data)) / this.calcScaler(data))
      return (
        <Rect
          key={Math.random()}
          x={(paddingRight + (i * (width - paddingRight) / data.length)) + (barWidth / 2)}
          y={(((height / 4 * 3) - barHeight) + paddingTop)}
          width={barWidth}
          height={2}
          fill={this.props.chartConfig.color(0.6)}
        />)
    })
  }

  render() {
    const paddingTop = 10
    const paddingRight = 17;
    const { height, data, withShadow = true, withDots = true, style = {} } = this.props
    const { labels = [], labels2 = [] } = data
    const { borderRadius = 0 } = style
    var multi = 1;
    if(data.datasets[0].data.length>=28){
       multi =data.datasets[0].data.length/16;
    }
    if(data.datasets[0].data.length==24){
       multi =data.datasets[0].data.length/9;
    }
    if(data.datasets[0].data.length==7){
       multi = 1.2;
    }
    var width = this.props.width * multi;
    const config = {
      height:height,width
    }

    return (
      <View style={[style,{flexDirection:'row'}]}>
      <Svg
        height={height}
        width={40}
      >
        <G>
          {this.renderDefs({
            ...config,
            ...this.props.chartConfig
          })}
          <Rect
            rx={borderRadius}
            ry={borderRadius}
            width= {40}
            height={height}
            fill="transparent"/>
            {this.renderHorizontalLabels({
              ...config,
              count: (Math.min(...data.datasets[0].data) === Math.max(...data.datasets[0].data)) ?
                1 : 5,
              data: data.datasets[0].data,
              paddingTop,
              paddingRight:40
            })}
        </G>
      </Svg>
        <ScrollView  horizontal={true}>
        <Svg

          height={height}
          width={width}
        >
        <G>
          {this.renderDefs({
            ...config,
            ...this.props.chartConfig
          })}
          <Rect
            width="100%"
            height={height}
            rx={borderRadius}
            ry={borderRadius}
            fill="url(#backgroundGradient)"/>
          {this.renderHorizontalLines({
            ...config,
            count: 5,
            paddingTop,
            paddingRight
          })}
          {this.renderVerticalLabels2({
            ...config,
            labels2,
            paddingRight,
            paddingTop
          })}
          {this.renderVerticalLabels({
            ...config,
            labels,
            paddingRight,
            paddingTop
          })}
          <Line
            x1={paddingRight}
            y1={0}
            x2={paddingRight}
            y2={height-25}
            stroke={this.props.chartConfig.color(0.2)}
          />
          <Line
            x1={width}
            y1={0}
            x2={width}
            y2={height-25}
            stroke={this.props.chartConfig.color(0.2)}
          />
          {this.renderBars({
            ...config,
            data: data.barDataset,
            paddingTop,
            paddingRight
          })}
          {this.renderLine({
            ...config,
            paddingRight,
            paddingTop,
            // data: data.datasets[0].data
            data: data.datasets

          })}

          {withShadow && this.renderShadow({
            ...config,
            data: data.datasets,
            paddingRight,
            paddingTop
          })}
          {withDots && this.renderDots({
            ...config,
            data: data.datasets,
            paddingTop,
            paddingRight
          })}

        </G>
      </Svg>
        </ScrollView>
        <Svg
          height={height}
          width={40}
        >
          <G>
            {this.renderDefs({
              ...config,
              ...this.props.chartConfig
            })}
            <Rect
              rx={borderRadius}
              ry={borderRadius}
              width= {40}
              height={height}
              fill="transparent"/>

            {this.renderHorizontalEndLabels({
              ...config,
              count: (Math.min(...data.datasets[0].data) === Math.max(...data.datasets[0].data)) ?
                1 : 5,
              data: data.datasets[0].data,
              paddingTop,
              paddingRight,
              width:40
            })}
          </G>
        </Svg>
      </View>
    )
  }
}

export default BarChart
