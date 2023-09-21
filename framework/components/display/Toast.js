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
          <View style={[styles.container,
            {   width,height:44,position:'absolute',top:
                theme.dims.header.height+DimUtil.getTopPadding() ,left:0, zIndex:0,
                backgroundColor:bgColor}]}>
            <View style={{height:44,paddingLeft:16,
                  width:"100%",flexDirection:'row',justifyContent:'flex-start',
                alignItems:'center'}}>
              <Icon
              type={icon} mode="static" style={{width:20,height:20,marginRight:5}}/>
              <Typography
                  font={"content03"}
                  text={this.props.text}
                  color={textColor}/>
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
