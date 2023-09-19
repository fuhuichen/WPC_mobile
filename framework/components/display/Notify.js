import React, {Component} from 'react';
import { Context } from '../../FrameworkProvider';
import  {
  StyleSheet,
  View,
  Text,
  StatusBar,
} from 'react-native';
import {Typography,Icon} from "../display"
import {IconButton} from "../button"
import {DimUtil} from "../../utils"

class Toast extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const {width,height} = DimUtil.getDimensions("portrait")
    const {type} =this.props;
    let textColor = ""
    let bgColor = ""
    let icon = ""
    if(type == "success"){
      icon = "toast-successful"
      textColor = "#60714B"
      bgColor= "#E7F6D6"
    }
    else if(type == "info"){
      icon = "toast-information"
      textColor = "#006AB7"
      bgColor= "#EAF6FF"
    }
    else if(type == "warning"){
      icon = "toast-warning"
      textColor = "#917520"
      bgColor= "#FFF2C9"
    }
    else {
      icon = "toast-error"
      textColor = "#A8362E"
      bgColor= "#FFE7E5"

    }
    //console.log("Status Bar="+DimUtil.getTopPadding())
    //console.log(width,height)
    return (
      <Context.Consumer>
        {({ theme}) => (
          <View style={[
            {   width:'100%',alignItems:'center',
            justifyContent:'center',height:36,position:'absolute',top:0,
            left:0, zIndex:0,
            },this.props.style]}>
            <View style={{height:36,  paddingLeft:16,paddingRight:16,
                  flexDirection:'row',justifyContent:'flex-start',  backgroundColor:"#3A3A3AAA",borderRadius:24,
                alignItems:'center'}}>
              <Icon
              type={icon} mode="static" style={{width:20,height:20,marginRight:5}}/>
              <Typography
                  font={"text01"}
                  text={this.props.text}
                  color={"#fff"}/>
            </View>
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

export default Toast;
