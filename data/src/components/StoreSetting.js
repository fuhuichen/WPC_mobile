import React from 'react';
import {connect} from 'react-redux';
import * as actions from '../actions';
import {Text,View,Dimensions,StyleSheet,TouchableOpacity} from 'react-native';
import VALUES from '../utils/values';
import I18n from 'react-native-i18n';
import LoginButton from '../components/LoginButton';
import DropDownSelect from '../components/DropDownSelect';
import KPI from '../components/KPI';
class StoreSetting extends React.Component {

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
  getTypeList(){
     const {storeList} = this.props;
     var list =['全部門店'];
     for(var k in storeList){
       if( list.indexOf(storeList[k].type)<0){
          list.push(storeList[k].type)
       }
     }
     return list;

  }
  getSubtypeList(){
     const {store }=  this.state;
     const {storeList} = this.props;
     var list =['全部門店'];
     for(var k in storeList){
       if( store.type == storeList[k].type && list.indexOf(storeList[k].subtype)<0){
          list.push(storeList[k].subtype)
       }
     }
     return list;

  }
  getStoreList(){
     const {store }=  this.state;
     const {storeListBI} = this.props;
     var list =['全部門店'];
     for(var k in storeList){
       if( store.type == storeList[k].type &&
           store.subtype == storeList[k].subtype &&
          list.indexOf(storeList[k].name)<0){
          list.push(storeList[k].name)
       }
     }
     return list;

  }
  changeType(id){
    var store = this.state.store;
    var list = this.getTypeList();
    if( list[id ]=='全部門店'){
      store.type ='全部門店';
      store.subtype = undefined;
    }
    else{
      store.type =list[id];
      store.subtype = '全部門店';
    }
    this.setState({store})
  }
  changeSubtype(id){
    var store =  this.state.store;
    var list = this.getSubtypeList();
    if( list[id ]=='全部門店'){
      store.subtype ='全部門店';
      store.store = undefined;
    }
    else{
      store.subtype =list[id];
      store.store = '全部門店';
    }
    this.setState({store})
  }
  changeStore(id){
    var store = this.state.store;
    var list = this.getStoreList();
    if( list[id ]=='全部門店'){
      store.store ='全部門店';
    }
    else{
      store.store =list[id];
    }
    this.setState({store})
  }
  renderSubtypePicker(){
    const screen = Dimensions.get('window')
    const {store,storeList,styles}= this.state;
    if(store.type != '全部門店'){
      return (
          <View style={{marginTop:20}}>
            <Text  allowFontScaling={false} style={styles.inputTitle}>{I18n.t('區域')}</Text>
            <DropDownSelect changeType={(id)=>this.changeSubtype(id)} width={screen.width-60} list={this.getSubtypeList()} content={store.subtype}/>
          </View>
      )
    }

  }
  renderStorePicker(){
    const screen = Dimensions.get('window')
    const {store,storeList,styles}= this.state;
    if(store.type != '全部門店' && store.subtype != '全部門店'){
      return (
          <View  style={{marginTop:20}}>
          <Text  allowFontScaling={false} style={styles.inputTitle}>{I18n.t("bi_store)}</Text>
          <DropDownSelect changeType={(id)=>this.changeStore(id)} width={screen.width-60} list={this.getStoreList()} content={store.store}/>
          </View>
      )
    }

  }
  confirmPressed(){

    this.props.setStoreSetting(this.state.store);
    this.props.back();
  }
  render () {

    const {store,storeList,styles}= this.state;
    const {smallPhone} =this.props;
    console.log('Render')
    console.log(store)

    const screen = Dimensions.get('window')
    return  (<View style={styles.container}>
                <View style={{width:screen.width-60,height:screen.height-230}}>
                    <Text  allowFontScaling={false} style={styles.inputTitle}>{I18n.t('組織型態')}</Text>
                    <DropDownSelect changeType={(id)=>this.changeType(id)} width={screen.width-60} list={this.getTypeList()} content={store.type}/>
                    {this.renderSubtypePicker()}
                    {this.renderStorePicker()}
                </View>

                <View style={{width:screen.width-60,marginBottom:50}}>
                <LoginButton smallPhone={smallPhone}
                  color={VALUES.COLORMAP.white}
                  noborder={false} backgroundColor={VALUES.COLORMAP.green}
                  onPress={()=>this.confirmPressed()}>{I18n.t('Confirm')}</LoginButton>
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
     justifyContent:'flex-start',
     alignItems:'center',
     backgroundColor:'transparent',
     color:VALUES.COLORMAP.dark_gray},
});

const mapStateToProps = state =>{

  return {userInfo:state.userInfo,lan:
     I18n.locale,smallPhone:state.smallPhone,
     storeList:state.storeList, selectedStore:state.selectedStoreSetting};
};
export default connect(mapStateToProps, actions)(StoreSetting);
