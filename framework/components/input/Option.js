import React, {Component} from 'react';
import { Context } from '../../FrameworkProvider';
import {Typography,Icon} from "../display"
import {COLORS} from "../../enums"
import  {
  StyleSheet,
  View,
  Text,
  TouchableOpacity
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
    const {type,mode,font,text,checked,keyword,subtext} = this.props;
    const {pressed,selected} = this.state;
    //console.log("Status Bar="+DimUtil.getTopPadding())
    //console.log(width,height)
  //  console.log("Checked"+selected)
    //console.log("Show Optons="+text)
    //console.log("Render Option")
    return (
      <Context.Consumer>
        {({ theme}) => (
          <TouchableOpacity
            activeOpacity={1}
            underlayColor={"transparent"}
            onPressIn={()=>{this.setState({pressed:true})}}
              onPressOut={()=>{this.setState({pressed:false})}}
            onPress={()=>{this.setState({pressed:false});if(this.props.onPress){this.props.onPress()}}}
            style={[
            {
                borderRadius:0,paddingLeft:16,
                flexDirection:'row',justifyContent:'center',alignItems:'center',width:'100%',backgroundColor:'#fff',marginBottom:1,
                height:subtext?56:(this.props.height?this.props.height:theme.dims.button.height)},this.props.style]}>
              <View style={{flexDirection:'row',height:subtext?56:(this.props.height?this.props.height:theme.dims.button.height)
                          ,alignItems:'center',justifyContent:'flex-start',width:"100%"}}>
                <View>
                  {subtext?<Typography
                      font={"text00"}
                      text={subtext}
                      style={{width:width-100,marginBottom:6}}
                      keyword={keyword}
                      color={"lightText"}/>:null}
                  <Typography
                      font={"text01"}
                      text={text}
                      style={{width:width-100}}
                      keyword={keyword}
                      color={"text"}/>
                </View>
               <View style={{marginLeft:0,position:'absolute',right:10}}>
                      <Icon style={{width:24,height:24}}
                        type={selected?"select":""}/>
                </View>
            </View>
          </TouchableOpacity >
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
