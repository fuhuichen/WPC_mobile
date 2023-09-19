import React, {Component} from 'react';
import { Context } from '../../FrameworkProvider';
import {Typography,Icon} from "../display"
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
    const {type,mode,font,iconStyle,textStyle} = this.props;
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
                height:(this.props.height?this.props.height:theme.dims.button.height)},this.props.style]}>
              <View style={{flexDirection:'row',alignItems:'center'}}>
                <Icon style={iconStyle?iconStyle:{width:24,height:24}}
                  type={mode=='static'?type:pressed?type+"-active":type+"-normal"}/>
                <Typography
                    font={textStyle?textStyle:"text00"}
                    text={this.props.text}
                    color={font?font:'primary'}/>
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
