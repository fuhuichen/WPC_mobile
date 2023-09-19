import React from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import VALUES from '../utils/values';
import {PieChart} from 'react-native-svg-charts'
import I18n from 'react-native-i18n';
export default class CircleItem extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
  }

  render () {
     var radius =this.props.radius?this.props.radius:50;
     var resolution = {
        height:radius, width:radius
    }
    var pieData =[];

    pieData.push({
        value:(100-this.props.value),
        svg: {
            fill:'#D3D4D6',
            onPress: () =>{},
        },
        key: `pie-2`,
    })
    pieData.push({
        value:this.props.value,
        svg: {
            fill: this.props.color,
            onPress: () => console.log('press'),
        },
        key: `pie-0`,
    })

    if(I18n.locale=='en'){
        resolution = {
          marginLeft:20, height:radius+20, width:radius+30
       }
        return (<View  style={ [resolution]}>
                    <PieChart
                        innerRadius={'90%'}
                        style={ { height:radius} }
                        data={ pieData }
                    />
                    <View  style={{ position: 'absolute',
                     top:  0,
                     left: 15,alignItems:'center', justifyContent:'center',
                           height:radius,width:radius}}>
                           <Text  allowFontScaling={false}  style={{color:'#D3D4D6',fontSize:18 }}>
                               {this.props.value+'%'}
                           </Text>
                   </View>
                   <Text  allowFontScaling={false}
                          style={{width:radius+30,textAlign:'center',
                            color:'#D3D4D6',fontSize:13 }}>
                       {this.props.text}
                   </Text>
                </View>);

    }
    return (<View  style={ [resolution]}>
                <PieChart
                    innerRadius={'90%'}
                    style={ { height:radius} }
                    data={ pieData }
                />
                <View  style={{ position: 'absolute',
                 top:  0,
                 left: 0,alignItems:'center', justifyContent:'center',
                       height:radius,width:radius}}>
                       <Text  allowFontScaling={false}  style={{color:'#D3D4D6',fontSize:18 }}>
                           {this.props.value+'%'}
                       </Text>
                       <Text  allowFontScaling={false}  style={{color:'#D3D4D6',fontSize:13 }}>
                           {this.props.text}
                       </Text>
               </View>
            </View>);
  }
}


const styles = StyleSheet.create({
  containerStyle:{
    backgroundColor:VALUES.COLORMAP.dkk_background,
    paddingBottom:20,
    flexDirection:'column',
    alignItems:'center',
    justifyContent:'flex-start',
  },
  backgroundImage: {
  paddingTop:0,
   flex: 1,
   alignSelf: 'stretch',
   width: null,
  }
});
