import React, {Component} from 'react';
import { Context } from '../../FrameworkProvider';
import {Icon} from "../display"
import {CircleText} from "../input"
import {COLORS} from "../../enums"
import  {
  StyleSheet,
  View,
  Text,
  TouchableHighlight
} from 'react-native';
import {DimUtil} from "../../utils"
class IconButton extends Component {
  constructor(props) {
    super(props);
    this.state={
      pressed:false
    }
  }
  render() {
    const {width,height} = DimUtil.getDimensions("portrait");
    const {type,mode,font} = this.props;
    const {pressed} = this.state;
    //console.log("Status Bar="+DimUtil.getTopPadding())
    //console.log(width,height)
    return (
      <Context.Consumer>
        {({ theme}) => (
          <TouchableHighlight
            activeOpacity={1}
            underlayColor={"transparent"}
            onPressIn={()=>{this.setState({pressed:true})}}
            onPressOut={()=>{this.setState({pressed:false});if(this.props.onPress){this.props.onPress()}}}
            style={[
            {
                borderRadius:theme.dims.button.borderRadius,
                flexDirection:'row',justifyContent:'center',alignItems:'center',
                height:50,height:50},this.props.style]}>
              <View style={{flexDirection:'row',alignItems:'center'}}>
                <Icon
                  type={pressed?"filter-active":"filter-normal"}/>
                <CircleText
                    style={{width:20,height:20,position:'absolute',right:3,top:0,backgroundColor:COLORS.SECONDARY}}
                    font={"content03"}
                    text={this.props.text}
                    color={font?font:'secondary'}/>
              </View>
          </TouchableHighlight >
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

export default IconButton;
