import React, { Component } from 'react';
import { StyleSheet, View, DeviceEventEmitter, Image, TouchableOpacity, Animated,Text,Dimensions} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
//import {ScrollView} from 'react-native-gesture-handler';
import { LibraryDirectoryPath } from '../../library/react-native-fs';
import {EMITTER_ANALYSIS} from "../common/Constant";
import {Actions} from 'react-native-router-flux';
import I18n from 'react-native-i18n';
const WIDTH = Dimensions.get('screen').width-20-16;
const HEIGHT = Dimensions.get('window').height;
import Data from './analysisData'
import DragDropAnalysisObj from './DragDropAnalysisObj'

export default class EditAnalysisPage extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.containHeight = HEIGHT-38;
        this.state={scrollEnabled:true,objData:Data.analysisObject,newObjViewY: new Animated.Value(0),}
        this.doFetchData();
        //this.doRefrshObjectData(Data.analysisObject)
    }

    doFetchData(){
        //console.log("1.analysisObject:",Data.analysisObject);
        Data.analysisObject.sort(this.GetSortOrder("objOrder"));
        //console.log("2.analysisObject:",Data.analysisObject);
        //this.setState({objData:Data.analysisObject});
        this.doRefrshObjectData(Data.analysisObject)
    }

    GetSortOrder(key){
        return function(a, b) {
            if (a[key] > b[key]) {
                return 1;
            } else if (a[key] < b[key]) {
                return -1;
            }
            return 0;
        }
    }

    onFinishClick(){
        Actions.pop();
        //DeviceEventEmitter.emit(EMITTER_ANALYSIS,0);
        //Actions.push('Analysis');
        //Actions.push('storeSearch');
    }

    onItemDelete(index){
        const {objData} = this.state;
        console.log("Removed Index:",index);
        objData.splice(index,1);
        this.doRefrshObjectData(objData);
    }

    doRefrshObjectData(objData){
        let caculateH=0;
        //objData.sort(this.GetSortOrder("objOrder"));
        objData.map((item,index)=>{
            item.objTop = caculateH;
            item.objOrder = index+1;
            caculateH = caculateH+item.objHeight+25;
        });
        this.containHeight = caculateH;
        this.setState({objData});
    }
    moveObjectUp(objData,moveObj,newPY,idx){
        //const {objData} = this.state;
        var newSource = objData.slice(0,objData.length);
        if(newSource.length<=0) return [];
        for(let i=0; i<newSource.length; i++){
            let item = newSource[i];
            if(newPY < (item.objTop+item.objHeight) && i!=idx){
                newSource.splice(idx,1);
                console.log("UP1.newSource:",newSource);
                newSource.splice(i,0,moveObj);

                console.log("UP2.newSource:",newSource);
                return newSource;
            }
        }
    }
    moveObjectDown(objData,moveObj,newPY,idx){
        var newSource = objData.slice(0,objData.length);
        console.log("3.newSource:",newSource)
        console.log("4.moveObj:",moveObj)
        console.log( 'newPY:'+newPY+', idx:'+idx);
        if(newSource.length<=0) return [];
        for(let i=newSource.length-1; i>=0; i--){
            let item = newSource[i];
            if(newPY > item.objTop && i!= idx){
                newSource.splice(idx,1);
                newSource.splice(i,0,moveObj);

                console.log("Down.newSource:",newSource);
                return newSource;
            }
        }
    }
    onPositionMoved(px,py,index){
        const {objData} = this.state;
        //let moveObj = objData.slice(index,index+1)
        let newObjData = objData;
        console.log("py:",py);
        console.log("objData:",objData);
        if(py<0){ //向上移動
            if(index>0){ //不是第一個物件
                let moveObj = objData.slice(index,index+1);
                //console.log( 'moveObj:',moveObj);
                let newPY = moveObj[0].objTop+py;
                //console.log("1.newPY:",newPY)
                newObjData = this.moveObjectUp(objData,moveObj[0],newPY,index);

            }
        }else if(py>0){
            if(index<(objData.length-1)){ //不是最後一個物件
                let moveObj = objData.slice(index,index+1);
                let newPY = moveObj[0].objTop+py+moveObj[0].objHeight;
                newObjData = this.moveObjectDown(objData,moveObj[0],newPY,index);
            }
        }
        this.doRefrshObjectData(newObjData);
    }

    slideUp(){
        const screen = Dimensions.get('window');
        const slideTop = HEIGHT-50;
        Animated.timing(this.state.newObjViewY, {
          toValue: -1*slideTop,
          duration: 500
         }).start();
    }

      slideDown(){
        Animated.timing(this.state.newObjViewY, {
          toValue: 0,
          duration: 500
         }).start();
    }
    renderSlideTemplateChoose(){
        const screen = Dimensions.get('window');
        var height=HEIGHT-200;//-(isIPhoneX?34:(Platform.OS === 'ios') ? 25: 0)
        const imgClose= require('../assets/images/img_audio_delete.png');
        //console.log("2.layout:"+JSON.stringify(this.state.layout));
        //this.doCreateLayoutList()
        return(
          <Animated.View style={[{backgroundColor:'#CFCFCF',width:screen.width,height:height, borderRadius:10}, {
                      transform: [{translateY: this.state.newObjViewY}]}]} >
            <View style={{backgroundColor:'#FFF', borderRadius:10, flexDirection:'row',height:50,alignItems:'center'}}>
                <Text style={{flex:9,fontSize:18,color:'black', marginLeft:20}}>{I18n.t('選擇牌卡以新增至統計頁面')}</Text>
                <TouchableOpacity style={{flex:2,height:50}} onPress={()=>this.slideDown()}>
                  <Image source={imgClose} style={{flex:1,width:18,height:10,resizeMode:'contain',alignSelf:'center'}} />
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle= {{width:screen.width,height:height-50}}>
            </ScrollView>
          </Animated.View>

        );
      }

    renderObject(){
        const {objData} = this.state;
        console.log('renderObject:',objData)
        return (
            objData.map((data,index)=>{
                //console.log('renderObject:',objData)
                return(
                    <DragDropAnalysisObj
                        Key = {data.id}
                        objData = {data}
                        objWidth ={WIDTH}
                        doSetScrollEnable = {(enable) => {this.setState({scrollEnabled:enable})}}
                        fncItemMoved = {(px,py)=>this.onPositionMoved(px,py,index)}
                        fncItemRemoved = {()=> this.onItemDelete(index)}
                    />
                );

            })
        )
    }
    render(){
        const {scrollEnabled} = this.state;
        let width = Dimensions.get('screen').width;
        return (
            <View style={{flex:1,backgroundColor:'green'}}>
            <View style={styles.container}>
                <View style={styles.topPanel}>
                    <TouchableOpacity  style={{flex:1,flexDirection:'row', alignContent:'center',alignItems:'center',backgroundColor:'gray'}} activeOpacity={0.5} onPress={()=>this.slideUp()}>
                        <Text style={[styles.button,{textAlign:'left'}]}>{'+ '+I18n.t("New Statistics")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{flex:1,flexDirection:'row', alignContent:'center',backgroundColor:'gray'}} activeOpacity={0.5}
                        onPress={()=>{this.onFinishClick();}}>
                            <Text style={[styles.button,{textAlign:'right'}]}>{I18n.t("Finish")}</Text>
                    </TouchableOpacity>
                </View>
                <View style={{width:WIDTH,height:this.containHeigh,backgroundColor:'pink'}}>
                    <ScrollView
                        contentContainerStyle = {{width:WIDTH,height:this.containHeight}}
                        keyboardDismissMode = {'on-drag'}
                        scrollEnabled = {scrollEnabled}
                    >
                        <View style={styles.objContain}>
                        {this.renderObject()}
                        </View>
                    </ScrollView>
                </View>
            </View>
                {this.renderSlideTemplateChoose()}
            </View>
        );
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingLeft:16,
        paddingRight:16
    },
    topPanel:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignContent:'center',
        height:38,
        backgroundColor:'#FFF',
        paddingLeft: 16,
        paddingRight: 16
    },
    button:{
        flex:1,
        color:'#000',
        alignSelf:'center',
    },
    objContain:{
        flexDirection:'column',
        width:WIDTH,
    },

});
