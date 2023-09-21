import React, {Component} from 'react';
import { Context } from '../../FrameworkProvider';
import  {
  StyleSheet,
  View,
  Text,
} from 'react-native';
class AppContainer extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <Context.Consumer>
        {({ theme}) => (
          <View style={[styles.container,{backgroundColor:"#00f"}]}>
            {this.props.children}
          </View>
        )}
      </Context.Consumer>
    );
  }
  /*
  render(){
    return (<Context.Consumer>
              {({ theme}) => (
              <View style={[styles.container,{backgroundColor:theme.colors.common.primary}]}>
              </View>
            </Context.Consumer>));
  }
  */

}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});

export default AppContainer;
