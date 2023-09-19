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
      year:"",
      month:"",
      day:"",
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
  clear(){
    this.setState({year:"",month:"",day:""})
    this.state.year = "";
    this.state.month= "";
    this.state.day = "";
    this.changeText();
  }
  init(){

  }
  changeText(){
    const {  onChangeText}=this.props;
    const {year,month,day} = this.state;
    let output = year +"/"+month + "/" + day;
    if(  onChangeText) onChangeText(output)
  }
  render() {
    const {color,alert,mode,limit,invalidText} = this.props;
    const{hidePassword,focus,year,month,day} =this.state;
    return (
      <Context.Consumer>
        {({ theme}) => (
          <View style={[theme.dims.input,{width:'100%',backgroundColor:this.props.disabled?theme.colors.input.borderColor:"#FFF",
          flexDirection:'row',justifyContent:'flex-start',alignItems:'center',color:invalidText?"#CA4940":"#2B2B2B"},
            limit?{paddingRight:50,height:44,borderRadius:0}:null,this.props.style]}>
            <TextInput
              ref={(ele) => {
                this.yearInput = ele;
              }}
              onFocus={()=>this.setState({focus:true})}
              onBlur={()=>this.setState({focus:false})}
              keyboardType={mode=="password"||mode=="email"||mode=="scan"||mode=="text"|| !mode?'default':mode}
              placeholderTextColor={Appearance.getColorScheme()=='light'?theme.colors.input.placeholder:"#BBB"}
              underlineColorAndroid="transparent"
              autoCorrect={false}
              placeholder={"2023"}
              value={year}
              maxLength={4}
              numberOfLines={1}
              keyboardType = 'numeric'
              onSubmitEditing={()=>this.handleSubmit()}
              onKeyPress={(e)=>this.handleKeyDown(e)}
              onChangeText={(text)=>{
                let output = text.replace(/[^0-9]/g, '')
                this.state.year = output;
                this.setState({year:output})
                if(this.state.year.length==4){
                  this.monthInput.focus();
                }
                this.changeText();
              }}
              style={[getTypographySize(theme,this.props.font,"text01"),{width:40,color:invalidText?"#CA4940":"#2B2B2B"}]}>
            </TextInput >
            <Typography text={"/" } color="text" font="text02" style={{marginRight:4}}/>
            <TextInput
              ref={(ele) => {
                this.monthInput = ele;
              }}
              onFocus={()=>this.setState({focus:true})}
              onBlur={()=>this.setState({focus:false})}
              keyboardType={mode=="password"||mode=="email"||mode=="scan"||mode=="text"|| !mode?'default':mode}
              placeholderTextColor={Appearance.getColorScheme()=='light'?theme.colors.input.placeholder:"#BBB"}
              underlineColorAndroid="transparent"
              autoCorrect={false}
              placeholder={"12"}
              value={month}
              maxLength={2}
              numberOfLines={1}
              keyboardType = 'numeric'
              onSubmitEditing={()=>this.handleSubmit()}
              onKeyPress={(e)=>this.handleKeyDown(e)}
              onChangeText={(text)=>{
                let output = text.replace(/[^0-9]/g, '')
                this.state.month = output;
                this.setState({month:output})
                if(this.state.month.length==2){
                  this.dayInput.focus();
                }
                if(this.state.month.length==0){
                  this.yearInput.focus();
                }
                this.changeText();
              }}
              style={[getTypographySize(theme,this.props.font,"text01"),{width:Platform.OS === 'ios'?20:30,color:invalidText?"#CA4940":"#2B2B2B"}]}>
            </TextInput >
            <Typography text={"/" } color={"text"} font="text02" style={{marginRight:4}}/>
            <TextInput
              ref={(ele) => {
                this.dayInput = ele;
              }}
              onFocus={()=>this.setState({focus:true})}
              onBlur={()=>this.setState({focus:false})}
              keyboardType={mode=="password"||mode=="email"||mode=="scan"||mode=="text"|| !mode?'default':mode}
              placeholderTextColor={Appearance.getColorScheme()=='light'?theme.colors.input.placeholder:"#BBB"}
              underlineColorAndroid="transparent"
              autoCorrect={false}
              placeholder={"25"}
              value={day}
              maxLength={2}
              numberOfLines={1}
              keyboardType = 'numeric'
              onSubmitEditing={()=>this.handleSubmit()}
              onKeyPress={(e)=>this.handleKeyDown(e)}
              onChangeText={(text)=>{
                let output = text.replace(/[^0-9]/g, '')
                this.state.day = output;
                this.setState({day:output})
                if(this.state.day.length==0){
                  this.monthInput.focus();
                }
                this.changeText();
              }}
              style={[getTypographySize(theme,this.props.font,"text01"),{width:Platform.OS === 'ios'?20:30,color:invalidText?"#CA4940":"#2B2B2B"}]}>
            </TextInput >
            <IconButton
                  onPress={()=>{this.clear()}}
                  type={"clear"}
                  mode="static"
                  text={""}
                  iconStyle={{width:24,height:24}}
                  style={{position:'absolute',right:10}}/>
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
