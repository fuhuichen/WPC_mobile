import React, {Component} from 'react';
import { Context } from '../../FrameworkProvider';
import {Typography} from "../display"
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
    const {pressed} = this.state;
    const {disabled,height} = this.props;
    let circleHeihgt= height?height:36;
    //console.log("Status Bar="+DimUtil.getTopPadding())
    //console.log(width,height)
    return (
      <Context.Consumer>
        {({ theme}) => (
          <View
            style={[
            {
                borderRadius:circleHeihgt/2,
                flexDirection:'row',justifyContent:'center',alignItems:'center',
                width:circleHeihgt,height:circleHeihgt,
                backgroundColor:theme.colors.button.backgroundColor},this.props.style]}>
              <Typography
                  font={"title05"}
                  text={this.props.text}
                  color='white'/>
          </View >
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
