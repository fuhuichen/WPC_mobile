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
class Option extends Component {
  constructor(props) {
    super(props);
    this.state={
      pressed:false,
      selected:props.checked,
    }
  }
  componentWillReceiveProps(props){
  //  console.log("option componentwillreceiveprops")
    if(props.checked != this.props.checked){
      //  console.log("Change selected="+props.checked)
        this.setState({selected:props.checked})
    }
  }
  render() {
    const {width,height} = DimUtil.getDimensions("portrait");
    const {type,mode,font,text,checked,status} = this.props;
    const {pressed,selected} = this.state;

    //console.log("Status Bar="+DimUtil.getTopPadding())
    //console.log(width,height)
  //  console.log("Checked"+selected)
    //console.log("Show Optons="+text)
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
                flexDirection:'row',justifyContent:'center',alignItems:'center',width:'100%',
                height:(this.props.height?this.props.height:theme.dims.button.height)},this.props.style]}>
              <View style={{flexDirection:'row',height:(this.props.height?this.props.height:theme.dims.button.height)
                          ,alignItems:'center',justifyContent:'flex-start',width:"100%"}}>
                <View style={{marginLeft:0,height:44,}}>
                  <Icon
                    mode={'static'}
                    type={"list-clear-normal"}/>
                </View>
                <Typography
                    font={"content03"}
                    text={text}
                    color={'gray'}/>
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

export default Option;
