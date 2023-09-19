import React, {Component} from 'react';
import {Dimensions, Image, StyleSheet, View} from 'react-native';

import logoImg from '../assets/images/img_login_logo.png';
import * as lib from '../common/PositionLib';
import {ColorStyles} from '../common/ColorStyles';

let {height} =  Dimensions.get('window');let {width} =  Dimensions.get('screen');

export default class Logo extends Component {
  render() {
    return (
      <View style={styles.container}>
          <Image source={logoImg} style={styles.image} resizeMode={'contain'} />
          <View style={styles.labelPanel}>
            {/*<Image source={labelImg} style={styles.labelImage}/>*/}
            {/*<Text style={styles.labelText}>看门店</Text>*/}
          </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
    container: {
        // flex: 1,
        alignItems: 'center'
    },
    image: {
        width: 270,
        height: 60,
        marginTop:lib.defaultLogoMargin()
    },
    labelPanel:{
        flexDirection: 'row',
        justifyContent:'center',
        width:width,
        height:22,
        marginTop:4
    },
    labelImage:{
        width:22,
        height:22,
        marginLeft:width/2-20
    },
    labelText:{
        marginLeft: 12,
        fontSize:18,
        textAlignVertical:'center',
        height:22,
        color: ColorStyles.COLOR_MAIN_RED,
        marginTop:1,
        lineHeight: 22
    }
});
