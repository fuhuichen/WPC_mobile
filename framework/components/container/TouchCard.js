import React, {Component} from 'react';
import { Context } from '../../FrameworkProvider';
import  {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import {DimUtil} from "../../utils"
class TouchCard extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const {scrollable,onPress,onLongPress,disabled} = this.props;
      return (
        <Context.Consumer>
          {({ theme}) => (
            <TouchableOpacity
              disabled={disabled}
              onPress={()=>{if(onPress)onPress()}}
              onLongPress={()=>{
                 if(onLongPress)onLongPress()
               }}
              style={[
              this.props.style,
              {  flexDirection:this.props.flexDirection?this.props.flexDirection:"column",
                justifyContent:this.props.justifyContent?this.props.justifyContent:"center",
                alignItems:this.props.alignItems?this.props.alignItems:"center",
                width:this.props.fullwidth?"100%":null,
              },this.props.tabContainer?theme.colors.tabContainer:null,this.props.style]}>
              {this.props.children}
            </TouchableOpacity>
          )}
        </Context.Consumer>
      );
  }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,alignItems:'center'
    }
});

export default TouchCard;
