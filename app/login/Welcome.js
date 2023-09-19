import React, {Component} from 'react';
import {StyleSheet, View,Text,Image,DeviceEventEmitter} from 'react-native';
import I18n from 'react-native-i18n';
import {Actions} from "react-native-router-flux";
import store from "../../mobx/Store";
import GlobalParam from "../common/GlobalParam";
import loginImage from '../assets/images/group_55.png';
import loginLogo from '../assets/images/group_3.png';
import UserPojo from "../entities/UserPojo";

export default class Welcome extends Component {
  componentDidMount() {
    setTimeout(() =>{Actions.reset(GlobalParam.services[this.props.index]);},3000)
  }

  render() {
    return (
        <View style={styles.container}>
          <Image source={loginLogo} style={{width:200,height:32}}/>
          <Text style={styles.text}>{I18n.t('Welcome',{key:UserPojo.getUserName()})}</Text>
          <Image style={styles.image} source={loginImage}/>
        </View>
    );
  }
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    text:{
        fontSize:27,
        marginTop:9.25,
        marginBottom:42,
        marginLeft:16,
        marginRight:16,
        textAlign:'center'
    },
    image:{
        width:140,
        height:210
    }
});
