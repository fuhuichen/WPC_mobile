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
import AbstractChart from './AbstractChart'
import DataHandler from '../../utils/DataHandler'
import StringLocal from '../../utils/StringLocal'
import VALUES from '../../utils/values';

var __assign = (this && this.__assign) || function () {
  __assign = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
              t[p] = s[p];
      }
      return t;
  };
  return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
          r[k] = a[j];
  return r;
};
class LineChart extends AbstractChart {
  componentWillReceiveProps = function(nextProps) {
    //console.log("componentWillReceiveProps nextProps : " + JSON.stringify(nextProps));
    this.forceUpdate()
  }

  getPropsForDots = function (x, i) {
    var _a = this.props, getDotProps = _a.getDotProps, chartConfig = _a.chartConfig;
    if (typeof getDotProps === "function") {
        return getDotProps(x, i);
    }
    var _b = chartConfig.propsForDots, propsForDots = _b === void 0 ? {} : _b;
    return __assign({ r: "4" }, propsForDots);  
  };
  renderDots  = config =>{
    const { data, width, height, paddingTop, paddingRight } = config
    var output = [];
    var datas = this.getDatas(data);
    var baseHeight = this.calcBaseHeight(datas, height);
    console.log(baseHeight)
    var _b = this.props, getDotColor = _b.getDotColor, _c = _b.hidePointsAtIndex, hidePointsAtIndex = _c === void 0 ? [] : _c, _d = _b.renderDotContent, renderDotContent = _d === void 0 ? function () {
        return null;
    } : _d;
    var _this = this;

    data.forEach(function (dataset) {
        if (dataset.withDots == false)
            return;
        dataset.data.forEach(function (x, i) {
            if (hidePointsAtIndex.includes(i)) {
                return;
            }
            var cx = paddingRight + (i * (width - paddingRight)) / dataset.data.length;
            var cy = ((baseHeight - _this.calcHeight(x, datas, height)) / 4) * 3 +paddingTop;
            let fill = {fill:_this.getColor(i,1),fontSize:10};
            output.push(<Text origin={cx + ", " + cy} key={Math.random()} x={cx} textAnchor="middle" y={cy-8} {...fill}>
                {x}
            </Text>);
            output.push(<Circle key={Math.random()} cx={cx} cy={cy} fill={typeof getDotColor === "function"
                ? getDotColor(x, i)
                : _this.getColor(dataset, 0.9)} {..._this.getPropsForDots(x, i)}/>, <Circle key={Math.random()} cx={cx} cy={cy} r="14" {...fill} />, renderDotContent({ x: cx, y: cy, index: i, indexData: x }));
        });

    });
    return output;
  };


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
    const { data, width, height, paddingRight, offset=18,
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
          fill={`rgba(243,243,243,1)`}
        />)
    })
  }

  renderLineDots = config => {
    const { showLine,width, height, paddingRight, paddingTop,
       data, horizontalOffset = 20,min,max,uniqueUnit } = config
    let output = [];
    let output2 =[];
    var datas = this.getDatas(data);
    var baseHeight = this.calcBaseHeight(datas, height);
    var _this = this;
    console.log(baseHeight)
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
          var cx = ( horizontalOffset+gap +(i * (width-horizontalOffset) / (dataset.data.length)));//paddingRight + (i * (width - paddingRight)) / dataset.data.length;
          var cy = ((baseHeight - _this.calcHeight(x, datas, height)) / 4) * 3 +paddingTop;
          output.push (
            <Circle
              key={Math.random()}
              cx={cx}//{ ( horizontalOffset+gap +(i * (width-horizontalOffset) / (dataset.data.length)))}
              cy={cy}//{(((height / 4 * 3 * (1 - ((x - lmin) / ((lmax-lmin)|| 1))))) + paddingTop)}
              r="3"
              fill={this.getColor(index,1 )}
            />)
          output2.push(
            <Circle
            key={Math.random()}
            cx={cx}//{ ( horizontalOffset+gap +(i * (width-horizontalOffset) / (dataset.data.length)))}
            cy={cy}//{(((height / 4 * 3 * (1 - ((x - lmin) / ((lmax-lmin)|| 1))))) + paddingTop)}
            r="4"
            fill={this.getDotColor(index,1 )}
          />
            )
        })
      }
    })

    return (
      <G>
        {output2}
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
              fill={this.getTextColor(index, 1)}
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
      var paddingTop = (labels2[i] && labels2[i] != "") ? 5 : -5;
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
    if (this.props.bezier) {
      return this.renderBezierLine({
          data: data,
          width: width,
          height: height,
          paddingRight: paddingRight,
          paddingTop: paddingTop
      });
  }
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
            stroke={this.getColor(index, 1)}
            strokeWidth={2}
            stroke-linejoin="round"
          />
        )
      }
    })
    //console.log("renderLine output : " + output);
    return (
      output
    )
  }

  getDatas = function (data) {
    return data.reduce(function (acc, item) { return (item.data ? __spreadArrays(acc, item.data) : acc); }, []);
  };

  getBezierLinePoints = function (dataset, _a) {
    var width = _a.width, height = _a.height, paddingRight = _a.paddingRight, paddingTop = _a.paddingTop, data = _a.data,horizontalOffset=20;
    if (dataset.data.length === 0) {
        return "M0,0";
    }
    var gap = ((width-horizontalOffset) / (dataset.data.length))/2
    var datas = this.getDatas(data);
    var x = function (i) {
      
        return ( horizontalOffset+gap +(i * (width-horizontalOffset) / (dataset.data.length)));//Math.floor(paddingRight + (i * (width - paddingRight)) / dataset.data.length);
    };
    var baseHeight = this.calcBaseHeight(datas, height);
    
    var y = function (i) {
      var yHeight = this.calcHeight(dataset.data[i], datas, height);
      ((height / 4 * 3 * (1 - ((x - Math.min(...dataset.data)) / this.calcScaler(dataset.data)))) + paddingTop)
        return Math.floor(((baseHeight - yHeight) / 4) * 3 + paddingTop);
    }.bind(this)
    return ["M" + x(0) + "," + y(0)]
        .concat(dataset.data.slice(0, -1).map(function (_, i) {
        var x_mid = (x(i) + x(i + 1)) / 2;
        var y_mid = (y(i) + y(i + 1)) / 2;
        var cp_x1 = (x_mid + x(i)) / 2;
        var cp_x2 = (x_mid + x(i + 1)) / 2;
        return ("Q " + cp_x1 + ", " + y(i) + ", " + x_mid + ", " + y_mid +
            (" Q " + cp_x2 + ", " + y(i + 1) + ", " + x(i + 1) + ", " + y(i + 1)));
    }))
        .join(" ");
};

  getColor(index,opacity) {

    if(index == 1) {
      return `rgba(255, 197, 61, ${opacity})`;
    } else if(index == 0) {
      return `rgba( 44, 144, 217,${opacity})`;
    } else {
      return `rgba(203,203,203, ${opacity})`;
    }
  }
  getDotColor(index,opacity) {

    if(index == 1) {
      return `rgba(229, 241, 251, ${opacity})`;
    } else if(index == 0) {
      return `rgba( 245, 238, 218,${opacity})`;
    } else {
      return `rgba(235,235,235, ${opacity})`;
    }
  }

  getTextColor(index,opacity) {
    if(index == 1) {
      return `rgba(255, 197, 61,${opacity})`;
    } else if(index == 0) {
      return `rgba(44, 144, 217,  ${opacity})`;
    } else {
      return `rgba(203,203,203, ${opacity})`;
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
          stroke={this.getColor(index,1)}
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
    const { data, visible, width, height, paddingTop, offset=18,
            paddingRight, showLine, isDoubleData, max , isTripleData} = config;
    if(data == undefined)return;
    if(visible == false)return;
    return data.map((x, i) => {
      var barHeight = height / 4 * 3 * ((x - Math.min(...data)) / this.calcScaler(data));
      if(typeof max != "undefined") {
        barHeight = height / 4 * 3 * (x / (max || Math.max(data)));
        isNaN(barHeight) && (barHeight = 0);
      }
      var barWidth =  (width - offset)*0.08
      if( data.length >8){
          barWidth =  ((width - offset)/data.length) *0.5
      }
      var shift =  ((width - offset) / data.length ) /2 - barWidth/2
      if(isDoubleData){
        barWidth =(barWidth/2)>10 ? 10:(barWidth/2);
        shift =  ((width - offset) / data.length ) /2 - barWidth*1.1
      }else if(isTripleData){
          barWidth = barWidth/3;
          shift =  ((width - offset) / data.length ) /3 - barWidth*1.5
      }else{
        barWidth=10;
        shift = ((width - offset) / data.length ) /2 - barWidth/2
      }

      return (
        <Rect
          key={Math.random()}
          x={((i * (width - paddingRight) / data.length) +offset+shift)}
          y={(((height / 4 * 3) - barHeight) + paddingTop)}
          width={barWidth}
          height={barHeight}
          fill={this.getColor(showLine?1:0,1)}
        />)
    })
  }

  renderBarsText = config => {
    const { data, visible, width, height, paddingTop, offset=18, viewNumber,
            paddingRight, showLine, isDoubleData, max, isTripleData } = config
    if(data == undefined)return;
    if(visible == false)return;
    if(!viewNumber)return;
    return data.map((x, i) => {
      var barHeight = height / 4 * 3 * ((x - Math.min(...data)) / this.calcScaler(data));
      if(typeof max != "undefined") {
        barHeight = height / 4 * 3 * (x / (max || Math.max(data)));
        isNaN(barHeight) && (barHeight = 0);
      }
      var barWidth =  (width - offset)*0.08
      if( data.length >8){
          let newW = ((width - offset)/data.length) *0.5;
          if(barWidth>newW) barWidth = newW;
          //barWidth =  ((width - offset)/data.length) *0.5
      }
      var shift =  ((width - offset) / data.length ) /2
      if(isDoubleData){
          barWidth =barWidth/2;
          shift =  ((width - offset) / data.length ) /2 - barWidth*0.7
      }else if(isTripleData){
        barWidth =barWidth/3;
        shift =  ((width - offset) / data.length ) /3 - barWidth*1.5
      }
      if(x>=0)
      {return (<Text
          key={Math.random()}
          x={((i * (width - paddingRight) / data.length) +offset+shift)}
          textAnchor="middle"
           y={(((height / 4 * 3) - barHeight) + paddingTop -5)}
          fontSize={isTripleData?10:12}
          fill={this.getColor(showLine?1:0,1)}
        >{DataHandler.numberFormat(x)}
        </Text>)}
    })
  }

  renderBars2 = config => {
    const { data, visible, width, height, paddingTop, offset=18, paddingRight,
            showLine, max,isTripleData, isDoubleData } = config
    if(data == undefined) return;
    if(visible == false) return;
    return data.map((x, i) => {
      var barHeight = height / 4 * 3 * ((x - Math.min(...data)) / this.calcScaler(data));
      if(typeof max != "undefined") {
        barHeight = height / 4 * 3 * (x / (max || Math.max(data)));
        isNaN(barHeight) && (barHeight = 0);
      }
      var barWidth = (width - offset)*0.08;
      if( data.length >8){
        if(isDoubleData) barWidth =  ((width - offset)/data.length) * 0.5;
        else if(isTripleData) barWidth =  ((width - offset)/data.length) *0.5;
      }
      var shift =  ((width - offset) / data.length ) /2 - barWidth/2
      if(isDoubleData){
          barWidth =(barWidth/2)>10 ? 10:(barWidth/2);
          shift =  ((width - offset) / data.length ) /2 + barWidth*0.5
      }else if(isTripleData){
          barWidth =barWidth/3;
          shift =  ((width - offset) / data.length ) /3
      }
      return (
        <Rect
          key={Math.random()}
          x={((i * (width - paddingRight) / data.length) +offset+shift)}
          y={(((height / 4 * 3) - barHeight) + paddingTop)}
          width={barWidth}
          height={barHeight}
          fill={this.getColor((showLine && isDoubleData)?2:1,1)}
        />)
    })
  }

  renderBarsText2 = config => {
    const { data, width, height,viewNumber, visible,
         paddingTop, offset=18, paddingRight, showLine, max,isDoubleData, isTripleData } = config
    if(data == undefined) return;
    if(visible == false) return;
    if(!viewNumber) return;
    return data.map((x, i) => {
      var barHeight = height / 4 * 3 * ((x - Math.min(...data)) / this.calcScaler(data));
      if(typeof max != "undefined") {
        barHeight = height / 4 * 3 * (x / (max || Math.max(data)));
        isNaN(barHeight) && (barHeight = 0);
      }
      var barWidth =  (width - offset)*0.08
      if( data.length >8){
        if(isDoubleData) barWidth =  ((width - offset)/data.length) * 0.5;
        else if(isTripleData) barWidth =  ((width - offset)/data.length) *0.5;
      }
      var shift =  ((width - offset) / data.length )*0.65;
      if(isDoubleData){
        shift =  ((width - offset) / data.length ) /2 + barWidth*0.4
      }else if(isTripleData){
        barWidth =barWidth/3;
        shift =  ((width - offset) / data.length ) /3
      }
      if(x>=0)
      {return (<Text
          key={Math.random()}
          x={((i * (width - paddingRight) / data.length) +offset+shift)}
          textAnchor="middle"
           y={(((height / 4 * 3) - barHeight) + paddingTop -5)}
          fontSize={isTripleData?10:12}
          fill={this.getColor((showLine && isDoubleData)?2:1,1)}
        >{DataHandler.numberFormat(x)}
        </Text>)}
    })
  }

  renderBars3 = config => {
    const { data, visible, width, height, paddingTop, offset=18, paddingRight,
            showLine, max } = config
    if(data == undefined) return;
    if(visible == false) return;
    return data.map((x, i) => {
      var barHeight = height / 4 * 3 * ((x - Math.min(...data)) / this.calcScaler(data));
      if(typeof max != "undefined") {
        barHeight = height / 4 * 3 * (x / (max || Math.max(data)));
        isNaN(barHeight) && (barHeight = 0);
      }
      var barWidth =  (width - offset)*0.08;
      if( data.length >8){
          barWidth =  ((width - offset)/data.length) *0.5
      }
      barWidth =barWidth/3;
      var shift =  ((width - offset) / data.length ) /3 + barWidth*1.5
      
      
      return (
        <Rect
          key={Math.random()}
          x={((i * (width - paddingRight) / data.length) +offset+shift)}
          y={(((height / 4 * 3) - barHeight) + paddingTop)}
          width={barWidth}
          height={barHeight}
          fill={this.getColor(2,1)}
        />)
    })
  }

  renderBarsText3 = config => {
    const { data, width, height,viewNumber, visible,
         paddingTop, offset=18, paddingRight, showLine, max } = config
    if(data == undefined) return;
    if(visible == false) return;
    if(!viewNumber) return;
    return data.map((x, i) => {
      var barHeight = height / 4 * 3 * ((x - Math.min(...data)) / this.calcScaler(data));
      if(typeof max != "undefined") {
        barHeight = height / 4 * 3 * (x / (max || Math.max(data)));
        isNaN(barHeight) && (barHeight = 0);
      }
      var barWidth =  (width - offset)*0.04
      if( data.length >8){
          barWidth =  ((width - offset)/data.length) *0.25
      }
      var shift =  ((width - offset) / data.length )*0.65
      if(x>=0)
      {return (<Text
          key={Math.random()}
          x={((i * (width - paddingRight) / data.length) +offset+shift)}
          textAnchor="middle"
           y={(((height / 4 * 3) - barHeight) + paddingTop -5)}
          fontSize={10}
          fill={this.getColor(showLine?2:2,1)}
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
    //console.log("*1.this.props.data:",JSON.stringify(this.props.data))
    var multi = 1;
    for(var m in data.datasets){
        for(var n in data.datasets[m].data){
            if(data.datasets[m].data[n]<0){
                data.datasets[m].data[n]=0;
            }
        }
    }
    //console.log("*2.this.props.data:",JSON.stringify(data))
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
    for(var n in data.barDataset3){
      if(data.barDataset3[n]<0){
          data.barDataset3[n]=0;
      }
  }
    //console.log("render Line Chart data : ", data);
    var min=0,max=0;
    if(data.datasets.length>0){
      if(data.datasets[0].data.length<9) {
         multi =0.99 ;
      } else {
           multi =data.datasets[0].data.length/9;
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
            let nmin= Math.min(...data.datasets[k].data);
            let nmax= Math.max(...data.datasets[k].data);
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
    var isTripleData=false;
    if(data.barDataset3 && data.barDataset3.length>0) isTripleData=true;
    else if(data.barDataset2 && data.barDataset2.length>0)isDoubleData=true;

    //console.log("isDoubleData:",isDoubleData);
    //console.log(" isTripleData:", isTripleData);
    var config = {
      height:height-(this.props.viewNumber?21:20),width,showLine,viewNumber,
      renderEndlabel,uniqueUnit,min,max,isDoubleData, isTripleData
    }
    //console.log('LineChart viewNumber ',viewNumber)
    return (
      <View style={[style,{flexDirection:'row'}]}>
        <ScrollView  horizontal={true}>
        <Svg height={height+5} width={width} key={Math.random()}>
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
            {this.renderLine({
              ...config,
              paddingRight,
              paddingTop,
              // data: data.datasets[0].data
              data: data.datasets
            })}
            </G>
            <G>
            {this.renderBars3({
              ...config,
              data: data.barDataset3,
              max: data.barMax,
              visible: data.barDataset3Visible,
              paddingTop,
              paddingRight
            })}
            </G>
            <G>
            {this.renderBarsText3({
              ...config,
              data: data.barDataset3,
              max: data.barMax,
              visible: data.barDataset3Visible,
              paddingTop,
              paddingRight
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
