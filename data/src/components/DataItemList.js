import React from 'react';
import {connect} from 'react-redux';
import * as actions from '../actions';
import {Dimensions, StyleSheet, View} from 'react-native';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';

class DataItemList extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    const {smallPhone}= this.props;
    var styles
    if(smallPhone){
      styles = smallStyles
    }
    else{
      styles = largeStyles
    }

    this.state = {styles,store:props.selectedStore};
  }

  render () {

    const {store,storeList,styles}= this.state;
    const {smallPhone} =this.props;
    console.log('Render')
    console.log(store)

    const screen = Dimensions.get('window')
    return  (<View style={styles.container}>
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
     paddingTop:2,
     paddingBottom:4,
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
     paddingTop:2,
     paddingBottom:4,
     marginLeft:14,
     fontSize:14,
     justifyContent:'flex-start',
     alignItems:'center',
     backgroundColor:'transparent',
     color:VALUES.COLORMAP.dark_gray},
});

const mapStateToProps = state =>{

  return {userInfo:state.userInfo,lan:
     I18n.locale,smallPhone:state.smallPhone,
     storeList:state.storeList, selectedStore:state.selectedDataItemList};
};
export default connect(mapStateToProps, actions)(DataItemList);
