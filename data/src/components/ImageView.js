import React from 'react';
import {Image, StyleSheet, View} from 'react-native';

export default class ImageView extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
  }

  render () {
    var resolution = {
      height: this.props.height,
      width: this.props.width
    };
    var image ;
    switch(this.props.type){
      default:
          image = require('../../images/time.png');
          break;
    }
    return (<View style={resolution}>
                <Image style={resolution} resizeMode={'contain'}  source={image} />
            </View>);
  }
}


const styles = StyleSheet.create({

});
