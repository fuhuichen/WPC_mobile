import React from 'react';
import {Image, Platform, StyleSheet, TouchableOpacity} from 'react-native';
import I18n from 'react-native-i18n';

export default class ManageButton extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
  }

  render () {
    const {smallPhone} =this.props;
    var styles
    if(smallPhone){
      styles = smallStyles
    }
    else{
      styles = largeStyles
    }
    var img;
    if(I18n.locale =='en'){
      img = require('../../resources/img/manager_center_en.png')
    }
    else{
      img =require('../../resources/img/manager_center.png')
    }
    return (
                <TouchableOpacity onPress={this.props.onPress} style={styles.ManageButtonStyle}>
                    <Image style={styles.backgroundImage} source={img}></Image>
                </TouchableOpacity>

            );
  }
}

ManageButton.propTypes = {   children: React.PropTypes.any,
  onPress : React.PropTypes.any};
ManageButton.defaultProps = {   children:undefined, onPress:undefined};

const largeStyles = StyleSheet.create({
  backgroundImage: {
   alignSelf: 'stretch',
   height:51,
   width:218,
   borderRadius:(Platform.OS === 'ios')?10:50,
  },
  ManageButtonStyle:{
    borderRadius:(Platform.OS === 'ios')?10:50,
  },
});

const smallStyles = StyleSheet.create({
  backgroundImage: {
   alignSelf: 'stretch',
   height:40,
   width:173,
   borderRadius:(Platform.OS === 'ios')?7:35,
  },
  ManageButtonStyle:{
    borderRadius:(Platform.OS === 'ios')?7:35,
  },
});
