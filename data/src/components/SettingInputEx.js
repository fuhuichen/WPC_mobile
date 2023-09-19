import React, {Component} from 'react';
import {
    View,
    Text,
    Dimensions,
    TextInput,
} from "react-native";
import BoxShadow from "react-native-shadow/lib/BoxShadow";
import I18n from "react-native-i18n";

const {width} = Dimensions.get('screen');
export default class SettingInputEx extends Component {

    state = {
       select: false
    };

    render() {
        let editable = this.props.editable != null ?  this.props.editable : true;
        let borderColor = this.state.select ? '#2C90D9': '#fff';
        let backgroundColor = editable ? '#fff' : '#ebf1f4';
        let borderWidth = editable ? 1 : 0;
        let keyboardType = this.props.keyboardType ? this.props.keyboardType : 'default';
        let placeholder = this.props.placeholder ? this.props.placeholder: editable ? I18n.t('Enter info') : '';
        let unit = null;  
        if (this.props.unit) { unit = (
           <Text style={{color:'#666666',fontSize:12}}>{this.props.unit}</Text> 
        )} 

        return (
            <View>
                <Text style={{color:'#666666',fontSize:12,marginTop:16,marginLeft:16}}>{this.props.title}</Text> 
                <BoxShadow setting={{width:width-32, height:46, color:"#000000",
                    border:1, radius:10, opacity:0.1, x:0, y:1, style:{marginTop:4,marginLeft:16,marginBottom:4}}}>
                    <View style={{borderColor, borderWidth:borderWidth,height:46,width:width-32,borderRadius: 10,backgroundColor:backgroundColor}}>
                    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems: 'center',paddingLeft:12,paddingRight:12}} >
                           <TextInput style={{width:width-130,height:46,color:'#404554'}} value={this.props.value}
                                   placeholder={placeholder}
                                   placeholderTextColor={'#c2c6cc'}
                                   returnKeyType='done'
                                   editable={editable}
                                   keyboardType={keyboardType}
                                   onChangeText={(text) =>{
                                       this.props.onChangeText(text);
                                   }}
                                   onFocus= {() =>{
                                       this.setState({select:true});
                                   }}
                                   onBlur= {() =>{
                                       this.setState({select:false});
                                   }}/>
                            {unit}         
                     </View>
                    </View>
                </BoxShadow>
            </View>
        )
    }
}


