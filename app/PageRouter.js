
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {PAGES} from "./define"
import {LangUtil} from '../framework'
const Stack = createNativeStackNavigator();


import React, {Component} from 'react';
import  {
  StyleSheet,
  View,
  Text,
  Button,
  Appearance
} from 'react-native';
import {connect} from 'react-redux';
import * as actions from '../actions';
import {FrameworkProvider,AppContainer} from '../framework';
import {PageLogin, PageQRCodeScanner} from './pages';

class PageRouter extends Component {
  constructor(props) {
    super(props);
    this.state={
      render: false
    }
  }

  componentWillUnmount() {

  }

  _keyboardDidShow(e) {
  }

  _keyboardDidHide(){
  }

  async componentDidMount() {
    await LangUtil.init();
    this.setState({render: true})
  }

  render(){
    if(this.state.render)
    return ( <FrameworkProvider>
               <AppContainer>
               <NavigationContainer>
                   <Stack.Navigator initialRouteName={PAGES.LOGIN}>
                      <Stack.Screen name={PAGES.LOGIN} component={PageLogin}
                        options={{header:()=><View/>}}/>
                      <Stack.Screen name={PAGES.QRCode_Scanner} component={PageQRCodeScanner}
                        options={{header:()=><View/>}}/>
                   </Stack.Navigator>
                 </NavigationContainer>
              </AppContainer>
            </FrameworkProvider>);
       return <View/>
  }



}

const mapStateToProps = state =>{
  return {loading:state.loading};
};
export default connect(mapStateToProps, actions)(PageRouter);
