import React, {Component} from 'react';
import { Context } from '../../FrameworkProvider';
import {Typography} from "../display"
import {COLORS} from "../../enums"
import  {
  StyleSheet,
  View,
  Text,
  TouchableHighlight
} from 'react-native';
import {DimUtil} from "../../utils"
class Header extends Component {
  constructor(props) {
    super(props);
    this.state={
      pressed:false
    }
  }
  render() {
    const {width,height} = DimUtil.getDimensions("portrait");
    const {pressed} = this.state;
    const {disabled,reverseColor} = this.props;
    //console.log("Status Bar="+DimUtil.getTopPadding())
    //console.log(width,height)
    return (
      <Context.Consumer>
        {({ theme}) => (
          <TouchableHighlight
            disabled={this.props.disabled}
            activeOpacity={1}
            underlayColor={reverseColor?COLORS.GRAY:theme.colors.button.active.backgroundColor}
            onPressIn={()=>{this.setState({pressed:true})}}
            onPressOut={()=>{this.setState({pressed:false});if(this.props.onPress && !disabled){this.props.onPress()}}}
            style={[
            {
                borderRadius:theme.dims.button.borderRadius,
                flexDirection:'row',justifyContent:'center',alignItems:'center',
                width:(this.props.width?this.props.width:"100%"),
                height:(this.props.height?this.props.height:theme.dims.button.height),
                backgroundColor:reverseColor?COLORS.GRAY:disabled?theme.colors.button.disable.backgroundColor:theme.colors.button.backgroundColor},this.props.style]}>
              <Typography
                  font={this.props.font?this.props.font:reverseColor?"text02":"content03"}
                  text={this.props.text}
                  color={this.props.color?this.props.color:reverseColor?'primary':'white'}/>
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

export default Header;
