import React, {Component} from 'react';
import {
    View,
    Text,
    Dimensions,
    TouchableOpacity,
    Image
} from "react-native";
import BoxShadow from "react-native-shadow/lib/BoxShadow";

const {width} = Dimensions.get('screen');
export default class SettingSelectEx extends Component {

    state = {

    };

    render() {
        return (
            <View>
                <Text style={{color:'#666666',fontSize:12,marginTop:16,marginLeft:16}}>{this.props.title}</Text>
                <BoxShadow setting={{width:width-32, height:46, color:"#000000",
                    border:1, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:4,marginLeft:16,marginBottom:4}}}>
                    <View style={{borderColor:'#fff', borderWidth:0,height:46,width:width-32,borderRadius: 10,backgroundColor:'#fff'}}>
                    <TouchableOpacity onPress={()=>{this.props.onPress()}} >
                       <View style={{flexDirection:'row',justifyContent:'space-between',paddingLeft:12,paddingRight:12,alignItems:'center',height:46}} >
                             <Text style={{width:250,color:'#404554',textAlignVertical:'center'}}>{this.props.value}</Text>
                             <Image style={{width:18,height:18}} source={require('../../../app/assets/images/Trailingicon2.png')}/>
                        </View>
                    </TouchableOpacity>
                    </View>
                </BoxShadow>
            </View>
        )
    }
}
