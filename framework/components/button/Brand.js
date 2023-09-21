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
class Tab extends Component {
  constructor(props) {
    super(props);
    this.state={
      pressed:false
    }
  }
  render() {
    const {width,height} = DimUtil.getDimensions("portrait");
    const {type,mode,selected,disabled,noborder,iconSize,disable} = this.props;
    const {pressed} = this.state;
    //console.log("Status Bar="+DimUtil.getTopPadding())
    //console.log(width,height)
    if(disabled){
      return <View style={[{height:this.props.height,flex:1},this.props.style]}/>
    }
    return (
      <Context.Consumer>
        {({ theme}) => (
          <TouchableHighlight
            disabled={disable}
            activeOpacity={1}
            underlayColor={"transparent"}
            onPressIn={()=>{this.setState({pressed:true})}}
            onPressOut={()=>{this.setState({pressed:false});if(this.props.onPress){this.props.onPress()}}}
            style={[
            {   flex:1,
                borderRadius:theme.dims.button.borderRadius,
                flexDirection:'row',justifyContent:'center',alignItems:'center',
                height:(this.props.height?this.props.height:theme.dims.button.height)},
                selected?theme.colors.tab.selected:theme.colors.tab.normal,
                ,this.props.style,noborder?{borderWidth:0}:{},disable?{backgroundColor:'#eee',borderRadius:0}:null]}>
              <View style={{flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                <Icon
                  style={{height:iconSize?iconSize:36,width:iconSize?iconSize:36,marginBottom:0}}
                  type={mode=='static'?type:disable?type+"-disable":selected?type+"-active":type+"-normal"}/>
                  <View style={{flexDirection:'column',alignItems:'center',justifyContent:'center',
                      height:24,borderRadius:12,paddingLeft:10,paddingRight:10,
                      backgroundColor:COLORS.PRIMARY_BLUE}}>
                    <Typography
                        font={"content04"}
                        text={this.props.text}
                        color={disable?"#BBB":selected?'white':"gray"}/>
                  </View>
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

export default Tab;
