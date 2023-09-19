import React from 'react';
import {connect} from 'react-redux';
import * as actions from '../actions';
import {Dimensions, StyleSheet, Text, View} from 'react-native';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import LoginButton from '../components/LoginButton';

class Setting extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {store:'台北內湖店',storeList:['台北內湖店','台北天母店','台中漢口店','台中中華西店']};
  }
changeStore(id){
    this.setState({store:this.state.storeList[id]})
}

confirmPressed(){
  this.props.selectPage("PageLogin")
}
  render () {
    const {store,storeList}= this.state;
    const {smallPhone} =this.props;
    var styles
    if(smallPhone){
      styles = smallStyles
    }
    else{
      styles = largeStyles
    }

    const screen = Dimensions.get('window')
    return  (<View style={styles.container}>
              <View style={{width:screen.width-60,height:screen.height-230}}>
                  <View style={{width:screen.width-60,marginBottom:20,borderBottomColor:VALUES.COLORMAP.dark_gray,borderBottomWidth:1}}>
                    <Text  allowFontScaling={false} style={styles.inputTitle}>{I18n.t("bi_store")}</Text>
                    <Text  allowFontScaling={false} style={styles.inputTitle}>{I18n.t('v.1.0.0')}</Text>
                  </View>
                  <View style={{width:screen.width-60,marginBottom:20,borderBottomColor:VALUES.COLORMAP.dark_gray,borderBottomWidth:1}}>
                    <Text  allowFontScaling={false} style={styles.inputTitle}>{I18n.t('帳號')}</Text>
                    <Text  allowFontScaling={false} style={styles.inputTitle}>{I18n.t('user@advantech.com.tw')}</Text>
                  </View>
              </View>

              <View style={{width:screen.width-60,marginBottom:50}}>
              <LoginButton smallPhone={smallPhone}
                color={VALUES.COLORMAP.white}
                noborder={false} backgroundColor={VALUES.COLORMAP.green}
                onPress={()=>this.confirmPressed()}>{I18n.t('登出')}</LoginButton>
              </View>

            </View>)
  }
}


const smallStyles = StyleSheet.create({
  container: {
     flex:1,
     paddingTop:20,
     paddingLeft:30,
     paddingRight:30,
     flexDirection:'column',
     justifyContent:'flex-start',
     alignItems:'flex-start',
  },
  inputTitle: {
     marginBottom:10,
     fontSize:14,
     marginLeft:15,
     fontSize:14,
     justifyContent:'flex-start',
     alignItems:'center',
     backgroundColor:'transparent',
     color:VALUES.COLORMAP.dark_gray},
});

const largeStyles = StyleSheet.create({
  container: {
     paddingTop:20,
     paddingLeft:30,
     paddingRight:30,
     flexDirection:'column',
     justifyContent:'flex-start',
     alignItems:'flex-start',
  },
  inputTitle: {
      marginBottom:10,
     fontSize:14,
     fontSize:14,
     justifyContent:'flex-start',
     alignItems:'center',
     backgroundColor:'transparent',
     color:VALUES.COLORMAP.dark_gray},
});

const mapStateToProps = state =>{
  return {lan: I18n.locale,smallPhone:state.smallPhone,serverAddress:state.serverAddress,currentPage: state.currentPage,loginInfo:state.loginInfo};
};
export default connect(mapStateToProps, actions)(Setting);
