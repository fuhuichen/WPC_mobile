
import React, {Component} from 'react'
import Svg,{  Defs,
  Stop, G,Circle, Path, Line, Text,  LinearGradient,Polyline} from 'react-native-svg'
import I18n from 'react-native-i18n';
import { Platform } from 'react-native';
export default class RadarChart extends Component
{
  renderDots(){
    const {width,height,radius} = this.props;
    console.log('render dots');
    var list =[7*Math.PI/5 + Math.PI/10 ,
               9*Math.PI/5 + Math.PI/10,
               11*Math.PI/5 + Math.PI/10,
              13*Math.PI/5 + Math.PI/10,
              15*Math.PI/5 + Math.PI/10];

    return list.map(function(c,i){
      var cx = width / 2 + Math.cos(c)*radius;
      var cy = width / 2 + Math.sin(c)*radius;
      return    <Circle
                 key={Math.random()}
                 cx={cx}
                 cy={cy}
                 r={5}
                 stroke="#D3D4D6"
                 strokeWidth={0}
                 fill="#D3D4D6"
                 strokeDasharray={[0, 0]}
                 strokeLinecap="round"
               />
    })

  }

  renderText(){

    const {width,height,radius} = this.props;
    console.log('render text');
    var labels =[I18n.t("bi_sale_values"),
    I18n.t("bi_turnin_rate"),
    I18n.t("bi_people_in")
    ,I18n.t("bi_shopper_count"),
    I18n.t("bi_people_single_buy")]
    var achors =['middle','start','start','end','end']
    var list =[7*Math.PI/5 + Math.PI/10 ,
               9*Math.PI/5 + Math.PI/10,
               11*Math.PI/5 + Math.PI/10,
              13*Math.PI/5 + Math.PI/10,
              15*Math.PI/5 + Math.PI/10];
    return list.map(function(c,i){
      var cx = width / 2 + Math.cos(c)* (radius+10) ;
      var cy = width / 2 + Math.sin(c)* (radius+20)+5;
      if(i==1 && Platform.OS=="ios"){
        cx = cx - 7;
        cy = cy -5;
      }else if(i==4 && Platform.OS=="ios"){
        cx = cx + 8;
        cy = cy - 7;
      }

      var l = labels[i];

      return    <Text
                 key={Math.random()}
                 x={cx}
                 y={cy}
                 textAnchor={achors[i]}
                 fontSize={12}
                 width={12}
                 fill="#64686D"
               >{l}</Text>
    })

  }

  renderTextEn(){

    const {width,height,radius} = this.props;
    console.log('render text');
    var labels =[I18n.t("bi_sale_values"),
    "Turn In","Rate",
    'Visitors','',
    'Transactions', '',
    '' ,'Rev./Trans.']
    var achors =['middle','start','start','start','start','end','end','end','end']
    var list =[7*Math.PI/5 + Math.PI/10 ,
               9*Math.PI/5 + Math.PI/10,
               9*Math.PI/5 + Math.PI/10,
               11*Math.PI/5 + Math.PI/10,
               11*Math.PI/5 + Math.PI/10,
              13*Math.PI/5 + Math.PI/10,
               13*Math.PI/5 + Math.PI/10,
                15*Math.PI/5 + Math.PI/10,
              15*Math.PI/5 + Math.PI/10];
              var shiftX =[ 0 ,
                          0,
                         0,
                         0,
                         0,
                         0,
                        3,
                        25,13];
              var shift =[ 5 ,
                          5,
                         20,
                         5,
                         20,
                        5,
                         20,
                        -40,-25];
    return list.map(function(c,i){
      var cx = width / 2 + Math.cos(c)* (radius+10) +shiftX[i];
      var cy = width / 2 + Math.sin(c)* (radius+20)+shift[i];
      var l = labels[i];

      return    <Text
                 key={Math.random()}
                 x={cx}
                 y={cy}
                 textAnchor={achors[i]}
                 fontSize={12}
                 width={12}
                 fill="#64686D"
               >{l}
               </Text>
    })

  }

  randerPolygon(){

    const {width,height,radius,data} = this.props;
    console.log('randerPolygon',data)

    var list =[7*Math.PI/5 + Math.PI/10 ,
               9*Math.PI/5 + Math.PI/10,
               11*Math.PI/5 + Math.PI/10,
              13*Math.PI/5 + Math.PI/10,
              15*Math.PI/5 + Math.PI/10];

    var points=[]
    var max =0;
    for(var k in data){
      if(data[k]>0)max =k;
    }
    if(max <=0){
      return ;
    }
    for(var k in data){
      var c  = list[k]
      var r  = radius * data[k]/100;
      var cx = width / 2 + Math.cos(c)* r ;
      var cy = width / 2 + Math.sin(c)* r;
      points.push( cx+','+cy);
    }
    //var start = points[0], end=points[points.length-1];
    points.push(points[0])
    console.log(points)
    return    <Polyline
                key={Math.random()}
                points={points.join(' ')}
                fill={'url(#backgroundGradient)'}
                stroke={'#2C90D9'}
                strokeWidth={2}
                />


  }

  renderLines(){
    const {width,height,radius} = this.props;
    var list =[7*Math.PI/5 + Math.PI/10 ,
               9*Math.PI/5 + Math.PI/10,
               11*Math.PI/5 + Math.PI/10,
              13*Math.PI/5 + Math.PI/10,
              15*Math.PI/5 + Math.PI/10];
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
                  key={Math.random()}
                  points={points.join(' ')}
                  fill="none"
                  stroke={"#D3D4D6"}
                  strokeWidth={1}
                  />
    })

  }
  renderRings(){
    const {width,height,radius} = this.props;
    var list = [1,0.8,0.6,0.4,0.2];
    return list.map(function(c,i){
      return    <Circle
                 key={Math.random()}
                 //ref={x => (this.circle = x)}
                 cx={width / 2}
                 cy={height / 2}
                 r={radius*c}
                 stroke="#D3D4D6"
                 strokeWidth={1}
                 fill="transparent"
                 strokeDasharray={[5, 4]}
                 strokeLinecap="round"
               />
    })

  }
  render() {
    const {width,height,radius} = this.props;
    console.log('radar',height,' ',width)
    return (
      <Svg width={width} height={height}>
          <G >
          <Defs>
            <LinearGradient id="LineGradient"  x1="0" y1="0" x2="1"  y2="1">
              <Stop offset="0%" stopColor={'#2C90D9'} stopOpacity="1"/>
              <Stop offset="83%" stopColor={'#2C90D9'} stopOpacity="1"/>
              <Stop offset="96%" stopColor={'#2C90D9'} stopOpacity="1"/>
            </LinearGradient>
            <LinearGradient id="backgroundGradient" x1="0" y1="0.5"  x2="1"  y2="0.5" >
              <Stop offset="90%" stopColor={'#FFFFFF'} stopOpacity="0.3"/>
              <Stop offset="50%" stopColor={'#7FB4DB'} stopOpacity="0.3"/>
              <Stop offset="10%" stopColor={'#006AB7'} stopOpacity="0.3"/>
            </LinearGradient>
          </Defs>
          <Circle
            ref={x => (this.circle = x)}
            cx={width / 2}
            cy={height / 2}
            r={radius}
            stroke="transparent"
            strokeWidth={0}
            fill="transparent"
            strokeDasharray={[0,0]}
            strokeLinecap="round"
             />
             <G >
            {this.renderRings()}
            </G >
            <G >
            {this.renderDots()}
            </G >
            <G >
            {this.renderLines()}
            </G >
            <G >
            {I18n.locale=='en'?this.renderTextEn():this.renderText()}
            </G >
            <G >
            {this.randerPolygon()}
            </G >
            <Text
                       x={width/2}
                       y={height/2+30}
                       textAnchor={'middle'}
                       fontSize={78}
                       fill="#64686D"
                     >{this.props.total}</Text>
          </G>

      </Svg>
    );
  }
}
