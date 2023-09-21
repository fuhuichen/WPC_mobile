import React, {Component} from 'react';
import { Context, getTypographyColor, getTypographySize} from '../../FrameworkProvider';
import  {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity
} from 'react-native';
import {Typography} from "../display"
import {IconButton} from "../button"
import {StringUtil,DimUtil} from "../../utils"
import {COLORS} from '../../enums'
class DataInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hidePassword:true,
    }
  }

  render() {

    const {color,alert,mode,text,hint,text2,multiSelect} = this.props;
    const{hidePassword} =this.state;
    let multiText = [];
    if(multiSelect && text){
       const {width,height} = DimUtil.getDimensions("portrait")
       let len = 0;
       let availLength = width - 120;
       for(var k in text){
         console.log(text[k])
         len = len + StringUtil.getByteVal(text[k])*8 + 24
         console.log(len)
         if(len > availLength ){
            let count = text.length - k ;
            if(count>0)multiText.push("+"+count)
            break;
         }
         else{
           multiText.push(text[k])
         }
       }
    }
    return (
      <Context.Consumer>
        {({ theme}) => (
          <View style={[{borderWidth:1,borderRadius:4,
             width:'100%',borderColor:theme.colors.selection.borderColor},this.props.style]}>
            <TouchableOpacity
              onPress={()=>this.props.onPress()}
             style={[{
                  width:'100%',justifyContent:"flex-start",alignItems:'center',flexDirection:'row',
                  backgroundColor:theme.colors.selection.backgroundColor,
                  color:theme.colors.selection.color},
                  theme.dims.selection,
                  this.props.style&&this.props.style.backgroundColor?{backgroundColor:this.props.style.backgroundColor}:{},
                  getTypographySize(theme,this.props.font,"cotent03")]}>
              {multiSelect && text?
                <View style={{flexDirection:'row',alignItems:'center'}}>
                {multiText.map(function(item,i){
                      return    <View
                                key={i}
                                style={{paddingRight:12,paddingLeft:12,height:28,
                                borderRadius:12,alignItems:'center',justifyContent:'center',
                              backgroundColor:COLORS.FOCUS_BG,marginRight:8}}>
                                <Typography
                                color={this.props.color?this.props.color:"gray"}
                                text={item}
                                font={"content03"}/>
                                </View>}.bind(this))
                }
                </View>:<Typography
                      style={{marginRight:30}}
                      color={this.props.color?this.props.color:text&&text.length>0?"primary":"gray"}
                      text={text&&text.length>0?text:hint}
                      font={"content03"}/>}

              <IconButton
                onPress={()=>this.props.onPress()}
                type={this.props.icon?this.props.icon:"list-enter"}
                text={""}
                style={{position:'absolute',right:0}}/>
            </TouchableOpacity>
            {text2?<View style={{flex:1,height:1,backgroundColor:theme.colors.selection.borderColor,marginLeft:8,marginRight:8}}/>:null}
            {text2?<TouchableOpacity
              onPress={()=>this.props.onPress2()}
             style={[{
                  width:'100%',justifyContent:"flex-start",alignItems:'center',flexDirection:'row',
                  backgroundColor:theme.colors.selection.backgroundColor,
                  color:theme.colors.selection.color},
                  theme.dims.selection,
                  getTypographySize(theme,this.props.font,"cotent03"),]}>
              <Typography
                  style={{marginRight:30}}
                  color={this.props.color?this.props.color:text2&&text2.length>0?"primary":"gray"}
                  text={text2&&text2.length>0?text2:hint}
                  font={"content03"}/>
              <IconButton
                onPress={()=>this.props.onPress()}
                type={this.props.icon?this.props.icon:"list-enter"}
                text={""}
                style={{position:'absolute',right:0}}/>
            </TouchableOpacity>:null}
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
