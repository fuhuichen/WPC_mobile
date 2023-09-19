import React, {Component} from 'react';
import {
    View,
    Text,
    Dimensions,
    Switch
} from "react-native";
import BoxShadow from "react-native-shadow/lib/BoxShadow";

const {width} = Dimensions.get('screen');
export default class SettingSwitch extends Component {

    state = {
       
    };

    render() {
        return (
            <View>
                <BoxShadow setting={{width:width-32, height:46, color:"#000000",
                    border:1, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:15,marginLeft:16}}}>
                    <View style={{borderColor:'#fff', borderWidth:0,height:46,width:width-32,borderRadius: 10,backgroundColor:'#fff'}}>
                    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems: 'center',height:46,paddingLeft:12,paddingRight:12}} >
                             <Text style={{width:250,color:'#9d9d9d',textAlignVertical:'center'}}>{this.props.title}</Text>
                             <Switch onValueChange={(value) => this.props.onValueChange(value)} value={this.props.value} />
                        </View>            
                    </View>
                </BoxShadow>
            </View>
        )
    }
}


