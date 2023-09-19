import React from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import VALUES from '../utils/values';
import Dimensions from 'react-native';

export default class Card extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
  }

  render () {


    var width= Dimensions.get('screen').width ;
    var height=Dimensions.get('window').height;
    var resolution = {
        height, width
    }
    var bgImg = require('../../images/default_bg.png')
    return (<View  style={ [styles.containerStyle,resolution]}>
                 {this.props.children}
            </View>);
  }
}


const styles = StyleSheet.create({
  containerStyle:{
    backgroundColor:VALUES.COLORMAP.dkk_background,
    paddingBottom:20,
    flexDirection:'column',
    alignItems:'center',
    justifyContent:'flex-start',
  },
  backgroundImage: {
  paddingTop:0,
   flex: 1,
   alignSelf: 'stretch',
   width: null,
  }
});
