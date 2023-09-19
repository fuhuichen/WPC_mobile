import React, {Component} from 'react';
import {StyleSheet, View, Text, Dimensions, Image,TouchableWithoutFeedback,
  TextInput,InputAccessoryView,Button,KeyboardAvoidingView,ScrollView,ImageBackground,
   DeviceEventEmitter, TouchableOpacity,FlatList} from "react-native";
import I18n from 'react-native-i18n';
import {Actions} from 'react-native-router-flux';
import Toast, {DURATION} from 'react-native-easy-toast'
import { Dialog } from 'react-native-simple-dialogs';
const WIDTH = Dimensions.get('screen').width;
const HEIGHT = Dimensions.get('window').height;
import * as lib from '../../common/PositionLib';
import moment from 'moment'
import CommentItem from './CommentItem'

import store from "../../../mobx/Store";
import PropTypes from "prop-types";

export default class CommentResourcesBlock extends Component {
    static propTypes = {
        blockStyle: PropTypes.style,
        textStyle: PropTypes.style,
        audioStyle: PropTypes.style,
        imageStyle: PropTypes.style,
        videoStyle: PropTypes.style,
        showChannel: PropTypes.boolean,
        enableChannel: PropTypes.boolean,
        multiLine: PropTypes.boolean
    };

    static defaultProps = {
        blockStyle: {},
        textStyle: {},
        audioStyle: {},
        imageStyle: {},
        videoStyle: {},
        showChannel: false,
        enableChannel: false,
        multiLine: false
    };
    state={
      data:this.props.data
    }

    sortNumber(item1, item2, attr, order) {
        var val1 = item1[attr],
            val2 = item2[attr];
        if (val1 == val2) return 0;
        if (val1 > val2) return 1*order;
        if (val1 < val2) return -1*order;
    }
    sortFun(list,prop,order)
    {
        list = list.sort((a,b)=>this.sortNumber(a,b,prop,order));
        return list;
    }
    onPlayItem(c){
      if(this.props.onPlayItem)this.props.onPlayItem(c)
    }
    onEditItem(c){
      if(this.props.onEditItem)this.props.onEditItem(c)
    }
    onDeleteItem(c){
      if(this.props.onDeleteItem)this.props.onDeleteItem(c)
    }
    componentWillReceiveProps(nextProp){
      this.setState({data:nextProp.data})

    }

    renderItem = ({ item,index}) => {
        const {data} = this.state;
        const mediaTypes = store.enumSelector.mediaTypes;
        let newList2 = data.filter(p => (p.mediaType === mediaTypes.IMAGE) || (p.mediaType === mediaTypes.VIDEO));
        newList2 =  this.sortFun(newList2,"ts",-1);
        let picList = [];
        newList2.forEach(item => {
          if ((item.mediaType === mediaTypes.IMAGE)){
              picList.push(item.url);
          }
        });
        if(item.mediaType == -1) {
          return <View style={styles.group}></View>          
        } else {
          return <View style={styles.group}>
                  <CommentItem
                      data={item}
                      urls={picList}
                      imageStyle={this.props.imageStyle}
                      videoStyle={this.props.videoStyle}
                      showDelete={this.props.showDelete}
                      showChannel={this.props.showChannel}
                      enableChannel={this.props.enableChannel}
                      showEdit={this.props.showEdit}
                      onPlay={()=>this.onPlayItem(item)}
                      onEdit={()=>this.onEditItem(item)}
                      onDelete={()=>this.onDeleteItem(item)}/>
                </View>
        }
    };
    render() {
        const { blockStyle, multiLine } =this.props;
        const {data} = this.state;
        const mediaTypes = store.enumSelector.mediaTypes;
        let newList1 = data.filter(p => (p.mediaType === mediaTypes.AUDIO) || (p.mediaType === mediaTypes.TEXT) || (p.mediaType === mediaTypes.PDF));
        let newList2 = data.filter(p => (p.mediaType === mediaTypes.IMAGE) || (p.mediaType === mediaTypes.VIDEO));

        newList1 = this.sortFun(newList1,"ts",-1);
        newList2 =  this.sortFun(newList2,"ts",-1);

        let picList = [];
        newList2.forEach(item => {
          if ((item.mediaType === mediaTypes.IMAGE)){
              picList.push(item.url);
          }
        });

        var nodes1 = newList1.map(function(c,i){
          return <CommentItem
                      data={c}
                      textStyle={this.props.textStyle}
                      audioStyle={this.props.audioStyle}
                      showDelete={this.props.showDelete}
                      showEdit={this.props.showEdit}
                      onPlay={()=>this.onPlayItem(c)}
                      onEdit={()=>this.onEditItem(c)}
                      onDelete={()=>this.onDeleteItem(c)}/>
        }.bind(this))

        var nodes2 = newList2.map(function(c,i){
          let isLast = ((i+1) == newList2.length);
          return <CommentItem
                      data={c}
                      urls={picList}
                      imageStyle={this.props.imageStyle}
                      videoStyle={this.props.videoStyle}
                      showDelete={this.props.showDelete}
                      showChannel={this.props.showChannel}
                      enableChannel={this.props.enableChannel}
                      showEdit={this.props.showEdit}
                      onPlay={()=>this.onPlayItem(c)}
                      onEdit={()=>this.onEditItem(c)}
                      onDelete={()=>this.onDeleteItem(c)}
                      isLast={isLast}/>
        }.bind(this))

        if(multiLine == true) {
          if(newList2.length % 3 == 2) {
            newList2.push({mediaType:-1});
          }
          return (
            <View style={{flex:1}}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <FlatList style={[styles.container,blockStyle]}
                        numColumns={3}
                        data={newList2}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={this.renderItem}
                        showsVerticalScrollIndicator={false}/>
                </ScrollView>
            </View>
          )
        } else {
          return (<ScrollView style={{width:'100%'}}
                        keyboardShouldPersistTaps={'handled'}>
                        {newList2.length>0?<ScrollView style={blockStyle} horizontal={true}
                                    keyboardShouldPersistTaps={'handled'}
                                    showsHorizontalScrollIndicator={false}>
                          {nodes2}
                        </ScrollView>:null}
                        <View style={{marginTop:5}}>
                        {nodes1}
                        </View>
                  </ScrollView>)
        }
    }
}

const styles = StyleSheet.create({
  container: {
    flex:1
  },
  group:{
    flex:1,
    marginBottom: 10,
    marginLeft: 12
  }
});
