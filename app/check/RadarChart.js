import React, {Component} from 'react'
import Svg,{Stop, G, Circle, Text, LinearGradient, Polyline} from 'react-native-svg'
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

    renderDots(){
        let {list,width,radius} = this.state;
        return list.map(function(c,i){
            var cx = width / 2 + Math.cos(c)*radius;
            var cy = width / 2 + Math.sin(c)*radius;
            return    <Circle
                cx={cx}
                cy={cy}
                r={5}
                stroke="#7c8aae66"
                strokeWidth={0}
                fill="#7c8aae"
                strokeDasharray={[0, 0]}
                strokeLinecap="round"
            />
        })
    }

    renderText(){
        let {list,width,radius,labels,achors} = this.state;
        return list.map(function(c,i){
            var cx = width / 2 + Math.cos(c)* (radius+10) ;
            var cy = width / 2 + Math.sin(c)* (radius+20)+5;
            var l = labels[i];

            return   <Text
                x={cx}
                y={cy}
                textAnchor={achors[i]}
                fontSize={10}
                fill="#000000"
            >{l}</Text>
        })
    }

    renderPolygon(){
        let {list,width,radius,data} = this.state;

        var points=[];
        list.forEach((item,index)=>{
            var c  = item;
            var r  = radius * data[index];
            var cx = width / 2 + Math.cos(c)* r ;
            var cy = width / 2 + Math.sin(c)* r;
            points.push( cx+','+cy);
        })
        points.push(points[0]);

        return    <Polyline
            points={points.join(' ')}
            fill={'rgba(175,231,252,0.75)'}
            stroke={'rgba(112,112,112,0.55)'}
            strokeWidth={2}
        />
    }

    renderLines(){
        let {list,width,radius} = this.state;
        return list.map(function(c,i){
            var o = c + Math.PI
            var cx1 = width / 2 + Math.cos(c)*radius;
            var cy1 = width / 2 + Math.sin(c)*radius;
            var cx2 = width / 2 ;
            var cy2 = width / 2 ;
            var points=[]
            points.push( cx1+','+cy1);
            points.push( cx2+','+cy2);
            return    <Polyline
                key = {i}
                points={points.join(' ')}
                fill="none"
                stroke={"#D2D2D285"}
                strokeWidth={1}
            />
        })
    }

    renderRings(){
        let {width,height,radius} = this.state;
        var list = [1,0.8,0.6,0.4,0.2];
        return list.map(function(c,i){
            return    <Circle
                ref={x => (this.circle = x)}
                cx={width / 2}
                cy={height / 2}
                r={radius*c}
                stroke="#D2D2D255"
                strokeWidth={1}
                fill="transparent"
                strokeLinecap="round"
            />
        })
    }

    render() {
        let {width,height} = this.state;
        return (
            <Svg width={width} height={height} originX={0} originY={0}>
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

                    {/*<Circle*/}
                        {/*ref={x => (this.circle = x)}*/}
                        {/*cx={width / 2}*/}
                        {/*cy={height / 2}*/}
                        {/*r={radius}*/}
                        {/*stroke="transparent"*/}
                        {/*strokeWidth={0}*/}
                        {/*fill="#7c8aae11"*/}
                        {/*strokeDasharray={[0,0]}*/}
                        {/*strokeLinecap="round"*/}
                    {/*/>*/}
                    {this.renderRings()}
                    {/*{this.renderDots()}*/}
                    {this.renderLines()}
                    {this.renderText()}
                    {this.renderPolygon()}
                </G>
            </Svg>
        );
    }
}
