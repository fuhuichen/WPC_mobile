import React, {Component} from 'react';
import { Appearance } from 'react-native'
import { Context, getTypographyColor, getTypographySize} from '../../FrameworkProvider';
import  {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity
} from 'react-native';
import {IconButton} from "../button"
import {DimUtil} from "../../utils"
class SearchInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hidePassword:true,
      focus:false,
    }
  }

  handleSubmit(){
    if(this.props.onEnter){
       this.props.onEnter()
    }
  }
  render() {
    //console.log("Appearance.getColorScheme()="+Appearance.getColorScheme())
    const {color,alert,mode} = this.props;
    const{hidePassword,focus} =this.state;
    return (
      <Context.Consumer>
        {({ theme}) => (
          <View style={[{flex:1,flexDirection:'row',alignItems:'center'}]}>
            <TextInput
              onFocus={()=>this.setState({focus:true})}
              onBlur={()=>this.setState({focus:false})}
              keyboardType={mode=="password"?'default':'email-address'}
              placeholderTextColor={Appearance.getColorScheme()=='light'?theme.colors.input.placeholder:"#BBB"}
              underlineColorAndroid="transparent"
              autoCorrect={false}
              placeholder={this.props.placeholder}
              secureTextEntry={hidePassword && mode=="password"}
              value={this.props.value}
              editable={!this.props.disabled}
              onSubmitEditing={()=>this.handleSubmit()}
              onChangeText={(text)=>{if(this.props.onChangeText)this.props.onChangeText(text)}}
              style={[
              { width:"100%",
                borderColor:focus?theme.colors.input.focusColor:alert? theme.colors.input.alertColor: theme.colors.input.borderColor,
                backgroundColor:this.props.disabled?theme.colors.input.borderColor:"#E3E3E3",
                color:focus?theme.colors.input.focusColor:this.props.disabled?theme.colors.input.disable.color: alert?
                ztheme.colors.input.alertColor:theme.colors.input.color},
                theme.dims.input,
                getTypographySize(theme,this.props.font,"text02"),
               this.props.style,{paddingRight:40,paddingLeft:40,height:40}]}>
            </TextInput >
            <IconButton
              onPress={()=>{}}
              mode={"static"}
              type={"text-fields-search-normal"}
              text={""}
              iconStyle={{width:24,height:24,marginLeft:12}}
              style={{position:'absolute',left:2}}/>
              {this.props.value&&this.props.value.length>0?<IconButton
              onPress={()=>{this.props.onClear()}}
                type={"clear"}
                mode="static"
                text={""}
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

export default SearchInput;
