import React, {Component} from 'react';
import { Context } from '../../FrameworkProvider';
import  {
  StyleSheet,
  View,
  ScrollView,
  Text,
  ActivityIndicator
} from 'react-native';
import {DimUtil} from "../../utils"
class Spinner extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const {width,height} = DimUtil.getDimensions("portrait")
  //  console.log(width,height)
  //  console.log("Spinner")
    //const width = 399;
    if(this.props.visible){
      return (
        <Context.Consumer>
          {({ theme}) => (
            <View
              style={[styles.container,
              {width,height,backgroundColor:"#00000084"},
              this.props.style]}>
                <ActivityIndicator animating={true} color={"#fff"} size="large"/>
            </View>
          )}
        </Context.Consumer>
      );
    }
    else{
      return null;
    }

  }
}
const styles = StyleSheet.create({
    container: {
        position:'absolute',top:0,left:0,
        flex: 1,alignItems:'center',justifyContent:'center',
    }
});

export default Spinner;
