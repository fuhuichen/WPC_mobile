import React from 'react'
import { View,ScrollView } from 'react-native'
import {
  Text,
  Image,
  Svg,
  Circle,
  Polygon,
  Polyline,
  Path,
  Rect,
  Line,
  G
} from 'react-native-svg'
import AbstractChart from '../../data/src/components/chart-kit/AbstractChart'
import DataHandler from '../../data/src/utils/DataHandler'
import VALUES from '../../data/src/utils/values';
class LineChart extends AbstractChart {
  componentWillReceiveProps = function(nextProps) {
    //console.log("componentWillReceiveProps nextProps : " + JSON.stringify(nextProps));
    this.forceUpdate()
  }

  renderDots = config => {
    const { data, width, height, paddingTop, paddingRight } = config
    let output = [];
    if(!data) return;
    data.map((dataset,index)=>{
      dataset.data.map((x, i) => {
        output.push (
          <Circle
            key={Math.random()}
            cx={paddingRight + (i * (width - paddingRight) / dataset.data.length)}
            cy={((height / 4 * 3 * (1 - ((x - Math.min(...dataset.data)) / this.calcScaler(dataset.data)))) + paddingTop)}
            r="4"
            fill={'#ffffff'}
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
    const { data, width, height, paddingRight,
       paddingTop,horizontalOffset = 20,showLine,max,min,uniqueUnit } = config
    let output = [];
    if(!showLine) return;
    let max_common = 0;
    data.map((dataset,index) => {
      if(dataset.max == undefined) {
        max_common = Math.max(...dataset.data, max_common);
      }
    })
    config.data.map((dataset,index)=>{
      if(dataset.visible || typeof dataset.visible == 'undefined') {
        var lmin,lmax;
        if(uniqueUnit) {
          lmin = min;
          lmax = max;
        } else {
          lmin = Math.min(...dataset.data);
          lmax = max_common;//Math.max(...dataset.data);
          if(dataset.max!=undefined) {
            lmax =dataset.max;
          }
        }
        lmin= 0;
        var gap = ((width-horizontalOffset) / (dataset.data.length))/2
        output.push (
          <Polygon
            key={index}
            points={dataset.data.map((x, i) =>
              (horizontalOffset+gap + (i * (width -horizontalOffset) / dataset.data.length)) +
            ',' +
             (((height / 4 * 3 * (1 - ((x - lmin) / ((lmax-lmin)|| 1)))) + paddingTop))
            ).join(' ') + ` ${paddingRight + ((width - paddingRight) / dataset.data.length * (dataset.data.length - 1))},${(height / 4 * 3) + paddingTop} ${paddingRight},${(height / 4 * 3) + paddingTop}`}
            fill={this.getColor(index,0.03)}
            strokeWidth={0}
          />)
      }
    })
    return (
      output
    )
  }

  renderMask = config => {
    const { data, width, height, paddingRight, offset=12,
      paddingTop,horizontalOffset = 20,showLine,max,min,uniqueUnit } = config
    if(!data) return;
    //console.log("renderMask data : " + JSON.stringify(data));
    return data.map((x, i) => {
      const barHeight = height * ((x - Math.min(...data)) / this.calcScaler(data))
      var barWidth =  ((width - offset) / (data.length) )
      var shift =  ((width - offset) / data.length )*0.2
      return (
        <Rect
          key={Math.random()}
          x={((i * (width - paddingRight) / data.length) + offset)}
          y={(((height / 4 * 3) - barHeight) + paddingTop)}
          width={barWidth}
          height={barHeight}
          fill={`rgba(20, 20, 20, 0.3)`}
        />)
    })
  }

  renderLineDots = config => {
    const { showLine,width, height, paddingRight, paddingTop,
       data, horizontalOffset = 20,min,max,uniqueUnit } = config
    let output = [];
    if(!showLine) return;
    if(!data) return;
    let max_common = 0;
    data.map((dataset,index) => {
      if(dataset.max == undefined) {
        max_common = Math.max(...dataset.data, max_common);
      }
    })
    data.map((dataset,index) => {
      if(dataset.visible || typeof dataset.visible == 'undefined') {
        var lmin,lmax;
        if(uniqueUnit) {
          lmin = min;
          lmax = max;
        } else {
          lmin = Math.min(...dataset.data);
          lmax = max_common;//Math.max(...dataset.data);
          if(dataset.max!=undefined) {
            lmax =dataset.max;
          }
        }
        lmin = 0;
        //console.log(dataset);
        var gap = ((width-horizontalOffset) / (dataset.data.length))/2
        const points = dataset.data.map((x, i) =>{
          output.push (
            <Circle
              key={Math.random()}
              cx={ ( horizontalOffset+gap +(i * (width-horizontalOffset) / (dataset.data.length)))}
              cy={(((height / 4 * 3 * (1 - ((x - lmin) / ((lmax-lmin)|| 1))))) + paddingTop)}
              r="5"
              fill={this.getColor(index,0.6 )}
            />)
        })
      }
    })

    return (
      <G>
      {output}
      </G>
    )
  }

  renderText = config => {
    const { showLine,width, height, paddingRight, paddingTop,
       data, horizontalOffset = 20,min,max,uniqueUnit,viewNumber } = config
    /// console.log('render text viewNumber ',viewNumber )
    let output = [];
    if(!showLine) return;
    if(!this.props.viewNumber) return;
    //console.log('RenderText')
    if(!data)return;
    let max_common = 0;
    data.map((dataset,index) => {
      if(dataset.max == undefined) {
        max_common = Math.max(...dataset.data, max_common);
      }
    })
    data.map((dataset,index) => {
      if(dataset.visible || typeof dataset.visible == 'undefined') {
        var lmin,lmax;
        if(uniqueUnit) {
          lmin = min;
          lmax = max;
        } else {
          lmin = Math.min(...dataset.data);
          lmax = max_common;//Math.max(...dataset.data);
          if(dataset.max!=undefined){
              lmax =dataset.max;
          }
        }
        lmin= 0;
        //console.log(dataset);
        var gap = ((width-horizontalOffset) / (dataset.data.length))/2;
        const points = dataset.data.map((x, i) => {
           // console.log('rendre text',x)
          if(x>=0) {
            output.push(<Text
              key={Math.random()}
              x={ horizontalOffset+gap +(i * (width-horizontalOffset) / (dataset.data.length))}
              textAnchor="middle"
              y={ ((height / 4 * 3 * (1 - ((x - lmin) / ((lmax-lmin)|| 1))))) + paddingTop -9}
              fontSize={12}
              fill={this.getTextColor(index,0.6 )}
            >{ this.props.textFloat ? DataHandler.numberFormat_Float(x) : DataHandler.numberFormat(x)}
            </Text>)
          }
        })
      }
    })
    //console.log(output)
    return ( output )
  }

  renderWeather = config => {
    const { width, height, data, labels2, horizontalOffset = 20 } = config
    let output = [];
    if(!data)return;
    var gap = ((width-horizontalOffset) / (data.length))/2;
    data.map((x, i) => {
      var weatherIcon = VALUES.getWeatherIcon(x);
      var paddingTop = (labels2[i] && labels2[i] != "") ? 3 : -5;
      if(x>=0) {
        output.push(
        <Image
          key={ Math.random() }
          x={ horizontalOffset + gap + (i * (width-horizontalOffset) / (data.length)) - 9}
          textAnchor="middle"
          y={ height + paddingTop }
          width={20}
          height={20}
          href={weatherIcon}/>
      )
      }
    })
    return ( output )
  }

  renderLine = config => {
    const { showLine,width, height, paddingRight, paddingTop,
       data, horizontalOffset = 20,min,max,uniqueUnit } = config
    let output = [];
    if(!showLine)return;
    if(!data)return;
    let max_common = 0;
    data.map((dataset,index) => {
      if(dataset.max == undefined) {
        max_common = Math.max(...dataset.data, max_common);
      }
    })
    data.map((dataset,index) => {
      if(dataset.visible || typeof dataset.visible == 'undefined') {
        var lmin,lmax;
        if(uniqueUnit) {
          lmin = min;
          lmax = max;
        } else {
          lmin = Math.min(...dataset.data);
          lmax = max_common;//Math.max(...dataset.data);
          if(dataset.max!=undefined){
              lmax =dataset.max;
          }
        }
        lmin= 0;
        var gap = ((width-horizontalOffset) / (dataset.data.length))/2
        const points = dataset.data.map((x, i) =>
        ( horizontalOffset+gap +(i * (width-horizontalOffset) / (dataset.data.length))) +
        ',' +
         (((height / 4 * 3 * (1 - ((x - lmin) / ((lmax-lmin)|| 1))))) + paddingTop))
        output.push (
          <Polyline
            key = {index}
            points={points.join(' ')}
            fill="none"
            stroke={this.getColor(index,0.8 )}
            strokeWidth={2}
          />
        )
      }
    })
    //console.log("renderLine output : " + output);
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

  getColor(index,opacity) {
    if(index == 0){
      return `rgba(242,28,101, ${opacity})`;
    }
    else if(index == 2) {
      return `rgba(245,131,35, ${opacity})`;
    } else if(index == 1) {
      return `rgba(248,188,28, ${opacity})`;
    } else if(index == 3) {
      return `rgba(68,76,95, ${opacity})`;
    }
  }

  getTextColor(index,opacity) {
    if(index == 1) {
      return `rgba(164, 194, 254, ${opacity})`;
    } else if(index == 0) {
      return `rgba(255, 130, 172, ${opacity})`;
    } else {
      return `rgba(255, 254, 192, ${opacity})`;
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
    if(!data)return;
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
    const { data, visible, width, height, paddingTop, offset=6,
            paddingRight, showLine, isDoubleData, max } = config
    if(data == undefined)return;
    if(visible == false)return;
    return data.map((x, i) => {
      var barHeight = height / 4 * 3 * ((x - Math.min(...data)) / this.calcScaler(data));
      if(typeof max != "undefined") {
        barHeight = height / 4 * 3 * (x / (max || Math.max(data)));
      }
      var barWidth =  (width - offset)*0.08
      if( data.length >8){
          barWidth =  ((width - offset)/data.length) *0.5
      }
      var shift =  ((width - offset) / data.length ) /2 - barWidth/2
      if(isDoubleData){
          barWidth =barWidth/2;
          shift =  ((width - offset) / data.length ) /2 - barWidth*1.1
      }

      return (
        <Rect
          key={Math.random()}
          x={((i * (width - paddingRight) / data.length) +offset+shift)}
          y={(((height / 4 * 3) - barHeight) + paddingTop)}
          width={barWidth}
          height={barHeight}
          fill={this.getColor(1,0.9)}
        />)
    })
  }

  renderBarsText = config => {
    const { data, visible, width, height, paddingTop, offset=6, viewNumber,
            paddingRight, showLine, isDoubleData, max } = config
    if(data == undefined)return;
    if(visible == false)return;
    if(!viewNumber)return;
    return data.map((x, i) => {
      var barHeight = height / 4 * 3 * ((x - Math.min(...data)) / this.calcScaler(data));
      if(typeof max != "undefined") {
        barHeight = height / 4 * 3 * (x / (max || Math.max(data)));
      }
      var barWidth =  (width - offset)*0.08
      if( data.length >8){
          barWidth =  ((width - offset)/data.length) *0.5
      }
      var shift =  ((width - offset) / data.length ) /2
      if(isDoubleData){
          barWidth =barWidth/2;
          shift =  ((width - offset) / data.length ) /2 - barWidth*0.8
      }
      if(x>=0)
      {return (<Text
          key={Math.random()}
          x={((i * (width - paddingRight) / data.length) +offset+shift)}
          textAnchor="middle"
           y={(((height / 4 * 3) - barHeight) + paddingTop -5)}
          fontSize={12}
          fill={this.getColor(1,0.9)}
        >{DataHandler.numberFormat(x)}
        </Text>)}
    })
  }

  renderBars2 = config => {
    const { data, visible, width, height, paddingTop, offset=6, paddingRight,
            showLine, max } = config
    if(data == undefined) return;
    if(visible == false) return;
    return data.map((x, i) => {
      var barHeight = height / 4 * 3 * ((x - Math.min(...data)) / this.calcScaler(data));
      if(typeof max != "undefined") {
        barHeight = height / 4 * 3 * (x / (max || Math.max(data)));
      }
      var barWidth =  (width - offset)*0.04
      if( data.length >8){
          barWidth =  ((width - offset)/data.length) *0.25
      }
      var shift =  ((width - offset) / data.length )*0.5
      return (
        <Rect
          key={Math.random()}
          x={((i * (width - paddingRight) / data.length) +offset+shift)}
          y={(((height / 4 * 3) - barHeight) + paddingTop)}
          width={barWidth}
          height={barHeight}
          fill={this.getColor(2,0.9)}
        />)
    })
  }

  renderBarsText2 = config => {
    const { data, width, height,viewNumber, visible,
         paddingTop, offset=6, paddingRight, showLine, max } = config
    if(data == undefined) return;
    if(visible == false) return;
    if(!viewNumber) return;
    return data.map((x, i) => {
      var barHeight = height / 4 * 3 * ((x - Math.min(...data)) / this.calcScaler(data));
      if(typeof max != "undefined") {
        barHeight = height / 4 * 3 * (x / (max || Math.max(data)));
      }
      var barWidth =  (width - offset)*0.04
      if( data.length >8){
          barWidth =  ((width - offset)/data.length) *0.25
      }
      var shift =  ((width - offset) / data.length )*0.58
      if(x>=0)
      {return (<Text
          key={Math.random()}
          x={((i * (width - paddingRight) / data.length) +offset+shift)}
          textAnchor="middle"
           y={(((height / 4 * 3) - barHeight) + paddingTop -5)}
          fontSize={12}
          fill={this.getColor(2,0.9)}
        >{DataHandler.numberFormat(x)}
        </Text>)}
    })
  }

  renderBars3 = config => {
    const { data, visible, width, height, paddingTop, offset=6, paddingRight,
            showLine, max } = config
    if(data == undefined) return;
    if(visible == false) return;
    return data.map((x, i) => {
      var barHeight = height / 4 * 3 * ((x - Math.min(...data)) / this.calcScaler(data));
      if(typeof max != "undefined") {
        barHeight = height / 4 * 3 * (x / (max || Math.max(data)));
      }
      var barWidth =  (width - offset)*0.04
      if( data.length >8){
          barWidth =  ((width - offset)/data.length) *0.25
      }
      var shift =  ((width - offset) / data.length )*0.68
      return (
        <Rect
          key={Math.random()}
          x={((i * (width - paddingRight) / data.length) +offset+shift)}
          y={(((height / 4 * 3) - barHeight) + paddingTop)}
          width={barWidth}
          height={barHeight}
          fill={this.getColor(3,0.9)}
        />)
    })
  }

  renderBarsText3 = config => {
    const { data, width, height,viewNumber, visible,
         paddingTop, offset=6, paddingRight, showLine, max } = config
    if(data == undefined) return;
    if(visible == false) return;
    if(!viewNumber) return;
    return data.map((x, i) => {
      var barHeight = height / 4 * 3 * ((x - Math.min(...data)) / this.calcScaler(data));
      if(typeof max != "undefined") {
        barHeight = height / 4 * 3 * (x / (max || Math.max(data)));
      }
      var barWidth =  (width - offset)*0.04
      if( data.length >8){
          barWidth =  ((width - offset)/data.length) *0.25
      }
      var shift =  ((width - offset) / data.length )*0.77
      if(x>=0)
      {return (<Text
          key={Math.random()}
          x={((i * (width - paddingRight) / data.length) +offset+shift)}
          textAnchor="middle"
           y={(((height / 4 * 3) - barHeight) + paddingTop -5)}
          fontSize={12}
          fill={this.getColor(3,0.9)}
        >{DataHandler.numberFormat(x)}
        </Text>)}
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
    //console.log('LineChart render');
    const paddingTop = 20;
    const paddingRight = 17;
    const { height, data, withShadow = true, withDots = true,
       style = {},showLine,renderEndlabel ,viewNumber,uniqueUnit } = this.props
    const { labels = [], labels2 = [] } = data
    const { borderRadius = 0 } = style
    var originData = JSON.parse(JSON.stringify(this.props.data)) ;
    var multi = 1;
    for(var m in data.datasets){
        for(var n in data.datasets[m].data){
            if(data.datasets[m].data[n]<0){
                data.datasets[m].data[n]=0;
            }
        }
    }
    for(var n in data.barDataset){
        if(data.barDataset[n]<0){
            data.barDataset[n]=0;
        }
    }
    for(var n in data.barDataset2){
        if(data.barDataset2[n]<0){
            data.barDataset2[n]=0;
        }
    }
    //console.log("render Line Chart data : ", data);
    var min=0,max=0;
    if(data.datasets.length>0){
      if(data.datasets[0].data.length<8) {
         multi =0.99 ;
      } else {
           multi =data.datasets[0].data.length/8;
      }

      if(!uniqueUnit) {
        //console.log(data.datasets[0].data)
        min= Math.min(...data.datasets[0].data);
        max= Math.max(...data.datasets[0].data);
      } else {
        for(var k in data.datasets){
          if(k==0){
            min= Math.min(...data.datasets[0].data);
            max= Math.max(...data.datasets[0].data);
            if(data.datasets[k].max!=undefined){
                max = data.datasets[k].max;
            }
          } else {
            nmin= Math.min(...data.datasets[k].data);
            nmax= Math.max(...data.datasets[k].data);
            //console.log('nmax is',nmax)
            if(nmin<min){
              min = nmin
            }
            if(nmax>max){
              max = nmax;
            }
          }
        }
      }
    }

    //console.log('Max is',max)
    var width = this.props.width * multi;
    var isDoubleData=false;
    if(data.barDataset2)isDoubleData=true;
    var config = {
      height:height-(this.props.viewNumber?21:20),width,showLine,viewNumber,
      renderEndlabel,uniqueUnit,min,max,isDoubleData
    }
    //console.log('LineChart viewNumber ',viewNumber)
    return (
      <View style={[style,{flexDirection:'row'}]}>
        <ScrollView  horizontal={true}>
        <Svg height={height} width={width} key={Math.random()}>
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
            <G>
            {data.isWeekend && data.isWeekend.length > 0 && this.renderMask({
              ...config,
              data: data.isWeekend,
              paddingTop,
              paddingRight
            })}
            </G>
            <G>
            {this.renderHorizontalLines({
              ...config,
              count: 5,
              paddingTop,
              paddingRight
            })}
            </G>
            <G>
            {this.renderVerticalLabels2({
              ...config,
              labels2,
              paddingRight,
              paddingTop
            })}
            </G>
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
            <G>
            {this.renderBars({
              ...config,
              data: data.barDataset,
              max: data.barMax,
              visible: data.barDatasetVisible,
              paddingTop,
              paddingRight
            })}
            </G>
            <G>
            {this.renderBarsText({
              ...config,
              data: originData.barDataset,
              max: data.barMax,
              visible: data.barDatasetVisible,
              paddingTop,
              paddingRight
            })}
            </G>
            <G>
            {this.renderBarsText2({
              ...config,
              data: originData.barDataset2,
              max: data.barMax,
              visible: data.barDataset2Visible,
              paddingTop,
              paddingRight
            })}
            </G>
            <G>
            {this.renderBars2({
              ...config,
              data: data.barDataset2,
              max: data.barMax,
              visible: data.barDataset2Visible,
              paddingTop,
              paddingRight
            })}
             {this.renderBars3({
              ...config,
              data: data.barDataset3,
              max: data.barMax,
              visible: true,
              paddingTop,
              paddingRight
            })}
             {this.renderBarsText3({
              ...config,
              data: originData.barDataset3,
              max: data.barMax,
              visible: true,
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
            </G>
            <G>
            {withShadow && this.renderShadow({
              ...config,
              data: data.datasets,
              paddingRight,
              paddingTop
            })}
            </G>
            <G>
            {this.renderLineDots({
              ...config,
              data: data.datasets,
              paddingTop,
              paddingRight
            })}
            </G>
            <G>
            {this.renderText({
              ...config,
              data: originData.datasets,
              paddingTop,
              paddingRight
            })}
            </G>
            <G>
            {originData.weatherConditions && this.renderWeather({
              ...config,
              data: originData.weatherConditions,
              labels2,
              paddingRight
            })}
            </G>
          </G>
        </Svg>
        </ScrollView>
      </View>
    )
  }
}

export default LineChart
