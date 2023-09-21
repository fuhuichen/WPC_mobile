import React, {Component} from 'react';
import { Context } from '../../FrameworkProvider';
import  {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl
} from 'react-native';

import {DimUtil} from "../../utils"
class Container extends Component {
  constructor(props) {
    super(props);
    this.state={
      refreshing:false
    }
  }
  render() {
    const {scrollable,onRefresh} = this.props;
    if(scrollable){
      return (
        <Context.Consumer>
          {({ theme}) => (<ScrollView
              bounces={onRefresh?true:false}
              refreshControl={
                  <RefreshControl
                    colors={['#ccc']}
                    tintColor={'#ccc'}
                    refreshing={this.state.refreshing}
                    onRefresh={()=>{if(onRefresh)onRefresh()}}
                  />}
              style={[{flex:1},this.props.style]}
              contentStyle={[this.props.style,
              {  flex:1,flexDirection:this.props.flexDirection?this.props.flexDirection:"column",
                justifyContent:this.props.justifyContent?this.props.justifyContent:"center",
                alignItems:this.props.alignItems?this.props.alignItems:"center",
                width:this.props.fullwidth?"100%":null,
              },this.props.tabContainer?theme.colors.tabContainer:null]}>
              {this.props.children}
            </ScrollView>
          )}
        </Context.Consumer>
      );
    }
    else
      return (
        <Context.Consumer>
          {({ theme}) => (
            <View style={[
              this.props.style,
              {  flexDirection:this.props.flexDirection?this.props.flexDirection:"column",
                justifyContent:this.props.justifyContent?this.props.justifyContent:"center",
                alignItems:this.props.alignItems?this.props.alignItems:"center",
                width:this.props.fullwidth?"100%":null,
              },this.props.tabContainer?theme.colors.tabContainer:null,
              this.props.border? {borderWidth:1,borderColor:"#E2E2E2",borderRadius:8,backgroundColor:"white",
                padding:8,paddingTop:12,paddingBottom:12} :null,
              this.props.style]}>
              {this.props.children}
            </View>
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

export default Container;
