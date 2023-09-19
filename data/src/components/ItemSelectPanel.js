import React from 'react';
import {TouchableOpacity,Image,Text,View,StyleSheet,ScrollView} from 'react-native';
import VALUES from '../utils/values';

export default class ItemSelectPanel extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;

    var styles;
    const {smallPhone}= this.props;
    if(smallPhone){
      styles = smallStyles;
    } else {
      styles = largeStyles;
    }

    this.state = {
      styles,
      index: this.props.items.index,
      indexs: this.props.items.indexs || []
    };
  }
  
  renderContent () {
    const {items} = this.props;
    return items.list.map(function(p,i){
      return (
        <TouchableOpacity onPress={()=>{this.props.onPress(i);this.setState({index:i})}}
          style={{paddingRight:15, backgroundColor:(i == this.state.index) ? '#E2F3FF' : null, paddingLeft:5,
                  borderBottomWidth: 1,borderBottomColor: '#CCCCCC55', height:40,justifyContent:'flex-start',alignItems:'center',flexDirection:'row'}}>
          <Text  allowFontScaling={false} style={{color: (i == this.state.index) ? '#006AB7':'#666666'}}>{p}</Text>
        </TouchableOpacity >)
      }.bind(this));
  }

  renderContent_Multi () {
    const {items} = this.props;
    return items.list.map(function(p,i){
      var img ;
      if(this.state.indexs.includes(i)) {
        img = require('../../images/POSsetting_pop_chose_icon2.png');
      } else {
        img = "";
      }
      return (
        <TouchableOpacity onPress={()=>{this.setMultiStores(i)/*this.props.onPress(p.index);this.setState({index:p.index})*/}}
          style={{paddingRight:15, /*backgroundColor:(p.index== this.state.index) ? '#495086' : null,*/ paddingLeft:5,
                  borderBottomWidth: 1,borderBottomColor: '#CCCCCC55', height:40,justifyContent:'flex-start',alignItems:'center',flexDirection:'row'}}>
          <Text allowFontScaling={false} style={{color: '#666666'}}>{p}</Text>
          <View style={{flex:1}}/>
          <Image style={{width:20,height:20}} source={img}/>
        </TouchableOpacity >)
    }.bind(this));
  }

  setMultiStores(index) {
    let tmpIndex = this.state.indexs || [];
    if(tmpIndex.includes(index)) {
      tmpIndex.splice(tmpIndex.indexOf(index), 1);
    } else {
      tmpIndex.push(index);
    }
    this.setState({ indexs: tmpIndex});
  }

  render () {
    return (
      <View style={{paddingLeft:15,paddingRight:15}}>
        <View style={{height:290}}>
          <ScrollView >
            { this.props.multi ? this.renderContent_Multi() : this.renderContent()}
          </ScrollView>
        </View>
      </View>
    );
  }
}

const smallStyles = StyleSheet.create({
  viewStyle:{
    flexDirection: 'row',
  },
  textStyle:{
    color: VALUES.COLORMAP.font_gray,
    fontSize : 15,
  },
  changeTextStyle:{
    fontSize : 15,
  },
  imageStyle:{
    width: 20,
    height:20,
  }
});

const largeStyles = StyleSheet.create({
  viewStyle:{
    flexDirection: 'row',
    paddingLeft:10,
  },
  textStyle:{
    color: VALUES.COLORMAP.font_gray,
    fontSize : 18,
  },
  changeTextStyle:{
    fontSize : 18,
  },
  imageStyle:{
    width: 20,
    height:20,
  }
});
