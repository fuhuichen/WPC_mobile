import React, {Component} from 'react'
import Svg,{Stop, G, Circle, Text, LinearGradient, Polyline,TSpan} from 'react-native-svg'
import Defs from "react-native-svg/src/elements/Defs";

export default class RadarChart extends Component
{
    constructor(props){
        super(props);

        this.state = {
            width: this.props.width,
            height: this.props.height,
            radius: this.props.radius,
            data: this.props.data,
            labels: this.props.labels,
            list: [],
            achors: []
        };
    }
    UNSAFE_componentWillReceiveProps(nextProps) {
        //console.log("shouldComponentUpdate")

        let list = [];
        let achors = [];
        if(nextProps.data && nextProps.data.length>0){

          nextProps.data.forEach((item,index)=>{
              let sigma = 2*Math.PI*index/nextProps.data.length;
              list.push(3*Math.PI/2 + sigma);

              if(sigma === Math.PI || sigma === 0){
                  achors.push('middle');
              }else if(sigma < Math.PI) {
                  achors.push('start');
              }else{
                  achors.push('end');
              }
          });
          var newState ={
              width:nextProps.width,
              height:nextProps.height,
              radius: nextProps.radius,
              data: nextProps.data,
              labels: nextProps.labels,
              list,achors
          };
          //console.log(newState)
          this.setState(newState)
        }
     }
    componentDidMount(){
        let list = [];
        let achors = [];
        this.state.data.forEach((item,index)=>{
            let sigma = 2*Math.PI*index/this.state.data.length;
            list.push(3*Math.PI/2 + sigma);

            if(sigma === Math.PI || sigma === 0){
                achors.push('middle');
            }else if(sigma < Math.PI) {
                achors.push('start');
            }else{
                achors.push('end');
            }
        });

        this.setState({list,achors});
    }


    renderText(){
        let {list,width,height,radius,labels,achors} = this.state;
        return list.map(function(c,i){
            var cx = width / 2 + Math.cos(c)* (radius+10) ;
            var cy = height / 2 + Math.sin(c)* (radius+10)+3;
            var l = labels[i];
            var dx = 0;
            if(l.length>8){
              var l1 = l.substring(0,7)+'...'
              return   <Text
                  x={cx}
                  y={cy}
                  textAnchor={achors[i]}
                  fontSize={10}
                  fill="#86888A"
              >
              {l1}
              </Text>
            }
            else{
              return   <Text
                  x={cx}
                  y={cy}
                  textAnchor={achors[i]}
                  fontSize={10}
                  fill="#86888A"
              >
              {l}
              </Text>
            }

            /*
            return   <Text
                x={cx}
                y={cy}
                textAnchor={achors[i]}
                fontSize={10}
                fill="#86888A"
            >{l}</Text>
            */
        })
    }
    renderLine(){
        let {list,width,height,radius,data} = this.state;


        var nodes =  list.map((item,index)=>{
           var points=[];
            var c  = item;
            var cx = width / 2 + Math.cos(c)*radius ;
            var cy = height / 2 + Math.sin(c)*radius;
            points.push( width / 2+','+height / 2);
            points.push( cx+','+cy);
            return    <Polyline
                points={points.join(' ')}
                fill={'rgba(226,226,226,0.85)'}
                stroke={'rgba(226,226,226,0.85)'}
                strokeWidth={2}
            />
        })
        return nodes;
    }
    renderPolygon(){
        let {list,width,height,radius,data} = this.state;

        var points=[];
        list.forEach((item,index)=>{
            var c  = item;
            var r  = radius * data[index];
            var cx = width / 2 + Math.cos(c)* r ;
            var cy = height / 2 + Math.sin(c)* r;
            points.push( cx+','+cy);
        })
        points.push(points[0]);
//#006AB7
        return    <Polyline
            points={points.join(' ')}
            fill={'rgba(296,151,244,0.25)'}
            stroke={'rgba(0,107,159,0.85)'}
            strokeWidth={1}
        />
    }

    renderDot(){
        let {list,width,height,radius,data} = this.state;


        var nodes =  list.map((item,index)=>{
            var c  = item;
            return    <Circle
                cx={width / 2+ Math.cos(c)*radius}
                cy={height / 2+ Math.sin(c)*radius}
                r={3}
                fill="#E6E6E6"
            />
        })
        return nodes;
    }
    renderRings(){
        let {width,height,radius} = this.state;
        var list = [1,0.8,0.6,0.4];
        return list.map(function(c,i){
            return    <Circle
                cx={width / 2}
                cy={height / 2}
                r={radius*c}
                stroke="#C3C4C588"
                strokeWidth={1}
                fill="transparent"
                strokeDasharray={[3, 3]}
                strokeLinecap="round"
            />
        })
    }

    render() {
        let {width,height} = this.state;
        return (
            <Svg width={width} height={height}  originX={0} originY={0}>
                <Defs>
                    <LinearGradient id="LineGradient" x1="0" y1={height} x2={width} y2={0}>
                        <Stop offset="0" stopColor={'#feba3f'} stopOpacity="0.75"/>
                        <Stop offset="1" stopColor={'#feba3f'} stopOpacity="0.75"/>
                        <Stop offset="2" stopColor={'#feba3f'} stopOpacity="0.75"/>
                    </LinearGradient>
                    <LinearGradient id="backgroundGradient" x1="0" y1={height} x2={width} y2={0}>
                        <Stop offset="0" stopColor={'#6097f4'} stopOpacity="0.25"/>
                        <Stop offset="1" stopColor={'#6097f4'} stopOpacity="0.25"/>
                        <Stop offset="2" stopColor={'#6097f4'} stopOpacity="0.25"/>
                    </LinearGradient>
                </Defs>
                <G >
                    {this.renderLine()}
                    {this.renderDot()}
                    {this.renderRings()}
                    {this.renderText()}
                    {this.renderPolygon()}

                </G>
            </Svg>
        );
    }
}
