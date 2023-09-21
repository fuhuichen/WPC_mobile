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
import {IconButton} from "../button"
import {DimUtil,LangUtil} from "../../utils"
class Option extends Component {
  constructor(props) {
    super(props);
    this.state={
      open:true,
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
    const {type,mode,font,text,checked,status,open,multiSelect,keyword} = this.props;
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
            onPressOut={()=>{this.setState({pressed:false})}}
            style={[
            {
                borderRadius:theme.dims.button.borderRadius,
                flexDirection:'row',justifyContent:'center',alignItems:'center',width:'100%',
                height:(this.props.height?this.props.height:theme.dims.button.height)},this.props.style]}>
              <View style={{flexDirection:'row',height:(this.props.height?this.props.height:theme.dims.button.height)
                          ,alignItems:'center',justifyContent:'flex-start',width:"100%",height:24,marginBottom:4,backgroundColor:"#f000"}}>
                {multiSelect&&false?<View style={{marginLeft:0,height:24,}}>
                  <Icon
                    mode={'static'}
                    type={status==2?"checkbox-selected-normal":status==1?"checkbox-sub-selected-normal":"checkbox-unselect-normal"}/>
                </View>:null}
                <Typography
                    font={"text00"}
                    text={text}
                    keyword={keyword}
                    color={'grayText'}/>
                <View style={{marginLeft:8,height:1,flex:1}}/>
                <IconButton
                        type={!open?"dropdown-blue-active":"dropdown-blue"}
                        mode="static"
                        onPress={()=>{if(this.props.onPressOpen)this.props.onPressOpen()}}/>
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
