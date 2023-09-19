import React, {Component } from 'react';
import { StyleSheet, Image,View } from 'react-native';

export default class CustomMarker extends Component {
  render() {
    return (
      <View style={{width:40,height:40,marginleft:40}}>
      <Image source={require('../../assets/images/comment/Oval.png')} style={{width:40,height:40}} resizeMode="contain"/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  image: {
    height: 40,
    width: 40,
  },
});