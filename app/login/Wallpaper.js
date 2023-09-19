import React, {Component} from 'react';
import {StyleSheet, ImageBackground} from 'react-native';

import bgSrc from '../assets/images/img_login_bg.jpg';

export default class Wallpaper extends Component {
  render() {
    return (
      <ImageBackground style={styles.picture} source={bgSrc}>
        {this.props.children}
      </ImageBackground>
    );
  }
}

const styles = StyleSheet.create({
  picture: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'contain',
  },
});
