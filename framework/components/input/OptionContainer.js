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
import GroupOption from './GroupOption'
import Option from './Option'
import ClearOption from './ClearOption'
import {DimUtil} from "../../utils"
class IconButton extends Component {
  constructor(props) {
    super(props);
    this.state={
      pressed:false,
      open:true,
      selected:this.props.selected
    }
  }
  onSelect(id,group){
    if(this.props.onSelect){
      this.props.onSelect(id,group)
    }
  }
  onSelectAll(){
    const {selected} = this.state;
    const {options,multiSelect,group} = this.props;
    let status = 0;
    if(selected){
      if(selected.length==0){
        status = 0;
      }
      else if(selected.length ==options.length ){
        status = 2;
      }
      else{
        status = 1;
      }
    }

    if(this.props.onSelectAll){
      if(status==2){
        this.props.onSelectAll([])
      }
      else{
        ids = options.map(p=>{return p.id})
        this.props.onSelectAll(ids)
      }
    }

  }
  componentWillReceiveProps(props){
    //console.log(props)
    if(props.selected != this.props.selected){
      //  console.log("Option Container componentwillreceiveprops="+props.selected)
        this.setState({selected:props.selected})
    }
  }
  render() {
    const {options,multiSelect,group,clear,keyword,subtext} = this.props;
    const {selected,open} = this.state;
    //console.log("Selected="+selected)
    let status = 0;
    if(multiSelect){
      if(selected.length==0){
        status = 0;
      }
      else if(selected.length ==options.length ){
        status = 2;
      }
      else{
        status = 1;
      }


    }

    if(options){
      return (
        <Context.Consumer>
          {({ theme}) => (
            <View style={[{width:'100%'},this.props.style]}>
              {group?<GroupOption key={group}
                      checked={true}
                      status={status}
                      open={open}
                      keyword={keyword}
                      multiSelect={multiSelect}
                      onPressOpen={()=>{
                          console.log("Pressopen");
                          this.setState({open:!open})
                      }}
                      onPress={()=>this.onSelectAll()}
                      style={{height:24,marginTop:10,paddingLeft:16,paddingRight:16}}
                      text={group}/>:null

              }
              { clear? options.map(function(c,i){
                return <ClearOption key={c.id}
                        onPress={()=>this.onSelect(c.id)}
                        text={c.label}/>
              }.bind(this))
              : open ? options.map(function(c,i){
                return <Option key={c.id}
                        keyword={keyword}
                        style={[i==0?{borderTopLeftRadius:8,borderTopRightRadius:8}:null,
                          i==options.length-1?{borderBottomLeftRadius:8,borderBottomRightRadius:8}:null]}
                        checked={multiSelect?selected.indexOf(c.id)>=0 : selected == c.id}
                        onPress={()=>this.onSelect(c.id,c.subtitle)}
                        subtext={subtext?c.subtitle:null}
                        text={c.label}/>
              }.bind(this)):null}
            </View >
          )}
        </Context.Consumer>
      );
    }
    return <View/>

  }
}
const styles = StyleSheet.create({
    container: {
       alignItems:'center'
    }
});

export default IconButton;
