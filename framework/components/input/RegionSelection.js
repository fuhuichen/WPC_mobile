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
import {StringUtil,DimUtil,LangUtil} from "../../utils"
import {COLORS} from '../../enums'
class DataInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
   const {width,height} = DimUtil.getDimensions("portrait");
    const {color,alert,mode,text,hint,text2,multiSelect,value,type} = this.props;
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
    console.log(value)
    return (
      <Context.Consumer>
        {({ theme}) => (
          <View style={[{borderWidth:0,
             width:'100%',borderColor:theme.colors.selection.borderColor},this.props.style]}>
            <TouchableOpacity
              onPress={()=>this.props.onPress()}
             style={[{
                  width:'100%',justifyContent:"flex-start",alignItems:'center',flexDirection:'row',
                  backgroundColor:theme.colors.selection.backgroundColor,
                  color:theme.colors.selection.color},
                  theme.dims.selection,
                  this.props.style&&this.props.style.backgroundColor?{backgroundColor:this.props.style.backgroundColor}:{},
                  getTypographySize(theme,this.props.font,"cotent03"),this.props.style]}>
              {multiSelect && text?
                <View style={{flexDirection:'row',alignItems:'center'}}>
                {multiText.map(function(item,i){
                      return    <View
                                key={i}
                                style={{paddingRight:12,paddingLeft:12,height:28,
                                alignItems:'center',justifyContent:'center',
                              backgroundColor:COLORS.FOCUS_BG,marginRight:8}}>
                                <Typography
                                color={this.props.color?this.props.color:"gray"}
                                text={item}
                                font={"content03"}/>
                                </View>}.bind(this))
                }
                </View>:<Typography
                      style={{marginRight:30}}
                      color={"text"}
                      text={text&&text.length>0?text:hint}
                      font={"text01"}/>}
              {value?type=="string"?<Typography
                style={{textAlign:'right',marginRight:23,flex:1}}
                color={"grayText"}
                text={value}
                font={"text01"}/>:
                <View style={{position:'absolute',right:33,
                backgroundColor:'#EAF6FF',width:24,height:24,borderRadius:12,justifyContent:'center',alignItems:'center'}}><Typography
                            color={"primary"}
                            text={value.length}
                            font={"text01"}/></View>:
                            <Typography
                              style={{position:'absolute',right:33}}
                              color={"grayText"}
                              text={LangUtil.getStringByKey("common_all")}
                              font={"text01"}/>}
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
                  font={"text01"}/>
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
