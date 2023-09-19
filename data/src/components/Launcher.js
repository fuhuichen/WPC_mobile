import React from 'react';
import {Image, Platform, StyleSheet, View} from 'react-native';
import Dimensions from 'Dimensions';

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
    };
    //

    var bgImg = this.props.img
    return (<View  style={ [styles.containerStyle,resolution]}>
              <Image style={[styles.backgroundImage,{marginTop:height/4}]} source={bgImg}>
              </Image>
            </View>);
  }
}


const styles = StyleSheet.create({
  containerStyle:{
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems:'center',
  },
  backgroundImage: {
  paddingTop:(Platform.OS === 'ios') ? 20 : 0,
   width:165,
   height:151,
  }
});
