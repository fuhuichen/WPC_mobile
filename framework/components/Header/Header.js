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
class Header extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const {width,height} = DimUtil.getDimensions("portrait")
    const {leftIcon,onLeftPressed,rightIcon,onRightPressed} =this.props;
    //console.log("Status Bar="+DimUtil.getTopPadding())
    //console.log(width,height)
    return (
      <Context.Consumer>
        {({ theme}) => (
          <View style={[styles.container,
            {   width,height:(this.props.height?this.props.height:theme.dims.header.height)+DimUtil.getTopPadding(),
                paddingTop:DimUtil.getTopPadding(),
                position:'absolute',top:0,left:0,
                backgroundColor:theme.colors.header.backgroundColor}]}>
            <StatusBar backgroundColor={theme.colors.primary} />
            <View style={{height:theme.dims.header.height,
                  width:"100%",flexDirection:'row',justifyContent:'center',
                alignItems:'center'}}>
              <View style={{flex:1,flexDirection:'row',justifyContent:'flex-start',marginLeft:16}}>
              <IconButton
                    type={leftIcon}
                    font={"white"}
                    onPress={()=>{if(onLeftPressed){onLeftPressed()}}}
                    text={""}/>
              </View>
              <Typography
                  font={"text02"}
                  text={this.props.text}
                  color='white'/>
              <View style={{flex:1,flexDirection:'row',justifyContent:'flex-end',marginRight:16}}>
                <IconButton
                        iconStyle={{width:24,height:24}}
                        type={rightIcon}
                        font={"white"}
                        onPress={()=>{if(onRightPressed){onRightPressed()}}}
                        text={this.props.rightText}/>
               </View>
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

export default Header;
