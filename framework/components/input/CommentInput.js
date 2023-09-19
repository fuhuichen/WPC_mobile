import React, {Component} from 'react';
import { Context, getTypographyColor, getTypographySize} from '../../FrameworkProvider';
import  {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { Appearance } from 'react-native'
import {IconButton} from "../button"
import {Typography} from "../display"
import {DimUtil,StringUtil} from "../../utils"
class DataInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hidePassword:true,
      focus:false,
    }
  }
  handleKeyDown(e){
    //console.log(e.nativeEvent.key)
    if(e.nativeEvent.key=='Enter' && this.props.onEnter){
       this.props.onEnter()
    }
  }
  handleSubmit(){
    if(this.props.onEnter){
       this.props.onEnter()
    }
  }
  render() {
    const {color,alert,mode,limit} = this.props;
    const{hidePassword,focus} =this.state;
    return (
      <Context.Consumer>
        {({ theme}) => (
          <View style={[{flex:1}]}>
            <TextInput
              onFocus={()=>this.setState({focus:true})}
              onBlur={()=>this.setState({focus:false})}
              keyboardType={mode=="password"||mode=="email"||mode=="scan"||mode=="text"|| !mode?'default':mode}
              placeholderTextColor={Appearance.getColorScheme()=='light'?theme.colors.input.placeholder:"#BBB"}
              underlineColorAndroid="transparent"
              autoCorrect={false}
              placeholder={this.props.placeholder}
              secureTextEntry={hidePassword && mode=="password"}
              value={this.props.value}
              editable={!this.props.disabled}
              returnKeyType={limit?"done":null}
              maxLength={limit}
              numberOfLines={1}
              onSubmitEditing={()=>this.handleSubmit()}
              onKeyPress={(e)=>this.handleKeyDown(e)}
              onChangeText={(text)=>{

                if(limit  &&StringUtil.getByteVal(text)>limit){
                    return;
                }
                if(this.props.onChangeText)this.props.onChangeText(text)}
              }
              style={[
              { borderWidth:0,
                borderColor:focus?theme.colors.input.focusColor:alert? theme.colors.input.alertColor: theme.colors.input.borderColor,width:'100%',
                backgroundColor:this.props.disabled?theme.colors.input.borderColor:"#F0F0F0",
                color:focus?"#2B2B2B":this.props.disabled?theme.colors.input.disable.color: alert? theme.colors.input.alertColor:theme.colors.input.color},
                theme.dims.input,limit?{paddingRight:50,height:44,borderRadius:8}:null,
                getTypographySize(theme,this.props.font,"cotent03"),
               this.props.style]}>
            </TextInput >
            {mode=="password"?<IconButton
              onPress={()=>this.setState({hidePassword:!hidePassword})}
              mode={"static"}
              type={hidePassword?"password-hide":"password-show"}
              text={""}
              style={{position:'absolute',right:10}}/>:null}
              {mode=="scan"?<IconButton
                onPress={()=>{this.props.onPress()}}
                type={"scan"}
                text={""}
                style={{position:'absolute',right:10}}/>:null}
                {this.props.value&&this.props.value.length>0?<IconButton
                  onPress={()=>{this.props.onPress()}}
                  type={"clear"}
                  mode="static"
                  text={""}
                  iconStyle={{width:24,height:24}}
                  style={{position:'absolute',right:10}}/>:null}
          </View>
        )}
      </Context.Consumer>
    );
  }
}
const styles = StyleSheet.create({
    container: {
       alignItems:'center'
    }
});

export default DataInput;
